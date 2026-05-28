// Custom Leagues and Matches Filtering Utility
import { Match, League } from '../types';

export interface CustomLeague {
  id: string;
  apiId: number;
  name: string;
  country: string;
  emoji: string;
  logo: string;
  bg?: string;
  tag?: string;
  enabled: boolean;
}

export const DEFAULT_LEAGUES: CustomLeague[] = [
  {
    id: 'l1',
    apiId: 307,
    name: 'الدوري السعودي للمحترفين',
    country: 'السعودية',
    emoji: '🇸🇦',
    logo: 'https://media.api-sports.io/football/leagues/307.png',
    bg: 'from-emerald-500/10 to-transparent border-emerald-500/25',
    tag: 'روشن للمحترفين',
    enabled: true
  },
  {
    id: 'l2',
    apiId: 39,
    name: 'الدوري الإنجليزي الممتاز',
    country: 'إنجلترا',
    emoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    logo: 'https://media.api-sports.io/football/leagues/39.png',
    bg: 'from-violet-500/10 to-transparent border-violet-500/25',
    tag: 'بريميرليغ',
    enabled: true
  },
  {
    id: 'l3',
    apiId: 140,
    name: 'الدوري الإسباني (لا ليغا)',
    country: 'إسبانيا',
    emoji: '🇪🇸',
    logo: 'https://media.api-sports.io/football/leagues/140.png',
    bg: 'from-amber-500/10 to-transparent border-amber-500/25',
    tag: 'لا ليغا',
    enabled: true
  },
  {
    id: 'l4',
    apiId: 2,
    name: 'دوري أبطال أوروبا',
    country: 'أوروبا',
    emoji: '🇪🇺',
    logo: 'https://media.api-sports.io/football/leagues/2.png',
    bg: 'from-blue-500/10 to-transparent border-blue-500/25',
    tag: 'يو سي إل',
    enabled: true
  },
  {
    id: 'l5',
    apiId: 135,
    name: 'الدوري الإيطالي الممتاز',
    country: 'إيطاليا',
    emoji: '🇮🇹',
    logo: 'https://media.api-sports.io/football/leagues/135.png',
    bg: 'from-rose-500/10 to-transparent border-rose-500/25',
    tag: 'سيري آ',
    enabled: true
  },
  {
    id: 'l6',
    apiId: 78,
    name: 'الدوري الألماني (البوندسليغا)',
    country: 'ألمانيا',
    emoji: '🇩🇪',
    logo: 'https://media.api-sports.io/football/leagues/78.png',
    bg: 'from-red-500/10 to-transparent border-red-500/25',
    tag: 'البوندسليغا',
    enabled: true
  },
  {
    id: 'l7',
    apiId: 61,
    name: 'الدوري الفرنسي (ليغ 1)',
    country: 'فرنسا',
    emoji: '🇫🇷',
    logo: 'https://media.api-sports.io/football/leagues/61.png',
    bg: 'from-sky-500/10 to-transparent border-sky-500/25',
    tag: 'ليغ 1',
    enabled: true
  }
];

// Load customization status from localStorage
export function getStoredFilterSettings() {
  const isEnabledStr = localStorage.getItem('koralive_enable_custom_filtering');
  const isEnabled = isEnabledStr === 'true'; // Default false unless set
  
  const savedLeaguesStr = localStorage.getItem('koralive_customized_leagues_list');
  let leagues = DEFAULT_LEAGUES;
  
  if (savedLeaguesStr) {
    try {
      leagues = JSON.parse(savedLeaguesStr);
    } catch (e) {
      console.error('Error parsing customized leagues, falling back to defaults', e);
    }
  }
  
  return { isEnabled, leagues };
}

// Save customization status to localStorage
export function saveStoredFilterSettings(isEnabled: boolean, leagues: CustomLeague[]) {
  localStorage.setItem('koralive_enable_custom_filtering', String(isEnabled));
  localStorage.setItem('koralive_customized_leagues_list', JSON.stringify(leagues));
}

// Filter a list of matches by only returning those belonging to enabled leagues
export function filterMatchesByCustomLeagues(matches: Match[]): Match[] {
  const { isEnabled, leagues } = getStoredFilterSettings();
  if (!isEnabled) return matches;
  
  const enabledApiIds = leagues
    .filter(l => l.enabled)
    .map(l => l.apiId);
    
  if (enabledApiIds.length === 0) return matches; // fallback to showing all if none selected
  
  return matches.filter(m => {
    // API match payload can have league.id (number)
    const leagueId = m.leagueDetails?.id || (m as any).leagueId || (typeof m.league === 'object' ? (m.league as any).id : null);
    if (!leagueId) return true; // keep if we don't know the ID
    return enabledApiIds.includes(Number(leagueId));
  });
}

// Filter leagues for display / sidebar context
export function filterLeaguesByCustomLeagues(allLeagues: League[]): League[] {
  const { isEnabled, leagues } = getStoredFilterSettings();
  if (!isEnabled) return allLeagues;
  
  const enabledApiIds = leagues
    .filter(l => l.enabled)
    .map(l => l.apiId);
    
  if (enabledApiIds.length === 0) return allLeagues;
  
  return allLeagues.filter(l => {
    const lid = l.apiLeagueId || l.id;
    return enabledApiIds.includes(Number(lid));
  });
}
