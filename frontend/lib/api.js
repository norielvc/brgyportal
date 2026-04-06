// API Configuration
// API Configuration
export const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export const getApiUrl = (endpoint) => {
  return `${API_URL}${endpoint}`;
};

export const apiCall = async (endpoint, options = {}) => {
  const url = getApiUrl(endpoint);
  const response = await fetch(url, options);
  return response;
};
