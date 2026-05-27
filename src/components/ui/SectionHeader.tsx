import React from 'react';
import { ChevronLeft } from 'lucide-react';
import Button from './Button';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onActionClick?: () => void;
  icon?: React.ReactNode;
  id?: string;
}

export default function SectionHeader({
  title,
  subtitle,
  actionLabel,
  onActionClick,
  icon,
  id,
}: SectionHeaderProps) {
  return (
    <div id={id} className="flex items-center justify-between gap-4 mb-4 select-none">
      <div className="flex items-center gap-2.5">
        {icon && <div className="text-primary shrink-0">{icon}</div>}
        <div className="flex flex-col">
          <h2 className="text-base md:text-lg font-black tracking-tight text-white leading-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-[10px] md:text-xs text-gray-400 font-bold leading-none mt-1">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      
      {actionLabel && onActionClick && (
        <Button 
          variant="ghost" 
          size="xs" 
          onClick={onActionClick}
          className="hover:text-primary flex items-center gap-0.5 text-gray-400 font-black transition-colors"
        >
          <span>{actionLabel}</span>
          <ChevronLeft className="w-3.5 h-3.5" />
        </Button>
      )}
    </div>
  );
}
