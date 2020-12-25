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
  const [result, set_result] = React.useState(null);
  const [rebuildClient, set_rebuildClient] = React.useState(1);

  React.useEffect(() => {
    const client = buildApolloWebsocketClient({
      anonymous,
      headers: {
        [headers.role]: anonymous ? undefined : role,
      },
    });

    const observable = client.subscribe({
      query,
      variables,
    });

    const subscription = observable.subscribe(set_result, (error) => {
      if (JWT_VERIFY_FAIL_REGEX.test(error.message)) {
        // refresh token and rebuild client
        return refreshJWTToken().then((success) => {
          if (!success) {
            return logout();
          }

          set_rebuildClient(rebuildClient + 1);
        });
      }

      // otherwise set error and continue
      set_result({ error });
    });

    return function cleanup() {
      subscription.unsubscribe();
      client.link.subscriptionClient.close();
    };
  }, [rebuildClient]);

  return { ...result };
}

function refreshJWTToken() {
  return new Promise((resolve) => {
    // return resolve(false);

    fetch('/api/auth/refresh', {
      method: 'POST',
    }).then((response) => {
      if (response.status === 200) {
        return resolve(true);
      }

      return resolve(false);
    });
  });
}

function logout() {
  return new Promise((resolve) => {
    // resolve(true);

    fetch('/api/auth/logout', {
      method: 'POST',
    }).then((response) => {
      window.location = '/';
    });
  });
}

function getAuthHeaders() {
  // get jwt token from cookie
  const jwtToken = !process.browser ? null : cookie.getJwtToken();

  if (!jwtToken) {
    return {};
  }

  return {
    [headers.authorization]: `Bearer ${jwtToken}`,
  };
}

export function buildApolloWebsocketClient(options = {}) {
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
              ...(options.anonymous ? {} : getAuthHeaders()),
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

export function buildApolloClient() {
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
          return new Observable((observer) => {
            refreshJWTToken().then((success) => {
              // cannot refresh token? logout
              if (!success) {
                return logout();
              }

              const subscriber = {
                next: observer.next.bind(observer),
                error: observer.error.bind(observer),
                complete: observer.complete.bind(observer),
              };

              forward(operation).subscribe(subscriber);
            });
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
          ...getAuthHeaders(),
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
