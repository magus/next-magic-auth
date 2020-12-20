import { GraphQLClient } from 'graphql-request';

import config from './config';

const endpoint = 'https://magic.iamnoah.com/v1/graphql';
const client = new GraphQLClient(endpoint);

export default {
  query: async (gql, { headers, variables }) => {
    try {
      const data = await client.request(gql, variables, {
        'x-hasura-admin-secret': config.HASURA_ADMIN_SECRET,
        ...headers,
      });

      return { data };
    } catch (error) {
      return { error };
    }
  },
};
