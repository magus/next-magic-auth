import * as React from 'react';

import AppShell from './AppShell';
import Providers from './Providers';

export default function LoggedOutApp(props) {
  // console.debug({ props });

  const { Component, pageProps } = props;

  return (
    <Providers>
      <AppShell {...props}>
        <Component {...pageProps} />
      </AppShell>
    </Providers>
  );
}
