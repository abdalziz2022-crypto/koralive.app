import React from 'react';
import { Shield, Sparkles } from 'lucide-react';

export default function StandingsTable({ standings }) {
  if (!standings || standings.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 font-bold" dir="rtl">
        لا توجد بيانات متاحة لترتيب الفرق حالياً
      </div>
    );
  }

  // Returns styling for the form badges
  const getFormStyle = (type) => {
    switch (type) {
      case 'W':
      case 'ف':
        return 'bg-emerald-500 text-slate-950 font-black';
      case 'D':
      case 'ت':
        return 'bg-amber-500/80 text-slate-950 font-black';
      case 'L':
      case 'خ':
        return 'bg-red-500 text-white font-black';
      default:
        return 'bg-slate-800 text-gray-400';
    }
  };

  const getFormLabel = (type) => {
    switch (type) {
      case 'W': return 'W';
      case 'D': return 'D';
      case 'L': return 'L';
      default: return type || '—';
    }
  };

  return (
    <div className="w-full overflow-x-auto scrollbar-thin scrollbar-track-slate-950 scrollbar-thumb-white/10" dir="rtl">
      <table className="w-full border-collapse text-right text-xs">
        {/* Sticky Table Header */}
        <thead className="sticky top-0 bg-slate-950/90 backdrop-blur-md z-10">
          <tr className="border-b border-white/5 text-gray-400 font-black text-[10px] tracking-wide uppercase">
            <th className="py-3 px-3 w-8 text-center bg-slate-900/10">#</th>
            <th className="py-3 px-2 text-right">الفريق</th>
            <th className="py-3 px-2 text-center w-12">لعب</th>
            <th className="py-3 px-2 text-center w-10 hidden sm:table-cell">ف</th>
            <th className="py-3 px-2 text-center w-10 hidden sm:table-cell">ت</th>
            <th className="py-3 px-2 text-center w-10 hidden sm:table-cell">خ</th>
            <th className="py-3 px-2 text-center w-14">الفرق</th>
            <th className="py-3 px-2 text-center w-16 text-emerald-400">النقاط</th>
            <th className="py-3 px-3 text-center w-36">آخر ٥ مباريات</th>
          </tr>
        </thead>
        
        {/* Table Body rows */}
        <tbody className="divide-y divide-white/5 font-sans">
          {standings.map((st, sIdx) => (
            <tr 
              key={sIdx} 
              className={`group transition-all duration-200 hover:bg-white/[0.03] ${
                st.isFeatured 
                  ? 'bg-emerald-500/[0.04] border-r-[3px] border-r-emerald-500 relative font-black' 
                  : ''
              }`}
            >
              {/* Rank Badge */}
              <td className="py-3.5 px-3 text-center bg-slate-900/10">
                <span className={`inline-flex items-center justify-center w-5 h-5 rounded-lg text-[10px] font-black ${
                  st.rank <= 4 
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' 
                    : st.rank >= 8 
                      ? 'bg-red-500/10 text-red-400/80 border border-red-500/10'
                      : 'bg-white/5 text-gray-400'
                }`}>
                  {st.rank}
                </span>
              </td>

              {/* Team Crest & Name */}
              <td className="py-3.5 px-2">
                <div className="flex items-center gap-2.5">
                  {st.teamCrest ? (
                    <img 
                      src={st.teamCrest} 
                      alt="" 
                      className="w-5 h-5 object-contain shrink-0 group-hover:scale-110 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : null}
                  
                  <div className="flex items-center gap-1.5 truncate">
                    <span className={`text-xs select-text block truncate tracking-wide ${
                      st.isFeatured ? 'text-emerald-400 font-black' : 'text-gray-200 font-bold'
                    }`}>
                      {st.teamName}
                    </span>
                    {st.isFeatured && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulseshrink-0" />
                    )}
                  </div>
                </div>
              </td>

              {/* Played games */}
              <td className="py-3.5 px-2 text-center font-bold text-gray-300 tabular-nums">
                {st.played}
              </td>

              {/* Win / Draw / Loss counts (hidden on super small mobile) */}
              <td className="py-3.5 px-2 text-center text-gray-400 hidden sm:table-cell tabular-nums font-medium">
                {st.won}
              </td>
              <td className="py-3.5 px-2 text-center text-gray-400 hidden sm:table-cell tabular-nums font-medium">
                {st.draw}
              </td>
              <td className="py-3.5 px-2 text-center text-gray-400 hidden sm:table-cell tabular-nums font-medium">
                {st.lost}
              </td>

              {/* Goal Difference column */}
              <td className={`py-3.5 px-2 text-center text-xs font-bold tabular-nums ${
                st.gd.toString().startsWith('+') ? 'text-emerald-500' : st.gd.toString().startsWith('-') ? 'text-red-400' : 'text-gray-400'
              }`}>
                {st.gd}
              </td>

              {/* Points */}
              <td className="py-3.5 px-2 text-center">
                <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-black tabular-nums md:text-sm ${
                  st.isFeatured 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                    : 'bg-slate-900/40 text-emerald-500'
                }`}>
                  {st.points}
                </span>
              </td>

              {/* Form circular badges */}
              <td className="py-3.5 px-3">
                <div className="flex items-center justify-center gap-1">
                  {st.form && st.form.length > 0 ? (
                    st.form.map((f, fIdx) => (
                      <span 
                        key={fIdx} 
                        className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black uppercase shadow-sm ${getFormStyle(f)}`}
                      >
                        {getFormLabel(f)}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-gray-600 font-mono">—</span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
