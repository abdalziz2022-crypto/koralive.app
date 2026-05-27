import React, { useState, useEffect } from 'react';
import { Match } from '../types';
import { Bot, Sparkles, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

interface AIPredictionProps {
  match: Match;
}

export default function AIPrediction({ match }: AIPredictionProps) {
  const [prediction, setPrediction] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePrediction = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/predict/match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          homeTeam: match.homeTeam,
          awayTeam: match.awayTeam,
          league: match.league,
          status: match.status,
          homeScore: match.homeScore,
          awayScore: match.awayScore,
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch prediction');
      
      const data = await response.json();
      setPrediction(data.prediction || "عذراً، لا يمكن جلب التوقع حالياً.");
    } catch (error) {
      console.error(error);
      setError("تعذر جلب التوقع التلقائي. اضغط للمحاولة مرة أخرى.");
      setPrediction(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    // Generate prediction automatically on mount for each match
    if (match.id) {
      generatePrediction();
    }
  }, [match.id]);

  return (
    <div className="glass overflow-hidden rounded-3xl relative border border-primary/20">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
      
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-[0_0_15px_rgba(252,211,77,0.1)]">
              <Bot size={22} />
            </div>
            <div>
              <h3 className="text-primary font-black uppercase tracking-widest text-[10px]">AI Insight</h3>
              <div className="font-extrabold text-sm flex items-center gap-2">
                توقع الرياضي الذكي
                <Sparkles size={14} className="text-primary animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        <div className="min-h-[60px] relative">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-6">
              <Loader2 className="animate-spin text-primary" size={24} />
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest animate-pulse">جاري تحليل البيانات...</p>
            </div>
          ) : prediction ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-gray-300 text-sm leading-relaxed text-right font-medium relative z-10"
            >
              {prediction}
            </motion.div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-4">
              {error && <p className="text-red-400 text-[10px] font-bold mb-2">{error}</p>}
              <button 
                onClick={generatePrediction}
                className="text-xs font-black bg-primary text-black px-6 py-2.5 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
              >
                {error ? 'إعادة المحاولة' : 'توليد توقع جديد'}
              </button>
            </div>
          )}
          
          {/* Subtle Background Icon */}
          <div className="absolute -bottom-4 -right-4 opacity-[0.03] rotate-12">
            <Bot size={120} />
          </div>
        </div>
        
        <div className="pt-4 border-t border-white/5 flex items-center justify-between">
          <p className="text-[9px] text-gray-500 font-bold italic uppercase tracking-tighter">
            * AI-generated entertainment content
          </p>
          <div className="flex gap-1">
             <div className="w-1 h-1 rounded-full bg-primary/40" />
             <div className="w-1 h-1 rounded-full bg-primary/20" />
             <div className="w-1 h-1 rounded-full bg-primary/10" />
          </div>
        </div>
      </div>
    </div>
  );
}
