import apiClient, { getActiveApiKey } from '../api/apiClient';
import { LeagueStandings } from '../types';
import { mapRawStandings } from './standingsMapper';

export const standingsService = {
  /**
   * Fetch league standings for a specific league & season - REAL API ONLY
   */
  async getStandings(leagueId: string | number, season?: string | number): Promise<LeagueStandings> {
    const apiLeagueId = String(leagueId).replace('apf-', '');
    const currentYear = season ? String(season) : String(new Date().getFullYear());
    const key = getActiveApiKey();
    if (!key) {
      throw new Error('NO_API_KEY: الرجاء إدخال مفتاح API-Football حقيقي للمتابعة.');
    }

    try {
      const response = await apiClient.get('/standings', {
        params: {
          league: apiLeagueId,
          season: currentYear
        }
      });

      const mapped = mapRawStandings(response.data);
      if (!mapped || !mapped.standings || mapped.standings.length === 0) {
        throw new Error('EMPTY_STANDINGS: لم يسترجع المزود جدول ترتيب لهذه البطولة حالياً.');
      }
      return mapped;
    } catch (error) {
      console.error('[standingsService] Failed to fetch standings:', error);
      throw error;
    }
  }
};
