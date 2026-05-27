import { getFixture, getEvents, getStatistics, getLineups } from '../api/matchApi';

function mapHeader(fixtureData: any) {
  if (!fixtureData || !fixtureData.response || fixtureData.response.length === 0) {
    return null;
  }
  const data = fixtureData.response[0];
  return {
    homeTeam: data.teams?.home?.name,
    awayTeam: data.teams?.away?.name,
    homeLogo: data.teams?.home?.logo,
    awayLogo: data.teams?.away?.logo,
    homeGoals: data.goals?.home,
    awayGoals: data.goals?.away,
    league: data.league?.name,
    status: data.fixture?.status?.short,
    elapsedTime: data.fixture?.status?.elapsed
  };
}

function mapTimeline(eventsData: any) {
  if (!eventsData || !eventsData.response) {
    return [];
  }
  
  return eventsData.response.map((event: any) => {
    let mappedType = event.type;
    if (mappedType === 'subst') mappedType = 'Substitution';
    if (mappedType === 'Var') mappedType = 'VAR';

    const minute = event.time?.extra
      ? `${event.time.elapsed}+${event.time.extra}`
      : `${event.time?.elapsed || ''}`;

    return {
      minute,
      type: mappedType,
      player: event.player?.name || '',
      team: event.team?.name || '',
      detail: event.detail || ''
    };
  });
}

function mapStats(statsData: any) {
  if (!statsData || !statsData.response || statsData.response.length < 2) {
    return [];
  }

  const homeStats = statsData.response[0].statistics;
  const awayStats = statsData.response[1].statistics;

  const getStatValue = (stats: any[], type: string) => {
    const stat = stats.find((s: any) => s.type === type);
    return stat?.value !== null && stat?.value !== undefined ? stat.value : 0;
  };

  return [
    {
      label: 'Possession',
      home: getStatValue(homeStats, 'Ball Possession'),
      away: getStatValue(awayStats, 'Ball Possession')
    },
    {
      label: 'Shots',
      home: getStatValue(homeStats, 'Total Shots'),
      away: getStatValue(awayStats, 'Total Shots')
    },
    {
      label: 'Shots on Target',
      home: getStatValue(homeStats, 'Shots on Goal'),
      away: getStatValue(awayStats, 'Shots on Goal')
    },
    {
      label: 'Corners',
      home: getStatValue(homeStats, 'Corner Kicks'),
      away: getStatValue(awayStats, 'Corner Kicks')
    },
    {
      label: 'Fouls',
      home: getStatValue(homeStats, 'Fouls'),
      away: getStatValue(awayStats, 'Fouls')
    }
  ];
}

function mapLineups(lineupsData: any) {
  if (!lineupsData || !lineupsData.response || lineupsData.response.length === 0) {
    return [];
  }
  
  return lineupsData.response.map((lineup: any) => ({
    team: lineup.team?.name,
    logo: lineup.team?.logo,
    formation: lineup.formation,
    startingXI: lineup.startXI?.map((item: any) => ({
      name: item.player?.name,
      number: item.player?.number,
      position: item.player?.pos
    })) || [],
    bench: lineup.substitutes?.map((item: any) => ({
      name: item.player?.name,
      number: item.player?.number,
      position: item.player?.pos
    })) || [],
    coach: lineup.coach?.name
  }));
}

export async function fetchFullMatchDetails(id: string | number) {
  try {
    const [fixtureRes, eventsRes, statsRes, lineupsRes] = await Promise.all([
      getFixture(id),
      getEvents(id),
      getStatistics(id),
      getLineups(id)
    ]);

    return {
      header: mapHeader(fixtureRes),
      timeline: mapTimeline(eventsRes),
      stats: mapStats(statsRes),
      lineups: mapLineups(lineupsRes)
    };
  } catch (error) {
    console.error('Error fetching full match details:', error);
    throw error;
  }
}
