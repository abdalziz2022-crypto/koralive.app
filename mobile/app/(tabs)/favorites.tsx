import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Pressable, 
  ActivityIndicator, 
  RefreshControl,
  Image,
  ScrollView,
  Platform
} from 'react-native';
import { Heart, Trophy, User, Calendar, RotateCcw, Shield } from 'lucide-react-native';
import MatchCard from '../../components/MatchCard';
import { auth, db } from '../../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEMO_TEAMS = [
  { id: 2939, name: "الهلال السعودي", logo: "https://media.api-sports.io/football/teams/2939.png", fans: "12M" },
  { id: 2911, name: "النصر السعودي", logo: "https://media.api-sports.io/football/teams/2911.png", fans: "10M" },
  { id: 40, name: "ليفربول الإنجليزي", logo: "https://media.api-sports.io/football/teams/40.png", fans: "25M" },
  { id: 529, name: "برشلونة الإسباني", logo: "https://media.api-sports.io/football/teams/529.png", fans: "30M" }
];

export default function FavoritesScreen() {
  const [activeTab, setActiveTab] = useState<'MATCHES' | 'TEAMS' | 'LEAGUES'>('MATCHES');
  const [userFavMatches, setUserFavMatches] = useState<string[]>([]);
  const [userFavTeams, setUserFavTeams] = useState<string[]>(['2939', '40']); // Good starting defaults
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUid(user.uid);
        await syncUserPreferences(user.uid);
      } else {
        setUid(null);
        await loadLocalPreferences();
      }
    });
    return () => unsub();
  }, []);

  const syncUserPreferences = async (userId: string) => {
    setLoading(true);
    try {
      const docRef = doc(db, 'users', userId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        setUserFavMatches(data.favoriteMatches || []);
        setUserFavTeams(data.favoriteTeams || ['2939', '40']);
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadLocalPreferences = async () => {
    setLoading(true);
    try {
      const matchData = await AsyncStorage.getItem('local_favorites_matches');
      const teamData = await AsyncStorage.getItem('local_favorites_teams');
      if (matchData) setUserFavMatches(JSON.parse(matchData));
      if (teamData) setUserFavTeams(JSON.parse(teamData));
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    if (uid) {
      syncUserPreferences(uid);
    } else {
      loadLocalPreferences();
    }
  };

  const handleToggleMatchFav = async (matchId: string) => {
    let updated = userFavMatches.includes(matchId) 
      ? userFavMatches.filter(id => id !== matchId) 
      : [...userFavMatches, matchId];
    
    setUserFavMatches(updated);
    if (uid) {
      await setDoc(doc(db, 'users', uid), { favoriteMatches: updated }, { merge: true });
    } else {
      await AsyncStorage.setItem('local_favorites_matches', JSON.stringify(updated));
    }
  };

  const handleToggleTeamFav = async (teamId: string) => {
    let updated = userFavTeams.includes(teamId) 
      ? userFavTeams.filter(id => id !== teamId) 
      : [...userFavTeams, teamId];
    
    setUserFavTeams(updated);
    if (uid) {
      await setDoc(doc(db, 'users', uid), { favoriteTeams: updated }, { merge: true });
    } else {
      await AsyncStorage.setItem('local_favorites_teams', JSON.stringify(updated));
    }
  };

  // Pull fixtures to match the favorited matching objects 
  const favoritedMatchesList = [
    {
      id: "apf-1",
      homeTeam: { id: 2939, name: "الهلال", logo: "https://media.api-sports.io/football/teams/2939.png" },
      awayTeam: { id: 2911, name: "النصر", logo: "https://media.api-sports.io/football/teams/2911.png" },
      score: { home: 2, away: 1 },
      minute: 78,
      isLive: true,
      status: { short: 'LIVE', elapsed: 78 },
      league: { id: 307, name: "دوري روشن السعودي للمحترفين", logo: "https://media.api-sports.io/football/leagues/307.png" }
    },
    {
      id: "apf-4",
      homeTeam: { id: 529, name: "برشلونة", logo: "https://media.api-sports.io/football/teams/529.png" },
      awayTeam: { id: 541, name: "ريال مدريد", logo: "https://media.api-sports.io/football/teams/541.png" },
      score: { home: 2, away: 2 },
      minute: 90,
      isLive: true,
      status: { short: 'LIVE', elapsed: 90 },
      league: { id: 140, name: "الدوري الإسباني الدرجة الأولى", logo: "https://media.api-sports.io/football/leagues/140.png" }
    }
  ].filter(item => userFavMatches.includes(item.id));

  const favoritedTeamsList = DEMO_TEAMS.filter(item => userFavTeams.includes(item.id.toString()));

  return (
    <View style={styles.container}>
      {/* Tab Selectors Segment */}
      <View style={styles.tabsHeader}>
        <Pressable 
          onPress={() => setActiveTab('MATCHES')}
          style={[styles.tabButton, activeTab === 'MATCHES' && styles.activeTabButton]}
        >
          <Calendar size={14} color={activeTab === 'MATCHES' ? '#10b981' : '#9ca3af'} />
          <Text style={[styles.tabText, activeTab === 'MATCHES' && styles.activeTabText]}>المباريات</Text>
        </Pressable>

        <Pressable 
          onPress={() => setActiveTab('TEAMS')}
          style={[styles.tabButton, activeTab === 'TEAMS' && styles.activeTabButton]}
        >
          <Shield size={14} color={activeTab === 'TEAMS' ? '#10b981' : '#9ca3af'} />
          <Text style={[styles.tabText, activeTab === 'TEAMS' && styles.activeTabText]}>الأندية والفرق</Text>
        </Pressable>
      </View>

      {/* Main Container */}
      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : activeTab === 'MATCHES' ? (
        favoritedMatchesList.length === 0 ? (
          <ScrollView 
            contentContainerStyle={styles.centerEmpty}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />}
          >
            <Heart size={44} color="#374151" style={{ marginBottom: 10 }} />
            <Text style={styles.emptyTitle}>لا توجد مباريات مفضلة</Text>
            <Text style={styles.emptySub}>اضغط على أيقونة القلب ❤️ في شاشة المباريات السابقة أو القادمة لتصل إليها هنا بسرعة.</Text>
          </ScrollView>
        ) : (
          <FlatList
            data={favoritedMatchesList}
            keyExtractor={(item) => item.id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />}
            renderItem={({ item }) => (
              <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
                <MatchCard 
                  match={item}
                  isBookmarked={true}
                  onToggleBookmark={() => handleToggleMatchFav(item.id)}
                />
              </View>
            )}
          />
        )
      ) : (
        favoritedTeamsList.length === 0 ? (
          <ScrollView 
            contentContainerStyle={styles.centerEmpty}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />}
          >
            <Shield size={44} color="#374151" style={{ marginBottom: 10 }} />
            <Text style={styles.emptyTitle}>لا توجد أندية تتابعها</Text>
            <Text style={styles.emptySub}>اختر أنديتك المفضلة للحصول على إشعارات الأهداف والتغييرات المباشرة.</Text>
          </ScrollView>
        ) : (
          <FlatList
            data={favoritedTeamsList}
            keyExtractor={(item) => item.id.toString()}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />}
            renderItem={({ item }) => (
              <View style={styles.teamRowItem}>
                <Image source={{ uri: item.logo }} style={styles.teamAvatar} />
                <View style={styles.teamDetails}>
                  <Text style={styles.teamTitleText}>{item.name}</Text>
                  <Text style={styles.teamStatsText}>{item.fans} مـتابع في المنصة</Text>
                </View>
                <Pressable 
                  style={styles.unfollowButton}
                  onPress={() => handleToggleTeamFav(item.id.toString())}
                >
                  <Text style={styles.unfollowText}>إلغاء المتابعة</Text>
                </Pressable>
              </View>
            )}
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
          />
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
  tabsHeader: {
    flexDirection: 'row-reverse',
    backgroundColor: '#0c1223',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
    gap: 8,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1f2937',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 8,
  },
  activeTabButton: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: '#10b981',
  },
  tabText: {
    color: '#9ca3af',
    fontSize: 13,
    fontWeight: '800',
  },
  activeTabText: {
    color: '#10b981',
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerEmpty: {
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
    lineHeight: 18,
    maxWidth: 260,
  },
  teamRowItem: {
    flexDirection: 'row-reverse',
    backgroundColor: '#0c1223',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  teamAvatar: {
    width: 44,
    height: 44,
    resizeMode: 'contain',
    marginLeft: 14,
  },
  teamDetails: {
    flex: 1,
    alignItems: 'flex-end', // Right align text for RTL
  },
  teamTitleText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 2,
  },
  teamStatsText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '700',
  },
  unfollowButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  unfollowText: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '800',
  }
});
