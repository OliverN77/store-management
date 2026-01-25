# Despliegue con Docker (Windows PowerShell)

Estos pasos crean y levantan los contenedores para el backend (Express), frontend (React) y una instancia opcional de Microsoft SQL Server usando `docker-compose`.

1) Prerrequisitos
- Docker Desktop instalado y corriendo en Windows.
- (Opcional) SQL Server Management Studio (SSMS) para administrar la base de datos.

2) Configurar variables de entorno
- Copia el ejemplo de env del backend y edítalo:

```powershell
cd "c:\Users\Oliver\Documents\Proyectos\En curso\storeManagement\back"
cp .env.example .env
notepad .env
```

Rellena las variables como DB_NAME, DB_USER, DB_PASSWORD. Por defecto el `docker-compose.yml` configura un contenedor `db` con el usuario `sa` y la contraseña `YourStrong!Passw0rd` (cámbiala).

IMPORTANTE: si tu `back/.env.example` tiene valores personalizados (por ejemplo un servidor o contraseña local), asegúrate de cambiarlos a valores coherentes antes de levantar los contenedores. El `back/.env.example` incluido ahora usa:

- PORT=3001 (coincide con `app.js`)
- DB_SERVER=db (para conectar al servicio `db` del docker-compose)

Si prefieres que el backend se conecte a un SQL Server que corre en Windows (no en contenedor), pon en tu `back/.env`:

- DB_SERVER=host.docker.internal

Esto permite que el contenedor acceda al SQL Server del host.

3) Construir y levantar con docker-compose

Desde la raíz del proyecto:

```powershell
cd "c:\Users\Oliver\Documents\Proyectos\En curso\storeManagement"
docker-compose build
docker-compose up -d
```

Esto expondrá:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- SQL Server: puerto 1433 en el host (si usas el servicio `db`), conectar via localhost, usuario `sa`.

4) Conectar SSMS
- Si usas el contenedor `db` incluido, en SSMS conecta a: Server name = localhost, Authentication = SQL Server Authentication, Login = sa, Password = (la contraseña que configuraste).
- Si prefieres usar una base de datos que corre en tu máquina host y quieres que los contenedores se conecten al host, usa en `back/.env` `DB_SERVER=host.docker.internal`. Esto hace que el contenedor consulte el SQL Server que corre en Windows.

Opciones de despliegue (actualizadas)

- Opción A — Usar SQL Server que ya está en tu Windows (recomendado si tienes datos locales):

	1. Asegúrate de que SQL Server en Windows tenga TCP/IP habilitado y que puedas conectar desde SSMS.
	2. Edita `back/.env` y asigna `DB_SERVER=host.docker.internal` y la contraseña correcta.
	3. Desde la raíz ejecuta:

```powershell
docker-compose build
docker-compose up -d
```

Esto levantará `front` y `back` y el backend se conectará a la DB del host.

- Opción B — Levantar también SQL Server en un contenedor (opcional, crea una DB nueva):

	1. Si quieres levantar SQL Server en Docker (esto creará/usar un volumen llamado `mssqldata`):

```powershell
# Levantar la DB y la app en docker
docker-compose -f docker-compose.yml -f docker-compose.db.yml build
docker-compose -f docker-compose.yml -f docker-compose.db.yml up -d
```

	2. Los servicios incluirán el contenedor `db` y el backend se conectará a `db:1433`.

Nota: levantar la DB en contenedor puede crear una base de datos vacía o sobrescribir configuraciones locales; si tienes datos en tu SQL Server local y no quieres perderlos, usa la Opción A.

5) Notas de seguridad y producción
- No uses contraseñas por defecto en producción.
- Para producción considera separar servicios y usar orquestadores (Swarm/Kubernetes) y secretos para las credenciales.
