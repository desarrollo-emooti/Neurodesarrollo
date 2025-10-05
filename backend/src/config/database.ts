import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

// Create Prisma Client with lazy connection
export const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'event',
      level: 'error',
    },
    {
      emit: 'event',
      level: 'info',
    },
    {
      emit: 'event',
      level: 'warn',
    },
  ],
  // Don't connect automatically
  // Connection will happen on first query
});

// Only setup event listeners after trying to use the client
let listenersSetup = false;

function setupListeners() {
  if (listenersSetup) return;
  listenersSetup = true;

  // Log database queries in development
  if (process.env['NODE_ENV'] === 'development') {
    prisma.$on('query', (e: any) => {
      logger.debug('Query: ' + e.query);
      logger.debug('Params: ' + e.params);
      logger.debug('Duration: ' + e.duration + 'ms');
    });
  }

  // Log database errors
  prisma.$on('error', (e: any) => {
    logger.error('Database error:', e);
  });

  // Log database info
  prisma.$on('info', (e: any) => {
    logger.info('Database info:', e.message);
  });

  // Log database warnings
  prisma.$on('warn', (e: any) => {
    logger.warn('Database warning:', e.message);
  });
}

export async function connectDatabase(): Promise<void> {
  try {
    setupListeners();

    // Set a timeout for the connection attempt
    const connectPromise = prisma.$connect();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Connection timeout after 5 seconds')), 5000)
    );

    await Promise.race([connectPromise, timeoutPromise]);
    logger.info('✅ Database connected successfully');
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    logger.warn('⚠️  Server will start without database connection. Some features may not work.');
    // Don't throw - allow server to start without DB connection
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    logger.info('✅ Database disconnected successfully');
  } catch (error) {
    logger.error('❌ Database disconnection failed:', error);
    throw error;
  }
}

// Health check for database
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error('Database health check failed:', error);
    return false;
  }
}
