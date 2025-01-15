// config.js
const config = {
  apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  isProd: process.env.NODE_ENV === 'production',
  // Add more configuration as needed
};

export default config;

// Add error handling middleware
export const handleApiError = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'API request failed');
  }
  return response.json();
};

// Utility for API calls
export const fetchFromApi = async (endpoint, options = {}) => {
  const response = await fetch(`${config.apiUrl}/${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  return handleApiError(response);
};
