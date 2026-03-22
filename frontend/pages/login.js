import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Eye, EyeOff, AlertCircle, ArrowLeft, Shield, Lock, Mail,
  FileText, Users, ClipboardList, Globe, CheckCircle, Building2
} from 'lucide-react';
import { login } from '@/lib/auth';

const FEATURES = [
  { icon: FileText,     label: 'Certificate Requests',  desc: '10+ document types processed online' },
  { icon: ClipboardList,label: 'Workflow Approvals',    desc: 'Multi-step configurable approval system' },
  { icon: Users,        label: 'Resident Directory',    desc: 'Searchable community database' },
  { icon: Globe,        label: 'Multi-Tenant Ready',    desc: 'One platform for many barangays' },
  { icon: Building2,    label: 'Official Receipts',     desc: 'Digital OR generation & tracking' },
  { icon: CheckCircle,  label: 'Real-Time Status',      desc: 'Live request tracking for residents' },
];

const STATS = [
  { value: '10+',  label: 'Services' },
  { value: '100%', label: 'Digital'  },
  { value: '24/7', label: 'Access'   },
];

export default function Login() {
  const router = useRouter();
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [isLoading, setIsLoading]   = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]           = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  useEffect(() => {
    // Fix white space and ensure pure black background
    document.body.style.backgroundColor = '#000000'; 
    return () => {
      document.body.style.backgroundColor = '';
    };
  }, []);

  const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api')
    .replace(/\/$/, '').replace(/\/api$/, '') + '/api';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const res  = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        login(data.data.token, data.data.user);
        router.push(data.data.user?.role === 'SuperAdmin' ? '/superadmin' : '/dashboard');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch {
      setError('Unable to connect to server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[134vh] bg-black relative flex flex-col items-center justify-center px-4 lg:px-8 py-10">
      
      {/* ── PERSISTENT BLACK BACKGROUND ────────────────────────── */}
      <div className="fixed inset-0 bg-black -z-50" />
      
      {/* ── BACKGROUND ELEMENTS ──────────────────────────────────── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-amber-200/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-amber-400/5 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-amber-200/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />

      {/* ── MAIN CONTENT CONTAINER ────────────────────────────────── */}
      <div className="relative z-10 w-full px-6 lg:px-24 xl:px-32 flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-20">

        {/* ── BRANDING SECTION ───────────────────────────────────── */}
        <div className="flex-1 flex flex-col space-y-10 py-10 lg:py-0 w-full lg:pr-20">
          
          {/* top row: back button + badge */}
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => router.push(router.query.tenant ? `/?tenant=${router.query.tenant}` : '/')}
              className="group flex items-center gap-2.5 px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-full transition-all text-sm font-medium border border-white/10 backdrop-blur-sm"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>Back to Portal</span>
            </button>

            <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-amber-200/5 border border-amber-200/20 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-100 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-200"></span>
              </span>
              <span className="text-[10px] font-bold text-amber-200 uppercase tracking-[0.2em]">v2.5 · Live System</span>
            </div>
          </div>

          {/* middle: logo + wordmark */}
          <div className="space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6">
              <div className="relative shrink-0">
                <div className="absolute inset-0 bg-amber-200/10 blur-3xl rounded-full" />
                <img src="/logo.png" alt="BrgyDesk" className="relative w-16 h-16 lg:w-24 lg:h-24 object-contain" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-6xl lg:text-7xl xl:text-8xl font-black leading-tight tracking-tight flex items-center gap-1.5 lg:gap-2">
                  <span className="text-white drop-shadow-sm">Brgy</span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-br from-amber-100 via-amber-200 to-amber-400 drop-shadow-sm">Desk</span>
                </h1>
                <p className="text-slate-500 text-xs lg:text-lg font-black tracking-[0.2em] lg:tracking-[0.4em] uppercase mt-4 pl-1">
                  Barangay Management Platform
                </p>
              </div>
            </div>

            <div className="w-16 h-1 bg-gradient-to-r from-amber-200 to-transparent rounded-full" />

            <p className="text-slate-400 text-base lg:text-lg leading-relaxed max-w-xl font-medium text-balance">
              Seamlessly digitizing barangay operations with <span className="text-amber-200 font-bold">secure, efficient, and transparent</span> document processing.
            </p>
          </div>

          {/* bottom: features grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
            {FEATURES.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex flex-col gap-1.5 group cursor-default p-2 hover:bg-white/[0.03] rounded-xl transition-all duration-300">
                <div className="w-8 h-8 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center group-hover:bg-amber-200/10 group-hover:border-amber-200/30 transition-all duration-300">
                  <Icon className="w-3.5 h-3.5 text-amber-200 group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <p className="text-[10px] lg:text-xs font-bold text-white/90 group-hover:text-amber-200 transition-colors uppercase tracking-widest">{label}</p>
                  <p className="text-[9px] text-slate-500 mt-0.5 leading-tight">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* footer row: stats */}
          <div className="pt-6 border-t border-white/5 flex items-center justify-between w-full">
            <div className="flex gap-8 lg:gap-12">
              {STATS.map(({ value, label }) => (
                <div key={label}>
                  <p className="text-xl lg:text-2xl font-black text-white tracking-tight">{value}</p>
                  <p className="text-[8px] lg:text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em] mt-1">{label}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-col items-end gap-1 opacity-40">
              <div className="flex items-center gap-2 text-amber-200/80 text-[8px] lg:text-[9px] font-bold uppercase tracking-widest">
                <Shield className="w-3 h-3" />
                <span>256-bit AES</span>
              </div>
              <p className="text-[8px] text-slate-600 font-bold">Encrypted Standard</p>
            </div>
          </div>
        </div>

        {/* ── LOGIN FORM SECTION ─────────────────────────────────── */}
        <div className="w-full lg:max-w-md shrink-0">
          <div className="w-full relative">
            {/* outer glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 to-yellow-500/10 rounded-[2.5rem] blur-2xl opacity-50" />
            
            {/* card */}
            <div className="relative bg-slate-900/40 backdrop-blur-3xl rounded-[2rem] border border-white/10 p-6 sm:p-8 space-y-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
              
              {/* Decorative accent */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-transparent via-amber-500/40 to-transparent rounded-full" />

              {/* header */}
              <div className="space-y-2">
                <h2 className="text-3xl font-black text-white tracking-tight">Welcome back</h2>
                <div className="flex items-center gap-2">
                  <div className="h-0.5 w-6 bg-amber-500 rounded-full" />
                  <p className="text-slate-400 text-sm font-medium italic">Sign in to your dashboard</p>
                </div>
              </div>

              {/* error */}
              {error && (
                <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-red-200/80 font-medium">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">

                {/* email */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Email Address</label>
                  <div className="relative group/input">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within/input:text-amber-500">
                      <Mail className="w-4 h-4 text-slate-500 group-focus-within/input:text-amber-500 transition-colors" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-11 pr-4 py-4 bg-white/5 border border-white/5 rounded-2xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/50 focus:bg-white/10 transition-all duration-300 text-white placeholder-slate-600 text-sm font-semibold outline-none box-border"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                {/* password */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Password</label>
                  <div className="relative group/input">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within/input:text-amber-500">
                      <Lock className="w-4 h-4 text-slate-500 group-focus-within/input:text-amber-500 transition-colors" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full pl-11 pr-12 py-4 bg-white/5 border border-white/5 rounded-2xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/50 focus:bg-white/10 transition-all duration-300 text-white placeholder-slate-600 text-sm font-semibold outline-none box-border"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-amber-200 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* remember + forgot */}
                <div className="flex items-center justify-between pb-2">
                  <label className="flex items-center gap-2 cursor-pointer group/check">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-white/10 bg-white/5 text-amber-200 focus:ring-amber-200/20"
                    />
                    <span className="text-[11px] text-slate-400 group-hover:text-slate-300 transition-colors font-medium">Keep me signed in</span>
                  </label>
                  <button type="button" className="text-[11px] text-amber-200/80 hover:text-amber-200 font-bold transition-colors">
                    Reset Password?
                  </button>
                </div>

                {/* submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full bg-amber-200/80 hover:bg-amber-100 disabled:bg-slate-900 text-black py-4 rounded-2xl font-black text-xs transition-all duration-300 shadow-[0_12px_24px_-8px_rgba(251,191,36,0.1)] hover:shadow-[0_20px_40px_-12px_rgba(251,191,36,0.2)] disabled:cursor-not-allowed overflow-hidden active:scale-[0.98]"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/40 to-white/0 -skew-x-12 -translate-x-full group-hover:group-enabled:translate-x-full transition-transform duration-1000" />
                  <span className="relative flex items-center justify-center gap-3">
                    {isLoading ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-black" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span className="tracking-widest uppercase text-[10px]">Verifying...</span>
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4 text-slate-900 group-hover:rotate-12 transition-transform" />
                        <span className="tracking-widest uppercase text-[10px]">Secure Login</span>
                      </>
                    )}
                  </span>
                </button>
              </form>

              {/* bottom info */}
              <div className="pt-6 border-t border-white/5 space-y-4">
                <div className="flex items-center justify-center gap-4 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                  <div className="flex items-center gap-1.5 hover:text-slate-400 transition-colors cursor-help">
                    <Shield className="w-3 h-3 text-amber-200/40" />
                    <span>SSL SECURE</span>
                  </div>
                  <div className="w-1 h-1 bg-white/10 rounded-full" />
                  <div className="flex items-center gap-1.5 hover:text-slate-400 transition-colors cursor-help">
                    <Lock className="w-3 h-3 text-amber-200/40" />
                    <span>ENCRYPTED</span>
                  </div>
                </div>
                <p className="text-center text-slate-600 text-[9px] font-medium tracking-wide">
                  &copy; 2026 BrgyDesk Platform. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
