import * as React from 'react';
import Head from 'next/head';
import { IntlProvider } from 'react-intl';

import { AuthProvider } from 'src/components/AuthProvider';
import AuthWatchLoginToken from 'src/components/AuthWatchLoginToken';
import ApolloProvider from 'src/components/ApolloProvider';
import { ModalContextProvider } from 'src/components/Modal';

import 'styles/globals.css';

export default function MyApp({ Component, pageProps }) {
  // console.debug({ Component, pageProps });
  // console.debug('Component.requireAuth', Component.requireAuth);

  return (
    <ModalContextProvider>
      <AuthenticatedApp {...{ Component, pageProps }} />
    </ModalContextProvider>
  );
}

function AuthenticatedApp({ Component, pageProps }) {
  if (Component.requireAuth) {
    return (
      <AuthProvider>
        <ApolloProvider>
          <AuthWatchLoginToken />
          <AppContent {...{ Component, pageProps }} />
        </ApolloProvider>
      </AuthProvider>
    );
  }

  return <AppContent {...{ Component, pageProps }} />;
}

function AppContent({ Component, pageProps }) {
  return (
    <IntlProvider locale="en" defaultLocale="en">
      <Head>
        <title>Magic</title>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
          key="viewport"
        />
      </Head>

      <Component {...pageProps} />
    </IntlProvider>
  );
}
