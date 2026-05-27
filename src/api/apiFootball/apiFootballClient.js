import axios from 'axios';

let baseURL = import.meta.env.VITE_API_FOOTBALL_BASE || 'https://v3.football.api-sports.io';
const apiKey = import.meta.env.VITE_API_FOOTBALL_KEY || '';

// Dynamically intercept remote requests under the browser to use our server-side secure proxy if needed
if (typeof window !== 'undefined' && baseURL.includes('v3.football.api-sports.io') && !apiKey) {
  // Safe default path if proxying is configured on the backend
  baseURL = '/api/api-football';
}

const apiFootballClient = axios.create({
  baseURL,
  timeout: 12000, // 12 seconds timeout
  headers: {
    'x-apisports-key': apiKey,
    'x-rapidapi-host': 'v3.football.api-sports.io'
  }
});

// Request interceptor to clean up relative path slashes if needed
apiFootballClient.interceptors.request.use(
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

// Response interceptor for unified API-Football error reporting
apiFootballClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('Axios API-Football Client Error:', error);
    if (error.response) {
      console.error(`Status Code: ${error.response.status}`, error.response.data);
    } else if (error.request) {
      console.error('Network Error: No response received from API-Football server');
    } else {
      console.error('Request Setup Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default apiFootballClient;
