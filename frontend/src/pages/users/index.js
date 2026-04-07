import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  MoreVertical,
  UserPlus,
} from "lucide-react";
import toast from "react-hot-toast";
import Layout from "@/components/Layout/Layout";
import { LoadingCard } from "@/components/UI/LoadingSpinner";
import Pagination from "@/components/UI/Pagination";
import Modal, { ConfirmModal } from "@/components/UI/Modal";
import { usersAPI } from "@/lib/api";
import { getUserData } from "@/lib/auth";
import {
  formatDate,
  formatRelativeTime,
  getStatusColor,
  getRoleColor,
  getInitials,
  debounce,
} from "@/lib/utils";

export default function Users() {
  const router = useRouter();
  const currentUser = getUserData();

  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({});

  // Filters and search
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // Check if current user is admin
  if (currentUser?.role !== "admin") {
    router.push("/dashboard");
    return null;
  }

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm, roleFilter, statusFilter, sortBy, sortOrder]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 10,
        ...(searchTerm && { search: searchTerm }),
        ...(roleFilter && { role: roleFilter }),
        ...(statusFilter && { status: statusFilter }),
        sortBy,
        sortOrder,
      };

      const response = await usersAPI.getUsers(params);
      if (response.success) {
        setUsers(response.data.users);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = debounce((value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  }, 300);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      const response = await usersAPI.deleteUser(userToDelete._id);
      if (response.success) {
        toast.success("User deleted successfully");
        fetchUsers();
      }
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const SortButton = ({ field, children }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center space-x-1 text-left font-medium text-gray-500 hover:text-gray-700"
    >
      <span>{children}</span>
      {sortBy === field && (
        <span className="text-xs">{sortOrder === "asc" ? "↑" : "↓"}</span>
      )}
    </button>
  );

  return (
    <Layout title="Users" subtitle="Manage system users and their permissions">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex-1 max-w-lg">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                className="input pl-10"
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Filters */}
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="input"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="input"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>

            <button
              onClick={() => router.push("/users/create")}
              className="btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </button>
          </div>
        </div>

        {/* Users Table */}
        {isLoading ? (
          <LoadingCard message="Loading users..." />
        ) : (
          <div className="card">
            <div className="overflow-x-auto">
              <table className="table">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">
                      <SortButton field="firstName">User</SortButton>
                    </th>
                    <th className="table-header-cell">
                      <SortButton field="email">Email</SortButton>
                    </th>
                    <th className="table-header-cell">
                      <SortButton field="role">Role</SortButton>
                    </th>
                    <th className="table-header-cell">
                      <SortButton field="status">Status</SortButton>
                    </th>
                    <th className="table-header-cell">
                      <SortButton field="lastLogin">Last Login</SortButton>
                    </th>
                    <th className="table-header-cell">
                      <SortButton field="createdAt">Created</SortButton>
                    </th>
                    <th className="table-header-cell">Actions</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {users.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="table-cell">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center mr-3">
                            <span className="text-sm font-medium text-white">
                              {getInitials(user.firstName, user.lastName)}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.loginCount} logins
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="text-sm text-gray-900">
                          {user.email}
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className={`badge ${getRoleColor(user.role)}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span
                          className={`badge ${getStatusColor(user.status)}`}
                        >
                          {user.status}
                        </span>
                      </td>
                      <td className="table-cell">
                        <div className="text-sm text-gray-900">
                          {user.lastLogin
                            ? formatRelativeTime(user.lastLogin)
                            : "Never"}
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="text-sm text-gray-900">
                          {formatDate(user.createdAt)}
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() =>
                              router.push(`/users/${user._id}/edit`)
                            }
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="Edit user"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {user._id !== currentUser._id && (
                            <button
                              onClick={() => {
                                setUserToDelete(user);
                                setShowDeleteModal(true);
                              }}
                              className="p-1 text-gray-400 hover:text-red-600"
                              title="Delete user"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                totalItems={pagination.totalUsers}
                itemsPerPage={pagination.limit}
                onPageChange={setCurrentPage}
              />
            )}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setUserToDelete(null);
          }}
          onConfirm={handleDeleteUser}
          title="Delete User"
          message={`Are you sure you want to delete ${userToDelete?.firstName} ${userToDelete?.lastName}? This action cannot be undone.`}
          confirmText="Delete"
          type="danger"
        />
      </div>
    </Layout>
  );
}
