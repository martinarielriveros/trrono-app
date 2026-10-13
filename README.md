# Tronno - Marketplace de Baños en Argentina 🇦🇷🚽

**Tronno** es una Progressive Web App (PWA) de nivel productivo para la reserva, pago y uso de baños higiénicos y seguros en Argentina. 

- **Usuarios:** Encuentran baños cercanos en el mapa o lista (Leaflet + OpenStreetMap + PostGIS), eligen extras (como ducha o toallas), reservan y pagan en pesos argentinos vía Mercado Pago Checkout Pro, y acceden con un código QR firmado o código numérico de respaldo.
- **Vendedores:** Publican sus baños con fotos (Cloudinary), ubicación geográfica precisa, reglas, horarios semanales, duración de turno (ej. 15 min), precio base (respetando el precio mínimo fijado por el admin) y extras cobrables. Validan la entrada escaneando el QR del usuario con la cámara del celular.
- **Administrador:** Actúa como intermediario central de confianza, recauda el 100% de los pagos a través de una cuenta única de Mercado Pago, gestiona aprobaciones (vendedores, baños y atributos propuestos), supervisa cancelaciones o reservas expiradas sin uso, define comisiones y penalidades, y liquida manualmente transferencias a los CBU/CVU de los vendedores.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología | Detalle |
| :--- | :--- | :--- |
| **Frontend** | React 18 + Vite + TypeScript | PWA instalable (`vite-plugin-pwa`), Tailwind CSS, TanStack Query, React Router |
| **Mobile UX** | Mobile-first para Usuarios y Vendedores | Diseño optimizado para celulares; panel Administrador en formato Desktop Web |
| **Mapas & Geo** | Leaflet + OpenStreetMap + Nominatim | Búsqueda por proximidad con consultas espaciales en PostGIS |
| **Backend** | FastAPI (Python 3.12) | SQLAlchemy 2.x, Alembic, Pydantic v2, APScheduler para tareas en segundo plano |
| **Base de Datos** | PostgreSQL 16 + PostGIS 3.4 | Contenedor local en Docker; Neon serverless para Staging y Producción |
| **Pagos** | Mercado Pago Argentina Checkout Pro | Recaudación centralizada admin. Modo `PAYMENTS_MODE=mock` para desarrollo local |
| **Fotos** | Cloudinary (Plan Free) | Firmas seguras desde backend, almacenamiento de URLs y public_ids |
| **Hosting** | Render | Blueprint `render.yaml`: Static Site (Frontend) + Web Service (Backend) |
| **CI/CD** | GitHub Actions | Linters (ruff), tests (pytest con PostGIS, vitest), typecheck y build |
| **Idioma & Moneda** | es-AR (Rioplatense "vos") | Moneda oficial ARS (`$ 1.234,50`), Zona horaria: `America/Argentina/Buenos_Aires` |

---

## 🚀 Guía de Instalación y Ejecución Local (Windows + Docker)

### Requisitos previos en Windows
1. **Git for Windows** (con soporte de terminaciones de línea LF configurado en `.gitattributes`).
2. **Docker Desktop for Windows** con backend de WSL 2 activado y funcionando.
3. **Node.js 20+ / 24+** y **Python 3.12+** (para desarrollo fuera de contenedor o ejecución directa de scripts).

---

### Paso a paso para iniciar el entorno local

#### 1. Clonar el repositorio y configurar variables de entorno
Abrí una terminal PowerShell en Windows:
```powershell
# Clonar o ubicarse en el directorio del proyecto
cd c:\Users\user\.gemini\antigravity\scratch\tronno-app\trrono-app

# Copiar el archivo de variables de entorno de ejemplo
Copy-Item .env.example .env
```

#### 2. Iniciar todos los servicios con Docker Compose
```powershell
docker compose up --build
```

Esto iniciará de forma coordinada:
- **`tronno-db`**: PostgreSQL 16 con extensión PostGIS en el puerto `5432`.
- **`tronno-backend`**: FastAPI con hot-reload en `http://localhost:8000`.
- **`tronno-frontend`**: Vite dev server con hot-reload en `http://localhost:5173`.

#### 3. Aplicar migraciones y ejecutar el seed inicial
En otra ventana de terminal:
```powershell
# Ejecutar migraciones de base de datos
docker compose exec backend alembic upgrade head

# Ejecutar script de seed de datos iniciales
docker compose exec backend python -m app.seed
```

#### 4. Accesos locales
- **Aplicación Frontend (PWA):** [http://localhost:5173](http://localhost:5173)
  - Área Usuario: `http://localhost:5173/usuario`
  - Área Vendedor: `http://localhost:5173/vendedor`
  - Panel Administrador: `http://localhost:5173/admin`
- **Documentación OpenAPI Swagger del Backend:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Endpoint de Salud (Health Check):** [http://localhost:8000/health](http://localhost:8000/health)

---

## 🧪 Cómo Ejecutar las Pruebas (Tests) y Linters

### Backend
En contenedor o con entorno virtual activo:
```powershell
# Ejecutar linters (Ruff)
docker compose exec backend ruff check .
docker compose exec backend ruff format --check .

# Ejecutar suite de pruebas con pytest
docker compose exec backend pytest -v
```

### Frontend
```powershell
# Dentro de la carpeta /frontend
cd frontend
npm install

# Verificación de tipos TypeScript
npm run lint

# Pruebas unitarias y de componentes (Vitest)
npm run test

# Compilación de producción
npm run build
```

---

## 🔄 Flujo de Trabajo Diario: Ramas y Despliegue (GitFlow Simplificado)

1. **Crear rama de funcionalidad:**
   Partir siempre desde `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feat/nombre-funcionalidad
   ```
2. **Desarrollo y pruebas locales:**
   Hacer commits atómicos. Verificar que `pytest` y `npm run test` pasen localmente.
3. **Pull Request a `develop` (Staging):**
   - Se abre un PR hacia `develop`.
   - GitHub Actions ejecuta automáticamente linters y tests con PostGIS.
   - Al mergear, Render despliega automáticamente en el ambiente **Staging**.
4. **Validación en Staging y Promoción a `main` (Producción):**
   - Una vez probado en Staging, se abre un PR de `develop` a `main`.
   - Al aprobarse y pasar los checks de CI, Render ejecuta `alembic upgrade head` y publica en **Producción**.

---

## 🌐 Configuración de Servicios Externos (Paso a Paso)

### 1. GitHub (Repositorio y Reglas de Protección)
1. Creá el repositorio en GitHub: `tronno-app`.
2. Creá dos ramas permanentes: `main` (producción) y `develop` (staging).
3. Andá a **Settings > Branches > Branch protection rules** y agregá reglas para `main` y `develop`:
   - Activar **"Require a pull request before merging"**.
   - Activar **"Require status checks to pass before merging"** y seleccionar los jobs de GitHub Actions: `Backend Lint & Tests` y `Frontend Lint, Typecheck & Tests`.

### 2. Neon (Base de Datos PostgreSQL Serverless con PostGIS)
1. Creá una cuenta en [Neon.tech](https://neon.tech).
2. Creá un nuevo proyecto llamado `tronno-db`.
3. En la rama `main` (Producción), andá a la consola SQL y ejecutá:
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   ```
4. Creá una rama secundaria llamada `develop` para el entorno de Staging.
5. Copiá la Connection String de cada rama (formato `postgresql://...`). Recordá configurar en el backend la variable `DATABASE_URL` correspondiente.

### 3. Render (Despliegue con Blueprint render.yaml)
1. Creá una cuenta en [Render.com](https://render.com).
2. Andá a **Blueprints > New Blueprint Instance**.
3. Conectá el repositorio de GitHub.
4. Render leerá `render.yaml` y detectará automáticamente:
   - Web Service: `tronno-backend` (con comando pre-deploy `alembic upgrade head`).
   - Static Site: `tronno-frontend` (con rewrites SPA hacia `/index.html`).
5. En la configuración de cada servicio en Render, vinculá la rama:
   - Para Staging: apuntar al branch `develop`.
   - Para Producción: apuntar al branch `main`.
6. En **Settings**, activá la casilla **"Auto-Deploy: Yes (after CI checks pass)"**.
> **Nota sobre el Plan Free de Render:** Los Web Services gratuitos entran en suspensión tras 15 minutos de inactividad y tardan ~50 segundos en reanudar ante la primera petición.

### 4. Mercado Pago Argentina (Checkout Pro)
1. Ingresá a [Mercado Pago Developers Argentina](https://www.mercadopago.com.ar/developers).
2. Andá a **Tus integraciones > Crear aplicación**.
   - Nombre: `Tronno`.
   - Tipo: `Checkout Pro`.
3. Andá a **Credenciales de prueba** y copiá:
   - `MERCADO_PAGO_PUBLIC_KEY` (comienza con `TEST-...`)
   - `MERCADO_PAGO_ACCESS_TOKEN` (comienza con `TEST-...`)
4. En **Notificaciones Webhooks**:
   - URL de producción: `https://tronno-backend.onrender.com/api/v1/payments/webhook`
   - Para pruebas locales: usá ngrok (ejemplo: `https://xxxx.ngrok-free.app/api/v1/payments/webhook`).
   - Copiá la clave secreta de firma en `MERCADO_PAGO_WEBHOOK_SECRET`.
5. **Modo Mock Local:** Para desarrollar sin necesidad de ngrok ni tarjetas reales, mantené `PAYMENTS_MODE=mock`. En este modo, el sistema proporciona botones para simular cobros aprobados y rechazados directamente.

### 5. Google OAuth 2.0 (Inicio de Sesión con Google)
1. Ingresá a [Google Cloud Console](https://console.cloud.google.com/).
2. Creá un proyecto llamado `Tronno`.
3. Andá a **APIs & Services > OAuth consent screen**:
   - Tipo de usuario: Externo.
   - Nombre de la app: `Tronno Argentina`.
   - Correo de contacto del desarrollador.
4. Andá a **Credentials > Create Credentials > OAuth client ID**:
   - Tipo de aplicación: Web application.
   - Orígenes de JavaScript autorizados:
     - `http://localhost:5173` (local)
     - `https://tronno-frontend.onrender.com` (producción)
   - URIs de redireccionamiento autorizados:
     - `http://localhost:5173/auth/callback`
     - `https://tronno-frontend.onrender.com/auth/callback`
5. Copiá el Client ID en `GOOGLE_CLIENT_ID` y el Client Secret en `GOOGLE_CLIENT_SECRET`.

### 6. Cloudinary (Almacenamiento de Fotos)
1. Registrate en [Cloudinary](https://cloudinary.com) en el plan gratuito.
2. Desde el Dashboard, copiá:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
3. En **Settings > Upload**, creá un upload preset con modo de firma activado (signed uploads gestionados desde el backend).

### 7. Servidor SMTP / Correo Electrónico
- **En desarrollo local:** Con `EMAILS_TO_CONSOLE=true`, todos los códigos de confirmación y restablecimiento de contraseña se imprimen formateados en la terminal del backend.
- **En producción:** Configurar `EMAILS_TO_CONSOLE=false` y completar `SMTP_HOST`, `SMTP_PORT` (ej. 587 con TLS), `SMTP_USER` y `SMTP_PASSWORD` (usando proveedores como Resend, Sendgrid o Brevo).

### 8. Pasaje a Credenciales Productivas
Cuando el producto esté listo para operar con dinero real:
1. En Mercado Pago Developers, completá los requisitos comerciales y copiá las **Credenciales de Producción** (`APP_USR-...`).
2. Actualizá en Render las variables de entorno de producción:
   - Cambiá `PAYMENTS_MODE` de `mock` a `live`.
   - Reemplazá `MERCADO_PAGO_ACCESS_TOKEN` y `MERCADO_PAGO_PUBLIC_KEY`.
3. Verificá que la URL de webhook en producción reciba las notificaciones `payment` con firma HMAC activa.

---

## 💳 Cómo Probar un Pago de Punta a Punta

1. En la aplicación, ingresá al buscador y elegí un baño con disponibilidad horaria.
2. Seleccioná el turno deseado y los extras opcionales (ej. toallas o ducha).
3. Hacé clic en **"Reservar y Pagar"**:
   - En **Modo Mock (`PAYMENTS_MODE=mock`)**: Se muestra un modal de pago simulado con los botones *"Simular Pago Exitoso"* y *"Simular Pago Rechazado"*. Al presionar *"Simular Pago Exitoso"*, el backend procesa el webhook simulado y genera inmediatamente el QR.
   - En **Modo Live con Checkout Pro**: El sistema te redirige a la pasarela de Mercado Pago. Con una cuenta de prueba de comprador y tarjeta de prueba oficial de Mercado Pago, aprobás la operación y retornás a Tronno.
4. Ingresá a **"Mis reservas"** en el Área de Usuario: el estado cambiará a `pagada` y verás el código QR de acceso junto con el código numérico de 6 dígitos.
5. Desde el Área de Vendedor, abrí la cámara en el escáner QR o ingresá el código de 6 dígitos para validar la entrada y activar el turno en curso.

---

## ❓ Preguntas Frecuentes y Solución de Problemas (Troubleshooting)

- **Docker Desktop no inicia en Windows:** Asegurate de que el servicio WSL 2 esté instalado (`wsl --update` en PowerShell como Administrador) y que la virtualización VT-x/AMD-V esté habilitada en la BIOS de tu computadora.
- **Error de fin de línea (CRLF vs LF):** Si un script en Linux o contenedor arroja `\r: command not found`, ejecutá `git config --global core.autocrlf false` y asegurate de que `.gitattributes` esté aplicado.
- **Error de conexión a la Base de Datos:** Verificá que el contenedor `tronno-db` esté en estado `healthy` mediante `docker compose ps`. La cadena de conexión en local debe ser `postgresql+psycopg://tronno_user:tronno_password@localhost:5432/tronno_db`, y dentro de contenedores el host debe ser `db`.
- **Error con PostGIS en Neon:** Si una migración falla al buscar tipos geográficos, asegurate de haber ejecutado `CREATE EXTENSION IF NOT EXISTS postgis;` en la consola SQL de la rama correspondiente de Neon.
