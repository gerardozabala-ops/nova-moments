export async function onRequestGet(context) {

    try {

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
                        "Content-Type":
                            "application/json"
                    }
                }
            );
        }

        /*
        ============================================
        AUTENTICACIÓN
        ============================================
        */

        const credenciales =
            apiKey + ":" + apiSecret;

        const autorizacion =
            btoa(credenciales);

        /*
        ============================================
        LISTAR ASSET FOLDERS
        ============================================
        */

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

        const texto =
            await respuesta.text();

        if (!respuesta.ok) {

            return new Response(
                JSON.stringify({
                    ok: false,
                    status: respuesta.status,
                    respuesta: texto
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
            JSON.parse(texto);

        /*
        ============================================
        RESPUESTA DE DIAGNÓSTICO
        ============================================
        */

        return new Response(

            JSON.stringify({

                ok: true,

                mensaje:
                    "Asset Folders reconocidas por Cloudinary",

                carpetas:
                    datos.folders || [],

                next_cursor:
                    datos.next_cursor || null

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
