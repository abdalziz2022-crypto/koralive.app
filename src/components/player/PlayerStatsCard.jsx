import React from 'react';
import { Award, ShieldCheck, Flame } from 'lucide-react';

export default function PlayerStatsCard({ stats }) {
  if (!stats) return null;

  return (
    <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[32px] p-6 space-y-5" style={{ direction: 'rtl' }}>
      {/* Header */}
      <div className="flex items-center gap-2 pb-3 border-b border-white/5">
        <Flame size={16} className="text-secondary animate-pulse" />
        <h2 className="text-sm font-black text-white">إحصائيات الموسم الحالي الكلية</h2>
      </div>

      {/* Grid of numbers */}
      <div className="grid grid-cols-3 gap-3">
        {/* Appearances */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3 text-center hover:bg-white/[0.04] transition-all">
          <span className="text-[10px] text-gray-500 font-bold block mb-1">المشاركات</span>
          <span className="text-lg font-black text-white font-mono">{stats.appearances}</span>
        </div>

        {/* Goals */}
        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-3 text-center hover:bg-emerald-500/10 transition-all">
          <span className="text-[10px] text-emerald-500/70 font-bold block mb-1">الأهداف</span>
          <span className="text-lg font-black text-emerald-400 font-mono">{stats.goals}</span>
        </div>

        {/* Assists */}
        <div className="bg-primary/5 border border-primary/10 rounded-2xl p-3 text-center hover:bg-primary/10 transition-all">
          <span className="text-[10px] text-primary/70 font-bold block mb-1">التمريرات</span>
          <span className="text-lg font-black text-primary font-mono">{stats.assists}</span>
        </div>

        {/* Yellow Cards */}
        <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-3 text-center hover:bg-amber-500/10 transition-all">
          <span className="text-[10px] text-amber-500/70 font-bold block mb-1">بطاقات صفراء</span>
          <span className="text-lg font-black text-amber-400 font-mono">{stats.yellowCards}</span>
        </div>

        {/* Red Cards */}
        <div className="bg-rose-500/5 border border-rose-500/10 rounded-2xl p-3 text-center hover:bg-rose-500/10 transition-all">
          <span className="text-[10px] text-rose-500/70 font-bold block mb-1">بطاقات حمراء</span>
          <span className="text-lg font-black text-rose-400 font-mono">{stats.redCards}</span>
        </div>

        {/* Minutes played */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3 text-center hover:bg-white/[0.04] transition-all">
          <span className="text-[10px] text-gray-400/80 font-bold block mb-1">دقائق اللعب</span>
          <span className="text-sm font-black text-white font-mono tabular-nums leading-7">{stats.minutesPlayed}'</span>
        </div>
      </div>

      {/* Aesthetic summary label footer */}
      <div className="bg-slate-950/40 p-3 rounded-2xl border border-white/5 text-center text-[10px] text-gray-400 font-bold flex items-center justify-center gap-1.5">
        <ShieldCheck size={12} className="text-emerald-500" />
        <span>يتم احتساب الأرقام بناءً على البيانات الرسمية لمسابقات Season {new Date().getFullYear()}.</span>
      </div>
    </div>
  );
}
