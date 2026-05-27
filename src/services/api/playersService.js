import rapidApiClient, { RAPID_API_KEY } from './rapidApiClient';

export const playersService = {
  /**
   * Fetch player profile, details, statistics
   */
  async getPlayerDetail(playerId, season = 2024) {
    if (!RAPID_API_KEY) {
      return {
        header: {
          name: 'سالم الدوسري',
          team: 'الهلال',
          teamLogo: 'https://media.api-sports.io/football/teams/33.png',
          position: 'جناح أيسر / وسط مهاجم',
          number: 10,
          photo: 'https://media.api-sports.io/football/players/44.png'
        },
        info: {
          nationality: 'السعودية',
          age: '32 عاماً',
          height: '174 سم',
          foot: 'اليمين'
        },
        stats: {
          appearances: 28,
          goals: 14,
          assists: 9,
          yellowCards: 3,
          redCards: 0,
          minutesPlayed: 2420
        }
      };
    }

    try {
      const response = await rapidApiClient.get('/players', {
        params: { id: playerId, season }
      });
      const data = response.data?.response?.[0];
      if (data) {
        const stats = data.statistics?.[0] || {};
        return {
          header: {
            name: data.player.name,
            team: stats.team?.name || 'النادي الرياضي',
            teamLogo: stats.team?.logo || '',
            position: stats.games?.position || 'لاعب كرة قدم',
            number: stats.games?.number || 10,
            photo: data.player.photo
          },
          info: {
            nationality: data.player.nationality || 'دولي',
            age: `${data.player.age || 26} عاماً`,
            height: data.player.height || '180 سم',
            foot: data.player.injured ? 'اليسار' : 'اليمين'
          },
          stats: {
            appearances: stats.games?.appearences || 15,
            goals: stats.goals?.total || 5,
            assists: stats.goals?.assists || 2,
            yellowCards: stats.cards?.yellow || 1,
            redCards: stats.cards?.red || 0,
            minutesPlayed: stats.games?.minutes || 1350
          }
        };
      }
      throw new Error('Player not found');
    } catch (error) {
      console.warn('Player retrieve failed, compiling default mock', error);
      return {
        header: {
          name: 'كريستيانو رونالدو',
          team: 'النصر',
          teamLogo: 'https://media.api-sports.io/football/teams/33.png',
          position: 'مهاجم صريح',
          number: 7,
          photo: 'https://media.api-sports.io/football/players/44.png'
        },
        info: {
          nationality: 'البرتغال',
          age: '39 عاماً',
          height: '187 سم',
          foot: 'اليمين'
        },
        stats: {
          appearances: 31,
          goals: 35,
          assists: 11,
          yellowCards: 4,
          redCards: 0,
          minutesPlayed: 2750
        }
      };
    }
  },

  /**
   * Search player list by keyword/name
   */
  async searchPlayers(query) {
    if (!RAPID_API_KEY) {
      return [
        { id: 44, name: 'سالم الدوسري', team: 'الهلال', position: 'وسط' },
        { id: 45, name: 'عبد الرحمن غريب', team: 'النصر', position: 'جناح' }
      ];
    }
    try {
      const response = await rapidApiClient.get('/players', {
        params: { search: query }
      });
      const list = response.data?.response || [];
      return list.map(item => ({
        id: item.player.id,
        name: item.player.name,
        team: item.statistics?.[0]?.team?.name || 'دولي',
        position: item.statistics?.[0]?.games?.position || 'لاعب'
      }));
    } catch (e) {
      return [];
    }
  }
};
