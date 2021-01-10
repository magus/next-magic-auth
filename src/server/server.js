const next = require('next');
const express = require('express');
const cookieParser = require('cookie-parser');
const { v4: uuidv4 } = require('uuid');

const SentryConfig = require('../config/sentry');

const port = parseInt(process.env.PORT, 10) || 3000;
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handler = app.getRequestHandler();

function sessionCookie(req, res, next) {
  const htmlPage =
    !req.path.match(/^\/(_next|static)/) &&
    !req.path.match(/\.(js|map)$/) &&
    req.accepts('text/html', 'text/css', 'image/png') === 'text/html';

  if (!htmlPage) {
    next();
    return;
  }

  if (!req.cookies.sid || req.cookies.sid.length === 0) {
    req.cookies.sid = uuidv4();
    res.cookie('sid', req.cookies.sid);
  }

  next();
}

// Sentry: Secure access to source maps
// https://docs.sentry.io/platforms/javascript/sourcemaps/hosting-publicly/#secure-access-to-source-maps
const sourcemapsForSentryOnly = (token) => (req, res, next) => {
  // In production we only want to serve source maps for Sentry
  if (!dev && !!token && req.headers['x-sentry-token'] !== token) {
    res.status(401).send('Authentication access token is required to access the source map.');
    return;
  }
  next();
};

app.prepare().then(() => {
  // app.buildId is only available after app.prepare(), hence why we setup here
  const { Sentry, captureException } = SentryConfig(app.buildId);

  process.on('unhandledRejection', (err) => {
    captureException(err, { errorSource: 'server.unhandledRejection' });
  });

  process.on('uncaughtException', (err) => {
    captureException(err, { errorSource: 'server.uncaughtException' });
  });

  express()
    // This attaches request information to Sentry errors
    .use(Sentry.Handlers.requestHandler())
    .use(cookieParser())
    .use(sessionCookie)
    .get(/\.map$/, sourcemapsForSentryOnly(process.env.SENTRY_TOKEN_HEADER))
    // Regular next.js request handler
    .use(handler)
    // This handles errors if they are thrown before reaching the app
    .use(Sentry.Handlers.errorHandler())
    .listen(port, (err) => {
      if (err) {
        throw err;
      }
      // eslint-disable-next-line no-console
      console.log(`ready - started server on http://localhost:${port}`);
    });
});
