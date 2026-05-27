import React from 'react';
import { motion } from 'motion/react';
import { ChevronRight, Shield, Award, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PlayerHeader({ header }) {
  const navigate = useNavigate();

  if (!header) return null;

  return (
    <div className="relative w-full overflow-hidden rounded-[32px] bg-slate-900/40 backdrop-blur-xl border border-white/5 p-6 md:p-8" style={{ direction: 'rtl' }}>
      {/* Absolute Ambient Glow */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 mb-6 select-none">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(-1)}
          className="flex items-center justify-center p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 transition-all cursor-pointer"
        >
          <ChevronRight size={18} />
        </motion.button>
        <span className="text-xs text-gray-400 font-bold">الرئيسية</span>
        <span className="text-xs text-gray-500">/</span>
        <span 
          onClick={() => navigate(`/team/${encodeURIComponent(header.team)}`)}
          className="text-xs text-gray-400 font-bold hover:text-primary transition-colors cursor-pointer"
        >
          {header.team}
        </span>
        <span className="text-xs text-gray-500">/</span>
        <span className="text-xs text-primary font-black">{header.name}</span>
      </div>

      {/* Main Details Frame */}
      <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-right">
        
        {/* Player Avatar Wrapper with interactive Ring */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-slate-950/60 p-2 border-2 border-white/10 flex items-center justify-center shadow-2xl relative group overflow-hidden shrink-0"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-transparent to-secondary/10 opacity-100" />
          <img
            src={header.photo}
            alt={header.name}
            className="w-full h-full rounded-full object-cover relative z-10"
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(header.name)}`;
            }}
          />
        </motion.div>

        {/* Info detail labels block */}
        <div className="space-y-3.5 flex-1 min-w-0">
          <div className="flex flex-col md:flex-row md:items-center md:gap-3.5 justify-center md:justify-start">
            <h1 className="text-xl md:text-3xl font-black text-white tracking-tight drop-shadow-sm flex items-center justify-center md:justify-start gap-2">
              <span>{header.name}</span>
              <Sparkles size={16} className="text-amber-400 animate-pulse shrink-0 hidden md:inline-block" />
            </h1>

            {/* Jersey number layout */}
            <span className="self-center md:self-auto text-xs font-black text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full mt-2 md:mt-0 shadow-sm shrink-0 font-mono tracking-tight">
              رقم قميص النادي: {header.number}#
            </span>
          </div>

          {/* Connected Club block */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-bold text-gray-400">
            <div 
              onClick={() => navigate(`/team/${encodeURIComponent(header.team)}`)}
              className="flex items-center gap-2 bg-white/5 border border-white/5 px-3 py-2 rounded-xl cursor-pointer hover:bg-white/10 hover:border-primary/20 transition-all group"
            >
              <img 
                src={header.teamLogo} 
                alt={header.team} 
                className="w-5 h-5 rounded-full object-cover bg-white/10 p-0.5 group-hover:scale-105 transition-all"
                onError={(e) => {
                  e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(header.team)}`;
                }}
              />
              <span className="group-hover:text-white transition-colors">{header.team}</span>
            </div>
            
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/5 px-3 py-2 rounded-xl">
              <Shield size={14} className="text-primary" />
              <span>المركز: {header.position}</span>
            </div>

            <div className="flex items-center gap-1.5 bg-white/5 border border-white/5 px-3 py-2 rounded-xl">
              <Award size={14} className="text-amber-400" />
              <span>نجم كورة لايف 🌟</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
