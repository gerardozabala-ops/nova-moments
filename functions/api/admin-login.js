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

        const usuarioCorrecto =
            usuario === env.ADMIN_USER;

        const passwordCorrecta =
            password === env.ADMIN_PASSWORD;

        if (
            !usuarioCorrecto ||
            !passwordCorrecta
        ) {

            return new Response(
                JSON.stringify({
                    ok: false,
                    error: "Usuario o contraseña incorrectos."
                }),
                {
                    status: 401,
                    headers: {
                        "Content-Type":
                            "application/json"
                    }
                }
            );

        }

        /*
        =========================================================
        CREAR SESIÓN
        =========================================================
        */

        const ahora =
            Math.floor(Date.now() / 1000);

        const payload = {
            usuario: usuario,
            exp: ahora + 8 * 60 * 60
        };

        const texto =
            btoa(
                JSON.stringify(payload)
            );

        const firma =
            await firmar(
                texto,
                env.ADMIN_SESSION_SECRET
            );

        const token =
            `${texto}.${firma}`;

        return new Response(
            JSON.stringify({
                ok: true
            }),
            {
                status: 200,

                headers: {

                    "Content-Type":
                        "application/json",

                    "Set-Cookie":
                        `nova_admin_session=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800`
                }

            }
        );

    } catch (error) {

        return new Response(
            JSON.stringify({
                ok: false,
                error: "Error interno."
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


/*
=========================================================
FIRMA HMAC
=========================================================
*/

async function firmar(
    texto,
    secreto
) {

    const encoder =
        new TextEncoder();

    const clave =
        await crypto.subtle.importKey(
            "raw",
            encoder.encode(secreto),
            {
                name: "HMAC",
                hash: "SHA-256"
            },
            false,
            ["sign"]
        );

    const firma =
        await crypto.subtle.sign(
            "HMAC",
            clave,
            encoder.encode(texto)
        );

    return Array.from(
        new Uint8Array(firma)
    )
        .map(
            byte =>
                byte
                    .toString(16)
                    .padStart(2, "0")
        )
        .join("");
}
