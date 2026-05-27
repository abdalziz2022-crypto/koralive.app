export interface PlayerDetail {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  age?: number;
  nationality?: string;
  height?: string;
  weight?: string;
  photo?: string;
  injured?: boolean;
  teamId?: string;
  teamName?: string;
  teamLogo?: string;
  position?: string;
  goals?: number;
  assists?: number;
}

export function mapRawPlayerDetail(raw: any): PlayerDetail {
  if (!raw) return {} as PlayerDetail;

  const playerObj = raw.player || {};
  const firstStat = (raw.statistics && raw.statistics[0]) || {};

  return {
    id: String(playerObj.id || ''),
    name: playerObj.name || '',
    firstName: playerObj.firstname || undefined,
    lastName: playerObj.lastname || undefined,
    age: playerObj.age || undefined,
    nationality: playerObj.nationality || undefined,
    height: playerObj.height || undefined,
    weight: playerObj.weight || undefined,
    photo: playerObj.photo || undefined,
    injured: playerObj.injured || false,
    teamId: firstStat.team?.id ? String(firstStat.team.id) : undefined,
    teamName: firstStat.team?.name || undefined,
    teamLogo: firstStat.team?.logo || undefined,
    position: firstStat.games?.position || undefined,
    goals: firstStat.goals?.total || 0,
    assists: firstStat.goals?.assists || 0
  };
}

export function mapRawPlayers(rawList: any[]): PlayerDetail[] {
  if (!Array.isArray(rawList)) return [];
  return rawList.map(mapRawPlayerDetail);
}

export function mapPlayerHeader(raw: any) {
  if (!raw) return null;
  const p = raw.player || raw;
  const stats = raw.statistics?.[0] || {};
  return {
    id: String(p.id || ''),
    name: p.name || '',
    photo: p.photo || '',
    nationality: p.nationality || '',
    age: p.age || '',
    position: stats.games?.position || '',
    teamName: stats.team?.name || '',
    teamLogo: stats.team?.logo || ''
  };
}

export function mapPlayerInfo(raw: any) {
  if (!raw) return [];
  const p = raw.player || raw;
  return [
    { label: 'الاسم الكامل', value: `${p.firstname || ''} ${p.lastname || ''}`.trim() || p.name },
    { label: 'العمر', value: p.age ? `${p.age} سنة` : 'غير متوفر' },
    { label: 'الجنسية', value: p.nationality || 'غير متوفرة' },
    { label: 'الطول', value: p.height || 'غير متوفر' },
    { label: 'الوزن', value: p.weight || 'غير متوفر' },
    { label: 'الإصابة', value: p.injured ? 'نعم (مصاب)' : 'لا (سليم)' }
  ];
}

export function mapPlayerStats(raw: any) {
  if (!raw) return [];
  const stats = raw.statistics?.[0] || {};
  return [
    { label: 'المباريات', value: stats.games?.appearences || 0 },
    { label: 'الأهداف', value: stats.goals?.total || 0 },
    { label: 'التمريرات الحاسمة', value: stats.goals?.assists || 0 },
    { label: 'البطاقات الصفراء', value: stats.cards?.yellow || 0 },
    { label: 'البطاقات الحمراء', value: stats.cards?.red || 0 }
  ];
}

export function mapPlayerMatches(rawMatches: any) {
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

