# 🚀 Despliegue Backend en AWS App Runner

**Tiempo estimado:** 10 minutos
**Costo estimado:** ~$5-10/mes

---

## ✅ Credenciales Configuradas

```bash
# Google OAuth
GOOGLE_CLIENT_ID=1014141979079-u8pqte2e8uncdvds0loqvjucqvf5el0n.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# Frontend
FRONTEND_URL=https://neurodesarrollo.vercel.app
CORS_ORIGIN=https://neurodesarrollo.vercel.app

# JWT (ya generados)
JWT_SECRET=27aeb77b7c3ea0204be1eeba10067dbb566c6bf450452a2fbbdb641cf5d3146d5a3fe76d649a1381d78e3a526161f2d6ee94098554af9506cd75a69e243262ab
JWT_REFRESH_SECRET=3fdbf7fb48ccec0ef865e01fe8930448a34ee04f39f6aebce7aafa463ac9df19c6a3ec95ea2609ad0c6e6c990b9811d3c16fb06f61aecd43dd8c5f72d0eb362f
```

---

## 📦 PASO 1: Preparar Dockerfile (Ya existe en el proyecto)

Verifica que tengas `backend/Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "start"]
```

---

## 🔧 PASO 2: Crear Servicio en AWS App Runner

### 2.1 Acceder a AWS Console

1. **Ir a:** https://console.aws.amazon.com/apprunner
2. **Login** con tu cuenta AWS
3. Click **"Create service"**

### 2.2 Configurar Source

**Source:**
- Repository type: **Source code repository**
- Connect to GitHub: **Authorize AWS**
- Repository: `desarrollo-emooti/Neurodesarrollo`
- Branch: `main`
- Source directory: `backend`

**Deployment settings:**
- Deployment trigger: **Automatic**
- ✅ Monitor repository

Click **Next**

### 2.3 Configurar Build

**Build settings:**
- Configuration file: **Configure all settings here**
- Runtime: **Node.js 18**
- Build command:
  ```bash
  npm install && npx prisma generate
  ```
- Start command:
  ```bash
  npm start
  ```

**Port:** `3000`

Click **Next**

### 2.4 Configurar Service

**Service name:** `neurodesarrollo-backend`

**Virtual CPU:** 0.25 vCPU

**Memory:** 0.5 GB

**Environment variables:** (Copiar TODO esto)

```bash
NODE_ENV=production
PORT=3000
API_VERSION=v1

# CORS
CORS_ORIGIN=https://neurodesarrollo.vercel.app
FRONTEND_URL=https://neurodesarrollo.vercel.app

# Database
DATABASE_URL=postgresql://postgres.hemvzbdufbysgvaemurx:LBLLvLVA5xKeM9ez@aws-1-eu-west-2.pooler.supabase.com:5432/postgres

# JWT
JWT_SECRET=27aeb77b7c3ea0204be1eeba10067dbb566c6bf450452a2fbbdb641cf5d3146d5a3fe76d649a1381d78e3a526161f2d6ee94098554af9506cd75a69e243262ab
JWT_REFRESH_SECRET=3fdbf7fb48ccec0ef865e01fe8930448a34ee04f39f6aebce7aafa463ac9df19c6a3ec95ea2609ad0c6e6c990b9811d3c16fb06f61aecd43dd8c5f72d0eb362f
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Google OAuth
GOOGLE_CLIENT_ID=1014141979079-u8pqte2e8uncdvds0loqvjucqvf5el0n.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_CALLBACK_URL=https://TU-URL-APPRUNNER.awsapprunner.com/api/v1/auth/google/callback

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**⚠️ NOTA:** Dejaremos `GOOGLE_CALLBACK_URL` temporal, lo actualizaremos después.

### 2.5 Auto Scaling (Opcional)

- Min instances: **1**
- Max instances: **3**
- Max concurrency: **100**

### 2.6 Health Check

- Protocol: **HTTP**
- Path: `/health`
- Interval: **10 seconds**
- Timeout: **5 seconds**
- Unhealthy threshold: **3**

Click **Next**

### 2.7 Revisar y Crear

1. Revisa toda la configuración
2. Click **"Create & deploy"**
3. **Espera 5-10 minutos** para el primer deploy

---

## 🔗 PASO 3: Obtener URL de App Runner

Una vez desplegado:

1. En la consola de App Runner verás:
   ```
   Default domain: xxxxxxxx.us-east-1.awsapprunner.com
   ```
2. **COPIA ESTA URL**

---

## 🔄 PASO 4: Actualizar Variables Cruzadas

### 4.1 Actualizar GOOGLE_CALLBACK_URL en App Runner

1. Ve a tu servicio → **Configuration** → **Configure**
2. Edita `GOOGLE_CALLBACK_URL`:
   ```
   https://TU-URL-APPRUNNER.awsapprunner.com/api/v1/auth/google/callback
   ```
3. Click **Deploy**

### 4.2 Actualizar Variables en Vercel

1. Ve a: https://vercel.com/emooti/neurodesarrollo
2. **Settings** → **Environment Variables**
3. Edita `VITE_API_BASE_URL`:
   ```
   https://TU-URL-APPRUNNER.awsapprunner.com/api/v1
   ```
4. **Deployments** → **Redeploy**

---

## 🔐 PASO 5: Configurar Google OAuth

1. Ve a: https://console.cloud.google.com/apis/credentials
2. Click en tu OAuth Client ID
3. **Authorized JavaScript origins**, añadir:
   ```
   https://neurodesarrollo.vercel.app
   https://TU-URL-APPRUNNER.awsapprunner.com
   ```
4. **Authorized redirect URIs**, añadir:
   ```
   https://TU-URL-APPRUNNER.awsapprunner.com/api/v1/auth/google/callback
   ```
5. Click **SAVE**

---

## ✅ PASO 6: Verificar Despliegue

### 6.1 Health Check

```bash
curl https://TU-URL-APPRUNNER.awsapprunner.com/health
```

Deberías ver:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "environment": "production"
  }
}
```

### 6.2 Probar Login

1. Ve a: https://neurodesarrollo.vercel.app
2. Click en **"Continuar con Google"**
3. Deberías ser redirigido al Dashboard

---

## 💰 Costos AWS App Runner

**Ejemplo de cálculo mensual:**

- **Compute:** 0.25 vCPU × $0.007/hora = ~$5/mes
- **Memory:** 0.5 GB × $0.0008/hora = ~$0.30/mes
- **Build:** Gratis (primeras 100 builds/mes)

**Total estimado:** ~$5-6/mes

### Comparación:
- Railway: ~$5/mes
- App Runner: ~$5-6/mes
- Elastic Beanstalk: ~$10-15/mes
- EC2 t3.micro: ~$8/mes (sin auto-scaling)

---

## 🐛 Solución de Problemas

### Build falla

**Error:** `npm install failed`

**Solución:**
1. Verifica que `package.json` esté en `backend/`
2. Verifica build command: `npm install && npx prisma generate`

### Database connection failed

**Error:** `Can't reach database server`

**Solución:**
1. Verifica `DATABASE_URL` en variables
2. Asegúrate que Supabase permite conexiones desde AWS

### OAuth no funciona

**Error:** `redirect_uri_mismatch`

**Solución:**
1. Verifica URLs en Google Console
2. Verifica `GOOGLE_CALLBACK_URL` en App Runner
3. Espera 5-10 minutos después de cambios

---

## 🔄 Alternativa: AWS Elastic Beanstalk

Si App Runner no funciona, usa Elastic Beanstalk:

1. **Ir a:** https://console.aws.amazon.com/elasticbeanstalk
2. **Create application**
3. Platform: **Node.js 18**
4. Application code: **Upload your code**
5. Sube un ZIP con `backend/`

Variables de entorno en **Configuration** → **Software**

---

## 📊 Monitoreo

### CloudWatch Logs

App Runner automáticamente envía logs a CloudWatch:

1. Ve a: https://console.aws.amazon.com/cloudwatch
2. **Logs** → **Log groups**
3. Busca: `/aws/apprunner/neurodesarrollo-backend`

### Métricas

En App Runner Console → **Metrics**:
- CPU utilization
- Memory utilization
- Request count
- Response time

---

## 🎯 Dominio Personalizado (Opcional)

1. En App Runner → **Custom domains**
2. Add domain: `api.emooti.com`
3. Copia el **CNAME** value
4. Añade registro CNAME en tu DNS
5. Espera propagación (~5-10 min)

---

## ✅ Checklist Final

- [ ] Backend desplegado en App Runner
- [ ] Health check responde 200
- [ ] Variables de entorno configuradas
- [ ] Google OAuth configurado
- [ ] Frontend actualizado con API URL
- [ ] Login con Google funciona
- [ ] CloudWatch logs activo

---

**Despliegue completado:** _______________
**URL Backend:** https://________________.awsapprunner.com
**Costo mensual:** ~$5-6/mes
