import { useState } from "react";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { ArrowLeft, Save, Eye, EyeOff } from "lucide-react";
import Layout from "@/components/Layout/Layout";
import { usersAPI } from "@/lib/api";
import { getUserData } from "@/lib/auth";

export default function CreateUser() {
  const router = useRouter();
  const currentUser = getUserData();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Check if current user is admin
  if (currentUser?.role !== "admin") {
    router.push("/dashboard");
    return null;
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm({
    defaultValues: {
      role: "user",
      status: "active",
    },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);

    try {
      const response = await usersAPI.createUser(data);

      if (response.success) {
        toast.success("User created successfully!");
        router.push("/users");
      }
    } catch (error) {
      console.error("Create user error:", error);
      // Error is handled by axios interceptor
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout title="Create User" subtitle="Add a new user to the system">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Users
          </button>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-gray-900">
              User Information
            </h2>
            <p className="text-sm text-gray-500">
              Fill in the details for the new user
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
                Password *
              </label>
              <div className="relative">
                <input
                  {...register("password", {
                    required: "Password is required",
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
                  placeholder="Enter password"
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
                Password must contain at least one lowercase letter, one
                uppercase letter, and one number
              </p>
            </div>

            {/* Role and Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="role" className="label">
                  Role *
                </label>
                <select
                  {...register("role", { required: "Role is required" })}
                  className={errors.role ? "input-error" : "input"}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
                {errors.role && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.role.message}
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
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.back()}
                className="btn-secondary"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Create User
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
