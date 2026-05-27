import React, { useMemo, useState } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine,
  CartesianGrid
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  Info, 
  ChevronLeft, 
  ChevronRight, 
  Flame, 
  Zap, 
  Swords,
  Award
} from 'lucide-react';
import { Match } from '../types';
import { generateMatchEvents, TimelineEvent } from './TimelineView';

interface MatchMomentumViewProps {
  match: Match;
}

interface MomentumDataPoint {
  minute: number;
  value: number; // Positive for Home, Negative for Away (-100 to 100)
  event?: TimelineEvent;
  homePressure: number; // 0 to 100 display
  awayPressure: number; // 0 to 100 display
}

// Generate premium, continuous, smooth pressure fluctuations with deterministic peaks
export function generateMomentumData(match: Match, events: TimelineEvent[]): MomentumDataPoint[] {
  let hash = 0;
  const keyStr = match.homeTeam + match.awayTeam + match.id;
  for (let i = 0; i < keyStr.length; i++) {
    hash = keyStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash);

  const data: MomentumDataPoint[] = [];
  
  // Find key event minutes to build pressure waves around
  const eventMap = new Map<number, TimelineEvent>();
  events.forEach(ev => {
    if (ev.type !== 'milestone') {
      eventMap.set(ev.minute, ev);
    }
  });

  // Generate 90 continuous data points Representing minute-by-minute tactical momentum
  for (let m = 0; m <= 90; m++) {
    // 1. Generate elegant underlying continuous wave using multiple sine frequencies and match meta hash
    const wave1 = Math.sin(m * 0.15 + (hash % 10)) * 25;
    const wave2 = Math.cos(m * 0.07 - (hash % 5)) * 18;
    const wave3 = Math.sin(m * 0.35 + (hash % 3)) * 8;
    
    // Smooth trend that slightly benefits the ultimate home or away final scoreline
    const scoreDiff = (match.homeScore || 0) * 8 - (match.awayScore || 0) * 8;
    const generalBias = scoreDiff + Math.sin(m * 0.03 + (hash % 7)) * 15;

    let baseValue = wave1 + wave2 + wave3 + generalBias;

    // 2. Overlay extreme tactical spikes around exact event minutes
    // Check if there is an event matching within a +/- 4-minute window
    let localizedSpike = 0;
    eventMap.forEach((ev, evMin) => {
      const distance = Math.abs(m - evMin);
      if (distance <= 4) {
        let direction = ev.team === 'home' ? 1 : -1;
        if (ev.type === 'var' && ev.varType === 'cancelled') {
          // If a goal got cancelled, momentum drops/swings to the other team
          direction = ev.team === 'home' ? -1 : 1;
        }

        // Determine gravity/intensity of events
        let eventIntensity = 40; // Default for normal subs/cards
        if (ev.type === 'goal') {
          eventIntensity = 95;
        } else if (ev.type === 'red_card') {
          eventIntensity = 75; // Severe penalty
        } else if (ev.type === 'var') {
          eventIntensity = 60;
        }

        // Gaussian-like smooth decay around the event peak minute
        const factor = Math.exp(-Math.pow(distance, 2) / 3.5);
        localizedSpike += direction * eventIntensity * factor;
      }
    });

    // Merge baseline and spikes, and clamp to maximum pressure thresholds of -100 to 100
    let value = baseValue + localizedSpike;
    value = Math.max(-100, Math.min(100, value));

    // Calculate isolated pressure values (for display boxes)
    const homePressure = value > 0 ? Math.round(value) : Math.round(Math.max(5, 10 + Math.sin(m * 0.2) * 8));
    const awayPressure = value < 0 ? Math.round(Math.abs(value)) : Math.round(Math.max(5, 12 + Math.cos(m * 0.25) * 6));

    data.push({
      minute: m,
      value: Math.round(value),
      homePressure,
      awayPressure,
      event: eventMap.get(m)
    });
  }

  return data;
}

const EmptyTooltip = (props: any) => null;

export default function MatchMomentumView({ match }: MatchMomentumViewProps) {
  const events = useMemo(() => generateMatchEvents(match), [match]);
  const momentumData = useMemo(() => generateMomentumData(match, events), [match, events]);

  const [hoveredData, setHoveredData] = useState<MomentumDataPoint | null>(null);

  // Statistics Summary counts
  const statistics = useMemo(() => {
    let homeDominanceMinutes = 0;
    let awayDominanceMinutes = 0;
    let maxHomePressure = 0;
    let maxAwayPressure = 0;

    momentumData.forEach(pt => {
      if (pt.value > 0) {
        homeDominanceMinutes++;
        if (pt.value > maxHomePressure) maxHomePressure = pt.value;
      } else if (pt.value < 0) {
        awayDominanceMinutes++;
        if (Math.abs(pt.value) > maxAwayPressure) maxAwayPressure = Math.abs(pt.value);
      }
    });

    const totalMinutes = 91;
    const homeShare = Math.round((homeDominanceMinutes / totalMinutes) * 100);
    const awayShare = 100 - homeShare;

    return {
      homeShare,
      awayShare,
      maxHomePressure,
      maxAwayPressure
    };
  }, [momentumData]);

  if (match.status === 'UPCOMING') {
    return (
      <div className="py-20 text-center space-y-5" style={{ direction: 'rtl' }}>
        <div className="w-20 h-20 bg-[#0e2217]/60 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto shadow-[0_4px_24px_rgba(0,255,130,0.06)]">
          <TrendingUp size={32} className="text-primary animate-pulse" />
        </div>
        <div className="space-y-2">
          <p className="text-white font-black text-lg">بانتظار انطلاق اللقاء</p>
          <p className="text-gray-400 font-bold text-xs max-w-sm mx-auto px-4 leading-relaxed">
            سيتم استعراض منحنى الضغط والزخم التكتيكي المباشر (Match Momentum) بمجرد بدء المباراة وتحديث أحداثها دقيقة بدقيقة 📈
          </p>
        </div>
      </div>
    );
  }

  // Helper for generating state tag text based on momentum intensity
  const getMomentumTag = (val: number) => {
    const absVal = Math.abs(val);
    if (absVal < 15) return 'تكافؤ مطلق وشد وجذب في المنتصف ⚔️';
    if (val > 0) {
      if (absVal > 70) return `هجوم شامل وضغط كاسح لـ ${match.homeTeam} 🔥`;
      if (absVal > 40) return `أفضلية هجومية وسيطرة واضحة لـ ${match.homeTeam} 📈`;
      return `استحواذ وهدوء نسبي لـ ${match.homeTeam} ⚽`;
    } else {
      if (absVal > 70) return `هجوم شامل وضغط كاسح لـ ${match.awayTeam} 🔥`;
      if (absVal > 40) return `أفضلية هجومية وسيطرة واضحة لـ ${match.awayTeam} 📈`;
      return `استحواذ وهدوء نسبي لـ ${match.awayTeam} ⚽`;
    }
  };

  return (
    <div className="space-y-6" style={{ direction: 'rtl' }}>
      
      {/* Tab Header description */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="text-primary animate-bounce animate-duration-1000" size={18} />
          <h3 className="text-sm font-black text-white">تحليل زخم وضغط المباراة الحي</h3>
        </div>
        <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1.5 bg-white/5 px-2.5 py-1.5 rounded-xl border border-white/5 select-none">
          <Swords size={11} className="text-emerald-500" />
          الزخم التكتيكي (دقائق الضغط)
        </span>
      </div>

      {/* Mini overview of Teams current momentum state */}
      <div className="grid grid-cols-2 gap-4">
        
        {/* Home Side pressure indicators */}
        <div className="bg-gradient-to-br from-[#0e2217]/30 to-[#070b12] border border-emerald-500/10 p-4 rounded-2xl flex items-center justify-between relative overflow-hidden select-none hover:border-emerald-500/20 transition-all duration-300">
          <div className="space-y-1 z-10">
            <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">سيطرة {match.homeTeam}</span>
            <div className="font-mono text-xl font-black text-white leading-none tracking-tight pt-1">
              {statistics.homeShare}%
            </div>
            <p className="text-[9px] text-gray-400">من إجمالي وقت المباراة</p>
          </div>
          <Flame size={24} className="text-primary/20 shrink-0" />
          {/* subtle background glow */}
          <div className="absolute -right-10 -bottom-10 w-24 h-24 bg-primary/5 rounded-full filter blur-2xl pointer-events-none" />
        </div>

        {/* Away Side pressure indicators */}
        <div className="bg-gradient-to-br from-[#22170e]/30 to-[#070b12] border border-amber-500/10 p-4 rounded-2xl flex items-center justify-between relative overflow-hidden select-none hover:border-amber-500/20 transition-all duration-300">
          <div className="space-y-1 z-10">
            <span className="text-[10px] font-black uppercase text-secondary tracking-wider font-extrabold">سيطرة {match.awayTeam}</span>
            <div className="font-mono text-xl font-black text-white leading-none tracking-tight pt-1">
              {statistics.awayShare}%
            </div>
            <p className="text-[9px] text-gray-400">من إجمالي وقت المباراة</p>
          </div>
          <Zap size={24} className="text-secondary/20 shrink-0" />
          {/* subtle background glow */}
          <div className="absolute -left-10 -bottom-10 w-24 h-24 bg-secondary/5 rounded-full filter blur-2xl pointer-events-none" />
        </div>

      </div>

      {/* CORE MOMENTUM CHART CONTAINER */}
      <div className="bg-[#0e1622]/40 border border-white/5 p-4 rounded-3xl relative backdrop-blur-sm shadow-xl select-none">
        
        {/* Quick labels for top & bottom */}
        <div className="absolute top-4 left-4 right-4 flex justify-between text-[9px] text-gray-500 uppercase font-black pointer-events-none z-10">
          <span className="text-emerald-400/80">▲ ضغط {match.homeTeam} (المستضيف)</span>
          <span className="text-secondary/80">▼ ضغط {match.awayTeam} (الضيف)</span>
        </div>

        {/* Height configuration ensures neat aspect ratio on mobile */}
        <div className="w-full h-56 sm:h-64 mt-6">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={momentumData}
              margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
              onMouseMove={(state: any) => {
                if (state && state.activePayload && state.activePayload[0]) {
                  setHoveredData(state.activePayload[0].payload as MomentumDataPoint);
                }
              }}
              onMouseLeave={() => setHoveredData(null)}
            >
              <defs>
                {/* Home Gradient - Emerald hue */}
                <linearGradient id="homeMomentumGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00ffa2" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#00ffa2" stopOpacity={0.0} />
                </linearGradient>

                {/* Away Gradient - Golden Amber / Secondary hue */}
                <linearGradient id="awayMomentumGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fa9f15" stopOpacity={0.0} />
                  <stop offset="95%" stopColor="#fa9f15" stopOpacity={0.4} />
                </linearGradient>
              </defs>

              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="rgba(255,255,255,0.03)" 
                vertical={false} 
              />
              
              <XAxis 
                dataKey="minute" 
                stroke="#4b5563" 
                fontSize={10} 
                tickLine={false}
                axisLine={false}
                ticks={[0, 15, 30, 45, 60, 75, 90]}
                unit="'"
                dy={8}
                fontFamily="JetBrains Mono, monospace"
              />

              <YAxis 
                hide 
                domain={[-100, 100]} 
              />

              {/* Zero Reference Line in the center */}
              <ReferenceLine 
                y={0} 
                stroke="rgba(255,255,255,0.1)" 
                strokeWidth={1.5}
                strokeDasharray="4 4"
              />

              {/* Left/Halftime whistle reference barrier */}
              <ReferenceLine 
                x={45} 
                stroke="rgba(255,255,255,0.15)" 
                strokeWidth={1}
              />

              {/* Area for Home Momentum (Value > 0) */}
              <Area
                type="monotone"
                dataKey={(d) => d.value > 0 ? d.value : 0}
                stroke="#00ffa2"
                strokeWidth={1.5}
                fillOpacity={1}
                fill="url(#homeMomentumGlow)"
                animationDuration={800}
                connectNulls
              />

              {/* Area for Away Momentum (Value < 0) */}
              <Area
                type="monotone"
                dataKey={(d) => d.value < 0 ? d.value : 0}
                stroke="#fa9f15"
                strokeWidth={1.5}
                fillOpacity={1}
                fill="url(#awayMomentumGlow)"
                animationDuration={800}
                connectNulls
              />

              {/* Custom tooltip helper overlay blocker without DOM attribute warnings */}
              <Tooltip 
                content={<EmptyTooltip />} 
                cursor={{ stroke: 'rgba(255,255,255,0.15)', strokeWidth: 1, strokeDasharray: '2 2' }} 
              />

            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Floating Interactive Legend Overlay */}
        <div className="flex items-center justify-center gap-6 mt-2 text-[10px] text-gray-400 font-bold select-none border-t border-white/5 pt-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-1.5 rounded-full bg-primary" />
            <span>نبض {match.homeTeam}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-1.5 rounded-full bg-secondary" />
            <span>نبض {match.awayTeam}</span>
          </div>
          <div className="h-3 w-[1px] bg-white/10" />
          <span className="text-[9px] text-gray-500 font-medium font-sans">مرر الماوس أو المس للاستكشاف</span>
        </div>

      </div>

      {/* DYNAMIC HOVER CARD / ACTIVE STATUS CARD */}
      <AnimatePresence mode="wait">
        <motion.div
          key={hoveredData ? hoveredData.minute : 'steady'}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
          className="bg-[#121926]/50 border border-white/5 p-4 rounded-2xl relative select-none"
        >
          {hoveredData ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="bg-primary/10 border border-primary/20 text-primary px-3 py-1 rounded-xl text-[10px] font-black font-sans">
                  الدقيقة {hoveredData.minute}'
                </span>
                
                {/* Specific Score or Value Tag */}
                <div className="text-left">
                  <span className="text-[10px] text-gray-400 font-black">
                    مستوى الزخم: <span className="font-mono text-white tracking-wider font-extrabold">{Math.abs(hoveredData.value)}/100</span>
                  </span>
                </div>
              </div>

              {/* Description status */}
              <p className="text-xs font-black text-gray-200">
                {getMomentumTag(hoveredData.value)}
              </p>

              {/* Highlight Event details if hovering directly over an event minute */}
              {hoveredData.event && (
                <div className="bg-white/5 p-3 rounded-xl border border-white/5 flex items-center gap-3 animate-pulse">
                  <div className="text-lg">
                    {hoveredData.event.type === 'goal' ? '⚽' :
                     hoveredData.event.type === 'yellow_card' ? '🟨' :
                     hoveredData.event.type === 'red_card' ? '🟥' : '🔄'}
                  </div>
                  <div>
                    <span className="text-[9px] text-primary uppercase font-black tracking-wider block">
                      حدث في هذه الدقيقة!
                    </span>
                    <span className="text-xs font-black text-white">
                      {hoveredData.event.player} - {hoveredData.event.detail || hoveredData.event.type === 'goal' ? 'تم تسجيل هدف!' : ''}
                    </span>
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="flex gap-3 items-center">
              <Info className="text-gray-500 shrink-0" size={16} />
              <div className="text-right">
                <span className="text-[10px] text-gray-400 font-black block">نظام التتبع الذكي للزخم</span>
                <p className="text-[11px] text-gray-400 font-medium">
                  مرر مؤشر الماوس فوق أي دقيقة على طول المخطط البياني في الأعلى لعرض مستوى ضغط الاستحواذ والهجمات التفصيلية للفريقين.
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Match key momentum high-points */}
      <div className="bg-[#121926]/20 border border-white/5 rounded-2xl p-4 space-y-3 select-none">
        <h4 className="text-[11px] font-black text-white flex items-center gap-1.5 uppercase tracking-wide">
          <Award size={13} className="text-emerald-500" />
          تحليل الزخم لأبرز فترات اللقاء
        </h4>

        <div className="space-y-2 text-xs text-gray-400 leading-relaxed font-bold">
          <p className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>
              سجلت الدقائق الأولى هيمنة تكتيكية سريعة بفضل الاستحواذ العالي وبناء اللعب المدروس في خط الوسط.
            </span>
          </p>
          <p className="flex items-start gap-2">
            <span className="text-secondary">•</span>
            <span>
              تم رصد أعلى قمة ضغط هجومي مباشرة قبيل تسجيل الأهداف، حيث انعكس التهديد العالي بزيادة الضغط بنسبة تفوق 75% على حارس مرمى الفريق المنافس.
            </span>
          </p>
        </div>
      </div>

    </div>
  );
}
