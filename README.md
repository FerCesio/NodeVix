# NodeVix

Herramienta visual interactiva para crear, manipular y visualizar estructuras de datos y algoritmos de grafos. Permite a los usuarios construir grafos en un sandbox con simulación física, ejecutar algoritmos paso a paso, y compartir proyectos con colaboración en tiempo real.

---

## Arquitectura

El proyecto sigue una arquitectura cliente-servidor con despliegue en **Railway**:

```
┌─────────────────┐       REST / WebSocket       ┌─────────────────┐       JDBC       ┌────────────┐
│   Frontend      │  ◄──────────────────────────► │    Backend      │ ◄──────────────► │ PostgreSQL │
│  (React + Vite) │                               │ (Spring Boot)   │                  │            │
└─────────────────┘                               └─────────────────┘                  └────────────┘
     Nginx (prod)                                    Eclipse Temurin 17
```

---

## Tecnologías

### Frontend (`/app`)

| Tecnología | Versión | Uso |
|---|---|---|
| **React** | 19 | Librería UI, componentes funcionales con hooks |
| **TypeScript** | 5.9 | Tipado estático en toda la capa frontend |
| **Vite** | 8 | Bundler y dev server con HMR |
| **React Router** | 7 | Routing SPA con rutas protegidas |
| **D3.js** | 7 | Motor de renderizado del sandbox: simulación de fuerzas, zoom, SVG |
| **Framer Motion** | 11 | Animaciones de transición entre páginas y fade-in de componentes |
| **@stomp/stompjs** | 7 | Cliente WebSocket (STOMP) para colaboración en tiempo real |
| **Axios** | 1.x | Cliente HTTP con interceptors para JWT automático |
| **SweetAlert2** | 11 | Diálogos y confirmaciones |
| **react-hot-toast** | 2 | Notificaciones tipo toast |
| **html2canvas + jsPDF** | — | Exportación de proyectos a PDF |
| **Nginx** | Alpine | Servidor de archivos estáticos en producción (SPA fallback) |
| **ESLint** | 9 | Linter con reglas para React hooks y React Refresh |

### Backend (`/api`)

| Tecnología | Versión | Uso |
|---|---|---|
| **Java** | 17 | Lenguaje del backend |
| **Spring Boot** | 4.0 | Framework principal (Web MVC, Data JPA, Security, WebSocket, Mail, OAuth2) |
| **Spring Data JPA** | — | ORM y repositorios sobre PostgreSQL |
| **Spring Security** | — | Autenticación/autorización, filtros JWT, OAuth2 con Google |
| **Spring WebSocket** | — | Broker STOMP para edición colaborativa en tiempo real |
| **Spring Mail** | — | Notificaciones por email (interacciones en posts) |
| **JJWT** | 0.12 | Generación y validación de tokens JWT |
| **PostgreSQL** | 16 | Base de datos relacional (usuarios, proyectos, posts, comentarios, colaboraciones) |
| **Google Guava** | 33 | Utilidades de colecciones y caching |
| **Gradle** | — | Build system |

### Infraestructura y DevOps

| Tecnología | Uso |
|---|---|
| **Railway** | Hosting en producción (servicio `app`, servicio `api`, PostgreSQL) |
| **Docker** | Contenedores multi-stage para frontend (Node → Nginx) y backend (JDK → JRE) |
| **Docker Compose** | Entorno local: levanta PostgreSQL en contenedor |

---

## Funcionalidades principales

- **Sandbox interactivo**: creación de grafos con nodos y aristas arrastrables, simulación de fuerzas (D3 force layout), zoom y paneo.
- **Detección de estructuras**: el sistema valida automáticamente si el grafo es una lista enlazada, árbol binario, BST, DAG, bipartito, grafo completo, etc.
- **Algoritmos paso a paso**: Bubble Sort, Merge Sort, Bogo Sort, Inorder, Dijkstra — con animación de cada paso y controles de reproducción.
- **Colaboración en tiempo real**: WebSocket (STOMP) permite que múltiples usuarios editen el mismo proyecto simultáneamente.
- **Sistema de usuarios**: registro, login (credenciales + OAuth2 con Google), perfiles con avatar.
- **Publicaciones**: los usuarios publican proyectos como posts, con likes, dislikes, vistas, y comentarios.
- **Roles de colaborador**: owner, editor, viewer — gestión de acceso por proyecto.
- **Exportación a PDF**: captura del canvas y generación de documento.

---

## Ejecución local

### Requisitos previos

- Docker y Docker Compose
- Java 17+ (JDK)
- Node.js 20+
- npm

### Levantar todo

```bash
./start.sh
```

Esto ejecuta:
1. `docker compose up -d` → PostgreSQL en `localhost:5432`
2. `./gradlew bootRun` → Backend en `http://localhost:8080`
3. `npm run dev` → Frontend en `http://localhost:5173`

### Detener todo

```bash
./stop.sh
```

---

## Despliegue en Railway

El proyecto se despliega con dos servicios separados:

```bash
./update-railway.sh
```

- **Servicio `app`**: build multi-stage Node → Nginx. Variables de entorno en build time: `VITE_API_URL`, `VITE_WS_URL`.
- **Servicio `api`**: build multi-stage JDK → JRE. Variables de entorno: `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`, `JWT_SECRET`, `SPRING_PROFILES_ACTIVE=prod`.

---

## Estructura del repositorio

```
nodevix/
├── app/                  # Frontend React + TypeScript
│   ├── src/
│   │   ├── components/   # Componentes UI (sandbox, proyecto, usuario, general)
│   │   ├── pages/        # Páginas principales (Home, Login, Project, Posts)
│   │   ├── sandbox/      # Motor de visualización (física, cámara, canvas, algoritmos)
│   │   ├── services/     # API client (Axios) y NetworkManager (WebSocket)
│   │   ├── types/        # Tipos TypeScript
│   │   └── utils/        # Utilidades
│   ├── Dockerfile        # Multi-stage: Node build → Nginx serve
│   └── nginx.conf        # Config SPA para producción
├── api/                  # Backend Spring Boot
│   ├── src/main/java/com/lab1/nodevix/
│   │   ├── project/      # CRUD de proyectos (contenido JSON de grafos)
│   │   ├── post/         # Publicaciones, likes, vistas, clonado
│   │   ├── comments/     # Comentarios en posts
│   │   ├── colabs/       # Colaboradores y roles
│   │   ├── user/         # Usuarios, auth, perfiles
│   │   ├── security/     # JWT, OAuth2, filtros, CORS
│   │   └── ...           # WebSocket, email, excepciones
│   ├── Dockerfile        # Multi-stage: JDK build → JRE runtime
│   └── build.gradle      # Dependencias y plugins
├── docker-compose.yml    # PostgreSQL local
├── start.sh              # Script para levantar entorno completo
├── stop.sh               # Script para detener todo
└── update-railway.sh     # Deploy a Railway
```

---

## Variables de entorno

| Variable | Servicio | Descripción |
|---|---|---|
| `VITE_API_URL` | Frontend (build time) | URL base de la API (ej: `https://api.nodevix.up.railway.app/api`) |
| `VITE_WS_URL` | Frontend (build time) | URL del WebSocket (ej: `wss://api.nodevix.up.railway.app/ws-nodevix`) |
| `PGHOST` | Backend | Host de PostgreSQL |
| `PGPORT` | Backend | Puerto de PostgreSQL |
| `PGDATABASE` | Backend | Nombre de la base de datos |
| `PGUSER` | Backend | Usuario de PostgreSQL |
| `PGPASSWORD` | Backend | Contraseña de PostgreSQL |
| `JWT_SECRET` | Backend | Clave secreta para firmar tokens JWT |
| `MAIL_USER` | Backend | Email para envío de notificaciones |
| `MAIL_PASSWORD` | Backend | App password de Gmail |
| `GOOGLE_CLIENT_ID` | Backend | Client ID de Google OAuth2 |
| `GOOGLE_CLIENT_SECRET` | Backend | Client Secret de Google OAuth2 |
| `SPRING_PROFILES_ACTIVE` | Backend | Perfil activo (`prod` en Railway) |
