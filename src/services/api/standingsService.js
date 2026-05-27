import rapidApiClient, { RAPID_API_KEY } from './rapidApiClient';

export const standingsService = {
  /**
   * Get standings for a league and season
   */
  async getStandings(leagueId = 307, season = 2024) {
    if (!RAPID_API_KEY) {
      // Standard static mock standings table
      return [
        { rank: 1, team: { id: 1, name: 'الهلال', logo: 'https://media.api-sports.io/football/teams/33.png' }, points: 56, played: 22, wins: 18, draws: 2, losses: 2, goalsDiff: 32 },
        { rank: 2, team: { id: 2, name: 'النصر', logo: 'https://media.api-sports.io/football/teams/33.png' }, points: 50, played: 22, wins: 16, draws: 2, losses: 4, goalsDiff: 25 },
        { rank: 3, team: { id: 3, name: 'الأهلي', logo: 'https://media.api-sports.io/football/teams/33.png' }, points: 41, played: 22, wins: 12, draws: 5, losses: 5, goalsDiff: 15 },
        { rank: 4, team: { id: 4, name: 'التعاون', logo: 'https://media.api-sports.io/football/teams/33.png' }, points: 39, played: 22, wins: 11, draws: 6, losses: 5, goalsDiff: 10 }
      ];
    }

    try {
      const response = await rapidApiClient.get('/standings', {
        params: { league: leagueId, season }
      });
      const rawStandings = response.data?.response?.[0]?.league?.standings?.[0] || [];
      return rawStandings.map(item => ({
        rank: item.rank,
        team: {
          id: item.team.id,
          name: item.team.name,
          logo: item.team.logo
        },
        points: item.points,
        played: item.all?.played || 0,
        wins: item.all?.win || 0,
        draws: item.all?.draw || 0,
        losses: item.all?.lose || 0,
        goalsDiff: item.goalsDiff,
        form: item.form,
        description: item.description
      }));
    } catch (error) {
      console.warn('Standings retrieval error, compiling mocked list', error);
      return [
        { rank: 1, team: { id: 1, name: 'ريال مدريد', logo: 'https://media.api-sports.io/football/teams/33.png' }, points: 65, played: 26, wins: 20, draws: 5, losses: 1, goalsDiff: 38 },
        { rank: 2, team: { id: 2, name: 'برشلونة', logo: 'https://media.api-sports.io/football/teams/33.png' }, points: 57, played: 26, wins: 17, draws: 6, losses: 3, goalsDiff: 24 }
      ];
    }
  }
};
