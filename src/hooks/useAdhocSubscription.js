import * as React from 'react';
import { getMainDefinition } from '@apollo/client/utilities';

import { useAuth } from 'src/components/AuthProvider';
import roles from 'src/shared/roles';
import { buildApolloWebsocketClient } from 'src/client/graphql/client';
import { JWT_VERIFY_FAIL_REGEX } from 'src/client/graphql/constants';

// adhoc useSubscription to prevent opening web socket in client setup
// also allows us to handle errors on the socket and reset client

// map of websocket clients for each role
const websocketClients = {};
const websocketSubscribers = {};

function getWebsocketClientKey({ role, anonymous }) {
  return anonymous ? 'anonymous' : role;
}

function createWebsocketClient(auth, options) {
  const key = getWebsocketClientKey(options);
  const needsCreate = !websocketClients[key] || websocketClients[key].jwtToken !== auth.jwt;

  if (needsCreate) {
    // close previous socket
    closeWebsocketClient(key);

    // console.debug('[useAdhocSubscription]', 'createWebsocketClient', { key });
    websocketClients[key] = {
      ...buildApolloWebsocketClient(auth, options),
      jwtToken: auth.jwt,
    };
  }
}

function getWebsocketClient(auth, options) {
  const key = getWebsocketClientKey(options);

  createWebsocketClient(auth, options);

  // increment count of subscribers
  if (typeof websocketSubscribers[key] !== 'number') {
    websocketSubscribers[key] = 0;
  }
  websocketSubscribers[key]++;

  return websocketClients[key].client;
}

function closeWebsocketClient(key) {
  if (websocketClients[key]) {
    // console.debug('[useAdhocSubscription]', 'closeWebsocketClient', { key });
    websocketClients[key].wsLink.subscriptionClient.close();
    delete websocketClients[key];
  }
}

function cleanupWebsocketClient(options) {
  const key = getWebsocketClientKey(options);

  // decrement count of subscribers
  websocketSubscribers[key]--;

  // console.debug('[useAdhocSubscription]', 'cleanupWebsocketClient', JSON.stringify({ key, websocketSubscribers }));

  // if this is the last only subscriber, then close the websocket connection entirely
  // client.link.subscriptionClient.close();
  if (websocketSubscribers[key] === 0) {
    closeWebsocketClient(key);
  }
}

export default function useAdhocSubscription(query, { variables, ...options }) {
  const auth = useAuth();
  const [result, set_result] = React.useState({
    error: null,
    data: null,
  });

  const client = React.useMemo(() => {
    // get websocket client, creating it if needed
    const client = getWebsocketClient(auth, options);

    // console.debug('[useAdhocSubscription]', 'getWebsocketClient', JSON.stringify({ options, websocketSubscribers }));
    return client;
  }, [auth.jwt]);

  React.useEffect(() => {
    const observable = client.subscribe({
      query,
      variables,
    });

    const subscription = observable.subscribe(
      (subscribeResult) => {
        const { data } = subscribeResult;
        set_result((r) => ({ ...r, data, error: null }));
      },
      async (error) => {
        // set error and continue
        set_result((r) => ({ ...r, error }));
      },
    );

    return function cleanup() {
      // unsubscribe for subscription instance
      subscription.unsubscribe();
      cleanupWebsocketClient(options);
    };
  }, [client]);

  if (!isSubscription(query)) {
    console.error('[useAdhocSubscription]', 'query is not a subscription', {
      query,
    });
    throw new Error('query is not a subscription');
  }

  return {
    ...result,
    loading: !(result.error || result.data),
  };
}

function isSubscription(query) {
  const definition = getMainDefinition(query);

  if (!definition) return false;

  const isSubscription = definition.kind === 'OperationDefinition' && definition.operation === 'subscription';
  return isSubscription;
}
