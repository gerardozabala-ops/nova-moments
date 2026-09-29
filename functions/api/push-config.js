export async function onRequestGet(context) {

    return new Response(
        JSON.stringify({
            ok: true,
            publicKey:
                context.env.VAPID_PUBLIC_KEY
        }),
        {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-store"
            }
        }
    );

}
