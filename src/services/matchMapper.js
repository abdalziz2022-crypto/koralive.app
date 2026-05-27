export function mapFootballDataResponse(rawMatch) {
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
