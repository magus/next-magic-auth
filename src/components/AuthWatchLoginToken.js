import * as React from 'react';

import { useAuth } from 'src/components/AuthProvider';
import graphql from 'src/client/graphql/queries';

function WatchLoginToken({ loginTokenId, handleLogout }) {
  const { loginToken, ...result } = graphql.watchLoginToken(loginTokenId);

  React.useEffect(async () => {
    if (!result.loading && !result.error && !loginToken) {
      // loginToken is missing, logout immediately
      console.debug('[AuthProvider]', 'no error and loginToken missing', 'logout');
      await handleLogout();
    }
  }, [result.loading, loginToken]);

  return null;
}

export default function AuthWatchLoginToken() {
  const auth = useAuth();

  if (auth.isLoggedIn) {
    return <WatchLoginToken loginTokenId={auth.loginRequestId} handleLogout={auth.actions.logout} />;
  }

  return null;
}
