import { GraphQLClient } from 'graphql-request';

import config from './config';

const endpoint = 'https://magic-graphql.iamnoah.com/v1/graphql';
const client = new GraphQLClient(endpoint);

export default {
  query: async (gql, { headers, variables }) => {
    return await client.request(gql, variables, {
      'x-hasura-admin-secret': config.HASURA_ADMIN_SECRET,
      ...headers,
    });
  },
};
