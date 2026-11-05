/**
 * Warn when localhost uses production Supabase (major egress + data risk).
 */

let warned = false;

export function warnIfLocalhostUsesProductionSupabase() {
  if (warned || process.env.NODE_ENV === "production") return;

  const allowProd = process.env.SUPABASE_ALLOW_PRODUCTION === "true";
  if (allowProd) return;

  const url = (
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    ""
  ).toLowerCase();

  if (!url) return;

  const prodRef = (process.env.SUPABASE_PRODUCTION_PROJECT_REF || "").trim();
  const isLocalRuntime =
    process.env.VERCEL !== "1" &&
    (process.env.NODE_ENV === "development" ||
      !process.env.VERCEL_ENV);

  if (!isLocalRuntime) return;

  const looksLikeProd =
    (prodRef && url.includes(prodRef.toLowerCase())) ||
    (!prodRef && !url.includes("localhost") && url.includes("supabase.co"));

  if (looksLikeProd) {
    warned = true;
    console.warn(
      "[BrgyDesk] Local dev is using a hosted Supabase project. That counts against egress on every poll and list load. " +
        "Use a separate dev project in frontend/.env.local (see DEV_SUPABASE.md), or set SUPABASE_ALLOW_PRODUCTION=true if intentional.",
    );
  }
}
