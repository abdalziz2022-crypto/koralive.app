import React, { useEffect, useState } from 'react';
import { useMatches } from '../context/MatchContext';
import MatchCard from '../components/MatchCard';
import NewsSection from './NewsSection';
import BreakingNews from './BreakingNews';
import { motion } from 'motion/react';
import ShareButton from './ShareButton';
import AdBanner from './AdBanner';
import { Radio, ChevronRight, Trophy, Zap, Star, Crown, Flame, Award } from 'lucide-react';
import { auth, db } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc } from 'firebase/firestore';
import { UserProfile, Match } from '../types';

export default function Home() {
  const { matches, liveMatches, loading: matchesLoading } = useMatches();
  const [user, authLoading] = useAuthState(auth);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        }
      };
      fetchProfile();
    }
  }, [user]);

  if (matchesLoading) return (
    <div className="flex items-center justify-center min-h-[60vh] text-primary">
       <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const isFavorite = (match: Match) => {
    if (!profile) return false;
    return (
      profile.favoriteLeagues.includes(match.league) ||
      profile.favoriteTeams.includes(match.homeTeam) ||
      profile.favoriteTeams.includes(match.awayTeam)
    );
  };

  const sortMatches = (matchesList: Match[]) => {
    return [...matchesList].sort((a, b) => {
      const aFav = isFavorite(a);
      const bFav = isFavorite(b);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      return 0;
    });
  };

  const [selectedLeague, setSelectedLeague] = useState<string | null>(null);

  const matchesLeague = (match: Match, leagueName: string) => {
    if (leagueName === 'دوري الأبطال') {
      return match.league === 'دوري الأبطال' || match.league === 'دوري أبطال أوروبا';
    }
    return match.league === leagueName;
  };

  const filteredLiveMatches = selectedLeague 
    ? liveMatches.filter(m => matchesLeague(m, selectedLeague)) 
    : liveMatches;

  const filteredMatchesList = selectedLeague 
    ? matches.filter(m => matchesLeague(m, selectedLeague)) 
    : matches;

  const prioritizedLiveMatches = sortMatches(filteredLiveMatches);
  const upcomingMatches = sortMatches(filteredMatchesList.filter(m => m.status === 'UPCOMING'));
  const finishedMatches = sortMatches(filteredMatchesList.filter(m => m.status === 'FINISHED'));

  return (
    <div className="max-w-7xl mx-auto px-4 pt-28 md:pt-36 pb-24 space-y-16">
      {/* Quick Jump Links */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex overflow-x-auto gap-4 pb-2 no-scrollbar"
      >
        {[
          { label: 'مباشر', id: 'live', icon: Radio },
          { label: 'أحدث الأخبار', id: 'news', icon: Star },
          { label: 'البطولات', id: 'leagues', icon: Trophy },
          { label: 'القادمة', id: 'upcoming', icon: Zap },
          { label: 'النتائج', id: 'results', icon: Trophy },
        ].map((link) => (
          <button
            key={link.id}
            onClick={() => {
              const el = document.getElementById(link.id);
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
            className="flex items-center gap-2 whitespace-nowrap bg-surface border border-border px-4 py-2 rounded-full text-xs font-bold hover:neon-border transition-all"
          >
            <link.icon size={14} className="text-primary" />
            {link.label}
          </button>
        ))}
      </motion.div>

      {/* Top Main Ad Slot */}
      <AdBanner slot="Home_Top" />

      {/* Hero: Highlighted Live Matches */}
      <section id="live" className="space-y-6 pt-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="text-red-500 animate-pulse" />
            <h2 className="text-2xl font-black uppercase tracking-tighter">مباشر الآن</h2>
          </div>
          <button className="text-xs font-bold text-primary flex items-center gap-1 hover:gap-2 transition-all">
            مشاهدة الكل <ChevronRight size={14} />
          </button>
        </div>

        {prioritizedLiveMatches.length > 0 ? (
          <div className={`grid gap-6 grid-cols-1 ${
            prioritizedLiveMatches.length === 1 
              ? 'md:max-w-md' 
              : prioritizedLiveMatches.length === 2 
                ? 'md:grid-cols-2 md:max-w-4xl' 
                : 'md:grid-cols-2 lg:grid-cols-3'
          }`}>
            {prioritizedLiveMatches.map(match => (
              <div key={match.id} className="relative">
                {isFavorite(match) && (
                  <div className="absolute -top-2 -right-2 z-10 bg-secondary text-black p-1.5 rounded-full shadow-lg border-2 border-background">
                    <Star size={12} fill="black" />
                  </div>
                )}
                <MatchCard match={match} />
              </div>
            ))}
          </div>
        ) : (
          <div className="glass p-12 rounded-3xl text-center space-y-4">
            <p className="text-gray-500 font-medium">لا توجد مباريات مباشرة حالياً</p>
            <button 
              onClick={() => {
                const el = document.getElementById('upcoming');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-surface border border-border px-6 py-2 rounded-full text-sm font-bold hover:border-primary/50 transition-all"
            >
              تصفح جدول اليوم
            </button>
          </div>
        )}
      </section>

      {/* Breaking News Section */}
      <BreakingNews />

      {/* Dynamic Share & Promote App widget */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="glass p-6 md:p-8 rounded-[32px] border border-primary/20 bg-gradient-to-r from-surface to-primary/5 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_15px_30px_rgba(0,223,130,0.05)]"
      >
        <div className="space-y-2 text-center md:text-right">
          <div className="flex items-center gap-2 justify-center md:justify-start">
            <span className="flex h-2.5 w-2.5 rounded-full bg-primary animate-pulse w-2 h-2" />
            <span className="text-xs font-black tracking-wider text-primary uppercase">كرة القدم في جيبك 📲</span>
          </div>
          <h3 className="text-xl md:text-2xl font-black text-white">هل أعجبك موقع كورة 90؟ شاركه مع عشاق الرياضة!</h3>
          <p className="text-xs md:text-sm text-gray-400 font-medium">ساعِد أصدقائك في العثور على البث المباشر المفضل والملخصات اليومية بنقرة واحدة.</p>
        </div>
        <div className="shrink-0">
          <ShareButton variant="dropdown" align="right" text="كورة 90 هو وجهتك لمتابعة مباريات كرة القدم والبث المباشر بدون إعلانات مزعجة وبجودة عالية! انضم إلينا الآن." />
        </div>
      </motion.div>

      {/* Middle Ad Slot */}
      <AdBanner slot="Home_Middle" />

      {/* News Section */}
      <section id="news" className="pt-8">
        <NewsSection />
      </section>

      {/* Featured Leagues Grid */}
      <section id="leagues" className="space-y-6 pt-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="text-secondary" />
            <h2 className="text-2xl font-black uppercase tracking-tighter">البطولات الكبرى</h2>
          </div>
          {selectedLeague && (
            <button 
              onClick={() => setSelectedLeague(null)}
              className="text-xs font-bold text-red-500 hover:text-red-400 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20 transition-all cursor-pointer"
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
              icon: Crown, 
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
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelectedLeague(isSelected ? null : league.name)}
                className={`relative p-4 rounded-2xl flex items-center justify-between cursor-pointer border transition-all duration-300 select-none overflow-hidden ${
                  isSelected 
                    ? `${league.activeColor} font-black` 
                    : 'bg-surface hover:bg-surface-hover/80 border-border dark:border-white/5 hover:border-slate-300 dark:hover:border-white/15'
                }`}
              >
                {/* Glowing background decor for premium look */}
                <div className={`absolute -left-6 -bottom-6 w-16 h-16 rounded-full filter blur-xl opacity-10 pointer-events-none transition-all duration-500 ${
                  isSelected ? 'scale-150 opacity-20 bg-current' : 'bg-slate-500/10'
                }`} />
                
                <div className="flex items-center gap-3 relative z-10">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-300 ${
                    isSelected ? 'bg-white/15 border-white/20 scale-105' : league.colorClass
                  }`}>
                    <IconComp size={20} className={`${isSelected ? 'animate-bounce' : ''}`} />
                  </div>
                  
                  <div className="flex flex-col text-right">
                    <span className="text-[10px] font-black tracking-wider uppercase opacity-60">
                      {league.badge}
                    </span>
                    <span className={`text-xs font-black transition-colors ${
                      isSelected ? 'text-current' : 'text-slate-900 dark:text-white'
                    }`}>
                      {league.name}
                    </span>
                  </div>
                </div>

                <span className="text-xl relative z-10 self-center drop-shadow-sm select-none" title={league.name}>
                  {league.emoji}
                </span>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Schedule Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Upcoming */}
        <section id="upcoming" className="space-y-6 pt-8">
          <div className="flex items-center gap-2">
            <Zap className="text-primary fill-primary/20" />
            <h2 className="text-xl font-bold uppercase tracking-tight">المباريات القادمة</h2>
          </div>
          <div className="space-y-4">
            {upcomingMatches.slice(0, 4).map(match => (
              <div key={match.id} className="relative">
                {isFavorite(match) && (
                  <div className="absolute -top-2 -right-2 z-10 bg-secondary text-black p-1.5 rounded-full shadow-lg border-2 border-background">
                    <Star size={12} fill="black" />
                  </div>
                )}
                <MatchCard match={match} />
              </div>
            ))}
          </div>
        </section>

        {/* Recent Results */}
        <section id="results" className="space-y-6 pt-8">
          <div className="flex items-center gap-2 text-gray-500">
            <Trophy size={20} />
            <h2 className="text-xl font-bold uppercase tracking-tight">آخر النتائج</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 opacity-75">
            {finishedMatches.slice(0, 4).map(match => (
              <div key={match.id} className="relative">
                {isFavorite(match) && (
                  <div className="absolute -top-2 -right-2 z-10 bg-secondary text-black p-1.5 rounded-full shadow-lg border-2 border-background">
                    <Star size={12} fill="black" />
                  </div>
                )}
                <MatchCard match={match} />
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Bottom Ad Slot */}
      <div className="pt-8">
        <AdBanner slot="Home_Bottom" />
      </div>
    </div>
  );
}
