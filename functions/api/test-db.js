export async function onRequest(context) {

    const result = await context.env.DB
        .prepare("SELECT * FROM eventos")
        .all();

    return Response.json({
        ok: true,
        eventos: result.results
    });
}
