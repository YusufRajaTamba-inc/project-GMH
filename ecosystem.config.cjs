/**
 * PM2 Ecosystem Configuration for Global Mission House (GMH PA KMK)
 * Mitigation for R10: High-Availability Clustering & Auto-Restart
 * Usage:
 *   pm2 start ecosystem.config.cjs
 *   pm2 status
 *   pm2 logs
 */

module.exports = {
  apps: [
    {
      name: 'gmh-api',
      script: './apps/api/dist/server.js',
      instances: 'max', // Multi-core cluster mode
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '500M',
      autorestart: true,
      max_restarts: 10,
      restart_delay: 4000,
      env: {
        NODE_ENV: 'development',
        PORT: 3001,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      error_file: './logs/pm2-api-err.log',
      out_file: './logs/pm2-api-out.log',
      time: true,
    },
  ],
};
