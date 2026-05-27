import rapidApiClient, { RAPID_API_KEY } from './rapidApiClient';

export const statisticsService = {
  /**
   * Get top scorers of a league
   */
  async getTopScorers(leagueId = 307, season = 2024) {
    if (!RAPID_API_KEY) {
      return [
        { rank: 1, name: 'سالم الدوسري', team: 'الهلال', logo: 'https://media.api-sports.io/football/teams/33.png', goals: 18 },
        { rank: 2, name: 'كريستيانو رونالدو', team: 'النصر', logo: 'https://media.api-sports.io/football/teams/33.png', goals: 17 }
      ];
    }

    try {
      const response = await rapidApiClient.get('/players/topscorers', {
        params: { league: leagueId, season }
      });
      const rawPlayers = response.data?.response || [];
      return rawPlayers.slice(0, 10).map((item, idx) => ({
        rank: idx + 1,
        id: item.player.id,
        name: item.player.name,
        photo: item.player.photo,
        team: item.statistics?.[0]?.team?.name || 'نادي',
        logo: item.statistics?.[0]?.team?.logo || '',
        goals: item.statistics?.[0]?.goals?.total || 0,
        matches: item.statistics?.[0]?.games?.appearences || 0
      }));
    } catch (error) {
      console.warn('Top scorers fetch error, compiling fallback standard list:', error);
      return [
        { rank: 1, name: 'روبرت ليفاندوفسكي', team: 'برشلونة', goals: 19 },
        { rank: 2, name: 'جود بيلينجهام', team: 'ريال مدريد', goals: 16 }
      ];
    }
  },

  /**
   * Get top assist players of a league
   */
  async getTopAssists(leagueId = 307, season = 2024) {
    if (!RAPID_API_KEY) {
      return [
        { rank: 1, name: 'عبد الرحمن غريب', team: 'النصر', assists: 8 },
        { rank: 2, name: 'روبن نيفيز', team: 'الهلال', assists: 7 }
      ];
    }

    try {
      const response = await rapidApiClient.get('/players/topassists', {
        params: { league: leagueId, season }
      });
      const rawPlayers = response.data?.response || [];
      return rawPlayers.slice(0, 10).map((item, idx) => ({
        rank: idx + 1,
        id: item.player.id,
        name: item.player.name,
        photo: item.player.photo,
        team: item.statistics?.[0]?.team?.name || 'نادي',
        logo: item.statistics?.[0]?.team?.logo || '',
        assists: item.statistics?.[0]?.goals?.assists || 0,
        matches: item.statistics?.[0]?.games?.appearences || 0
      }));
    } catch (error) {
      console.warn('Top assists error, compiling fallback standard list:', error);
      return [
        { rank: 1, name: 'توني كروس', team: 'ريال مدريد', assists: 9 },
        { rank: 2, name: 'إيلكاي جوندوجان', team: 'برشلونة', assists: 8 }
      ];
    }
  }
};
