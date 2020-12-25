import { ApolloProvider } from '@apollo/client';
import { ModalContextProvider } from 'components/Modal';

import client from 'src/client/graphql/client';

import 'styles/globals.css';

function MyApp({ Component, pageProps }) {
  return (
    <ApolloProvider client={client}>
      <ModalContextProvider>
        <Component {...pageProps} />
      </ModalContextProvider>
    </ApolloProvider>
  );
}

export default MyApp;
