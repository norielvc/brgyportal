import { useState, useEffect } from 'react';
import { X, KeyRound, AlertCircle, ShieldCheck, RefreshCw } from 'lucide-react';

export default function ResetPasswordModal({ employee, onClose, onSubmit, isLoading: externalIsLoading }) {

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      if (typeof window !== 'undefined') {
        document.body.style.overflow = '';
      }
    };
  }, []);

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [internalIsLoading, setInternalIsLoading] = useState(false);

    const isLoading = externalIsLoading || internalIsLoading;

    const generatePassword = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
        let password = '';
        for (let i = 0; i < 16; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setNewPassword(password);
        setConfirmPassword(password);
        setShowPassword(true);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (newPassword.length < 6) {
            setError('Password complexity requirements not met (min 6 chars)');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Credential mismatch: Passwords do not match');
            return;
        }

        setInternalIsLoading(true);
        try {
            await onSubmit(newPassword);
        } catch (err) {
            setError(err.message);
        } finally {
            setInternalIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                {/* Backdrop */}
                <div
                    className="fixed inset-0 bg-gray-900/60 backdrop-blur-md transition-opacity animate-in fade-in duration-300"
                    onClick={onClose}
                />

                {/* Modal Content */}
                <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-white/20 animate-in zoom-in-95 duration-200">
                    {/* Premium Header */}
                    <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-10 py-10 text-white relative">
                        <div className="relative z-10 flex items-center justify-between">
                            <div className="flex items-center gap-5">
                                <div className="bg-white/20 backdrop-blur-md p-4 rounded-3xl border border-white/20 shadow-lg">
                                    <KeyRound className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black uppercase tracking-tight leading-none mb-1">Secure Reset</h2>
                                    <p className="text-amber-100 text-[10px] font-bold uppercase tracking-[0.2em]">{employee.firstName} {employee.lastName}</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/10 transition-all group"
                            >
                                <X className="w-5 h-5 text-white group-hover:rotate-90 transition-transform" />
                            </button>
                        </div>
                        {/* Decorative Elements */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-400/10 rounded-full -ml-16 -mb-16 blur-2xl"></div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-10 space-y-6">

                        {/* User Context */}
                        <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100 flex items-center gap-4">
                            <div className="bg-white p-2 rounded-xl border border-amber-100 shadow-sm">
                                <ShieldCheck className="w-5 h-5 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest mb-0.5">Target Account</p>
                                <p className="text-xs font-mono font-bold text-gray-700">{employee.email}</p>
                            </div>
                        </div>

                        {/* Error Display */}
                        {error && (
                            <div className="p-4 bg-rose-50 border-2 border-rose-100 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                                <p className="text-rose-900 text-[10px] font-black uppercase tracking-tight leading-relaxed">{error}</p>
                            </div>
                        )}

                        {/* Password Fields */}
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between px-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">New Credentials</label>
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="text-[9px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wider transition-colors"
                                    >
                                        {showPassword ? 'Hide Key' : 'Show Key'}
                                    </button>
                                </div>
                                <div className="relative group">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all font-mono font-bold text-gray-900 text-sm tracking-widest"
                                        placeholder="••••••••••••"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Confirm Credentials</label>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all font-mono font-bold text-gray-900 text-sm tracking-widest"
                                    placeholder="••••••••••••"
                                    required
                                />
                            </div>
                        </div>

                        {/* Generator Button */}
                        <button
                            type="button"
                            onClick={generatePassword}
                            className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50 transition-all flex items-center justify-center gap-2 group"
                        >
                            <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                            Auto-Generate Strong Key
                        </button>

                        {/* Footer Buttons */}
                        <div className="flex gap-4 pt-6 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-6 py-4 bg-gray-50 text-gray-400 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-gray-100 hover:text-gray-600 transition-all border border-transparent hover:border-gray-200"
                            >
                                Abort
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex-2 px-10 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-amber-200 hover:shadow-orange-300 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <KeyRound className="w-4 h-4" />
                                        Override
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
        </div>
    );
}

