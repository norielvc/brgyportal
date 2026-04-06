import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import {
  Building, Users, Activity, Settings, Plus, MoreVertical,
  CheckCircle, XCircle, ShieldAlert, X, Eye, EyeOff, Loader2, AlertCircle
} from 'lucide-react';

const API_URL = '/api';

function OnboardModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: '', id: '', domain: '', plan_tier: 'Starter',
    adminFirstName: '', adminLastName: '', adminEmail: '', adminPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Auto-generate tenant ID from name
  const handleNameChange = (val) => {
    setForm(f => ({
      ...f,
      name: val,
      id: val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/tenants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'x-tenant-id': 'ibaoeste' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!data.success) { setError(data.message); return; }
      onSuccess(data.data);
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const field = (label, key, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">{label}</label>
      <input
        type={type} required value={form[key]} placeholder={placeholder}
        onChange={e => key === 'name' ? handleNameChange(e.target.value) : setForm(f => ({ ...f, [key]: e.target.value }))}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Onboard New Barangay</h2>
            <p className="text-xs text-gray-500 mt-0.5">Creates tenant, seeds all defaults, and sets up first admin account</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
          <div className="p-6 space-y-5">
            {/* Barangay Info */}
            <div>
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3">Barangay Info</p>
              <div className="space-y-3">
                {field('Barangay Name *', 'name', 'text', 'e.g. Barangay Sta. Cruz')}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Tenant ID *</label>
                    <input
                      type="text" required value={form.id}
                      onChange={e => setForm(f => ({ ...f, id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                      placeholder="e.g. brgy-sta-cruz"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Plan</label>
                    <select value={form.plan_tier} onChange={e => setForm(f => ({ ...f, plan_tier: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                      <option>Starter</option>
                      <option>Standard</option>
                      <option>Pro</option>
                    </select>
                  </div>
                </div>
                {field('Domain', 'domain', 'text', 'e.g. stacruz.ibaoesteportal.vercel.app')}
              </div>
            </div>

            <div className="border-t border-gray-100" />

            {/* Admin Account */}
            <div>
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3">First Admin Account</p>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {field('First Name', 'adminFirstName', 'text', 'Juan')}
                  {field('Last Name', 'adminLastName', 'text', 'dela Cruz')}
                </div>
                {field('Email *', 'adminEmail', 'email', 'admin@barangay.gov.ph')}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Password *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'} required value={form.adminPassword}
                      onChange={e => setForm(f => ({ ...f, adminPassword: e.target.value }))}
                      placeholder="Min. 6 characters"
                      className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <button type="button" onClick={() => setShowPassword(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />{error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 flex gap-3 shrink-0">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-[2] py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Onboarding...</> : 'Onboard Barangay'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SuccessModal({ data, onClose }) {
  if (!data) return null;
  const tenantName = data?.tenant?.name || data?.name || 'New Barangay';
  const adminUser = data?.adminUser;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">{tenantName} is live</h2>
        <p className="text-sm text-gray-500 mb-6">Tenant onboarded with all defaults seeded.</p>
        {adminUser && (
          <div className="bg-gray-50 rounded-xl p-4 text-left mb-6 space-y-1">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Admin Credentials</p>
            <p className="text-sm text-gray-700"><span className="font-semibold">Name:</span> {adminUser.name}</p>
            <p className="text-sm text-gray-700"><span className="font-semibold">Email:</span> {adminUser.email}</p>
            <p className="text-xs text-gray-400 mt-2">Share the password you set with the barangay admin.</p>
          </div>
        )}
        <button onClick={onClose} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm">
          Done
        </button>
      </div>
    </div>
  );
}

export default function SuperAdminDashboard() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showOnboard, setShowOnboard] = useState(false);
  const [successData, setSuccessData] = useState(null);

  const fetchTenants = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { window.location.href = '/login'; return; }
      const res = await fetch(`${API_URL}/tenants`, {
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': 'ibaoeste' }
      });
      const data = await res.json();
      if (data.success) setTenants(data.data);
      else setError(data.message);
    } catch (err) {
      setError('Failed to load system-wide data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTenants(); }, []);

  const handleOnboardSuccess = (data) => {
    setShowOnboard(false);
    setSuccessData(data);
    fetchTenants(); // refresh list
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Head><title>Super Admin | LGU Dashboard</title></Head>

      {/* Navbar */}
      <nav className="bg-blue-900 border-b border-blue-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-8 h-8 text-white" />
              <span className="text-xl font-bold tracking-wide text-white">LGU Hub</span>
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-red-600 text-white ml-2">SUPER ADMIN</span>
            </div>
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-blue-800 flex items-center justify-center text-white font-bold border border-blue-600">SA</div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Registered Barangays</h1>
            <p className="text-sm text-gray-500 mt-1">Manage all platforms and system limits across the municipality.</p>
          </div>
          <button onClick={() => setShowOnboard(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-sm">
            <Plus className="w-5 h-5" /> New Barangay
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { icon: Building, color: 'blue',   label: 'Total Barangays',    value: tenants.length },
            { icon: Activity, color: 'green',  label: 'System Health',      value: '100%' },
            { icon: Users,    color: 'purple', label: 'Total Active Staff', value: tenants.reduce((s, t) => s + (t.staff_count || 0), 0) },
            { icon: Settings, color: 'orange', label: 'Monthly Requests',   value: tenants.reduce((s, t) => s + (t.requests_this_month || 0), 0).toLocaleString() },
          ].map(({ icon: Icon, color, label, value }) => (
            <div key={label} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center gap-4">
              <div className={`bg-${color}-50 p-3 rounded-lg`}><Icon className={`w-6 h-6 text-${color}-600`} /></div>
              <div><p className="text-sm text-gray-500 font-medium">{label}</p><h3 className="text-2xl font-bold text-gray-900">{value}</h3></div>
            </div>
          ))}
        </div>

        {/* Tenant Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center p-16 gap-3 text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin" /> Loading...
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-500">{error}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                    <th className="px-6 py-4">Barangay</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Plan</th>
                    <th className="px-6 py-4">Requests</th>
                    <th className="px-6 py-4">Staff</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {tenants.map((tenant) => (
                    <tr key={tenant.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded bg-blue-100 flex items-center justify-center text-blue-700 font-bold border border-blue-200">
                            {tenant.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900">{tenant.name}</div>
                            <div className="text-xs text-gray-400 font-mono">{tenant.id}</div>
                            {tenant.domain && (
                              <a href={`https://${tenant.domain}`} target="_blank" rel="noreferrer"
                                className="text-xs text-blue-500 hover:underline">{tenant.domain}</a>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${tenant.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {tenant.status === 'Active' ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                          {tenant.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2.5 py-1 rounded border border-gray-300 bg-white text-xs font-bold text-gray-700 shadow-sm">
                          {tenant.plan_tier}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-semibold text-gray-900 text-sm">{tenant.requests_this_month?.toLocaleString() || 0}</span>
                        <span className="text-gray-400 text-xs ml-1">this mo.</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {tenant.staff_count} members
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button className="text-gray-400 hover:text-blue-600 p-2 rounded-full hover:bg-blue-50">
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {showOnboard && <OnboardModal onClose={() => setShowOnboard(false)} onSuccess={handleOnboardSuccess} />}
      {successData && <SuccessModal data={successData} onClose={() => setSuccessData(null)} />}
    </div>
  );
}
