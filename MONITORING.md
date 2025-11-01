# Monitoring & Logging Setup

This document explains how to set up monitoring and logging for the Smart Parcel Box system.

## Features

- **Error Tracking**: Sentry integration for both backend and PWA
- **Structured Logging**: Winston logger with JSON format and log rotation
- **Health Check**: Enhanced `/health` endpoint with system metrics
- **Performance Monitoring**: Request duration tracking
- **Session Replay**: Sentry replay for PWA user sessions

## Backend Logging

### Winston Logger

The backend uses Winston for structured logging with the following features:

- **Log Levels**: error, warn, info, debug
- **File Rotation**: 5MB max file size, 5 files kept
- **JSON Format**: Structured logs for easy parsing
- **Console Output**: Pretty-printed logs in development

#### Log Files

- `logs/error.log` - Error level logs only
- `logs/combined.log` - All log levels

#### Usage

```typescript
import { log } from './utils/logger';

// Basic logging
log.info('Server started', { port: 8080 });
log.error('Database error', error, { userId: '123' });

// Specific event logging
log.auth('login', 'admin', true);
log.api('GET', '/api/packages', 200, 45);
log.device('dev-001', 'package_detected', { distanceCm: 15 });
```

### Health Check Endpoint

Enhanced `/health` endpoint provides:

```json
{
  "status": "healthy",
  "timestamp": "2024-01-20T10:30:00.000Z",
  "uptime": 123456,
  "memory": {
    "used": "45MB",
    "total": "128MB"
  },
  "database": {
    "status": "connected",
    "users": 5
  },
  "environment": "production",
  "version": "1.0.0"
}
```

## Sentry Setup (Optional)

### Backend

1. Create a Sentry account at [sentry.io](https://sentry.io)
2. Create a new Node.js project
3. Copy the DSN from project settings
4. Set environment variable:

```bash
export SENTRY_DSN="https://xxxxx@xxxxx.ingest.sentry.io/xxxxx"
```

5. Sentry will automatically track:
   - Uncaught exceptions
   - API errors
   - Database errors
   - Performance metrics

### PWA

1. Create a React project in Sentry
2. Copy the DSN
3. Set environment variable in `.env.production`:

```
VITE_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
```

4. Sentry will track:
   - React component errors (via ErrorBoundary)
   - Network errors
   - User sessions
   - Performance metrics
   - Session replays (10% sample rate)

### Disabling Sentry

If you don't want to use Sentry:
- Simply don't set the `SENTRY_DSN` or `VITE_SENTRY_DSN` variables
- The app will log a warning but continue working normally

## Log Analysis

### View Recent Logs

```bash
# View last 50 lines of combined logs
tail -n 50 backend/logs/combined.log

# View errors only
tail -n 50 backend/logs/error.log

# Follow logs in real-time
tail -f backend/logs/combined.log
```

### Search Logs

```bash
# Find all auth-related logs
grep "Auth:" backend/logs/combined.log

# Find errors for specific user
grep "userId.*123" backend/logs/error.log

# Parse JSON logs with jq
cat backend/logs/combined.log | jq 'select(.level == "error")'
```

## Production Best Practices

### Log Retention

Current setup keeps 5 log files of 5MB each (total 25MB per log type). To change:

```typescript
// backend/src/utils/logger.ts
new winston.transports.File({
  filename: path.join(logDir, 'error.log'),
  level: 'error',
  maxsize: 10485760, // 10MB
  maxFiles: 10, // Keep 10 files
})
```

### Log Levels

- **Production**: Set `LOG_LEVEL=info`
- **Development**: Set `LOG_LEVEL=debug`
- **Debugging**: Set `LOG_LEVEL=debug`

### Monitoring Checklist

- [ ] Set up Sentry for error tracking
- [ ] Configure log rotation
- [ ] Set up log aggregation (optional: Elasticsearch, Loki)
- [ ] Create alerts for error rate spikes
- [ ] Monitor `/health` endpoint with uptime service
- [ ] Set up performance budgets
- [ ] Review logs weekly for patterns

## Troubleshooting

### Logs not appearing

1. Check if `logs/` directory exists
2. Verify write permissions: `chmod 755 backend/logs`
3. Check log level: `LOG_LEVEL=debug npm start`

### Sentry not tracking errors

1. Verify DSN is correct
2. Check network connectivity to sentry.io
3. Look for initialization logs in console
4. Test with: `throw new Error('Test error')`

### High log file size

1. Reduce max file size in logger config
2. Lower log level in production
3. Set up log rotation with logrotate
4. Archive old logs to cold storage

## Useful Commands

```bash
# Count errors in last hour
grep -c '"level":"error"' backend/logs/error.log

# Find slowest API requests
cat backend/logs/combined.log | jq 'select(.duration > 1000)'

# Get unique error messages
cat backend/logs/error.log | jq -r '.message' | sort | uniq -c

# Monitor health check
watch -n 5 'curl -s http://localhost:8080/health | jq'
```
