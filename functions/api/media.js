export async function onRequestGet(context) {

    const cloudName =
        context.env.CLOUDINARY_CLOUD_NAME;

    const apiKey =
        context.env.CLOUDINARY_API_KEY;

    const apiSecret =
        context.env.CLOUDINARY_API_SECRET;

    const url = new URL(context.request.url);

    const evento =
        url.searchParams.get("evento");

    if (!evento) {
        return new Response(
            JSON.stringify({
                ok: false,
                error: "Falta el evento"
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

    const auth =
        btoa(`${apiKey}:${apiSecret}`);

    async function obtenerCarpeta(carpeta) {

        const endpoint =
            `https://api.cloudinary.com/v1_1/${cloudName}/resources/by_asset_folder`;

        const params =
            new URLSearchParams();

        params.set(
            "asset_folder",
            carpeta
        );

        params.set(
            "max_results",
            "100"
        );

        const response =
            await fetch(
                `${endpoint}?${params.toString()}`,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Basic ${auth}`
                    }
                }
            );

        if (!response.ok) {
            throw new Error(
                `Cloudinary error ${response.status}`
            );
        }

        return await response.json();
    }

    try {

        const base =
            `HOME/MOMENTOS NOVA/${evento}`;

        const portada =
            await obtenerCarpeta(
                `${base}/PORTADA`
            );

        const fotos =
            await obtenerCarpeta(
                `${base}/FOTOS`
            );

        const videos =
            await obtenerCarpeta(
                `${base}/VIDEOS`
            );

        const resultado = {

            ok: true,

            evento: evento,

            portada:
                portada.resources || [],

            fotos:
                fotos.resources || [],

            videos:
                videos.resources || []

        };

        return new Response(
            JSON.stringify(resultado),
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
