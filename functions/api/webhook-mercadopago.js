export async function onRequestPost(context) {

    try {

        // =========================
        // CONFIGURACIÓN
        // =========================

        const secret =
            context.env.MP_WEBHOOK_SECRET;

        if (!secret) {

            console.error(
                "Falta MP_WEBHOOK_SECRET."
            );

            return Response.json({
                ok: false,
                error:
                    "Webhook no configurado."
            }, { status: 500 });

        }


        // =========================
        // URL Y HEADERS
        // =========================

        const url =
            new URL(context.request.url);

        const dataId =
            (
                url.searchParams.get(
                    "data.id"
                ) || ""
            ).toLowerCase();

        const xSignature =
            context.request.headers.get(
                "x-signature"
            ) || "";

        const xRequestId =
            context.request.headers.get(
                "x-request-id"
            ) || "";


        // =========================
        // EXTRAER ts Y v1
        // =========================

        let ts = "";
        let hash = "";

        const partes =
            xSignature.split(",");

        for (const parte of partes) {

            const posicion =
                parte.indexOf("=");

            if (posicion === -1) {
                continue;
            }

            const clave =
                parte
                    .slice(0, posicion)
                    .trim();

            const valor =
                parte
                    .slice(posicion + 1)
                    .trim();

            if (clave === "ts") {
                ts = valor;
            }

            if (clave === "v1") {
                hash = valor;
            }

        }


        // =========================
        // VALIDAR DATOS NECESARIOS
        // =========================

        if (
            !dataId ||
            !xRequestId ||
            !ts ||
            !hash
        ) {

            console.error(
                "Webhook sin datos suficientes para validar firma.",
                {
                    dataId,
                    xRequestId,
                    tieneTs: !!ts,
                    tieneHash: !!hash
                }
            );

            return Response.json({
                ok: false,
                error:
                    "Firma incompleta."
            }, { status: 401 });

        }


        // =========================
        // MANIFEST OFICIAL
        // =========================

        const manifest =
            `id:${dataId};request-id:${xRequestId};ts:${ts};`;


        // =========================
        // GENERAR HMAC SHA256
        // =========================

        const encoder =
            new TextEncoder();

        const cryptoKey =
            await crypto.subtle.importKey(
                "raw",
                encoder.encode(secret),
                {
                    name: "HMAC",
                    hash: "SHA-256"
                },
                false,
                ["sign"]
            );

        const firmaBuffer =
            await crypto.subtle.sign(
                "HMAC",
                cryptoKey,
                encoder.encode(manifest)
            );


        const bytes =
            new Uint8Array(
                firmaBuffer
            );

        const firmaCalculada =
            Array.from(bytes)
                .map(
                    byte =>
                        byte
                            .toString(16)
                            .padStart(2, "0")
                )
                .join("");


        // =========================
        // COMPARAR FIRMA
        // =========================

        if (
            firmaCalculada !== hash
        ) {

            console.error(
                "Firma de Mercado Pago inválida."
            );

            return Response.json({
                ok: false,
                error:
                    "Firma inválida."
            }, { status: 401 });

        }


        // =========================
        // LEER BODY
        // =========================

        const datos =
            await context.request.json();


        console.log(
            "Webhook Mercado Pago validado:",
            JSON.stringify(datos)
        );


        // =========================
        // TIPO DE EVENTO
        // =========================

        const tipo =
            datos.type ||
            "";

        if (
            tipo !== "payment"
        ) {

            return Response.json({
                ok: true,
                recibido: true
            });

        }


        // =========================
        // PAYMENT ID
        // =========================

        const paymentId =
            datos.data &&
            datos.data.id
                ? String(
                    datos.data.id
                )
                : dataId;


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


        // =========================
        // SI EL PAGO NO EXISTE
        // =========================

        if (!respuesta.ok) {

            console.error(
                "Mercado Pago no pudo consultar el pago:",
                pago
            );

            return Response.json({
                ok: true,
                recibido: true,
                payment_id:
                    paymentId
            });

        }


        // =========================
        // DATOS DEL PAGO
        // =========================

        const estado =
            pago.status || "";

        const pedidoId =
            pago.external_reference || "";


        console.log(
            "Pago recibido:",
            {
                paymentId,
                estado,
                pedidoId
            }
        );


        // =========================
        // SIN PEDIDO
        // =========================

        if (!pedidoId) {

            console.error(
                "El pago no tiene external_reference."
            );

            return Response.json({
                ok: true,
                recibido: true,
                payment_id:
                    paymentId,
                estado_pago:
                    estado
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

            recibido: true,

            pedido_id:
                pedidoId,

            payment_id:
                paymentId,

            estado_pago:
                estado

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
