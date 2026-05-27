import apiFootballClient from './apiFootballClient';

/**
 * Test connectivity with API-Football
 * Hits the /status endpoint to check subscription / key validity
 */
export async function testApiFootball() {
  try {
    console.log('[API-Football] Initiating status connectivity check...');
    const response = await apiFootballClient.get('/status');
    console.log('[API-Football] Connection Test Success. Status Data:', response.data);
    return response.data;
  } catch (error) {
    console.error('[API-Football] Connection Test Failed:', error.message || error);
    throw error;
  }
}

/**
 * Get all live fixtures
 * Hits the /fixtures?live=all endpoint
 */
export async function getLiveFixtures() {
  try {
    console.log('[API-Football] Fetching live fixtures...');
    const response = await apiFootballClient.get('/fixtures?live=all');
    console.log('[API-Football] Fetch live fixtures success:', response.data);
    return response.data;
  } catch (error) {
    console.error('[API-Football] Fetching live fixtures failed:', error.message || error);
    throw error;
  }
}

/**
 * Get specific fixture details by ID
 * Hits the /fixtures?id={id} endpoint
 */
export async function getFixtureById(id) {
  try {
    console.log(`[API-Football] Fetching fixture by ID: ${id}...`);
    const response = await apiFootballClient.get(`/fixtures?id=${id}`);
    console.log(`[API-Football] Fetch fixture ${id} success:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`[API-Football] Fetching fixture ${id} failed:`, error.message || error);
    throw error;
  }
}

/**
 * Get fixture events (goals, cards, substitutions, etc.)
 * Hits the /fixtures/events?fixture={id} endpoint
 */
export async function getFixtureEvents(id) {
  try {
    console.log(`[API-Football] Fetching events for fixture: ${id}...`);
    const response = await apiFootballClient.get(`/fixtures/events?fixture=${id}`);
    console.log(`[API-Football] Fetch events for fixture ${id} success:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`[API-Football] Fetching event data for fixture ${id} failed:`, error.message || error);
    throw error;
  }
}

/**
 * Get fixture statistics (possession, shots, passes, etc.)
 * Hits the /fixtures/statistics?fixture={id} endpoint
 */
export async function getFixtureStatistics(id) {
  try {
    console.log(`[API-Football] Fetching statistics for fixture: ${id}...`);
    const response = await apiFootballClient.get(`/fixtures/statistics?fixture=${id}`);
    console.log(`[API-Football] Fetch statistics for fixture ${id} success:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`[API-Football] Fetching statistics for fixture ${id} failed:`, error.message || error);
    throw error;
  }
}

/**
 * Get fixture lineups (starting XI, substitutes, coach, formation, etc.)
 * Hits the /fixtures/lineups?fixture={id} endpoint
 */
export async function getFixtureLineups(id) {
  try {
    console.log(`[API-Football] Fetching lineups for fixture: ${id}...`);
    const response = await apiFootballClient.get(`/fixtures/lineups?fixture=${id}`);
    console.log(`[API-Football] Fetch lineups for fixture ${id} success:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`[API-Football] Fetching lineups for fixture ${id} failed:`, error.message || error);
    throw error;
  }
}
