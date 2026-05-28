import axios from 'axios';

// Pull keys safely from environmental configuration
const ENV_API_KEY = 'c68e7851bdbe53f596f0d79299d86d57';
const NATIVE_HOST = 'v3.football.api-sports.io';
const PROXY_HOST = 'free-api-live-football-data.p.rapidapi.com';

// Dynamic API Key override (allows secure configuration from the UI)
export function getActiveApiKey(): string {
  return ENV_API_KEY;
}

// Helper to ensure any base URL has a scheme (e.g., https://)
function formatBaseUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

// Route all client-side requests through our local secure server-side proxy to prevent CORS issues
const baseURL = '/api/football-api';

export interface ApiLog {
  id: string;
  timestamp: string;
  endpoint: string;
  method: string;
  params: any;
  status: 'pending' | 'success' | 'rate-limit' | 'auth-error' | 'network-error' | 'empty-response';
  statusText: string;
  statusCode?: number;
  dataSize?: number;
  isCached: boolean;
  errors?: any;
  responseSample?: any;
}

// Global real-time request tracker for Korea90 V2 verification and audit mode
export const apiTracker = {
  logs: [] as ApiLog[],
  listeners: [] as (() => void)[],
  
  addLog(log: Omit<ApiLog, 'id' | 'timestamp'>): string {
    const id = Math.random().toString(36).substring(2, 11);
    const fullLog: ApiLog = {
      ...log,
      id,
      timestamp: new Date().toLocaleTimeString('ar', { hour12: false })
    };
    this.logs = [fullLog, ...this.logs].slice(0, 40); // Keep last 40 logs
    this.notify();
    return id;
  },
  
  updateLog(id: string, updates: Partial<ApiLog>) {
    const found = this.logs.find(l => l.id === id);
    if (found) {
      Object.assign(found, updates);
      this.notify();
    }
  },
  
  subscribe(callback: () => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(c => c !== callback);
    };
  },
  
  notify() {
    this.listeners.forEach(c => c());
  }
};

const apiClient = axios.create({
  baseURL,
  timeout: 18000, // 18 seconds timeout
  headers: {
    'Accept': 'application/json',
  }
});

// Configure client host headers and tracking dynamically
apiClient.interceptors.request.use((config) => {
  const currentKey = getActiveApiKey();
  
  // Set accurate API authorization headers
  config.headers['x-rapidapi-key'] = currentKey;
  config.headers['x-apisports-key'] = currentKey;
  
  // Identify key provider and set base URL dynamically
  const isApiSports = currentKey.length === 32;
  const isRapidApiFootball = currentKey.length === 50;
  
  let host = NATIVE_HOST;
  let base = `https://${NATIVE_HOST}`;
  let useProxyTranslation = false;

  if (isApiSports) {
    host = NATIVE_HOST;
    base = `https://${NATIVE_HOST}`;
    config.headers['x-apisports-host'] = NATIVE_HOST;
    delete config.headers['x-rapidapi-host'];
  } else if (isRapidApiFootball) {
    host = 'api-football-v1.p.rapidapi.com';
    base = 'https://api-football-v1.p.rapidapi.com';
    config.headers['x-rapidapi-host'] = host;
    delete config.headers['x-apisports-host'];
    
    // Add '/v3' prefix dynamically for standard API-Football RapidAPI endpoints
    const rawUrl = config.url || '';
    if (!rawUrl.startsWith('/v3/') && rawUrl !== '/v3') {
      config.url = '/v3/' + rawUrl.replace(/^\//, '');
    }
  } else {
    // If the key is not standard API-Football, fall back to free proxy endpoints
    host = PROXY_HOST;
    base = `https://${PROXY_HOST}`;
    config.headers['x-rapidapi-host'] = PROXY_HOST;
    delete config.headers['x-apisports-host'];
    useProxyTranslation = true;
  }

  // Keep using local secure server-side proxy to prevent CORS network errors
  config.baseURL = '/api/football-api';
  
  const rawUrl = config.url || '';
  const cleanUrl = '/' + rawUrl.replace(/^\//, '');

  // Dynamic Free API Endpoint Adapter Layer
  if (useProxyTranslation) {
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
    } else if (cleanUrl === '/players/topscrorers' || cleanUrl === '/players/topscorers') {
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

  // Create pending tracking log before sending request
  const logId = apiTracker.addLog({
    endpoint: config.url || '',
    method: config.method?.toUpperCase() || 'GET',
    params: { ...config.params },
    status: 'pending',
    statusText: 'جاري الإرسال...',
    isCached: false
  });
  
  // Attach log metadata to config for easy access in response handler
  (config as any)._logId = logId;

  return config;
});

// Cache Keys and LocalStorage Helper
const getCacheKey = (url: string, params: any) => {
  return `korea90_real_cache_${url}_${JSON.stringify(params || {})}`;
};

// In-memory cache structures
const memoryCache = new Map<string, { data: any; expiry: number }>();
const inFlightRequests = new Map<string, Promise<any>>();

// Clear cache helper
export function clearApiCache() {
  memoryCache.clear();
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('korea90_real_cache_')) {
      localStorage.removeItem(key);
      i--;
    }
  }
}

// Calculate appropriate TTL for caching to reduce API-Football rate limit consumption
function getTTL(url: string, params: any): number {
  const cleanUrl = '/' + url.replace(/^\//, '');
  if (cleanUrl.includes('fixtures')) {
    if (params?.live === 'all') {
      return 15 * 1000; // 15 seconds for live scores
    }
    if (cleanUrl.includes('events') || cleanUrl.includes('statistics') || cleanUrl.includes('lineups')) {
      return 30 * 1000; // 30 seconds for matches details
    }
    return 120 * 1000; // 2 minutes for standard daily fixtures
  }
  if (cleanUrl.includes('standings')) {
    return 1800 * 1000; // 30 minutes for standings
  }
  if (cleanUrl.includes('leagues') || cleanUrl.includes('teams') || cleanUrl.includes('players')) {
    return 3600 * 1000; // 60 minutes for leagues/teams/players info
  }
  return 300 * 1000; // 5 minutes default
}

function getCachedItem(key: string): any | null {
  const mem = memoryCache.get(key);
  if (mem && mem.expiry > Date.now()) {
    return mem.data;
  }
  try {
    const lsItem = localStorage.getItem(key);
    if (lsItem) {
      const parsed = JSON.parse(lsItem);
      if (parsed && parsed.expiry > Date.now()) {
        memoryCache.set(key, { data: parsed.data, expiry: parsed.expiry });
        return parsed.data;
      } else {
        localStorage.removeItem(key);
      }
    }
  } catch (e) {
    console.warn('Error reading local cache:', e);
  }
  return null;
}

function setCachedItem(key: string, data: any, ttl: number) {
  const expiry = Date.now() + ttl;
  memoryCache.set(key, { data, expiry });
  try {
    localStorage.setItem(key, JSON.stringify({ data, expiry }));
  } catch (e) {
    console.warn('Failed to serialise cache item:', e);
  }
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function executeWithRetry(
  fn: () => Promise<any>, 
  retriesLeft = 3, 
  backoffMs = 1500
): Promise<any> {
  try {
    return await fn();
  } catch (error: any) {
    const status = error.response?.status;
    const isRateLimit = status === 429 || (error.response?.data?.errors && JSON.stringify(error.response?.data?.errors).includes('limit'));
    const isServerError = status >= 500 && status < 600;
    const isNetworkError = !error.response;
    
    if (retriesLeft > 0 && (isRateLimit || isServerError || isNetworkError)) {
      console.warn(`[API-Football Retry] Request failed. Retries left: ${retriesLeft}. Waiting ${backoffMs}ms...`);
      await delay(backoffMs);
      return executeWithRetry(fn, retriesLeft - 1, backoffMs * 2);
    }
    throw error;
  }
}

// Override apiClient.get to implement Caching, Request Deduplication, and Retry backoff
const originalGet = apiClient.get;
apiClient.get = async function<T = any>(url: string, config?: any): Promise<any> {
  const params = config?.params || {};
  const cacheKey = getCacheKey(url, params);
  const ttl = getTTL(url, params);

  // 1. Caching layer hit
  const cachedData = getCachedItem(cacheKey);
  if (cachedData !== null) {
    apiTracker.addLog({
      endpoint: url,
      method: 'GET',
      params: { ...params },
      status: 'success',
      statusText: 'تم استرداد البيانات بنجاح من الذاكرة المخبأة الحقيقية (Cache)',
      isCached: true,
      statusCode: 200,
      dataSize: JSON.stringify(cachedData).length,
      responseSample: cachedData.response?.slice(0, 1) || null
    });
    return {
      data: cachedData,
      status: 200,
      statusText: 'OK (Cache)',
      headers: {},
      config: config || {}
    };
  }

  // 2. Request deduplication layer hit
  const sigKey = `GET:${url}:${JSON.stringify(params)}`;
  if (inFlightRequests.has(sigKey)) {
    const sharedPromise = inFlightRequests.get(sigKey)!;
    const responseData = await sharedPromise;
    return {
      data: responseData,
      status: 200,
      statusText: 'OK (Deduplicated)',
      headers: {},
      config: config || {}
    };
  }

  // 3. Spawn real fetch promise
  const fetchPromise = (async () => {
    try {
      const resp = await executeWithRetry(() => {
        return originalGet.call(apiClient, url, config);
      }, 3, 1000);
      
      const realData = resp.data;
      if (realData && (!realData.errors || Object.keys(realData.errors).length === 0)) {
        setCachedItem(cacheKey, realData, ttl);
      }
      return realData;
    } catch (err) {
      inFlightRequests.delete(sigKey);
      throw err;
    } finally {
      inFlightRequests.delete(sigKey);
    }
  })();

  inFlightRequests.set(sigKey, fetchPromise);

  const finalData = await fetchPromise;
  return {
    data: finalData,
    status: 200,
    statusText: 'OK (Direct)',
    headers: {},
    config: config || {}
  };
};

apiClient.interceptors.response.use(
  (response) => {
    const logId = (response.config as any)._logId;
    const { data } = response;

    if (data && data.errors && Object.keys(data.errors).length > 0) {
      const errorMsg = JSON.stringify(data.errors);
      console.warn('API Response contains warning/errors payload:', errorMsg);
      
      // Automatic fallback retry for free plan season restriction (only allows 2022 to 2024)
      if (errorMsg.includes('season') && (errorMsg.includes('Free') || errorMsg.includes('plan')) && response.config && !(response.config as any)._isSeasonRetry) {
        console.warn('Season restricted on Free plan. Retrying request with last allowed season (2024)...');
        const retryConfig = { ...response.config, _isSeasonRetry: true } as any;
        if (retryConfig.params) {
          retryConfig.params = { ...retryConfig.params, season: '2024' };
        } else {
          retryConfig.params = { season: '2024' };
        }
        return apiClient(retryConfig);
      }
      
      let status: ApiLog['status'] = 'network-error';
      let statusText = 'خطأ من مزود الخدمة الكروي';

      if (errorMsg.includes('token') || errorMsg.includes('limit') || errorMsg.includes('key') || errorMsg.includes('requests')) {
        status = errorMsg.includes('limit') || errorMsg.includes('requests') ? 'rate-limit' : 'auth-error';
        statusText = status === 'rate-limit' ? 'تجاوز حد الطلبات المسموح به (429 Rate Limit)' : 'مفتاح مزود الخدمة غير صالح أو منتهي الصلاحية';
        
        if (logId) {
          apiTracker.updateLog(logId, {
            status,
            statusText,
            errors: data.errors
          });
        }
      }
      throw new Error(`API_ERROR: ${statusText} (${errorMsg})`);
    }

    const responseList = data?.response || [];
    const isEmpty = responseList.length === 0;

    if (logId) {
      apiTracker.updateLog(logId, {
        status: isEmpty ? 'empty-response' : 'success',
        statusText: isEmpty ? 'الطلب ناجح ولكنه غير متوفر حالياً' : 'تم استلام بيانات حقيقية مباشرة ومطابقتها',
        statusCode: response.status,
        dataSize: JSON.stringify(data).length,
        responseSample: responseList.length > 0 ? responseList.slice(0, 2) : null
      });
    }

    return response;
  },
  async (error) => {
    const config = error.config;
    const logId = config?._logId;
    const status = error.response?.status;

    console.warn(`[apiClient Interceptor] Real API Error (status: ${status || 'network'}): ${error.message || error}`);

    let label: ApiLog['status'] = 'network-error';
    let arDesc = `فشل الاتصال: ${error.message || 'مشكلة في الشبكة'}`;

    if (status === 429) {
      label = 'rate-limit';
      arDesc = 'تجاوز الحد الأقصى للمعدل اليومي (429 Rate exceeded)';
    } else if (status === 403 || status === 401) {
      label = 'auth-error';
      arDesc = 'خطأ في المصادقة ومفتاح الرمز البرمجي غير مصرح به';
    }

    if (logId) {
      apiTracker.updateLog(logId, {
        status: label,
        statusText: arDesc,
        statusCode: status || 0,
        errors: error.message
      });
    }

    throw error;
  }
);

export default apiClient;
