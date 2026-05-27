import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { News } from '../types';
import { motion } from 'motion/react';
import { Newspaper, Clock } from 'lucide-react';
import { formatDate } from '../lib/utils';
import NewsDetailModal from './NewsDetailModal';

export default function NewsSection() {
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNews, setSelectedNews] = useState<News | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'news'), orderBy('createdAt', 'desc'), limit(10));
    const unsub = onSnapshot(q, (snapshot) => {
      setNews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as News)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'news');
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) return null;

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Newspaper className="text-secondary" />
          <h2 className="text-2xl font-black uppercase tracking-tighter">آخر الأخبار</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {news.length > 0 ? (
          news.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              onClick={() => setSelectedNews(item)}
              className="glass overflow-hidden rounded-3xl group flex flex-col sm:flex-row h-full cursor-pointer hover:neon-border transition-all"
            >
              <div className="sm:w-48 h-48 sm:h-auto overflow-hidden">
                <img 
                  src={item.image || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800'} 
                  alt="" 
                  className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500"
                />
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase bg-secondary/20 text-secondary px-2 py-0.5 rounded-full">
                      {item.category}
                    </span>
                  </div>
                  <h3 className="font-black text-lg line-clamp-2 group-hover:text-secondary transition-colors">
                    {item.title}
                  </h3>
                  {item.content && (
                    <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                      {item.content.replace(/[#*`]/g, '').substring(0, 150)}...
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 text-gray-500 text-xs">
                  <Clock size={12} />
                  <span>{formatDate(item.createdAt)}</span>
                  <span>•</span>
                  <span>بواسطة {item.author}</span>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="md:col-span-2 text-center py-10 glass rounded-3xl text-gray-500 italic">
            لا توجد أخبار منشورة حالياً..
          </div>
        )}
      </div>

      <NewsDetailModal news={selectedNews} onClose={() => setSelectedNews(null)} />
    </section>
  );
}
