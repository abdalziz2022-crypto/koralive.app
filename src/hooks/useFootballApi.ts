import { useQuery, useMutation } from '@tanstack/react-query';
import { matchesService } from '../services/api/matchesService';
import { teamsService } from '../services/api/teamsService';
import { playersService } from '../services/api/playersService';
import { standingsService } from '../services/api/standingsService';
import { statisticsService } from '../services/api/statisticsService';
import { newsService } from '../services/api/newsService';
import { searchService } from '../services/api/searchService';

/**
 * Hook to retrieve and auto-refresh live results
 */
export function useLiveMatches() {
  return useQuery({
    queryKey: ['liveMatches'],
    queryFn: async () => {
      return await matchesService.getLiveMatches();
    },
    refetchInterval: 30000, // Auto refresh every 30 seconds
    staleTime: 15000,
  });
}

/**
 * Hook to retrieve fixtures list with optional filters
 */
export function useFixtures(filters: any = {}) {
  return useQuery({
    queryKey: ['fixtures', filters],
    queryFn: async () => {
      return await matchesService.getMatches(filters);
    },
    staleTime: 60000, // Cache for 1 minute
  });
}

/**
 * Hook to retrieve standings for any league
 */
export function useStandings(leagueId: number | string, season = 2024) {
  return useQuery({
    queryKey: ['standings', leagueId, season],
    queryFn: async () => {
      return await standingsService.getStandings(Number(leagueId) || 307, season);
    },
    staleTime: 300000, // Standings don't change often, cache for 5 minutes
    enabled: !!leagueId,
  });
}

/**
 * Hook to retrieve complete league details (standings, matches, stats, scorers)
 */
export function useLeagueDetails(leagueId: number | string, season = 2024) {
  return useQuery({
    queryKey: ['leagueDetails', leagueId, season],
    queryFn: async () => {
      const lid = Number(leagueId) || 307;
      const [standings, topScorers, topAssists] = await Promise.all([
        standingsService.getStandings(lid, season).catch(() => []),
        statisticsService.getTopScorers(lid, season).catch(() => []),
        statisticsService.getTopAssists(lid, season).catch(() => [])
      ]);
      return {
        standings,
        topScorers,
        topAssists,
        season,
        id: lid
      };
    },
    staleTime: 120000, // Cache for 2 minutes
    enabled: !!leagueId,
  });
}

/**
 * Hook to retrieve player details and cards
 */
export function usePlayerDetails(playerId: number | string, season = 2024) {
  return useQuery({
    queryKey: ['playerDetails', playerId, season],
    queryFn: async () => {
      if (!playerId) return null;
      return await playersService.getPlayerDetail(Number(playerId), season);
    },
    staleTime: 300000, // 5 minutes caching
    enabled: !!playerId,
  });
}

/**
 * Hook to fetch rss news and articles
 */
export function useNews(params: any = {}) {
  return useQuery({
    queryKey: ['news', params],
    queryFn: async () => {
      return await newsService.getArticles(params);
    },
    staleTime: 180000, // 3 minutes caching
  });
}

/**
 * Hook to fetch top headlines
 */
export function useHeadlines(count = 6) {
  return useQuery({
    queryKey: ['headlines', count],
    queryFn: async () => {
      return await newsService.getHeadlines(count);
    },
    staleTime: 180000,
  });
}

/**
 * Global search implementation autocomplete
 */
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
