self.addEventListener("install", function (event) {

    self.skipWaiting();

});


self.addEventListener("activate", function (event) {

    event.waitUntil(
        self.clients.claim()
    );

});


self.addEventListener("push", function (event) {

    let datos = {};

    try {
        datos = event.data
            ? event.data.json()
            : {};
    } catch (error) {
        datos = {
            titulo: "NOVA MOMENTS",
            mensaje: event.data
                ? event.data.text()
                : "Tenés una nueva notificación."
        };
    }

    const titulo =
        datos.titulo ||
        "NOVA MOMENTS";

    const opciones = {

        body:
            datos.mensaje ||
            "Tenés un nuevo pedido.",

        icon:
            "/icon-192.png",

        badge:
            "/icon-192.png",

        data: {
            url:
                datos.url ||
                "/productor.html"
        }

    };

    event.waitUntil(

        self.registration.showNotification(
            titulo,
            opciones
        )

    );

});


self.addEventListener(
    "notificationclick",
    function (event) {

        event.notification.close();

        const url =
            event.notification.data &&
            event.notification.data.url
                ? event.notification.data.url
                : "/productor.html";

        event.waitUntil(

            clients.matchAll({
                type: "window",
                includeUncontrolled: true
            }).then(function (ventanas) {

                for (const ventana of ventanas) {

                    if ("focus" in ventana) {

                        ventana.navigate(url);

                        return ventana.focus();

                    }

                }

                if (clients.openWindow) {

                    return clients.openWindow(url);

                }

            })

        );

    }
);
