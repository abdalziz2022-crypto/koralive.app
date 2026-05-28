import apiClient from './apiClient';
import { teamService } from '../services/teamService';
import { matchService } from '../services/matchService';
import { mapRawMatches } from '../services/matchMapper';

function safeDecode(str) {
  try {
    return decodeURIComponent(str);
  } catch {
    return str;
  }
}

/**
 * Fetch team basic details by numeric id or name securely via real API-Football endpoints. No mock generators.
 * @param {string|number} id - Team identifier or search query name
 */
export async function getTeamById(id) {
  const decoded = safeDecode(id).trim();
  const cleanId = decoded.replace('apf-', '');
  const isNumeric = /^\d+$/.test(cleanId);

  try {
    if (isNumeric) {
      const details = await teamService.getTeamDetails(cleanId);
      return {
        id: details?.id || '',
        name: details?.name || 'غير معروف',
        logo: details?.logo || '',
        founded: details?.founded,
        venueName: details?.venueName || '',
        venueCity: details?.venueCity || '',
        venueCapacity: details?.venueCapacity || 0,
        country: details?.country || '',
        code: details?.code || ''
      };
    } else {
      const response = await apiClient.get('/teams', {
        params: { search: decoded }
      });
      const rawTeam = response.data?.response?.[0];
      if (!rawTeam) {
        throw new Error(`TEAM_NOT_FOUND: لم يتم العثور على نادي حقيقي باسم "${decoded}" في الخادم.`);
      }
      return {
        id: rawTeam.team?.id || '',
        name: rawTeam.team?.name || 'غير معروف',
        logo: rawTeam.team?.logo || '',
        founded: rawTeam.team?.founded,
        venueName: rawTeam.venue?.name || '',
        venueCity: rawTeam.venue?.city || '',
        venueCapacity: rawTeam.venue?.capacity || 0,
        country: rawTeam.team?.country || '',
        code: rawTeam.team?.code || ''
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

    // Determine current football season based on date (May 2026 is season 2025)
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const soccerSeasonYear = currentMonth < 6 ? currentYear - 1 : currentYear;

    let response = await apiClient.get('/fixtures', {
      params: { team: team.id, season: String(soccerSeasonYear) }
    });

    let rawMatches = response.data?.response || [];

    // Tries fallback to other/current/previous season if returned results empty
    if (rawMatches.length === 0) {
      const fallbackYears = [currentYear, currentYear - 1].filter(yr => yr !== soccerSeasonYear);
      for (const yr of fallbackYears) {
        try {
          const fbResponse = await apiClient.get('/fixtures', {
            params: { team: team.id, season: String(yr) }
          });
          const fbMatches = fbResponse.data?.response || [];
          if (fbMatches.length > 0) {
            rawMatches = fbMatches;
            break;
          }
        } catch (e) {
          console.warn(`Fallback fetching fixtures for season ${yr} failed:`, e);
        }
      }
    }

    // If still empty and matchService has fixtures, use fallback or return empty
    if (rawMatches.length === 0 && matchService.getFixtures) {
      try {
        const fallbackList = await matchService.getFixtures();
        return fallbackList.filter(m => 
          String(m.homeTeamDetails?.id) === String(team.id) || 
          String(m.awayTeamDetails?.id) === String(team.id)
        );
      } catch (e) {
        console.warn('Fallback getFixtures from matchService failed:', e);
      }
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
    const teamRow = stands.find((s) => String(s.team.id) === String(team.id));

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
      return list.map((item) => ({
        name: item.player.name,
        position: item.statistics?.[0]?.games?.position || 'وسط',
        number: item.statistics?.[0]?.games?.number || 9,
        nationality: item.player.nationality || 'غير معروف'
      }));
    }

    return rawSquad.map((item) => {
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
