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

        // Obtener pedidos
        const pedidosResult = await env.DB.prepare(`
            SELECT
                id,
                pedido_id,
                evento_id,
                nombre,
                whatsapp,
                email,
                total,
                estado,
                estado_pago,
                creado_en
            FROM pedidos
            ORDER BY id DESC
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
