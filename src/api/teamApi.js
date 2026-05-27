import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { mockMatches } from '../lib/mockData';

// Top team squads database for high fidelity
const TOP_TEAM_SQUADS = {
  'ريال مدريد': [
    { name: 'تيبو كورتوا', position: 'حارس مرمى', number: 1, nationality: 'بلجيكا' },
    { name: 'داني كارفاخال', position: 'مدافع', number: 2, nationality: 'إسبانيا' },
    { name: 'إيدير ميليتاو', position: 'مدافع', number: 3, nationality: 'البرازيل' },
    { name: 'توني كروس', position: 'وسط', number: 8, nationality: 'ألمانيا' },
    { name: 'جود بيلينجهام', position: 'وسط', number: 5, nationality: 'إنجلترا' },
    { name: 'لوكا مودريتش', position: 'وسط', number: 10, nationality: 'كرواتيا' },
    { name: 'فينيسيوس جونيور', position: 'مهاجم', number: 7, nationality: 'البرازيل' },
    { name: 'رودريغو غوس', position: 'مهاجم', number: 11, nationality: 'البرازيل' },
    { name: 'خوسيلو', position: 'مهاجم', number: 14, nationality: 'إسبانيا' }
  ],
  'برشلونة': [
    { name: 'مارك أندريه تير شتيغن', position: 'حارس مرمى', number: 1, nationality: 'ألمانيا' },
    { name: 'رونالد أراوخو', position: 'مدافع', number: 4, nationality: 'الأوروغواي' },
    { name: 'جول كوندي', position: 'مدافع', number: 23, nationality: 'فرنسا' },
    { name: 'بيدري غونزاليس', position: 'وسط', number: 8, nationality: 'إسبانيا' },
    { name: 'جافي', position: 'وسط', number: 6, nationality: 'إسبانيا' },
    { name: 'فرينكي دي يونغ', position: 'وسط', number: 21, nationality: 'هولندا' },
    { name: 'روبرت ليفاندوفسكي', position: 'مهاجم', number: 9, nationality: 'بولندا' },
    { name: 'رافينيا دياز', position: 'مهاجم', number: 11, nationality: 'البرازيل' },
    { name: 'لامين يامال', position: 'مهاجم', number: 27, nationality: 'إسبانيا' }
  ],
  'الهلال': [
    { name: 'ياسين بونو', position: 'حارس مرمى', number: 37, nationality: 'المغرب' },
    { name: 'علي البليهي', position: 'مدافع', number: 5, nationality: 'السعودية' },
    { name: 'كاليدو كوليبالي', position: 'مدافع', number: 3, nationality: 'السنغال' },
    { name: 'سعود عبد الحميد', position: 'مدافع', number: 66, nationality: 'السعودية' },
    { name: 'روبن نيفيز', position: 'وسط', number: 8, nationality: 'البرتغال' },
    { name: 'سيرجي ميلينكوفيتش سافيتش', position: 'وسط', number: 22, nationality: 'صربيا' },
    { name: 'سالم الدوسري', position: 'مهاجم', number: 29, nationality: 'السعودية' },
    { name: 'ميتروفيتش', position: 'مهاجم', number: 9, nationality: 'صربيا' },
    { name: 'مالكوم', position: 'مهاجم', number: 77, nationality: 'البرازيل' }
  ],
  'النصر': [
    { name: 'دافيد أوسبينا', position: 'حارس مرمى', number: 26, nationality: 'كولومبيا' },
    { name: 'أيميريك لابورت', position: 'مدافع', number: 27, nationality: 'إسبانيا' },
    { name: 'سلطان الغنام', position: 'مدافع', number: 2, nationality: 'السعودية' },
    { name: 'بروزوفيتش', position: 'وسط', number: 77, nationality: 'كرواتيا' },
    { name: 'عبد الله الخيبري', position: 'وسط', number: 17, nationality: 'السعودية' },
    { name: 'أوتافيو', position: 'وسط', number: 25, nationality: 'البرتغال' },
    { name: 'ساديو ماني', position: 'مهاجم', number: 10, nationality: 'السنغال' },
    { name: 'كريستيانو رونالدو', position: 'مهاجم', number: 7, nationality: 'البرتغال' },
    { name: 'تاليسكا', position: 'مهاجم', number: 94, nationality: 'البرازيل' }
  ],
  'ليفربول': [
    { name: 'أليسون بيكر', position: 'حارس مرمى', number: 1, nationality: 'البرازيل' },
    { name: 'فيرجيل فان دايك', position: 'مدافع', number: 4, nationality: 'هولندا' },
    { name: 'إبراهيما كوناتي', position: 'مدافع', number: 5, nationality: 'فرنسا' },
    { name: 'ترينت ألكسندر أرنولد', position: 'مدافع', number: 66, nationality: 'إنجلترا' },
    { name: 'ألكسيس ماك أليستير', position: 'وسط', number: 10, nationality: 'الأرجنتين' },
    { name: 'دومينيك سوبوسلاي', position: 'وسط', number: 8, nationality: 'المجر' },
    { name: 'واتارو إندو', position: 'وسط', number: 3, nationality: 'اليابان' },
    { name: 'محمد صلاح', position: 'مهاجم', number: 11, nationality: 'مصر' },
    { name: 'لويس دياز', position: 'مهاجم', number: 7, nationality: 'كولومبيا' },
    { name: 'داروين نونيز', position: 'مهاجم', number: 9, nationality: 'الأوروغواي' }
  ]
};

/**
 * Fetch team basic details by name or id
 * @param {string} id - Team name or ID
 */
export async function getTeamById(id) {
  const decodedName = decodeURIComponent(id);

  // Determine country & main league based on team name
  let country = 'دولي';
  let league = 'بطولة عامة';
  let stadium = 'ملعب معتمد 🏟️';

  if (decodedName === 'ريال مدريد') {
    country = 'إسبانيا';
    league = 'الدوري الإسباني';
    stadium = 'سانتياغو برنابيو 🏟️';
  } else if (decodedName === 'برشلونة') {
    country = 'إسبانيا';
    league = 'الدوري الإسباني';
    stadium = 'سبوتيفاي كامب نو 🏟️';
  } else if (decodedName === 'الهلال') {
    country = 'المملكة العربية السعودية';
    league = 'الدوري السعودي';
    stadium = 'المملكة أرينا 🏟️';
  } else if (decodedName === 'النصر') {
    country = 'المملكة العربية السعودية';
    league = 'الدوري السعودي';
    stadium = 'الأول بارك 🏟️';
  } else if (decodedName === 'ليفربول') {
    country = 'إنجلترا';
    league = 'الدوري الإنجليزي';
    stadium = 'أنفيلد رود 🏟️';
  } else if (decodedName === 'مانشستر سيتي') {
    country = 'إنجلترا';
    league = 'الدوري الإنجليزي';
    stadium = 'الاتحاد 🏟️';
  } else if (decodedName === 'أرسنال') {
    country = 'إنجلترا';
    league = 'الدوري الإنجليزي';
    stadium = 'الإمارات 🏟️';
  }

  return {
    id: decodedName,
    name: decodedName,
    logo: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(decodedName)}`,
    country,
    league,
    stadium
  };
}

/**
 * Fetch matches belonging to this team (home or away)
 * @param {string} id - Team name
 */
export async function getTeamMatches(id) {
  try {
    const decodedName = decodeURIComponent(id);

    // Fetch all matches from Firestore
    const querySnapshot = await getDocs(collection(db, 'matches'));
    let matches = [];

    if (!querySnapshot.empty) {
      matches = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } else {
      matches = mockMatches;
    }

    // Filter matches involving the team
    const teamMatches = matches.filter(m => 
      m.homeTeam === decodedName || m.awayTeam === decodedName
    );

    // Keep it robust: if no matches exist in database, return dynamic matches
    if (teamMatches.length === 0) {
      return mockMatches.filter(m => m.homeTeam === decodedName || m.awayTeam === decodedName || m.league === 'الدوري الإنجليزي');
    }

    return teamMatches.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
  } catch (err) {
    console.error('Error fetching team matches:', err);
    return mockMatches;
  }
}

/**
 * Fetch standings of the league this team belongs to
 * @param {string} id - Team name
 */
export async function getTeamStandings(id) {
  try {
    const team = await getTeamById(id);
    // Find competition standings or return a simulated standing for the team
    return {
      rank: id === 'ريال مدريد' || id === 'الهلال' ? 1 : 2,
      points: id === 'ريال مدريد' ? 93 : id === 'الهلال' ? 89 : 77,
      form: ['W', 'W', 'D', 'W', 'W']
    };
  } catch (err) {
    return { rank: 2, points: 54, form: ['W', 'D', 'W', 'W', 'L'] };
  }
}

/**
 * Fetch squad database of the team
 * @param {string} id - Team name
 */
export async function getTeamPlayers(id) {
  const decodedName = decodeURIComponent(id);
  const foundSquad = TOP_TEAM_SQUADS[decodedName];
  if (foundSquad) return foundSquad;

  // Otherwise, return a beautifully randomized squad matching the team name
  const positions = ['حارس مرمى', 'مدافع', 'مدافع', 'وسط', 'وسط', 'مهاجم', 'مهاجم', 'وسط هجومي', 'ظهير أيمن', 'ظهير أيسر'];
  const nationalities = ['المغرب', 'السعودية', 'البرازيل', 'إسبانيا', 'إنجلترا', 'الأرجنتين', 'فرنسا'];
  const firstNames = ['فهد', 'عبد العزيز', 'كارلوس', 'سالم', 'أحمد', 'محمد', 'ماركو', 'لوكاس', 'أندريه', 'سفيان'];
  const lastNames = ['الدوسري', 'سيلفا', 'العامري', 'غوميز', 'الحربي', 'مارتينيز', 'العتيبي', 'جونز', 'القحطاني'];

  const dynamicSquad = Array.from({ length: 11 }, (_, index) => {
    const fn = firstNames[index % firstNames.length];
    const ln = lastNames[(index + 3) % lastNames.length];
    const pos = positions[index % positions.length];
    const nat = nationalities[(index + 1) % nationalities.length];

    return {
      name: `${fn} ${ln}`,
      position: pos,
      number: index + 1 === 1 ? 1 : 4 + index * 3,
      nationality: nat
    };
  });

  return dynamicSquad;
}
