export async function onRequestGet(context) {

    const bucket = context.env.VIDEOS;

    const url = new URL(context.request.url);

    const key = url.searchParams.get("key");

    if (!bucket) {
        return new Response(
            "R2 no está configurado.",
            { status: 500 }
        );
    }

    if (!key) {
        return new Response(
            "Falta indicar el video.",
            { status: 400 }
        );
    }

    try {

        const range =
            context.request.headers.get("Range");

        const objeto =
            await bucket.get(
                key,
                range
                    ? {
                        range: context.request.headers
                    }
                    : undefined
            );

        if (!objeto) {
            return new Response(
                "Video no encontrado.",
                { status: 404 }
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

        let status = 200;

        if (range && objeto.range) {

            const inicio =
                objeto.range.offset;

            const longitud =
                objeto.range.length;

            const fin =
                inicio + longitud - 1;

            headers.set(
                "Content-Range",
                `bytes ${inicio}-${fin}/${objeto.size}`
            );

            headers.set(
                "Content-Length",
                longitud.toString()
            );

            status = 206;
        }

        return new Response(
            objeto.body,
            {
                status,
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
