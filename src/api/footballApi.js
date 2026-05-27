import { matchService } from '../services/matchService';
import { standingsService } from '../services/standingsService';

/**
 * Fetch matches that are currently LIVE.
 */
export async function getLiveMatches() {
  try {
    return await matchService.getLiveMatches();
  } catch (error) {
    console.error('getLiveMatches compatibility error:', error);
    return [];
  }
}

/**
 * Fetch today's matches.
 */
export async function getTodayMatches() {
  try {
    return await matchService.getFixtures();
  } catch (error) {
    console.error('getTodayMatches compatibility error:', error);
    return [];
  }
}

/**
 * Fetch details of a specific match by ID.
 */
export async function getMatchById(id) {
  try {
    return await matchService.getMatchDetails(String(id));
  } catch (error) {
    console.error(`getMatchById compatibility error for ${id}:`, error);
    return null;
  }
}

/**
 * Fetch league standings for a specific competition ID.
 */
export async function getLeagueStandings(competitionId) {
  try {
    return await standingsService.getStandings(competitionId);
  } catch (error) {
    console.error(`getLeagueStandings compatibility error for ${competitionId}:`, error);
    return { standings: [] };
  }
}

/**
 * Test connectivity and API responses.
 */
export async function testFootballApi() {
  try {
    const response = await matchService.getLiveMatches();
    console.log('API-Football validation response data:', response);
    return response;
  } catch (error) {
    console.error('Error during testFootballApi:', error);
    throw error;
  }
}
