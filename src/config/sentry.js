// NOTE: This require will be replaced with `@sentry/browser`
// client side thanks to the webpack config in next.config.js
const Sentry = require('@sentry/node');
const {
  Integrations: { BrowserTracing: SentryIntegrationsBrowserTracing },
} = require('@sentry/tracing');
const { Debug: SentryIntegrationsDebug } = require('@sentry/integrations');
const Cookie = require('js-cookie');

const DEBUG = false;
const IGNORE_ERRORS = process.env.NODE_ENV !== 'production';
const RELEASE_DEFAULT = process.env.SENTRY_RELEASE;

const ignoreErrors = [
  // string or regex to match error message
];

// process.env.SENTRY_RELEASE will override the argument passed
// (app.buildId) in server/server.js
module.exports = function configureSentry(release = RELEASE_DEFAULT) {
  // https://docs.sentry.io/clients/javascript/config/
  const sentryOptions = {
    dsn: process.env.SENTRY_DSN,
    release,
    ignoreErrors,
    tracesSampleRate: 1.0,
    maxBreadcrumbs: 50,
    attachStacktrace: true,
  };

  if (process.browser) {
    // do not default integrations, setup manually
    sentryOptions.defaultIntegrations = false;
    // client side integrations (default integrations + browser tracing)
    // https://github.com/getsentry/sentry-javascript/blob/4b2d249bfa274de50d96704c2e365c2b488e7eaa/packages/browser/src/sdk.ts
    sentryOptions.integrations = [
      new Sentry.Integrations.InboundFilters(),
      new Sentry.Integrations.FunctionToString(),
      // new Sentry.Integrations.TryCatch(),
      new Sentry.Integrations.Breadcrumbs({
        beacon: true, // Log HTTP requests done with the Beacon API
        console: true, // Log calls to `console.log`, `console.debug`, etc
        dom: true, // Log all click and keypress events
        fetch: true, // Log HTTP requests done with the Fetch API
        history: true, // Log calls to `history.pushState` and friends
        sentry: true, // Log whenever we send an event to the server
        xhr: true, // Log HTTP requests done with the XHR API
      }),
      // // https://docs.sentry.io/platforms/javascript/configuration/integrations/default/#globalhandlers
      // new Sentry.Integrations.GlobalHandlers({
      //   onerror: false,
      //   onunhandledrejection: false,
      // }),
      new Sentry.Integrations.LinkedErrors(),
      new Sentry.Integrations.UserAgent(),

      // https://github.com/getsentry/sentry-javascript/blob/master/packages/tracing/src/browser/browsertracing.ts
      // new SentryIntegrationsBrowserTracing({ tracingOrigins: [''] }),
    ];
  }

  // When we're developing locally
  if (IGNORE_ERRORS) {
    // Don't actually send the errors to Sentry
    // Instead, dump the errors to the console
    sentryOptions.beforeSend = (...args) => {
      console.debug('[SentryConfig]', 'beforeSend', args);
      return null;
    };

    // (ensure sentryOptions.integrations array)
    if (!sentryOptions.integrations) {
      sentryOptions.integrations = [];
    }

    // if DEBUG show all Sentry events in console
    if (DEBUG) {
      // debugger set to true will pause in devtools debugger for every event
      // https://docs.sentry.io/platforms/node/integrations/pluggable-integrations/#debug
      sentryOptions.integrations.push(
        new SentryIntegrationsDebug({
          // Trigger DevTools debugger instead of using console.log
          debugger: false,
        }),
      );
    }
  }

  Sentry.init(sentryOptions);

  return {
    Sentry,
    captureException: (err, ctx) => {
      console.debug('[SentryConfig]', 'captureException', { err, ctx });

      Sentry.configureScope((scope) => {
        if (err.message) {
          // De-duplication currently doesn't work correctly for SSR / browser errors
          // so we force deduplication by error message if it is present
          scope.setFingerprint([err.message]);
        }

        if (err.statusCode) {
          scope.setExtra('statusCode', err.statusCode);
        }

        if (ctx) {
          const { req, res, errorInfo, query, pathname, ...extraContext } = ctx;

          if (res && res.statusCode) {
            scope.setExtra('statusCode', res.statusCode);
          }

          if (typeof window !== 'undefined') {
            scope.setTag('ssr', false);
            scope.setExtra('query', query);
            scope.setExtra('pathname', pathname);

            // On client-side we use js-cookie package to fetch it
            const sessionId = Cookie.get('sid');
            if (sessionId) {
              scope.setUser({ id: sessionId });
            }
          } else if (req) {
            scope.setTag('ssr', true);
            scope.setExtra('url', req.url);
            scope.setExtra('method', req.method);
            scope.setExtra('headers', req.headers);
            scope.setExtra('params', req.params);
            scope.setExtra('query', req.query);

            // On server-side we take session cookie directly from request
            if (req.cookies.sid) {
              scope.setUser({ id: req.cookies.sid });
            }
          }

          if (extraContext) {
            Object.keys(extraContext).forEach((key) => {
              scope.setExtra(key, extraContext[key]);
            });
          }

          if (errorInfo) {
            Object.keys(errorInfo).forEach((key) => {
              scope.setExtra(key, errorInfo[key]);
            });
          }
        }
      });

      return Sentry.captureException(err);
    },
  };
};
