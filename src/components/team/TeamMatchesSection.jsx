import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CalendarClock, History } from 'lucide-react';
import MatchCard from '../MatchCard';

export default function TeamMatchesSection({ matchesObj }) {
  const [activeTab, setActiveTab] = useState('upcoming');

  const { upcoming = [], recent = [] } = matchesObj || {};

  const tabs = [
    { id: 'upcoming', label: 'المباريات القادمة', count: upcoming.length, icon: CalendarClock },
    { id: 'recent', label: 'النتائج والمباريات الأخيرة', count: recent.length, icon: History }
  ];

  const currentList = activeTab === 'upcoming' ? upcoming : recent;

  return (
    <div className="space-y-5" style={{ direction: 'rtl' }}>
      {/* Mini Segment Tabs */}
      <div className="flex bg-slate-950/40 p-1 rounded-2xl border border-white/5 gap-1 select-none">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const IconComponent = tab.icon;
          return (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                isActive
                  ? 'bg-primary/20 text-primary border border-primary/30 shadow-lg shadow-primary/5'
                  : 'text-gray-400 hover:text-white border border-transparent'
              }`}
            >
              <IconComponent size={14} />
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
          {currentList.length > 0 ? (
            currentList.map((match, index) => (
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
                <span className="text-3xl">📅</span>
                <p className="text-xs text-gray-500 font-bold leading-normal">
                  لا توجد مباريات مجدولة حالياً في هذا القسم.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
