export async function onRequestPost(context) {

    try {

        const body =
            await context.request.json();

        const productorId =
            String(
                body.productor_id || "LUC-001"
            ).trim();

        const titulo =
            String(
                body.titulo || "NOVA MOMENTS"
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


        const db =
            context.env.DB;


        if (!db) {

            throw new Error(
                "La vinculación DB no está disponible."
            );

        }


        /*
         * BUSCAR SUSCRIPCIONES DEL PRODUCTOR
         */

        const resultado =
            await db.prepare(`
                SELECT
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


        /*
         * CARGAR WEB-PUSH
         */

        const webpush =
            await import("web-push");


        /*
         * CONFIGURAR VAPID
         */

        webpush.setVapidDetails(

            "mailto:admin@nova-moments.com",

            context.env.VAPID_PUBLIC_KEY,

            context.env.VAPID_PRIVATE_KEY

        );


        /*
         * DATOS DE LA NOTIFICACIÓN
         */

        const payload =
            JSON.stringify({

                titulo:
                    titulo,

                mensaje:
                    mensaje,

                url:
                    url

            });


        const resultados = [];


        /*
         * ENVIAR A TODAS LAS SUSCRIPCIONES
         */

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


                resultados.push({

                    endpoint:
                        suscripcion.endpoint,

                    enviado:
                        true

                });


            } catch (error) {

                console.error(
                    "Error enviando Push:",
                    error
                );


                resultados.push({

                    endpoint:
                        suscripcion.endpoint,

                    enviado:
                        false,

                    error:
                        error.message

                });

            }

        }


        return new Response(

            JSON.stringify({

                ok: true,

                productor_id:
                    productorId,

                enviados:
                    resultados.filter(
                        function (item) {
                            return item.enviado;
                        }
                    ).length,

                resultados:
                    resultados

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
