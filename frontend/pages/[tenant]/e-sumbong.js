import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import ESumbongForm from "@/components/Forms/ESumbongForm";
import { getPortalStrings } from "@/lib/portalLang";

const RESERVED = new Set([
  "login",
  "pricing",
  "landing",
  "api",
  "admin",
  "dashboard",
  "help-desk",
]);

export default function TenantESumbongPage({ initialTenantId }) {
  const router = useRouter();
  const p = getPortalStrings();
  const tenantRaw = initialTenantId || router.query.tenant;
  const tenant = (Array.isArray(tenantRaw) ? tenantRaw[0] : tenantRaw || "").toLowerCase();

  const portalHref = tenant ? `/${tenant}#citizen-help` : "/";

  const goBack = () => {
    router.push(portalHref);
  };

  return (
    <>
      <Head>
        <title>
          {p.esumbong} | {tenant || "Barangay"}
        </title>
        <meta name="robots" content="noindex" />
      </Head>

      <div className="min-h-[100dvh] bg-gray-100 flex flex-col">
        <header className="shrink-0 bg-gradient-to-r from-red-600 to-red-700 text-white pt-[max(env(safe-area-inset-top,0px),0.75rem)]">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
            <Link
              href={portalHref}
              className="inline-flex items-center gap-2 text-sm font-semibold text-red-50 hover:text-white mb-4"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden />
              {p.esumbongBackToPortal}
            </Link>
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" aria-hidden />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-bold leading-tight">{p.esumbong}</h1>
                <p className="text-sm text-red-100/95 mt-0.5">{p.esumbongPageSubtitle}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 w-full max-w-7xl mx-auto px-0 sm:px-5 lg:px-8 py-0 sm:py-6 pb-0 sm:pb-[max(calc(1rem+env(safe-area-inset-bottom,0px)),1rem)] flex flex-col min-h-0">
          <div className="flex-1 flex flex-col min-h-0 bg-white sm:rounded-2xl border-y sm:border border-gray-200/80 sm:shadow-sm p-4 sm:p-6 lg:p-8">
            <ESumbongForm
              variant="page"
              publicMode
              isActive
              onSuccess={goBack}
              onCancel={goBack}
            />
          </div>
        </main>
      </div>
    </>
  );
}

export async function getStaticPaths() {
  return { paths: [], fallback: "blocking" };
}

export async function getStaticProps({ params }) {
  const tenant = (params?.tenant || "").toLowerCase();
  if (!tenant || RESERVED.has(tenant)) {
    return { notFound: true };
  }
  return {
    props: {
      initialTenantId: tenant,
    },
  };
}
