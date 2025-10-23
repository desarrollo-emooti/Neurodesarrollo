import swaggerJsdoc from 'swagger-jsdoc';
import { version } from '../../package.json';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'EMOOTI Neurodesarrollo API',
      version,
      description: `
        API REST para la plataforma EMOOTI de evaluación del neurodesarrollo infantil.

        ## Autenticación
        La mayoría de los endpoints requieren autenticación mediante JWT.

        Para autenticarte:
        1. Usa el endpoint \`POST /api/v1/auth/login\` con tus credenciales
        2. Recibirás un token JWT en la respuesta
        3. Incluye el token en el header \`Authorization: Bearer <token>\` en tus requests

        ## Roles de Usuario
        - **ADMINISTRADOR**: Acceso completo al sistema
        - **CLINICA**: Gestión de centros, usuarios y evaluaciones
        - **ORIENTADOR**: Asignación y gestión de pruebas
        - **EXAMINADOR**: Realización de evaluaciones
        - **FAMILIA**: Visualización de resultados de hijos

        ## Rate Limiting
        La API incluye rate limiting para prevenir abuso:
        - Login: 5 requests/15min por IP
        - Auth refresh: 3 requests/hora por IP
        - API general: 100 requests/15min por usuario/IP
        - Endpoints públicos: 20 requests/15min por IP
      `,
      contact: {
        name: 'EMOOTI Hub SL',
        email: 'soporte@emooti.com',
        url: 'https://emooti.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor de desarrollo',
      },
      {
        url: 'https://api.emooti.com',
        description: 'Servidor de producción',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT obtenido del endpoint de login',
        },
      },
      schemas: {
        // Common schemas
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'VALIDATION_ERROR',
                },
                message: {
                  type: 'string',
                  example: 'Error de validación en los datos proporcionados',
                },
                details: {
                  type: 'array',
                  items: {
                    type: 'object',
                  },
                },
              },
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        // User schemas
        UserType: {
          type: 'string',
          enum: ['ADMINISTRADOR', 'CLINICA', 'ORIENTADOR', 'EXAMINADOR', 'FAMILIA'],
        },
        UserStatus: {
          type: 'string',
          enum: ['ACTIVE', 'INACTIVE', 'PENDING_INVITATION'],
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'cuid',
            },
            userType: {
              $ref: '#/components/schemas/UserType',
            },
            fullName: {
              type: 'string',
            },
            email: {
              type: 'string',
              format: 'email',
            },
            dni: {
              type: 'string',
              nullable: true,
            },
            phone: {
              type: 'string',
              nullable: true,
            },
            birthDate: {
              type: 'string',
              format: 'date',
              nullable: true,
            },
            nationality: {
              type: 'string',
              nullable: true,
            },
            address: {
              type: 'string',
              nullable: true,
            },
            country: {
              type: 'string',
              nullable: true,
            },
            autonomousCommunity: {
              type: 'string',
              nullable: true,
            },
            province: {
              type: 'string',
              nullable: true,
            },
            city: {
              type: 'string',
              nullable: true,
            },
            postalCode: {
              type: 'string',
              nullable: true,
            },
            status: {
              $ref: '#/components/schemas/UserStatus',
            },
            passwordSet: {
              type: 'boolean',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        // Student schemas
        Student: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'cuid',
            },
            firstName: {
              type: 'string',
            },
            lastName: {
              type: 'string',
            },
            birthDate: {
              type: 'string',
              format: 'date',
            },
            gender: {
              type: 'string',
              enum: ['Masculino', 'Femenino', 'Otro'],
            },
            course: {
              type: 'string',
            },
            group: {
              type: 'string',
            },
            observations: {
              type: 'string',
              nullable: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'Endpoints de autenticación y autorización',
      },
      {
        name: 'Users',
        description: 'Gestión de usuarios del sistema',
      },
      {
        name: 'Students',
        description: 'Gestión de estudiantes/alumnos',
      },
      {
        name: 'Centers',
        description: 'Gestión de centros educativos',
      },
      {
        name: 'Test Assignments',
        description: 'Asignación de pruebas a estudiantes',
      },
      {
        name: 'Test Results',
        description: 'Resultados de las pruebas realizadas',
      },
      {
        name: 'Emoti Tests',
        description: 'Catálogo de pruebas EMOOTI disponibles',
      },
      {
        name: 'Subscriptions',
        description: 'Gestión de suscripciones y planes',
      },
      {
        name: 'Invoices',
        description: 'Facturación y documentos fiscales',
      },
      {
        name: 'Statistics',
        description: 'Estadísticas y métricas del dashboard',
      },
      {
        name: 'Profile',
        description: 'Gestión de perfil de usuario',
      },
      {
        name: 'Security',
        description: 'Seguridad y RGPD',
      },
      {
        name: 'Configuration',
        description: 'Configuración del sistema',
      },
    ],
  },
  // Paths to files with JSDoc comments
  apis: [
    './src/routes/*.ts',
    './src/routes/*.js',
    './src/models/*.ts',
    './src/models/*.js',
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
