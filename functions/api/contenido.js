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
        AUTENTICACIÓN
        ============================================
        */

        const credenciales =
            apiKey + ":" + apiSecret;

        const autorizacion =
            btoa(credenciales);

        /*
        ============================================
        CONSULTA DE RECURSOS
        ============================================
        */

        const endpoint =
            "https://api.cloudinary.com/v1_1/" +
            cloudName +
            "/resources/image/upload";

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
        PREPARAR INFORMACIÓN DE DIAGNÓSTICO
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

                        folder:
                            recurso.folder || null,

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

                mensaje:
                    "Diagnóstico Cloudinary",

                cantidad:
                    recursos.length,

                recursos:
                    recursos

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
