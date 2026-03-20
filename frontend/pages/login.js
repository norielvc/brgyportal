import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Eye, EyeOff, AlertCircle, ArrowLeft, Shield, Lock, Mail } from 'lucide-react';
import { login } from '@/lib/auth';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const [tenantConfig] = useState({
    name: "LGU HUB PORTAL",
    shortName: "LGU Hub",
    logo: "/lgu-hub-logo.png",
    colors: {
      primary: "slate-800",
      primaryHover: "black",
      primaryText: "text-slate-700",
      primaryGradient: "from-slate-700 via-slate-800 to-slate-900",
      bgGradient: "from-white via-slate-50 to-slate-100",
      accentGradient: "from-slate-600/10 via-transparent to-slate-700/15",
      bubble1: "from-blue-200/20 to-indigo-300/10",
      bubble2: "from-slate-100/40 to-blue-200/20",
      border: "border-slate-200",
      focusRing: "focus:ring-slate-600",
      focusBorder: "focus:border-slate-600",
      btnGradient: "from-[#1e293b] to-[#0f172a]"
    }
  });

  // Unified login no longer needs to detect tenant ID from URL before logging in
  // The backend will identify the correct tenant based on the email address.

  const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api').replace(/\/$/, '').replace(/\/api$/, '') + '/api';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        login(data.data.token, data.data.user);
        if (data.data.user?.role === 'SuperAdmin') {
          router.push('/superadmin');
        } else {
          router.push('/dashboard');
        }
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Unable to connect to server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden relative flex flex-col">
      {/* Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${tenantConfig.colors.bgGradient}`}>
        <div className={`absolute inset-0 bg-gradient-to-tr ${tenantConfig.colors.accentGradient}`} />
        <div className={`absolute -top-32 -right-32 w-64 h-64 bg-gradient-to-br ${tenantConfig.colors.bubble1} rounded-full blur-3xl`} />
        <div className={`absolute -bottom-32 -left-32 w-64 h-64 bg-gradient-to-br ${tenantConfig.colors.bubble2} rounded-full blur-3xl`} />
      </div>

      {/* Top Nav */}
      <div className="relative z-20 px-6 py-3 flex-shrink-0">
        <button
          onClick={() => router.push('/')}
          className="group inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-black text-white rounded-full transition-all duration-300 shadow-md text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Portal
        </button>
      </div>

      {/* Main Content — fills remaining height */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6 pb-2">
        <div className="w-full max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

            {/* Left — Branding */}
            <div className="hidden lg:block text-left space-y-6">
              <div className="space-y-3">
                <h1 className="text-6xl xl:text-8xl font-black leading-tight tracking-tighter">
                  <span className={`text-transparent bg-clip-text bg-gradient-to-r ${tenantConfig.colors.primaryGradient}`}>
                    {tenantConfig.name}
                  </span>
                </h1>
              </div>

              <div className="w-36 h-1.5 bg-slate-800 rounded-full" />

              <div className="inline-flex items-center gap-3 px-6 py-3 bg-slate-800 text-white rounded-full shadow-lg border border-slate-700">
                <Shield className="w-5 h-5" />
                <span className="text-base font-bold tracking-wider">SECURE PORTAL</span>
              </div>

              <p className="text-gray-600 text-lg leading-relaxed max-w-sm font-medium">
                Your gateway to efficient municipal management and digital governance
              </p>
            </div>

            {/* Right — Login Card */}
            <div className="flex justify-center lg:justify-end">
              <div className="w-full max-w-sm">
                <div className={`bg-white/85 backdrop-blur-xl rounded-2xl shadow-2xl border ${tenantConfig.colors.border} p-6 space-y-4`}>

                  {/* Logo + Header */}
                  <div className="text-center">
                    <img
                      src={tenantConfig.logo}
                      alt="LGU Hub Logo"
                      className="w-16 h-16 object-contain drop-shadow-md mx-auto mb-2"
                    />
                    <h2 className="text-2xl font-bold text-gray-800">Welcome Back</h2>
                    <p className="text-gray-500 text-sm mt-1">Sign in to your management dashboard</p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-3">
                    {error && (
                      <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-xl">
                        <AlertCircle className="w-4 h-4 text-red-500 mr-2 flex-shrink-0" />
                        <p className="text-xs text-red-700">{error}</p>
                      </div>
                    )}

                    {/* Email */}
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-gray-700">Email Address</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="w-4 h-4 text-gray-400" />
                        </div>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className={`w-full pl-10 pr-3 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 ${tenantConfig.colors.focusRing} ${tenantConfig.colors.focusBorder} transition-all text-gray-900 placeholder-gray-400 text-sm`}
                          placeholder="Enter your email"
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-gray-700">Password</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="w-4 h-4 text-gray-400" />
                        </div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className={`w-full pl-10 pr-10 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 ${tenantConfig.colors.focusRing} ${tenantConfig.colors.focusBorder} transition-all text-gray-900 placeholder-gray-400 text-sm`}
                          placeholder="Enter your password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Remember Me & Forgot Password */}
                    <div className="flex items-center justify-between">
                      <label className="flex items-center cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className={`w-3.5 h-3.5 text-${tenantConfig.colors.primary} bg-white border-gray-300 rounded ${tenantConfig.colors.focusRing}`}
                        />
                        <span className="ml-2 text-xs text-gray-600">Remember me</span>
                      </label>
                      <button
                        type="button"
                        className={`text-xs text-${tenantConfig.colors.primary} hover:opacity-80 font-medium transition-colors`}
                      >
                        Forgot password?
                      </button>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="group relative w-full bg-slate-800 hover:bg-black disabled:bg-slate-400 text-white py-3 rounded-xl font-bold text-sm transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl disabled:cursor-not-allowed overflow-hidden mt-1"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                      <span className="relative flex items-center justify-center gap-2">
                        {isLoading ? (
                          <>
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Signing in...
                          </>
                        ) : (
                          <>
                            <Shield className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                            Sign In to Dashboard
                          </>
                        )}
                      </span>
                    </button>
                  </form>

                  {/* Footer */}
                  <div className="pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-center gap-2 text-gray-400 text-xs">
                      <Shield className="w-3.5 h-3.5" />
                      <span>Secured with 256-bit encryption</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      <div className="relative z-10 flex-shrink-0 text-center py-2 px-6">
        <p className="text-gray-500 text-xs">
          &copy; 2026 {tenantConfig.name}. All rights reserved.
        </p>
      </div>
    </div>
  );
}