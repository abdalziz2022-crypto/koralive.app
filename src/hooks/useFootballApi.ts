import { useQuery } from '@tanstack/react-query';
import { matchService } from '../services/matchService';
import { leagueService } from '../services/leagueService';
import { standingsService } from '../services/standingsService';
import { teamService } from '../services/teamService';
import { playerService } from '../services/playerService';
import { newsService } from '../services/api/newsService';
import { searchService } from '../services/api/searchService';
import { Match, League, LeagueStandings } from '../types';

/**
 * 1. live matches currently in play
 * Cache Strategy: 30-60 sec staleTime, auto refetch every 30 seconds
 */
export function useLiveMatches() {
  return useQuery<Match[], Error>({
    queryKey: ['liveMatchesV2'],
    queryFn: async () => {
      return await matchService.getLiveMatches();
    },
    staleTime: 30000,          // 30 seconds stale
    refetchInterval: 30000,    // Refetch every 30 seconds
    retry: 2,
  });
}

/**
 * 2. fixtures list with optional date/league filter
 * Cache Strategy: 5–15 min (using 5 minutes = 300000ms)
 */
export function useFixtures(filters: { date?: string; leagueId?: string; season?: string } = {}) {
  return useQuery<Match[], Error>({
    queryKey: ['fixturesV2', filters],
    queryFn: async () => {
      return await matchService.getFixtures(filters);
    },
    staleTime: 300000,         // 5 minutes stale
    retry: 2,
  });
}

/**
 * 3. match details for a specific match
 * Cache Strategy: live interval if in-play, otherwise normal cache
 */
export function useMatchDetails(id: string | undefined) {
  return useQuery<Match | null, Error>({
    queryKey: ['matchDetailsV2', id],
    queryFn: async () => {
      if (!id) return null;
      return await matchService.getMatchDetails(id);
    },
    enabled: !!id,
    staleTime: 15000,          // Short stale time for match details
    refetchInterval: (query) => {
      const match = query.state.data;
      if (match?.isLive) {
        return 30000;          // Auto-refetch every 30 seconds for live matches
      }
      return false;
    },
    retry: 2,
  });
}

/**
 * 4. league standings for custom league & season
 * Cache Strategy: 30 min (1800000ms)
 */
export function useStandings(leagueId: string | number | undefined, season?: string | number) {
  return useQuery<LeagueStandings, Error>({
    queryKey: ['standingsV2', leagueId, season],
    queryFn: async () => {
      if (!leagueId) throw new Error('League ID is required');
      return await standingsService.getStandings(leagueId, season);
    },
    enabled: !!leagueId,
    staleTime: 1800000,        // 30 minutes cache
    retry: 2,
  });
}

/**
 * 5. available leagues/competitions
 * Cache Strategy: 30 min (1800000ms)
 */
export function useLeagues() {
  return useQuery<League[], Error>({
    queryKey: ['leaguesV2'],
    queryFn: async () => {
      return await leagueService.getLeagues();
    },
    staleTime: 1800000,        // 30 minutes cache
    retry: 2,
  });
}

/**
 * 6. team details foundation
 */
export function useTeamDetails(teamId: string | number | undefined) {
  return useQuery({
    queryKey: ['teamDetailsV2', teamId],
    queryFn: async () => {
      if (!teamId) return null;
      return await teamService.getTeamDetails(teamId);
    },
    enabled: !!teamId,
    staleTime: 600000,         // 10 minutes cache
  });
}

/**
 * 7. player details foundation
 */
export function usePlayerDetails(playerId: string | number | undefined, season?: number) {
  return useQuery({
    queryKey: ['playerDetailsV2', playerId, season],
    queryFn: async () => {
      if (!playerId) return null;
      return await playerService.getPlayerDetails(playerId, season);
    },
    enabled: !!playerId,
    staleTime: 600000,         // 10 minutes cache
  });
}

/**
 * BACKWARD COMPATIBILITY ENDPOINTS (Keeps original code compiling)
 */
export function useNews(params: any = {}) {
  return useQuery({
    queryKey: ['news', params],
    queryFn: async () => {
      return await newsService.getArticles(params);
    },
    staleTime: 180000,         // 3 minutes cache
  });
}

export function useHeadlines(count = 6) {
  return useQuery({
    queryKey: ['headlines', count],
    queryFn: async () => {
      return await newsService.getHeadlines(count);
    },
    staleTime: 180000,
  });
}

export function useGlobalSearch(queryText: string) {
  return useQuery({
    queryKey: ['globalSearch', queryText],
    queryFn: async () => {
      if (!queryText || queryText.trim().length < 2) {
        return { teams: [], players: [], matches: [], leagues: [] };
      }
      return await searchService.searchGlobal(queryText);
    },
    enabled: queryText.trim().length >= 2,
    staleTime: 30000,
  });
}

export function useLeagueDetails(leagueId: number | string, season = 2024) {
  return useQuery({
    queryKey: ['leagueDetails', leagueId, season],
    queryFn: async () => {
      const lid = Number(leagueId) || 307;
      const st = await standingsService.getStandings(lid, season);
      return {
        standings: st.standings,
        topScorers: [],
        topAssists: [],
        season,
        id: lid
      };
    },
    staleTime: 120000,
    enabled: !!leagueId,
  });
}
