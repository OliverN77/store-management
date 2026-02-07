# 🏪 Store Management System

> Sistema integral de gestión empresarial para administrar inventarios, ventas, compras, clientes y proveedores.

## 📋 Descripción

Store Management System es una aplicación web full-stack diseñada para simplificar y optimizar la gestión de operaciones comerciales. El sistema permite gestionar de forma eficiente productos, clientes, proveedores, transacciones de ventas y compras, así como realizar un seguimiento detallado del movimiento de inventario.

## ✨ Características Principales

### 📊 Dashboard
- Panel de control con métricas y estadísticas en tiempo real
- Visualizaciones gráficas con Chart.js
- Indicadores clave de rendimiento (KPIs)

### 🛍️ Gestión de Maestros
- **Productos**: Catálogo completo de artículos con inventario
- **Clientes**: Base de datos de clientes con historial
- **Proveedores**: Gestión de vendors y sus condiciones
- **Términos de Pago**: Configuración de condiciones comerciales

### 💼 Operaciones Comerciales
- **Ventas**: 
  - Cabeceras de documentos de venta
  - Líneas de detalle con productos
- **Compras**: 
  - Órdenes de compra
  - Gestión de recepción de mercancías

### 📦 Control de Inventario
- **Movimientos de Inventario**: Seguimiento detallado de entradas y salidas
- Trazabilidad completa de productos

## 🚀 Tecnologías Utilizadas

### Backend
- **Node.js** + **Express.js**: Framework del servidor
- **Microsoft SQL Server**: Base de datos relacional
- **mssql**: Driver nativo para SQL Server
- **Helmet**: Seguridad HTTP
- **CORS**: Manejo de políticas de origen cruzado
- **bcryptjs**: Encriptación de contraseñas
- **express-validator**: Validación de datos

### Frontend
- **React 19**: Librería de interfaz de usuario
- **React Router v7**: Enrutamiento SPA
- **Axios**: Cliente HTTP
- **Chart.js** + **react-chartjs-2**: Gráficos y visualizaciones
- **Lucide React**: Iconografía moderna
- **CSS3**: Estilos personalizados

### DevOps
- **Docker** + **Docker Compose**: Contenerización
- **Nginx**: Servidor web para producción (frontend)

## 📁 Estructura del Proyecto

```
storeManagement/
├── back/                           # Backend (API REST)
│   ├── src/
│   │   ├── config/                # Configuración de BD
│   │   ├── controllers/           # Lógica de negocio
│   │   │   ├── authController.js
│   │   │   ├── customerController.js
│   │   │   ├── vendorController.js
│   │   │   ├── itemController.js
│   │   │   ├── salesHeaderController.js
│   │   │   ├── purchaseHeaderController.js
│   │   │   ├── dashboardController.js
│   │   │   └── ...
│   │   └── routes/                # Definición de endpoints
│   ├── app.js                     # Punto de entrada
│   ├── Dockerfile
│   └── package.json
│
├── front/                          # Frontend (React SPA)
│   ├── public/
│   ├── src/
│   │   ├── components/            # Componentes reutilizables
│   │   │   ├── Layout/           # Header, Sidebar, Layout
│   │   │   ├── Charts/           # PieChart
│   │   │   ├── UI/               # Button, Input
│   │   │   └── ProtectedRoute.js
│   │   ├── contexts/             # Context API
│   │   │   └── AuthContext.js
│   │   ├── pages/                # Páginas de la aplicación
│   │   │   ├── Dashboard/
│   │   │   ├── Products/
│   │   │   ├── Customers/
│   │   │   ├── Vendors/
│   │   │   ├── SalesHeaders/
│   │   │   ├── PurchaseHeaders/
│   │   │   └── ...
│   │   ├── services/             # Servicios HTTP
│   │   │   ├── api.js
│   │   │   └── dataService.js
│   │   └── styles/               # Estilos globales
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml              # Orquestación de contenedores
├── docker-compose.db.yml           # SQL Server en contenedor
└── DEPLOY_WITH_DOCKER.md          # Guía de despliegue
```

## 🔧 Requisitos Previos

- **Node.js** 18+ y npm
- **Microsoft SQL Server** 2019+ (o usar el contenedor Docker)
- **Docker** y **Docker Compose** (para despliegue con contenedores)
- Windows/Linux/macOS

## 📦 Instalación y Configuración

### Opción 1: Desarrollo Local

#### 1. Clonar el repositorio
```bash
git clone https://github.com/OliverN77/store-management.git
cd storeManagement
```

#### 2. Configurar el Backend

```bash
cd back
npm install
```

Crear archivo `.env` con las siguientes variables:
```env
PORT=3001
DB_SERVER=localhost
DB_PORT=1433
DB_USER=sa
DB_PASSWORD=tu_contraseña_segura
DB_NAME=storeManagement
JWT_SECRET=tu_secret_jwt_seguro
```

#### 3. Configurar la Base de Datos

Ejecutar scripts SQL para crear:
- Tablas de maestros (Customer, Vendor, Item, Payment Terms)
- Tablas transaccionales (Sales Header/Line, Purchase Header/Line)
- Tabla de movimientos (Item Ledger Entry)
- Tabla de usuarios (User) con autenticación

#### 4. Configurar el Frontend

```bash
cd ../front
npm install
```

Crear archivo `.env` (opcional):
```env
REACT_APP_API_URL=http://localhost:3001/api
```

#### 5. Ejecutar la Aplicación

**Terminal 1 - Backend:**
```bash
cd back
npm start
```
Servidor corriendo en `http://localhost:3001`

**Terminal 2 - Frontend:**
```bash
cd front
npm start
```
Aplicación corriendo en `http://localhost:3000`

### Opción 2: Despliegue con Docker 🐳

#### Usando SQL Server en el Host

```powershell
# Configurar el archivo back/.env
cd back
cp .env.example .env
# Editar .env con DB_SERVER=host.docker.internal

# Desde la raíz del proyecto
cd ..
docker-compose build
docker-compose up -d
```

#### Usando SQL Server en Contenedor

```powershell
docker-compose -f docker-compose.yml -f docker-compose.db.yml build
docker-compose -f docker-compose.yml -f docker-compose.db.yml up -d
```

**Acceso a los servicios:**
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:3001`
- SQL Server: `localhost:1433`

Para más detalles, consulta [DEPLOY_WITH_DOCKER.md](DEPLOY_WITH_DOCKER.md)

## 🔐 Seguridad

- Autenticación basada en JWT
- Contraseñas hasheadas con bcryptjs
- Validación de datos con express-validator
- Headers de seguridad con Helmet
- Políticas CORS configuradas
- Rutas protegidas en frontend y backend

## 📡 API Endpoints

### Autenticación
- `POST /api/auth/login` - Inicio de sesión
- `POST /api/auth/register` - Registro de usuario

### Maestros
- `GET/POST/PUT/DELETE /api/customers` - Gestión de clientes
- `GET/POST/PUT/DELETE /api/vendors` - Gestión de proveedores
- `GET/POST/PUT/DELETE /api/items` - Gestión de productos
- `GET/POST/PUT/DELETE /api/payment-terms` - Términos de pago

### Operaciones
- `GET/POST/PUT/DELETE /api/sales-headers` - Documentos de venta
- `GET/POST/PUT/DELETE /api/sales-lines` - Líneas de venta
- `GET/POST/PUT/DELETE /api/purchase-headers` - Órdenes de compra
- `GET/POST/PUT/DELETE /api/purchase-lines` - Líneas de compra

### Inventario
- `GET /api/item-ledger-entries` - Movimientos de inventario

### Dashboard
- `GET /api/dashboard` - Métricas y estadísticas

### Usuarios
- `GET/POST/PUT/DELETE /api/users` - Gestión de usuarios

## 🎨 Características de la Interfaz

- ✅ Diseño responsive y moderno
- ✅ Sidebar de navegación colapsable
- ✅ Componentes UI reutilizables (Button, Input)
- ✅ Tablas interactivas con funciones CRUD
- ✅ Gráficos de visualización de datos
- ✅ Sistema de autenticación con sesión persistente
- ✅ Rutas protegidas
- ✅ Feedback visual en operaciones

## 🛠️ Scripts Disponibles

### Backend
```bash
npm start      # Iniciar servidor en producción
npm run dev    # Iniciar servidor en desarrollo
```

### Frontend
```bash
npm start      # Desarrollo (puerto 3000)
npm run build  # Build para producción
npm test       # Ejecutar tests
```

## 🐳 Comandos Docker Útiles

```bash
# Ver logs
docker-compose logs -f

# Reiniciar servicios
docker-compose restart

# Detener servicios
docker-compose down

# Ver contenedores activos
docker ps

# Acceder al contenedor del backend
docker exec -it store_back sh

# Acceder al contenedor de SQL Server
docker exec -it store_db bash
```

## 📝 Notas de Desarrollo

### Base de Datos
- El sistema utiliza Microsoft SQL Server como motor de base de datos
- Las conexiones se manejan mediante connection pooling
- Se recomienda configurar índices en tablas transaccionales para mejor rendimiento

### Arquitectura
- **Backend**: API RESTful con arquitectura MVC
- **Frontend**: Single Page Application (SPA) con arquitectura de componentes
- **Autenticación**: Basada en tokens JWT con Context API en React

### Buenas Prácticas Implementadas
- Separación de responsabilidades
- Código modular y reutilizable
- Manejo centralizado de errores
- Validación de datos en frontend y backend
- Uso de variables de entorno para configuración

## 🤝 Contribución

Las contribuciones son bienvenidas. Por favor:
1. Haz fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

ISC License

## 👨‍💻 Autor

**Oliver**

## 🙏 Agradecimientos

Proyecto desarrollado como sistema integral de gestión empresarial.

---

⭐ Si este proyecto te ha sido útil, considera darle una estrella en GitHub
