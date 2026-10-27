export async function onRequestGet(context) {

    const { request, env } = context;
    const url = new URL(request.url);

    const eventoId = (
        url.searchParams.get("evento") || ""
    ).trim();


    // =========================
    // RESPUESTA JSON
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


    // =========================
    // VALIDAR EVENTO
    // =========================

    if (!eventoId) {

        return responder({
            ok: false,
            error: "Falta indicar el evento."
        }, 400);

    }


    // =========================
    // VALIDAR SERVICIOS
    // =========================

    if (!env.DB || !env.VIDEOS) {

        return responder({
            ok: false,
            error: "La base de datos o el bucket R2 no están configurados."
        }, 500);

    }


    try {

        // =========================
        // COMPROBAR EVENTO EN D1
        // =========================

        const evento = await env.DB
            .prepare(`
                SELECT
                    evento_id,
                    tipo_experiencia
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
                error: "Este evento no utiliza la experiencia RECUERDOS."
            }, 400);

        }


        // =========================
        // LISTAR ARCHIVOS DE R2
        // =========================

        const prefijo = `${eventoId}/`;

        const objetos = await listarObjetos(
            env.VIDEOS,
            prefijo
        );


        // =========================
        // PORTADA
        // =========================

        const portada = objetos

            .filter(objeto =>
                objeto.key.startsWith(
                    `${prefijo}PORTADA/`
                ) &&
                esImagen(objeto.key)
            )

            .sort(ordenarPorNombre)

            .map(objeto =>
                convertirImagen(
                    objeto.key,
                    eventoId
                )
            );


        // =========================
        // LOGOTIPO
        // =========================

        const logo = objetos

            .filter(objeto =>
                objeto.key.startsWith(
                    `${prefijo}LOGOTIPO/`
                ) &&
                esImagen(objeto.key)
            )

            .sort(ordenarPorNombre)

            .map(objeto =>
                convertirImagen(
                    objeto.key,
                    eventoId
                )
            );


        // =========================
        // TODAS LAS FOTOGRAFÍAS
        // =========================

        const fotos = objetos

            .filter(objeto =>
                objeto.key.startsWith(
                    `${prefijo}FOTOS/`
                ) &&
                esImagen(objeto.key)
            )

            .sort(ordenarPorNombre)

            .map(objeto =>
                convertirImagen(
                    objeto.key,
                    eventoId
                )
            );


        // =========================
        // AGRUPAR FOTOS POR GALERÍA
        // =========================

        const fotosSecciones = agruparFotosPorSeccion(
            objetos,
            eventoId
        );


        // =========================
        // VIDEOS UBICADOS EN LA
        // RAÍZ DEL EVENTO EN R2
        // =========================

        const r2Videos = objetos

            .filter(objeto => {

                if (
                    !objeto.key.startsWith(prefijo) ||
                    !esVideo(objeto.key)
                ) {
                    return false;
                }

                const resto =
                    objeto.key.substring(
                        prefijo.length
                    );

                // Solo videos ubicados directamente
                // dentro de la carpeta del evento.

                return (
                    resto.length > 0 &&
                    !resto.includes("/")
                );

            })

            .sort(ordenarPorNombre)

            .map(objeto =>
                convertirVideo(
                    objeto.key,
                    eventoId
                )
            );


        // =========================
        // RESPUESTA PARA RECUERDOS
        // =========================

        return responder({

            ok: true,

            evento: eventoId,

            portada: portada,

            logo: logo,

            fotos: fotos,

            fotos_secciones: fotosSecciones,

            videos: [],

            r2_videos: r2Videos

        });


    } catch (error) {

        console.error(
            "Error al cargar multimedia de RECUERDOS:",
            error
        );

        return responder({
            ok: false,
            error: "No se pudo cargar el contenido multimedia del evento."
        }, 500);

    }

}


// ======================================
// LISTAR OBJETOS DE R2
// ======================================

async function listarObjetos(
    bucket,
    prefix
) {

    const objetos = [];

    let cursor;

    do {

        const pagina = await bucket.list({

            prefix: prefix,

            limit: 1000,

            ...(cursor ? { cursor: cursor } : {})

        });


        objetos.push(
            ...(pagina.objects || [])
        );


        cursor = pagina.truncated
            ? pagina.cursor
            : undefined;

    } while (cursor);


    return objetos;

}


// ======================================
// RECONOCER FORMATOS DE ARCHIVO
// ======================================

function esImagen(key) {

    return /\.(avif|gif|jpe?g|png|webp)$/i.test(key);

}


function esVideo(key) {

    return /\.(mp4|webm|mov|m4v|ogg)$/i.test(key);

}


// ======================================
// NOMBRE DEL ARCHIVO
// ======================================

function nombreArchivo(key) {

    return key.split("/").pop() || key;

}


// ======================================
// OBTENER NÚMERO DEL NOMBRE
// ======================================

function obtenerNumero(nombre) {

    const numeros = nombre.match(/\d+/g);

    return numeros
        ? Number(numeros[numeros.length - 1])
        : Number.MAX_SAFE_INTEGER;

}


// ======================================
// ORDENAR ARCHIVOS NUMÉRICAMENTE
// ======================================

function ordenarPorNombre(a, b) {

    const nombreA = nombreArchivo(a.key);

    const nombreB = nombreArchivo(b.key);

    const diferencia =
        obtenerNumero(nombreA) -
        obtenerNumero(nombreB);


    if (diferencia !== 0) {

        return diferencia;

    }


    return nombreA.localeCompare(
        nombreB,
        undefined,
        {
            numeric: true,
            sensitivity: "base"
        }
    );

}


// ======================================
// CONVERTIR IMAGEN A FORMATO NOVA
// ======================================

function convertirImagen(
    key,
    eventoId
) {

    return {

        public_id: key,

        asset_folder: key
            .split("/")
            .slice(0, -1)
            .join("/"),

        resource_type: "image",

        format: obtenerExtension(key),

        secure_url:
            `/api/imagen-recuerdos?evento=${encodeURIComponent(eventoId)}` +
            `&key=${encodeURIComponent(key)}`,

        filename: nombreArchivo(key)

    };

}


// ======================================
// CONVERTIR VIDEO A FORMATO NOVA
// ======================================

function convertirVideo(
    key,
    eventoId
) {

    return {

        public_id: key,

        asset_folder: `${eventoId}/VIDEOS`,

        resource_type: "video",

        format: obtenerExtension(key),

        secure_url:
            `/api/video?key=${encodeURIComponent(key)}`,

        filename: nombreArchivo(key)

    };

}


// ======================================
// OBTENER EXTENSIÓN
// ======================================

function obtenerExtension(key) {

    const coincidencia =
        key.match(/\.([^.]+)$/);

    return coincidencia
        ? coincidencia[1].toLowerCase()
        : "";

}


// ======================================
// AGRUPAR FOTOGRAFÍAS POR SECCIÓN
// ======================================

function agruparFotosPorSeccion(
    objetos,
    eventoId
) {

    const prefijo = `${eventoId}/FOTOS/`;

    const grupos = new Map();


    for (const objeto of objetos) {

        if (
            !objeto.key.startsWith(prefijo) ||
            !esImagen(objeto.key)
        ) {

            continue;

        }


        const resto =
            objeto.key.substring(
                prefijo.length
            );


        const partes = resto.split("/");


        // La primera carpeta dentro de FOTOS
        // identifica el nombre de la galería.

        if (
            partes.length < 2 ||
            !partes[0]
        ) {

            continue;

        }


        const seccion = partes[0];


        if (!grupos.has(seccion)) {

            grupos.set(
                seccion,
                []
            );

        }


        grupos.get(seccion).push(
            objeto
        );

    }


    return [...grupos.keys()]

        .sort((a, b) =>
            a.localeCompare(
                b,
                undefined,
                {
                    numeric: true,
                    sensitivity: "base"
                }
            )
        )

        .map(nombre => ({

            nombre: nombre,

            fotos: grupos.get(nombre)

                .sort(ordenarPorNombre)

                .map(objeto =>
                    convertirImagen(
                        objeto.key,
                        eventoId
                    )
                )

        }));

}
