const TAMANO_BLOQUE = 16 * 1024 * 1024;


export async function onRequestGet(context) {

    const bucket =
        context.env.VIDEOS;

    const url =
        new URL(context.request.url);

    const key =
        url.searchParams.get("key");


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

        /*
         * Primero obtenemos solamente
         * los metadatos del video.
         *
         * Esto evita descargar el archivo
         * completo para conocer su tamaño.
         */

        const informacion =
            await bucket.head(key);


        if (!informacion) {

            return new Response(
                "Video no encontrado.",
                {
                    status: 404
                }
            );
        }


        const tamanoTotal =
            informacion.size;


        const tipoContenido =
            informacion.httpMetadata?.contentType ||
            "video/mp4";


        const etag =
            informacion.httpEtag ||
            informacion.etag ||
            "";


        const range =
            context.request.headers.get("Range");


        /*
         * Si el navegador no solicita un Range,
         * devolvemos el archivo completo.
         *
         * Normalmente los reproductores de video
         * utilizarán Range.
         */

        if (!range) {

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


            objeto.writeHttpMetadata(
                headers
            );


            headers.set(
                "Content-Type",
                tipoContenido
            );


            headers.set(
                "Content-Length",
                tamanoTotal.toString()
            );


            headers.set(
                "Accept-Ranges",
                "bytes"
            );


            headers.set(
                "Cache-Control",
                "private, max-age=3600"
            );


            if (etag) {

                headers.set(
                    "ETag",
                    etag
                );
            }


            return new Response(
                objeto.body,
                {
                    status: 200,
                    headers
                }
            );
        }


        /*
         * Solo aceptamos un Range simple.
         *
         * Ejemplo:
         *
         * bytes=77824000-
         * bytes=77824000-90000000
         *
         * Las solicitudes multipart
         * no son necesarias para nuestro
         * reproductor.
         */

        if (
            !range.startsWith("bytes=") ||
            range.includes(",")
        ) {

            return respuestaRangeInvalido(
                tamanoTotal
            );
        }


        const rango =
            analizarRange(
                range,
                tamanoTotal
            );


        if (!rango) {

            return respuestaRangeInvalido(
                tamanoTotal
            );
        }


        /*
         * Caso especial:
         *
         * bytes=-N
         *
         * Para estos rangos utilizamos
         * directamente R2.
         *
         * Los reproductores normalmente
         * no utilizan este formato durante
         * la reproducción normal.
         */

        if (rango.tipo === "suffix") {

            const objeto =
                await bucket.get(
                    key,
                    {
                        range: {
                            suffix:
                                rango.longitud
                        }
                    }
                );


            if (!objeto) {

                return new Response(
                    "Video no encontrado.",
                    {
                        status: 404
                    }
                );
            }


            const inicio =
                tamanoTotal -
                Math.min(
                    rango.longitud,
                    tamanoTotal
                );


            const fin =
                tamanoTotal - 1;


            const longitud =
                fin - inicio + 1;


            const headers =
                new Headers();


            objeto.writeHttpMetadata(
                headers
            );


            headers.set(
                "Content-Type",
                tipoContenido
            );


            headers.set(
                "Accept-Ranges",
                "bytes"
            );


            headers.set(
                "Content-Range",
                `bytes ${inicio}-${fin}/${tamanoTotal}`
            );


            headers.set(
                "Content-Length",
                longitud.toString()
            );


            headers.set(
                "Cache-Control",
                "private, max-age=3600"
            );


            if (etag) {

                headers.set(
                    "ETag",
                    etag
                );
            }


            return new Response(
                objeto.body,
                {
                    status: 206,
                    headers
                }
            );
        }


        /*
         * Rango solicitado por el navegador.
         */

        const inicioSolicitado =
            rango.inicio;


        const finSolicitado =
            rango.fin;


        /*
         * Calculamos el bloque de 16 MB
         * donde comienza la solicitud.
         */

        const inicioBloque =
            Math.floor(
                inicioSolicitado /
                TAMANO_BLOQUE
            ) *
            TAMANO_BLOQUE;


        const finBloque =
            Math.min(
                inicioBloque +
                TAMANO_BLOQUE -
                1,
                tamanoTotal - 1
            );


        /*
         * El navegador puede pedir
         * "desde X hasta el final".
         *
         * Nosotros limitamos la respuesta
         * al final del bloque.
         */

        const finRespuesta =
            Math.min(
                finSolicitado,
                finBloque
            );


        const longitudBloque =
            finBloque -
            inicioBloque +
            1;


        /*
         * Creamos una clave interna
         * para almacenar el bloque.
         *
         * Incluimos el ETag para que si el
         * video es reemplazado, no reutilicemos
         * un bloque de una versión anterior.
         */

        const version =
            encodeURIComponent(
                etag || "sin-etag"
            );


        const cacheUrl =
            new URL(
                context.request.url
            );


        cacheUrl.pathname =
            "/__nova_video_bloque";


        cacheUrl.search =
            `?key=${encodeURIComponent(key)}` +
            `&inicio=${inicioBloque}` +
            `&v=${version}`;


        const cacheKey =
            new Request(
                cacheUrl.toString(),
                {
                    method: "GET"
                }
            );


        const cache =
            caches.default;


        /*
         * Buscamos primero el bloque
         * en la caché de Cloudflare.
         */

        let bloque =
            await cache.match(
                cacheKey
            );


        /*
         * Si el bloque no está en caché,
         * lo pedimos a R2.
         */

        if (!bloque) {

            const objeto =
                await bucket.get(
                    key,
                    {
                        range: {
                            offset:
                                inicioBloque,

                            length:
                                longitudBloque
                        }
                    }
                );


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


            objeto.writeHttpMetadata(
                headers
            );


            headers.set(
                "Content-Type",
                tipoContenido
            );


            headers.set(
                "Content-Length",
                longitudBloque.toString()
            );


            /*
             * Este es el objeto interno
             * que guardamos en Cache API.
             *
             * Es 200, no 206.
             *
             * Cloudflare Cache API no almacena
             * respuestas 206.
             */

            headers.set(
                "Cache-Control",
                "public, max-age=86400"
            );


            if (etag) {

                headers.set(
                    "ETag",
                    etag
                );
            }


            bloque =
                new Response(
                    objeto.body,
                    {
                        status: 200,
                        headers
                    }
                );


            await cache.put(
                cacheKey,
                bloque.clone()
            );
        }


        /*
         * Ahora pedimos a la caché solamente
         * la parte que el navegador necesita
         * dentro del bloque.
         *
         * Ejemplo:
         *
         * Bloque:
         * 77 MB → 93 MB
         *
         * Navegador:
         * 78 MB → ...
         *
         * Cache API devuelve solamente:
         * 78 MB → final solicitado
         */

        const inicioRelativo =
            inicioSolicitado -
            inicioBloque;


        const finRelativo =
            finRespuesta -
            inicioBloque;


        const solicitudInterna =
            new Request(
                cacheKey.toString(),
                {
                    method: "GET",

                    headers: {
                        "Range":
                            `bytes=${inicioRelativo}-${finRelativo}`
                    }
                }
            );


        let respuesta =
            await cache.match(
                solicitudInterna
            );


        /*
         * Si por alguna razón la caché no
         * devuelve el rango, hacemos una
         * lectura directa de R2 del rango
         * exacto solicitado.
         */

        if (!respuesta) {

            const longitud =
                finRespuesta -
                inicioSolicitado +
                1;


            const objeto =
                await bucket.get(
                    key,
                    {
                        range: {
                            offset:
                                inicioSolicitado,

                            length:
                                longitud
                        }
                    }
                );


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


            objeto.writeHttpMetadata(
                headers
            );


            headers.set(
                "Content-Type",
                tipoContenido
            );


            headers.set(
                "Accept-Ranges",
                "bytes"
            );


            headers.set(
                "Content-Range",
                `bytes ${inicioSolicitado}-${finRespuesta}/${tamanoTotal}`
            );


            headers.set(
                "Content-Length",
                longitud.toString()
            );


            headers.set(
                "Cache-Control",
                "private, max-age=3600"
            );


            if (etag) {

                headers.set(
                    "ETag",
                    etag
                );
            }


            return new Response(
                objeto.body,
                {
                    status: 206,
                    headers
                }
            );
        }


        /*
         * La Cache API devuelve el rango
         * relativo al bloque.
         *
         * Nosotros lo convertimos nuevamente
         * al rango absoluto del video.
         */

        const headers =
            new Headers(
                respuesta.headers
            );


        headers.set(
            "Content-Type",
            tipoContenido
        );


        headers.set(
            "Accept-Ranges",
            "bytes"
        );


        headers.set(
            "Content-Range",
            `bytes ${inicioSolicitado}-${finRespuesta}/${tamanoTotal}`
        );


        headers.set(
            "Content-Length",
            (
                finRespuesta -
                inicioSolicitado +
                1
            ).toString()
        );


        headers.set(
            "Cache-Control",
            "private, max-age=3600"
        );


        if (etag) {

            headers.set(
                "ETag",
                etag
            );
        }


        return new Response(
            respuesta.body,
            {
                status: 206,
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


/*
 * Analiza el encabezado Range.
 */

function analizarRange(
    range,
    tamanoTotal
) {

    const valor =
        range.substring(
            6
        ).trim();


    /*
     * bytes=-500
     */

    if (
        valor.startsWith("-")
    ) {

        const longitud =
            Number(
                valor.substring(1)
            );


        if (
            !Number.isFinite(
                longitud
            ) ||
            longitud <= 0
        ) {

            return null;
        }


        return {
            tipo: "suffix",
            longitud
        };
    }


    /*
     * bytes=100-
     * bytes=100-500
     */

    const partes =
        valor.split("-");


    if (
        partes.length !== 2
    ) {

        return null;
    }


    const inicio =
        Number(
            partes[0]
        );


    if (
        !Number.isFinite(
            inicio
        ) ||
        inicio < 0 ||
        inicio >= tamanoTotal
    ) {

        return null;
    }


    let fin =
        partes[1] === ""
            ? tamanoTotal - 1
            : Number(
                partes[1]
            );


    if (
        !Number.isFinite(
            fin
        )
    ) {

        return null;
    }


    if (
        fin >= tamanoTotal
    ) {

        fin =
            tamanoTotal - 1;
    }


    if (
        fin < inicio
    ) {

        return null;
    }


    return {
        tipo: "normal",
        inicio,
        fin
    };
}


/*
 * Respuesta HTTP estándar para
 * un Range que no se puede satisfacer.
 */

function respuestaRangeInvalido(
    tamanoTotal
) {

    return new Response(
        null,
        {
            status: 416,

            headers: {
                "Accept-Ranges":
                    "bytes",

                "Content-Range":
                    `bytes */${tamanoTotal}`
            }
        }
    );
}
