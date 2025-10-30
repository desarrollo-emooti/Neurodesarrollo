# 🔧 Variables de Entorno - Guía Completa

Esta guía documenta todas las variables de entorno disponibles en el backend de EMOOTI.

## 📋 Índice

- [Servidor](#-servidor)
- [Base de Datos](#-base-de-datos)
- [Autenticación](#-autenticación)
- [Rate Limiting](#-rate-limiting)
- [Logging](#-logging)
- [APM y Error Tracking](#-apm-y-error-tracking-sentry)
- [Storage y AWS S3](#-storage-y-aws-s3)
- [Backup de Base de Datos](#-backup-de-base-de-datos)
- [Servicios Opcionales](#-servicios-opcionales)

---

## 🖥️ Servidor

### `NODE_ENV`
- **Tipo**: `string`
- **Valores**: `development` | `production` | `test`
- **Por defecto**: `development`
- **Descripción**: Entorno de ejecución de Node.js
- **Ejemplo**:
  ```bash
  NODE_ENV=production
  ```

### `PORT`
- **Tipo**: `number`
- **Por defecto**: `3000`
- **Descripción**: Puerto donde se ejecutará el servidor
- **Ejemplo**:
  ```bash
  PORT=3000
  ```

### `API_VERSION`
- **Tipo**: `string`
- **Por defecto**: `v1`
- **Descripción**: Versión de la API (para endpoints `/api/v1/...`)
- **Ejemplo**:
  ```bash
  API_VERSION=v1
  ```

### `CORS_ORIGIN`
- **Tipo**: `string` (URL)
- **Requerido**: Sí
- **Descripción**: URL del frontend permitida para CORS
- **Ejemplo**:
  ```bash
  # Desarrollo
  CORS_ORIGIN=http://localhost:5173

  # Producción
  CORS_ORIGIN=https://tu-app.vercel.app
  ```

### `FRONTEND_URL`
- **Tipo**: `string` (URL)
- **Requerido**: Sí
- **Descripción**: URL completa del frontend (para redirects OAuth)
- **Ejemplo**:
  ```bash
  FRONTEND_URL=http://localhost:5173
  ```

---

## 🗄️ Base de Datos

### `DATABASE_URL`
- **Tipo**: `string` (PostgreSQL connection string)
- **Requerido**: Sí
- **Descripción**: URL de conexión a PostgreSQL
- **Formato**: `postgresql://[user]:[password]@[host]:[port]/[database]?schema=public`
- **Ejemplo**:
  ```bash
  # Local
  DATABASE_URL="postgresql://postgres:password@localhost:5432/emooti?schema=public"

  # Supabase
  DATABASE_URL="postgresql://postgres.xxx:[password]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?schema=public"

  # Railway
  DATABASE_URL="postgresql://postgres:xxx@containers-us-west.railway.app:7891/railway"
  ```

---

## 🔐 Autenticación

### JWT Tokens

#### `JWT_SECRET`
- **Tipo**: `string` (min 32 caracteres)
- **Requerido**: Sí
- **Descripción**: Secreto para firmar JWT tokens de acceso
- **Ejemplo**:
  ```bash
  # Generar con:
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

  JWT_SECRET=a1b2c3d4e5f6...64caracteres
  ```

#### `JWT_REFRESH_SECRET`
- **Tipo**: `string` (min 32 caracteres)
- **Requerido**: Sí
- **Descripción**: Secreto para firmar JWT refresh tokens
- **Ejemplo**:
  ```bash
  JWT_REFRESH_SECRET=x1y2z3...64caracteres
  ```

#### `JWT_EXPIRES_IN`
- **Tipo**: `string`
- **Por defecto**: `7d`
- **Descripción**: Tiempo de expiración del JWT token
- **Formato**: `1h`, `7d`, `30m`
- **Ejemplo**:
  ```bash
  JWT_EXPIRES_IN=7d
  ```

#### `JWT_REFRESH_EXPIRES_IN`
- **Tipo**: `string`
- **Por defecto**: `30d`
- **Descripción**: Tiempo de expiración del refresh token
- **Ejemplo**:
  ```bash
  JWT_REFRESH_EXPIRES_IN=30d
  ```

### Google OAuth 2.0

#### `GOOGLE_CLIENT_ID`
- **Tipo**: `string`
- **Requerido**: Solo si usas Google OAuth
- **Descripción**: Client ID de Google Cloud Console
- **Dónde obtenerlo**: [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
- **Ejemplo**:
  ```bash
  GOOGLE_CLIENT_ID=123456789-abc123def456.apps.googleusercontent.com
  ```

#### `GOOGLE_CLIENT_SECRET`
- **Tipo**: `string`
- **Requerido**: Solo si usas Google OAuth
- **Descripción**: Client Secret de Google Cloud Console
- **Ejemplo**:
  ```bash
  GOOGLE_CLIENT_SECRET=GOCSPX-abc123def456...
  ```

#### `GOOGLE_CALLBACK_URL`
- **Tipo**: `string` (URL)
- **Requerido**: Solo si usas Google OAuth
- **Descripción**: URL de callback para OAuth (debe coincidir con Google Console)
- **Ejemplo**:
  ```bash
  # Local
  GOOGLE_CALLBACK_URL=http://localhost:3000/api/v1/auth/google/callback

  # Producción
  GOOGLE_CALLBACK_URL=https://tu-api.railway.app/api/v1/auth/google/callback
  ```

---

## 🚦 Rate Limiting

### `RATE_LIMIT_WINDOW_MS`
- **Tipo**: `number` (milisegundos)
- **Por defecto**: `900000` (15 minutos)
- **Descripción**: Ventana de tiempo para rate limiting
- **Ejemplo**:
  ```bash
  RATE_LIMIT_WINDOW_MS=900000  # 15 minutos
  ```

### `RATE_LIMIT_MAX_REQUESTS`
- **Tipo**: `number`
- **Por defecto**: `100`
- **Descripción**: Número máximo de requests por ventana
- **Ejemplo**:
  ```bash
  RATE_LIMIT_MAX_REQUESTS=100
  ```

---

## 📝 Logging

### Configuración General

#### `LOG_LEVEL`
- **Tipo**: `string`
- **Valores**: `debug` | `info` | `warn` | `error`
- **Por defecto**: `debug` (dev), `info` (prod)
- **Descripción**: Nivel mínimo de logging
- **Ejemplo**:
  ```bash
  LOG_LEVEL=info
  ```

#### `LOG_SERVICE`
- **Tipo**: `string`
- **Valores**: `local` | `papertrail` | `betterstack`
- **Por defecto**: `local`
- **Descripción**: Servicio de logging a usar
- **Ejemplo**:
  ```bash
  LOG_SERVICE=local        # Solo logs locales
  LOG_SERVICE=papertrail   # Enviar a Papertrail
  LOG_SERVICE=betterstack  # Enviar a Better Stack
  ```

#### `APP_NAME`
- **Tipo**: `string`
- **Por defecto**: `emooti-backend`
- **Descripción**: Nombre de la aplicación para identificar logs
- **Ejemplo**:
  ```bash
  APP_NAME=emooti-backend
  ```

### Papertrail (Logging Centralizado)

**¿Qué es?** Servicio de logging centralizado en la nube.

**Cómo configurarlo:**
1. Crear cuenta en [Papertrail](https://papertrailapp.com)
2. Crear un nuevo log destination
3. Copiar el host y puerto
4. Configurar variables:

#### `PAPERTRAIL_HOST`
- **Tipo**: `string`
- **Requerido**: Solo si `LOG_SERVICE=papertrail`
- **Ejemplo**:
  ```bash
  PAPERTRAIL_HOST=logs7.papertrailapp.com
  ```

#### `PAPERTRAIL_PORT`
- **Tipo**: `number`
- **Requerido**: Solo si `LOG_SERVICE=papertrail`
- **Ejemplo**:
  ```bash
  PAPERTRAIL_PORT=12345
  ```

**Precio**: Plan gratuito hasta 50MB/mes

### Better Stack / Logtail (Alternativa a Papertrail)

**¿Qué es?** Plataforma moderna de logging y monitoring.

**Cómo configurarlo:**
1. Crear cuenta en [Better Stack](https://betterstack.com)
2. Crear un nuevo source
3. Copiar el source token
4. Configurar variable:

#### `BETTERSTACK_SOURCE_TOKEN`
- **Tipo**: `string`
- **Requerido**: Solo si `LOG_SERVICE=betterstack`
- **Ejemplo**:
  ```bash
  BETTERSTACK_SOURCE_TOKEN=abc123def456...
  ```

**Precio**: Plan gratuito hasta 1GB/mes, 3 días de retención

---

## 📊 APM y Error Tracking (Sentry)

**¿Qué es Sentry?** Plataforma de Application Performance Monitoring (APM) y error tracking.

**Características:**
- ✅ Captura automática de errores
- ✅ Performance monitoring (APM)
- ✅ Profiling de código
- ✅ Tracking de Prisma queries
- ✅ Tracking de requests HTTP

**Cómo configurarlo:**
1. Crear cuenta en [Sentry.io](https://sentry.io)
2. Crear nuevo proyecto Node.js
3. Copiar el DSN
4. Configurar variables:

### `SENTRY_DSN`
- **Tipo**: `string` (URL)
- **Requerido**: Solo si usas Sentry
- **Descripción**: Data Source Name de tu proyecto Sentry
- **Ejemplo**:
  ```bash
  SENTRY_DSN=https://abc123@o123456.ingest.sentry.io/7891011
  ```

### `SENTRY_ENVIRONMENT`
- **Tipo**: `string`
- **Por defecto**: Valor de `NODE_ENV`
- **Descripción**: Nombre del entorno (para filtrar en Sentry)
- **Ejemplo**:
  ```bash
  SENTRY_ENVIRONMENT=production
  ```

### `SENTRY_TRACES_SAMPLE_RATE`
- **Tipo**: `number` (0.0 - 1.0)
- **Por defecto**: `0.1` (10%)
- **Descripción**: Porcentaje de transacciones a trackear (APM)
- **Recomendación**: `0.1` en producción, `1.0` en desarrollo
- **Ejemplo**:
  ```bash
  SENTRY_TRACES_SAMPLE_RATE=0.1
  ```

### `SENTRY_PROFILES_SAMPLE_RATE`
- **Tipo**: `number` (0.0 - 1.0)
- **Por defecto**: `0.1` (10%)
- **Descripción**: Porcentaje de transacciones a perfilar (profiling)
- **Ejemplo**:
  ```bash
  SENTRY_PROFILES_SAMPLE_RATE=0.1
  ```

**Precio**: Plan gratuito hasta 5K errores/mes y 10K transacciones/mes

---

## 💾 Storage y AWS S3

### Configuración de Storage

#### `STORAGE_TYPE`
- **Tipo**: `string`
- **Valores**: `local` | `s3`
- **Por defecto**: `local`
- **Descripción**: Tipo de almacenamiento para uploads
- **Recomendación**: `local` en dev, `s3` en producción
- **Ejemplo**:
  ```bash
  # Desarrollo
  STORAGE_TYPE=local

  # Producción
  STORAGE_TYPE=s3
  ```

### AWS S3 Configuration

**Cómo configurar AWS S3:**

1. **Crear cuenta AWS** (si no tienes)
2. **Crear bucket S3**:
   ```bash
   aws s3 mb s3://emooti-uploads-production --region eu-west-1
   ```
3. **Crear usuario IAM** con permisos S3:
   - IAM → Users → Create User
   - Attach Policy: `AmazonS3FullAccess` (o política más restrictiva)
   - Create Access Keys
4. **Configurar CORS** en el bucket:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedOrigins": ["https://tu-app.vercel.app"],
       "ExposeHeaders": ["ETag"]
     }
   ]
   ```

#### `AWS_REGION`
- **Tipo**: `string`
- **Requerido**: Si `STORAGE_TYPE=s3`
- **Descripción**: Región AWS donde está el bucket
- **Regiones comunes**: `eu-west-1` (Irlanda), `us-east-1` (Virginia), `eu-central-1` (Frankfurt)
- **Ejemplo**:
  ```bash
  AWS_REGION=eu-west-1
  ```

#### `AWS_ACCESS_KEY_ID`
- **Tipo**: `string`
- **Requerido**: Si `STORAGE_TYPE=s3`
- **Descripción**: Access Key ID del usuario IAM
- **Ejemplo**:
  ```bash
  AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
  ```

#### `AWS_SECRET_ACCESS_KEY`
- **Tipo**: `string`
- **Requerido**: Si `STORAGE_TYPE=s3`
- **Descripción**: Secret Access Key del usuario IAM
- **Ejemplo**:
  ```bash
  AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
  ```

#### `AWS_S3_BUCKET`
- **Tipo**: `string`
- **Requerido**: Si `STORAGE_TYPE=s3`
- **Descripción**: Nombre del bucket S3 para uploads
- **Ejemplo**:
  ```bash
  AWS_S3_BUCKET=emooti-uploads-production
  ```

#### `AWS_S3_UPLOADS_PREFIX`
- **Tipo**: `string`
- **Por defecto**: `uploads/`
- **Descripción**: Prefijo para organizar archivos en el bucket
- **Ejemplo**:
  ```bash
  AWS_S3_UPLOADS_PREFIX=uploads/
  ```

**Precio S3**:
- ~$0.023 por GB/mes (primeros 50TB)
- ~$0.005 por 1000 requests GET
- ~$0.005 por 1000 requests PUT

---

## 💾 Backup de Base de Datos

Ver [BACKUP.md](./BACKUP.md) para guía completa de backups.

### `BACKUP_DIR`
- **Tipo**: `string` (path)
- **Por defecto**: `./backups`
- **Descripción**: Directorio local para guardar backups
- **Ejemplo**:
  ```bash
  BACKUP_DIR=./backups
  ```

### `BACKUP_RETENTION_DAYS`
- **Tipo**: `number`
- **Por defecto**: `30`
- **Descripción**: Días de retención de backups locales
- **Ejemplo**:
  ```bash
  BACKUP_RETENTION_DAYS=30
  ```

### `AWS_S3_BACKUPS_BUCKET`
- **Tipo**: `string`
- **Opcional**: Sí
- **Descripción**: Bucket S3 específico para backups de BD (puede ser el mismo con prefijos diferentes)
- **Ejemplo**:
  ```bash
  AWS_S3_BACKUPS_BUCKET=emooti-backups-production
  ```

---

## 💳 Servicios Opcionales

### Stripe (Pagos)

#### `STRIPE_SECRET_KEY`
- **Tipo**: `string`
- **Opcional**: Sí (para futuro)
- **Descripción**: Secret Key de Stripe
- **Ejemplo**:
  ```bash
  # Testing
  STRIPE_SECRET_KEY=sk_test_...

  # Production
  STRIPE_SECRET_KEY=sk_live_...
  ```

#### `STRIPE_WEBHOOK_SECRET`
- **Tipo**: `string`
- **Opcional**: Sí
- **Descripción**: Secret para validar webhooks de Stripe
- **Ejemplo**:
  ```bash
  STRIPE_WEBHOOK_SECRET=whsec_...
  ```

### Signaturit (Firma Digital)

#### `SIGNATURIT_API_KEY`
- **Tipo**: `string`
- **Opcional**: Sí (para futuro)
- **Descripción**: API Key de Signaturit
- **Ejemplo**:
  ```bash
  SIGNATURIT_API_KEY=...
  ```

### Email (SMTP)

#### `SMTP_HOST`
- **Tipo**: `string`
- **Opcional**: Sí (para futuro)
- **Ejemplo**:
  ```bash
  SMTP_HOST=smtp.gmail.com
  ```

#### `SMTP_PORT`
- **Tipo**: `number`
- **Opcional**: Sí
- **Ejemplo**:
  ```bash
  SMTP_PORT=587
  ```

#### `SMTP_USER`
- **Tipo**: `string`
- **Opcional**: Sí
- **Ejemplo**:
  ```bash
  SMTP_USER=your-email@gmail.com
  ```

#### `SMTP_PASS`
- **Tipo**: `string`
- **Opcional**: Sí
- **Ejemplo**:
  ```bash
  SMTP_PASS=your-app-password
  ```

---

## 🎯 Configuraciones Recomendadas

### Desarrollo Local

```bash
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:5173
DATABASE_URL="postgresql://postgres:password@localhost:5432/emooti?schema=public"
JWT_SECRET=dev-secret-change-in-production
JWT_REFRESH_SECRET=dev-refresh-secret-change-in-production
STORAGE_TYPE=local
LOG_LEVEL=debug
LOG_SERVICE=local
```

### Producción (Railway + Vercel + Supabase)

```bash
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://tu-app.vercel.app
DATABASE_URL="postgresql://postgres.xxx:PASSWORD@aws-0-eu-west-1.pooler.supabase.com:6543/postgres"
JWT_SECRET=generado-con-crypto-64-caracteres
JWT_REFRESH_SECRET=generado-con-crypto-64-caracteres

# Google OAuth
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
GOOGLE_CALLBACK_URL=https://tu-api.railway.app/api/v1/auth/google/callback

# Storage S3
STORAGE_TYPE=s3
AWS_REGION=eu-west-1
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=xxx
AWS_S3_BUCKET=emooti-uploads-production
AWS_S3_BACKUPS_BUCKET=emooti-backups-production

# Logging (recomendado)
LOG_LEVEL=info
LOG_SERVICE=betterstack
BETTERSTACK_SOURCE_TOKEN=xxx

# Sentry APM (recomendado)
SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_PROFILES_SAMPLE_RATE=0.1

# Backups
BACKUP_DIR=./backups
BACKUP_RETENTION_DAYS=30
```

---

## 🔒 Seguridad

### ⚠️ NUNCA commitear archivos .env

Asegúrate de que `.env` está en `.gitignore`:

```bash
# .gitignore
.env
.env.local
.env.production
.env.*.local
```

### ✅ Buenas prácticas

1. **JWT Secrets**: Usar mínimo 64 caracteres aleatorios
2. **Rotar secrets**: Cambiar secrets regularmente en producción
3. **AWS Keys**: Usar políticas IAM restrictivas (solo permisos necesarios)
4. **DATABASE_URL**: Usar SSL en producción (`?sslmode=require`)
5. **Rate Limiting**: Ajustar según tráfico esperado
6. **Backups**: Configurar S3 con versionado y lifecycle policies

---

## 📚 Referencias

- [Sentry Node.js Docs](https://docs.sentry.io/platforms/node/)
- [AWS S3 Setup Guide](https://docs.aws.amazon.com/AmazonS3/latest/userguide/GetStartedWithS3.html)
- [Papertrail](https://papertrailapp.com/help)
- [Better Stack](https://betterstack.com/docs)
- [Railway Environment Variables](https://docs.railway.app/develop/variables)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
