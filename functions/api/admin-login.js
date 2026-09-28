export async function onRequestGet(context) {

    const { env } = context;

    return new Response(
        JSON.stringify({
            ADMIN_USER_existe:
                typeof env.ADMIN_USER === "string" &&
                env.ADMIN_USER.length > 0,

            ADMIN_PASSWORD_existe:
                typeof env.ADMIN_PASSWORD === "string" &&
                env.ADMIN_PASSWORD.length > 0,

            ADMIN_SESSION_SECRET_existe:
                typeof env.ADMIN_SESSION_SECRET === "string" &&
                env.ADMIN_SESSION_SECRET.length > 0
        }),
        {
            status: 200,
            headers: {
                "Content-Type": "application/json"
            }
        }
    );
}
