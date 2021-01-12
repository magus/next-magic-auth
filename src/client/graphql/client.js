import * as React from 'react';
import { ApolloClient, ApolloLink, HttpLink, InMemoryCache, Observable, split } from '@apollo/client';
import { getMainDefinition } from '@apollo/client/utilities';
import { onError } from '@apollo/client/link/error';
import { WebSocketLink } from '@apollo/client/link/ws';

import { useAuth } from 'src/components/AuthProvider';
import roles from 'src/shared/roles';
import headers from 'src/shared/headers';
import { JWT_VERIFY_FAIL_REGEX } from 'src/client/graphql/constants';

const graphqlHost = 'magic-graphql.iamnoah.com/v1/graphql';

const SharedCache = new InMemoryCache();

function getAuthHeaders(jwtToken) {
  if (!jwtToken) {
    return {};
  }

  return {
    [headers.authorization]: `Bearer ${jwtToken}`,
  };
}

function buildWebsocketLink(authHeaders, role) {
  // can only use web socket link in browser
  // https://github.com/apollographql/subscriptions-transport-ws/issues/333#issuecomment-359261024
  const wsLink = new WebSocketLink({
    uri: `wss://${graphqlHost}`,
    options: {
      reconnect: true,
      connectionParams: {
        headers: {
          ...authHeaders,
          [headers.role]: role,
        },
      },
    },
  });

  return wsLink;
}

export function buildApolloWebsocketClient(auth, options = {}) {
  const errorLink = buildErrorLink(auth);

  const jwtToken = options.jwt || auth.jwt;
  const authHeaders = getAuthHeaders(options.anonymous ? null : jwtToken);
  const role = options.anonymous ? undefined : options.role;
  const wsLink = buildWebsocketLink(authHeaders, role);

  const link = ApolloLink.from([errorLink, wsLink]);
  const cache = new InMemoryCache();

  const client = new ApolloClient({
    link,
    cache,
  });

  return { client, wsLink };
}

export function buildApolloClient(auth) {
  const errorLink = buildErrorLink(auth);
  const transportLink = buildTransportLink(auth);

  return new ApolloClient({
    ssrMode: !process.browser,
    link: ApolloLink.from([errorLink, transportLink]),
    cache: SharedCache,
  });

  return client;
}

function buildErrorLink(auth) {
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
          const refreshTokenResult = await auth.actions.refreshTokens();

          if (!refreshTokenResult) {
            console.error('[ApolloClient]', 'refreshTokens failure', { refreshTokenResult });
          }

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

  return errorLink;
}

function buildTransportLink(auth) {
  let authHeaders = getAuthHeaders(auth.jwt);

  const httpLink = new HttpLink({ uri: `https://${graphqlHost}` });

  // add headers for auth http requests
  // create wsLink instance for specific role
  const authMiddleware = new ApolloLink((operation, forward) => {
    // add the authorization to the headers
    // use prevContext to ensure we add to existing context
    operation.setContext((prevContext) => {
      const role = prevContext.role || roles.user;

      const newContext = {
        ...prevContext,
        headers: {
          [headers.role]: role,
          ...prevContext.headers,
          ...authHeaders,
        },
      };

      // console.debug('[ApolloClient]', 'authMiddleware', { role, prevContext, newContext });

      return newContext;
    });

    return forward(operation);
  });

  return ApolloLink.from([authMiddleware, httpLink]);
}
