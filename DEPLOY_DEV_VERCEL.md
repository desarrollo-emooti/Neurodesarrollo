# 🚀 Despliegue en DEV (Vercel + Railway)

**Tiempo estimado:** 10 minutos
**Última actualización:** 2025-10-08

---

## ✅ Pre-requisitos

- [x] Código subido a GitHub: `https://github.com/desarrollo-emooti/Neurodesarrollo`
- [ ] Cuenta Vercel (https://vercel.com - Sign up with GitHub)
- [ ] Cuenta Railway (https://railway.app - Sign up with GitHub)
- [x] Google OAuth Client ID configurado

---

## 📦 PASO 1: Desplegar Frontend en Vercel

### 1.1 Crear Proyecto en Vercel

1. **Ir a Vercel:** https://vercel.com/new
2. **Importar repositorio:**
   - Click en "Import Git Repository"
   - Selecciona: `desarrollo-emooti/Neurodesarrollo`
   - Autoriza Vercel si es necesario

### 1.2 Configurar el Proyecto

**Framework Preset:** Vite (detectado automáticamente)

**Root Directory:** `frontend`

**Build Settings:**
```
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

### 1.3 NO DESPLEGAR TODAVÍA

⚠️ **IMPORTANTE:** Click en **"Environment Variables"** ANTES de desplegar

### 1.4 Añadir Variables de Entorno

En la sección **"Environment Variables"** añade:

```bash
# Variable 1
VITE_API_BASE_URL=
# DEJAR VACÍO POR AHORA - lo completaremos después de Railway

# Variable 2
VITE_GOOGLE_CLIENT_ID=1014141979079-qioa1bhqdmejbfdtirl5788a3u43bp44.apps.googleusercontent.com
```

### 1.5 Desplegar

1. Click **"Deploy"**
2. Espera ~2 minutos
3. **GUARDA TU URL DE VERCEL:**
   ```
   Ejemplo: https://neurodesarrollo-abc123.vercel.app
   ```

---

## 🔧 PASO 2: Desplegar Backend en Railway

### 2.1 Crear Proyecto en Railway

1. **Ir a Railway:** https://railway.app/new
2. Click **"Deploy from GitHub repo"**
3. Autoriza Railway si es necesario
4. Selecciona: `desarrollo-emooti/Neurodesarrollo`

### 2.2 Configurar el Servicio

Railway detectará automáticamente Node.js.

**Settings > General:**
```
Root Directory: backend
Start Command: npm run start
Build Command: npm install && npx prisma generate
```

### 2.3 Configurar Variables de Entorno

En **Variables** tab, añade TODAS estas variables:

```bash
# Server
NODE_ENV=production
PORT=3000
API_VERSION=v1

# CORS - ⚠️ CAMBIAR por tu URL de Vercel
CORS_ORIGIN=https://neurodesarrollo-abc123.vercel.app
FRONTEND_URL=https://neurodesarrollo-abc123.vercel.app

# Database - Supabase (ya configurado)
DATABASE_URL=postgresql://postgres.hemvzbdufbysgvaemurx:LBLLvLVA5xKeM9ez@aws-1-eu-west-2.pooler.supabase.com:5432/postgres

# JWT - ⚠️ GENERAR NUEVOS SECRETOS (ver abajo)
JWT_SECRET=CAMBIA-ESTO-POR-UN-VALOR-SUPER-SEGURO
JWT_REFRESH_SECRET=CAMBIA-ESTO-POR-OTRO-VALOR-SUPER-SEGURO
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Google OAuth - ⚠️ IMPORTANTE: Obtener el secret correcto
GOOGLE_CLIENT_ID=1014141979079-qioa1bhqdmejbfdtirl5788a3u43bp44.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=OBTENER-DE-GOOGLE-CLOUD-CONSOLE
GOOGLE_CALLBACK_URL=https://tu-backend.railway.app/api/v1/auth/google/callback

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 2.4 Generar JWT Secrets Seguros

Ejecuta en tu terminal LOCAL (2 veces):

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copia los resultados y úsalos para `JWT_SECRET` y `JWT_REFRESH_SECRET`

### 2.5 Obtener GOOGLE_CLIENT_SECRET

1. Ve a: https://console.cloud.google.com/apis/credentials
2. Click en tu OAuth Client ID (`1014141979079...`)
3. Copia el **"Client secret"** (debe empezar con `GOCSPX-`)
4. Pégalo en `GOOGLE_CLIENT_SECRET`

### 2.6 Obtener URL de Railway

1. Railway desplegará automáticamente
2. Ve a **Settings > Domains**
3. Verás algo como: `neurodesarrollo-production-xxxx.up.railway.app`
4. **COPIA ESTA URL** (la necesitarás para el siguiente paso)

---

## 🔄 PASO 3: Conectar Frontend ↔ Backend

### 3.1 Actualizar Variables en Railway

Vuelve a Railway > Variables y actualiza con tus URLs reales:

```bash
CORS_ORIGIN=https://tu-frontend.vercel.app
FRONTEND_URL=https://tu-frontend.vercel.app
GOOGLE_CALLBACK_URL=https://tu-backend.railway.app/api/v1/auth/google/callback
```

Railway redesplegará automáticamente (~1 min).

### 3.2 Actualizar Variables en Vercel

1. Ve a Vercel > tu proyecto > Settings > Environment Variables
2. Edita `VITE_API_BASE_URL`:
   ```
   VITE_API_BASE_URL=https://tu-backend.railway.app/api/v1
   ```
3. **IMPORTANTE:** Debes **Redeploy** el frontend:
   - Ve a **Deployments**
   - Click en el último deployment
   - Click en "..." (tres puntos)
   - **Redeploy**

---

## 🔐 PASO 4: Configurar Google OAuth para Producción

1. Ve a: https://console.cloud.google.com/apis/credentials
2. Click en tu OAuth 2.0 Client ID
3. **Authorized JavaScript origins**, añadir:
   ```
   https://tu-frontend.vercel.app
   https://tu-backend.railway.app
   ```
4. **Authorized redirect URIs**, añadir:
   ```
   https://tu-backend.railway.app/api/v1/auth/google/callback
   ```
5. Click **SAVE**

⚠️ Espera **5-10 minutos** para que Google actualice la configuración.

---

## ✅ PASO 5: Verificar el Despliegue

### 5.1 Verificar Backend

Abre en el navegador:
```
https://tu-backend.railway.app/health
```

Deberías ver:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "...",
    "version": "1.0.0",
    "environment": "production"
  }
}
```

### 5.2 Verificar Frontend

Abre:
```
https://tu-frontend.vercel.app
```

Deberías ver la página de login con:
- Botón "Continuar con Google"
- Formulario de email/password

### 5.3 Probar Google OAuth

1. Click en **"Continuar con Google"**
2. Selecciona tu cuenta Google
3. Deberías ser redirigido al Dashboard

### 5.4 Probar Login Email/Password

```
Email: admin@emooti.com
Password: admin123
```

---

## 🐛 Solución de Problemas

### Error: "Failed to fetch"

**Causa:** Frontend no puede conectar con Backend

**Solución:**
1. Verifica `VITE_API_BASE_URL` en Vercel (debe apuntar a Railway)
2. Verifica `CORS_ORIGIN` en Railway (debe apuntar a Vercel)
3. Asegúrate de hacer **Redeploy** en Vercel después de cambiar variables

### Error: "redirect_uri_mismatch"

**Causa:** Google OAuth no tiene la URI autorizada

**Solución:**
1. Ve a Google Cloud Console
2. Añade la URL de Railway a "Authorized redirect URIs"
3. Espera 5-10 minutos

### Error: "invalid_client: Unauthorized"

**Causa:** `GOOGLE_CLIENT_SECRET` incorrecto

**Solución:**
1. Ve a Google Cloud Console
2. Copia el Client Secret correcto (debe empezar con `GOCSPX-`)
3. Actualiza en Railway > Variables
4. Railway redesplegará automáticamente

### Error: Database connection failed

**Causa:** `DATABASE_URL` incorrecta

**Solución:**
1. Verifica que la URL de Supabase esté correcta
2. Asegúrate de que Supabase esté activo

---

## 📊 Resumen de URLs

Rellena después de desplegar:

```
✅ Frontend (Vercel):
https://_____________________.vercel.app

✅ Backend (Railway):
https://_____________________.up.railway.app

✅ Database (Supabase):
postgresql://postgres.hemvzbdufbysgvaemurx:***@aws-1-eu-west-2.pooler.supabase.com:5432/postgres
```

---

## 🎉 ¡Listo!

Tu aplicación EMOOTI ahora está desplegada en:
- ✅ **Frontend:** Vercel (Gratis)
- ✅ **Backend:** Railway (~$5/mes)
- ✅ **Database:** Supabase (Gratis)

**Costo total:** ~$5/mes

---

## 📚 Próximos Pasos

1. ✅ Configurar dominio personalizado (opcional)
2. ✅ Configurar monitoreo de errores (Sentry)
3. ✅ Configurar CI/CD automático
4. ✅ Backups automáticos de base de datos

---

**Fecha de despliegue:** _______________
**Versión:** 1.0.0
**Desplegado por:** desarrollo@emooti.com
