import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

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
import configurationRoutes from './routes/configuration';
import authorizationRoutes from './routes/authorizations';
import exportRoutes from './routes/export';
import importRoutes from './routes/import';
import tutorialRoutes from './routes/tutorials';
import reportRoutes from './routes/reports';
import statisticsRoutes from './routes/statistics';
import databaseRoutes from './routes/database';
import profileRoutes from './routes/profile';
import publicRoutes from './routes/public';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { auditLogger } from './middleware/auditLogger';
import { anomalyDetection } from './middleware/anomalyDetection';

// Import database
import { prisma } from './config/database';

// Import logger
import { logger } from './utils/logger';

const app = express();
const PORT = process.env.PORT || 3000;
const API_VERSION = 'v1';

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(morgan('combined'));

// Audit logging middleware
app.use(auditLogger);

// Anomaly detection middleware
app.use(anomalyDetection);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
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
app.use(`/api/${API_VERSION}/configuration`, configurationRoutes);
app.use(`/api/${API_VERSION}/authorizations`, authorizationRoutes);
app.use(`/api/${API_VERSION}/export`, exportRoutes);
app.use(`/api/${API_VERSION}/import`, importRoutes);
app.use(`/api/${API_VERSION}/tutorials`, tutorialRoutes);
app.use(`/api/${API_VERSION}/reports`, reportRoutes);
app.use(`/api/${API_VERSION}/statistics`, statisticsRoutes);
app.use(`/api/${API_VERSION}/database`, databaseRoutes);
app.use(`/api/${API_VERSION}/profile`, profileRoutes);
app.use(`/api/${API_VERSION}/public`, publicRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found',
    },
    timestamp: new Date().toISOString(),
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`API Version: ${API_VERSION}`);
});

export default app;