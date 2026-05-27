import React from 'react';
import { motion } from 'motion/react';
import { Trophy, Globe } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const FLAG_MAP = {
  'الدوري الإسباني': '🇪🇸',
  'الدوري السعودي': '🇸🇦',
  'الدوري الإنجليزي': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'دوري أبطال أوروبا': '🇪🇺',
  'دوري الأبطال': '🇪🇺'
};

export default function HorizontalLeagueList({ leagues = [], selectedLeague, onSelect }) {
  const { theme } = useTheme();
  const isDark = theme.mode === 'dark';

  // Extract a fallback label/emoji based on league name
  const getLeagueIconOrEmoji = (name) => {
    return FLAG_MAP[name] || FLAG_MAP[name.trim()] || '🏆';
  };

  return (
    <div className="w-full space-y-2.5 select-none" style={{ direction: 'rtl' }}>
      <div className="flex items-center justify-between px-1">
        <div className={`flex items-center gap-1.5 text-xs font-black ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
          <Trophy size={14} className="text-secondary" />
          <span>تصفح الدوريات المفضلة</span>
        </div>
        <span className={`text-[10px] font-bold font-mono ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
          {leagues.length} دوريات متاحة
        </span>
      </div>

      <div className="flex overflow-x-auto gap-3 pb-3 pt-0.5 px-1 scrollbar-none no-scrollbar snap-x touch-pan-x">
        {/* 'All' / الجميع option at the front */}
        <motion.button
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect(null)}
          className={`flex items-center gap-2 px-5 py-3 rounded-full text-xs font-black transition-all duration-300 border backdrop-blur-md cursor-pointer snap-start shrink-0 select-none ${
            selectedLeague === null
              ? 'bg-primary/20 border-primary text-primary shadow-lg shadow-primary/10'
              : isDark
                ? 'bg-surface/50 border-border/40 text-gray-400 hover:text-white hover:border-gray-500'
                : 'bg-surface/80 border-border/70 text-slate-600 hover:text-slate-950 hover:border-slate-400'
          }`}
        >
          <Globe size={14} className={selectedLeague === null ? 'animate-spin-slow text-primary' : isDark ? 'text-gray-400' : 'text-slate-500'} />
          <span>الجميع</span>
        </motion.button>

        {leagues.map((league) => {
          const isSelected = selectedLeague === league.name;
          return (
            <motion.button
              key={league.id || league.name}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelect(league.name)}
              className={`flex items-center gap-2.5 px-5 py-3 rounded-full text-xs font-black transition-all duration-300 border backdrop-blur-md cursor-pointer snap-start shrink-0 select-none ${
                isSelected
                  ? 'bg-primary/20 border-primary text-primary shadow-lg shadow-primary/10'
                  : isDark
                    ? 'bg-surface/50 border-border/40 text-gray-400 hover:text-white hover:border-gray-500'
                    : 'bg-surface/80 border-border/70 text-slate-600 hover:text-slate-950 hover:border-slate-400'
              }`}
            >
              <span className="text-base select-none">{getLeagueIconOrEmoji(league.name)}</span>
              <span>{league.name}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
