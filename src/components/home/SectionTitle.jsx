import React from 'react';
import { motion } from 'motion/react';

export default function SectionTitle({ title, icon: Icon, badge, subtitle }) {
  return (
    <div className="flex flex-col gap-1.5 select-none border-r-4 border-primary pr-4 my-2" style={{ direction: 'rtl' }}>
      <div className="flex items-center gap-2.5">
        {Icon && <Icon className="text-primary w-5 h-5 shrink-0" />}
        <h2 className="text-base md:text-lg font-black text-[color:var(--color-text)] tracking-tight">{title}</h2>
        {badge !== undefined && badge !== null && (
          <span className="text-[10px] font-black text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
            {badge}
          </span>
        )}
      </div>
      {subtitle && (
        <span className="text-[11px] text-slate-500 dark:text-gray-400 font-bold leading-normal pr-0.5">
          {subtitle}
        </span>
      )}
    </div>
  );
}
