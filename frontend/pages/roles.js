import { useState } from "react";
import { Shield, Plus, Edit2, Trash2, Check, X } from "lucide-react";
import Layout from "@/components/Layout/Layout";
import { useRouter } from "next/router";

export default function RolesPermissions() {
  const router = useRouter();
  const [roles, setRoles] = useState([
    {
      id: 1,
      name: "Administrator",
      description: "Full system access and control",
      color: "bg-red-100 text-red-800",
      permissions: [
        { id: 1, name: "Manage Users", granted: true },
        { id: 2, name: "Manage Roles", granted: true },
        { id: 3, name: "View Reports", granted: true },
        { id: 4, name: "System Settings", granted: true },
        { id: 5, name: "View Logs", granted: true },
        { id: 6, name: "Delete Data", granted: true },
      ],
      userCount: 2,
    },
    {
      id: 2,
      name: "Manager",
      description: "Can manage team members and view reports",
      color: "bg-blue-100 text-blue-800",
      permissions: [
        { id: 1, name: "Manage Users", granted: true },
        { id: 2, name: "Manage Roles", granted: false },
        { id: 3, name: "View Reports", granted: true },
        { id: 4, name: "System Settings", granted: false },
        { id: 5, name: "View Logs", granted: true },
        { id: 6, name: "Delete Data", granted: false },
      ],
      userCount: 0,
    },
    {
      id: 3,
      name: "User",
      description: "Standard user access",
      color: "bg-green-100 text-green-800",
      permissions: [
        { id: 1, name: "Manage Users", granted: false },
        { id: 2, name: "Manage Roles", granted: false },
        { id: 3, name: "View Reports", granted: true },
        { id: 4, name: "System Settings", granted: false },
        { id: 5, name: "View Logs", granted: false },
        { id: 6, name: "Delete Data", granted: false },
      ],
      userCount: 4,
    },
  ]);

  const [expandedRole, setExpandedRole] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);

  const handleCreateRole = () => {
    setShowCreateModal(true);
  };

  const handleEditRole = (role) => {
    setSelectedRole(role);
    setShowEditModal(true);
  };

  const handleDeleteRole = (role) => {
    setSelectedRole(role);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (selectedRole && selectedRole.userCount === 0) {
      setRoles(roles.filter((r) => r.id !== selectedRole.id));
      setShowDeleteModal(false);
      setSelectedRole(null);
    }
  };

  const navigateToUsers = () => {
    router.push("/employees");
  };

  const navigateToLogs = () => {
    router.push("/activity");
  };

  const navigateToSettings = () => {
    router.push("/settings");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Roles & Permissions
          </h1>
          <p className="text-gray-600 mt-1">
            Manage user roles and access control
          </p>
        </div>
        <button
          onClick={handleCreateRole}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create Role
        </button>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map((role) => (
          <div key={role.id} className="card overflow-hidden">
            {/* Role Header */}
            <div className={`p-4 ${role.color}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="w-6 h-6" />
                  <div>
                    <h3 className="font-bold text-lg">{role.name}</h3>
                    <p className="text-sm opacity-75">{role.description}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Role Content */}
            <div className="p-4 space-y-4">
              {/* User Count */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">
                  Users with this role
                </span>
                <span className="font-bold text-lg text-gray-900">
                  {role.userCount}
                </span>
              </div>

              {/* Permissions */}
              <div>
                <button
                  onClick={() =>
                    setExpandedRole(expandedRole === role.id ? null : role.id)
                  }
                  className="w-full text-left font-medium text-gray-900 hover:text-primary-600 transition flex items-center justify-between"
                >
                  <span>
                    Permissions (
                    {role.permissions.filter((p) => p.granted).length}/
                    {role.permissions.length})
                  </span>
                  <span
                    className={`transform transition ${expandedRole === role.id ? "rotate-180" : ""}`}
                  >
                    ▼
                  </span>
                </button>

                {expandedRole === role.id && (
                  <div className="mt-3 space-y-2">
                    {role.permissions.map((perm) => (
                      <div
                        key={perm.id}
                        className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded"
                      >
                        <div
                          className={`w-5 h-5 rounded flex items-center justify-center ${perm.granted ? "bg-green-100" : "bg-gray-100"}`}
                        >
                          {perm.granted ? (
                            <Check className="w-3 h-3 text-green-600" />
                          ) : (
                            <X className="w-3 h-3 text-gray-400" />
                          )}
                        </div>
                        <span
                          className={`text-sm ${perm.granted ? "text-gray-900 font-medium" : "text-gray-500"}`}
                        >
                          {perm.name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleEditRole(role)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                {role.userCount === 0 && (
                  <button
                    onClick={() => handleDeleteRole(role)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-red-300 rounded-lg text-red-700 font-medium hover:bg-red-50 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Permission Reference */}
      <div className="card p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Permission Reference
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              name: "Manage Users",
              desc: "Create, edit, and delete user accounts",
              action: navigateToUsers,
            },
            {
              name: "Manage Roles",
              desc: "Create and modify user roles",
              action: () => {},
            },
            {
              name: "View Reports",
              desc: "Access system reports and analytics",
              action: () => router.push("/reports"),
            },
            {
              name: "System Settings",
              desc: "Configure system-wide settings",
              action: navigateToSettings,
            },
            {
              name: "View Logs",
              desc: "Access activity logs and audit trails",
              action: navigateToLogs,
            },
            {
              name: "Delete Data",
              desc: "Permanently delete system data",
              action: () => {},
            },
          ].map((perm, idx) => (
            <button
              key={idx}
              onClick={perm.action}
              className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition text-left"
            >
              <p className="font-medium text-gray-900">{perm.name}</p>
              <p className="text-sm text-gray-600 mt-1">{perm.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Best Practices */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-bold text-blue-900 mb-3">Best Practices</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>
            • Always follow the principle of least privilege - grant only
            necessary permissions
          </li>
          <li>• Regularly review and audit user roles and permissions</li>
          <li>
            • Create specific roles for different departments or functions
          </li>
          <li>• Document the purpose and permissions of each role</li>
          <li>• Avoid assigning admin roles to regular users</li>
        </ul>
      </div>

      {/* Create Role Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4 flex items-center justify-between text-white shrink-0">
              <h2 className="text-lg font-bold">Create New Role</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-white hover:bg-white hover:bg-opacity-20 p-1 rounded"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="label">Role Name</label>
                <input
                  type="text"
                  placeholder="e.g., Manager"
                  className="input"
                />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea
                  placeholder="Describe this role..."
                  className="input"
                  rows="3"
                ></textarea>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 btn-primary"
                >
                  Create Role
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {showEditModal && selectedRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4 flex items-center justify-between text-white shrink-0">
              <h2 className="text-lg font-bold">
                Edit Role: {selectedRole.name}
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-white hover:bg-white hover:bg-opacity-20 p-1 rounded"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="label">Role Name</label>
                <input
                  type="text"
                  defaultValue={selectedRole.name}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea
                  defaultValue={selectedRole.description}
                  className="input"
                  rows="3"
                ></textarea>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 btn-primary"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full flex flex-col max-h-[90vh]">
            <div className="bg-red-50 border-b border-red-200 px-6 py-4 flex items-center justify-between shrink-0">
              <h2 className="text-lg font-bold text-gray-900">Delete Role</h2>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-600 hover:bg-red-100 p-1 rounded"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <p className="text-gray-600">
                Are you sure you want to delete the{" "}
                <strong>{selectedRole.name}</strong> role? This action cannot be
                undone.
              </p>
              <div className="flex gap-3 pt-6">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

RolesPermissions.getLayout = (page) => (
  <Layout
    title="Roles & Permissions"
    subtitle="Manage user roles and access control"
  >
    {page}
  </Layout>
);
