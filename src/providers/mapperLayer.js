/**
 * Unified Mapper Layer for Football Providers in KoraLive.
 * Maps distinct raw structures from:
 * - Football-Data.org v4
 * - Sportmonks API v3
 * - API-Football.com v3
 * 
 * Into KoraLive standard schemas.
 */

import { mockMatches } from '../lib/mockData';

/**
 * Standard Match model structure matcher
 */
function createStandardMatch({
  id,
  homeTeam,
  awayTeam,
  homeLogo,
  awayLogo,
  homeScore = 0,
  awayScore = 0,
  status = 'UPCOMING',
  league = 'كأس العالم كورة لايف',
  leagueLogo,
  startTime,
  minute = null,
  commentator = 'عيسى الحربين',
  channel = 'SSC 1 HD',
  streamingLinks = []
}) {
  const finalHomeLogo = homeLogo || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(homeTeam)}`;
  const finalAwayLogo = awayLogo || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(awayTeam)}`;
  const finalLeagueLogo = leagueLogo || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(league)}`;

  return {
    id: String(id),
    homeTeam,
    awayTeam,
    homeLogo: finalHomeLogo,
    awayLogo: finalAwayLogo,
    homeScore: Number(homeScore),
    awayScore: Number(awayScore),
    status: status === 'IN_PLAY' || status === 'LIVE' ? 'LIVE' : status === 'FINISHED' || status === 'FT' ? 'FINISHED' : 'UPCOMING',
    league,
    leagueLogo: finalLeagueLogo,
    startTime: startTime || new Date().toISOString(),
    minute: minute ? Number(minute) : null,
    commentator,
    channel,
    streamingLinks: streamingLinks.length > 0 ? streamingLinks : [
      { label: 'البث الرئيسي 1', url: 'https://www.youtube.com/embed/live_match_stream_1', quality: '1080p' },
      { label: 'البث الثاني 2', url: 'https://www.youtube.com/embed/live_match_stream_2', quality: '720p' }
    ]
  };
}

/**
 * Maps raw data from football-data.org (Provider 1)
 */
export function mapFootballDataMatches(raw) {
  if (!raw) return [];
  
  // Custom parsing if football-data.org returns matches wrapped or list
  const matches = raw.matches || raw;
  if (!Array.isArray(matches)) return [];

  return matches.map(m => {
    const homeName = m.homeTeam?.name || m.homeTeam?.shortName || m.homeTeam || 'الفريق المستضيف';
    const awayName = m.awayTeam?.name || m.awayTeam?.shortName || m.awayTeam || 'الفريق الضيف';
    
    let mappedStatus = 'UPCOMING';
    if (m.status === 'IN_PLAY' || m.status === 'LIVE') mappedStatus = 'LIVE';
    if (m.status === 'FINISHED') mappedStatus = 'FINISHED';

    return createStandardMatch({
      id: m.id || `${homeName}-${awayName}`.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      homeTeam: homeName,
      awayTeam: awayName,
      homeLogo: m.homeTeam?.crest || m.homeLogo,
      awayLogo: m.awayTeam?.crest || m.awayLogo,
      homeScore: m.score?.fullTime?.home ?? m.homeScore ?? 0,
      awayScore: m.score?.fullTime?.away ?? m.awayScore ?? 0,
      status: mappedStatus,
      league: m.competition?.name || m.league || 'الدوري الممتاز',
      leagueLogo: m.competition?.emblem || m.leagueLogo,
      startTime: m.utcDate || m.startTime,
      minute: m.minute
    });
  });
}

/**
 * Maps raw data from Sportmonks (Provider 2)
 */
export function mapSportmonksMatches(raw) {
  if (!raw) return [];
  const list = raw.data || raw;
  if (!Array.isArray(list)) return [];

  return list.map(m => {
    // Sportmonks has participants array
    const homeParticipant = m.participants?.find(p => p.meta?.location === 'home') || m.participants?.[0];
    const awayParticipant = m.participants?.find(p => p.meta?.location === 'away') || m.participants?.[1];

    const homeName = homeParticipant?.name || m.home_name || 'صاحب الأرض';
    const awayName = awayParticipant?.name || m.away_name || 'الضيف';

    // Scores
    const homeScoreObj = m.scores?.find(s => s.participant_id === homeParticipant?.id && s.description === 'CURRENT');
    const awayScoreObj = m.scores?.find(s => s.participant_id === awayParticipant?.id && s.description === 'CURRENT');

    let mappedStatus = 'UPCOMING';
    if (m.state?.short_name === 'LIVE' || m.state?.short_name === 'IN_PLAY') mappedStatus = 'LIVE';
    if (m.state?.short_name === 'FT' || m.state?.short_name === 'FINISHED') mappedStatus = 'FINISHED';

    return createStandardMatch({
      id: m.id || `sm-${m.name?.replace(/\s+/g, '_')}`,
      homeTeam: homeName,
      awayTeam: awayName,
      homeLogo: homeParticipant?.image_path || m.home_logo,
      awayLogo: awayParticipant?.image_path || m.away_logo,
      homeScore: homeScoreObj?.score?.goals ?? m.home_score ?? 0,
      awayScore: awayScoreObj?.score?.goals ?? m.away_score ?? 0,
      status: mappedStatus,
      league: m.league?.name || 'دوري سبورت مونكس 🏆',
      leagueLogo: m.league?.image_path || m.league_logo,
      startTime: m.starting_at || m.start_time,
      minute: m.minute
    });
  });
}

/**
 * Maps raw data from API Football (Provider 3)
 */
export function mapApiFootballMatches(raw) {
  if (!raw) return [];
  const list = raw.response || raw;
  if (!Array.isArray(list)) return [];

  return list.map(m => {
    const fixture = m.fixture || {};
    const teams = m.teams || {};
    const goals = m.goals || {};
    const league = m.league || {};

    const homeName = teams.home?.name || 'المضيف';
    const awayName = teams.away?.name || 'الضيف';

    let mappedStatus = 'UPCOMING';
    if (['1H', '2H', 'HT', 'LIVE', 'IN_PLAY'].includes(fixture.status?.short)) mappedStatus = 'LIVE';
    if (['FT', 'AET', 'PEN'].includes(fixture.status?.short)) mappedStatus = 'FINISHED';

    return createStandardMatch({
      id: fixture.id || `apf-${homeName}-${awayName}-${fixture.date || ''}-${Math.random().toString(36).substring(2, 7)}`,
      homeTeam: homeName,
      awayTeam: awayName,
      homeLogo: teams.home?.logo,
      awayLogo: teams.away?.logo,
      homeScore: goals.home ?? 0,
      awayScore: goals.away ?? 0,
      status: mappedStatus,
      league: league.name || 'دوري إيه بي آي كرة القدم 🏆',
      leagueLogo: league.logo,
      startTime: fixture.date,
      minute: fixture.status?.elapsed
    });
  });
}

/**
 * Universal Mapper Interface
 */
export const MapperLayer = {
  /**
   * Safe Standardized Match Details mapping
   */
  mapMatch(provider, raw) {
    if (!raw) return null;
    const mappedList = this.mapMatches(provider, [raw]);
    return mappedList[0] || null;
  },

  /**
   * Unified Matches array mapping after calling Provider
   */
  mapMatches(provider, raw) {
    if (!raw) return [];
    switch (provider) {
      case 'sportmonks':
        return mapSportmonksMatches(raw);
      case 'apifootball':
        return mapApiFootballMatches(raw);
      case 'footballdata':
      default:
        return mapFootballDataMatches(raw);
    }
  },

  /**
   * Unified standings mapper
   */
  mapStandings(provider, raw) {
    if (!raw) return [];

    // Sportmonks Format Standings Mapping
    if (provider === 'sportmonks') {
      const data = raw.data || raw;
      if (!Array.isArray(data)) return [];
      return data.map((item, index) => ({
        rank: item.position || index + 1,
        team: {
          id: item.team_id || item.team?.id,
          name: item.team?.name || 'فريق رياضي',
          logo: item.team?.image_path || ''
        },
        points: item.points || 0,
        goalsDiff: item.overall?.goals_difference || 0,
        all: {
          played: item.overall?.games_played || 0,
          win: item.overall?.won || 0,
          draw: item.overall?.drawn || 0,
          lose: item.overall?.lost || 0,
          goals: {
            for: item.overall?.goals_for || 0,
            against: item.overall?.goals_against || 0
          }
        }
      }));
    }

    // API Football Format Standings Mapping
    if (provider === 'apifootball') {
      const standingsRep = raw.response?.[0]?.league?.standings?.[0] || raw;
      if (!Array.isArray(standingsRep)) return [];
      return standingsRep.map(item => ({
        rank: item.rank || 1,
        team: {
          id: item.team?.id,
          name: item.team?.name || 'فريق',
          logo: item.team?.logo || ''
        },
        points: item.points || 0,
        goalsDiff: item.goalsDiff || 0,
        all: {
          played: item.all?.played || 0,
          win: item.all?.win || 0,
          draw: item.all?.draw || 0,
          lose: item.all?.lose || 0,
          goals: {
            for: item.all?.goals?.for || 0,
            against: item.all?.goals?.against || 0
          }
        }
      }));
    }

    // Default Football Data v4 Format mapping
    const standingsList = raw.standings?.[0]?.table || raw;
    if (!Array.isArray(standingsList)) return [];

    return standingsList.map(item => ({
      rank: item.position || 1,
      team: {
        id: item.team?.id,
        name: item.team?.name || item.team?.shortName || '',
        logo: item.team?.crest || ''
      },
      points: item.points || 0,
      goalsDiff: item.goalDifference || 0,
      all: {
        played: item.playedGames || 0,
        win: item.won || 0,
        draw: item.draw || 0,
        lose: item.lost || 0,
        goals: {
          for: item.goalsFor || 0,
          against: item.goalsAgainst || 0
        }
      }
    }));
  },

  /**
   * Unified team mapping 
   */
  mapTeam(provider, raw) {
    if (!raw) return null;
    
    // Sportmonks team mapping
    if (provider === 'sportmonks') {
      const data = raw.data || raw;
      return {
        id: data.id || 'sportmonks-team',
        name: data.name || 'فريق سبورت مونكس',
        logo: data.image_path || '',
        country: data.country?.name || 'بلد رياضي',
        league: 'دوري سبورت مونكس',
        stadium: data.venue?.name || 'بيئة سبورت مونكس الكروية 🏟️'
      };
    }

    // API Football team mapping
    if (provider === 'apifootball') {
      const teamObj = raw.response?.[0]?.team || raw.team || raw;
      const venueObj = raw.response?.[0]?.venue || raw.venue || {};
      return {
        id: teamObj.id || 'api-football-team',
        name: teamObj.name || 'فريق إيه بي آي',
        logo: teamObj.logo || '',
        country: teamObj.country || 'دولي',
        league: 'البطولة الكبرى',
        stadium: venueObj.name || 'ملعب معتمد 🏟️'
      };
    }

    // Football Data v4
    return {
      id: raw.id || 'football-data-team',
      name: raw.name || raw.shortName || 'فريق رياضي',
      logo: raw.crest || '',
      country: raw.area?.name || 'دولي',
      league: raw.activeCompetitions?.[0]?.name || 'مسابقة كروية',
      stadium: raw.venue || 'ملعب النادي 🏟_'
    };
  },

  /**
   * Unified league mapping
   */
  mapLeague(provider, raw) {
    if (!raw) return null;

    if (provider === 'sportmonks') {
      const data = raw.data || raw;
      return {
        id: data.id,
        name: data.name || 'دوري سبورت مونكس',
        country: 'بلد الكأس',
        logo: data.image_path || ''
      };
    }

    if (provider === 'apifootball') {
      const leagueObj = raw.response?.[0]?.league || raw;
      const countryObj = raw.response?.[0]?.country || {};
      return {
        id: leagueObj.id,
        name: leagueObj.name || 'البطولة الوطنية',
        country: countryObj.name || 'دولي',
        logo: leagueObj.logo || ''
      };
    }

    return {
      id: raw.id,
      name: raw.name || 'مسابقة كروت فوتبول الكبرى',
      country: raw.area?.name || 'دولي',
      logo: raw.emblem || ''
    };
  }
};
