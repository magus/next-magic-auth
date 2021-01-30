import * as React from 'react';
import NextApp from 'next/app';
import Error from 'next/error';

import App from './App';

let SentryConfig;

if (process.browser) {
  // Dynamically setup Sentry for client errors
  import('src/config/sentry').then((SentryConfigModule) => {
    SentryConfig = SentryConfigModule.default();

    window.addEventListener('error', (event) => {
      console.debug('[SentryConfig]', 'window.error', { event });
      SentryConfig.captureException(event.error, { errorSource: 'browser.window.error' });
      // prevent bubbling to the Sentry.Integration.TryCatch
      // handler which wraps all `addEventListener` functions
      event.stopPropagation();
    });
  });
} else {
  // Setup sentry for server side errors
  const SentryConfigModule = require('src/config/sentry');
  SentryConfig = SentryConfigModule();
}

export default class MyApp extends NextApp {
  static getDerivedStateFromProps(props, state) {
    // If there was an error generated within getInitialProps, and we haven't
    // yet seen an error, we add it to this.state here
    return {
      hasError: props.hasError || state.hasError || false,
      errorEventId: props.errorEventId || state.errorEventId || undefined,
    };
  }

  static getDerivedStateFromError() {
    // React Error Boundary here allows us to set state flagging the error (and
    // later render a fallback UI).
    return { hasError: true };
  }

  constructor() {
    super(...arguments);

    this._errorEventId = null;

    this.state = {
      hasError: false,
    };
  }

  // shouldComponentUpdate(nextProps, nextState) {
  //   const hasPropChange = ['hasError', 'errorEventId'].some((prop) => {
  //     if (this.props[prop] !== nextProps[prop]) {
  //       console.error('[_app]', 'sCU', prop);
  //       return true;
  //     }
  //   });

  //   const hasStateChange = ['hasError'].some((prop) => {
  //     if (this.state[prop] !== nextState[prop]) {
  //       console.error('[_app]', 'sCU', prop);
  //       return true;
  //     }
  //   });

  //   // console.debug('[_app]', { hasStateChange, hasPropChange });
  //   return hasStateChange || hasPropChange;
  // }

  componentDidCatch(error, errorInfo) {
    console.debug('componentDidCatch');

    if (SentryConfig) {
      const errorEventId = SentryConfig.captureException(error, {
        errorInfo,
        errorSource: 'componentDidCatch',
      });

      // Store the event id at this point as we don't have access to it within
      // `getDerivedStateFromError`.
      // `SentryConfig.Sentry.showReportDialog` can be used to manually send errors
      // e.g. SentryConfig.Sentry.showReportDialog({ eventId: this.state.errorEventId });
      this._errorEventId = errorEventId;
    }
  }

  render() {
    if (this.state.hasError) {
      return <Error title="Something went wrong, please reload the page." />;
    }

    return <App {...this.props} />;
  }
}
