import * as React from 'react';

import { useAuth } from 'src/components/AuthProvider';
import roles from 'src/shared/roles';
import { buildApolloWebsocketClient } from 'src/client/graphql/client';
import { JWT_VERIFY_FAIL_REGEX } from 'src/client/graphql/constants';

// adhoc useSubscription to prevent opening web socket in client setup
// also allows us to handle errors on the socket and reset client
export default function useAdhocSubscription(
  query,
  { variables, anonymous, role = roles.user },
) {
  const auth = useAuth();
  const [result, set_result] = React.useState(null);

  React.useEffect(() => {
    const client = buildApolloWebsocketClient({
      jwtToken: auth.jwt,
      anonymous,
      role,
    });

    const observable = client.subscribe({
      query,
      variables,
    });

    const subscription = observable.subscribe(set_result, async (error) => {
      if (JWT_VERIFY_FAIL_REGEX.test(error.message)) {
        // refresh token and cause rebuild client (auth.jwt)
        const jwtToken = await auth.actions.refreshTokens();
        console.debug('[AdhocSubscription]', 'needsRefresh', { jwtToken });
      }

      // otherwise set error and continue
      set_result({ error });
    });

    return function cleanup() {
      subscription.unsubscribe();
      client.link.subscriptionClient.close();
    };
  }, [auth.jwt]);

  return { ...result };
}
