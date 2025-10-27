import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';
import { logger } from '../utils/logger';

/**
 * Sentry Configuration for APM and Error Tracking
 *
 * Environment Variables:
 * - SENTRY_DSN: Sentry project DSN
 * - SENTRY_ENVIRONMENT: Environment name (development, staging, production)
 * - SENTRY_TRACES_SAMPLE_RATE: Percentage of transactions to sample (0.0 to 1.0)
 * - SENTRY_PROFILES_SAMPLE_RATE: Percentage of transactions to profile (0.0 to 1.0)
 */

const NODE_ENV = process.env['NODE_ENV'] || 'development';
const SENTRY_DSN = process.env['SENTRY_DSN'];
const SENTRY_ENVIRONMENT = process.env['SENTRY_ENVIRONMENT'] || NODE_ENV;

export const initSentry = (app: any) => {
  // Only initialize Sentry if DSN is provided
  if (!SENTRY_DSN) {
    if (NODE_ENV === 'production') {
      logger.warn('⚠️  Sentry DSN not configured. APM and error tracking disabled.');
    }
    return;
  }

  try {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: SENTRY_ENVIRONMENT,

      // Integrations
      integrations: [
        // Enable HTTP calls tracing
        new Sentry.Integrations.Http({ tracing: true }),

        // Enable Express.js middleware tracing
        new Sentry.Integrations.Express({ app }),

        // Enable profiling
        new ProfilingIntegration(),

        // Enable Prisma tracing (if using Prisma)
        new Sentry.Integrations.Prisma({ client: undefined }),
      ],

      // Performance Monitoring
      tracesSampleRate: parseFloat(process.env['SENTRY_TRACES_SAMPLE_RATE'] || '0.1'), // 10% by default

      // Profiling
      profilesSampleRate: parseFloat(process.env['SENTRY_PROFILES_SAMPLE_RATE'] || '0.1'), // 10% by default

      // Release tracking
      release: process.env['npm_package_version'] || 'unknown',

      // Filtering
      beforeSend(event, hint) {
        // Filter out specific errors
        const error = hint.originalException;

        // Don't send validation errors (400s)
        if (event.exception?.values?.[0]?.type === 'ValidationError') {
          return null;
        }

        // Don't send 404 errors
        if (event.message?.includes('404') || event.message?.includes('Not Found')) {
          return null;
        }

        return event;
      },

      // Ignore specific errors
      ignoreErrors: [
        'AbortError',
        'NetworkError',
        'ECONNREFUSED',
        'ENOTFOUND',
      ],
    });

    logger.info('✅ Sentry initialized', {
      environment: SENTRY_ENVIRONMENT,
      tracesSampleRate: process.env['SENTRY_TRACES_SAMPLE_RATE'] || '0.1',
      profilesSampleRate: process.env['SENTRY_PROFILES_SAMPLE_RATE'] || '0.1',
    });
  } catch (error) {
    logger.error('Failed to initialize Sentry', { error });
  }
};

// Sentry request handler (must be first middleware)
export const sentryRequestHandler = () => {
  if (!SENTRY_DSN) {
    return (req: any, res: any, next: any) => next();
  }
  return Sentry.Handlers.requestHandler();
};

// Sentry tracing handler
export const sentryTracingHandler = () => {
  if (!SENTRY_DSN) {
    return (req: any, res: any, next: any) => next();
  }
  return Sentry.Handlers.tracingHandler();
};

// Sentry error handler (must be before other error handlers)
export const sentryErrorHandler = () => {
  if (!SENTRY_DSN) {
    return (err: any, req: any, res: any, next: any) => next(err);
  }
  return Sentry.Handlers.errorHandler();
};

// Manual error capture
export const captureException = (error: Error | unknown, context?: Record<string, any>) => {
  if (!SENTRY_DSN) {
    return;
  }

  Sentry.withScope((scope) => {
    if (context) {
      Object.keys(context).forEach((key) => {
        scope.setContext(key, context[key]);
      });
    }
    Sentry.captureException(error);
  });
};

// Manual message capture
export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info', context?: Record<string, any>) => {
  if (!SENTRY_DSN) {
    return;
  }

  Sentry.withScope((scope) => {
    if (context) {
      Object.keys(context).forEach((key) => {
        scope.setContext(key, context[key]);
      });
    }
    Sentry.captureMessage(message, level);
  });
};

// Set user context
export const setUser = (user: { id: string; email?: string; username?: string }) => {
  if (!SENTRY_DSN) {
    return;
  }
  Sentry.setUser(user);
};

// Clear user context
export const clearUser = () => {
  if (!SENTRY_DSN) {
    return;
  }
  Sentry.setUser(null);
};

export default Sentry;
