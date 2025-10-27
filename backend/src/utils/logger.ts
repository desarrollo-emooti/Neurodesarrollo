import winston from 'winston';
import path from 'path';
import fs from 'fs';
import DailyRotateFile from 'winston-daily-rotate-file';
const Syslog = require('winston-syslog').Syslog;
const LogtailTransport = require('@logtail/winston').LogtailTransport;

/**
 * Centralized Logging Configuration
 *
 * Supports multiple logging backends:
 * - Console (development)
 * - Local files with rotation (development & production)
 * - Papertrail via Syslog (production)
 * - Better Stack / Logtail (production)
 *
 * Environment Variables:
 * - LOG_LEVEL: debug | info | warn | error (default: debug in dev, warn in prod)
 * - LOG_SERVICE: papertrail | betterstack | local (default: local)
 * - PAPERTRAIL_HOST: Papertrail host (e.g., logs.papertrailapp.com)
 * - PAPERTRAIL_PORT: Papertrail port (e.g., 12345)
 * - BETTERSTACK_SOURCE_TOKEN: Better Stack source token
 */

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston that you want to link the colors
winston.addColors(colors);

// Environment config
const NODE_ENV = process.env['NODE_ENV'] || 'development';
const isDevelopment = NODE_ENV === 'development';
const isProduction = NODE_ENV === 'production';

// Determine log level
const getLogLevel = (): string => {
  const envLevel = process.env['LOG_LEVEL'];
  if (envLevel && levels[envLevel as keyof typeof levels] !== undefined) {
    return envLevel;
  }
  return isDevelopment ? 'debug' : 'warn';
};

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Structured format for production
const structuredFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.metadata({
    fillExcept: ['message', 'level', 'timestamp', 'label']
  }),
  winston.format.json()
);

// Human-readable format for development
const humanFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.errors({ stack: true }),
  winston.format.printf(
    (info) => {
      const { timestamp, level, message, stack, ...meta } = info;
      let log = `${timestamp} ${level}: ${message}`;

      // Add stack trace for errors
      if (stack) {
        log += `\n${stack}`;
      }

      // Add metadata if present
      if (Object.keys(meta).length > 0) {
        log += `\n${JSON.stringify(meta, null, 2)}`;
      }

      return log;
    }
  )
);

// Build transports array
const transports: winston.transport[] = [];

// 1. Console transport (always enabled)
transports.push(
  new winston.transports.Console({
    format: isDevelopment ? humanFormat : structuredFormat,
  })
);

// 2. Daily rotating file transports (always enabled for persistence)
// Rotate error logs
transports.push(
  new DailyRotateFile({
    filename: path.join(logsDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    maxSize: '20m',
    maxFiles: '30d', // Keep for 30 days
    format: structuredFormat,
    zippedArchive: true,
  })
);

// Rotate combined logs
transports.push(
  new DailyRotateFile({
    filename: path.join(logsDir, 'combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d', // Keep for 14 days
    format: structuredFormat,
    zippedArchive: true,
  })
);

// Rotate HTTP logs separately
transports.push(
  new DailyRotateFile({
    filename: path.join(logsDir, 'http-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'http',
    maxSize: '20m',
    maxFiles: '7d', // Keep for 7 days
    format: structuredFormat,
    zippedArchive: true,
  })
);

// 3. Papertrail transport (production only, if configured)
if (isProduction && process.env['LOG_SERVICE'] === 'papertrail') {
  const papertrailHost = process.env['PAPERTRAIL_HOST'];
  const papertrailPort = process.env['PAPERTRAIL_PORT'];

  if (papertrailHost && papertrailPort) {
    transports.push(
      new Syslog({
        host: papertrailHost,
        port: parseInt(papertrailPort, 10),
        protocol: 'tls4',
        localhost: process.env['APP_NAME'] || 'emooti-backend',
        app_name: process.env['APP_NAME'] || 'emooti-backend',
        eol: '\n',
        format: structuredFormat,
      })
    );
    console.log('✅ Papertrail transport enabled');
  } else {
    console.warn('⚠️  Papertrail configured but HOST or PORT missing');
  }
}

// 4. Better Stack / Logtail transport (production only, if configured)
if (isProduction && process.env['LOG_SERVICE'] === 'betterstack') {
  const logtailToken = process.env['BETTERSTACK_SOURCE_TOKEN'];

  if (logtailToken) {
    const logtail = new LogtailTransport({ sourceToken: logtailToken });
    transports.push(logtail);
    console.log('✅ Better Stack transport enabled');
  } else {
    console.warn('⚠️  Better Stack configured but SOURCE_TOKEN missing');
  }
}

// Create the logger
export const logger = winston.createLogger({
  level: getLogLevel(),
  levels,
  format: structuredFormat,
  transports,
  exitOnError: false,
  defaultMeta: {
    service: process.env['APP_NAME'] || 'emooti-backend',
    environment: NODE_ENV,
  },
});

// Handle uncaught exceptions
logger.exceptions.handle(
  new DailyRotateFile({
    filename: path.join(logsDir, 'exceptions-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '30d',
    format: structuredFormat,
    zippedArchive: true,
  })
);

// Handle unhandled promise rejections
logger.rejections.handle(
  new DailyRotateFile({
    filename: path.join(logsDir, 'rejections-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '30d',
    format: structuredFormat,
    zippedArchive: true,
  })
);

// Log initialization
logger.info('Logger initialized', {
  level: getLogLevel(),
  environment: NODE_ENV,
  service: process.env['LOG_SERVICE'] || 'local',
  transportsCount: transports.length,
});

// Helper methods for structured logging
export const logWithContext = (
  level: keyof typeof levels,
  message: string,
  context?: Record<string, any>
) => {
  logger.log(level, message, context);
};

export const logError = (
  message: string,
  error?: Error | unknown,
  context?: Record<string, any>
) => {
  const errorContext: Record<string, any> = { ...context };

  if (error instanceof Error) {
    errorContext.error = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  } else if (error) {
    errorContext.error = error;
  }

  logger.error(message, errorContext);
};

export const logHttp = (
  method: string,
  url: string,
  statusCode: number,
  responseTime: number,
  userId?: string
) => {
  logger.http('HTTP Request', {
    method,
    url,
    statusCode,
    responseTime,
    userId,
  });
};

export default logger;
