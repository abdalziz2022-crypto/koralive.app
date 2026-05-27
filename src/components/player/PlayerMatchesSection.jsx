import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CalendarRange } from 'lucide-react';
import MatchCard from '../MatchCard';

export default function PlayerMatchesSection({ matches }) {
  return (
    <div className="space-y-4" style={{ direction: 'rtl' }}>
      {/* Section Title */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-base font-black text-white flex items-center gap-2">
          <CalendarRange size={18} className="text-primary" />
          <span>المباريات الأخيرة والنشطة للاعب</span>
        </h2>
        <span className="text-[10px] text-gray-400 font-bold">آخر {matches?.length || 0} مواجهات</span>
      </div>

      {/* Grid List */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <AnimatePresence mode="popLayout">
          {matches && matches.length > 0 ? (
            matches.map((match, index) => (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.3) }}
                className="relative animate-fade-in"
              >
                <MatchCard match={match} />
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center bg-slate-900/10 border border-white/5 rounded-3xl">
              <span className="text-3xl block mb-2">⚽</span>
              <p className="text-xs text-gray-500 font-bold leading-normal">
                لا تتوفر أي مباريات منتهية أو قادمة لهذا اللاعب حالياً.
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
