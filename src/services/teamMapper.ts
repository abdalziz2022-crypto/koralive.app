import { Team } from '../types';

export interface TeamDetail {
  id: string;
  name: string;
  logo: string;
  code?: string;
  country?: string;
  founded?: number;
  venueName?: string;
  venueCity?: string;
  venueCapacity?: number;
  venueImage?: string;
}

export function mapRawTeamDetail(raw: any): TeamDetail {
  if (!raw) return {} as TeamDetail;

  const teamObj = raw.team || {};
  const venueObj = raw.venue || {};

  return {
    id: String(teamObj.id || ''),
    name: teamObj.name || '',
    logo: teamObj.logo || '',
    code: teamObj.code || undefined,
    country: teamObj.country || undefined,
    founded: teamObj.founded || undefined,
    venueName: venueObj.name || undefined,
    venueCity: venueObj.city || undefined,
    venueCapacity: venueObj.capacity || undefined,
    venueImage: venueObj.image || undefined
  };
}

export function mapRawTeams(rawList: any[]): TeamDetail[] {
  if (!Array.isArray(rawList)) return [];
  return rawList.map(mapRawTeamDetail);
}

export function mapTeamHeader(raw: any) {
  if (!raw) return null;
  const teamObj = raw.team || raw;
  const venueObj = raw.venue || {};
  return {
    id: String(teamObj.id || ''),
    name: teamObj.name || '',
    logo: teamObj.logo || '',
    founded: teamObj.founded || '',
    venue: venueObj.name || '',
    city: venueObj.city || '',
    capacity: venueObj.capacity || '',
    country: teamObj.country || ''
  };
}

export function mapTeamMatches(rawMatches: any) {
  const list = Array.isArray(rawMatches) ? rawMatches : (rawMatches?.response || []);
  const allMapped = list.map((m: any) => {
    const fixture = m.fixture || {};
    const teams = m.teams || {};
    const goals = m.goals || {};
    const statusShort = fixture.status?.short || '';
    const isLive = ['1H', '2H', 'ET', 'P', 'LIVE', 'HT'].includes(statusShort.toUpperCase());
    
    return {
      id: fixture.id ? `apf-${fixture.id}` : String(Math.random()),
      homeTeam: teams.home?.name || '',
      awayTeam: teams.away?.name || '',
      homeLogo: teams.home?.logo || '',
      awayLogo: teams.away?.logo || '',
      homeScore: goals.home ?? null,
      awayScore: goals.away ?? null,
      status: statusShort || 'NS',
      isLive,
      league: m.league?.name || '',
      leagueLogo: m.league?.logo || '',
      startTime: fixture.date,
      utcDate: fixture.date,
      minute: fixture.status?.elapsed || undefined
    };
  });

  // Sort recent: descending (latest first)
  const recent = allMapped
    .filter((m: any) => ['FT', 'PEN', 'AET', 'FINISHED'].includes(m.status))
    .sort((a, b) => new Date(b.startTime || 0).getTime() - new Date(a.startTime || 0).getTime());

  // Sort upcoming: ascending (closest first)
  const upcoming = allMapped
    .filter((m: any) => ['NS', 'TBD', 'SCHEDULED', 'UPCOMING', 'PST'].includes(m.status))
    .sort((a, b) => new Date(a.startTime || 0).getTime() - new Date(b.startTime || 0).getTime());

  return {
    live: allMapped.filter((m: any) => m.isLive),
    finished: recent,
    recent: recent,
    upcoming: upcoming,
    all: allMapped
  };
}

export function mapTeamPlayers(rawPlayers: any) {
  const list = Array.isArray(rawPlayers) ? rawPlayers : (rawPlayers?.response?.[0]?.players || rawPlayers?.players || []);
  return list.map((item: any) => ({
    id: String(item.id || item.player?.id || ''),
    name: item.name || item.player?.name || '',
    number: item.number || item.player?.number || undefined,
    position: item.position || item.player?.position || 'لاعب',
    photo: item.photo || item.player?.photo || '',
    age: item.age || item.player?.age || undefined
  }));
}

export function mapTeamStats(rawStats: any) {
  return rawStats || {};
}

