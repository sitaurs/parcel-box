module.exports = {
  apps: [{
    name: 'smartparcel-backend',
    script: './dist/src/index.js',
    cwd: '/home/ubuntu/smartparcel/backend',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    error_file: '/root/.pm2/logs/smartparcel-backend-error.log',
    out_file: '/root/.pm2/logs/smartparcel-backend-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    env: {
      NODE_ENV: 'production',
      PORT: 8080,
      JWT_SECRET: 'supersecret_change_this_in_production',
      API_TOKEN: 'device_token_change_this',
      DEFAULT_PIN: '432432',
      DATABASE_URL: 'file:./db.sqlite',
      STORAGE_DIR: './storage',
      API_BASE_URL: 'http://13.213.57.228:8080/api/v1',
      WA_API_URL: 'http://localhost:3001',
      BAILEYS_DATA_DIR: './wa-session',
      DEFAULT_PHONE: '628123456789',
      MQTT_ENABLED: 'true',
      MQTT_HOST: '13.213.57.228',
      MQTT_PORT: '1883',
      MQTT_USER: 'smartbox',
      MQTT_PASS: 'engganngodinginginmcu',
      CORS_ORIGIN: '*',
      VAPID_PUBLIC_KEY: '',
      VAPID_PRIVATE_KEY: '',
      VAPID_EMAIL: 'admin@example.com'
    }
  }]
};
