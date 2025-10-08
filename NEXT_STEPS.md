# EMOOTI - Próximos Pasos para Completar el Proyecto

## 📊 Resumen del Estado Actual

### ✅ COMPLETADO (Octubre 2025)

1. **Estructura del Proyecto**
   - ✅ Frontend React + Vite configurado
   - ✅ Backend Node.js + Express + TypeScript
   - ✅ Prisma ORM configurado
   - ✅ Sistema de rutas (React Router)
   - ✅ Stores (Zustand) para auth y app state

2. **Componentes UI (shadcn/ui)**
   - ✅ Button, Card, Badge, Input, Skeleton
   - ✅ Dialog (Modales)
   - ✅ Table (Tablas)
   - ✅ Select (Selectores)
   - ✅ Checkbox, Label

3. **Páginas Base**
   - ✅ Login (estructura)
   - ✅ Dashboard (completo con KPIs por rol)
   - ✅ Users (ejemplo completo funcional)
   - ✅ Todas las páginas placeholder creadas

4. **API Client**
   - ✅ axios configurado con interceptors
   - ✅ Métodos para todas las entidades definidos
   - ✅ Error handling centralizado

5. **Documentación**
   - ✅ IMPLEMENTATION_GUIDE.md (guía completa)
   - ✅ NEXT_STEPS.md (este archivo)
   - ✅ README.md del proyecto

---

## 🚀 PRIORIDAD 1: AUTENTICACIÓN Y BASE DE DATOS (Crítico - 1-2 semanas)

### Objetivo
Tener un sistema de autenticación funcional y base de datos operativa.

### Tareas

#### 1. Configurar Google OAuth (Backend)
**Archivo**: `backend/src/config/passport.ts`

```typescript
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: process.env.GOOGLE_CALLBACK_URL!,
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await prisma.user.findUnique({
        where: { email: profile.emails![0].value }
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email: profile.emails![0].value,
            full_name: profile.displayName,
            user_type: 'FAMILIA', // default
            status: 'active',
          }
        });
      }

      return done(null, user);
    } catch (error) {
      return done(error, undefined);
    }
  }
));

export default passport;
```

#### 2. Schema de Prisma Completo
**Archivo**: `backend/prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String   @id @default(cuid())
  user_id       String   @unique // USR_XXX
  full_name     String
  email         String   @unique
  phone         String?
  dni           String?  @unique
  birth_date    DateTime?
  nationality   String?
  user_type     UserType
  status        UserStatus

  // Relaciones con centros
  center_id     String?
  center        Center?  @relation("PrimaryCenter", fields: [center_id], references: [id])
  center_ids    String[] // Array de IDs adicionales

  // Especialidad (para clínica)
  specialty     String?
  license_number String?

  // Datos de pago
  payment_method String?
  bank_iban     String?
  stripe_customer_id String?

  // Metadata
  active        Boolean  @default(true)
  created_date  DateTime @default(now())
  updated_date  DateTime @updatedAt

  // Relaciones
  assignedTests TestAssignment[]
  examinations  TestResult[] @relation("Examiner")
  auditLogs     AuditLog[]

  @@map("users")
}

enum UserType {
  ADMINISTRADOR
  CLINICA
  ORIENTADOR
  EXAMINADOR
  FAMILIA
}

enum UserStatus {
  active
  pending_invitation
  invitation_sent
  inactive
}

model Student {
  id            String   @id @default(cuid())
  student_id    String   @unique // STU_XXX
  nia           String?  @unique
  full_name     String
  phone         String?
  dni           String?
  birth_date    DateTime
  gender        String?
  nationality   String?

  // Centro educativo
  center_id     String
  center        Center   @relation(fields: [center_id], references: [id])

  // Nivel educativo
  etapa         String
  course        String
  class_group   String?

  // Orientador
  orientador_user_id String?
  orientador    User?    @relation("Orientador", fields: [orientador_user_id], references: [id])

  // Necesidades especiales
  disability_degree         Int?
  special_educational_needs String?
  medical_observations      String?
  general_observations      String?

  // Consentimiento y pago
  consent_given    ConsentStatus
  payment_type     PaymentType?
  payment_status   PaymentStatus?

  // Metadata
  active        Boolean  @default(true)
  created_date  DateTime @default(now())
  updated_date  DateTime @updatedAt

  // Relaciones
  testAssignments TestAssignment[]
  testResults     TestResult[]
  familyRelations StudentFamilyRelation[]

  @@map("students")
}

enum ConsentStatus {
  Si
  No
  Pendiente
  NA
}

enum PaymentType {
  B2B
  B2B2C
  NA
}

enum PaymentStatus {
  Pagado
  Pendiente
  NA
}

model Center {
  id            String   @id @default(cuid())
  code          String   @unique
  name          String
  phone         String?
  email         String?
  responsable   String?
  type          CenterType
  total_students Int?

  // Dirección
  address       String?
  country       String?
  autonomous_community String?
  province      String?
  city          String?
  postal_code   String?

  // Documentos
  contract_document_url String?
  additional_documents  Json?
  observations          String?

  // Metadata
  active        Boolean  @default(true)
  created_date  DateTime @default(now())
  updated_date  DateTime @updatedAt

  // Relaciones
  students      Student[]
  users         User[]   @relation("PrimaryCenter")
  agendaEvents  AgendaEvent[]

  @@map("centers")
}

enum CenterType {
  publico
  concertado
  privado
}

model TestAssignment {
  id            String   @id @default(cuid())
  student_id    String
  student       Student  @relation(fields: [student_id], references: [id])

  test_title    String
  test_link     String? // URL del QR
  test_date     DateTime?
  completion_date DateTime?

  assigned_by   String
  assigned_date DateTime @default(now())

  test_status   TestStatus
  consent_given ConsentStatus
  priority      Priority
  notes         String?

  active        Boolean  @default(true)
  created_date  DateTime @default(now())
  updated_date  DateTime @updatedAt

  // Relaciones
  assignedByUser User    @relation(fields: [assigned_by], references: [id])
  testResults   TestResult[]

  @@map("test_assignments")
}

enum TestStatus {
  Si
  No
  Pendiente
  NA
}

enum Priority {
  baja
  media
  alta
  urgente
}

model TestResult {
  id            String   @id @default(cuid())
  result_id     String   @unique
  assignment_id String?
  assignment    TestAssignment? @relation(fields: [assignment_id], references: [id])

  student_id    String
  student       Student  @relation(fields: [student_id], references: [id])

  test_name     String   @db.VarChar(255)
  test_code     String?
  academic_year String?
  original_pdf_url String?

  examiner_id   String?
  examiner      User?    @relation("Examiner", fields: [examiner_id], references: [id])

  execution_date DateTime

  // Resultados
  raw_score      Float?
  percentile     Int?
  standard_score Float?
  interpretation String?
  detailed_results Json?

  observations  String?
  incidents     String?

  // Validación
  validated     Boolean  @default(false)
  validated_by  String?
  validation_date DateTime?

  // Metadata
  import_source String?
  test_version  String?
  created_date  DateTime @default(now())
  updated_date  DateTime @updatedAt

  @@index([student_id])
  @@index([test_name])
  @@index([execution_date])
  @@index([academic_year])
  @@map("test_results")
}

model StudentFamilyRelation {
  id            String   @id @default(cuid())
  student_id    String
  student       Student  @relation(fields: [student_id], references: [id])

  user_id       String
  user          User     @relation(fields: [user_id], references: [id])

  relation_type String   // padre, madre, tutor_legal, etc.
  is_primary_contact Boolean @default(false)
  is_emergency_contact Boolean @default(false)

  created_date  DateTime @default(now())

  @@map("student_family_relations")
}

// TODO: Agregar el resto de modelos según el schema completo
// - AgendaEvent
// - Device
// - InventoryItem
// - SubscriptionConfiguration
// - SubscriptionBilling
// - Invoice
// - EmotiTest
// - EmotiTestResult
// - AuditLog
// - AnomalyAlert
// - PseudonymMapping
// - RetentionPolicy
// - etc.
```

#### 3. Ejecutar Migraciones
```bash
cd backend
npm run db:push        # Para desarrollo
# o
npm run db:migrate     # Para producción
```

#### 4. Crear Seeder con Datos Iniciales
**Archivo**: `backend/prisma/seed.ts`

```typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Admin user
  const adminUser = await prisma.user.create({
    data: {
      user_id: 'USR_001',
      full_name: 'Admin EMOOTI',
      email: 'admin@emooti.com',
      user_type: 'ADMINISTRADOR',
      status: 'active',
      active: true,
    },
  });

  console.log('Admin user created:', adminUser.email);

  // TODO: Crear centros, alumnos, etc.
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

```bash
npm run db:seed
```

#### 5. Implementar Rutas de Autenticación (Backend)
**Archivo**: `backend/src/routes/auth.routes.ts`

```typescript
import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Google OAuth
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { session: false }),
  (req, res) => {
    const user = req.user as any;

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
    );

    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}&refreshToken=${refreshToken}`);
  }
);

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        user_id: true,
        full_name: true,
        email: true,
        user_type: true,
        status: true,
        center_id: true,
        center_ids: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: { message: 'Usuario no encontrado' } });
    }

    res.json({ data: user });
  } catch (error) {
    res.status(500).json({ error: { message: 'Error al obtener usuario' } });
  }
});

// Logout
router.post('/logout', (req, res) => {
  // With JWT, logout is handled client-side
  res.json({ success: true });
});

export default router;
```

#### 6. Actualizar Login.jsx (Frontend)
**Archivo**: `src/pages/Login.jsx`

```jsx
import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import useAuthStore from '@/store/authStore';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuthStore();

  useEffect(() => {
    // Handle OAuth callback
    const token = searchParams.get('token');
    const refreshToken = searchParams.get('refreshToken');

    if (token && refreshToken) {
      localStorage.setItem('emooti_token', token);
      localStorage.setItem('emooti_refresh_token', refreshToken);

      // Fetch user data
      login().then(() => {
        navigate('/dashboard');
      });
    }
  }, [searchParams, login, navigate]);

  const handleGoogleLogin = () => {
    // Redirect to backend OAuth
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/google`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">EMOOTI</h1>
          <p className="text-slate-600 mt-2">Sistema de Gestión del Neurodesarrollo Infantil</p>
        </div>

        <Button
          onClick={handleGoogleLogin}
          className="w-full"
          size="lg"
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            {/* Google Icon SVG */}
          </svg>
          Iniciar sesión con Google
        </Button>
      </div>
    </div>
  );
}
```

---

## 🎯 PRIORIDAD 2: IMPLEMENTAR MÓDULOS CORE (2-3 semanas)

### Orden Sugerido

1. **Usuarios** ✅ (Ya tienes el ejemplo completo)
   - Copiar la estructura de `Users.jsx`
   - Implementar formulario completo con react-hook-form
   - Conectar con backend real

2. **Centros**
   - Replicar patrón de Users.jsx
   - Añadir mapa con react-leaflet
   - Upload de documentos

3. **Estudiantes**
   - Similar a Users pero con más campos
   - Vinculación con familias
   - Importación CSV

4. **Asignación de Pruebas**
   - Generación de QR codes
   - Enlaces públicos
   - Vista agrupada

5. **Resultados de Pruebas**
   - Parser de PDFs (complejo)
   - Visualización específica por tipo
   - Histórico y comparación

---

## 📦 DEPENDENCIAS ADICIONALES NECESARIAS

### Frontend
```bash
npm install react-hook-form @hookform/resolvers zod
npm install react-leaflet leaflet
npm install recharts
npm install qrcode.react
npm install date-fns
```

### Backend
```bash
npm install @prisma/client
npm install passport passport-google-oauth20
npm install multer sharp  # Para upload de archivos
npm install pdf-parse pdf-lib  # Para parsing de PDFs
npm install qrcode  # Para generar QR
npm install stripe  # Para pagos
npm install nodemailer  # Para emails
```

---

## 🏗️ ARQUITECTURA RECOMENDADA

### Patrón para Cada Módulo

```
src/
  pages/
    [Module].jsx              # Página principal (listado)
  components/
    [module]/
      [Module]Table.jsx       # Tabla de datos
      [Module]Form.jsx        # Formulario crear/editar
      [Module]Filters.jsx     # Filtros
      [Module]BulkActions.jsx # Acciones en lote
      [Module]Detail.jsx      # Vista de detalle
```

### Flujo de Datos

```
User Interaction
    ↓
Component (useState/useEffect)
    ↓
API Call (apiClient)
    ↓
Backend Route
    ↓
Controller
    ↓
Service (Business Logic)
    ↓
Prisma (Database)
    ↓
Response
    ↓
Update State (Zustand/useState)
    ↓
UI Update
```

---

## ⚠️ PUNTOS CRÍTICOS

### 1. Seguridad RGPD
- **ANTES de producción**, implementar módulo completo de seguridad
- Logs de auditoría inmutables
- Detección de anomalías
- Políticas de retención automáticas

### 2. Testing
- No hay tests implementados
- Necesitas tests unitarios y de integración
- Testing manual exhaustivo

### 3. Performance
- Implementar paginación server-side para tablas grandes
- Lazy loading de imágenes
- Code splitting

### 4. Deployment
- Configurar CI/CD
- Variables de entorno en producción
- Backups automáticos
- Monitoreo (Sentry, LogRocket, etc.)

---

## 📚 RECURSOS ÚTILES

- [Prisma Docs](https://www.prisma.io/docs)
- [React Hook Form](https://react-hook-form.com)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Zustand](https://docs.pmnd.rs/zustand)
- [Recharts](https://recharts.org)
- [React Leaflet](https://react-leaflet.js.org)

---

## 🎓 ESTIMACIÓN REALISTA

| Fase | Tiempo | Developer(s) |
|------|--------|--------------|
| Auth + DB | 1-2 semanas | 1 senior |
| Módulos Core (Usuarios, Centros, Alumnos) | 2-3 semanas | 1 senior |
| Evaluaciones (Pruebas, Resultados) | 3-4 semanas | 1 senior + 1 mid |
| Financiero | 2-3 semanas | 1 senior |
| RGPD y Seguridad | 2-3 semanas | 1 senior |
| Testing + Refinamiento | 2 semanas | 1-2 devs |
| **TOTAL** | **3-5 meses** | **1-2 desarrolladores** |

---

## ✅ CHECKLIST SEMANAL

### Semana 1-2: Fundamentos
- [ ] Configurar Google OAuth
- [ ] Completar schema de Prisma
- [ ] Ejecutar migraciones
- [ ] Crear seeders
- [ ] Login funcional end-to-end
- [ ] Dashboard conectado a datos reales

### Semana 3-4: Usuarios y Centros
- [ ] Formulario completo de Usuarios
- [ ] CRUD de Usuarios conectado
- [ ] Importación CSV usuarios
- [ ] CRUD de Centros completo
- [ ] Mapa de centros
- [ ] Upload de documentos

### Semana 5-6: Estudiantes
- [ ] CRUD de Estudiantes
- [ ] Vinculación con familias
- [ ] Importación masiva
- [ ] Filtros avanzados

### Semana 7-9: Evaluaciones
- [ ] Asignación de pruebas con QR
- [ ] Parser de PDFs (Stap2Go, Raven's)
- [ ] Visualización de resultados
- [ ] Histórico por alumno
- [ ] Comparación de pruebas

### Semana 10-12: Pruebas EMOOTI
- [ ] Configurador de pruebas
- [ ] Generador de HTML
- [ ] Página pública
- [ ] Resultados por tipo de prueba

### Semana 13-15: Resto de Módulos
- [ ] Agenda completa
- [ ] Recursos (Dispositivos, Inventario)
- [ ] Financiero básico
- [ ] Reportes e informes

### Semana 16-18: RGPD y Producción
- [ ] Seguridad RGPD completa
- [ ] Testing exhaustivo
- [ ] Deployment
- [ ] Monitoreo
- [ ] Documentación usuario final

---

## 🆘 SI TE BLOQUEAS

1. **Revisa `IMPLEMENTATION_GUIDE.md`**
2. **Usa `Users.jsx` como referencia**
3. **Consulta la documentación de las librerías**
4. **Implementa fase por fase, no intentes todo de golpe**
5. **Testea cada módulo antes de avanzar**

---

**Última actualización**: Octubre 2025
**Estado**: Fundamentos completados, listo para Fase 1
