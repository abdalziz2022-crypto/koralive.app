import React from 'react';
import { Shield, Users, Layers, Hourglass } from 'lucide-react';

export default function LeagueInfoCard({ league }) {
  if (!league) return null;

  // Set default dynamic info if not provided
  const numTeams = league.name === 'دوري أبطال أوروبا' || league.name === 'دوري الأبطال' ? 32 : 18;
  const matchday = league.name === 'دوري أبطال أوروبا' || league.name === 'دوري الأبطال' ? 'دور المجموعات' : 'الأسبوع 31';

  return (
    <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[32px] p-6 space-y-5" style={{ direction: 'rtl' }}>
      {/* Title */}
      <div className="flex items-center gap-2 pb-3 border-b border-white/5">
        <Shield size={16} className="text-primary animate-pulse" />
        <h2 className="text-sm font-black text-white">تفاصيل المسابقة والموسم</h2>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Season Stat */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col justify-between hover:bg-white/[0.04] transition-all duration-300">
          <Hourglass size={18} className="text-amber-400 mb-2" />
          <div className="space-y-0.5">
            <span className="text-[10px] text-gray-500 font-bold leading-none block">الموسم النشط</span>
            <span className="text-sm font-black text-white font-mono">{league.season} / {league.season + 1}</span>
          </div>
        </div>

        {/* Competition type */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col justify-between hover:bg-white/[0.04] transition-all duration-300">
          <Layers size={18} className="text-primary mb-2" />
          <div className="space-y-0.5">
            <span className="text-[10px] text-gray-500 font-bold leading-none block">نمط المسابقة</span>
            <span className="text-sm font-black text-white">{league.competitionType}</span>
          </div>
        </div>

        {/* Participating Teams count */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col justify-between hover:bg-white/[0.04] transition-all duration-300">
          <Users size={18} className="text-blue-400 mb-2" />
          <div className="space-y-0.5">
            <span className="text-[10px] text-gray-500 font-bold leading-none block">عدد الفرق المشاركة</span>
            <span className="text-sm font-black text-white font-mono">{numTeams} فريقاً</span>
          </div>
        </div>

        {/* Current Matchday */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col justify-between hover:bg-white/[0.04] transition-all duration-300">
          <Shield size={18} className="text-emerald-400 mb-2" />
          <div className="space-y-0.5">
            <span className="text-[10px] text-gray-500 font-bold leading-none block">الجولة الحالية</span>
            <span className="text-sm font-black text-white">{matchday}</span>
          </div>
        </div>
      </div>

      {/* Note footer */}
      <p className="text-[9px] text-gray-500 text-center select-all border-t border-white/5 pt-3 font-semibold leading-relaxed">
        بيانات Season {league.season} تتحدث بشكل تلقائي عبر API كورة لايف الاجتماعي.
      </p>
    </div>
  );
}
