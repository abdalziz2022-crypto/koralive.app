import axios from 'axios';

// Ensure standard Google AI Studio / Gemini api key is NOT utilized as a RapidAPI key
let rawKey = import.meta.env.VITE_RAPID_API_KEY || import.meta.env.VITE_API_KEY || '';
if (rawKey.startsWith('AIzaSy') || rawKey.startsWith('AIza')) {
  rawKey = '';
}
const RAPID_API_KEY = rawKey;
const RAPID_API_HOST = 'free-api-live-football-data.p.rapidapi.com';
const BASE_URL = 'https://free-api-live-football-data.p.rapidapi.com';

const rapidApiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'X-RapidAPI-Key': RAPID_API_KEY,
    'X-RapidAPI-Host': RAPID_API_HOST
  }
});

// Request Interceptor to translate standard endpoints to Free API Live Football Data paths
rapidApiClient.interceptors.request.use(
  (config) => {
    const rawUrl = config.url || '';
    config.originalPath = rawUrl;
    
    // Normalize URL to always start with a single leading slash for comparison
    const cleanUrl = '/' + rawUrl.replace(/^\//, '');
    
    if (cleanUrl === '/fixtures') {
      const hasId = config.params?.id;
      const isLive = config.params?.live === 'all';
      
      if (hasId) {
        config.url = '/football-get-match-all-details';
        config.params.matchid = config.params.id;
        delete config.params.id;
      } else if (isLive) {
        config.url = '/football-get-all-live-matches';
        delete config.params.live;
      } else {
        config.url = '/football-get-all-popular-matches';
      }
    } else if (cleanUrl === '/fixtures/events') {
      config.url = '/football-get-match-all-details';
      if (config.params) {
        config.params.matchid = config.params.fixture;
        delete config.params.fixture;
      }
    } else if (cleanUrl === '/fixtures/statistics') {
      config.url = '/football-get-match-all-details';
      if (config.params) {
        config.params.matchid = config.params.fixture;
        delete config.params.fixture;
      }
    } else if (cleanUrl === '/fixtures/lineups') {
      config.url = '/football-get-match-all-details';
      if (config.params) {
        config.params.matchid = config.params.fixture;
        delete config.params.fixture;
      }
    } else if (cleanUrl === '/standings') {
      config.url = '/football-get-all-standings-by-league';
      if (config.params) {
        if (config.params.league) {
          config.params.leagueid = config.params.league;
          delete config.params.league;
        }
      }
    } else if (cleanUrl === '/players/topscorers') {
      config.url = '/football-get-all-top-scorers';
      if (config.params) {
        if (config.params.league) {
          config.params.leagueid = config.params.league;
          delete config.params.league;
        }
      }
    } else if (cleanUrl === '/players/topassists') {
      config.url = '/football-get-all-top-assists';
      if (config.params) {
        if (config.params.league) {
          config.params.leagueid = config.params.league;
          delete config.params.league;
        }
      }
    } else if (cleanUrl === '/teams') {
      config.url = '/football-get-team-all-details';
      if (config.params) {
        if (config.params.id) {
          config.params.teamid = config.params.id;
          delete config.params.id;
        }
      }
    } else if (cleanUrl === '/players/squads') {
      config.url = '/football-get-team-squad';
      if (config.params) {
        if (config.params.team) {
          config.params.teamid = config.params.team;
          delete config.params.team;
        }
      }
    } else if (cleanUrl === '/players') {
      config.url = '/football-get-player-all-details';
      if (config.params) {
        if (config.params.id) {
          config.params.playerid = config.params.id;
          delete config.params.id;
        }
      }
    } else if (cleanUrl === '/teams/statistics') {
      throw new Error('Endpoint /teams/statistics is not supported by free-api-live-football-data. Triggering fallback.');
    } else if (cleanUrl === '/fixtures/headtohead') {
      throw new Error('Endpoint /fixtures/headtohead is not supported by free-api-live-football-data. Triggering fallback.');
    } else if (cleanUrl === '/odds') {
      throw new Error('Endpoint /odds is not supported by free-api-live-football-data. Triggering fallback.');
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to inspect response and detect errors returned as 200 OK structures, or normal Axios errors
rapidApiClient.interceptors.response.use(
  (response) => {
    const originalPath = response.config?.originalPath;
    
    // Inspect and reshape data based on original requested API-Football endpoint
    if (response.data && response.data.response) {
      if (originalPath === '/fixtures/events') {
        const events = response.data.response[0]?.events || [];
        response.data.response = events;
      } else if (originalPath === '/fixtures/statistics') {
        const stats = response.data.response[0]?.statistics || [];
        response.data.response = stats;
      } else if (originalPath === '/fixtures/lineups') {
        const lineups = response.data.response[0]?.lineups || [];
        response.data.response = lineups;
      }
    }
    
    // API-Football and RapidAPI derivatives sometimes send status 200 OK but with errors in the body
    if (response.data && response.data.errors && Object.keys(response.data.errors).length > 0) {
      console.warn('RapidAPI Live Football Data Service returned internal errors:', response.data.errors);
      response.hasInternalErrors = true;
    }
    return response;
  },
  (error) => {
    console.warn('RapidAPI Live Football Client Warning:', error.message || error);
    if (error.response) {
      if (error.response.status === 429) {
        console.warn('Rate limit triggered (429) for free-api-live-football-data. Operating with cached data fallback.');
      }
    }
    return Promise.reject(error);
  }
);

export { RAPID_API_KEY, RAPID_API_HOST, BASE_URL };
export default rapidApiClient;
