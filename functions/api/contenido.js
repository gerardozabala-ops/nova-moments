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
        CONSULTAR CARPETA
        ============================================
        */

        const endpoint =
            "https://api.cloudinary.com/v1_1/" +
            cloudName +
            "/asset_folders/" +
            folderId;

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
        RESPUESTA MÍNIMA
        ============================================
        */

        return new Response(

            JSON.stringify({

                ok: true,

                nombre:
                    datos.name || null,

                ruta:
                    datos.path || null,

                cantidad:
                    datos.asset_count ??
                    datos.count ??
                    null

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
