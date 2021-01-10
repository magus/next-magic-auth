import * as React from 'react';

import AppShell from './AppShell';
import Providers from './Providers';
import LoginGateCover from '@components/LoginGate/LoginGateCover';

export default function LoadingApp(props) {
  // console.debug({ props });

  return (
    <Providers>
      <AppShell {...props}>
        <LoginGateCover {...props} />
      </AppShell>
    </Providers>
  );
}
