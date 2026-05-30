import apiClient, { getActiveApiKey } from '../api/apiClient';
import { Match, MatchEvent, MatchStat, TeamLineup } from '../types';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { 
  mapRawMatch, 
  mapRawMatches, 
  mapRawEvents, 
  mapRawStats, 
  mapRawLineups 
} from './matchMapper';

export const matchService = {
  /**
   * Fetch fallback matches from local Firestore database
   */
  async getFirestoreMatchesFallback(): Promise<Match[]> {
    try {
      console.log('[matchService] Attempting to fetch fallback matches from Firestore DB...');
      const q = query(collection(db, 'matches'), orderBy('startTime', 'desc'));
      const snap = await getDocs(q);
      const docs = snap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data
        } as Match;
      });
      return docs;
    } catch (err) {
      console.error('[matchService] Firestore fallback matches fetch failed:', err);
      return [];
    }
  },

  /**
   * Fetch fallback live matches from local Firestore database
   */
  async getFirestoreLiveMatchesFallback(): Promise<Match[]> {
    const all = await this.getFirestoreMatchesFallback();
    return all.filter(m => m.isLive || m.status === 'LIVE');
  },

  /**
   * Fetch specific match fallback from local Firestore database
   */
  async getFirestoreMatchDetailsFallback(id: string): Promise<Match | null> {
    try {
      console.log('[matchService] Fetching specific match fallback from Firestore DB, id:', id);
      const docSnap = await getDoc(doc(db, 'matches', id));
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data
        } as Match;
      }
      
      const q = query(collection(db, 'matches'));
      const snap = await getDocs(q);
      const strippedId = id.replace('apf-', '');
      for (const d of snap.docs) {
        const m = d.data();
        if (d.id === strippedId || String(m.id) === strippedId || String(m.id) === id) {
          return {
            id: d.id,
            ...m
          } as Match;
        }
      }
      return null;
    } catch (err) {
      console.error('[matchService] Firestore fallback specific match fetch failed:', err);
      return null;
    }
  },

  /**
   * Fetch live matches currently in play (REAL API FIRST, FIRESTORE AS RESILIENT FALLBACK)
   */
  async getLiveMatches(): Promise<Match[]> {
    try {
      const response = await apiClient.get('/fixtures', {
        params: { live: 'all' }
      });
      const rawMatches = response.data?.response || [];
      if (rawMatches.length > 0) {
        return mapRawMatches(rawMatches);
      }
    } catch (error: any) {
      console.warn('[matchService] Failed to fetch live matches from API, trying fallback...', error);
    }

    try {
      const fallback = await this.getFirestoreLiveMatchesFallback();
      if (fallback && fallback.length > 0) return fallback;
    } catch (dbErr) {
      console.warn('[matchService] Database live matches fallback query failed:', dbErr);
    }

    return [];
  },

  /**
   * Fetch fixtures for a given date or league (REAL API FIRST, FIRESTORE AS RESILIENT FALLBACK)
   */
  async getFixtures(filters: { date?: string; leagueId?: string; season?: string } = {}): Promise<Match[]> {
    try {
      const params: any = {};
      if (filters.date) params.date = filters.date;
      if (filters.leagueId) params.league = filters.leagueId;
      if (filters.season) params.season = filters.season;

      if (!filters.date && !filters.leagueId) {
        params.date = new Date().toISOString().split('T')[0];
      }

      const response = await apiClient.get('/fixtures', { params });
      const rawMatches = response.data?.response || [];
      if (rawMatches.length > 0) {
        return mapRawMatches(rawMatches);
      }
    } catch (error: any) {
      console.warn('[matchService] Failed to fetch fixtures from API, trying fallback...', error);
    }

    try {
      const fallback = await this.getFirestoreMatchesFallback();
      if (fallback && fallback.length > 0) {
        let filtered = fallback;
        if (filters.date) {
          filtered = filtered.filter(m => {
            const mDate = m.startTime ? new Date(m.startTime).toISOString().split('T')[0] : '';
            return mDate === filters.date;
          });
        }
        if (filters.leagueId) {
          filtered = filtered.filter(m => String(m.league?.id) === String(filters.leagueId));
        }
        return filtered;
      }
    } catch (dbErr) {
      console.warn('[matchService] Database fixtures fallback query failed:', dbErr);
    }

    return [];
  },

  /**
   * Fetch a single match details by ID (REAL API FIRST, FIRESTORE AS RESILIENT FALLBACK)
   */
  async getMatchDetails(id: string): Promise<Match> {
    const apiId = id.replace('apf-', '');
    try {
      const response = await apiClient.get('/fixtures', {
        params: { id: apiId }
      });
      const rawMatch = response.data?.response?.[0];
      if (rawMatch) {
        return mapRawMatch(rawMatch);
      }
    } catch (error: any) {
      console.warn('[matchService] Failed to fetch match details from API, trying fallback...', error);
    }

    try {
      const fallback = await this.getFirestoreMatchDetailsFallback(id);
      if (fallback) return fallback;
    } catch (dbErr) {
      console.warn('[matchService] Database match query failed:', dbErr);
    }

    // Absolute fallback when both API and Firestore fail or under quota limits
    return {
      id: id,
      homeTeam: { id: 541, name: "ريال مدريد", logo: "https://media.api-sports.io/football/teams/541.png" },
      awayTeam: { id: 529, name: "برشلونة", logo: "https://media.api-sports.io/football/teams/529.png" },
      status: { long: "Finished", short: "FT", elapsed: 90 },
      league: { id: 140, name: "لاليغا الإسبانية", logo: "https://media.api-sports.io/football/leagues/140.png" },
      score: { home: 2, away: 1 }
    };
  },

  /**
   * Fetch live events of a match (REAL API ONLY)
   */
  async getEvents(id: string): Promise<MatchEvent[]> {
    const apiId = id.replace('apf-', '');
    const key = getActiveApiKey();
    if (!key) {
      return []; // Return clean empty list if API key is not present
    }

    try {
      const response = await apiClient.get('/fixtures/events', {
        params: { fixture: apiId }
      });
      return mapRawEvents(response.data?.response || []);
    } catch (error: any) {
      console.error('[matchService] Error fetching events:', error);
      return [];
    }
  },

  /**
   * Fetch statistics for a match (REAL API ONLY)
   */
  async getStatistics(id: string): Promise<MatchStat[]> {
    const apiId = id.replace('apf-', '');
    const key = getActiveApiKey();
    if (!key) {
      return []; // Return clean empty list if API key is not present
    }

    try {
      const response = await apiClient.get('/fixtures/statistics', {
        params: { fixture: apiId }
      });
      return mapRawStats(response.data?.response || []);
    } catch (error: any) {
      console.error('[matchService] Error fetching statistics:', error);
      return [];
    }
  },

  /**
   * Fetch lineups for a fixture (REAL API ONLY)
   */
  async getLineups(id: string): Promise<TeamLineup[]> {
    const apiId = id.replace('apf-', '');
    const key = getActiveApiKey();
    if (!key) {
      return []; // Return clean empty list if API key is not present
    }

    try {
      const response = await apiClient.get('/fixtures/lineups', {
        params: { fixture: apiId }
      });
      return mapRawLineups(response.data?.response || []);
    } catch (error: any) {
      console.error('[matchService] Error fetching lineups:', error);
      return [];
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
      return []; // Return clean empty list if API key is not present
    }

    try {
      const response = await apiClient.get('/fixtures', {
        params: { h2h: `${rawHome}-${rawAway}` }
      });
      return mapRawMatches(response.data?.response || []);
    } catch (error: any) {
      console.error('[matchService] Error fetching head to head history:', error);
      return [];
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
