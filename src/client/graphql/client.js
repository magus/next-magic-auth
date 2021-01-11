import * as React from 'react';
import { ApolloClient, ApolloLink, HttpLink, InMemoryCache, Observable, split } from '@apollo/client';
import { getMainDefinition } from '@apollo/client/utilities';
import { onError } from '@apollo/client/link/error';
import { WebSocketLink } from '@apollo/client/link/ws';

import { useAuth } from 'src/components/AuthProvider';
import roles from 'src/shared/roles';
import headers from 'src/shared/headers';
import { JWT_VERIFY_FAIL_REGEX } from 'src/client/graphql/constants';

const graphqlHost = 'magic.iamnoah.com/v1/graphql';

const SharedHttpCache = new InMemoryCache();

function getAuthHeaders(jwtToken) {
  if (!jwtToken) {
    return {};
  }

  return {
    [headers.authorization]: `Bearer ${jwtToken}`,
  };
}

export function buildApolloWebsocketClient(options = {}) {
  const authHeaders = getAuthHeaders(options.anonymous ? null : options.jwtToken);

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
              [headers.role]: options.anonymous ? undefined : options.role,
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

  const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
    // Ignoring errors
    // https://www.apollographql.com/docs/link/links/error/#ignoring-errors

    if (networkError) {
      console.error('[ApolloClient]', 'networkError', networkError);
    }

    if (graphQLErrors) {
      let needsRefresh = false;

      graphQLErrors.map((gqlError) => {
        if (JWT_VERIFY_FAIL_REGEX.test(gqlError.message)) {
          needsRefresh = true;
        } else {
          // unhandled error, log it
          if (__DEV__) {
            console.error('[ApolloClient]', 'gqlError', gqlError);
          }
        }
      });

      if (needsRefresh) {
        // Refresh JWT token
        return new Observable(async (observer) => {
          console.debug('[ApolloClient]', 'auth.actions.refreshTokens');
          await auth.actions.refreshTokens();

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
  });

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

  return new ApolloClient({
    ssrMode: !process.browser,
    link,
    cache: SharedHttpCache,
  });
}
