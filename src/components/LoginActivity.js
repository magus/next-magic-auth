import * as React from 'react';

import LoginRequests from 'src/components/LoginRequests';
import RefreshTokens from 'src/components/RefreshTokens';
import graphql from 'src/client/graphql/queries';

export default function LoginActivity() {
  const watchLoginRequests = graphql.watchLoginRequests();
  const watchRefreshTokens = graphql.watchRefreshTokens();

  // // test auth graphql http request
  // const [getMe, me] = graphql.me(/* websocket */);
  // console.debug({ me });
  // React.useEffect(() => {
  //   getMe();
  // }, []);

  // by default empty results
  let loginRequests = [];
  let refreshTokens = [];

  const loading = watchLoginRequests.loading || watchRefreshTokens.loading;

  // Wait for both results before displaying
  if (!loading) {
    refreshTokens = watchRefreshTokens.refreshTokens;

    // build active session lookup
    const activeSessionLookup = watchRefreshTokens.refreshTokens.reduce((lookup, rt) => {
      lookup[rt.id] = rt;
      return lookup;
    }, {});

    // filter out login requests that have refresh tokens
    // use activeSessionLookup to ensure we only filter when it is shown as an active session
    loginRequests = watchLoginRequests.loginRequests.filter((lr) => {
      if (activeSessionLookup[lr.id]) {
        return false;
      }

      return true;
    });
  }

  // console.debug('[LoginActivity]', { loading });
  return (
    <>
      <RefreshTokens {...{ loading, refreshTokens }} />
      <LoginRequests {...{ loading, loginRequests }} />
    </>
  );
}
