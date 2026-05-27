import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LucideIcon } from 'lucide-react';

export interface NavItem {
  id: string;
  name: string;
  icon: LucideIcon;
  onClick: () => void;
  badge?: number | string;
}

interface BottomNavProps {
  items: NavItem[];
  activeId: string;
  className?: string;
}

export default function BottomNav({
  items,
  activeId,
  className = '',
}: BottomNavProps) {
  return (
    <nav className={`fixed bottom-0 inset-x-0 z-50 glass border-t border-border/10 py-2.5 px-4 shadow-[0_-8px_30px_rgb(0,0,0,0.12)] md:rounded-t-[2.5rem] md:max-w-xl md:mx-auto md:mb-4 md:border ${className}`}>
      <ul className="flex items-center justify-around w-full">
        {items.map((item) => {
          const isActive = activeId === item.id;
          const Icon = item.icon;
          
          return (
            <li key={item.id} className="relative">
              <button 
                onClick={item.onClick}
                className="flex flex-col items-center gap-1 group px-3.5 py-1.5 rounded-2xl transition-all duration-300 focus:outline-none"
              >
                <div className={`relative p-1 rounded-lg transform ${isActive ? 'scale-110 text-primary' : 'text-gray-400 group-hover:text-gray-200'} transition-all duration-300`}>
                  <Icon className="w-5 h-5 animate-none group-hover:animate-pulse" />
                  
                  {item.badge && (
                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                    </span>
                  )}
                  
                  {isActive && (
                    <motion.div 
                      layoutId="active-bottom-nav-indicator" 
                      className="absolute -inset-1.5 bg-primary/10 rounded-xl -z-10" 
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </div>
                <span className={`text-[10px] font-semibold tracking-tight ${isActive ? 'text-primary font-bold' : 'text-gray-400 group-hover:text-gray-300'} transition-colors duration-200`}>
                  {item.name}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
