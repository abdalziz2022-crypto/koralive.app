import React, { useMemo } from 'react';
import { Users, Shield, Award, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SquadSection({ players }) {
  const navigate = useNavigate();
  // Group players by position
  const groupedPlayers = useMemo(() => {
    if (!Array.isArray(players)) return {};
    
    return players.reduce((acc, player) => {
      let posGroup = 'أخرى';
      const pos = player.position || '';
      
      if (pos.includes('حارس') || pos.includes('مرمى') || pos.includes('GK')) {
        posGroup = 'حراس المرمى';
      } else if (pos.includes('مدافع') || pos.includes('الدفاع') || pos.includes('ظهير') || pos.includes('DF')) {
        posGroup = 'خط الدفاع';
      } else if (pos.includes('وسط') || pos.includes('الوسط') || pos.includes('صانع') || pos.includes('MF')) {
        posGroup = 'خط الوسط';
      } else if (pos.includes('مهاجم') || pos.includes('الهجوم') || pos.includes('جناح') || pos.includes('FW')) {
        posGroup = 'خط الهجوم';
      }
      
      if (!acc[posGroup]) acc[posGroup] = [];
      acc[posGroup].push(player);
      return acc;
    }, {});
  }, [players]);

  const positionKeys = ['حراس المرمى', 'خط الدفاع', 'خط الوسط', 'خط الهجوم', 'أخرى'];

  return (
    <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[32px] p-6 space-y-6" style={{ direction: 'rtl' }}>
      {/* Title */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-primary animate-pulse" />
          <h2 className="text-sm font-black text-white">قائمة تشكيلة الفريق</h2>
        </div>
        <span className="text-[10px] text-gray-400 font-mono">الموسم الحالي</span>
      </div>

      {players && players.length > 0 ? (
        <div className="space-y-6">
          {positionKeys.map((key) => {
            const list = groupedPlayers[key];
            if (!list || list.length === 0) return null;

            return (
              <div key={key} className="space-y-3.5">
                {/* Position Group Header */}
                <h3 className="text-xs font-black text-primary/80 bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/10 inline-block">
                  {key}
                </h3>

                {/* Player Row Card List */}
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                  {list.map((player) => (
                    <div 
                      key={player.id} 
                      onClick={() => navigate(`/player/${encodeURIComponent(player.name)}`)}
                      className="flex items-center justify-between p-3.5 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.04] transition-all duration-300 group cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Jersey Shirt Number Circular Badge */}
                        <div className="w-8 h-8 rounded-xl bg-slate-950/80 border border-white/10 flex items-center justify-center font-black text-xs text-primary group-hover:border-primary/40 group-hover:bg-primary/10 tracking-tight transition-all shrink-0">
                          {player.number}
                        </div>

                        {/* Player name / Nationality details */}
                        <div className="min-w-0 space-y-0.5">
                          <span className="text-xs font-extrabold text-gray-200 group-hover:text-white transition-colors block truncate">
                            {player.name}
                          </span>
                          <span className="text-[9px] text-gray-500 font-bold block">
                            الجنسية: {player.nationality}
                          </span>
                        </div>
                      </div>

                      <div className="text-[10px] bg-white/5 border border-white/5 px-2.5 py-1 rounded-lg text-gray-400 font-black shrink-0">
                        {player.position}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-12 text-center text-xs text-gray-400 font-bold select-none">
          لقائمة اللاعبين غير متوفرة حالياً.
        </div>
      )}
    </div>
  );
}
