import React from 'react';
import { motion } from 'motion/react';
import { Clock, Trophy, MapPin, Tv, Mic, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Match } from '../types';
import { generateMatchEvents } from './TimelineView';
import { cn } from '../lib/utils';

interface MatchHeaderProps {
  match?: Match;
}

// Fallback Mock Data similar to real match data for demonstration
const MOCK_MATCH: Match = {
  id: 'fixture-mock',
  homeTeam: 'ريال مدريد',
  awayTeam: 'برشلونة',
  homeLogo: 'https://api.dicebear.com/7.x/initials/svg?seed=RM&backgroundColor=f8fafc',
  awayLogo: 'https://api.dicebear.com/7.x/initials/svg?seed=FCB&backgroundColor=701a75',
  homeScore: 3,
  awayScore: 2,
  status: 'LIVE',
  minute: 82,
  league: 'الدوري الإسباني',
  leagueLogo: 'https://api.dicebear.com/7.x/initials/svg?seed=LL&backgroundColor=ea580c',
  startTime: new Date().toISOString(),
  stadium: 'سانتياغو برنابيو',
  commentator: 'حفيظ دراجي',
  channel: 'beIN Sports HD 1',
  streamingLinks: []
};

export default function MatchHeader({ match: propMatch }: MatchHeaderProps) {
  const navigate = useNavigate();
  // Use provided match or fallback Mock Data
  const match = propMatch || MOCK_MATCH;

  // Local state for checking user's favorite setting
  const [isFavorite, setIsFavorite] = React.useState(false);

  // Generate scorers based on the match events to render them FotMob style!
  const events = React.useMemo(() => generateMatchEvents(match), [match]);
  const scorers = React.useMemo(() => {
    return events.filter(e => e.type === 'goal');
  }, [events]);

  const homeScorers = scorers.filter(s => s.team === 'home');
  const awayScorers = scorers.filter(s => s.team === 'away');

  const formattedTime = React.useMemo(() => {
    try {
      return new Date(match.startTime).toLocaleTimeString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return '22:00';
    }
  }, [match.startTime]);

  const formattedDate = React.useMemo(() => {
    try {
      return new Date(match.startTime).toLocaleDateString('ar-EG', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'الجمعة، 15 مايو';
    }
  }, [match.startTime]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full relative overflow-hidden rounded-3xl border border-white/5 bg-[#090f19]/90 shadow-2xl backdrop-blur-md"
      style={{ direction: 'rtl' }}
    >
      {/* Background radial soft glows */}
      <div className="absolute top-0 right-1/4 w-72 h-72 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Banner: League details & Leg details */}
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-3 bg-[#0d1628]/40">
        <div className="flex items-center gap-2">
          <img 
            src={match.leagueLogo} 
            alt={match.league} 
            className="w-5 h-5 rounded-md object-contain saturate-125 shadow-sm"
            referrerPolicy="no-referrer"
          />
          <span className="text-white text-[11px] sm:text-xs font-black">{match.league}</span>
          <span className="text-gray-600 text-xs">•</span>
          <span className="text-[10px] sm:text-[11px] font-bold text-gray-400">الجولة 32</span>
        </div>

        {/* Favorite Star and Match Day actions */}
        <div className="flex items-center gap-1.5">
          <button 
            onClick={() => setIsFavorite(!isFavorite)}
            className={cn(
              "p-1.5 rounded-xl border transition-all duration-300 cursor-pointer outline-none",
              isFavorite 
                ? "bg-amber-500/25 border-amber-500/40 text-amber-400" 
                : "bg-white/5 border-white/5 hover:border-white/10 text-gray-400 hover:text-white"
            )}
            title="حفظ في المفضلة"
          >
            <Star size={13} className={isFavorite ? "fill-amber-400" : ""} />
          </button>
          
          <span className="text-[9px] bg-white/5 text-gray-400 px-2 py-1 rounded-lg border border-white/5 font-extrabold hidden sm:inline-block">
            إياب (الذهاب 1-1)
          </span>
        </div>
      </div>

      {/* Centerpiece Container with Teams, Logo & Score */}
      <div className="p-5 sm:p-7 md:p-8 space-y-6">
        <div className="grid grid-cols-12 gap-3 items-center">
          
          {/* Home Team Design */}
          <div 
            onClick={() => navigate(`/team/${encodeURIComponent(match.homeTeam)}`)}
            className="col-span-4 flex flex-col items-center text-center space-y-3 cursor-pointer group/home select-none hover:scale-105 transition-all duration-300"
          >
            <div className="relative group">
              {/* Outer circle glow on hover */}
              <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-2xl blur-md opacity-0 group-hover:opacity-10 transition-all duration-300" />
              <img 
                src={match.homeLogo} 
                alt={match.homeTeam} 
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain p-2 rounded-2xl bg-white/[0.02] border border-white/10 shadow-lg relative z-10"
                referrerPolicy="no-referrer"
              />
            </div>
            
            <div className="space-y-1">
              <h2 className="text-xs sm:text-sm md:text-base font-black text-white leading-tight tracking-tight hover:text-emerald-400 transition-colors">
                {match.homeTeam}
              </h2>
              <span className="text-[8px] sm:text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 px-1.5 py-0.5 rounded-md font-extrabold inline-block">
                مستضيف
              </span>
            </div>
          </div>

          {/* Central Score and Time Panel */}
          <div className="col-span-4 flex flex-col items-center justify-center text-center space-y-3">
            {match.status === 'LIVE' ? (
              <div className="flex flex-col items-center gap-1.5">
                {/* Live Minute badge */}
                <span className="flex items-center gap-1 bg-red-600/10 border border-red-500/20 px-2.5 py-1 rounded-full animate-pulse text-red-500 text-[10px] font-black">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  مباشر • {match.minute}'
                </span>
                
                {/* Real-time score display */}
                <div className="flex items-center gap-3 mt-1 select-none">
                  <span className="text-3xl sm:text-5xl font-black text-white font-mono tracking-tight tabular-nums">
                    {match.homeScore}
                  </span>
                  <span className="text-gray-600 text-lg font-black">:</span>
                  <span className="text-3xl sm:text-5xl font-black text-white font-mono tracking-tight tabular-nums">
                    {match.awayScore}
                  </span>
                </div>
              </div>
            ) : match.status === 'FINISHED' ? (
              <div className="flex flex-col items-center gap-1.5">
                <span className="bg-white/5 border border-white/10 text-gray-400 px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider block">
                  انتهت المباراة
                </span>
                
                {/* Final Score display */}
                <div className="flex items-center gap-3 mt-1 select-none">
                  <span className="text-3xl sm:text-5xl font-black text-gray-200 font-mono tracking-tight tabular-nums">
                    {match.homeScore}
                  </span>
                  <span className="text-gray-500 text-lg font-black">:</span>
                  <span className="text-3xl sm:text-5xl font-black text-gray-200 font-mono tracking-tight tabular-nums">
                    {match.awayScore}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1.5">
                {/* Future Match Time Info */}
                <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-black block whitespace-nowrap">
                  {formattedTime}
                </span>
                
                {/* "VS" Separator */}
                <div className="flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-full border border-white/5 bg-white/[0.01] my-1 text-xs font-black text-gray-400">
                  VS
                </div>

                <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 block max-w-[100px] truncate">
                  {formattedDate}
                </span>
              </div>
            )}
          </div>

          {/* Away Team Design */}
          <div 
            onClick={() => navigate(`/team/${encodeURIComponent(match.awayTeam)}`)}
            className="col-span-4 flex flex-col items-center text-center space-y-3 cursor-pointer group/away select-none hover:scale-105 transition-all duration-300"
          >
            <div className="relative group">
              <div className="absolute -inset-2 bg-gradient-to-l from-blue-500 to-blue-400 rounded-2xl blur-md opacity-0 group-hover:opacity-10 transition-all duration-300" />
              <img 
                src={match.awayLogo} 
                alt={match.awayTeam} 
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain p-2 rounded-2xl bg-white/[0.02] border border-white/10 shadow-lg relative z-10"
                referrerPolicy="no-referrer"
              />
            </div>
            
            <div className="space-y-1">
              <h2 className="text-xs sm:text-sm md:text-base font-black text-white leading-tight tracking-tight hover:text-blue-400 transition-colors">
                {match.awayTeam}
              </h2>
              <span className="text-[8px] sm:text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/15 px-1.5 py-0.5 rounded-md font-extrabold inline-block">
                مستقبل
              </span>
            </div>
          </div>

        </div>

        {/* Scorers Sub-list (Exclusive FotMob Touch!) */}
        {scorers.length > 0 && (
          <div className="grid grid-cols-12 gap-2 border-t border-white/5 pt-4 text-[10px] sm:text-[11px] text-gray-400 font-bold font-sans">
            {/* Home scorers - aligned right */}
            <div className="col-span-5 text-right space-y-1 pr-1">
              {homeScorers.map(s => (
                <div key={s.id} className="flex items-center gap-1.5 justify-start text-right">
                  <span className="text-white font-extrabold">{s.player}</span>
                  <span className="text-emerald-400 font-black">({s.minute}')</span>
                  <span className="text-[9px] text-gray-500 hidden md:inline-block font-medium">⚽ ({s.detail})</span>
                </div>
              ))}
            </div>

            {/* Separator / Ball */}
            <div className="col-span-2 flex items-center justify-center text-gray-600">
              <span className="text-xs leading-none">⚽</span>
            </div>

            {/* Away scorers - aligned left */}
            <div className="col-span-5 text-left space-y-1 pl-1">
              {awayScorers.map(s => (
                <div key={s.id} className="flex items-center gap-1.5 justify-end text-left">
                  <span className="text-[9px] text-gray-500 hidden md:inline-block font-medium">({s.detail}) ⚽</span>
                  <span className="text-amber-500 font-black">({s.minute}')</span>
                  <span className="text-white font-extrabold">{s.player}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Match Meta Information Drawer Footer: Stadium, Referee, etc. */}
      {(match.stadium || match.commentator || match.channel) && (
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t border-white/5 bg-[#0d1628]/25 px-5 py-3 text-[10px] text-gray-400 font-bold">
          {match.stadium && (
            <div className="flex items-center gap-1">
              <MapPin size={11} className="text-emerald-500" />
              <span>{match.stadium}</span>
            </div>
          )}
          {match.channel && (
            <div className="flex items-center gap-1">
              <Tv size={11} className="text-emerald-500" />
              <span>{match.channel}</span>
            </div>
          )}
          {match.commentator && (
            <div className="flex items-center gap-1">
              <Mic size={11} className="text-emerald-500" />
              <span>{match.commentator}</span>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
