import gql from 'graphql-tag';
import { useLazyQuery } from '@apollo/client';

import client from 'src/client/graphql/client';
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
};

async function query(query, { headers, variables, asRole = 'user' } = {}) {
  const queryResult = await client.query({
    query,
    variables,
    context: {
      headers: {
        'x-hasura-role': asRole,
        ...headers,
      },
    },
  });

  return queryResult;
}
