# 🔐 Guía Completa: Configurar Google OAuth en EMOOTI

## ✅ PASO 1: Obtener Credenciales de Google (HECHO)

Ya obtuviste tu Client ID y Client Secret de Google Cloud Console.

---

## 📝 PASO 2: Configurar Variables de Entorno

### 2.1 Crear archivo `.env` en el backend

```bash
cd backend
cp .env.example .env
```

### 2.2 Editar `backend/.env` y pegar tus credenciales:

```env
# Server Configuration
NODE_ENV=development
PORT=3000
API_VERSION=v1

# CORS
CORS_ORIGIN=http://localhost:5173

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Database (IMPORTANTE: Cambiar según tu configuración)
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/emooti?schema=public"

# JWT Configuration (IMPORTANTE: Cambiar en producción)
JWT_SECRET=tu-clave-super-secreta-cambia-esto-produccion-12345
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Google OAuth 2.0 (PEGA TUS CREDENCIALES AQUÍ)
GOOGLE_CLIENT_ID=tu-google-client-id-aqui.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu-google-client-secret-aqui
GOOGLE_CALLBACK_URL=http://localhost:3000/api/v1/auth/google/callback

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**IMPORTANTE**: Reemplaza:
- `DATABASE_URL` con tu conexión PostgreSQL
- `GOOGLE_CLIENT_ID` con tu Client ID de Google
- `GOOGLE_CLIENT_SECRET` con tu Client Secret de Google
- `JWT_SECRET` con una clave secreta fuerte

---

## 🗄️ PASO 3: Configurar PostgreSQL

### Opción A: PostgreSQL Local

#### Instalar PostgreSQL (si no lo tienes):

**Windows**:
```bash
# Descargar de https://www.postgresql.org/download/windows/
# O usar chocolatey:
choco install postgresql
```

**Mac**:
```bash
brew install postgresql
brew services start postgresql
```

#### Crear Base de Datos:

```bash
# Conectar a PostgreSQL
psql -U postgres

# Crear base de datos
CREATE DATABASE emooti;

# Crear usuario (opcional)
CREATE USER emooti_user WITH PASSWORD 'tu_password';
GRANT ALL PRIVILEGES ON DATABASE emooti TO emooti_user;

# Salir
\q
```

Actualiza `DATABASE_URL` en `.env`:
```env
DATABASE_URL="postgresql://emooti_user:tu_password@localhost:5432/emooti?schema=public"
```

### Opción B: PostgreSQL en la Nube (MÁS FÁCIL)

**Recomendado**: [Supabase](https://supabase.com) (gratis)

1. Ir a https://supabase.com
2. Crear cuenta y nuevo proyecto
3. Nombre: "emooti"
4. Password: (copia y guarda)
5. Región: Europe West (London)
6. Esperar a que se cree (~2 minutos)
7. Ir a Settings > Database
8. Copiar "Connection string" (URI)
9. Pegar en `DATABASE_URL` en `.env`

---

## 🔧 PASO 4: Configurar Schema de Prisma

### 4.1 Verificar `backend/prisma/schema.prisma`

Asegúrate de tener el schema básico (ya debería estar):

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
  user_id       String   @unique
  full_name     String
  email         String   @unique
  phone         String?
  dni           String?  @unique
  birth_date    DateTime?
  nationality   String?
  user_type     UserType
  status        UserStatus

  center_id     String?
  center_ids    String[]

  specialty     String?
  license_number String?

  payment_method String?
  bank_iban     String?
  stripe_customer_id String?

  active        Boolean  @default(true)
  created_date  DateTime @default(now())
  updated_date  DateTime @updatedAt

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
```

### 4.2 Ejecutar Migraciones

```bash
cd backend

# Generar cliente de Prisma
npm run db:generate

# Crear tablas en la base de datos
npm run db:push

# Verificar que funcionó
npm run db:studio
```

Esto abrirá Prisma Studio en tu navegador (http://localhost:5555) donde verás tus tablas.

---

## 🚀 PASO 5: Actualizar el Servidor Backend

### 5.1 Modificar `backend/src/index.ts`

Añade Passport al inicio del archivo (después de los imports):

```typescript
// Después de los imports existentes, ANTES de inicializar app
import passportConfig from './config/passport';

// ... resto del código ...

// Añade esto ANTES de las rutas (después de app.use(compression()))
app.use(passportConfig.initialize());
```

---

## 🎨 PASO 6: Actualizar Frontend - Página de Login

### 6.1 Crear variables de entorno del frontend

Crear archivo `/.env` (en la raíz del proyecto, NO en backend):

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_GOOGLE_CLIENT_ID=tu-google-client-id.apps.googleusercontent.com
```

### 6.2 Actualizar `src/pages/Login.jsx`

El archivo ya debería tener la estructura correcta. Verifica que tenga:

```jsx
const handleGoogleLogin = () => {
  window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/google`;
};
```

---

## ✅ PASO 7: Probar el Flujo Completo

### 7.1 Arrancar el Backend

```bash
cd backend
npm run dev
```

Deberías ver:
```
🚀 EMOOTI Backend API server running on port 3000
📊 Environment: development
🔗 API Version: v1
🌐 CORS Origin: http://localhost:5173
```

### 7.2 Arrancar el Frontend

En otra terminal:
```bash
# Desde la raíz del proyecto
npm run dev
```

Deberías ver:
```
VITE v4.5.14  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: http://192.168.X.X:5173/
```

### 7.3 Probar el Login

1. Abre http://localhost:5173
2. Deberías ser redirigido a `/login` (porque no estás autenticado)
3. Click en "Iniciar sesión con Google"
4. Serás redirigido a Google
5. Inicia sesión con tu cuenta Google
6. Google te redirige de vuelta a tu app
7. Deberías ver el Dashboard

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Error: "Invalid redirect URI"

**Causa**: La URI de callback no está autorizada en Google Console

**Solución**:
1. Ve a Google Cloud Console
2. Credentials > Tu OAuth Client
3. Authorized redirect URIs
4. Asegúrate de que esté: `http://localhost:3000/api/v1/auth/google/callback`
5. Guarda y espera 5 minutos

### Error: "Cannot connect to database"

**Causa**: PostgreSQL no está corriendo o URL incorrecta

**Solución**:
```bash
# Verificar que PostgreSQL esté corriendo
# Windows
services.msc  # Buscar PostgreSQL

# Mac
brew services list

# Verificar conexión
psql -U postgres
# o
psql -U emooti_user -d emooti
```

### Error: "Table does not exist"

**Causa**: No ejecutaste las migraciones de Prisma

**Solución**:
```bash
cd backend
npm run db:push
```

### Error: "CORS policy"

**Causa**: Configuración de CORS incorrecta

**Solución**:
Verifica que en `backend/.env`:
```env
CORS_ORIGIN=http://localhost:5173
FRONTEND_URL=http://localhost:5173
```

### Error en el callback: "auth_failed"

**Causa**: Usuario inactivo o error al crear usuario

**Solución**:
1. Revisa los logs del backend
2. Verifica que la tabla `users` existe
3. Intenta crear un usuario manualmente:

```bash
npm run db:studio
```

Luego en Prisma Studio:
- Model: User
- Add record
- Rellena los campos requeridos

---

## 📝 SIGUIENTE PASO

Una vez que el login funcione:

1. ✅ Tienes autenticación OAuth completa
2. ✅ Puedes crear usuarios
3. ✅ JWT tokens funcionando

**Próximo módulo**: Implementar CRUD de Usuarios completo

¿Necesitas ayuda con algún paso específico? ¡Pregúntame!
