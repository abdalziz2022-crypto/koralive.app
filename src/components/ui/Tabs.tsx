import React from 'react';
import { motion } from 'motion/react';

export interface TabItem {
  id: string;
  label: string;
  badge?: number | string;
}

interface TabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}

export default function Tabs({
  items,
  activeId,
  onChange,
  className = '',
}: TabsProps) {
  return (
    <div className={`flex items-center gap-1 overflow-x-auto scrollbar-none border-b border-border/10 pb-0.5 select-none ${className}`}>
      {items.map((tab) => {
        const isActive = activeId === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className="relative flex items-center gap-1.5 px-4.5 py-3 text-xs font-black whitespace-nowrap transition-colors focus:outline-none"
          >
            <span className={isActive ? 'text-primary' : 'text-gray-400 group-hover:text-gray-200'}>
              {tab.label}
            </span>
            
            {tab.badge !== undefined && (
              <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded-md font-mono ${
                isActive ? 'bg-primary/20 text-primary' : 'bg-surface hover:bg-surface-hover text-gray-400'
              }`}>
                {tab.badge}
              </span>
            )}

            {isActive && (
              <motion.div
                layoutId="active-tab-line"
                className="absolute bottom-0 inset-x-0 h-0.5 bg-primary"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
