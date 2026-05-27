import React, { useMemo, useState } from 'react';
import { Match } from '../types';
import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  ZAxis,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Flame } from 'lucide-react';

interface TacticalHeatmapViewProps {
  match: Match;
}

// Generate organic heatmap points.
function generateHeatmapPoints(teamType: 'home' | 'away', hashSeed: number) {
  const points = [];
  const numPoints = 180;
  
  const rng = (seed: number) => {
    let s = seed % 2147483647;
    return () => {
      s = s * 16807 % 2147483647;
      return (s - 1) / 2147483646;
    };
  };
  const random = rng(hashSeed || 12345);

  for (let i = 0; i < numPoints; i++) {
    const cluster = random();
    let x = 0, y = 0, value = 0;
    
    // x: 0 to 120 (length of pitch)
    // y: 0 to 80 (width of pitch)
    // Left to right orientation.
    if (teamType === 'home') {
      if (cluster < 0.25) { 
        x = 10 + random() * 30; y = 10 + random() * 60; value = 20 + random() * 50;
      } else if (cluster < 0.6) {
        x = 40 + random() * 40; y = 15 + random() * 50; value = 30 + random() * 60;
      } else if (cluster < 0.85) {
        x = 60 + random() * 40; y = cluster % 2 === 0 ? random() * 20 : 60 + random() * 20; value = 40 + random() * 50;
      } else {
        x = 90 + random() * 25; y = 25 + random() * 30; value = 50 + random() * 50;
      }
    } else {
      if (cluster < 0.25) { 
        x = 80 + random() * 30; y = 10 + random() * 60; value = 20 + random() * 50;
      } else if (cluster < 0.6) {
        x = 40 + random() * 40; y = 15 + random() * 50; value = 30 + random() * 60;
      } else if (cluster < 0.85) {
        x = 20 + random() * 40; y = cluster % 2 === 0 ? random() * 20 : 60 + random() * 20; value = 40 + random() * 50;
      } else {
        x = 5 + random() * 25; y = 25 + random() * 30; value = 50 + random() * 50;
      }
    }
    
    x += (random() - 0.5) * 10;
    y += (random() - 0.5) * 10;

    x = Math.max(0, Math.min(120, x));
    y = Math.max(0, Math.min(80, y));

    points.push({ x, y, value });
  }
  return points;
}

export default function TacticalHeatmapView({ match }: TacticalHeatmapViewProps) {
  const [selectedTeam, setSelectedTeam] = useState<'home' | 'away'>('home');
  
  let hash = 0;
  const keyStr = match.homeTeam + match.awayTeam + match.id;
  for (let i = 0; i < keyStr.length; i++) {
    hash = keyStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash);

  const activeData = useMemo(() => generateHeatmapPoints(selectedTeam, hash), [selectedTeam, hash]);

  if (match.status === 'UPCOMING') {
    return (
      <div className="py-20 text-center space-y-5" style={{ direction: 'rtl' }}>
        <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mx-auto shadow-lg">
          <Flame size={32} className="text-gray-400" />
        </div>
        <div className="space-y-2">
          <p className="text-white font-black text-lg">البيانات غير متاحة</p>
          <p className="text-gray-400 font-bold text-xs max-w-sm mx-auto px-4 leading-relaxed">
            ستتوفر الخريطة الحرارية بمجرد انطلاق المباراة.
          </p>
        </div>
      </div>
    );
  }

  const pitchColor = "#112211"; 
  const pitchLines = "rgba(255,255,255,0.2)";

  return (
    <div className="space-y-6" style={{ direction: 'rtl' }}>
      
      {/* Team Selection */}
      <div className="flex bg-[#0e1622]/60 p-1.5 rounded-2xl border border-white/10 w-fit mx-auto shadow-xl">
        <button
          onClick={() => setSelectedTeam('home')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
            selectedTeam === 'home' 
              ? 'bg-primary text-black shadow-lg scale-100' 
              : 'text-gray-400 hover:text-white hover:bg-white/5 scale-95'
          }`}
        >
          {match.homeLogo && <img src={match.homeLogo} alt="" className="w-5 h-5 object-contain" />}
          <span>{match.homeTeam}</span>
        </button>
        <button
          onClick={() => setSelectedTeam('away')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
            selectedTeam === 'away' 
              ? 'bg-primary text-black shadow-lg scale-100' 
              : 'text-gray-400 hover:text-white hover:bg-white/5 scale-95'
          }`}
        >
          {match.awayLogo && <img src={match.awayLogo} alt="" className="w-5 h-5 object-contain" />}
          <span>{match.awayTeam}</span>
        </button>
      </div>

      {/* Heatmap Area */}
      <div className="bg-[#0e1622]/40 border border-white/5 p-4 sm:p-6 rounded-3xl relative backdrop-blur-sm shadow-xl select-none">
        <div className="flex items-center justify-between mb-6 px-2">
          <div className="flex items-center gap-2">
            <Flame size={16} className="text-orange-500" />
            <h3 className="text-sm font-black text-white">الخريطة الحرارية للتحركات</h3>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold">
            <span>مناطق دفاعية</span>
            <div className="w-16 h-1 bg-gradient-to-l from-orange-500 to-transparent rounded-full mx-1" />
            <span>مناطق هجومية</span>
          </div>
        </div>

        {/* Pitch Area */}
        <div 
          className="relative w-full max-w-4xl mx-auto rounded-lg overflow-hidden ring-1 ring-white/10"
          style={{ aspectRatio: "1.5 / 1", backgroundColor: pitchColor }}
        >
          {/* Pitch Markings */}
          <div className="absolute inset-0 pointer-events-none p-2">
            <div className="relative w-full h-full border-[1.5px]" style={{ borderColor: pitchLines }}>
              {/* Halves line */}
              <div className="absolute top-0 bottom-0 left-1/2 w-[1.5px] -ml-[0.75px]" style={{ backgroundColor: pitchLines }} />
              {/* Center Circle */}
              <div className="absolute top-1/2 left-1/2 w-[20%] aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px]" style={{ borderColor: pitchLines }} />
              <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 -mt-[3px] -ml-[3px] rounded-full" style={{ backgroundColor: pitchLines }} />

              {/* Left Penalty Area */}
              <div className="absolute top-[20%] bottom-[20%] left-0 w-[18%] border-[1.5px] border-l-0" style={{ borderColor: pitchLines }} />
              <div className="absolute top-[35%] bottom-[35%] left-0 w-[6%] border-[1.5px] border-l-0" style={{ borderColor: pitchLines }} />
              <div className="absolute top-1/2 left-[12%] w-1.5 h-1.5 -mt-[3px] rounded-full" style={{ backgroundColor: pitchLines }} />
              {/* Penalty Arc Left */}
              <div className="absolute top-1/2 left-[18%] w-[8%] aspect-square -translate-y-1/2 rounded-full border-[1.5px] clip-right" style={{ borderColor: pitchLines, clipPath: 'inset(0 0 0 50%)' }} />

              {/* Right Penalty Area */}
              <div className="absolute top-[20%] bottom-[20%] right-0 w-[18%] border-[1.5px] border-r-0" style={{ borderColor: pitchLines }} />
              <div className="absolute top-[35%] bottom-[35%] right-0 w-[6%] border-[1.5px] border-r-0" style={{ borderColor: pitchLines }} />
              <div className="absolute top-1/2 right-[12%] w-1.5 h-1.5 -mt-[3px] rounded-full" style={{ backgroundColor: pitchLines }} />
              {/* Penalty Arc Right */}
              <div className="absolute top-1/2 right-[18%] w-[8%] aspect-square -translate-y-1/2 rounded-full border-[1.5px] clip-left" style={{ borderColor: pitchLines, clipPath: 'inset(0 50% 0 0)' }} />
              
              {/* Corner Arcs */}
              <div className="absolute top-0 left-0 w-3 h-3 border-b-[1.5px] border-r-[1.5px] rounded-br-[100%]" style={{ borderColor: pitchLines }} />
              <div className="absolute top-0 right-0 w-3 h-3 border-b-[1.5px] border-l-[1.5px] rounded-bl-[100%]" style={{ borderColor: pitchLines }} />
              <div className="absolute bottom-0 left-0 w-3 h-3 border-t-[1.5px] border-r-[1.5px] rounded-tr-[100%]" style={{ borderColor: pitchLines }} />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-t-[1.5px] border-l-[1.5px] rounded-tl-[100%]" style={{ borderColor: pitchLines }} />
            </div>
          </div>

          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <XAxis type="number" dataKey="x" domain={[0, 120]} hide />
              <YAxis type="number" dataKey="y" domain={[0, 80]} hide reversed />
              <ZAxis type="number" dataKey="value" range={[500, 2500]} />
              <Scatter data={activeData}>
                {activeData.map((entry, index) => {
                  const intensity = entry.value / 100;
                  // Color gradient from yellow to dark red/orange based on intensity
                  let color = '#facc15'; // yellow (low)
                  if (intensity > 0.8) color = '#ff3300';
                  else if (intensity > 0.5) color = '#ff7700';

                  const opacity = 0.2 + intensity * 0.4;

                  return (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={color} 
                      fillOpacity={opacity} 
                      style={{ filter: 'blur(10px) saturate(1.5)' }} 
                    />
                  );
                })}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 flex justify-between px-4 text-[10px] text-gray-500 font-bold tracking-widest text-[#00ffa2]">
          <span>{selectedTeam === 'home' ? '[ يسار = دفاع ]' : '[ يمين = دفاع ]'}</span>
          <span>{selectedTeam === 'home' ? '[ يمين = هجوم ]' : '[ يسار = هجوم ]'}</span>
        </div>
      </div>
    </div>
  );
}
