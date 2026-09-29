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

        // Verificación del administrador
        if (
            usuario !== env.ADMIN_USER ||
            password !== env.ADMIN_PASSWORD
        ) {

            return new Response(
                JSON.stringify({
                    ok: false,
                    error: "No autorizado."
                }),
                {
                    status: 401,
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );
        }

        // Obtener pedidos junto con su productor
        const pedidosResult = await env.DB.prepare(`
            SELECT
                pedidos.id,
                pedidos.pedido_id,
                pedidos.evento_id,
                pedidos.nombre,
                pedidos.whatsapp,
                pedidos.email,
                pedidos.total,
                pedidos.estado,
                pedidos.estado_pago,
                pedidos.creado_en,
                eventos.productor_id,
                productores.nombre AS productor
            FROM pedidos
            LEFT JOIN eventos
                ON pedidos.evento_id = eventos.evento_id
            LEFT JOIN productores
                ON eventos.productor_id = productores.productor_id
            ORDER BY pedidos.id DESC
        `).all();

        const pedidos = pedidosResult.results || [];

        // Obtener los items de cada pedido
        for (const pedido of pedidos) {

            const itemsResult = await env.DB.prepare(`
                SELECT
                    foto_id,
                    nombre_archivo,
                    cantidad,
                    precio_unitario,
                    subtotal
                FROM pedido_items
                WHERE pedido_id = ?
                ORDER BY id ASC
            `)
            .bind(pedido.pedido_id)
            .all();

            pedido.items = itemsResult.results || [];
        }

        return new Response(
            JSON.stringify({
                ok: true,
                pedidos: pedidos
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
                error: "Error al consultar los pedidos."
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
