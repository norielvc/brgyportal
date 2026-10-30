import Head from "next/head";

/** Server-rendered Open Graph tags (required for Messenger / Facebook crawlers). */
export default function PortalShareHead({ meta }) {
  if (!meta) return null;

  const title = `${meta.shortName} — ${meta.pageTitleSuffix}`;
  const description =
    meta.description ||
    `${meta.shortName} — ${meta.pageDescription}`;
  const canonicalUrl = meta.canonicalUrl || meta.sharePageUrl;
  const fbAppId = process.env.NEXT_PUBLIC_FB_APP_ID;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: meta.shortName,
    url: canonicalUrl,
    description,
    image: meta.shareImageUrl,
  };

  return (
    <Head>
      <meta httpEquiv="content-language" content="fil" />
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      <link rel="image_src" href={meta.shareImageUrl} />

      {fbAppId ? <meta property="fb:app_id" content={fbAppId} /> : null}

      <meta property="og:type" content="website" />
      <meta property="og:locale" content="fil_PH" />
      <meta property="og:site_name" content={meta.shortName} />
      <meta property="og:url" content={meta.sharePageUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={meta.shareImageUrl} />
      <meta property="og:image:secure_url" content={meta.shareImageUrl} />
      <meta property="og:image:type" content="image/jpeg" />
      <meta property="og:image:width" content={String(meta.imageWidth || 1200)} />
      <meta property="og:image:height" content={String(meta.imageHeight || 630)} />
      <meta property="og:image:alt" content={title} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={meta.shareImageUrl} />

      <meta name="theme-color" content={meta.primaryColor || "#112e1f"} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </Head>
  );
}
