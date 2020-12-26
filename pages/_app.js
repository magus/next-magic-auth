import Head from 'next/head';

import { AuthProvider } from 'components/AuthProvider';
import ApolloProvider from 'components/ApolloProvider';
import { ModalContextProvider } from 'components/Modal';

import 'styles/globals.css';

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <ApolloProvider>
        <ModalContextProvider>
          <Head>
            <title>Magic</title>
            <meta
              name="viewport"
              content="width=device-width; initial-scale=1.0; maximum-scale=1.0; user-scalable=no"
              key="viewport"
            />
          </Head>

          <Component {...pageProps} />
        </ModalContextProvider>
      </ApolloProvider>
    </AuthProvider>
  );
}

export default MyApp;
