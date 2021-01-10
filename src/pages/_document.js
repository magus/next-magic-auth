import Document, { Html, Head, Main, NextScript } from 'next/document';

export default class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }

  render() {
    return (
      <Html>
        <Head>
          {/*
          https://developers.google.com/analytics/devguides/collection/gtagjs/events
          https://developers.google.com/analytics/devguides/collection/gtagjs/sending-data
          */}
          <script async src={`https://www.googletagmanager.com/gtag/js?id=${process.env.GOOGLE_ANALYTICS_UA}`}></script>
          <script
            dangerouslySetInnerHTML={{
              __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', '${process.env.GOOGLE_ANALYTICS_UA}');
          `,
            }}
          />
          <meta httpEquiv="X-UA-Compatible" content="IE=edge" />

          {/* iOS */}
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
