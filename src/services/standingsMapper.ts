import { StandingsRow, LeagueStandings } from '../types';

export function mapRawStandingsRow(raw: any): StandingsRow {
  if (!raw) return {} as StandingsRow;

  const teamObj = raw.team || {};
  const stats = raw.all || {};
  const goals = stats.goals || {};

  return {
    rank: raw.rank || 0,
    team: {
      id: String(teamObj.id || ''),
      name: teamObj.name || 'فريق',
      logo: teamObj.logo || ''
    },
    played: stats.played || 0,
    win: stats.win || 0,
    draw: stats.draw || 0,
    lose: stats.lose || 0,
    goalsFor: goals.for || 0,
    goalsAgainst: goals.against || 0,
    goalsDiff: raw.goalsDiff !== undefined ? raw.goalsDiff : (goals.for - goals.against || 0),
    points: raw.points || 0,
    form: raw.form || ''
  };
}

export function mapRawStandings(rawResponse: any): LeagueStandings {
  if (!rawResponse || !rawResponse.response || rawResponse.response.length === 0) {
    return {
      leagueId: 0,
      leagueName: 'الدوري المختار',
      season: new Date().getFullYear(),
      standings: []
    };
  }

  const data = rawResponse.response[0];
  const leagueObj = data.league || {};
  // Standings inside the response is an array of arrays.
  const rawRows = leagueObj.standings?.[0] || [];

  return {
    leagueId: leagueObj.id || 0,
    leagueName: leagueObj.name || '',
    season: leagueObj.season || new Date().getFullYear(),
    standings: rawRows.map(mapRawStandingsRow)
  };
}

export function mapLeagueStandings(rawStandings: any, homeTeamName?: any, awayTeamName?: any): any[] {
  if (!rawStandings) return [];
  
  const rawRows = rawStandings.response?.[0]?.league?.standings?.[0] || 
                  rawStandings.standings || 
                  (Array.isArray(rawStandings) ? rawStandings : []);

  return rawRows.map((r: any) => ({
    rank: r.rank || 0,
    team: r.team?.name || r.teamName || '',
    logo: r.team?.logo || r.teamLogo || '',
    played: r.all?.played ?? r.played ?? 0,
    win: r.all?.win ?? r.win ?? 0,
    draw: r.all?.draw ?? r.draw ?? 0,
    lose: r.all?.lose ?? r.all?.lose ?? r.lose ?? 0,
    goalsFor: r.all?.goals?.for ?? r.goalsFor ?? 0,
    goalsAgainst: r.all?.goals?.against ?? r.goalsAgainst ?? 0,
    goalsDiff: r.goalsDiff !== undefined ? r.goalsDiff : ((r.all?.goals?.for - r.all?.goals?.against) || r.goalsDiff || 0),
    points: r.points || 0,
    form: r.form || ''
  }));
}

