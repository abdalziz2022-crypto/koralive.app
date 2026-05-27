import React from 'react';
import { Award, Percent } from 'lucide-react';

export default function TeamStatsCard({ stats }) {
  if (!stats) return null;

  // Calculate victory percentage
  const winRate = stats.played > 0 ? Math.round((stats.wins / stats.played) * 100) : 0;

  return (
    <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[32px] p-6 space-y-5" style={{ direction: 'rtl' }}>
      {/* Header */}
      <div className="flex items-center gap-2 pb-3 border-b border-white/5">
        <Award size={16} className="text-primary animate-pulse" />
        <h2 className="text-sm font-black text-white">إحصائيات الأداء هذا الموسم</h2>
      </div>

      {/* Stats Grid Layout */}
      <div className="grid grid-cols-3 gap-3">
        {/* Played Card */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3 text-center hover:bg-white/[0.04] transition-all">
          <span className="text-[10px] text-gray-500 font-bold block mb-1">المباريات</span>
          <span className="text-lg font-black text-white font-mono">{stats.played}</span>
        </div>

        {/* Wins Card */}
        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-3 text-center hover:bg-emerald-500/10 transition-all">
          <span className="text-[10px] text-emerald-500/70 font-bold block mb-1">فوز</span>
          <span className="text-lg font-black text-emerald-400 font-mono">{stats.wins}</span>
        </div>

        {/* Losses Card */}
        <div className="bg-rose-500/5 border border-rose-500/10 rounded-2xl p-3 text-center hover:bg-rose-500/10 transition-all">
          <span className="text-[10px] text-rose-500/70 font-bold block mb-1">خسارة</span>
          <span className="text-lg font-black text-rose-400 font-mono">{stats.losses}</span>
        </div>

        {/* Draws Card */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3 text-center hover:bg-white/[0.04] transition-all">
          <span className="text-[10px] text-gray-400/80 font-bold block mb-1">تعادل</span>
          <span className="text-lg font-black text-gray-300 font-mono">{stats.draws}</span>
        </div>

        {/* Goals Card */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3 text-center hover:bg-white/[0.04] transition-all">
          <span className="text-[10px] text-gray-500 font-bold block mb-1">الأهداف</span>
          <span className="text-lg font-black text-white font-mono">{stats.goals}</span>
        </div>

        {/* Clean Sheets Card */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3 text-center hover:bg-white/[0.04] transition-all">
          <span className="text-[10px] text-gray-500 font-bold block mb-1">شباك نظيفة</span>
          <span className="text-lg font-black text-white font-mono">{stats.cleanSheets}</span>
        </div>
      </div>

      {/* Progress bar ratio display */}
      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-2.5">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-xs text-gray-400">معدل الفوز التاريخي</span>
          <span className="text-primary font-mono">{winRate}%</span>
        </div>
        <div className="w-full h-2 bg-slate-950/80 border border-white/5 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-1000" 
            style={{ width: `${winRate}%` }} 
          />
        </div>
      </div>
    </div>
  );
}
