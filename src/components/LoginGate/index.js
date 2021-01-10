import * as React from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';

import { useAuth } from 'src/components/AuthProvider';
import Page from 'src/components/Page';
import LoginPage from 'pages/auth/login';

import LoginGateCover from '@components/LoginGate/LoginGateCover';

const LoginGateCoverAnimated = dynamic(() => import('@components/LoginGate/LoginGateCoverAnimated'), {
  loading: LoginGateCover,
});

export default function LoginGate(props) {
  return (
    <React.Fragment>
      <LoginGateContent {...props} />
      <LoginGateCoverAnimated />
    </React.Fragment>
  );
}

function LoginGateContent({ children }) {
  const auth = useAuth();

  if (!auth.isLoggedIn) {
    return <LoginPage />;
  }

  return children;
}
