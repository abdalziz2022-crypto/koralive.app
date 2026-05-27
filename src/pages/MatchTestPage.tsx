import React, { useEffect, useState, useMemo } from 'react';
import { getLiveMatches, testFootballApi, getTodayMatches } from '../api/footballApi';
import { mapFootballDataResponse, MappedMatch } from '../services/matchMapper';
import MatchCard from '../components/match/MatchCard';
import { RefreshCw, Radio, Info, ShieldAlert, CheckCircle, Flame, Layers, Clock, Check } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { cn } from '../lib/utils';

const DEMO_MATCHES: MappedMatch[] = [
  {
    id: 1101,
    homeTeam: {
      name: "ريال مدريد",
      crest: "https://crests.thesportsdb.com/images/media/team/badge/7v99p01602012028.png",
      tla: "RMA"
    },
    awayTeam: {
      name: "برشلونة",
      crest: "https://crests.thesportsdb.com/images/media/team/badge/v48u831602008272.png",
      tla: "BAR"
    },
    score: {
      home: 2,
      away: 1
    },
    homeScore: 2,
    awayScore: 1,
    status: "LIVE",
    competition: {
      name: "الدوري الإسباني - لاليغا",
      emblem: "https://crests.thesportsdb.com/images/media/league/badge/wtvrmu1421114241.png"
    },
    utcDate: new Date().toISOString()
  },
  {
    id: 1102,
    homeTeam: {
      name: "مانشستر سيتي",
      crest: "https://crests.thesportsdb.com/images/media/team/badge/vqpvyv1430932269.png",
      tla: "MCI"
    },
    awayTeam: {
      name: "ليفربول",
      crest: "https://crests.thesportsdb.com/images/media/team/badge/09ff931533134375.png",
      tla: "LIV"
    },
    score: {
      home: 0,
      away: 0
    },
    homeScore: 0,
    awayScore: 0,
    status: "SCHEDULED",
    competition: {
      name: "الدوري الإنجليزي الممتاز",
      emblem: "https://crests.thesportsdb.com/images/media/league/badge/pwtgq11421114674.png"
    },
    utcDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 1103,
    homeTeam: {
      name: "بايرن ميونخ",
      crest: "https://crests.thesportsdb.com/images/media/team/badge/b2g9e31533131713.png",
      tla: "FCB"
    },
    awayTeam: {
      name: "بوروسيا دورتموند",
      crest: "https://crests.thesportsdb.com/images/media/team/badge/6t297g1533131362.png",
      tla: "BVB"
    },
    score: {
      home: 3,
      away: 1
    },
    homeScore: 3,
    awayScore: 1,
    status: "FINISHED",
    competition: {
      name: "الدوري الألماني - البوندسليغا",
      emblem: "https://crests.thesportsdb.com/images/media/league/badge/066vpe1533033502.png"
    },
    utcDate: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 1104,
    homeTeam: {
      name: "باريس سان جيرمان",
      crest: "https://crests.thesportsdb.com/images/media/team/badge/rwvwpw1430932822.png",
      tla: "PSG"
    },
    awayTeam: {
      name: "أولمبيك مارسيليا",
      crest: "https://crests.thesportsdb.com/images/media/team/badge/qtqywy1430932871.png",
      tla: "OM"
    },
    score: {
      home: 1,
      away: 1
    },
    homeScore: 1,
    awayScore: 1,
    status: "PAUSED",
    competition: {
      name: "الدوري الفرنسي - ليغ 1",
      emblem: "https://crests.thesportsdb.com/images/media/league/badge/6ttgsu1421114144.png"
    },
    utcDate: new Date().toISOString()
  }
];

export default function MatchTestPage() {
  const [mappedMatches, setMappedMatches] = useState<MappedMatch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshingSilent, setIsRefreshingSilent] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(30);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [usingDemoData, setUsingDemoData] = useState<boolean>(false);
  const [publishingStatus, setPublishingStatus] = useState<'idle' | 'publishing' | 'success' | 'no-matches' | 'error'>('idle');
  const [publishingCount, setPublishingCount] = useState<number>(0);
  
  // Tabs: 'ALL' | 'LIVE' | 'FINISHED' | 'SCHEDULED'
  const [activeTab, setActiveTab] = useState<'ALL' | 'LIVE' | 'FINISHED' | 'SCHEDULED'>('ALL');

  const fetchMatches = async (isSilent = false) => {
    if (!isSilent) {
      setLoading(true);
    } else {
      setIsRefreshingSilent(true);
    }
    setPublishingStatus('idle');
    setPublishingCount(0);
    setError(null);
    try {
      // 1. Run the test function (logs & verifies credentials/connectivity)
      await testFootballApi();
      
      // 2. Fetch live & today's matches to guarantee list is ready
      let data = await getLiveMatches().catch(() => null);
      let matchSourceList = data?.matches || [];
      
      // Fallback: If no live matches, fetch today's schedule
      if (matchSourceList.length === 0) {
        console.log("No live matches found, loading today's full schedule...");
        const todayData = await getTodayMatches().catch(() => null);
        if (todayData && todayData.matches) {
          matchSourceList = todayData.matches;
          data = todayData;
        }
      }
      
      if (data && matchSourceList) {
        const mapped = matchSourceList.map((m: any) => mapFootballDataResponse(m));
        setMappedMatches(mapped);
        setUsingDemoData(false);
        
        // 3. Automatically publish retrieved matches to Firestore 'matches' collection
        if (mapped.length > 0) {
          setPublishingStatus('publishing');
          let count = 0;
          for (const rawMatch of matchSourceList) {
            const matchId = `fd_${rawMatch.id}`;
            const scoreHome = rawMatch.score?.fullTime?.home ?? 0;
            const scoreAway = rawMatch.score?.fullTime?.away ?? 0;
            
            // Map status
            let finalStatus: 'LIVE' | 'UPCOMING' | 'FINISHED' = 'LIVE';
            if (rawMatch.status === 'FINISHED') {
              finalStatus = 'FINISHED';
            } else if (['TIMED', 'SCHEDULED', 'POSTPONED'].includes(rawMatch.status || '')) {
              finalStatus = 'UPCOMING';
            }
            
            const dbPayload = {
              homeTeam: rawMatch.homeTeam?.name || 'غير محدد',
              awayTeam: rawMatch.awayTeam?.name || 'غير محدد',
              homeLogo: rawMatch.homeTeam?.crest || '',
              awayLogo: rawMatch.awayTeam?.crest || '',
              homeScore: scoreHome,
              awayScore: scoreAway,
              status: finalStatus,
              league: rawMatch.competition?.name || 'الدوري غير معروف',
              leagueLogo: rawMatch.competition?.emblem || '',
              startTime: rawMatch.utcDate || new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              streamingLinks: []
            };
            
            await setDoc(doc(db, 'matches', matchId), dbPayload, { merge: true });
            count++;
          }
          setPublishingCount(count);
          setPublishingStatus('success');
        } else {
          setPublishingStatus('no-matches');
        }
      } else {
        throw new Error('No match data returned from free endpoint');
      }
    } catch (err: any) {
      console.error('Error in fetch and auto-publish matches, falling back to demo data:', err);
      // Fallback beautifully
      setMappedMatches(DEMO_MATCHES);
      setUsingDemoData(true);
      setPublishingStatus('error');
      // Set light warning description instead of a full block page halt
      setError(`خطأ الاتصال: ${err.message || '404'}. تم استخدام قائمة المباريات التفاعلية المعروضة بدلاً من المخطط الفارغ.`);
    } finally {
      setLoading(false);
      setIsRefreshingSilent(false);
    }
  };

  useEffect(() => {
    fetchMatches(false);
  }, []);

  useEffect(() => {
    if (!autoRefreshEnabled) return;

    setCountdown(30);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchMatches(true);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [autoRefreshEnabled]);

  // Filtering processed matches
  const filteredMatches = useMemo(() => {
    if (activeTab === 'ALL') return mappedMatches;
    if (activeTab === 'LIVE') {
      return mappedMatches.filter(m => m.status === 'LIVE' || m.status === 'PAUSED');
    }
    if (activeTab === 'FINISHED') {
      return mappedMatches.filter(m => m.status === 'FINISHED');
    }
    if (activeTab === 'SCHEDULED') {
      return mappedMatches.filter(m => m.status === 'SCHEDULED' || m.status === 'POSTPONED');
    }
    return mappedMatches;
  }, [mappedMatches, activeTab]);

  return (
    <div className="min-h-screen bg-[#070d19] text-white pt-24 pb-12 px-4 sm:px-6 md:px-8 font-sans transition-all duration-300">
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/5 pb-6">
          <div className="space-y-1 text-center sm:text-right">
            <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-indigo-500 flex items-center justify-center sm:justify-start gap-3">
              <Radio className="text-emerald-500 animate-pulse shrink-0" size={28} />
              جدول المباريات الذكي
            </h1>
            <p className="text-xs text-gray-400 font-bold">
              تحديثات حية ومجردة للمباريات النشطة والقادمة من بطولة football-data API
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Auto refresh status toggle badge */}
            <button
              onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all duration-300 cursor-pointer",
                autoRefreshEnabled 
                  ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20" 
                  : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
              )}
            >
              <span className={cn(
                "w-2 h-2 rounded-full",
                autoRefreshEnabled ? "bg-indigo-400 animate-pulse" : "bg-gray-500"
              )}></span>
              {autoRefreshEnabled ? `تحديث تلقائي: نشط (${countdown}ث)` : 'تفعيل التحديث التلقائي'}
            </button>

            <button
              onClick={() => fetchMatches(false)}
              disabled={loading || isRefreshingSilent}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-black px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-lg shadow-emerald-500/10 disabled:opacity-50"
            >
              <RefreshCw size={14} className={(loading || isRefreshingSilent) ? 'animate-spin' : ''} />
              {isRefreshingSilent ? 'جاري التحديث...' : 'تحديث البيانات'}
            </button>
          </div>
        </div>

        {/* API Credentials Info Banner */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex gap-3 text-xs leading-relaxed text-blue-300">
          <Info size={18} className="shrink-0 mt-0.5 text-blue-400" />
          <div className="space-y-1">
            <p className="font-extrabold text-blue-200">معلومات الاتصال بالخدمة:</p>
            <p>قاعدة العناوين: <span className="font-mono bg-black/30 px-1.5 py-0.5 rounded text-white">{(import.meta.env.VITE_FOOTBALL_DATA_BASE) || 'https://api.football-data.org/v4'}</span></p>
            <p className="text-[11px] text-gray-400">تستخدم الصفحة خادماً وسيطاً مؤمّنًا (Secure Server-Side Proxy) لتخطي مشاكل CORS وطلبات CORS المحظورة وحماية المفاتيح الحيوية.</p>
          </div>
        </div>

        {/* Dynamic Publishing Status Card */}
        {!loading && (
          <div className={cn(
            "p-5 rounded-2xl border transition-all duration-300 flex items-center justify-between gap-4 text-xs font-bold",
            publishingStatus === 'publishing' && "bg-amber-500/10 border-amber-500/20 text-amber-300 animate-pulse",
            publishingStatus === 'success' && "bg-emerald-500/10 border-emerald-500/20 text-emerald-300",
            publishingStatus === 'no-matches' && "bg-gray-500/10 border-white/5 text-gray-400",
            publishingStatus === 'error' && "bg-red-500/10 border-red-500/20 text-red-300"
          )}>
            <div className="flex items-center gap-3">
              {publishingStatus === 'publishing' && <RefreshCw className="animate-spin text-amber-400" size={18} />}
              {publishingStatus === 'success' && <CheckCircle className="text-emerald-400" size={18} />}
              {publishingStatus === 'no-matches' && <Info className="text-gray-400" size={18} />}
              {publishingStatus === 'error' && <ShieldAlert className="text-red-400" size={18} />}
              
              <div>
                <p className="text-white font-black text-sm">حالة النشر التلقائي للمباريات (Auto-Publish)</p>
                <p className="text-[10px] text-gray-400 mt-0.5 font-medium">
                  {publishingStatus === 'publishing' && 'جاري تصدير وتحديث وتزامن المباريات تلقائياً في قاعدة بيانات Firestore...'}
                  {publishingStatus === 'success' && `تم بنجاح تصدير وتزامن عدد (${publishingCount}) مباراة من API لتظهر لجميع المستخدمين في لوحة المباريات الحالية!`}
                  {publishingStatus === 'no-matches' && 'لم يتم العثور على مباريات اليوم لتعديلها بنظام النشر.'}
                  {publishingStatus === 'error' && 'فشل الاتصال أو نشر البيانات تلقائياً في قاعدة البيانات.'}
                </p>
              </div>
            </div>
            
            {publishingStatus === 'success' && (
              <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-black uppercase shrink-0">
                مزامنة نشطة ✓
              </span>
            )}
          </div>
        )}

        {/* Tab Filter Switcher */}
        {!loading && !error && (
          <div className="flex items-center justify-start gap-2 border-b border-white/5 pb-2 overflow-x-auto no-scrollbar scroll-smooth">
            <button
              onClick={() => setActiveTab('ALL')}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all duration-200 cursor-pointer",
                activeTab === 'ALL' ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/10" : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
              )}
            >
              <Layers size={13} />
              الكل ({mappedMatches.length})
            </button>
            <button
              onClick={() => setActiveTab('LIVE')}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all duration-200 cursor-pointer",
                activeTab === 'LIVE' ? "bg-red-500 text-white shadow-lg shadow-red-500/10" : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
              )}
            >
              <Flame size={13} className={activeTab === 'LIVE' ? 'animate-bounce' : ''} />
              مباشر الآن ({mappedMatches.filter(m => m.status === 'LIVE' || m.status === 'PAUSED').length})
            </button>
            <button
              onClick={() => setActiveTab('FINISHED')}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all duration-200 cursor-pointer",
                activeTab === 'FINISHED' ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/10" : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
              )}
            >
              <Check size={13} />
              المنتهية ({mappedMatches.filter(m => m.status === 'FINISHED').length})
            </button>
            <button
              onClick={() => setActiveTab('SCHEDULED')}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all duration-200 cursor-pointer",
                activeTab === 'SCHEDULED' ? "bg-amber-500 text-black shadow-lg shadow-amber-500/10" : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
              )}
            >
              <Clock size={13} />
              المجدولة ({mappedMatches.filter(m => m.status === 'SCHEDULED' || m.status === 'POSTPONED').length})
            </button>
          </div>
        )}

        {/* Loading Skeletons */}
        {loading && (
          <div className="grid gap-4 sm:grid-cols-1">
            {[1, 2, 3].map((idx) => (
              <div key={idx} className="bg-slate-900/30 border border-white/5 rounded-3xl p-5 space-y-4 animate-pulse">
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-white/5 rounded-full"></div>
                    <div className="h-3 w-28 bg-white/10 rounded"></div>
                  </div>
                  <div className="h-5 w-16 bg-white/10 rounded-full"></div>
                </div>
                <div className="grid grid-cols-12 gap-2 items-center py-4">
                  <div className="col-span-5 flex flex-col items-center gap-2">
                    <div className="w-12 h-12 bg-white/5 rounded-full"></div>
                    <div className="h-3 w-16 bg-white/10 rounded"></div>
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <div className="h-6 w-12 bg-white/10 rounded-xl"></div>
                  </div>
                  <div className="col-span-5 flex flex-col items-center gap-2">
                    <div className="w-12 h-12 bg-white/5 rounded-full"></div>
                    <div className="h-3 w-16 bg-white/10 rounded"></div>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-white/5 pt-3">
                  <div className="h-2 w-24 bg-white/5 rounded"></div>
                  <div className="h-2 w-12 bg-white/5 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State (Only show if not falling back to demo data) */}
        {error && !usingDemoData && (
          <div id="error-container" className="bg-red-500/5 border border-red-500/15 rounded-3xl p-8 text-center space-y-4 backdrop-blur-md">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
              <ShieldAlert size={28} />
            </div>
            <h3 className="text-base font-black text-red-400">فشل في جلب البيانات</h3>
            <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed font-bold">
              {error}
            </p>
            <button
              onClick={() => fetchMatches(false)}
              className="mt-2 bg-red-500/10 hover:bg-red-500 text-red-200 hover:text-white px-5 py-2.5 rounded-xl text-xs font-black transition-all border border-red-500/20 cursor-pointer"
            >
              إعادة المحاولة
            </button>
          </div>
        )}

        {/* Live Matches List Container (Empty / Content) */}
        {!loading && (!error || usingDemoData) && (
          <div className="space-y-4">
            {usingDemoData && (
              <div dir="rtl" className="bg-amber-500/5 border border-amber-500/15 rounded-2xl p-4 flex gap-3 text-xs leading-relaxed text-amber-300">
                <ShieldAlert size={18} className="shrink-0 mt-0.5 text-amber-400" />
                <div className="space-y-1 text-right">
                  <p className="font-extrabold text-amber-200 text-sm">تنبيه: نمط الاستعراض التجريبي نشط (Demo Mode)</p>
                  <p className="text-gray-400 font-medium">
                    تعذر الاتصال بـ <span className="font-mono bg-black/40 px-1 py-0.5 rounded text-white">football-data.org</span> (كود الحالة 404 أو تعذر إيجاد المسار).
                    يرجى تهيئة مفتاح الـ API الخاص بك باسم <span className="font-mono bg-black/40 px-1 py-0.5 rounded text-white">VITE_FOOTBALL_DATA_KEY</span> في خيارات الإعدادات الخاصة بـ AI Studio.
                  </p>
                  <p className="text-gray-500 text-[10px] font-bold">
                    * قمنا بتحميل قائمة مباريات تفاعلية حية افتراضية للحفاظ على استعراض التصميم والتحكم به.
                  </p>
                </div>
              </div>
            )}

            {filteredMatches.length === 0 ? (
              <div className="bg-white/[0.01] border border-white/5 rounded-3xl p-12 text-center space-y-3">
                <p className="text-gray-400 text-sm font-black">لا توجد مباريات مطابقة للفلتر المحدد في هذه اللحظة.</p>
                <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                  هذا يعني عمومًا عدم وجود مباريات في الفئة المختارة مجدولة لهذا اليوم بالتوقيت المحلي الحالي.
                </p>
              </div>
            ) : (
              <div className={`grid gap-6 grid-cols-1 ${
                filteredMatches.length === 1 
                  ? 'md:max-w-md mx-auto w-full' 
                  : filteredMatches.length === 2 
                    ? 'md:grid-cols-2 md:max-w-4xl mx-auto w-full' 
                    : 'md:grid-cols-2 lg:grid-cols-3'
              }`}>
                {filteredMatches.map((m) => (
                  <MatchCard key={m.id} match={m} />
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
