import React from 'react';
import EventCard from './EventCard';
import { Clock, ShieldAlert, Sparkles, AlertCircle } from 'lucide-react';

export default function TimelineTab({ timelineEvents, loading, error }) {
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse" dir="rtl">
        <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 space-y-6">
          <div className="h-4 bg-white/10 rounded w-1/3"></div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-white/5 shrink-0"></div>
              <div className="space-y-2 w-full">
                <div className="h-4 bg-white/5 rounded w-12 text-[10px]"></div>
                <div className="h-14 bg-white/5 rounded-2xl w-full"></div>
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
        <h4 className="text-sm font-black text-white font-sans">فشل إحضار شريط مجريات المباراة</h4>
        <p className="text-xs text-gray-500 font-bold max-w-sm">{error}</p>
      </div>
    );
  }

  if (!timelineEvents || timelineEvents.length === 0) {
    return (
      <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-8 text-center flex flex-col items-center justify-center space-y-3" dir="rtl">
        <Clock className="w-12 h-12 text-gray-700/80 animate-spin" style={{ animationDuration: '6s' }} />
        <h4 className="text-sm font-black text-white">ترقبوا صافرة البداية</h4>
        <p className="text-xs text-gray-500 font-bold max-w-xs">
          عند بدء اللقاء رسمياً وسلسلة هجمات الميدان، ستظهر هنا تفاصيل الأهداف، البطاقات، والتبديلات التكتيكية فور حدوثها.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      
      {/* Outer wrapper panel */}
      <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-md relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 left-0 h-[2.5px] bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
        
        {/* Title header bar */}
        <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
          <h3 className="text-xs font-black text-emerald-400 flex items-center gap-1.5 font-sans">
            <Clock className="w-3.5 h-3.5 text-emerald-500" />
            شريط السرد الزمني الحي والمجريات
          </h3>
          <span className="text-[10px] text-gray-500 font-black flex items-center gap-1 bg-white/5 px-2.5 py-0.5 rounded-full">
            <Sparkles size={11} className="text-emerald-500" /> تغطية فورية دقيقة
          </span>
        </div>

        {/* Vertical timeline body */}
        <div className="relative">
          
          {/* Central vertical line axis */}
          <div className="absolute right-[5px] top-0 bottom-0 w-[2px] bg-dashed bg-gradient-to-b from-emerald-500/30 via-white/10 to-transparent pointer-events-none" 
               style={{ borderLeft: '2px dashed rgba(255,255,255,0.06)' }} />

          {/* Connected timeline list items */}
          <div className="space-y-4 pr-3.5 relative">
            {timelineEvents.map((evt, idx) => (
              <div key={idx} className="relative">
                {/* Visual marker dot on the vertical line */}
                <span className="absolute right-[-20px] top-6 w-3.5 h-3.5 rounded-full bg-slate-950 border-2 border-emerald-500 shadow-md flex items-center justify-center z-10" />
                
                <EventCard event={evt} />
              </div>
            ))}
          </div>

        </div>

      </div>

    </div>
  );
}
