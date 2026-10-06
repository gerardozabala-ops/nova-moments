export async function onRequestGet(context) {

    const bucket = context.env.VIDEOS;
    const url = new URL(context.request.url);
    const key = url.searchParams.get("key");

    const MAX_RANGE = 16 * 1024 * 1024; // 16 MB

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

        const rangeHeader =
            context.request.headers.get("Range");

        // Sin Range: mantenemos el comportamiento anterior
        if (!rangeHeader) {

            const objeto =
                await bucket.get(key);

            if (!objeto) {
                return new Response(
                    "Video no encontrado.",
                    { status: 404 }
                );
            }

            const headers = new Headers();

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
        }

        // Procesamos bytes=INICIO-, bytes=INICIO-FIN o bytes=-SUFIJO
        const match =
            rangeHeader.match(
                /^bytes=(\d*)-(\d*)$/
            );

        if (!match) {
            return new Response(
                "Range no válido.",
                {
                    status: 416,
                    headers: {
                        "Content-Range": "bytes */*"
                    }
                }
            );
        }

        const inicioTexto = match[1];
        const finTexto = match[2];

        let objeto;

        // Range por sufijo: bytes=-500000
        if (inicioTexto === "") {

            const sufijo =
                Number(finTexto);

            if (
                !Number.isSafeInteger(sufijo) ||
                sufijo <= 0
            ) {
                return new Response(
                    "Range no válido.",
                    { status: 416 }
                );
            }

            objeto =
                await bucket.get(
                    key,
                    {
                        range: {
                            suffix:
                                Math.min(
                                    sufijo,
                                    MAX_RANGE
                                )
                        }
                    }
                );

        } else {

            const inicio =
                Number(inicioTexto);

            if (
                !Number.isSafeInteger(inicio) ||
                inicio < 0
            ) {
                return new Response(
                    "Range no válido.",
                    { status: 416 }
                );
            }

            let longitud = MAX_RANGE;

            // Si viene un final concreto, lo respetamos,
            // pero nunca superamos 16 MB.
            if (finTexto !== "") {

                const fin =
                    Number(finTexto);

                if (
                    !Number.isSafeInteger(fin) ||
                    fin < inicio
                ) {
                    return new Response(
                        "Range no válido.",
                        { status: 416 }
                    );
                }

                longitud =
                    Math.min(
                        fin - inicio + 1,
                        MAX_RANGE
                    );
            }

            // R2 recibe ahora un rango limitado
            objeto =
                await bucket.get(
                    key,
                    {
                        range: {
                            offset: inicio,
                            length: longitud
                        }
                    }
                );
        }

        if (!objeto) {

            const metadata =
                await bucket.head(key);

            if (!metadata) {
                return new Response(
                    "Video no encontrado.",
                    { status: 404 }
                );
            }

            return new Response(
                "Range fuera de los límites del video.",
                {
                    status: 416,
                    headers: {
                        "Content-Range":
                            `bytes */${metadata.size}`
                    }
                }
            );
        }

        const headers = new Headers();

        objeto.writeHttpMetadata(headers);

        headers.set(
            "Accept-Ranges",
            "bytes"
        );

        headers.set(
            "Cache-Control",
            "private, max-age=3600"
        );

        let status = 200;

        if (objeto.range) {

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

        } else {

            headers.set(
                "Content-Length",
                objeto.size.toString()
            );
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
