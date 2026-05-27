import React from 'react';

export default function PlayerCircle({ player, isHome = true }) {
  if (!player) return null;

  return (
    <div className="flex flex-col items-center justify-center space-y-1 select-none pointer-events-auto transform hover:scale-110 active:scale-95 transition-all duration-300">
      
      {/* Player Shirt Badge Circle Container */}
      <div className={`relative w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 shadow-lg transition-colors cursor-pointer ${
        isHome 
          ? 'bg-slate-900 border-emerald-500 text-emerald-400 hover:bg-emerald-500 hover:text-black hover:border-white' 
          : 'bg-slate-900 border-teal-500 text-teal-400 hover:bg-teal-500 hover:text-black hover:border-white'
      }`}>
        {/* Shirt Number */}
        <span className="text-xs sm:text-sm font-black tabular-nums">
          {player.number}
        </span>

        {/* Captain Small Indicator Badge */}
        {player.isCaptain && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 border border-white flex items-center justify-center text-[8px] font-black z-10" title="قائد الفريق">
            C
          </span>
        )}
      </div>

      {/* Player Shortened name */}
      <span className="text-[10px] sm:text-xs font-black text-white bg-slate-950/80 px-2 py-0.5 rounded-md border border-white/5 truncate max-w-[65px] text-center shadow">
        {player.name}
      </span>
    </div>
  );
}
