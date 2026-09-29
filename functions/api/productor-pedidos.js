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

        // =========================
        // 1. VERIFICAR PRODUCTOR
        // =========================

        const productorResult = await env.DB.prepare(`
            SELECT
                usuario,
                productor_id,
                estado
            FROM usuarios_productor
            WHERE usuario = ?
              AND password = ?
              AND estado = 'activo'
            LIMIT 1
        `)
        .bind(usuario, password)
        .all();

        const usuarioProductor =
            productorResult.results?.[0];

        if (!usuarioProductor) {

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

        const productorId =
            usuarioProductor.productor_id;


        // =========================
        // 2. BUSCAR PEDIDOS
        // =========================

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
                eventos.nombre AS evento_nombre,
                eventos.evento AS evento_descripcion,
                eventos.fecha AS evento_fecha
            FROM pedidos
            INNER JOIN eventos
                ON pedidos.evento_id = eventos.evento_id
            WHERE eventos.productor_id = ?
            ORDER BY pedidos.id DESC
        `)
        .bind(productorId)
        .all();

        const pedidos =
            pedidosResult.results || [];


        // =========================
        // 3. BUSCAR ITEMS
        // =========================

        for (const pedido of pedidos) {

            const itemsResult =
                await env.DB.prepare(`
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

            pedido.items =
                itemsResult.results || [];
        }


        // =========================
        // 4. RESPUESTA
        // =========================

        return new Response(
            JSON.stringify({
                ok: true,
                productor_id: productorId,
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
                error:
                    "Error al consultar los pedidos del productor."
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
