import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'live' | 'success' | 'warning' | 'info' | 'muted' | 'danger';
  className?: string;
  pulse?: boolean;
}

export default function Badge({
  children,
  variant = 'info',
  className = '',
  pulse = false,
}: BadgeProps) {
  const baseStyles = 'inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black tracking-tight rounded-full uppercase leading-none select-none border';
  
  const variants = {
    live: 'bg-[#00DF82]/10 text-primary border-[#00DF82]/20 font-black',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    info: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    muted: 'bg-white/5 text-gray-400 border-border/5',
    danger: 'bg-rose-500/10 text-[#f43f5e] border-rose-500/20',
  };

  return (
    <span className={`${baseStyles} ${variants[variant]} ${className}`}>
      {pulse && (
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current"></span>
        </span>
      )}
      <span>{children}</span>
    </span>
  );
}
