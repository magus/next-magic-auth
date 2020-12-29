import * as React from 'react';

import { useAuth } from 'src/components/AuthProvider';
import graphql from 'src/client/graphql/queries';

function WatchLoginToken({ loginTokenId, handleLogout }) {
  const {
    loading: watchLoginTokenLoading,
    loginToken,
  } = graphql.watchLoginToken(loginTokenId);

  React.useEffect(async () => {
    if (!watchLoginTokenLoading && !loginToken) {
      // loginToken is missing, logout
      console.debug('[AuthProvider]', 'loginToken missing', 'logout');
      await handleLogout();
    }
  }, [watchLoginTokenLoading, loginToken]);

  return null;
}

export default function AuthWatchLoginToken() {
  const auth = useAuth();

  if (auth.isLoggedIn) {
    return (
      <WatchLoginToken
        loginTokenId={auth.loginRequestId}
        handleLogout={auth.actions.logout}
      />
    );
  }

  return null;
}
