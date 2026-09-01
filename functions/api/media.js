export async function onRequestGet(context) {

    const cloudName =
        context.env.CLOUDINARY_CLOUD_NAME;

    const apiKey =
        context.env.CLOUDINARY_API_KEY;

    const apiSecret =
        context.env.CLOUDINARY_API_SECRET;


    const auth =
        btoa(`${apiKey}:${apiSecret}`);


    const prefix =
        "HOME/MOMENTOS NOVA/EVT-0001";


    const endpoint =
        `https://api.cloudinary.com/v1_1/${cloudName}/resources/image/upload`;


    const url =
        `${endpoint}?prefix=${encodeURIComponent(prefix)}&max_results=100`;


    const response =
        await fetch(
            url,
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


    return new Response(
        texto,
        {
            status: response.status,

            headers: {
                "Content-Type":
                    "application/json"
            }
        }
    );

}
