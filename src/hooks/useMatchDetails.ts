import { useQuery } from '@tanstack/react-query';
import { getMatchById } from '../api/footballApi';

export function useMatchDetails(id: string | number | undefined) {
  return useQuery({
    queryKey: ['matchDetails', id],
    queryFn: async () => {
      if (!id) return null;
      return await getMatchById(id);
    },
    enabled: !!id,
    refetchInterval: (query) => {
      const rawMatch = query.state.data;
      if (!rawMatch) return false;
      
      const status = rawMatch.status; // e.g. 'IN_PLAY', 'PAUSED', 'LIVE'
      if (status === 'IN_PLAY' || status === 'PAUSED' || status === 'LIVE') {
        return 30000; // 30 seconds
      }
      return false;
    },
    staleTime: 10000,
  });
}
