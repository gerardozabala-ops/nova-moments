export async function onRequestPost(context) {

    try {

        // =========================
        // LEER DATOS RECIBIDOS
        // =========================

        const datos =
            await context.request.json();

        const pedidoId =
            (datos.pedido_id || "").trim();


        if (!pedidoId) {

            return Response.json({

                ok: false,

                error:
                    "Falta indicar el pedido."

            }, { status: 400 });

        }


        // =========================
        // VERIFICAR TOKEN
        // =========================

        const accessToken =
            context.env.MP_ACCESS_TOKEN;


        if (!accessToken) {

            console.error(
                "Falta MP_ACCESS_TOKEN."
            );

            return Response.json({

                ok: false,

                error:
                    "Mercado Pago no está configurado."

            }, { status: 500 });

        }


        // =========================
        // BUSCAR PEDIDO
        // =========================

        const pedido =
            await context.env.DB
                .prepare(`
                    SELECT
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
                    WHERE pedido_id = ?
                    LIMIT 1
                `)
                .bind(pedidoId)
                .first();


        if (!pedido) {

            return Response.json({

                ok: false,

                error:
                    "El pedido no existe."

            }, { status: 404 });

        }


        // =========================
        // VERIFICAR ESTADO
        // =========================

        if (
            pedido.estado_pago &&
            pedido.estado_pago !== "pendiente"
        ) {

            return Response.json({

                ok: false,

                error:
                    "Este pedido ya tiene un estado de pago diferente de pendiente."

            }, { status: 409 });

        }


        // =========================
        // BUSCAR ITEMS
        // =========================

        const resultadoItems =
            await context.env.DB
                .prepare(`
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
                .bind(pedidoId)
                .all();


        const itemsDB =
            resultadoItems.results || [];


        if (itemsDB.length === 0) {

            return Response.json({

                ok: false,

                error:
                    "El pedido no contiene fotografías."

            }, { status: 400 });

        }


        // =========================
        // CONSTRUIR ITEMS
        // =========================
        //
        // IMPORTANTE:
        //
        // Los precios salen de D1.
        //
        // No confiamos en datos enviados
        // nuevamente desde el navegador.
        //
        // Tampoco enviamos el nombre real
        // del archivo de la fotografía a
        // Mercado Pago.
        // =========================

        const items =
            itemsDB.map(
                (item, indice) => {

                    return {

                        id:
                            `foto-${indice + 1}`,

                        title:
                            "Fotografía",

                        description:
                            `Fotografía seleccionada - ${pedido.evento_id}`,

                        quantity:
                            Number(item.cantidad),

                        currency_id:
                            "ARS",

                        unit_price:
                            Number(
                                item.precio_unitario
                            )

                    };

                }
            );


        // =========================
        // VALIDAR ITEMS
        // =========================

        for (const item of items) {

            if (
                !Number.isInteger(item.quantity) ||
                item.quantity < 1
            ) {

                return Response.json({

                    ok: false,

                    error:
                        "El pedido contiene una cantidad inválida."

                }, { status: 400 });

            }


            if (
                !Number.isFinite(
                    item.unit_price
                ) ||
                item.unit_price < 1
            ) {

                return Response.json({

                    ok: false,

                    error:
                        "El pedido contiene un precio inválido."

                }, { status: 400 });

            }

        }


        // =========================
        // CALCULAR TOTAL
        // =========================

        const totalCalculado =
            items.reduce(
                (
                    acumulado,
                    item
                ) => {

                    return acumulado +
                        (
                            item.quantity *
                            item.unit_price
                        );

                },
                0
            );


        // =========================
        // COMPROBAR TOTAL
        // =========================

        if (
            totalCalculado !==
            Number(pedido.total)
        ) {

            console.error(
                "Diferencia de total:",
                {
                    pedido: pedido.total,
                    calculado: totalCalculado
                }
            );

            return Response.json({

                ok: false,

                error:
                    "El total del pedido no coincide con sus artículos."

            }, { status: 409 });

        }


        // =========================
        // CREAR PREFERENCIA
        // =========================

        const preferencia = {

            items:
                items,

            external_reference:
                pedido.pedido_id,

            payer: {

                name:
                    pedido.nombre,

                email:
                    pedido.email || undefined

            }

        };


        // =========================
        // ENVIAR A MERCADO PAGO
        // =========================

        const respuesta =
            await fetch(
                "https://api.mercadopago.com/checkout/preferences",
                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${accessToken}`

                    },

                    body:
                        JSON.stringify(
                            preferencia
                        )

                }
            );


        const resultado =
            await respuesta.json();


        // =========================
        // ERROR MERCADO PAGO
        // =========================

        if (!respuesta.ok) {

            console.error(
                "Error Mercado Pago:",
                resultado
            );

            return Response.json({

                ok: false,

                error:
                    "Mercado Pago rechazó la creación del pago."

            }, { status: 502 });

        }


        // =========================
        // RESPUESTA A NOVA
        // =========================

        return Response.json({

            ok: true,

            pedido_id:
                pedido.pedido_id,

            preference_id:
                resultado.id || null,

            init_point:
                resultado.init_point || null,

            sandbox_init_point:
                resultado.sandbox_init_point ||
                null,

            total:
                totalCalculado

        });


    } catch (error) {

        console.error(
            "Error en /api/crear-pago:",
            error
        );


        return Response.json({

            ok: false,

            error:
                "No se pudo crear el pago."

        }, { status: 500 });

    }

}
