export async function onRequestGet(context) {

    try {

        const url = new URL(context.request.url);

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

        const cloudName =
            context.env.CLOUDINARY_CLOUD_NAME;

        const apiKey =
            context.env.CLOUDINARY_API_KEY;

        const apiSecret =
            context.env.CLOUDINARY_API_SECRET;

        if (!cloudName ||
            !apiKey ||
            !apiSecret) {

            return new Response(
                JSON.stringify({
                    ok: false,
                    error:
                        "Faltan variables de Cloudinary."
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
        FUNCIÓN DE BÚSQUEDA
        ============================================
        */

        async function buscar(expression) {

            const endpoint =
                "https://api.cloudinary.com/v1_1/" +
                cloudName +
                "/resources/search";

            const cuerpo =
                new URLSearchParams();

            cuerpo.append(
                "expression",
                expression
            );

            cuerpo.append(
                "max_results",
                "500"
            );

            const respuesta =
                await fetch(
                    endpoint,
                    {
                        method: "POST",

                        headers: {
                            "Authorization":
                                "Basic " +
                                autorizacion,

                            "Content-Type":
                                "application/x-www-form-urlencoded"
                        },

                        body: cuerpo.toString()
                    }
                );

            const texto =
                await respuesta.text();

            if (!respuesta.ok) {

                throw new Error(
                    "Cloudinary respondió " +
                    respuesta.status +
                    ": " +
                    texto
                );
            }

            return JSON.parse(texto);
        }

        /*
        ============================================
        BUSCAR TODO EL EVENTO
        ============================================
        */

        const expresion =
            "public_id:" +
            "NOVA_MOMENTS/" +
            evento +
            "/*";

        const resultado =
            await buscar(expresion);

        /*
        ============================================
        PREPARAR RESULTADOS
        ============================================
        */

        const recursos =
            resultado.resources || [];

        const informacion =
            recursos.map(
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

                evento: evento,

                expresion:
                    expresion,

                cantidad:
                    informacion.length,

                recursos:
                    informacion

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
