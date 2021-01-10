import * as React from 'react';

import { AuthProvider } from '@components/AuthProvider';
import AuthWatchLoginToken from '@components/AuthWatchLoginToken';
import ApolloProvider from '@components/ApolloProvider';
import LoginGate from '@components/LoginGate';

import AppShell from './AppShell';
import Providers from './Providers';

export default function AuthenticatedApp(props) {
  // console.debug({ props });

  const { Component, pageProps } = props;

  return (
    <Providers>
      <AuthProviderGroup>
        <AppShell {...props}>
          <LoginGate>
            <Component {...pageProps} />
          </LoginGate>
        </AppShell>
      </AuthProviderGroup>
    </Providers>
  );
}

function AuthProviderGroup({ children }) {
  return (
    <AuthProvider>
      <ApolloProvider>
        <AuthWatchLoginToken />
        {children}
      </ApolloProvider>
    </AuthProvider>
  );
}
