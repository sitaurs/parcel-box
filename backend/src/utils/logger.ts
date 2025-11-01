import winston from 'winston';
import path from 'path';

const logDir = path.join(process.cwd(), 'logs');

// Custom format for console output with colors
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = '';
    if (Object.keys(meta).length > 0) {
      metaStr = '\n' + JSON.stringify(meta, null, 2);
    }
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);

// JSON format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: fileFormat,
  defaultMeta: { service: 'smart-parcel-backend' },
  transports: [
    // Error logs
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Combined logs
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

// Helper functions for structured logging
export const log = {
  info: (message: string, meta?: object) => logger.info(message, meta),
  warn: (message: string, meta?: object) => logger.warn(message, meta),
  error: (message: string, error?: Error | any, meta?: object) => {
    if (error instanceof Error) {
      logger.error(message, { error: error.message, stack: error.stack, ...meta });
    } else {
      logger.error(message, { error, ...meta });
    }
  },
  debug: (message: string, meta?: object) => logger.debug(message, meta),
  
  // Specific event logging
  auth: (action: string, username: string, success: boolean, meta?: object) => {
    logger.info(`Auth: ${action}`, { username, success, ...meta });
  },
  
  api: (method: string, path: string, statusCode: number, duration: number, meta?: object) => {
    logger.info(`API: ${method} ${path}`, { statusCode, duration, ...meta });
  },
  
  device: (deviceId: string, action: string, meta?: object) => {
    logger.info(`Device: ${action}`, { deviceId, ...meta });
  },
  
  package: (packageId: string, action: string, meta?: object) => {
    logger.info(`Package: ${action}`, { packageId, ...meta });
  },
};
