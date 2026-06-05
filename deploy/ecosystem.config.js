// PM2 process descriptor for the Next.js production server.
// Launched with `pm2 start deploy/ecosystem.config.js` from the repo
// root after `npm ci --omit=dev && npm run build`.
//
// Environment is sourced from .env.local (Next.js reads it
// automatically at runtime). We bind to 127.0.0.1 only so nginx is
// the sole public entry point.

module.exports = {
  apps: [
    {
      name: 'epov-web',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -H 127.0.0.1 -p 3000',
      cwd: __dirname + '/..',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_restarts: 10,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
