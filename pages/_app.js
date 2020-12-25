import Head from 'next/head';
import { ApolloProvider } from '@apollo/client';

import { ModalContextProvider } from 'components/Modal';

import { buildApolloClient } from 'src/client/graphql/client';

import 'styles/globals.css';

function MyApp({ Component, pageProps }) {
  const client = buildApolloClient();

  return (
    <ApolloProvider client={client}>
      <ModalContextProvider>
        <Head>
          <title>Magic</title>
          <meta
            name="viewport"
            content="width=device-width; height=device-height; initial-scale=1.0; maximum-scale=1.0; user-scalable=no"
            key="viewport"
          />
        </Head>

        <Component {...pageProps} />
      </ModalContextProvider>
    </ApolloProvider>
  );
}

export default MyApp;
