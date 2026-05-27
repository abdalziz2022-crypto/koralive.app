import axios from 'axios';

let baseURL = import.meta.env.VITE_FOOTBALL_DATA_BASE || 'https://api.football-data.org/v4';
const apiKey = import.meta.env.VITE_FOOTBALL_DATA_KEY || '';

// Dynamically intercept remote requests under the browser to use our server-side secure proxy
if (typeof window !== 'undefined' && baseURL.includes('api.football-data.org')) {
  baseURL = '/api/football-data';
}

const apiClient = axios.create({
  baseURL,
  timeout: 10000, // 10 seconds timeout
  headers: {
    'X-Auth-Token': apiKey
  }
});

// Request interceptor to prevent discarding baseURL path when using relative URLs
apiClient.interceptors.request.use(
  (config) => {
    if (config.baseURL && config.baseURL.startsWith('/')) {
      if (config.url && config.url.startsWith('/')) {
        config.url = config.url.substring(1);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('Axios API Client Error:', error);
    if (error.response) {
      // Server responded with a status outside of 2xx range
      console.error(`Status Code: ${error.response.status}`, error.response.data);
    } else if (error.request) {
      // Request was made but no response received
      console.error('Network Error: No response received');
    } else {
      // Something else happened
      console.error('Request Setup Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
