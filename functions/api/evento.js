export async function onRequestGet(context) {

    try {

        const url = new URL(context.request.url);

        const eventoId =
            url.searchParams.get("evento");

        if (!eventoId) {

            return new Response(
                JSON.stringify({
                    ok: false,
                    error: "No se indicó el evento."
                }),
                {
                    status: 400,
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );

        }

        const resultado =
            await context.env.DB.prepare(`
                SELECT
                    evento_id,
                    nombre,
                    evento,
                    fecha,
                    estado
                FROM eventos
                WHERE evento_id = ?
                LIMIT 1
            `)
            .bind(eventoId)
            .first();

        if (!resultado) {

            return new Response(
                JSON.stringify({
                    ok: false,
                    error: "El evento no existe."
                }),
                {
                    status: 404,
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );

        }

        if (resultado.estado !== "activo") {

            return new Response(
                JSON.stringify({
                    ok: false,
                    error: "El evento no está activo."
                }),
                {
                    status: 403,
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );

        }

        return new Response(
            JSON.stringify({
                ok: true,
                evento: resultado.evento_id,
                nombre: resultado.nombre,
                evento_nombre: resultado.evento,
                fecha: resultado.fecha
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
                error: "Error interno del servidor."
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
