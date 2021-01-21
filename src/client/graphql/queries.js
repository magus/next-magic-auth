import * as React from 'react';
import gql from 'graphql-tag';
import { useLazyQuery, useQuery } from '@apollo/client';

import useAdhocSubscription from 'src/hooks/useAdhocSubscription';

import headers from 'src/shared/headers';
import roles from 'src/shared/roles';

const gqls = {
  watchLoginRequest: gql`
    subscription WatchLoginRequest {
      loginToken {
        approved
        id
      }
    }
  `,

  watchLoginToken: gql`
    subscription WatchLoginToken($loginTokenId: uuid!) {
      loginToken: loginToken_by_pk(id: $loginTokenId) {
        id
      }
    }
  `,

  me: gql`
    query Me {
      me: user {
        id
        email
        created
        updated
      }
    }
  `,

  watchLoginRequests: gql`
    subscription LoginRequests {
      loginToken(order_by: { created: desc }) {
        id
        created
        expires
        approved
        ip
        userAgent
        geoCity: geo(path: "city")
        geoState: geo(path: "code.state")
        geoCountry: geo(path: "code.country")
        geoCountryFull: geo(path: "country")
        domain
      }
    }
  `,

  watchRefreshTokens: gql`
    subscription RefreshTokens {
      refreshToken(order_by: { lastActive: desc }) {
        id: loginTokenId
        created
        expires
        ip
        lastActive
        userAgent
        geoCity: geo(path: "city")
        geoState: geo(path: "code.state")
        geoCountry: geo(path: "code.country")
        geoCountryFull: geo(path: "country")
        loginToken {
          domain
        }
      }
    }
  `,
};

export default {
  query,

  watchLoginRequest: (jwtToken) => {
    const result = useAdhocSubscription(gqls.watchLoginRequest, {
      role: roles.login,
      jwt: jwtToken.encoded,
    });

    let approved = false;

    if (!result.error && result.data && result.data.loginToken) {
      // extract approved
      const [loginToken] = result.data.loginToken;
      if (loginToken) {
        approved = loginToken.approved;
      }
    }

    return approved;
  },

  watchLoginToken: (loginTokenId) => {
    const result = useAdhocSubscription(gqls.watchLoginToken, {
      role: roles.self,
      variables: { loginTokenId },
    });

    let loginToken = null;

    if (!result.error && result.data && result.data.loginToken) {
      loginToken = result.data.loginToken;
    }

    return { ...result, loginToken };
  },

  me: (websocket) => {
    const [get, result] = useLazyQuery(gqls.me, {
      fetchPolicy: 'cache-and-network',
      context: {
        role: roles.self,
        websocket,
      },
    });

    let self;

    if (!result.error && result.data) {
      const [me] = result.data.me;
      self = me;
    }

    return [get, self];
  },

  watchLoginRequests: () => {
    const result = useAdhocSubscription(gqls.watchLoginRequests, {
      role: roles.self,
    });

    let loginRequests = [];

    if (!result.error && result.data && Array.isArray(result.data.loginToken)) {
      loginRequests = result.data.loginToken;
    }

    const loading = result.error || result.loading;
    return { loading, loginRequests };
  },

  watchRefreshTokens: () => {
    const result = useAdhocSubscription(gqls.watchRefreshTokens, {
      role: roles.self,
    });

    let refreshTokens = [];

    if (!result.error && result.data && Array.isArray(result.data.refreshToken)) {
      refreshTokens = result.data.refreshToken;
    }

    const loading = result.error || result.loading;
    return { loading, refreshTokens };
  },
};

async function query(client, query, { headers, variables, role = roles.user } = {}) {
  const queryResult = await client.query({
    query,
    variables,
    context: {
      headers: {
        [headers.role]: role,
        ...headers,
      },
    },
  });

  return queryResult;
}
