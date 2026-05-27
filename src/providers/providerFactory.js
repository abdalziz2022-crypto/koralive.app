import { footballDataProvider } from './footballDataProvider';
import { sportmonksProvider } from './sportmonksProvider';
import { apiFootballProvider } from './apiFootballProvider';

const providers = {
  footballdata: footballDataProvider,
  sportmonks: sportmonksProvider,
  apifootball: apiFootballProvider,
};

export const providerFactory = {
  /**
   * Get an instance of a provider by registering key
   * @param {string} name - Provider key name
   */
  getProvider(name) {
    const key = String(name).toLowerCase();
    const active = providers[key];
    if (!active) {
      console.warn(`Provider ${name} not found. Defaulting to footballdata.`);
      return providers.footballdata;
    }
    return active;
  },

  getAllProviders() {
    return Object.values(providers);
  }
};
