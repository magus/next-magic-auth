import * as React from 'react';
import Head from 'next/head';
import { IntlProvider } from 'react-intl';

import { AuthProvider } from 'src/components/AuthProvider';
import AuthWatchLoginToken from 'src/components/AuthWatchLoginToken';
import ApolloProvider from 'src/components/ApolloProvider';
import { ModalContainer, ModalContextProvider } from 'src/components/Modal';
import Page from 'src/components/Page';
import LoginGate from 'src/components/LoginGate';
import { useAuth } from 'src/components/AuthProvider';

import 'styles/globals.css';

export default function MyApp(props) {
  // console.debug({ props });

  if (!props.Component.requireAuth) {
    return (
      <Providers>
        <AppContent {...props} />
      </Providers>
    );
  }

  return (
    <Providers>
      <AuthProviders {...props}>
        <LoginGate>
          <AppContent {...props} />
        </LoginGate>
      </AuthProviders>
    </Providers>
  );
}

function Providers({ children }) {
  return <ModalContextProvider>{children}</ModalContextProvider>;
}

function AuthProviders({ children }) {
  return (
    <AuthProvider>
      <ApolloProvider>
        <AuthWatchLoginToken />
        {children}
      </ApolloProvider>
    </AuthProvider>
  );
}

function AppContent({ children, Component, pageProps }) {
  return (
    <IntlProvider locale="en" defaultLocale="en">
      <Head>
        <title key="title">Magic</title>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
          key="viewport"
        />
      </Head>

      <Component {...pageProps} />

      <ModalContainer />
    </IntlProvider>
  );
}
