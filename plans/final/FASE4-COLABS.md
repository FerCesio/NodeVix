# Fase 4 — Proyectos Colaborativos: Plan de Implementación

## Estado actual (lo que ya existe)

### Infraestructura WebSocket funcionando:
- `WebSocketConfig.java` — STOMP con endpoint `/ws-nodevix`, broker `/topic`
- `WebSocketController.java` — Relay: recibe delta en `/app/project/{id}/delta`, rebroadcastea a `/topic/project/{id}`
- `ProjectDelta.java` — DTO con `action`, `projectId`, `nodeId`, `payload`
- `NetworkManager.ts` — Cliente STOMP (connect, subscribe, sendDelta, disconnect)
- `SimulationCanvas.tsx` — Procesa deltas remotos: CREATE_NODE, DELETE_NODE, MOVE_NODE, PUSH, POP, UPDATE_WEIGHT
- `senderId` implementado en payload para filtrar eco local

### Lo que NO existe:
- No hay tabla de colaboradores
- No hay validación de quién puede conectarse a un canal
- No hay endpoints de invitación
- No hay UI de invitación ni presencia
- Cualquiera que conozca el projectId puede conectarse y mandar/recibir deltas

---

## Modelo de datos

Nueva tabla `project_collaborator`:

```sql
CREATE TABLE project_collaborator (
    id            BIGSERIAL PRIMARY KEY,
    user_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    owner_id      BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id    BIGINT NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    role          VARCHAR(20) DEFAULT 'EDITOR',   -- EDITOR | VIEWER
    joined_at     TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, project_id)  -- un usuario no puede estar invitado dos veces al mismo proyecto
);
```

**Columnas:**
- `user_id` — el invitado
- `owner_id` — quién invitó (el dueño del proyecto)
- `project_id` — el proyecto compartido
- `role` — EDITOR (puede editar canvas en tiempo real) o VIEWER (solo observa)
- `joined_at` — timestamp de cuándo se aceptó/creó la invitación

**Nota:** `owner_id` es técnicamente redundante (se puede derivar de la tabla `has`), pero tenerlo explícito evita un JOIN extra en validaciones y hace más claro quién invitó.

---

## Pasos de implementación

### 1. Backend — Entidad y Repositorio

**Nuevo archivo**: `api/src/main/java/com/lab1/nodevix/project/ProjectCollaborator.java`

```java
@Entity
@Table(name = "project_collaborator", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "project_id"})
})
public class ProjectCollaborator {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;           // el invitado

    @ManyToOne
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;          // quién invitó

    @ManyToOne
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(nullable = false)
    private String role;         // "EDITOR" o "VIEWER"

    private LocalDateTime joinedAt = LocalDateTime.now();

    // Constructores, getters, setters...
}
```

**Nuevo archivo**: `api/src/main/java/com/lab1/nodevix/project/ProjectCollaboratorRepository.java`

```java
@Repository
public interface ProjectCollaboratorRepository extends JpaRepository<ProjectCollaborator, Long> {
    boolean existsByUserIdAndProjectId(Long userId, Long projectId);
    List<ProjectCollaborator> findByProjectId(Long projectId);
    List<ProjectCollaborator> findByUserId(Long userId);  // proyectos donde fui invitado
    Optional<ProjectCollaborator> findByUserIdAndProjectId(Long userId, Long projectId);
    void deleteByUserIdAndProjectId(Long userId, Long projectId);
}
```

---

### 2. Backend — Endpoints de invitación

**Modificar**: `ProjectController.java` — agregar endpoints:

| Método   | Ruta                                          | Descripción                               |
|----------|-----------------------------------------------|-------------------------------------------|
| `POST`   | `/api/manage/{projectId}/invite`              | Owner invita a un usuario por username    |
| `GET`    | `/api/manage/{projectId}/collaborators`       | Lista colaboradores del proyecto          |
| `DELETE` | `/api/manage/{projectId}/collaborators/{userId}` | Owner remueve a un colaborador         |
| `GET`    | `/api/manage/shared-with-me`                  | Lista proyectos donde el usuario fue invitado |

**Lógica del POST /invite:**
1. Verificar que el que invita es owner (`userRepo.hasProject(ownerId, projectId)`)
2. Buscar al invitado por username (`userRepo.findByName(username)`)
3. Verificar que no se invite a sí mismo
4. Verificar que no esté ya invitado (`collaboratorRepo.existsByUserIdAndProjectId`)
5. Crear el `ProjectCollaborator` y persistir

**DTOs necesarios:**
- `InviteRequest` — `{ username: String, role: String }`
- `CollaboratorResponse` — `{ userId, username, avatar, role, joinedAt }`

---

### 3. Backend — Modificar validación de acceso

**Modificar**: `ProjectService.java`

En los métodos `get()`, `getContent()`, y `update()`:

```java
// ANTES:
if (!userRepo.hasProject(userID, projectID)) {
    throw new RuntimeException("Acceso denegado");
}

// DESPUÉS:
boolean isOwner = userRepo.hasProject(userID, projectID);
boolean isCollaborator = collaboratorRepo.existsByUserIdAndProjectId(userID, projectID);

if (!isOwner && !isCollaborator) {
    throw new RuntimeException("Acceso denegado");
}
```

**Permisos por rol:**
- `delete()` — solo OWNER puede borrar el proyecto
- `update()` — OWNER y EDITOR pueden guardar contenido
- `get()` / `getContent()` — OWNER, EDITOR y VIEWER pueden leer

**También modificar `readList()`** para incluir proyectos compartidos en la lista del usuario, o dejarlos en un endpoint separado (`/shared-with-me`).

---

### 4. Backend — Validación de WebSocket (opcional, recomendado)

**Modificar**: `WebSocketConfig.java` — agregar `ChannelInterceptor`:

```java
@Override
public void configureClientInboundChannel(ChannelRegistration registration) {
    registration.interceptors(new ChannelInterceptor() {
        @Override
        public Message<?> preSend(Message<?> message, MessageChannel channel) {
            StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);
            if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                String token = accessor.getFirstNativeHeader("Authorization");
                // Validar JWT, extraer userId
                // Guardar userId en session attributes
            }
            if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
                // Extraer projectId del destination
                // Verificar que el usuario es owner o colaborador
            }
            return message;
        }
    });
}
```

Esto evita que cualquiera que adivine un projectId pueda espiar los deltas.

---

### 5. Backend — Sistema de presencia

**Opción A: Solo frontend (simple)**
- Cada cliente manda delta `JOIN` con `{ senderId, username, avatar }` al conectar
- Cada cliente manda delta `LEAVE` antes de desconectar
- Problema: si el browser se cierra sin desconectar, el usuario queda "fantasma"

**Opción B: Backend con SessionDisconnectEvent (robusto)**

```java
@EventListener
public void handleSessionDisconnect(SessionDisconnectEvent event) {
    // Extraer userId de la sesión
    // Broadcastear delta LEAVE al canal correspondiente
}
```

**Modificar** `ProjectDelta.java` — agregar `senderId` como campo de primera clase:

```java
private String senderId;  // UUID del cliente que originó el delta
```

---

### 6. Frontend — Servicio de colaboración

**Nuevo archivo**: `app/src/services/collaborationApi.ts`

```typescript
import api from './api';

export interface Collaborator {
  userId: number;
  username: string;
  avatar: string | null;
  role: 'EDITOR' | 'VIEWER';
  joinedAt: string;
}

export const inviteCollaborator = (projectId: number, username: string, role: string) =>
    api.post(`/manage/${projectId}/invite`, { username, role });

export const getCollaborators = (projectId: number) =>
    api.get<Collaborator[]>(`/manage/${projectId}/collaborators`);

export const removeCollaborator = (projectId: number, userId: number) =>
    api.delete(`/manage/${projectId}/collaborators/${userId}`);

export const getSharedProjects = () =>
    api.get('/manage/shared-with-me');
```

---

### 7. Frontend — UI de invitación

**Nuevo componente**: `app/src/components/CollaboratorsModal.tsx`

- Botón "Invite" en el topbar del proyecto (solo visible si sos owner)
- Modal con:
  - Input de username
  - Selector de rol (EDITOR / VIEWER)
  - Botón "Enviar invitación"
  - Lista de colaboradores actuales con botón de remover (solo owner)
  - Indicador de estado online/offline de cada colaborador

**Modificar**: `app/src/pages/ProjectPage.tsx`
- Agregar botón y renderizar el modal

---

### 8. Frontend — Presencia en el canvas

**Modificar**: `app/src/services/NetworkManager.ts`

```typescript
// Nuevas acciones
export type DeltaAction = 'PUSH' | 'POP' | 'UPDATE_WEIGHT' | 'MOVE_NODE' | 'CREATE_NODE' | 'DELETE_NODE' | 'JOIN' | 'LEAVE';

// Al conectar exitosamente:
sendDelta('JOIN', 'system', { senderId, username, avatar });

// Al desconectar:
sendDelta('LEAVE', 'system', { senderId, username });
```

**Nuevo componente**: `app/src/components/sandbox/PresenceBar.tsx`

- Renderizar avatares/nombres de usuarios conectados
- Posición: esquina superior del canvas o en el topbar
- Actualizar con deltas JOIN/LEAVE

**Estado de presencia** en `SimulationCanvas.tsx`:

```typescript
const [connectedUsers, setConnectedUsers] = useState<Map<string, {username: string, avatar: string}>>(new Map());

// En handleRemoteDelta:
if (delta.action === 'JOIN') {
    setConnectedUsers(prev => new Map(prev).set(payload.senderId, { username: payload.username, avatar: payload.avatar }));
}
if (delta.action === 'LEAVE') {
    setConnectedUsers(prev => { const m = new Map(prev); m.delete(payload.senderId); return m; });
}
```

---

### 9. Frontend — Proyectos compartidos en el dashboard

**Modificar**: La página de "Mis Proyectos" (o `Dashboard.tsx`)

- Nueva sección "Compartidos conmigo" debajo de los proyectos propios
- Llamar a `getSharedProjects()` y renderizar con un badge del rol (EDITOR/VIEWER)
- Click en un proyecto compartido lleva al canvas igual que uno propio

---

## Orden de implementación

```
1. Entidad + Repositorio + tabla en la DB              (backend)
2. Endpoints invite/collaborators/remove/shared        (backend)
3. Modificar validación de acceso en ProjectService    (backend)
4. collaborationApi.ts                                  (frontend)
5. UI de invitación (modal + botón)                    (frontend)
6. Proyectos compartidos en dashboard                  (frontend)
7. Sistema de presencia (JOIN/LEAVE)                   (full-stack)
8. Validación WebSocket con JWT                        (backend, opcional)
```

---

## Decisiones pendientes

- [ ] ¿EDITOR puede hacer `update` del proyecto (guardar canvas)? → Probablemente sí
- [ ] ¿VIEWER puede conectarse al WebSocket y ver en tiempo real pero no enviar deltas?
- [ ] ¿La presencia se maneja solo en frontend (simple) o con tracking en backend (robusto)?
- [ ] ¿Invitación solo por username o también por link compartible?
- [ ] ¿Notificación al usuario invitado? (in-app o nada por ahora)

---

## Archivos afectados (resumen)

### Nuevos:
- `api/src/main/java/com/lab1/nodevix/project/ProjectCollaborator.java`
- `api/src/main/java/com/lab1/nodevix/project/ProjectCollaboratorRepository.java`
- `api/src/main/java/com/lab1/nodevix/project/dtos/InviteRequest.java`
- `api/src/main/java/com/lab1/nodevix/project/dtos/CollaboratorResponse.java`
- `app/src/services/collaborationApi.ts`
- `app/src/components/CollaboratorsModal.tsx`
- `app/src/components/sandbox/PresenceBar.tsx`

### Modificados:
- `api/src/main/java/com/lab1/nodevix/project/ProjectController.java`
- `api/src/main/java/com/lab1/nodevix/project/ProjectService.java`
- `api/src/main/java/com/lab1/nodevix/ProjectDelta.java`
- `api/src/main/java/com/lab1/nodevix/WebSocketConfig.java` (si se agrega auth)
- `app/src/services/NetworkManager.ts`
- `app/src/components/sandbox/SimulationCanvas.tsx`
- `app/src/pages/ProjectPage.tsx`
- Dashboard/página de proyectos
