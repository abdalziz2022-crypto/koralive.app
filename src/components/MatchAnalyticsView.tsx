import React, { useMemo } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine,
  CartesianGrid,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { motion } from 'motion/react';
import { Activity, Percent, Target } from 'lucide-react';
import { Match } from '../types';

interface MatchAnalyticsViewProps {
  match: Match;
}

interface AnalyticsDataPoint {
  minute: number;
  homePossession: number;
  awayPossession: number;
  homePressure: number;
  awayPressure: number;
}

// Generate data to simulate possession and pressure over the 90 minutes
function generateAnalyticsData(match: Match): AnalyticsDataPoint[] {
  let hash = 0;
  const keyStr = match.homeTeam + match.awayTeam + match.id;
  for (let i = 0; i < keyStr.length; i++) {
    hash = keyStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash);

  const data: AnalyticsDataPoint[] = [];
  
  // Base possession based on score to give slight advantage to the winning team
  const scoreDiff = (match.homeScore || 0) - (match.awayScore || 0);
  let currentHomePossession = 50 + (scoreDiff * 2);
  currentHomePossession = Math.max(30, Math.min(70, currentHomePossession));

  for (let m = 0; m <= 90; m++) {
    // Smooth possession transition with occasional swings
    const possessionSwing = Math.sin(m * 0.1 + (hash % 10)) * 5 + Math.cos(m * 0.05) * 3;
    let homePossession = currentHomePossession + possessionSwing;
    homePossession = Math.max(20, Math.min(80, homePossession)); // Keep it somewhat realistic
    
    // Simulate pressure independently of possession (e.g. counter-attacking teams might have low possession but high pressure spikes)
    const homePressureWave = Math.sin(m * 0.15 + (hash % 7)) * 20 + Math.cos(m * 0.08) * 15;
    const awayPressureWave = Math.cos(m * 0.12 + (hash % 5)) * 20 + Math.sin(m * 0.06) * 15;
    
    let homePressure = 30 + homePressureWave + (homePossession > 50 ? 20 : 0);
    let awayPressure = 30 + awayPressureWave + ((100 - homePossession) > 50 ? 20 : 0);
    
    homePressure = Math.max(0, Math.min(100, homePressure));
    awayPressure = Math.max(0, Math.min(100, awayPressure));

    data.push({
      minute: m,
      homePossession: Math.round(homePossession),
      awayPossession: 100 - Math.round(homePossession),
      homePressure: Math.round(homePressure),
      awayPressure: Math.round(awayPressure)
    });
  }

  return data;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#121926]/90 border border-white/10 p-3 rounded-xl shadow-xl backdrop-blur-md" style={{ direction: 'rtl' }}>
        <p className="text-white font-bold text-xs mb-2">الدقيقة {label}'</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4 text-[10px] font-black mb-1">
            <span style={{ color: entry.color }}>{entry.name}</span>
            <span className="text-white">{entry.value}%</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function MatchAnalyticsView({ match }: MatchAnalyticsViewProps) {
  const data = useMemo(() => generateAnalyticsData(match), [match]);

  if (match.status === 'UPCOMING') {
    return (
      <div className="py-20 text-center space-y-5" style={{ direction: 'rtl' }}>
        <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mx-auto shadow-lg">
          <Activity size={32} className="text-gray-400" />
        </div>
        <div className="space-y-2">
          <p className="text-white font-black text-lg">البيانات غير متاحة</p>
          <p className="text-gray-400 font-bold text-xs max-w-sm mx-auto px-4 leading-relaxed">
            ستتوفر رسومات الاستحواذ والضغط بمجرد انطلاق المباراة.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8" style={{ direction: 'rtl' }}>
      
      {/* Possession Chart */}
      <div className="bg-[#0e1622]/40 border border-white/5 p-4 rounded-3xl relative backdrop-blur-sm shadow-xl select-none">
        <div className="flex items-center gap-2 mb-6 px-2">
          <Percent size={16} className="text-primary" />
          <h3 className="text-sm font-black text-white">تطور الاستحواذ خلال المباراة</h3>
        </div>
        
        <div className="w-full h-56 sm:h-64 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
            >
              <defs>
                <linearGradient id="colorHomePossession" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00ffa2" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#00ffa2" stopOpacity={0.2}/>
                </linearGradient>
                <linearGradient id="colorAwayPossession" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fa9f15" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#fa9f15" stopOpacity={0.2}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis 
                dataKey="minute" 
                stroke="#6b7280" 
                fontSize={10} 
                tickLine={false}
                axisLine={false}
                ticks={[0, 15, 30, 45, 60, 75, 90]}
                unit="'"
              />
              <YAxis 
                stroke="#6b7280" 
                fontSize={10} 
                tickLine={false}
                axisLine={false}
                domain={[0, 100]}
                tickFormatter={(val) => `${val}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
              <ReferenceLine x={45} stroke="rgba(255,255,255,0.2)" strokeDasharray="3 3" />
              <Area 
                type="monotone" 
                stackId="1"
                dataKey="awayPossession" 
                name={`استحواذ ${match.awayTeam}`} 
                stroke="#fa9f15" 
                fillOpacity={1} 
                fill="url(#colorAwayPossession)" 
              />
              <Area 
                type="monotone" 
                stackId="1"
                dataKey="homePossession" 
                name={`استحواذ ${match.homeTeam}`} 
                stroke="#00ffa2" 
                fillOpacity={1} 
                fill="url(#colorHomePossession)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pressure Chart */}
      <div className="bg-[#0e1622]/40 border border-white/5 p-4 rounded-3xl relative backdrop-blur-sm shadow-xl select-none">
        <div className="flex items-center gap-2 mb-6 px-2">
          <Target size={16} className="text-secondary" />
          <h3 className="text-sm font-black text-white">حدة الضغط الهجومي (Pressure Intensity)</h3>
        </div>
        
        <div className="w-full h-56 sm:h-64 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis 
                dataKey="minute" 
                stroke="#6b7280" 
                fontSize={10} 
                tickLine={false}
                axisLine={false}
                ticks={[0, 15, 30, 45, 60, 75, 90]}
                unit="'"
              />
              <YAxis 
                stroke="#6b7280" 
                fontSize={10} 
                tickLine={false}
                axisLine={false}
                domain={[0, 100]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
              <ReferenceLine x={45} stroke="rgba(255,255,255,0.2)" strokeDasharray="3 3" />
              <Line 
                type="monotone" 
                dataKey="homePressure" 
                name={`ضغط ${match.homeTeam}`} 
                stroke="#00ffa2" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="awayPressure" 
                name={`ضغط ${match.awayTeam}`} 
                stroke="#fa9f15" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
