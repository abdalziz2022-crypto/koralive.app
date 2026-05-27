import apiClient, { getActiveApiKey } from '../api/apiClient';
import { League } from '../types';
import { mapRawLeagues, mapRawLeague } from './leagueMapper';

export const leagueService = {
  /**
   * Get all available leagues (or popular ones) - REAL API ONLY
   */
  async getLeagues(): Promise<League[]> {
    const key = getActiveApiKey();
    if (!key) {
      throw new Error('NO_API_KEY: مفتاح الاتصال بـ API-Football غير متوفر.');
    }

    try {
      // RapidAPI or API-Football leagues list
      const response = await apiClient.get('/leagues');
      const rawLeagues = response.data?.response || [];
      return mapRawLeagues(rawLeagues);
    } catch (error) {
      console.error('[leagueService] Failed to load leagues:', error);
      throw error;
    }
  },

  /**
   * Get specific league details - REAL API ONLY
   */
  async getLeagueDetails(id: string | number): Promise<League> {
    const apiId = String(id).replace('apf-', '');
    const key = getActiveApiKey();
    if (!key) {
      throw new Error('NO_API_KEY: مفتاح الاتصال حظر تعيين بيانات المزامنة.');
    }

    try {
      const response = await apiClient.get('/leagues', {
        params: { id: apiId }
      });
      const rawLeague = response.data?.response?.[0];
      if (!rawLeague) {
        throw new Error(`LEAGUE_NOT_FOUND: لا يوجد بطولة بهذا المعرف: ${apiId}`);
      }
      return mapRawLeague(rawLeague);
    } catch (error) {
      console.error('[leagueService] Failed to fetch league details:', error);
      throw error;
    }
  }
};
