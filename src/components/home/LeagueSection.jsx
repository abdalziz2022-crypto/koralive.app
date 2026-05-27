import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronUp, TableProperties, Trophy, EyeOff, ArrowLeftRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMatches } from '../../context/MatchContext';
import MatchCard from '../MatchCard';
import StandingsView from '../StandingsView';

export default function LeagueSection({ leagueName, leagueLogo, matches = [] }) {
  const [showStandings, setShowStandings] = useState(false);
  const navigate = useNavigate();
  const { leagues } = useMatches();

  // Highlight/lookup league key to matching id
  const foundLeague = leagues?.find(l => l.name === leagueName);
  const leagueId = foundLeague ? foundLeague.id : encodeURIComponent(leagueName);

  const handleLeaguePageNavigation = (e) => {
    e.stopPropagation();
    navigate(`/league/${leagueId}`);
  };

  // Get first match teams for highlights inside StandingsView
  const firstMatch = matches[0] || {};

  return (
    <div className="bg-surface/30 backdrop-blur-md border border-border/40 rounded-[28px] overflow-hidden shadow-xl" style={{ direction: 'rtl' }}>
      {/* League Section Header */}
      <div 
        onClick={() => setShowStandings(!showStandings)}
        className="flex items-center justify-between p-4 bg-surface/50 border-b border-border/40 cursor-pointer select-none hover:bg-surface/80 transition-all duration-300"
      >
        <div 
          onClick={handleLeaguePageNavigation}
          className="flex items-center gap-3 cursor-pointer group/title"
          title="عرض صفحة الدوري بالكامل"
        >
          <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 p-1.5 flex items-center justify-center shrink-0 shadow-inner group-hover/title:border-primary/40 group-hover/title:scale-105 transition-all">
            <img 
              src={leagueLogo || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(leagueName)}`} 
              alt={leagueName} 
              className="w-full h-full object-contain rounded-full"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="gray" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>';
              }}
            />
          </div>
          <div className="flex flex-col">
            <h3 className="text-sm md:text-base font-black text-[color:var(--color-text)] group-hover/title:text-primary transition-colors flex items-center gap-1.5">
              <span>{leagueName}</span>
              <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded font-black opacity-0 group-hover/title:opacity-100 transition-opacity">تفاصيل الدوري ⬅</span>
            </h3>
            <span className="text-[10px] text-slate-500 dark:text-gray-400 font-bold leading-none pr-0.5">
              منافسة كرة قدم
            </span>
          </div>
        </div>

        {/* Standings Button and Chevron */}
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowStandings(!showStandings);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              showStandings 
                ? 'bg-primary/20 text-primary border border-primary/30' 
                : 'bg-surface border border-border text-[color:var(--color-text)] hover:bg-surface-hover transition-all'
            }`}
          >
            {showStandings ? (
              <>
                <EyeOff size={13} />
                <span>إغلاق الترتيب</span>
              </>
            ) : (
              <>
                <TableProperties size={13} />
                <span>ترتيب الدوري</span>
              </>
            )}
          </button>
          <div className="text-slate-500 dark:text-gray-400 p-1 rounded-lg bg-surface border border-border hover:text-[color:var(--color-text)]">
            {showStandings ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>
      </div>

      {/* Standings Table Collapsible Area */}
      <AnimatePresence initial={false}>
        {showStandings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="overflow-hidden border-b border-border/20 bg-background/30 px-4 py-6"
          >
            <StandingsView 
              leagueName={leagueName} 
              homeTeam={firstMatch.homeTeam} 
              awayTeam={firstMatch.awayTeam} 
              homeLogo={firstMatch.homeLogo} 
              awayLogo={firstMatch.awayLogo} 
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Match Cards List */}
      <div className="p-4 md:p-6 grid gap-4 grid-cols-1 md:grid-cols-2">
        {matches.map((match) => (
          <div key={match.id} className="relative">
            <MatchCard match={match} />
          </div>
        ))}
      </div>
    </div>
  );
}
