# 🚀 Guía de Despliegue en Producción - EMOOTI

Esta guía te llevará paso a paso para desplegar EMOOTI en producción usando:
- ✅ **Vercel** para el Frontend (Gratis)
- ✅ **Railway** para el Backend ($5/mes)
- ✅ **Supabase** para PostgreSQL (Ya configurado, Gratis hasta 500MB)

---

## 📋 Pre-requisitos

Antes de empezar, asegúrate de tener:

- [x] Cuenta de GitHub (para alojar el código)
- [ ] Cuenta de Vercel (https://vercel.com - Sign up with GitHub)
- [ ] Cuenta de Railway (https://railway.app - Sign up with GitHub)
- [x] Google OAuth Client ID y Secret (ya lo tienes)
- [x] Base de datos Supabase (ya configurada)

---

## 🎯 PASO 1: Preparar el Repositorio de GitHub

### 1.1 Crear .gitignore (Ya creado)

Ya tienes el archivo `.gitignore` creado que excluye:
- Archivos `.env` (para no exponer secretos)
- `node_modules/`
- Archivos temporales

### 1.2 Commitear Cambios

```bash
git add .
git commit -m "feat: Preparar configuración para despliegue en producción

- Añadir vercel.json para frontend
- Añadir railway.json para backend
- Configurar .gitignore
- Añadir archivos .env.example
- Corregir enum UserStatus en backend
- Documentación de despliegue"

git push origin main
```

---

## 🎨 PASO 2: Desplegar Frontend en Vercel

### 2.1 Conectar a Vercel

1. Ve a https://vercel.com
2. Click en **"Add New Project"**
3. **Import Git Repository**
4. Selecciona tu repositorio: `Neurodesarrollo`
5. Vercel detectará automáticamente que es un proyecto Vite

### 2.2 Configurar el Proyecto

**Framework Preset:** Vite
**Root Directory:** `./` (raíz del proyecto)
**Build Command:** `npm run build`
**Output Directory:** `dist`
**Install Command:** `npm install`

### 2.3 Configurar Variables de Entorno

En Vercel > Settings > Environment Variables, añade:

```
VITE_API_BASE_URL=https://tu-backend.railway.app/api/v1
VITE_GOOGLE_CLIENT_ID=1014141979079-qioa1bhqdmejbfdtirl5788a3u43bp44.apps.googleusercontent.com
```

**⚠️ IMPORTANTE:** Cambia `tu-backend.railway.app` por la URL real que obtendrás en el Paso 3

### 2.4 Deploy

1. Click en **"Deploy"**
2. Espera ~2 minutos
3. Vercel te dará una URL como: `https://neurodesarrollo-xxx.vercel.app`
4. **Guarda esta URL**, la necesitarás para configurar el backend

---

## 🔧 PASO 3: Desplegar Backend en Railway

### 3.1 Crear Nuevo Proyecto

1. Ve a https://railway.app
2. Click en **"New Project"**
3. Selecciona **"Deploy from GitHub repo"**
4. Autoriza Railway a acceder a tu GitHub
5. Selecciona el repositorio: `Neurodesarrollo`

### 3.2 Configurar el Servicio

Railway detectará tu proyecto Node.js automáticamente.

**Settings > General:**
- **Root Directory:** `backend`
- **Start Command:** `npm run start`
- **Build Command:** `npm install && npx prisma generate`

### 3.3 Añadir Base de Datos PostgreSQL (Opcional)

Si quieres usar Railway para PostgreSQL en lugar de Supabase:

1. En el mismo proyecto, click en **"+ New"**
2. Selecciona **"Database" > "PostgreSQL"**
3. Railway creará automáticamente la base de datos
4. La variable `DATABASE_URL` se añadirá automáticamente

**O** continúa usando Supabase (recomendado para empezar).

### 3.4 Configurar Variables de Entorno

En Railway > tu servicio > Variables, añade:

```bash
# Server
NODE_ENV=production
PORT=3000
API_VERSION=v1

# CORS - Cambiar por tu URL de Vercel
CORS_ORIGIN=https://neurodesarrollo-xxx.vercel.app
FRONTEND_URL=https://neurodesarrollo-xxx.vercel.app

# Database - Usa tu Supabase o Railway
DATABASE_URL=postgresql://postgres.hemvzbdufbysgvaemurx:LBLLvLVA5xKeM9ez@aws-1-eu-west-2.pooler.supabase.com:5432/postgres

# JWT - CAMBIAR ESTOS VALORES POR UNOS NUEVOS Y SEGUROS
JWT_SECRET=CAMBIA-ESTO-POR-UN-SECRETO-MUY-LARGO-Y-ALEATORIO-PARA-PRODUCCION-123456789
JWT_REFRESH_SECRET=CAMBIA-ESTO-POR-OTRO-SECRETO-MUY-LARGO-Y-ALEATORIO-PARA-PRODUCCION-987654321
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Google OAuth
GOOGLE_CLIENT_ID=1014141979079-qioa1bhqdmejbfdtirl5788a3u43bp44.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=C0435y808
GOOGLE_CALLBACK_URL=https://tu-backend.railway.app/api/v1/auth/google/callback

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**⚠️ IMPORTANTE:**
- Reemplaza `neurodesarrollo-xxx.vercel.app` con tu URL real de Vercel
- Reemplaza `tu-backend.railway.app` con tu URL real de Railway
- **CAMBIA** los `JWT_SECRET` y `JWT_REFRESH_SECRET` por valores aleatorios y seguros

### 3.5 Generar Secretos Seguros para JWT

Puedes generar secretos seguros con Node.js:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Ejecuta este comando 2 veces y usa los resultados para `JWT_SECRET` y `JWT_REFRESH_SECRET`.

### 3.6 Deploy

1. Railway desplegará automáticamente
2. Espera ~3-5 minutos
3. Ve a **Settings > Domains**
4. Copia la URL: `https://neurodesarrollo-production-xxxx.up.railway.app`

---

## 🔄 PASO 4: Actualizar URLs Cruzadas

### 4.1 Actualizar Frontend (Vercel)

Vuelve a Vercel > Settings > Environment Variables:

```
VITE_API_BASE_URL=https://neurodesarrollo-production-xxxx.up.railway.app/api/v1
```

(Reemplaza con tu URL real de Railway)

**Redeploy** el frontend desde Vercel Dashboard > Deployments > "..." > Redeploy

### 4.2 Actualizar Backend (Railway)

Vuelve a Railway > Variables y actualiza:

```
CORS_ORIGIN=https://neurodesarrollo-xxx.vercel.app
FRONTEND_URL=https://neurodesarrollo-xxx.vercel.app
GOOGLE_CALLBACK_URL=https://neurodesarrollo-production-xxxx.up.railway.app/api/v1/auth/google/callback
```

(Reemplaza con tus URLs reales)

Railway redesplegará automáticamente.

---

## 🔐 PASO 5: Configurar Google OAuth para Producción

1. Ve a **Google Cloud Console** (https://console.cloud.google.com)
2. Selecciona tu proyecto OAuth
3. Ve a **Credentials > OAuth 2.0 Client IDs**
4. Edita tu Client ID
5. **Authorized JavaScript origins**, añade:
   ```
   https://neurodesarrollo-xxx.vercel.app
   https://neurodesarrollo-production-xxxx.up.railway.app
   ```
6. **Authorized redirect URIs**, añade:
   ```
   https://neurodesarrollo-production-xxxx.up.railway.app/api/v1/auth/google/callback
   ```
7. Guarda los cambios

---

## ✅ PASO 6: Verificar el Despliegue

### 6.1 Verificar Backend

Abre en tu navegador:
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

### 6.2 Verificar Frontend

1. Abre `https://tu-frontend.vercel.app`
2. Deberías ver la página de login
3. Prueba iniciar sesión con:
   ```
   Email: admin@emooti.com
   Password: admin123
   ```

### 6.3 Verificar Conexión Frontend-Backend

1. En el frontend, abre las DevTools (F12)
2. Ve a la pestaña Network
3. Intenta hacer login
4. Deberías ver peticiones a `https://tu-backend.railway.app/api/v1/auth/login` con status 200

---

## 🎯 PASO 7: Configurar Dominio Personalizado (Opcional)

### Para Frontend (Vercel)

1. Ve a Vercel > tu proyecto > Settings > Domains
2. Añade tu dominio: `emooti.com` o `app.emooti.com`
3. Sigue las instrucciones para configurar DNS
4. Vercel generará automáticamente certificado SSL

### Para Backend (Railway)

1. Ve a Railway > tu servicio > Settings > Domains
2. Añade tu dominio: `api.emooti.com`
3. Configura el registro CNAME en tu DNS
4. Railway generará automáticamente certificado SSL

**Después de configurar dominios:**
- Actualiza `VITE_API_BASE_URL` en Vercel
- Actualiza `CORS_ORIGIN`, `FRONTEND_URL` y `GOOGLE_CALLBACK_URL` en Railway
- Actualiza Google OAuth authorized origins y redirect URIs

---

## 📊 Costos Mensuales Estimados

| Servicio | Plan | Costo |
|----------|------|-------|
| **Vercel** (Frontend) | Hobby | **$0/mes** |
| **Railway** (Backend) | Developer | **~$5/mes** |
| **Supabase** (Database) | Free | **$0/mes** (hasta 500MB) |
| **Total** | | **~$5/mes** |

### Límites del Plan Gratuito de Vercel:
- ✅ 100 GB bandwidth
- ✅ 100 deployments/día
- ✅ SSL automático
- ✅ Custom domains

### Límites del Plan Gratuito de Supabase:
- ✅ 500 MB database storage
- ✅ 1 GB file storage
- ✅ 50,000 monthly active users
- ✅ Backups de 7 días

---

## 🐛 Solución de Problemas

### Error: "Failed to fetch"

**Problema:** Frontend no puede conectarse al backend

**Solución:**
1. Verifica que `VITE_API_BASE_URL` en Vercel apunte a Railway
2. Verifica que `CORS_ORIGIN` en Railway apunte a Vercel
3. Asegúrate de que ambos servicios estén desplegados

### Error: "Database connection failed"

**Problema:** Backend no puede conectarse a la base de datos

**Solución:**
1. Verifica que `DATABASE_URL` en Railway sea correcta
2. Verifica que Supabase esté activo
3. Verifica que Prisma esté generado (`npx prisma generate`)

### Error: "Invalid OAuth callback"

**Problema:** Google OAuth no redirige correctamente

**Solución:**
1. Verifica que las URLs autorizadas en Google Console sean correctas
2. Verifica que `GOOGLE_CALLBACK_URL` en Railway sea correcta
3. Espera 5-10 minutos después de cambiar configuración de Google

### Build falla en Vercel

**Problema:** El build del frontend falla

**Solución:**
1. Verifica que las variables de entorno estén configuradas
2. Verifica que `package.json` tenga el script `build`
3. Revisa los logs de Vercel para ver el error exacto

### Build falla en Railway

**Problema:** El build del backend falla

**Solución:**
1. Verifica que el Root Directory sea `backend`
2. Verifica que el Build Command incluya `npx prisma generate`
3. Revisa los logs de Railway para ver el error exacto

---

## 🔒 Seguridad en Producción

### Checklist de Seguridad

- [ ] Cambiar `JWT_SECRET` y `JWT_REFRESH_SECRET` a valores aleatorios
- [ ] Configurar Rate Limiting (ya configurado)
- [ ] Activar HTTPS (automático en Vercel y Railway)
- [ ] Revisar permisos de CORS
- [ ] Configurar backups de base de datos
- [ ] Monitoreo de errores (Sentry, LogRocket)
- [ ] No commitear archivos `.env` a Git

---

## 📞 Soporte

Si necesitas ayuda:

1. **Vercel**: https://vercel.com/docs
2. **Railway**: https://docs.railway.app
3. **Supabase**: https://supabase.com/docs

---

## 🎉 ¡Listo!

Tu aplicación EMOOTI ahora está en producción:

- **Frontend:** https://tu-app.vercel.app
- **Backend:** https://tu-backend.railway.app
- **Database:** Supabase

**Próximos pasos:**
1. Configurar dominio personalizado
2. Configurar monitoreo de errores
3. Configurar backups automáticos
4. Configurar CI/CD para deploys automáticos

---

**Última actualización:** 2025-10-08
**Versión:** 1.0.0
