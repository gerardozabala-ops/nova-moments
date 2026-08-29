export async function onRequestGet(context) {

    try {

        const url = new URL(context.request.url);
        const evento = url.searchParams.get("evento");

        if (!evento) {
            return new Response(
                JSON.stringify({
                    ok: false,
                    error: "Falta indicar el evento."
                }),
                {
                    status: 400,
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );
        }

        const cloudName =
            context.env.CLOUDINARY_CLOUD_NAME;

        const apiKey =
            context.env.CLOUDINARY_API_KEY;

        const apiSecret =
            context.env.CLOUDINARY_API_SECRET;

        if (!cloudName || !apiKey || !apiSecret) {
            return new Response(
                JSON.stringify({
                    ok: false,
                    error: "Faltan variables de Cloudinary."
                }),
                {
                    status: 500,
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );
        }

        /*
        ============================================
        AUTENTICACIÓN CLOUDINARY
        ============================================
        */

        const credenciales =
            apiKey + ":" + apiSecret;

        const autorizacion =
            btoa(credenciales);

        /*
        ============================================
        FUNCIÓN PARA CONSULTAR UNA CARPETA
        ============================================
        */

        async function obtenerRecursos(carpeta) {

            const endpoint =
                "https://api.cloudinary.com/v1_1/" +
                cloudName +
                "/resources/search";

            const respuesta =
                await fetch(
                    endpoint,
                    {
                        method: "GET",

                        headers: {
                            "Authorization":
                                "Basic " +
                                autorizacion
                        }
                    }
                );

            if (!respuesta.ok) {

                const texto =
                    await respuesta.text();

                throw new Error(
                    "Cloudinary respondió " +
                    respuesta.status +
                    ": " +
                    texto
                );
            }

            const datos =
                await respuesta.json();

            /*
            ========================================
            FILTRAR RECURSOS DE LA CARPETA
            ========================================
            */

            const recursos =
                (datos.resources || [])
                .filter(function(recurso) {

                    return recurso.folder === carpeta;

                });

            return recursos.map(
                function(recurso) {

                    return {
                        url:
                            recurso.secure_url,

                        tipo:
                            recurso.resource_type,

                        formato:
                            recurso.format,

                        nombre:
                            recurso.public_id

                    };

                }
            );
        }

        /*
        ============================================
        CARPETAS DEL EVENTO
        ============================================
        */

        const carpetaPortada =
            "NOVA_MOMENTS/" +
            evento +
            "/PORTADA";

        const carpetaFotos =
            "NOVA_MOMENTS/" +
            evento +
            "/FOTOS";

        const carpetaVideos =
            "NOVA_MOMENTS/" +
            evento +
            "/VIDEOS";

        /*
        ============================================
        OBTENER CONTENIDO
        ============================================
        */

        const portada =
            await obtenerRecursos(
                carpetaPortada
            );

        const fotos =
            await obtenerRecursos(
                carpetaFotos
            );

        const videos =
            await obtenerRecursos(
                carpetaVideos
            );

        /*
        ============================================
        RESPUESTA
        ============================================
        */

        return new Response(

            JSON.stringify({

                ok: true,

                evento: evento,

                portada: portada,

                fotos: fotos,

                videos: videos,

                total_portada:
                    portada.length,

                total_fotos:
                    fotos.length,

                total_videos:
                    videos.length

            }),

            {
                status: 200,

                headers: {
                    "Content-Type":
                        "application/json",

                    "Cache-Control":
                        "no-store"
                }
            }

        );

    } catch (error) {

        return new Response(

            JSON.stringify({

                ok: false,

                error:
                    "Error al consultar Cloudinary.",

                detalle:
                    error.message

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
