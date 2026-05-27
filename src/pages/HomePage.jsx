import React, { useState, useMemo } from 'react';
import { useMatches } from '../context/MatchContext';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Radio, 
  CalendarDays, 
  CheckCircle2, 
  Trophy, 
  AlertTriangle, 
  RefreshCw, 
  Search, 
  Flame, 
  Award, 
  Star,
  Zap,
  ChevronLeft,
  Tv,
  Users,
  Bell,
  Sparkles,
  Bookmark,
  Share2
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Components
import HomeHeader from '../components/home/HomeHeader';
import SectionTitle from '../components/home/SectionTitle';
import HorizontalLeagueList from '../components/home/HorizontalLeagueList';
import LeagueSection from '../components/home/LeagueSection';
import MatchCard from '../components/MatchCard';
import BreakingNews from '../components/BreakingNews';
import ShareButton from '../components/ShareButton';
import AdBanner from '../components/AdBanner';

export default function HomePage() {
  const { matches, leagues, loading: matchesLoading, liveMatches } = useMatches();
  const [user] = useAuthState(auth);
  const [selectedLeague, setSelectedLeague] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [profile, setProfile] = useState(null);

  React.useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setProfile(docSnap.data());
          }
        } catch (e) {
          console.error("Error reading profile:", e);
        }
      };
      fetchProfile();
    } else {
      setProfile(null);
    }
  }, [user]);

  const isFavorite = (match) => {
    if (!profile) return false;
    const favoriteLeagues = profile.favoriteLeagues || [];
    const favoriteTeams = profile.favoriteTeams || [];
    return (
      favoriteLeagues.includes(match.league) ||
      favoriteTeams.includes(match.homeTeam) ||
      favoriteTeams.includes(match.awayTeam)
    );
  };

  const sortMatches = (matchesList) => {
    return [...matchesList].sort((a, b) => {
      const aFav = isFavorite(a);
      const bFav = isFavorite(b);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      return 0;
    });
  };

  const filteredMatches = useMemo(() => {
    let result = matches || [];
    
    if (selectedLeague) {
      if (selectedLeague === 'دوري الأبطال') {
        result = result.filter(m => m.league === 'دوري الأبطال' || m.league === 'دوري أبطال أوروبا');
      } else {
        result = result.filter(m => m.league === selectedLeague);
      }
    }

    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = result.filter(m => 
        m.homeTeam.toLowerCase().includes(query) ||
        m.awayTeam.toLowerCase().includes(query) ||
        m.league.toLowerCase().includes(query) ||
        (m.commentator && m.commentator.toLowerCase().includes(query))
      );
    }

    return result;
  }, [matches, selectedLeague, searchQuery]);

  const liveMatchesList = useMemo(() => {
    const list = filteredMatches.filter(m => m.status === 'LIVE');
    return sortMatches(list);
  }, [filteredMatches, profile]);

  const todayMatchesList = useMemo(() => {
    const list = filteredMatches.filter(m => m.status === 'UPCOMING' || m.status === 'LIVE');
    return sortMatches(list);
  }, [filteredMatches, profile]);

  const finishedMatchesList = useMemo(() => {
    const list = filteredMatches.filter(m => m.status === 'FINISHED');
    return sortMatches(list);
  }, [filteredMatches, profile]);

  const groupMatchesByCompetition = (matchesList) => {
    return matchesList.reduce((acc, m) => {
      const found = acc.find(item => item.leagueName === m.league);
      if (found) {
        found.matches.push(m);
      } else {
        acc.push({
          leagueName: m.league,
          leagueLogo: m.leagueLogo,
          matches: [m]
        });
      }
      return acc;
    }, []);
  };

  const groupedTodayLeagues = useMemo(() => {
    return groupMatchesByCompetition(todayMatchesList);
  }, [todayMatchesList]);

  const groupedFinishedLeagues = useMemo(() => {
    return groupMatchesByCompetition(finishedMatchesList);
  }, [finishedMatchesList]);

  // Premium Hot/Live Hero Matches (Top Slider Feature)
  const heroMatches = useMemo(() => {
    if (liveMatchesList.length > 0) return liveMatchesList.slice(0, 3);
    return todayMatchesList.slice(0, 3);
  }, [liveMatchesList, todayMatchesList]);

  if (matchesLoading) {
    return (
      <div className="min-h-screen bg-background text-[color:var(--color-text)] pb-24" style={{ direction: 'rtl' }}>
        <HomeHeader />
        <div className="max-w-7xl mx-auto px-4 pt-6 space-y-10 animate-pulse">
          {/* Slider Skeleton */}
          <div className="h-56 bg-surface/50 rounded-[28px] border border-border/40" />
          
          {/* Quick Filter Skeleton */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 bg-surface/40 rounded-2xl border border-border/30" />
            ))}
          </div>

          {/* Matches skeleton */}
          <div className="space-y-4">
            <div className="h-6 w-40 bg-surface/80 rounded-md" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-44 bg-surface/30 rounded-2xl border border-border/30" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const hasError = !matches || matches.length === 0;

  return (
    <div className="min-h-screen bg-background text-[color:var(--color-text)] transition-colors duration-300 pb-28 md:pb-12 selection:bg-primary/30 selection:text-primary">
      {/* Sticky top bar Header */}
      <HomeHeader />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 pt-4 md:pt-6 space-y-8">
        
        {/* PHASE 4: Hero Live Match Slider (Premium Sports Theme) */}
        {heroMatches.length > 0 && (
          <section className="relative overflow-hidden rounded-[28px] border border-primary/20 bg-gradient-to-br from-surface via-surface to-primary/5 p-6 md:p-8 shadow-2xl" style={{ direction: 'rtl' }}>
            <div className="absolute top-0 left-0 lg:left-6 lg:top-6 flex items-center gap-1.5 bg-red-500 text-white text-[10px] font-black px-3 py-1.5 rounded-full select-none shadow animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-white inline-block"></span>
              <span>مباريات القمة الآن</span>
            </div>

            <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10 pt-4 lg:pt-0">
              {/* Event Details and Live Status */}
              <div className="text-right space-y-4 max-w-lg lg:order-1 order-2">
                <div className="flex items-center gap-2">
                  <span className="bg-primary/10 text-primary border border-primary/20 text-[10px] font-black tracking-wider uppercase px-2.5 py-1 rounded-md">
                    {heroMatches[0].league} 🏆
                  </span>
                  <span className="text-xs text-slate-400 font-bold flex items-center gap-1">
                    <Tv size={13} className="text-primary" />
                    {heroMatches[0].channel || 'قناة SSC الرياضية HD'}
                  </span>
                </div>

                <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">
                  كلاسيكو الأحلام الحاسم والترشيحات الرياضية الحية التفاعلية
                </h2>
                <p className="text-xs text-slate-400 font-bold leading-normal">
                  تابع استوديو البث الحصري والتحليل التفاعلي مع أقوى سيرفرات البث المتنوعة لتفادي التقطيع في المباريات الكبيرة المصيرية.
                </p>

                <div className="flex flex-wrap gap-3 pt-2">
                  <Link 
                    to={`/match/${heroMatches[0].id}`}
                    className="flex items-center gap-2 bg-primary text-black hover:bg-primary/90 px-6 py-3 rounded-full text-xs font-black transition-all shadow-lg active:scale-95 cursor-pointer"
                  >
                    <Zap size={14} className="fill-current" />
                    <span>شاهد البث المباشر فوراً</span>
                  </Link>
                  <button 
                    onClick={() => {
                      const shareText = `شاهد مباراة ${heroMatches[0].homeTeam} ضد ${heroMatches[0].awayTeam} الآن بث مباشر وبدون تقطيع على كورة 90!`;
                      if (navigator.share) {
                        navigator.share({ text: shareText, url: window.location.href });
                      }
                    }}
                    className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-white border border-border px-5 py-3 rounded-full text-xs font-bold transition-all"
                  >
                    <Share2 size={13} />
                    <span>مشاركة البث</span>
                  </button>
                </div>
              </div>

              {/* Live Match Mini-Scoreboard */}
              <div className="lg:order-2 order-1 w-full lg:w-96 bg-black/45 backdrop-blur-xl border border-white/5 rounded-2xl p-5 shadow-inner">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col items-center space-y-2">
                    <img 
                      src={heroMatches[0].homeLogo} 
                      alt={heroMatches[0].homeTeam} 
                      className="w-12 h-12 object-contain filter drop-shadow" 
                      referrerPolicy="no-referrer"
                    />
                    <span className="text-xs font-black text-white text-center truncate w-24">
                      {heroMatches[0].homeTeam}
                    </span>
                  </div>

                  <div className="flex flex-col items-center">
                    {heroMatches[0].status === 'LIVE' ? (
                      <>
                        <div className="text-3xl font-black text-primary tracking-widest font-mono">
                          {heroMatches[0].homeScore} : {heroMatches[0].awayScore}
                        </div>
                        <span className="text-[10px] bg-red-500/10 text-red-500 border border-red-500/20 px-2.5 py-0.5 rounded mt-2 font-bold animate-pulse">
                          الدقيقة {heroMatches[0].minute || '75'}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-xs text-slate-400 font-bold mb-1">تبدأ قريباً</span>
                        <div className="text-base font-black bg-surface px-3 py-1 rounded-md text-primary tracking-wide">
                          {heroMatches[0].startTime ? new Date(heroMatches[0].startTime).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) : '20:45'}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex flex-col items-center space-y-2">
                    <img 
                      src={heroMatches[0].awayLogo} 
                      alt={heroMatches[0].awayTeam} 
                      className="w-12 h-12 object-contain filter drop-shadow" 
                      referrerPolicy="no-referrer"
                    />
                    <span className="text-xs font-black text-white text-center truncate w-24">
                      {heroMatches[0].awayTeam}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Dynamic Horizontal League Selector List */}
        <HorizontalLeagueList 
          leagues={leagues} 
          selectedLeague={selectedLeague} 
          onSelect={setSelectedLeague} 
        />

        {/* PHASE 7 — Native Monetization Placement (Sleek Banner beneath Hero Slider) */}
        {!profile?.isVIP && (
          <div className="select-none">
            <AdBanner slot="Home_Top" />
          </div>
        )}

        {/* Featured Leagues Smart Filters */}
        <section className="space-y-4 select-none" style={{ direction: 'rtl' }}>
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5 text-xs font-black text-slate-400 dark:text-gray-400 tracking-wider">
              <Trophy size={14} className="text-primary animate-pulse" />
              <span>البطولات الكبرى (تصفية حية فائقة)</span>
            </div>
            {selectedLeague && (
              <button 
                onClick={() => setSelectedLeague(null)}
                className="text-[10px] font-black text-rose-500 dark:text-red-400 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20 hover:bg-rose-500/20 transition-all cursor-pointer duration-300"
              >
                إلغاء التصفية (عرض الكل)
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { 
                name: 'الدوري الإسباني', 
                emoji: '🇪🇸', 
                badge: 'لا ليغا',
                icon: Trophy, 
                colorClass: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
                activeColor: 'shadow-[0_4px_20px_rgba(245,158,11,0.25)] border-amber-400 bg-amber-500/10 dark:bg-amber-500/15 text-amber-500 dark:text-amber-400'
              },
              { 
                name: 'الدوري السعودي', 
                emoji: '🇸🇦', 
                badge: 'روشن للمحترفين',
                icon: Flame, 
                colorClass: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
                activeColor: 'shadow-[0_4px_20px_rgba(16,185,129,0.25)] border-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-500 dark:text-emerald-400'
              },
              { 
                name: 'الدوري الإنجليزي', 
                emoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 
                badge: 'بريميرليغ',
                icon: Award, 
                colorClass: 'text-violet-500 bg-violet-500/10 border-violet-500/20',
                activeColor: 'shadow-[0_4px_20px_rgba(139,92,246,0.25)] border-violet-400 bg-violet-400/10 dark:bg-violet-400/15 text-violet-500 dark:text-violet-400'
              },
              { 
                name: 'دوري الأبطال', 
                emoji: '🇪🇺', 
                badge: 'ذات الأذنين',
                icon: Star, 
                colorClass: 'text-sky-500 bg-sky-500/10 border-sky-500/20',
                activeColor: 'shadow-[0_4px_20px_rgba(14,165,233,0.25)] border-sky-400 bg-sky-500/10 dark:bg-sky-500/15 text-sky-500 dark:text-sky-400'
              }
            ].map((league) => {
              const isSelected = selectedLeague === league.name || (league.name === 'دوري الأبطال' && selectedLeague === 'دوري أبطال أوروبا');
              const IconComp = league.icon;
              return (
                <motion.div 
                  key={league.name} 
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedLeague(isSelected ? null : league.name)}
                  className={`relative p-4 rounded-2xl flex items-center justify-between cursor-pointer border transition-all duration-300 overflow-hidden ${
                    isSelected 
                      ? `${league.activeColor} font-black` 
                      : 'bg-surface hover:bg-surface-hover/80 border-border'
                  }`}
                >
                  <div className="flex items-center gap-3 relative z-10">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-300 ${
                      isSelected ? 'bg-white/15 border-white/20 scale-105' : league.colorClass
                    }`}>
                      <IconComp size={20} />
                    </div>
                    
                    <div className="flex flex-col text-right">
                      <span className="text-[10px] font-bold uppercase opacity-60">
                        {league.badge}
                      </span>
                      <span className={`text-xs font-black transition-colors ${
                        isSelected ? 'text-current' : 'text-slate-900 dark:text-white'
                      }`}>
                        {league.name}
                      </span>
                    </div>
                  </div>

                  <span className="text-xl relative z-10 drop-shadow-sm select-none">
                    {league.emoji}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Search bar Component */}
        <div className="relative w-full select-none">
          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-primary">
            <Search size={16} />
          </div>
          <input
            id="search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن مباراة، معلق، بطولة، أو فريق..."
            className="w-full text-right outline-none bg-surface/45 hover:bg-surface/70 focus:bg-surface border border-border focus:border-primary rounded-2xl py-3.5 pr-11 pr-11 pl-4 text-xs font-bold transition-all duration-300 placeholder:text-gray-500 shadow-sm"
            style={{ direction: 'rtl' }}
          />
        </div>

        {/* Breaking News layout */}
        <BreakingNews />

        {/* Error / Empty state check */}
        {hasError ? (
          <div className="glass p-12 rounded-[32px] text-center space-y-4 max-w-sm mx-auto my-12" style={{ direction: 'rtl' }}>
            <AlertTriangle className="text-red-500 mx-auto w-12 h-12 animate-bounce" />
            <h3 className="text-lg font-black text-white">عذراً، حدث خطأ أثناء المبانزة</h3>
            <p className="text-xs text-gray-400 font-bold leading-normal">
              لم نتمكن من جلب بيانات المباريات المباشرة واليومية من الخادم حالياً. يرجى إعادة المحاولة.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="mx-auto flex items-center gap-2 bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary px-6 py-2.5 rounded-full text-xs font-black cursor-pointer transition-all"
            >
              <RefreshCw size={14} />
              <span>تحديث البيانات الآن</span>
            </button>
          </div>
        ) : (
          <div className="space-y-12">
            
            {/* Live Matches section */}
            <section id="live-matches" className="space-y-5" style={{ direction: 'rtl' }}>
              <SectionTitle 
                title="مباريات تبث مباشر الآن" 
                icon={Radio} 
                badge={liveMatchesList.length} 
                subtitle="تغطية وتحليلات حية لحظة بلحظة" 
              />

              {liveMatchesList.length > 0 ? (
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {liveMatchesList.map(match => (
                    <div key={match.id} className="relative">
                      {isFavorite(match) && (
                        <div className="absolute -top-1.5 -right-1.5 z-10 bg-yellow-400 text-black p-1 rounded-full shadow-lg border border-background">
                          <Star size={11} className="fill-current" />
                        </div>
                      )}
                      <MatchCard match={match} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="glass p-10 rounded-[32px] text-center border border-white/5 space-y-3">
                  <p className="text-gray-400 font-bold text-xs">لا تتوفر مباريات مباشرة جارية حالياً.</p>
                  <button 
                    onClick={() => {
                      const el = document.getElementById('today-matches');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-5 py-2 rounded-full text-xs font-black transition-all"
                  >
                    عرض مباريات اليوم المجدولة
                  </button>
                </div>
              )}
            </section>

            {/* PHASE 7 — Native In-Between Matches Feed Ad */}
            {!profile?.isVIP && (
              <div className="select-none py-2 my-2 rounded-[24px] overflow-hidden">
                <AdBanner slot="News_Detail_Sidebar" />
              </div>
            )}

            {/* Today's schedule section */}
            <section id="today-matches" className="space-y-5" style={{ direction: 'rtl' }}>
              <SectionTitle 
                title="جدول مواعيد مباريات اليوم" 
                icon={CalendarDays} 
                badge={todayMatchesList.length} 
                subtitle="قنوات البث المباشر المحدثة والترتيب" 
              />

              {groupedTodayLeagues.length > 0 ? (
                <div className="space-y-8">
                  {groupedTodayLeagues.map(group => (
                    <LeagueSection 
                      key={group.leagueName}
                      leagueName={group.leagueName}
                      leagueLogo={group.leagueLogo}
                      matches={group.matches}
                    />
                  ))}
                </div>
              ) : (
                <div className="glass p-12 rounded-[32px] text-center border border-white/5">
                  <p className="text-gray-400 font-bold text-xs">لا توجد مباريات مجدولة لليوم في بطولة {selectedLeague || 'الجميع'}.</p>
                </div>
              )}
            </section>

            {/* Finished matches results section */}
            <section id="finished-matches" className="space-y-5" style={{ direction: 'rtl' }}>
              <SectionTitle 
                title="المباريات والنتائج الأخيرة" 
                icon={CheckCircle2} 
                badge={finishedMatchesList.length} 
                subtitle="ملخصات الأهداف وتفاصيل الإحصاءات" 
              />

              {groupedFinishedLeagues.length > 0 ? (
                <div className="space-y-8">
                  {groupedFinishedLeagues.map(group => (
                    <LeagueSection 
                      key={`finished-${group.leagueName}`}
                      leagueName={group.leagueName}
                      leagueLogo={group.leagueLogo}
                      matches={group.matches}
                    />
                  ))}
                </div>
              ) : (
                <div className="glass p-12 rounded-[32px] text-center border border-white/5">
                  <p className="text-gray-400 font-bold text-xs">لا تتوفر نتائج لقاءات سابقة لليوم.</p>
                </div>
              )}
            </section>

            {/* Promote Share Widget Box */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass p-6 md:p-8 rounded-[32px] border border-primary/20 bg-gradient-to-r from-surface to-primary/5 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_15px_30px_rgba(0,223,130,0.05)]"
              style={{ direction: 'rtl' }}
            >
              <div className="space-y-2 text-right">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-[10px] font-black tracking-wider text-primary uppercase">تطبيق المشجعين الأول كورة 90 ⚽</span>
                </div>
                <h3 className="text-lg md:text-xl font-black text-white">تابع أحداث فريقك المفضل أينما كنت!</h3>
                <p className="text-xs text-gray-400 font-bold">ملخصات الأهداف الفورية، جداول المباريات الحية، والتحليلات المتكاملة بنقرة واحدة.</p>
              </div>
              <div className="shrink-0">
                <ShareButton variant="dropdown" text="كورة 90 هو دليلك الفائق لمتابعة المباريات الحية بدون تقطيع والتحليل الذكي! شاركه مع رفاقك الآن." />
              </div>
            </motion.div>

          </div>
        )}
      </main>
    </div>
  );
}
