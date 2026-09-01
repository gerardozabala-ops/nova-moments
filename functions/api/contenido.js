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
        ASSET FOLDER A PROBAR
        ============================================
        */

        const assetFolder =
            "HOGAR/NOVA_MOMENTS/EVT-0001/FOTOS";

        /*
        ============================================
        CONSULTAR ASSET FOLDER
        ============================================
        */

        const endpoint =
            "https://api.cloudinary.com/v1_1/" +
            cloudName +
            "/resources/by_asset_folder";

        const parametros =
            new URLSearchParams();

        parametros.append(
            "asset_folder",
            assetFolder
        );

        parametros.append(
            "max_results",
            "500"
        );

        const respuesta =
            await fetch(
                endpoint +
                "?" +
                parametros.toString(),
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
                    asset_folder: assetFolder,
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
        MOSTRAR RECURSOS ENCONTRADOS
        ============================================
        */

        const recursos =
            (datos.resources || []).map(
                function(recurso) {

                    return {

                        public_id:
                            recurso.public_id || null,

                        asset_id:
                            recurso.asset_id || null,

                        resource_type:
                            recurso.resource_type || null,

                        type:
                            recurso.type || null,

                        format:
                            recurso.format || null,

                        asset_folder:
                            recurso.asset_folder || null,

                        secure_url:
                            recurso.secure_url || null

                    };

                }
            );

        /*
        ============================================
        RESPUESTA
        ============================================
        */

        return new Response(

            JSON.stringify({

                ok: true,

                asset_folder:
                    assetFolder,

                cantidad:
                    recursos.length,

                recursos:
                    recursos,

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
