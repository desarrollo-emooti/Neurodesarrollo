# EMOOTI - Sistema de Gestión del Neurodesarrollo Infantil

## 📋 Descripción

EMOOTI es una plataforma web integral para la gestión, evaluación y seguimiento del neurodesarrollo infantil en España. Diseñada para centros educativos, clínicas especializadas, orientadores, examinadores y familias.

## 🎯 Características Principales

- **Gestión Completa de Usuarios**: Administradores, clínicas, orientadores, examinadores y familias
- **Evaluaciones Psicopedagógicas**: Stap2Go, Raven's 2, pruebas EMOOTI personalizadas
- **Seguimiento del Progreso**: Historial completo y comparación de evaluaciones
- **Cumplimiento RGPD**: Seguridad y privacidad garantizadas para datos de menores
- **Facturación Integrada**: Suscripciones B2B/B2B2C con Stripe
- **Reportes Clínicos**: Generación automática de informes profesionales

## 🛠️ Stack Tecnológico

### Frontend
- **React 18.2** con Vite
- **Tailwind CSS 3.x** para estilos
- **shadcn/ui** para componentes
- **Framer Motion** para animaciones
- **React Router DOM** para navegación

### Backend
- **Base44** (Backend-as-a-Service)
- **Deno 1.x** con Deno Deploy
- **PostgreSQL** (gestionada por Base44)

### Integraciones
- **Google OAuth** para autenticación
- **Stripe** para pagos
- **Signaturit** para firmas electrónicas
- **InvokeLLM** para procesamiento de PDFs

## 🚀 Instalación y Desarrollo

### Prerrequisitos
- Node.js 18+
- npm 8+

### Instalación
```bash
# Clonar el repositorio
git clone [URL_DEL_REPOSITORIO]
cd emooti-neurodesarrollo

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales

# Iniciar servidor de desarrollo
npm run dev
```

### Scripts Disponibles
```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run preview      # Preview del build
npm run lint         # Linter
```

## 📁 Estructura del Proyecto

```
EMOOTI/
├── entities/              # JSON Schemas de entidades
├── pages/                 # Componentes de página
├── components/            # Componentes reutilizables
│   ├── ui/               # Componentes shadcn/ui
│   ├── dashboard/        # Dashboards por rol
│   ├── users/            # Gestión de usuarios
│   ├── tests/            # Componentes de pruebas
│   └── ...
├── functions/             # Backend functions (Deno)
├── utils/                 # Utilidades compartidas
├── lib/                   # Librerías y configuraciones
└── Layout.js              # Layout principal
```

## 👥 Roles y Permisos

### Administrador
- Acceso completo al sistema
- Gestión de usuarios, alumnos y centros
- Configuración del sistema
- Acceso a logs de auditoría

### Clínica
- Gestión de evaluaciones
- Validación de resultados
- Generación de informes
- Acceso a estadísticas

### Orientador
- Gestión de alumnos del centro
- Aprobación de eventos
- Acceso a informes del centro

### Examinador
- Aplicación de pruebas
- Registro de resultados
- Acceso a tutoriales

### Familia
- Visualización de informes
- Seguimiento del progreso
- Descarga de documentos

## 🔒 Seguridad y Cumplimiento

- **RGPD/LOPD-GDD**: Cumplimiento total con normativa española
- **Auditoría Completa**: Logs inmutables de todas las acciones
- **Detección de Anomalías**: Sistema automático de alertas
- **Pseudonimización**: Para investigación y análisis
- **Cifrado**: Datos en tránsito y reposo

## 📊 Entidades Principales

- **User**: Usuarios del sistema
- **Student**: Alumnos evaluados
- **Center**: Centros educativos
- **TestAssignment**: Asignación de pruebas
- **TestResult**: Resultados de evaluaciones
- **EmotiTest**: Configuración de pruebas EMOOTI
- **AuditLog**: Logs de auditoría

## 🎨 Diseño

- **Clean & Modern**: Interfaz limpia y profesional
- **Mobile First**: Responsive desde 320px
- **Accesible**: WCAG 2.1 AA compliance
- **Gradientes**: Azul/verde para identidad visual
- **Animaciones**: Transiciones suaves con Framer Motion

## 📈 Roadmap

### Fase 1: Setup Inicial ✅
- [x] Estructura base del proyecto
- [x] Entidades core
- [x] Layout y navegación
- [x] Dashboards por rol

### Fase 2: Gestión de Usuarios (En desarrollo)
- [ ] CRUD completo de usuarios
- [ ] Importación/exportación
- [ ] Gestión de permisos

### Fase 3: Evaluaciones
- [ ] Asignación de pruebas
- [ ] Formularios EMOOTI
- [ ] Importación de resultados

### Fase 4: Reportes y Análisis
- [ ] Generación de informes
- [ ] Estadísticas avanzadas
- [ ] Comparación de pruebas

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es privado y confidencial. Todos los derechos reservados.

## 📞 Soporte

Para soporte técnico o consultas:
- Email: soporte@emooti.com
- Documentación: [docs.emooti.com](https://docs.emooti.com)

---

**EMOOTI** - Transformando la evaluación del neurodesarrollo infantil en España 🇪🇸

