import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Bar, 
  Line, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Cell
} from 'recharts';
import { BarChart2, Clock, Target, TrendingUp, Sparkles } from 'lucide-react';

export default function PlayerPerformanceChart({ player }) {
  const [viewType, setViewType] = useState('composed'); // 'composed' | 'shots' | 'minutes'

  // Generate deterministic performance data for 8 games based on the player's profile data
  const data = useMemo(() => {
    if (!player) return [];

    const name = player.name || 'لاعب رياضي';
    const position = player.position || 'لاعب كرة قدم';
    const stats = player.stats || { goals: 0, assists: 0, minutesPlayed: 0 };

    const opponents = [
      { team: 'الهلال', difficulty: 'صعب' },
      { team: 'النصر', difficulty: 'صعب' },
      { team: 'الاتحاد', difficulty: 'صعب' },
      { team: 'الأهلي', difficulty: 'صعب' },
      { team: 'الشباب', difficulty: 'متوسط' },
      { team: 'التعاون', difficulty: 'متوسط' },
      { team: 'الاتفاق', difficulty: 'متوسط' },
      { team: 'الفتح', difficulty: 'سهل' },
      { team: 'الفيحاء', difficulty: 'سهل' },
      { team: 'ضمك', difficulty: 'سهل' }
    ];

    // Compute a seed from the player's name
    const seed = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const isGoalKeeper = position.includes('حارس') || name.includes('بونو');

    const totalMatches = 8;
    const matchesRecord = [];

    for (let i = 0; i < totalMatches; i++) {
      const oppIndex = (seed + i) % opponents.length;
      const opponent = opponents[oppIndex];

      // Minutes calculation - mostly 90, sometimes subbed off/on
      let minutes = 90;
      const noise = (seed * (i + 13)) % 100;

      if (i === 2) {
        minutes = 75; // Tactical sub
      } else if (i === 5) {
        minutes = 60; // Tactical sub
      } else if (noise > 85) {
        minutes = 45; // Half-time sub/injury
      } else if (noise < 15) {
        minutes = 80;
      }

      // Shots on target logic
      let shotsOnTarget = 0;
      if (!isGoalKeeper) {
        // High goals -> more shots on target
        const goalsCount = stats.goals || 0;
        const baseShots = goalsCount > 25 ? 3 : goalsCount > 12 ? 2 : 1;
        const matchPerformance = (seed * (i + 7)) % 4; // 0, 1, 2, 3
        
        shotsOnTarget = baseShots + (matchPerformance - 1); // variance
        
        // Difficulty adjustments
        if (opponent.difficulty === 'صعب' && shotsOnTarget > 0) {
          shotsOnTarget -= 1;
        } else if (opponent.difficulty === 'سهل') {
          shotsOnTarget += 1;
        }

        shotsOnTarget = Math.max(0, Math.min(6, shotsOnTarget));
      } else {
        shotsOnTarget = 0; // standard goalkeeper has 0 shots on target
      }

      matchesRecord.push({
        match: `مباراة ${i + 1}`,
        opponent: opponent.team,
        opponentText: `ضد ${opponent.team} (${opponent.difficulty})`,
        minutes: minutes,
        shotsOnTarget: shotsOnTarget,
        accuracy: shotsOnTarget > 0 ? (70 + ((seed * i) % 30)) : 0
      });
    }

    return matchesRecord;
  }, [player]);

  const stats = useMemo(() => {
    if (data.length === 0) return { avgMinutes: 0, avgShots: 0, maxShots: 0 };
    const totalMinutes = data.reduce((sum, d) => sum + d.minutes, 0);
    const totalShots = data.reduce((sum, d) => sum + d.shotsOnTarget, 0);
    const maxShots = Math.max(...data.map(d => d.shotsOnTarget));
    
    return {
      avgMinutes: Math.round(totalMinutes / data.length),
      avgShots: Number((totalShots / data.length).toFixed(1)),
      maxShots
    };
  }, [data]);

  // If no data or loading, don't crash
  if (!player) return null;

  // Custom visual components for Recharts Tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const info = payload[0].payload;
      return (
        <div className="bg-[#0b1324] border border-white/10 rounded-2xl p-4 shadow-2xl text-right max-w-[240px] space-y-2.5">
          <div className="pb-1.5 border-b border-white/5">
            <span className="text-xs font-black text-white block">{info.match}</span>
            <span className="text-[10px] text-emerald-400 font-bold block mt-0.5">{info.opponentText}</span>
          </div>
          <div className="space-y-1.5 text-[11px] font-bold">
            <div className="flex justify-between items-center gap-4 text-sky-300">
              <span className="font-sans font-black text-gray-100">{info.minutes} د</span>
              <span>الملعوبة:</span>
            </div>
            {player.position && !player.position.includes('حارس') && (
              <>
                <div className="flex justify-between items-center gap-4 text-emerald-400">
                  <span className="font-sans font-black text-gray-100">{info.shotsOnTarget} تسديدات</span>
                  <span>على المرمى:</span>
                </div>
                {info.shotsOnTarget > 0 && (
                  <div className="flex justify-between items-center gap-4 text-amber-400">
                    <span className="font-sans font-black text-gray-100">{info.accuracy}%</span>
                    <span>دقة التسديد:</span>
                  </div>
                )}
              </>
            )}
          </div>
          {info.shotsOnTarget >= 2 && (
            <div className="pt-2 border-t border-white/5 flex items-center gap-1 text-[9px] text-amber-400 font-extrabold justify-end">
              <span>فاعلية هجومية متميزة ✨</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[32px] p-6 space-y-6 text-right" dir="rtl">
      
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-white/5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-black text-white">إحصائيات الأداء التفاعلية بالدوري</h2>
          </div>
          <p className="text-[10px] text-gray-400 font-medium">أداء اللاعب من حيث الدقائق الملعوبة ومعدل التسديدات على المرمى (Shots on Target)</p>
        </div>

        {/* View togglers */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-[#0b1324] rounded-xl border border-white/5 select-none shrink-0" dir="rtl">
          <button
            onClick={() => setViewType('composed')}
            className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
              viewType === 'composed' ? 'bg-emerald-500 text-black shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            المخطط المدمج
          </button>
          <button
            onClick={() => setViewType('shots')}
            className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
              viewType === 'shots' ? 'bg-emerald-500 text-black shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            التسديدات
          </button>
          <button
            onClick={() => setViewType('minutes')}
            className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
              viewType === 'minutes' ? 'bg-emerald-500 text-black shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            دقائق اللعب
          </button>
        </div>
      </div>

      {/* Summary Stats Badges */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3 text-center hover:bg-white/[0.04] transition duration-200">
          <div className="flex items-center justify-center gap-1 mb-1 text-sky-450 text-sky-400">
            <Clock size={12} />
            <span className="text-[9px] font-bold text-gray-400">متوسط الدقائق</span>
          </div>
          <span className="text-sm font-black text-white font-mono">{stats.avgMinutes}'</span>
        </div>

        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-3 text-center hover:bg-emerald-500/10 transition duration-200">
          <div className="flex items-center justify-center gap-1 mb-1 text-emerald-400">
            <Target size={12} />
            <span className="text-[9px] font-bold text-gray-400">معدل التسديد/مباراة</span>
          </div>
          <span className="text-sm font-black text-emerald-400 font-mono">{stats.avgShots}</span>
        </div>

        <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-3 text-center font-bold hover:bg-amber-500/10 transition duration-200">
          <div className="flex items-center justify-center gap-1 mb-1 text-amber-400">
            <TrendingUp size={12} />
            <span className="text-[9px] font-bold text-gray-400">أعلى تسديدات</span>
          </div>
          <span className="text-sm font-black text-amber-400 font-mono">{stats.maxShots}</span>
        </div>
      </div>

      {/* Recharts Canvas */}
      <div className="w-full h-64 md:h-72" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 10, right: 5, left: -20, bottom: 5 }}
          >
            <defs>
              <linearGradient id="minutesGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
            
            <XAxis 
              dataKey="match" 
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700 }} 
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,0.05)' }}
            />
            
            {/* Left Axis: Minutes Played */}
            <YAxis 
              yAxisId="left"
              domain={[0, 100]}
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              label={viewType !== 'shots' ? { value: 'الدقائق الملعوبة (دقيقة)', angle: -90, position: 'insideLeft', style: { fill: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: 'bold' }, offset: 10 } : null}
            />

            {/* Right Axis: Shots on Target (rendered conditionally unless minutes only) */}
            {viewType !== 'minutes' && (
              <YAxis 
                yAxisId="right"
                orientation="right"
                domain={[0, 6]}
                tick={{ fill: '#10b981', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                label={{ value: 'التسديدات على المرمى', angle: 90, position: 'insideRight', style: { fill: '#10b981', fontSize: 9, fontWeight: 'bold' }, offset: 5 }}
              />
            )}

            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />

            {/* Minutes Area / Bar */}
            {viewType !== 'shots' && (
              <Area 
                yAxisId="left" 
                type="monotone" 
                dataKey="minutes" 
                fill="url(#minutesGrad)" 
                stroke="#0ea5e9" 
                strokeWidth={2}
                name="الدقائق الملعوبة"
                dot={{ stroke: '#0ea5e9', strokeWidth: 1, fill: '#070c16', r: 3 }}
                activeDot={{ r: 5, strokeWidth: 0, fill: '#38bdf8' }}
              />
            )}

            {/* Shots on Target Bar */}
            {viewType !== 'minutes' && (
              <Bar 
                yAxisId="right" 
                dataKey="shotsOnTarget" 
                fill="#10b981" 
                radius={[4, 4, 0, 0]}
                maxBarSize={18}
                name="التسديدات على المرمى"
              >
                {data.map((entry, index) => {
                  const isHigh = entry.shotsOnTarget >= 3;
                  return (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={isHigh ? '#34d399' : '#10b981'} 
                      fillOpacity={viewType === 'composed' ? 0.75 : 0.9} 
                    />
                  );
                })}
              </Bar>
            )}

          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Subtext info */}
      <div className="bg-slate-950/30 p-3.5 rounded-2xl border border-white/5 text-center text-[10px] text-gray-500 font-bold flex items-center justify-center gap-1.5 leading-relaxed">
        <Sparkles size={12} className="text-emerald-500 animate-pulse" />
        <span>تتحول المعايير والرسوم البيانية تلقائياً حسب الفئة التكتيكية ومراكز اللاعب ومهامه الهجومية.</span>
      </div>

    </div>
  );
}
