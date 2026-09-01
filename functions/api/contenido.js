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

        const autorizacion =
            "Basic " +
            btoa(apiKey + ":" + apiSecret);

        /*
        ============================================
        BUSCAR RECURSOS
        ============================================
        */

        const endpoint =
            "https://api.cloudinary.com/v1_1/" +
            cloudName +
            "/resources/image/upload";

        const parametros =
            new URLSearchParams();

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
                    status: respuesta.status,
                    headers: {
                        "Content-Type":
                            "application/json"
                    }
                }
            );
        }

        const datos =
            JSON.parse(texto);

        const recursos =
            datos.resources || [];

        /*
        ============================================
        FILTRAR EVT-0001
        ============================================
        */

        const encontrados =
            recursos.filter(
                function(recurso) {

                    const carpeta =
                        recurso.asset_folder || "";

                    return carpeta.startsWith(
                        "NOVA_MOMENTS/EVT-0001/"
                    );

                }
            );

        /*
        ============================================
        DEVOLVER SOLO INFORMACIÓN NECESARIA
        ============================================
        */

        const resultado =
            encontrados.map(
                function(recurso) {

                    return {

                        public_id:
                            recurso.public_id,

                        asset_folder:
                            recurso.asset_folder,

                        resource_type:
                            recurso.resource_type,

                        format:
                            recurso.format

                    };

                }
            );

        return new Response(

            JSON.stringify({

                ok: true,

                evento:
                    "EVT-0001",

                cantidad:
                    resultado.length,

                recursos:
                    resultado

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
