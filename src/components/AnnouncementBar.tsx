import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Announcement } from '../types';
import { Megaphone, X, Info, AlertTriangle, ExternalLink, ChevronRight, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function AnnouncementBar() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  useEffect(() => {
    // Load dismissed IDs from local storage
    const saved = localStorage.getItem('dismissed_announcements');
    if (saved) {
      try {
        setDismissedIds(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse dismissed announcements', e);
      }
    }

    const q = query(
      collection(db, 'announcements'),
      where('active', '==', true),
      orderBy('priority', 'desc')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const all = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Announcement));
      // Secondary sort in JS to avoid needing complex composite indexes
      const sorted = all.sort((a, b) => {
        if (b.priority !== a.priority) return (b.priority || 0) - (a.priority || 0);
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      setAnnouncements(sorted);
    }, (error) => {
      console.warn('Announcement query failed (missing index?), falling back to simple query');
      handleFirestoreError(error, OperationType.GET, 'announcements');
    });

    return unsub;
  }, []);

  const visibleAnnouncements = announcements.filter(a => {
    const isDismissed = dismissedIds.includes(a.id);
    const isExpired = a.expiresAt ? new Date(a.expiresAt) < new Date() : false;
    return !isDismissed && !isExpired;
  });

  useEffect(() => {
    if (currentIndex >= visibleAnnouncements.length && visibleAnnouncements.length > 0) {
      setCurrentIndex(0);
    }
  }, [visibleAnnouncements.length, currentIndex]);

  useEffect(() => {
    if (visibleAnnouncements.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % visibleAnnouncements.length);
      }, 8000);
      return () => clearInterval(interval);
    }
  }, [visibleAnnouncements.length]);

  const handleDismiss = (id: string) => {
    const newDismissed = [...dismissedIds, id];
    setDismissedIds(newDismissed);
    localStorage.setItem('dismissed_announcements', JSON.stringify(newDismissed));
    if (currentIndex >= visibleAnnouncements.length - 1) {
      setCurrentIndex(Math.max(0, visibleAnnouncements.length - 2));
    }
  };

  if (visibleAnnouncements.length === 0) return null;

  const current = visibleAnnouncements[currentIndex] || visibleAnnouncements[0];

  const getStyles = (type?: string) => {
    switch (type) {
      case 'breaking':
        return {
          bg: 'bg-red-600',
          text: 'text-white',
          icon: <AlertTriangle size={16} className="animate-pulse" />,
          label: 'خبر عاجل'
        };
      case 'warning':
        return {
          bg: 'bg-amber-500',
          text: 'text-black',
          icon: <AlertTriangle size={16} />,
          label: 'تنبيه'
        };
      default:
        return {
          bg: 'bg-primary',
          text: 'text-black',
          icon: <Info size={16} />,
          label: 'إعلان'
        };
    }
  };

  const styles = getStyles(current.type);

  return (
    <AnimatePresence mode="wait">
      <motion.div 
        key={current.id}
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -50, opacity: 0 }}
        className={cn(
          "fixed top-[72px] left-0 right-0 z-40 px-4 py-2 flex items-center justify-between shadow-2xl transition-colors duration-500",
          styles.bg,
          styles.text
        )}
      >
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 overflow-hidden flex-1">
            <div className="hidden sm:flex items-center gap-2 px-2 py-0.5 bg-black/20 rounded text-[10px] font-black uppercase tracking-widest shrink-0">
              {styles.icon}
              {styles.label}
            </div>
            
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Megaphone size={16} className="shrink-0 sm:hidden" />
              <p className="text-xs sm:text-sm font-bold truncate leading-none pt-0.5">
                {current.text}
              </p>
              {current.link && (
                <a 
                  href={current.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="shrink-0 flex items-center gap-1 text-[10px] font-extrabold underline decoration-2 underline-offset-4 hover:opacity-80 transition-opacity"
                >
                  اقرأ المزيد <ExternalLink size={10} />
                </a>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {visibleAnnouncements.length > 1 && (
              <div className="flex items-center bg-black/10 rounded-lg overflow-hidden mr-2">
                <button 
                  onClick={() => setCurrentIndex(prev => (prev - 1 + visibleAnnouncements.length) % visibleAnnouncements.length)}
                  className="p-1.5 hover:bg-black/10 transition-colors"
                >
                  <ChevronRight size={14} />
                </button>
                <div className="w-[1px] h-3 bg-black/20" />
                <button 
                  onClick={() => setCurrentIndex(prev => (prev + 1) % visibleAnnouncements.length)}
                  className="p-1.5 hover:bg-black/10 transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>
              </div>
            )}
            
            <button 
              onClick={() => handleDismiss(current.id)}
              className="p-1.5 hover:bg-black/10 rounded-full transition-colors group"
              title="إخفاء التنبيه"
            >
              <X size={16} className="group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
