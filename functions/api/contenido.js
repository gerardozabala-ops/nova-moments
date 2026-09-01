export async function onRequestGet(context) {

    try {

        const cloudName =
            context.env.CLOUDINARY_CLOUD_NAME;

        const apiKey =
            context.env.CLOUDINARY_API_KEY;

        const apiSecret =
            context.env.CLOUDINARY_API_SECRET;

        const evento =
            context.params.evento ||
            new URL(context.request.url)
                .searchParams
                .get("evento");

        if (!cloudName || !apiKey || !apiSecret) {

            return respuesta({
                ok: false,
                error: "Faltan variables de Cloudinary."
            }, 500);
        }

        if (!evento) {

            return respuesta({
                ok: false,
                error: "Falta indicar el evento."
            }, 400);
        }

        /*
        ============================================
        AUTENTICACIÓN
        ============================================
        */

        const autorizacion =
            "Basic " +
            btoa(apiKey + ":" + apiSecret);

        /*
        ============================================
        OBTENER IMÁGENES
        ============================================
        */

        const imagenes =
            await obtenerRecursos(
                cloudName,
                autorizacion,
                "image"
            );

        /*
        ============================================
        OBTENER VIDEOS
        ============================================
        */

        const videos =
            await obtenerRecursos(
                cloudName,
                autorizacion,
                "video"
            );

        /*
        ============================================
        FILTRAR POR EVENTO Y CARPETA
        ============================================
        */

        const prefijo =
            "NOVA_MOMENTS/" +
            evento +
            "/";

        const recursosImagen =
            imagenes.filter(
                recurso =>
                    (recurso.asset_folder || "")
                        .startsWith(prefijo)
            );

        const recursosVideo =
            videos.filter(
                recurso =>
                    (recurso.asset_folder || "")
                        .startsWith(prefijo)
            );

        /*
        ============================================
        SEPARAR PORTADA Y FOTOS
        ============================================
        */

        const portada =
            recursosImagen.filter(
                recurso =>
                    (recurso.asset_folder || "")
                        .endsWith("/PORTADA")
            );

        const fotos =
            recursosImagen.filter(
                recurso =>
                    (recurso.asset_folder || "")
                        .endsWith("/FOTOS")
            );

        const listaVideos =
            recursosVideo.filter(
                recurso =>
                    (recurso.asset_folder || "")
                        .endsWith("/VIDEOS")
            );

        /*
        ============================================
        FORMATO DE RESPUESTA
        ============================================
        */

        return respuesta({

            ok: true,

            evento: evento,

            portada:
                convertirRecursos(portada),

            fotos:
                convertirRecursos(fotos),

            videos:
                convertirRecursos(listaVideos),

            total_portada:
                portada.length,

            total_fotos:
                fotos.length,

            total_videos:
                listaVideos.length

        });

    } catch (error) {

        return respuesta({

            ok: false,

            error:
                error.message

        }, 500);

    }
}


/*
====================================================
OBTENER RECURSOS DE CLOUDINARY
====================================================
*/

async function obtenerRecursos(
    cloudName,
    autorizacion,
    tipo
) {

    const endpoint =
        "https://api.cloudinary.com/v1_1/" +
        cloudName +
        "/resources/" +
        tipo +
        "/upload";

    const url =
        endpoint +
        "?max_results=500";

    const respuestaCloudinary =
        await fetch(
            url,
            {
                method: "GET",

                headers: {
                    "Authorization":
                        autorizacion
                }
            }
        );

    const texto =
        await respuestaCloudinary.text();

    if (!respuestaCloudinary.ok) {

        throw new Error(
            "Cloudinary rechazó la consulta de " +
            tipo +
            ": " +
            texto
        );
    }

    const datos =
        JSON.parse(texto);

    return datos.resources || [];
}


/*
====================================================
CONVERTIR RECURSOS
====================================================
*/

function convertirRecursos(recursos) {

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


/*
====================================================
RESPUESTA JSON
====================================================
*/

function respuesta(datos, status = 200) {

    return new Response(

        JSON.stringify(datos),

        {
            status: status,

            headers: {
                "Content-Type":
                    "application/json",

                "Cache-Control":
                    "no-store"
            }
        }

    );
}
