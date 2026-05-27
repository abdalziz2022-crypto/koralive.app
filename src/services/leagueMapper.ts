import { League } from '../types';

export function mapRawLeague(raw: any): League {
  if (!raw) return {} as League;

  // Sometimes response is packed under raw.league
  const mainLeague = raw.league || raw;
  const countryObj = raw.country || {};

  return {
    id: String(mainLeague.id || ''),
    name: mainLeague.name || 'بطولة غير معروفة',
    logo: mainLeague.logo || '',
    country: countryObj.name || mainLeague.country || 'عام',
    apiLeagueId: mainLeague.id ? Number(mainLeague.id) : undefined,
    apiSeason: raw.seasons?.[raw.seasons.length - 1]?.year || undefined
  };
}

export function mapRawLeagues(rawList: any[]): League[] {
  if (!Array.isArray(rawList)) return [];
  return rawList.map(mapRawLeague);
}

export function mapLeagueHeader(raw: any) {
  if (!raw) return null;
  const mainLeague = raw.league || raw;
  return {
    id: String(mainLeague.id || ''),
    name: mainLeague.name || 'الدوري',
    logo: mainLeague.logo || '',
    country: mainLeague.country || 'عام',
    season: mainLeague.season || new Date().getFullYear()
  };
}

export function mapLeagueMatches(rawMatches: any) {
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

  return {
    live: allMapped.filter((m: any) => m.isLive),
    finished: allMapped.filter((m: any) => ['FT', 'PEN', 'AET', 'FINISHED'].includes(m.status)),
    upcoming: allMapped.filter((m: any) => ['NS', 'TBD', 'SCHEDULED', 'UPCOMING'].includes(m.status)),
    all: allMapped
  };
}

