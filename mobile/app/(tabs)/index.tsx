import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ScrollView, 
  Pressable, 
  TextInput, 
  ActivityIndicator, 
  RefreshControl,
  Image,
  Platform 
} from 'react-native';
import { Search, RotateCcw, Flame, CheckCircle2, Calendar, Clock } from 'lucide-react-native';
import MatchCard from '../../components/MatchCard';
import { auth, db } from '../../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Solid mock data representing real Arabic and European football matches for offline-first resilience
const DEFAULT_MATCHES = [
  {
    id: "apf-1",
    homeTeam: { id: 2939, name: "الهلال", logo: "https://media.api-sports.io/football/teams/2939.png" },
    awayTeam: { id: 2911, name: "النصر", logo: "https://media.api-sports.io/football/teams/2911.png" },
    score: { home: 2, away: 1 },
    minute: 78,
    isLive: true,
    status: { short: 'LIVE', elapsed: 78, long: 'In Progress' },
    league: { id: 307, name: "دوري روشن السعودي للمحترفين", logo: "https://media.api-sports.io/football/leagues/307.png" },
    channel: "SSC Sports 1 HD",
    commentator: "فهد العتيبي",
    startTime: "2026-05-29T18:00:00Z"
  },
  {
    id: "apf-2",
    homeTeam: { id: 2936, name: "الاتحاد", logo: "https://media.api-sports.io/football/teams/2936.png" },
    awayTeam: { id: 2940, name: "الأهلي", logo: "https://media.api-sports.io/football/teams/2940.png" },
    score: { home: 0, away: 0 },
    isLive: false,
    status: { short: 'NS', elapsed: 0, long: 'Not Started' },
    league: { id: 307, name: "دوري روشن السعودي للمحترفين", logo: "https://media.api-sports.io/football/leagues/307.png" },
    channel: "SSC Sports 5 HD",
    commentator: "فارس عوض",
    startTime: "2026-05-29T20:30:00Z"
  },
  {
    id: "apf-3",
    homeTeam: { id: 40, name: "ليفربول", logo: "https://media.api-sports.io/football/teams/40.png" },
    awayTeam: { id: 33, name: "مانشستر يونايتد", logo: "https://media.api-sports.io/football/teams/33.png" },
    score: { home: 3, away: 0 },
    isLive: false,
    status: { short: 'FT', elapsed: 90, long: 'Finished' },
    league: { id: 39, name: "الدوري الإنجليزي الممتاز", logo: "https://media.api-sports.io/football/leagues/39.png" },
    channel: "beIN Sports HD 1",
    commentator: "خليل البلوشي",
    startTime: "2026-05-29T15:30:00Z"
  },
  {
    id: "apf-4",
    homeTeam: { id: 529, name: "برشلونة", logo: "https://media.api-sports.io/football/teams/529.png" },
    awayTeam: { id: 541, name: "ريال مدريد", logo: "https://media.api-sports.io/football/teams/541.png" },
    score: { home: 2, away: 2 },
    minute: 90,
    isLive: true,
    status: { short: 'LIVE', elapsed: 90, long: 'In Progress' },
    league: { id: 140, name: "الدوري الإسباني الدرجة الأولى", logo: "https://media.api-sports.io/football/leagues/140.png" },
    channel: "beIN Sports Premium 1",
    commentator: "حفيظ دراجي",
    startTime: "2026-05-29T19:45:00Z"
  }
];

const getBackendUrl = () => {
  if (typeof window !== 'undefined' && window.location) {
    return window.location.origin;
  }
  return 'https://ais-dev-7yjy6apxcqr3vnxii4n4s5-425742923336.europe-west1.run.app';
};

const mapRawMatchesToApp = (rawList: any[]) => {
  return rawList.map((raw: any, index: number) => {
    const fixture = raw.fixture || {};
    const teams = raw.teams || {};
    const goals = raw.goals || {};
    const leagueObj = raw.league || {};
    
    const isLive = ['1H', '2H', 'ET', 'P', 'LIVE', 'HT'].includes((fixture.status?.short || '').toUpperCase());
    
    return {
      id: fixture.id ? `apf-${fixture.id}` : `local-${index}`,
      homeTeam: {
        id: teams.home?.id || 0,
        name: teams.home?.name || 'فريق مضيف',
        logo: teams.home?.logo || 'https://media.api-sports.io/football/teams/unknown.png'
      },
      awayTeam: {
        id: teams.away?.id || 0,
        name: teams.away?.name || 'فريق ضيف',
        logo: teams.away?.logo || 'https://media.api-sports.io/football/teams/unknown.png'
      },
      score: {
        home: goals.home !== undefined ? goals.home : null,
        away: goals.away !== undefined ? goals.away : null
      },
      homeScore: goals.home !== undefined ? goals.home : undefined,
      awayScore: goals.away !== undefined ? ...
        away: goals.away !== undefined ? goals.away : null
      },
      homeScore: goals.home !== undefined ? goals.home : undefined,
      awayScore: goals.away !== undefined ? goals.away : undefined,
      minute: fixture.status?.elapsed || undefined,
      isLive,
      status: {
        short: fixture.status?.short || 'NS',
        long: fixture.status?.long || 'Not Started',
        elapsed: fixture.status?.elapsed || 0
      },
      league: {
        id: leagueObj.id || 0,
        name: leagueObj.name || 'الدوري',
        logo: leagueObj.logo || 'https://media.api-sports.io/football/leagues/unknown.png'
      },
      channel: raw.channel || "SSC Sports 1 HD",
      commentator: raw.commentator || "جاري التحديد",
      startTime: fixture.date || new Date().toISOString()
    };
  });
};

export default function MatchesScreen() {
  const [matches, setMatches] = useState(DEFAULT_MATCHES);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL'); // ALL, LIVE, UPCOMING, FINISHED
  const [userFavorites, setUserFavorites] = useState<string[]>([]);
  const [uid, setUid] = useState<string | null>(null);

  // Read current Auth status and load user preferences from Firestore or storage
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUid(user.uid);
        fetchFavorites(user.uid);
      } else {
        setUid(null);
        // Fallback to local storage
        try {
          const storedFavs = await AsyncStorage.getItem('local_favorites_matches');
          if (storedFavs) {
            setUserFavorites(JSON.parse(storedFavs));
          }
        } catch (e) {
          console.warn(e);
        }
      }
    });
    return () => unsub();
  }, []);

  // Fetch matches on component mount to avoid displaying only default mock data
  useEffect(() => {
    fetchLiveMatches();
  }, []);

  const fetchFavorites = async (userId: string) => {
    try {
      const userRef = doc(db, 'users', userId);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data();
        setUserFavorites(data.favoriteMatches || []);
      }
    } catch (e) {
      console.warn("Failed fetching Firestore user preferences", e);
    }
  };

  const handleToggleFavorite = async (matchId: string) => {
    let updatedFavs = [...userFavorites];
    if (updatedFavs.includes(matchId)) {
      updatedFavs = updatedFavs.filter(id => id !== matchId);
    } else {
      updatedFavs.push(matchId);
    }
    setUserFavorites(updatedFavs);

    if (uid) {
      try {
        const userRef = doc(db, 'users', uid);
        await setDoc(userRef, { favoriteMatches: updatedFavs }, { merge: true });
      } catch (e) {
        console.error("Firestore update failed", e);
      }
    } else {
      try {
        await AsyncStorage.setItem('local_favorites_matches', JSON.stringify(updatedFavs));
      } catch (e) {
        console.warn(e);
      }
    }
  };

  const fetchLiveMatches = async () => {
    setLoading(true);
    try {
      const baseUrl = getBackendUrl();
      const response = await fetch(`${baseUrl}/api/football-api/fixtures`);
      if (response.ok) {
        const data = await response.json();
        const rawList = data.response || data.data || [];
        if (Array.isArray(rawList) && rawList.length > 0) {
          const mapped = mapRawMatchesToApp(rawList);
          setMatches(mapped);
        }
      }
    } catch (error) {
      console.log("Network direct fetch failed (using smart fallback offline data):", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchLiveMatches();
  };

  // Run dynamic filter transformations based on selected segment
  const getFilteredMatches = () => {
    return matches.filter(match => {
      const homeName = String(match.homeTeam?.name || match.homeTeam || '').toLowerCase();
      const awayName = String(match.awayTeam?.name || match.awayTeam || '').toLowerCase();
      const leagueName = String(match.league?.name || match.league || '').toLowerCase();
      const query = searchQuery.toLowerCase();

      // Search match query filter
      if (query && !homeName.includes(query) && !awayName.includes(query) && !leagueName.includes(query)) {
        return false;
      }

      // Segment Filter
      const statusShort = match.status?.short || (match.isLive ? 'LIVE' : '');
      if (activeFilter === 'LIVE') {
        return match.isLive || statusShort === 'LIVE' || statusShort === '1H' || statusShort === '2H' || statusShort === 'HT';
      }
      if (activeFilter === 'UPCOMING') {
        return statusShort === 'NS' || statusShort === 'TBD';
      }
      if (activeFilter === 'FINISHED') {
        return statusShort === 'FT' || statusShort === 'AET' || statusShort === 'PEN';
      }
      return true;
    });
  };

  const filtered = getFilteredMatches();

  // Group Matches by League for clean and high professional rendering
  const groupMatchesByLeague = (matchList: any[]) => {
    const groups: { [key: string]: { league: any; fixtures: any[] } } = {};
    matchList.forEach(m => {
      const name = m.league?.name || m.league || "البطولات الأخرى";
      const id = m.league?.id || 'oth';
      const key = `${id}_${name}`;
      if (!groups[key]) {
        groups[key] = {
          league: {
            name,
            logo: m.league?.logo || m.leagueLogo || 'https://media.api-sports.io/football/leagues/39.png'
          },
          fixtures: []
        };
      }
      groups[key].fixtures.push(m);
    });
    return Object.values(groups);
  };

  const groupedData = groupMatchesByLeague(filtered);

  return (
    <View style={styles.container}>
      {/* Search Header Container */}
      <View style={styles.searchHeader}>
        <View style={styles.searchContainer}>
          <Search size={18} color="#9ca3af" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="ابحث عن فريق، دوري، أو لقاء..."
            placeholderTextColor="#6b7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
            textAlign="right"
          />
        </View>
      </View>

      {/* Dynamic Segment Buttons */}
      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <Pressable 
            onPress={() => setActiveFilter('ALL')}
            style={[styles.filterButton, activeFilter === 'ALL' && styles.activeFilterButton]}
          >
            <Calendar size={14} color={activeFilter === 'ALL' ? '#ffffff' : '#9ca3af'} />
            <Text style={[styles.filterText, activeFilter === 'ALL' && styles.activeFilterText]}>كل المباريات</Text>
          </Pressable>

          <Pressable 
            onPress={() => setActiveFilter('LIVE')}
            style={[styles.filterButton, styles.liveButtonOutline, activeFilter === 'LIVE' && styles.activeLiveButton]}
          >
            <Flame size={14} color="#ef4444" />
            <Text style={[styles.filterText, activeFilter === 'LIVE' ? styles.activeLiveText : { color: '#ef4444' }]}>المباشرة الآن</Text>
          </Pressable>

          <Pressable 
            onPress={() => setActiveFilter('UPCOMING')}
            style={[styles.filterButton, activeFilter === 'UPCOMING' && styles.activeFilterButton]}
          >
            <Clock size={14} color={activeFilter === 'UPCOMING' ? '#ffffff' : '#9ca3af'} />
            <Text style={[styles.filterText, activeFilter === 'UPCOMING' && styles.activeFilterText]}>القادمة</Text>
          </Pressable>

          <Pressable 
            onPress={() => setActiveFilter('FINISHED')}
            style={[styles.filterButton, activeFilter === 'FINISHED' && styles.activeFilterButton]}
          >
            <CheckCircle2 size={14} color={activeFilter === 'FINISHED' ? '#ffffff' : '#9ca3af'} />
            <Text style={[styles.filterText, activeFilter === 'FINISHED' && styles.activeFilterText]}>المنتهية</Text>
          </Pressable>
        </ScrollView>
      </View>

      {/* Main List Rendering */}
      {loading && !refreshing ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>جاري تحديث أحداث الميدان...</Text>
        </View>
      ) : groupedData.length === 0 ? (
        <ScrollView 
          contentContainerStyle={styles.emptyCenter}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />}
        >
          <RotateCcw size={48} color="#4b5563" style={{ marginBottom: 12 }} />
          <Text style={styles.emptyTitle}>لا توجد مباريات مطابقة</Text>
          <Text style={styles.emptySub}>قم بتعديل تصفية البحث أو اسحب للأسفل لإعادة التحديث</Text>
        </ScrollView>
      ) : (
        <FlatList
          data={groupedData}
          keyExtractor={(item) => item.league.name}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              colors={['#10b981']} 
              thumbColor="#10b981"
              tintColor="#10b981"
            />
          }
          renderItem={({ item }) => (
            <View style={styles.leagueSection}>
              {/* League Header */}
              <View style={styles.leagueHeaderRow}>
                <Image source={{ uri: item.league.logo }} style={styles.leagueSectionLogo} />
                <Text style={styles.leagueHeaderText}>{item.league.name}</Text>
              </View>

              {/* Match Cards inside League */}
              {item.fixtures.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  isBookmarked={userFavorites.includes(match.id)}
                  onToggleBookmark={() => handleToggleFavorite(match.id)}
                />
              ))}
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 32 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
  searchHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    backgroundColor: '#0c1223',
  },
  searchContainer: {
    flexDirection: 'row-reverse', // RTL Search
    alignItems: 'center',
    backgroundColor: '#1f2937',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    height: 46,
  },
  searchIcon: {
    marginLeft: 10,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontWeight: '700',
    height: '100%',
  },
  filterSection: {
    paddingVertical: 12,
    backgroundColor: '#0c1223',
    borderBottomWidth:1,
    borderBottomColor: 'rgba(255, 255, 255, 0.02)',
  },
  filterScroll: {
    paddingHorizontal: 16,
    flexDirection: 'row-reverse', // Align components RTL
    gap: 10,
  },
  filterButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 6,
  },
  activeFilterButton: {
    backgroundColor: '#10b981',
    borderColor: '#34d399',
  },
  liveButtonOutline: {
    borderColor: 'rgba(239, 68, 68, 0.3)',
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
  },
  activeLiveButton: {
    backgroundColor: '#ef4444',
  },
  filterText: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '900',
  },
  activeFilterText: {
    color: '#ffffff',
  },
  activeLiveText: {
    color: '#ffffff',
  },
  loadingCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#10b981',
    marginTop: 12,
    fontSize: 14,
    fontWeight: '800',
  },
  emptyCenter: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 4,
  },
  emptySub: {
    color: '#6b7280',
    fontSize: 12,
    textAlign: 'center',
  },
  leagueSection: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  leagueHeaderRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: 'rgba(12, 18, 35, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  leagueSectionLogo: {
    width: 22,
    height: 22,
    borderRadius: 11,
    marginLeft: 8,
    resizeMode: 'contain',
  },
  leagueHeaderText: {
    color: '#34d399',
    fontSize: 12,
    fontWeight: '900',
    flex: 1,
    textAlign: 'right',
  }
});
