export async function onRequestGet(context) {

    try {

        const cloudName =
            context.env.CLOUDINARY_CLOUD_NAME;

        const apiKey =
            context.env.CLOUDINARY_API_KEY;

        const apiSecret =
            context.env.CLOUDINARY_API_SECRET;

        const folderId =
            "d025466ca18937a7e1574c946615dfcf79";

        const credenciales =
            apiKey + ":" + apiSecret;

        const autorizacion =
            btoa(credenciales);

        const endpoint =
            "https://api.cloudinary.com/v1_1/" +
            cloudName +
            "/asset_folders";

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

            return new Response(
                JSON.stringify({
                    ok: false,
                    status: respuesta.status
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

        const datos =
            await respuesta.json();

        const carpetas =
            datos.folders || [];

        const encontrada =
            carpetas.find(
                function(carpeta) {

                    return (
                        carpeta.external_id ===
                        folderId ||
                        carpeta.id ===
                        folderId
                    );

                }
            );

        if (!encontrada) {

            return new Response(
                JSON.stringify({
                    ok: false,
                    mensaje:
                        "No se encontró ese ID entre las Asset Folders devueltas."
                }),
                {
                    status: 404,
                    headers: {
                        "Content-Type":
                            "application/json"
                    }
                }
            );
        }

        return new Response(

            JSON.stringify({

                ok: true,

                nombre:
                    encontrada.name || null,

                ruta:
                    encontrada.path || null,

                parent_id:
                    encontrada.parent_id || null

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

        return new Response(

            JSON.stringify({

                ok: false,

                error:
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
