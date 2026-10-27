export async function onRequestGet(context) {

    const { request, env } = context;
    const url = new URL(request.url);

    // =========================
    // 1. OBTENER PARÁMETROS
    // =========================

    const eventoId = (
        url.searchParams.get("evento") || ""
    ).trim();

    const key = (
        url.searchParams.get("key") || ""
    ).trim();


    // =========================
    // 2. VALIDAR PARÁMETROS
    // =========================

    function responder(datos, status = 200) {

        return new Response(
            JSON.stringify(datos),
            {
                status,
                headers: {
                    "Content-Type": "application/json; charset=utf-8",
                    "Cache-Control": "no-store"
                }
            }
        );

    }


    if (!eventoId || !key) {

        return responder({
            ok: false,
            error: "Falta indicar el evento o la imagen."
        }, 400);

    }


    // =========================
    // 3. VALIDAR SERVICIOS
    // =========================

    if (!env.DB || !env.VIDEOS) {

        return responder({
            ok: false,
            error: "La base de datos o el almacenamiento no están configurados."
        }, 500);

    }


    try {

        // =========================
        // 4. VALIDAR EVENTO EN D1
        // =========================

        const evento = await env.DB
            .prepare(`
                SELECT evento_id, tipo_experiencia
                FROM eventos
                WHERE evento_id = ?
                  AND estado = 'activo'
                LIMIT 1
            `)
            .bind(eventoId)
            .first();


        if (!evento) {

            return responder({
                ok: false,
                error: "El evento no existe o no está activo."
            }, 404);

        }


        if (
            String(
                evento.tipo_experiencia || "RECUERDOS"
            ).toUpperCase() !== "RECUERDOS"
        ) {

            return responder({
                ok: false,
                error: "El evento no utiliza la experiencia RECUERDOS."
            }, 403);

        }


        // =========================
        // 5. VALIDAR RUTA DE IMAGEN
        // =========================

        const prefijoEvento = `${eventoId}/`;

        const partes = key.split("/");

        const rutaPermitida =
            key.startsWith(prefijoEvento) &&
            !key.includes("\\") &&
            !partes.some(parte =>
                parte === "." ||
                parte === ".." ||
                parte === ""
            ) &&
            (
                key.startsWith(`${eventoId}/PORTADA/`) ||
                key.startsWith(`${eventoId}/LOGOTIPO/`) ||
                key.startsWith(`${eventoId}/FOTOS/`)
            );


        if (!rutaPermitida) {

            return responder({
                ok: false,
                error: "La ruta solicitada no está permitida."
            }, 403);

        }


        // =========================
        // 6. VALIDAR FORMATO
        // =========================

        const extension = (
            key.match(/\.([^.\/]+)$/) || []
        )[1]?.toLowerCase();


        const tiposImagen = {
            jpg: "image/jpeg",
            jpeg: "image/jpeg",
            png: "image/png",
            webp: "image/webp",
            gif: "image/gif",
            avif: "image/avif"
        };


        if (!extension || !tiposImagen[extension]) {

            return responder({
                ok: false,
                error: "El archivo solicitado no es una imagen permitida."
            }, 415);

        }


        // =========================
        // 7. OBTENER IMAGEN DE R2
        // =========================

        const objeto = await env.VIDEOS.get(key);


        if (!objeto) {

            return responder({
                ok: false,
                error: "No se encontró la imagen solicitada."
            }, 404);

        }


        // =========================
        // 8. ENTREGAR IMAGEN
        // =========================

        const headers = new Headers();

        headers.set(
            "Content-Type",
            objeto.httpMetadata?.contentType ||
                tiposImagen[extension]
        );

        headers.set(
            "Cache-Control",
            "private, max-age=3600"
        );

        headers.set(
            "X-Content-Type-Options",
            "nosniff"
        );


        if (objeto.httpEtag) {

            headers.set(
                "ETag",
                objeto.httpEtag
            );

        }


        return new Response(
            objeto.body,
            {
                status: 200,
                headers
            }
        );


    } catch (error) {

        console.error(
            "Error al recuperar imagen de RECUERDOS:",
            error
        );

        return responder({
            ok: false,
            error: "No se pudo recuperar la imagen."
        }, 500);

    }

}
