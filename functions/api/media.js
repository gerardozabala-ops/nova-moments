export async function onRequestGet(context) {

    const cloudName =
        context.env.CLOUDINARY_CLOUD_NAME;

    const apiKey =
        context.env.CLOUDINARY_API_KEY;

    const apiSecret =
        context.env.CLOUDINARY_API_SECRET;

    const url =
        new URL(context.request.url);

    const evento =
        url.searchParams.get("evento");

    if (!evento) {

        return new Response(
            JSON.stringify({
                ok: false,
                error: "Falta indicar el evento."
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

    try {

        const auth =
            btoa(`${apiKey}:${apiSecret}`);

        const imagenes =
            await obtenerRecursos(
                cloudName,
                auth,
                "image"
            );

        const videos =
            await obtenerRecursos(
                cloudName,
                auth,
                "video"
            );

        const prefijo =
            `NOVA_MOMENTS/${evento}/`;

        const recursosImagen =
            imagenes.filter(recurso =>
                (recurso.asset_folder || "")
                    .startsWith(prefijo)
            );

        const recursosVideo =
            videos.filter(recurso =>
                (recurso.asset_folder || "")
                    .startsWith(prefijo)
            );

        const portada =
            recursosImagen.filter(recurso =>
                (recurso.asset_folder || "")
                    .endsWith("/PORTADA")
            );

        const logo =
            recursosImagen.filter(recurso =>
                (recurso.asset_folder || "")
                    .endsWith("/LOGOTIPO")
            );

        const fotos =
            recursosImagen.filter(recurso =>
                (recurso.asset_folder || "")
                    .endsWith("/FOTOS")
            );

        const listaVideos =
            recursosVideo.filter(recurso =>
                (recurso.asset_folder || "")
                    .endsWith("/VIDEOS")
            );

        /*
         * VIDEOS PRIVADOS DE R2
         *
         * Por ahora los agregamos en una propiedad
         * separada para no modificar todavía
         * el funcionamiento actual de RECUERDOS.
         */

        const videosR2 =
            context.env.VIDEOS
                ? await obtenerVideosR2(
                    context.env.VIDEOS,
                    evento
                )
                : [];

        return new Response(
            JSON.stringify({

                ok: true,

                evento: evento,

                portada:
                    convertirRecursos(portada),

                logo:
                    convertirRecursos(logo),

                fotos:
                    convertirRecursos(fotos),

                videos:
                    convertirRecursos(listaVideos),

                r2_videos:
                    videosR2

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


async function obtenerRecursos(
    cloudName,
    auth,
    tipo
) {

    const endpoint =
        `https://api.cloudinary.com/v1_1/${cloudName}/resources/${tipo}/upload`;

    const response =
        await fetch(
            `${endpoint}?max_results=500`,
            {
                method: "GET",

                headers: {
                    "Authorization":
                        `Basic ${auth}`
                }
            }
        );

    const texto =
        await response.text();

    if (!response.ok) {

        throw new Error(
            `Cloudinary error ${response.status}: ${texto}`
        );
    }

    const datos =
        JSON.parse(texto);

    return datos.resources || [];
}


async function obtenerVideosR2(
    bucket,
    evento
) {

    const prefijo =
        `${evento}/`;

    const resultado =
        await bucket.list({
            prefix: prefijo
        });

    return resultado.objects
        .filter(objeto =>
            /\.(mp4|webm|mov|m4v)$/i
                .test(objeto.key)
        )
        .map(objeto => {

            const partes =
                objeto.key.split(".");

            const formato =
                partes.length > 1
                    ? partes.pop().toLowerCase()
                    : "";

            return {

                public_id:
                    objeto.key,

                asset_folder:
                    `${evento}/VIDEOS`,

                resource_type:
                    "video",

                format:
                    formato,

                secure_url:
                    `/api/video?key=${encodeURIComponent(
                        objeto.key
                    )}`

            };

        });

}


function convertirRecursos(
    recursos
) {

    return recursos.map(
        recurso => ({

            public_id:
                recurso.public_id,

            asset_folder:
                recurso.asset_folder,

            resource_type:
                recurso.resource_type,

            format:
                recurso.format,

            secure_url:
                recurso.secure_url

        })
    );

}
