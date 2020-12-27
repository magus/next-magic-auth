import * as React from 'react';
import gql from 'graphql-tag';
import { useLazyQuery, useQuery } from '@apollo/client';

import useAdhocSubscription from 'src/hooks/useAdhocSubscription';

import headers from 'src/shared/headers';
import roles from 'src/shared/roles';

const gqls = {
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

  loginRequests: gql`
    subscription LoginRequests {
      loginToken(
        order_by: { created: desc }
        where: { approved: { _eq: false } }
      ) {
        id
        created
        expires
        approved
      }
    }
  `,

  refreshTokens: gql`
    subscription RefreshTokens {
      refreshToken(order_by: { created: desc }) {
        id: loginTokenId
        created
        expires
      }
    }
  `,

  watchLoginToken: gql`
    subscription WatchLoginToken($id: uuid!) {
      loginToken_by_pk(id: $id) {
        approved
      }
    }
  `,
};

export default {
  query,

  me: () => {
    const [get, result] = useLazyQuery(gqls.me, {
      fetchPolicy: 'cache-and-network',
      context: {
        headers: {
          [headers.role]: roles.self,
        },
      },
    });

    let self;

    if (!result.error && result.data) {
      const [me] = result.data.me;
      self = me;
    }

    return [get, self];
  },

  loginRequests: () => {
    const result = useAdhocSubscription(gqls.loginRequests, {
      role: roles.self,
    });

    let loginRequests = [];

    if (!result.error && result.data && Array.isArray(result.data.loginToken)) {
      // extract approved
      loginRequests = result.data.loginToken;
    }

    return loginRequests;
  },

  refreshTokens: () => {
    const result = useAdhocSubscription(gqls.refreshTokens, {
      role: roles.self,
    });

    let refreshTokens = [];

    if (
      !result.error &&
      result.data &&
      Array.isArray(result.data.refreshToken)
    ) {
      // extract approved
      refreshTokens = result.data.refreshToken;
    }

    return refreshTokens;
  },

  watchLoginToken: (id) => {
    const result = useAdhocSubscription(gqls.watchLoginToken, {
      variables: { id },
      anonymous: true,
    });

    let approved = false;

    if (!result.error && result.data && result.data.loginToken_by_pk) {
      // extract approved
      approved = result.data.loginToken_by_pk.approved;
    }

    return approved;
  },
};

async function query(
  client,
  query,
  { headers, variables, role = roles.user } = {},
) {
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
