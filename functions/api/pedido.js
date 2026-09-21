export async function onRequestPost(context) {

    try {

        const datos = await context.request.json();

        const {
            evento_id,
            nombre,
            whatsapp,
            email,
            total,
            items
        } = datos;


        // =========================
        // VALIDACIONES
        // =========================

        if (!evento_id) {

            return Response.json({
                ok: false,
                error: "Falta indicar el evento."
            }, { status: 400 });

        }

        if (!nombre || !nombre.trim()) {

            return Response.json({
                ok: false,
                error: "Falta indicar el nombre."
            }, { status: 400 });

        }

        if (!whatsapp || !whatsapp.trim()) {

            return Response.json({
                ok: false,
                error: "Falta indicar el WhatsApp."
            }, { status: 400 });

        }

        if (!Array.isArray(items) || items.length === 0) {

            return Response.json({
                ok: false,
                error: "El pedido no contiene fotografías."
            }, { status: 400 });

        }


        // =========================
        // VERIFICAR EVENTO
        // =========================

        const evento =
            await context.env.DB
                .prepare(`
                    SELECT
                        evento_id,
                        evento,
                        estado
                    FROM eventos
                    WHERE evento_id = ?
                    LIMIT 1
                `)
                .bind(evento_id)
                .first();


        if (!evento) {

            return Response.json({
                ok: false,
                error: "El evento no existe."
            }, { status: 404 });

        }


        if (evento.estado !== "activo") {

            return Response.json({
                ok: false,
                error: "El evento no está activo."
            }, { status: 403 });

        }


        // =========================
        // GENERAR ID DEL PEDIDO
        // =========================

        const ahora = new Date();

        const fecha =
            ahora.toISOString()
                .slice(0, 10)
                .replace(/-/g, "");

        const aleatorio =
            Math.floor(
                1000 +
                Math.random() * 9000
            );

        const pedidoId =
            `PED-${fecha}-${aleatorio}`;


        // =========================
        // CALCULAR TOTAL REAL
        // =========================

        let totalCalculado = 0;

        const itemsPreparados = [];


        for (const item of items) {

            const cantidad =
                Number(item.cantidad);

            const precioUnitario =
                Number(item.precio_unitario);

            const subtotal =
                cantidad * precioUnitario;


            if (
                !item.foto_id ||
                !cantidad ||
                cantidad < 1 ||
                !precioUnitario ||
                precioUnitario < 1
            ) {

                return Response.json({
                    ok: false,
                    error: "Uno de los artículos del pedido no es válido."
                }, { status: 400 });

            }


            totalCalculado += subtotal;


            itemsPreparados.push({

                foto_id:
                    item.foto_id,

                nombre_archivo:
                    item.nombre_archivo || "",

                cantidad:
                    cantidad,

                precio_unitario:
                    precioUnitario,

                subtotal:
                    subtotal

            });

        }


        // =========================
        // GUARDAR PEDIDO
        // =========================

        await context.env.DB
            .prepare(`
                INSERT INTO pedidos (
                    pedido_id,
                    evento_id,
                    nombre,
                    whatsapp,
                    email,
                    total,
                    estado,
                    estado_pago,
                    creado_en
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `)
            .bind(
                pedidoId,
                evento_id,
                nombre.trim(),
                whatsapp.trim(),
                email
                    ? email.trim()
                    : null,
                totalCalculado,
                "pendiente",
                "pendiente",
                ahora.toISOString()
            )
            .run();


        // =========================
        // GUARDAR FOTOGRAFÍAS
        // =========================

        for (const item of itemsPreparados) {

            await context.env.DB
                .prepare(`
                    INSERT INTO pedido_items (
                        pedido_id,
                        foto_id,
                        nombre_archivo,
                        cantidad,
                        precio_unitario,
                        subtotal
                    )
                    VALUES (?, ?, ?, ?, ?, ?)
                `)
                .bind(
                    pedidoId,
                    item.foto_id,
                    item.nombre_archivo,
                    item.cantidad,
                    item.precio_unitario,
                    item.subtotal
                )
                .run();

        }


        // =========================
        // RESPUESTA
        // =========================

        return Response.json({

            ok: true,

            pedido_id:
                pedidoId,

            evento_id:
                evento_id,

            total:
                totalCalculado

        });


    } catch (error) {

        console.error(
            "Error al crear pedido:",
            error
        );

        return Response.json({

            ok: false,

            error:
                "No se pudo guardar el pedido."

        }, { status: 500 });

    }

}
