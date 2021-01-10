const { NODE_ENV, SENTRY_TOKEN_HEADER } = process.env;

// some environmental variables required from .env or vercel sercrets
// e.g. now env ls (vercel env ls)
if (!SENTRY_TOKEN_HEADER) throw new Error('SENTRY_TOKEN_HEADER is not defined');

const EnvConfig = {
  DEV: NODE_ENV !== 'production',

  APP_NAME: 'Magic',

  PROTOCOL: 'https',
  HOSTNAME: 'magicwords.vercel.app',

  SENTRY_DSN: 'https://8a5fc1e07b4f49cea19f8151261a1788@o502635.ingest.sentry.io/5585227',
  GOOGLE_ANALYTICS_UA: 'UA-106090287-2',
};

if (EnvConfig.DEV) {
  EnvConfig.PROTOCOL = 'http';
  EnvConfig.HOSTNAME = 'localhost:3000';
}

module.exports = EnvConfig;
