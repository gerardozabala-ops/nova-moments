
export async function onRequestGet(context) {
    const bucket = context.env.VIDEOS;
    const url = new URL(context.request.url);
    const key = url.searchParams.get("key");

    const MAX_RANGE = 64 * 1024 * 1024; // 64 MB

    if (!bucket) {
        return new Response("R2 no está configurado.", {
            status: 500
        });
    }

    if (!key) {
        return new Response("Falta indicar el video.", {
            status: 400
        });
    }

    try {
        const rangeHeader = context.request.headers.get("Range");

        // Conservamos la respuesta completa cuando no hay Range.
        if (!rangeHeader) {
            const objeto = await bucket.get(key);

            if (!objeto) {
                return new Response("Video no encontrado.", {
                    status: 404
                });
            }

            const headers = new Headers();
            objeto.writeHttpMetadata(headers);

            headers.set("Accept-Ranges", "bytes");
            headers.set("Cache-Control", "private, max-age=3600");
            headers.set("Content-Length", objeto.size.toString());

            return new Response(objeto.body, {
                status: 200,
                headers
            });
        }

        // Admitimos un único rango de bytes.
        const match = rangeHeader.match(/^bytes=(\d*)-(\d*)$/);

        if (!match || (!match[1] && !match[2])) {
            return new Response("Range no válido.", {
                status: 416,
                headers: {
                    "Content-Range": "bytes */*"
                }
            });
        }

        // Consultamos el tamaño total real del archivo.
        const metadata = await bucket.head(key);

        if (!metadata) {
            return new Response("Video no encontrado.", {
                status: 404
            });
        }

        const totalSize = metadata.size;

        if (totalSize <= 0) {
            return new Response("Range fuera de los límites del video.", {
                status: 416,
                headers: {
                    "Content-Range": `bytes */${totalSize}`
                }
            });
        }

        const inicioTexto = match[1];
        const finTexto = match[2];

        let inicio;
        let fin;

        if (inicioTexto === "") {
            // Rango por sufijo: bytes=-500000
            const sufijo = Number(finTexto);

            if (!Number.isSafeInteger(sufijo) || sufijo <= 0) {
                return new Response("Range no válido.", {
                    status: 416,
                    headers: {
                        "Content-Range": `bytes */${totalSize}`
                    }
                });
            }

            const longitud = Math.min(
                sufijo,
                MAX_RANGE,
                totalSize
            );

            inicio = totalSize - longitud;
            fin = totalSize - 1;
        } else {
            inicio = Number(inicioTexto);

            if (!Number.isSafeInteger(inicio) || inicio < 0) {
                return new Response("Range no válido.", {
                    status: 416,
                    headers: {
                        "Content-Range": `bytes */${totalSize}`
                    }
                });
            }

            if (inicio >= totalSize) {
                return new Response("Range fuera de los límites del video.", {
                    status: 416,
                    headers: {
                        "Content-Range": `bytes */${totalSize}`
                    }
                });
            }

            const finSolicitado = finTexto === ""
                ? totalSize - 1
                : Number(finTexto);

            if (
                !Number.isSafeInteger(finSolicitado) ||
                finSolicitado < inicio
            ) {
                return new Response("Range no válido.", {
                    status: 416,
                    headers: {
                        "Content-Range": `bytes */${totalSize}`
                    }
                });
            }

            // Limitamos el rango a 64 MB y al final real del archivo.
            fin = Math.min(
                finSolicitado,
                inicio + MAX_RANGE - 1,
                totalSize - 1
            );
        }

        const longitud = fin - inicio + 1;

        const objeto = await bucket.get(key, {
            range: {
                offset: inicio,
                length: longitud
            }
        });

        if (!objeto) {
            return new Response("No se pudo recuperar el rango solicitado.", {
                status: 500
            });
        }

        const headers = new Headers();
        objeto.writeHttpMetadata(headers);

        headers.set("Accept-Ranges", "bytes");
        headers.set("Cache-Control", "private, max-age=3600");
        headers.set("Content-Range", `bytes ${inicio}-${fin}/${totalSize}`);
        headers.set("Content-Length", longitud.toString());

        return new Response(objeto.body, {
            status: 206,
            headers
        });

    } catch (error) {
        return new Response(
            JSON.stringify({
                ok: false,
                error: error.message
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
