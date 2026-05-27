import rapidApiClient, { RAPID_API_KEY } from './rapidApiClient';
import { mapApiFootballMatches, mapApiFootballMatch, mapApiFootballTimeline, mapApiFootballStats, mapApiFootballLineups } from '../apiFootballMapper';
import { mockMatches } from '../../lib/mockData';

export const matchesService = {
  /**
   * Get all live matches
   */
  async getLiveMatches() {
    if (!RAPID_API_KEY) {
      // Return simulated live matches when key is not defined, mapping them to standard soccer layout
      return mockMatches.filter(m => m.status === 'LIVE' || m.status === 'PAUSED');
    }

    try {
      const response = await rapidApiClient.get('/fixtures', {
        params: { live: 'all' }
      });
      return mapApiFootballMatches(response.data);
    } catch (error) {
      console.warn('Failed to fetch real live matches from RapidAPI, using fallback:', error);
      return mockMatches.filter(m => m.status === 'LIVE' || m.status === 'PAUSED');
    }
  },

  /**
   * Get all matches filtered by date, league or team
   */
  async getMatches(filters = {}) {
    if (!RAPID_API_KEY) {
      let filtered = [...mockMatches];
      if (filters.date) {
        // Simple day matching
        filtered = filtered.filter(m => {
          const mDate = m.startTime?.split('T')[0];
          return mDate === filters.date;
        });
      }
      if (filters.league) {
        filtered = filtered.filter(m => m.league === filters.league);
      }
      return filtered;
    }

    try {
      const params = {};
      if (filters.date) params.date = filters.date;
      if (filters.leagueId) params.league = filters.leagueId;
      if (filters.season) params.season = filters.season;

      // Default to today if no date is passed
      if (!filters.date && !filters.leagueId && !filters.live) {
        params.date = new Date().toISOString().split('T')[0];
      }

      const response = await rapidApiClient.get('/fixtures', { params });
      return mapApiFootballMatches(response.data);
    } catch (error) {
      console.warn('Failed to fetch fixtures from RapidAPI, using local mock data:', error);
      let filtered = [...mockMatches];
      if (filters.date) {
        filtered = filtered.filter(m => m.startTime?.split('T')[0] === filters.date);
      }
      return filtered;
    }
  },

  /**
   * Get main details of a single match by ID
   */
  async getMatchDetail(fixtureId) {
    const rawId = String(fixtureId).replace('apf-', '');
    if (!RAPID_API_KEY) {
      const match = mockMatches.find(m => String(m.id) === rawId) || mockMatches[0];
      return match;
    }

    try {
      const response = await rapidApiClient.get('/fixtures', {
        params: { id: rawId }
      });
      const matches = mapApiFootballMatches(response.data);
      return matches[0] || mockMatches[0];
    } catch (error) {
      console.warn(`Failed to fetch match status from RapidAPI for ${rawId}:`, error);
      return mockMatches.find(m => String(m.id) === rawId) || mockMatches[0];
    }
  },

  /**
   * Get live events of a match
   */
  async getMatchEvents(fixtureId) {
    const rawId = String(fixtureId).replace('apf-', '');
    if (!RAPID_API_KEY) {
      return [];
    }

    try {
      const response = await rapidApiClient.get('/fixtures/events', {
        params: { fixture: rawId }
      });
      return mapApiFootballTimeline(response.data);
    } catch (error) {
      console.warn(`Error compiling events for ${rawId}:`, error);
      return [];
    }
  },

  /**
   * Get stats for a match
   */
  async getMatchStats(fixtureId) {
    const rawId = String(fixtureId).replace('apf-', '');
    if (!RAPID_API_KEY) {
      // Return beautiful simulated charts data
      return {
        possession: { home: 55, away: 45, label: 'الاستحواذ على الكرة', suffix: '%' },
        shots: { home: 14, away: 9, label: 'إجمالي المحاولات (تسديدات)' },
        shotsOnTarget: { home: 6, away: 3, label: 'تسديدات على المرمى' },
        corners: { home: 5, away: 4, label: 'الضربات الركنية' },
        fouls: { home: 11, away: 12, label: 'الأخطاء المرتكبة (فاول)' },
        yellowCards: { home: 2, away: 3, label: 'البطاقات الصفراء' },
        redCards: { home: 0, away: 0, label: 'البطاقات الحمراء' }
      };
    }

    try {
      const response = await rapidApiClient.get('/fixtures/statistics', {
        params: { fixture: rawId }
      });
      return mapApiFootballStats(response.data);
    } catch (error) {
      console.warn(`Error compilation of statistics for match ${rawId}:`, error);
      return {
        possession: { home: 50, away: 50, label: 'الاستحواذ على الكرة', suffix: '%' },
        shots: { home: 10, away: 10, label: 'إجمالي المحاولات (تسديدات)' },
        shotsOnTarget: { home: 4, away: 4, label: 'تسديدات على المرمى' }
      };
    }
  },

  /**
   * Get lineup rosters for both teams
   */
  async getMatchLineups(fixtureId) {
    const rawId = String(fixtureId).replace('apf-', '');
    if (!RAPID_API_KEY) {
      return {
        homeFormation: '4-3-3',
        awayFormation: '4-2-3-1',
        homeXI: [],
        awayXI: []
      };
    }

    try {
      const response = await rapidApiClient.get('/fixtures/lineups', {
        params: { fixture: rawId }
      });
      return mapApiFootballLineups(response.data);
    } catch (error) {
      console.warn(`Error compiling lineups for ${rawId}:`, error);
      return {
        homeFormation: '4-3-3',
        awayFormation: '4-4-2',
        homeXI: [],
        awayXI: []
      };
    }
  },

  /**
   * Match Head to Head history
   */
  async getHeadToHead(homeTeamId, awayTeamId) {
    if (!RAPID_API_KEY) {
      return [];
    }
    try {
      const response = await rapidApiClient.get('/fixtures/headtohead', {
        params: { h2h: `${homeTeamId}-${awayTeamId}` }
      });
      return mapApiFootballMatches(response.data);
    } catch (error) {
      console.warn(`H2H lookup error for ${homeTeamId}-${awayTeamId}:`, error);
      return [];
    }
  },

  /**
   * Match Betting Odds
   */
  async getMatchOdds(fixtureId) {
    const rawId = String(fixtureId).replace('apf-', '');
    if (!RAPID_API_KEY) {
      return {
        homeWin: '2.10',
        draw: '3.40',
        awayWin: '3.10'
      };
    }
    try {
      const response = await rapidApiClient.get('/odds', {
        params: { fixture: rawId }
      });
      const oddsData = response.data?.response?.[0]?.bookmakers?.[0]?.bets?.[0]?.values || [];
      const homeWin = oddsData.find(o => String(o.value).toLowerCase() === 'home')?.odd || '1.95';
      const draw = oddsData.find(o => String(o.value).toLowerCase() === 'draw')?.odd || '3.25';
      const awayWin = oddsData.find(o => String(o.value).toLowerCase() === 'away')?.odd || '3.50';
      return { homeWin, draw, awayWin };
    } catch (error) {
      return { homeWin: '1.95', draw: '3.25', awayWin: '3.50' };
    }
  }
};
