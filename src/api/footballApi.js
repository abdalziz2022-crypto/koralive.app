import apiClient from './apiClient';

/**
 * Fetch matches that are currently LIVE.
 * Endpoint: /matches?status=LIVE
 */
export async function getLiveMatches() {
  const response = await apiClient.get('/matches?status=LIVE');
  return response.data;
}

/**
 * Fetch today's matches.
 * Endpoint: /matches
 */
export async function getTodayMatches() {
  const response = await apiClient.get('/matches');
  return response.data;
}

/**
 * Fetch details of a specific match by ID.
 * Endpoint: /matches/{id}
 */
export async function getMatchById(id) {
  const response = await apiClient.get(`/matches/${id}`);
  return response.data;
}

/**
 * Fetch league standings for a specific competition ID.
 * Endpoint: /competitions/{id}/standings
 */
export async function getLeagueStandings(competitionId) {
  const response = await apiClient.get(`/competitions/${competitionId}/standings`);
  return response.data;
}

/**
 * Test connectivity and API responses.
 * Performs a request to the live matches endpoint.
 */
export async function testFootballApi() {
  try {
    const response = await apiClient.get('/matches?status=LIVE');
    console.log(' football-data.org response data:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error during testFootballApi:', error);
    throw error;
  }
}
