import { create } from 'zustand';
import { Match } from '../types';
import { TimelineEvent, generateMatchEvents } from '../components/TimelineView';

interface MatchState {
  currentMatch: Match | null;
  activeStatsTab: 'overview' | 'stats' | 'momentum' | 'analytics' | 'lineups' | 'standings' | 'h2h' | 'heatmap';
  renderedTabs: Record<string, boolean>;
  timelineEvents: TimelineEvent[];
  
  // Actions
  setCurrentMatch: (match: Match | null) => void;
  setActiveStatsTab: (tab: 'overview' | 'stats' | 'momentum' | 'analytics' | 'lineups' | 'standings' | 'h2h' | 'heatmap') => void;
  resetMatchStore: () => void;
}

export const useMatchStore = create<MatchState>((set) => ({
  currentMatch: null,
  activeStatsTab: 'overview',
  renderedTabs: { overview: true },
  timelineEvents: [],

  setCurrentMatch: (match) => {
    if (!match) {
      set({ 
        currentMatch: null, 
        timelineEvents: [], 
        renderedTabs: { overview: true }, 
        activeStatsTab: 'overview' 
      });
      return;
    }
    
    // Generate events when the match changes
    const events = generateMatchEvents(match);
    
    set({ 
      currentMatch: match, 
      timelineEvents: events 
    });
  },

  setActiveStatsTab: (tab) => {
    set((state) => ({
      activeStatsTab: tab,
      renderedTabs: {
        ...state.renderedTabs,
        [tab]: true
      }
    }));
  },

  resetMatchStore: () => {
    set({
      currentMatch: null,
      activeStatsTab: 'overview',
      renderedTabs: { overview: true },
      timelineEvents: []
    });
  }
}));
