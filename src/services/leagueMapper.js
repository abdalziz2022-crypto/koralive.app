/**
 * Mappers to sanitize and transform raw API or Firestore league data
 * into clean, reliable, and uniform structures for our FotMob-styled League Screen.
 */

/**
 * Maps a league raw data payload to clean Header properties
 * @param {object} rawLeague 
 * @returns {object} formatted league header
 */
export function mapLeagueHeader(rawLeague) {
  if (!rawLeague) return null;

  return {
    id: rawLeague.id || '',
    name: rawLeague.name || 'بطولة مجهولة',
    logo: rawLeague.logo || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(rawLeague.name || 'U')}`,
    country: rawLeague.country || 'دولي',
    season: rawLeague.apiSeason || new Date().getFullYear(),
    competitionType: rawLeague.country === 'Europe' || rawLeague.name.includes('أبطال') ? 'كأس القارة' : 'دوري ممتاز',
    currentMatchday: 'الجولة الأخيرة'
  };
}

/**
 * Maps and groups a list of matches of a specific league into Status Sections
 * @param {Array} rawMatches 
 * @returns {object} structured matches segmented by status
 */
export function mapLeagueMatches(rawMatches) {
  if (!Array.isArray(rawMatches)) {
    return { live: [], today: [], finished: [], upcoming: [] };
  }

  const matches = rawMatches.map(m => ({
    id: m.id || '',
    homeTeam: m.homeTeam || 'الفريق المستضيف',
    awayTeam: m.awayTeam || 'الفريق الضيف',
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
    commentator: m.commentator || 'سيتوفر لاحقاً',
    channel: m.channel || 'قناة ناقلة',
    youtubeLink: m.youtubeLink || '',
    replayLinks: m.replayLinks || [],
    highlightsLinks: m.highlightsLinks || []
  }));

  // Segment matches
  const live = matches.filter(m => m.status === 'LIVE');
  const finished = matches.filter(m => m.status === 'FINISHED');
  const upcoming = matches.filter(m => m.status === 'UPCOMING');

  return {
    live,
    finished,
    upcoming,
    all: matches
  };
}

/**
 * Maps the league standings table safely
 * @param {Array} rawStandings 
 * @returns {Array} mapped standing items
 */
export function mapLeagueStandings(rawStandings) {
  if (!Array.isArray(rawStandings)) return [];

  return rawStandings.map(t => ({
    rank: t.rank || 0,
    status: t.status || 'same',
    team: {
      id: t.team?.id || t.team?.name || '',
      name: t.team?.name || 'فريق',
      logo: t.team?.logo || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(t.team?.name || 'T')}`
    },
    points: t.points || 0,
    goalsDiff: typeof t.goalsDiff === 'number' ? t.goalsDiff : 0,
    all: {
      played: t.all?.played || 0,
      win: t.all?.win || 0,
      draw: t.all?.draw || 0,
      lose: t.all?.lose || 0,
      goals: {
        for: t.all?.goals?.for || 0,
        against: t.all?.goals?.against || 0
      }
    }
  }));
}
