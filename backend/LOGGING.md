# 📋 Centralized Logging Configuration

Este documento explica cómo configurar el sistema de logging centralizado de EMOOTI Backend.

## 📊 Características

- **Rotación automática de logs** con `winston-daily-rotate-file`
- **Formateo estructurado** (JSON) para producción
- **Formateo human-readable** para desarrollo
- **Múltiples transports**:
  - Console (siempre activo)
  - Archivos locales con rotación (siempre activo)
  - Papertrail vía Syslog (opcional, producción)
  - Better Stack / Logtail (opcional, producción)
- **Logs separados por tipo**:
  - `error-*.log` - Solo errores (30 días)
  - `combined-*.log` - Todos los logs (14 días)
  - `http-*.log` - Requests HTTP (7 días)
  - `exceptions-*.log` - Excepciones no capturadas (30 días)
  - `rejections-*.log` - Promise rejections (30 días)

## 🔧 Configuración Local (Desarrollo)

Por defecto, en desarrollo se usan archivos locales y console:

```bash
# .env
NODE_ENV=development
LOG_LEVEL=debug  # Opcional: debug | info | warn | error
```

Los logs se guardan en `backend/logs/` y se rotan diariamente.

## ☁️ Opción 1: Papertrail (Recomendado)

Papertrail es un SaaS simple y tiene plan gratuito.

### Setup:

1. **Crear cuenta en Papertrail**
   - Ir a https://papertrailapp.com
   - Crear cuenta gratuita (100 MB/mes gratis)

2. **Obtener credenciales**
   - Dashboard → Settings → Log Destinations
   - Copiar el **Host** (ej: `logs7.papertrailapp.com`)
   - Copiar el **Port** (ej: `12345`)

3. **Configurar variables de entorno**
   ```bash
   # .env (producción)
   NODE_ENV=production
   LOG_LEVEL=warn
   LOG_SERVICE=papertrail
   PAPERTRAIL_HOST=logs7.papertrailapp.com
   PAPERTRAIL_PORT=12345
   APP_NAME=emooti-backend
   ```

4. **Verificar en Papertrail**
   - Ir a Events → Live Tail
   - Deberías ver logs en tiempo real

### Ventajas:
- ✅ Gratis hasta 100 MB/mes
- ✅ Setup muy simple (2 variables)
- ✅ UI intuitiva con búsqueda
- ✅ Alertas por email
- ✅ Retención de 7 días (plan gratuito)

### Búsqueda en Papertrail:
```
# Por nivel de log
level:error

# Por servicio
service:emooti-backend

# Por mensaje
"Authentication failed"

# Combinado
level:error AND "database"
```

## ☁️ Opción 2: Better Stack (Antes Logtail)

Better Stack es moderno y tiene buen UI.

### Setup:

1. **Crear cuenta en Better Stack**
   - Ir a https://betterstack.com
   - Crear cuenta gratuita (1 GB/mes gratis)

2. **Crear Source**
   - Dashboard → Sources → Add Source
   - Seleccionar "Node.js / Winston"
   - Copiar el **Source Token**

3. **Configurar variables de entorno**
   ```bash
   # .env (producción)
   NODE_ENV=production
   LOG_LEVEL=warn
   LOG_SERVICE=betterstack
   BETTERSTACK_SOURCE_TOKEN=your_token_here
   APP_NAME=emooti-backend
   ```

4. **Verificar en Better Stack**
   - Ir a Live tail
   - Deberías ver logs en tiempo real

### Ventajas:
- ✅ Gratis hasta 1 GB/mes
- ✅ UI moderna y rápida
- ✅ Búsqueda avanzada
- ✅ Dashboards personalizables
- ✅ Retención de 7 días (plan gratuito)
- ✅ Integración con alertas

### Búsqueda en Better Stack:
```json
{
  "level": "error",
  "service": "emooti-backend"
}
```

## ☁️ Opción 3: AWS CloudWatch (Si usan AWS)

Si el backend está en AWS (EC2, ECS, Lambda), CloudWatch es la opción natural.

### Setup:

1. **Instalar transport de CloudWatch**
   ```bash
   npm install winston-cloudwatch
   ```

2. **Configurar IAM permissions**
   - Dar permisos `logs:CreateLogGroup`, `logs:CreateLogStream`, `logs:PutLogEvents`

3. **Añadir transport en `logger.ts`**
   ```typescript
   import CloudWatchTransport from 'winston-cloudwatch';

   if (isProduction && process.env['LOG_SERVICE'] === 'cloudwatch') {
     transports.push(
       new CloudWatchTransport({
         logGroupName: process.env['CLOUDWATCH_GROUP'] || '/emooti/backend',
         logStreamName: () => {
           const date = new Date().toISOString().split('T')[0];
           return `${date}-${process.env['INSTANCE_ID'] || 'instance'}`;
         },
         awsRegion: process.env['AWS_REGION'] || 'eu-west-1',
         jsonMessage: true,
       })
     );
   }
   ```

4. **Variables de entorno**
   ```bash
   NODE_ENV=production
   LOG_SERVICE=cloudwatch
   CLOUDWATCH_GROUP=/emooti/backend
   AWS_REGION=eu-west-1
   ```

### Ventajas:
- ✅ Integración nativa con AWS
- ✅ Sin límites si ya estás en AWS
- ✅ Retención configurable
- ✅ Logs Insights para queries SQL-like

## 📝 Variables de Entorno

```bash
# Configuración general
NODE_ENV=production                # development | production
LOG_LEVEL=warn                     # debug | info | warn | error
LOG_SERVICE=local                  # local | papertrail | betterstack | cloudwatch
APP_NAME=emooti-backend            # Nombre del servicio

# Papertrail (si LOG_SERVICE=papertrail)
PAPERTRAIL_HOST=logs7.papertrailapp.com
PAPERTRAIL_PORT=12345

# Better Stack (si LOG_SERVICE=betterstack)
BETTERSTACK_SOURCE_TOKEN=your_token_here

# CloudWatch (si LOG_SERVICE=cloudwatch)
CLOUDWATCH_GROUP=/emooti/backend
AWS_REGION=eu-west-1
```

## 🚀 Uso en Código

### Logging básico:
```typescript
import { logger } from './utils/logger';

logger.info('Usuario creado', { userId: user.id });
logger.warn('Token expirado', { userId: user.id });
logger.error('Error en base de datos', { error: err.message });
logger.debug('Query ejecutada', { sql: query });
```

### Logging con contexto estructurado:
```typescript
import { logWithContext, logError } from './utils/logger';

logWithContext('info', 'Pago procesado', {
  userId: user.id,
  amount: 99.99,
  currency: 'EUR',
  transactionId: '123456',
});

try {
  await processPayment();
} catch (error) {
  logError('Error procesando pago', error, {
    userId: user.id,
    amount: 99.99,
  });
}
```

### Logging HTTP:
```typescript
import { logHttp } from './utils/logger';

logHttp('POST', '/api/v1/users', 201, 45, user.id);
// Logs: method, url, statusCode, responseTime (ms), userId
```

## 📊 Rotación de Archivos Locales

Los logs se rotan automáticamente:

| Archivo | Retención | Max Size | Compresión |
|---------|-----------|----------|------------|
| `error-*.log` | 30 días | 20 MB | ✅ Gzip |
| `combined-*.log` | 14 días | 20 MB | ✅ Gzip |
| `http-*.log` | 7 días | 20 MB | ✅ Gzip |
| `exceptions-*.log` | 30 días | 20 MB | ✅ Gzip |
| `rejections-*.log` | 30 días | 20 MB | ✅ Gzip |

Los archivos antiguos se comprimen con gzip automáticamente.

## 🔍 Búsqueda de Logs

### Logs locales (jq):
```bash
# Últimos 10 errores
cat logs/error-2025-10-27.log | jq 'select(.level == "error")' | tail -n 10

# Errores de un usuario específico
cat logs/combined-2025-10-27.log | jq 'select(.metadata.userId == "user-123")'

# Requests HTTP lentos (>1000ms)
cat logs/http-2025-10-27.log | jq 'select(.metadata.responseTime > 1000)'
```

### Papertrail:
```
level:error AND service:emooti-backend
```

### Better Stack:
```json
{
  "level": "error",
  "metadata.userId": "user-123"
}
```

## 🚨 Alertas

### Papertrail:
1. Dashboard → Alerts
2. New Search Alert
3. Configurar búsqueda (ej: `level:error`)
4. Email o Slack

### Better Stack:
1. Dashboard → Alerts
2. New Alert
3. Configurar condición
4. Email, Slack, PagerDuty, etc.

## 🎯 Mejores Prácticas

1. **Usa niveles apropiados**:
   - `error`: Errores críticos que requieren atención
   - `warn`: Warnings que no rompen funcionalidad
   - `info`: Eventos importantes del sistema
   - `http`: Requests HTTP
   - `debug`: Información de debugging (solo dev)

2. **Añade contexto estructurado**:
   ```typescript
   // ❌ No hacer
   logger.info('Usuario creado');

   // ✅ Hacer
   logger.info('Usuario creado', { userId: user.id, email: user.email });
   ```

3. **No loguees datos sensibles**:
   - ❌ Passwords
   - ❌ Tokens completos
   - ❌ Números de tarjeta de crédito
   - ❌ Información personal sensible

4. **Usa log levels en producción**:
   ```bash
   # Producción: solo warn y error
   LOG_LEVEL=warn

   # Desarrollo: todo
   LOG_LEVEL=debug
   ```

## 📦 Costos Estimados

| Servicio | Plan Gratuito | Costo Pro |
|----------|---------------|-----------|
| **Papertrail** | 100 MB/mes (7 días) | $7/mes → 1 GB |
| **Better Stack** | 1 GB/mes (7 días) | $10/mes → 15 GB |
| **CloudWatch** | 5 GB/mes gratis | $0.50 per GB |

Para EMOOTI backend (estimado):
- **Desarrollo**: Archivos locales (gratis)
- **Producción pequeña** (<100 requests/día): Plan gratuito Papertrail
- **Producción media** (100-1000 requests/día): Better Stack $10/mes
- **Producción grande** (>1000 requests/día): CloudWatch o Better Stack Pro

## 📚 Referencias

- [Winston Documentation](https://github.com/winstonjs/winston)
- [Papertrail](https://papertrailapp.com)
- [Better Stack](https://betterstack.com)
- [AWS CloudWatch Logs](https://aws.amazon.com/cloudwatch/)
