import Document, { Html, Head, Main, NextScript } from 'next/document';
import { randomBytes } from 'crypto';

export default class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx);
    const nonce = randomBytes(8).toString('base64');
    return { ...initialProps, nonce };
  }

  render() {
    return (
      <Html lang="en">
        <Head>
          <meta httpEquiv="Content-Security-Policy" content={getCsp(this.props.nonce)} />
          <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
          {/* iOS */}
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          {/*
          https://developers.google.com/analytics/devguides/collection/gtagjs/events
          https://developers.google.com/analytics/devguides/collection/gtagjs/sending-data
          */}
          <script async src={`https://www.googletagmanager.com/gtag/js?id=${process.env.GOOGLE_ANALYTICS_UA}`}></script>
          <script
            nonce={this.props.nonce}
            dangerouslySetInnerHTML={{
              __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', '${process.env.GOOGLE_ANALYTICS_UA}');
          `,
            }}
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

// https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
function getCsp(nonce) {
  const policies = {
    'script-src': ["'self'"],
  };

  // Include nonce for unsafe-inline scripts (e.g. google analytics)
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/script-src#unsafe_inline_script
  if (nonce) {
    policies['script-src'].push(`'nonce-${nonce}'`);
  }

  // In dev we allow 'unsafe-eval', so HMR doesn't trigger the CSP
  if (process.env.NODE_ENV !== 'production') {
    policies['script-src'].push("'unsafe-eval'");
  }
  // Google Analytics
  policies['script-src'].push('www.googletagmanager.com', 'www.google-analytics.com');

  const ContentSecurityPolicy = `
    default-src 'self';
    ${getCSPString('script-src', policies)}
    child-src 'none';
    style-src 'self' 'unsafe-inline';
    img-src * blob: data:;
    media-src 'none';
    connect-src *;
    font-src 'self';
  `;

  return ContentSecurityPolicy.replace(/\n/g, '');
}

const getCSPString = (name, policies) => `${name} ${policies[name].join(' ')};`;
