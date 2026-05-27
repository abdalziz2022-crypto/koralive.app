import React from 'react';
import { Match, News } from '../types';
import { doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Trash2, Edit3, BarChart3, RefreshCw, Calendar, MapPin, Globe } from 'lucide-react';
import { cn } from '../lib/utils';
import { useError } from '../context/ErrorContext';

interface ManagementListProps {
  items: any[];
  type: 'matches' | 'news' | 'leagues';
  onEdit?: (item: any) => void;
  onGenerateStats?: (id: string) => Promise<void>;
}

export default function ManagementList({ items, type, onEdit, onGenerateStats }: ManagementListProps) {
  const { showError, showToast } = useError();
  const [loadingIds, setLoadingIds] = React.useState<string[]>([]);

  const handleGenerateStats = async (id: string) => {
    if (!onGenerateStats) return;
    setLoadingIds(prev => [...prev, id]);
    try {
      await onGenerateStats(id);
    } finally {
      setLoadingIds(prev => prev.filter(loadingId => loadingId !== id));
    }
  };

  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setLoadingIds(prev => [...prev, id]);
    try {
      await deleteDoc(doc(db, type, id));
      showToast('تم الحذف بنجاح', 'success');
      setDeletingId(null);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `${type}/${id}`);
    } finally {
      setLoadingIds(prev => prev.filter(loadingId => loadingId !== id));
    }
  };

  const formatSafeDate = (dStr: any) => {
    if (!dStr) return '—';
    try {
      const d = new Date(dStr);
      return isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
    } catch {
      return '—';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {items.map((item) => (
        <div key={item.id} className="bg-white/5 border border-white/5 p-5 rounded-[2rem] flex items-center justify-between group hover:border-primary/50 transition-all hover:bg-white/[0.08]">
          <div className="flex items-center gap-5 overflow-hidden">
            {type === 'matches' ? (
              <>
                <div className="flex -space-x-3 shrink-0">
                  <div className="w-12 h-12 rounded-2xl bg-black border border-white/10 flex items-center justify-center p-1 relative z-10">
                    <img src={item.homeLogo || undefined} className="w-full h-full object-contain" alt="" />
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-black border border-white/10 flex items-center justify-center p-1 relative z-0">
                    <img src={item.awayLogo || undefined} className="w-full h-full object-contain" alt="" />
                  </div>
                </div>
                <div className="overflow-hidden space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black truncate">{item.homeTeam} × {item.awayTeam}</h4>
                    {item.broken && (
                      <span className="text-[8px] bg-red-500 font-black text-white px-1.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                         ERR
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                    <span className="flex items-center gap-1"><Calendar size={10} /> {formatSafeDate(item.startTime)}</span>
                    <span className={cn(
                      "px-1.5 py-0.5 rounded-lg",
                      item.status === 'LIVE' ? "bg-red-500/10 text-red-500" : 
                      item.status === 'UPCOMING' ? "bg-primary/10 text-primary" : "bg-gray-500/10 text-gray-400"
                    )}>{item.status}</span>
                  </div>
                </div>
              </>
            ) : type === 'leagues' ? (
              <>
                <div className="w-12 h-12 rounded-2xl bg-black border border-white/10 flex items-center justify-center p-2 shrink-0">
                   <img src={item.logo || undefined} className="w-full h-full object-contain" alt="" />
                </div>
                <div>
                   <h4 className="text-sm font-black">{item.name}</h4>
                   <p className="text-[10px] text-gray-500 flex items-center gap-1 font-bold uppercase"><Globe size={10} /> {item.country}</p>
                </div>
              </>
            ) : (
              <>
                <img src={item.image || undefined} className="w-16 h-12 rounded-2xl object-cover shrink-0 border border-white/10" alt="" />
                <div className="overflow-hidden">
                  <h4 className="text-sm font-black truncate">{item.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] bg-secondary/10 text-secondary px-1.5 py-0.5 rounded-md font-bold uppercase">{item.category}</span>
                    <span className="text-[9px] text-gray-500 font-medium">{formatSafeDate(item.createdAt)}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            {deletingId === item.id ? (
              <div className="flex items-center gap-1 bg-red-500/10 p-1.5 rounded-2xl border border-red-500/20">
                <button 
                  onClick={() => handleDelete(item.id)}
                  disabled={loadingIds.includes(item.id)}
                  className="bg-red-500 text-white px-3 py-1.5 rounded-xl text-[10px] font-black hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {loadingIds.includes(item.id) ? '...حذف' : 'تأكيد الحذف'}
                </button>
                <button 
                  onClick={() => setDeletingId(null)}
                  className="bg-white/10 text-white px-3 py-1.5 rounded-xl text-[10px] font-black hover:bg-white/20 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            ) : (
              <>
                {type === 'matches' && onGenerateStats && (
                  <button 
                    onClick={() => handleGenerateStats(item.id)}
                    disabled={loadingIds.includes(item.id)}
                    className={cn(
                      "p-2.5 rounded-xl transition-all",
                      loadingIds.includes(item.id) ? "animate-pulse bg-blue-500/10 text-blue-500" : "hover:bg-blue-500/10 text-blue-500"
                    )}
                    title="جلب الإحصائيات بالذكاء الاصطناعي"
                  >
                    {loadingIds.includes(item.id) ? <RefreshCw size={18} className="animate-spin" /> : <BarChart3 size={18} />}
                  </button>
                )}
                <button 
                  onClick={() => onEdit?.(item)}
                  className="p-2.5 hover:bg-primary/20 text-primary rounded-xl transition-colors"
                >
                  <Edit3 size={18} />
                </button>
                <button 
                  onClick={() => setDeletingId(item.id)}
                  className="p-2.5 hover:bg-red-500/20 text-red-500 rounded-xl transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </>
            )}
          </div>
        </div>
      ))}
      
      {items.length === 0 && (
        <div className="col-span-full py-20 text-center glass rounded-3xl border-dashed border-2 border-white/5 text-gray-500 font-bold italic">
          لا توجد بيانات حالياً
        </div>
      )}
    </div>
  );
}
