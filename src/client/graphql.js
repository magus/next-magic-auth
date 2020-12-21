import gql from 'graphql-tag';
import { GraphQLClient } from 'graphql-request';

import cookie from './cookie';

const endpoint = 'https://magic.iamnoah.com/v1/graphql';
const client = new GraphQLClient(endpoint);

async function query(gql, { headers, variables, asRole = 'user' } = {}) {
  // get jwt token from cookie
  const jwtToken = cookie.getJwtToken();

  return await client.request(gql, variables, {
    Authorization: `Bearer ${jwtToken}`,
    'x-hasura-role': asRole,
    ...headers,
  });
}

const Queries = {
  me: async () => {
    const data = await query(me, { asRole: 'self' });
    const [self] = data.me;
    return self;
  },
};

export default Queries;

const me = gql`
  query Me {
    me: user {
      id
      email
      created
      updated
    }
  }
`;
