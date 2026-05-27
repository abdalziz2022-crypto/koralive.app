import React from 'react';
import { 
  Trophy, Calendar, Clock, MapPin, User, ShieldAlert, Award, Star, Radio
} from 'lucide-react';

export default function OverviewTab({ details, loading, error }) {
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Skeleton Card 1 */}
        <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 space-y-4">
          <div className="h-4 bg-white/10 rounded w-1/4"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-10 bg-white/5 rounded-2xl w-full"></div>
            <div className="h-10 bg-white/5 rounded-2xl w-full"></div>
            <div className="h-10 bg-white/5 rounded-2xl w-full col-span-2"></div>
          </div>
        </div>
        
        {/* Skeleton Card 2 */}
        <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 space-y-4">
          <div className="h-4 bg-white/10 rounded w-1/3"></div>
          <div className="h-12 bg-white/5 rounded-2xl w-full"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-900/40 border border-red-500/10 rounded-3xl p-8 text-center flex flex-col items-center justify-center space-y-3">
        <ShieldAlert className="w-12 h-12 text-red-500/80" />
        <h4 className="text-sm font-black text-white">حدث خطأ أثناء تحميل تفاصيل المباراة</h4>
        <p className="text-xs text-gray-500 font-bold max-w-sm">{error}</p>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-10 text-center flex flex-col items-center justify-center space-y-3">
        <span className="text-2xl">⏳</span>
        <h4 className="text-sm font-black text-white">لا توجد بيانات متاحة</h4>
        <p className="text-xs text-gray-500 font-bold">يرجى التحقق من حالة اللقاء في وقت لاحق.</p>
      </div>
    );
  }

  const formatFullDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ar-EG', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString || '—';
    }
  };

  const formatTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return '—';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'LIVE': return 'مباشر الآن';
      case 'PAUSED': return 'استراحة الشوطين';
      case 'FINISHED': return 'انتهت المباراة';
      case 'POSTPONED': return 'مؤجلة';
      default: return 'مجدولة';
    }
  };

  const getStageText = (stage) => {
    if (stage === 'REGULAR_SEASON') return 'الموسم اللائحي الاعتيادي';
    return stage || 'الجولة الاعتيادية';
  };

  const isLive = details.status === 'LIVE' || details.status === 'PAUSED';

  return (
    <div className="space-y-6" dir="rtl">
      
      {/* قسم 3: الملخص ومقارنة النقاط */}
      <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-md relative overflow-hidden group">
        <div className="absolute top-0 right-0 left-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent" />
        
        <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
          <h3 className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
            <Radio className={`w-3.5 h-3.5 ${isLive ? 'animate-pulse text-red-500' : 'text-emerald-500'}`} />
            ملخص النتيجة الحالية
          </h3>
          <span className="text-[10px] text-gray-500 font-bold">{getStatusText(details.status)}</span>
        </div>

        <div className="flex items-center justify-between gap-4 py-2">
          {/* Home team summary row */}
          <div className="flex items-center gap-3 w-1/2">
            <div className="w-10 h-10 bg-white/[0.03] border border-white/5 rounded-full p-2 flex items-center justify-center">
              {details.homeTeam?.crest ? (
                <img src={details.homeTeam.crest} className="w-6 h-6 object-contain" alt="" referrerPolicy="no-referrer" />
              ) : (
                <span className="text-xs font-bold text-gray-400">{details.homeTeam?.tla || 'H'}</span>
              )}
            </div>
            <span className="text-xs sm:text-sm font-black text-white line-clamp-1">{details.homeTeam?.name}</span>
          </div>

          {/* Core Score Badge */}
          <div className="shrink-0 bg-slate-950/60 border border-white/5 px-4 py-2 rounded-2xl flex items-center gap-2.5 shadow-lg">
            <span className={`text-sm sm:text-base font-black ${isLive ? 'text-red-400' : 'text-gray-100'}`}>
              {details.homeScore}
            </span>
            <span className="text-gray-600 text-[10px] font-black">:</span>
            <span className={`text-sm sm:text-base font-black ${isLive ? 'text-red-400' : 'text-gray-100'}`}>
              {details.awayScore}
            </span>
          </div>

          {/* Away team summary row */}
          <div className="flex items-center gap-3 w-1/2 justify-end text-left" dir="ltr">
            <div className="w-10 h-10 bg-white/[0.03] border border-white/5 rounded-full p-2 flex items-center justify-center order-last">
              {details.awayTeam?.crest ? (
                <img src={details.awayTeam.crest} className="w-6 h-6 object-contain" alt="" referrerPolicy="no-referrer" />
              ) : (
                <span className="text-xs font-bold text-gray-400">{details.awayTeam?.tla || 'A'}</span>
              )}
            </div>
            <span className="text-xs sm:text-sm font-black text-white line-clamp-1 text-right w-full">{details.awayTeam?.name}</span>
          </div>
        </div>
      </div>

      {/* قسم 1: تفاصيل ومعلومات المباراة */}
      <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-md space-y-4">
        <h3 className="text-xs font-black text-emerald-400 flex items-center gap-1.5 border-b border-white/5 pb-3">
          <Trophy className="w-3.5 h-3.5 text-emerald-500" />
          معلومات اللقاء الرياضية
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold">
          
          <div className="bg-slate-950/30 border border-white/5 p-3 rounded-2xl space-y-1">
            <span className="text-[10px] text-gray-500 font-extrabold flex items-center gap-1">
              <Trophy size={11} className="text-emerald-500" /> البطولة
            </span>
            <p className="text-gray-200">{details.competition?.name || 'البطولة الرسمية'}</p>
          </div>

          <div className="bg-slate-950/30 border border-white/5 p-3 rounded-2xl space-y-1">
            <span className="text-[10px] text-gray-500 font-extrabold flex items-center gap-1">
              <Award size={11} className="text-emerald-500" /> الجولة والمسار
            </span>
            <p className="text-gray-200">الجولة رقم {details.matchday || '—'}</p>
          </div>

          <div className="bg-slate-950/30 border border-white/5 p-3 rounded-2xl space-y-1">
            <span className="text-[10px] text-gray-500 font-extrabold flex items-center gap-1">
              <Star size={11} className="text-emerald-500" /> مرحلة اللعب
            </span>
            <p className="text-gray-200">{getStageText(details.stage)}</p>
          </div>

          <div className="bg-slate-950/30 border border-white/5 p-3 rounded-2xl space-y-1">
            <span className="text-[10px] text-gray-500 font-extrabold flex items-center gap-1">
              <Calendar size={11} className="text-emerald-500" /> تاريخ وزمن الانطلاق
            </span>
            <p className="text-gray-200 truncate flex items-center gap-2">
              <span>{formatFullDate(details.kickoffTime)}</span>
              <span className="text-emerald-400 font-black">({formatTime(details.kickoffTime)})</span>
            </p>
          </div>

        </div>
      </div>

      {/* قسم 2: الملعب والتحكيم الفني */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-5 backdrop-blur-md flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center shrink-0">
            <MapPin size={20} />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] text-gray-500 font-black">اسم ملعب وميدان اللقاء</span>
            <p className="text-xs sm:text-sm font-black text-white">{details.venue}</p>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-5 backdrop-blur-md flex items-center gap-4">
          <div className="w-10 h-10 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-2xl flex items-center justify-center shrink-0">
            <User size={20} />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] text-gray-500 font-black">الحكم الشرفي المعتمد</span>
            <p className="text-xs sm:text-sm font-black text-white">{details.referee}</p>
          </div>
        </div>

      </div>

    </div>
  );
}
