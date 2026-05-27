import axios from 'axios';

// Pull keys safely from environmental configuration
const API_KEY = import.meta.env.VITE_RAPID_API_KEY || import.meta.env.VITE_API_KEY || '';
const NATIVE_HOST = 'v3.football.api-sports.io';
const PROXY_HOST = 'free-api-live-football-data.p.rapidapi.com';

// Detect if we should route to the RapidAPI Proxy or use Sports API native endpoints
const isRapidApiProxy = !import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE_URL.includes(PROXY_HOST);

const baseURL = isRapidApiProxy 
  ? `https://${PROXY_HOST}` 
  : (import.meta.env.VITE_API_BASE_URL || `https://${NATIVE_HOST}`);

const apiClient = axios.create({
  baseURL,
  timeout: 18000, // 18 seconds timeout for sports metrics
  headers: {
    'x-rapidapi-key': API_KEY,
    'x-apisports-key': API_KEY,
    'Accept': 'application/json',
  }
});

// Configure client host headers based on dynamic environment setup
apiClient.interceptors.request.use((config) => {
  if (isRapidApiProxy) {
    config.headers['x-rapidapi-host'] = PROXY_HOST;
  } else {
    config.headers['x-apisports-host'] = NATIVE_HOST;
  }
  
  const rawUrl = config.url || '';
  const cleanUrl = '/' + rawUrl.replace(/^\//, '');

  // Dynamic Free API Endpoint Adapter Layer
  if (isRapidApiProxy) {
    if (cleanUrl === '/fixtures') {
      const isLive = config.params?.live === 'all';
      const id = config.params?.id;

      if (id) {
        config.url = '/football-get-match-all-details';
        config.params = { matchid: id };
      } else if (isLive) {
        config.url = '/football-get-all-popular-matches';
        config.params = {};
      } else if (config.params?.date) {
        config.url = '/football-get-all-matches-by-date';
        config.params = { date: config.params.date };
      } else {
        config.url = '/football-get-all-popular-matches';
        config.params = {};
      }
    } else if (cleanUrl === '/fixtures/events' || cleanUrl === '/fixtures/statistics' || cleanUrl === '/fixtures/lineups') {
      const id = config.params?.fixture;
      config.url = '/football-get-match-all-details';
      config.params = { matchid: id };
    } else if (cleanUrl === '/standings') {
      const leagueId = config.params?.league;
      const season = config.params?.season;
      config.url = '/football-get-all-standings-by-league';
      config.params = { leagueid: leagueId, season: season || '2025' };
    } else if (cleanUrl === '/players/topscorers') {
      config.url = '/football-get-all-top-scorers';
      const leagueId = config.params?.league;
      config.params = { leagueid: leagueId };
    } else if (cleanUrl === '/players/topassists') {
      config.url = '/football-get-all-top-assists';
      const leagueId = config.params?.league;
      config.params = { leagueid: leagueId };
    } else if (cleanUrl === '/teams') {
      const teamId = config.params?.id;
      config.url = '/football-get-team-all-details';
      config.params = { teamid: teamId };
    } else if (cleanUrl === '/players/squads') {
      const teamId = config.params?.team;
      config.url = '/football-get-team-squad';
      config.params = { teamid: teamId };
    } else if (cleanUrl === '/players') {
      const playerId = config.params?.id;
      config.url = '/football-get-player-all-details';
      config.params = { playerid: playerId };
    }
  }

  return config;
});

// Response Interceptor for Error Translation and caching fallback triggers
apiClient.interceptors.response.use(
  (response) => {
    // API-Football and rapidapi proxy sometimes return 200 OK with custom inner arrays or error payloads
    const { data } = response;
    if (data && data.errors && Object.keys(data.errors).length > 0) {
      const errorMsg = JSON.stringify(data.errors);
      console.warn('API Response contains warning/errors payload:', errorMsg);
      // If key is empty or suspended, let it fail fast rather than returning empty lists
      if (errorMsg.includes('token') || errorMsg.includes('limit') || errorMsg.includes('key')) {
        return Promise.reject(new Error(`API Error: ${errorMsg}`));
      }
    }
    return response;
  },
  async (error) => {
    console.error('Axios Error occurred:', error.message || error);
    
    // We can inject offline / mock fallbacks here or bubble them up
    return Promise.reject(error);
  }
);

export default apiClient;
