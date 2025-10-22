# 📘 GUÍA DE USUARIO - EMOOTI Neurodesarrollo

**Versión:** 1.0.0
**Fecha:** 22 de octubre de 2025
**Plataforma:** Sistema de gestión de evaluaciones neuropsicológicas

---

## 📑 TABLA DE CONTENIDOS

1. [Introducción](#introducción)
2. [Primeros Pasos](#primeros-pasos)
3. [Panel de Control (Dashboard)](#panel-de-control-dashboard)
4. [Gestión de Usuarios](#gestión-de-usuarios)
5. [Gestión de Estudiantes](#gestión-de-estudiantes)
6. [Gestión de Centros](#gestión-de-centros)
7. [Asignación de Pruebas](#asignación-de-pruebas)
8. [Resultados de Pruebas](#resultados-de-pruebas)
9. [Agenda](#agenda)
10. [Dispositivos e Inventario](#dispositivos-e-inventario)
11. [Facturación y Suscripciones](#facturación-y-suscripciones)
12. [Seguridad y Auditoría](#seguridad-y-auditoría)
13. [Configuración](#configuración)
14. [Perfil de Usuario](#perfil-de-usuario)
15. [Preguntas Frecuentes](#preguntas-frecuentes)
16. [Soporte Técnico](#soporte-técnico)

---

## 🎯 INTRODUCCIÓN

EMOOTI Neurodesarrollo es una plataforma integral diseñada para gestionar evaluaciones neuropsicológicas en entornos educativos. El sistema permite:

- ✅ Gestionar usuarios, estudiantes y centros educativos
- ✅ Asignar y realizar seguimiento de pruebas neuropsicológicas
- ✅ Registrar y analizar resultados
- ✅ Programar evaluaciones y eventos
- ✅ Gestionar inventario y recursos
- ✅ Facturación y control de suscripciones
- ✅ Cumplimiento RGPD y auditoría completa

### Roles de Usuario

El sistema tiene **5 roles** con diferentes permisos:

1. **ADMINISTRADOR** 👑
   - Acceso completo al sistema
   - Gestión de usuarios y centros
   - Configuración avanzada
   - Reportes y estadísticas globales

2. **CLINICA** 🩺
   - Gestión de evaluaciones
   - Creación y edición de usuarios/estudiantes
   - Interpretación de resultados
   - Generación de informes

3. **ORIENTADOR** 📚
   - Gestión de estudiantes de su centro
   - Programación de evaluaciones
   - Consulta de informes de su centro
   - Agenda de eventos

4. **EXAMINADOR** 📝
   - Administración de pruebas
   - Registro de resultados
   - Consulta de pruebas asignadas
   - Seguimiento de evaluaciones

5. **FAMILIA** 👨‍👩‍👧‍👦
   - Consulta de información de hijos
   - Visualización de informes
   - Agenda de próximas evaluaciones
   - Comunicación con orientadores

---

## 🚀 PRIMEROS PASOS

### 1. Acceso al Sistema

**URL de acceso:** https://neurodesarrollo.emooti.com (o tu URL personalizada)

1. Abre tu navegador web (Chrome, Firefox, Edge o Safari)
2. Navega a la URL de acceso
3. Verás la pantalla de login

### 2. Inicio de Sesión

#### Opción 1: Email y Contraseña

1. Introduce tu **email** corporativo
2. Introduce tu **contraseña**
3. Haz clic en **"Iniciar Sesión"**

#### Opción 2: Google OAuth

1. Haz clic en **"Continuar con Google"**
2. Selecciona tu cuenta de Google
3. Autoriza el acceso a la aplicación

### 3. Primera Vez en el Sistema

Si es tu primera vez:

1. **Cambia tu contraseña:**
   - Ve a **Perfil** (esquina superior derecha)
   - Selecciona **"Cambiar Contraseña"**
   - Introduce contraseña actual y nueva contraseña
   - Confirma los cambios

2. **Completa tu perfil:**
   - Ve a **Perfil > Mi Información**
   - Rellena datos personales faltantes
   - Guarda los cambios

3. **Explora el dashboard:**
   - Familiarízate con las métricas principales
   - Revisa los gráficos de actividad
   - Prueba las acciones rápidas

---

## 📊 PANEL DE CONTROL (DASHBOARD)

El Dashboard es tu página de inicio y muestra información relevante según tu rol.

### Características Principales

#### 1. **Tarjetas de Estadísticas**
Muestra métricas clave en tiempo real:
- Para ADMINISTRADOR: usuarios totales, alumnos, centros activos, pruebas realizadas
- Para CLINICA: alumnos asignados, evaluaciones pendientes, informes pendientes
- Para ORIENTADOR: alumnos del centro, evaluaciones programadas, informes disponibles
- Para EXAMINADOR: pruebas asignadas, completadas, pendientes

**Auto-refresh:** Las estadísticas se actualizan automáticamente cada 30 segundos.

#### 2. **Gráficos Interactivos** 📈

**Gráfico de Línea - Evolución de Tests Completados**
- Muestra tests completados en los últimos 7 días
- Hover sobre puntos para ver detalles
- Color azul corporativo

**Gráfico de Barras - Tests por Estado**
- Visualiza distribución: Pendiente, En Progreso, Completado
- Colores distintivos por estado
- Click para filtros futuros

**Gráfico de Área - Actividad Semanal**
- Muestra usuarios activos por día
- Gradient verde esmeralda
- Identifica patrones de uso

#### 3. **Actividad Reciente** 🔔
Últimas 5 acciones realizadas:
- Tipo de acción (LOGIN, CREATE, UPDATE, DELETE, DATA_ACCESS)
- Fecha y hora relativa (hace X minutos/horas)
- Dirección IP del acceso
- Color distintivo por tipo de acción

#### 4. **Acciones Rápidas** ⚡
Botones de acceso directo personalizados por rol:
- Gestionar Usuarios/Alumnos
- Ver Agenda
- Crear Evaluaciones
- Ver Reportes
- Configuración (solo ADMIN)

---

## 👥 GESTIÓN DE USUARIOS

**Ruta:** `/users`
**Permisos:** ADMINISTRADOR (completo), CLINICA (crear/editar), otros (solo lectura)

### Listado de Usuarios

**Tabla de usuarios con:**
- Nombre completo
- Email
- Tipo de usuario (rol)
- Centro asignado (si aplica)
- Estado (ACTIVE, PENDING_INVITATION, INACTIVE)
- Fecha de creación

**Acciones disponibles:**
- ✏️ Editar: Modificar datos del usuario
- 🗑️ Eliminar: Desactivar usuario (soft delete)
- 📧 Enviar Autorización: Reenviar email de invitación

### Crear Usuario

1. Haz clic en **"+ Nuevo Usuario"**
2. Rellena el formulario:

**Datos Básicos:**
- Tipo de usuario (ADMINISTRADOR, CLINICA, ORIENTADOR, EXAMINADOR, FAMILIA)
- Nombre completo
- Email (único en el sistema)
- DNI/NIE
- Teléfono
- Fecha de nacimiento

**Datos de Domicilio:**
- Dirección completa
- País, Comunidad Autónoma, Provincia, Ciudad
- Código postal

**Datos Profesionales (si aplica):**
- Centro asignado
- Centros adicionales (multi-select)
- Especialidad médica
- Número de colegiado
- Etapas/Cursos/Grupos permitidos

**Datos de Pago (opcional):**
- Método de pago
- IBAN bancario
- Nombre del banco
- Documentos de mandato SEPA

3. Haz clic en **"Crear Usuario"**
4. El usuario recibirá un email de invitación

### Editar Usuario

1. Haz clic en ✏️ **Editar** en la fila del usuario
2. Modifica los campos necesarios
3. Haz clic en **"Guardar Cambios"**

### Filtros Avanzados

**Barra de búsqueda:** Busca por nombre, email o DNI

**Filtros por:**
- Tipo de usuario
- Estado (Activo, Pendiente, Inactivo)
- Centro asignado
- Fecha de creación (rango)

### Acciones Masivas

**Selección múltiple:**
1. Marca checkbox de usuarios deseados
2. Haz clic en **"Acciones"**
3. Opciones disponibles:
   - Enviar autorizaciones (email masivo)
   - Exportar a Excel
   - Cambiar estado (Activo/Inactivo)

**Exportar a Excel:**
- Incluye todos los datos de usuarios
- Respeta filtros aplicados
- Descarga inmediata en formato .xlsx

---

## 🎓 GESTIÓN DE ESTUDIANTES

**Ruta:** `/students`
**Permisos:** ADMINISTRADOR/CLINICA (completo), ORIENTADOR (su centro), otros (solo lectura)

### Listado de Estudiantes

**Información mostrada:**
- Foto del estudiante (avatar)
- Nombre completo
- NIA (Número de Identificación del Alumno)
- Centro educativo
- Curso y grupo
- Edad
- Estado (Activo/Inactivo)

### Crear Estudiante

1. Haz clic en **"+ Nuevo Alumno"**
2. Completa el formulario:

**Datos del Estudiante:**
- Código de estudiante (generado automáticamente)
- NIA (único por centro)
- Nombre completo
- DNI/NIE
- Fecha de nacimiento (calcula edad automáticamente)
- Género (Masculino/Femenino/Otro/Prefiero no especificarlo)
- Nacionalidad
- Teléfono de contacto

**Datos Académicos:**
- Centro educativo (seleccionar de lista)
- Etapa (Infantil, Primaria, Secundaria, Bachillerato, FP)
- Curso (1º, 2º, 3º, etc.)
- Grupo/Clase (A, B, C, etc.)
- Orientador asignado

**Datos Médicos:**
- Grado de discapacidad (si aplica)
- Necesidades educativas especiales
- Observaciones médicas relevantes

**Datos de Familia:**
- Tipo de pago (Familia/Centro)
- Estado de pago (Pagado/Pendiente/Atrasado)
- Consentimiento dados (Sí/No/Pendiente)

**Observaciones Generales:**
- Campo de texto libre para notas importantes

3. Haz clic en **"Crear Alumno"**

### Vincular Familia

Para conectar un estudiante con padres/tutores:

1. Entra en el detalle del estudiante (click en nombre)
2. Ve a la pestaña **"Familia"**
3. Haz clic en **"+ Vincular Familiar"**
4. Busca y selecciona usuario con rol FAMILIA
5. Indica tipo de relación (Padre, Madre, Tutor, Otro)
6. Marca si es contacto principal
7. Guarda cambios

### Historial Académico

**Pestaña "Historial"** muestra:
- Pruebas realizadas (cronológico)
- Resultados y valoraciones
- Informes generados
- Eventos de agenda relacionados
- Cambios de grupo/curso

---

## 🏫 GESTIÓN DE CENTROS

**Ruta:** `/centers`
**Permisos:** ADMINISTRADOR (completo), CLINICA (crear/editar), otros (solo lectura)

### Listado de Centros

**Información mostrada:**
- Nombre del centro
- Código del centro
- Tipo (Público/Concertado/Privado)
- Responsable
- Email y teléfono
- Total de estudiantes
- Total de usuarios (profesorado)
- Estado (Activo/Inactivo)

### Crear Centro

1. Haz clic en **"+ Nuevo Centro"**
2. Rellena datos:

**Información Básica:**
- Nombre del centro educativo
- Código del centro (único)
- Tipo de centro (Público, Concertado, Privado)
- Responsable del centro
- Email de contacto
- Teléfono
- Total de estudiantes matriculados

**Ubicación:**
- Dirección completa
- País
- Comunidad Autónoma
- Provincia
- Ciudad
- Código postal

**Documentación:**
- Documento de contrato (PDF)
- Documentos adicionales (múltiples archivos)

**Observaciones:**
- Notas internas sobre el centro

3. Haz clic en **"Crear Centro"**

### Ver Detalles de Centro

Click en un centro para ver:
- **Pestaña Información:** Datos generales del centro
- **Pestaña Estudiantes:** Lista de alumnos del centro
- **Pestaña Usuarios:** Personal asignado al centro
- **Pestaña Estadísticas:** Métricas del centro (tests, evaluaciones, informes)

---

## 📋 ASIGNACIÓN DE PRUEBAS

**Ruta:** `/test-assignments`
**Permisos:** ADMINISTRADOR, CLINICA, ORIENTADOR, EXAMINADOR

### Listado de Asignaciones

**Información mostrada:**
- Código de asignación
- Estudiante
- Prueba asignada (nombre del test)
- Asignado por (usuario que creó la asignación)
- Asignado a (clínico responsable)
- Examinador
- Fecha de asignación
- Fecha programada
- Estado (PENDING, IN_PROGRESS, COMPLETED, CANCELLED)
- Prioridad (Baja/Media/Alta/Urgente)

### Crear Asignación

1. Haz clic en **"+ Nueva Asignación"**
2. Selecciona **Estudiante** (buscar por nombre o NIA)
3. Selecciona **Prueba** (de catálogo de tests disponibles)
4. Asigna **Clínico responsable** (CLINICA)
5. Asigna **Examinador** (opcional, puede ser el mismo que clínico)
6. Selecciona **Fecha programada** (calendario)
7. Indica **Prioridad** (Baja, Media, Alta, Urgente)
8. Añade **Observaciones** (opcional)
9. Haz clic en **"Asignar Prueba"**

### Estados de Asignación

**PENDING (Pendiente)** 🟡
- Prueba asignada pero no iniciada
- Esperando fecha programada

**IN_PROGRESS (En Progreso)** 🔵
- Prueba iniciada pero no finalizada
- Examinador trabajando en ella

**COMPLETED (Completada)** 🟢
- Prueba finalizada
- Resultados registrados
- Listo para interpretación

**CANCELLED (Cancelada)** 🔴
- Prueba anulada
- No se procesarán resultados

### Cambiar Estado

1. Haz clic en badge de estado actual
2. Selecciona nuevo estado del menú
3. Confirma el cambio
4. Se registra en auditoría automáticamente

---

## 📈 RESULTADOS DE PRUEBAS

**Ruta:** `/test-results`
**Permisos:** ADMINISTRADOR, CLINICA (completo), otros (solo lectura)

### Listado de Resultados

**Información mostrada:**
- Código de resultado
- Estudiante
- Prueba realizada
- Fecha de realización
- Puntuación obtenida
- Valoración (Sin problema/Revisar/Urgente/Alerta)
- Clínico que interpretó
- Estado (Pendiente interpretación/Interpretado/Revisado)

### Registrar Resultado

1. Desde una asignación COMPLETED, haz clic en **"Registrar Resultado"**
2. Introduce datos de la prueba:

**Puntuaciones:**
- Puntuación bruta
- Puntuación ponderada
- Percentil
- Puntuación Z (si aplica)

**Observaciones durante la prueba:**
- Comportamiento del estudiante
- Incidencias
- Condiciones de la evaluación

**Valoración automática:**
- El sistema sugiere valoración según puntuación
- Puedes modificarla manualmente
- Opciones: Sin problema, Revisar, Urgente, Alerta

**Interpretación Clínica:**
- Campo de texto extenso
- Interpretación profesional de resultados
- Recomendaciones

**Recomendaciones:**
- Acciones sugeridas
- Derivaciones necesarias
- Seguimiento requerido

3. Haz clic en **"Guardar Resultado"**

### Valoraciones

**Sin problema** 🟢
- Resultado dentro de rango esperado
- No requiere intervención inmediata

**Revisar** 🟡
- Resultado en zona límite
- Requiere seguimiento

**Urgente** 🟠
- Resultado preocupante
- Requiere atención pronto

**Alerta** 🔴
- Resultado crítico
- Requiere intervención inmediata

---

## 📅 AGENDA

**Ruta:** `/agenda`
**Permisos:** ADMINISTRADOR, CLINICA, ORIENTADOR

### Vista de Calendario

El calendario muestra:
- **Mes completo:** Vista general de eventos
- **Semana:** Detalle horario
- **Día:** Agenda detallada
- **Lista:** Todos los eventos ordenados

### Tipos de Eventos

**Evaluación** 📝 (Azul)
- Prueba programada
- Incluye estudiante y test
- Ubicación y observaciones

**Reunión** 👥 (Verde)
- Reuniones con familias
- Juntas de evaluación
- Sesiones de coordinación

**Seguimiento** 🔍 (Púrpura)
- Seguimiento de casos
- Revisión de evolución

**Informe** 📄 (Naranja)
- Entrega de informes
- Presentación de resultados

**Formación** 🎓 (Rojo)
- Cursos y talleres
- Formación del equipo

### Crear Evento

1. Haz clic en **"+ Nuevo Evento"** o click en fecha del calendario
2. Selecciona **Tipo de Evento**
3. Introduce:
   - **Título** del evento
   - **Fecha y hora** de inicio
   - **Fecha y hora** de fin
   - **Ubicación** (sala, despacho, online)
   - **Estudiante** (si aplica)
   - **Usuarios participantes** (multi-select)
   - **Descripción** y observaciones
   - **Color** personalizado (opcional)
4. Marca como **Todo el día** si aplica
5. Haz clic en **"Crear Evento"**

### Gestionar Eventos

**Editar:**
- Click en evento del calendario
- Modifica campos
- Guarda cambios

**Eliminar:**
- Click en evento
- Botón "Eliminar"
- Confirma la acción

**Arrastrar y soltar:**
- Arrastra evento a nueva fecha/hora
- Se actualiza automáticamente

---

## 💻 DISPOSITIVOS E INVENTARIO

### Dispositivos

**Ruta:** `/devices`
**Permisos:** ADMINISTRADOR, CLINICA, ORIENTADOR

**Gestiona dispositivos tecnológicos:**
- Tablets para pruebas
- iPads
- Smartphones
- Laptops

**Funcionalidades:**
- Registro de dispositivos
- Sistema de reservas
- Control de mantenimiento
- Historial de uso

**Crear Dispositivo:**
1. Click en **"+ Nuevo Dispositivo"**
2. Introduce:
   - Tipo (iPad, Tablet, Smartphone, Laptop)
   - Marca y modelo
   - Número de serie
   - Estado (Activo, Inactivo, Mantenimiento)
   - Ubicación actual
   - Observaciones

### Inventario

**Ruta:** `/inventory`
**Permisos:** ADMINISTRADOR, CLINICA, ORIENTADOR

**Gestiona inventario general:**
- Material informático
- Mobiliario
- Material promocional
- Material de pruebas

**Funcionalidades:**
- Control de stock
- Alertas de stock bajo
- Gestión de proveedores
- Historial de movimientos

**Crear Artículo:**
1. Click en **"+ Nuevo Artículo"**
2. Introduce:
   - Nombre del artículo
   - Categoría (Informática, Mobiliario, Promocional, Pruebas)
   - Cantidad actual
   - Stock mínimo (para alertas)
   - Ubicación
   - Proveedor
   - Precio unitario
   - Observaciones

---

## 💰 FACTURACIÓN Y SUSCRIPCIONES

**Permisos:** Solo ADMINISTRADOR

### Suscripciones

**Ruta:** `/subscriptions`

**Gestiona suscripciones activas:**
- Modelo B2B (centros educativos)
- Modelo B2B2C (familias a través de centros)

**Crear Suscripción:**
1. Click en **"+ Nueva Suscripción"**
2. Selecciona **Centro o Familia**
3. Selecciona **Plan** (mensual, trimestral, anual)
4. Selecciona **Estudiantes** incluidos (multi-select)
5. Indica:
   - Fecha de inicio
   - Fecha de fin (opcional para renovación automática)
   - Precio mensual
   - Método de pago (Interno, Stripe)
   - Día de facturación (1-28)
   - Estado (Activa, Pausada, Cancelada)
6. Haz clic en **"Crear Suscripción"**

**Facturación Recurrente:**
- Sistema genera facturas automáticamente según el día configurado
- Envío automático por email (configurable)
- Recordatorios de pago

### Facturas

**Ruta:** `/invoices`

**Gestiona facturas emitidas:**
- Generación manual o automática
- Envío por email
- Generación de PDF
- Notas de crédito (devoluciones)

**Crear Factura:**
1. Click en **"+ Nueva Factura"**
2. Selecciona **Cliente** (centro o familia)
3. Añade **Líneas de factura:**
   - Concepto
   - Cantidad
   - Precio unitario
   - IVA (%)
   - Descuento (%)
4. El sistema calcula:
   - Subtotal
   - Total IVA
   - Total factura
5. Indica:
   - Número de factura (auto-generado o manual)
   - Fecha de emisión
   - Fecha de vencimiento
   - Método de pago
   - Estado (Emitida, Enviada, Pagada, Cancelada)
6. Haz clic en **"Crear Factura"**

**Acciones sobre Facturas:**
- 📄 **Generar PDF:** Descarga factura en formato profesional
- 📧 **Enviar por Email:** Envía factura al cliente
- ✅ **Marcar como Pagada:** Registra pago recibido
- 🔄 **Nota de Crédito:** Crea devolución/abono

**Estados de Factura:**
- **EMITIDA:** Creada pero no enviada
- **ENVIADA:** Enviada al cliente por email
- **PAGADA:** Cobrada completamente
- **CANCELADA:** Anulada (no válida)
- **ABONADA:** Con nota de crédito aplicada

---

## 🔒 SEGURIDAD Y AUDITORÍA

**Ruta:** `/security`
**Permisos:** Solo ADMINISTRADOR

### Panel de Control de Seguridad

**5 pestañas principales:**

#### 1. Dashboard

**Métricas de seguridad:**
- Total de logs de auditoría
- Logs últimos 7 días
- Alertas pendientes
- Alertas resueltas
- Políticas de retención activas
- Total de anonimizaciones

**Gráficos:**
- Acciones por tipo (LOGIN, CREATE, UPDATE, DELETE)
- Actividad por día
- Accesos por IP

#### 2. Registros de Auditoría

**Tabla completa de logs:**
- Usuario que realizó la acción
- Tipo de acción (LOGIN, LOGOUT, CREATE, UPDATE, DELETE, DATA_ACCESS, EXPORT, ANONYMIZE)
- Recurso afectado (User, Student, Center, etc.)
- ID del recurso
- Fecha y hora exacta
- IP address
- User-Agent (navegador)
- Hash de integridad (blockchain)

**Filtros disponibles:**
- Por usuario
- Por tipo de acción
- Por recurso
- Por rango de fechas
- Por IP address

**Funcionalidades:**
- Paginación (20 registros por página)
- Exportar a Excel/CSV
- Búsqueda avanzada
- Ver detalles JSON de cada acción

**Integridad:**
- Cada log tiene hash SHA-256
- Cadena de hashes (previous_hash)
- Inmutable (no se puede modificar)
- Cumplimiento RGPD

#### 3. Alertas de Anomalías

**Sistema de detección automático:**
- Múltiples intentos fallidos de login
- Acceso desde ubicación inusual
- Acceso fuera de horario
- Volumen inusual de accesos
- Cambios masivos de datos
- Exportaciones masivas

**Gestión de Alertas:**
- **PENDING:** Nueva alerta sin revisar
- **UNDER_REVIEW:** En investigación
- **RESOLVED:** Resuelta (legítima)
- **FALSE_POSITIVE:** Falsa alarma

**Severidad:**
- **LOW:** Informativa
- **MEDIUM:** Requiere revisión
- **HIGH:** Potencialmente peligrosa
- **CRITICAL:** Requiere acción inmediata

**Resolver Alerta:**
1. Click en alerta pendiente
2. Investiga detalles (usuario, IP, fecha, acción)
3. Añade **Resolución** (descripción de lo encontrado)
4. Marca estado (Resolved o False Positive)
5. Guarda cambios

#### 4. Políticas de Retención

**Cumplimiento RGPD:**
Define cuánto tiempo se mantienen datos:

**Crear Política:**
1. Click en **"+ Nueva Política"**
2. Introduce:
   - Nombre de la política
   - Tipo de datos (AUDIT_LOGS, USER_DATA, STUDENT_DATA, TEST_DATA, etc.)
   - Descripción
   - Días de retención (ej: 365 días)
   - Acción al vencer (DELETE, ANONYMIZE, ARCHIVE)
   - Estado (Activa/Inactiva)
3. Guarda política

**Ejemplo de Políticas:**
- **Logs de auditoría:** Mantener 7 años, después eliminar
- **Datos de estudiantes:** Mantener 2 años tras graduación, después anonimizar
- **Resultados de pruebas:** Mantener 5 años, después archivar
- **Facturas:** Mantener 10 años (legal), después archivar

#### 5. Registros de Anonimización

**Histórico de datos anonimizados:**
- Tipo de entidad (User, Student, TestResult)
- ID original (antes de anonimización)
- Usuario que ejecutó
- Fecha y hora
- Razón (RETENTION_POLICY, USER_REQUEST, LEGAL_REQUIREMENT, DATA_BREACH)
- Detalles JSON

**Razones de Anonimización:**
- **RETENTION_POLICY:** Política de retención cumplida
- **USER_REQUEST:** Solicitud del usuario (derecho al olvido)
- **LEGAL_REQUIREMENT:** Requerimiento legal
- **DATA_BREACH:** Brecha de seguridad (precaución)

**Proceso Irreversible:**
⚠️ La anonimización es permanente y no se puede deshacer. Sustituye:
- Nombre → "Usuario Anonimizado"
- Email → random hash
- DNI → "***ANON***"
- Teléfono → "000000000"
- Datos sensibles → NULL

---

## ⚙️ CONFIGURACIÓN

**Ruta:** `/configuration`
**Permisos:** Solo ADMINISTRADOR

### 4 Pestañas de Configuración

#### 1. Configuraciones de Valores

**Gestiona listas dinámicas del sistema:**
- Etapas educativas (Infantil, Primaria, Secundaria, Bachillerato, FP)
- Cursos (1º, 2º, 3º, 4º, 5º, 6º)
- Grupos/Clases (A, B, C, D)
- Pruebas permitidas (listado de tests disponibles)
- Métodos de pago (Transferencia, Domiciliación, Tarjeta, Efectivo)
- Nacionalidades
- Comunidades Autónomas

**Crear Configuración:**
1. Click en **"+ Nueva Configuración"**
2. Introduce:
   - Tipo (dropdown con opciones)
   - Nombre de la configuración
   - Valores (array, uno por línea)
   - Descripción
   - Estado (Activa/Inactiva)
3. Guarda

**Ejemplo:**
```
Tipo: ETAPAS_EDUCATIVAS
Nombre: Etapas Educación España
Valores:
- Educación Infantil
- Educación Primaria
- Educación Secundaria Obligatoria
- Bachillerato
- Formación Profesional
```

#### 2. Configuración de Empresa

**Datos de la empresa para facturas y documentos:**
- Nombre de la empresa
- CIF/NIF
- Dirección fiscal completa
- Teléfono y email de contacto
- Sitio web
- Logo de la empresa (URL)
- Términos y condiciones (URL)
- Política de privacidad (URL)
- Información bancaria (para facturas)

**Editar:**
1. Modifica los campos necesarios
2. Sube logo si es necesario
3. Haz clic en **"Guardar Cambios"**

#### 3. Plantillas de Importación

**Define estructura para importar datos masivos:**
- Plantilla para usuarios
- Plantilla para estudiantes
- Plantilla para centros

**Crear Plantilla:**
1. Click en **"+ Nueva Plantilla"**
2. Introduce:
   - Nombre de la plantilla
   - Tipo de entidad (users, students, centers)
   - Descripción
   - Campos (array de objetos JSON):
     ```json
     [
       {
         "name": "full_name",
         "type": "string",
         "required": true,
         "example": "Juan Pérez García"
       },
       {
         "name": "email",
         "type": "email",
         "required": true,
         "example": "juan.perez@example.com"
       }
     ]
     ```
3. Guarda plantilla

#### 4. Configuraciones de Backup

**Automatiza respaldos de base de datos:**
- Backups diarios, semanales, mensuales
- Tipos: Completo, Incremental, Diferencial
- Retención configurable

**Crear Configuración de Backup:**
1. Click en **"+ Nueva Configuración"**
2. Introduce:
   - Nombre (ej: "Backup Diario Producción")
   - Descripción
   - Tipo de backup (Full, Incremental, Differential)
   - Días de retención (ej: 30 días)
   - Ubicación de almacenamiento (ruta o S3 bucket)
   - Estado (Activo/Inactivo)
3. Guarda

**Tipos de Backup:**
- **Full (Completo):** Copia completa de todos los datos
- **Incremental:** Solo cambios desde el último backup
- **Differential:** Cambios desde el último backup completo

---

## 👤 PERFIL DE USUARIO

**Ruta:** `/profile`
**Permisos:** Todos los usuarios autenticados

### 4 Pestañas de Perfil

#### 1. Mi Información

**Datos personales editables:**
- Foto de perfil (avatar)
- Nombre completo
- Email (no editable, contacta admin)
- Teléfono
- DNI/NIE
- Fecha de nacimiento
- Nacionalidad
- Dirección completa

**Editar:**
1. Modifica campos permitidos
2. Sube nueva foto si deseas
3. Haz clic en **"Guardar Cambios"**

#### 2. Cambiar Contraseña

**Actualiza tu contraseña:**
1. Introduce **Contraseña actual**
2. Introduce **Nueva contraseña**
3. Confirma **Nueva contraseña**

**Indicador de fortaleza:**
- 🔴 Débil: menos de 8 caracteres
- 🟡 Media: 8-11 caracteres
- 🟢 Fuerte: 12+ caracteres, mayúsculas, números, símbolos

**Requisitos:**
- Mínimo 8 caracteres
- Recomendado: mayúsculas, minúsculas, números, símbolos

4. Haz clic en **"Cambiar Contraseña"**

#### 3. Mi Actividad

**Historial personal de auditoría:**
- Últimas 50 acciones realizadas
- Tipo de acción
- Recurso afectado
- Fecha y hora
- IP address
- Detalles JSON expandibles

**Filtros:**
- Por tipo de acción
- Por rango de fechas
- Por recurso

**Exportar:**
- Descarga tu historial completo
- Formato CSV o Excel

#### 4. Estadísticas

**Métricas de uso personal:**
- Total de inicios de sesión
- Total de acciones realizadas
- Último inicio de sesión
- Actividad reciente (últimos 30 días)

**Gráficos:**
- Acciones por tipo (barra)
- Actividad por día (línea)
- Horas más activas (heat map)

---

## ❓ PREGUNTAS FRECUENTES

### General

**P: ¿Cómo recupero mi contraseña?**
R: En la pantalla de login, haz clic en "¿Olvidaste tu contraseña?". Introduce tu email y recibirás instrucciones para restablecerla.

**P: ¿Puedo acceder desde mi móvil?**
R: Sí, la plataforma es responsive y funciona en todos los dispositivos.

**P: ¿Los datos están seguros?**
R: Sí, usamos encriptación HTTPS, cumplimos con RGPD, y realizamos backups diarios automáticos.

**P: ¿Cuánto tiempo se guardan los datos?**
R: Según políticas de retención configuradas por el administrador, generalmente 2-7 años.

### Usuarios

**P: ¿Cómo cambio el rol de un usuario?**
R: Solo los ADMINISTRADORES pueden cambiar roles. Ve a Usuarios → Editar → Cambiar tipo de usuario.

**P: ¿Puedo tener múltiples centros asignados?**
R: Sí, en la edición de usuario hay un campo "Centros adicionales" que permite seleccionar múltiples centros.

**P: ¿Cómo elimino un usuario?**
R: Los usuarios no se eliminan permanentemente, se desactivan (soft delete). Click en 🗑️ Eliminar en la fila del usuario.

### Estudiantes

**P: ¿Cómo vinculo un estudiante con su familia?**
R: Entra en el detalle del estudiante → Pestaña "Familia" → Click en "+ Vincular Familiar" → Selecciona usuario FAMILIA.

**P: ¿Puedo importar estudiantes masivamente?**
R: Sí, próximamente estará disponible la funcionalidad de importación desde Excel con la plantilla configurada.

**P: ¿Qué pasa con los datos del estudiante cuando se gradúa?**
R: Según la política de retención, tras un período (ej: 2 años) se pueden anonimizar o archivar.

### Pruebas

**P: ¿Cómo cancelo una asignación de prueba?**
R: Click en el badge de estado → Selecciona "CANCELLED" → Confirma.

**P: ¿Puedo reasignar una prueba a otro examinador?**
R: Sí, edita la asignación y cambia el campo "Examinador" o "Asignado a".

**P: ¿Las valoraciones son automáticas?**
R: El sistema sugiere una valoración basada en la puntuación, pero el clínico puede modificarla manualmente.

### Agenda

**P: ¿Puedo sincronizar con Google Calendar?**
R: Actualmente no, pero es una funcionalidad planificada para futuras versiones.

**P: ¿Cómo veo solo mis eventos?**
R: Los filtros de la agenda te permiten filtrar por usuario. Selecciona tu nombre en el filtro "Participantes".

**P: ¿Puedo configurar recordatorios?**
R: Próximamente se añadirá la funcionalidad de notificaciones por email/push antes de eventos.

### Facturación

**P: ¿Cómo anulo una factura?**
R: Crea una "Nota de Crédito" desde la factura original. Esto genera una factura de devolución.

**P: ¿Se envían facturas automáticamente?**
R: Sí, si la suscripción tiene configurado el envío automático, se envían por email en el día de facturación.

**P: ¿Puedo personalizar el diseño de las facturas?**
R: Actualmente usa un diseño estándar profesional. La personalización avanzada está planificada.

### Seguridad

**P: ¿Quién puede ver los logs de auditoría?**
R: Solo los ADMINISTRADORES tienen acceso completo. Los demás usuarios ven solo su actividad personal en "Perfil → Mi Actividad".

**P: ¿Cuánto tiempo se guardan los logs?**
R: Según la política de retención, generalmente 7 años por requisitos legales.

**P: ¿Qué es el hash de integridad?**
R: Es una firma criptográfica SHA-256 que asegura que el log no ha sido modificado (blockchain interno).

---

## 🆘 SOPORTE TÉCNICO

### Contacto

**Email:** soporte@emooti.com
**Teléfono:** +34 XXX XXX XXX
**Horario:** Lunes a Viernes, 9:00 - 18:00 (hora de España)

### Antes de Contactar

1. **Revisa esta guía:** Muchas dudas están resueltas aquí
2. **Comprueba tu conexión:** Asegúrate de tener internet estable
3. **Actualiza tu navegador:** Usa la última versión de Chrome, Firefox o Edge
4. **Limpia caché:** Ctrl+Shift+Delete → Borrar caché y cookies

### Información a Proporcionar

Cuando contactes soporte, incluye:
- **Nombre completo** y **email** registrado
- **Rol** en el sistema (Admin, Clínica, Orientador, etc.)
- **Problema** detallado (qué intentabas hacer)
- **Pasos** para reproducir el error
- **Capturas de pantalla** (si es posible)
- **Navegador** y versión
- **Hora** aproximada del incidente

### Reporte de Bugs

Si encuentras un error:
1. Anota el error exacto (mensaje, código)
2. Captura pantalla
3. Abre consola del navegador (F12)
4. Captura errores en consola (pestaña "Console")
5. Envía todo a soporte@emooti.com

### Sugerencias de Mejora

¿Tienes ideas para mejorar EMOOTI?
- Email: ideas@emooti.com
- Subject: "Sugerencia de Mejora - [Tu sugerencia]"
- Describe tu idea detalladamente
- Explica qué problema resuelve
- Beneficios para usuarios

### Formación

**¿Necesitas formación adicional?**
- Sesiones de onboarding personalizadas
- Webinars mensuales sobre nuevas funcionalidades
- Videos tutoriales (próximamente en `/tutorials`)
- Documentación técnica avanzada

Contacta a: formacion@emooti.com

---

## 📚 RECURSOS ADICIONALES

### Documentación Técnica

- **PROJECT_STATUS.md:** Estado actual del proyecto
- **TESTING_REPORT.md:** Informe de testing end-to-end
- **ISSUES.md:** Problemas conocidos y roadmap
- **DASHBOARD_IMPLEMENTATION.md:** Guía de Dashboard mejorado

### Videos Tutoriales (Próximamente)

- Introducción a EMOOTI (10 min)
- Gestión de Usuarios y Estudiantes (15 min)
- Asignación y Seguimiento de Pruebas (20 min)
- Interpretación de Resultados (25 min)
- Facturación y Suscripciones (15 min)
- Seguridad y Cumplimiento RGPD (20 min)

### Glosario de Términos

- **NIA:** Número de Identificación del Alumno
- **CRUD:** Create, Read, Update, Delete (operaciones básicas)
- **RGPD:** Reglamento General de Protección de Datos
- **Soft Delete:** Eliminación lógica (desactivar sin borrar)
- **Hash:** Firma criptográfica para verificar integridad
- **Audit Log:** Registro de auditoría (log de acciones)
- **OAuth:** Sistema de autenticación con Google
- **JWT:** JSON Web Token (token de autenticación)

---

## 📋 NOTAS DE VERSIÓN

### Versión 1.0.0 (22 Oct 2025)

**Módulos Implementados:**
- ✅ Dashboard con gráficos interactivos
- ✅ Gestión de Usuarios
- ✅ Gestión de Estudiantes
- ✅ Gestión de Centros
- ✅ Asignación de Pruebas
- ✅ Resultados de Pruebas
- ✅ Agenda
- ✅ Dispositivos
- ✅ Inventario
- ✅ Suscripciones
- ✅ Facturas
- ✅ Seguridad y Auditoría
- ✅ Configuración
- ✅ Perfil de Usuario

**Características:**
- Autenticación con email/password y Google OAuth
- Sistema de roles y permisos
- Auditoría completa de acciones
- Cumplimiento RGPD
- Exportación a Excel
- Generación de PDFs
- Responsive design

**Próximas Versiones:**
- Módulo de Informes (generación automática)
- Módulo de Tutoriales (videos integrados)
- Sistema de notificaciones en tiempo real
- Dark mode
- Soporte multiidioma (inglés, catalán)
- PWA (instalable como app)
- Sincronización con Google Calendar

---

**© 2025 EMOOTI Hub SL - Todos los derechos reservados**

_Esta guía se actualiza constantemente. Última actualización: 22 de octubre de 2025_

---

Para cualquier duda no resuelta en esta guía, contacta con el equipo de soporte:
📧 soporte@emooti.com
📞 +34 XXX XXX XXX
