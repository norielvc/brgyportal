import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Allow data URLs for signature images */}
        <meta
          httpEquiv="Content-Security-Policy"
          content="img-src 'self' data: blob: https:; object-src 'self' data: 'none';"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}