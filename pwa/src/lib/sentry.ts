import * as Sentry from '@sentry/react';

/**
 * Initialize Sentry for React PWA
 * Set VITE_SENTRY_DSN environment variable to enable
 */
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  
  if (!dsn) {
    console.log('⚠️  Sentry DSN not configured. Error tracking disabled.');
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE || 'development',
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    
    // Performance monitoring
    tracesSampleRate: 1.0,
    
    // Session replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    
    // Filter errors
    beforeSend(event, hint) {
      // Ignore network errors
      const error = hint.originalException;
      if (error && typeof error === 'string' && error.includes('NetworkError')) {
        return null;
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
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.captureException(error, { extra: context });
  }
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(message: string, data?: Record<string, any>) {
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.addBreadcrumb({
      message,
      data,
      level: 'info',
    });
  }
}

/**
 * Set user context
 */
export function setUser(user: { id: string; username: string; role: string }) {
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.setUser({
      id: user.id,
      username: user.username,
      role: user.role,
    });
  }
}
