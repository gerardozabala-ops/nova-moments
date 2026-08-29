export async function onRequestGet(context) {

    try {

        const url = new URL(context.request.url);
        const evento = url.searchParams.get("evento");

        if (!evento) {
            return new Response(
                JSON.stringify({
                    error: "Falta indicar el evento."
                }),
                {
                    status: 400,
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );
        }

        const cloudName = context.env.CLOUDINARY_CLOUD_NAME;
        const apiKey = context.env.CLOUDINARY_API_KEY;
        const apiSecret = context.env.CLOUDINARY_API_SECRET;

        if (!cloudName || !apiKey || !apiSecret) {
            return new Response(
                JSON.stringify({
                    error: "Las variables de Cloudinary no están configuradas."
                }),
                {
                    status: 500,
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );
        }

        var carpeta = "NOVA_MOMENTS/" + evento + "/FOTOS";

        var timestamp = Math.floor(Date.now() / 1000);

        var parametros =
            "prefix=" + carpeta +
            "&timestamp=" + timestamp +
            apiSecret;

        var encoder = new TextEncoder();
        var data = encoder.encode(parametros);

        var hashBuffer = await crypto.subtle.digest(
            "SHA-1",
            data
        );

        var hashArray = Array.from(
            new Uint8Array(hashBuffer)
        );

        var signature = hashArray
            .map(function(b) {
                return b.toString(16).padStart(2, "0");
            })
            .join("");

        var cloudinaryUrl =
            "https://api.cloudinary.com/v1_1/" +
            cloudName +
            "/resources/search";

        var response = await fetch(
            cloudinaryUrl,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/x-www-form-urlencoded"
                },

                body: new URLSearchParams({

                    expression:
                        "folder=\"" + carpeta + "\"",

                    timestamp:
                        timestamp.toString(),

                    api_key:
                        apiKey,

                    signature:
                        signature

                })
            }
        );

        var dataCloudinary =
            await response.json();

        if (!response.ok) {

            return new Response(
                JSON.stringify({
                    error:
                        "Cloudinary rechazó la solicitud.",
                    detalle:
                        dataCloudinary
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

        var fotos =
            (dataCloudinary.resources || [])
                .map(function(recurso) {
                    return recurso.secure_url;
                });

        return new Response(
            JSON.stringify({
                evento: evento,
                carpeta: carpeta,
                fotos: fotos
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
                error:
                    "Error interno de la función.",
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
