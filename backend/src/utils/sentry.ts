import * as Sentry from '@sentry/node';

/**
 * Initialize Sentry error tracking
 * Set SENTRY_DSN environment variable to enable
 */
export function initSentry() {
  const dsn = process.env.SENTRY_DSN;
  
  if (!dsn) {
    console.log('⚠️  Sentry DSN not configured. Error tracking disabled.');
    console.log('   Set SENTRY_DSN environment variable to enable Sentry.');
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 1.0,
    
    // Capture console errors
    beforeSend(event, hint) {
      // Filter out known non-critical errors
      const error = hint.originalException;
      if (error && typeof error === 'object' && 'code' in error) {
        // Ignore network errors
        if (['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND'].includes((error as any).code)) {
          return null;
        }
      }
      return event;
    },
  });

  console.log('✅ Sentry error tracking initialized');
}

/**
 * Capture error to Sentry
 */
export function captureError(error: Error, context?: Record<string, any>) {
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(error, { extra: context });
  }
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(message: string, data?: Record<string, any>) {
  if (process.env.SENTRY_DSN) {
    Sentry.addBreadcrumb({
      message,
      data,
      level: 'info',
    });
  }
}
