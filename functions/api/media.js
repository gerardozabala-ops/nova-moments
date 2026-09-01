export async function onRequestGet(context) {

    try {

        const url = new URL(context.request.url);

        const eventoId =
            url.searchParams.get("evento");


        if (!eventoId) {

            return new Response(
                JSON.stringify({
                    ok: false,
                    error: "No se indicó el evento."
                }),
                {
                    status: 400,
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );

        }


        /*
        ==================================================
        CREDENCIALES CLOUDINARY
        ==================================================
        */

        const cloudName =
            context.env.CLOUDINARY_CLOUD_NAME;

        const apiKey =
            context.env.CLOUDINARY_API_KEY;

        const apiSecret =
            context.env.CLOUDINARY_API_SECRET;


        if (
            !cloudName ||
            !apiKey ||
            !apiSecret
        ) {

            return new Response(
                JSON.stringify({
                    ok: false,
                    error:
                        "Faltan las credenciales de Cloudinary."
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


        /*
        ==================================================
        AUTENTICACIÓN
        ==================================================
        */

        const auth =
            btoa(
                `${apiKey}:${apiSecret}`
            );


        /*
        ==================================================
        FUNCIÓN PARA OBTENER RECURSOS
        ==================================================
        */

        async function obtenerRecursos(
            resourceType,
            prefix
        ) {

            const endpoint =
                `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/list`;


            const respuesta =
                await fetch(
                    `${endpoint}?prefix=${encodeURIComponent(prefix)}&max_results=500`,
                    {
                        method: "GET",

                        headers: {
                            "Authorization":
                                `Basic ${auth}`
                        }
                    }
                );


            if (!respuesta.ok) {

                const texto =
                    await respuesta.text();

                console.error(
                    "Cloudinary:",
                    texto
                );

                throw new Error(
                    `Cloudinary error ${resourceType}`
                );

            }


            return await respuesta.json();

        }


        /*
        ==================================================
        RUTAS
        ==================================================
        */

        const base =
            `HOME/MOMENTOS NOVA/${eventoId}`;


        const portadaPrefix =
            `${base}/PORTADA/`;


        const fotosPrefix =
            `${base}/FOTOS/`;


        const videosPrefix =
            `${base}/VIDEOS/`;


        /*
        ==================================================
        OBTENER IMÁGENES
        ==================================================
        */

        const imagenesPortada =
            await obtenerRecursos(
                "image",
                portadaPrefix
            );


        const imagenesFotos =
            await obtenerRecursos(
                "image",
                fotosPrefix
            );


        /*
        ==================================================
        OBTENER VIDEOS
        ==================================================
        */

        const videosCloudinary =
            await obtenerRecursos(
                "video",
                videosPrefix
            );


        /*
        ==================================================
        PORTADA
        ==================================================
        */

        let portada = null;


        if (
            imagenesPortada.resources &&
            imagenesPortada.resources.length > 0
        ) {

            portada =
                `https://res.cloudinary.com/${cloudName}/image/upload/${imagenesPortada.resources[0].public_id}`;

        }


        /*
        ==================================================
        FOTOS
        ==================================================
        */

        const fotos =
            (imagenesFotos.resources || [])
                .map(
                    recurso =>
                        `https://res.cloudinary.com/${cloudName}/image/upload/${recurso.public_id}`
                );


        /*
        ==================================================
        VIDEOS
        ==================================================
        */

        const videos =
            (videosCloudinary.resources || [])
                .map(
                    recurso =>
                        `https://res.cloudinary.com/${cloudName}/video/upload/${recurso.public_id}`
                );


        /*
        ==================================================
        RESPUESTA
        ==================================================
        */

        return new Response(
            JSON.stringify({

                ok: true,

                evento: eventoId,

                portada: portada,

                fotos: fotos,

                videos: videos

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

        console.error(error);


        return new Response(
            JSON.stringify({

                ok: false,

                error:
                    error.message ||
                    "Error al consultar Cloudinary."

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
