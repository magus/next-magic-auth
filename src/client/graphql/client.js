import * as React from 'react';
import {
  ApolloClient,
  ApolloLink,
  HttpLink,
  InMemoryCache,
  Observable,
  split,
} from '@apollo/client';
import { getMainDefinition } from '@apollo/client/utilities';
import { onError } from '@apollo/client/link/error';
import { WebSocketLink } from '@apollo/client/link/ws';

import { useAuth } from 'src/components/AuthProvider';
import config from 'src/client/config';
import cookie from 'src/client/cookie';
import roles from 'src/shared/roles';
import headers from 'src/shared/headers';
import { gql } from 'graphql-request';

const graphqlHost = 'magic.iamnoah.com/v1/graphql';

const JWT_VERIFY_FAIL_REGEX = /Could not verify JWT/;

// adhoc useSubscription to prevent opening web socket in client setup
// also allows us to handle errors on the socket and reset client
export function useAdhocSubscription(
  query,
  { variables, anonymous, role = roles.user },
) {
  const auth = useAuth();
  const [result, set_result] = React.useState(null);

  React.useEffect(() => {
    const client = buildApolloWebsocketClient({
      jwtToken: auth.jwt,
      anonymous,
      headers: {
        [headers.role]: anonymous ? undefined : role,
      },
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

function getAuthHeaders(jwtToken) {
  if (!jwtToken) {
    return {};
  }

  return {
    [headers.authorization]: `Bearer ${jwtToken}`,
  };
}

export function buildApolloWebsocketClient(options = {}) {
  const authHeaders = getAuthHeaders(
    options.anonymous ? null : options.jwtToken,
  );

  // can only use web socket link in browser
  // https://github.com/apollographql/subscriptions-transport-ws/issues/333#issuecomment-359261024
  const wsLink = !process.browser
    ? null
    : new WebSocketLink({
        uri: `wss://${graphqlHost}`,
        options: {
          reconnect: true,
          connectionParams: {
            headers: {
              ...authHeaders,
              ...options.headers,
            },
          },
        },
      });

  const link = ApolloLink.from([wsLink]);

  const cache = new InMemoryCache();

  return new ApolloClient({
    link,
    cache,
  });
}

export function buildApolloClient(auth) {
  let authHeaders = getAuthHeaders(auth.jwt);

  const httpLink = new HttpLink({ uri: `https://${graphqlHost}` });

  const errorLink = onError(
    ({ graphQLErrors, networkError, operation, forward }) => {
      // Ignoring errors
      // https://www.apollographql.com/docs/link/links/error/#ignoring-errors

      if (networkError) {
        console.error('[graphql]', 'networkError', networkError);
      }

      if (graphQLErrors) {
        let needsRefresh = false;

        graphQLErrors.map((gqlError) => {
          if (JWT_VERIFY_FAIL_REGEX.test(gqlError.message)) {
            needsRefresh = true;
          } else {
            // unhandled error, log it
            if (config.__DEV__) {
              console.error('[graphql]', 'gqlError', gqlError);
            }
          }
        });

        if (needsRefresh) {
          // Refresh JWT token
          return new Observable(async (observer) => {
            const jwtToken = await auth.actions.refreshTokens();
            console.debug('[ApolloClient]', 'needsRefresh', { jwtToken });

            // if jwtToken refreshed, rebuild auth headers and forward to replay request

            // if (jwtToken) {
            //   authHeaders = getAuthHeaders(jwtToken);

            //   const subscriber = {
            //     next: observer.next.bind(observer),
            //     error: observer.error.bind(observer),
            //     complete: observer.complete.bind(observer),
            //   };

            //   forward(operation).subscribe(subscriber);
            // }
          });
        }

        return forward(operation);
      }
    },
  );

  const authMiddleware = new ApolloLink((operation, forward) => {
    // add the authorization to the headers
    // use prevContext to ensure we add to existing context
    operation.setContext((prevContext) => {
      const newContext = {
        ...prevContext,
        headers: {
          [headers.role]: roles.user,
          ...prevContext.headers,
          ...authHeaders,
        },
      };

      return newContext;
    });

    return forward(operation);
  });

  const link = ApolloLink.from([errorLink, authMiddleware, httpLink]);

  const cache = new InMemoryCache();

  return new ApolloClient({
    ssrMode: !process.browser,
    link,
    cache,
  });
}
