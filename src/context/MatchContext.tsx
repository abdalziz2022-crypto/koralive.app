import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Match, League } from '../types';
import { matchService } from '../services/matchService';
import { leagueService } from '../services/leagueService';

interface MatchContextType {
  matches: Match[];
  leagues: League[];
  loading: boolean;
  liveMatches: Match[];
  activeProvider: string;
  changeProvider: (name: string) => Promise<void>;
  error: string | null;
  refreshData: () => Promise<void>;
}

const MatchContext = createContext<MatchContextType | undefined>(undefined);

export function MatchProvider({ children }: { children: React.ReactNode }) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeProvider] = useState<string>('apifootball');

  const loadAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch leagues purely from match/league API-Football service
      const apiLeagues = await leagueService.getLeagues();
      setLeagues(apiLeagues);
    } catch (e: any) {
      console.warn('[MatchProvider] League fetch failed:', e);
      // Do not crash leagues completely if matches succeed, but set error
      if (e.message?.includes('NO_API_KEY')) {
        setError('حظر تعيين البيانات: لم يجد النظام مفتاح مزامنة API-Football نشط بالخادم.');
      } else {
        setError(e.message || 'حدث خطأ في استعادة الدوريات من الخادم.');
      }
    }

    try {
      // 2. Fetch matches purely from real API-Football match service
      const apiMatches = await matchService.getFixtures();
      setMatches(apiMatches);
    } catch (e: any) {
      console.error('[MatchProvider] Match fetch failed:', e);
      if (e.message?.includes('NO_API_KEY')) {
        setError('حظر تعيين البيانات: لم يجد النظام مفتاح مزامنة API-Football نشط بالخادم.');
      } else {
        setError(e.message || 'فشل الاتصال بالخادم الرئيسي لـ API-Football. الرجاء مراجعة مستكشف الاتصال.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Attempt real live sync initially
    loadAllData();
  }, [loadAllData]);

  const changeProvider = async (name: string) => {
    console.info('[MatchProvider] Service provider is permanently locked onto API-Football:', name);
  };

  const liveMatches = matches.filter(m => m.status === 'LIVE' || m.isLive);

  return (
    <MatchContext.Provider value={{ 
      matches, 
      leagues, 
      loading, 
      liveMatches, 
      activeProvider, 
      changeProvider,
      error,
      refreshData: loadAllData
    }}>
      {children}
    </MatchContext.Provider>
  );
}

export function useMatches() {
  const context = useContext(MatchContext);
  if (context === undefined) {
    throw new Error('useMatches must be used within a MatchProvider');
  }
  return context;
}
