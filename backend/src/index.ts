import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import passport from './config/passport';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import studentRoutes from './routes/students';
import centerRoutes from './routes/centers';
import testAssignmentRoutes from './routes/testAssignments';
import testResultRoutes from './routes/testResults';
import emotiTestRoutes from './routes/emotiTests';
import agendaRoutes from './routes/agenda';
import deviceRoutes from './routes/devices';
import inventoryRoutes from './routes/inventory';
import subscriptionRoutes from './routes/subscriptions';
import invoiceRoutes from './routes/invoices';
import securityRoutes from './routes/security';
import rgpdRoutes from './routes/rgpd';
import configurationRoutes from './routes/configuration';
import statisticsRoutes from './routes/statistics';
import profileRoutes from './routes/profile';
import publicRoutes from './routes/public';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { auditLogger } from './middleware/auditLogger';
import { anomalyDetection } from './middleware/anomalyDetection';
import { apiLimiter, publicLimiter } from './middleware/rateLimiter';

// Import services
import { logger } from './utils/logger';
import { connectDatabase } from './config/database';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env['PORT'] || 3000;
const API_VERSION = process.env['API_VERSION'] || 'v1';

// Initialize Prisma Client
export const prisma = new PrismaClient({
  log: process.env['NODE_ENV'] === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

// HTTPS redirect middleware (only in production)
if (process.env['NODE_ENV'] === 'production') {
  app.use((req, res, next) => {
    // Check if request is over HTTPS
    const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';

    if (!isSecure) {
      logger.warn(`Redirecting HTTP request to HTTPS: ${req.url}`);
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }

    next();
  });

  logger.info('✅ HTTPS redirect middleware enabled for production');
}

// Security middleware with enhanced HSTS
app.use(helmet({
  hsts: process.env['NODE_ENV'] === 'production' ? {
    maxAge: 31536000, // 1 year in seconds
    includeSubDomains: true,
    preload: true,
  } : false, // Disable HSTS in development
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.qrserver.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
const allowedOrigins = process.env['NODE_ENV'] === 'production'
  ? [process.env['CORS_ORIGIN'] || 'http://localhost:5173']
  : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Apply general API rate limiting to all routes (except /health)
// More lenient in development, stricter in production
if (process.env['NODE_ENV'] !== 'development') {
  logger.info('Rate limiting enabled for production environment');
  app.use('/api', apiLimiter);
} else {
  logger.info('Rate limiting disabled for development environment');
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Initialize Passport
app.use(passport.initialize());

// Logging middleware
app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim()),
  },
}));

// Custom middleware
app.use(auditLogger as any);
app.use(anomalyDetection as any);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env['npm_package_version'] || '1.0.0',
      environment: process.env['NODE_ENV'] || 'development',
    },
  });
});

// API routes
app.use(`/api/${API_VERSION}/auth`, authRoutes);
app.use(`/api/${API_VERSION}/users`, userRoutes);
app.use(`/api/${API_VERSION}/students`, studentRoutes);
app.use(`/api/${API_VERSION}/centers`, centerRoutes);
app.use(`/api/${API_VERSION}/test-assignments`, testAssignmentRoutes);
app.use(`/api/${API_VERSION}/test-results`, testResultRoutes);
app.use(`/api/${API_VERSION}/emoti-tests`, emotiTestRoutes);
app.use(`/api/${API_VERSION}/agenda`, agendaRoutes);
app.use(`/api/${API_VERSION}/devices`, deviceRoutes);
app.use(`/api/${API_VERSION}/inventory`, inventoryRoutes);
app.use(`/api/${API_VERSION}/subscriptions`, subscriptionRoutes);
app.use(`/api/${API_VERSION}/invoices`, invoiceRoutes);
    app.use(`/api/${API_VERSION}/security`, securityRoutes);
    app.use(`/api/${API_VERSION}/rgpd`, rgpdRoutes);
app.use(`/api/${API_VERSION}/configuration`, configurationRoutes);
app.use(`/api/${API_VERSION}/statistics`, statisticsRoutes);
app.use(`/api/${API_VERSION}/profile`, profileRoutes);

// Public test endpoint (no authentication required) - Apply stricter rate limiting
app.use('/api/public', publicLimiter, publicRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.originalUrl} not found`,
    },
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

// Start server
async function startServer() {
  try {
    // Connect to database
    await connectDatabase();
    
    // Start listening
    app.listen(PORT, () => {
      logger.info(`🚀 EMOOTI Backend API server running on port ${PORT}`);
      logger.info(`📊 Environment: ${process.env['NODE_ENV'] || 'development'}`);
      logger.info(`🔗 API Version: ${API_VERSION}`);
      logger.info(`🌐 CORS Origin: ${process.env['CORS_ORIGIN'] || 'http://localhost:5173'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start the server
startServer();

export default app;




