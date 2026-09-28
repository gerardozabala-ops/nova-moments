export async function onRequestPost(context) {

    const { request, env } = context;

    try {

        const datos = await request.json();

        const usuario = String(
            datos.usuario || ""
        ).trim();

        const password = String(
            datos.password || ""
        );

        if (
            usuario !== env.ADMIN_USER ||
            password !== env.ADMIN_PASSWORD
        ) {

            return new Response(
                JSON.stringify({
                    ok: false,
                    error: "Usuario o contraseña incorrectos."
                }),
                {
                    status: 401,
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );

        }

        return new Response(
            JSON.stringify({
                ok: true
            }),
            {
                status: 200,
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );

    } catch (error) {

        return new Response(
            JSON.stringify({
                ok: false,
                error: "Error interno del servidor."
            }),
            {
                status: 500,
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );

    }

}
