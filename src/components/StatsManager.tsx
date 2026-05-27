import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, updateDoc, doc, getDoc, setDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Match, League } from '../types';
import { useError } from '../context/ErrorContext';
import { BarChart2, Activity, Save, RefreshCw, Trophy, Globe, Edit3, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { fetchAndUpdateLeagueStandings, fetchAndUpdateAllMatchedLeagues } from '../services/footballApi';
import apiClient from '../api/apiClient';

export default function StatsManager() {
  const { showToast, showError } = useError();
  const [activeTab, setActiveTab] = useState<'MATCH_STATS' | 'LEAGUE_STANDINGS' | 'API_CONFIG'>('MATCH_STATS');
  
  // Data
  const [matches, setMatches] = useState<Match[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [apiConfig, setApiConfig] = useState({ 
    apiFootballKey: '', 
    preferredSource: 'API_FOOTBALL' 
  });
  
  const [loading, setLoading] = useState(false);
  
  // States for Match Stats
  const [selectedMatch, setSelectedMatch] = useState<string>('');
  const [fixtureId, setFixtureId] = useState<string>('');
  const [matchStatsManual, setMatchStatsManual] = useState<any>({
    possession: { home: 50, away: 50 },
    shots: { home: 0, away: 0 },
    shotsOnTarget: { home: 0, away: 0 },
    corners: { home: 0, away: 0 },
    yellowCards: { home: 0, away: 0 },
    redCards: { home: 0, away: 0 }
  });

  const [apiLeagues, setApiLeagues] = useState<any[]>([]);
  const [fetchingLeagues, setFetchingLeagues] = useState(false);
  const [localLeagueMappings, setLocalLeagueMappings] = useState<Record<string, { apiLeagueId?: number, apiSeason?: number }>>({});

  useEffect(() => {
    // Load config
    const loadConfig = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'settings', 'stats_config'));
        if (docSnap.exists()) {
          setApiConfig(docSnap.data() as any);
        }
      } catch (e) {
        console.error(e);
      }
    };
    loadConfig();

    const qM = query(collection(db, 'matches'), orderBy('startTime', 'desc'));
    const qL = query(collection(db, 'leagues'), orderBy('name', 'asc'));
    
      const unsubM = onSnapshot(qM, (s) => setMatches(s.docs.map(d => ({ id: d.id, ...d.data() } as Match))));
      const unsubL = onSnapshot(qL, (s) => {
        const dbLeagues = s.docs.map(d => ({ id: d.id, ...d.data() } as League));
        setLeagues(dbLeagues);
        
        // Initialize local mappings from db
        const mappings: Record<string, any> = {};
        dbLeagues.forEach(l => {
          mappings[l.id] = { apiLeagueId: l.apiLeagueId || '', apiSeason: l.apiSeason || new Date().getFullYear() };
        });
        setLocalLeagueMappings(mappings);
      });
    
    return () => { unsubM(); unsubL(); };
  }, []);

  const handleSaveConfig = async () => {
    setLoading(true);
    try {
      await setDoc(doc(db, 'settings', 'stats_config'), apiConfig, { merge: true });
      showToast('تم حفظ إعدادات API بنجاح', 'success');
    } catch (e) {
      showError('فشل حفظ الإعدادات');
    } finally {
      setLoading(false);
    }
  };

  const handleFetchMatchStats = async () => {
    if (!selectedMatch) return showError('الرجاء اختيار مباراة أولاً');
    
    let apiKey = import.meta.env.VITE_API_KEY || apiConfig.apiFootballKey;
    if (!apiKey) return showError('الرجاء إدخال مفتاح API Football في الإعدادات');
    if (!fixtureId) return showError('الرجاء إدخال معرف المباراة (Fixture ID) الخاص بـ API');

    setLoading(true);
    try {
      const response = await apiClient.get('/fixtures/statistics', {
        params: { fixture: fixtureId },
        headers: {
          'x-apisports-key': apiKey,
          'x-rapidapi-key': apiKey
        }
      });
      const data = response.data;
      
      if (data.response && data.response.length >= 2) {
        const homeStats = data.response[0].statistics;
        const awayStats = data.response[1].statistics;
        
        const getStat = (stats: any[], type: string) => stats.find(s => s.type === type)?.value || 0;
        
        const parsedStats = {
          possession: { 
            home: parseInt(getStat(homeStats, 'Ball Possession')) || 50, 
            away: parseInt(getStat(awayStats, 'Ball Possession')) || 50
          },
          shots: { 
            home: getStat(homeStats, 'Total Shots') || 0, 
            away: getStat(awayStats, 'Total Shots') || 0
          },
          shotsOnTarget: { 
            home: getStat(homeStats, 'Shots on Goal') || 0, 
            away: getStat(awayStats, 'Shots on Goal') || 0
          },
          corners: { 
            home: getStat(homeStats, 'Corner Kicks') || 0, 
            away: getStat(awayStats, 'Corner Kicks') || 0
          },
          yellowCards: { 
            home: getStat(homeStats, 'Yellow Cards') || 0, 
            away: getStat(awayStats, 'Yellow Cards') || 0
          },
          redCards: { 
            home: getStat(homeStats, 'Red Cards') || 0, 
            away: getStat(awayStats, 'Red Cards') || 0
          }
        };

        setMatchStatsManual(parsedStats);
        
        await updateDoc(doc(db, 'matches', selectedMatch), {
          stats: parsedStats,
          updatedAt: new Date().toISOString()
        });

        showToast('تم جلب وتحديث الإحصائيات بنجاح', 'success');
      } else {
        showError('لم يتم العثور على إحصائيات لهذه المباراة المحددة');
      }
    } catch (e) {
      showError('فشل الاتصال بمزود البيانات API');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSaveStats = async () => {
    if (!selectedMatch) return showError('الرجاء اختيار مباراة أولاً');
    
    setLoading(true);
    try {
      await updateDoc(doc(db, 'matches', selectedMatch), {
        stats: matchStatsManual,
        updatedAt: new Date().toISOString()
      });
      showToast('تمت إضافة الإحصائيات يدوياً بنجاح', 'success');
    } catch (e) {
      showError('فشل الحفظ اليدوي للإحصائيات');
    } finally {
      setLoading(false);
    }
  };

  const handleFetchAPILeagues = async () => {
    let apiKey = import.meta.env.VITE_API_KEY || apiConfig.apiFootballKey;
    if (!apiKey) return showError('الرجاء إدخال مفتاح API Football في الإعدادات أولاً');
    
    setFetchingLeagues(true);
    try {
      showToast('جاري جلب البطولات من API...', 'info');
      const res = await apiClient.get('/leagues', {
        headers: { 
          'x-apisports-key': apiKey,
          'x-rapidapi-key': apiKey
        }
      });
      const data = res.data;
      if (data.response) {
        setApiLeagues(data.response);
        showToast('تم جلب قائمة البطولات بنجاح', 'success');
      } else {
        showError('فشل جلب البطولات من API');
      }
    } catch (e) {
      showError('حدث خطأ أثناء جلب البطولات');
    } finally {
      setFetchingLeagues(false);
    }
  };

  const handleAutoMatchLeagues = async () => {
    if (apiLeagues.length === 0) return showError('قم بجلب البطولات من API أولاً');
    let matchedCount = 0;
    
    // Simple matching algorithm: compare names
    const newMappings = { ...localLeagueMappings };
    
    leagues.forEach(localLeague => {
       const lName = localLeague.name.toLowerCase();
       const matchedApi = apiLeagues.find(al => {
           const apiName = al.league.name.toLowerCase();
           return apiName.includes(lName) || lName.includes(apiName);
       });
       
       if (matchedApi) {
           newMappings[localLeague.id] = {
               apiLeagueId: matchedApi.league.id,
               apiSeason: matchedApi.seasons[matchedApi.seasons.length - 1]?.year || new Date().getFullYear()
           };
           matchedCount++;
       }
    });
    
    setLocalLeagueMappings(newMappings);
    showToast(`تم العثور على مطابقة لـ ${matchedCount} بطولات من أصل ${leagues.length}`, 'success');
  };

  const handleSaveLeagueMapping = async (leagueId: string) => {
      const mapping = localLeagueMappings[leagueId];
      if (!mapping || !mapping.apiLeagueId) return showError('الرجاء تعيين رقم تعريف API للبطولة');
      
      setLoading(true);
      try {
          await updateDoc(doc(db, 'leagues', leagueId), {
              apiLeagueId: Number(mapping.apiLeagueId),
              apiSeason: Number(mapping.apiSeason)
          });
          showToast('تم حفظ مطابقة البطولة', 'success');
      } catch (e) {
          showError('خطأ أثناء حفظ البطولة');
      } finally {
          setLoading(false);
      }
  };

  const handleFetchStandings = async (leagueId: string) => {
    setLoading(true);
    try {
      showToast('جاري جلب التركيب...', 'info');
      const success = await fetchAndUpdateLeagueStandings(leagueId);
      if (success) {
        showToast('تم جلب وتحديث جدول الترتيب بنجاح', 'success');
      } else {
        showError('فشل جلب جدول الترتيب، تأكد من الربط ومفتاح API');
      }
    } catch (e) {
      showError('حدث خطأ غير متوقع أثناء جلب جدول الترتيب');
    } finally {
      setLoading(false);
    }
  };

  const handleFetchAllStandings = async () => {
    setLoading(true);
    try {
      showToast('جاري تحديث جميع جداول الترتيب المربوطة...', 'info');
      const res = await fetchAndUpdateAllMatchedLeagues();
      showToast(`تم تحديث ${res.success} بطولات، وفشل ${res.failed}`, 'success');
    } catch (e) {
      showError('حدث خطأ أثناء التحديث الشامل');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <h2 className="text-2xl font-black flex items-center gap-3">
          <BarChart2 className="text-primary" /> الإحصائيات والترتيب
        </h2>
        
        <div className="flex bg-white/5 p-1 rounded-xl w-fit">
          <button 
            onClick={() => setActiveTab('MATCH_STATS')}
            className={cn("px-4 py-2 rounded-lg text-xs font-black transition-all", activeTab === 'MATCH_STATS' ? "bg-primary text-black shadow-lg" : "text-gray-500 hover:text-white")}
          >
            إحصائيات المباريات
          </button>
          <button 
            onClick={() => setActiveTab('LEAGUE_STANDINGS')}
            className={cn("px-4 py-2 rounded-lg text-xs font-black transition-all", activeTab === 'LEAGUE_STANDINGS' ? "bg-primary text-black shadow-lg" : "text-gray-500 hover:text-white")}
          >
            ترتيب الدوريات
          </button>
          <button 
            onClick={() => setActiveTab('API_CONFIG')}
            className={cn("px-4 py-2 rounded-lg text-xs font-black transition-all", activeTab === 'API_CONFIG' ? "bg-primary text-black shadow-lg" : "text-gray-500 hover:text-white")}
          >
            إعدادات الـ API
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'MATCH_STATS' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} key="match_stats" className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glass p-6 rounded-3xl border border-white/5 space-y-6">
              <h3 className="font-black text-lg flex items-center gap-2"><Activity className="text-primary" size={20} /> اختيار وجلب</h3>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-500">اختر مباراة لإدارة إحصائياتها</label>
                <select 
                  className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl font-bold"
                  value={selectedMatch}
                  onChange={e => {
                     setSelectedMatch(e.target.value);
                     const m = matches.find(x => x.id === e.target.value);
                     if (m && m.stats) setMatchStatsManual(m.stats);
                  }}
                >
                  <option value="" className="text-black">-- اختر المباراة --</option>
                  {matches.map(m => (
                    <option key={m.id} value={m.id} className="text-black">{m.homeTeam} ضد {m.awayTeam} - {m.league}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-gray-500">API Fixture ID (لجلب بيانات من API)</label>
                 <input 
                   placeholder="مثال: 123456" 
                   className="w-full bg-white/5 border border-white/10 p-3 rounded-2xl font-bold text-center"
                   value={fixtureId}
                   onChange={e => setFixtureId(e.target.value)}
                 />
              </div>

              <button 
                onClick={handleFetchMatchStats}
                disabled={loading}
                className="w-full bg-[#111827] border border-white/10 text-white font-black py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 hover:bg-white/5 transition-all"
              >
                {loading ? <RefreshCw className="animate-spin" size={18} /> : <Globe size={18} />} جلب إحصائيات من API
              </button>
            </div>

            <div className="glass p-6 rounded-3xl border border-white/5 space-y-6">
              <h3 className="font-black text-lg flex items-center gap-2"><Edit3 className="text-primary" size={20} /> إدخال / تعديل يدوي</h3>
              
              {["possession", "shots", "shotsOnTarget", "corners", "yellowCards", "redCards"].map(stat => (
                <div key={stat} className="flex items-center gap-4">
                  <div className="flex-1 space-y-1 text-center">
                    <input 
                      type="number"
                      className="w-full bg-white/5 border border-white/10 p-3 rounded-xl font-black text-center"
                      value={matchStatsManual[stat]?.home || 0}
                      onChange={e => setMatchStatsManual({...matchStatsManual, [stat]: {...matchStatsManual[stat], home: parseInt(e.target.value) || 0}})}
                    />
                    <label className="text-[10px] font-bold text-gray-400">مستضيف</label>
                  </div>
                  <div className="shrink-0 w-24 text-center font-black text-xs uppercase text-primary">
                    {stat.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                  <div className="flex-1 space-y-1 text-center">
                    <input 
                      type="number"
                      className="w-full bg-white/5 border border-white/10 p-3 rounded-xl font-black text-center"
                      value={matchStatsManual[stat]?.away || 0}
                      onChange={e => setMatchStatsManual({...matchStatsManual, [stat]: {...matchStatsManual[stat], away: parseInt(e.target.value) || 0}})}
                    />
                    <label className="text-[10px] font-bold text-gray-400">ضيف</label>
                  </div>
                </div>
              ))}

              <button 
                onClick={handleManualSaveStats}
                disabled={loading}
                className="w-full bg-primary text-black font-black py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 hover:scale-105 transition-all mt-4"
              >
                {loading ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />} حفظ يدوي
              </button>
            </div>
          </motion.div>
        )}

        {activeTab === 'LEAGUE_STANDINGS' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} key="league_standings" className="space-y-6">
            <div className="glass p-6 rounded-3xl border border-white/5 flex flex-col md:flex-row gap-4 items-center justify-between">
              <div>
                <h3 className="text-xl font-black flex items-center gap-2"><Trophy className="text-primary" /> مطابقة البطولات</h3>
                <p className="text-gray-400 text-sm mt-1">اربط بطولاتك برقم التعريف (ID) الخاص بـ API لتتمكن من استيراد جدول الترتيب.</p>
              </div>
              <div className="flex bg-[#111827] p-2 rounded-2xl gap-2 shadow-inner">
                 <button 
                   onClick={handleFetchAPILeagues}
                   disabled={fetchingLeagues}
                   className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-white font-bold text-sm flex items-center gap-2 transition-all"
                 >
                   {fetchingLeagues ? <RefreshCw className="animate-spin" size={16} /> : <Globe size={16} />} جلب قاموس البطولات
                 </button>
                 <button 
                   onClick={handleAutoMatchLeagues}
                   disabled={apiLeagues.length === 0}
                   className="px-4 py-2 bg-primary hover:scale-105 rounded-xl text-black font-black text-sm transition-all disabled:opacity-50 disabled:hover:scale-100"
                 >
                   مطابقة ذكية للكل
                 </button>
                 <button 
                   onClick={handleFetchAllStandings}
                   disabled={loading}
                   className="px-4 py-2 bg-emerald-500 hover:scale-105 rounded-xl text-white font-black text-sm transition-all flex items-center gap-2"
                 >
                   {loading ? <RefreshCw className="animate-spin" size={16} /> : <Activity size={16} />} تحديث كل القوائم
                 </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {leagues.map(league => (
                <div key={league.id} className="glass border border-white/5 p-5 rounded-3xl flex flex-col justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img src={league.logo} alt={league.name} className="w-10 h-10 object-contain drop-shadow-md" />
                    <h4 className="font-bold">{league.name}</h4>
                    {league.standings && <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full mr-auto border border-green-500/30">لديه ترتيب</span>}
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] text-gray-500 font-bold block mb-1">API League ID</label>
                      <input 
                        type="number"
                        className="w-full bg-black/40 border border-white/10 p-2 text-sm rounded-xl text-center focus:border-primary transition-colors font-mono"
                        value={localLeagueMappings[league.id]?.apiLeagueId || ''}
                        onChange={e => setLocalLeagueMappings({...localLeagueMappings, [league.id]: {...localLeagueMappings[league.id], apiLeagueId: e.target.value as any}})}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 font-bold block mb-1">الموسم (مثال: 2023)</label>
                      <input 
                        type="number"
                        className="w-full bg-black/40 border border-white/10 p-2 text-sm rounded-xl text-center focus:border-primary transition-colors font-mono"
                        value={localLeagueMappings[league.id]?.apiSeason || ''}
                        onChange={e => setLocalLeagueMappings({...localLeagueMappings, [league.id]: {...localLeagueMappings[league.id], apiSeason: e.target.value as any}})}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 mt-2">
                    <button 
                      onClick={() => handleSaveLeagueMapping(league.id)}
                      disabled={loading}
                      className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                    >
                      <Save size={14} /> حفظ الربط
                    </button>
                    {(localLeagueMappings[league.id]?.apiLeagueId && localLeagueMappings[league.id]?.apiSeason) && (
                      <button 
                        onClick={() => handleFetchStandings(league.id)}
                        disabled={loading}
                        className="w-full py-2 bg-[#111827] text-primary hover:bg-white/5 border border-primary/20 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-lg"
                      >
                         <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> استيراد الترتيب
                      </button>
                    )}
                  </div>
                </div>
              ))}
              
              {leagues.length === 0 && (
                <div className="col-span-full text-center py-10 text-gray-500 font-bold">
                  لا يوجد بطولات مضافة. يرجى إضافة بطولات من الإدارة أولاً.
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'API_CONFIG' && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} key="api_config" className="glass p-8 rounded-3xl border border-white/5 max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                <Key size={24} />
              </div>
              <div>
                <h3 className="font-black text-lg">إعدادات مزودي الإحصائيات</h3>
                <p className="text-[10px] text-gray-500 font-bold">لإمكانية جلب بيانات المباريات والترتيب بشكل آلي دقيق</p>
              </div>
            </div>

            <div className="space-y-4">
               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-gray-500 px-1">API-Football Key (RapidAPI)</label>
                 <input 
                   type="password"
                   placeholder="أدخل مفتاح API Football"
                   className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl font-mono text-sm tracking-widest focus:border-primary transition-all"
                   value={apiConfig.apiFootballKey}
                   onChange={e => setApiConfig({...apiConfig, apiFootballKey: e.target.value})}
                 />
               </div>
            </div>

            <div className="pt-4">
              <button 
                onClick={handleSaveConfig}
                disabled={loading}
                className="bg-primary text-black px-8 py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 hover:scale-105 transition-all shadow-xl shadow-primary/20 w-full"
              >
                {loading ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />} حفظ الإعدادات
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
