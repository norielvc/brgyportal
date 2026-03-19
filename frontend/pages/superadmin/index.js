import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { 
  Building, 
  Users, 
  Activity, 
  Settings, 
  Plus, 
  MoreVertical,
  CheckCircle,
  XCircle,
  ShieldAlert
} from 'lucide-react';

export default function SuperAdminDashboard() {
  const [tenants, setTenants] = useState([
    {
      id: 'ibaoeste',
      name: "Barangay Iba O' Este",
      domain: 'ibaoesteportal.vercel.app',
      plan: 'Pro',
      status: 'Active',
      requests_this_month: 1250,
      staff_count: 5,
      last_active: 'Just now'
    },
    {
      id: 'demo',
      name: 'Demo System',
      domain: 'demo.ibaoesteportal.vercel.app',
      plan: 'Starter',
      status: 'Active',
      requests_this_month: 45,
      staff_count: 2,
      last_active: '2 hours ago'
    }
  ]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Head>
        <title>Super Admin | LGU Dashboard</title>
      </Head>

      {/* Top Navbar */}
      <nav className="bg-blue-900 border-b border-blue-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-8 h-8 text-white" />
              <span className="text-xl font-bold tracking-wide text-white">LGU Hub</span>
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-red-600 text-white ml-2">SUPER ADMIN</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-8 w-8 rounded-full bg-blue-800 flex items-center justify-center text-white font-bold border border-blue-600">
                SA
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Registered Barangays (Tenants)</h1>
            <p className="text-sm text-gray-500 mt-1">Manage all platforms, billing, and system limits across the municipality.</p>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all shadow-sm">
            <Plus className="w-5 h-5" />
            New Tenant
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center gap-4">
            <div className="bg-blue-50 p-3 rounded-lg"><Building className="w-6 h-6 text-blue-600" /></div>
            <div><p className="text-sm text-gray-500 font-medium">Total Barangays</p><h3 className="text-2xl font-bold text-gray-900">2</h3></div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center gap-4">
            <div className="bg-green-50 p-3 rounded-lg"><Activity className="w-6 h-6 text-green-600" /></div>
            <div><p className="text-sm text-gray-500 font-medium">System Health</p><h3 className="text-2xl font-bold text-gray-900">100%</h3></div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center gap-4">
            <div className="bg-purple-50 p-3 rounded-lg"><Users className="w-6 h-6 text-purple-600" /></div>
            <div><p className="text-sm text-gray-500 font-medium">Total Active Staff</p><h3 className="text-2xl font-bold text-gray-900">7</h3></div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center gap-4">
            <div className="bg-orange-50 p-3 rounded-lg"><Settings className="w-6 h-6 text-orange-600" /></div>
            <div><p className="text-sm text-gray-500 font-medium">Monthly Requests</p><h3 className="text-2xl font-bold text-gray-900">1,295</h3></div>
          </div>
        </div>

        {/* Tenant List Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                  <th className="px-6 py-4">Barangay Name (Tenant)</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Plan & Billing</th>
                  <th className="px-6 py-4">Usage (Requests)</th>
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
                          <a href={`https://${tenant.domain}`} target="_blank" className="text-xs text-blue-600 hover:underline">
                            {tenant.domain}
                          </a>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        tenant.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {tenant.status === 'Active' ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        {tenant.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2.5 py-1 rounded border border-gray-300 bg-white text-xs font-bold text-gray-700 shadow-sm">
                        {tenant.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <span className="font-semibold text-gray-900">{tenant.requests_this_month.toLocaleString()}</span>
                        <span className="text-gray-500 text-xs ml-1">this mo.</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                        <div className={`h-1.5 rounded-full ${tenant.plan === 'Starter' && tenant.requests_this_month > 250 ? 'bg-orange-500' : 'bg-blue-600'}`} style={{ width: tenant.plan === 'Pro' ? '100%' : `${(tenant.requests_this_month / 300) * 100}%` }}></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{tenant.staff_count} members</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-gray-400 hover:text-blue-600 transition-colors p-2 rounded-full hover:bg-blue-50">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}
