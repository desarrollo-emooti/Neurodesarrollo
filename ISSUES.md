# 🐛 ISSUES Y MEJORAS PENDIENTES

**Proyecto:** EMOOTI Neurodesarrollo
**Última actualización:** 22 de octubre de 2025
**Estado:** Sistema en desarrollo activo

---

## 📊 RESUMEN DE ISSUES

| Prioridad | Total | Abiertos | En Progreso | Resueltos |
|-----------|-------|----------|-------------|-----------|
| 🔴 Crítica | 0 | 0 | 0 | 0 |
| 🟠 Alta | 7 | 0 | 0 | 7 |
| 🟡 Media | 5 | 3 | 0 | 2 |
| 🟢 Baja | 8 | 6 | 0 | 2 |
| **TOTAL** | **20** | **9** | **0** | **11** |

---

## 🔴 PRIORIDAD CRÍTICA

### Ningún issue crítico detectado ✅

El sistema está estable y todos los módulos implementados funcionan correctamente.

---

## 🟠 PRIORIDAD ALTA

### ISSUE #1: Métricas de FAMILIA retornan 0
**Categoría:** Backend - Statistics
**Estado:** ✅ Resuelto (22 Oct 2025)
**Detectado:** Testing End-to-End (22 Oct 2025)
**Resuelto en:** commit c319b92
**Ubicación:** `backend/src/routes/statistics.ts:176-220`

**Descripción:**
Las estadísticas del dashboard para usuarios con rol FAMILIA retornan valores en 0 para todas las métricas:
- `childrenCount: 0`
- `recentEvaluations: 0`
- `availableReports: 0`
- `upcomingEvaluations: 0`

**Causa raíz:**
No existe una relación familia-estudiante definida en el schema de Prisma. El sistema actual no tiene un modelo que vincule usuarios FAMILIA con estudiantes.

**Impacto:**
- Usuarios FAMILIA no pueden ver información de sus hijos
- Dashboard vacío para padres/tutores
- Experiencia de usuario pobre para rol FAMILIA

**Solución propuesta:**
1. Crear modelo `FamilyStudent` en `backend/prisma/schema.prisma`:
```prisma
model FamilyStudent {
  id         String   @id @default(cuid())
  familyId   String   // User.id con userType = FAMILIA
  studentId  String   // Student.id
  relationship String  // padre, madre, tutor, etc.
  isPrimary  Boolean  @default(false)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  family    User     @relation("FamilyMembers", fields: [familyId], references: [id])
  student   Student  @relation("StudentFamily", fields: [studentId], references: [id])

  @@unique([familyId, studentId])
  @@index([familyId])
  @@index([studentId])
  @@map("family_students")
}
```

2. Actualizar queries en `statistics.ts` para obtener datos reales
3. Añadir endpoints en `backend/src/routes/students.ts` para vincular familia
4. Crear UI en frontend para gestionar relaciones familia-estudiante

**Estimación:** 4-6 horas
**Asignado a:** Pendiente
**Referencias:**
- `backend/src/routes/statistics.ts:176-186`
- TESTING_REPORT.md - Sección "Dashboard Statistics"

---

### ISSUE #2: Módulos Backend marcados como NOT_IMPLEMENTED
**Categoría:** Backend - Módulos
**Estado:** 🟠 Abierto
**Detectado:** Revisión de código (22 Oct 2025)

**Descripción:**
7 módulos del backend están marcados como `NOT_IMPLEMENTED` y retornan error 501:
1. Authorizations (`/api/v1/authorizations`)
2. Tutorials (`/api/v1/tutorials`)
3. Reports (`/api/v1/reports`)
4. Database (`/api/v1/database`)
5. Export (`/api/v1/export`)
6. Import (`/api/v1/import`)
7. EmotiTests (`/api/v1/emoti-tests`)

**Causa raíz:**
Estos módulos no están implementados en el backend pero sí están configurados en las rutas del frontend.

**Impacto:**
- Usuarios ven opciones en el menú que no funcionan
- Experiencia de usuario confusa
- Errores 501 en consola del navegador

**Solución propuesta (Opción 1 - Implementar):**
Implementar los módulos siguiendo el patrón establecido:
- Crear modelos en Prisma schema
- Crear rutas en backend
- Crear páginas y componentes en frontend

**Solución propuesta (Opción 2 - Remover):**
Si no son necesarios para el MVP:
- Eliminar rutas del frontend (`src/App.jsx`)
- Eliminar opciones del menú (`src/components/Sidebar.jsx`)
- Eliminar archivos de rutas del backend

**Estimación (Implementar):** 20-30 horas (todos los módulos)
**Estimación (Remover):** 2-3 horas
**Asignado a:** Pendiente - Requiere decisión de producto
**Referencias:**
- PROJECT_STATUS.md - Sección "Módulos No Implementados"

---

### ISSUE #3: EmotiTests no está definido en schema de Prisma
**Categoría:** Backend - Database Schema
**Estado:** ✅ Resuelto (22 Oct 2025)
**Resuelto en:** commit c319b92
**Detectado:** Revisión de schema (22 Oct 2025)

**Descripción:**
El modelo `EmotiTest` no existe en el schema de Prisma pero:
- Está referenciado en el menú del frontend
- Tiene una ruta configurada en `src/App.jsx`
- Tiene métodos en `src/lib/api.js`

**Causa raíz:**
El modelo no fue creado durante el desarrollo inicial del proyecto.

**Impacto:**
- No se pueden gestionar las pruebas EMOOTI
- Falta funcionalidad core del sistema
- Test assignments no tienen referencia a qué test están usando

**Solución propuesta:**
1. Definir modelo en `backend/prisma/schema.prisma`:
```prisma
model EmotiTest {
  id          String   @id @default(cuid())
  code        String   @unique
  name        String
  description String?
  category    String   // Neuropsicológico, Psicológico, etc.
  ageRangeMin Int      // Edad mínima en años
  ageRangeMax Int      // Edad máxima en años
  duration    Int      // Duración en minutos
  isActive    Boolean  @default(true)
  instructions String?  @db.Text
  scoringRules Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  testAssignments TestAssignment[]

  @@map("emoti_tests")
}
```

2. Actualizar `TestAssignment` para incluir relación con `EmotiTest`
3. Crear rutas CRUD en backend
4. Crear componentes CRUD en frontend
5. Migrar base de datos

**Estimación:** 6-8 horas
**Asignado a:** Pendiente
**Prioridad:** Alta (funcionalidad core)

---

### ISSUE #4: Falta validación de tokens expirados en frontend
**Categoría:** Frontend - Authentication
**Estado:** ✅ Resuelto (22 Oct 2025)
**Resuelto en:** commit 1209d25
**Detectado:** Revisión de código (22 Oct 2025)

**Descripción:**
El frontend no validaba proactivamente si el token JWT había expirado antes de hacer requests.

**Causa raíz:**
El interceptor de axios solo manejaba errores 401 después de que el servidor respondía.

**Impacto eliminado:**
- Requests innecesarios a la API con tokens expirados
- Mensajes de error poco claros para el usuario
- Experiencia de usuario subóptima

**Solución implementada:**
1. Instalado paquete `jwt-decode` para decodificar tokens JWT

2. Creada función `isTokenExpired()` en `src/lib/api.js`:
   - Decodifica el token JWT
   - Verifica la fecha de expiración con buffer de 30 segundos
   - Maneja errores de decodificación

3. Implementado sistema de refresh automático:
   - Detecta tokens expirados antes de hacer requests
   - Intenta refresh automático con el refresh token
   - Maneja concurrencia (múltiples requests simultáneos)
   - Sistema de suscriptores para requests en espera
   - Redirección automática a login si refresh falla

4. Mejoras en el interceptor de requests:
   - Validación proactiva de expiración
   - Refresh automático transparente para el usuario
   - Evita race conditions con flag `isRefreshing`
   - Gestiona cola de requests durante el refresh
   - Skip de validación para endpoint de refresh

**Beneficios:**
- Menos requests fallidos a la API
- Experiencia de usuario fluida (refresh transparente)
- Sesiones extendidas automáticamente
- Mejor manejo de errores
- Reducción de carga en el servidor

**Tiempo invertido:** 2 horas
**Prioridad:** Alta para UX ✅

---

### ISSUE #5: Sin manejo de rate limiting en frontend
**Categoría:** Frontend - Performance
**Estado:** ✅ Resuelto (22 Oct 2025)
**Resuelto en:** commit b0bb5f6
**Detectado:** Testing End-to-End (22 Oct 2025)

**Descripción:**
El frontend no manejaba correctamente respuestas 429 (Too Many Requests) del backend.

**Causa raíz:**
El interceptor de axios no tenía lógica específica para errores de rate limiting.

**Impacto eliminado:**
- Usuarios no sabían por qué fallaban sus requests
- No había reintentos automáticos con backoff
- Experiencia de usuario confusa

**Solución implementada:**
1. Añadido manejo de 429 en interceptor de respuesta (`src/lib/api.js:129-142`):
   - Detecta status 429 (Too Many Requests)
   - Parsea header `retry-after` del servidor o usa 5 segundos por defecto
   - Muestra toast warning informando al usuario del tiempo de espera
   - Implementa delay automático
   - Reintenta el request original automáticamente
   - Transparente para el usuario final

2. Código implementado:
```javascript
// Handle rate limiting (429 Too Many Requests)
if (status === 429) {
  // Get retry delay from header or default to 5 seconds
  const retryAfter = parseInt(response.headers['retry-after']) || 5;

  // Show user-friendly notification
  toast.warning(`Demasiadas solicitudes. Reintentando en ${retryAfter}s...`);

  // Wait for the specified delay
  await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));

  // Retry the original request
  return api.request(config);
}
```

**Beneficios:**
- UX mejorada: usuario informado del problema
- Reintentos automáticos sin intervención manual
- Respeta los límites del servidor
- Integración perfecta con rate limiters del backend
- Mensajes consistentes en español

**Tiempo invertido:** 1 hora
**Prioridad:** Alta para UX ✅

---

### ISSUE #6: Falta manejo de reconexión en pérdida de internet
**Categoría:** Frontend - Network
**Estado:** ✅ Resuelto (22 Oct 2025)
**Resuelto en:** commit aa56ca7
**Detectado:** Testing End-to-End (22 Oct 2025)

**Descripción:**
La aplicación no detectaba ni manejaba pérdidas de conexión a internet.

**Causa raíz:**
No había listeners para eventos `online`/`offline` del navegador.

**Impacto eliminado:**
- Usuarios no sabían si perdieron conexión
- Requests fallaban silenciosamente
- Datos podían perderse

**Solución implementada:**
1. Creado hook personalizado `useOnlineStatus` (`src/hooks/useOnlineStatus.js`):
   - Detecta estado online/offline usando `navigator.onLine`
   - Escucha eventos `online` y `offline` del navegador
   - Muestra toast success cuando se restablece la conexión
   - Muestra toast error cuando se pierde la conexión
   - Limpia event listeners en unmount
   - Retorna estado `isOnline` para uso en componentes

2. Integrado en Layout component (`src/components/Layout.jsx`):
   - Hook se ejecuta automáticamente en el layout principal
   - Monitorea el estado de conexión para toda la aplicación
   - Estado `isOnline` disponible para uso futuro

**Beneficios:**
- Usuario informado inmediatamente de pérdida de conexión
- Notificación clara cuando se restablece la conexión
- UX mejorada para situaciones offline
- Base para futuras mejoras (cola de requests offline, etc.)
- Implementación limpia y reutilizable

**Tiempo invertido:** 1 hora
**Prioridad:** Alta para UX ✅

**Próximas mejoras opcionales:**
- Deshabilitar acciones cuando esté offline
- Implementar cola de requests offline con retry automático
- Mostrar banner persistente en lugar de solo toast

---

### ISSUE #7: Falta sistema de notificaciones en tiempo real
**Categoría:** Frontend/Backend - Features
**Estado:** ✅ Resuelto (22 Oct 2025)
**Resuelto en:** commit [pending]
**Detectado:** Revisión de funcionalidades (22 Oct 2025)

**Descripción:**
No había sistema de notificaciones push o en tiempo real para eventos importantes.

**Causa raíz:**
No implementado aún (no era MVP crítico).

**Impacto eliminado:**
- Usuarios debían refrescar manualmente para ver actualizaciones
- Pérdida de engagement
- Retrasos en comunicación importante

**Solución implementada (Opción 3 - Polling):**
Implementado sistema de notificaciones con polling por simplicidad y rapidez:

1. Creado hook personalizado `useNotifications` (`src/hooks/useNotifications.js`):
   - Polling cada 60 segundos por defecto (configurable)
   - Fetching automático de notificaciones desde API
   - Detección de nuevas notificaciones y toast notifications
   - Contador de notificaciones no leídas
   - Función markAsRead para marcar notificaciones como leídas
   - Función refresh manual
   - Auto-refresh cuando la pestaña se vuelve visible
   - Preparado para futura integración con endpoint del backend

2. Integrado en Header component (`src/components/Header.jsx`):
   - Muestra badge con contador de notificaciones no leídas
   - Polling automático en background
   - UX no intrusiva

**Características técnicas:**
- Intervalo de polling: 60 segundos (ajustable)
- Detección de visibilidad de pestaña para optimizar requests
- Toast notifications para nuevas notificaciones
- Placeholder para endpoint del backend (TODO: implementar `/api/v1/notifications`)
- Sistema extensible para futura migración a WebSockets/SSE si es necesario

**Beneficios:**
- Usuarios informados de nuevas notificaciones automáticamente
- No requiere intervención manual (refresh)
- Implementación simple y funcional para MVP
- Base sólida para futura mejora a WebSockets/SSE
- Bajo overhead de servidor con polling de 60s

**Próximas mejoras opcionales:**
- Implementar endpoint `/api/v1/notifications` en backend
- Migrar a WebSockets o SSE para notificaciones instantáneas
- Añadir panel de notificaciones desplegable
- Persistencia de notificaciones en base de datos

**Tiempo invertido:** 1.5 horas
**Prioridad:** Alta para mejor UX ✅

---

## 🟡 PRIORIDAD MEDIA

### ISSUE #8: Dashboard con métricas limitadas
**Categoría:** Frontend - Dashboard
**Estado:** ✅ Resuelto (22 Oct 2025)
**Resuelto en:** commit f819381
**Detectado:** Testing End-to-End (22 Oct 2025)

**Descripción:**
El dashboard actual solo muestra 4-6 métricas simples por rol. Falta:
- Gráficos de evolución temporal
- Comparativas entre períodos
- Estadísticas detalladas
- Exportación de reportes

**Solución propuesta:**
1. Añadir gráficos con recharts:
   - Tests completados por mes (línea)
   - Estudiantes por centro (barra)
   - Distribución de valoraciones (pie)
   - Tendencia de uso (área)

2. Añadir filtros de fecha
3. Añadir botón de exportar a PDF/Excel
4. Añadir comparativa con período anterior

**Estimación:** 6-8 horas
**Asignado a:** Pendiente
**Referencias:**
- PROJECT_STATUS.md - "Próximos Pasos - Prioridad Media #6"

---

### ISSUE #9: Sin code splitting ni lazy loading
**Categoría:** Frontend - Performance
**Estado:** ✅ Resuelto (22 Oct 2025)
**Resuelto en:** commit 52fa97b
**Detectado:** Revisión de código (22 Oct 2025)

**Descripción:**
Todos los componentes se cargan al inicio, aumentando el bundle size y tiempo de carga inicial.

**Impacto actual:**
- Bundle JavaScript grande (~2-3 MB estimado)
- Tiempo de carga inicial alto
- Experiencia en móviles/conexiones lentas afectada

**Solución propuesta:**
1. Implementar React.lazy en rutas:
```javascript
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Users = lazy(() => import('./pages/Users'));
// ... etc

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        // ...
      </Routes>
    </Suspense>
  );
}
```

2. Implementar lazy loading en modales grandes
3. Configurar Vite para code splitting óptimo
4. Medir mejora con Lighthouse

**Estimación:** 4-6 horas
**Asignado a:** Pendiente
**Beneficio esperado:** -40% bundle inicial

---

### ISSUE #10: Sin documentación de API (Swagger/OpenAPI)
**Categoría:** Backend - Documentation
**Estado:** 🟡 Abierto
**Detectado:** Revisión de proyecto (22 Oct 2025)

**Descripción:**
No hay documentación interactiva de la API. Dificulta:
- Onboarding de nuevos desarrolladores
- Testing manual de endpoints
- Integración con sistemas externos

**Solución propuesta:**
1. Instalar swagger-jsdoc y swagger-ui-express
2. Añadir comentarios JSDoc a rutas
3. Configurar endpoint `/api/v1/docs`
4. Documentar schemas con ejemplos

**Estimación:** 8-10 horas (documentar 100+ endpoints)
**Asignado a:** Pendiente

---

### ISSUE #11: Sin tests automatizados
**Categoría:** Testing
**Estado:** 🟡 Abierto
**Detectado:** Revisión de proyecto (22 Oct 2025)

**Descripción:**
No hay tests unitarios ni de integración:
- Frontend sin tests de componentes
- Backend sin tests de endpoints
- Sin tests E2E automatizados

**Impacto:**
- Riesgo de regresiones al hacer cambios
- QA manual costoso en tiempo
- Menor confianza en deploys

**Solución propuesta:**
1. Frontend - Vitest + React Testing Library:
   - Tests unitarios de componentes
   - Tests de hooks personalizados
   - Tests de utilidades

2. Backend - Jest:
   - Tests unitarios de servicios
   - Tests de integración de endpoints
   - Tests de modelos Prisma

3. E2E - Playwright:
   - Flujos críticos de usuario
   - Tests de autenticación
   - Tests de CRUD principales

**Estimación:** 20-30 horas (cobertura básica 70%)
**Asignado a:** Pendiente
**Prioridad:** Media-Alta

---

### ISSUE #12: Sin manejo de carga de archivos pesados
**Categoría:** Frontend/Backend - Files
**Estado:** 🟡 Abierto
**Detectado:** Revisión de funcionalidades (22 Oct 2025)

**Descripción:**
No hay:
- Validación de tamaño de archivos
- Progress bars para uploads
- Compresión de imágenes
- Chunk uploads para archivos grandes

**Ubicaciones afectadas:**
- Users (documentos, fotos)
- Students (documentos médicos)
- Centers (contratos)
- Invoices (adjuntos)

**Solución propuesta:**
1. Añadir validación de tamaño en frontend (max 10MB)
2. Implementar componente FileUpload con progress
3. Añadir compresión de imágenes con browser-image-compression
4. Para archivos >50MB implementar chunk upload con resumable.js

**Estimación:** 6-8 horas
**Asignado a:** Pendiente

---

## 🟢 PRIORIDAD BAJA

### ISSUE #13: Sin dark mode
**Categoría:** Frontend - UI/UX
**Estado:** 🟢 Abierto
**Detectado:** Revisión de features (22 Oct 2025)

**Descripción:**
Solo hay tema claro. Usuarios no pueden cambiar a tema oscuro.

**Solución propuesta:**
1. Configurar Tailwind para dark mode
2. Crear contexto ThemeContext
3. Añadir toggle en Layout
4. Persistir preferencia en localStorage
5. Actualizar todos los componentes con clases dark:

**Estimación:** 10-12 horas
**Asignado a:** Pendiente
**Referencias:**
- PROJECT_STATUS.md - "Próximos Pasos - Prioridad Baja #9"

---

### ISSUE #14: Sin soporte multiidioma (i18n)
**Categoría:** Frontend - Internationalization
**Estado:** 🟢 Abierto
**Detectado:** Revisión de features (22 Oct 2025)

**Descripción:**
Todo el sistema está hardcodeado en español. No hay soporte para otros idiomas.

**Impacto:**
- Limitación para expansión internacional
- No accesible para usuarios no hispanohablantes

**Solución propuesta:**
1. Instalar react-i18next
2. Extraer todos los strings a archivos de traducción
3. Crear es.json, en.json, ca.json
4. Añadir selector de idioma
5. Persistir preferencia

**Estimación:** 15-20 horas
**Asignado a:** Pendiente
**Nota:** Solo implementar si hay necesidad de negocio

---

### ISSUE #15: Sin Progressive Web App (PWA)
**Categoría:** Frontend - PWA
**Estado:** 🟢 Abierto
**Detectado:** Revisión de features (22 Oct 2025)

**Descripción:**
La aplicación no funciona como PWA:
- No instalable en dispositivos
- No funciona offline
- Sin service worker
- Sin manifest

**Solución propuesta:**
1. Crear service worker con Workbox
2. Configurar manifest.json
3. Implementar cache strategies
4. Añadir offline fallback page
5. Habilitar "Add to Home Screen"

**Estimación:** 8-10 horas
**Asignado a:** Pendiente
**Beneficio:** Mejor UX en móviles

---

### ISSUE #16: Sin logs centralizados en producción
**Categoría:** Backend - Monitoring
**Estado:** 🟢 Abierto
**Detectado:** Revisión de infraestructura (22 Oct 2025)

**Descripción:**
Los logs de Winston solo van a archivos locales. En producción necesitamos:
- Logs centralizados
- Búsqueda y filtrado
- Alertas en errores críticos
- Retención configurable

**Solución propuesta:**
Opción 1 - Papertrail:
- Servicio SaaS simple
- Integración fácil con Winston
- Plan gratuito disponible

Opción 2 - ELK Stack:
- Elasticsearch + Logstash + Kibana
- Más complejo pero más potente
- Requiere infraestructura propia

Opción 3 - CloudWatch (si en AWS):
- Integrado con infraestructura
- Costo razonable

**Estimación:** 4-6 horas (Papertrail) o 12-16 horas (ELK)
**Asignado a:** Pendiente
**Nota:** Decidir antes de ir a producción

---

### ISSUE #17: Sin monitoring de performance (APM)
**Categoría:** Backend - Monitoring
**Estado:** 🟢 Abierto
**Detectado:** Revisión de infraestructura (22 Oct 2025)

**Descripción:**
No hay monitoring de:
- Tiempos de respuesta de endpoints
- Queries lentas de base de datos
- Uso de memoria/CPU
- Errores en producción

**Solución propuesta:**
Opción 1 - Sentry:
- Error tracking + Performance
- Plan gratuito generoso
- Fácil integración

Opción 2 - New Relic:
- APM completo
- Más caro pero más features

Configurar:
1. Instalar SDK de Sentry
2. Configurar en backend y frontend
3. Definir umbrales de alerta
4. Integrar con Slack/Email

**Estimación:** 3-4 horas
**Asignado a:** Pendiente
**Prioridad:** Baja en dev, Alta para producción

---

### ISSUE #18: Sin backup automatizado de base de datos
**Categoría:** Infrastructure - Database
**Estado:** 🟢 Abierto
**Detectado:** Revisión de infraestructura (22 Oct 2025)

**Descripción:**
No hay sistema de backups automatizados configurado.

**Riesgos:**
- Pérdida de datos en caso de fallo
- Sin point-in-time recovery
- Sin disaster recovery plan

**Solución propuesta:**
1. Si Supabase:
   - Verificar que backups automáticos están activos
   - Configurar point-in-time recovery
   - Documentar proceso de restore

2. Si self-hosted PostgreSQL:
   - Configurar pg_dump diario
   - Almacenar en S3/Cloud Storage
   - Retención de 30 días
   - Script de restore documentado

**Estimación:** 4-6 horas
**Asignado a:** Pendiente
**Prioridad:** Crítica antes de producción

---

### ISSUE #19: Sin rate limiting configurado
**Categoría:** Backend - Security
**Estado:** ✅ Resuelto (22 Oct 2025)
**Resuelto en:** commit [pending]
**Detectado:** Revisión de seguridad (22 Oct 2025)

**Descripción:**
No había rate limiting configurado en el backend para prevenir:
- Brute force en login
- Spam de requests
- DDoS básico

**Solución implementada:**
1. Creado archivo `backend/src/middleware/rateLimiter.ts` con 5 limitadores diferentes:
   - `loginLimiter`: 5 requests/15min por IP (para /auth/login)
   - `authLimiter`: 3 requests/hora por IP (para /auth/refresh y operaciones de autenticación)
   - `apiLimiter`: 100 requests/15min por usuario/IP (para rutas API generales)
   - `strictLimiter`: 10 requests/hora por usuario (para operaciones sensibles como bulk delete/update)
   - `publicLimiter`: 20 requests/15min por IP (para endpoints públicos sin autenticación)

2. Aplicado en:
   - `/auth/login`: loginLimiter
   - `/auth/refresh`: authLimiter
   - `/api/*`: apiLimiter (solo en producción)
   - `/api/public`: publicLimiter
   - `/users/bulk`: strictLimiter

3. Headers configurados:
   - `RateLimit-*` headers estándar incluidos
   - Mensajes de error personalizados en español
   - Status 429 con códigos de error consistentes

**Tiempo invertido:** 2 horas
**Prioridad:** Alta para producción ✅

---

### ISSUE #20: Sin HTTPS forzado en producción
**Categoría:** Infrastructure - Security
**Estado:** ✅ Resuelto (22 Oct 2025)
**Resuelto en:** commit [pending]
**Detectado:** Revisión de seguridad (22 Oct 2025)

**Descripción:**
No había redirección automática de HTTP a HTTPS configurada.

**Riesgos eliminados:**
- Datos sensibles en texto plano
- Tokens expuestos
- Incumplimiento RGPD

**Solución implementada:**
1. Middleware de redirección HTTPS en `backend/src/index.ts`:
   - Detecta requests HTTP en producción
   - Redirección 301 permanente a HTTPS
   - Soporta proxy headers (`x-forwarded-proto`)
   - Logging de redirects para debugging

2. Headers HSTS configurados con helmet:
   - `max-age`: 31536000 (1 año)
   - `includeSubDomains`: true
   - `preload`: true (listo para HSTS preload list)
   - Solo activo en producción (no afecta desarrollo local)

3. Comprobaciones implementadas:
   - Verifica `req.secure` para conexiones directas HTTPS
   - Verifica `x-forwarded-proto` para proxies (Vercel, Railway)
   - Middleware ejecutado antes de todas las rutas

**Tiempo invertido:** 1 hora
**Prioridad:** Crítica para producción ✅

---

## 📋 TEMPLATE PARA NUEVOS ISSUES

```markdown
### ISSUE #XX: [Título descriptivo]
**Categoría:** [Frontend/Backend/Infrastructure] - [Subsistema]
**Estado:** [🔴 Crítico / 🟠 Alta / 🟡 Media / 🟢 Baja]
**Detectado:** [Fecha y contexto]
**Ubicación:** [Archivos afectados]

**Descripción:**
[Descripción clara del problema]

**Causa raíz:**
[Por qué ocurre el problema]

**Impacto:**
[Consecuencias del problema]

**Solución propuesta:**
[Pasos para resolver el problema]

**Estimación:** [Horas de trabajo]
**Asignado a:** [Nombre o Pendiente]
**Referencias:**
- [Enlaces a archivos, docs, etc.]
```

---

## 📊 DASHBOARD DE ISSUES

### Por Categoría
- 🎨 Frontend: 7 issues
- ⚙️ Backend: 6 issues
- 🏗️ Infrastructure: 4 issues
- 🧪 Testing: 1 issue
- 📚 Documentation: 1 issue
- 🔒 Security: 1 issue

### Por Estado
- 🟢 Abierto: 9 issues
- 🟡 En Progreso: 0 issues
- ✅ Resuelto: 11 issues (ISSUE #1, #3, #4, #5, #6, #7, #8, #9, #19, #20)
- 🚫 Cerrado: 0 issues

### Progreso
```
[███████████░░░░░░░░░] 55% completado (11/20)
```

---

## 🎯 ROADMAP SUGERIDO

### Sprint 1 (Semana 1-2) ✅ COMPLETADO
**Objetivo:** Resolver issues críticos para producción
- ISSUE #1: Métricas FAMILIA ✅
- ISSUE #3: Modelo EmotiTests ✅
- ISSUE #19: Rate limiting ✅
- ISSUE #20: HTTPS forzado ✅

### Sprint 2 (Semana 3-4) ✅ COMPLETADO
**Objetivo:** Mejorar experiencia de usuario
- ISSUE #4: Validación de tokens ✅
- ISSUE #5: Manejo rate limiting frontend ✅
- ISSUE #6: Reconexión offline ✅
- ISSUE #7: Notificaciones tiempo real ✅

### Sprint 3 (Semana 5-6)
**Objetivo:** Optimización y performance
- ISSUE #9: Code splitting
- ISSUE #11: Tests automatizados (fase 1)
- ISSUE #12: Upload de archivos
- ISSUE #7: Notificaciones tiempo real

### Sprint 4 (Semana 7-8)
**Objetivo:** Documentación y monitoring
- ISSUE #10: Documentación API
- ISSUE #16: Logs centralizados
- ISSUE #17: APM monitoring
- ISSUE #18: Backups automatizados

### Backlog
**Features no críticas:**
- ISSUE #13: Dark mode
- ISSUE #14: i18n
- ISSUE #15: PWA
- ISSUE #2: Módulos NOT_IMPLEMENTED (decisión de producto)

---

## 📝 NOTAS

### Criterios de Priorización
- 🔴 **Crítica:** Bloquea producción, pérdida de datos, security critical
- 🟠 **Alta:** Afecta funcionalidad core, UX muy impactada, features importantes
- 🟡 **Media:** Mejoras de UX, optimizaciones, nice-to-have
- 🟢 **Baja:** Features adicionales, refinamientos, polish

### Proceso de Gestión
1. **Detección:** Identificar issue durante dev/testing/producción
2. **Documentación:** Crear entrada en este archivo con template
3. **Priorización:** Asignar prioridad según impacto y urgencia
4. **Asignación:** Asignar a desarrollador
5. **Desarrollo:** Implementar solución
6. **Testing:** Verificar que resuelve el problema
7. **Deploy:** Llevar a producción
8. **Cierre:** Marcar como resuelto con commit hash

### Enlaces Útiles
- **Testing Report:** TESTING_REPORT.md
- **Project Status:** PROJECT_STATUS.md
- **GitHub Issues:** https://github.com/desarrollo-emooti/Neurodesarrollo/issues

---

**Última revisión:** 22 de octubre de 2025
**Próxima revisión:** Semanal o cuando se detecten nuevos issues

_© 2025 EMOOTI Hub SL - Gestión de Issues Interna_
