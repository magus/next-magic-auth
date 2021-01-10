import * as React from 'react';
import dynamic from 'next/dynamic';

import LoggedOutApp from './LoggedOutApp';
import LoadingApp from './LoadingApp';

const AuthenticatedApp = dynamic(() => import('@pages/_app/AuthenticatedApp'), {
  loading: LoadingApp,
});

export default function App(props) {
  const { Component, pageProps } = props;
  // console.debug({ Component, pageProps });

  if (Component.disableAuth) {
    return <LoggedOutApp {...props} />;
  }

  return <AuthenticatedApp {...props} />;
}
