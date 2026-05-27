import React from 'react';

export function Shimmer({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-white/5 rounded-xl ${className}`} />
  );
}

export function MatchCardSkeleton() {
  return (
    <div className="bg-surface rounded-3xl p-4.5 border border-border/10 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <Shimmer className="h-4.5 w-24" />
        <Shimmer className="h-4 w-12" />
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-3 items-center gap-2">
        {/* Home */}
        <div className="flex flex-col items-center gap-2">
          <Shimmer className="w-11 h-11 rounded-full" />
          <Shimmer className="h-3.5 w-16" />
        </div>

        {/* Center / Score */}
        <div className="flex flex-col items-center gap-1.5">
          <Shimmer className="h-6 w-12 rounded-lg" />
          <Shimmer className="h-3 w-8" />
        </div>

        {/* Away */}
        <div className="flex flex-col items-center gap-2">
          <Shimmer className="w-11 h-11 rounded-full" />
          <Shimmer className="h-3.5 w-16" />
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-white/5 pt-3.5 flex justify-between items-center">
        <Shimmer className="h-3.5 w-20" />
        <Shimmer className="h-3.5 w-24" />
      </div>
    </div>
  );
}

export function NewsCardSkeleton() {
  return (
    <div className="bg-surface rounded-3xl border border-border/10 overflow-hidden flex flex-col md:flex-row gap-4 p-4">
      <Shimmer className="w-full md:w-36 h-40 md:h-24 rounded-2xl shrink-0" />
      <div className="flex-1 space-y-3.5 py-1">
        <Shimmer className="h-4 w-16" />
        <Shimmer className="h-5 w-4/5" />
        <div className="flex gap-4.5 items-center pt-1">
          <Shimmer className="h-3 w-12" />
          <Shimmer className="h-3 w-20" />
        </div>
      </div>
    </div>
  );
}

export function SectionHeaderSkeleton() {
  return (
    <div className="flex justify-between items-center mb-4">
      <div className="space-y-1.5">
        <Shimmer className="h-5 w-32" />
        <Shimmer className="h-3 w-20" />
      </div>
      <Shimmer className="h-7 w-16 rounded-xl" />
    </div>
  );
}
