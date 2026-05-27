import React from 'react';
import { Sparkles, LucideIcon } from 'lucide-react';
import Button from './Button';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onActionClick?: () => void;
  icon?: LucideIcon;
}

export default function EmptyState({
  title,
  description,
  actionLabel,
  onActionClick,
  icon: Icon = Sparkles,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 md:p-12 bg-surface/40 border border-dashed border-border/10 rounded-3xl space-y-4 max-w-md mx-auto select-none my-6">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary animate-pulse">
        <Icon className="w-8 h-8" />
      </div>
      
      <div className="space-y-1">
        <h3 className="text-sm md:text-base font-black text-white leading-tight">
          {title}
        </h3>
        <p className="text-[11px] md:text-xs text-gray-400 font-bold leading-relaxed px-4">
          {description}
        </p>
      </div>

      {actionLabel && onActionClick && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onActionClick}
          className="hover:border-primary/30"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
