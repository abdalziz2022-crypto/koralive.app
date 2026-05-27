import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useMatches } from '../../context/MatchContext';
import { Search, Bell, Sun, Moon, Database } from 'lucide-react';
import { motion } from 'motion/react';

export default function HomeHeader() {
  const { theme, updateTheme } = useTheme();
  const { activeProvider, changeProvider } = useMatches();

  const toggleTheme = () => {
    updateTheme({ mode: theme.mode === 'dark' ? 'light' : 'dark' });
  };

  const isDark = theme.mode === 'dark';

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-background/70 border-b border-border/45 transition-all duration-300 shadow-lg shadow-black/5">
      <div className="max-w-7xl mx-auto px-4 h-18 flex items-center justify-between">
        {/* Left Side: Buttons (Theme, Notifications, Search, Provider) */}
        <div className="flex items-center gap-2.5">
          {/* Provider Switcher */}
          <div className="hidden sm:flex items-center gap-2 bg-surface/80 border border-border/60 rounded-xl px-3 py-1.5 shadow-sm hover:border-primary/45 transition-all">
            <Database size={13} className="text-primary" />
            <select
              value={activeProvider}
              onChange={(e) => changeProvider(e.target.value)}
              className={`bg-transparent text-xs font-black focus:outline-none cursor-pointer pr-1 transition-colors ${isDark ? 'text-gray-300' : 'text-slate-700'}`}
            >
              <option value="footballdata" className={isDark ? "bg-[#0b0e14] text-gray-200" : "bg-white text-slate-800"}>Football-Data</option>
              <option value="sportmonks" className={isDark ? "bg-[#0b0e14] text-gray-200" : "bg-white text-slate-800"}>Sportmonks</option>
              <option value="apifootball" className={isDark ? "bg-[#0b0e14] text-gray-200" : "bg-white text-slate-800"}>API-Football</option>
            </select>
          </div>

          {/* Theme Toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            className={`p-2.5 rounded-xl bg-surface/80 border border-border/60 transition-all cursor-pointer shadow-sm ${
              isDark ? 'text-gray-400 hover:text-white hover:border-gray-500/50' : 'text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} className="text-indigo-500" />}
          </motion.button>

          {/* Notifications Placeholder */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`p-2.5 rounded-xl bg-surface/80 border border-border/60 transition-all relative cursor-pointer shadow-sm group ${
              isDark ? 'text-gray-400 hover:text-white hover:border-gray-500/50' : 'text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
            onClick={() => alert('إشعارات كورة لايف مفعّلة عبر المتصفح 🔔')}
          >
            <Bell size={17} />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary animate-pulse" />
          </motion.button>

          {/* Search Placeholder */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`p-2.5 rounded-xl bg-surface/80 border border-border/60 transition-all cursor-pointer shadow-sm ${
              isDark ? 'text-gray-400 hover:text-white hover:border-gray-500/50' : 'text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
            onClick={() => {
              const el = document.getElementById('search-input');
              if (el) {
                el.focus();
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }}
          >
            <Search size={17} />
          </motion.button>
        </div>

        {/* Right Side: Logo with Brand name */}
        <div className="flex items-center gap-3 select-none">
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black uppercase text-primary tracking-widest px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
                مباشر
              </span>
              <h1 className={`text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r tracking-tight font-sans transition-all duration-300 ${
                isDark ? 'from-white via-gray-100 to-gray-400' : 'from-slate-900 via-slate-800 to-indigo-950'
              }`}>
                كورة<span className="text-primary">لايف</span>
              </h1>
            </div>
            <span className={`text-[8px] font-extrabold font-mono tracking-widest leading-none mt-0.5 ${
              isDark ? 'text-gray-500' : 'text-slate-400'
            }`}>
              KORALIVE
            </span>
          </div>

          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
            className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-emerald-400 flex items-center justify-center shadow-lg shadow-primary/20 border border-white/10"
          >
            {/* Minimal soccer ball design */}
            <svg
              className="w-6 h-6 text-black"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
              <path d="M2 12h20" />
            </svg>
          </motion.div>
        </div>
      </div>
    </header>
  );
}
