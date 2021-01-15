import * as React from 'react';
import { ApolloClient, ApolloLink, HttpLink, InMemoryCache, Observable, split } from '@apollo/client';
import { getMainDefinition } from '@apollo/client/utilities';
import { onError } from '@apollo/client/link/error';
import { WebSocketLink } from '@apollo/client/link/ws';
import { SubscriptionClient } from 'subscriptions-transport-ws';

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

export function buildApolloClient(auth) {
  const errorLink = buildErrorLink(auth);
  const { transportLink, cleanup } = buildTransportLink(auth, { default: 'http' });

  const client = new ApolloClient({
    ssrMode: !process.browser,
    link: ApolloLink.from([errorLink, transportLink]),
    cache: SharedCache,
  });

  return { client, cleanup };
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

function buildTransportLink(auth, options) {
  const authHttpLink = buildAuthenticatedHttpLink(auth);
  const defaultWebsocket = options.default === 'websocket';

  if (!process.browser) {
    return {
      transportLink: authHttpLink,
      cleanup: () => {},
    };
  }

  // can only use web socket link in browser
  // https://github.com/apollographql/subscriptions-transport-ws/issues/333#issuecomment-359261024

  // client, setup websocket clients
  const { wsLinks, cleanupWebsocketConnections } = buildRoleWebsocketLinks(auth);

  const transportLink = split(
    (operation) => {
      const context = operation.getContext();

      // console.debug('[ApolloClient]', 'transport split', { context });

      // allow context flags to force a transport type
      if (context.http) return true;
      if (context.websocket) return false;

      // otherwise use default from options
      return !defaultWebsocket;
    },
    authHttpLink,
    wsLinks,
  );

  return {
    transportLink,
    cleanup: cleanupWebsocketConnections,
  };
}

function buildRoleWebsocketLinks(auth) {
  const _wsLinkRefs = {};
  function cleanupWebsocketConnections() {
    Object.values(_wsLinkRefs).forEach((link) => {
      link.subscriptionClient.close();
    });
  }

  const defaultLink = buildWebsocketLink();
  const authHeaders = getAuthHeaders(auth.jwt);

  _wsLinkRefs.default = defaultLink;

  const wsLinks = Object.keys(roles).reduce((nextLink, role) => {
    const roleLink = buildWebsocketLink(authHeaders, role);

    // store ref to link for closing websocket when client refreshes
    _wsLinkRefs[role] = roleLink;

    // return this split so that we can attach next roleLink to this split
    // end result is nested splits that will ultimately hit defaultLink if none match
    // e.g. (linkA, linkB) is a split
    //      (user, (self, (admin, (login, anonymous)))
    return split(
      (operation) => {
        const context = operation.getContext();
        // console.debug('split', context.role, { role });
        return context.role === role;
      },
      roleLink,
      nextLink,
    );
  }, defaultLink);

  return { wsLinks, cleanupWebsocketConnections };
}

function buildWebsocketLink(authHeaders, role) {
  const subscriptionClient = new SubscriptionClient(`wss://${graphqlHost}`, {
    lazy: true,
    reconnect: true,
    connectionParams: {
      headers: {
        ...authHeaders,
        [headers.role]: role,
      },
    },
  });

  return new WebSocketLink(subscriptionClient);
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

function buildAuthenticatedHttpLink(auth) {
  const authHeaders = getAuthHeaders(auth.jwt);

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
