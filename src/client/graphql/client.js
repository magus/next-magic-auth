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

const graphqlHost = 'magic.iamnoah.com/v1/graphql';

function refreshJWTToken() {
  return new Promise((resolve) => {
    // resolve(true);

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

function getAuthHeaders() {
  // get jwt token from cookie
  const jwtToken = !process.browser ? null : cookie.getJwtToken();

  if (!jwtToken) {
    return {};
  }

  return {
    [headers.authorization]: `Bearer ${jwtToken}`,
    [headers.role]: roles.user,
  };
}

export function buildApolloClient() {
  const httpLink = new HttpLink({ uri: `https://${graphqlHost}` });

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
              ...getAuthHeaders(),
            },
          },
        },
      });

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
          if (
            gqlError.message === 'Could not verify JWT: JWTExpired' ||
            gqlError.message ===
              'Could not verify JWT: JWSError JWSInvalidSignature'
          ) {
            needsRefresh = true;
          } else {
            // unhandled error, log it
            if (config.isDev) {
              console.error('[graphql]', 'gqlError', gqlError);
            }
          }
        });

        if (needsRefresh) {
          // Refresh JWT token
          return new Observable((observer) => {
            refreshJWTToken().then((success) => {
              if (!success) {
                // TODO logout
                throw new Error('unable to refresh token');
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
          ...getAuthHeaders(),
          ...prevContext.headers,
        },
      };

      return newContext;
    });

    return forward(operation);
  });

  // use http link only on server side render
  const webLink = !process.browser
    ? httpLink
    : split(
        (operation) => {
          const context = operation.getContext();
          const definition = getMainDefinition(operation.query);

          return (
            definition.kind === 'OperationDefinition' &&
            definition.operation === 'subscription'
          );
        },
        wsLink,
        httpLink,
      );

  const link = ApolloLink.from([errorLink, authMiddleware, webLink]);

  const cache = new InMemoryCache();

  return new ApolloClient({
    ssrMode: !process.browser,
    link,
    cache,
  });
}
