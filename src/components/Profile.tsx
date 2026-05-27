import React, { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { auth, db, signInWithGoogle, signInWithFacebook, handleFirestoreError, OperationType, handleRedirectResult, loginWithEmail, registerWithEmail, registerForPushNotifications } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Link } from 'react-router-dom';
import { LogOut, Settings, Bell, Star, Shield, User as UserIcon, Check, Plus, Trophy, Users, Mail, Lock, AlertCircle, Radio, Download, Bookmark, BookOpen, Trash2, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { UserProfile, League, News } from '../types';
import { cn } from '../lib/utils';
import { useError } from '../context/ErrorContext';

const POPULAR_LEAGUE_CHOICES = [
  { id: '307', name: 'الدوري السعودي للمحترفين', logo: 'https://media.api-sports.io/football/leagues/307.png' },
  { id: '39', name: 'الدوري الإنجليزي الممتاز', logo: 'https://media.api-sports.io/football/leagues/39.png' },
  { id: '140', name: 'الدوري الإسباني - لاليغا', logo: 'https://media.api-sports.io/football/leagues/140.png' },
  { id: '135', name: 'الدوري الإيطالي - الدرجة أ', logo: 'https://media.api-sports.io/football/leagues/135.png' },
  { id: '2', name: 'دوري أبطال أوروبا', logo: 'https://media.api-sports.io/football/leagues/2.png' }
];

import ThemeSettings from './ThemeSettings';
import ShareButton from './ShareButton';
import NewsDetailModal from './NewsDetailModal';

export default function Profile() {
  const { showError, showToast } = useError();
  const [user, loading] = useAuthState(auth);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [savedNews, setSavedNews] = useState<News[]>([]);
  const [loadingNews, setLoadingNews] = useState(false);
  const [selectedNews, setSelectedNews] = useState<News | null>(null);
  const [saving, setSaving] = useState(false);
  const [showEmailAuth, setShowEmailAuth] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [notificationToken, setNotificationToken] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.savedArticles && profile.savedArticles.length > 0) {
      const fetchSavedArticles = async () => {
        setLoadingNews(true);
        try {
          const articles = await Promise.all(
            profile.savedArticles.map(async (id) => {
              const docSnap = await getDoc(doc(db, 'news', id));
              if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() } as News;
              }
              return null;
            })
          );
          setSavedNews(articles.filter((a): a is News => a !== null));
        } catch (error) {
          console.error("Error fetching saved articles: ", error);
        } finally {
          setLoadingNews(false);
        }
      };
      fetchSavedArticles();
    } else {
      setSavedNews([]);
    }
  }, [profile?.savedArticles]);

  const handleRegisterPush = async () => {
    if (!user) return;
    try {
      const token = await registerForPushNotifications(user.uid);
      if (token) {
        setNotificationToken(token);
        showToast('تم تفعيل التنبيهات بنجاح! ستصلك تنبيهات عند الأهداف وانطلاق المباريات.', 'success');
      }
    } catch (e) {
      showError('فشل تفعيل التنبيهات. يرجى التأكد من السماح بالإشعارات في المتصفح.');
    }
  };

  useEffect(() => {
    // معالجة نتيجة الـ Redirect (مهم جداً لتطبيقات الأندرويد)
    const checkRedirect = async () => {
      try {
        const result = await handleRedirectResult();
        if (result?.user) {
          console.log("Signed in via redirect:", result.user.displayName);
        }
      } catch (error: any) {
        if (error.code !== 'auth/credential-already-in-use' && error.code !== 'auth/operation-not-allowed') {
          console.error("Redirect check failed:", error);
        }
      }
    };
    checkRedirect();
  }, []);

  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        const docRef = doc(db, 'users', user.uid);
        try {
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          } else {
            const newProfile: UserProfile = {
              uid: user.uid,
              displayName: user.displayName || user.email?.split('@')[0] || 'مستخدم جديد',
              email: user.email || '',
              photoURL: user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user.uid}`,
              isAdmin: user.email === 'abdalziz2022@gmail.com',
              favoriteLeagues: [],
              favoriteTeams: [],
            };
            await setDoc(docRef, newProfile);
            setProfile(newProfile);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
          showError(error);
        }
      };
      fetchProfile();
    }
  }, [user]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      if (isSignUp) {
        await registerWithEmail(email, password);
      } else {
        await loginWithEmail(email, password);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') setAuthError('البريد الإلكتروني مستخدم بالفعل');
      else if (err.code === 'auth/wrong-password') setAuthError('كلمة المرور خاطئة');
      else if (err.code === 'auth/user-not-found') setAuthError('المستخدم غير موجود');
      else if (err.code === 'auth/weak-password') setAuthError('كلمة المرور ضعيفة جداً (أدخل 6 خانات على الأقل)');
      else setAuthError('حدث خطأ أثناء تسجيل الدخول. تأكد من البيانات.');
    } finally {
      setAuthLoading(false);
    }
  };

  const toggleFavorite = async (type: 'favoriteLeagues' | 'favoriteTeams', value: string) => {
    if (!profile || !user) return;

    setSaving(true);
    const currentList = profile[type] || [];
    const newList = currentList.includes(value)
      ? currentList.filter(item => item !== value)
      : [...currentList, value];

    try {
      const docRef = doc(db, 'users', user.uid);
      await updateDoc(docRef, { [type]: newList });
      setProfile({ ...profile, [type]: newList });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
      showError(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 space-y-6 pt-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md glass p-8 rounded-[40px] space-y-6"
        >
          <div className="flex justify-center">
            <div className="p-4 bg-primary/20 rounded-full ring-4 ring-primary/10">
              <UserIcon size={40} className="text-primary" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-black">حساب المشجع</h1>
            <p className="text-gray-400 text-sm font-medium">إنشاء الحساب اختياري بالكامل. يمكنك الاستمتاع بكافة مميزات التطبيق كزائر.</p>
          </div>
          
          <div className="space-y-4">
            {!showEmailAuth ? (
              <>
                {!Capacitor.isNativePlatform() && (
                  <>
                    <div className="grid grid-cols-1 gap-3">
                      <button 
                        onClick={signInWithGoogle}
                        className="w-full flex items-center justify-center gap-3 bg-white text-black font-black px-6 py-4 rounded-2xl hover:neon-glow transition-all active:scale-95 text-sm"
                      >
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="" />
                        تسجيل الدخول السريع
                      </button>
                    </div>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                      <div className="relative flex justify-center text-[10px] uppercase"><span className="bg-[#0a0a0a] px-3 text-gray-500 font-black">أو عبر البريد</span></div>
                    </div>
                  </>
                )}

                <div className="space-y-3">
                  <button 
                    onClick={() => setShowEmailAuth(true)}
                    className="w-full flex items-center justify-center gap-3 glass text-white font-black px-6 py-4 rounded-2xl hover:bg-white/5 transition-all text-sm"
                  >
                    <Mail size={18} />
                    البريد الإلكتروني
                  </button>

                  <div className="pt-4 space-y-3">
                    <Link 
                      to="/"
                      className="w-full flex items-center justify-center gap-3 bg-primary/10 text-primary border border-primary/20 font-black px-6 py-4 rounded-2xl hover:bg-primary/20 transition-all shadow-lg shadow-primary/5"
                    >
                      المتابعة كزائر (بدون حساب)
                    </Link>
                    <p className="text-[10px] text-center text-gray-500 font-bold px-8">
                      * تسجيل الحساب يتيح لك فقط حفظ الفرق المفضلة وتلقي تنبيهات الأهداف المباشرة.
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5">
                   <div className="bg-primary/5 rounded-2xl p-4 border border-primary/20">
                      <div className="flex items-center gap-3 mb-2">
                         <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center text-primary">
                            <Download size={16} />
                         </div>
                         <h3 className="text-xs font-black">تطبيق Korea 90</h3>
                      </div>
                      <p className="text-[10px] text-gray-400 leading-relaxed mb-3">
                         ثبّت التطبيق على شاشة هاتفك الرئيسية لمتابعة المباريات بشكل أسرع والحصول على تنبيهات فورية.
                      </p>
                      <button 
                        onClick={() => {
                          alert("لتثبيت التطبيق:\n1. اضغط على زر المشاركة (Share) في المتصفح\n2. اختر 'إضافة إلى الشاشة الرئيسية' (Add to Home Screen)");
                        }}
                        className="w-full bg-primary/20 text-primary text-[10px] font-black py-2 rounded-xl hover:bg-primary/30 transition-colors"
                      >
                         كيفية التثبيت؟
                      </button>
                   </div>
                </div>
              </>
            ) : (
              <div className="space-y-6">
                <div className="flex bg-surface p-1 rounded-2xl border border-white/5">
                  <button
                    type="button"
                    onClick={() => setIsSignUp(false)}
                    className={cn(
                      "flex-1 py-2 text-sm font-black rounded-xl transition-all",
                      !isSignUp ? "bg-primary text-black shadow-lg" : "text-gray-500 hover:text-white"
                    )}
                  >
                    تسجيل الدخول
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSignUp(true)}
                    className={cn(
                      "flex-1 py-2 text-sm font-black rounded-xl transition-all",
                      isSignUp ? "bg-primary text-black shadow-lg" : "text-gray-500 hover:text-white"
                    )}
                  >
                    حساب جديد
                  </button>
                </div>

                <form onSubmit={handleEmailAuth} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 block px-2">البريد الإلكتروني</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input 
                        type="email" 
                        required
                        placeholder="example@mail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-surface border border-border rounded-xl py-3 pl-12 pr-4 focus:neon-border outline-none text-sm transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 block px-2">كلمة المرور</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input 
                        type="password" 
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-surface border border-border rounded-xl py-3 pl-12 pr-4 focus:neon-border outline-none text-sm transition-all"
                      />
                    </div>
                  </div>

                  {authError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-500 text-xs font-bold animate-shake">
                      <AlertCircle size={14} />
                      {authError}
                    </div>
                  )}

                  <button 
                    disabled={authLoading}
                    type="submit"
                    className="w-full bg-primary text-black font-black px-6 py-4 rounded-2xl hover:neon-glow transition-all disabled:opacity-50"
                  >
                    {authLoading ? 'جاري التحميل...' : (isSignUp ? 'إنشاء الحساب' : 'تسجيل الدخول')}
                  </button>

                  <div className="flex flex-col gap-3 pt-2">
                    <button 
                      type="button"
                      onClick={() => setShowEmailAuth(false)}
                      className="text-xs text-gray-500 font-bold hover:text-white transition-colors text-center w-full"
                    >
                      ← العودة لخيارات الدخول
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full max-w-md"
        >
          <ThemeSettings />
        </motion.div>
      </div>
    );
  }

  const isAdmin = user.email === 'abdalziz2022@gmail.com';

  return (
    <div className="max-w-4xl mx-auto px-4 pt-32 pb-24 space-y-8">
      {/* Profile Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-8 rounded-[40px] flex flex-col md:flex-row items-center gap-8 relative overflow-hidden"
      >
        <div className="relative">
          <img src={user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user.uid}`} alt="" className="w-32 h-32 rounded-full border-4 border-primary/20" />
          {isAdmin && (
            <div className="absolute -bottom-2 -right-2 bg-primary text-black p-2 rounded-full shadow-lg">
              <Shield size={20} />
            </div>
          )}
        </div>
        
        <div className="text-center md:text-right space-y-2 flex-1">
          <h1 className="text-3xl font-black">{profile?.displayName || user.displayName}</h1>
          <p className="text-gray-400 font-medium">{user.email}</p>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
            {isAdmin && (
              <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-tighter">Admin Access</span>
            )}
            <span className="bg-white/5 text-white/60 px-3 py-1 rounded-full text-xs font-bold">عضو ذهبي 🏆</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <ShareButton variant="dropdown" align="right" text="انضم إليّ على كورة 90 وتابع تفاصيل المباريات والموعد المكتملة ومواصفات الفرق!" />
          
          <button 
            onClick={() => auth.signOut()}
            className="bg-red-500/10 text-red-500 px-6 py-3 rounded-2xl font-bold text-sm hover:bg-red-500 hover:text-white transition-all flex items-center gap-2"
          >
            <LogOut size={18} /> تسجيل الخروج
          </button>
        </div>
      </motion.div>

      {/* User Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Favorite Leagues */}
        <div className="glass p-6 rounded-3xl space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2">
              <Trophy size={18} className="text-secondary" /> الدوريات المفضلة
            </h3>
            {saving && <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {POPULAR_LEAGUE_CHOICES.map(league => {
              const isFav = profile?.favoriteLeagues.includes(league.name);
              return (
                <button
                  key={league.id}
                  onClick={() => toggleFavorite('favoriteLeagues', league.name)}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-xl border text-right transition-all",
                    isFav 
                      ? "bg-secondary/10 border-secondary text-secondary" 
                      : "bg-surface border-border hover:border-gray-500"
                  )}
                >
                  <img src={league.logo || undefined} alt="" className="w-6 h-6 rounded-full" />
                  <span className="text-xs font-bold leading-tight flex-1">{league.name}</span>
                  {isFav && <Check size={14} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Favorite Teams (Common ones for demo) */}
        <div className="glass p-6 rounded-3xl space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2">
              <Users size={18} className="text-primary" /> الأندية المفضلة
            </h3>
            {saving && <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { name: 'ريال مدريد', logo: 'https://media.api-sports.io/football/teams/541.png' },
              { name: 'برشلونة', logo: 'https://media.api-sports.io/football/teams/529.png' },
              { name: 'الهلال', logo: 'https://media.api-sports.io/football/teams/2939.png' },
              { name: 'النصر', logo: 'https://media.api-sports.io/football/teams/2940.png' },
              { name: 'ليفربول', logo: 'https://media.api-sports.io/football/teams/40.png' },
              { name: 'مانشستر سيتي', logo: 'https://media.api-sports.io/football/teams/50.png' },
            ].map(team => {
              const isFav = profile?.favoriteTeams.includes(team.name);
              return (
                <button
                  key={team.name}
                  onClick={() => toggleFavorite('favoriteTeams', team.name)}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-xl border text-right transition-all",
                    isFav 
                      ? "bg-primary/10 border-primary text-primary" 
                      : "bg-surface border-border hover:border-gray-500"
                  )}
                >
                  <img src={team.logo || undefined} alt="" className="w-6 h-6 rounded-full" />
                  <span className="text-xs font-bold leading-tight flex-1">{team.name}</span>
                  {isFav && <Check size={14} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Read Later / Saved Articles */}
        <div className="md:col-span-2 glass p-6 rounded-[32px] space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2 text-lg text-emerald-400">
              <Bookmark size={20} className="text-emerald-400" /> قائمة اقرأ لاحقاً ({profile?.savedArticles?.length || 0})
            </h3>
            <span className="text-[10px] text-gray-500 font-extrabold bg-white/5 px-2.5 py-1 rounded-lg">ركن القراءة الذاتي</span>
          </div>

          {loadingNews ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-gray-500 font-bold">جاري تحميل مقالاتك المحفوظة...</p>
            </div>
          ) : savedNews.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {savedNews.map(article => (
                <div 
                  key={article.id} 
                  className="group bg-surface hover:bg-white/[0.03] border border-border hover:border-emerald-500/30 rounded-2xl overflow-hidden flex flex-col transition-all duration-300"
                >
                  <div className="relative h-32 w-full overflow-hidden shrink-0">
                    <img 
                      src={article.image || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800'} 
                      alt="" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <span className="absolute bottom-2 right-2 bg-emerald-500 text-black text-[9px] font-black px-2 py-0.5 rounded-md">
                      {article.category}
                    </span>
                  </div>
                  
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-sm text-gray-200 line-clamp-2 leading-snug group-hover:text-emerald-400 transition-colors">
                        {article.title}
                      </h4>
                      <p className="text-[10px] text-gray-400 font-bold">بواسطة {article.author} • {new Date(article.createdAt).toLocaleDateString('ar-SA')}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <button 
                        onClick={() => setSelectedNews(article)}
                        className="text-xs text-emerald-400 font-black flex items-center gap-1 hover:translate-x-1 hover:text-emerald-300 transition-all"
                      >
                        اقرأ الآن <ChevronRight size={14} />
                      </button>
                      
                      <button 
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!user) return;
                          try {
                            const docRef = doc(db, 'users', user.uid);
                            const updatedSaved = (profile?.savedArticles || []).filter(id => id !== article.id);
                            await updateDoc(docRef, { savedArticles: updatedSaved });
                            setProfile(prev => prev ? { ...prev, savedArticles: updatedSaved } : null);
                            showToast('تمت الإزالة من قائمة اقرأ لاحقاً', 'success');
                          } catch (error) {
                            showError('فشل إلغاء الحفظ');
                          }
                        }}
                        className="text-gray-500 hover:text-red-400 p-1.5 hover:bg-red-500/10 rounded-lg transition-all"
                        title="إزالة المقال"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-4 bg-white/[0.01] border border-dashed border-white/5 rounded-2xl">
              <div className="p-3 bg-white/5 text-gray-500 rounded-full">
                <BookOpen size={24} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-gray-400">لا يوجد مقالات في اقرأ لاحقاً</p>
                <p className="text-xs text-gray-500 max-w-xs leading-relaxed">
                  تصفح الأخبار واضغط على زر الحفظ للرجوع إليها وقراءتها في أي وقت من هنا!
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="glass p-6 rounded-3xl space-y-4">
          <h3 className="font-bold flex items-center gap-2">
            <Bell size={18} className="text-primary" /> التنبيهات
          </h3>
          <button 
            onClick={handleRegisterPush}
            className={cn(
              "w-full flex items-center justify-between p-4 rounded-xl border transition-all",
              notificationToken ? "bg-primary/10 border-primary text-primary" : "bg-surface border-border hover:neon-border"
            )}
          >
            <div className="text-right">
              <span className="text-sm font-bold block">{notificationToken ? 'التنبيهات مفعلة' : 'تفعيل تنبيهات المباريات المباشرة'}</span>
              <span className="text-[10px] text-gray-500">احصل على إشعارات فورية للأهداف وبطاقات الجزاء</span>
            </div>
            {notificationToken ? <Check size={18} /> : <Radio size={18} className="animate-pulse" />}
          </button>
        </div>
        
        <ThemeSettings />
        
        {isAdmin && (
          <Link 
            to="/admin" 
            className="md:col-span-2 bg-surface hover:neon-border border border-border p-6 rounded-3xl flex items-center justify-between group transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                <Settings />
              </div>
              <div>
                <h4 className="font-bold">لوحة الإدارة PRO</h4>
                <p className="text-xs text-gray-500">إدارة المباريات والبث الأخبار</p>
              </div>
            </div>
            <div className="bg-primary text-black px-4 py-1.5 rounded-full text-xs font-black group-hover:scale-105 transition-transform">
              دخول الإدارة
            </div>
          </Link>
        )}
      </div>

      {/* News Detail Modal Overlay */}
      <NewsDetailModal news={selectedNews} onClose={() => setSelectedNews(null)} />
    </div>
  );
}
