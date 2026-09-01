export async function onRequestGet(context) {

    try {

        const cloudName =
            context.env.CLOUDINARY_CLOUD_NAME;

        const apiKey =
            context.env.CLOUDINARY_API_KEY;

        const apiSecret =
            context.env.CLOUDINARY_API_SECRET;

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

        const texto =
            await respuesta.text();

        if (!respuesta.ok) {

            return new Response(
                texto,
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

        const carpetas =
            datos.folders || [];

        /*
        ============================================
        BUSCAR SOLAMENTE CARPETAS NOVA_MOMENTS
        ============================================
        */

        const nova =
            carpetas.filter(
                function(carpeta) {

                    const nombre =
                        carpeta.name || "";

                    return nombre
                        .toUpperCase()
                        .includes("NOVA");

                }
            );

        return new Response(

            JSON.stringify({

                ok: true,

                cantidad:
                    nova.length,

                carpetas:
                    nova

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
