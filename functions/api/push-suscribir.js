export async function onRequestPost(context) {

    try {

        const body = await context.request.json();

        const productorId =
            String(body.productor_id || "").trim();

        const subscription =
            body.subscription;


        if (!productorId) {

            return new Response(
                JSON.stringify({
                    ok: false,
                    error: "Falta productor_id."
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


        if (
            !subscription ||
            !subscription.endpoint ||
            !subscription.keys ||
            !subscription.keys.p256dh ||
            !subscription.keys.auth
        ) {

            return new Response(
                JSON.stringify({
                    ok: false,
                    error:
                        "Suscripción Push incompleta."
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


        const endpoint =
            String(
                subscription.endpoint
            ).trim();

        const p256dh =
            String(
                subscription.keys.p256dh
            ).trim();

        const auth =
            String(
                subscription.keys.auth
            ).trim();


        const db =
            context.env.DB;


        if (!db) {

            throw new Error(
                "La vinculación DB no está disponible."
            );

        }


        await db.prepare(`
            INSERT INTO push_suscripciones (
                productor_id,
                endpoint,
                p256dh,
                auth,
                actualizado_en
            )
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)

            ON CONFLICT(endpoint)
            DO UPDATE SET
                productor_id = excluded.productor_id,
                p256dh = excluded.p256dh,
                auth = excluded.auth,
                actualizado_en = CURRENT_TIMESTAMP
        `)
        .bind(
            productorId,
            endpoint,
            p256dh,
            auth
        )
        .run();


        return new Response(
            JSON.stringify({
                ok: true,
                mensaje:
                    "Suscripción Push guardada correctamente."
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
            "Error en push-suscribir:",
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
