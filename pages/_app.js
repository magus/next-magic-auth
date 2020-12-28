import Head from 'next/head';
import { IntlProvider } from 'react-intl';

import { AuthProvider } from 'src/components/AuthProvider';
import ApolloProvider from 'src/components/ApolloProvider';
import { ModalContextProvider } from 'src/components/Modal';

import 'styles/globals.css';

function MyApp({ Component, pageProps }) {
  return (
    <IntlProvider locale="en" defaultLocale="en">
      <AuthProvider>
        <ApolloProvider>
          <ModalContextProvider>
            <Head>
              <title>Magic</title>
              <meta
                name="viewport"
                content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
                key="viewport"
              />
            </Head>

            <Component {...pageProps} />
          </ModalContextProvider>
        </ApolloProvider>
      </AuthProvider>
    </IntlProvider>
  );
}

export default MyApp;
