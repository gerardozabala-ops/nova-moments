export async function onRequest(context) {

    const { request } = context;

    if (request.method === "GET") {

        return new Response(
            JSON.stringify({
                ok: true,
                mensaje: "ADMIN API OK"
            }),
            {
                status: 200,
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );
    }

    if (request.method !== "POST") {

        return new Response(
            JSON.stringify({
                ok: false,
                error: "Método no permitido."
            }),
            {
                status: 405,
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );
    }

    return new Response(
        JSON.stringify({
            ok: true,
            mensaje: "POST recibido correctamente"
        }),
        {
            status: 200,
            headers: {
                "Content-Type": "application/json"
            }
        }
    );
}
