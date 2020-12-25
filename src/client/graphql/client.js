import {
  ApolloClient,
  ApolloLink,
  HttpLink,
  InMemoryCache,
} from '@apollo/client';

import cookie from 'src/client/cookie';
import roles from 'src/shared/roles';
import headers from 'src/shared/headers';

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
      [headers.authorization]: jwtToken ? `Bearer ${jwtToken}` : null,
      [headers.role]: roles.user,
      ...prevContext.headers,
    },
  }));

  return forward(operation);
});

export default new ApolloClient({
  cache: new InMemoryCache(),
  link: authMiddleware.concat(httpLink),
});
