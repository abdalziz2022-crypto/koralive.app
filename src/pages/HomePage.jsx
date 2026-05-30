import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Radio, 
  CalendarDays, 
  Trophy, 
  Flame, 
  Tv, 
  Zap, 
  ChevronLeft, 
  Star, 
  Bell, 
  Search, 
  Share2, 
  Clock, 
  Compass, 
  Bookmark, 
  Activity, 
  Sparkles,
  ShieldAlert,
  AlertTriangle 
} from 'lucide-react';

import { getActiveApiKey } from '../api/apiClient';

// Hooks & Services
import { 
  useLiveMatches, 
  useFixtures, 
  useLeagues, 
  useNews 
} from '../hooks/useFootballApi';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { filterMatchesByCustomLeagues, filterLeaguesByCustomLeagues } from '../utils/leagueFilter';

// Components
import HomeHeader from '../components/home/HomeHeader';
import MatchCard from '../components/MatchCard';
import AdBanner from '../components/AdBanner';
import ShareButton from '../components/ShareButton';

export default function HomePage() {
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  
  // Real-time API query feeds (Sprint 4 data-first foundation)
  const { data: qLiveMatches, isLoading: liveLoading, isError: liveError, error: liveQueryError } = useLiveMatches();
  const { data: qFixtures, isLoading: fixturesLoading } = useFixtures({
    date: new Date().toISOString().split('T')[0]
  });
  const { data: qLeagues, isLoading: leaguesLoading } = useLeagues();
  const { data: newsPayload, isLoading: newsLoading } = useNews({ limit: 6 });

  // Favorites logic from firebase profile
  const [profile, setProfile] = useState(null);
  React.useEffect(() => {
    if (user) {
      const docRef = doc(db, 'users', user.uid);
      const unsub = onSnapshot(docRef, (snapshot) => {
        if (snapshot.exists()) {
          setProfile(snapshot.data());
        }
      });
      return () => unsub();
    } else {
      setProfile(null);
    }
  }, [user]);

  const favoriteLeagues = profile?.favoriteLeagues || [];
  const favoriteTeams = profile?.favoriteTeams || [];

  const isFavorite = (match) => {
    const lName = typeof match.league === 'object' ? match.league?.name : match.league;
    const hTeamName = typeof match.homeTeam === 'object' ? match.homeTeam?.name : match.homeTeam;
    const aTeamName = typeof match.awayTeam === 'object' ? match.awayTeam?.name : match.awayTeam;
    
    return (
      favoriteLeagues.includes(lName) ||
      favoriteTeams.includes(hTeamName) ||
      favoriteTeams.includes(aTeamName)
    );
  };

  // 1. Live and today matches extraction & formatting
  const liveMatches = useMemo(() => {
    const list = Array.isArray(qLiveMatches) ? qLiveMatches : [];
    return filterMatchesByCustomLeagues(list);
  }, [qLiveMatches]);

  const todayMatches = useMemo(() => {
    const list = Array.isArray(qFixtures) ? qFixtures : [];
    return filterMatchesByCustomLeagues(list);
  }, [qFixtures]);

  const leaguesList = useMemo(() => {
    const list = Array.isArray(qLeagues) ? qLeagues : [];
    return filterLeaguesByCustomLeagues(list);
  }, [qLeagues]);

  const newsArticles = useMemo(() => {
    if (newsPayload && Array.isArray(newsPayload)) return newsPayload.slice(0, 5);
    if (newsPayload && newsPayload.data && Array.isArray(newsPayload.data)) {
      return newsPayload.data.slice(0, 5);
    }
    return [];
  }, [newsPayload]);

  // Select "Match of the Day" / Premium Hero Match
  const heroMatch = useMemo(() => {
    if (liveMatches.length > 0) return liveMatches[0];
    if (todayMatches.length > 0) {
      // Prefer upcoming matches of major teams or first match
      return todayMatches[0];
    }
    return null;
  }, [liveMatches, todayMatches]);

  // Trending Match algorithm (matches featuring top clubs or live)
  const trendingMatches = useMemo(() => {
    const list = [...todayMatches];
    const topClubs = ['الهلال', 'النصر', 'الاتحاد', 'الاهلي', 'برشلونة', 'ريال مدريد', 'ليفربول', 'مانشستر', 'أرسنال', 'بايرن'];
    
    return list.filter(m => {
      if (m.id === heroMatch?.id) return false;
      const hName = typeof m.homeTeam === 'object' ? m.homeTeam?.name : m.homeTeam;
      const aName = typeof m.awayTeam === 'object' ? m.awayTeam?.name : m.awayTeam;
      return topClubs.some(club => hName?.includes(club) || aName?.includes(club));
    }).slice(0, 3);
  }, [todayMatches, heroMatch]);

  const formattedStartTime = (timeString) => {
    if (!timeString) return '';
    try {
      return new Date(timeString).toLocaleTimeString('ar-SA', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (_) {
      return '';
    }
  };

  return (
    <div 
      className="min-h-screen bg-[#070c16] text-gray-100 pb-28 pt-0 px-0 transition-colors duration-300 select-none overflow-x-hidden font-sans" 
      style={{ direction: 'rtl' }}
    >
      {/* Dynamic Header with Live Actions */}
      <HomeHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 pt-6">

        {/* Diagnostic Alert for API errors or empty keys */}
        {(!getActiveApiKey() || liveError) && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl border p-5 flex flex-col sm:flex-row items-center justify-between gap-4 ${
              liveError 
                ? 'border-red-500/15 bg-red-950/15' 
                : 'border-amber-500/15 bg-amber-950/10'
            }`}
          >
            <div className="flex items-start gap-3 text-right">
              {liveError ? (
                <ShieldAlert className="text-red-400 shrink-0 mt-0.5" size={20} />
              ) : (
                <AlertTriangle className="text-amber-400 shrink-0 mt-0.5" size={20} />
              )}
              <div>
                <h4 className={`text-xs font-black ${liveError ? 'text-red-200' : 'text-amber-200'}`}>
                  {liveError 
                    ? `فشل جلب البيانات الحقيقية من الموفر المباشر: ${liveQueryError?.message || ''}` 
                    : 'لم يتم إعداد مصدر البيانات بعد. يرجى إضافة مفاتيح البيئة من إعدادات Vercel.'}
                </h4>
                <p className={`text-[11px] mt-1 leading-relaxed ${liveError ? 'text-red-300/80' : 'text-amber-300/85'}`}>
                  {liveError 
                    ? 'تعذر الاتصال بالمزود المباشر بسبب نفاد الحصة المجانية للمفتاح، أو حد الـ Rate Limit لطلبات البث.' 
                    : 'التطبيق مهيأ في وضع الأمان الرياضي. لتفعيل مزامنة المباريات الحية والنتائج والأخبار الحقيقية كاملة، يرجى تعيين مفتاح البيئة لـ Vercel.'}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/football-debug')}
              className={`font-black text-xs px-4.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap border ${
                liveError
                  ? 'bg-red-500/15 hover:bg-red-500/25 text-red-300 border-red-500/30'
                  : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/30'
              }`}
            >
              شاشة التدقيق والمفاتيح
            </button>
          </motion.div>
        )}

        {/* 1. SHORTCUTS / QUICK ACTIONS */}
        <section className="animate-fade-in">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'المباريات المباشرة', desc: 'بث حي الآن', icon: Radio, onClick: () => navigate('/schedule?tab=LIVE'), color: 'from-rose-500/20 to-red-600/5 text-rose-400 border-rose-500/20' },
              { label: 'أخبار كورة لايف', desc: 'تغطية عالمية حية', icon: Compass, onClick: () => navigate('/news'), color: 'from-cyan-500/20 to-blue-600/5 text-cyan-400 border-cyan-500/20' },
              { label: 'البطولات الكبرى', desc: 'الترتيب والنتائج', icon: Trophy, onClick: () => navigate('/leagues'), color: 'from-amber-500/20 to-yellow-600/5 text-amber-400 border-amber-500/20' },
              { label: 'مفضلتي الرياضية', desc: 'تنبيهات فورية', icon: Star, onClick: () => navigate('/profile'), color: 'from-emerald-500/20 to-teal-600/5 text-emerald-400 border-emerald-500/20' },
            ].map((act, idx) => (
              <motion.button
                key={act.label}
                whileHover={{ y: -3, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={act.onClick}
                className={`p-4 rounded-2xl bg-gradient-to-br ${act.color} border text-right transition-all flex items-center justify-between cursor-pointer`}
              >
                <div className="space-y-1">
                  <span className="block text-xs font-black text-white">{act.label}</span>
                  <span className="block text-[10px] opacity-65 font-bold">{act.desc}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5">
                  <act.icon size={18} />
                </div>
              </motion.button>
            ))}
          </div>
        </section>

        {/* 2. PREMIUM HERO LIVE/MATCH OF THE DAY */}
        {heroMatch && (
          <section className="relative overflow-hidden rounded-[24px] border border-white/5 bg-gradient-to-br from-slate-900/60 via-slate-900/95 to-slate-950/90 p-5 md:p-8 shadow-2xl">
            {/* Ambient glowing blobs in background */}
            <div className="absolute right-0 top-0 w-48 h-48 bg-primary/5 rounded-full filter blur-3xl pointer-events-none" />
            <div className="absolute left-10 bottom-0 w-32 h-32 bg-secondary/5 rounded-full filter blur-3xl pointer-events-none" />

            {/* Premium Status Badge */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 bg-red-500/15 text-red-400 text-[10px] font-black px-3.5 py-1.5 rounded-full border border-red-500/20 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block"></span>
              <span>مباراة القمة الحالية</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center pt-8 lg:pt-0">
              {/* Info Column */}
              <div className="lg:col-span-7 space-y-4 text-right">
                <div className="flex items-center gap-2">
                  <span className="bg-primary/10 text-primary border border-primary/20 text-[9px] font-black tracking-wider uppercase px-2.5 py-1 rounded-md">
                    {typeof heroMatch.league === 'object' ? heroMatch.league?.name : heroMatch.league} 🏆
                  </span>
                  <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
                    <Tv size={12} className="text-primary" />
                     SSC الرياضية HD (معلق حي)
                  </span>
                </div>

                <h2 className="text-xl md:text-2xl font-black text-white leading-tight">
                  {typeof heroMatch.homeTeam === 'object' ? heroMatch.homeTeam?.name : heroMatch.homeTeam} ضد {typeof heroMatch.awayTeam === 'object' ? heroMatch.awayTeam?.name : heroMatch.awayTeam}
                </h2>
                <p className="text-xs text-slate-400 font-bold leading-relaxed max-w-xl">
                  تغطية تحليلية ممتازة لقمة الكرة الحالية. شاهد التشكيل الأساسي، إحصاءات الاستحواذ الدقيقة ومراكز اللاعبين لحظة بلحظة وبدقة عالية.
                </p>

                <div className="flex flex-wrap gap-2.5 pt-2">
                  <Link 
                    to={`/match/${heroMatch.id}`}
                    className="flex items-center gap-2 bg-primary text-black hover:bg-primary/90 px-6 py-2.5 rounded-full text-xs font-black transition-all shadow-lg active:scale-95 duration-200"
                  >
                    <Zap size={13} className="fill-current" />
                    <span>شاهد التحليل والبث المباشر</span>
                  </Link>
                  <ShareButton variant="dropdown" text={`شاهد مباراة ${typeof heroMatch.homeTeam === 'object' ? heroMatch.homeTeam?.name : heroMatch.homeTeam} ضد ${typeof heroMatch.awayTeam === 'object' ? heroMatch.awayTeam?.name : heroMatch.awayTeam} الآن بث مباشر على كورة لايف!`} />
                </div>
              </div>

              {/* Graphical Scoreboard Score Card */}
              <div className="lg:col-span-5 w-full bg-black/35 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-inner flex items-center justify-between">
                {/* Home Team */}
                <div className="flex flex-col items-center space-y-2.5 flex-1">
                  <img 
                    src={heroMatch.homeLogo || (typeof heroMatch.homeTeam === 'object' && heroMatch.homeTeam?.logo)} 
                    alt="" 
                    className="w-14 h-14 object-contain filter drop-shadow hover:scale-105 transition-transform"
                    onError={(e) => { e.target.src = 'https://media.api-sports.io/football/teams/unknown.png'; }}
                    referrerPolicy="no-referrer"
                  />
                  <span className="text-xs font-black text-white text-center truncate w-24">
                    {typeof heroMatch.homeTeam === 'object' ? heroMatch.homeTeam?.name : heroMatch.homeTeam}
                  </span>
                </div>

                {/* Score vs Status */}
                <div className="flex flex-col items-center justify-center px-4">
                  {heroMatch.isLive || heroMatch.status === 'LIVE' ? (
                    <>
                      <div className="text-2xl md:text-3xl font-black text-primary tracking-widest font-mono">
                        {(heroMatch.score?.home !== null && heroMatch.score?.home !== undefined) ? heroMatch.score.home : (heroMatch.homeScore ?? 0)}
                        <span className="mx-1 text-gray-500">:</span>
                        {(heroMatch.score?.away !== null && heroMatch.score?.away !== undefined) ? heroMatch.score.away : (heroMatch.awayScore ?? 0)}
                      </div>
                      <span className="text-[9px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded mt-2 font-mono font-bold animate-pulse">
                        الدقيقة '{heroMatch.minute || '75'}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-[9px] text-gray-400 font-bold mb-1 select-none">تبدأ قريباً</span>
                      <div className="text-xs font-black bg-white/5 px-2.5 py-1 rounded text-primary tracking-wide font-mono">
                        {formattedStartTime(heroMatch.startTime || heroMatch.utcDate)}
                      </div>
                    </>
                  )}
                </div>

                {/* Away Team */}
                <div className="flex flex-col items-center space-y-2.5 flex-1">
                  <img 
                    src={heroMatch.awayLogo || (typeof heroMatch.awayTeam === 'object' && heroMatch.awayTeam?.logo)} 
                    alt="" 
                    className="w-14 h-14 object-contain filter drop-shadow hover:scale-105 transition-transform"
                    onError={(e) => { e.target.src = 'https://media.api-sports.io/football/teams/unknown.png'; }}
                    referrerPolicy="no-referrer"
                  />
                  <span className="text-xs font-black text-white text-center truncate w-24">
                    {typeof heroMatch.awayTeam === 'object' ? heroMatch.awayTeam?.name : heroMatch.awayTeam}
                  </span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 3. HORIZONTAL LIVE MATCHES SECTION */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block"></span>
              <h3 className="text-sm font-black text-white">المباريات المباشرة والنتائج الحية</h3>
            </div>
            <Link to="/schedule?tab=LIVE" className="text-[11px] font-bold text-primary flex items-center gap-1 hover:underline">
              <span>مشاهدة الكل</span>
              <ChevronLeft size={14} />
            </Link>
          </div>

          {liveLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-44 bg-surface/50 rounded-2xl border border-white/5 animate-pulse" />
              ))}
            </div>
          ) : liveMatches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveMatches.slice(0, 3).map(match => (
                <div key={match.id} className="relative">
                  {isFavorite(match) && (
                    <div className="absolute top-2 right-2 z-10 bg-yellow-400 text-black p-1 rounded-full shadow border border-background">
                      <Star size={10} className="fill-current" />
                    </div>
                  )}
                  <MatchCard match={match} />
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/5 bg-[#0b1424] p-8 text-center space-y-3">
              <p className="text-xs text-gray-400 font-bold">لا تتوفر مباريات حية مباشرة حالياً في الخادم.</p>
              <button 
                onClick={() => navigate('/schedule?tab=TODAY')}
                className="mx-auto flex items-center gap-1.5 bg-primary/10 border border-primary/20 text-primary px-4 py-1.5 rounded-full text-[11px] font-black hover:bg-primary/20 cursor-pointer"
              >
                <span>مراجعة مباريات اليوم المجدولة</span>
              </button>
            </div>
          )}
        </section>

        {/* ADS BANNER MVP (Native in-between sections) */}
        <div className="w-full">
          <AdBanner slot="Home_Top" />
        </div>

        {/* 4. TRENDING MATCHES (POPULAR SMART SECTION) */}
        {trendingMatches.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Flame size={16} className="text-amber-500 animate-bounce" />
              <h3 className="text-sm font-black text-white">المباريات الأكثر طلباً وشعبية</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {trendingMatches.map(m => (
                <Link 
                  key={m.id}
                  to={`/match/${m.id}`}
                  className="rounded-2xl border border-white/5 bg-[#0b1424]/60 hover:bg-[#0b1424] p-4 flex items-center justify-between transition-all duration-300 hover:border-primary/20"
                >
                  <div className="flex items-center gap-3">
                    <img 
                      src={m.homeLogo || (typeof m.homeTeam === 'object' && m.homeTeam?.logo)} 
                      alt="" 
                      className="w-8 h-8 object-contain"
                      onError={(e) => { e.target.src = 'https://media.api-sports.io/football/teams/unknown.png'; }}
                      referrerPolicy="no-referrer"
                    />
                    <span className="text-xs font-black text-white">{typeof m.homeTeam === 'object' ? m.homeTeam?.name : m.homeTeam}</span>
                  </div>

                  <div className="flex flex-col items-center px-2 bg-white/5 rounded-xl py-1">
                    <span className="text-[9px] text-primary font-black uppercase tracking-widest">{m.status?.long || m.status}</span>
                    <span className="text-xs font-bold font-mono text-white mt-0.5">
                      {m.isLive || m.status === 'LIVE' ? `${m.homeScore ?? 0} - ${m.awayScore ?? 0}` : formattedStartTime(m.startTime || m.utcDate)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-white text-left">{typeof m.awayTeam === 'object' ? m.awayTeam?.name : m.awayTeam}</span>
                    <img 
                      src={m.awayLogo || (typeof m.awayTeam === 'object' && m.awayTeam?.logo)} 
                      alt="" 
                      className="w-8 h-8 object-contain"
                      onError={(e) => { e.target.src = 'https://media.api-sports.io/football/teams/unknown.png'; }}
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 5. COMPETITIONS CAROUSEL (LEAGUES) */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Trophy size={16} className="text-cyan-400" />
            <h3 className="text-sm font-black text-white">الدوريات والبطولات الرياضية</h3>
          </div>

          {leaguesLoading ? (
            <div className="flex gap-4 overflow-x-auto pb-2 shrink-0">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="w-32 h-20 bg-surface/50 rounded-xl border border-white/5 shrink-0 animate-pulse" />
              ))}
            </div>
          ) : leaguesList.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-none shrink-0" style={{ scrollSnapType: 'x mandatory' }}>
              {leaguesList.map(item => {
                const lName = typeof item === 'string' ? item : (item.name || 'الدوري');
                const lLogo = typeof item === 'object' ? item.emblem || item.logo : '';
                const lId = typeof item === 'object' ? item.id : String(item);

                return (
                  <motion.button
                    key={lId}
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate(`/league/${lId}`)}
                    className="w-36 h-24 bg-[#0b1424] border border-white/5 rounded-2xl flex flex-col items-center justify-center p-3 text-center shrink-0 hover:border-cyan-500/30 cursor-pointer snap-start transition-all duration-300 shadow-sm"
                  >
                    {lLogo ? (
                      <img 
                        src={lLogo} 
                        alt="" 
                        className="w-9 h-9 object-contain mb-2 filter drop-shadow-sm" 
                        onError={(e) => { e.target.src = 'https://media.api-sports.io/football/leagues/unknown.png'; }}
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center mb-2 text-xs font-black text-primary">⚽</div>
                    )}
                    <span className="text-[10px] font-black text-gray-200 truncate w-full">{lName}</span>
                  </motion.button>
                );
              })}
            </div>
          ) : null}
        </section>

        {/* 6. SPORTS NEWS PREVIEW (3 - 5 CARDS) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-cyan-400 animate-pulse" />
              <h3 className="text-sm font-black text-white">أبرز الأخبار العاجلة والانتقالات</h3>
            </div>
            <Link to="/news" className="text-[11px] font-bold text-primary flex items-center gap-1 hover:underline">
              <span>تصفح الأخبار</span>
              <ChevronLeft size={14} />
            </Link>
          </div>

          {newsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-surface/50 rounded-2xl border border-white/5 animate-pulse" />
              ))}
            </div>
          ) : newsArticles.length > 0 ? (
            <div className="space-y-3.5">
              {newsArticles.map((art, index) => {
                const fallbackImg = 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=800';
                
                return (
                  <motion.div
                    key={art.id || index}
                    whileHover={{ x: -4 }}
                    onClick={() => navigate(`/news`)}
                    className="group rounded-2xl border border-white/5 bg-[#0b1424] hover:bg-[#0d182b] p-3 flex gap-4 items-center cursor-pointer transition-all duration-300"
                  >
                    <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-white/5 bg-slate-900">
                      <img 
                        src={art.image || fallbackImg} 
                        alt="" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        onError={(e) => { e.target.src = fallbackImg; }}
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    
                    <div className="flex-1 space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold">
                        <span className="text-primary font-black bg-primary/10 px-2 py-0.5 rounded-md">
                          {art.sourceName || 'أخبار كورة لايف'}
                        </span>
                        <span>•</span>
                        <span>{art.publishedAt ? new Date(art.publishedAt).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' }) : 'اليوم'}</span>
                      </div>
                      
                      <h4 className="text-xs font-black text-white group-hover:text-primary transition-colors leading-snug line-clamp-2">
                        {art.title}
                      </h4>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/5 bg-[#0b1424] p-8 text-center">
              <p className="text-xs text-gray-400 font-bold">لا تتوفر مقالات إخبارية حية في الوقت الحالي.</p>
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
