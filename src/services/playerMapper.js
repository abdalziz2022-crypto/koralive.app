/**
 * Mappers to sanitize and parse raw API data or dynamic generated profiles
 * into consistent, localized Arabic titles for KoraLive Player UI screens.
 */

export function mapPlayerHeader(player) {
  if (!player) return null;
  return {
    name: player.name || 'لاعب رياضي',
    team: player.team || 'نادي مستقل',
    teamLogo: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(player.team || 'T')}`,
    position: player.position || 'لاعب كرة قدم',
    number: player.number || 10,
    photo: player.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(player.name || 'P')}`
  };
}

export function mapPlayerInfo(player) {
  if (!player) return null;
  return {
    nationality: player.nationality || 'عالمي',
    age: player.age ? `${player.age} عاماً` : 'غير متوفر',
    height: player.height || 'غير متوفر',
    foot: player.foot || 'غير متوفر'
  };
}

export function mapPlayerStats(stats) {
  if (!stats) {
    return { appearances: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0, minutesPlayed: 0 };
  }
  return {
    appearances: stats.appearances || 0,
    goals: stats.goals || 0,
    assists: stats.assists || 0,
    yellowCards: stats.yellowCards || 0,
    redCards: stats.redCards || 0,
    minutesPlayed: stats.minutesPlayed || 0
  };
}

export function mapPlayerMatches(rawMatches) {
  if (!Array.isArray(rawMatches)) return [];

  // Return formatted array of matches
  return rawMatches.map(m => ({
    id: m.id || '',
    homeTeam: m.homeTeam || '',
    awayTeam: m.awayTeam || '',
    homeLogo: m.homeLogo || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(m.homeTeam || 'H')}`,
    awayLogo: m.awayLogo || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(m.awayTeam || 'A')}`,
    homeScore: typeof m.homeScore === 'number' ? m.homeScore : 0,
    awayScore: typeof m.awayScore === 'number' ? m.awayScore : 0,
    status: m.status || 'UPCOMING',
    league: m.league || '',
    leagueLogo: m.leagueLogo || '',
    startTime: m.startTime || new Date().toISOString(),
    minute: m.minute || null,
    streamingLinks: m.streamingLinks || [],
    commentator: m.commentator || '',
    channel: m.channel || ''
  }));
}
