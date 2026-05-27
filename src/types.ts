// Korea90 V2 Strict Type Definitions with Backward Compatibility for transition

export interface Team {
  id: any;
  name: string;
  logo: string;
  // Backward compatibility
  toLowerCase?: () => string;
}

export interface MatchScore {
  home: number | null;
  away: number | null;
}

export interface MatchPeriod {
  first: number | null;
  second: number | null;
  extratime: number | null;
  penalty: number | null;
}

export interface MatchStatusObj {
  long: string;
  short: string;
  elapsed: number | null;
  extra: number | null;
  toLowerCase?: () => string;
}

// Allows both Object descriptions from API-Football & legacy string statuses (e.g. 'FT', 'LIVE')
export type MatchStatus = MatchStatusObj | string | any;

export interface MatchLeagueObj {
  id: number | string;
  name: string;
  country: string;
  logo: string;
  season?: number;
  round?: string;
  toLowerCase?: () => string;
  localeCompare?: (other: any) => number;
}

export type MatchLeague = MatchLeagueObj | string | any;

// Backward Compatibility Aliases for old components
export interface League {
  id: any;
  name: string;
  logo: string;
  country: string;
  apiLeagueId?: number | string;
  apiSeason?: number | string;
  standings?: any;
}

export type News = any;
export type Ad = any;
export type StreamingLink = any;
export type UserProfile = any;
export type Announcement = any;
export type DataSource = any;
export type MatchStats = any;

export interface Match {
  id: string; // Uniform ID mapped prefix as `apf-`
  homeTeam: Team | any;
  awayTeam: Team | any;
  score?: MatchScore;
  status: MatchStatus;
  league: MatchLeague;
  utcDate?: string;
  minute?: number;
  isLive?: boolean;
  events?: MatchEvent[];
  statistics?: MatchStat[];
  lineups?: TeamLineup[];

  // Backward compatibility fields for legacy components
  homeLogo?: string;
  awayLogo?: string;
  homeScore?: number;
  awayScore?: number;
  leagueLogo?: string;
  startTime?: string | Date | any;
  commentator?: string;
  channel?: string;
  streamingLinks?: any[];
  stats?: any;
  stadium?: string;
  referee?: string;
  youtubeLink?: string;
  highlightsLinks?: any;
  replayLinks?: any;
}

export interface MatchEvent {
  time: {
    elapsed: number;
    extra: number | null;
  };
  team: {
    id: number;
    name: string;
    logo?: string;
  };
  player: {
    id: number | null;
    name: string;
  };
  assist: {
    id: number | null;
    name: string | null;
  };
  type: 'Goal' | 'Card' | 'subst' | 'Var' | string;
  detail: string;
  comments: string | null;
}

export interface MatchStat {
  type: string;
  home: string | number;
  away: string | number;
}

export interface PlayerNode {
  id: number;
  name: string;
  number: number;
  pos: 'G' | 'D' | 'M' | 'F' | string;
  grid: string | null; // e.g. "1:1"
}

export interface TeamLineup {
  team: Team;
  formation: string;
  startXI: { player: PlayerNode }[];
  substitutes: { player: PlayerNode }[];
  coach: {
    name: string;
    photo?: string;
  };
}

export interface StandingsRow {
  rank: number;
  team: Team;
  played: number;
  win: number;
  draw: number;
  lose: number;
  goalsFor: number;
  goalsAgainst: number;
  goalsDiff: number;
  points: number;
  form: string;
}

export interface LeagueStandings {
  leagueId: number;
  leagueName: string;
  season: number;
  standings: StandingsRow[];
}

export interface NewsArticle {
  id: string;
  title: string;
  link: string;
  pubDate: string;
  creator?: string;
  contentSnippet?: string;
  content?: string;
  imageUrl?: string;
  source: string;
}

export interface AppSettings {
  theme: 'dark' | 'light';
  language: 'ar';
  notificationsEnabled: boolean;
}

export interface Bookmarks {
  matches: string[];
  teams: string[];
  news: string[];
}
