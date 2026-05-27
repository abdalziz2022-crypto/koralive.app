import React from 'react';
import { 
  Trophy, ArrowLeft, RefreshCw, Zap, Pocket, Calendar, Activity, 
  HelpCircle, Shuffle, Award, Flame, AlertOctagon, CheckSquare, ScreenShare
} from 'lucide-react';

export default function EventCard({ event }) {
  const getEventIcon = (type) => {
    switch (type) {
      case 'GOAL':
        return <span className="text-sm">⚽</span>;
      case 'YELLOW_CARD':
        return <span className="text-sm">🟨</span>;
      case 'RED_CARD':
        return <span className="text-sm">🟥</span>;
      case 'SUBSTITUTION':
        return <span className="text-sm">🔄</span>;
      case 'PENALTY':
        return <span className="text-sm">🎯</span>;
      case 'VAR':
        return <span className="text-sm">📺</span>;
      case 'HALF_TIME':
        return <span className="text-gray-400 text-xs font-black">HT</span>;
      case 'FULL_TIME':
        return <span className="text-emerald-400 text-xs font-black">FT</span>;
      default:
        return <span className="text-xs">📢</span>;
    }
  };

  const getEventBg = (type) => {
    switch (type) {
      case 'GOAL':
        return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
      case 'YELLOW_CARD':
        return 'bg-amber-500/10 border-amber-500/20 text-amber-500';
      case 'RED_CARD':
        return 'bg-red-500/10 border-red-500/20 text-red-500';
      case 'SUBSTITUTION':
        return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
      case 'VAR':
        return 'bg-purple-500/10 border-purple-500/20 text-purple-400';
      case 'PENALTY':
        return 'bg-teal-500/10 border-teal-500/20 text-teal-400';
      default:
        return 'bg-slate-800/20 border-white/5 text-gray-400';
    }
  };

  // Check if this is a global status event like Half time & Full time
  const isGlobalEvent = ['HALF_TIME', 'FULL_TIME'].includes(event.type);

  if (isGlobalEvent) {
    return (
      <div className="flex flex-col items-center justify-center w-full my-6 text-center animate-fade-in">
        <div className="bg-slate-900/60 border border-white/10 px-6 py-2.5 rounded-2xl max-w-xs shadow-lg backdrop-blur-md">
          <p className="text-[10px] text-emerald-400 font-black tracking-widest mb-0.5">
            {event.type === 'HALF_TIME' ? 'استراحة منتصف الوقت' : 'صافرة النهاية الرئيسية'}
          </p>
          <h4 className="text-xs font-black text-white">{event.detail}</h4>
          {event.minute && (
            <span className="text-[9px] text-gray-500 font-bold block mt-1">الدقيقة {event.minute}</span>
          )}
        </div>
      </div>
    );
  }

  // Determine alignment representation: Left side (home) / Right side (away)
  const isHome = event.team === 'home';

  return (
    <div className={`flex w-full items-start gap-4 my-4 group ${isHome ? 'justify-start md:flex-row' : 'justify-end md:flex-row-reverse'}`} dir="rtl">
      {/* Side Color stripe identifier */}
      <div className={`w-1 self-stretch rounded-full ${isHome ? 'bg-emerald-500/40' : 'bg-teal-500/40'}`} />

      {/* Main Event Body Container */}
      <div className={`relative bg-slate-900/40 border border-white/5 hover:border-white/10 rounded-2xl p-4 transition-all duration-300 backdrop-blur-md w-full max-w-[90%] md:max-w-[450px] shadow-sm hover:shadow-md ${
        isHome ? 'hover:shadow-emerald-500/2' : 'hover:shadow-teal-500/2'
      }`}>
        
        {/* Header container displaying minute badge and event badge icon */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black tracking-wider bg-slate-950 px-2.5 py-1 text-gray-400 border border-white/5 rounded-lg">
              {event.minute}
            </span>
            <div className={`w-7 h-7 rounded-xl border flex items-center justify-center ${getEventBg(event.type)}`}>
              {getEventIcon(event.type)}
            </div>
          </div>

          <span className={`text-[10px] font-black ${isHome ? 'text-emerald-400' : 'text-teal-400'}`}>
            {isHome ? 'صاحب الأرض' : 'الفريق الضيف'}
          </span>
        </div>

        {/* Player and action description */}
        <div className="space-y-1">
          {event.player && (
            <h4 className="text-xs sm:text-sm font-black text-white hover:text-emerald-400 transition-colors cursor-default">
              {event.player}
            </h4>
          )}
          <p className="text-[11px] text-gray-400 leading-relaxed font-bold">
            {event.detail}
          </p>
        </div>

      </div>
    </div>
  );
}
