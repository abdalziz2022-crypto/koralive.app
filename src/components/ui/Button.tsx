import React from 'react';
import { Loader2 } from 'lucide-react';
import { HTMLMotionProps, motion } from 'motion/react';

interface ButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  loading?: boolean;
  children?: React.ReactNode;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-bold tracking-tight rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:pointer-events-none select-none';
  
  const variants = {
    primary: 'bg-primary text-black hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(0,223,130,0.3)] border border-transparent',
    secondary: 'bg-surface hover:bg-surface-hover hover:text-white border border-border/10 text-gray-300',
    ghost: 'bg-transparent hover:bg-surface-hover hover:text-white text-gray-400',
    danger: 'bg-rose-500 hover:bg-rose-600 text-white hover:shadow-[0_0_20px_rgba(244,63,94,0.3)] border border-transparent',
  };

  const sizes = {
    xs: 'px-2.5 py-1 text-[10px] rounded-lg',
    sm: 'px-3.5 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3 text-base rounded-2xl',
  };

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading && (
        <Loader2 className="w-4 h-4 mr-2 animate-spin text-current shrink-0" />
      )}
      <span>{children}</span>
    </motion.button>
  );
}
