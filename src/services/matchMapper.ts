import { Match, MatchEvent, MatchStat, TeamLineup, Team } from '../types';

export function mapRawMatch(raw: any): Match {
  if (!raw) return {} as Match;

  // Handle nested structure from API-Football
  const fixture = raw.fixture || {};
  const teams = raw.teams || {};
  const goals = raw.goals || {};
  const scoreObj = raw.score || {};
  const leagueObj = raw.league || {};

  const homeTeam: Team = {
    id: teams.home?.id || '',
    name: teams.home?.name || 'فريق مضيف',
    logo: teams.home?.logo || 'https://media.api-sports.io/football/teams/unknown.png'
  };

  const awayTeam: Team = {
    id: teams.away?.id || '',
    name: teams.away?.name || 'فريق ضيف',
    logo: teams.away?.logo || 'https://media.api-sports.io/football/teams/unknown.png'
  };

  const statusShort = fixture.status?.short || '';
  const isLive = ['1H', '2H', 'ET', 'P', 'LIVE', 'HT'].includes(statusShort.toUpperCase());

  const mappedMatch: Match = {
    id: fixture.id ? `apf-${fixture.id}` : String(Math.random()),
    homeTeam,
    awayTeam,
    score: {
      home: goals.home !== undefined ? goals.home : null,
      away: goals.away !== undefined ? goals.away : null
    },
    status: {
      long: fixture.status?.long || 'غير مجدول',
      short: statusShort || 'NS',
      elapsed: fixture.status?.elapsed !== undefined ? fixture.status.elapsed : null,
      extra: fixture.status?.extra || null
    },
    minute: fixture.status?.elapsed || undefined,
    isLive,
    utcDate: fixture.date || new Date().toISOString(),
    startTime: fixture.date || undefined,
    league: {
      id: leagueObj.id || '',
      name: leagueObj.name || 'بطولة',
      country: leagueObj.country || 'عام',
      logo: leagueObj.logo || '',
      season: leagueObj.season || new Date().getFullYear(),
      round: leagueObj.round || ''
    },
    // Backward compatibility fields
    homeLogo: homeTeam.logo,
    awayLogo: awayTeam.logo,
    homeScore: goals.home !== undefined ? goals.home : undefined,
    awayScore: goals.away !== undefined ? goals.away : undefined,
    leagueLogo: leagueObj.logo || '',
    stadium: fixture.venue?.name ? `${fixture.venue.name}, ${fixture.venue.city || ''}` : undefined,
    referee: fixture.referee || undefined,
  };

  return mappedMatch;
}

export function mapRawMatches(rawList: any[]): Match[] {
  if (!Array.isArray(rawList)) return [];
  return rawList.map(mapRawMatch);
}

export function mapRawEvent(raw: any): MatchEvent {
  return {
    time: {
      elapsed: raw.time?.elapsed || 0,
      extra: raw.time?.extra || null
    },
    team: {
      id: raw.team?.id || 0,
      name: raw.team?.name || '',
      logo: raw.team?.logo
    },
    player: {
      id: raw.player?.id || null,
      name: raw.player?.name || ''
    },
    assist: {
      id: raw.assist?.id || null,
      name: raw.assist?.name || null
    },
    type: raw.type || '',
    detail: raw.detail || '',
    comments: raw.comments || null
  };
}

export function mapRawEvents(rawList: any[]): MatchEvent[] {
  if (!Array.isArray(rawList)) return [];
  return rawList.map(mapRawEvent);
}

export function mapRawStats(rawList: any[]): MatchStat[] {
  if (!Array.isArray(rawList) || rawList.length < 2) return [];

  const homeStats = rawList[0]?.statistics || [];
  const awayStats = rawList[1]?.statistics || [];

  const types = Array.from(new Set([
    ...homeStats.map((s: any) => s.type),
    ...awayStats.map((s: any) => s.type)
  ])) as string[];

  return types.map(type => {
    const homeVal = homeStats.find((s: any) => s.type === type)?.value ?? 0;
    const awayVal = awayStats.find((s: any) => s.type === type)?.value ?? 0;
    return {
      type,
      home: homeVal,
      away: awayVal
    };
  });
}

export function mapRawLineups(rawList: any[]): TeamLineup[] {
  if (!Array.isArray(rawList)) return [];

  return rawList.map(item => {
    const team: Team = {
      id: item.team?.id || '',
      name: item.team?.name || '',
      logo: item.team?.logo || ''
    };

    return {
      team,
      formation: item.formation || '4-3-3',
      startXI: (item.startXI || []).map((x: any) => ({
        player: {
          id: x.player?.id || 0,
          name: x.player?.name || '',
          number: x.player?.number || 0,
          pos: x.player?.pos || 'M',
          grid: x.player?.grid || null
        }
      })),
      substitutes: (item.substitutes || []).map((s: any) => ({
        player: {
          id: s.player?.id || 0,
          name: s.player?.name || '',
          number: s.player?.number || 0,
          pos: s.player?.pos || 'M',
          grid: s.player?.grid || null
        }
      })),
      coach: {
        name: item.coach?.name || 'مدرب',
        photo: item.coach?.photo
      }
    };
  });
}

// BACKWARD COMPATIBILITY INTERFACES & HELPERS
export interface MappedMatch {
  id: number;
  homeTeam: {
    name: string;
    crest: string;
    tla: string;
  };
  awayTeam: {
    name: string;
    crest: string;
    tla: string;
  };
  score: {
    home: number;
    away: number;
    halfTimeHome?: number;
    halfTimeAway?: number;
  };
  status: 'LIVE' | 'PAUSED' | 'FINISHED' | 'SCHEDULED' | 'POSTPONED' | string;
  competition: {
    name: string;
    emblem: string;
  };
  utcDate: string;
  minute?: number;
  homeScore: number;
  awayScore: number;
}

export function mapFootballDataResponse(rawMatch: any): MappedMatch {
  const scoreHome = rawMatch.score?.fullTime?.home ?? 0;
  const scoreAway = rawMatch.score?.fullTime?.away ?? 0;

  let normalizedStatus = rawMatch.status;
  if (rawMatch.status === 'IN_PLAY') {
    normalizedStatus = 'LIVE';
  } else if (rawMatch.status === 'PAUSED') {
    normalizedStatus = 'PAUSED';
  } else if (['TIMED', 'SCHEDULED'].includes(rawMatch.status)) {
    normalizedStatus = 'SCHEDULED';
  } else if (rawMatch.status === 'FINISHED') {
    normalizedStatus = 'FINISHED';
  } else if (rawMatch.status === 'POSTPONED') {
    normalizedStatus = 'POSTPONED';
  }

  return {
    id: rawMatch.id,
    homeTeam: {
      name: rawMatch.homeTeam?.name || rawMatch.homeTeam?.shortName || 'غير محدد',
      crest: rawMatch.homeTeam?.crest || '',
      tla: rawMatch.homeTeam?.tla || 'H',
    },
    awayTeam: {
      name: rawMatch.awayTeam?.name || rawMatch.awayTeam?.shortName || 'غير محدد',
      crest: rawMatch.awayTeam?.crest || '',
      tla: rawMatch.awayTeam?.tla || 'A',
    },
    score: {
      home: scoreHome,
      away: scoreAway,
      halfTimeHome: rawMatch.score?.halfTime?.home ?? undefined,
      halfTimeAway: rawMatch.score?.halfTime?.away ?? undefined,
    },
    homeScore: scoreHome,
    awayScore: scoreAway,
    status: normalizedStatus,
    competition: {
      name: rawMatch.competition?.name || 'البطولة غير معروفة',
      emblem: rawMatch.competition?.emblem || '',
    },
    utcDate: rawMatch.utcDate || new Date().toISOString(),
  };
}

