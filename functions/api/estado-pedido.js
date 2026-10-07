export async function onRequestPost(context) {

    const { request, env } = context;

    try {

        const datos = await request.json();

        const pedidoId = String(
            datos.pedido_id || ""
        ).trim();

        if (!pedidoId) {

            return new Response(
                JSON.stringify({
                    ok: false,
                    error: "No se indicó el pedido."
                }),
                {
                    status: 400,
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );
        }

        // =========================
        // BUSCAR ESTADO DEL PEDIDO
        // =========================

        const resultado = await env.DB.prepare(`
            SELECT
                pedido_id,
                estado_pago
            FROM pedidos
            WHERE pedido_id = ?
            LIMIT 1
        `)
        .bind(pedidoId)
        .first();

        if (!resultado) {

            return new Response(
                JSON.stringify({
                    ok: false,
                    error: "Pedido no encontrado."
                }),
                {
                    status: 404,
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );
        }

        return new Response(
            JSON.stringify({
                ok: true,
                pedido_id: resultado.pedido_id,
                estado_pago: resultado.estado_pago
            }),
            {
                status: 200,
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );

    } catch (error) {

        console.error(
            "Error consultando estado del pedido:",
            error
        );

        return new Response(
            JSON.stringify({
                ok: false,
                error: "Error al consultar el estado del pedido."
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
