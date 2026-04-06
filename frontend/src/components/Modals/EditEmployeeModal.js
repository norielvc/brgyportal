import { useState, useEffect } from 'react';
import { X, AlertCircle, User, Mail, Shield, UserCircle, Briefcase, Lock, CheckCircle2, Save, Building2 } from 'lucide-react';
import { getUserData, getAuthToken } from '@/lib/auth';

const API_URL = '/api';

export default function EditEmployeeModal({ employee, onClose, onSubmit, isLoading: externalIsLoading }) {

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

  const currentUser = getUserData();
  const isSuperAdmin = currentUser?.role === 'superadmin';

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    position: '',
    role: 'staff',
    status: 'active',
    employeeCode: '',
    tenant_id: ''
  });
  const [tenants, setTenants] = useState([]);
  const [errors, setErrors] = useState({});
  const [internalIsLoading, setInternalIsLoading] = useState(false);

  useEffect(() => {
    if (isSuperAdmin) {
      fetchTenants();
    }
  }, [isSuperAdmin]);

  const fetchTenants = async () => {
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_URL}/tenants`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setTenants(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch tenants:', err);
    }
  };

  const isLoading = externalIsLoading || internalIsLoading;

  useEffect(() => {
    if (employee) {
      setFormData({
        firstName: employee.firstName || '',
        lastName: employee.lastName || '',
        email: employee.email || '',
        position: employee.position || '',
        role: employee.role || 'staff',
        status: employee.status || 'active',
        employeeCode: employee.employeeCode || '',
        tenant_id: employee.tenant_id || ''
      });
    }
  }, [employee]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.employeeCode) newErrors.employeeCode = 'Employee code is required';
    if (!/^[A-Z0-9]{3}$/.test(formData.employeeCode)) newErrors.employeeCode = 'Code must be exactly 3 alphanumeric capital letters';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    let { name, value } = e.target;
    if (name === 'employeeCode') {
      value = value.toUpperCase().slice(0, 3);
    }
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setInternalIsLoading(true);
    try {
      await onSubmit(employee._id || employee.id, formData);
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setInternalIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-gray-900/60 backdrop-blur-md transition-opacity animate-in fade-in duration-300"
          onClick={onClose}
        />

        {/* Modal Content */}
        <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-white/20 animate-in zoom-in-95 duration-200">
          {/* Premium Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-blue-700 px-10 py-10 text-white relative">
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="bg-white/20 backdrop-blur-md p-4 rounded-3xl border border-white/20 shadow-lg">
                  <UserCircle className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-black uppercase tracking-tight leading-none mb-1">Update Access</h2>
                  <p className="text-indigo-100 text-[11px] font-bold uppercase tracking-[0.2em]">{employee.firstName} {employee.lastName}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/10 transition-all group"
              >
                <X className="w-6 h-6 text-white group-hover:rotate-90 transition-transform" />
              </button>
            </div>
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-400/10 rounded-full -ml-16 -mb-16 blur-2xl"></div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-10">
            {errors.submit && (
              <div className="mb-8 p-4 bg-rose-50 border-2 border-rose-100 rounded-2xl flex items-center gap-4 animate-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <p className="text-rose-900 text-[11px] font-black uppercase tracking-tight">{errors.submit}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Identity Section */}
              <div className="col-span-1 md:col-span-2">
                <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
                  <User className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Modified Identification</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className={`w-full px-5 py-4 bg-gray-50 border-2 rounded-2xl outline-none transition-all font-bold text-gray-900 uppercase text-xs tracking-tight focus:bg-white ${errors.firstName ? 'border-rose-500 ring-4 ring-rose-500/10' : 'border-transparent focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'}`}
                      placeholder="LEGAL FIRST NAME"
                    />
                    {errors.firstName && <p className="text-rose-500 text-[9px] font-black uppercase px-1 italic">{errors.firstName}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className={`w-full px-5 py-4 bg-gray-50 border-2 rounded-2xl outline-none transition-all font-bold text-gray-900 uppercase text-xs tracking-tight focus:bg-white ${errors.lastName ? 'border-rose-500 ring-4 ring-rose-500/10' : 'border-transparent focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'}`}
                      placeholder="LEGAL LAST NAME"
                    />
                    {errors.lastName && <p className="text-rose-500 text-[9px] font-black uppercase px-1 italic">{errors.lastName}</p>}
                  </div>
                </div>
              </div>

              {/* Contact Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2 border-b border-gray-100 pb-2">
                  <Mail className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Network Identity</h3>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">System Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full px-5 py-4 bg-gray-50 border-2 rounded-2xl outline-none transition-all font-bold text-gray-900 text-xs tracking-tight focus:bg-white ${errors.email ? 'border-rose-500 ring-4 ring-rose-500/10' : 'border-transparent focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'}`}
                      placeholder="staff@systembase.com"
                    />
                    {errors.email && <p className="text-rose-500 text-[9px] font-black uppercase px-1 italic">{errors.email}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Official Position</label>
                      <input
                        type="text"
                        name="position"
                        value={formData.position}
                        onChange={handleChange}
                        className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-gray-900 uppercase text-xs tracking-tight"
                        placeholder="e.g. BARANGAY SECRETARY"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Employee Code</label>
                      <input
                        type="text"
                        name="employeeCode"
                        value={formData.employeeCode}
                        onChange={handleChange}
                        className={`w-full px-5 py-4 bg-gray-100/50 border-2 rounded-2xl outline-none transition-all font-black text-gray-900 uppercase text-xs tracking-tight focus:bg-white ${errors.employeeCode ? 'border-rose-500 ring-4 ring-rose-500/10' : 'border-transparent focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'}`}
                        placeholder="ABC"
                        maxLength={3}
                      />
                      {errors.employeeCode && <p className="text-rose-500 text-[9px] font-black uppercase px-1 italic">{errors.employeeCode}</p>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Permissions Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2 border-b border-gray-100 pb-2">
                  <Shield className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Authorization Matrix</h3>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Privilege Role</label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:bg-white focus:border-indigo-500 outline-none transition-all font-black text-gray-900 uppercase text-[10px] tracking-widest cursor-pointer hover:border-gray-200"
                    >
                      <option value="super_admin">Super Admin</option>
                      <option value="admin">Admin</option>
                      <option value="captain">Brgy. Captain</option>
                      <option value="secretary">Brgy. Secretary</option>
                      <option value="staff">Brgy. Staff</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Security Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:bg-white focus:border-emerald-500 outline-none transition-all font-black text-emerald-700 uppercase text-[10px] tracking-widest cursor-pointer hover:border-gray-200"
                    >
                      <option value="active">Active/Authorized</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended/Locked</option>
                    </select>
                  </div>

                  {isSuperAdmin && (
                    <div className="space-y-2 mt-4 pt-4 border-t border-gray-50">
                      <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest px-1 flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5" /> Administrative Tenant
                      </label>
                      <select
                        name="tenant_id"
                        value={formData.tenant_id}
                        onChange={handleChange}
                        className="w-full px-5 py-4 bg-indigo-50/50 border-2 border-gray-100 rounded-2xl focus:bg-white focus:border-indigo-500 outline-none transition-all font-black text-gray-900 uppercase text-[10px] tracking-widest cursor-pointer hover:border-indigo-100"
                      >
                        <option value="">-- CURRENT TENANT --</option>
                        {tenants.map(t => (
                          <option key={t.id} value={t.id}>{t.name} ({t.id})</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex gap-4 pt-10 mt-8 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-8 py-5 bg-gray-50 text-gray-500 rounded-3xl font-black text-[12px] uppercase tracking-[0.2em] hover:bg-gray-100 transition-all border border-gray-200 shadow-inner active:scale-95"
              >
                Discard Edits
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-2 px-12 py-5 bg-gradient-to-r from-indigo-600 to-blue-700 text-white rounded-3xl font-black text-[12px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-200 hover:shadow-blue-300 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Protocol
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

