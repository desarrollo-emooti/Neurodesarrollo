# 🏗️ Arquitectura EMOOTI - AWS Platform

## Visión General

EMOOTI es una plataforma web integral para la gestión, evaluación y seguimiento del neurodesarrollo infantil en España, diseñada para cumplir rigurosamente con RGPD y LOPD-GDD.

## Stack Tecnológico

### Frontend
- **Framework**: React 18.2+ con Vite
- **UI Components**: shadcn/ui (Radix UI + Tailwind CSS)
- **Styling**: Tailwind CSS 3.x
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Forms**: React Hook Form
- **Charts**: Recharts
- **Maps**: React Leaflet
- **Notifications**: Sonner
- **PDF Generation**: jsPDF
- **Rich Text**: React Quill
- **Drag & Drop**: @hello-pangea/dnd

### Backend
- **Runtime**: Node.js 18+ con TypeScript
- **Framework**: Express.js
- **ORM**: Prisma
- **Authentication**: Passport.js + Google OAuth 2.0
- **Validation**: Joi/Zod
- **File Upload**: Multer
- **PDF Processing**: PDF-lib
- **Email**: Nodemailer
- **Cron Jobs**: node-cron
- **Logging**: Winston
- **Security**: Helmet, CORS, Rate Limiting

### Base de Datos
- **Primary**: AWS RDS PostgreSQL 15+
- **Location**: EU (Ireland/Frankfurt)
- **Network**: VPC privada
- **Backup**: Automated daily backups
- **Encryption**: At rest and in transit
- **Monitoring**: CloudWatch

### Infrastructure (AWS)
- **Compute**: ECS Fargate
- **Load Balancer**: Application Load Balancer
- **Storage**: S3 (documents, backups)
- **CDN**: CloudFront
- **Monitoring**: CloudWatch + X-Ray
- **Secrets**: AWS Secrets Manager
- **SSL**: AWS Certificate Manager
- **DNS**: Route 53

### External Integrations
- **Payments**: Stripe
- **Digital Signatures**: Signaturit
- **QR Generation**: api.qrserver.com
- **AI/LLM**: OpenAI API
- **Email**: AWS SES
- **SMS**: AWS SNS

## Arquitectura de Seguridad

### RGPD/LOPD-GDD Compliance
- **Data Minimization**: Solo datos necesarios
- **Consent Management**: Consentimiento explícito parental
- **Right to Access**: Self-service para familias
- **Right to Rectification**: Edición controlada
- **Right to Erasure**: Eliminación segura con backups
- **Data Portability**: Exportación en formatos estándar
- **Audit Trail**: Logs inmutables con blockchain
- **Anomaly Detection**: Detección automática de accesos sospechosos
- **Data Retention**: Políticas automáticas de retención
- **Pseudonymization**: Para investigación
- **Anonymization**: Para datasets públicos

### Security Measures
- **Authentication**: OAuth 2.0 con Google
- **Authorization**: RBAC (Role-Based Access Control)
- **Encryption**: TLS 1.3, AES-256
- **Network**: VPC privada, Security Groups
- **Monitoring**: Real-time anomaly detection
- **Backups**: Encrypted, offsite, automated
- **Incident Response**: Automated alerts, 24h notification

## Estructura del Proyecto

```
emooti-aws-platform/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom hooks
│   │   ├── services/       # API services
│   │   ├── utils/          # Utilities
│   │   └── types/          # TypeScript types
│   ├── public/             # Static assets
│   └── package.json
├── backend/                 # Node.js API
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── services/       # Business logic
│   │   ├── models/         # Prisma models
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API routes
│   │   ├── utils/          # Utilities
│   │   └── types/          # TypeScript types
│   ├── prisma/             # Database schema & migrations
│   └── package.json
├── database/               # Database scripts
│   ├── migrations/         # SQL migrations
│   ├── seeds/             # Seed data
│   └── scripts/           # Database utilities
├── infrastructure/         # AWS infrastructure
│   ├── terraform/         # Infrastructure as Code
│   └── docker/            # Container definitions
├── docs/                  # Documentation
└── docker/                # Docker configurations
```

## Roles y Permisos

### 1. Administrador
- Acceso completo al sistema
- Gestión de usuarios, centros, configuraciones
- Acceso a logs de auditoría y seguridad
- Configuración de políticas RGPD

### 2. Clínica
- Gestión de alumnos de centros asignados
- Validación de resultados de pruebas
- Generación de informes clínicos
- Gestión de agenda de evaluaciones

### 3. Orientador
- Gestión de alumnos de su centro
- Aprobación de eventos de agenda
- Solicitud de evaluaciones
- Gestión de permisos parentales

### 4. Examinador
- Visualización de pruebas asignadas
- Registro de resultados
- Añadir observaciones
- Acceso a tutoriales

### 5. Familia
- Visualización de informes de sus hijos
- Historial de evaluaciones
- Descarga de documentos
- Gestión de autorizaciones

## API Design

### RESTful Endpoints
```
GET    /api/v1/users              # List users
POST   /api/v1/users              # Create user
GET    /api/v1/users/:id          # Get user
PUT    /api/v1/users/:id          # Update user
DELETE /api/v1/users/:id          # Delete user

GET    /api/v1/students           # List students
POST   /api/v1/students           # Create student
GET    /api/v1/students/:id       # Get student
PUT    /api/v1/students/:id       # Update student
DELETE /api/v1/students/:id       # Delete student

GET    /api/v1/centers            # List centers
POST   /api/v1/centers            # Create center
GET    /api/v1/centers/:id        # Get center
PUT    /api/v1/centers/:id        # Update center
DELETE /api/v1/centers/:id        # Delete center

GET    /api/v1/test-assignments   # List test assignments
POST   /api/v1/test-assignments   # Create test assignment
GET    /api/v1/test-assignments/:id # Get test assignment
PUT    /api/v1/test-assignments/:id # Update test assignment
DELETE /api/v1/test-assignments/:id # Delete test assignment

GET    /api/v1/test-results       # List test results
POST   /api/v1/test-results       # Create test result
GET    /api/v1/test-results/:id   # Get test result
PUT    /api/v1/test-results/:id   # Update test result
DELETE /api/v1/test-results/:id   # Delete test result

# Authentication
GET    /api/v1/auth/google        # Google OAuth
GET    /api/v1/auth/callback      # OAuth callback
POST   /api/v1/auth/logout        # Logout
GET    /api/v1/auth/me            # Get current user

# RGPD & Security
GET    /api/v1/audit-logs         # Get audit logs
GET    /api/v1/anomaly-alerts     # Get anomaly alerts
POST   /api/v1/data-export        # Export user data
DELETE /api/v1/data-erasure       # Request data erasure
```

### Response Format
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  },
  "timestamp": "2025-01-01T12:00:00Z"
}
```

### Error Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ]
  },
  "timestamp": "2025-01-01T12:00:00Z"
}
```

## Database Schema

### Core Entities
- **users**: System users (admin, clinica, orientador, examinador, familia)
- **students**: Students/children being evaluated
- **centers**: Educational centers
- **addresses**: Reusable address information
- **test_assignments**: Test assignments to students
- **test_results**: Test results and scores
- **emoti_tests**: EMOOTI test configurations
- **emoti_test_results**: EMOOTI test results
- **agenda_events**: Calendar events for evaluations
- **devices**: Tablets/iPads for testing
- **inventory_items**: Resource inventory
- **subscriptions**: Billing subscriptions
- **invoices**: Generated invoices
- **audit_logs**: Security audit trail
- **anomaly_alerts**: Security anomaly alerts

### RGPD Entities
- **retention_policies**: Data retention policies
- **data_retention_jobs**: Automated retention jobs
- **pseudonym_mappings**: Data pseudonymization
- **anonymization_logs**: Anonymization tracking
- **consent_records**: Parental consent records

## Deployment Strategy

### Development
- Local development with Docker Compose
- PostgreSQL container for local testing
- Hot reload for both frontend and backend

### Staging
- AWS ECS Fargate with single task
- RDS PostgreSQL (db.t3.micro)
- S3 bucket for file storage
- CloudFront for static assets

### Production
- AWS ECS Fargate with auto-scaling
- RDS PostgreSQL (db.r6g.large) with Multi-AZ
- S3 with versioning and lifecycle policies
- CloudFront with custom domain
- Application Load Balancer with SSL
- CloudWatch monitoring and alerting

## Monitoring & Observability

### Metrics
- Application performance (response times, error rates)
- Database performance (query times, connections)
- Infrastructure metrics (CPU, memory, disk)
- Business metrics (active users, tests completed)

### Logging
- Structured logging with Winston
- Centralized logging with CloudWatch
- Log aggregation and analysis
- Error tracking and alerting

### Alerting
- Real-time anomaly detection
- Performance degradation alerts
- Security incident alerts
- Infrastructure failure alerts

## Security Considerations

### Network Security
- VPC with private subnets
- Security groups with minimal access
- Network ACLs for additional protection
- VPN access for administrative tasks

### Application Security
- Input validation and sanitization
- SQL injection prevention (Prisma ORM)
- XSS protection
- CSRF protection
- Rate limiting
- Authentication and authorization

### Data Security
- Encryption at rest (RDS, S3)
- Encryption in transit (TLS 1.3)
- Secure key management (AWS Secrets Manager)
- Regular security audits
- Penetration testing

## Compliance & Legal

### RGPD Compliance
- Data Protection Impact Assessment (DPIA)
- Privacy by Design implementation
- Consent management system
- Data subject rights implementation
- Breach notification procedures
- Data Protection Officer (DPO) role

### LOPD-GDD Compliance
- Spanish data protection law compliance
- Minor data protection (under 14 years)
- Parental consent requirements
- Data retention policies
- Cross-border data transfer restrictions

## Performance Requirements

### Response Times
- API responses: < 200ms (95th percentile)
- Page load times: < 2s (95th percentile)
- Database queries: < 100ms (95th percentile)
- File uploads: < 5s for 10MB files

### Scalability
- Support for 10,000+ concurrent users
- Horizontal scaling with ECS auto-scaling
- Database read replicas for read-heavy workloads
- CDN for static asset delivery

### Availability
- 99.9% uptime SLA
- Multi-AZ deployment for high availability
- Automated failover procedures
- Disaster recovery plan

## Cost Optimization

### AWS Cost Management
- Right-sizing instances based on usage
- Reserved instances for predictable workloads
- S3 lifecycle policies for cost optimization
- CloudWatch cost monitoring and alerting

### Development Efficiency
- Infrastructure as Code (Terraform)
- Automated CI/CD pipelines
- Container-based deployment
- Environment parity (dev/staging/prod)

## Future Enhancements

### Phase 2 Features
- Mobile application (React Native)
- Advanced analytics and reporting
- Machine learning for test result analysis
- Integration with more external systems
- Multi-language support

### Technical Improvements
- Microservices architecture
- Event-driven architecture
- GraphQL API
- Real-time notifications (WebSockets)
- Advanced caching strategies
