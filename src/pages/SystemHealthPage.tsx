import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Wifi, 
  Cpu, 
  Database, 
  Sparkles, 
  History, 
  ArrowRight, 
  RefreshCw, 
  Key, 
  ShieldCheck, 
  Clock 
} from 'lucide-react';
import { useError } from '../context/ErrorContext';

interface ServiceStatus {
  name: string;
  status: 'CONNECTED ✅' | 'INVALID KEY ❌' | 'RATE LIMITED ⚠️' | 'NETWORK ERROR ⚠️' | string;
  isConfigured: boolean;
  isValid: boolean;
  isQuotaExceeded: boolean;
  lastSuccess: string | null;
  error: string;
}

interface DiagnosisReport {
  apiFootball: ServiceStatus;
  gemini: ServiceStatus;
  firebase: ServiceStatus;
  server: ServiceStatus;
  cache: ServiceStatus;
}

export default function SystemHealthPage() {
  const navigate = useNavigate();
  const { showToast, showError } = useError();
  const [isRunningCheck, setIsRunningCheck] = useState(false);
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  const [report, setReport] = useState<DiagnosisReport | null>(null);

  const runFullSystemCheck = async () => {
    setIsRunningCheck(true);
    try {
      const response = await fetch('/api/diagnostics/run-tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setReport(data);
        setLastChecked(new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        showToast('تم اكتمال فحص حالة النظام بالكامل وحفظ التقارير!', 'success');
      } else {
        throw new Error('فشل الرد من خادم تشخيص الأنظمة البديلة');
      }
    } catch (err: any) {
      console.error(err);
      showError('تعذر الحصول على تشخيصات حية من خادم التطبيق مجهول الهوية.');
    } finally {
      setIsRunningCheck(false);
    }
  };

  useEffect(() => {
    runFullSystemCheck();
  }, []);

  const getStatusBadge = (status: string) => {
    if (status.includes('CONNECTED')) {
      return (
        <span className="inline-flex items-center gap-1 my-1 px-3 py-1.5 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-405 border border-emerald-500/20">
          <CheckCircle2 size={13} className="text-emerald-400" />
          <span>متصل كلياً CONNECTED ✅</span>
        </span>
      );
    }
    if (status.includes('INVALID KEY')) {
      return (
        <span className="inline-flex items-center gap-1 my-1 px-3 py-1.5 rounded-full text-xs font-black bg-red-500/10 text-red-500 border border-red-500/20">
          <XCircle size={13} className="text-red-400" />
          <span>مفتاح غير صالح INVALID KEY ❌</span>
        </span>
      );
    }
    if (status.includes('RATE LIMITED')) {
      return (
        <span className="inline-flex items-center gap-1 my-1 px-3 py-1.5 rounded-full text-xs font-black bg-amber-500/10 text-amber-500 border border-amber-500/20">
          <AlertTriangle size={13} className="text-amber-400 animate-pulse" />
          <span>تجاوز الحصة RATE LIMITED ⚠️</span>
        </span>
      );
    }
    // Network Error or Fallback
    return (
      <span className="inline-flex items-center gap-1 my-1 px-3 py-1.5 rounded-full text-xs font-black bg-blue-500/10 text-blue-400 border border-blue-500/20">
        <Wifi size={13} className="text-blue-400" />
        <span>خطأ بالاتصال NETWORK ERROR ⚠️</span>
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-white py-12 px-4 sm:px-6 lg:px-8 font-sans" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Breadcrumb */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-gray-400 font-bold mb-1">
              <span className="hover:text-primary cursor-pointer transition-colors" onClick={() => navigate('/admin')}>لوحة التحكم</span>
              <span>/</span>
              <span className="text-white">صحيفة حالة الأنظمة التشغيلية</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-primary to-emerald-400 tracking-tight">
              لوحة فحص ومراقبة استقرار النظام (System Health)
            </h1>
            <p className="text-xs text-gray-450 font-bold">
              مراقبة حية، فحص استجابات APIs حقيقية، وتحليل كفاءة الربط السحابي مع Firebase و Gemini و API-Football.
            </p>
          </div>

          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2 text-xs font-bold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2.5 rounded-xl border border-white/5 transition-all"
          >
            <ArrowRight size={14} />
            <span>العودة للمركز الرئيسي</span>
          </button>
        </div>

        {/* Global Warning Banner if keys are missing */}
        {report && (!report.apiFootball.isValid || !report.gemini.isValid) && (
          <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-right space-y-2 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-32 h-32 bg-amber-500/5 rounded-full filter blur-2xl pointer-events-none" />
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="text-sm font-black text-white">لم يتم إعداد مصدر البيانات بكفاءة كبرى بعد!</h4>
                <p className="text-xs text-amber-300 font-bold leading-relaxed mt-1">
                  أحد مفاتيح البيئة غير صالح أو مفقود. يرجى مراجعة إعدادات Vercel لضمان تزويد جمهور البث المباشر للأهداف والأخبار الرياضية بلحظة المزامنة الفائقة.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action controls & Last checked */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-white/[0.02] border border-white/5 rounded-3xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <Activity size={20} className={isRunningCheck ? "animate-spin" : ""} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold">آخر فحص شامل للشبكة والترخيص</p>
              <p className="text-sm font-black text-white font-mono mt-0.5">
                {lastChecked ? lastChecked : 'جاري تشغيل الفحص الأول...'}
              </p>
            </div>
          </div>

          <button
            onClick={runFullSystemCheck}
            disabled={isRunningCheck}
            className="w-full sm:w-auto bg-primary text-black font-black text-xs px-6 py-3.5 rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all cursor-pointer shadow-lg shadow-primary/10 select-none"
          >
            <RefreshCw size={14} className={isRunningCheck ? "animate-spin" : ""} />
            <span>{isRunningCheck ? 'تبادل حزم البيانات وفحص المفاتيح...' : 'تشغيل فحص النظام بالكامل (Run Full Check)'}</span>
          </button>
        </div>

        {/* Five Health Components Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          
          {/* 1. API Health */}
          <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/5 space-y-3 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 font-black">API-Football</span>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                <Wifi size={16} />
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold">بث ومزامنة المباريات</p>
              <h3 className="text-sm font-black text-white mt-1">
                {report ? report.apiFootball.status.split(' ')[0] : 'جاري الفحص...'}
              </h3>
            </div>
            <div className="text-[10px] text-gray-500 font-bold pt-2 border-t border-white/5">
              API Health Portal
            </div>
          </div>

          {/* 2. Server Health */}
          <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/5 space-y-3 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 font-black">Server Node</span>
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
                <Cpu size={16} />
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold">موجهات وخادم التشغيل</p>
              <h3 className="text-sm font-black text-white mt-1">
                {report ? report.server.status.split(' ')[0] : 'جاري الفحص...'}
              </h3>
            </div>
            <div className="text-[10px] text-gray-500 font-bold pt-2 border-t border-white/5">
              Render Node Health
            </div>
          </div>

          {/* 3. Firebase Health */}
          <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/5 space-y-3 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 font-black">Firebase Database</span>
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
                <Database size={16} />
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold">استقرار وحفظ الجداول</p>
              <h3 className="text-sm font-black text-white mt-1">
                {report ? report.firebase.status.split(' ')[0] : 'جاري الفحص...'}
              </h3>
            </div>
            <div className="text-[10px] text-gray-500 font-bold pt-2 border-t border-white/5">
              Cloud Firestore
            </div>
          </div>

          {/* 4. AI Health */}
          <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/5 space-y-3 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 font-black">Gemini AI</span>
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
                <Sparkles size={16} />
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold">توليد التوقعات والأخبار</p>
              <h3 className="text-sm font-black text-white mt-1">
                {report ? report.gemini.status.split(' ')[0] : 'جاري الفحص...'}
              </h3>
            </div>
            <div className="text-[10px] text-gray-500 font-bold pt-2 border-t border-white/5">
              Google GenAI SDK
            </div>
          </div>

          {/* 5. Cache Health */}
          <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/5 space-y-3 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 font-black">Memory Cache</span>
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
                <History size={16} />
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold">تراجع وحفظ طلبات الشبكة</p>
              <h3 className="text-sm font-black text-white mt-1">
                {report ? report.cache.status.split(' ')[0] : 'جاري الفحص...'}
              </h3>
            </div>
            <div className="text-[10px] text-gray-500 font-bold pt-2 border-t border-white/5">
              InMemory Cache Proxy
            </div>
          </div>

        </div>

        {/* Detailed Status Matrices (Report columns) */}
        {report && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <ShieldCheck className="text-primary" size={20} />
                <span>التقرير التفصيلي لصلاحية المفاتيح وتدفق الشبكة</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {Object.entries(report).map(([key, service]: [string, ServiceStatus]) => {
                return (
                  <div 
                    key={key} 
                    className="glass p-6 rounded-[2rem] border border-white/5 bg-white/[0.01] space-y-4 hover:border-white/10 transition-all text-right"
                  >
                    {/* Header line */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-primary font-bold">
                          {key === 'apiFootball' && <Wifi size={14} />}
                          {key === 'gemini' && <Sparkles size={14} />}
                          {key === 'firebase' && <Database size={14} />}
                          {key === 'server' && <Cpu size={14} />}
                          {key === 'cache' && <History size={14} />}
                        </div>
                        <h3 className="font-black text-sm text-white">{service.name}</h3>
                      </div>
                      <div>
                        {getStatusBadge(service.status)}
                      </div>
                    </div>

                    {/* Report Table Matrix */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold">
                      
                      <div className="bg-black/30 p-4 rounded-xl space-y-1">
                        <span className="text-gray-500 block">هل المفتاح موجود بالخادم؟</span>
                        <span className={service.isConfigured ? 'text-emerald-400 font-black' : 'text-red-400 font-black'}>
                          {service.isConfigured ? '🟢 نعم (موجود بالبيئة)' : '🔴 لا (مفقود)'}
                        </span>
                      </div>

                      <div className="bg-black/30 p-4 rounded-xl space-y-1">
                        <span className="text-gray-500 block">هل المفتاح صالح ومصرح؟</span>
                        <span className={service.isValid ? 'text-emerald-400 font-black' : 'text-red-400 font-black'}>
                          {service.isValid ? '🟢 سليم ومصرح به' : '🔴 غير صالح (تالف)'}
                        </span>
                      </div>

                      <div className="bg-black/30 p-4 rounded-xl space-y-1">
                        <span className="text-gray-500 block">هل تم تجاوز حصة الاستهلاك؟</span>
                        <span className={service.isQuotaExceeded ? 'text-amber-400 font-black' : 'text-emerald-400 font-black'}>
                          {service.isQuotaExceeded ? '⚠️ نعم متجاوزة (كود 8)' : '🟢 لا (سقف الحصة سليم)'}
                        </span>
                      </div>

                      <div className="bg-black/30 p-4 rounded-xl space-y-1">
                        <span className="text-gray-500 block flex items-center gap-1.5 justify-start">
                          <Clock size={11} className="text-gray-400" />
                          <span>آخر وقت نجاح للاتصال</span>
                        </span>
                        <span className="text-gray-300 font-mono text-[11px] block text-left sm:text-right" style={{ direction: 'ltr' }}>
                          {service.lastSuccess ? new Date(service.lastSuccess).toLocaleString('en-US', { hour12: false }) : 'لا توجد قراءة سابقة'}
                        </span>
                      </div>

                    </div>

                    {/* Output/Error Box */}
                    <div className="p-3 bg-black/40 border border-white/5 rounded-xl font-mono text-[11px] leading-relaxed text-gray-400 flex flex-col">
                      <span className="text-gray-500 block mb-1 font-sans font-bold">ملاحظات ونتائج الاختبار الإداري:</span>
                      <p className="font-semibold text-white leading-normal" style={{ wordBreak: 'break-word', direction: 'rtl' }}>
                        {service.error}
                      </p>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
