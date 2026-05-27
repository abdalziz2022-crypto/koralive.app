import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { Match } from '../types';
import { 
  Trophy, 
  Clock, 
  Tv, 
  MapPin, 
  User, 
  ExternalLink, 
  ChevronDown, 
  CalendarPlus, 
  Volume2, 
  PlayCircle 
} from 'lucide-react';
import { downloadICS } from '../lib/calendar';
import ShareButton from './ShareButton';

interface MatchQuickViewCardProps {
  match: Match;
  idx: number;
}

export default function MatchQuickViewCard({ match, idx }: MatchQuickViewCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Determine active state - expand either on hover (desktop) or explicit click
  const activeExpanded = isExpanded || isHovered;

  const handleCardClick = (e: React.MouseEvent) => {
    // If user clicked inside an interactive element, don't toggle expansion
    const target = e.target as HTMLElement;
    if (target.closest('.interactive-action')) {
      return;
    }
    setIsExpanded(!isExpanded);
  };

  // Format start time
  const matchTimeString = React.useMemo(() => {
    try {
      const d = new Date(match.startTime);
      if (isNaN(d.getTime())) return '--:--';
      return d.toLocaleTimeString('ar-EG', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return '--:--';
    }
  }, [match.startTime]);

  const matchDateString = React.useMemo(() => {
    try {
      const d = new Date(match.startTime);
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleDateString('ar-EG', { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return '—';
    }
  }, [match.startTime]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: idx * 0.05 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
      className={`glass rounded-3xl border transition-all duration-300 relative cursor-pointer select-none overflow-hidden ${
        activeExpanded 
          ? 'border-primary/50 bg-gradient-to-b from-surface to-surface-hover/80 shadow-[0_12px_30px_rgba(0,0,0,0.5)] scale-[1.01]' 
          : 'border-border/50 hover:border-primary/30 hover:bg-surface-hover/50 hover:scale-[1.005]'
      }`}
    >
      {/* Live top strip */}
      {match.status === 'LIVE' && (
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-red-500 animate-pulse" />
      )}

      {/* Condensed Row Layout */}
      <div className="p-4 md:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 md:gap-6 relative">
        {/* Left Indicator/League Mini-Badging */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <img 
            src={match.leagueLogo || undefined} 
            className="w-6 h-6 object-contain" 
            alt={match.league} 
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div className="flex flex-col">
            <span className="text-[10px] font-black tracking-wide text-gray-500 line-clamp-1">{match.league}</span>
            <span className="text-[8px] font-bold text-gray-600 sm:hidden">{matchDateString}</span>
          </div>
        </div>

        {/* Home Team */}
        <div className="flex-1 flex items-center justify-end gap-3 text-right max-w-[240px] w-full">
          <span className="text-sm md:text-base font-black truncate group-hover:text-primary transition-colors text-white">
            {match.homeTeam}
          </span>
          <div className="w-10 h-10 shrink-0 rounded-full bg-white/5 border border-white/10 p-1 flex items-center justify-center shadow-inner">
            <img 
              src={match.homeLogo || undefined} 
              className="w-full h-full object-contain" 
              alt={match.homeTeam} 
              onError={(e) => {
                // Return generic placeholder icon instead of throwing error
                (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="gray" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>';
              }}
            />
          </div>
        </div>

        {/* Central Score/Time Details */}
        <div className="flex flex-col items-center gap-1 min-w-[120px] shrink-0">
          <div className="bg-black/60 border border-white/10 px-4 py-1.5 rounded-2xl flex items-center gap-3 font-black text-lg shadow-inner">
            {match.status === 'UPCOMING' ? (
              <span className="text-primary text-xs font-mono">{matchTimeString}</span>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-white text-base md:text-lg">{match.homeScore}</span>
                <span className="text-primary animate-pulse text-base">:</span>
                <span className="text-white text-base md:text-lg">{match.awayScore}</span>
              </div>
            )}
          </div>

          {match.status === 'LIVE' ? (
            <div className="flex items-center gap-1.5 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
              <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
              <span className="text-[9px] text-red-400 font-extrabold">مباشر {match.minute}'</span>
            </div>
          ) : match.status === 'FINISHED' ? (
            <span className="text-[9px] text-gray-400 font-black tracking-wider uppercase bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
              انتهت
            </span>
          ) : (
            <span className="text-[9px] text-primary/80 font-black tracking-widest uppercase bg-primary/5 px-2 py-0.5 rounded-md border border-primary/10">
              قادمة
            </span>
          )}
        </div>

        {/* Away Team */}
        <div className="flex-1 flex items-center gap-3 text-left max-w-[240px] w-full">
          <div className="w-10 h-10 shrink-0 rounded-full bg-white/5 border border-white/10 p-1 flex items-center justify-center shadow-inner">
            <img 
              src={match.awayLogo || undefined} 
              className="w-full h-full object-contain" 
              alt={match.awayTeam} 
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="gray" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>';
              }}
            />
          </div>
          <span className="text-sm md:text-base font-black truncate group-hover:text-primary transition-colors text-white">
            {match.awayTeam}
          </span>
        </div>

        {/* Right Arrow dropdown indicator / date badge */}
        <div className="flex items-center gap-3 self-end sm:self-auto select-none">
          <span className="hidden sm:inline text-[10px] text-gray-500 font-extrabold bg-white/[0.02] px-2.5 py-1 rounded-lg border border-white/[0.04]">
            {matchDateString}
          </span>
          <motion.div
            animate={{ rotate: activeExpanded ? 180 : 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="p-1 px-1.5 rounded-full hover:bg-white/5 text-gray-400 group-hover:text-primary"
          >
            <ChevronDown size={16} />
          </motion.div>
        </div>
      </div>

      {/* Expanded Quick View Details Dropdown Area */}
      <AnimatePresence initial={false}>
        {activeExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 26 }}
            className="overflow-hidden border-t border-white/[0.04]"
          >
            <div className="p-4 md:p-6 bg-black/30 backdrop-blur-md space-y-4">
              
              {/* Features grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                
                {/* Channel */}
                <div className="bg-white/[0.02] border border-white/[0.04] p-3 rounded-2xl flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Tv size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 block font-bold">القناة الناقلة</span>
                    <span className="text-xs font-black text-white">{match.channel || 'غير محدد'}</span>
                  </div>
                </div>

                {/* Commentator */}
                <div className="bg-white/[0.02] border border-white/[0.04] p-3 rounded-2xl flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Volume2 size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 block font-bold">معلق اللقاء</span>
                    <span className="text-xs font-black text-white">{match.commentator || 'غير محدد'}</span>
                  </div>
                </div>

                {/* Stadium */}
                <div className="bg-white/[0.02] border border-white/[0.04] p-3 rounded-2xl flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <MapPin size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 block font-bold">ملعب المباراة</span>
                    <span className="text-xs font-black text-white line-clamp-1">{match.stadium || 'غير محدد'}</span>
                  </div>
                </div>

                {/* Referee */}
                <div className="bg-white/[0.02] border border-white/[0.04] p-3 rounded-2xl flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <User size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 block font-bold">حكم المباراة</span>
                    <span className="text-xs font-black text-white line-clamp-1">{match.referee || 'غير محدد'}</span>
                  </div>
                </div>

              </div>

              {/* Action buttons area */}
              <div className="pt-4 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between gap-3">
                
                {/* Available Streams Badge */}
                <div className="flex items-center gap-2 self-start">
                  {match.streamingLinks && match.streamingLinks.length > 0 ? (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-primary bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/20">
                      <PlayCircle size={14} />
                      تتوفر {match.streamingLinks.length} روابط بث مباشر بجودات متعددة
                    </span>
                  ) : match.status === 'LIVE' ? (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-red-400 bg-red-500/10 px-3 py-1.5 rounded-xl border border-red-500/20 animate-pulse">
                      🔴 جاري التحضير لمصادر بث مباشر...
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-gray-500 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                      البث المباشر يبدأ قبل اللقاء بدقائق
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  {/* Share option from Quick View */}
                  <div className="interactive-action">
                    <ShareButton 
                      variant="icon" 
                      align="left" 
                      title={`${match.homeTeam} ضد ${match.awayTeam}`} 
                      url={`${window.location.origin}/match/${match.id}`} 
                      text={`تابع تفاصيل وبث لقاء ${match.homeTeam} ضد ${match.awayTeam} على كورة 90 البوابة الرياضية الشاملة!`} 
                    />
                  </div>

                  {/* Calendar for upcoming */}
                  {match.status === 'UPCOMING' && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        downloadICS(match);
                      }}
                      className="interactive-action flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-primary/20 hover:text-primary rounded-xl border border-white/5 transition-all text-sm font-black text-gray-300"
                    >
                      <CalendarPlus size={16} />
                      <span>حفظ في التقويم</span>
                    </button>
                  )}

                  {/* Nav Link for Full Details Screen */}
                  <Link
                    to={`/match/${match.id}`}
                    className="interactive-action w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/95 text-black font-black text-sm rounded-xl hover:shadow-[0_0_20px_rgba(0,223,130,0.35)] active:scale-[0.98] transition-all"
                  >
                    <span>تفاصيل المباراة والبث</span>
                    <ExternalLink size={15} />
                  </Link>
                </div>

              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
