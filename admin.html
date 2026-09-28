<!DOCTYPE html>
<html lang="es">

<head>

    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <title>NOVA MOMENTS — Administración</title>

    <link
        rel="preconnect"
        href="https://fonts.googleapis.com"
    >

    <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossorigin
    >

    <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Montserrat:wght@500;600;700&display=swap"
        rel="stylesheet"
    >

    <style>

        * {
            box-sizing: border-box;
        }

        html,
        body {
            margin: 0;
            padding: 0;
            width: 100%;
            min-height: 100%;
            background: #050505;
            color: #ffffff;
            font-family: "Inter", sans-serif;
        }

        body {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
        }

        .admin-container {
            width: 100%;
            max-width: 420px;
        }

        .logo {
            text-align: center;
            margin-bottom: 42px;
        }

        .logo-nova {
            font-family: "Montserrat", sans-serif;
            font-size: 30px;
            font-weight: 700;
            letter-spacing: 5px;
            margin-bottom: 8px;
        }

        .logo-subtitle {
            font-size: 11px;
            letter-spacing: 3px;
            color: #777777;
            text-transform: uppercase;
        }

        .login-card {
            background: #0d0d0d;
            border: 1px solid #202020;
            border-radius: 18px;
            padding: 32px;
        }

        .login-title {
            font-family: "Montserrat", sans-serif;
            font-size: 21px;
            font-weight: 600;
            margin: 0 0 8px;
        }

        .login-description {
            font-size: 13px;
            line-height: 1.6;
            color: #888888;
            margin: 0 0 28px;
        }

        .field {
            margin-bottom: 18px;
        }

        .field label {
            display: block;
            margin-bottom: 8px;
            font-size: 12px;
            color: #aaaaaa;
        }

        .field input {
            width: 100%;
            height: 48px;
            padding: 0 14px;
            border: 1px solid #292929;
            border-radius: 10px;
            background: #070707;
            color: #ffffff;
            font-family: "Inter", sans-serif;
            font-size: 14px;
            outline: none;
            transition:
                border-color 0.2s ease,
                background 0.2s ease;
        }

        .field input:focus {
            border-color: #555555;
            background: #0a0a0a;
        }

        .field input::placeholder {
            color: #555555;
        }

        .login-button {
            width: 100%;
            height: 50px;
            margin-top: 8px;
            border: none;
            border-radius: 10px;
            background: #ffffff;
            color: #000000;
            font-family: "Montserrat", sans-serif;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 1.5px;
            cursor: pointer;
            transition:
                opacity 0.2s ease,
                transform 0.1s ease;
        }

        .login-button:hover {
            opacity: 0.9;
        }

        .login-button:active {
            transform: scale(0.99);
        }

        .login-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .message {
            display: none;
            margin-top: 16px;
            padding: 13px 14px;
            border-radius: 9px;
            font-size: 12px;
            line-height: 1.5;
            text-align: center;
        }

        .error-message {
            border: 1px solid #3a2020;
            background: #160909;
            color: #d8a0a0;
        }

        .success-message {
            border: 1px solid #203a25;
            background: #09160c;
            color: #a7d8af;
        }

        .footer {
            text-align: center;
            margin-top: 26px;
            color: #444444;
            font-size: 10px;
            letter-spacing: 1px;
        }

        @media (max-width: 480px) {

            body {
                padding: 18px;
            }

            .logo {
                margin-bottom: 32px;
            }

            .logo-nova {
                font-size: 26px;
            }

            .login-card {
                padding: 26px 22px;
                border-radius: 16px;
            }

        }

    </style>

</head>

<body>

    <main class="admin-container">

        <div class="logo">

            <div class="logo-nova">
                NOVA
            </div>

            <div class="logo-subtitle">
                Moments
            </div>

        </div>


        <section class="login-card">

            <h1 class="login-title">
                Administración
            </h1>

            <p class="login-description">
                Acceso privado al panel de gestión de NOVA MOMENTS.
            </p>


            <form id="adminLoginForm">

                <div class="field">

                    <label for="usuario">
                        Usuario
                    </label>

                    <input
                        type="text"
                        id="usuario"
                        name="usuario"
                        placeholder="Usuario"
                        autocomplete="username"
                        required
                    >

                </div>


                <div class="field">

                    <label for="password">
                        Contraseña
                    </label>

                    <input
                        type="password"
                        id="password"
                        name="password"
                        placeholder="Contraseña"
                        autocomplete="current-password"
                        required
                    >

                </div>


                <button
                    type="submit"
                    class="login-button"
                    id="loginButton"
                >
                    INGRESAR
                </button>


                <div
                    class="message error-message"
                    id="errorMessage"
                ></div>


                <div
                    class="message success-message"
                    id="successMessage"
                >
                    ACCESO CORRECTO
                </div>

            </form>

        </section>


        <div class="footer">
            NOVA MOMENTS
        </div>

    </main>


    <script>

        /*
        =========================================================
        NOVA MOMENTS — ADMIN
        LOGIN ADMINISTRATIVO
        =========================================================
        */

        const formulario =
            document.getElementById(
                "adminLoginForm"
            );

        const loginButton =
            document.getElementById(
                "loginButton"
            );

        const errorMessage =
            document.getElementById(
                "errorMessage"
            );

        const successMessage =
            document.getElementById(
                "successMessage"
            );


        formulario.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                errorMessage.style.display =
                    "none";

                successMessage.style.display =
                    "none";


                loginButton.disabled =
                    true;

                loginButton.textContent =
                    "VERIFICANDO...";


                const usuario =
                    document
                        .getElementById(
                            "usuario"
                        )
                        .value
                        .trim();


                const password =
                    document
                        .getElementById(
                            "password"
                        )
                        .value;


                try {

                    const respuesta =
                        await fetch(
                            "/api/admin-login",
                            {
                                method: "POST",

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                credentials:
                                    "include",

                                body:
                                    JSON.stringify({
                                        usuario:
                                            usuario,
                                        password:
                                            password
                                    })
                            }
                        );


                    const datos =
                        await respuesta.json();


                    if (
                        respuesta.ok &&
                        datos.ok
                    ) {

                        successMessage.style.display =
                            "block";

                        loginButton.textContent =
                            "ACCESO CORRECTO";


                        /*
                        -------------------------------------------------
                        POR AHORA NO REDIRIGIMOS.

                        En el siguiente paso construiremos el panel
                        administrativo conectado a D1.
                        -------------------------------------------------
                        */

                    } else {

                        errorMessage.textContent =
                            datos.error ||
                            "Usuario o contraseña incorrectos.";

                        errorMessage.style.display =
                            "block";

                        loginButton.disabled =
                            false;

                        loginButton.textContent =
                            "INGRESAR";

                    }

                } catch (error) {

                    errorMessage.textContent =
                        "No se pudo conectar con el servidor.";

                    errorMessage.style.display =
                        "block";

                    loginButton.disabled =
                        false;

                    loginButton.textContent =
                        "INGRESAR";

                }

            }
        );

    </script>

</body>

</html>
