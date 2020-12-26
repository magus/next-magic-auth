import * as React from 'react';
import gql from 'graphql-tag';
import { useLazyQuery, useQuery } from '@apollo/client';

import { useAdhocSubscription } from 'src/client/graphql/client';

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

  watchLoginToken: gql`
    subscription WatchLoginToken($userId: uuid!) {
      loginToken_by_pk(userId: $userId) {
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

  watchLoginToken: (userId) => {
    const result = useAdhocSubscription(gqls.watchLoginToken, {
      variables: { userId },
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
