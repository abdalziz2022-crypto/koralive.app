import React from 'react';
import StandingsTable from './StandingsTable';
import { Award, ShieldAlert, Trophy, ShieldQuestion } from 'lucide-react';

export default function StandingsTab({ standings, loading, error }) {
  if (loading) {
    return (
      <div className="space-y-4 animate-pulse" dir="rtl">
        <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-white/5">
            <div className="h-4 bg-white/10 rounded w-1/4"></div>
            <div className="h-4 bg-white/10 rounded w-16"></div>
          </div>
          {/* Skeleton list lines */}
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex justify-between items-center py-3">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-white/5 rounded"></div>
                <div className="h-4 bg-white/5 rounded w-28"></div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-4 bg-white/5 rounded"></div>
                <div className="w-8 h-4 bg-white/5 rounded"></div>
              </div>
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
        <h4 className="text-sm font-black text-white font-sans">حدث خطأ برصد جدول الترتيب الدوري</h4>
        <p className="text-xs text-gray-500 font-bold max-w-sm">{error}</p>
      </div>
    );
  }

  if (!standings || standings.length === 0) {
    return (
      <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-10 text-center flex flex-col items-center justify-center space-y-3" dir="rtl">
        <ShieldQuestion className="w-12 h-12 text-gray-700" />
        <h4 className="text-sm font-black text-white font-sans">جدول الترتيب غير متاح</h4>
        <p className="text-xs text-gray-500 font-bold max-w-sm">
          لم يتم العثور على جدول ترتيب البطولة حالياً أو أن البطولة الحالية لا تخضع لنظام نقاط الترتيب المباشر (مثل مباريات الكأس الفردية والتصفيات المباشرة).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Table Outer Panel Context with custom headers */}
      <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-4 md:p-6 backdrop-blur-md relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 left-0 h-[2.5px] bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
        
        {/* Title and subtitle detail */}
        <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-5">
          <div className="space-y-1">
            <h3 className="text-xs font-black text-emerald-400 flex items-center gap-1.5 font-sans">
              <Award className="w-4 h-4 text-emerald-500" />
              جدول الترتيب والمراكز المعتمدة
            </h3>
            <p className="text-[10px] text-gray-500 font-bold">
              متابعة مباشرة لصراع النقاط وفرص التأهل والمراكز المتقدمة
            </p>
          </div>
          
          <span className="text-[10px] text-gray-400 font-extrabold bg-white/5 px-3 py-1 rounded-full border border-white/5">
            تحديث مباشر
          </span>
        </div>

        {/* Mapped Standings Table container */}
        <StandingsTable standings={standings} />

        {/* Legend footnotes indicator */}
        <div className="mt-5 pt-4 border-t border-white/5 flex flex-wrap gap-x-6 gap-y-2 text-[10px] font-bold text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-[8px] text-emerald-400 font-black">#</span>
            مراكز التأهل للبطولات القارية الكبرى
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-red-500/10 border border-red-500/15 flex items-center justify-center text-[8px] text-red-500 font-black">#</span>
            منطقة مراكز الهبوط / خطر الخروج
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-[8px] h-[8px] rounded-full bg-emerald-500/90" />
            الفريقين المشاركين بلقاء اليوم
          </span>
        </div>

      </div>
    </div>
  );
}
