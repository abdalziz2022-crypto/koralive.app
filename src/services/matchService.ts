import apiClient, { getActiveApiKey } from '../api/apiClient';
import { Match, MatchEvent, MatchStat, TeamLineup } from '../types';
import { 
  mapRawMatch, 
  mapRawMatches, 
  mapRawEvents, 
  mapRawStats, 
  mapRawLineups 
} from './matchMapper';

export const matchService = {
  /**
   * Fetch live matches currently in play (REAL API ONLY)
   */
  async getLiveMatches(): Promise<Match[]> {
    const key = getActiveApiKey();
    if (!key) {
      throw new Error('NO_API_KEY: الرجاء إدخال مفتاح API-Football حقيقي للمتابعة.');
    }

    try {
      const response = await apiClient.get('/fixtures', {
        params: { live: 'all' }
      });
      
      const rawMatches = response.data?.response || [];
      return mapRawMatches(rawMatches);
    } catch (error: any) {
      console.error('[matchService] Failed to fetch live matches:', error);
      throw error;
    }
  },

  /**
   * Fetch fixtures for a given date or league (REAL API ONLY)
   */
  async getFixtures(filters: { date?: string; leagueId?: string; season?: string } = {}): Promise<Match[]> {
    const key = getActiveApiKey();
    if (!key) {
      throw new Error('NO_API_KEY: الرجاء إدخال مفتاح API-Football حقيقي للمتابعة.');
    }

    try {
      const params: any = {};
      if (filters.date) params.date = filters.date;
      if (filters.leagueId) params.league = filters.leagueId;
      if (filters.season) params.season = filters.season;

      // Default to today if no filters supplied
      if (!filters.date && !filters.leagueId) {
        params.date = new Date().toISOString().split('T')[0];
      }

      const response = await apiClient.get('/fixtures', { params });
      const rawMatches = response.data?.response || [];
      return mapRawMatches(rawMatches);
    } catch (error: any) {
      console.error('[matchService] Failed to fetch fixtures:', error);
      throw error;
    }
  },

  /**
   * Fetch a single match details by ID (REAL API ONLY)
   */
  async getMatchDetails(id: string): Promise<Match> {
    const apiId = id.replace('apf-', '');
    const key = getActiveApiKey();
    if (!key) {
      throw new Error('NO_API_KEY: الرجاء إدخال مفتاح API-Football حقيقي للمتابعة.');
    }

    try {
      const response = await apiClient.get('/fixtures', {
        params: { id: apiId }
      });
      const rawMatch = response.data?.response?.[0];
      if (!rawMatch) {
        throw new Error(`MATCH_NOT_FOUND: لم يتم العثور على المباراة بالمعرف ${apiId}`);
      }
      return mapRawMatch(rawMatch);
    } catch (error: any) {
      console.error('[matchService] Failed to fetch match details:', error);
      throw error;
    }
  },

  /**
   * Fetch live events of a match (REAL API ONLY)
   */
  async getEvents(id: string): Promise<MatchEvent[]> {
    const apiId = id.replace('apf-', '');
    const key = getActiveApiKey();
    if (!key) {
      throw new Error('NO_API_KEY: الرجاء إدخال مفتاح API-Football حقيقي للمتابعة.');
    }

    try {
      const response = await apiClient.get('/fixtures/events', {
        params: { fixture: apiId }
      });
      return mapRawEvents(response.data?.response || []);
    } catch (error: any) {
      console.error('[matchService] Error fetching events:', error);
      throw error;
    }
  },

  /**
   * Fetch statistics for a match (REAL API ONLY)
   */
  async getStatistics(id: string): Promise<MatchStat[]> {
    const apiId = id.replace('apf-', '');
    const key = getActiveApiKey();
    if (!key) {
      throw new Error('NO_API_KEY: الرجاء إدخال مفتاح API-Football حقيقي للمتابعة.');
    }

    try {
      const response = await apiClient.get('/fixtures/statistics', {
        params: { fixture: apiId }
      });
      return mapRawStats(response.data?.response || []);
    } catch (error: any) {
      console.error('[matchService] Error fetching statistics:', error);
      throw error;
    }
  },

  /**
   * Fetch lineups for a fixture (REAL API ONLY)
   */
  async getLineups(id: string): Promise<TeamLineup[]> {
    const apiId = id.replace('apf-', '');
    const key = getActiveApiKey();
    if (!key) {
      throw new Error('NO_API_KEY: الرجاء إدخال مفتاح API-Football حقيقي للمتابعة.');
    }

    try {
      const response = await apiClient.get('/fixtures/lineups', {
        params: { fixture: apiId }
      });
      return mapRawLineups(response.data?.response || []);
    } catch (error: any) {
      console.error('[matchService] Error fetching lineups:', error);
      throw error;
    }
  },

  /**
   * Fetch head to head history for matches (REAL API ONLY)
   */
  async getHeadToHead(homeId: string, awayId: string): Promise<Match[]> {
    const rawHome = homeId.replace('apf-', '');
    const rawAway = awayId.replace('apf-', '');
    const key = getActiveApiKey();
    if (!key) {
      throw new Error('NO_API_KEY: الرجاء إدخال مفتاح API-Football حقيقي للمتابعة.');
    }

    try {
      const response = await apiClient.get('/fixtures', {
        params: { h2h: `${rawHome}-${rawAway}` }
      });
      return mapRawMatches(response.data?.response || []);
    } catch (error: any) {
      console.error('[matchService] Error fetching head to head history:', error);
      throw error;
    }
  }
};

// Deprecated alias compatibility
export async function fetchFullMatchDetails(id: string | number) {
  try {
    const stringId = String(id);
    const [details, events, stats, lineups] = await Promise.all([
      matchService.getMatchDetails(stringId),
      matchService.getEvents(stringId),
      matchService.getStatistics(stringId),
      matchService.getLineups(stringId)
    ]);

    return {
      header: {
        homeTeam: details.homeTeam.name,
        awayTeam: details.awayTeam.name,
        homeLogo: details.homeTeam.logo,
        awayLogo: details.awayTeam.logo,
        homeGoals: details.score?.home ?? null,
        awayGoals: details.score?.away ?? null,
        league: typeof details.league === 'object' ? details.league.name : details.league,
        status: typeof details.status === 'object' ? details.status.short : details.status,
        elapsedTime: typeof details.status === 'object' ? details.status.elapsed : null
      },
      timeline: events.map(e => ({
        minute: e.time.extra ? `${e.time.elapsed}+${e.time.extra}` : `${e.time.elapsed}`,
        type: e.type,
        player: e.player.name,
        team: e.team.name,
        detail: e.detail
      })),
      stats: stats.map(s => ({
        label: s.type,
        home: s.home,
        away: s.away
      })),
      lineups: lineups.map(l => ({
        team: l.team.name,
        logo: l.team.logo,
        formation: l.formation,
        startingXI: l.startXI.map(x => ({
          name: x.player.name,
          number: x.player.number,
          position: x.player.pos
        })),
        bench: l.substitutes.map(s => ({
          name: s.player.name,
          number: s.player.number,
          position: s.player.pos
        })),
        coach: l.coach.name
      }))
    };
  } catch (error) {
    console.error('fetchFullMatchDetails error:', error);
    throw error;
  }
}
