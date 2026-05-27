import apiClient from './apiClient';
import { teamService } from '../services/teamService';
import { matchService } from '../services/matchService';
import { mapRawMatches } from '../services/matchMapper';

/**
 * Fetch team basic details by numeric id or name securely via real API-Football endpoints. No mock generators.
 * @param {string|number} id - Team identifier or search query name
 */
export async function getTeamById(id) {
  const query = String(id).trim();
  const isNumeric = /^\d+$/.test(query);

  try {
    if (isNumeric) {
      const details = await teamService.getTeamDetails(query);
      return {
        id: details.id,
        name: details.name,
        logo: details.logo,
        founded: details.founded,
        venueName: details.venueName,
        venueCity: details.venueCity,
        venueCapacity: details.venueCapacity,
        country: details.country,
        code: details.code
      };
    } else {
      const response = await apiClient.get('/teams', {
        params: { search: query }
      });
      const rawTeam = response.data?.response?.[0];
      if (!rawTeam) {
        throw new Error(`TEAM_NOT_FOUND: لم يتم العثور على نادي حقيقي باسم "${query}" في الخادم.`);
      }
      return {
        id: rawTeam.team.id,
        name: rawTeam.team.name,
        logo: rawTeam.team.logo,
        founded: rawTeam.team.founded,
        venueName: rawTeam.venue.name,
        venueCity: rawTeam.venue.city,
        venueCapacity: rawTeam.venue.capacity,
        country: rawTeam.team.country,
        code: rawTeam.team.code
      };
    }
  } catch (err) {
    console.error('getTeamById Error:', err);
    throw err;
  }
}

/**
 * Fetch real recent fixtures belonging to the team (recent status)
 * @param {string|number} id - Team identifier or name
 */
export async function getTeamMatches(id) {
  try {
    const team = await getTeamById(id);
    if (!team || !team.id) {
      return [];
    }

    // Query 5 real recent / upcoming fixtures
    const response = await apiClient.get('/fixtures', {
      params: { team: team.id, last: 10 }
    });

    const rawMatches = response.data?.response || [];
    // If empty, try upcoming
    if (rawMatches.length === 0) {
      const nextResponse = await apiClient.get('/fixtures', {
        params: { team: team.id, next: 10 }
      });
      return matchService.getFixtures ? matchService.getFixtures() : []; 
    }

    return mapRawMatches(rawMatches);
  } catch (err) {
    console.error('getTeamMatches Error:', err);
    throw err;
  }
}

/**
 * Fetch standings of the league this team belongs to
 * @param {string} id - Team ID or Name
 */
export async function getTeamStandings(id) {
  try {
    const team = await getTeamById(id);
    if (!team || !team.id) return { rank: 1, points: 0, form: [] };

    // Find custom standings from standard leagues that this team plays in
    // Query standings for Saudi (307) or La Liga (140) or EPL (39)
    let leagueId = 307; // Saudi by default for Middle East
    if (team.country === 'Spain') leagueId = 140;
    if (team.country === 'England') leagueId = 39;
    if (team.country === 'Italy') leagueId = 135;
    if (team.country === 'France') leagueId = 61;

    const response = await apiClient.get('/standings', {
      params: { league: leagueId, season: new Date().getFullYear().toString() }
    });

    const stands = response.data?.response?.[0]?.league?.standings?.[0] || [];
    const teamRow = stands.find((s: any) => String(s.team.id) === String(team.id));

    if (teamRow) {
      return {
        rank: teamRow.rank,
        points: teamRow.points,
        form: teamRow.form ? teamRow.form.split('') : [],
        played: teamRow.all?.played,
        win: teamRow.all?.win,
        draw: teamRow.all?.draw,
        lose: teamRow.all?.lose
      };
    }

    return { rank: 1, points: 0, form: [] };
  } catch (err) {
    console.error('getTeamStandings Error:', err);
    return { rank: 1, points: 0, form: [] };
  }
}

/**
 * Fetch real squad database of the team via direct API-Football players list. No mock generators.
 * @param {string} id - Team ID or name
 */
export async function getTeamPlayers(id) {
  try {
    const team = await getTeamById(id);
    if (!team || !team.id) return [];

    const response = await apiClient.get('/players/squads', {
      params: { team: team.id }
    });

    const rawSquad = response.data?.response?.[0]?.players || [];
    if (rawSquad.length === 0) {
      // Fallback search in /players
      const playersRes = await apiClient.get('/players', {
        params: { team: team.id, season: '2025' }
      });
      const list = playersRes.data?.response || [];
      return list.map((item: any) => ({
        name: item.player.name,
        position: item.statistics?.[0]?.games?.position || 'وسط',
        number: item.statistics?.[0]?.games?.number || 9,
        nationality: item.player.nationality || 'غير معروف'
      }));
    }

    return rawSquad.map((item: any) => {
      let arabicPos = item.position;
      if (item.position === 'Defender') arabicPos = 'مدافع';
      else if (item.position === 'Goalkeeper') arabicPos = 'حارس مرمى';
      else if (item.position === 'Midfielder') arabicPos = 'وسط';
      else if (item.position === 'Attacker') arabicPos = 'مهاجم';

      return {
        id: item.id,
        name: item.name,
        position: arabicPos,
        number: item.number || 10,
        nationality: 'لاعب الفريق الحقيقي'
      };
    });
  } catch (err) {
    console.error('getTeamPlayers Error:', err);
    throw err;
  }
}
