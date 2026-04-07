// Token management
export const setAuthToken = (token) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("token", token);
  }
};

export const getAuthToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
};

export const removeAuthToken = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
  }
};

// User data management
export const setUserData = (user) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("user", JSON.stringify(user));
  }
};

export const getUserData = () => {
  if (typeof window !== "undefined") {
    const userData = localStorage.getItem("user");
    return userData ? JSON.parse(userData) : null;
  }
  return null;
};

export const removeUserData = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("user");
  }
};

// Check if user is authenticated
export const isAuthenticated = () => {
  const token = getAuthToken();
  const user = getUserData();
  return !!(token && user);
};

// Check if user has admin role
export const isAdmin = () => {
  const user = getUserData();
  return user?.role === "admin";
};

// Get user role
export const getUserRole = () => {
  const user = getUserData();
  return user?.role || null;
};

// Clear all auth data
export const clearAuthData = () => {
  removeAuthToken();
  removeUserData();
};

// Login helper
export const login = (token, user) => {
  setAuthToken(token);
  setUserData(user);
};

// Logout helper
export const logout = () => {
  clearAuthData();

  // Redirect to login page
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
};
