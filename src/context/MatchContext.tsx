import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Match, League } from '../types';
import { mockMatches, mockLeagues } from '../lib/mockData';
import { ProviderResolver } from '../providers/ProviderResolver';

interface MatchContextType {
  matches: Match[];
  leagues: League[];
  loading: boolean;
  liveMatches: Match[];
  activeProvider: string;
  changeProvider: (name: string) => Promise<void>;
}

const MatchContext = createContext<MatchContextType | undefined>(undefined);

export function MatchProvider({ children }: { children: React.ReactNode }) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeProvider, setActiveProvider] = useState<string>(() => ProviderResolver.getActiveProviderOverride());

  const fetchLeagues = async () => {
    try {
      const qL = query(collection(db, 'leagues'), orderBy('name', 'asc'));
      const unsubLeagues = onSnapshot(qL, (snapshot) => {
        const leagueData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as League));
        setLeagues(leagueData.length > 0 ? leagueData : mockLeagues);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'leagues');
        setLeagues(mockLeagues);
      });
      return unsubLeagues;
    } catch (e) {
      setLeagues(mockLeagues);
      return () => {};
    }
  };

  useEffect(() => {
    let unsubMatches: () => void = () => {};
    let unsubLeagues: () => void = () => {};

    const init = async () => {
      setLoading(true);
      unsubLeagues = await fetchLeagues();

      if (activeProvider === 'footballdata') {
        // Use live Firestore stream for the default provider
        try {
          const qM = query(collection(db, 'matches'), orderBy('startTime', 'desc'), limit(50));
          unsubMatches = onSnapshot(qM, (snapshot) => {
            const matchData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match));
            setMatches(matchData.length > 0 ? matchData : mockMatches);
            setLoading(false);
          }, (error) => {
            handleFirestoreError(error, OperationType.LIST, 'matches');
            setMatches(mockMatches);
            setLoading(false);
          });
        } catch (err) {
          setMatches(mockMatches);
          setLoading(false);
        }
      } else {
        // Fetch from mapped Multi-Provider architecture
        try {
          const providerMatches = await ProviderResolver.getMatches();
          setMatches(providerMatches as Match[]);
        } catch (err) {
          console.error('Failed to retrieve provider matches, using mocks:', err);
          setMatches(mockMatches);
        } finally {
          setLoading(false);
        }
      }
    };

    init();

    return () => {
      unsubMatches();
      unsubLeagues();
    };
  }, [activeProvider]);

  const changeProvider = async (name: string) => {
    ProviderResolver.setActiveProviderOverride(name);
    setActiveProvider(name);
  };

  const liveMatches = matches.filter(m => m.status === 'LIVE');

  return (
    <MatchContext.Provider value={{ matches, leagues, loading, liveMatches, activeProvider, changeProvider }}>
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
