import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, addDoc, doc, updateDoc, deleteDoc, getDocs, setDoc, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { DataSource } from '../types';
import { 
  Database, Plus, Trash2, Edit3, Save, X, RefreshCw, 
  Activity, AlertCircle, CheckCircle2, Globe, Cpu, 
  Zap, Code, Key, Settings2, Info, ExternalLink, ChevronLeft, ShieldCheck
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useError } from '../context/ErrorContext';
import { motion, AnimatePresence } from 'motion/react';

export default function DataEngine() {
  const { showToast, showError } = useError();
  const [sources, setSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'SOURCES' | 'SYSTEM_KEYS'>('SOURCES');
  const [systemKeys, setSystemKeys] = useState<{ footballApiKey: string; theSportsDbApiKey?: string; newsApiKey?: string }>({ footballApiKey: '', theSportsDbApiKey: '3', newsApiKey: '' });
  const [isSavingKeys, setIsSavingKeys] = useState(false);

  const initialForm: Partial<DataSource> = {
    name: '',
    type: 'REST_API',
    provider: 'FOOTBALL_API',
    enabled: true,
    target: 'MATCHES',
    config: {
      apiKey: '',
      endpoint: '',
      frequency: 60
    }
  };

  const [formData, setFormData] = useState<Partial<DataSource>>(initialForm);

  useEffect(() => {
    const q = query(collection(db, 'sources'));
    const unsub = onSnapshot(q, (snapshot) => {
      setSources(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as DataSource)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'sources'));

    // Fetch system keys
    const fetchKeys = async () => {
      try {
        const docRef = doc(db, 'settings', 'global');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSystemKeys(prev => ({ ...prev, ...docSnap.data() }));
        }
      } catch (e) {
        console.error("Failed to fetch system keys", e);
      }
    };
    fetchKeys();

    return unsub;
  }, []);

  const handleSaveKeys = async () => {
    setIsSavingKeys(true);
    try {
      await setDoc(doc(db, 'settings', 'global'), systemKeys, { merge: true });
      showToast('تم حفظ مفاتيح النظام بنجاح', 'success');
    } catch (e) {
      showError('فشل حفظ المفاتيح');
    } finally {
      setIsSavingKeys(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, 'sources', editingId), formData);
        showToast('تم تحديث المصدر بنجاح', 'success');
      } else {
        await addDoc(collection(db, 'sources'), {
          ...formData,
          status: 'IDLE',
          lastSync: null
        });
        showToast('تم إضافة المصدر بنجاح', 'success');
      }
      setShowForm(false);
      setEditingId(null);
      setFormData(initialForm);
    } catch (e) {
      handleFirestoreError(e, editingId ? OperationType.UPDATE : OperationType.CREATE, `sources/${editingId || ''}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (id: string) => {
    setSyncingId(id);
    try {
      showToast('جاري بدء عملية المزامنة...', 'info');
      const response = await fetch('/api/sources/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId: id })
      });
      
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'فشل المزامنة');
      
      showToast('اكتملت المزامنة بنجاح', 'success');
    } catch (e: any) {
      showError(`خطأ في المزامنة: ${e.message}`);
    } finally {
      setSyncingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المصدر؟')) return;
    try {
      await deleteDoc(doc(db, 'sources', id));
      showToast('تم الحذف', 'success');
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `sources/${id}`);
    }
  };

  return (
    <div className="space-y-8">
      {/* Engine Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-black italic flex items-center gap-3">
            <Zap className="text-primary" /> محرك البيانات <span className="text-xs text-gray-500 not-italic font-bold tracking-tighter">ENGINE V2.0</span>
          </h2>
          <div className="flex bg-white/5 p-1 rounded-xl w-fit">
            <button 
              onClick={() => setActiveView('SOURCES')}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-black transition-all",
                activeView === 'SOURCES' ? "bg-white text-black shadow-lg" : "text-gray-500 hover:text-white"
              )}
            >
              مصادر البيانات
            </button>
            <button 
              onClick={() => setActiveView('SYSTEM_KEYS')}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-black transition-all",
                activeView === 'SYSTEM_KEYS' ? "bg-white text-black shadow-lg" : "text-gray-500 hover:text-white"
              )}
            >
              مفاتيح النظام
            </button>
          </div>
        </div>
        {!showForm && activeView === 'SOURCES' && (
          <button 
            onClick={() => setShowForm(true)}
            className="bg-primary text-black px-6 py-3 rounded-2xl font-black text-xs flex items-center gap-2 hover:scale-105 transition-all shadow-lg shadow-primary/20"
          >
            <Plus size={16} /> إضافة مصدر جديد
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {activeView === 'SYSTEM_KEYS' ? (
          <motion.div 
            key="system_keys"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-6"
          >
            <div className="glass p-8 rounded-[3rem] border border-white/5 space-y-6 relative overflow-hidden">
               <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h3 className="font-black text-lg">إعدادات مفاتيح النظام (Environment Variables)</h3>
                    <p className="text-[10px] text-gray-500 font-bold">يتم تخزين هذه المفاتيح كإعدادات نظام لاستخدامها كقيم افتراضية لمحرك المزامن</p>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-gray-500 px-4 flex items-center gap-2">
                       <Key size={12} className="text-primary" /> Football API Key (Global)
                     </label>
                     <div className="space-y-1">
                       <input 
                         type="password"
                         placeholder="أدخل مفتاح Football API العام"
                         className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl font-mono text-sm tracking-widest focus:border-primary transition-all"
                         value={systemKeys.footballApiKey}
                         onChange={e => setSystemKeys({...systemKeys, footballApiKey: e.target.value})}
                       />
                       <p className="text-[9px] text-gray-600 px-4 font-medium italic">سيتم استخدام هذا المفتاح تلقائياً لأي مصدر FOOTBALL_API لا يمتلك مفتاحاً خاصاً به.</p>
                     </div>
                  </div>
                  
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-gray-500 px-4 flex items-center gap-2">
                       <Key size={12} className="text-primary" /> TheSportsDB API Key (Global)
                     </label>
                     <div className="space-y-1">
                       <input 
                         type="password"
                         placeholder="أدخل مفتاح TheSportsDB العام"
                         className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl font-mono text-sm tracking-widest focus:border-primary transition-all"
                         value={systemKeys.theSportsDbApiKey || ''}
                         onChange={e => setSystemKeys({...systemKeys, theSportsDbApiKey: e.target.value})}
                       />
                       <p className="text-[9px] text-gray-600 px-4 font-medium italic">المفتاح المجاني الافتراضي المتاح هو: '3'. سيتم استخدامه إذا تم تركه فارغاً.</p>
                     </div>
                  </div>

                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-gray-500 px-4 flex items-center gap-2">
                       <Key size={12} className="text-primary" /> NewsAPI Key (Global)
                     </label>
                     <div className="space-y-1">
                       <input 
                         type="password"
                         placeholder="أدخل مفتاح NewsAPI العام"
                         className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl font-mono text-sm tracking-widest focus:border-primary transition-all"
                         value={systemKeys.newsApiKey || ''}
                         onChange={e => setSystemKeys({...systemKeys, newsApiKey: e.target.value})}
                       />
                       <p className="text-[9px] text-gray-600 px-4 font-medium italic">مفتاح جلب الأخبار من NewsAPI.org</p>
                     </div>
                  </div>
                 </div>

                 <div className="glass p-6 rounded-3xl bg-black/40 border border-white/5 flex flex-col justify-center">
                    <div className="flex items-center gap-3 text-amber-500 mb-2">
                      <Info size={16} />
                      <span className="text-[10px] font-black uppercase">ملاحظة تقنية</span>
                    </div>
                    <p className="text-[11px] text-gray-400 font-medium leading-relaxed">
                      يتم حفظ هذه القيم في قاعدة البيانات (Settings) لاستخدامها بشكل حيوي. للتغيير الدائم في بيئة تشغيل السيرفر، يرجى تحديث الملف <code className="bg-white/5 px-1 rounded">.env</code> من لوحة تحكم المحرر.
                    </p>
                 </div>
               </div>

               <div className="pt-4 flex justify-end">
                  <button 
                    onClick={handleSaveKeys}
                    disabled={isSavingKeys}
                    className="bg-primary text-black px-10 py-4 rounded-2xl font-black text-sm flex items-center gap-2 hover:scale-105 transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
                  >
                    {isSavingKeys ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                    حفظ كافة المفاتيح
                  </button>
               </div>
            </div>
          </motion.div>
        ) : showForm ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass p-8 rounded-[3rem] border border-white/5 space-y-8 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 blur-[80px]" />
            <div className="flex items-center justify-between border-b border-white/5 pb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/20 text-primary flex items-center justify-center">
                  <Database size={20} />
                </div>
                <h3 className="font-black text-lg">{editingId ? 'تعديل مصدر البيانات' : 'تجهيز مصدر بيانات جديد'}</h3>
              </div>
              <button onClick={() => { setShowForm(false); setEditingId(null); }} className="p-2 hover:bg-white/5 rounded-full"><X size={20} /></button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-500 px-4">اسم المصدر</label>
                  <input 
                    placeholder="مثال: RapidAPI Football" 
                    className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl font-bold focus:border-primary transition-all"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>

                <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-4 rounded-2xl">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={formData.enabled}
                      onChange={e => setFormData({...formData, enabled: e.target.checked})}
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                  <div>
                    <h4 className="text-sm font-bold text-white">تفعيل المصدر</h4>
                    <p className="text-[10px] text-gray-500 mt-1">عند تفعيل المصدر، سيقوم بجلب البيانات تلقائياً حسب تردد التحديث.</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-500 px-4">نوع المصدر</label>
                    <select 
                      className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl font-bold"
                      value={formData.type}
                      onChange={e => setFormData({...formData, type: e.target.value as any})}
                    >
                      <option value="AI">ذكاء اصطناعي (Gemini)</option>
                      <option value="REST_API">واجهة برمجة تطبيقات (API)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-500 px-4">مزود الخدمة</label>
                    <select 
                      className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl font-bold"
                      value={formData.provider}
                      onChange={e => setFormData({...formData, provider: e.target.value as any})}
                    >
                      <option value="GEMINI" className="text-black">Google Gemini</option>
                      <option value="FOOTBALL_API" className="text-black">API-Football (RapidAPI)</option>
                      <option value="THESPORTSDB" className="text-black">TheSportsDB (مباريات ونتائج مجانية)</option>
                      <option value="NEWS_API" className="text-black">NewsAPI.org (أخبار الرياضة التلقائية)</option>
                      <option value="FOOTBALL_DATA" className="text-black">Football-Data.org</option>
                      <option value="CUSTOM" className="text-black">رابط مخصص (Webhook)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-500 px-4">هدف البيانات</label>
                  <div className="flex gap-2">
                    {['MATCHES', 'NEWS', 'BOTH'].map(t => (
                      <button 
                        key={t}
                        onClick={() => setFormData({...formData, target: t as any})}
                        className={cn(
                          "flex-1 py-3 rounded-xl text-[10px] font-black transition-all",
                          formData.target === t ? "bg-white text-black" : "bg-white/5 text-gray-500 grayscale opacity-50 hover:opacity-100"
                        )}
                      >
                        {t === 'MATCHES' ? 'المباريات' : t === 'NEWS' ? 'أخبار' : 'الاثنين معاً'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="glass p-6 rounded-[2rem] border border-white/5 bg-black/40 space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                    <Settings2 size={12} /> إعدادات الاتصال
                  </h4>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 px-1 flex items-center gap-1"><Key size={10} /> API Key / Secret</label>
                    <input 
                      type="password"
                      placeholder="••••••••••••••••"
                      className="w-full bg-black/40 border border-white/5 p-3 rounded-xl font-mono text-sm tracking-widest focus:border-primary transition-all"
                      value={formData.config?.apiKey}
                      onChange={e => setFormData({...formData, config: {...formData.config, apiKey: e.target.value}})}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 px-1 flex items-center gap-1"><Globe size={10} /> Endpoint / Base URL</label>
                    <input 
                      placeholder="https://..."
                      className="w-full bg-black/40 border border-white/5 p-3 rounded-xl text-xs font-mono"
                      value={formData.config?.endpoint}
                      onChange={e => setFormData({...formData, config: {...formData.config, endpoint: e.target.value}})}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 px-1 flex items-center gap-1"><Activity size={10} /> تردد التحديث (بالدقائق)</label>
                    <div className="space-y-1">
                      <input 
                        type="number"
                        className="w-full bg-black/40 border border-white/5 p-3 rounded-xl text-sm font-black focus:border-primary transition-all"
                        value={formData.config?.frequency}
                        onChange={e => setFormData({...formData, config: {...formData.config, frequency: parseInt(e.target.value) || 60}})}
                      />
                      <p className="text-[9px] text-gray-600 px-1 font-medium italic">يحدد هذا الإعداد الفاصل الزمني بين كل عملية مزامنة تلقائية. (مثال: 60 يعني المزامنة كل ساعة).</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={handleSave}
                    disabled={loading}
                    className="flex-1 bg-primary text-black font-black py-4 rounded-2xl shadow-xl shadow-primary/10 flex items-center justify-center gap-2"
                  >
                    {loading ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                    <span>حفظ المصدر</span>
                  </button>
                  <button 
                    onClick={() => { setShowForm(false); setEditingId(null); }}
                    className="px-8 glass text-gray-400 font-bold rounded-2xl hover:text-white transition-colors"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ) : activeView === 'SOURCES' ? (
          <motion.div 
            key="dashboard"
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 gap-6"
          >
            {sources.length > 0 ? (
              sources.map(source => (
                <div key={source.id} className="glass p-6 rounded-[2.5rem] border border-white/5 flex flex-col lg:flex-row lg:items-center justify-between gap-6 group hover:border-primary/40 transition-all">
                  <div className="flex items-center gap-5">
                    <div className={cn(
                      "w-16 h-16 rounded-[1.5rem] flex items-center justify-center relative overflow-hidden",
                      source.provider === 'GEMINI' ? "bg-indigo-500/10 text-indigo-500" : "bg-blue-500/10 text-blue-500"
                    )}>
                      {source.type === 'AI' ? <Cpu size={32} /> : <Database size={32} />}
                      <div className={cn(
                        "absolute inset-0 opacity-10 animate-pulse",
                        source.provider === 'GEMINI' ? "bg-indigo-500" : "bg-blue-500 text-blue-500"
                      )} />
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center flex-wrap gap-2">
                        <h3 className="text-lg font-black">{source.name}</h3>
                        <span className={cn(
                          "text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest",
                          source.provider === 'GEMINI' ? "bg-indigo-500/20 text-indigo-400" : "bg-blue-500/20 text-blue-400"
                        )}>{source.provider}</span>
                        
                        {/* Status Badges */}
                        {!source.enabled ? (
                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest bg-white/5 border border-white/5 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <X size={10} /> Disabled
                          </span>
                        ) : source.status === 'SYNCING' ? (
                          <span className="flex items-center gap-1 text-[9px] font-black text-primary uppercase tracking-widest bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                            <RefreshCw size={10} className="animate-spin" /> Syncing
                          </span>
                        ) : source.status === 'ERROR' ? (
                          <span className="flex items-center gap-1 text-[9px] font-black text-red-500 uppercase tracking-widest bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">
                            <AlertCircle size={10} /> Sync Error
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[9px] font-black text-green-500 uppercase tracking-widest bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">
                            <CheckCircle2 size={10} /> Active & Idle
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-[10px] text-gray-500 font-bold">
                        <span className="flex items-center gap-1 text-primary/80 group-hover:text-primary transition-colors">
                          <Activity size={12} /> تحديث آلي: كل {source.config.frequency} دقيقة
                        </span>
                        <span className="flex items-center gap-1 text-white/40"><Info size={12} /> النوع: {source.target === 'BOTH' ? 'شامل' : source.target === 'MATCHES' ? 'مباريات' : 'أخبار'}</span>
                      </div>
                      {source.errorMessage && source.status === 'ERROR' && (
                        <p className="text-[9px] text-red-400/80 font-medium italic mt-1 max-w-sm line-clamp-1">خطأ: {source.errorMessage}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row items-center gap-4">
                     <div className="text-left md:text-right px-6 py-2 border-r border-white/5 hidden xl:block min-w-[120px]">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 flex items-center justify-end gap-1">
                          عناصر جُلبت <Database size={10} />
                        </p>
                        <p className="text-xs font-bold text-white">
                          {source.itemsFetched || 0}
                        </p>
                     </div>

                     <div className="text-left md:text-right px-6 py-2 border-x border-white/5 hidden xl:block min-w-[160px]">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 flex items-center justify-end gap-1">
                          آخر مزامنة <ExternalLink size={10} />
                        </p>
                        <p className={cn(
                          "text-xs font-bold transition-all",
                          source.status === 'SYNCING' ? "text-primary animate-pulse" : "text-white"
                        )}>
                          {(() => {
                            if (!source.lastSync) return '—';
                            try {
                              const d = new Date(source.lastSync);
                              if (isNaN(d.getTime())) return '—';
                              return d.toLocaleString('ar-EG', {
                                hour: '2-digit',
                                minute: '2-digit',
                                day: '2-digit',
                                month: 'short'
                              });
                            } catch {
                              return '—';
                            }
                          })()}
                        </p>
                     </div>

                     <div className="flex items-center gap-2">
                        <button 
                          onClick={async () => {
                            try {
                              await updateDoc(doc(db, 'sources', source.id), { enabled: !source.enabled });
                            } catch (e) {
                              console.error(e);
                            }
                          }}
                          className={cn(
                            "glass p-3 rounded-2xl transition-colors",
                            source.enabled ? "text-green-500 hover:bg-green-500/20" : "text-gray-500 hover:bg-gray-500/20"
                          )}
                          title={source.enabled ? "إيقاف" : "تفعيل"}
                        >
                          <div className={cn("w-3 h-3 rounded-full", source.enabled ? "bg-green-500 shadow-[0_0_10px_#22c55e]" : "bg-gray-500")}></div>
                        </button>
                        
                        <button 
                          onClick={() => handleSync(source.id)}
                          disabled={syncingId === source.id || !source.enabled}
                          className={cn(
                            "glass p-3 rounded-2xl flex items-center gap-2 text-xs font-black transition-all",
                            syncingId === source.id ? "bg-primary text-black animate-pulse" : "hover:bg-primary/20 hover:text-primary disabled:opacity-30"
                          )}
                        >
                          <RefreshCw size={16} className={syncingId === source.id ? "animate-spin" : ""} /> {syncingId === source.id ? 'جاري المزامنة...' : 'مزامنة الآن'}
                        </button>
                        
                        <button 
                          onClick={() => { setEditingId(source.id); setFormData(source); setShowForm(true); }}
                          className="glass p-3 rounded-2xl hover:bg-white/10 transition-colors"
                        >
                          <Edit3 size={18} />
                        </button>
                        
                        <button 
                          onClick={() => handleDelete(source.id)}
                          className="glass p-3 rounded-2xl hover:bg-red-500/20 text-red-500 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                     </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-24 glass rounded-[3rem] border-dashed border-2 border-white/10 space-y-6">
                 <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto opacity-20">
                    <Database size={40} />
                 </div>
                 <div className="space-y-2">
                    <h3 className="text-lg font-black opacity-30">لا توجد مصادر بيانات نشطة</h3>
                    <p className="text-xs font-medium text-gray-600 max-w-xs mx-auto">ابدأ بإضافة مصدر Gemini أو Football API لجلب البيانات تلقائياً للتطبيق.</p>
                 </div>
                 <button onClick={() => setShowForm(true)} className="text-primary text-xs font-black flex items-center gap-2 mx-auto hover:underline"><Plus size={14} /> إضافة أول مصدر</button>
              </div>
            )}

            {/* Hint / Tutorial Card */}
            <div className="glass p-8 rounded-[2.5rem] border border-white/5 bg-gradient-to-br from-primary/5 to-transparent flex flex-col md:flex-row items-center gap-6">
              <div className="w-16 h-16 bg-primary/20 text-primary rounded-3xl flex items-center justify-center shrink-0">
                 <Code size={32} />
              </div>
              <div className="space-y-1 text-center md:text-right">
                 <h4 className="font-black text-sm">نظام المهام المجدولة (Cron Jobs)</h4>
                 <p className="text-xs text-gray-500 leading-relaxed">المحرك يقوم تلقائياً بقراءة هذه الإعدادات وتنفيذ عمليات الجلب في الخلفية بناءً على التردد المحدد لكل مصدر. لا تحتاج لإبقاء المتصفح مفتوحاً.</p>
              </div>
              <div className="md:mr-auto">
                 <button className="text-[10px] font-black uppercase tracking-widest text-primary border-b border-primary/20 pb-1">اقرأ الوثائق كاملة</button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
