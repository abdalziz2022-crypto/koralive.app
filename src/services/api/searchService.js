import rapidApiClient, { RAPID_API_KEY } from './rapidApiClient';
import { mockMatches } from '../../lib/mockData';

export const searchService = {
  /**
   * Performs a global search across local and remote providers
   */
  async searchGlobal(query) {
    const term = String(query).trim().toLowerCase();
    if (!term) return { teams: [], players: [], matches: [], leagues: [] };

    let results = {
      teams: [],
      players: [],
      matches: [],
      leagues: []
    };

    // Filter local mock matches
    results.matches = mockMatches.filter(m => 
      m.homeTeam.toLowerCase().includes(term) || 
      m.awayTeam.toLowerCase().includes(term) ||
      m.league.toLowerCase().includes(term)
    ).slice(0, 5);

    // Some default mock categories
    const mockTeams = [
      { id: 33, name: 'ريال مدريد', logo: 'https://media.api-sports.io/football/teams/541.png', country: 'إسبانيا' },
      { id: 34, name: 'برشلونة', logo: 'https://media.api-sports.io/football/teams/529.png', country: 'إسبانيا' },
      { id: 35, name: 'الهلال', logo: 'https://media.api-sports.io/football/teams/33.png', country: 'السعودية' },
      { id: 36, name: 'النصر', logo: 'https://media.api-sports.io/football/teams/33.png', country: 'السعودية' }
    ];

    results.teams = mockTeams.filter(t => t.name.toLowerCase().includes(term));

    const mockPlayers = [
      { id: 44, name: 'سالم الدوسري', team: 'الهلال', photo: 'https://media.api-sports.io/football/players/44.png' },
      { id: 45, name: 'عبد الرحمن غريب', team: 'النصر', photo: 'https://media.api-sports.io/football/players/44.png' },
      { id: 46, name: 'ياسين بونو', team: 'الهلال', photo: 'https://media.api-sports.io/football/players/44.png' }
    ];

    results.players = mockPlayers.filter(p => p.name.toLowerCase().includes(term));

    const mockLeagues = [
      { id: 307, name: 'الدوري السعودي', emoji: '🇸🇦', country: 'السعودية' },
      { id: 140, name: 'الدوري الإسباني', emoji: '🇪🇸', country: 'إسبانيا' },
      { id: 39, name: 'الدوري الإنجليزي', emoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', country: 'إنجلترا' }
    ];

    results.leagues = mockLeagues.filter(l => l.name.toLowerCase().includes(term));

    // If key is present, we attempt to enrich from the live API
    if (RAPID_API_KEY) {
      try {
        // Query Teams
        const teamRes = await rapidApiClient.get('/teams', { params: { search: query } });
        const remoteTeams = teamRes.data?.response || [];
        if (remoteTeams.length > 0) {
          results.teams = remoteTeams.slice(0, 5).map(item => ({
            id: item.team.id,
            name: item.team.name,
            logo: item.team.logo,
            country: item.team.country
          }));
        }
      } catch (err) {
        console.warn('Remote search query on RapidAPI bypassed due to rate limit.', err);
      }
    }

    return results;
  }
};
