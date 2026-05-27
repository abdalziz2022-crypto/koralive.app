import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Radio, CalendarClock, History, Layers } from 'lucide-react';
import MatchCard from '../MatchCard';

export default function LeagueMatchesSection({ matchesObj }) {
  const [activeTab, setActiveTab] = useState('all');

  const { live = [], finished = [], upcoming = [], all = [] } = matchesObj || {};

  const tabs = [
    { id: 'all', label: 'جميع المباريات', count: all.length, icon: Layers },
    { id: 'live', label: 'مباشر الآن', count: live.length, icon: Radio, animateColor: 'text-red-500' },
    { id: 'upcoming', label: 'القادمة', count: upcoming.length, icon: CalendarClock },
    { id: 'finished', label: 'المنتهية', count: finished.length, icon: History }
  ];

  const getFilteredMatches = () => {
    switch (activeTab) {
      case 'live': return live;
      case 'upcoming': return upcoming;
      case 'finished': return finished;
      default: return all;
    }
  };

  const renderedMatches = getFilteredMatches();

  return (
    <div className="space-y-6" style={{ direction: 'rtl' }}>
      {/* Tab Switcher Headers */}
      <div className="flex bg-slate-950/40 p-1 rounded-2xl border border-white/5 overflow-x-auto scrollbar-none gap-1 select-none">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const IconComponent = tab.icon;
          return (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-primary/20 text-primary border border-primary/30 shadow-lg shadow-primary/5'
                  : 'text-gray-400 hover:text-white border border-transparent'
              }`}
            >
              <IconComponent size={14} className={isActive && tab.animateColor ? 'animate-pulse text-primary' : ''} />
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-primary/20 text-primary' : 'bg-white/5 text-gray-500'
                }`}>
                  {tab.count}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Rendered Matches List */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <AnimatePresence mode="popLayout">
          {renderedMatches.length > 0 ? (
            renderedMatches.map((match, index) => (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.3) }}
                className="relative"
              >
                <MatchCard match={match} />
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full py-12 text-center"
            >
              <div className="max-w-xs mx-auto space-y-3">
                <span className="text-4xl">⚽</span>
                <p className="text-xs text-gray-400 font-bold leading-normal">
                  لا تتوفر أي مباريات حالياً في هذا القسم.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
