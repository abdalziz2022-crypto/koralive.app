import React from 'react';
import { motion } from 'motion/react';
import { Clock, BookOpen, Share2 } from 'lucide-react';
import { formatDate } from '../../lib/utils';
import { NewsArticle } from '../../types';

interface NewsCardProps {
  article: NewsArticle;
  onClick?: () => void;
  className?: string;
  variant?: 'grid' | 'list';
}

export default function NewsCard({
  article,
  onClick,
  className = '',
  variant = 'list',
}: NewsCardProps) {
  const imageUrl = article.imageUrl || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=500&q=80';
  const pubDateFormatted = formatDate(article.pubDate);

  if (variant === 'grid') {
    return (
      <motion.div
        whileHover={{ y: -6, scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={onClick}
        className={`bg-surface border border-border/10 hover:border-primary/20 rounded-3xl overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-all duration-300 select-none flex flex-col group ${className}`}
      >
        {/* Cover Image */}
        <div className="relative aspect-video w-full overflow-hidden bg-black/20 shrink-0">
          <img 
            src={imageUrl} 
            alt={article.title} 
            className="w-full h-full object-cover transform group-hover:scale-105 transition-all duration-500"
            referrerPolicy="no-referrer"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
          
          <span className="absolute bottom-3 right-3 bg-black/75 backdrop-blur-md px-2.5 py-1 text-[9px] font-black text-primary rounded-md uppercase tracking-wider">
            {article.source || 'أخبار'}
          </span>
        </div>

        {/* Info */}
        <div className="p-4.5 flex-1 flex flex-col justify-between space-y-3">
          <h3 className="text-xs md:text-sm font-black text-white leading-snug tracking-tight line-clamp-2 pr-0.5 group-hover:text-primary transition-colors duration-200">
            {article.title}
          </h3>

          <div className="flex items-center justify-between text-[10px] text-gray-500 font-bold border-t border-white/5 pt-3">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              <span>{pubDateFormatted}</span>
            </span>
            <span className="flex items-center gap-1 text-primary">
              <BookOpen className="w-3.5 h-3.5" />
              <span>قراءة</span>
            </span>
          </div>
        </div>
      </motion.div>
    );
  }

  // Row / List variant
  return (
    <motion.div
      whileHover={{ x: -2, y: -2 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={`bg-surface hover:bg-surface-hover/80 border border-border/10 hover:border-primary/20 rounded-3xl p-4 cursor-pointer transition-all duration-300 select-none flex gap-4 items-center group ${className}`}
    >
      {/* Thumbnail Aspect Ratio */}
      <div className="relative w-24 h-24 md:w-32 md:h-24 rounded-2xl overflow-hidden bg-black/20 shrink-0">
        <img 
          src={imageUrl} 
          alt={article.title} 
          className="w-full h-full object-cover transform group-hover:scale-105 transition-all duration-500"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      </div>

      {/* Article text details */}
      <div className="flex-1 min-w-0 space-y-2">
        <span className="text-[10px] bg-primary/10 border border-primary/15 text-primary px-2 py-0.5 rounded-md font-black select-none uppercase inline-block">
          {article.source || 'أخبار'}
        </span>

        <h3 className="text-xs md:text-sm font-black text-white leading-snug tracking-tight line-clamp-2 pr-0.5 group-hover:text-primary transition-colors duration-200">
          {article.title}
        </h3>

        <div className="flex items-center gap-4 text-[10px] text-gray-500 font-extrabold pt-1">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            <span>{pubDateFormatted}</span>
          </span>
          {article.creator && (
            <span className="hidden sm:inline line-clamp-1 max-w-[100px] text-gray-400">
              بواسطة {article.creator}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
