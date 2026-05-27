import { db } from '../firebase';
import { collection, doc, getDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { mockLeagues, mockMatches } from '../lib/mockData';

/**
 * Fetch league by ID or name
 * @param {string} id - The ID of the league (e.g. 'l1') or league name
 */
export async function getLeagueById(id) {
  try {
    // 1. Try directly fetching as doc from Firestore
    if (id && id.startsWith('l')) {
      const docRef = doc(db, 'leagues', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
    }

    // 2. Search local mockLeagues first
    const mockFound = mockLeagues.find(l => l.id === id || l.name === id);
    if (mockFound) {
      return { ...mockFound };
    }

    // 3. Search database for name match or other properties
    const q = query(collection(db, 'leagues'), where('name', '==', id));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const matchesDoc = querySnapshot.docs[0];
      return { id: matchesDoc.id, ...matchesDoc.data() };
    }

    // 4. Try scanning all leagues in db to search by id
    const allLeaguesSnapshot = await getDocs(collection(db, 'leagues'));
    const leagueInDb = allLeaguesSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    const foundInDb = leagueInDb.find(l => l.id === id || l.name === id);
    if (foundInDb) return foundInDb;

    // 5. Build dynamic league based on the name passed as id
    const decodedName = decodeURIComponent(id);
    return {
      id: id,
      name: decodedName,
      country: 'دولي/محلي',
      logo: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(decodedName)}`,
      apiSeason: 2026,
      apiLeagueId: 300
    };
  } catch (err) {
    console.error('Error fetching league by ID:', err);
    // Safe fallback to mock structure
    const fallback = mockLeagues.find(l => l.id === id) || mockLeagues[0];
    return { ...fallback };
  }
}

/**
 * Fetch matches of a given league (using league name or ID)
 * @param {string} id - The league identifier
 */
export async function getLeagueMatches(id) {
  try {
    const league = await getLeagueById(id);
    const leagueName = league ? league.name : id;

    // 1. Query Firestore for matches where 'league' field matches leagueName
    const q = query(collection(db, 'matches'), where('league', '==', leagueName));
    const querySnapshot = await getDocs(q);
    
    let matches = [];
    if (!querySnapshot.empty) {
      matches = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } else {
      // Fallback: search in all matches or matching mock matches
      const allMatchesSnap = await getDocs(collection(db, 'matches'));
      const dbAllMatches = allMatchesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const pool = dbAllMatches.length > 0 ? dbAllMatches : mockMatches;
      matches = pool.filter(m => m.league === leagueName);
    }

    // Ensure we sort matches by startTime desc
    return matches.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
  } catch (err) {
    console.error('Error fetching league matches:', err);
    const mockFound = mockMatches.filter(m => m.id === id || m.league === id);
    return mockFound.length > 0 ? mockFound : mockMatches;
  }
}

/**
 * Fetch standings/table for a specific league
 * @param {string} id - The league identifier
 */
export async function getLeagueStandings(id) {
  try {
    const league = await getLeagueById(id);
    const leagueName = league ? league.name : id;

    // If league from db has pre-saved standings, use those
    if (league && league.standings && league.standings.length > 0) {
      return league.standings;
    }

    // Otherwise return null so that the component can load our highly stylized Preset/Dynamic stand-alone standings matching FotMob!
    return null;
  } catch (err) {
    console.error('Error fetching league standings:', err);
    return null;
  }
}
