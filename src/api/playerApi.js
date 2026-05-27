import apiClient from './apiClient';
import { playerService } from '../services/playerService';
import { matchService } from '../services/matchService';

/**
 * Fetch player basic details by numeric id or name securely via real API-Football endpoints. No mock generators.
 * @param {string|number} id - Player identifier or search query name
 */
export async function getPlayerById(id) {
  const query = String(id).trim();
  const isNumeric = /^\d+$/.test(query);

  try {
    if (isNumeric) {
      // 1. Fetch by numeric ID
      const res = await playerService.getPlayerDetails(query);
      return {
        name: res.name,
        team: res.teamName || 'نادي غير معرف',
        teamId: res.teamId,
        position: res.position || 'لاعب وسط',
        photo: res.photo || `https://media.api-sports.io/football/players/${query}.png`,
        nationality: res.nationality || 'غير محدد',
        age: res.age || 'غير محدد',
        height: res.height || 'غير محدد',
        weight: res.weight || 'غير محدد',
        injured: res.injured || false,
        stats: {
          appearances: res.appearances || 0,
          goals: res.goals || 0,
          assists: res.assists || 0,
          yellowCards: res.yellowCards || 0,
          redCards: res.redCards || 0,
          minutesPlayed: res.minutesPlayed || 0
        }
      };
    } else {
      // 2. Resolve by real Name Search
      const response = await apiClient.get('/players', {
        params: { search: query }
      });
      const firstResult = response.data?.response?.[0];
      if (!firstResult) {
        throw new Error(`PLAYER_NOT_FOUND: لم يتم العثور على لاعب حقيقي باسم "${query}" في قاعدة بيانات الدوري المباشرة.`);
      }
      
      const p = firstResult.player;
      const s = firstResult.statistics?.[0] || {};
      return {
        name: p.name,
        team: s.team?.name || 'غير معروف',
        teamId: s.team?.id,
        position: s.games?.position || 'وسط',
        photo: p.photo || `https://media.api-sports.io/football/players/${p.id}.png`,
        nationality: p.nationality || 'غير محدد',
        age: p.age || 'غير محدد',
        height: p.height || 'غير محدد',
        weight: p.weight || 'غير محدد',
        stats: {
          appearances: s.games?.appearences || 0,
          goals: s.goals?.total || 0,
          assists: s.goals?.assists || 0,
          yellowCards: s.cards?.yellow || 0,
          redCards: s.cards?.red || 0,
          minutesPlayed: s.games?.minutes || 0
        }
      };
    }
  } catch (err) {
    console.error('getPlayerById Error:', err);
    throw err;
  }
}

/**
 * Fetch real recent fixtures belonging to the player's team.
 * @param {string|number} id - Player identifier or name
 */
export async function getPlayerMatches(id) {
  try {
    const player = await getPlayerById(id);
    if (!player || !player.teamId) {
      return [];
    }

    // Query 5 real fixtures for this team
    const fixtures = await matchService.getFixtures({
      leagueId: undefined, // all leagues
      season: String(new Date().getFullYear())
    });

    // Filter matches involving player's real team ID
    const teamMatches = fixtures.filter(m => 
      String(m.homeTeam.id) === String(player.teamId) || 
      String(m.awayTeam.id) === String(player.teamId)
    );

    return teamMatches;
  } catch (err) {
    console.error('getPlayerMatches Error:', err);
    throw err;
  }
}

/**
 * Fetch real stats for the player
 * @param {string|number} id 
 */
export async function getPlayerStats(id) {
  try {
    const player = await getPlayerById(id);
    return player.stats;
  } catch (err) {
    console.error('getPlayerStats Error:', err);
    throw err;
  }
}
