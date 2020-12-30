import * as React from 'react';
import { getMainDefinition } from '@apollo/client/utilities';

import { useAuth } from 'src/components/AuthProvider';
import roles from 'src/shared/roles';
import { buildApolloWebsocketClient } from 'src/client/graphql/client';
import { JWT_VERIFY_FAIL_REGEX } from 'src/client/graphql/constants';

// adhoc useSubscription to prevent opening web socket in client setup
// also allows us to handle errors on the socket and reset client
export default function useAdhocSubscription(
  query,
  { variables, anonymous, role = roles.user, ...options },
) {
  const auth = useAuth();
  const [data, set_data] = React.useState(null);
  const [error, set_error] = React.useState(null);

  const definition = getMainDefinition(query);
  if (
    !definition ||
    !(
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    )
  ) {
    console.error('[useAdhocSubscription]', 'query is not a subscription', {
      query,
    });
    throw new Error('query is not a subscription');
  }

  const jwtToken = options.jwt || auth.jwt;

  React.useEffect(() => {
    const client = buildApolloWebsocketClient({
      jwtToken,
      anonymous,
      role,
    });

    const observable = client.subscribe({
      query,
      variables,
    });

    const subscription = observable.subscribe(
      (subscribeResult) => {
        set_data(subscribeResult.data);
      },
      async (error) => {
        if (JWT_VERIFY_FAIL_REGEX.test(error.message)) {
          // refresh token and cause rebuild client (auth.jwt)
          console.debug('[AdhocSubscription]', 'auth.actions.refreshTokens');
          const refreshTokenResult = await auth.actions.refreshTokens();

          if (!refreshTokenResult) {
            console.error('[AdhocSubscription]', 'refreshTokens failure');
          }
        } else {
          // otherwise set error and continue
          set_error({ error });
        }
      },
    );

    return function cleanup() {
      subscription.unsubscribe();
      client.link.subscriptionClient.close();
    };
  }, [jwtToken]);

  return { error, data, loading: !(error || data) };
}
