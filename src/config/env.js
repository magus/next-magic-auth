const EnvConfig = {
  DEV: process.env.NODE_ENV !== 'production',

  PROTOCOL: 'https',
  HOSTNAME: 'magic.iamnoah.com',

  SENTRY_DSN: 'https://8a5fc1e07b4f49cea19f8151261a1788@o502635.ingest.sentry.io/5585227',
  GOOGLE_ANALYTICS_UA: 'G-B7SJTKYQ55',
};

if (EnvConfig.DEV) {
  EnvConfig.PROTOCOL = 'http';
  EnvConfig.HOSTNAME = 'localhost:3000';
}

module.exports = EnvConfig;
