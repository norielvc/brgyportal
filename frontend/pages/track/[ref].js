import { useEffect } from "react";
import { useRouter } from "next/router";

export default function TrackRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;
    const ref = (router.query.ref || "").trim();
    if (ref) {
      router.replace(`/track-status?ref=${encodeURIComponent(ref)}`);
    } else {
      router.replace("/track-status");
    }
  }, [router.isReady, router.query.ref]);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white">
      <div className="w-10 h-10 border-3 border-white/20 border-t-blue-400 rounded-full animate-spin mb-4" />
      <p className="text-sm font-semibold tracking-wide text-slate-300">
        Redirecting to request tracking...
      </p>
    </div>
  );
}
