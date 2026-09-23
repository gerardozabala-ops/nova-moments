export async function onRequestPost(context) {

    try {

        const datos =
            await context.request.json();

        console.log(
            "Webhook Mercado Pago recibido:",
            JSON.stringify(datos)
        );


        // =========================
        // VERIFICAR TIPO DE EVENTO
        // =========================

        const tipo =
            datos.type ||
            datos.topic ||
            "";

        if (tipo !== "payment") {

            return Response.json({
                ok: true,
                recibido: true
            });

        }


        // =========================
        // OBTENER ID DEL PAGO
        // =========================

        const paymentId =
            datos.data &&
            datos.data.id
                ? String(datos.data.id)
                : "";


        if (!paymentId) {

            console.error(
                "Webhook sin payment ID."
            );

            return Response.json({
                ok: true,
                recibido: true
            });

        }


        // =========================
        // ACCESS TOKEN
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
        // CONSULTAR PAGO
        // =========================

        const respuesta =
            await fetch(
                `https://api.mercadopago.com/v1/payments/${paymentId}`,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${accessToken}`
                    }
                }
            );


        const pago =
            await respuesta.json();


        if (!respuesta.ok) {

            console.error(
                "Error consultando pago:",
                pago
            );

            return Response.json({
                ok: false,
                error:
                    "No se pudo consultar el pago."
            }, { status: 502 });

        }


        console.log(
            "Pago Mercado Pago:",
            JSON.stringify(pago)
        );


        // =========================
        // DATOS IMPORTANTES
        // =========================

        const estado =
            pago.status || "";

        const pedidoId =
            pago.external_reference || "";


        if (!pedidoId) {

            console.error(
                "El pago no tiene external_reference."
            );

            return Response.json({
                ok: true,
                recibido: true
            });

        }


        // =========================
        // ACTUALIZAR D1
        // =========================

        await context.env.DB
            .prepare(`
                UPDATE pedidos
                SET
                    estado_pago = ?
                WHERE pedido_id = ?
            `)
            .bind(
                estado,
                pedidoId
            )
            .run();


        console.log(
            "Pedido actualizado:",
            pedidoId,
            "→",
            estado
        );


        // =========================
        // RESPUESTA
        // =========================

        return Response.json({
            ok: true,
            pedido_id: pedidoId,
            estado_pago: estado
        });


    } catch (error) {

        console.error(
            "Error en webhook Mercado Pago:",
            error
        );

        return Response.json({
            ok: false,
            error:
                "Error procesando webhook."
        }, { status: 500 });

    }

}
