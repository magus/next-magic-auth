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
