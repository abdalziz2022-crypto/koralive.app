export function mapMatchDetails(rawMatch) {
  if (!rawMatch) return null;

  const scoreHome = rawMatch.score?.fullTime?.home ?? 0;
  const scoreAway = rawMatch.score?.fullTime?.away ?? 0;

  // Extract primary referee if exists in list
  let refereeName = 'غير محدد';
  if (rawMatch.referees && rawMatch.referees.length > 0) {
    refereeName = rawMatch.referees[0].name;
  } else if (rawMatch.referee) {
    refereeName = typeof rawMatch.referee === 'string' ? rawMatch.referee : (rawMatch.referee.name || 'غير محدد');
  }

  // Normalize statuses
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
    venue: rawMatch.venue || 'ملعب اللقاء الرئيسي الدولي',
    referee: refereeName,
    matchday: rawMatch.matchday || 1,
    stage: rawMatch.stage || 'الدور الأول',
    homeScore: scoreHome,
    awayScore: scoreAway,
    status: normalizedStatus,
    kickoffTime: rawMatch.utcDate || rawMatch.kickoffTime || new Date().toISOString(),
    competition: {
      name: rawMatch.competition?.name || 'البطولة غير معروفة',
      emblem: rawMatch.competition?.emblem || '',
    },
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
    }
  };
}
