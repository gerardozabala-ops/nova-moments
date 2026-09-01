export async function onRequestGet(context) {

    try {

        const url = new URL(context.request.url);

        const eventoId = url.searchParams.get("evento");

        if (!eventoId) {

            return respuesta({
                ok: false,
                error: "No se indicó el evento."
            }, 400);

        }


        // =========================================
        // CREDENCIALES
        // =========================================

        const cloudName =
            context.env.CLOUDINARY_CLOUD_NAME;

        const apiKey =
            context.env.CLOUDINARY_API_KEY;

        const apiSecret =
            context.env.CLOUDINARY_API_SECRET;


        if (!cloudName || !apiKey || !apiSecret) {

            return respuesta({
                ok: false,
                error: "Faltan las credenciales de Cloudinary."
            }, 500);

        }


        // =========================================
        // AUTENTICACIÓN
        // =========================================

        const auth =
            btoa(`${apiKey}:${apiSecret}`);


        // =========================================
        // CARPETAS
        // =========================================

        const base =
            `HOME/MOMENTOS NOVA/${eventoId}`;


        // =========================================
        // FUNCIÓN PARA LISTAR RECURSOS
        // =========================================

        async function listar(
            resourceType,
            prefix
        ) {

            const endpoint =
                `https://api.cloudinary.com/v1_1/${cloudName}/resources/${resourceType}/upload`;

            const parametros =
                new URLSearchParams();

            parametros.set(
                "prefix",
                prefix
            );

            parametros.set(
                "max_results",
                "500"
            );


            const response =
                await fetch(
                    `${endpoint}?${parametros.toString()}`,
                    {
                        method: "GET",

                        headers: {
                            "Authorization":
                                `Basic ${auth}`
                        }
                    }
                );


            if (!response.ok) {

                const texto =
                    await response.text();

                console.error(
                    "Cloudinary error:",
                    texto
                );

                throw new Error(
                    `Cloudinary respondió ${response.status}`
                );

            }


            return await response.json();

        }


        // =========================================
        // PORTADA
        // =========================================

        const portadaData =
            await listar(
                "image",
                `${base}/PORTADA/`
            );


        // =========================================
        // FOTOS
        // =========================================

        const fotosData =
            await listar(
                "image",
                `${base}/FOTOS/`
            );


        // =========================================
        // VIDEOS
        // =========================================

        const videosData =
            await listar(
                "video",
                `${base}/VIDEOS/`
            );


        // =========================================
        // PORTADA
        // =========================================

        let portada = null;


        if (
            portadaData.resources &&
            portadaData.resources.length > 0
        ) {

            const recurso =
                portadaData.resources[0];

            portada =
                `https://res.cloudinary.com/${cloudName}/image/upload/${recurso.public_id}`;

        }


        // =========================================
        // FOTOS
        // =========================================

        const fotos =
            (fotosData.resources || [])
                .map(
                    recurso =>
                        `https://res.cloudinary.com/${cloudName}/image/upload/${recurso.public_id}`
                );


        // =========================================
        // VIDEOS
        // =========================================

        const videos =
            (videosData.resources || [])
                .map(
                    recurso =>
                        `https://res.cloudinary.com/${cloudName}/video/upload/${recurso.public_id}`
                );


        // =========================================
        // RESPUESTA
        // =========================================

        return respuesta({

            ok: true,

            evento: eventoId,

            portada: portada,

            fotos: fotos,

            videos: videos

        });


    } catch (error) {

        console.error(error);

        return respuesta({

            ok: false,

            error: error.message ||
                "Error al consultar Cloudinary."

        }, 500);

    }

}


// =========================================
// RESPUESTA JSON
// =========================================

function respuesta(
    datos,
    status = 200
) {

    return new Response(
        JSON.stringify(datos),
        {
            status: status,

            headers: {
                "Content-Type":
                    "application/json"
            }
        }
    );

}
