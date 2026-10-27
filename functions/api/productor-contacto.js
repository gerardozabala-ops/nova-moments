export async function onRequestGet(context) {

    const { request, env } = context;

    try {

        // =========================
        // 1. OBTENER EVENTO
        // =========================

        const url = new URL(request.url);

        const eventoId = (
            url.searchParams.get("evento") || ""
        ).trim();

        if (!eventoId) {

            return new Response(
                JSON.stringify({
                    ok: false,
                    error: "Falta indicar el evento."
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
        // 2. BUSCAR PRODUCTOR EN D1
        // =========================

        const productor = await env.DB
            .prepare(`
                SELECT
                    productores.productor_id,
                    productores.nombre,
                    productores.telefono
                FROM eventos
                INNER JOIN productores
                    ON eventos.productor_id =
                       productores.productor_id
                WHERE eventos.evento_id = ?
                  AND eventos.estado = 'activo'
                  AND productores.estado = 'activo'
                LIMIT 1
            `)
            .bind(eventoId)
            .first();


        // =========================
        // 3. VERIFICAR RESULTADO
        // =========================

        if (!productor) {

            return new Response(
                JSON.stringify({
                    ok: false,
                    error:
                        "No se encontró un productor activo asociado a este evento."
                }),
                {
                    status: 404,
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );
        }


        // =========================
        // 4. DEVOLVER CONTACTO
        // =========================

        return new Response(
            JSON.stringify({
                ok: true,
                productor: {
                    productor_id:
                        productor.productor_id,

                    nombre:
                        productor.nombre,

                    telefono:
                        productor.telefono || ""
                }
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
            "Error al consultar el contacto del productor:",
            error
        );

        return new Response(
            JSON.stringify({
                ok: false,
                error:
                    "Error al consultar el contacto del productor."
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
