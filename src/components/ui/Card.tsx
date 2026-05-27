import React from 'react';
import { motion } from 'motion/react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'elevated' | 'outlined' | 'flat' | 'glass';
  hoverable?: boolean;
  children: React.ReactNode;
}

export default function Card({
  variant = 'outlined',
  hoverable = false,
  className = '',
  children,
  ...props
}: CardProps) {
  const baseStyles = 'rounded-3xl border border-transparent transition-all duration-300 overflow-hidden';
  
  const variants = {
    elevated: 'bg-surface shadow-[0_12px_30px_rgba(0,0,0,0.25)] border-white/5',
    outlined: 'bg-surface border border-border/10',
    flat: 'bg-surface-hover/40 border border-transparent',
    glass: 'glass',
  };

  const hoverStyles = hoverable 
    ? 'hover:-translate-y-1 hover:border-primary/25 hover:shadow-[0_12px_40px_rgba(0,0,0,0.3)]'
    : '';

  return (
    <div
      className={`${baseStyles} ${variants[variant]} ${hoverStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
