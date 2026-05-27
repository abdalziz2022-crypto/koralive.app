/**
 * Unified API-Football (v3) Mapper for KoraLive.
 * Transforms raw API-Football schemas into standardized models used by KoraLive.
 * Ensures the web app components remain agnostic and do not break current football-data integrations.
 */

/**
 * Maps a single raw fixture or an array of fixtures to KoraLive standard MatchCard format.
 * MatchCard format:
 * {
 *   id,
 *   homeTeam,
 *   awayTeam,
 *   homeLogo,
 *   awayLogo,
 *   score,
 *   status,
 *   competition,
 *   time
 * }
 */
export function mapApiFootballMatch(item) {
  if (!item) return null;

  // Extract internal objects from API-Football structure
  const fixture = item.fixture || {};
  const teams = item.teams || {};
  const goals = item.goals || {};
  const league = item.league || {};

  const homeName = teams.home?.name || 'المضيف';
  const awayName = teams.away?.name || 'الضيف';

  // Normalize status
  let KoraLiveStatus = 'SCHEDULED';
  const apiStatus = fixture.status?.short;

  if (['1H', '2H', 'HT', 'LIVE', 'IN_PLAY', 'ET', 'P', 'BT'].includes(apiStatus)) {
    KoraLiveStatus = 'LIVE';
  } else if (['FT', 'AET', 'PEN', 'FT_PEN_OR_AET'].includes(apiStatus)) {
    KoraLiveStatus = 'FINISHED';
  } else if (['SUSP', 'INT', 'PST', 'CANC', 'ABD'].includes(apiStatus)) {
    KoraLiveStatus = 'POSTPONED';
  }

  return {
    id: fixture.id || `apf-${homeName}-${awayName}-${fixture.date ? fixture.date.substring(0, 10) : ''}-${Math.random().toString(36).substring(2, 7)}`,
    homeTeam: {
      name: homeName,
      crest: teams.home?.logo || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(homeName)}`,
      tla: homeName.slice(0, 3).toUpperCase()
    },
    awayTeam: {
      name: awayName,
      crest: teams.away?.logo || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(awayName)}`,
      tla: awayName.slice(0, 3).toUpperCase()
    },
    score: {
      home: goals.home ?? 0,
      away: goals.away ?? 0,
      halfTimeHome: item.score?.halftime?.home ?? undefined,
      halfTimeAway: item.score?.halftime?.away ?? undefined
    },
    homeScore: goals.home ?? 0,
    awayScore: goals.away ?? 0,
    status: KoraLiveStatus,
    competition: {
      name: league.name || 'الدوري الممتاز',
      emblem: league.logo || ''
    },
    time: fixture.date || new Date().toISOString(),
    utcDate: fixture.date || new Date().toISOString(),
    minute: fixture.status?.elapsed || null
  };
}

/**
 * Maps multiple fixtures to standard format
 */
export function mapApiFootballMatches(rawList) {
  const list = rawList?.response || rawList;
  if (!Array.isArray(list)) return [];
  return list.map(mapApiFootballMatch).filter(Boolean);
}

/**
 * Maps raw API-Football events to standard KoraLive timeline format.
 * Timeline format:
 * {
 *   minute,
 *   type,
 *   player,
 *   team,
 *   detail
 * }
 */
export function mapApiFootballTimeline(rawEvents, homeTeamName = '') {
  const events = rawEvents?.response || rawEvents;
  if (!Array.isArray(events)) return [];

  return events.map(e => {
    const elapsed = e.time?.elapsed || 0;
    const extra = e.time?.extra;
    const minuteStr = extra ? `${elapsed}+${extra}'` : `${elapsed}'`;

    // Map types to uppercase standard keys
    let type = 'VAR';
    const rawType = String(e.type || '').toLowerCase();
    const rawDetail = String(e.detail || '').toLowerCase();

    if (rawType === 'goal') {
      type = 'GOAL';
    } else if (rawType === 'card') {
      if (rawDetail.includes('red')) {
        type = 'RED_CARD';
      } else {
        type = 'YELLOW_CARD';
      }
    } else if (rawType === 'subst') {
      type = 'SUBSTITUTION';
    }

    // Determine team side (home/away)
    let side = 'home';
    if (homeTeamName && e.team?.name) {
      side = String(e.team.name).trim().toLowerCase() === String(homeTeamName).trim().toLowerCase() ? 'home' : 'away';
    } else if (e.team?.logo) {
      // Fallback relative parsing if home name isn't given
      side = 'home';
    }

    // Detail explanations in clean Arabic
    let detailMsg = e.detail || '';
    if (type === 'GOAL') {
      detailMsg = e.assist?.name ? `تمريرة حاسمة بواسطة: ${e.assist.name}` : 'تسديدة مباشرة في الشباك';
    } else if (type === 'YELLOW_CARD') {
      detailMsg = 'بطاقة صفراء - إنذار لسلوك غير رياضي أو عرقلة تكتيكية';
    } else if (type === 'RED_CARD') {
      detailMsg = 'بطاقة حمراء - طرد مباشر من الساحة الخضراء';
    } else if (type === 'SUBSTITUTION') {
      detailMsg = e.assist?.name ? `بدلاً من: ${e.assist.name}` : 'تغيير فني لدعم خطوط اللعب';
    }

    return {
      minute: minuteStr,
      type,
      team: side,
      player: e.player?.name || 'لاعب رياضي',
      detail: detailMsg
    };
  });
}

/**
 * Maps raw API-Football statistics representing standard stats keys.
 * Stats format:
 * {
 *   possession,
 *   shots,
 *   shotsOnTarget,
 *   corners,
 *   fouls
 * }
 */
export function mapApiFootballStats(rawStats) {
  const statsArray = rawStats?.response || rawStats || [];
  
  let possessionHome = 50;
  let possessionAway = 50;
  let shotsHome = 12;
  let shotsAway = 10;
  let shotsOnTargetHome = 5;
  let shotsOnTargetAway = 4;
  let cornersHome = 6;
  let cornersAway = 4;
  let foulsHome = 10;
  let foulsAway = 11;
  let yellowCardsHome = 2;
  let yellowCardsAway = 2;
  let redCardsHome = 0;
  let redCardsAway = 0;

  if (statsArray.length >= 2) {
    const homeStats = statsArray[0]?.statistics || [];
    const awayStats = statsArray[1]?.statistics || [];

    const getStatVal = (list, typeName) => {
      const matchItem = list.find(s => String(s.type).toLowerCase() === String(typeName).toLowerCase());
      if (!matchItem || matchItem.value === null || matchItem.value === undefined) return null;
      // Strip percentage sign and parse
      return parseInt(String(matchItem.value).replace('%', '').trim(), 10);
    };

    const ph = getStatVal(homeStats, 'Ball Possession');
    const pa = getStatVal(awayStats, 'Ball Possession');
    if (ph !== null) {
      possessionHome = ph;
      possessionAway = pa !== null ? pa : 100 - ph;
    }

    shotsHome = getStatVal(homeStats, 'Total Shots') ?? shotsHome;
    shotsAway = getStatVal(awayStats, 'Total Shots') ?? shotsAway;

    shotsOnTargetHome = getStatVal(homeStats, 'Shots on Goal') ?? shotsOnTargetHome;
    shotsOnTargetAway = getStatVal(awayStats, 'Shots on Goal') ?? shotsOnTargetAway;

    cornersHome = getStatVal(homeStats, 'Corner Kicks') ?? cornersHome;
    cornersAway = getStatVal(awayStats, 'Corner Kicks') ?? cornersAway;

    foulsHome = getStatVal(homeStats, 'Fouls') ?? foulsHome;
    foulsAway = getStatVal(awayStats, 'Fouls') ?? foulsAway;

    yellowCardsHome = getStatVal(homeStats, 'Yellow Cards') ?? yellowCardsHome;
    yellowCardsAway = getStatVal(awayStats, 'Yellow Cards') ?? yellowCardsAway;

    redCardsHome = getStatVal(homeStats, 'Red Cards') ?? redCardsHome;
    redCardsAway = getStatVal(awayStats, 'Red Cards') ?? redCardsAway;
  }

  return {
    possession: { home: possessionHome, away: possessionAway, label: 'الاستحواذ على الكرة', suffix: '%' },
    shots: { home: shotsHome, away: shotsAway, label: 'إجمالي المحاولات (تسديدات)' },
    shotsOnTarget: { home: shotsOnTargetHome, away: shotsOnTargetAway, label: 'تسديدات على المرمى' },
    corners: { home: cornersHome, away: cornersAway, label: 'الضربات الركنية' },
    fouls: { home: foulsHome, away: foulsAway, label: 'الأخطاء المرتكبة (فاول)' },
    yellowCards: { home: yellowCardsHome, away: yellowCardsAway, label: 'البطاقات الصفراء' },
    redCards: { home: redCardsHome, away: redCardsAway, label: 'البطاقات الحمراء' }
  };
}

/**
 * Maps raw API-Football lineups to KoraLive format.
 * Lineups format:
 * {
 *   homeFormation,
 *   awayFormation,
 *   homeXI,
 *   awayXI
 * }
 */
export function mapApiFootballLineups(rawResponse) {
  const lineups = rawResponse?.response || rawResponse || [];

  const homeRaw = lineups[0] || {};
  const awayRaw = lineups[1] || {};

  const homeFormation = homeRaw.formation || '4-3-3';
  const awayFormation = awayRaw.formation || '4-2-3-1';

  const mapPlayerDetails = (list) => {
    if (!Array.isArray(list)) return [];
    return list.map((item, idx) => ({
      id: item.player?.id || idx + 500,
      name: item.player?.name || 'لاعب رئيسي',
      number: item.player?.number || idx + 1,
      position: item.player?.pos || 'MF',
      grid: item.player?.grid || null
    }));
  };

  return {
    homeFormation,
    awayFormation,
    homeXI: mapPlayerDetails(homeRaw.startXI),
    awayXI: mapPlayerDetails(awayRaw.startXI),
    homeBench: mapPlayerDetails(homeRaw.substitutes),
    awayBench: mapPlayerDetails(awayRaw.substitutes),
    homeCoach: homeRaw.coach?.name || 'المدير الفني لأصحاب الأرض',
    awayCoach: awayRaw.coach?.name || 'المدير الفني للمنتخب الضيف'
  };
}
