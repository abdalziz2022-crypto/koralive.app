import React from 'react';
import { Trophy, TrendingUp } from 'lucide-react';

export default function LeaguePositionCard({ positionInfo }) {
  if (!positionInfo) return null;

  // Make sure we safe-guard form
  const formList = Array.isArray(positionInfo.form) ? positionInfo.form : ['W', 'D', 'W', 'W', 'L'];

  return (
    <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[32px] p-6 space-y-5" style={{ direction: 'rtl' }}>
      {/* Header */}
      <div className="flex items-center gap-2 pb-3 border-b border-white/5">
        <Trophy size={16} className="text-amber-400 animate-pulse" />
        <h2 className="text-sm font-black text-white">ترتيب وجدول الفريق بالدوري</h2>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Rank Card */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col justify-between hover:bg-white/[0.04] transition-all">
          <span className="text-[10px] text-gray-500 font-bold block mb-1">المركز الحالي</span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-primary font-mono">{positionInfo.rank}</span>
            <span className="text-[10px] text-gray-400 font-bold">في الجولة الأخيرة</span>
          </div>
        </div>

        {/* Points Card */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col justify-between hover:bg-white/[0.04] transition-all">
          <span className="text-[10px] text-gray-500 font-bold block mb-1">النقاط الكلية</span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-white font-mono">{positionInfo.points}</span>
            <span className="text-[10px] text-gray-400 font-bold">نقطة</span>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-3">
        <span className="text-[10px] text-gray-400 font-bold block">مؤشر نتائج المباريات الـ 5 الأخيرة:</span>
        
        <div className="flex items-center gap-2">
          {formList.map((outcome, idx) => {
            let badgeBg = 'bg-gray-500/10 text-gray-400 border-gray-500/20';
            let label = outcome;
            
            if (outcome === 'W' || outcome === 'فوز') {
              badgeBg = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
              label = 'ف';
            } else if (outcome === 'D' || outcome === 'تعادل') {
              badgeBg = 'bg-amber-500/20 text-amber-400 border-amber-500/30';
              label = 'ت';
            } else if (outcome === 'L' || outcome === 'خسارة') {
              badgeBg = 'bg-rose-500/20 text-rose-400 border-rose-500/30';
              label = 'خ';
            }

            return (
              <div 
                key={idx} 
                className={`w-7 h-7 rounded-lg border text-xs font-black flex items-center justify-center transition-all ${badgeBg}`}
                title={outcome}
              >
                {label}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
