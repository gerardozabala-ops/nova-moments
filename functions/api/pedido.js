export async function onRequestPost(context) {

    try {

        const datos = await context.request.json();

        const {
            evento_id,
            nombre,
            whatsapp,
            email,
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

        const evento = await context.env.DB
            .prepare(`
                SELECT
                    evento_id,
                    evento,
                    estado,
                    precio_foto,
                    productor_id
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
        // PRECIO OFICIAL DE D1
        // =========================

        const precioOficial = Number(evento.precio_foto);


        if (
            !Number.isFinite(precioOficial) ||
            precioOficial < 1
        ) {

            return Response.json({
                ok: false,
                error:
                    "El evento no tiene un precio válido configurado."
            }, { status: 500 });

        }


        // =========================
        // GENERAR ID DEL PEDIDO
        // =========================

        const ahora = new Date();

        const fecha = ahora.toISOString()
            .slice(0, 10)
            .replace(/-/g, "");

        const aleatorio = Math.floor(
            1000 + Math.random() * 9000
        );

        const pedidoId = `PED-${fecha}-${aleatorio}`;


        // =========================
        // CALCULAR TOTAL REAL
        // =========================

        let totalCalculado = 0;

        const itemsPreparados = [];


        for (const item of items) {

            const cantidad = Number(item.cantidad);


            // VALIDAR IDENTIFICADOR DE FOTO

            if (
                !item.foto_id ||
                typeof item.foto_id !== "string" ||
                !item.foto_id.trim()
            ) {

                return Response.json({
                    ok: false,
                    error:
                        "Uno de los artículos no tiene un identificador válido."
                }, { status: 400 });

            }


            // VALIDAR CANTIDAD

            if (
                !Number.isInteger(cantidad) ||
                cantidad < 1
            ) {

                return Response.json({
                    ok: false,
                    error:
                        "Uno de los artículos del pedido no es válido."
                }, { status: 400 });

            }


            // UTILIZAR EL PRECIO OFICIAL DE D1

            const precioUnitario = precioOficial;

            const subtotal = cantidad * precioUnitario;

            totalCalculado += subtotal;

            const identificador = item.foto_id.trim();


            itemsPreparados.push({

                foto_id: identificador,

                nombre_archivo: identificador,

                cantidad: cantidad,

                precio_unitario: precioUnitario,

                subtotal: subtotal

            });

        }


        // =========================
        // GUARDAR PEDIDO EN D1
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
                email ? email.trim() : null,
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
        // NOTIFICAR AL PRODUCTOR
        // =========================
        //
        // El productor se obtiene del evento
        // consultado en D1.
        //
        // Si Push falla, el pedido permanece
        // registrado y la respuesta al cliente
        // sigue funcionando.
        // =========================

        try {

            const productorId = String(
                evento.productor_id || ""
            ).trim();


            if (!productorId) {

                console.error(
                    "No se puede enviar Push: " +
                    "el evento no tiene productor_id.",
                    {
                        evento_id: evento_id,
                        pedido_id: pedidoId
                    }
                );

            } else {

                const urlBase = new URL(
                    context.request.url
                );


                const pushResponse = await fetch(
                    new URL(
                        "/api/push-enviar",
                        urlBase.origin
                    ),
                    {
                        method: "POST",

                        headers: {
                            "Content-Type": "application/json"
                        },

                        body: JSON.stringify({

                            productor_id: productorId,

                            titulo: "🔔 Nuevo pedido de RECUERDOS",

                            mensaje:
                                "Tenés un nuevo pedido para el evento " +
                                (evento.evento || evento_id) +
                                ". Pedido: " +
                                pedidoId,

                            url: "/productor.html"

                        })
                    }
                );


                const pushResultado =
                    await pushResponse.json();


                console.log(
                    "Resultado de notificación Push:",
                    {
                        pedido_id: pedidoId,
                        evento_id: evento_id,
                        productor_id: productorId,
                        http_status: pushResponse.status,
                        resultado: pushResultado
                    }
                );

            }

        } catch (errorPush) {

            console.error(
                "Error al solicitar notificación Push:",
                {
                    pedido_id: pedidoId,
                    evento_id: evento_id,
                    error: errorPush.message
                }
            );

        }


        // =========================
        // RESPUESTA AL CLIENTE
        // =========================

        return Response.json({

            ok: true,

            pedido_id: pedidoId,

            evento_id: evento_id,

            total: totalCalculado

        });


    } catch (error) {

        console.error(
            "Error al crear pedido:",
            error
        );


        return Response.json({

            ok: false,

            error: "No se pudo guardar el pedido."

        }, { status: 500 });

    }

}
