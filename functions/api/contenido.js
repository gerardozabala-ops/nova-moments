export async function onRequestGet(context) {

    try {

        const cloudName =
            context.env.CLOUDINARY_CLOUD_NAME;

        const apiKey =
            context.env.CLOUDINARY_API_KEY;

        const apiSecret =
            context.env.CLOUDINARY_API_SECRET;

        const publicId = "DSC_2570";

        const credenciales =
            apiKey + ":" + apiSecret;

        const autorizacion =
            btoa(credenciales);

        const endpoint =
            "https://api.cloudinary.com/v1_1/" +
            cloudName +
            "/resources/image/upload/" +
            encodeURIComponent(publicId);

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

        return new Response(

            JSON.stringify({

                ok: true,

                public_id:
                    datos.public_id || null,

                asset_folder:
                    datos.asset_folder || null,

                resource_type:
                    datos.resource_type || null,

                format:
                    datos.format || null,

                secure_url:
                    datos.secure_url || null

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
