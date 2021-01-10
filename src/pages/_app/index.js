import * as React from 'react';
import dynamic from 'next/dynamic';

import LoggedOutApp from './LoggedOutApp';
import LoadingAuthenticatedApp from './LoadingAuthenticatedApp';

const AuthenticatedApp = dynamic(() => import('@pages/_app/AuthenticatedApp'), {
  loading: LoadingAuthenticatedApp,
});

export default function MyApp(props) {
  // console.debug({ props });

  const { Component, pageProps } = props;

  if (Component.disableAuth) {
    return <LoggedOutApp {...props} />;
  }

  return <AuthenticatedApp {...props} />;
}
