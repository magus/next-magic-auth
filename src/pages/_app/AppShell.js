import * as React from 'react';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { IntlProvider } from 'react-intl';

const DynamicModalContainer = dynamic(() => import('@components/Modal/ModalContainer'));

const TITLE = 'Magic';
const DESCRIPTION = 'magic authentication with just your email, no third parties required';

export default function AppShell({ children, Component, pageProps }) {
  const title = Component && Component.title ? `${TITLE} - ${Component.title}` : TITLE;
  const description = Component && Component.description ? Component.description : DESCRIPTION;

  return (
    <IntlProvider locale="en" defaultLocale="en">
      <Head>
        <title key="title">{title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" key="viewport" />
        <link
          key="favicon"
          rel="icon"
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🪄</text></svg>"
        />

        {/* seo & open graph tags */}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://${process.env.HOSTNAME}`} />
        <meta
          property="og:image"
          content={`https://${process.env.HOSTNAME}/images/demo.8cfb8bec6712b5681f3efafc8030b71e.jpeg`}
        />
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:creator" content="magusnn" />
        <meta property="twitter:creator:id" content="23604692" />

        <meta property="og:locale" content="en_US" />
        <meta name="description" content={description} />
        <meta name="keywords" content="authentication, demo, game" />
      </Head>

      {children}

      <DynamicModalContainer />
    </IntlProvider>
  );
}
