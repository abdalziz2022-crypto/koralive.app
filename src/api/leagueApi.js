import apiClient from './apiClient';
import { leagueService } from '../services/leagueService';
import { standingsService } from '../services/standingsService';
import { matchService } from '../services/matchService';

const POPULAR_LEAGUE_MAP: Record<string, number> = {
  'الدوري السعودي للمحترفين': 307,
  'الدوري السعودي': 307,
  'الدوري الإسباني - لاليغا': 140,
  'الدوري الإسباني': 140,
  'لاليغا': 140,
  'الدوري الإنجليزي الممتاز': 39,
  'الدوري الإنجليزي': 39,
  'دوري أبطال أوروبا': 2,
  'الدوري الإيطالي - الدرجة أ': 135,
  'الدوري الإيطالي': 135,
  'الدوري الفرنسي - دوري 1': 61,
  'الدوري الفرنسي': 61,
  'الدوري المصري الممتاز': 233,
  'الدوري المصري': 233
};

function getApiLeagueId(id: string): number {
  const clean = String(id).trim();
  if (/^\d+$/.test(clean)) {
    return Number(clean);
  }
  return POPULAR_LEAGUE_MAP[clean] || 307; // Default to Saudi Professional League
}

/**
 * Fetch league by ID or name (REAL API ONLY)
 * @param {string} id - The ID of the league or name
 */
export async function getLeagueById(id: string) {
  try {
    const apiId = getApiLeagueId(id);
    const details = await leagueService.getLeagueDetails(apiId);
    return {
      id: String(apiId),
      name: details.name,
      country: details.country,
      logo: details.logo,
      apiLeagueId: apiId,
      apiSeason: new Date().getFullYear()
    };
  } catch (err) {
    console.error('getLeagueById Error:', err);
    throw err;
  }
}

/**
 * Fetch matches of a given league (REAL API ONLY)
 * @param {string} id - The league name or ID
 */
export async function getLeagueMatches(id: string) {
  try {
    const apiId = getApiLeagueId(id);
    const matches = await matchService.getFixtures({
      leagueId: String(apiId),
      season: String(new Date().getFullYear())
    });
    return matches;
  } catch (err) {
    console.error('getLeagueMatches Error:', err);
    throw err;
  }
}

/**
 * Fetch standings/table for a specific league (REAL API ONLY)
 * @param {string} id - The league identifier/name
 */
export async function getLeagueStandings(id: string) {
  try {
    const apiId = getApiLeagueId(id);
    const res = await standingsService.getStandings(apiId, new Date().getFullYear());
    
    // Extract standings from team detail rows
    return res.standings.map(row => ({
      rank: row.rank,
      teamId: row.team.id,
      teamName: row.team.name,
      teamLogo: row.team.logo,
      points: row.points,
      played: row.played,
      win: row.win,
      draw: row.draw,
      lose: row.lose,
      goalsDiff: row.goalsDiff,
      form: row.form ? row.form.split('') : []
    }));
  } catch (err) {
    console.error('getLeagueStandings Error:', err);
    throw err;
  }
}
