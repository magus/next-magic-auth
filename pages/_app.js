import { ApolloProvider } from '@apollo/client';
import { ModalContextProvider } from 'components/Modal';

import { buildApolloClient } from 'src/client/graphql/client';

import 'styles/globals.css';

function MyApp({ Component, pageProps }) {
  const client = buildApolloClient();

  return (
    <ApolloProvider client={client}>
      <ModalContextProvider>
        <Component {...pageProps} />
      </ModalContextProvider>
    </ApolloProvider>
  );
}

export default MyApp;
