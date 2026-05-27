import apiClient, { getActiveApiKey } from '../api/apiClient';
import { PlayerDetail, mapRawPlayerDetail } from './playerMapper';

export const playerService = {
  /**
   * Fetch specific player's profile and stats - REAL API ONLY
   */
  async getPlayerDetails(playerId: string | number, season?: number): Promise<PlayerDetail> {
    const apiId = String(playerId).replace('apf-', '');
    const currentYear = season || new Date().getFullYear();
    const key = getActiveApiKey();
    if (!key) {
      throw new Error('NO_API_KEY: الرجاء إدخال مفتاح API-Football حقيقي للمتابعة.');
    }

    try {
      const response = await apiClient.get('/players', {
        params: { id: apiId, season: String(currentYear) }
      });
      const rawPlayer = response.data?.response?.[0];
      if (!rawPlayer) {
        throw new Error(`PLAYER_NOT_FOUND: لم يتم العثور على اللاعب بالمعرف: ${apiId}`);
      }
      return mapRawPlayerDetail(rawPlayer);
    } catch (error) {
      console.error('[playerService] Failed to load player details:', error);
      throw error;
    }
  }
};
