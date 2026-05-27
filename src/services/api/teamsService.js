import rapidApiClient, { RAPID_API_KEY } from './rapidApiClient';
import { mapTeamHeader, mapTeamStats, mapTeamPlayers } from '../teamMapper';
import { mockMatches } from '../../lib/mockData';

export const teamsService = {
  /**
   * Get team overview and database details
   */
  async getTeamDetail(teamId) {
    if (!RAPID_API_KEY) {
      return {
        id: teamId,
        name: 'قصر الرياضة',
        logo: 'https://media.api-sports.io/football/teams/33.png',
        country: 'إسبانيا',
        stadium: 'ملعب سانتياغو برنابيو',
        competition: 'الدوري الإسباني'
      };
    }

    try {
      const response = await rapidApiClient.get('/teams', {
        params: { id: teamId }
      });
      const teamObj = response.data?.response?.[0];
      if (teamObj) {
        return {
          id: teamObj.team.id,
          name: teamObj.team.name,
          logo: teamObj.team.logo,
          country: teamObj.team.country,
          stadium: teamObj.venue?.name || 'الملعب الأساسي',
          competition: 'البطولة الكبرى'
        };
      }
      throw new Error('Not found');
    } catch (error) {
      console.warn('Error fetching team, returning fallback preset', error);
      return {
        id: teamId,
        name: 'نادي الهلال السعودي',
        logo: 'https://media.api-sports.io/football/teams/33.png',
        country: 'السعودية',
        stadium: 'ملعب المملكة أرينا',
        competition: 'الدوري السعودي'
      };
    }
  },

  /**
   * Get team roster / squad
   */
  async getTeamSquad(teamId) {
    if (!RAPID_API_KEY) {
      return [
        { id: 101, name: 'سليم الدوسري', position: 'وسط', number: 10, nationality: 'السعودية' },
        { id: 102, name: 'ياسين بونو', position: 'حارس مرمى', number: 1, nationality: 'المغربية' },
        { id: 103, name: 'روبن نيفيز', position: 'وسط', number: 8, nationality: 'البرتغال' }
      ];
    }

    try {
      const response = await rapidApiClient.get('/players/squads', {
        params: { team: teamId }
      });
      const squadList = response.data?.response?.[0]?.players || [];
      return squadList.map((p, idx) => ({
        id: p.id || idx + 1000,
        name: p.name,
        position: p.position === 'Goalkeeper' ? 'حارس مرمى' : p.position === 'Defender' ? 'مدافع' : p.position === 'Midfielder' ? 'وسط' : 'مهاجم',
        number: p.number || idx + 1,
        nationality: 'دولي'
      }));
    } catch (error) {
      console.warn('Squad retrieval error, compiling mocked list:', error);
      return [
        { id: 1, name: 'لاعب هلالي رئيسي', position: 'وسط', number: 7, nationality: 'السعودية' },
        { id: 2, name: 'لاعب هلالي هداف', position: 'مهاجم', number: 9, nationality: 'عالمي' }
      ];
    }
  },

  /**
   * Get team league performance stats
   */
  async getTeamStats(teamId, leagueId = 307, season = 2024) {
    if (!RAPID_API_KEY) {
      return { played: 22, wins: 18, draws: 3, losses: 1, goals: 58, cleanSheets: 11 };
    }

    try {
      const response = await rapidApiClient.get('/teams/statistics', {
        params: { team: teamId, league: leagueId, season }
      });
      const card = response.data?.response || {};
      return {
        played: card.fixtures?.played?.total || 24,
        wins: card.fixtures?.wins?.total || 18,
        draws: card.fixtures?.draws?.total || 4,
        losses: card.fixtures?.losses?.total || 2,
        goals: card.goals?.for?.total?.home + card.goals?.for?.total?.away || 55,
        cleanSheets: card.clean_sheet?.total || 10
      };
    } catch (error) {
      return { played: 24, wins: 18, draws: 4, losses: 2, goals: 55, cleanSheets: 10 };
    }
  }
};
