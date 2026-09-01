export async function onRequestPost(context) {

    try {

        const datos = await context.request.json();

        const usuario = (datos.usuario || "").trim().toLowerCase();
        const password = (datos.password || "").trim();

        if (!usuario || !password) {
            return Response.json({
                ok: false,
                error: "Faltan datos"
            }, { status: 400 });
        }

        const resultado = await context.env.DB
            .prepare(`
                SELECT evento_id, nombre, evento, fecha
                FROM eventos
                WHERE usuario = ?
                AND password = ?
                AND estado = 'activo'
                LIMIT 1
            `)
            .bind(usuario, password)
            .first();

        if (!resultado) {
            return Response.json({
                ok: false,
                error: "Usuario o contraseña incorrectos."
            }, { status: 401 });
        }

        return Response.json({
            ok: true,
            evento: resultado.evento_id,
            nombre: resultado.nombre,
            evento_nombre: resultado.evento,
            fecha: resultado.fecha
        });

    } catch (error) {

        return Response.json({
            ok: false,
            error: "Error interno."
        }, { status: 500 });

    }

}
