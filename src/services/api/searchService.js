import apiClient, { getActiveApiKey } from '../../api/apiClient';

export const searchService = {
  /**
   * Performs a global search across local and remote providers using ONLY active real endpoints
   */
  async searchGlobal(query) {
    const term = String(query).trim();
    if (!term || term.length < 3) return { teams: [], players: [], matches: [], leagues: [] };

    const key = getActiveApiKey();
    if (!key) {
      throw new Error('NO_API_KEY: الرجاء تهيئة مفتاح API-Football لمزامنة عمليات البحث المباشرة.');
    }

    const results = {
      teams: [],
      players: [],
      matches: [],
      leagues: []
    };

    try {
      // 1. Query Teams matching name
      const teamRes = await apiClient.get('/teams', { params: { search: term } });
      const remoteTeams = teamRes.data?.response || [];
      results.teams = remoteTeams.slice(0, 10).map(item => ({
        id: item.team.id,
        name: item.team.name,
        logo: item.team.logo,
        country: item.team.country
      }));
    } catch (err) {
      console.warn('Teams search failed or rate-limited:', err);
    }

    try {
      // 2. Query Players matching name
      const playerRes = await apiClient.get('/players', { params: { search: term } });
      const remotePlayers = playerRes.data?.response || [];
      results.players = remotePlayers.slice(0, 10).map(item => ({
        id: item.player.id,
        name: item.player.name,
        photo: item.player.photo || `https://media.api-sports.io/football/players/${item.player.id}.png`,
        team: item.statistics?.[0]?.team?.name || 'غير معروف',
        teamId: item.statistics?.[0]?.team?.id
      }));
    } catch (err) {
      console.warn('Players search failed or rate-limited:', err);
    }

    try {
      // 3. Query Leagues list matching name
      const leagueRes = await apiClient.get('/leagues', { params: { search: term } });
      const remoteLeagues = leagueRes.data?.response || [];
      results.leagues = remoteLeagues.slice(0, 6).map(item => ({
        id: item.league.id,
        name: item.league.name,
        logo: item.league.logo,
        country: item.league.country
      }));
    } catch (err) {
      console.warn('Leagues search failed or rate-limited:', err);
    }

    // Since searching matches directly on API-Football requires specific queries (date, live, league, team, etc.),
    // we search globally in today's active matches that match the player query.
    try {
      const response = await apiClient.get('/fixtures', {
        params: { live: 'all' }
      });
      const matches = response.data?.response || [];
      const termLower = term.toLowerCase();
      results.matches = matches.filter((item: any) => 
        item.teams?.home?.name?.toLowerCase().includes(termLower) ||
        item.teams?.away?.name?.toLowerCase().includes(termLower) ||
        item.league?.name?.toLowerCase().includes(termLower)
      ).slice(0, 10).map((item: any) => ({
        id: String(item.fixture.id),
        homeTeam: item.teams.home.name,
        awayTeam: item.teams.away.name,
        homeLogo: item.teams.home.logo,
        awayLogo: item.teams.away.logo,
        homeScore: item.goals.home,
        awayScore: item.goals.away,
        status: item.fixture.status.short,
        minute: item.fixture.status.elapsed,
        league: item.league.name,
        startTime: item.fixture.date
      }));
    } catch (err) {
      console.warn('Matches live global search fallback failed:', err);
    }

    return results;
  }
};
