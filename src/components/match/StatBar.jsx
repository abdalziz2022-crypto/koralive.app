import React, { useEffect, useState } from 'react';

export default function StatBar({ label, homeVal, awayVal, suffix = '' }) {
  const [animatedPct, setAnimatedPct] = useState(0);

  const total = homeVal + awayVal || 1;
  const homePct = Math.round((homeVal / total) * 100);
  const awayPct = 100 - homePct;

  useEffect(() => {
    // Elegant micro-interaction entry animation
    const timer = setTimeout(() => {
      setAnimatedPct(1);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-2 group py-1" dir="rtl">
      {/* Values & Label row */}
      <div className="flex justify-between items-center text-xs font-black">
        {/* Home Value */}
        <span className="text-emerald-400 group-hover:scale-105 transition-transform duration-200 tabular-nums">
          {homeVal}{suffix}
        </span>
        
        {/* Central Label */}
        <span className="text-gray-300 font-bold text-center tracking-wide">
          {label}
        </span>
        
        {/* Away Value */}
        <span className="text-teal-400 group-hover:scale-105 transition-transform duration-200 tabular-nums">
          {awayVal}{suffix}
        </span>
      </div>

      {/* Modern responsive dual-bar indicator line */}
      <div className="flex h-2.5 bg-white/[0.03] border border-white/5 rounded-full overflow-hidden relative">
        {/* Home dynamic percentage segment (colored and rounded at left side) */}
        <div 
          className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full rounded-r-full transition-all duration-1000 ease-out origin-right"
          style={{ 
            width: `${animatedPct ? homePct : 0}%`,
            transitionDelay: '100ms'
          }}
        />

        {/* Center line separator divider */}
        <div className="w-[2px] bg-slate-950 z-10 shrink-0" />

        {/* Away dynamic percentage segment (colored and rounded at right side) */}
        <div 
          className="bg-gradient-to-l from-teal-500 to-teal-400 h-full rounded-l-full transition-all duration-1000 ease-out origin-left"
          style={{ 
            width: `${animatedPct ? awayPct : 0}%`,
            transitionDelay: '100ms'
          }}
        />
      </div>
    </div>
  );
}
