import * as React from 'react';

import LoginRequests from 'src/components/LoginRequests';
import RefreshTokens from 'src/components/RefreshTokens';

import graphql from 'src/client/graphql/queries';

export default function LoginActivity() {
  const loginRequests = graphql.watchLoginRequests();
  const refreshTokens = graphql.watchRefreshTokens();

  // build active session lookup
  const activeSessionLookup = refreshTokens.reduce((lookup, rt) => {
    lookup[rt.id] = rt;
    return lookup;
  }, {});

  // filter out login requests that are refresh tokens
  // use activeSessionLookup to ensure we only filter when it is shown as an active session
  const filteredLoginRequests = loginRequests.filter((lr) => {
    if (activeSessionLookup[lr.id]) {
      return false;
    }

    return true;
  });

  return (
    <>
      <RefreshTokens refreshTokens={refreshTokens} />
      <LoginRequests loginRequests={filteredLoginRequests} />
    </>
  );
}
