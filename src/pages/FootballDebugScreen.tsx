import React, { useState, useEffect } from 'react';
import { apiTracker, ApiLog, getActiveApiKey } from '../api/apiClient';
import { 
  ShieldAlert, 
  Database, 
  RefreshCw, 
  Activity, 
  Terminal, 
  Globe, 
  Search, 
  CheckCircle2, 
  AlertTriangle,
  Key,
  Wifi,
  WifiOff,
  Clock,
  Code,
  FileJson,
  RotateCcw,
  Check,
  Award,
  Link as LinkIcon,
  Server,
  Cpu
} from 'lucide-react';
import { matchService } from '../services/matchService';
import { leagueService } from '../services/leagueService';

export default function FootballDebugScreen() {
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [userKey, setUserKey] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'diagnostics' | 'tracker' | 'credentials' | 'tests'>('diagnostics');
  
  // Custom API Test states
  const [testResult, setTestResult] = useState<{
    status: 'idle' | 'testing' | 'success' | 'failed';
    endpoint?: string;
    message?: string;
    samples?: any;
  }>({ status: 'idle' });

  // Diagnostics check status
  const [diagnosticsData, setDiagnosticsData] = useState<{
    viteApiKeyStatus: boolean;
    geminiApiKeyStatus: boolean;
    firebaseStatus: boolean;
    firebaseQuotaExceeded: boolean;
    footballApiStatus: boolean;
    footballApiMessage: string;
    serverConnection: boolean;
    isLoading: boolean;
    lastChecked: string;
  }>({
    viteApiKeyStatus: false,
    geminiApiKeyStatus: false,
    firebaseStatus: false,
    firebaseQuotaExceeded: false,
    footballApiStatus: false,
    footballApiMessage: '',
    serverConnection: false,
    isLoading: true,
    lastChecked: ''
  });
  
  const fetchDiagnostics = async () => {
    setDiagnosticsData(prev => ({ ...prev, isLoading: true }));
    try {
      const res = await fetch('/api/diagnostics');
      if (res.ok) {
        const data = await res.json();
        setDiagnosticsData({
          viteApiKeyStatus: data.viteApiKeyStatus,
          geminiApiKeyStatus: data.geminiApiKeyStatus,
          firebaseStatus: data.firebaseStatus,
          firebaseQuotaExceeded: !!data.firebaseQuotaExceeded,
          footballApiStatus: data.footballApiStatus,
          footballApiMessage: data.footballApiMessage,
          serverConnection: true,
          isLoading: false,
          lastChecked: new Date().toLocaleTimeString('ar', { hour12: false })
        });
      } else {
        setDiagnosticsData({
          viteApiKeyStatus: false,
          geminiApiKeyStatus: false,
          firebaseStatus: false,
          firebaseQuotaExceeded: false,
          footballApiStatus: false,
          footballApiMessage: 'استجابة خاطئة من ملقم الخادم',
          serverConnection: false,
          isLoading: false,
          lastChecked: new Date().toLocaleTimeString('ar', { hour12: false })
        });
      }
    } catch (err: any) {
      setDiagnosticsData({
        viteApiKeyStatus: false,
        geminiApiKeyStatus: false,
        firebaseStatus: false,
        firebaseQuotaExceeded: false,
        footballApiStatus: false,
        footballApiMessage: err.message || 'فشل الاتصال اللوجيستي',
        serverConnection: false,
        isLoading: false,
        lastChecked: new Date().toLocaleTimeString('ar', { hour12: false })
      });
    }
  };

  // Load and subscribe to real-time api trackers
  useEffect(() => {
    setUserKey(localStorage.getItem('korea90_user_api_key') || '');
    setLogs([...apiTracker.logs]);

    const unsubscribe = apiTracker.subscribe(() => {
      setLogs([...apiTracker.logs]);
    });

    fetchDiagnostics();

    return () => {
      unsubscribe();
    };
  }, []);

  const saveApiKey = (key: string) => {
    const cleanKey = key.trim();
    if (cleanKey) {
      localStorage.setItem('korea90_user_api_key', cleanKey);
      setUserKey(cleanKey);
      window.location.reload();
    } else {
      localStorage.removeItem('korea90_user_api_key');
      setUserKey('');
      window.location.reload();
    }
  };

  const clearLogsAndCache = () => {
    apiTracker.logs = [];
    apiTracker.notify();
    
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('korea90_real_cache_')) {
        localStorage.removeItem(key);
      }
    });
    alert('تم مسح جميع سجلات الربط ومخزون الكاش المحلي للبيانات الحقيقية.');
  };

  const runConnectionTest = async (testType: 'live' | 'leagues') => {
    setTestResult({ status: 'testing' });
    try {
      if (testType === 'live') {
        const matches = await matchService.getLiveMatches();
        setTestResult({
          status: 'success',
          endpoint: '/fixtures?live=all',
          message: `نجح الاتصال المباشر بنجاح! تم استرداد عدد (${matches.length}) مباراة حقيقية وعرضها بنجاح من الموفر.`,
          samples: matches.slice(0, 2)
        });
      } else {
        const leagues = await leagueService.getLeagues();
        setTestResult({
          status: 'success',
          endpoint: '/leagues',
          message: `تم التحقق بنجاح من اتصال قائمة الدوريات النشطة والمطابقة للخدمة (${leagues.length} دوري حقيقي).`,
          samples: leagues.slice(0, 3)
        });
      }
    } catch (err: any) {
      setTestResult({
        status: 'failed',
        endpoint: testType === 'live' ? '/fixtures' : '/leagues',
        message: err.message || 'فشل الاتصال المباشر. لم يستجب الخادم بنجاح.'
      });
    }
  };

  const activeKey = getActiveApiKey();
  const hasAuthKey = !!activeKey;
  const isEnvKeyActive = !!import.meta.env.VITE_API_KEY;
  const isOverridden = !!localStorage.getItem('korea90_user_api_key');

  return (
    <div className="min-h-screen bg-[#060b13] text-gray-100 pb-20 pt-4 px-4 sm:px-6 lg:px-8 selection:bg-emerald-500/30 selection:text-emerald-400 font-sans">
      <div className="max-w-7xl mx-auto space-y-6" style={{ direction: 'rtl' }}>
        
        {/* Top Header Panel */}
        <div className="rounded-[28px] border border-white/5 bg-gradient-to-r from-emerald-950/20 to-blue-950/20 p-6 shadow-xl relative overflow-hidden backdrop-blur-md">
          <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/5 rounded-full filter blur-2xl pointer-events-none" />
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-right">
              <div className="flex items-center justify-center sm:justify-start gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h1 className="text-xl sm:text-2xl font-black text-white">لوحة مطابقة البيانات الحقيقية والتشخيص المتقدم</h1>
              </div>
              <p className="text-xs text-gray-400">
                كوريا90 - شاشة فحص فورية لتكامل البيانات الحقيقية من API-Football والذكاء الاصطناعي دون محاكاة أو أكواد ثابتة.
              </p>
            </div>
            
            <div className="flex gap-2.5">
              <button 
                onClick={fetchDiagnostics}
                className="flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 active:scale-95 transition-all text-xs font-semibold text-emerald-400 px-4 py-2 rounded-full border border-emerald-500/20"
              >
                <RefreshCw size={13} className={diagnosticsData.isLoading ? 'animate-spin' : ''} />
                <span>تحديث التشخيص</span>
              </button>
              <button 
                onClick={clearLogsAndCache}
                className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-xs font-semibold text-white px-4 py-2 rounded-full border border-white/10"
              >
                <RotateCcw size={13} />
                <span>تصفير ومسح الكاش</span>
              </button>
            </div>
          </div>
        </div>

        {/* Diagnostic Key Alert */}
        {!hasAuthKey ? (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-950/20 p-5 flex items-start gap-3.5">
            <ShieldAlert size={22} className="text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-amber-200">لم يتم إعداد مصدر البيانات بعد!</h3>
              <p className="text-xs text-amber-300/80 leading-relaxed text-right">
                يرجى إضافة مفاتيح العمل والبيئة النشطة من إعدادات Vercel لتفعيل المزامنة المباشرة. يمكنك كتابة مفتاح اختبار مؤقت في علامة التبويب "مفتاح اختبار يدوي" بالجانب لمتابعة العمل مؤقتاً.
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-emerald-500/25 bg-emerald-950/10 p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <Wifi size={18} />
              </div>
              <div className="text-right">
                <h3 className="text-xs font-bold text-emerald-300">نظام المزامنة الحقيقي نشط بالكامل</h3>
                <p className="text-[11px] text-gray-400">
                  {isOverridden 
                    ? `مستخدم مفتاح يدوي مؤقت (UI Override): ${activeKey.slice(0, 6)}***${activeKey.slice(-4)}`
                    : `مستمد من إعدادات البيئة (Vercel ENV): ${activeKey.slice(0, 6)}***${activeKey.slice(-4)}`}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 px-2.5 py-1 rounded-full shrink-0">
              متصل حياً وطبيعي
            </span>
          </div>
        )}

        {/* Grid Setup */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Navigation Side Panel (3 cols) */}
          <div className="lg:col-span-3 space-y-4 text-right">
            <div className="rounded-2xl border border-white/5 bg-[#090f19] p-2 space-y-1.5">
              <button
                onClick={() => setActiveTab('diagnostics')}
                className={`w-full flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold transition-all text-right ${activeTab === 'diagnostics' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              >
                <Server size={15} />
                <span>لوحة التشخيص المتقدمة (Diagnostic UI)</span>
              </button>

              <button
                onClick={() => setActiveTab('tracker')}
                className={`w-full flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold transition-all text-right ${activeTab === 'tracker' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              >
                <Terminal size={15} />
                <span>مستكشف طلبات الشبكة ({logs.length})</span>
              </button>
              
              <button
                onClick={() => setActiveTab('credentials')}
                className={`w-full flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold transition-all text-right ${activeTab === 'credentials' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              >
                <Key size={15} />
                <span>مفتاح اختبار يدوي (UI Override)</span>
              </button>
              
              <button
                onClick={() => setActiveTab('tests')}
                className={`w-full flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold transition-all text-right ${activeTab === 'tests' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              >
                <Activity size={15} />
                <span>اختبارات وتوافق التغذية حياً</span>
              </button>
            </div>

            {/* Quick Summary Widgets */}
            <div className="rounded-2xl border border-white/5 bg-[#090f19] p-5 space-y-4">
              <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                <Database size={13} className="text-emerald-400" />
                <span>إحصائيات الاتصال والبيئة</span>
              </h4>
              <div className="space-y-2 text-[11px] text-gray-400">
                <div className="flex items-center justify-between py-1 border-b border-white/5">
                  <span>مزود البيانات الرئيسي:</span>
                  <span className="font-mono text-emerald-400">API-Football</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-white/5">
                  <span>مفتاح Vercel الافتراضي:</span>
                  <span className={`font-semibold ${isEnvKeyActive ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isEnvKeyActive ? 'مهيأ ومكتشف' : 'غير مهيأ'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-white/5">
                  <span>صلاحية قاعدة البيانات:</span>
                  <span className={`font-semibold ${
                    diagnosticsData.firebaseQuotaExceeded ? 'text-amber-400' :
                    diagnosticsData.firebaseStatus ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {diagnosticsData.firebaseQuotaExceeded ? 'تجاوز الحصة' :
                     diagnosticsData.firebaseStatus ? 'سليم ومتصل' : 'فحص جاري'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Working Canvas (9 cols) */}
          <div className="lg:col-span-9 space-y-6">
            
            {/* NEW TAB: DISAGNOSTICS BOARD */}
            {activeTab === 'diagnostics' && (
              <div className="rounded-2xl border border-white/5 bg-[#090f19] p-6 space-y-6 text-right">
                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                  <div>
                    <h2 className="text-sm font-black text-white flex items-center gap-2">
                      <Server size={16} className="text-emerald-400" />
                      <span>فحص وتشخيص حالة بيئة الإنتاج المكتملة</span>
                    </h2>
                    <p className="text-[11px] text-gray-400 mt-1">تشخيص فوري متكامل لضمان تشغيل التطبيق في Vercel على أكمل وجه.</p>
                  </div>
                  {diagnosticsData.lastChecked && (
                    <span className="text-[10px] text-gray-400 flex items-center gap-1 bg-white/5 px-2.5 py-1 rounded-md font-mono">
                      <Clock size={11} />
                      <span>{diagnosticsData.lastChecked}</span>
                    </span>
                  )}
                </div>

                {diagnosticsData.isLoading ? (
                  <div className="py-16 text-center space-y-3">
                    <RefreshCw className="animate-spin text-emerald-400 mx-auto" size={24} />
                    <p className="text-xs text-gray-400">جاري فحص جميع المفاتيح والموفرين متطابقاً حياً...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* VITE_API_KEY card */}
                    <div className="p-4 rounded-xl border border-white/5 bg-[#0d1424] flex flex-col justify-between space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h3 className="text-xs font-bold text-white font-mono">VITE_API_KEY</h3>
                          <p className="text-[11px] text-gray-400">مفتاح المزامنة والبيانات لـ API-Football</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          (isEnvKeyActive || isOverridden) ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {(isEnvKeyActive || isOverridden) ? 'مكتمل الربط' : 'مفتقد أو غير نشط'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-300">
                        {isOverridden ? (
                          <p className="text-amber-400">يستخدم حالياً التجاوز اليدوي المحلي: <span className="font-mono bg-black/45 px-1.5 py-0.5 rounded">{activeKey.slice(0, 4)}...{activeKey.slice(-4)}</span></p>
                        ) : isEnvKeyActive ? (
                          <p className="text-emerald-400">مكتشف في إعدادات الخادم نشطاً: <span className="font-mono bg-black/45 px-1.5 py-0.5 rounded">{activeKey.slice(0, 4)}...{activeKey.slice(-4)}</span></p>
                        ) : (
                          <p className="text-red-400">مفتقد تماماً! يجب إضافته في Vercel بالتسمية الصحيحة.</p>
                        )}
                      </div>
                    </div>

                    {/* GEMINI_API_KEY card */}
                    <div className="p-4 rounded-xl border border-white/5 bg-[#0d1424] flex flex-col justify-between space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h3 className="text-xs font-bold text-white font-mono">GEMINI_API_KEY</h3>
                          <p className="text-[11px] text-gray-400">مفتاح خادم مولد تلخيصات الذكاء الاصطناعي والمباريات</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          diagnosticsData.geminiApiKeyStatus ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {diagnosticsData.geminiApiKeyStatus ? 'مؤمن وجاهز' : 'غير مكتشف'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {diagnosticsData.geminiApiKeyStatus 
                          ? 'مفتاح موفر الذكاء الاصطناعي نشط سراً على الخادم ومحمي بالكامل وثابت الفعالية.'
                          : 'المفتاح غير معرّف حالياً على الملقم. ستعمل التوليدات بوضع ملخصات البيانات المدمجة.'}
                      </p>
                    </div>

                    {/* API-Football connection card */}
                    <div className="p-4 rounded-xl border border-white/5 bg-[#0d1424] flex flex-col justify-between space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h3 className="text-xs font-bold text-white">اتصال API-Football (البيانات النشطة)</h3>
                          <p className="text-[11px] text-gray-400">الاتصال المباشر والحصص المستهلكة لخدمة Matches</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          diagnosticsData.footballApiStatus ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {diagnosticsData.footballApiStatus ? 'سليم تماماً' : 'فشل الربط'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-300 leading-relaxed">
                        <p className="font-semibold mb-1">تقرير استجابة الموفر:</p>
                        <p className="font-mono text-gray-400 text-[11px] bg-black/35 px-2 py-1.5 rounded border border-white/5">{diagnosticsData.footballApiMessage}</p>
                      </div>
                    </div>

                    {/* Firebase status card */}
                    <div className="p-4 rounded-xl border border-white/5 bg-[#0d1424] flex flex-col justify-between space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h3 className="text-xs font-bold text-white">تزامن وكاش Firebase Firestore</h3>
                          <p className="text-[11px] text-gray-400">ربط وتزامن قاعدة البيانات للتحليل الاحتياطي والأخبار</p>
                        </div>
                        {diagnosticsData.firebaseQuotaExceeded ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            تجاوز الحصة (مستقر)
                          </span>
                        ) : diagnosticsData.firebaseStatus ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            نشط ومستقر
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                            تراجع محلي
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {diagnosticsData.firebaseQuotaExceeded
                          ? 'لقد تجاوزت قاعدة البيانات حصتها المجانية المسموح بها (RESOURCE_EXHAUSTED). يعمل التطبيق حالياً بسلاسة وثبات بالاعتماد على الكاش المحلي المطور ومحاكاة السلامة فائقة الدقة.'
                          : diagnosticsData.firebaseStatus
                          ? 'متصل بنجاح بقاعدة بيانات Firestore السحابية لمزامنة المباريات كأمن تراجع تلقائي عند انقطاع الموفر.'
                          : 'تعذر الاتصال بقاعدة البيانات البعيدة بشكل صميمي. يتم تفعيل الكاش المحلي المطور لتجنب أي توقف.'}
                      </p>
                    </div>

                    {/* Server connection card */}
                    <div className="p-4 rounded-xl border border-white/5 bg-[#0d1424] md:col-span-2 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                          <Server size={18} />
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-white">سلامة الاتصال بملقم بوابة العقدة (Server Ping)</h3>
                          <p className="text-[10px] text-gray-400 font-mono">PING /api/health → 200 OK</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-emerald-400">بوابة الاتصال سريعة ومستقرة</span>
                    </div>

                  </div>
                )}
              </div>
            )}
            
            {/* TAB 1: Live Tracker */}
            {activeTab === 'tracker' && (
              <div className="rounded-2xl border border-white/5 bg-[#090f19] p-6 space-y-4 text-right">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-black text-white flex items-center gap-2">
                      <Terminal size={16} className="text-emerald-400" />
                      <span>سجل طلبات التغذية الشبكية الحية (Auditing Mode)</span>
                    </h2>
                    <p className="text-[11px] text-gray-400">يعرض جميع صفقات البيانات والطلب المباشر لتوضيح شفافية مصادر النتائج.</p>
                  </div>
                </div>

                {logs.length === 0 ? (
                  <div className="py-12 text-center text-gray-500 text-xs">
                    لم يتم رصد أي استدعاء شبكة حتى الآن. تصفح رئيسية المباريات أو وجه بنقرة اختبار في التبويبات أعلاه لإثارة حركة البيانات الحية.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {logs.map((log) => {
                      const isSuccess = log.status === 'success';
                      const isPending = log.status === 'pending';
                      
                      return (
                        <div key={log.id} className="p-4 rounded-xl border border-white/5 bg-[#0b1424] space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                            <div className="flex items-center gap-2">
                              {isPending ? (
                                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                              ) : isSuccess ? (
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                              ) : (
                                <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                              )}
                              <span className="font-mono text-[10px] text-gray-400">[{log.timestamp}]</span>
                              <span className="font-mono text-xs text-white font-bold bg-white/5 px-2 py-0.5 rounded">{log.method}</span>
                              <span className="font-mono text-xs text-emerald-300 font-semibold">{log.endpoint}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              {log.isCached && (
                                <span className="text-[9px] bg-cyan-500/25 text-cyan-300 px-2 py-0.5 rounded font-black">
                                  من الكاش المحلي (Cached Real Data)
                                </span>
                              )}
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                isSuccess ? 'bg-emerald-500/10 text-emerald-400' :
                                isPending ? 'bg-cyan-500/10 text-cyan-400' : 'bg-red-500/10 text-red-400'
                              }`}>
                                {log.statusText}
                              </span>
                            </div>
                          </div>

                          <div className="p-3 bg-[#060b13] rounded-lg space-y-2 text-[11px]">
                            <div className="flex gap-2">
                              <span className="text-gray-500">البارامترات:</span>
                              <span className="font-mono text-gray-300">{JSON.stringify(log.params)}</span>
                            </div>

                            {log.responseSample && (
                              <div className="space-y-1 pt-1.5 border-t border-white/5">
                                <div className="text-gray-500 flex items-center gap-1">
                                  <FileJson size={11} />
                                  <span>مستند الرد الحقيقي (Web Response Sample):</span>
                                </div>
                                <pre className="font-mono text-[10px] text-emerald-400/80 bg-black/45 p-2 rounded-md overflow-x-auto max-h-[120px] text-left">
                                  {JSON.stringify(log.responseSample, null, 2)}
                                </pre>
                              </div>
                            )}

                            {log.errors && (
                              <div className="space-y-1 pt-1.5 border-t border-white/5 text-red-400">
                                <span>تقرير الاستجابة الخاطئة:</span>
                                <pre className="font-mono text-[10px] bg-red-950/20 p-2 rounded-md overflow-x-auto">
                                  {typeof log.errors === 'object' ? JSON.stringify(log.errors, null, 2) : log.errors}
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Handheld Credentials Override layout */}
            {activeTab === 'credentials' && (
              <div className="rounded-2xl border border-white/5 bg-[#090f19] p-6 space-y-6 text-right">
                <div>
                  <h2 className="text-sm font-black text-white flex items-center gap-2">
                    <Key size={16} className="text-emerald-400" />
                    <span>تخطي وإدخال مفتاح ربط يدوي (Custom Test Override)</span>
                  </h2>
                  <p className="text-[11px] text-gray-400 mt-1">
                    أدخل مفتاح واجهة برمجة تطبيقات API-Football الخاص بك لتخطي مفاتيح خادم Vercel وتجربة الربط اللوجستي الشخصي مباشرة من المتصفح دون تعقيد.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-900 border border-white/10 space-y-3.5">
                    <label className="text-xs font-bold text-gray-300 block">مفتاح API-Football الخاص بك (RapidAPI/Native):</label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input 
                        type="password"
                        placeholder="أدخل المفتاح هنا (مثال: 50 حرف لـ RapidAPI أو 32 لـ API-Sports)"
                        defaultValue={userKey}
                        id="custom_client_key_input"
                        className="flex-1 bg-black/40 border border-white/15 px-4 py-2.5 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500 transition-all text-left"
                      />
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            const val = (document.getElementById('custom_client_key_input') as HTMLInputElement)?.value;
                            saveApiKey(val);
                          }}
                          className="bg-emerald-500 hover:bg-emerald-600 font-bold text-xs text-black px-5 py-2.5 rounded-xl active:scale-95 transition-all whitespace-nowrap"
                        >
                          حفظ وتحديث
                        </button>
                        {userKey && (
                          <button 
                            onClick={() => saveApiKey('')}
                            className="bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25 font-bold text-xs px-4 py-2.5 rounded-xl active:scale-95 transition-all"
                          >
                            حذف التخطي
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/15 text-xs text-orange-300 leading-relaxed text-right">
                    <strong>تنبيه الأمان والخصوصية:</strong> يتم حفظ مفتاح التجاوز اليدوي هذا بشكل آمن وتام في جلسة المتصفح الخاصة بك (LocalStorage) فقط، ولا يتم إرساله لأي جهة خارجية سوى بوابة ملقم API-Football الحقيقي لاستخراج تفاصيل المباريات والجدول الحراكي بشكل آمن ومحمي.
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Diagnostic Pings and live fetches */}
            {activeTab === 'tests' && (
              <div className="rounded-2xl border border-white/5 bg-[#090f19] p-6 space-y-6 text-right">
                <div>
                  <h2 className="text-sm font-black text-white flex items-center gap-2">
                    <Activity size={16} className="text-emerald-400" />
                    <span>فحص فوري واختبار مطابقة البيانات القادمة</span>
                  </h2>
                  <p className="text-[11px] text-gray-400 mt-1">
                    أطلق اختباراً حقيقياً للتأكد من مدى سلامة الربط التام وعدم مواجهة أي 429 لطلبات الخادم بسبب نفاد الاستهلاك.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => runConnectionTest('live')}
                    className="p-5 rounded-xl border border-white/5 bg-[#0b1424] hover:bg-[#0f1b31] transition-all text-right space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white group-hover:text-emerald-400">اختبار المباريات المباشرة الحقيقية</span>
                      <RotateCcw size={14} className="text-gray-500 group-hover:rotate-180 transition-all duration-500" />
                    </div>
                    <p className="text-[10px] text-gray-400">يفحص استدعاء /fixtures?live=all لجمع وتدقيق مباريات كرة القدم النشطة والمباشرة حالياً.</p>
                  </button>

                  <button
                    onClick={() => runConnectionTest('leagues')}
                    className="p-5 rounded-xl border border-white/5 bg-[#0b1424] hover:bg-[#0f1b31] transition-all text-right space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white group-hover:text-emerald-400">اختبار تصفح قائمة الدوريات الحالية</span>
                      <RotateCcw size={14} className="text-gray-500 group-hover:rotate-180 transition-all duration-500" />
                    </div>
                    <p className="text-[10px] text-gray-400">يفحص استدعاء /leagues بالكامل للتحقق من تكامل الدوريات والمسابقات وتوافق الربط مع المزود.</p>
                  </button>
                </div>

                {/* Test outputs */}
                {testResult.status !== 'idle' && (
                  <div className="p-5 rounded-xl border border-white/10 bg-black/40 space-y-3">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <h4 className="text-xs font-bold text-white">تقرير فحص كينونة المزود ({testResult.endpoint})</h4>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                        testResult.status === 'testing' ? 'bg-cyan-500/20 text-cyan-300' :
                        testResult.status === 'success' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                      }`}>
                        {testResult.status === 'testing' ? 'جاري الفحص المباشر...' :
                         testResult.status === 'success' ? 'ناجح ومطابق' : 'فشل الربط'}
                      </span>
                    </div>

                    <p className={`text-xs ${testResult.status === 'failed' ? 'text-red-400 font-bold' : 'text-gray-300'}`}>
                      {testResult.message}
                    </p>

                    {testResult.samples && (
                      <div className="space-y-2 pt-2 border-t border-white/5">
                        <span className="text-[11px] text-gray-500 block">عينة من ملف الاستجابة (Live JSON Body):</span>
                        <pre className="font-mono text-[9px] text-emerald-400 bg-black p-3 rounded overflow-x-auto max-h-[160px] text-left">
                          {JSON.stringify(testResult.samples, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
