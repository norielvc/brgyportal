import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { ArrowLeft, Save, Eye, EyeOff } from "lucide-react";
import Layout from "@/components/Layout/Layout";
import { LoadingCard } from "@/components/UI/LoadingSpinner";
import { usersAPI } from "@/lib/api";
import { getUserData } from "@/lib/auth";

export default function EditUser() {
  const router = useRouter();
  const { id } = router.query;
  const currentUser = getUserData();

  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Check permissions
  const canEdit = currentUser?.role === "admin" || currentUser?._id === id;
  const isAdmin = currentUser?.role === "admin";

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm();

  useEffect(() => {
    if (id) {
      fetchUser();
    }
  }, [id]);

  const fetchUser = async () => {
    try {
      const response = await usersAPI.getUser(id);
      if (response.success) {
        const userData = response.data.user;
        setUser(userData);
        reset({
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          role: userData.role,
          status: userData.status,
        });
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      router.push("/users");
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data) => {
    setIsSaving(true);

    try {
      // Remove password if it's empty
      const updateData = { ...data };
      if (!updateData.password) {
        delete updateData.password;
      }

      const response = await usersAPI.updateUser(id, updateData);

      if (response.success) {
        toast.success("User updated successfully!");
        if (isAdmin) {
          router.push("/users");
        } else {
          // If user is editing their own profile, update local user data
          fetchUser();
        }
      }
    } catch (error) {
      console.error("Update user error:", error);
      // Error is handled by axios interceptor
    } finally {
      setIsSaving(false);
    }
  };

  if (!canEdit) {
    router.push("/dashboard");
    return null;
  }

  if (isLoading) {
    return (
      <Layout title="Edit User" subtitle="Update user information">
        <LoadingCard message="Loading user data..." />
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout title="Edit User" subtitle="User not found">
        <div className="text-center py-12">
          <p className="text-gray-500">User not found</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title="Edit User"
      subtitle={`Update ${user.firstName} ${user.lastName}'s information`}
    >
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {isAdmin ? "Back to Users" : "Back to Dashboard"}
          </button>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-gray-900">
              User Information
            </h2>
            <p className="text-sm text-gray-500">
              {isAdmin
                ? "Update user details and permissions"
                : "Update your profile information"}
            </p>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="card-body space-y-6"
          >
            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="firstName" className="label">
                  First Name *
                </label>
                <input
                  {...register("firstName", {
                    required: "First name is required",
                    maxLength: {
                      value: 50,
                      message: "First name must be less than 50 characters",
                    },
                  })}
                  type="text"
                  className={errors.firstName ? "input-error" : "input"}
                  placeholder="Enter first name"
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.firstName.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="lastName" className="label">
                  Last Name *
                </label>
                <input
                  {...register("lastName", {
                    required: "Last name is required",
                    maxLength: {
                      value: 50,
                      message: "Last name must be less than 50 characters",
                    },
                  })}
                  type="text"
                  className={errors.lastName ? "input-error" : "input"}
                  placeholder="Enter last name"
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="label">
                Email Address *
              </label>
              <input
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: "Invalid email address",
                  },
                })}
                type="email"
                className={errors.email ? "input-error" : "input"}
                placeholder="Enter email address"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <div className="relative">
                <input
                  {...register("password", {
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters",
                    },
                    pattern: {
                      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                      message:
                        "Password must contain at least one lowercase letter, one uppercase letter, and one number",
                    },
                  })}
                  type={showPassword ? "text" : "password"}
                  className={
                    errors.password ? "input-error pr-10" : "input pr-10"
                  }
                  placeholder="Leave blank to keep current password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Leave blank to keep current password. If changing, password must
                contain at least one lowercase letter, one uppercase letter, and
                one number.
              </p>
            </div>

            {/* Role and Status (Admin only) */}
            {isAdmin && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="role" className="label">
                    Role *
                  </label>
                  <select
                    {...register("role", { required: "Role is required" })}
                    className={errors.role ? "input-error" : "input"}
                    disabled={user._id === currentUser._id} // Prevent admin from changing their own role
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                  {errors.role && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.role.message}
                    </p>
                  )}
                  {user._id === currentUser._id && (
                    <p className="mt-1 text-sm text-gray-500">
                      You cannot change your own role
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="status" className="label">
                    Status *
                  </label>
                  <select
                    {...register("status", { required: "Status is required" })}
                    className={errors.status ? "input-error" : "input"}
                    disabled={user._id === currentUser._id} // Prevent admin from changing their own status
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                  {errors.status && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.status.message}
                    </p>
                  )}
                  {user._id === currentUser._id && (
                    <p className="mt-1 text-sm text-gray-500">
                      You cannot change your own status
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* User Stats (Read-only) */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                Account Statistics
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Total Logins</p>
                  <p className="font-medium">{user.loginCount || 0}</p>
                </div>
                <div>
                  <p className="text-gray-500">Last Login</p>
                  <p className="font-medium">
                    {user.lastLogin
                      ? new Date(user.lastLogin).toLocaleDateString()
                      : "Never"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Created</p>
                  <p className="font-medium">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Updated</p>
                  <p className="font-medium">
                    {new Date(user.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.back()}
                className="btn-secondary"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={isSaving}>
                {isSaving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Update User
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
