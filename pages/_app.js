import * as React from 'react';
import Head from 'next/head';
import { IntlProvider } from 'react-intl';

import { AuthProvider } from '@components/AuthProvider';
import AuthWatchLoginToken from '@components/AuthWatchLoginToken';
import ApolloProvider from '@components/ApolloProvider';
import { ModalContainer, ModalContextProvider } from '@components/Modal';
import Page from '@components/Page';
import LoginGate from '@components/LoginGate';
import { useAuth } from '@components/AuthProvider';

import 'styles/globals.css';

export default function MyApp(props) {
  // console.debug({ props });

  const { Component, pageProps } = props;

  if (Component.disableAuth) {
    return (
      <Providers>
        <AppShell {...props}>
          <Component {...pageProps} />
        </AppShell>
      </Providers>
    );
  }

  return (
    <Providers>
      <AuthProviders>
        <AppShell {...props}>
          <LoginGate>
            <Component {...pageProps} />
          </LoginGate>
        </AppShell>
      </AuthProviders>
    </Providers>
  );
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

function Providers({ children }) {
  return <ModalContextProvider>{children}</ModalContextProvider>;
}

function AppShell({ children, Component, pageProps }) {
  return (
    <IntlProvider locale="en" defaultLocale="en">
      <Head>
        <title key="title">
          {Component.title ? `Magic - ${Component.title}` : 'Magic'}
        </title>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
          key="viewport"
        />
        <link
          key="favicon"
          rel="icon"
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🪄</text></svg>"
        />
      </Head>

      {children}

      <ModalContainer />
    </IntlProvider>
  );
}
