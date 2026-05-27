import apiClient from './apiClient';

/**
 * Fetches general fixture information.
 * @param {string | number} id - The fixture ID
 * @returns {Promise<any>} The response data from the API
 */
export async function getFixture(id: string | number): Promise<any> {
  const response = await apiClient.get('/fixtures', {
    params: { id }
  });
  return response.data;
}

/**
 * Fetches events associated with a specific fixture.
 * @param {string | number} id - The fixture ID
 * @returns {Promise<any>} The response data containing events
 */
export async function getEvents(id: string | number): Promise<any> {
  const response = await apiClient.get('/fixtures/events', {
    params: { fixture: id }
  });
  return response.data;
}

/**
 * Fetches statistics for a specific fixture.
 * @param {string | number} id - The fixture ID
 * @returns {Promise<any>} The response data containing statistics
 */
export async function getStatistics(id: string | number): Promise<any> {
  const response = await apiClient.get('/fixtures/statistics', {
    params: { fixture: id }
  });
  return response.data;
}

/**
 * Fetches lineups for a specific fixture.
 * @param {string | number} id - The fixture ID
 * @returns {Promise<any>} The response data containing lineups
 */
export async function getLineups(id: string | number): Promise<any> {
  const response = await apiClient.get('/fixtures/lineups', {
    params: { fixture: id }
  });
  return response.data;
}

/**
 * Tests the API connection by fetching account status.
 * Used to verify if the API key is active and working.
 */
export async function testApiConnection(): Promise<void> {
  try {
    const response = await apiClient.get('/status');
    console.log('API Connection Test Result:', response.data);
  } catch (error) {
    console.error('API Connection Test Failed:', error);
  }
}
