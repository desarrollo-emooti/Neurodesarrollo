# 🚀 Guía de Despliegue - EMOOTI

## 📋 Resumen del Despliegue

**Fecha**: 2025-10-08
**Estado**: ✅ Entorno de desarrollo configurado y funcional

---

## 🎯 Servicios Desplegados

### Desarrollo Local

| Servicio | URL | Estado | Puerto |
|----------|-----|--------|--------|
| **Frontend** | http://localhost:5173 | ✅ Corriendo | 5173 |
| **Backend API** | http://localhost:3000 | ✅ Corriendo | 3000 |
| **Base de Datos** | Supabase PostgreSQL | ✅ Conectado | 5432 |

---

## 🔐 Credenciales de Acceso

### Usuario Administrador
```
Email:    admin@emooti.com
Password: admin123
```

### Base de Datos (Supabase)
```
Host: aws-1-eu-west-2.pooler.supabase.com
Port: 5432
Database: postgres
```

---

## 🚀 Iniciar el Entorno Local

### Opción 1: Script Automático (Recomendado)
```bash
.\start-dev.bat
```
Este script:
- Mata procesos en puertos 3000 y 5173
- Inicia el backend en una terminal
- Inicia el frontend en otra terminal

### Opción 2: Manual

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

---

## ✅ Verificar que Todo Funciona

### 1. Health Check del Backend
```bash
curl http://localhost:3000/health
```
**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-10-08T...",
    "version": "1.0.0",
    "environment": "development"
  }
}
```

### 2. Test de Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@emooti.com\",\"password\":\"admin123\"}"
```
**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGci...",
    "refreshToken": "eyJhbGci...",
    "user": {
      "id": "demo-admin-user",
      "email": "admin@emooti.com",
      "fullName": "Administrador Demo",
      "userType": "ADMINISTRADOR"
    }
  }
}
```

### 3. Acceso al Frontend
1. Abrir http://localhost:5173 en el navegador
2. Deberías ver la página de login
3. Usar las credenciales de arriba para entrar

---

## 🐛 Solución de Problemas

### Error: "Puerto 3000 ya en uso"
```bash
npx kill-port 3000
cd backend
npm run dev
```

### Error: "Puerto 5173 ya en uso"
```bash
npx kill-port 5173
npm run dev
```

### Error: "Can't reach database"
- Verifica que la variable `DATABASE_URL` en `backend/.env` esté correcta
- Verifica tu conexión a internet (Supabase es cloud)

### Frontend no carga
1. Verifica que el puerto 5173 esté libre
2. Verifica que el archivo `.env` en la raíz tenga:
   ```
   VITE_API_BASE_URL=http://localhost:3000/api/v1
   VITE_GOOGLE_CLIENT_ID=...
   ```

### Backend no arranca
1. Verifica que Node.js esté instalado: `node --version`
2. Verifica que las dependencias estén instaladas:
   ```bash
   cd backend
   npm install
   ```
3. Regenera el cliente de Prisma:
   ```bash
   npx prisma generate
   ```

---

## 📝 Variables de Entorno

### Frontend (`.env` en raíz)
```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_GOOGLE_CLIENT_ID=1014141979079-qioa1bhqdmejbfdtirl5788a3u43bp44.apps.googleusercontent.com
```

### Backend (`backend/.env`)
```env
NODE_ENV=development
PORT=3000
API_VERSION=v1

CORS_ORIGIN=http://localhost:5173
FRONTEND_URL=http://localhost:5173

DATABASE_URL="postgresql://postgres.hemvzbdufbysgvaemurx:LBLLvLVA5xKeM9ez@aws-1-eu-west-2.pooler.supabase.com:5432/postgres"

JWT_SECRET=emooti-super-secret-jwt-key-change-in-production-2024
JWT_REFRESH_SECRET=emooti-super-secret-refresh-key-change-in-production-2024
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

GOOGLE_CLIENT_ID=1014141979079-qioa1bhqdmejbfdtirl5788a3u43bp44.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=C0435y808
GOOGLE_CALLBACK_URL=http://localhost:3000/api/v1/auth/google/callback

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## 🔄 Reiniciar Servicios

### Reiniciar Backend
En la terminal del backend, presiona `Ctrl+C` y luego:
```bash
npm run dev
```

### Reiniciar Frontend
En la terminal del frontend, presiona `Ctrl+C` y luego:
```bash
npm run dev
```

### Reiniciar Todo
Cierra ambas terminales y ejecuta:
```bash
.\start-dev.bat
```

---

## 📊 Comandos Útiles

### Backend
```bash
# Ver logs
cd backend
npm run dev

# Regenerar Prisma Client
npx prisma generate

# Ver base de datos en Prisma Studio
npx prisma studio

# Ejecutar migraciones
npx prisma db push
```

### Frontend
```bash
# Desarrollo
npm run dev

# Build producción
npm run build

# Preview build
npm run preview
```

---

## 🌐 Despliegue a Producción

### Recomendaciones

#### Frontend
- **Vercel** (Recomendado)
  - Deploy automático desde GitHub
  - Gratis para proyectos personales
  - CDN global

#### Backend
- **Railway** (Recomendado)
  - $5/mes
  - PostgreSQL incluido
  - Deploy desde GitHub

#### Base de Datos
- **Supabase** (Actual)
  - Gratis hasta 500MB
  - Backups automáticos

---

## 📞 Soporte

Si encuentras problemas:

1. Revisa los logs del backend y frontend
2. Verifica que todos los servicios estén corriendo
3. Verifica las variables de entorno
4. Consulta la documentación en `IMPLEMENTATION_GUIDE.md`

---

**Última actualización**: 2025-10-08 08:31
**Estado**: ✅ Sistema funcional en desarrollo
