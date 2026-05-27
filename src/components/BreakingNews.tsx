import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { News } from '../types';
import { motion } from 'motion/react';
import { Flame, Clock } from 'lucide-react';
import { formatDate } from '../lib/utils';
import NewsDetailModal from './NewsDetailModal';

export default function BreakingNews() {
  const [breakingNews, setBreakingNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNews, setSelectedNews] = useState<News | null>(null);

  useEffect(() => {
    // We fetch news that match the categories 'عاجل' or 'هام'
    // Ensure we have an index if we order by createdAt and where in. If not, we can just fetch and sort.
    const q = query(
      collection(db, 'news'),
      where('category', 'in', ['عاجل', 'هام']),
      orderBy('createdAt', 'desc'),
      limit(3)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setBreakingNews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as News)));
      setLoading(false);
    }, (error) => {
      // If index is missing, we can fallback to fetching without where/orderBy or just log
      console.warn("Firestore index might be missing, falling back to client-side filter", error);
      
      const fallbackQ = query(collection(db, 'news'), orderBy('createdAt', 'desc'), limit(20));
      onSnapshot(fallbackQ, (fallbackSnapshot) => {
        const allNews = fallbackSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as News));
        const filtered = allNews.filter(n => n.category === 'عاجل' || n.category === 'هام').slice(0, 3);
        setBreakingNews(filtered);
        setLoading(false);
      });
    });
    return unsub;
  }, []);

  if (loading) return null;

  return (
    <section id="breaking-news" className="space-y-4 pt-4">
      <div className="flex items-center gap-2">
        <Flame className="text-orange-500 animate-pulse" />
        <h2 className="text-xl font-black uppercase tracking-tight text-[color:var(--color-text)]">الأخبار العاجلة</h2>
      </div>

      {breakingNews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {breakingNews.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => setSelectedNews(item)}
              className="glass p-5 rounded-3xl flex flex-col justify-between space-y-3.5 hover:neon-border transition-all cursor-pointer border border-orange-500/20"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase bg-orange-500/10 text-orange-400 px-2.5 py-0.5 rounded-full border border-orange-500/20">
                  {item.category}
                </span>
                <div className="flex items-center gap-1 text-slate-500 dark:text-gray-400 text-[10px]">
                  <Clock size={10} />
                  <span>{formatDate(item.createdAt)}</span>
                </div>
              </div>
              <h3 className="font-extrabold text-xs md:text-sm line-clamp-2 text-[color:var(--color-text)] leading-relaxed">
                {item.title}
              </h3>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="glass p-6 rounded-3xl border border-white/5 text-center">
          <p className="text-xs text-slate-500 dark:text-gray-400 font-bold">لا توجد أخبار عاجلة حالياً</p>
        </div>
      )}
      <NewsDetailModal news={selectedNews} onClose={() => setSelectedNews(null)} />
    </section>
  );
}
