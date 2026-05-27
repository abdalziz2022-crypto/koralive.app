import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Calendar, Tv, Users, Play } from 'lucide-react';
import Badge from './Badge';
import { Match } from '../../types';

interface MatchCardProps {
  match: Match;
  onClick?: () => void;
  className?: string;
}

export default function MatchCard({
  match,
  onClick,
  className = '',
}: MatchCardProps) {
  const navigate = useNavigate();

  // Handle fallback navigation if no custom click is supplied
  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/match/${match.id}`);
    }
  };

  const homeName = match.homeTeam?.name || 'الفريق المضيف';
  const awayName = match.awayTeam?.name || 'الفريق الضيف';
  const homeLogo = match.homeTeam?.logo || match.homeLogo || 'https://media.api-sports.io/football/teams/unknown.png';
  const awayLogo = match.awayTeam?.logo || match.awayLogo || 'https://media.api-sports.io/football/teams/unknown.png';

  // Format Status / Minute
  let isLive = false;
  let elapsed: string | number = '';
  let statusText = '';

  if (typeof match.status === 'object' && match.status !== null) {
    statusText = match.status.long || '';
    elapsed = match.status.elapsed ?? '';
    const code = (match.status.short || '').toUpperCase();
    isLive = ['1H', '2H', 'ET', 'P', 'LIVE', 'HT'].includes(code);
  } else if (typeof match.status === 'string') {
    statusText = match.status;
    const s = match.status.toUpperCase();
    isLive = ['LIVE', '1H', '2H', 'HT', 'ET', 'PEN', 'مباشر'].includes(s);
  }

  if (match.isLive !== undefined) {
    isLive = match.isLive;
  }

  // Formatting date/time
  const startTime = match.startTime || match.utcDate;
  let timeStr = '';
  if (startTime) {
    try {
      const d = new Date(startTime);
      timeStr = d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch (e) {
      timeStr = String(startTime);
    }
  }

  // Scores
  const homeScore = match.score?.home ?? match.homeScore ?? null;
  const awayScore = match.score?.away ?? match.awayScore ?? null;
  const showScore = homeScore !== null && awayScore !== null;

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={handleCardClick}
      className={`bg-surface hover:bg-surface-hover border border-border/10 hover:border-primary/20 rounded-3xl p-5 shadow-sm hover:shadow-md cursor-pointer transition-all duration-300 select-none ${className}`}
    >
      {/* Top Meta: League Name & Status Indicators */}
      <div className="flex items-center justify-between gap-3 mb-4.5">
        <div className="flex items-center gap-2">
          {match.league?.logo && (
            <img 
              src={match.league.logo} 
              alt={typeof match.league === 'object' ? match.league.name : 'الدوري'}
              className="w-4 h-4 rounded-md object-contain shrink-0"
              referrerPolicy="no-referrer"
            />
          )}
          <span className="text-[10px] md:text-xs text-gray-400 font-extrabold line-clamp-1">
            {typeof match.league === 'object' ? match.league.name : (match.league || 'الدوري المفصل')}
          </span>
        </div>

        <div>
          {isLive ? (
            <Badge variant="live" pulse={true}>
              {elapsed ? `مباشر ${elapsed}'` : 'مباشر'}
            </Badge>
          ) : (
            <span className="text-[11px] font-bold text-gray-500">
              {statusText === 'Not Started' || statusText === 'NS' || !statusText ? 'لم تبدأ' : statusText}
            </span>
          )}
        </div>
      </div>

      {/* Grid Match Contents */}
      <div className="grid grid-cols-3 items-center gap-2 py-1">
        
        {/* Home Team */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="relative w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center p-2.5 transform group-hover:scale-105 transition-all">
            <img 
              src={homeLogo} 
              alt={homeName} 
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <span className="text-xs md:text-sm font-black text-white line-clamp-1 w-full max-w-[100px] md:max-w-none">
            {homeName}
          </span>
        </div>

        {/* Center: Score & Match Status time */}
        <div className="flex flex-col items-center justify-center gap-1.5">
          {showScore ? (
            <div className="flex items-center gap-3">
              <span className={`text-xl md:text-2xl font-black ${isLive ? 'text-primary' : 'text-white'}`}>
                {homeScore}
              </span>
              <span className="text-gray-600 font-black">-</span>
              <span className={`text-xl md:text-2xl font-black ${isLive ? 'text-primary' : 'text-white'}`}>
                {awayScore}
              </span>
            </div>
          ) : (
            <div className="px-3.5 py-1.5 bg-white/5 rounded-xl border border-white/5">
              <span className="text-xs font-black text-primary font-mono tracking-tight">
                {timeStr || '90+'}
              </span>
            </div>
          )}
          
          {/* Quick status label */}
          {!isLive && showScore && (
            <span className="text-[10px] text-gray-500 font-bold block bg-white/5 px-2 py-0.5 rounded-md">
              منتهية
            </span>
          )}
        </div>

        {/* Away Team */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="relative w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center p-2.5 transform group-hover:scale-105 transition-all">
            <img 
              src={awayLogo} 
              alt={awayName} 
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <span className="text-xs md:text-sm font-black text-white line-clamp-1 w-full max-w-[100px] md:max-w-none">
            {awayName}
          </span>
        </div>

      </div>

      {/* Footer: Quick icons - Commentary, streaming indicator */}
      {(match.channel || match.commentator || match.streamingLinks?.length) && (
        <div className="border-t border-white/5 mt-4 pt-3 flex items-center justify-between text-[10px] text-gray-500 font-medium">
          <div className="flex items-center gap-3">
            {match.channel && (
              <span className="flex items-center gap-1">
                <Tv className="w-3 h-3 text-gray-400" />
                <span>{match.channel}</span>
              </span>
            )}
            {match.commentator && (
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3 text-gray-400" />
                <span>{match.commentator}</span>
              </span>
            )}
          </div>
          
          {match.streamingLinks && match.streamingLinks.length > 0 && (
            <span className="flex items-center gap-1.5 text-primary text-xs font-black animate-pulse">
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>شاهد الآن</span>
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}
