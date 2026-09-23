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
        // DATOS DE LA NOTIFICACIÓN
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
        // EXTRAER FIRMA
        // =========================

        let ts = "";
        let hash = "";

        const partes =
            xSignature.split(",");

        for (const parte of partes) {

            const partesClave =
                parte.split("=");

            if (
                partesClave.length !== 2
            ) {
                continue;
            }

            const clave =
                partesClave[0].trim();

            const valor =
                partesClave[1].trim();

            if (clave === "ts") {
                ts = valor;
            }

            if (clave === "v1") {
                hash = valor;
            }

        }


        // =========================
        // VALIDAR DATOS DE FIRMA
        // =========================

        if (
            !dataId ||
            !xRequestId ||
            !ts ||
            !hash
        ) {

            console.error(
                "Webhook sin datos suficientes para validar firma."
            );

            return Response.json({
                ok: false,
                error:
                    "Firma incompleta."
            }, { status: 401 });

        }


        // =========================
        // CREAR MANIFEST
        // =========================

        const manifest =
            `id:${dataId};request-id:${xRequestId};ts:${ts};`;


        // =========================
        // HMAC SHA256
        // =========================

        const encoder =
            new TextEncoder();

        const keyData =
            encoder.encode(secret);

        const messageData =
            encoder.encode(manifest);

        const cryptoKey =
            await crypto.subtle.importKey(
                "raw",
                keyData,
                {
                    name: "HMAC",
                    hash: "SHA-256"
                },
                false,
                ["sign"]
            );

        const firmaCalculadaBuffer =
            await crypto.subtle.sign(
                "HMAC",
                cryptoKey,
                messageData
            );


        const bytes =
            new Uint8Array(
                firmaCalculadaBuffer
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
        // COMPARAR FIRMAS
        // =========================

        if (
            firmaCalculada !==
            hash
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
        // VERIFICAR TIPO
        // =========================

        const tipo =
            datos.type ||
            datos.topic ||
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


        // =========================
        // DATOS DEL PAGO
        // =========================

        const estado =
            pago.status || "";

        const pedidoId =
            pago.external_reference || "";


        console.log(
            "Pago:",
            paymentId,
            "Estado:",
            estado,
            "Pedido:",
            pedidoId
        );


        // =========================
        // VERIFICAR PEDIDO
        // =========================

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
