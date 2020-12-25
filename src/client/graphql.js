import gql from 'graphql-tag';
import { GraphQLClient } from 'graphql-request';
import {
  ApolloClient,
  ApolloLink,
  HttpLink,
  InMemoryCache,
} from '@apollo/client';

import cookie from './cookie';

const endpoint = 'https://magic.iamnoah.com/v1/graphql';

const httpLink = new HttpLink({ uri: endpoint });

const authMiddleware = new ApolloLink((operation, forward) => {
  // get jwt token from cookie
  const jwtToken = cookie.getJwtToken();

  // add the authorization to the headers
  // use prevContext to ensure we add to existing context
  operation.setContext((prevContext) => ({
    ...prevContext,
    headers: {
      ...prevContext.headers,
      authorization: jwtToken ? `Bearer ${jwtToken}` : null,
    },
  }));

  return forward(operation);
});

const client = new ApolloClient({
  cache: new InMemoryCache(),
  link: authMiddleware.concat(httpLink),
});

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

const Queries = {
  me: async () => {
    const { data } = await query(me, { asRole: 'self' });
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
