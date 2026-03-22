import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  Eye, EyeOff, AlertCircle, ArrowLeft, Shield, Lock, Mail,
  FileText, Users, ClipboardList, Globe
} from "lucide-react";
import { login } from "@/lib/auth";

const GOLD = "#C9A84C";

const FEATURES = [
  { icon: FileText,      label: "Certificate Requests",  desc: "10+ document types processed online" },
  { icon: ClipboardList, label: "Workflow Approvals",    desc: "Multi-step configurable approval system" },
  { icon: Users,         label: "Resident Directory",    desc: "Searchable community database" },
  { icon: Globe,         label: "Multi-Tenant Ready",    desc: "One platform for many barangays" },
];

export default function Login() {
  const router = useRouter();
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [isLoading, setIsLoading]       = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]               = useState("");
  const [rememberMe, setRememberMe]     = useState(false);
  const [mounted, setMounted]           = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 40);
    return () => clearTimeout(t);
  }, []);

  const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5005/api")
    .replace(/\/$/, "").replace(/\/api$/, "") + "/api";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const res  = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        login(data.data.token, data.data.user);
        router.push(data.data.user?.role === "SuperAdmin" ? "/superadmin" : "/dashboard");
      } else {
        setError(data.message || "Login failed");
      }
    } catch {
      setError("Unable to connect to server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-root min-h-screen bg-white flex">
      <style suppressHydrationWarning>{`
        .login-root, .login-root * { font-family: 'Google Sans', 'Product Sans', 'Nunito Sans', sans-serif !important; }
        .login-input { width: 100%; background: #f9fafb; border: 1.5px solid #f3f4f6; border-radius: 12px; padding: 14px 16px 14px 48px; font-size: 15px; font-weight: 500; color: #111827; outline: none; transition: border-color 0.2s, background 0.2s; }
        .login-input:focus { background: #fff; border-color: #C9A84C; }
        .login-input::placeholder { color: #d1d5db; font-weight: 400; }
        .login-btn { width: 100%; background: #111827; color: #fff; border: none; border-radius: 12px; padding: 15px; font-size: 14px; font-weight: 700; letter-spacing: 0.04em; cursor: pointer; transition: background 0.2s, transform 0.15s, box-shadow 0.2s; }
        .login-btn:hover:not(:disabled) { background: #000; box-shadow: 0 12px 32px -8px rgba(0,0,0,0.22); transform: translateY(-1px); }
        .login-btn:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>

      <div
        className="hidden lg:flex flex-col justify-between w-[52%] min-h-screen px-16 py-14 relative overflow-hidden"
        style={{ background: "#0f1117" }}
      >
        <div className="absolute top-0 right-0 w-[480px] h-[480px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 70%)", transform: "translate(30%,-30%)" }} />
        <div className="absolute bottom-0 left-0 w-[360px] h-[360px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%)", transform: "translate(-30%,30%)" }} />

        <div className={`relative z-10 transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-2 text-sm font-medium mb-14 transition-colors"
            style={{ color: "rgba(255,255,255,0.35)" }}
            onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.7)"}
            onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.35)"}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to BrgyDesk
          </button>

          <div className="mb-12">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(201,168,76,0.15)" }}>
                <Shield className="w-5 h-5" style={{ color: GOLD }} />
              </div>
              <div>
                <span className="text-xl font-bold text-white tracking-tight">BrgyDesk</span>
                <span className="block text-[9px] font-semibold uppercase tracking-widest mt-0.5" style={{ color: GOLD }}>Barangay Management</span>
              </div>
            </div>

            <h2 className="text-4xl font-bold text-white leading-tight tracking-tight mb-5">
              The complete digital<br />
              system for your<br />
              <span style={{ color: GOLD }}>barangay.</span>
            </h2>
            <p className="text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.45)", maxWidth: 380 }}>
              Manage certificates, residents, officials, and relief operations from one secure platform.
            </p>
          </div>

          <div className="space-y-5">
            {FEATURES.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(201,168,76,0.12)" }}>
                  <Icon className="w-4 h-4" style={{ color: GOLD }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{label}</p>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.38)" }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          className={`relative z-10 flex gap-10 pt-10 border-t transition-all duration-700 delay-200 ${mounted ? "opacity-100" : "opacity-0"}`}
          style={{ borderColor: "rgba(255,255,255,0.07)" }}
        >
          {[{ v: "10+", l: "Certificate Types" }, { v: "100%", l: "RA 10173 Compliant" }, { v: "24/7", l: "Cloud Access" }].map(s => (
            <div key={s.l}>
              <p className="text-2xl font-bold text-white">{s.v}</p>
              <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-white relative">
        <div className="lg:hidden absolute top-6 left-6">
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>

        <div className={`w-full max-w-[420px] transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-900">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">BrgyDesk</span>
          </div>

          <div className="mb-10">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">Welcome back</h1>
            <p className="text-sm text-gray-400 font-medium">Sign in to access your dashboard</p>
          </div>

          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl mb-6">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="login-input"
                  placeholder="you@email.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Password</label>
                <button type="button" className="text-xs font-semibold text-gray-400 hover:text-gray-700 transition-colors">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="login-input"
                  style={{ paddingRight: 48 }}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 py-1">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-gray-200 cursor-pointer"
                style={{ accentColor: "#111827" }}
              />
              <label htmlFor="remember" className="text-sm text-gray-500 font-medium cursor-pointer select-none">
                Keep me signed in
              </label>
            </div>

            <button type="submit" disabled={isLoading} className="login-btn">
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-gray-300 font-medium">
              <Shield className="w-3.5 h-3.5" />
              <span>Secure access</span>
            </div>
            <p className="text-xs text-gray-300 font-medium">&copy; 2026 BrgyDesk</p>
          </div>
        </div>
      </div>
    </div>
  );
}
