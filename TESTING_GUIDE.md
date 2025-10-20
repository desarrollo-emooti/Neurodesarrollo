# Guía de Pruebas - EMOOTI Sistema

## Estado Actual del Proyecto

### ✅ Módulos CRUD Implementados (100% funcionales)

1. **Users** (Usuarios) - Implementado previamente
2. **Centers** (Centros Educativos) - ✅ Completado
3. **Students** (Estudiantes) - ✅ Completado
4. **TestAssignments** (Asignación de Pruebas) - ✅ Completado
5. **TestResults** (Resultados de Pruebas) - ✅ Completado

---

## Cómo Probar los Módulos

### Requisitos Previos

1. **Servidores en ejecución:**
   - Frontend: `http://localhost:5173`
   - Backend: `http://localhost:3000`

2. **Credenciales de prueba:**
   - **Admin:** admin@emooti.com / admin123
   - **Clínica:** clinica@emooti.com / clinica123
   - **Orientador:** orientador@centroprueba.com / orientador123
   - **Familia:** familia@ejemplo.com / familia123

---

## 1. Prueba del Módulo de Centros (Centers)

### Acceso
1. Iniciar sesión como **Admin** o **Clínica**
2. Navegar a: **Gestión de Centros** en el menú lateral

### Funcionalidades a Probar

#### ✅ Ver lista de centros
- Verificar que se muestra la tabla con centros
- Comprobar columnas: Código, Nombre, Tipo, Responsable, Ubicación, Contacto, Estudiantes

#### ✅ Filtros
Probar los 4 filtros disponibles:
- **Buscar:** Buscar por nombre, código o ciudad
- **Tipo de Centro:** Filtrar por Público, Concertado, Privado
- **Provincia:** Seleccionar provincia específica
- **Comunidad Autónoma:** Seleccionar comunidad

#### ✅ Crear nuevo centro
1. Clic en "Nuevo Centro"
2. Completar formulario:
   - **Código:** CEN002 (único)
   - **Nombre:** Centro de Prueba
   - **Tipo:** Público/Concertado/Privado
   - **Responsable:** Nombre del director
   - **Teléfono:** +34 900 000 000
   - **Email:** centro@ejemplo.com
   - **Dirección completa:** Calle X, número Y
   - **Comunidad Autónoma:** Madrid
   - **Provincia:** Madrid (se habilita tras seleccionar comunidad)
   - **Ciudad:** Madrid
   - **Código Postal:** 28001
3. Clic en "Crear Centro"
4. Verificar mensaje de éxito
5. Verificar que aparece en la tabla

#### ✅ Editar centro
1. Clic en botón "Editar" (icono lápiz) de un centro
2. Modificar campos (ej: cambiar nombre, teléfono)
3. Nota: El código NO se puede modificar
4. Clic en "Guardar Cambios"
5. Verificar actualización en tabla

#### ✅ Eliminar centro (solo Admin)
1. Seleccionar checkbox de un centro
2. Clic en "Eliminar seleccionados"
3. Confirmar eliminación
4. Verificar que desaparece de la tabla

#### ✅ Paginación
- Si hay más de 20 centros, verificar botones "Anterior/Siguiente"

---

## 2. Prueba del Módulo de Estudiantes (Students)

### Acceso
1. Iniciar sesión como **Admin** o **Orientador**
2. Navegar a: **Gestión de Estudiantes** en el menú lateral

### Funcionalidades a Probar

#### ✅ Ver lista de estudiantes
- Verificar tabla con columnas: ID/NIA, Nombre, Edad, Etapa, Curso/Grupo, Centro, Consentimiento, Pago
- Verificar cálculo automático de edad desde fecha nacimiento

#### ✅ Filtros (6 disponibles)
Probar cada filtro:
- **Buscar:** Por nombre, NIA o DNI
- **Etapa:** Educación Infantil, Primaria, ESO, Bachillerato, FP
- **Centro:** Seleccionar centro específico
- **Consentimiento:** Sí, No, Pendiente, N/A
- **Estado de Pago:** Pagado, Pendiente, N/A

#### ✅ Crear nuevo estudiante
1. Clic en "Nuevo Estudiante"
2. Completar formulario por secciones:

**Información Básica:**
- Nombre Completo: Juan Pérez García
- Fecha de Nacimiento: 01/01/2010
- ID del Estudiante: EST001 (opcional)
- NIA: 12345678 (opcional)
- DNI: 12345678A (opcional)
- Género: Masculino/Femenino/Otro
- Nacionalidad: Española
- Teléfono: +34 600 000 000

**Información Académica:**
- Centro Educativo: Seleccionar de lista
- Etapa: Educación Primaria
- Curso: 4º
- Grupo/Clase: A

**Necesidades Especiales:**
- Grado de Discapacidad: 0-100%
- Necesidades Educativas Especiales: Texto libre
- Observaciones Médicas: Alergias, medicación, etc.
- Observaciones Generales: Notas adicionales

**Consentimiento y Pago:**
- Consentimiento: Pendiente/Sí/No/N/A
- Tipo de Pago: Escuela/Familia/Seguro/Subvención/Gratuito/N/A
- Estado del Pago: Pagado/Pendiente/N/A

3. Clic en "Crear Estudiante"
4. Verificar mensaje de éxito
5. Verificar aparición en tabla con edad calculada

#### ✅ Editar estudiante
1. Clic en "Editar" en fila del estudiante
2. Modificar campos necesarios
3. Verificar que centro está bloqueado si eres ORIENTADOR
4. Guardar cambios
5. Verificar actualización

#### ✅ Eliminar estudiante (Admin/Orientador)
1. Seleccionar checkbox
2. Clic en "Eliminar seleccionados"
3. Confirmar
4. Verificar eliminación

---

## 3. Prueba del Módulo de Asignación de Pruebas (TestAssignments)

### Acceso
1. Iniciar sesión como **Admin**, **Clínica** o **Orientador**
2. Navegar a: **Asignación de Pruebas** en el menú lateral

### Funcionalidades a Probar

#### ✅ Ver lista de asignaciones
Verificar tabla con columnas:
- Estudiante (nombre + ID)
- Prueba (título + indicador de enlace QR)
- Centro/Etapa
- Fecha Asignada
- Fecha Prueba
- Estado (con icono: ✓ Completada, ✗ No realizada, ⏱ Pendiente)
- Prioridad (Baja/Media/Alta/Urgente con colores)
- Consentimiento
- Acciones

#### ✅ Filtros (7 disponibles)
Probar cada filtro:
- **Buscar:** Por nombre prueba o estudiante
- **Centro:** Filtrar por centro específico
- **Etapa:** Filtrar por nivel educativo
- **Estado:** Completada/No realizada/Pendiente/N/A
- **Consentimiento:** Sí/No/Pendiente/N/A
- **Prioridad:** Baja/Media/Alta/Urgente

#### ✅ Crear nueva asignación
1. Clic en "Nueva Asignación"
2. Completar formulario:

**Estudiante:**
- Seleccionar estudiante de lista desplegable
- Muestra: Nombre (ID) - Centro

**Información de la Prueba:**
- Título de la Prueba: "Test de Raven's Progresivo"
- Enlace (opcional): https://ejemplo.com/test
- Fecha Programada: Seleccionar fecha futura
- Estado: Pendiente (por defecto)

**Prioridad y Consentimiento:**
- Prioridad: Media (por defecto)
- Consentimiento: Pendiente (por defecto)

**Notas:**
- Observaciones: "El estudiante debe realizar la prueba en silencio"

3. Clic en "Crear Asignación"
4. Verificar:
   - Mensaje de éxito
   - Aparece en tabla
   - Usuario actual asignado como "assignedBy"
   - Si tiene enlace, muestra icono de QR

#### ✅ Editar asignación
1. Clic en "Editar" de una asignación
2. Modificar campos:
   - Cambiar estado a "Completada" (SI)
   - Verificar que se auto-completa fecha de realización
   - Cambiar prioridad a "Alta"
   - Modificar enlace de prueba
3. Guardar cambios
4. Verificar actualización con nuevo icono de estado

#### ✅ Eliminar asignación (Admin/Clínica)
1. Seleccionar checkbox
2. Clic en "Eliminar seleccionadas"
3. Confirmar eliminación
4. Verificar desaparición

#### ✅ Badges y colores
Verificar que los badges muestran colores correctos:
- **Estado Completada:** Verde con ✓
- **Estado No realizada:** Rojo con ✗
- **Estado Pendiente:** Amarillo con ⏱
- **Prioridad Urgente:** Rojo
- **Prioridad Alta:** Naranja
- **Prioridad Media:** Azul
- **Prioridad Baja:** Gris

---

## 4. Prueba del Módulo de Resultados de Pruebas (TestResults)

### Acceso
1. Iniciar sesión como **Admin**, **Clínica** o **Examinador**
2. Navegar a: **Resultados de Pruebas** en el menú lateral

### Funcionalidades a Probar

#### ✅ Ver lista de resultados
Verificar tabla con columnas:
- ID (código único del resultado)
- Estudiante (nombre del estudiante)
- Prueba (nombre de la prueba realizada)
- Fecha (fecha de realización)
- Percentil (0-100 con código de colores)
- Interpretación (7 niveles: Muy Bajo a Muy Alto)
- Validado (badge clickable para Admin/Clínica)
- Origen (MANUAL, PDF_IMPORT, BULK_IMPORT, API)
- Acciones (Ver, Editar, Eliminar)

#### ✅ Código de colores de percentil
Verificar que los percentiles muestran colores correctos:
- **>75:** Verde (rendimiento alto)
- **50-75:** Azul (rendimiento medio-alto)
- **25-50:** Amarillo (rendimiento medio-bajo)
- **<25:** Rojo (requiere atención)

#### ✅ Filtros (6 disponibles)
Probar cada filtro:
- **Buscar:** Por nombre de estudiante o prueba
- **Etapa:** Educación Infantil/Primaria/ESO/Bachillerato/FP
- **Centro:** Filtrar por centro específico
- **Validado:** Sí/No (solo resultados validados o pendientes)
- **Interpretación:** Los 7 niveles disponibles
- **Origen:** Manual/PDF/Bulk/API

#### ✅ Estadísticas en tiempo real
Verificar 4 tarjetas de estadísticas:
- **Total de Resultados:** Contador total
- **Resultados Validados:** Cantidad de resultados aprobados
- **Pendientes de Validación:** Cantidad sin validar
- **Resultados Seleccionados:** Cantidad de checkboxes marcados

#### ✅ Crear nuevo resultado
1. Clic en "Nuevo Resultado"
2. Completar formulario por secciones:

**Estudiante:**
- Seleccionar estudiante de lista desplegable
- Muestra: Nombre (ID) - Centro

**Información de la Prueba:**
- Nombre de la Prueba: "WISC-V" (mínimo 3 caracteres)
- Año Académico: "2024/2025"
- Fecha de Realización: Seleccionar fecha (campo date)

**Puntuaciones y Resultados:**
- Puntuación Bruta: 45.5 (decimal, opcional)
- Percentil: 75 (0-100, opcional)
- Puntuación Estándar: 110.00 (decimal, opcional)
- Interpretación: Seleccionar de 7 opciones (MEDIO por defecto)

**Observaciones:**
- Observaciones Generales: Texto libre
- Incidencias Durante la Prueba: Texto libre

3. Clic en "Crear Resultado"
4. Verificar:
   - Mensaje de éxito
   - Aparece en tabla con código de color correcto
   - Origen = MANUAL
   - Validado = No

#### ✅ Editar resultado
1. Clic en "Editar" de un resultado
2. Verificar que se cargan todos los datos previos
3. Modificar campos:
   - Cambiar percentil y verificar cambio de color
   - Actualizar interpretación
   - Añadir observaciones
4. Guardar cambios
5. Verificar actualización en tabla

#### ✅ Validar resultado (Admin/Clínica)
1. Clic en badge "No validado" de un resultado
2. Confirmar validación en diálogo
3. Verificar:
   - Badge cambia a "Validado" (verde)
   - Fecha de validación se registra
   - Usuario validador se guarda

4. Clic en badge "Validado"
5. Confirmar desvalidación
6. Verificar que vuelve a "No validado" (amarillo)

#### ✅ Eliminar resultado (Solo Admin)
1. Seleccionar checkbox de un resultado
2. Clic en "Eliminar seleccionados"
3. Confirmar eliminación
4. Verificar desaparición de tabla

#### ✅ Paginación
- Si hay más de 20 resultados, verificar botones "Anterior/Siguiente"
- Verificar que el contador muestra "Mostrando X-Y de Z resultados"

#### ✅ Selección múltiple
1. Marcar checkbox de varios resultados
2. Verificar que "Resultados Seleccionados" se actualiza
3. Usar "Eliminar seleccionados" para eliminar en lote

---

## 5. Permisos por Rol

### ADMINISTRADOR
- ✅ Puede ver todos los módulos
- ✅ Puede crear, editar y eliminar en todos los módulos
- ✅ No tiene restricciones de centro

### CLÍNICA
- ✅ Puede ver centros asignados
- ✅ Puede crear y editar asignaciones de pruebas
- ✅ Puede eliminar asignaciones
- ✅ Ve solo estudiantes de sus centros

### ORIENTADOR
- ✅ Puede ver solo su centro
- ✅ Puede crear y editar estudiantes de su centro
- ✅ Puede crear asignaciones de pruebas
- ✅ Centro auto-seleccionado en formularios
- ✅ Campo centro bloqueado en edición

### FAMILIA
- ⚠️ Solo ve estudiantes relacionados
- ⚠️ No puede crear ni eliminar
- ⚠️ Solo lectura de asignaciones

---

## 5. Validaciones a Verificar

### Formularios
- ✅ Campos requeridos marcados con *
- ✅ Mensajes de error claros en rojo
- ✅ Validación de email (formato correcto)
- ✅ Validación de URL (debe incluir http:// o https://)
- ✅ Código postal: 5 dígitos
- ✅ Provincias se habilitan tras seleccionar comunidad
- ✅ Fechas futuras permitidas solo donde corresponde
- ✅ Edad calculada automáticamente

### UX
- ✅ Loading skeletons mientras carga datos
- ✅ Toast notifications (verde éxito, rojo error, azul info)
- ✅ Confirmación antes de eliminar
- ✅ Animaciones suaves (framer-motion)
- ✅ Responsive design (funciona en diferentes tamaños)
- ✅ Empty states cuando no hay datos

---

## 6. Pruebas de Integración Backend

### Endpoints Disponibles

```bash
# Centros
GET    /api/v1/centers
POST   /api/v1/centers
GET    /api/v1/centers/:id
PUT    /api/v1/centers/:id
DELETE /api/v1/centers/:id

# Estudiantes
GET    /api/v1/students
POST   /api/v1/students
GET    /api/v1/students/:id
PUT    /api/v1/students/:id
DELETE /api/v1/students/:id

# Asignaciones de Pruebas
GET    /api/v1/test-assignments
POST   /api/v1/test-assignments
GET    /api/v1/test-assignments/:id
PUT    /api/v1/test-assignments/:id
DELETE /api/v1/test-assignments/:id

# Resultados de Pruebas
GET    /api/v1/test-results
POST   /api/v1/test-results
GET    /api/v1/test-results/:id
PUT    /api/v1/test-results/:id
DELETE /api/v1/test-results/:id
POST   /api/v1/test-results/:id/validate
GET    /api/v1/test-results/student/:studentId/history
```

### Probar con curl:

```bash
# 1. Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@emooti.com","password":"admin123"}'

# 2. Obtener centros (usar token del login)
curl -X GET http://localhost:3000/api/v1/centers \
  -H "Authorization: Bearer <TOKEN>"

# 3. Obtener estudiantes
curl -X GET http://localhost:3000/api/v1/students \
  -H "Authorization: Bearer <TOKEN>"

# 4. Obtener asignaciones
curl -X GET http://localhost:3000/api/v1/test-assignments \
  -H "Authorization: Bearer <TOKEN>"

# 5. Obtener resultados de pruebas
curl -X GET http://localhost:3000/api/v1/test-results \
  -H "Authorization: Bearer <TOKEN>"
```

---

## 7. Problemas Comunes y Soluciones

### Frontend no carga
```bash
cd frontend
npm run dev
```

### Backend no responde
```bash
cd backend
npm run dev
```

### Error de base de datos
- Verificar que Supabase está activo
- Comprobar variables de entorno en `.env`
- Revisar conexión a internet

### Componentes no se cargan
- Limpiar caché del navegador (Ctrl+F5)
- Verificar consola del navegador (F12)
- Revisar terminal para errores de compilación

---

## 8. Checklist de Pruebas Completas

### Módulo Centers
- [ ] Ver lista de centros
- [ ] Filtrar por tipo, provincia, comunidad
- [ ] Crear nuevo centro
- [ ] Editar centro existente
- [ ] Eliminar centro
- [ ] Paginación (si > 20 centros)
- [ ] Selección múltiple
- [ ] Eliminación masiva

### Módulo Students
- [ ] Ver lista de estudiantes con edad calculada
- [ ] Filtrar por etapa, centro, consentimiento, pago
- [ ] Crear nuevo estudiante con todos los campos
- [ ] Editar estudiante
- [ ] Eliminar estudiante
- [ ] Verificar permisos de orientador (centro bloqueado)
- [ ] Paginación
- [ ] Badges de colores correctos

### Módulo TestAssignments
- [ ] Ver lista de asignaciones
- [ ] Filtrar por 7 filtros disponibles
- [ ] Crear nueva asignación con enlace
- [ ] Verificar indicador de QR cuando hay enlace
- [ ] Editar asignación
- [ ] Cambiar estado a "Completada" y verificar auto-fecha
- [ ] Eliminar asignación
- [ ] Verificar iconos dinámicos (✓, ✗, ⏱)
- [ ] Verificar badges de prioridad con colores
- [ ] Selección múltiple y eliminación masiva

### Módulo TestResults
- [ ] Ver lista de resultados con percentiles coloreados
- [ ] Filtrar por 6 filtros disponibles
- [ ] Verificar estadísticas en tiempo real (4 tarjetas)
- [ ] Crear nuevo resultado manual
- [ ] Editar resultado existente
- [ ] Validar resultado (Admin/Clínica solamente)
- [ ] Desvalidar resultado
- [ ] Eliminar resultado (Admin solamente)
- [ ] Verificar código de colores de percentil
- [ ] Verificar badges de interpretación
- [ ] Verificar badges de origen (Manual/PDF/Bulk/API)
- [ ] Selección múltiple y eliminación masiva

### Permisos
- [ ] Admin puede todo
- [ ] Clínica ve solo sus centros
- [ ] Orientador tiene centro auto-seleccionado
- [ ] Familia solo lectura

---

## 9. Resumen de Líneas de Código Implementadas

| Módulo | Página Principal | Modal Crear | Modal Editar | Total |
|--------|------------------|-------------|--------------|-------|
| Centers | 552 | 407 | 464 | 1,423 |
| Students | 624 | 521 | 544 | 1,689 |
| TestAssignments | 669 | 333 | 404 | 1,406 |
| TestResults | 669 | 360 | 361 | 1,390 |
| **TOTAL** | **2,514** | **1,621** | **1,773** | **5,908** |

---

## 10. Próximos Pasos

### Módulos Pendientes de Implementar
1. **Agenda** (Calendario de Eventos)
2. **Devices/Inventory** (Gestión de Recursos)
3. **Invoices** (Facturación)
4. **Reports** (Informes y Reportes)

### Mejoras Sugeridas
- Implementar importación CSV
- Añadir exportación a Excel/PDF
- Generación real de códigos QR
- Notificaciones por email
- Historial de cambios (audit logs en UI)

---

**Última actualización:** Octubre 2025
**Estado:** 5 módulos CRUD completados y funcionales (5,908 líneas de código)
