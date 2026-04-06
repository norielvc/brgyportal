import { useEffect } from 'react';
import { AlertTriangle, X, Trash2, ShieldAlert } from 'lucide-react';

export default function DeleteConfirmModal({ title, message, onConfirm, onCancel, isLoading }) {

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

  return (
    <div className="fixed inset-0 z-[120] overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
          onClick={onCancel}
        />

        {/* Modal Content */}
        <div className="relative bg-white rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] w-full max-w-sm overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
          {/* Destructive Header */}
          <div className="bg-gradient-to-br from-rose-500 to-rose-700 px-8 py-10 text-white relative text-center">
            <div className="relative z-10 flex flex-col items-center">
              <div className="bg-white/20 backdrop-blur-md p-4 rounded-3xl border border-white/20 shadow-xl mb-4 group ring-8 ring-white/10">
                <Trash2 className="w-10 h-10 text-white animate-bounce" />
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tight leading-none mb-1">{title}</h2>
              <p className="text-rose-100 text-[10px] font-bold uppercase tracking-[0.2em]">Destructive Termination Event</p>
            </div>

            {/* Decorative background icon */}
            <ShieldAlert className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 text-white/5 pointer-events-none" />
          </div>

          {/* Content */}
          <div className="px-8 pt-8 pb-10 text-center">
            <p className="text-gray-500 font-bold text-sm leading-relaxed mb-8">
              {message}
            </p>

            <div className="space-y-3">
              <button
                onClick={onConfirm}
                disabled={isLoading}
                className="w-full px-8 py-5 bg-rose-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-rose-200 hover:bg-rose-700 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Execute Deletion'
                )}
              </button>
              <button
                onClick={onCancel}
                disabled={isLoading}
                className="w-full px-8 py-5 bg-gray-50 text-gray-400 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-gray-100 hover:text-gray-600 transition-all active:scale-95"
              >
                Abort Deletion
              </button>
            </div>
          </div>

          {/* Warning Strip */}
          <div className="bg-rose-50 py-2 text-center border-t border-rose-100">
            <p className="text-[8px] font-black text-rose-400 uppercase tracking-widest">Crucial: This action is permanent and irreversible</p>
          </div>
        </div>
      </div>
    </div>
  );
}

