import webpush from "web-push";

export async function onRequestPost(context) {

    try {

        const body =
            await context.request.json();

        const productorId =
            String(
                body.productor_id || ""
            ).trim();

        const titulo =
            String(
                body.titulo ||
                "NOVA MOMENTS"
            );

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
                    error:
                        "Falta productor_id."
                }),
                {
                    status: 400,
                    headers: {
                        "Content-Type":
                            "application/json"
                    }
                }
            );

        }


        const db =
            context.env.DB;


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


        webpush.setVapidDetails(
            "mailto:admin@nova-moments.com",
            publicKey,
            privateKey
        );


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
                        "Content-Type":
                            "application/json"
                    }
                }
            );

        }


        const payload =
            JSON.stringify({

                titulo:
                    titulo,

                mensaje:
                    mensaje,

                url:
                    url

            });


        let enviadas = 0;
        let fallidas = 0;


        for (
            const suscripcion
            of suscripciones
        ) {

            try {

                await webpush.sendNotification(

                    {
                        endpoint:
                            suscripcion.endpoint,

                        keys: {

                            p256dh:
                                suscripcion.p256dh,

                            auth:
                                suscripcion.auth

                        }

                    },

                    payload

                );

                enviadas++;

            } catch (error) {

                console.error(
                    "Error enviando Push:",
                    error
                );

                fallidas++;


                /*
                 * Si el servicio Push informa
                 * que la suscripción ya no existe,
                 * la eliminamos de D1.
                 */

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
                    fallidas

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
