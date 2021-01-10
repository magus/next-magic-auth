import * as React from 'react';

import AppShell from './AppShell';
import Providers from './Providers';

export default function LoadingAuthenticatedApp(props) {
  // console.debug({ props });

  const { Component, pageProps } = props;

  return (
    <Providers>
      <AppShell {...props}>
        <LoginGateCover />
      </AppShell>
    </Providers>
  );
}
