export async function onRequestGet(context) {

    const cloudName =
        context.env.CLOUDINARY_CLOUD_NAME;

    const apiKey =
        context.env.CLOUDINARY_API_KEY;

    const apiSecret =
        context.env.CLOUDINARY_API_SECRET;

    const url =
        new URL(context.request.url);

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

    try {

        const auth =
            btoa(`${apiKey}:${apiSecret}`);

        const base =
            `HOME/MOMENTOS NOVA/${evento}`;

        const portada =
            await buscarRecursos(
                cloudName,
                auth,
                `${base}/PORTADA`
            );

        const fotos =
            await buscarRecursos(
                cloudName,
                auth,
                `${base}/FOTOS`
            );

        const videos =
            await buscarRecursos(
                cloudName,
                auth,
                `${base}/VIDEOS`
            );

        return new Response(
            JSON.stringify({

                ok: true,

                evento: evento,

                portada: portada,

                fotos: fotos,

                videos: videos

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


async function buscarRecursos(
    cloudName,
    auth,
    carpeta
) {

    const endpoint =
        `https://api.cloudinary.com/v1_1/${cloudName}/resources/search`;

    const expression =
        `asset_folder="${carpeta}"`;

    const response =
        await fetch(
            endpoint,
            {
                method: "POST",

                headers: {
                    "Authorization":
                        `Basic ${auth}`,

                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({

                    expression:
                        expression,

                    max_results:
                        100

                })
            }
        );

    const texto =
        await response.text();

    if (!response.ok) {

        throw new Error(
            `Cloudinary error ${response.status}: ${texto}`
        );
    }

    const datos =
        JSON.parse(texto);

    return datos.resources || [];
}
