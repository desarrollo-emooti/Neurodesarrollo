import * as Sentry from '@sentry/react';

/**
 * Sentry Configuration for Frontend
 *
 * Provides error tracking and performance monitoring for the React app.
 *
 * Environment Variables:
 * - VITE_SENTRY_DSN: Sentry project DSN
 * - VITE_SENTRY_ENVIRONMENT: Environment name (development, staging, production)
 * - VITE_SENTRY_TRACES_SAMPLE_RATE: Percentage of transactions to sample (0.0 to 1.0)
 */

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const SENTRY_ENVIRONMENT = import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE;
const NODE_ENV = import.meta.env.MODE;

export const initSentry = () => {
  // Only initialize Sentry if DSN is provided
  if (!SENTRY_DSN) {
    if (NODE_ENV === 'production') {
      console.warn('⚠️  Sentry DSN not configured. Error tracking disabled.');
    }
    return;
  }

  try {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: SENTRY_ENVIRONMENT,

      // Integrations
      integrations: [
        // Browser tracing for performance monitoring
        Sentry.browserTracingIntegration(),

        // Session replay for debugging
        Sentry.replayIntegration({
          maskAllText: true, // Mask text for privacy
          blockAllMedia: true, // Block images/videos for privacy
        }),

        // Breadcrumbs for better context
        Sentry.breadcrumbsIntegration({
          console: true, // Track console logs
          dom: true, // Track DOM events
          fetch: true, // Track fetch requests
          history: true, // Track history changes
          xhr: true, // Track XHR requests
        }),
      ],

      // Performance Monitoring
      tracesSampleRate: parseFloat(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || '0.1'), // 10% by default

      // Session Replay
      replaysSessionSampleRate: 0.1, // 10% of sessions
      replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

      // Release tracking
      release: import.meta.env.VITE_APP_VERSION || 'unknown',

      // Filtering
      beforeSend(event, hint) {
        // Filter out specific errors

        // Don't send network errors in development
        if (NODE_ENV === 'development' && hint.originalException?.message?.includes('Network')) {
          return null;
        }

        // Don't send 404 errors
        if (event.message?.includes('404') || event.message?.includes('Not Found')) {
          return null;
        }

        // Don't send cancelled requests
        if (hint.originalException?.name === 'AbortError') {
          return null;
        }

        return event;
      },

      // Ignore specific errors
      ignoreErrors: [
        'ResizeObserver loop limit exceeded',
        'Non-Error promise rejection captured',
        'Network request failed',
        'Load failed',
        'ChunkLoadError',
      ],

      // Deny URLs (don't track errors from these sources)
      denyUrls: [
        // Browser extensions
        /extensions\//i,
        /^chrome:\/\//i,
        /^moz-extension:\/\//i,
      ],
    });

    console.log('✅ Sentry initialized', {
      environment: SENTRY_ENVIRONMENT,
      tracesSampleRate: import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || '0.1',
    });
  } catch (error) {
    console.error('Failed to initialize Sentry', error);
  }
};

// Manual error capture
export const captureException = (error, context) => {
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
export const captureMessage = (message, level = 'info', context) => {
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
export const setUser = (user) => {
  if (!SENTRY_DSN) {
    return;
  }
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.fullName || user.email,
  });
};

// Clear user context
export const clearUser = () => {
  if (!SENTRY_DSN) {
    return;
  }
  Sentry.setUser(null);
};

// Add breadcrumb
export const addBreadcrumb = (breadcrumb) => {
  if (!SENTRY_DSN) {
    return;
  }
  Sentry.addBreadcrumb(breadcrumb);
};

export default Sentry;
