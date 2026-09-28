export async function onRequestPost(context) {

    try {

        // =========================
        // LEER DATOS RECIBIDOS
        // =========================

        const datos =
            await context.request.json();

        const pedidoId =
            (datos.pedido_id || "").trim();

        const formData =
            datos.formData;


        // =========================
        // VALIDAR PEDIDO
        // =========================

        if (!pedidoId) {

            return Response.json({

                ok: false,

                error:
                    "Falta indicar el pedido."

            }, { status: 400 });

        }


        if (
            !formData ||
            typeof formData !== "object"
        ) {

            return Response.json({

                ok: false,

                error:
                    "No se recibieron los datos del pago."

            }, { status: 400 });

        }


        // =========================
        // VERIFICAR TOKEN
        // =========================

        const accessToken =
            context.env.MP_ACCESS_TOKEN;


        if (!accessToken) {

            console.error(
                "Falta MP_ACCESS_TOKEN."
            );

            return Response.json({

                ok: false,

                error:
                    "Mercado Pago no está configurado."

            }, { status: 500 });

        }


        // =========================
        // BUSCAR PEDIDO EN D1
        // =========================

        const pedido =
            await context.env.DB
                .prepare(`
                    SELECT
                        pedido_id,
                        evento_id,
                        nombre,
                        whatsapp,
                        email,
                        total,
                        estado,
                        estado_pago
                    FROM pedidos
                    WHERE pedido_id = ?
                    LIMIT 1
                `)
                .bind(pedidoId)
                .first();


        if (!pedido) {

            return Response.json({

                ok: false,

                error:
                    "El pedido no existe."

            }, { status: 404 });

        }


        // =========================
        // VERIFICAR ESTADO DEL PEDIDO
        // =========================

        if (
            pedido.estado_pago &&
            pedido.estado_pago !== "pendiente"
        ) {

            return Response.json({

                ok: false,

                error:
                    "Este pedido ya fue procesado o tiene un estado de pago diferente de pendiente."

            }, { status: 409 });

        }


        // =========================
        // VERIFICAR MEDIO DE PAGO
        // =========================

        const paymentMethodId =
            (
                formData.payment_method_id ||
                ""
            ).trim();


        if (!paymentMethodId) {

            return Response.json({

                ok: false,

                error:
                    "Mercado Pago no indicó el medio de pago."

            }, { status: 400 });

        }


        // =========================
        // OBTENER EMAIL
        // =========================
        //
        // Para algunos medios el Brick
        // devuelve payer.email.
        //
        // Si no lo devuelve, utilizamos
        // el email guardado en el pedido.
        // =========================

        const emailBrick =
            formData.payer &&
            formData.payer.email
                ? String(
                    formData.payer.email
                ).trim()
                : "";


        const emailPedido =
            pedido.email
                ? String(
                    pedido.email
                ).trim()
                : "";


        const email =
            emailBrick ||
            emailPedido;


        // =========================
        // VALIDAR EMAIL
        // =========================

        if (!email) {

            return Response.json({

                ok: false,

                error:
                    "Falta el correo electrónico del comprador."

            }, { status: 400 });

        }


        // =========================
        // OBTENER TOTAL OFICIAL
        // =========================
        //
        // MUY IMPORTANTE:
        //
        // No confiamos en:
        //
        // formData.transaction_amount
        // formData.amount
        //
        // El importe válido sale de D1.
        // =========================

        const total =
            Number(
                pedido.total
            );


        if (
            !Number.isFinite(total) ||
            total < 1
        ) {

            return Response.json({

                ok: false,

                error:
                    "El total del pedido no es válido."

            }, { status: 500 });

        }


        // =========================
        // CONSTRUIR DATOS DEL PAGO
        // =========================

        const pago = {

            transaction_amount:
                total,

            description:
                `Fotografías - ${pedido.evento_id}`,

            payment_method_id:
                paymentMethodId,

            payer: {

                email:
                    email

            },

            external_reference:
                pedido.pedido_id

        };


        // =========================
        // TOKEN DE TARJETA
        // =========================
        //
        // Los pagos con tarjeta necesitan
        // el token generado por Mercado Pago.
        //
        // No todos los medios de pago
        // utilizan token.
        // =========================

        if (formData.token) {

            pago.token =
                formData.token;

        }


        // =========================
        // CUOTAS
        // =========================

        if (
            formData.installments !==
            undefined &&
            formData.installments !==
            null
        ) {

            const installments =
                Number(
                    formData.installments
                );


            if (
                Number.isInteger(
                    installments
                ) &&
                installments > 0
            ) {

                pago.installments =
                    installments;

            }

        }


        // =========================
        // ISSUER
        // =========================

        if (
            formData.issuer_id !==
            undefined &&
            formData.issuer_id !==
            null &&
            formData.issuer_id !== ""
        ) {

            pago.issuer_id =
                Number(
                    formData.issuer_id
                );

        }


        // =========================
        // IDENTIFICACIÓN
        // =========================

        if (
            formData.payer &&
            formData.payer.identification
        ) {

            const identification =
                formData.payer.identification;


            if (
                identification.type &&
                identification.number
            ) {

                pago.payer.identification = {

                    type:
                        String(
                            identification.type
                        ),

                    number:
                        String(
                            identification.number
                        )

                };

            }

        }


        // =========================
        // VALIDACIONES SEGÚN MEDIO
        // =========================

        //
        // Para tarjeta, Mercado Pago
        // necesita token.
        //

        const esTarjeta =
            paymentMethodId === "visa" ||
            paymentMethodId === "master" ||
            paymentMethodId === "mastercard" ||
            paymentMethodId === "amex" ||
            paymentMethodId === "naranja" ||
            paymentMethodId === "cabal" ||
            paymentMethodId === "maestro";


        if (
            esTarjeta &&
            !pago.token
        ) {

            return Response.json({

                ok: false,

                error:
                    "No se recibió el token de la tarjeta."

            }, { status: 400 });

        }


        // =========================
        // IDEMPOTENCY KEY
        // =========================
        //
        // Mercado Pago exige una clave
        // única para evitar duplicaciones.
        // =========================

        const idempotencyKey =
            crypto.randomUUID();


        // =========================
        // ENVIAR PAGO A MERCADO PAGO
        // =========================

        const respuesta =
            await fetch(
                "https://api.mercadopago.com/v1/payments",
                {

                    method:
                        "POST",

                    headers: {

                        "Accept":
                            "application/json",

                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${accessToken}`,

                        "X-Idempotency-Key":
                            idempotencyKey

                    },

                    body:
                        JSON.stringify(
                            pago
                        )

                }
            );


        const resultado =
            await respuesta.json();


        // =========================
        // ERROR MERCADO PAGO
        // =========================

        if (!respuesta.ok) {

            console.error(
                "Mercado Pago rechazó el pago:",
                resultado
            );


            return Response.json({

                ok: false,

                error:
                    resultado.message ||
                    resultado.cause?.[0]?.description ||
                    "Mercado Pago rechazó el pago.",

                status:
                    resultado.status ||
                    null,

                status_detail:
                    resultado.status_detail ||
                    null

            }, {
                status: 502
            });

        }


        // =========================
        // OBTENER ESTADO
        // =========================

        const estadoPago =
            resultado.status ||
            "pendiente";


        const statusDetail =
            resultado.status_detail ||
            null;


        const paymentId =
            resultado.id ||
            null;


        // =========================
        // ACTUALIZAR D1
        // =========================

        let nuevoEstado =
            "pendiente";


        if (
            estadoPago ===
            "approved"
        ) {

            nuevoEstado =
                "aprobado";

        } else if (
            estadoPago ===
            "rejected"
        ) {

            nuevoEstado =
                "rechazado";

        } else if (
            estadoPago ===
            "cancelled"
        ) {

            nuevoEstado =
                "cancelado";

        } else {

            nuevoEstado =
                "pendiente";

        }


        await context.env.DB
            .prepare(`
                UPDATE pedidos
                SET estado_pago = ?
                WHERE pedido_id = ?
            `)
            .bind(
                nuevoEstado,
                pedidoId
            )
            .run();


        // =========================
        // RESPUESTA A NOVA
        // =========================

        return Response.json({

            ok: true,

            pedido_id:
                pedidoId,

            payment_id:
                paymentId,

            status:
                estadoPago,

            status_detail:
                statusDetail,

            estado_pago:
                nuevoEstado

        });


    } catch (error) {

        console.error(
            "Error en /api/procesar-pago:",
            error
        );


        return Response.json({

            ok: false,

            error:
                "No se pudo procesar el pago."

        }, { status: 500 });

    }

}
