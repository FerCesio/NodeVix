# NodeVix — Plan de Mejoras para el Final

## Resumen del Proyecto

**NodeVix** es una plataforma web educativa para visualizar y simular estructuras de datos y algoritmos de forma interactiva.

- **Frontend**: React 19 + TypeScript + Vite + D3.js (canvas SVG interactivo)
- **Backend**: Spring Boot 4 (Java 17) + PostgreSQL + WebSocket (STOMP)
- **Infraestructura**: Docker Compose (solo DB en dev actualmente)

---

## FASE 1 — Mensaje Default para Compartir en Redes Sociales

### Objetivo

Que al compartir un link de NodeVix en X, LinkedIn o WhatsApp, aparezca un preview card con imagen, título y descripción en lugar de un link plano.

### Conceptos Clave

- **Open Graph (OG) Meta Tags**: Protocolo que controla cómo se renderiza un link en redes sociales. Las etiquetas `og:title`, `og:description`, `og:image` definen la tarjeta de preview.
- **Twitter Card**: Tags específicos de X/Twitter (`twitter:card`, `twitter:title`, `twitter:image`) que complementan a OG.
- **SPA y meta tags**: Las redes no ejecutan JavaScript al hacer scraping. Solo leen el HTML crudo. Para tags dinámicos por proyecto se necesita SSR o un endpoint dedicado.

### Información Necesaria

- [ ] Texto descriptivo por defecto de la app
- [ ] Imagen para el preview (logo PNG de al menos 1200x630px recomendado)
- [ ] Dominio final de la app (para URLs absolutas)
- [ ] Decidir si los meta tags son estáticos (iguales para toda la app) o dinámicos (por proyecto)

### Cambios a Realizar

#### 1.1 — Meta tags estáticos en `app/index.html`

Agregar dentro de `<head>`:

```html
<!-- Open Graph -->
<meta property="og:type" content="website" />
<meta property="og:title" content="NodeVix — Visualize Data Structures & Algorithms" />
<meta property="og:description" content="Build, simulate and share interactive algorithm visualizations. Explore sorting, graphs, trees and more." />
<meta property="og:image" content="https://DOMINIO/nodevix_logo.png" />
<meta property="og:url" content="https://DOMINIO" />
<meta property="og:site_name" content="NodeVix" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="NodeVix — Interactive Algorithm Simulator" />
<meta name="twitter:description" content="Build, simulate and share interactive algorithm visualizations 🚀" />
<meta name="twitter:image" content="https://DOMINIO/nodevix_logo.png" />
```

#### 1.2 — Mejorar el texto dinámico en `ProjectPage.tsx` → `shareToSocials()`

Modificar las variables de texto para incluir información del proyecto:

```typescript
const structureInfo = structures.length > 0
  ? structures[0].flags.filter(f => f !== 'GRAPH').join(', ')
  : 'Graph';

const shareText = projectName
  ? `Check out "${projectName}" — a ${structureInfo} visualization built on NodeVix! 🧠🚀`
  : `I built an interactive algorithm simulation on NodeVix! 🚀 Take a look:`;
```

#### 1.3 — (Opcional) Meta tags dinámicos por proyecto

Crear un endpoint en el backend que devuelva HTML con OG tags para cada proyecto:

- **Ruta**: `GET /share/{projectId}` (público, sin auth)
- **Retorna**: HTML mínimo con meta tags usando nombre/descripción del proyecto
- **Uso**: Las redes sociales scrapean esta URL en lugar de la SPA

### ⚠️ Limitación: LinkedIn requiere Deploy

LinkedIn **no acepta parámetro `text`** en su URL de share (a diferencia de X y WhatsApp que sí lo hacen). El preview card de LinkedIn se genera scrapeando los meta tags OG de la URL compartida.

**Consecuencia**: Hasta que la app no esté deployada con URL pública:
- ✅ X/Twitter: Funciona (texto viaja como query param `?text=...`)
- ✅ WhatsApp: Funciona (texto viaja como query param `?text=...`)
- ❌ LinkedIn: Solo muestra el link pelado, no puede scrapear localhost

**Workaround temporal**: El botón de LinkedIn podría copiar texto + link al clipboard y abrir LinkedIn en nueva pestaña para que el usuario pegue manualmente.

**Solución definitiva**: Completar la Fase 3 (Deploy) + tener los meta tags OG con URL pública.

### Archivos Afectados

- `app/index.html`
- `app/src/pages/ProjectPage.tsx` (función `shareToSocials`)
- (Opcional) Nuevo endpoint en el backend

---

## FASE 2 — Fix de Bugs en el Canvas

### Objetivo

Corregir tres bugs detectados:
1. Al guardar un proyecto, todos los nodos se vuelven verdes al recargar
2. Al eliminar un nodo algoritmo que está corriendo, la animación sigue ejecutándose sin resetear la estructura
3. No se pueden seleccionar múltiples nodos con marquee (rectángulo de selección)

### Conceptos Clave

- **Color por defecto y serialización**: Los nodos de `DefaultNode` no tienen `color` asignado (es `undefined`). El `CanvasRenderer` usa `d.color ?? '#ffffff'` (blanco) para pintarlos. Pero al serializar en `getCanvasState()` se guarda `n.color ?? '#2ecc71'` (verde), contaminando el JSON.
- **Executor y AutoPlay**: Cuando un algoritmo se ejecuta, se crea un `AlgorithmExecutor` que administra los snapshots (pasos). `startAutoPlay()` lanza un ciclo con `setTimeout` que avanza pasos automáticamente. Si se elimina el nodo sin llamar a `stopAutoPlay()` y `btn-reset`, el timer sigue corriendo.
- **`saveState()` y restauración**: Ya existe un método `btn-reset` en `handleAlgoButton()` que restaura los valores originales usando `executor.stepBack()` hasta el paso 0. Esta lógica debe ejecutarse también al eliminar.
- **Eventos mousedown → mouseup → click**: Cuando se hace un marquee (mousedown + drag + mouseup), el browser también dispara un evento `click` al final (porque hubo mousedown y mouseup en el mismo elemento). Si el handler del `click` limpia la selección, se pierde lo que el marquee acaba de seleccionar.

### Cambios a Realizar

#### 2.1 — Bug: Nodos se vuelven verdes al guardar

**Causa raíz**: En `getCanvasState()` (SimulationCanvas.tsx, línea ~388) se serializa:
```typescript
color: n.color ?? '#2ecc71',  // ← PROBLEMA: mete verde a nodos sin color
```

Al recargar, el nodo se crea con `color: '#2ecc71'` explícito, y el renderer lo pinta verde.

**Fix**: No asignar un color por defecto al serializar. Si el nodo no tiene color, guardar `undefined` o no incluir la propiedad:

**Archivo**: `app/src/components/sandbox/SimulationCanvas.tsx` → `getCanvasState()`

```typescript
// ANTES:
color: n.color ?? '#2ecc71',

// DESPUÉS:
color: n.color,  // undefined si no fue asignado → el renderer usará su default
```

De esta forma, al recargar:
- Si el nodo tiene color explícito (asignado por el usuario) → se respeta
- Si no tiene color → queda `undefined` → el renderer aplica su default (`#ffffff` o el que corresponda)

#### 2.2 — Bug: Algoritmo sigue corriendo al eliminar el nodo

**Causa raíz**: En los 3 caminos de eliminación de nodos (`DELETE_ANY` por click individual, por selección múltiple, y por marquee) no se verifica si el nodo eliminado es de tipo `algorithm`. No se llama a:
- `stopAutoPlay(algoNode.id)` → el timer sigue ejecutándose
- Reset de valores → la estructura queda con los valores intermedios del algoritmo

**Fix**: Antes de eliminar un nodo, verificar si es algoritmo y hacer cleanup.

**Archivo**: `app/src/components/sandbox/modules/InteractionManager.ts`

Crear un método helper de cleanup:

```typescript
private cleanupAlgorithmNode(nodeId: string): void {
  // 1. Parar el autoplay si existe
  this.stopAutoPlay(nodeId);
  
  // 2. Si hay executor, resetear la estructura al estado original
  const executor = this.executors.get(nodeId);
  if (executor) {
    // Rebobinar todos los pasos hasta el inicio
    while (executor.getCurrentStep() > 0) {
      executor.stepBack();
    }
    this.executors.delete(nodeId);
  }
  
  // 3. Limpiar highlights
  this.renderer.setHighlights(undefined);
}
```

Luego llamar este método en los 3 puntos de eliminación:

**Click individual** (~línea 560):
```typescript
if (clickedNode) {
  // NUEVO: cleanup si es algoritmo
  if ((clickedNode as any).kind === 'algorithm') {
    this.cleanupAlgorithmNode(clickedNode.id);
  }
  // ... resto del delete
}
```

**Selección múltiple** (~línea 536):
```typescript
this.refs.nodesRef.current.forEach(n => {
  if (toDelete.has(n.id) && (n as any).kind === 'algorithm') {
    this.cleanupAlgorithmNode(n.id);
  }
});
// ... resto del delete
```

**Marquee delete** (~línea 233):
```typescript
enclosed.forEach(node => {
  if ((node as any).kind === 'algorithm') {
    this.cleanupAlgorithmNode(node.id);
  }
});
// ... resto del delete
```

#### 2.3 — Bug: No se pueden seleccionar múltiples nodos con marquee

**Causa raíz**: Después de un marquee (mousedown → drag → mouseup), el browser dispara un evento `click` en el SVG. El handler `click.interaction` en modo SELECT ejecuta:

```typescript
if (mode === 'SELECT') {
  const clickedNode = this.getNodeFromTarget(target);
  if (!clickedNode) this.selectedNodes.clear();  // ← BORRA todo lo que seleccionó el marquee
}
```

El marquee funciona correctamente y agrega nodos a `selectedNodes`, pero inmediatamente después el click los borra.

**Fix**: Agregar una bandera `skipNextClick` que se activa al terminar un marquee exitoso, y se consume en el siguiente click.

**Archivo**: `app/src/components/sandbox/modules/InteractionManager.ts`

1. Agregar propiedad a la clase:
```typescript
private skipNextClick = false;
```

2. En el `window.addEventListener('mouseup')` del marquee, al final (después de agregar nodos a `selectedNodes`):
```typescript
if (mode === 'SELECT' && enclosed.length > 0) {
  this.selectedNodes.clear();
  for (const n of enclosed) this.selectedNodes.add(n.id);
  this.renderer.setSelectedNodes(this.selectedNodes);
  this.skipNextClick = true;  // ← NUEVO: evitar que el click limpie
}
```

3. Al inicio del `click.interaction`, antes de cualquier lógica:
```typescript
this.svg.on('click.interaction', (event: MouseEvent) => {
  if (this.skipNextClick) {
    this.skipNextClick = false;
    return;  // ← No procesar este click
  }
  // ... resto del handler
});
```

#### 2.4 — Feature: Paneo con Space + Click (drag)

**Concepto**: En herramientas como Figma, Photoshop, y otros editors 2D, mantener presionada la tecla Space convierte temporalmente cualquier modo en "modo mano" (pan), permitiendo arrastrar el canvas sin cambiar de herramienta.

**Implementación**: El `CameraSystem` ya maneja pan con scroll del mouse. Ahora necesitamos que al mantener Space presionado + arrastrar, se mueva la cámara.

**Archivo**: `app/src/components/sandbox/modules/InteractionManager.ts`

1. Agregar estado a la clase:
```typescript
private spaceHeld = false;
```

2. En `setupListeners()`, registrar keydown/keyup para Space:
```typescript
d3.select('body').on('keydown.space', (event: KeyboardEvent) => {
  if (event.code === 'Space' && !this.spaceHeld) {
    event.preventDefault();
    this.spaceHeld = true;
    this.svg.style('cursor', 'grab');
  }
});

d3.select('body').on('keyup.space', (event: KeyboardEvent) => {
  if (event.code === 'Space') {
    this.spaceHeld = false;
    this.svg.style('cursor', null);
  }
});
```

3. En el `mousedown.marquee`, agregar guard para Space:
```typescript
this.svg.on('mousedown.marquee', (event: MouseEvent) => {
  if (this.spaceHeld) return;  // ← Space activa pan, no marquee
  // ... resto del handler
});
```

4. Agregar drag-pan handler:
```typescript
let panStart: [number, number] | null = null;

this.svg.on('mousedown.pan', (event: MouseEvent) => {
  if (!this.spaceHeld) return;
  event.preventDefault();
  panStart = [event.clientX, event.clientY];
  this.svg.style('cursor', 'grabbing');
});

this.svg.on('mousemove.pan', (event: MouseEvent) => {
  if (!this.spaceHeld || !panStart) return;
  const dx = event.clientX - panStart[0];
  const dy = event.clientY - panStart[1];
  panStart = [event.clientX, event.clientY];
  // Aplicar translación a la cámara
  const transform = d3.zoomTransform(this.svg.node()!);
  const newTransform = transform.translate(dx, dy);
  this.svg.call(camera.getZoom().transform, newTransform);
});

window.addEventListener('mouseup', () => {
  if (panStart) {
    panStart = null;
    this.svg.style('cursor', this.spaceHeld ? 'grab' : null);
  }
});
```

**Nota**: Para que el InteractionManager pueda acceder al zoom behavior del CameraSystem, hay que exponer el zoom con un getter:

**Archivo**: `app/src/components/sandbox/modules/CameraSystem.ts`

```typescript
getZoom(): d3.ZoomBehavior<SVGSVGElement, unknown> {
  return this.zoom;
}
```

Y pasar la referencia del camera al InteractionManager en el constructor o bindContext.

5. En `destroy()`, limpiar los listeners nuevos:
```typescript
d3.select('body').on('keydown.space', null);
d3.select('body').on('keyup.space', null);
this.svg.on('mousedown.pan', null);
this.svg.on('mousemove.pan', null);
```

### Archivos Afectados

- `app/src/components/sandbox/SimulationCanvas.tsx` (fix del color en `getCanvasState`)
- `app/src/components/sandbox/modules/InteractionManager.ts` (cleanup de algoritmos al eliminar + fix marquee + Space pan)
- `app/src/components/sandbox/modules/CameraSystem.ts` (exponer getter del zoom)

---

## FASE 3 — Deploy de la Aplicación

### Objetivo

Poner NodeVix online, accesible desde internet con un dominio público.

### Conceptos Clave

- **Containerización (Docker)**: Empaquetar la app en containers aislados que corren igual en cualquier máquina.
- **Fat JAR**: Spring Boot compila todo (código + Tomcat embebido) en un único `.jar` ejecutable.
- **Vite Build**: `npm run build` genera archivos estáticos (`dist/`) servibles por cualquier HTTP server.
- **Reverse Proxy (nginx)**: Servidor que recibe el tráfico y rutea al frontend o backend según la URL.
- **Variables de Entorno**: Configuración sensible que NO va en el código (contraseñas, secrets, API keys).
- **CORS (Cross-Origin Resource Sharing)**: Política del browser que bloquea requests entre dominios distintos. Hay que configurar el dominio del frontend en el backend.

### Información Necesaria

- [ ] Presupuesto (free tier vs pago)
- [ ] Plataforma preferida (Railway, Render, Fly.io, VPS en DigitalOcean, AWS)
- [ ] ¿Dominio propio o subdominio del provider?
- [ ] ¿OAuth2 de Google debe funcionar en prod? (requiere configurar redirect URI en Google Console)
- [ ] ¿El servicio de email debe funcionar en prod? (requiere SMTP real)

### Cambios a Realizar

#### 3.1 — Dockerfile del Backend

**Archivo nuevo**: `api/Dockerfile`

```dockerfile
# --- Build Stage ---
FROM eclipse-temurin:17-jdk AS build
WORKDIR /app
COPY . .
RUN chmod +x gradlew && ./gradlew bootJar --no-daemon

# --- Runtime Stage ---
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

#### 3.2 — Dockerfile del Frontend

**Archivo nuevo**: `app/Dockerfile`

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

#### 3.3 — Nginx config para SPA

**Archivo nuevo**: `app/nginx.conf`

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

#### 3.4 — Perfil de producción del Backend

**Archivo nuevo**: `api/src/main/resources/application-prod.properties`

```properties
spring.datasource.url=${DATABASE_URL}
spring.datasource.username=${DB_USER}
spring.datasource.password=${DB_PASSWORD}
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
jwt.secret=${JWT_SECRET}
jwt.expiration=86400000
```

#### 3.5 — CORS dinámico

**Archivo**: `api/src/main/java/com/lab1/nodevix/security/SecurityConfig.java`

Cambiar el origin hardcodeado por variable de entorno:

```java
String frontendUrl = System.getenv("FRONTEND_URL");
if (frontendUrl == null) frontendUrl = "http://localhost:5173";
config.setAllowedOrigins(List.of(frontendUrl));
```

#### 3.6 — Variables de entorno en el Frontend

**Archivo nuevo**: `app/.env.production`

```env
VITE_API_URL=https://api.DOMINIO.com/api
VITE_WS_URL=wss://api.DOMINIO.com/ws-nodevix
```

**Archivo**: `app/src/services/api.ts`

```typescript
baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080/api",
```

**Archivo**: `app/src/services/NetworkManager.ts`

```typescript
brokerURL: import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws-nodevix',
```

#### 3.7 — Docker Compose de Producción

**Archivo nuevo**: `docker-compose.prod.yml`

```yaml
version: '3.9'
services:
  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: nodevix
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - db_data:/var/lib/postgresql/data

  api:
    build: ./api
    restart: unless-stopped
    ports:
      - "8080:8080"
    environment:
      DATABASE_URL: jdbc:postgresql://db:5432/nodevix
      DB_USER: ${DB_USER}
      DB_PASSWORD: ${DB_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
      FRONTEND_URL: ${FRONTEND_URL}
      SPRING_PROFILES_ACTIVE: prod
    depends_on:
      - db

  app:
    build: ./app
    restart: unless-stopped
    ports:
      - "80:80"
    depends_on:
      - api

volumes:
  db_data:
```

### Archivos Afectados

- `api/Dockerfile` (nuevo)
- `app/Dockerfile` (nuevo)
- `app/nginx.conf` (nuevo)
- `app/.env.production` (nuevo)
- `docker-compose.prod.yml` (nuevo)
- `api/src/main/resources/application-prod.properties` (nuevo)
- `api/src/main/java/com/lab1/nodevix/security/SecurityConfig.java`
- `app/src/services/api.ts`
- `app/src/services/NetworkManager.ts`

---

## FASE 4 — Proyectos Colaborativos

### Objetivo

Permitir que múltiples usuarios editen el mismo proyecto en tiempo real, con un sistema de invitaciones y permisos.

### Conceptos Clave

- **WebSocket STOMP** (ya configurado): Protocolo de mensajería sobre WebSocket. El servidor recibe un delta y lo rebroadcastea a todos los suscriptos al mismo canal (`/topic/project/{id}`).
- **Deltas** (ya implementados): Micro-acciones (`CREATE_NODE`, `DELETE_NODE`, `MOVE_NODE`, `PUSH`, `POP`) que describen cambios atómicos en el canvas.
- **senderId** (ya implementado): Cada cliente tiene un UUID único. Los deltas propios se descartan al recibirlos de vuelta.
- **Last Write Wins**: Modelo de consistencia simple. No hay resolución de conflictos — el último cambio gana. Aceptable para un MVP.
- **Presencia**: Saber quién está conectado en un proyecto en un momento dado.

### Estado Actual

Lo que **ya funciona**:
- WebSocket conecta al canal del proyecto
- Deltas se envían y reciben correctamente
- Filtro por senderId evita eco local
- Acciones soportadas: CREATE_NODE, DELETE_NODE, MOVE_NODE, PUSH, POP, UPDATE_WEIGHT

Lo que **falta**:
- No hay validación de quién puede unirse a un canal
- No hay concepto de "colaborador" en la base de datos
- No hay persistencia de deltas (si un usuario se conecta tarde, no ve los cambios previos)
- No hay UI de presencia (ver quién está editando)
- No hay sistema de invitación

### Información Necesaria

- [ ] ¿Invitación por link, por username, o ambos?
- [ ] ¿Roles diferenciados? (OWNER puede borrar, EDITOR solo edita, VIEWER solo mira)
- [ ] ¿Mostrar cursores remotos en el canvas?
- [ ] ¿Los cambios se persisten automáticamente o solo al dar "Save"?

### Cambios a Realizar

#### 4.1 — Modelo de datos: tabla de colaboradores

**Opción A** (simple): Agregar columna `role` a la tabla intermedia `has`:

```sql
ALTER TABLE has ADD COLUMN role VARCHAR(20) DEFAULT 'OWNER';
-- Valores: 'OWNER', 'EDITOR', 'VIEWER'
```

**Opción B** (flexible): Nueva entidad `ProjectCollaborator`:

```java
@Entity
@Table(name = "project_collaborators")
public class ProjectCollaborator {
    @Id @GeneratedValue
    private Long id;

    @ManyToOne
    private User user;

    @ManyToOne
    private Project project;

    @Enumerated(EnumType.STRING)
    private CollaboratorRole role; // OWNER, EDITOR, VIEWER

    private LocalDateTime joinedAt;
}
```

#### 4.2 — Endpoint de invitación

**Archivo nuevo**: Nuevo método en `ProjectController.java`

```
POST /api/manage/{projectId}/invite
Body: { "username": "john", "role": "EDITOR" }
Response: 200 OK | 404 User not found | 403 Not owner
```

#### 4.3 — Endpoint de listar colaboradores

```
GET /api/manage/{projectId}/collaborators
Response: [{ "username": "john", "role": "EDITOR", "avatar": "..." }, ...]
```

#### 4.4 — Modificar acceso a proyectos

**Archivo**: `ProjectService.java`

Modificar `getContent()` para permitir acceso si el usuario es colaborador (no solo owner):

```java
if (!userRepo.hasProject(userID, projectID) && !collaboratorRepo.existsByUserAndProject(userID, projectID)) {
    throw new RuntimeException("Acceso denegado");
}
```

#### 4.5 — UI de invitación en el frontend

**Archivo**: `app/src/pages/ProjectPage.tsx`

- Nuevo botón "Invite" en el topbar (al lado de Share)
- Modal con input de username + selector de rol
- Lista de colaboradores actuales con opción de remover

#### 4.6 — Sistema de presencia

**Frontend** (`NetworkManager.ts`):

```typescript
// Al conectar, enviar delta de presencia
sendDelta('JOIN' as any, 'system', { username, avatar });

// Al desconectar
sendDelta('LEAVE' as any, 'system', { username });
```

**Frontend** (`SimulationCanvas.tsx`):

- Mantener un estado `connectedUsers` actualizado con los deltas JOIN/LEAVE
- Renderizar avatares/nombres en el topbar

#### 4.7 — (Opcional) Validación de acceso al WebSocket

**Archivo**: `WebSocketConfig.java` o nuevo `WebSocketAuthInterceptor.java`

Verificar JWT en la conexión WebSocket para que solo colaboradores puedan suscribirse al canal.

### Archivos Afectados

- Nueva entidad/tabla en el backend
- `api/.../project/ProjectController.java`
- `api/.../project/ProjectService.java`
- `api/.../user/UserRepository.java` o nuevo `CollaboratorRepository.java`
- `app/src/pages/ProjectPage.tsx`
- `app/src/services/NetworkManager.ts`
- `app/src/components/sandbox/SimulationCanvas.tsx`

---

## Orden de Ejecución Recomendado

```
┌─────────────────────────────────────────────────────┐
│  1. FASE 2 — Fix Algoritmos        (4-8h)          │
│     → Arreglar lo que está roto primero             │
├─────────────────────────────────────────────────────┤
│  2. FASE 1 — Meta Tags Share       (2-4h)          │
│     → Quick win, mejora profesionalismo             │
├─────────────────────────────────────────────────────┤
│  3. FASE 3 — Deploy                (8-16h)         │
│     → Poner la app online para la demo              │
├─────────────────────────────────────────────────────┤
│  4. FASE 4 — Colabs                (6-12h)         │
│     → Feature complejo, se testea mejor deployado   │
└─────────────────────────────────────────────────────┘

Tiempo total estimado: 20-40 horas
```

---

## Checklist General

- [ ] FASE 1: Meta tags OG en index.html
- [ ] FASE 1: Texto dinámico mejorado en shareToSocials()
- [ ] FASE 2: Fix color verde al guardar (getCanvasState)
- [ ] FASE 2: Cleanup de algoritmo al eliminar nodo
- [ ] FASE 2: Fix marquee selection (skipNextClick)
- [ ] FASE 2: Paneo con Space + Click
- [ ] FASE 3: Dockerfiles (api + app)
- [ ] FASE 3: nginx.conf para SPA routing
- [ ] FASE 3: application-prod.properties
- [ ] FASE 3: CORS dinámico con env var
- [ ] FASE 3: Variables de entorno en frontend (VITE_API_URL, VITE_WS_URL)
- [ ] FASE 3: docker-compose.prod.yml
- [ ] FASE 3: Deploy en plataforma elegida
- [ ] FASE 4: Modelo de colaboradores en DB
- [ ] FASE 4: Endpoint de invitación
- [ ] FASE 4: Modificar acceso a proyectos para incluir colaboradores
- [ ] FASE 4: UI de invitación
- [ ] FASE 4: Sistema de presencia (JOIN/LEAVE)
