import React from 'react';
import { User, Globe, Calendar, Ruler, Zap } from 'lucide-react';

export default function PlayerInfoCard({ info }) {
  if (!info) return null;

  return (
    <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[32px] p-6 space-y-5" style={{ direction: 'rtl' }}>
      {/* Title */}
      <div className="flex items-center gap-2 pb-3 border-b border-white/5">
        <User size={16} className="text-primary animate-pulse" />
        <h2 className="text-sm font-black text-white font-sans">البطاقة الشخصية والمعلومات</h2>
      </div>

      {/* Grid of details */}
      <div className="grid grid-cols-2 gap-4">
        {/* Nationality */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col justify-between hover:bg-white/[0.04] transition-all duration-300">
          <Globe size={18} className="text-blue-400 mb-2" />
          <div className="space-y-0.5">
            <span className="text-[10px] text-gray-500 font-bold block leading-none">الجنسية والبلد</span>
            <span className="text-xs font-black text-white">{info.nationality}</span>
          </div>
        </div>

        {/* Age */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col justify-between hover:bg-white/[0.04] transition-all duration-300">
          <Calendar size={18} className="text-emerald-400 mb-2" />
          <div className="space-y-0.5">
            <span className="text-[10px] text-gray-500 font-bold block leading-none">العمر الحالي</span>
            <span className="text-sm font-black text-white font-mono">{info.age}</span>
          </div>
        </div>

        {/* Height */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col justify-between hover:bg-white/[0.04] transition-all duration-300">
          <Ruler size={18} className="text-amber-400 mb-2" />
          <div className="space-y-0.5">
            <span className="text-[10px] text-gray-500 font-bold block leading-none">الطول المترين</span>
            <span className="text-sm font-black text-white font-mono">{info.height}</span>
          </div>
        </div>

        {/* Preferred foot */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col justify-between hover:bg-white/[0.04] transition-all duration-300">
          <Zap size={18} className="text-purple-400 mb-2" />
          <div className="space-y-0.5">
            <span className="text-[10px] text-gray-500 font-bold block leading-none">القدم المفضلة</span>
            <span className="text-xs font-black text-white">{info.foot}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
