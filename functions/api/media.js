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
        CONFIGURACIÓN CLOUDINARY
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
                    error: "Faltan las credenciales de Cloudinary."
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
        ==================================================
        CONSULTAR CLOUDINARY
        ==================================================
        */

        const timestamp =
            Math.floor(
                Date.now() / 1000
            );


        const folder =
            `NOVA_MOMENTS/${eventoId}`;


        /*
        ==================================================
        GENERAR FIRMA
        ==================================================
        */

        const encoder =
            new TextEncoder();


        const datosFirma =
            `folder=${folder}&timestamp=${timestamp}${apiSecret}`;


        const hashBuffer =
            await crypto.subtle.digest(
                "SHA-1",
                encoder.encode(datosFirma)
            );


        const hashArray =
            Array.from(
                new Uint8Array(hashBuffer)
            );


        const signature =
            hashArray
                .map(
                    byte =>
                        byte
                            .toString(16)
                            .padStart(2, "0")
                )
                .join("");


        /*
        ==================================================
        BUSCAR RECURSOS
        ==================================================
        */

        const searchUrl =
            `https://api.cloudinary.com/v1_1/${cloudName}/resources/search`;


        const response =
            await fetch(
                searchUrl,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        expression:
                            `folder:${folder}/*`,

                        max_results: 500,

                        sort_by: [
                            {
                                public_id: "asc"
                            }
                        ]

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

            return new Response(
                JSON.stringify({
                    ok: false,
                    error: "Cloudinary rechazó la consulta."
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


        const data =
            await response.json();


        /*
        ==================================================
        SEPARAR FOTOS Y VIDEOS
        ==================================================
        */

        const fotos = [];

        const videos = [];


        for (
            const recurso
            of (data.resources || [])
        ) {

            const url =
                recurso.secure_url;


            if (
                recurso.resource_type ===
                "image"
            ) {

                fotos.push(url);

            }


            if (
                recurso.resource_type ===
                "video"
            ) {

                videos.push(url);

            }

        }


        /*
        ==================================================
        RESPUESTA
        ==================================================
        */

        return new Response(
            JSON.stringify({

                ok: true,

                evento: eventoId,

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
                error: "Error interno del servidor."
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
