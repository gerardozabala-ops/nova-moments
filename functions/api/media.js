export async function onRequestGet(context) {

    const cloudName =
        context.env.CLOUDINARY_CLOUD_NAME;

    const apiKey =
        context.env.CLOUDINARY_API_KEY;

    const apiSecret =
        context.env.CLOUDINARY_API_SECRET;

    try {

        const auth =
            btoa(`${apiKey}:${apiSecret}`);

        const endpoint =
            `https://api.cloudinary.com/v1_1/${cloudName}/resources/image/upload`;

        const response =
            await fetch(
                `${endpoint}?max_results=20`,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Basic ${auth}`
                    }
                }
            );

        const texto =
            await response.text();

        if (!response.ok) {

            return new Response(
                JSON.stringify({
                    ok: false,
                    error: texto
                }),
                {
                    status: response.status,
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

        const resultado =
            recursos.map(recurso => ({

                public_id:
                    recurso.public_id,

                asset_folder:
                    recurso.asset_folder,

                folder:
                    recurso.folder,

                resource_type:
                    recurso.resource_type,

                type:
                    recurso.type,

                format:
                    recurso.format,

                secure_url:
                    recurso.secure_url

            }));

        return new Response(
            JSON.stringify(
                {
                    ok: true,
                    cantidad: resultado.length,
                    recursos: resultado
                },
                null,
                2
            ),
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
