import { GraphQLClient } from 'graphql-request';

import config from './config';

const endpoint = 'https://magic.iamnoah.com/v1/graphql';
const client = new GraphQLClient(endpoint);

export default {
  query: async (gql, { headers, variables }) => {
    // console.debug({ gql, variables, headers });

    try {
      const data = await client.request(gql, variables, {
        'x-hasura-admin-secret': config.HASURA_ADMIN_SECRET,
        ...headers,
      });

      // console.debug({ data });

      return { data };
    } catch (error) {
      return { error };
    }
  },
};
