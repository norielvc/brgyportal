import { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import {
  Search,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Clock,
  FileCheck,
} from "lucide-react";
import Layout from "@/components/Layout/Layout";
import { certificatesAPI } from "@/lib/api";
import { toast } from "react-hot-toast";

export default function TrackStatusLanding() {
  const router = useRouter();
  const [refNumber, setRefNumber] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!refNumber.trim()) {
      toast.error("Please enter a reference number");
      return;
    }

    setLoading(true);
    try {
      const response = await certificatesAPI.getRequestByReference(
        refNumber.trim(),
      );
      if (response.success && response.data) {
        // Redirect to the status page using the ID
        router.push(`/requests/${response.data.id}`);
      } else {
        toast.error("Reference number not found");
      }
    } catch (err) {
      console.error("Tracking error:", err);
      toast.error(err.response?.data?.message || "Reference number not found");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout requireAuth={false}>
      <Head>
        <title>Track My Application | Barangay Iba O' Este</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-700 to-primary-900 flex flex-col items-center justify-center p-6 text-white overflow-hidden relative">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-400 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-2xl w-full relative z-10 text-center">
          <div className="mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20 mb-8 shadow-xl">
              <ShieldCheck className="w-5 h-5 text-blue-300" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-100">
                Official Portal: Iba O' Este
              </span>
            </div>
            <h1 className="text-6xl font-black tracking-tighter leading-none mb-6">
              Track Your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-indigo-100">
                Document Request
              </span>
            </h1>
            <p className="text-blue-100/70 text-lg font-bold uppercase tracking-tight max-w-lg mx-auto leading-relaxed">
              Enter your unique reference number to check the real-time status
              of your application.
            </p>
          </div>

          <form
            onSubmit={handleTrack}
            className="bg-white p-2 rounded-[2.5rem] shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200"
          >
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                <Search className="w-6 h-6 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="E.G. BC-2026-00001"
                value={refNumber}
                onChange={(e) => setRefNumber(e.target.value.toUpperCase())}
                className="w-full pl-16 pr-6 py-6 bg-transparent text-gray-900 font-black uppercase tracking-widest text-lg outline-none placeholder:text-gray-300"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-10 py-6 bg-gray-900 text-white rounded-[2rem] font-black uppercase tracking-[0.15em] text-sm hover:bg-black transition-all active:scale-95 flex items-center gap-3 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Track Progress
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-500">
            {[
              { icon: FileCheck, label: "Submit Form", sub: "Apply Online" },
              { icon: Clock, label: "In Review", sub: "Staff Verification" },
              { icon: ShieldCheck, label: "Approved", sub: "Ready for Pickup" },
            ].map((step, i) => (
              <div
                key={i}
                className="bg-white/5 backdrop-blur-sm p-6 rounded-3xl border border-white/10 flex flex-col items-center"
              >
                <step.icon className="w-8 h-8 text-blue-300 mb-4" />
                <p className="text-[12px] font-black uppercase tracking-widest leading-none mb-1">
                  {step.label}
                </p>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-tight">
                  {step.sub}
                </p>
              </div>
            ))}
          </div>

          <button
            onClick={() => router.push("/")}
            className="mt-12 text-blue-200/50 hover:text-white font-black uppercase tracking-[0.2em] text-[10px] transition-colors"
          >
            Return to Main Portal
          </button>
        </div>
      </div>
    </Layout>
  );
}
