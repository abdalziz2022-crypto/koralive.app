import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { mockMatches } from '../lib/mockData';

// High fidelity database of major world-class players
const FAMOUS_PLAYERS = {
  'محمد صلاح': {
    name: 'محمد صلاح',
    team: 'ليفربول',
    position: 'جناح أيمن / مهاجم',
    number: 11,
    nationality: 'جمهورية مصر العربية 🇪🇬',
    age: 33,
    height: '175 سم',
    foot: 'اليسرى',
    photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Salah&eyebrows=default&eyes=wink&mouth=smile',
    stats: { appearances: 37, goals: 25, assists: 14, yellowCards: 2, redCards: 0, minutesPlayed: 3120 }
  },
  'كريستيانو رونالدو': {
    name: 'كريستيانو رونالدو',
    team: 'النصر',
    position: 'مهاجم صريح',
    number: 7,
    nationality: 'البرتغال 🇵🇹',
    age: 41,
    height: '187 سم',
    foot: 'اليمنى',
    photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ronaldo&eyebrows=flatNatural&eyes=default&mouth=smile',
    stats: { appearances: 31, goals: 35, assists: 11, yellowCards: 4, redCards: 0, minutesPlayed: 2790 }
  },
  'جود بيلينجهام': {
    name: 'جود بيلينجهام',
    team: 'ريال مدريد',
    position: 'وسط هجومي',
    number: 5,
    nationality: 'إنجلترا 🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    age: 22,
    height: '186 سم',
    foot: 'اليمنى',
    photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bellingham&eyebrows=default&eyes=default&mouth=smile',
    stats: { appearances: 28, goals: 19, assists: 6, yellowCards: 5, redCards: 1, minutesPlayed: 2430 }
  },
  'فينيسيوس جونيور': {
    name: 'فينيسيوس جونيور',
    team: 'ريال مدريد',
    position: 'جناح أيسر / مهاجم',
    number: 7,
    nationality: 'البرازيل 🇧🇷',
    age: 25,
    height: '176 سم',
    foot: 'اليمنى',
    photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Vini&eyebrows=upDirectional&eyes=default&mouth=smile',
    stats: { appearances: 26, goals: 15, assists: 5, yellowCards: 7, redCards: 0, minutesPlayed: 2110 }
  },
  'سالم الدوسري': {
    name: 'سالم الدوسري',
    team: 'الهلال',
    position: 'جناح أيسر',
    number: 29,
    nationality: 'المملكة العربية السعودية 🇸🇦',
    age: 34,
    height: '171 سم',
    foot: 'اليمنى',
    photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Salem&eyebrows=default&eyes=default&mouth=smile',
    stats: { appearances: 29, goals: 14, assists: 8, yellowCards: 3, redCards: 0, minutesPlayed: 2450 }
  },
  'ياسين بونو': {
    name: 'ياسين بونو',
    team: 'الهلال',
    position: 'حارس مرمى',
    number: 37,
    nationality: 'المغرب 🇲🇦',
    age: 35,
    height: '192 سم',
    foot: 'اليسرى',
    photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bounou&eyebrows=default&eyes=default&mouth=smile',
    stats: { appearances: 31, goals: 0, assists: 0, yellowCards: 1, redCards: 0, minutesPlayed: 2790 }
  }
};

/**
 * Fetch player basic details by name or custom id key
 * @param {string} id - The player identifier/name
 */
export async function getPlayerById(id) {
  const decodedName = decodeURIComponent(id).trim();

  // 1. Direct matched world-class player
  const preset = FAMOUS_PLAYERS[decodedName];
  if (preset) return preset;

  // 2. Generate on-the-fly random stats if name is dynamic or from live match roster
  const teams = ['الهلال', 'النصر', 'ريال مدريد', 'برشلونة', 'ليفربول', 'مانشستر سيتي', 'الاتفاق', 'الاتحاد'];
  const positions = ['وسط هجومي', 'مهاجم صريح', 'مدافع قلب', 'ظهير طائر', 'حارس مرمى أمين'];
  const feet = ['اليمنى', 'اليسرى', 'كلتا القدمين'];
  const countries = ['المملكة العربية السعودية 🇸🇦', 'مصر 🇪🇬', 'البرازيل 🇧🇷', 'المغرب 🇲🇦', 'الجزائر 🇩🇿', 'فرنسا 🇫🇷', 'إسبانيا 🇪🇸'];

  const hash = decodedName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const team = teams[hash % teams.length];
  const position = positions[hash % positions.length];
  const number = (hash % 99) + 1;
  const age = 20 + (hash % 18);
  const height = `${170 + (hash % 25)} سم`;
  const foot = feet[hash % feet.length];
  const nationality = countries[hash % countries.length];

  return {
    name: decodedName,
    team: team,
    position: position,
    number: number,
    nationality: nationality,
    age: age,
    height: height,
    foot: foot,
    photo: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(decodedName)}&accessoriesProbability=20`,
    stats: {
      appearances: 20 + (hash % 15),
      goals: position.includes('مهاجم') ? 10 + (hash % 20) : position.includes('وسط') ? 2 + (hash % 10) : 0,
      assists: position.includes('حارس') ? 0 : 3 + (hash % 12),
      yellowCards: hash % 6,
      redCards: hash % 2 === 0 ? 0 : 1,
      minutesPlayed: (20 + (hash % 15)) * 80
    }
  };
}

/**
 * Fetch matches belonging to the player's team (recent status)
 * @param {string} id - Player identifier/name
 */
export async function getPlayerMatches(id) {
  try {
    const player = await getPlayerById(id);
    const teamName = player.team;

    // Fetch all available matches directly
    const querySnapshot = await getDocs(collection(db, 'matches'));
    let matches = [];

    if (!querySnapshot.empty) {
      matches = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } else {
      matches = mockMatches;
    }

    // Filter matches involving player's team
    const teamMatches = matches.filter(m => 
      m.homeTeam === teamName || m.awayTeam === teamName
    );

    if (teamMatches.length === 0) {
      return mockMatches.filter(m => m.homeTeam === teamName || m.awayTeam === teamName || m.league === 'الدوري الإسباني');
    }

    return teamMatches.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
  } catch (err) {
    console.error('Error fetching player matches:', err);
    return mockMatches;
  }
}

/**
 * Fetch stats for the player
 * @param {string} id 
 */
export async function getPlayerStats(id) {
  const player = await getPlayerById(id);
  return player.stats;
}
