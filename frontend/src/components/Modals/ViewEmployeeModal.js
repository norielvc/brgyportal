import { useEffect } from 'react';
import { X, Mail, Calendar, Clock, Shield, AlertCircle, UserCircle, Briefcase, Activity, Fingerprint } from 'lucide-react';

export default function ViewEmployeeModal({ employee, onClose }) {

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

  if (!employee) return null;

  const formatDate = (date) => {
    if (!date) return 'NEVER LOGGED';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'SHORT',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).toUpperCase();
  };

  const statusMap = {
    active: { color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20', label: 'AUTHORIZED ACCESS' },
    inactive: { color: 'text-amber-500 bg-amber-500/10 border-amber-500/20', label: 'INACTIVE ACCOUNT' },
    suspended: { color: 'text-rose-500 bg-rose-500/10 border-rose-500/20', label: 'ACCESS REVOKED' },
  };

  const roleMap = {
    super_admin: { color: 'text-purple-600 bg-purple-50 border-purple-100', label: 'SYSTEM SUPER ADMIN' },
    admin: { color: 'text-indigo-600 bg-indigo-50 border-indigo-100', label: 'ADMINISTRATOR' },
    captain: { color: 'text-blue-600 bg-blue-50 border-blue-100', label: 'BRGY. CAPTAIN' },
    secretary: { color: 'text-cyan-600 bg-cyan-50 border-cyan-100', label: 'BRGY. SECRETARY' },
    staff: { color: 'text-teal-600 bg-teal-50 border-teal-100', label: 'BRGY. STAFF' },
    user: { color: 'text-gray-600 bg-gray-50 border-gray-100', label: 'LEGACY USER' },
  };

  const statusInfo = statusMap[employee.status] || { color: 'text-gray-500 bg-gray-50 border-gray-100', label: 'UNKNOWN' };
  const roleInfo = roleMap[employee.role] || { color: 'text-gray-500 bg-gray-50 border-gray-100', label: 'UNKNOWN' };

  return (
    <div className="fixed inset-0 z-[110] overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-gray-900/60 backdrop-blur-md transition-opacity animate-in fade-in duration-300"
          onClick={onClose}
        />

        {/* Modal Content */}
        <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden border border-white/20 animate-in zoom-in-95 duration-200">
          {/* Premium Header */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 px-10 py-12 text-white relative">
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="bg-white/10 backdrop-blur-md p-0.5 rounded-full border border-white/20 shadow-2xl">
                  <div className="bg-gradient-to-br from-blue-500 to-indigo-600 w-24 h-24 rounded-full flex items-center justify-center text-4xl font-black border-4 border-white/10 shadow-inner">
                    {employee.firstName?.[0]}{employee.lastName?.[0]}
                  </div>
                </div>
                <div>
                  <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] mb-2 px-1">Identity Profile</p>
                  <h2 className="text-4xl font-black uppercase tracking-tight leading-none mb-3">
                    {employee.firstName} {employee.lastName}
                  </h2>
                  <div className="flex gap-2">
                    <span className={`px-3 py-1.5 rounded-xl border font-black text-[9px] uppercase tracking-wider ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl"></div>
          </div>

          {/* Content */}
          <div className="p-10 space-y-10">
            {/* Primary Info Grid */}
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <Briefcase className="w-3 h-3 text-blue-600" />
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Designation</p>
                </div>
                <p className="text-sm font-black text-gray-900 uppercase tracking-tight bg-gray-50 p-4 rounded-2xl border-2 border-transparent">
                  {employee.position || 'UNSPECIFIED'}
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-3 h-3 text-indigo-600" />
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">System Permissions</p>
                </div>
                <div className={`p-4 rounded-2xl border-2 font-black text-xs uppercase tracking-wider ${roleInfo.color}`}>
                  {roleInfo.label}
                </div>
              </div>
            </div>

            {/* Extended Details */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2 border-b border-gray-100 pb-2 text-gray-400">
                <Fingerprint className="w-4 h-4" />
                <h3 className="text-[10px] font-black uppercase tracking-widest">Metadata Repository</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-5 p-4 bg-gray-50/50 rounded-2xl border border-gray-100/50">
                  <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                    <Mail className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Security Email</p>
                    <p className="text-xs font-bold text-gray-900">{employee.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-5 p-4 bg-gray-50/50 rounded-2xl border border-gray-100/50">
                  <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                    <Calendar className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Registration Date</p>
                    <p className="text-xs font-bold text-gray-900">{formatDate(employee.createdAt)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-5 p-4 bg-gray-50/50 rounded-2xl border border-gray-100/50">
                  <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                    <Clock className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Last Access Event</p>
                    <p className="text-xs font-bold text-gray-900">{formatDate(employee.lastLogin)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-5 p-4 bg-gray-50/50 rounded-2xl border border-gray-100/50">
                  <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                    <Activity className="w-5 h-5 text-rose-500" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Engagement Frequency</p>
                    <p className="text-xs font-extrabold text-gray-900">{employee.loginCount || 0} TOTAL SESSIONS</p>
                  </div>
                </div>

                <div className="flex items-center gap-5 p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                  <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                    <Fingerprint className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Employee Code</p>
                    <p className="text-xs font-black text-blue-900 uppercase">{employee.employeeCode || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Alert */}
            {employee.status !== 'active' && (
              <div className="p-5 bg-rose-50 border-2 border-rose-100 rounded-3xl flex items-start gap-4 animate-in slide-in-from-bottom-2">
                <AlertCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-rose-900 text-[11px] font-black uppercase tracking-tight mb-1">Restricted Protocol Engagement</p>
                  <p className="text-rose-700 text-[10px] font-bold leading-relaxed uppercase opacity-80">
                    This personnel account is currently in {employee.status} state. All cryptographic access keys have been invalidated.
                  </p>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="pt-6 mt-4">
              <button
                onClick={onClose}
                className="w-full px-8 py-5 bg-gray-900 text-white rounded-3xl font-black text-[12px] uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl shadow-gray-200 active:scale-95 flex items-center justify-center gap-2"
              >
                Deactivate Interface
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

