export async function onRequestGet(context) {

    try {

        const cloudName = context.env.CLOUDINARY_CLOUD_NAME;
        const apiKey = context.env.CLOUDINARY_API_KEY;
        const apiSecret = context.env.CLOUDINARY_API_SECRET;

        if (!cloudName || !apiKey || !apiSecret) {

            return new Response(
                JSON.stringify({
                    ok: false,
                    error: "Faltan variables de Cloudinary en Cloudflare."
                }),
                {
                    status: 500,
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );
        }

        const credenciales =
            apiKey + ":" + apiSecret;

        const encoded =
            btoa(credenciales);

        const respuesta =
            await fetch(
                "https://api.cloudinary.com/v1_1/" +
                cloudName +
                "/resources/image/upload",
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            "Basic " + encoded
                    }
                }
            );

        const resultado =
            await respuesta.text();

        if (!respuesta.ok) {

            return new Response(
                JSON.stringify({
                    ok: false,
                    status: respuesta.status,
                    cloud_name: cloudName,
                    respuesta: resultado
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

        return new Response(
            JSON.stringify({
                ok: true,
                mensaje:
                    "Autenticación con Cloudinary correcta.",
                cloud_name:
                    cloudName
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
                error: error.message
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
