# EMOOTI - Guía de Deployment

## 🚀 Deployment Completo en AWS

Esta guía te llevará paso a paso para desplegar EMOOTI en AWS usando Terraform, ECS, RDS PostgreSQL y otros servicios.

## 📋 Prerrequisitos

### 1. Herramientas Necesarias
- **AWS CLI** v2.x
- **Terraform** v1.0+
- **Node.js** v18+
- **npm** v9+
- **Docker** (para contenedores)
- **Git**

### 2. Cuenta AWS
- Cuenta AWS activa
- Permisos de administrador o roles IAM apropiados
- Región preferida: `eu-west-1` (Irlanda)

### 3. Configuración AWS CLI
```bash
aws configure
# AWS Access Key ID: [tu-access-key]
# AWS Secret Access Key: [tu-secret-key]
# Default region name: eu-west-1
# Default output format: json
```

## 🏗️ Infraestructura AWS

### 1. Configurar Variables de Terraform

```bash
cd infrastructure/terraform
cp terraform.tfvars.example terraform.tfvars
```

Edita `terraform.tfvars` con tus valores:

```hcl
# AWS Configuration
aws_region     = "eu-west-1"
aws_account_id = "123456789012"  # Tu AWS Account ID

# Database Configuration
database_name     = "emooti_db"
database_username = "emooti_user"
database_password = "tu_password_seguro_aqui"

# Security Configuration
jwt_secret = "tu_jwt_secret_super_seguro_minimo_32_caracteres"
```

### 2. Desplegar Infraestructura

```bash
# Hacer ejecutable el script
chmod +x infrastructure/scripts/deploy.sh

# Ejecutar deployment
./infrastructure/scripts/deploy.sh production
```

Este script:
- ✅ Inicializa Terraform
- ✅ Valida la configuración
- ✅ Planifica los recursos
- ✅ Despliega la infraestructura
- ✅ Guarda información de conexión

### 3. Recursos Creados

La infraestructura incluye:

- **VPC** con subnets públicas, privadas y de base de datos
- **RDS Aurora PostgreSQL** cluster con 2 instancias
- **ECS Fargate** cluster para la aplicación
- **Application Load Balancer** para tráfico HTTP/HTTPS
- **S3 Buckets** para archivos y backups
- **CloudWatch** para logging y monitoreo
- **Secrets Manager** para secretos
- **IAM Roles** y políticas de seguridad

## 🗄️ Configuración de Base de Datos

### 1. Configurar Variables de Entorno

```bash
cd backend
cp env.local .env
```

Edita `.env` con la información de conexión de AWS:

```env
# Database Configuration
DATABASE_URL="postgresql://emooti_user:tu_password@emooti-db.cluster-xyz.eu-west-1.rds.amazonaws.com:5432/emooti_db"

# JWT Configuration
JWT_SECRET="tu_jwt_secret_super_seguro"

# AWS Configuration
AWS_REGION=eu-west-1
AWS_S3_BUCKET=emooti-production-files
```

### 2. Configurar Base de Datos

```bash
# Instalar dependencias
npm install

# Generar cliente Prisma
npm run db:generate

# Ejecutar migraciones
npm run db:migrate:deploy

# Poblar base de datos
npm run db:seed
```

## 🐳 Containerización

### 1. Crear Dockerfile

```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copiar package files
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependencias
RUN npm ci --only=production

# Generar Prisma client
RUN npx prisma generate

# Copiar código fuente
COPY . .

# Compilar TypeScript
RUN npm run build

# Exponer puerto
EXPOSE 3000

# Comando de inicio
CMD ["npm", "start"]
```

### 2. Crear .dockerignore

```
node_modules
npm-debug.log
.env
.env.local
.env.production
dist
.git
.gitignore
README.md
Dockerfile
.dockerignore
```

## 🚀 Deployment en ECS

### 1. Crear ECR Repository

```bash
# Crear repositorio ECR
aws ecr create-repository --repository-name emooti-production-repo --region eu-west-1

# Obtener login token
aws ecr get-login-password --region eu-west-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.eu-west-1.amazonaws.com
```

### 2. Construir y Subir Imagen

```bash
# Construir imagen
docker build -t emooti-backend .

# Etiquetar imagen
docker tag emooti-backend:latest 123456789012.dkr.ecr.eu-west-1.amazonaws.com/emooti-production-repo:latest

# Subir imagen
docker push 123456789012.dkr.ecr.eu-west-1.amazonaws.com/emooti-production-repo:latest
```

### 3. Actualizar ECS Service

```bash
# Actualizar task definition
aws ecs update-service --cluster emooti-production-cluster --service emooti-production-service --force-new-deployment --region eu-west-1
```

## 🌐 Configuración de Dominio

### 1. Registrar Dominio

- Registrar dominio en Route 53 o proveedor externo
- Ejemplo: `emooti.com`

### 2. Configurar SSL/TLS

```bash
# Crear certificado SSL en ACM
aws acm request-certificate \
  --domain-name emooti.com \
  --subject-alternative-names www.emooti.com \
  --validation-method DNS \
  --region us-east-1
```

### 3. Configurar Route 53

```bash
# Crear hosted zone
aws route53 create-hosted-zone --name emooti.com --caller-reference $(date +%s)

# Crear registro A que apunte al ALB
aws route53 change-resource-record-sets --hosted-zone-id Z123456789 --change-batch file://dns-config.json
```

## 📊 Monitoreo y Logging

### 1. CloudWatch Dashboards

- **Métricas de aplicación**: CPU, memoria, requests
- **Métricas de base de datos**: conexiones, latencia, throughput
- **Métricas de ALB**: requests, errores, latencia

### 2. Alertas

```bash
# Crear alarmas CloudWatch
aws cloudwatch put-metric-alarm \
  --alarm-name "EMOOTI-High-CPU" \
  --alarm-description "High CPU usage" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold
```

### 3. Logs Centralizados

- **Application logs**: CloudWatch Logs
- **Access logs**: ALB logs en S3
- **Database logs**: RDS logs en CloudWatch

## 🔒 Seguridad

### 1. Network Security

- **VPC**: Red privada aislada
- **Security Groups**: Reglas de firewall específicas
- **NACLs**: Control de acceso a nivel de subnet

### 2. Data Security

- **Encryption at rest**: RDS, S3, EBS
- **Encryption in transit**: TLS/SSL en todas las comunicaciones
- **Secrets management**: AWS Secrets Manager

### 3. Access Control

- **IAM Roles**: Principio de menor privilegio
- **MFA**: Autenticación multifactor
- **Audit logging**: CloudTrail para auditoría

## 🔄 CI/CD Pipeline

### 1. GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: eu-west-1
      
      - name: Build and push Docker image
        run: |
          docker build -t emooti-backend .
          docker tag emooti-backend:latest $ECR_REGISTRY/emooti-production-repo:latest
          docker push $ECR_REGISTRY/emooti-production-repo:latest
      
      - name: Deploy to ECS
        run: |
          aws ecs update-service --cluster emooti-production-cluster --service emooti-production-service --force-new-deployment
```

### 2. Variables de Entorno en GitHub

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `ECR_REGISTRY`

## 🧪 Testing en Producción

### 1. Health Checks

```bash
# Verificar health endpoint
curl https://emooti.com/health

# Verificar base de datos
curl https://emooti.com/api/v1/health/db
```

### 2. Load Testing

```bash
# Usar Apache Bench
ab -n 1000 -c 10 https://emooti.com/api/v1/health

# Usar Artillery
artillery quick --count 100 --num 10 https://emooti.com/api/v1/health
```

## 📈 Escalabilidad

### 1. Auto Scaling

```bash
# Configurar auto scaling para ECS
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/emooti-production-cluster/emooti-production-service \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 2 \
  --max-capacity 10
```

### 2. Database Scaling

- **Read Replicas**: Para consultas de solo lectura
- **Aurora Serverless**: Para cargas variables
- **Connection Pooling**: PgBouncer o RDS Proxy

## 🗑️ Limpieza

### 1. Destruir Infraestructura

```bash
# ⚠️ CUIDADO: Esto elimina TODO
chmod +x infrastructure/scripts/destroy.sh
./infrastructure/scripts/destroy.sh production
```

### 2. Limpiar Recursos Manuales

- Eliminar imágenes ECR no utilizadas
- Limpiar logs antiguos en CloudWatch
- Eliminar snapshots de RDS antiguos

## 🆘 Troubleshooting

### 1. Problemas Comunes

**Error de conexión a base de datos:**
```bash
# Verificar security groups
aws ec2 describe-security-groups --group-ids sg-12345678

# Verificar conectividad
aws rds describe-db-clusters --db-cluster-identifier emooti-production-db-cluster
```

**Error de deployment en ECS:**
```bash
# Ver logs del servicio
aws logs describe-log-groups --log-group-name-prefix /ecs/emooti-production

# Ver eventos del servicio
aws ecs describe-services --cluster emooti-production-cluster --services emooti-production-service
```

### 2. Comandos Útiles

```bash
# Ver estado de la infraestructura
terraform show

# Ver outputs
terraform output

# Ver logs de la aplicación
aws logs tail /ecs/emooti-production --follow

# Conectar a base de datos
psql "postgresql://emooti_user:password@emooti-db.cluster-xyz.eu-west-1.rds.amazonaws.com:5432/emooti_db"
```

## 📞 Soporte

Para soporte técnico:
- **Email**: soporte@emooti.com
- **Documentación**: https://docs.emooti.com
- **Issues**: GitHub Issues

---

**¡EMOOTI está listo para producción! 🎉**
