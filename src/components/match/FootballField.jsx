import React from 'react';
import PlayerCircle from './PlayerCircle';

export default function FootballField({ homeXI, awayXI, homeFormation = "4-3-3", awayFormation = "4-2-3-1" }) {
  
  // Helper to parse formations like "4-3-3" or "4-2-3-1" into an array of integers
  const parseFormation = (formationStr) => {
    if (!formationStr) return [4, 3, 3];
    const parts = formationStr.split('-').map(Number);
    if (parts.some(isNaN)) return [4, 3, 3];
    return parts;
  };

  // Function to assign absolute coordinates (x%, y%) on a 100x100 canvas grid
  const calculatePositions = (players, formationStr, isHome) => {
    if (!players || players.length === 0) return [];
    
    const elements = [...players];
    const positions = [];

    // 1. Locate and position Goalkeeper (always GK)
    const gkIdx = elements.findIndex(p => p.position === 'GK');
    let goalkeeper = null;
    if (gkIdx !== -1) {
      goalkeeper = elements.splice(gkIdx, 1)[0];
    } else {
      goalkeeper = elements.shift(); // fallback first element
    }

    // GK Coordinate based on team side
    positions.push({
      player: goalkeeper,
      x: 50,
      y: isHome ? 88 : 12
    });

    // 2. Distribute remaining players based on formation chunks
    const formationLines = parseFormation(formationStr);
    const lineCount = formationLines.length;

    // Define depth vertical bands depending on Home (bottom up) vs Away (top down)
    // Home depth ranges from y=75 (defense) to y=52 (attacks)
    // Away depth ranges from y=25 (defense) to y=48 (attacks)
    const homeDepths = [74, 62, 53, 45]; // staggered depth rows
    const awayDepths = [26, 38, 47, 55]; // staggered depth rows for opposing team

    let playerPointer = 0;
    formationLines.forEach((count, lineIdx) => {
      // Depth coord
      const y = isHome 
        ? (homeDepths[lineIdx] || (75 - (lineIdx * 10)))
        : (awayDepths[lineIdx] || (25 + (lineIdx * 10)));

      // Horizontal spacing distributed evenly across 100% width
      for (let i = 0; i < count; i++) {
        if (playerPointer >= elements.length) break;
        
        const currentPlr = elements[playerPointer++];
        const step = 100 / (count + 1);
        const x = step * (i + 1);

        positions.push({
          player: currentPlr,
          x,
          y
        });
      }
    });

    // Any remaining players if any left over due to wrong formation sum
    while (playerPointer < elements.length) {
      const currentPlr = elements[playerPointer++];
      positions.push({
        player: currentPlr,
        x: 30 + (playerPointer * 10) % 40,
        y: isHome ? 50 : 50
      });
    }

    return positions;
  };

  const homePositions = calculatePositions(homeXI, homeFormation, true);
  const awayPositions = calculatePositions(awayXI, awayFormation, false);

  return (
    <div className="relative w-full overflow-hidden select-none" dir="rtl">
      {/* Visual Pitch Outer Container */}
      <div className="relative w-full aspect-[3/4] max-w-[500px] mx-auto bg-gradient-to-b from-[#155e37] via-[#166534] to-[#14532d] border-[3px] border-white/20 rounded-[32px] shadow-2xl overflow-hidden p-2">
        
        {/* Playfield Markings Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Outer Boundary line */}
          <div className="absolute inset-4 border border-white/10 rounded-[20px]" />

          {/* Center spot with circle */}
          <div className="absolute top-1/2 left-1/2 w-20 h-20 -translate-x-1/2 -translate-y-1/2 border border-white/10 rounded-full" />
          <div className="absolute top-1/2 left-1/2 w-2 h-2 -translate-x-1/2 -translate-y-1/2 bg-white/15 rounded-full" />
          
          {/* Halfway line */}
          <div className="absolute top-1/2 inset-x-4 h-[1px] bg-white/10" />

          {/* Goal Box (Top - Away Penalty Area) */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[60%] h-[18%] border-b border-x border-white/10">
            {/* Goal circle arc */}
            <div className="absolute bottom-[-16px] left-1/2 -translate-x-1/2 w-14 h-8 border-b border-x border-white/10 rounded-b-full" />
            {/* Penalty spot */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white/20 rounded-full" />
            {/* Inside Goal Keeper Area */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[40%] h-[35%] border-b border-x border-white/10" />
          </div>

          {/* Goal Box (Bottom - Home Penalty Area) */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[60%] h-[18%] border-t border-x border-white/10">
            {/* Goal circle arc */}
            <div className="absolute top-[-16px] left-1/2 -translate-x-1/2 w-14 h-8 border-t border-x border-white/10 rounded-t-full" />
            {/* Penalty spot */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white/20 rounded-full" />
            {/* Inside Goal Keeper Area */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[40%] h-[35%] border-t border-x border-white/10" />
          </div>

          {/* Corner arcs */}
          <div className="absolute top-4 left-4 w-4 h-4 border-b border-r border-white/10 rounded-br-full" />
          <div className="absolute top-4 right-4 w-4 h-4 border-b border-l border-white/10 rounded-bl-full" />
          <div className="absolute bottom-4 left-4 w-4 h-4 border-t border-r border-white/10 rounded-tr-full" />
          <div className="absolute bottom-4 right-4 w-4 h-4 border-t border-l border-white/10 rounded-tl-full" />
        </div>

        {/* Tactical Positions Container for Player Badges */}
        <div className="absolute inset-0">
          
          {/* AWAY PLAYERS (Top Half) */}
          {awayPositions.map(({ player, x, y }) => (
            <div 
              key={`away-${player.id}-${player.number}`}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <PlayerCircle player={player} isHome={false} />
            </div>
          ))}

          {/* HOME PLAYERS (Bottom Half) */}
          {homePositions.map(({ player, x, y }) => (
            <div 
              key={`home-${player.id}-${player.number}`}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <PlayerCircle player={player} isHome={true} />
            </div>
          ))}

        </div>

      </div>

      {/* Quick visual tactics indicators */}
      <div className="max-w-[500px] mx-auto mt-4 px-4 flex justify-between items-center text-xs font-bold text-gray-400">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          تشكيل صاحب الأرض: <b className="text-white bg-white/5 py-0.5 px-2 rounded-md">{homeFormation}</b>
        </span>
        <span className="flex items-center gap-1">
          تشكيل الضيف: <b className="text-white bg-white/5 py-0.5 px-2 rounded-md">{awayFormation}</b>
          <span className="w-2 h-2 rounded-full bg-teal-500" />
        </span>
      </div>
    </div>
  );
}
