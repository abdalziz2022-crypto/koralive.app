import { db } from '../firebase';
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import apiClient from '../api/apiClient';

export async function fetchAndUpdateLeagueStandings(leagueId: string): Promise<boolean> {
  try {
    // 1. Get API config (fallback to environment variables if db config is empty)
    let apiKey = import.meta.env.VITE_API_KEY;
    const configSnap = await getDoc(doc(db, 'settings', 'stats_config'));
    if (configSnap.exists()) {
      const config = configSnap.data();
      if (config.apiFootballKey) {
        apiKey = config.apiFootballKey;
      }
    }
    
    if (!apiKey) return false;

    // 2. Get local league
    const leagueSnap = await getDoc(doc(db, 'leagues', leagueId));
    if (!leagueSnap.exists()) return false;
    
    const league = leagueSnap.data();
    if (!league.apiLeagueId || !league.apiSeason) return false;

    // 3. Fetch standings from API
    const response = await apiClient.get('/standings', {
      params: {
        league: league.apiLeagueId,
        season: league.apiSeason
      },
      headers: {
        'x-apisports-key': apiKey,
        'x-rapidapi-key': apiKey
      }
    });

    const data = response.data;
    
    if (data.response && data.response.length > 0) {
      const standingsInfo = data.response[0].league.standings[0];
      
      const parsedStandings = standingsInfo.map((team: any) => ({
        rank: team.rank,
        teamName: team.team.name,
        teamLogo: team.team.logo,
        points: team.points,
        goalsDiff: team.goalsDiff,
        played: team.all.played,
        win: team.all.win,
        draw: team.all.draw,
        lose: team.all.lose,
        goalsFor: team.all.goals.for,
        goalsAgainst: team.all.goals.against
      }));

      // 4. Update local document
      await updateDoc(doc(db, 'leagues', leagueId), {
        standings: parsedStandings,
        updatedAt: new Date().toISOString()
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error fetching standings:", error);
    return false;
  }
}

export async function fetchAndUpdateAllMatchedLeagues(): Promise<{success: number, failed: number}> {
  let successCount = 0;
  let failedCount = 0;
  
  try {
    const leaguesSnap = await getDocs(collection(db, 'leagues'));
    const leagues = leaguesSnap.docs.map(d => ({id: d.id, ...d.data()}));
    
    for (const league of leagues) {
      if ((league as any).apiLeagueId && (league as any).apiSeason) {
        const success = await fetchAndUpdateLeagueStandings(league.id);
        if (success) successCount++;
        else failedCount++;
      }
    }
  } catch (err) {
    console.error("Error fetching all standings:", err);
  }
  
  return { success: successCount, failed: failedCount };
}
