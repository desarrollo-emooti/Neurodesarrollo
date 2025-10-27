# 🗄️ Database Backup Guide

Este documento explica cómo configurar y usar el sistema de backup automático de la base de datos.

## 📋 Características

- Backup automático de PostgreSQL con `pg_dump`
- Compresión gzip para ahorrar espacio
- Rotación automática (retención configurable)
- Upload opcional a AWS S3
- Scripts de restore incluidos
- Automatización con cron (Linux/Mac) o Task Scheduler (Windows)

## 🔧 Configuración

### Variables de Entorno

Añadir en `backend/.env`:

```bash
# Database Backup Configuration
BACKUP_DIR=./backups
BACKUP_RETENTION_DAYS=30

# AWS S3 (opcional - para backup en cloud)
# AWS_S3_BUCKET=emooti-backups
# AWS_ACCESS_KEY_ID=your_access_key
# AWS_SECRET_ACCESS_KEY=your_secret_key
```

### Requisitos

- `pg_dump` (incluido con PostgreSQL)
- `gzip` (pre-instalado en Linux/Mac)
- `aws` CLI (opcional, solo para S3)

## 🚀 Uso Manual

### Crear Backup

```bash
cd backend/scripts
chmod +x backup-database.sh
./backup-database.sh
```

El backup se guardará en `backend/backups/emooti_backup_YYYYMMDD_HHMMSS.sql.gz`

### Restaurar Backup

```bash
cd backend/scripts
chmod +x restore-database.sh
./restore-database.sh ../backups/emooti_backup_20251027_120000.sql.gz
```

⚠️ **ADVERTENCIA**: Esto reemplazará todos los datos en la base de datos actual.

## ⏰ Automatización

### Linux/Mac (Cron)

1. **Editar crontab**:
   ```bash
   crontab -e
   ```

2. **Añadir línea para backup diario a las 3 AM**:
   ```bash
   0 3 * * * cd /path/to/backend/scripts && ./backup-database.sh >> /path/to/backend/logs/backup.log 2>&1
   ```

3. **Ejemplos de frecuencia**:
   ```bash
   # Cada 6 horas
   0 */6 * * * cd /path/to/backend/scripts && ./backup-database.sh

   # Cada día a las 2 AM
   0 2 * * * cd /path/to/backend/scripts && ./backup-database.sh

   # Cada domingo a las 1 AM
   0 1 * * 0 cd /path/to/backend/scripts && ./backup-database.sh

   # Cada hora
   0 * * * * cd /path/to/backend/scripts && ./backup-database.sh
   ```

### Windows (Task Scheduler)

1. **Abrir Task Scheduler** (Programador de tareas)

2. **Crear tarea básica**:
   - Nombre: "EMOOTI Database Backup"
   - Trigger: Diariamente a las 3:00 AM
   - Action: Iniciar programa
   - Program: `C:\Program Files\Git\bin\bash.exe`
   - Arguments: `C:\path\to\backend\scripts\backup-database.sh`
   - Start in: `C:\path\to\backend\scripts`

3. **Configuración avanzada**:
   - Ejecutar aunque el usuario no esté conectado
   - Ejecutar con privilegios más altos (si es necesario)
   - Si falla, reintentar cada 10 minutos hasta 3 veces

### Docker/Railway/Vercel

#### Railway

1. **Instalar Railway CLI**:
   ```bash
   npm install -g @railway/cli
   ```

2. **Configurar backup con Railway Cron**:

   Crear `railway.json`:
   ```json
   {
     "crons": [
       {
         "command": "cd backend/scripts && ./backup-database.sh",
         "schedule": "0 3 * * *"
       }
     ]
   }
   ```

#### Docker

Añadir en `docker-compose.yml`:

```yaml
services:
  backup:
    image: postgres:15
    depends_on:
      - postgres
    environment:
      - DATABASE_URL=${DATABASE_URL}
    volumes:
      - ./backend/scripts:/scripts
      - ./backend/backups:/backups
    command: >
      sh -c "
      apk add --no-cache bash gzip &&
      echo '0 3 * * * cd /scripts && ./backup-database.sh' | crontab - &&
      crond -f
      "
```

## ☁️ Backup en AWS S3

### Setup

1. **Instalar AWS CLI**:
   ```bash
   # Linux
   curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
   unzip awscliv2.zip
   sudo ./aws/install

   # Mac
   brew install awscli

   # Windows
   # Descargar desde: https://aws.amazon.com/cli/
   ```

2. **Configurar credenciales**:
   ```bash
   aws configure
   # AWS Access Key ID: tu_access_key
   # AWS Secret Access Key: tu_secret_key
   # Default region: eu-west-1
   # Default output format: json
   ```

3. **Crear bucket S3**:
   ```bash
   aws s3 mb s3://emooti-backups --region eu-west-1
   ```

4. **Configurar lifecycle policy** (opcional, para borrar backups antiguos):
   ```bash
   aws s3api put-bucket-lifecycle-configuration --bucket emooti-backups --lifecycle-configuration file://lifecycle.json
   ```

   `lifecycle.json`:
   ```json
   {
     "Rules": [
       {
         "Id": "Delete old backups",
         "Status": "Enabled",
         "Prefix": "database-backups/",
         "Expiration": {
           "Days": 90
         }
       }
     ]
   }
   ```

### Uso

Una vez configurado, los backups se subirán automáticamente a S3:

```bash
./backup-database.sh
# ✓ Backup created successfully
# ✓ Backup uploaded to S3
```

## 📊 Monitoring

### Ver logs de backup

```bash
# Linux/Mac
tail -f /path/to/backend/logs/backup.log

# Ver últimos backups
ls -lh backend/backups/
```

### Verificar integridad de backup

```bash
# Verificar que el archivo gzip no está corrupto
gunzip -t backend/backups/emooti_backup_20251027_120000.sql.gz

# Ver contenido del backup
gunzip -c backend/backups/emooti_backup_20251027_120000.sql.gz | less
```

### Alertas de backup

#### Opción 1: Email con cron

Cron envía emails automáticamente si hay errores. Configurar en `/etc/aliases`:

```bash
MAILTO=admin@emooti.com
0 3 * * * cd /path/to/backend/scripts && ./backup-database.sh
```

#### Opción 2: Healthchecks.io

1. Crear cuenta en https://healthchecks.io
2. Crear nuevo check con cron schedule
3. Copiar ping URL
4. Modificar script de backup para hacer ping al finalizar:

```bash
# Al final de backup-database.sh
curl -fsS --retry 3 https://hc-ping.com/your-uuid-here
```

## 🔄 Restore desde S3

```bash
# Descargar backup desde S3
aws s3 cp s3://emooti-backups/database-backups/emooti_backup_20251027_120000.sql.gz ./backups/

# Restaurar
./restore-database.sh ./backups/emooti_backup_20251027_120000.sql.gz
```

## 📝 NPM Scripts

Añadidos en `backend/package.json`:

```bash
# Crear backup manualmente
npm run backup

# Restaurar backup (requiere argumento)
npm run restore -- backups/emooti_backup_20251027_120000.sql.gz

# Ver backups disponibles
npm run backups:list
```

## 🎯 Mejores Prácticas

1. **Frecuencia**: Backup diario en producción mínimo
2. **Retención**: 30 días local, 90 días en S3
3. **Testing**: Probar restore mensualmente
4. **Monitoring**: Configurar alertas si backup falla
5. **Múltiples ubicaciones**: Local + S3 (redundancia)
6. **Seguridad**: Encriptar backups si contienen datos sensibles
7. **Documentación**: Mantener este documento actualizado

## ⚠️ Troubleshooting

### Error: pg_dump not found

Instalar PostgreSQL client:

```bash
# Ubuntu/Debian
sudo apt-get install postgresql-client

# Mac
brew install postgresql

# Windows
# Descargar desde: https://www.postgresql.org/download/windows/
```

### Error: Permission denied

```bash
chmod +x backend/scripts/backup-database.sh
chmod +x backend/scripts/restore-database.sh
```

### Error: AWS CLI not found

Instalar AWS CLI siguiendo las instrucciones en la sección "Backup en AWS S3".

### Error: No space left on device

Limpiar backups antiguos manualmente:

```bash
# Eliminar backups con más de 30 días
find backend/backups -name "*.sql.gz" -mtime +30 -delete
```

## 📊 Estimación de Tamaño

| Datos | Sin comprimir | Comprimido (gzip) |
|-------|---------------|-------------------|
| 1000 usuarios | ~2 MB | ~400 KB |
| 10000 alumnos | ~5 MB | ~1 MB |
| 100000 tests | ~20 MB | ~4 MB |
| **Total típico** | ~50 MB | ~10 MB |

Con retención de 30 días: ~300 MB de almacenamiento.

## 🔒 Seguridad

### Encriptar backups (opcional)

```bash
# Backup con encriptación GPG
pg_dump "${DATABASE_URL}" | gzip | gpg --symmetric --cipher-algo AES256 > backup.sql.gz.gpg

# Restore
gpg --decrypt backup.sql.gz.gpg | gunzip | psql "${DATABASE_URL}"
```

### Permisos recomendados

```bash
chmod 700 backend/scripts/backup-database.sh
chmod 700 backend/scripts/restore-database.sh
chmod 700 backend/backups
```

## 📚 Referencias

- [PostgreSQL pg_dump Documentation](https://www.postgresql.org/docs/current/app-pgdump.html)
- [AWS S3 CLI Documentation](https://docs.aws.amazon.com/cli/latest/reference/s3/)
- [Cron Syntax](https://crontab.guru/)
