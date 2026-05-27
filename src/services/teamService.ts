import apiClient, { getActiveApiKey } from '../api/apiClient';
import { TeamDetail, mapRawTeamDetail } from './teamMapper';

export const teamService = {
  /**
   * Fetch complete team details - REAL API ONLY
   */
  async getTeamDetails(teamId: string | number): Promise<TeamDetail> {
    const apiId = String(teamId).replace('apf-', '');
    const key = getActiveApiKey();
    if (!key) {
      throw new Error('NO_API_KEY: الرجاء إدخال مفتاح API-Football حقيقي للمتابعة.');
    }

    try {
      const response = await apiClient.get('/teams', {
        params: { id: apiId }
      });
      const rawTeam = response.data?.response?.[0];
      if (!rawTeam) {
        throw new Error(`TEAM_NOT_FOUND: لم يتم العثور على التفاصيل الحقيقية للفريق: ${apiId}`);
      }
      return mapRawTeamDetail(rawTeam);
    } catch (error) {
      console.error('[teamService] Failed to load team detail:', error);
      throw error;
    }
  }
};
