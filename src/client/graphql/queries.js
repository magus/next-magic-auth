import gql from 'graphql-tag';
import { useLazyQuery, useSubscription, useQuery } from '@apollo/client';

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
    const result = useSubscription(gqls.watchLoginToken, {
      variables: { userId },
      context: {
        headers: {
          [headers.role]: roles.self,
        },
      },
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
  { headers, variables, asRole = roles.user } = {},
) {
  const queryResult = await client.query({
    query,
    variables,
    context: {
      headers: {
        [headers.role]: asRole,
        ...headers,
      },
    },
  });

  return queryResult;
}
