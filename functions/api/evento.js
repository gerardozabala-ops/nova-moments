export async function onRequestGet(context) {

    try {

        const url =
            new URL(context.request.url);

        const eventoId =
            url.searchParams.get("evento");


        // =========================
        // VALIDAR EVENTO
        // =========================

        if (!eventoId) {

            return Response.json({
                ok: false,
                error: "Falta indicar el evento."
            }, { status: 400 });

        }


        // =========================
        // BUSCAR EVENTO EN D1
        // =========================

        const resultado =
            await context.env.DB
                .prepare(`
                    SELECT
                        evento_id,
                        nombre,
                        evento,
                        fecha,
                        estado,
                        precio_foto,
                        tamano_producto
                    FROM eventos
                    WHERE evento_id = ?
                    LIMIT 1
                `)
                .bind(eventoId)
                .first();


        // =========================
        // EVENTO NO EXISTE
        // =========================

        if (!resultado) {

            return Response.json({
                ok: false,
                error: "El evento no existe."
            }, { status: 404 });

        }


        // =========================
        // EVENTO INACTIVO
        // =========================

        if (resultado.estado !== "activo") {

            return Response.json({
                ok: false,
                error: "El evento no está activo."
            }, { status: 403 });

        }


        // =========================
        // RESPUESTA
        // =========================

        return Response.json({

            ok: true,

            evento:
                resultado.evento_id,

            nombre:
                resultado.nombre,

            evento_nombre:
                resultado.evento,

            fecha:
                resultado.fecha,

            precio_foto:
                resultado.precio_foto,

            tamano_producto:
                resultado.tamano_producto

        });


    } catch (error) {

        console.error(
            "Error al obtener evento:",
            error
        );

        return Response.json({

            ok: false,

            error:
                "Error interno al obtener el evento."

        }, { status: 500 });

    }

}
