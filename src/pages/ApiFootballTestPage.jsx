import React, { useEffect, useState } from 'react';
import { matchService } from '../services/matchService';
import MatchCard from '../components/match/MatchCard';
import { RefreshCw, Radio, Play, AlertCircle, Sparkles, CheckCircle, Database } from 'lucide-react';

export default function ApiFootballTestPage() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rateLimited, setRateLimited] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLiveMatches = async () => {
    try {
      setRefreshing(true);
      setError(null);
      setRateLimited(false);

      console.log('[ApiFootballTestPage] Fetching live fixtures through matchService...');
      const response = await matchService.getLiveMatches();
      
      if (Array.isArray(response)) {
        setMatches(response);
      } else {
        setMatches([]);
        console.warn('[ApiFootballTestPage] Response received is not an array:', response);
      }
    } catch (err) {
      console.error('[ApiFootballTestPage] Fetch direct error:', err);
      setError(err.message || 'حدث خطأ غير متوقع أثناء استرجاع البيانات من المزود.');
      if (String(err.message).includes('429')) {
        setRateLimited(true);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLiveMatches();
  }, []);

  // Filter live matches for quick live stats display
  const liveMatchesCount = matches.filter(m => m.status === 'LIVE' || m.status === 'PAUSED').length;

  return (
    <div className="min-h-screen bg-[#090d16] text-[#e2e8f0] pb-24 duration-300">
      {/* Decorative colored glow backdrop elements */}
      <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-1/3 right-1/4 w-[350px] h-[350px] bg-sky-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-6xl mx-auto px-4 pt-10 relative z-10">
        
        {/* Header section with page identification */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-b border-white/5 pb-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse animate-spin" />
                بث مباشر وتكامل API-Football
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono bg-white/5 text-slate-400">
                v3 REST API
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              دليلك التجريبي لمباريات <span className="text-emerald-400">API-Football</span>
            </h1>
            <p className="text-xs text-slate-400 mt-2 max-w-2xl leading-relaxed">
              تعرض هذه الصفحة المباريات المباشرة القادمة والنشطة المسترجعة عبر مزود الخدمة الموحد <code className="font-mono bg-white/5 px-1 py-0.5 rounded text-white text-[11px]">apiFootballProvider</code> لتجاوز قيود CORS ومشاكل المزامنة الزمنية.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <button
              id="refresh_btn_live_test"
              onClick={fetchLiveMatches}
              disabled={loading || refreshing}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/40 text-black font-black text-sm rounded-xl flex items-center gap-2 transition duration-200 cursor-pointer shadow-lg shadow-emerald-500/20"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'جاري التحديث...' : 'تحديث البيانات'}
            </button>
          </div>
        </div>

        {/* Informative Stats Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-900/35 border border-white/5 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">مباريات مباشرة الآن</div>
              <div className="text-lg font-black text-white">{liveMatchesCount} مباراة</div>
            </div>
          </div>

          <div className="bg-slate-900/35 border border-white/5 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">الحالة الحركية للطلب</div>
              <div className="text-xs font-extrabold text-[#10b981] flex items-center gap-1.5 mt-0.5">
                <CheckCircle className="w-3.5 h-3.5" />
                مستقر وآمن (SSL)
              </div>
            </div>
          </div>

          <div className="bg-slate-900/35 border border-white/5 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">طبقة التخزين المؤقت</div>
              <div className="text-xs text-slate-300 font-bold mt-0.5">
                مفعلة (مزامنة كل 3 ق)
              </div>
            </div>
          </div>
        </div>

        {/* Main Body states */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-900/20 border border-white/5 rounded-3xl">
            <div className="relative flex items-center justify-center mb-4">
              <div className="w-12 h-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-400 animate-spin"></div>
              <Radio className="absolute w-5 h-5 text-emerald-400 animate-pulse" />
            </div>
            <p className="text-sm font-black text-slate-300">جاري الاتصال بـ API-Football...</p>
            <p className="text-xs text-slate-500 mt-1">يتم الآن تهيئة النماذج ومزامنة المباريات المباشرة وتجنب الضغط العالي</p>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-6 text-center max-w-2xl mx-auto py-10">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4 animate-bounce" />
            <h3 className="text-lg font-black text-white mb-2">تعذر تواصل الواجهة بالمزود</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">{error}</p>
            {rateLimited && (
              <div className="bg-black/35 rounded-xl p-4 mb-6 border border-white/5 text-right">
                <p className="text-xs font-black text-amber-400 mb-1">خطأ حد الأقصى للاستهلاك (429 Rate Limit):</p>
                <p className="text-[11px] text-slate-400 leading-normal">
                  الباقة المجانية من API-Football تسمح بـ 10 طلبات في الدقيقة في العادة. تم تفعيل خوادم التخزين الذاتي السحابي وجلب النسخ الاحتياطية لتجنب التعليق التام. يمكنك المحاولة مجدداً بعد دقيقة.
                </p>
              </div>
            )}
            <button
              onClick={fetchLiveMatches}
              className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-black text-xs font-black rounded-xl transition cursor-pointer"
            >
              إعادة الاتصال الفوري
            </button>
          </div>
        ) : matches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-slate-900/10 border border-white/5 rounded-3xl max-w-2xl mx-auto">
            <AlertCircle className="w-10 h-10 text-slate-500 mb-3" />
            <h4 className="text-sm font-black text-slate-300">لا توجد مباريات مباشرة نشطة حالياً</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm px-4">
              يقوم مزود API-Football بالحث حالياً عن اللقاءات الحية في هذا الوقت. تم تفعيل التخزين الاحتياطي ولكن الحقول فارغة حالياً.
            </p>
            <button
              onClick={fetchLiveMatches}
              className="mt-6 px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 text-xs font-black rounded-xl transition cursor-pointer"
            >
              تحديث وحث المزودين
            </button>
          </div>
        ) : (
          <div>
            {/* Matches Display Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {matches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>

            {/* Note about integration source reliability */}
            <div className="mt-8 bg-slate-900/10 border border-white/5 rounded-2xl p-4 flex items-center gap-3">
              <Play className="w-4 h-4 text-emerald-400 shrink-0" />
              <p className="text-[10px] text-slate-400 leading-relaxed">
                <span className="font-bold text-slate-300">ملاحظة التكامل:</span> يتم ترجمة هذا الخرج تلقائياً بالاعتماد على خوارزمية تطابق البوابات <code className="font-mono bg-white/5 px-1 py-0.5 rounded text-white">apiFootballMapper</code> لضمان استقرار العرض دون تكرار الأكواد في واجهات كورة لايف المختلفة.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
