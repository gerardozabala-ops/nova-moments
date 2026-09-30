import { buildPushPayload } from "@block65/webcrypto-web-push";

export async function onRequestPost(context) {

    try {

        const body = await context.request.json();

        const productorId =
            String(body.productor_id || "").trim();

        const titulo =
            String(body.titulo || "NOVA MOMENTS");

        const mensaje =
            String(
                body.mensaje ||
                "Tenés una nueva notificación."
            );

        const url =
            String(
                body.url ||
                "/productor.html"
            );

        if (!productorId) {

            return new Response(
                JSON.stringify({
                    ok: false,
                    error: "Falta productor_id."
                }),
                {
                    status: 400,
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );

        }

        const db = context.env.DB;

        if (!db) {
            throw new Error(
                "La vinculación DB no está disponible."
            );
        }

        const publicKey =
            context.env.VAPID_PUBLIC_KEY;

        const privateKey =
            context.env.VAPID_PRIVATE_KEY;

        if (!publicKey || !privateKey) {

            throw new Error(
                "Faltan las claves VAPID en Cloudflare."
            );

        }

        const resultado =
            await db.prepare(`
                SELECT
                    id,
                    endpoint,
                    p256dh,
                    auth
                FROM push_suscripciones
                WHERE productor_id = ?
            `)
            .bind(productorId)
            .all();

        const suscripciones =
            resultado.results || [];

        if (suscripciones.length === 0) {

            return new Response(
                JSON.stringify({
                    ok: false,
                    error:
                        "No hay suscripciones Push para este productor."
                }),
                {
                    status: 404,
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );

        }

        let enviadas = 0;
        let fallidas = 0;

        const errores = [];

        for (const suscripcion of suscripciones) {

            try {

                const pushSubscription = {

                    endpoint:
                        suscripcion.endpoint,

                    expirationTime:
                        null,

                    keys: {

                        p256dh:
                            suscripcion.p256dh,

                        auth:
                            suscripcion.auth

                    }

                };

                const vapid = {

                    subject:
                        "mailto:admin@nova-moments.com",

                    publicKey:
                        publicKey,

                    privateKey:
                        privateKey

                };

                const payload =
                    await buildPushPayload(

                        {
                            data:
                                JSON.stringify({

                                    titulo:
                                        titulo,

                                    mensaje:
                                        mensaje,

                                    url:
                                        url

                                }),

                            options: {

                                ttl:
                                    86400,

                                urgency:
                                    "normal"

                            }

                        },

                        pushSubscription,

                        vapid

                    );

                const respuesta =
                    await fetch(
                        suscripcion.endpoint,
                        payload
                    );

                if (!respuesta.ok) {

                    const cuerpo =
                        await respuesta.text();

                    const error =
                        new Error(
                            `Push rechazado: HTTP ${respuesta.status} ${respuesta.statusText}`
                        );

                    error.statusCode =
                        respuesta.status;

                    error.body =
                        cuerpo;

                    throw error;

                }

                enviadas++;

            } catch (error) {

                console.error(
                    "Error enviando Push:",
                    error
                );

                fallidas++;

                errores.push({

                    id:
                        suscripcion.id,

                    statusCode:
                        error.statusCode ||
                        null,

                    message:
                        error.message ||
                        null,

                    body:
                        error.body ||
                        null

                });

                if (
                    error.statusCode === 404 ||
                    error.statusCode === 410
                ) {

                    await db.prepare(`
                        DELETE FROM push_suscripciones
                        WHERE id = ?
                    `)
                    .bind(
                        suscripcion.id
                    )
                    .run();

                }

            }

        }

        return new Response(

            JSON.stringify({

                ok: true,

                productor_id:
                    productorId,

                suscripciones:
                    suscripciones.length,

                enviadas:
                    enviadas,

                fallidas:
                    fallidas,

                errores:
                    errores

            }),

            {
                status: 200,

                headers: {
                    "Content-Type":
                        "application/json"
                }

            }

        );

    } catch (error) {

        console.error(
            "Error en push-enviar:",
            error
        );

        return new Response(

            JSON.stringify({

                ok: false,

                error:
                    error.message ||
                    "Error interno del servidor."

            }),

            {
                status: 500,

                headers: {
                    "Content-Type":
                        "application/json"
                }

            }

        );

    }

}
