import clsx from "clsx";

// Utility function for conditional class names
export function cn(...inputs) {
  return clsx(inputs);
}

// Format date to readable string
export function formatDate(date, options = {}) {
  if (!date) return "N/A";

  const defaultOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options,
  };

  return new Date(date).toLocaleDateString("en-US", defaultOptions);
}

// Format date with time
export function formatDateTime(date, options = {}) {
  if (!date) return "N/A";

  const defaultOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    ...options,
  };

  return new Date(date).toLocaleDateString("en-US", defaultOptions);
}

// Format relative time (e.g., "2 days ago")
export function formatRelativeTime(date) {
  if (!date) return "N/A";

  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now - past) / 1000);

  if (diffInSeconds < 60) {
    return "Just now";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths > 1 ? "s" : ""} ago`;
  }

  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} year${diffInYears > 1 ? "s" : ""} ago`;
}

// Capitalize first letter
export function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Get initials from name
export function getInitials(firstName, lastName) {
  if (!firstName && !lastName) return "U";

  const first = firstName ? firstName.charAt(0).toUpperCase() : "";
  const last = lastName ? lastName.charAt(0).toUpperCase() : "";

  return `${first}${last}` || "U";
}

// Get full name
export function getFullName(firstName, lastName) {
  if (!firstName && !lastName) return "Unknown User";
  return `${firstName || ""} ${lastName || ""}`.trim();
}

// Get status badge color
export function getStatusColor(status) {
  switch (status?.toLowerCase()) {
    case "active":
      return "badge-success";
    case "inactive":
      return "badge-warning";
    case "suspended":
      return "badge-danger";
    default:
      return "badge-info";
  }
}

// Get role badge color
export function getRoleColor(role) {
  switch (role?.toLowerCase()) {
    case "admin":
      return "badge-info";
    case "user":
      return "badge-success";
    default:
      return "badge-info";
  }
}

// Debounce function
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Generate random color for avatars
export function getRandomColor() {
  const colors = [
    "bg-red-500",
    "bg-blue-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-teal-500",
  ];

  return colors[Math.floor(Math.random() * colors.length)];
}

// Format number with commas
export function formatNumber(num) {
  if (num === null || num === undefined) return "0";
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Calculate percentage change
export function calculatePercentageChange(current, previous) {
  if (!previous || previous === 0) return 0;
  return (((current - previous) / previous) * 100).toFixed(1);
}

// Validate email
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Generate pagination info
export function getPaginationInfo(
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return {
    startItem,
    endItem,
    totalItems,
    currentPage,
    totalPages,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  };
}

// Truncate text
export function truncateText(text, maxLength = 50) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}
