import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  Pressable, 
  ActivityIndicator, 
  ScrollView, 
  Switch, 
  Image,
  Alert,
  Platform
} from 'react-native';
import { User, Mail, Lock, Settings, Bell, LogOut, Film, Play } from 'lucide-react-native';
import { auth, db, registerWithEmail, loginWithEmail } from '../../config/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Auth Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  // App Settings
  const [pushEnabled, setPushEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [continueWatchingHistory, setContinueWatchingHistory] = useState<any[]>([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchContinueWatching(currentUser.uid);
      } else {
        await loadLocalContinueWatching();
      }
    });
    return () => unsub();
  }, []);

  const fetchContinueWatching = async (userId: string) => {
    try {
      const q = query(
        collection(db, 'users', userId, 'continue_watching'),
        orderBy('timestamp', 'desc'),
        limit(5)
      );
      const snap = await getDocs(q);
      const items: any[] = [];
      snap.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() });
      });
      
      if (items.length > 0) {
        setContinueWatchingHistory(items);
      } else {
        // Fallback default
        setContinueWatchingHistory([
          { id: "apf-1", title: "الهلال - النصر (بث مباشر)", teamNames: "الهلال ضد النصر", timestamp: "منذ ساعة" }
        ]);
      }
    } catch (e) {
      console.warn(e);
      loadLocalContinueWatching();
    }
  };

  const loadLocalContinueWatching = async () => {
    try {
      const stored = await AsyncStorage.getItem('local_continue_watching');
      if (stored) {
        setContinueWatchingHistory(JSON.parse(stored));
      } else {
        setContinueWatchingHistory([
          { id: "apf-1", title: "الهلال - النصر (بث مباشر)", teamNames: "الهلال ضد النصر", timestamp: "منذ ساعة" }
        ]);
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const handleAuthSubmit = async () => {
    if (!email || !password) {
      Alert.alert('تنبيه', 'يرجى ملء جميع الحقول المطلوبة.');
      return;
    }
    setLoading(true);
    try {
      if (isSignUp) {
        await registerWithEmail(email, password);
        Alert.alert('نجاح التسجيل', 'تم إنشاء حسابك بنجاح في كورة لايف!');
      } else {
        await loginWithEmail(email, password);
        Alert.alert('مرحباً بك', 'تم تسجيل دخول الميدان بنجاح.');
      }
    } catch (error: any) {
      console.error(error);
      Alert.alert('فشل العملية', error.message || 'حدث خطأ أثناء الاتصال بالخادم.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogOut = async () => {
    try {
      await signOut(auth);
      Alert.alert('خروج', 'تم تسجيل الخروج من التطبيق.');
    } catch (e) {
      console.error(e);
    }
  };

  const handleWatchingPress = (matchId: string) => {
    router.push(`/match/${matchId}`);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {user ? (
        // Logged In Page Context
        <View style={styles.profileSection}>
          <View style={styles.profileCard}>
            <View style={styles.avatarCircle}>
              <User size={40} color="#10b981" />
            </View>
            <Text style={styles.userEmailText}>{user.email}</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.badgeText}>مـشجع ذهـبي 🌟</Text>
            </View>
          </View>

          {/* Continue Watching History Reel */}
          <View style={styles.sectionHeaderRow}>
            <Film size={18} color="#10b981" />
            <Text style={styles.sectionTitleText}>مواصلة المشاهدة 📺</Text>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.watchingScroll}>
            {continueWatchingHistory.map((item) => (
              <Pressable 
                key={item.id}
                onPress={() => handleWatchingPress(item.id)}
                style={styles.watchingCard}
              >
                <View style={styles.watchingHeader}>
                  <Play size={16} color="#ffffff" />
                </View>
                <Text style={styles.watchingTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.watchingSub}>{item.timestamp || 'البث الأخير'}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Settings Section */}
          <View style={styles.sectionHeaderRow}>
            <Settings size={18} color="#10b981" />
            <Text style={styles.sectionTitleText}>إعدادات التحكم والتنبيهات</Text>
          </View>

          <View style={styles.settingsGroup}>
            <View style={styles.settingRow}>
              <Switch 
                value={pushEnabled} 
                onValueChange={setPushEnabled} 
                trackColor={{ false: '#4b5563', true: '#10b981' }}
                thumbColor="#ffffff"
              />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>إشعارات الأهداف الفورية</Text>
                <Text style={styles.settingDesc}>إعلامي عند إحراز الأهداف لأنديتي المفضلة</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <Switch 
                value={soundEnabled} 
                onValueChange={setSoundEnabled} 
                trackColor={{ false: '#4b5563', true: '#10b981' }}
                thumbColor="#ffffff"
              />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>أصوات التنبيه المباشرة</Text>
                <Text style={styles.settingDesc}>أصوات صفير الحكم عند انطلاق الشوط الثاني</Text>
              </View>
            </View>
          </View>

          {/* Logout button */}
          <Pressable onPress={handleLogOut} style={styles.logoutButton}>
            <LogOut size={16} color="#ef4444" style={{ marginLeft: 8 }} />
            <Text style={styles.logoutText}>تسجيل الخروج</Text>
          </Pressable>
        </View>
      ) : (
        // Auth Gates Form
        <View style={styles.authContainer}>
          <Image 
            source={{ uri: 'https://media.api-sports.io/football/leagues/39.png' }} 
            style={styles.logoImage}
          />
          <Text style={styles.welcomeText}>بوابة المشجع الموحدة ⚽</Text>
          <Text style={styles.formInstructions}>
            قم بتسجيل الدخول لمزامنة فرقك المفضلة وتتبع المباريات مباشرة عبر الأجهزة.
          </Text>

          {/* Sign Up Name if applicable */}
          {isSignUp && (
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="اسم المستخدم..."
                placeholderTextColor="#6b7280"
                value={username}
                onChangeText={setUsername}
                textAlign="right"
              />
              <User size={18} color="#9ca3af" style={styles.inputIcon} />
            </View>
          )}

          {/* Email input */}
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="البريد الإلكتروني..."
              placeholderTextColor="#6b7280"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              textAlign="right"
            />
            <Mail size={18} color="#9ca3af" style={styles.inputIcon} />
          </View>

          {/* Password inputs */}
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="كلمة المرور..."
              placeholderTextColor="#6b7280"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              textAlign="right"
            />
            <Lock size={18} color="#9ca3af" style={styles.inputIcon} />
          </View>

          {/* Submit Trigger button */}
          <Pressable 
            onPress={handleAuthSubmit}
            style={({ pressed }) => [styles.submitButton, pressed && styles.btnPressed]}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.submitText}>{isSignUp ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}</Text>
            )}
          </Pressable>

          {/* Shift tab buttons */}
          <Pressable onPress={() => setIsSignUp(!isSignUp)} style={styles.toggleAuthView}>
            <Text style={styles.toggleText}>
              {isSignUp ? 'لديك حساب بالفعل؟ سجل دخولك' : 'ليس لديك حساب؟ سجل معنا مجاناً الآن'}
            </Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
  profileSection: {
    padding: 16,
  },
  profileCard: {
    backgroundColor: '#0c1223',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.15)',
    marginBottom: 20,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  userEmailText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 6,
  },
  statusBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  badgeText: {
    color: '#10b981',
    fontWeight: '800',
    fontSize: 11,
  },
  sectionHeaderRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 14,
    gap: 8,
  },
  sectionTitleText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '950',
  },
  watchingScroll: {
    flexDirection: 'row-reverse',
    gap: 12,
    paddingBottom: 16,
  },
  watchingCard: {
    backgroundColor: '#0c1223',
    borderRadius: 16,
    padding: 12,
    width: 156,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  watchingHeader: {
    height: 80,
    backgroundColor: '#1f2937',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  watchingTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'right',
  },
  watchingSub: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'right',
    marginTop: 2,
  },
  settingsGroup: {
    backgroundColor: '#0c1223',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  settingTextContainer: {
    alignItems: 'flex-end',
    flex: 1,
    paddingRight: 14,
  },
  settingTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 2,
  },
  settingDesc: {
    color: '#6b7280',
    fontSize: 11,
    fontWeight: '700',
  },
  divider: {
    height: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    marginVertical: 4,
  },
  logoutButton: {
    flexDirection: 'row-reverse',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1.5,
    borderColor: '#ef4444',
    borderRadius: 12,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  logoutText: {
    color: '#ef4444',
    fontWeight: '950',
    fontSize: 14,
  },
  authContainer: {
    padding: 24,
    alignItems: 'center',
    marginTop: 20,
  },
  logoImage: {
    width: 72,
    height: 72,
    resizeMode: 'contain',
    borderRadius: 36,
    marginBottom: 16,
    backgroundColor: '#0c1223',
  },
  welcomeText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '950',
    marginBottom: 8,
  },
  formInstructions: {
    color: '#9ca3af',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
    maxWidth: 282,
    fontWeight: '700',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0c1223',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 16,
    width: '100%',
  },
  input: {
    flex: 1,
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
    height: '100%',
  },
  inputIcon: {
    marginLeft: 10,
  },
  submitButton: {
    backgroundColor: '#10b981',
    width: '100%',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#10b981',
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
  },
  btnPressed: {
    opacity: 0.85,
  },
  submitText: {
    color: '#ffffff',
    fontWeight: '950',
    fontSize: 14,
  },
  toggleAuthView: {
    marginTop: 18,
  },
  toggleText: {
    color: '#34d399',
    fontWeight: '900',
    fontSize: 12,
  }
});
