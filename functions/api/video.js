export async function onRequestGet(context) {

    const bucket = context.env.VIDEOS;

    const url = new URL(context.request.url);

    const key = url.searchParams.get("key");

    if (!bucket) {

        return new Response(
            "R2 no está configurado.",
            {
                status: 500
            }
        );
    }

    if (!key) {

        return new Response(
            "Falta indicar el video.",
            {
                status: 400
            }
        );
    }

    try {

        const objeto =
            await bucket.get(key);

        if (!objeto) {

            return new Response(
                "Video no encontrado.",
                {
                    status: 404
                }
            );
        }

        const headers =
            new Headers();

        objeto.writeHttpMetadata(headers);

        headers.set(
            "Accept-Ranges",
            "bytes"
        );

        headers.set(
            "Cache-Control",
            "private, max-age=3600"
        );

        headers.set(
            "Content-Length",
            objeto.size.toString()
        );

        return new Response(
            objeto.body,
            {
                status: 200,
                headers
            }
        );

    } catch (error) {

        return new Response(
            JSON.stringify({
                ok: false,
                error: error.message
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
