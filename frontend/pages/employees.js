import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  KeyRound,
  User,
  Mail,
  Shield,
  Activity,
  Clock,
  MoreVertical,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Users as UsersIcon
} from 'lucide-react';
import Layout from '@/components/Layout/Layout';
import AddEmployeeModal from '@/components/Modals/AddEmployeeModal';
import EditEmployeeModal from '@/components/Modals/EditEmployeeModal';
import ViewEmployeeModal from '@/components/Modals/ViewEmployeeModal';
import DeleteConfirmModal from '@/components/Modals/DeleteConfirmModal';
import ResetPasswordModal from '@/components/Modals/ResetPasswordModal';
import { getAuthToken, logout } from '@/lib/auth'; // Import logout
import { debounce } from '@/lib/utils';
import toast from 'react-hot-toast';

// API Configuration
const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api').replace(/\/$/, '').replace(/\/api$/, '') + '/api';

export default function Employees() {
  const router = useRouter();
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const apiUrl = API_URL;

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      setError('');
      const token = getAuthToken();

      if (!token) {
        logout(); // Logout if no token
        return;
      }

      const response = await fetch(`${apiUrl}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        toast.error('Session expired. Please login again.');
        logout(); // Use auth lib logout
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Access Denied');
      }

      setEmployees(data.data || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching employees:', err);
    } finally {
      setIsLoading(false);
    }
  };




  const handleAddEmployee = async (employeeData) => {
    try {
      setIsSubmitting(true);
      const token = getAuthToken();
      const response = await fetch(`${apiUrl}/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(employeeData)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to add employee');

      toast.success('Employee registered successfully');
      setShowAddModal(false);
      fetchEmployees();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditEmployee = async (employeeId, employeeData) => {
    try {
      setIsSubmitting(true);
      const token = getAuthToken();
      const response = await fetch(`${apiUrl}/users/${employeeId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(employeeData)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to update employee');

      toast.success('Employee record updated');
      setShowEditModal(false);
      setSelectedEmployee(null);
      fetchEmployees();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEmployee = async () => {
    try {
      setIsSubmitting(true);
      const token = getAuthToken();
      const response = await fetch(`${apiUrl}/users/${selectedEmployee._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to delete employee');

      toast.success('Employee record purged');
      setShowDeleteModal(false);
      setSelectedEmployee(null);
      fetchEmployees();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (newPassword) => {
    try {
      setIsSubmitting(true);
      const token = getAuthToken();
      const response = await fetch(`${apiUrl}/users/${selectedEmployee._id}/reset-password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newPassword })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to reset password');

      toast.success('Password synchronized successfully');
      setShowResetPasswordModal(false);
      setSelectedEmployee(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredEmployees = employees.filter(emp =>
    emp.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employeeCode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Search & Actions Top Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between pb-6 border-b border-gray-100">
        <div className="relative w-full md:w-1/3 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="SEARCH PERSONNEL BY NAME OR IDENTITY..."
            className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-black text-gray-900 uppercase text-xs tracking-tight placeholder:font-black placeholder:text-gray-300 shadow-inner"
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="bg-gray-50 px-4 py-2 rounded-xl border border-gray-100 flex items-center gap-3">
            <div className="bg-white p-1.5 rounded-lg border border-gray-100 shadow-sm">
              <Shield className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Active Staff</p>
              <p className="text-[15px] font-black text-gray-800 tracking-tighter leading-none">{employees.length || 0}</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-8 py-3.5 bg-blue-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Register Employee
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-rose-50 border-2 border-rose-100 rounded-3xl p-6 flex items-start gap-4 animate-in fade-in slide-in-from-top-4">
          <div className="bg-rose-100 p-2.5 rounded-xl">
            <AlertCircle className="w-6 h-6 text-rose-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-rose-900 font-black uppercase text-xs tracking-widest mb-1">Secure Connection Error</h3>
            <p className="text-rose-700 text-[11px] font-bold uppercase tracking-tight">{error}</p>
            <button
              onClick={fetchEmployees}
              className="mt-3 px-4 py-1.5 bg-rose-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-rose-700 transition-colors"
            >
              Re-sync Connection
            </button>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-sm overflow-hidden min-h-[500px] flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin rounded-xl h-10 w-10 border-4 border-blue-600 border-t-transparent shadow-lg shadow-blue-100"></div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Decrypting Personnel Vault...</p>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 bg-gray-50/50">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl mb-6 opacity-50">
              <UsersIcon className="w-16 h-16 text-gray-300" />
            </div>
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">No Personnel Found</h3>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1 mb-8">Try adjusting your identification filters</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-10 py-4 bg-gray-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-gray-200"
            >
              Register First Official
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Personnel Identity</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Department & Role</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Security Status</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Telemetry</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Management System</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredEmployees.map((emp) => (
                  <tr key={emp._id} className="group hover:bg-blue-50/30 transition-all">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-black text-lg shadow-sm group-hover:from-blue-600 group-hover:to-indigo-700 group-hover:text-white transition-all">
                            {emp.firstName?.[0]}{emp.lastName?.[0]}
                          </div>
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${emp.status === 'active' ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-[14px] font-black text-gray-900 uppercase tracking-tight group-hover:text-blue-600 transition-colors">
                              {emp.firstName} {emp.lastName}
                            </p>
                            {emp.employeeCode && (
                              <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded text-[9px] font-black tracking-tighter">
                                {emp.employeeCode}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] font-mono font-bold text-gray-400 tracking-tighter truncate max-w-[200px]">
                            {emp.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[9px] font-black tracking-widest uppercase border ${emp.role === 'admin' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                          {emp.role}
                        </span>
                        <p className="text-[11px] font-black text-gray-500 uppercase tracking-tight leading-none mt-1">
                          {emp.position || 'TECHNICAL STAFF'}
                        </p>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        {emp.status === 'active' ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">AUTHORIZED</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-rose-500" />
                            <span className="text-[10px] font-black text-rose-700 uppercase tracking-widest">SUSPENDED</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-mono font-bold uppercase">
                          {emp.lastLogin ? new Date(emp.lastLogin).toLocaleDateString() : 'NO HISTORY'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center">
                        {emp.tenantId === 'demo' ? (
                          <span className="px-2.5 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-lg text-[10px] font-black tracking-widest uppercase">
                            Demo System
                          </span>
                        ) : emp.tenantId === 'ibaoeste' ? (
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-[10px] font-black tracking-widest uppercase">
                            Iba O' Este
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-gray-50 text-gray-400 border border-gray-100 rounded-lg text-[10px] font-black tracking-widest uppercase">
                            {emp.tenantId || 'Global'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setSelectedEmployee(emp); setShowViewModal(true); }}
                          className="p-2.5 hover:bg-white rounded-xl text-gray-400 hover:text-blue-600 hover:shadow-md transition-all border border-transparent hover:border-blue-100"
                          title="Security View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setSelectedEmployee(emp); setShowEditModal(true); }}
                          className="p-2.5 hover:bg-white rounded-xl text-gray-400 hover:text-indigo-600 hover:shadow-md transition-all border border-transparent hover:border-indigo-100"
                          title="Modify Access"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setSelectedEmployee(emp); setShowResetPasswordModal(true); }}
                          className="p-2.5 hover:bg-white rounded-xl text-gray-400 hover:text-amber-600 hover:shadow-md transition-all border border-transparent hover:border-amber-100"
                          title="Reset Credentials"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setSelectedEmployee(emp); setShowDeleteModal(true); }}
                          className="p-2.5 hover:bg-rose-50 rounded-xl text-gray-400 hover:text-rose-600 hover:shadow-md transition-all border border-transparent hover:border-rose-100"
                          title="Revoke Permission"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer Stats */}
      {!isLoading && employees.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'Total Database Entries', value: employees.length, icon: UsersIcon, color: 'text-blue-600' },
            { label: 'Verified Active Staff', value: employees.filter(e => e.status === 'active').length, icon: Activity, color: 'text-emerald-600' },
            { label: 'System Administrators', value: employees.filter(e => ['super_admin', 'admin'].includes(e.role)).length, icon: Shield, color: 'text-indigo-600' },
            { label: 'Restricted Access', value: employees.filter(e => e.status !== 'active').length, icon: XCircle, color: 'text-rose-600' }
          ].map((stat, i) => (
            <div key={i} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className={`p-3 rounded-2xl bg-gray-50 ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
                <p className={`text-xl font-black ${stat.color} tracking-tight`}>{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showAddModal && (
        <AddEmployeeModal
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddEmployee}
          isLoading={isSubmitting}
        />
      )}

      {showViewModal && selectedEmployee && (
        <ViewEmployeeModal
          employee={selectedEmployee}
          onClose={() => { setShowViewModal(false); setSelectedEmployee(null); }}
        />
      )}

      {showEditModal && selectedEmployee && (
        <EditEmployeeModal
          employee={selectedEmployee}
          onClose={() => { setShowEditModal(false); setSelectedEmployee(null); }}
          onSubmit={handleEditEmployee}
          isLoading={isSubmitting}
        />
      )}

      {showDeleteModal && selectedEmployee && (
        <DeleteConfirmModal
          title="Revoke Personnel Access"
          message={`Are you absolutely sure you want to purge the record for ${selectedEmployee.firstName} ${selectedEmployee.lastName}? This action will permanently revoke all biometric and system access.`}
          onConfirm={handleDeleteEmployee}
          onCancel={() => { setShowDeleteModal(false); setSelectedEmployee(null); }}
          isLoading={isSubmitting}
        />
      )}

      {showResetPasswordModal && selectedEmployee && (
        <ResetPasswordModal
          employee={selectedEmployee}
          onClose={() => { setShowResetPasswordModal(false); setSelectedEmployee(null); }}
          onSubmit={handleResetPassword}
          isLoading={isSubmitting}
        />
      )}
    </div>
  );
}

Employees.getLayout = (page) => (
  <Layout
    title="Team & Personnel Management"
    subtitle="ADMINISTRATIVE ACCESS & ROLES CONTROL"
  >
    {page}
  </Layout>
);

// Reset Password Modal Component

// Removed inline ResetPasswordModal since it is now imported.


