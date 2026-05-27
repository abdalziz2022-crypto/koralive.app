import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Clock, Tv, Activity } from 'lucide-react';

export default function MatchCard({ match }) {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/match/${match.id}`);
  };

  const formatTime = (utcString) => {
    try {
      const date = new Date(utcString);
      return date.toLocaleTimeString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return '—';
    }
  };

  const formatDate = (utcString) => {
    try {
      const date = new Date(utcString);
      return date.toLocaleDateString('ar-EG', {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'LIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
            مباشر الآن
          </span>
        );
      case 'PAUSED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            استراحة
          </span>
        );
      case 'FINISHED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-white/5 text-gray-400 border border-white/5">
            منتهية
          </span>
        );
      case 'POSTPONED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
            مؤجلة
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/10">
            مجدولة
          </span>
        );
    }
  };

  const isLive = match.status === 'LIVE' || match.status === 'PAUSED';

  return (
    <div 
      onClick={handleCardClick}
      className="relative group bg-slate-900/40 hover:bg-slate-900/70 border border-white/5 hover:border-emerald-500/20 rounded-3xl p-5 transition-all duration-300 backdrop-blur-md overflow-hidden cursor-pointer hover:shadow-emerald-500/5 hover:shadow-2xl active:scale-[0.99]"
    >
      {/* Decorative top gradient active on hover */}
      <div className="absolute top-0 right-0 left-0 h-[2.5px] bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

      {/* Header Info: Competition & Status */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          {match.competition?.emblem ? (
            <img 
              src={match.competition.emblem} 
              alt={match.competition.name}
              className="w-5 h-5 object-contain"
              referrerPolicy="no-referrer"
            />
          ) : (
            <Trophy className="w-4 h-4 text-emerald-500" />
          )}
          <span className="text-[11px] font-black text-gray-300 line-clamp-1">{match.competition?.name || 'البطولة'}</span>
        </div>
        <div className="shrink-0">{getStatusBadge(match.status)}</div>
      </div>

      {/* Main Opponents details section */}
      <div className="grid grid-cols-12 gap-2 items-center py-5">
        {/* Home Team */}
        <div className="col-span-10 sm:col-span-5 flex items-center sm:flex-col sm:justify-center gap-3">
          <div className="w-10 h-10 sm:w-14 sm:h-14 bg-white/[0.03] border border-white/5 rounded-full p-2 flex items-center justify-center group-hover:scale-105 transition-transform duration-300 shadow-md">
            {match.homeTeam?.crest ? (
              <img 
                src={match.homeTeam.crest} 
                alt={match.homeTeam.name} 
                className="w-7 h-7 sm:w-10 sm:h-10 object-contain"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="text-xs font-black text-gray-400">{match.homeTeam?.tla || 'H'}</span>
            )}
          </div>
          <span className="text-xs sm:text-xs font-black text-white hover:text-emerald-400 transition-colors line-clamp-1">
            {match.homeTeam?.name}
          </span>
        </div>

        {/* Center Scores or Scheduling */}
        <div className="col-span-12 sm:col-span-2 order-first sm:order-none flex sm:flex-col items-center justify-between sm:justify-center gap-1.5 px-1 py-2 sm:py-0 border-b sm:border-b-0 border-white/5 mb-3 sm:mb-0">
          {isLive || match.status === 'FINISHED' ? (
            <div className="flex flex-row sm:flex-col items-center gap-2 sm:gap-0.5 w-full sm:w-auto justify-center">
              <div className="flex items-center justify-center gap-2 bg-black/40 border border-white/5 px-3 py-1 rounded-xl">
                <span className={isLive ? "text-base font-black tracking-tight text-emerald-400" : "text-white text-base font-black tracking-tight"}>
                  {match.homeScore ?? match.score?.home ?? 0}
                </span>
                <span className="text-gray-600 text-xs font-black">:</span>
                <span className={isLive ? "text-base font-black tracking-tight text-emerald-400" : "text-white text-base font-black tracking-tight"}>
                  {match.awayScore ?? match.score?.away ?? 0}
                </span>
              </div>
              {(match.score?.halfTimeHome !== undefined || match.halfTimeHome !== undefined) && (
                <span className="text-[9px] text-gray-500 font-bold">
                  الشوط الأول ({match.score?.halfTimeHome ?? match.halfTimeHome} - {match.score?.halfTimeAway ?? match.halfTimeAway})
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between sm:flex-col sm:justify-center gap-0.5 bg-black/25 px-2.5 py-1.5 rounded-xl border border-white/5 w-full sm:w-auto">
              <span className="text-xs font-black text-emerald-400 flex items-center justify-center gap-1">
                <Clock size={11} className="shrink-0" />
                {formatTime(match.utcDate)}
              </span>
              <span className="text-[9px] text-gray-500 font-bold">
                {formatDate(match.utcDate)}
              </span>
            </div>
          )}
        </div>

        {/* Away Team */}
        <div className="col-span-10 sm:col-span-5 flex items-center sm:flex-col sm:justify-center gap-3">
          <div className="w-10 h-10 sm:w-14 sm:h-14 bg-white/[0.03] border border-white/5 rounded-full p-2 flex items-center justify-center group-hover:scale-105 transition-transform duration-300 shadow-md">
            {match.awayTeam?.crest ? (
              <img 
                src={match.awayTeam.crest} 
                alt={match.awayTeam.name} 
                className="w-7 h-7 sm:w-10 sm:h-10 object-contain"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="text-xs font-black text-gray-400">{match.awayTeam?.tla || 'A'}</span>
            )}
          </div>
          <span className="text-xs sm:text-xs font-black text-white hover:text-emerald-400 transition-colors line-clamp-1">
            {match.awayTeam?.name}
          </span>
        </div>
      </div>

      {/* Footer view actions */}
      <div className="flex items-center justify-between border-t border-white/5 pt-3 text-[10px] text-gray-500">
        <span className="flex items-center gap-1 font-semibold">
          <Activity size={12} className="text-emerald-500" />
          كورة لايف - بث مباشر
        </span>
        {isLive && (
          <span className="flex items-center gap-1 text-emerald-500 animate-pulse font-extrabold">
            <Tv size={11} />
            البث حي
          </span>
        )}
      </div>
    </div>
  );
}
