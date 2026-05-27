import React from 'react';
import { motion } from 'motion/react';
import { ChevronRight, Globe, Shield, Landmark } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TeamHeader({ team }) {
  const navigate = useNavigate();

  if (!team) return null;

  return (
    <div className="relative w-full overflow-hidden rounded-[32px] bg-slate-900/40 backdrop-blur-xl border border-white/5 p-6 md:p-8" style={{ direction: 'rtl' }}>
      {/* Absolute Ambient Glow */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Breadcrumb / Back Navigation */}
      <div className="flex items-center gap-2 mb-6 select-none animate-fade-in">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/')}
          className="flex items-center justify-center p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 transition-all cursor-pointer"
        >
          <ChevronRight size={18} />
        </motion.button>
        <span className="text-xs text-gray-400 font-bold">الرئيسية</span>
        <span className="text-xs text-gray-500">/</span>
        <span className="text-xs text-primary font-black">{team.name}</span>
      </div>

      {/* Flex row with team logo & info */}
      <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-right">
        {/* Team Logo Frame with Inner Shadow */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-slate-950/60 p-4 border border-white/10 flex items-center justify-center shadow-2xl relative group overflow-hidden shrink-0"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent opacity-100 transition-all duration-300" />
          <img
            src={team.logo}
            alt={team.name}
            className="w-full h-full object-contain filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.4)]"
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(team.name)}`;
            }}
          />
        </motion.div>

        {/* Text descriptions */}
        <div className="space-y-3.5 flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 justify-center sm:justify-start">
            <h1 className="text-xl md:text-3xl font-black text-white tracking-tight drop-shadow-sm truncate">
              {team.name}
            </h1>
            <span className="self-center sm:self-auto text-[10px] font-black text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full mt-2 sm:mt-0 shadow-sm shrink-0">
              نادي كرة قدم محترف
            </span>
          </div>

          {/* Metadata pill list */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs font-bold text-gray-400">
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/5 px-3 py-1.5 rounded-xl">
              <Globe size={14} className="text-gray-400" />
              <span>البلد: {team.country}</span>
            </div>
            
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/5 px-3 py-1.5 rounded-xl">
              <Shield size={14} className="text-gray-400" />
              <span>البطولة: {team.competition}</span>
            </div>

            {team.stadium && (
              <div className="flex items-center gap-1.5 bg-white/5 border border-white/5 px-3 py-1.5 rounded-xl">
                <Landmark size={14} className="text-gray-400" />
                <span>الملعب: {team.stadium}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
