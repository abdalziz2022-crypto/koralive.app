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
  minute?: number; // Optional fallback live minute if available
  homeScore: number;
  awayScore: number;
}

export function mapFootballDataResponse(rawMatch: any): MappedMatch {
  const scoreHome = rawMatch.score?.fullTime?.home ?? 0;
  const scoreAway = rawMatch.score?.fullTime?.away ?? 0;

  // Map API Match Status to our standardized states
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
