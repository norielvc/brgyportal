import axios from "axios";
import Cookies from "js-cookie";
import toast from "react-hot-toast";

// Create axios instance
// MIGRATED: Now routes through internal Next.js /api layer instead of Express port 5005
const rawBase = (process.env.NEXT_PUBLIC_API_URL || "").trim().replace(/\/$/, "");
const baseURL = rawBase
  ? rawBase.endsWith("/api")
    ? rawBase
    : `${rawBase}/api`
  : "/api";

const api = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token and tenant ID
api.interceptors.request.use(
  (config) => {
    // 1. Send the Auth Token - check both cookies and localStorage
    const token =
      Cookies.get("token") ||
      (typeof window !== "undefined" ? localStorage.getItem("token") : null);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 2. Send the Tenant ID for Multi-Tenant Architecture
    // PRIORITY ORDER:
    // A. If user is LOGGED IN → use their verified tenant from their user profile
    // B. If user is NOT logged in → use URL param or hostname for public pages
    let tenantId = null;

    if (typeof window !== "undefined") {
      // Check if user is logged in and has a stored profile
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser && token) {
          const userObj = JSON.parse(storedUser);
          if (userObj?.tenant_id) {
            // Use the logged-in user's real tenant - cannot be spoofed
            tenantId = userObj.tenant_id;
          }
        }
      } catch (e) {
        /* ignore parse errors */
      }

      // If not logged in, detect from URL or hostname (for public pages)
      if (!tenantId) {
        if (window.location.hostname.includes("demo")) {
          tenantId = "demo";
        } else {
          const urlParams = new URLSearchParams(window.location.search);
          const tenantParam = urlParams.get("tenant");
          if (tenantParam) {
            tenantId = tenantParam;
          } else {
            // Public portal path: /{tenant}/...
            const pathSegments = window.location.pathname
              .split("/")
              .filter(Boolean);
            if (pathSegments.length > 0 && !["login", "pricing", "landing", "api", "admin", "dashboard", "help-desk"].includes(pathSegments[0].toLowerCase())) {
              tenantId = pathSegments[0].toLowerCase();
            }
          }
        }
      }
    }

    if (tenantId) {
      config.headers["x-tenant-id"] = tenantId;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const { response } = error;

    if (response) {
      const { status, data } = response;

      // Handle authentication errors
      if (status === 401) {
        Cookies.remove("token");
        Cookies.remove("user");

        // Only redirect if not already on login page
        if (
          typeof window !== "undefined" &&
          !window.location.pathname.includes("/login")
        ) {
          window.location.href = "/login";
        }

        toast.error("Session expired. Please login again.");
        return Promise.reject(error);
      }

      // Handle other HTTP errors
      const message = data?.message || `HTTP Error ${status}`;

      if (status >= 500) {
        toast.error("Server error. Please try again later.");
      } else if (status === 403) {
        toast.error("Access denied. Insufficient permissions.");
      } else if (status === 404) {
        toast.error("Resource not found.");
      } else {
        toast.error(message);
      }
    } else if (error.code === "ECONNABORTED") {
      toast.error("Request timeout. Please check your connection.");
    } else if (error.message === "Network Error") {
      toast.error("Network error. Please check your connection.");
    } else {
      toast.error("An unexpected error occurred.");
    }

    return Promise.reject(error);
  },
);

// Auth API functions
export const authAPI = {
  login: async (credentials) => {
    const response = await api.post("/auth/login", credentials);
    return response.data;
  },

  logout: async () => {
    const response = await api.post("/auth/logout");
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await api.put("/auth/profile", data);
    return response.data;
  },
};

// Users API functions
export const usersAPI = {
  getUsers: async (params = {}) => {
    const response = await api.get("/users", { params });
    return response.data;
  },

  getUser: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  createUser: async (userData) => {
    const response = await api.post("/users", userData);
    return response.data;
  },

  updateUser: async (id, userData) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  deleteUser: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  getUserStats: async () => {
    const response = await api.get("/users/stats/overview");
    return response.data;
  },
};

// Dashboard API functions
export const dashboardAPI = {
  getStats: async () => {
    const response = await api.get("/dashboard/stats");
    return response.data;
  },

  getAnalytics: async (period = "30d") => {
    const response = await api.get("/dashboard/analytics", {
      params: { period },
    });
    return response.data;
  },
};

// Certificates API functions
export const certificatesAPI = {
  getRequests: async (params = {}) => {
    const response = await api.get("/certificates", { params });
    return response.data;
  },

  getRequest: async (id) => {
    const response = await api.get(`/certificates/${id}`);
    return response.data;
  },

  getRequestByReference: async (refNumber) => {
    const response = await api.get(`/certificates/reference/${refNumber}`);
    return response.data;
  },

  getWorkflowHistory: async (requestId) => {
    const response = await api.get(
      `/workflow-assignments/history/${requestId}`,
    );
    return response.data;
  },
};

// Blotter / E-Sumbong API functions
export const blotterAPI = {
  createReport: async (data) => {
    const response = await api.post("/blotter", data);
    return response.data;
  },

  getReports: async (params = {}) => {
    const response = await api.get("/blotter", { params });
    return response.data;
  },

  getReport: async (id) => {
    const response = await api.get(`/blotter/${id}`);
    return response.data;
  },

  updateStatus: async (id, status) => {
    const response = await api.put(`/blotter?id=${id}`, { status });
    return response.data;
  },
};

// Brgy Assistance / inquiry API functions
export const assistanceAPI = {
  create: async (data) => {
    const response = await api.post("/assistance", data);
    return response.data;
  },

  getInquiries: async (params = {}) => {
    const response = await api.get("/assistance", { params });
    return response.data;
  },

  updateStatus: async (id, status) => {
    const response = await api.put(`/assistance?id=${id}`, { status });
    return response.data;
  },
};

// KapChat message API functions
export const kapchatAPI = {
  send: async (data) => {
    const response = await api.post("/kapchat", data);
    return response.data;
  },

  getMessages: async (params = {}) => {
    const response = await api.get("/kapchat", { params });
    return response.data;
  },

  updateStatus: async (id, status) => {
    const response = await api.put(`/kapchat?id=${id}`, { status });
    return response.data;
  },
};

export default api;
