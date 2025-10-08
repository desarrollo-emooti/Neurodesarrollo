# 🚀 Despliegue Rápido - 5 Minutos

## ✅ Pre-requisitos
- [x] Cuenta GitHub (ya la tienes)
- [ ] Cuenta Vercel (https://vercel.com - Sign up with GitHub)
- [ ] Cuenta Railway (https://railway.app - Sign up with GitHub)

---

## 📝 Paso 1: Subir a GitHub (1 min)

```bash
git push origin main
```

Si no tienes remote configurado:
```bash
git remote add origin https://github.com/tu-usuario/Neurodesarrollo.git
git push -u origin main
```

---

## 🎨 Paso 2: Desplegar Frontend en Vercel (2 min)

1. Ve a https://vercel.com
2. Click **"Add New Project"**
3. **Import** tu repo `Neurodesarrollo`
4. **Framework Preset**: Vite ✅ (detectado automáticamente)
5. Click **"Deploy"**
6. Espera ~2 minutos
7. **Guarda tu URL**: `https://neurodesarrollo-xxx.vercel.app`

### Variables de Entorno (Settings > Environment Variables):
```
VITE_API_BASE_URL=
VITE_GOOGLE_CLIENT_ID=1014141979079-qioa1bhqdmejbfdtirl5788a3u43bp44.apps.googleusercontent.com
```
*(Dejaremos `VITE_API_BASE_URL` vacía por ahora, la completaremos después)*

---

## 🔧 Paso 3: Desplegar Backend en Railway (2 min)

1. Ve a https://railway.app
2. Click **"New Project"**
3. **Deploy from GitHub repo**
4. Selecciona `Neurodesarrollo`

### Configurar:
**Settings > General:**
- Root Directory: `backend`
- Start Command: `npm run start`
- Build Command: `npm install && npx prisma generate`

### Variables de Entorno (copiar y pegar todo):

```bash
NODE_ENV=production
PORT=3000
API_VERSION=v1
CORS_ORIGIN=
FRONTEND_URL=
DATABASE_URL=postgresql://postgres.hemvzbdufbysgvaemurx:LBLLvLVA5xKeM9ez@aws-1-eu-west-2.pooler.supabase.com:5432/postgres
JWT_SECRET=CAMBIA-ESTO-POR-UN-VALOR-SUPER-SEGURO-EN-PRODUCCION-abc123xyz789
JWT_REFRESH_SECRET=CAMBIA-ESTO-POR-OTRO-VALOR-SUPER-SEGURO-EN-PRODUCCION-xyz789abc123
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
GOOGLE_CLIENT_ID=1014141979079-qioa1bhqdmejbfdtirl5788a3u43bp44.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=C0435y808
GOOGLE_CALLBACK_URL=
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**⚠️ IMPORTANTE: Genera nuevos JWT secrets:**
```bash
# Ejecuta esto 2 veces para generar 2 secretos diferentes
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Guarda tu URL**: `https://neurodesarrollo-production-xxxx.up.railway.app`

---

## 🔄 Paso 4: Conectar Frontend y Backend (30 seg)

### 4.1 Actualizar Frontend (Vercel)
Settings > Environment Variables:
```
VITE_API_BASE_URL=https://neurodesarrollo-production-xxxx.up.railway.app/api/v1
```
*(Reemplaza con tu URL de Railway)*

Deployments > "..." > **Redeploy**

### 4.2 Actualizar Backend (Railway)
Variables:
```
CORS_ORIGIN=https://neurodesarrollo-xxx.vercel.app
FRONTEND_URL=https://neurodesarrollo-xxx.vercel.app
GOOGLE_CALLBACK_URL=https://neurodesarrollo-production-xxxx.up.railway.app/api/v1/auth/google/callback
```
*(Reemplaza con tus URLs reales)*

Railway redespliega automáticamente.

---

## 🔐 Paso 5: Configurar Google OAuth (30 seg)

1. Google Cloud Console (https://console.cloud.google.com)
2. Tu proyecto > Credentials > OAuth 2.0 Client IDs
3. **Authorized JavaScript origins**, añadir:
   ```
   https://neurodesarrollo-xxx.vercel.app
   ```
4. **Authorized redirect URIs**, añadir:
   ```
   https://neurodesarrollo-production-xxxx.up.railway.app/api/v1/auth/google/callback
   ```
5. Guardar

---

## ✅ Verificar Despliegue

### Backend
```
https://tu-backend.railway.app/health
```
Debería mostrar: `{"success":true,"data":{"status":"healthy",...}}`

### Frontend
```
https://tu-frontend.vercel.app
```
Debería mostrar la página de login.

### Login
```
Email: admin@emooti.com
Password: admin123
```

---

## 🎉 ¡Listo!

Tu aplicación EMOOTI está en producción:

- 🎨 **Frontend**: https://tu-app.vercel.app
- 🔧 **Backend**: https://tu-backend.railway.app
- 📊 **Database**: Supabase (ya configurada)

**Costo total**: ~$5/mes (solo Railway, Vercel es gratis)

---

## 🐛 Problemas Comunes

### "Failed to fetch"
- Verifica CORS_ORIGIN en Railway
- Verifica VITE_API_BASE_URL en Vercel

### "Database connection failed"
- Verifica DATABASE_URL en Railway

### Build falla
- Backend: Verifica Root Directory = `backend`
- Frontend: Debería detectar Vite automáticamente

---

## 📚 Más Info

- Guía completa: `DEPLOYMENT_PRODUCTION.md`
- Desarrollo local: `README_DEPLOYMENT.md`

---

**Tiempo total**: ~5-10 minutos
**Siguiente**: Configurar dominio personalizado (opcional)
