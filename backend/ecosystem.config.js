const path = require('path');

module.exports = {
  apps: [
    {
      name: 'workflow-api',
      script: 'dist/main.js',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: path.join(__dirname, 'logs/error.log'),
      out_file: path.join(__dirname, 'logs/out.log'),
      log_file: path.join(__dirname, 'logs/combined.log'),
      time: true,
    },
  ],
};
