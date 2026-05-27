import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Timer, Radio, Tv, Activity, Crosshair, ChevronLeft, Star, Bell, BellOff } from 'lucide-react';
import { motion } from 'motion/react';
import { Match } from '../types';
import { cn, formatTime } from '../lib/utils';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { useError } from '../context/ErrorContext';

interface MatchCardProps {
  match: Match;
  key?: string;
}

interface TeamLogoWithGlowProps {
  logoUrl: string;
  teamName: string;
  isLive?: boolean;
}

function TeamLogoWithGlow({ logoUrl, teamName, isLive }: TeamLogoWithGlowProps) {
  return (
    <div className="relative flex items-center justify-center w-12 h-12 md:w-16 md:h-16 group/logo select-none">
      {/* Glow shadow matching original logo colors */}
      <motion.img
        src={logoUrl}
        alt=""
        animate={isLive ? {
          scale: [0.95, 1.2, 0.95],
          opacity: [0.35, 0.7, 0.35]
        } : {}}
        transition={isLive ? {
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        } : {}}
        className="absolute w-12 h-12 md:w-14 md:h-14 object-contain filter blur-xl opacity-40 select-none pointer-events-none transition-all duration-700 ease-out scale-95 group-hover/logo:scale-120 group-hover/logo:opacity-60"
        aria-hidden="true"
        referrerPolicy="no-referrer"
      />
      {/* Front sharp logo */}
      <motion.img
        src={logoUrl}
        alt={teamName}
        animate={isLive ? {
          scale: [1, 1.05, 1]
        } : {}}
        transition={isLive ? {
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        } : {}}
        className="relative w-12 h-12 md:w-16 md:h-16 object-contain z-10 transition-transform duration-500 ease-out group-hover:scale-105 filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.15)]"
        referrerPolicy="no-referrer"
      />

      {/* Tooltip on hover */}
      <div className="absolute top-full mt-2.5 left-1/2 -translate-x-1/2 pointer-events-none z-30 invisible opacity-0 scale-95 -translate-y-2 group-hover/logo:visible group-hover/logo:opacity-100 group-hover/logo:scale-100 group-hover/logo:translate-y-0 transition-all duration-300 ease-out">
        <div className="relative bg-surface/95 backdrop-blur-md border border-border text-[color:var(--color-text)] text-[11px] font-black px-3 py-1.5 rounded-xl shadow-2xl whitespace-nowrap flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          <span>{teamName}</span>
        </div>
        {/* Tooltip Arrow pointing UP */}
        <div className="w-2.5 h-2.5 bg-surface border-t border-l border-border absolute -top-1 left-1/2 -translate-x-1/2 rotate-45" />
      </div>
    </div>
  );
}

export default function MatchCard({ match }: MatchCardProps) {
  const isLive = match.status === 'LIVE';
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const [favoriteLeagues, setFavoriteLeagues] = React.useState<string[]>([]);
  const [notifiedMatches, setNotifiedMatches] = React.useState<string[]>([]);
  const { showToast, showError } = useError();

  React.useEffect(() => {
    if (!user) {
      setFavoriteLeagues([]);
      setNotifiedMatches([]);
      return;
    }
    const docRef = doc(db, 'users', user.uid);
    const unsub = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setFavoriteLeagues(data.favoriteLeagues || []);
        setNotifiedMatches(data.notifiedMatches || []);
      }
    }, (error) => {
      console.error("Snapshot error in MatchCard:", error);
    });
    return () => unsub();
  }, [user]);

  const isFav = favoriteLeagues.includes(match.league);
  const isNotified = notifiedMatches.includes(match.id);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      showToast('يرجى تسجيل الدخول أولاً لإضافة الدوري للمفضلة ⭐', 'warning');
      return;
    }

    const newList = isFav 
      ? favoriteLeagues.filter(l => l !== match.league)
      : [...favoriteLeagues, match.league];

    try {
      const docRef = doc(db, 'users', user.uid);
      await updateDoc(docRef, { favoriteLeagues: newList });
      showToast(isFav ? 'تمت إزالة الدوري من المفضلة 🗑️' : 'تمت إضافة الدوري للمفضلة ⭐', 'success');
    } catch (err) {
      showError(err);
    }
  };

  const handleToggleNotification = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      showToast('يرجى تسجيل الدخول أولاً لتفعيل إشعارات المباراة 🔔', 'warning');
      return;
    }

    const newList = isNotified 
      ? notifiedMatches.filter(id => id !== match.id)
      : [...notifiedMatches, match.id];

    try {
      const docRef = doc(db, 'users', user.uid);
      await updateDoc(docRef, { notifiedMatches: newList });
      showToast(isNotified ? 'تم إلغاء تفعيل إشعارات المباراة 🔕' : 'تم تفعيل إشعارات المباراة بنجاح! 🔔⚽', 'success');
    } catch (err) {
      showError(err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.015 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="group relative overflow-hidden rounded-2xl bg-gradient-to-b from-surface to-background border border-border hover:border-primary/80 transition-all duration-300 p-4 shadow-md hover:shadow-xl hover:shadow-primary/5"
    >
      <Link to={`/match/${match.id}`} className="block">
        {/* Header: League & Status */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <img src={match.leagueLogo || undefined} alt="league" className="w-5 h-5 rounded-full border border-white/10" referrerPolicy="no-referrer" />
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
              {match.league}
            </span>
            {/* Action Buttons: Favorite Star & Notifications Bell */}
            <div className="flex items-center gap-1">
              <motion.button
                type="button"
                onClick={handleToggleFavorite}
                whileHover={{ scale: 1.25, rotate: 15 }}
                whileTap={{ scale: 0.85, rotate: -15 }}
                className={cn(
                  "p-1.5 rounded-full transition-all duration-300 outline-none z-20 relative cursor-pointer flex items-center justify-center",
                  isFav 
                    ? "text-yellow-400 bg-yellow-400/10 hover:bg-yellow-400/20 shadow-sm shadow-yellow-400/20" 
                    : "text-gray-500 hover:text-gray-300 bg-white/5 hover:bg-white/10"
                )}
                title={isFav ? "إزالة الدوري من المفضلة" : "إضافة الدوري للمفضلة"}
              >
                <motion.div
                  initial={false}
                  animate={{ scale: isFav ? [1, 1.4, 1] : 1 }}
                  transition={{ type: "spring", stiffness: 450, damping: 15 }}
                >
                  <Star size={11} fill={isFav ? "currentColor" : "none"} className="transition-all duration-300" />
                </motion.div>
              </motion.button>

              <motion.button
                type="button"
                onClick={handleToggleNotification}
                whileHover={{ scale: 1.25, y: -1 }}
                whileTap={{ scale: 0.85 }}
                className={cn(
                  "p-1.5 rounded-full transition-all duration-300 outline-none z-20 relative cursor-pointer flex items-center justify-center",
                  isNotified 
                    ? "text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20 shadow-sm shadow-emerald-400/20" 
                    : "text-gray-500 hover:text-gray-300 bg-white/5 hover:bg-white/10"
                )}
                title={isNotified ? "إلغاء إشعارات المباراة" : "تفعيل إشعارات المباراة"}
              >
                <motion.div
                  initial={false}
                  animate={isNotified ? {
                    rotate: [0, -15, 15, -15, 15, 0],
                    scale: [1, 1.15, 1.15, 1]
                  } : {}}
                  transition={{ duration: 0.8 }}
                >
                  <Bell size={11} fill={isNotified ? "currentColor" : "none"} className="transition-all duration-300" />
                </motion.div>
              </motion.button>
            </div>
          </div>
          {isLive ? (
            <div className="flex items-center gap-1.5 bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full border border-red-500/20">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold">بث مباشر</span>
            </div>
          ) : match.status === 'FINISHED' ? (
            <span className="text-[10px] font-bold text-gray-500 bg-gray-500/10 px-2 py-0.5 rounded-full border border-gray-500/10">منتهية</span>
          ) : (
            <div className="flex items-center gap-1 text-gray-400 bg-gray-400/10 px-2 py-0.5 rounded-full border border-gray-400/10">
              <Timer size={10} />
              <span className="text-[10px] font-bold">{formatTime(match.startTime)}</span>
            </div>
          )}
        </div>

        {/* Teams & Score */}
        <div className="flex items-center justify-around gap-4 mb-4">
          <div 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate(`/team/${encodeURIComponent(match.homeTeam)}`);
            }}
            className="flex flex-col items-center gap-2 flex-1 cursor-pointer group/team text-center hover:scale-105 transition-all duration-300 relative z-25"
          >
            <TeamLogoWithGlow 
              logoUrl={match.homeLogo || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(match.homeTeam)}`} 
              teamName={match.homeTeam} 
              isLive={isLive}
            />
            <span className="text-xs md:text-sm font-bold text-center leading-tight group-hover/team:text-primary transition-colors">{match.homeTeam}</span>
          </div>

          <div className="flex flex-col items-center justify-center gap-1">
            <div className="text-2xl md:text-4xl font-black tabular-nums tracking-tighter">
              {match.status === 'UPCOMING' ? 'VS' : `${String(match.homeScore).padStart(1, '0')} - ${String(match.awayScore).padStart(1, '0')}`}
            </div>
            {isLive && (
              <span className="text-[10px] font-mono text-primary animate-pulse">
                '{match.minute}
              </span>
            )}
          </div>

          <div 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate(`/team/${encodeURIComponent(match.awayTeam)}`);
            }}
            className="flex flex-col items-center gap-2 flex-1 cursor-pointer group/team text-center hover:scale-105 transition-all duration-300 relative z-25"
          >
            <TeamLogoWithGlow 
              logoUrl={match.awayLogo || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(match.awayTeam)}`} 
              teamName={match.awayTeam} 
              isLive={isLive}
            />
            <span className="text-xs md:text-sm font-bold text-center leading-tight group-hover/team:text-primary transition-colors">{match.awayTeam}</span>
          </div>
        </div>

        {/* Live Stats Quick View */}
        {isLive && match.stats && match.stats.possession && match.stats.shotsOnTarget && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-4 space-y-3 py-3.5 border-t border-b border-border bg-background/50 rounded-xl px-4"
          >
            {/* Possession */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-gray-400">
                <span className="text-primary">{match.stats.possession.home || 0}%</span>
                <span className="flex items-center gap-1 uppercase tracking-wider text-[8px] text-slate-400 dark:text-gray-500">
                  <Activity size={10} className="text-secondary" /> الاستحواذ
                </span>
                <span className="text-[color:var(--color-text)]">{match.stats.possession.away || 0}%</span>
              </div>
              <div className="w-full h-1.5 bg-surface rounded-full flex overflow-hidden border border-border/20">
                <div className="bg-primary transition-all duration-500" style={{ width: `${match.stats.possession.home || 0}%` }} />
                <div className="bg-slate-300 dark:bg-white/20 transition-all duration-500" style={{ width: `${match.stats.possession.away || 0}%` }} />
              </div>
            </div>

            {/* Shots on Target */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-gray-400">
                <span className="text-primary">{match.stats.shotsOnTarget.home || 0}</span>
                <span className="flex items-center gap-1 uppercase tracking-wider text-[8px] text-slate-400 dark:text-gray-500">
                  <Crosshair size={10} className="text-secondary" /> على المرمى
                </span>
                <span className="text-[color:var(--color-text)]">{match.stats.shotsOnTarget.away || 0}</span>
              </div>
              <div className="w-full h-1.5 bg-surface rounded-full flex overflow-hidden border border-border/20">
                <div 
                  className="bg-primary transition-all duration-500" 
                  style={{ width: `${((match.stats.shotsOnTarget.home || 0) / (((match.stats.shotsOnTarget.home || 0) + (match.stats.shotsOnTarget.away || 0)) || 1)) * 100}%` }} 
                />
                <div 
                  className="bg-slate-300 dark:bg-white/20 transition-all duration-500" 
                  style={{ width: `${((match.stats.shotsOnTarget.away || 0) / (((match.stats.shotsOnTarget.home || 0) + (match.stats.shotsOnTarget.away || 0)) || 1)) * 100}%` }} 
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Footer: Details */}
        <div className="flex flex-col gap-2 border-t border-border pt-4 mt-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-gray-400">
                <Tv size={12} className="text-secondary" />
                <span className="text-[10px] font-bold">{match.channel || 'بي إن سبورت'}</span>
              </div>
              {match.commentator && (
                <div className="flex items-center gap-1.5 text-gray-400">
                  <Radio size={12} className="text-secondary" />
                  <span className="text-[10px] font-bold">{match.commentator}</span>
                </div>
              )}
            </div>

            {/* Subtle Hover Action */}
            <div className="opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 flex items-center gap-1 text-primary">
              <span className="text-[10px] font-bold whitespace-nowrap">التفاصيل</span>
              <ChevronLeft size={16} />
            </div>
          </div>
        </div>

        {/* Hover Overlay */}
        <div className="absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-primary to-secondary transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-b-2xl" />
      </Link>
    </motion.div>
  );
}
