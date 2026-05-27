import React from 'react';
import StatBar from './StatBar';
import { BarChart3, ShieldAlert, Sparkles } from 'lucide-react';

export default function StatsTab({ stats, loading, error }) {
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse" dir="rtl">
        <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 space-y-5">
          <div className="h-4 bg-white/10 rounded w-1/4"></div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <div className="h-3 bg-white/5 rounded w-12"></div>
                <div className="h-3 bg-white/5 rounded w-24"></div>
                <div className="h-3 bg-white/5 rounded w-12"></div>
              </div>
              <div className="h-2 bg-white/5 rounded-full w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-900/40 border border-red-500/10 rounded-3xl p-8 text-center flex flex-col items-center justify-center space-y-3" dir="rtl">
        <ShieldAlert className="w-12 h-12 text-red-500/80" />
        <h4 className="text-sm font-black text-white">عذراً، تعذر إحضار إحصائيات المباراة</h4>
        <p className="text-xs text-gray-500 font-bold max-w-sm">{error}</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-10 text-center flex flex-col items-center justify-center space-y-3" dir="rtl">
        <span className="text-2xl">📊</span>
        <h4 className="text-sm font-black text-white">إحصائيات اللقاء قيد التحديث</h4>
        <p className="text-xs text-gray-500 font-bold">بمجرد بدء صافرة البداية، سيتم تفعيل التغطية المباشرة للإحصائيات الحيوية والتبديلات هنا.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-md space-y-6 shadow-2xl relative overflow-hidden">
        {/* Top visual gradient line */}
        <div className="absolute top-0 right-0 left-0 h-[2.5px] bg-gradient-to-r from-transparent via-teal-500/30 to-transparent" />

        {/* Info header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <h3 className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-emerald-500" />
            إحصائيات المواجهة التكتيكية
          </h3>
          <span className="text-[10px] text-gray-500 font-black flex items-center gap-1 bg-white/5 px-2.5 py-0.5 rounded-full">
            <Sparkles size={11} className="text-emerald-500" /> 365Scores Live
          </span>
        </div>

        {/* Dynamic statistics layout */}
        <div className="space-y-6">
          <StatBar 
            label={stats.possession.label} 
            homeVal={stats.possession.home} 
            awayVal={stats.possession.away} 
            suffix={stats.possession.suffix} 
          />
          <StatBar 
            label={stats.shots.label} 
            homeVal={stats.shots.home} 
            awayVal={stats.shots.away} 
          />
          <StatBar 
            label={stats.shotsOnTarget.label} 
            homeVal={stats.shotsOnTarget.home} 
            awayVal={stats.shotsOnTarget.away} 
          />
          <StatBar 
            label={stats.corners.label} 
            homeVal={stats.corners.home} 
            awayVal={stats.corners.away} 
          />
          <StatBar 
            label={stats.fouls.label} 
            homeVal={stats.fouls.home} 
            awayVal={stats.fouls.away} 
          />
          <StatBar 
            label={stats.yellowCards.label} 
            homeVal={stats.yellowCards.home} 
            awayVal={stats.yellowCards.away} 
          />
          <StatBar 
            label={stats.redCards.label} 
            homeVal={stats.redCards.home} 
            awayVal={stats.redCards.away} 
          />
        </div>
      </div>
    </div>
  );
}
