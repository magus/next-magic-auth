import * as React from 'react';

import LoginRequests from 'src/components/LoginRequests';
import RefreshTokens from 'src/components/RefreshTokens';

import graphql from 'src/client/graphql/queries';

export default function LoginActivity() {
  const loginRequests = graphql.watchLoginRequests();
  const refreshTokens = graphql.watchRefreshTokens();

  return (
    <>
      <RefreshTokens refreshTokens={refreshTokens} />
      <LoginRequests loginRequests={loginRequests} />
    </>
  );
}
