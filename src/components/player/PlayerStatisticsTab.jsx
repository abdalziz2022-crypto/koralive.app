import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  BarChart,
  AreaChart,
  Bar, 
  Line, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  Cell
} from 'recharts';
import { Target, TrendingUp, Sparkles, Zap, Award, BarChart3, ChevronLeft, Calendar } from 'lucide-react';

export default function PlayerStatisticsTab({ player, stats }) {
  const [activeChart, setActiveChart] = useState('goals'); // 'goals' | 'shots' | 'passes'

  // Generate deterministic but highly realistic match-by-match data 
  // tailored to the player's seasonal outcomes.
  const chartData = useMemo(() => {
    if (!player) return [];

    const name = player.name || 'لاعب';
    const position = player.position || 'وسط';
    const goalsCount = stats?.goals || 0;
    const assistsCount = stats?.assists || 0;
    const isGK = position.includes('حارس') || name.includes('بونو');

    // Simple hashing to derive custom seed from their name
    const seed = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);

    const opponents = [
      { name: 'الهلال', diff: 'صعب' },
      { name: 'النصر', diff: 'صعب' },
      { name: 'الأهلي', diff: 'صعب' },
      { name: 'الاتحاد', diff: 'صعب' },
      { name: 'الشباب', diff: 'متوسط' },
      { name: 'الاتفاق', diff: 'متوسط' },
      { name: 'التعاون', diff: 'متوسط' },
      { name: 'ضمك', diff: 'سهل' }
    ];

    const matchCount = 8;
    const list = [];

    // Distribute actual goals and assists over matchCount
    let goalsRemaining = goalsCount;
    let assistsRemaining = assistsCount;

    for (let i = 0; i < matchCount; i++) {
      const oppIdx = (seed + i) % opponents.length;
      const opponent = opponents[oppIdx];
      
      // Determine goals in this match based on remaining count
      let matchGoals = 0;
      if (!isGK && goalsRemaining > 0) {
        if (i === (seed % matchCount) || (goalsRemaining > 1 && i === ((seed + 3) % matchCount))) {
          matchGoals = goalsRemaining > 1 ? 2 : 1;
        } else if (i % 3 === 0 && goalsRemaining > 0) {
          matchGoals = 1;
        }
        goalsRemaining = Math.max(0, goalsRemaining - matchGoals);
      }

      // Determine assists in this match based on remaining count
      let matchAssists = 0;
      if (!isGK && assistsRemaining > 0) {
        if (i === ((seed + 1) % matchCount) || (assistsRemaining > 1 && i === ((seed + 4) % matchCount))) {
          matchAssists = 1;
        }
        assistsRemaining = Math.max(0, assistsRemaining - matchAssists);
      }

      // Expected Goals (xG)
      let xG = 0;
      if (!isGK) {
        const base = position.includes('مهاجم') ? 0.35 : position.includes('وسط') ? 0.15 : 0.05;
        const variation = ((seed * (i + 1)) % 30) / 100; // 0.0 to 0.3
        xG = Number((base + variation + (matchGoals * 0.2)).toFixed(2));
      }

      // Shots data
      let shots = 0;
      let shotsOnTarget = 0;
      if (!isGK) {
        const baseShots = position.includes('مهاجم') ? 3 : position.includes('وسط') ? 1.5 : 0.5;
        const shotVariation = (seed + i) % 3;
        shots = Math.round(baseShots + shotVariation + matchGoals);
        shotsOnTarget = Math.max(0, Math.min(shots, Math.round(shots * (0.4 + ((seed % 4) * 0.1)) + matchGoals)));
      }

      // Passes data
      let passesAttempted = 0;
      let passesCompleted = 0;
      let keyPasses = 0;
      if (isGK) {
        passesAttempted = Math.round(20 + ((seed + i) % 15));
        passesCompleted = Math.round(passesAttempted * (0.65 + ((seed % 5) * 0.05)));
      } else {
        const basePasses = position.includes('وسط') ? 50 : position.includes('مدافع') ? 45 : 25;
        passesAttempted = Math.round(basePasses + ((seed * (i + 5)) % 25));
        passesCompleted = Math.round(passesAttempted * (0.78 + ((seed + i) % 12) * 0.01));
        keyPasses = Math.max(0, matchAssists + ((seed + i) % 3));
      }

      list.push({
        num: `م ${i + 1}`,
        opponent: opponent.name,
        opponentText: `ضد ${opponent.name} (${opponent.diff})`,
        goals: matchGoals,
        assists: matchAssists,
        xG: xG,
        shotsTotal: shots,
        shotsOnTarget: shotsOnTarget,
        shotsAccuracy: shots > 0 ? Math.round((shotsOnTarget / shots) * 100) : 0,
        passesAttempted: passesAttempted,
        passesCompleted: passesCompleted,
        passAccuracy: Math.round((passesCompleted / passesAttempted) * 100),
        keyPasses: keyPasses
      });
    }

    return list;
  }, [player, stats]);

  // Aggregate stats derived from dynamic data
  const summary = useMemo(() => {
    if (chartData.length === 0) return { totalGoals: 0, totalAssists: 0, avgAccuracy: 0 };
    
    const goals = chartData.reduce((acc, curr) => acc + curr.goals, 0);
    const assists = chartData.reduce((acc, curr) => acc + curr.assists, 0);
    const totalAccuracy = chartData.reduce((acc, curr) => acc + curr.passAccuracy, 0);
    const avgPassAccuracy = Math.round(totalAccuracy / chartData.length);
    const totalShots = chartData.reduce((acc, curr) => acc + curr.shotsTotal, 0);
    const totalOnTarget = chartData.reduce((acc, curr) => acc + curr.shotsOnTarget, 0);
    const totalKeyPasses = chartData.reduce((acc, curr) => acc + curr.keyPasses, 0);

    return {
      goals,
      assists,
      avgPassAccuracy,
      totalShots,
      totalOnTarget,
      totalKeyPasses
    };
  }, [chartData]);

  const CustomChartTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#0c1424] border border-white/10 rounded-2xl p-4 shadow-2xl text-right min-w-[200px] space-y-2">
          <div className="pb-1.5 border-b border-white/5">
            <span className="text-xs font-black text-white">{data.opponentText}</span>
          </div>
          <div className="space-y-1 text-xs">
            {activeChart === 'goals' && (
              <>
                <div className="flex justify-between items-center text-emerald-400">
                  <span className="font-mono font-bold text-gray-100">{data.goals}</span>
                  <span>الأهداف المسجلة:</span>
                </div>
                <div className="flex justify-between items-center text-emerald-500/80">
                  <span className="font-mono font-bold text-gray-100">{data.xG}</span>
                  <span>الأهداف المتوقعة xG:</span>
                </div>
                <div className="flex justify-between items-center text-primary">
                  <span className="font-mono font-bold text-gray-100">{data.assists}</span>
                  <span>التمريرات الحاسمة:</span>
                </div>
              </>
            )}

            {activeChart === 'shots' && (
              <>
                <div className="flex justify-between items-center text-amber-400">
                  <span className="font-mono font-bold text-gray-100">{data.shotsTotal}</span>
                  <span>إجمالي التسديدات:</span>
                </div>
                <div className="flex justify-between items-center text-[#ff8042]">
                  <span className="font-mono font-bold text-gray-100">{data.shotsOnTarget}</span>
                  <span>تسديدات على المرمى:</span>
                </div>
                <div className="flex justify-between items-center text-emerald-400">
                  <span className="font-mono font-bold text-gray-100">{data.shotsAccuracy}%</span>
                  <span>دقة التسديد:</span>
                </div>
              </>
            )}

            {activeChart === 'passes' && (
              <>
                <div className="flex justify-between items-center text-sky-400">
                  <span className="font-mono font-bold text-gray-100">{data.passesAttempted}</span>
                  <span>التمريرات الكلية:</span>
                </div>
                <div className="flex justify-between items-center text-sky-500">
                  <span className="font-mono font-bold text-gray-100">{data.passesCompleted}</span>
                  <span>التمريرات الناجحة:</span>
                </div>
                <div className="flex justify-between items-center text-emerald-400">
                  <span className="font-mono font-bold text-gray-100">{data.passAccuracy}%</span>
                  <span>دقة التمرير:</span>
                </div>
                <div className="flex justify-between items-center text-indigo-400">
                  <span className="font-mono font-bold text-gray-100">{data.keyPasses}</span>
                  <span>تمريرات مفتاحية:</span>
                </div>
              </>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[32px] p-6 space-y-6 text-right" style={{ direction: 'rtl' }}>
      
      {/* Title & Secondary Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-white/5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-black text-white">إحصائيات الأداء التفصيلية ومخططات الأثر</h3>
          </div>
          <p className="text-xs text-slate-400">رسومات بيانية تفاعلية تحلل تمركز اللاعب، صناعة اللعب والفاعلية الهجومية.</p>
        </div>

        {/* Dynamic Inner Tab Toggles */}
        <div className="flex p-1 bg-[#0b1324] rounded-2xl border border-white/5 space-x-1 shrink-0 self-start" style={{ direction: 'ltr' }}>
          <button
            onClick={() => setActiveChart('passes')}
            className={`px-3 py-1.5 text-xs font-black rounded-xl transition-all ${
              activeChart === 'passes' ? 'bg-[#00c49f] text-[#060b13]' : 'text-slate-400 hover:text-white'
            }`}
          >
            التمريرات وصناعة اللعب
          </button>
          <button
            onClick={() => setActiveChart('shots')}
            className={`px-3 py-1.5 text-xs font-black rounded-xl transition-all ${
              activeChart === 'shots' ? 'bg-[#ffbb28] text-[#060b13]' : 'text-slate-400 hover:text-white'
            }`}
          >
            التسديدات والمحاولات
          </button>
          <button
            onClick={() => setActiveChart('goals')}
            className={`px-3 py-1.5 text-xs font-black rounded-xl transition-all ${
              activeChart === 'goals' ? 'bg-[#0088fe] text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            الأهداف والفاعلية الهجومية
          </button>
        </div>
      </div>

      {/* Grid of micro-KPI badges based on selected chart */}
      {activeChart === 'goals' && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-4 text-center">
            <div className="text-[10px] text-blue-400 font-bold mb-1">إجمالي الأهداف بالدورة</div>
            <div className="text-xl font-black text-white font-mono">{summary.goals}</div>
          </div>
          <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 text-center">
            <div className="text-[10px] text-emerald-400 font-bold mb-1">التمريرات الحاسمة الكلية</div>
            <div className="text-xl font-black text-white font-mono">{summary.assists}</div>
          </div>
          <div className="bg-purple-500/5 border border-purple-500/10 rounded-2xl p-4 text-center">
            <div className="text-[10px] text-purple-400 font-bold mb-1">الرقم المتوقع للأهداف xG</div>
            <div className="text-xl font-black text-white font-mono">
              {(chartData.reduce((sum, current) => sum + current.xG, 0)).toFixed(2)}
            </div>
          </div>
        </div>
      )}

      {activeChart === 'shots' && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 text-center">
            <div className="text-[10px] text-amber-400 font-bold mb-1">إجمالي التسديدات</div>
            <div className="text-xl font-black text-white font-mono">{summary.totalShots}</div>
          </div>
          <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-4 text-center">
            <div className="text-[10px] text-[#ff8042] font-bold mb-1">التسديد على المرمى</div>
            <div className="text-xl font-black text-white font-mono">{summary.totalOnTarget}</div>
          </div>
          <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 text-center">
            <div className="text-[10px] text-emerald-400 font-bold mb-1">دقة المحاولات الكلية</div>
            <div className="text-xl font-black text-white font-mono">
              {summary.totalShots > 0 ? Math.round((summary.totalOnTarget / summary.totalShots) * 100) : 0}%
            </div>
          </div>
        </div>
      )}

      {activeChart === 'passes' && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-teal-500/5 border border-teal-500/10 rounded-2xl p-4 text-center">
            <div className="text-[10px] text-[#00c49f] font-bold mb-1">دقة التمرير العامة</div>
            <div className="text-xl font-black text-white font-mono">{summary.avgPassAccuracy}%</div>
          </div>
          <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-4 text-center">
            <div className="text-[10px] text-indigo-400 font-bold mb-1">تمريرات مفتاحية (خلق فرص)</div>
            <div className="text-xl font-black text-white font-mono">{summary.totalKeyPasses}</div>
          </div>
          <div className="bg-[#0088fe]/5 border border-[#0088fe]/10 rounded-2xl p-4 text-center">
            <div className="text-[10px] text-sky-400 font-bold mb-1">متوسط التمرير لمباراة</div>
            <div className="text-xl font-black text-white font-mono">
              {Math.round(chartData.reduce((acc, current) => acc + current.passesAttempted, 0) / chartData.length)}
            </div>
          </div>
        </div>
      )}

      {/* Main Recharts Area */}
      <div className="w-full h-72 md:h-80 bg-slate-950/20 rounded-2xl p-3 border border-white/[0.03]" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          {activeChart === 'goals' ? (
            <ComposedChart data={chartData} margin={{ top: 15, right: 10, left: -25, bottom: 5 }}>
              <defs>
                <linearGradient id="gGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0088fe" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#0088fe" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="aGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00c49f" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00c49f" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="opponent" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 'auto']} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.01)' }} />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
              
              <Area type="monotone" name="الأهداف المتوقعة xG" dataKey="xG" fill="url(#gGrad)" stroke="#0088fe" strokeWidth={2.5} />
              <Bar name="الأهداف المسجلة" dataKey="goals" fill="#00c49f" barSize={14} radius={[4, 4, 0, 0]} />
              <Line type="monotone" name="التمريرات الحاسمة" dataKey="assists" stroke="#ffbb28" strokeWidth={2} dot={{ r: 3 }} />
            </ComposedChart>
          ) : activeChart === 'shots' ? (
            <ComposedChart data={chartData} margin={{ top: 15, right: 10, left: -25, bottom: 5 }}>
              <defs>
                <linearGradient id="shotsTotalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ffbb28" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#ffbb28" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="opponent" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.01)' }} />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              
              <Area yAxisId="left" type="monotone" name="إجمالي التسديدات" dataKey="shotsTotal" fill="url(#shotsTotalGrad)" stroke="#ffbb28" strokeWidth={2} />
              <Bar yAxisId="left" name="تسديدات على المرمى" dataKey="shotsOnTarget" fill="#ff8042" barSize={12} radius={[3, 3, 0, 0]} />
              <Line yAxisId="right" type="monotone" name="دقة التسديد %" dataKey="shotsAccuracy" stroke="#00c49f" strokeWidth={2.5} dot={{ r: 4 }} />
            </ComposedChart>
          ) : (
            <ComposedChart data={chartData} margin={{ top: 15, right: 10, left: -25, bottom: 5 }}>
              <defs>
                <linearGradient id="pGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00c49f" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00c49f" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="opponent" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.01)' }} />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              
              <Area yAxisId="left" type="monotone" name="التمريرات الناجحة" dataKey="passesCompleted" fill="url(#pGrad)" stroke="#00c49f" strokeWidth={2} />
              <Bar yAxisId="left" name="تمريرات مفتاحية" dataKey="keyPasses" fill="#8884d8" barSize={8} radius={[2, 2, 0, 0]} />
              <Line yAxisId="right" type="monotone" name="دقة التمرير %" dataKey="passAccuracy" stroke="#0088fe" strokeWidth={2} dot={{ r: 3 }} />
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Dynamic bottom analysis */}
      <div className="bg-slate-950/45 p-4 rounded-2xl border border-white/[0.04] flex items-start gap-3 text-right">
        <Sparkles className="text-amber-400 shrink-0 mt-0.5 animate-pulse" size={16} />
        <div className="space-y-1">
          <h4 className="text-xs font-black text-slate-100">تحليل الأداء التفسيري</h4>
          <p className="text-[11px] text-slate-400 leading-normal font-bold">
            {activeChart === 'goals' && (
              `يتضح فاعلية اللاعب الهجومية بمطابقة أهدافه الحقيقية والبالغة (${summary.goals}) مع نسبة الأهداف المتوقعة، ليعكس نجاحاً مميزاً في ترجمة الفرص السانحة وتحت الضغط التكتيكي.`
            )}
            {activeChart === 'shots' && (
              `بمعدل تسديد بلغ (${summary.totalShots}) محاولة هجومية، يبرز اللاعب رغبة قوية في توجيه الكرات نحو شباك المنافس مع إظهار دقة إصابة في التسديدات بنسبة دقيقة تدعم الخطط الهجومية للفريق.`
            )}
            {activeChart === 'passes' && (
              `يمثل اللاعب محطة صناعة لعب متميزة من خلال توجيه تمريرات هامة بدقة بلغت (${summary.avgPassAccuracy}%) بجانب تنفيذ عدد يبلغ (${summary.totalKeyPasses}) تمريرة مفتاحية مؤثرة لزملائه في الثلث الأخير.`
            )}
          </p>
        </div>
      </div>

    </div>
  );
}
