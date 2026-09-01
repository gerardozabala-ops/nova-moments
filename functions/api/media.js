export async function onRequestGet(context) {

    try {

        const url = new URL(context.request.url);

        const eventoId =
            url.searchParams.get("evento");


        if (!eventoId) {

            return new Response(
                JSON.stringify({
                    ok: false,
                    error: "No se indicó el evento."
                }),
                {
                    status: 400,
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );

        }


        /*
        ==================================================
        CREDENCIALES CLOUDINARY
        ==================================================
        */

        const cloudName =
            context.env.CLOUDINARY_CLOUD_NAME;

        const apiKey =
            context.env.CLOUDINARY_API_KEY;

        const apiSecret =
            context.env.CLOUDINARY_API_SECRET;


        if (
            !cloudName ||
            !apiKey ||
            !apiSecret
        ) {

            return new Response(
                JSON.stringify({
                    ok: false,
                    error:
                        "Faltan las credenciales de Cloudinary."
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
        ==================================================
        AUTENTICACIÓN
        ==================================================
        */

        const auth =
            btoa(
                `${apiKey}:${apiSecret}`
            );


        /*
        ==================================================
        FUNCIÓN PARA BUSCAR UNA CARPETA
        ==================================================
        */

        async function buscarCarpeta(
            nombreCarpeta
        ) {

            const folder =
                `HOME/MOMENTOS NOVA/${eventoId}/${nombreCarpeta}`;


            const response =
                await fetch(
                    `https://api.cloudinary.com/v1_1/${cloudName}/resources/search`,
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
                                `folder:"${folder}"`,

                            max_results: 500

                        })

                    }
                );


            if (!response.ok) {

                const texto =
                    await response.text();

                console.error(
                    "Cloudinary:",
                    texto
                );

                throw new Error(
                    `Error consultando ${nombreCarpeta}`
                );

            }


            const data =
                await response.json();


            return data.resources || [];

        }


        /*
        ==================================================
        BUSCAR PORTADA
        ==================================================
        */

        const portadaRecursos =
            await buscarCarpeta(
                "PORTADA"
            );


        /*
        ==================================================
        BUSCAR FOTOS
        ==================================================
        */

        const fotosRecursos =
            await buscarCarpeta(
                "FOTOS"
            );


        /*
        ==================================================
        BUSCAR VIDEOS
        ==================================================
        */

        const videosRecursos =
            await buscarCarpeta(
                "VIDEOS"
            );


        /*
        ==================================================
        OBTENER PORTADA
        ==================================================
        */

        let portada = null;


        if (
            portadaRecursos.length > 0
        ) {

            portada =
                portadaRecursos[0]
                    .secure_url;

        }


        /*
        ==================================================
        OBTENER FOTOS
        ==================================================
        */

        const fotos =
            fotosRecursos
                .filter(
                    recurso =>
                        recurso.resource_type ===
                        "image"
                )
                .map(
                    recurso =>
                        recurso.secure_url
                );


        /*
        ==================================================
        OBTENER VIDEOS
        ==================================================
        */

        const videos =
            videosRecursos
                .filter(
                    recurso =>
                        recurso.resource_type ===
                        "video"
                )
                .map(
                    recurso =>
                        recurso.secure_url
                );


        /*
        ==================================================
        RESPUESTA
        ==================================================
        */

        return new Response(
            JSON.stringify({

                ok: true,

                evento: eventoId,

                portada: portada,

                fotos: fotos,

                videos: videos

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

        console.error(error);


        return new Response(
            JSON.stringify({

                ok: false,

                error:
                    "Error al consultar Cloudinary."

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
