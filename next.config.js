// next.config.js

const withSourceMaps = require('@zeit/next-source-maps');
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const EnvConfig = require('./src/config/env');

const __CONFIG = {
  // --------------------------------------------------
  // withSourceMaps: source maps + sentry configuration
  env: {
    // include all non-secret config constants
    ...EnvConfig,
  },

  // https://securityheaders.com
  async headers() {
    return [
      {
        source: '/',
        headers: securityHeaders,
      },
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },

  // https://nextjs.org/docs/api-reference/next.config.js/custom-webpack-config
  webpack: (config, { isServer, buildId }) => {
    // config.plugins.push(
    //   new webpack.DefinePlugin({
    //     __DEV__: JSON.stringify(EnvConfig.DEV),
    //     'process.env.SENTRY_RELEASE': JSON.stringify(buildId),
    //   }),
    // );

    config.plugins.forEach((plugin) => {
      if (plugin.constructor.name === 'DefinePlugin') {
        plugin.definitions = {
          ...plugin.definitions,
          __DEV__: JSON.stringify(EnvConfig.DEV),
          'process.env.SENTRY_RELEASE': JSON.stringify(buildId),
        };
      }
    });

    if (!isServer) {
      config.resolve.alias['@sentry/node'] = '@sentry/browser';
    }

    return config;
  },
};

module.exports = withBundleAnalyzer(withSourceMaps(__CONFIG));

const securityHeaders = [
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-DNS-Prefetch-Control
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  },
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Feature-Policy
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  {
    key: 'Access-Control-Allow-Origin',
    value: `${EnvConfig.PROTOCOL}://${EnvConfig.HOSTNAME}`,
  },
];
