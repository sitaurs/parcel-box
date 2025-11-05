module.exports = {
  apps: [{
    name: 'smartparcel-backend',
    script: 'npm',
    args: 'start',
    cwd: '/home/ubuntu/smartparcel/backend',
    env_file: '.env',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    error_file: '/root/.pm2/logs/smartparcel-backend-error.log',
    out_file: '/root/.pm2/logs/smartparcel-backend-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    env: {
      NODE_ENV: 'production'
    }
  }]
};
