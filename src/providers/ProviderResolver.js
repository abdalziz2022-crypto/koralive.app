/**
 * ProviderResolver for KoraLive.
 * Acts as the single unified entrypoint for match and football data.
 * Resolves the appropriate provider (Football-Data, Sportmonks, API-Football)
 * and maps the output securely through the Mapper Layer.
 */

import { providerFactory } from './providerFactory';
import { MapperLayer } from './mapperLayer';

// Local storage key for manual override testing
const LOCAL_OVERRIDE_KEY = 'koralive_active_provider';

const isRateLimitOrServiceError = (err) => {
  if (!err) return false;
  if (err.response) {
    const status = err.response.status;
    if (status === 429 || status === 503) {
      return true;
    }
  }
  const msg = String(err.message || '');
  if (msg.includes('429') || msg.includes('503')) {
    return true;
  }
  return false;
};

export const ProviderResolver = {
  /**
   * Determine which provider should execute the request.
   * Resolves in the following priority order:
   * 1. Manual user setting override (saved in localStorage).
   * 2. ID-based prefixes (e.g. "sm-" resolves to Sportmonks, "apf-" to API-Football).
   * 3. Environment configurations (active API tokens).
   * 4. Default fallback: Football-Data.org provider.
   */
  resolve(id = '') {
    // 1. Check local manual test setting override
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_OVERRIDE_KEY);
      if (saved) {
        return providerFactory.getProvider(saved);
      }
    }

    // 2. Identify by ID format/prefix
    const strId = String(id);
    if (strId.startsWith('sm-')) {
      return providerFactory.getProvider('sportmonks');
    }
    if (strId.startsWith('apf-')) {
      return providerFactory.getProvider('apifootball');
    }

    // 3. Environment keys probe
    if (import.meta.env.VITE_RAPID_API_KEY) {
      return providerFactory.getProvider('apifootball');
    }
    if (import.meta.env.VITE_SPORTMONKS_API_KEY) {
      return providerFactory.getProvider('sportmonks');
    }
    if (import.meta.env.VITE_API_FOOTBALL_KEY) {
      return providerFactory.getProvider('apifootball');
    }

    // 4. Default standard fallback
    return providerFactory.getProvider('footballdata');
  },

  /**
   * Set active provider override manually (useful for demonstration/testing)
   */
  setActiveProviderOverride(providerName) {
    if (typeof localStorage !== 'undefined') {
      if (!providerName) {
        localStorage.removeItem(LOCAL_OVERRIDE_KEY);
      } else {
        localStorage.setItem(LOCAL_OVERRIDE_KEY, providerName);
      }
      // Emit event for state updates if needed
      window.dispatchEvent(new Event('storage'));
    }
  },

  /**
   * Get override currently saved
   */
  getActiveProviderOverride() {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_OVERRIDE_KEY);
      if (saved) return saved;
    }
    if (import.meta.env.VITE_RAPID_API_KEY) {
      return 'apifootball';
    }
    return 'footballdata';
  },

  /**
   * Unified matches getter
   */
  async getMatches() {
    const provider = this.resolve();
    try {
      const raw = await provider.getMatches();
      return MapperLayer.mapMatches(provider.name, raw);
    } catch (err) {
      console.warn(`ProviderResolver: primary provider (${provider.name}) failed.`, err);
      
      // If footballdata failed with 429/503 rate limits or server errors, switch seamlessly to API-Football
      if (provider.name === 'footballdata' && isRateLimitOrServiceError(err)) {
        console.info('[ProviderResolver] football-data.org returned 429 or 503. Seamlessly switching to apifootball...');
        try {
          const apiFootball = providerFactory.getProvider('apifootball');
          const rawFallback = await apiFootball.getMatches();
          return MapperLayer.mapMatches(apiFootball.name, rawFallback);
        } catch (apfErr) {
          console.error('[ProviderResolver] apifootball fallback failed. Reverting to local fallback database:', apfErr);
        }
      }

      // Default ultimate local/mock fallback
      const fallback = providerFactory.getProvider('footballdata');
      const rawFallback = await fallback.getMatches({ bypassApi: true });
      return MapperLayer.mapMatches(fallback.name, rawFallback);
    }
  },

  /**
   * Unified single match getter
   */
  async getMatch(id) {
    const provider = this.resolve(id);
    try {
      const raw = await provider.getMatch(id);
      return MapperLayer.mapMatch(provider.name, raw);
    } catch (err) {
      console.warn(`ProviderResolver: getMatch(${id}) on ${provider.name} failed.`, err);
      
      if (provider.name === 'footballdata' && isRateLimitOrServiceError(err)) {
        console.info('[ProviderResolver] football-data.org single match returned 429/503. Seamlessly switching to apifootball...');
        try {
          const apiFootball = providerFactory.getProvider('apifootball');
          const rawFallback = await apiFootball.getMatch(id);
          return MapperLayer.mapMatch(apiFootball.name, rawFallback);
        } catch (apfErr) {
          console.error('[ProviderResolver] apifootball match fallback failed. Reverting to local fallback database:', apfErr);
        }
      }

      const fallback = providerFactory.getProvider('footballdata');
      const rawFallback = await fallback.getMatch(id, { bypassApi: true });
      return MapperLayer.mapMatch(fallback.name, rawFallback);
    }
  },

  /**
   * Unified standings table getter
   */
  async getStandings(leagueId) {
    const provider = this.resolve(leagueId);
    try {
      const raw = await provider.getStandings(leagueId);
      return MapperLayer.mapStandings(provider.name, raw);
    } catch (err) {
      console.warn(`ProviderResolver: getStandings(${leagueId}) on ${provider.name} failed:`, err);
      
      if (provider.name === 'footballdata' && isRateLimitOrServiceError(err)) {
        console.info('[ProviderResolver] football-data.org standings returned 429/503. Seamlessly switching to apifootball...');
        try {
          const apiFootball = providerFactory.getProvider('apifootball');
          const rawFallback = await apiFootball.getStandings(leagueId);
          return MapperLayer.mapStandings(apiFootball.name, rawFallback);
        } catch (apfErr) {
          console.error('[ProviderResolver] apifootball standings fallback failed. Reverting to local fallback database:', apfErr);
        }
      }

      const fallback = providerFactory.getProvider('footballdata');
      const rawFallback = await fallback.getStandings(leagueId, { bypassApi: true });
      return MapperLayer.mapStandings(fallback.name, rawFallback);
    }
  },

  /**
   * Unified team getter
   */
  async getTeam(id) {
    const provider = this.resolve(id);
    try {
      const raw = await provider.getTeam(id);
      return MapperLayer.mapTeam(provider.name, raw);
    } catch (err) {
      console.warn(`ProviderResolver: getTeam(${id}) on ${provider.name} failed:`, err);
      
      if (provider.name === 'footballdata' && isRateLimitOrServiceError(err)) {
        console.info('[ProviderResolver] football-data.org team returned 429/503. Seamlessly switching to apifootball...');
        try {
          const apiFootball = providerFactory.getProvider('apifootball');
          const rawFallback = await apiFootball.getTeam(id);
          return MapperLayer.mapTeam(apiFootball.name, rawFallback);
        } catch (apfErr) {
          console.error('[ProviderResolver] apifootball team fallback failed. Reverting to local fallback database:', apfErr);
        }
      }

      const fallback = providerFactory.getProvider('footballdata');
      const rawFallback = await fallback.getTeam(id, { bypassApi: true });
      return MapperLayer.mapTeam(fallback.name, rawFallback);
    }
  },

  /**
   * Unified league getter
   */
  async getLeague(id) {
    const provider = this.resolve(id);
    try {
      const raw = await provider.getLeague(id);
      return MapperLayer.mapLeague(provider.name, raw);
    } catch (err) {
      console.warn(`ProviderResolver: getLeague(${id}) on ${provider.name} failed:`, err);
      
      if (provider.name === 'footballdata' && isRateLimitOrServiceError(err)) {
        console.info('[ProviderResolver] football-data.org league returned 429/503. Seamlessly switching to apifootball...');
        try {
          const apiFootball = providerFactory.getProvider('apifootball');
          const rawFallback = await apiFootball.getLeague(id);
          return MapperLayer.mapLeague(apiFootball.name, rawFallback);
        } catch (apfErr) {
          console.error('[ProviderResolver] apifootball league fallback failed. Reverting to local fallback database:', apfErr);
        }
      }

      const fallback = providerFactory.getProvider('footballdata');
      const rawFallback = await fallback.getLeague(id, { bypassApi: true });
      return MapperLayer.mapLeague(fallback.name, rawFallback);
    }
  }
};
