import React from 'react';
import FootballField from './FootballField';
import { Users, ShieldAlert, Shield, Briefcase, UserPlus } from 'lucide-react';

export default function LineupsTab({ lineups, loading, error }) {
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse" dir="rtl">
        <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 flex flex-col items-center">
          <div className="w-[80%] aspect-[3/4] bg-white/5 rounded-[32px] max-w-[400px]" />
          <div className="h-6 bg-white/5 rounded w-1/3 mt-6"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-900/40 border border-red-500/10 rounded-3xl p-8 text-center flex flex-col items-center justify-center space-y-3" dir="rtl">
        <ShieldAlert className="w-12 h-12 text-red-500/80" />
        <h4 className="text-sm font-black text-white">حدث خطأ أثناء تحميل قائمة التشكيلات</h4>
        <p className="text-xs text-gray-500 font-bold max-w-sm">{error}</p>
      </div>
    );
  }

  if (!lineups) {
    return (
      <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-10 text-center flex flex-col items-center justify-center space-y-3" dir="rtl">
        <Users className="w-12 h-12 text-gray-700" />
        <h4 className="text-sm font-black text-white">التشكيلة الرسمية معلنة قريباً</h4>
        <p className="text-xs text-gray-500 font-bold max-w-sm">
          تعلن القوائم الفنية للمباراة قبل انطلاق اللقاء بـ 60 دقيقة تقريباً. يرجى المتابعة لاحقاً.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8" dir="rtl">
      
      {/* 1. Tactical Soccer Pitch Map Representation */}
      <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-4 md:p-6 backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <h3 className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-emerald-500" />
            توزيع المراكز والتموضع التكتيكي الفعلي
          </h3>
          <span className="text-[10px] text-gray-400 font-extrabold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
            خريطة معتمدة
          </span>
        </div>

        <FootballField 
          homeXI={lineups.homeXI} 
          awayXI={lineups.awayXI} 
          homeFormation={lineups.homeFormation} 
          awayFormation={lineups.awayFormation} 
        />
      </div>

      {/* 2. Side-By-Side Bench & Coach Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* HOME TEAM ROSTER SPECIFICS */}
        <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-md space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h3 className="text-xs font-black text-emerald-400 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-500" />
              دكة بدلاء صاحب الأرض
            </h3>
            <span className="text-[10px] text-gray-500 font-bold">الاحتياط</span>
          </div>

          {/* Bench Players List */}
          <div className="space-y-3">
            {lineups.homeBench.map((benchPlayer) => (
              <div key={benchPlayer.id} className="flex justify-between items-center bg-slate-950/20 border border-white/5 p-3 rounded-2xl group hover:border-emerald-500/20 transition-all">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-black flex items-center justify-center tabular-nums">
                    {benchPlayer.number}
                  </span>
                  <span className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
                    {benchPlayer.name}
                  </span>
                </div>
                <span className="text-[10px] text-gray-500 font-extrabold bg-white/5 px-2 py-0.5 rounded-md">
                  {benchPlayer.position === 'GK' ? 'حارس بديل' : 'لاعب احتياطي'}
                </span>
              </div>
            ))}
          </div>

          {/* Coach row Container */}
          <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/5 text-gray-400 flex items-center justify-center shrink-0">
              <Briefcase size={16} />
            </div>
            <div>
              <span className="text-[9px] text-gray-500 block font-bold">المدير الفني المعتمد</span>
              <p className="text-xs font-black text-white">{lineups.homeCoach}</p>
            </div>
          </div>
        </div>


        {/* AWAY TEAM ROSTER SPECIFICS */}
        <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-md space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h3 className="text-xs font-black text-teal-400 flex items-center gap-2">
              <Shield className="w-4 h-4 text-teal-500" />
              دكة بدلاء الفريق الضيف
            </h3>
            <span className="text-[10px] text-gray-500 font-bold">الاحتياط</span>
          </div>

          {/* Bench Players List */}
          <div className="space-y-3">
            {lineups.awayBench.map((benchPlayer) => (
              <div key={benchPlayer.id} className="flex justify-between items-center bg-slate-950/20 border border-white/5 p-3 rounded-2xl group hover:border-teal-500/20 transition-all">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-teal-500/10 text-teal-400 text-[10px] font-black flex items-center justify-center tabular-nums">
                    {benchPlayer.number}
                  </span>
                  <span className="text-xs font-bold text-white group-hover:text-teal-400 transition-colors">
                    {benchPlayer.name}
                  </span>
                </div>
                <span className="text-[10px] text-gray-500 font-extrabold bg-white/5 px-2 py-0.5 rounded-md">
                  {benchPlayer.position === 'GK' ? 'حارس بديل' : 'لاعب احتياطي'}
                </span>
              </div>
            ))}
          </div>

          {/* Coach row Container */}
          <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/5 text-gray-400 flex items-center justify-center shrink-0">
              <Briefcase size={16} />
            </div>
            <div>
              <span className="text-[9px] text-gray-500 block font-bold">المدير الفني المعتمد</span>
              <p className="text-xs font-black text-white">{lineups.awayCoach}</p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
