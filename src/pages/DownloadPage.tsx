import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Smartphone, 
  Layers, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowLeft, 
  Star, 
  Clock, 
  Tv, 
  Sparkles, 
  Flame, 
  ArrowDownToLine, 
  Info,
  Calendar,
  Share2,
  Lock,
  Compass,
  Trophy,
  Zap,
  Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useError } from '../context/ErrorContext';

export default function DownloadPage() {
  const navigate = useNavigate();
  const { showToast } = useError();
  
  // States for APK download simulation
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [downloadStep, setDownloadStep] = useState<'idle' | 'linking' | 'downloading' | 'completed'>('idle');

  // PWA states
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isPwaInstallable, setIsPwaInstallable] = useState(false);
  const [isPwaInstalled, setIsPwaInstalled] = useState(false);

  // Active Interactive Screenshot Tab
  const [activeScreenTab, setActiveScreenTab] = useState<'live' | 'ai' | 'leagues'>('live');

  // Simulated match state for interactive live matches screenshot mockup
  const [liveGoalCount, setLiveGoalCount] = useState({ home: 2, away: 1 });
  const [isMatchLive, setIsMatchLive] = useState(true);

  // SEO Optimization & HTML Head Updates
  useEffect(() => {
    // Save original title
    const originalTitle = document.title;
    
    // Set premium SEO title and description tags
    document.title = "تحميل تطبيق كورة لايف V2 - الإصدار الرياضي الأسرع للشرق الأوسط";
    
    // Inject or update meta description dynamically
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', 'تحميل النسخة الاحترافية من تطبيق كورة لايف V2. بث مباشر، إحصائيات دقيقة، وتوقعات الذكاء الاصطناعي للمباريات. حمل الآن APK وتثبيت PWA للجوال.');

    // Inject or update meta keywords
    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
      metaKeywords = document.createElement('meta');
      metaKeywords.setAttribute('name', 'keywords');
      document.head.appendChild(metaKeywords);
    }
    metaKeywords.setAttribute('content', 'تحميل كورة لايف, تطبيق بث مباريات, كورة لايف APK, تثبيت تطبيق كورة, توقعات المباريات والذكاء الاصطناعي, كورة 90');

    // Restore on unmount
    return () => {
      document.title = originalTitle;
    };
  }, []);

  // Listen to native PWA install trigger event
  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsPwaInstalled(true);
    }

    const handleBeforeInstallEvent = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsPwaInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsPwaInstallable(false);
      setIsPwaInstalled(true);
      setDeferredPrompt(null);
      showToast('تم تثبيت التطبيق بنجاح كـ PWA على جهازك!', 'success');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallEvent);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallEvent);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Simulate APK Download with realistic speed calculations and real payload trigger
  const handleApkDownload = () => {
    if (downloadStep === 'downloading') return;
    
    setDownloadStep('linking');
    setDownloadProgress(0);
    showToast('جاري تحضير خادم التحميل السريع لمجهزي APK...', 'success');

    setTimeout(() => {
      setDownloadStep('downloading');
      
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += Math.floor(Math.random() * 15) + 5;
        if (currentProgress >= 100) {
          currentProgress = 100;
          clearInterval(interval);
          setDownloadStep('completed');
          setDownloadProgress(null);
          showToast('تم اكتمال تحميل حزمة APK بنجاح! جاري تنزيل الملف...', 'success');
          
          // Trigger actual micro-payload or dummy file generator download
          const blob = new Blob(["Simulated Korea90 V2 Match Tracker Pro APK Binary Block"], { type: 'application/vnd.android.package-archive' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'korea90_v2_sports_pro.apk';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        } else {
          setDownloadProgress(currentProgress);
        }
      }, 250);
    }, 1200);
  };

  // Trigger PWA Installation flow
  const handlePwaInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsPwaInstallable(false);
      }
    } else {
      // Direct instructions fallback for iOS or Desktop without native triggered prompt
      const isIos = /ipad|iphone|ipod/.test(navigator.userAgent.toLowerCase());
      if (isIos) {
        alert('لتثبيت التطبيق على جهاز الآيفون (iOS Safari):\n١. اضغط على زر "مشاركة" (Share) في المتصفح.\n٢. اختر "إضافة إلى الشاشة الرئيسية" (Add to Home Screen).\n٣. اضغط على "إضافة" للاستمتاع فوراً.');
      } else {
        alert('لتثبيت التطبيق الفوري:\nاضغط على أيقونة التثبيت (➕) الموجودة في شريط البحث أعلى متصفح Chrome أو Edge وباشر التثبيت الفوري.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#06080c] text-white py-8 px-4 sm:px-6 lg:px-8 font-sans" dir="rtl">
      
      {/* Dynamic Background Accents */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-600/5 rounded-full filter blur-[100px] pointer-events-none" />

      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* Navigation Action */}
        <div className="flex items-center justify-between border-b border-white/5 pb-5">
          <button 
            onClick={() => navigate('/')} 
            className="flex items-center gap-2 text-xs font-black text-gray-400 hover:text-white transition-colors py-2 px-3.5 bg-white/5 rounded-xl border border-white/5"
          >
            <ArrowLeft size={14} className="transform rotate-180" />
            <span>العودة للرئيسية</span>
          </button>
          
          <div className="flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 py-1 px-3 rounded-full text-[10px] font-black">
            <Trophy size={11} />
            <span>تطبيق كروي معتمد وآمن 100%</span>
          </div>
        </div>

        {/* Brand App Store Header Section */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-white/[0.01] border border-white/5 p-8 rounded-[2.5rem] relative overflow-hidden backdrop-blur-md">
          {/* Neon corner glow */}
          <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-primary/10 to-transparent rounded-br-[2.5rem]" />
          
          {/* Logo & Info Block */}
          <div className="md:col-span-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-right">
            
            {/* App Icon */}
            <div className="relative w-28 h-28 bg-gradient-to-br from-primary via-emerald-500 to-black rounded-3xl p-1 flex items-center justify-center shadow-2xl shadow-primary/20 shrink-0 transform hover:rotate-3 transition-all duration-300">
              <div className="w-full h-full bg-[#080d16] rounded-[1.4rem] flex flex-col items-center justify-center relative overflow-hidden">
                <span className="font-sans font-black text-3xl text-primary tracking-tighter">K90</span>
                <span className="text-[10px] text-emerald-400 font-extrabold tracking-widest mt-1">PRO</span>
                <div className="absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-r from-primary to-emerald-500"></div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">كورة لايف V2 (الإصدار الرياضي الاحترافي)</h1>
                <p className="text-xs text-emerald-450 font-bold mt-1">شركة المطور العربي المتحدة للحلول الكروية</p>
              </div>

              {/* Badges / Rating Row */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs font-bold text-gray-400">
                <div className="flex items-center gap-1 text-yellow-500">
                  <Star size={13} fill="currentColor" />
                  <span className="text-white">4.9 / 5.0</span>
                  <span className="text-gray-500 text-[10px]">(+14 ألف مستخدم)</span>
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-gray-700" />
                <span className="text-white">14.2 MB (خفيف جداً)</span>
                <div className="w-1.5 h-1.5 rounded-full bg-gray-700" />
                <span className="text-[10px] bg-white/5 text-gray-250 px-2 py-0.5 rounded-lg border border-white/5">حجم اقتصادي</span>
              </div>

              <p className="text-xs sm:text-sm text-gray-400 font-medium leading-relaxed max-w-xl">
                أقوى تطبيق رياضي متطور وجاهز لتغطية كافة البطولات الرياضية والمباريات مباشرة دون تقطيع. يدعم الهواتف والأجهزة اللوحية مع تقديم تحليلات دقيقة مبنية بالكامل على الذكاء الاصطناعي.
              </p>
            </div>
          </div>

          {/* Core Interactive Action Card */}
          <div className="md:col-span-4 bg-white/[0.02] border border-white/5 rounded-3xl p-6 space-y-4 text-center">
            <span className="text-[10px] sm:text-xs text-gray-400 font-black block">اختر نظام التثبيت المفضل لديك</span>
            
            <div className="space-y-2">
              {/* PWA Direct Installation Action */}
              <button
                onClick={handlePwaInstall}
                className="w-full bg-gradient-to-r from-primary to-emerald-500 hover:from-emerald-500 hover:to-primary text-black font-black text-xs py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 transition-all cursor-pointer shadow-lg shadow-primary/10 select-none"
              >
                <Layers size={15} />
                <span>{isPwaInstalled ? '⚡ التطبيق مثبت بالفعل PWA' : 'تثبيت فوري بدون تحميل PWA'}</span>
              </button>

              {/* APK Downloader Trigger */}
              <button
                onClick={handleApkDownload}
                className="w-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white font-black text-xs py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 transition-all cursor-pointer select-none"
              >
                <Download size={14} className="text-primary animate-bounce" />
                <span>تحميل حزمة الجوال الـ APK</span>
              </button>
            </div>

            {/* APK Loading Progress Bar */}
            {downloadStep !== 'idle' && (
              <div className="space-y-1.5 text-right bg-black/40 p-3 rounded-2xl border border-white/5">
                <div className="flex justify-between items-center text-[10px] font-black">
                  <span className="text-gray-400 font-sans">
                    {downloadStep === 'linking' ? 'جاري تهيئة قناة الاتصال السحابية...' : 
                     downloadStep === 'downloading' ? `جاري تنزيل الملف: ${downloadProgress}%` : 'تم اكتمال تنزيل الملف!'}
                  </span>
                  <span className="text-white font-mono">{downloadProgress}%</span>
                </div>
                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-primary h-full transition-all duration-300 rounded-full"
                    style={{ width: `${downloadProgress ?? 0}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-gray-500">
              <ShieldCheck size={12} className="text-emerald-400 animate-pulse" />
              <span>فحص آمن ومطابق لمقاييس Play Protect</span>
            </div>
          </div>
        </div>

        {/* Technical Specification Specs Matrix */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl text-center space-y-1">
            <span className="text-[10px] text-gray-500 font-bold block">الإصدار الحالي للأندرويد</span>
            <span className="text-sm font-black text-white font-mono block">v2.4.0-stable</span>
          </div>
          <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl text-center space-y-1">
            <span className="text-[10px] text-gray-500 font-bold block">حجم حزمة APK التثبيتية</span>
            <span className="text-sm font-black text-emerald-400 font-mono block">14.2 MB</span>
          </div>
          <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl text-center space-y-1">
            <span className="text-[10px] text-gray-500 font-bold block">الحد الأدنى للنظام</span>
            <span className="text-sm font-black text-white block leading-relaxed">أندرويد 6.0 | متصفح حديث</span>
          </div>
          <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl text-center space-y-1">
            <span className="text-[10px] text-gray-500 font-bold block">تحديث الحماية والتصريح</span>
            <span className="text-xs font-black text-emerald-400 block py-0.5">معتمد ومؤمن بالكامل 🟢</span>
          </div>
        </div>

        {/* High-End App Screenshots Center - Fully Interactive Custom Mockups! */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Tv className="text-primary" size={20} />
                <span>معاينة واجهة وشاشات التطبيق المباشر (Screenshots)</span>
              </h2>
              <p className="text-xs text-gray-400 font-medium">معاينة تفاعلية حية لأكثر الشاشات وأسرعها جلباً للنتائج والبيانات</p>
            </div>
            
            {/* Screen Toggles tabs */}
            <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/5">
              <button
                onClick={() => setActiveScreenTab('live')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  activeScreenTab === 'live' ? 'bg-primary text-black' : 'text-gray-400 hover:text-white'
                }`}
              >
                شاشة المباريات حية
              </button>
              <button
                onClick={() => setActiveScreenTab('ai')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  activeScreenTab === 'ai' ? 'bg-primary text-black' : 'text-gray-400 hover:text-white'
                }`}
              >
                توقعات الذكاء الاصطناعي
              </button>
              <button
                onClick={() => setActiveScreenTab('leagues')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  activeScreenTab === 'leagues' ? 'bg-primary text-black' : 'text-gray-400 hover:text-white'
                }`}
              >
                جدول ترتيب البطولات
              </button>
            </div>
          </div>

          {/* Interactive Screen Container (designed like an elegant Phone Frame) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-white/[0.01] border border-white/5 p-6 sm:p-10 rounded-[2.5rem]">
            
            {/* Left side: Interactive Phone Screen Display */}
            <div className="md:col-span-5 flex justify-center">
              
              <div className="w-[280px] h-[540px] bg-slate-950 rounded-[2.8rem] border-[6px] border-slate-700 shadow-2xl relative overflow-hidden flex flex-col justify-between">
                
                {/* Phone Speaker Notch */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-28 h-6 bg-slate-700 rounded-b-2xl z-30 flex items-center justify-center">
                  <div className="w-10 h-1 bg-black rounded-full" />
                </div>

                {/* Simulated App Header */}
                <div className="p-4 pt-8 bg-[#090e18] border-b border-white/5 flex items-center justify-between text-right">
                  <span className="font-black text-xs text-white">كورة لايف V2</span>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[9px] text-red-400 font-extrabold font-mono">LIVE</span>
                  </div>
                </div>

                {/* Simulated Screen Body dynamic to tab */}
                <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-[#060a10]">
                  
                  {activeScreenTab === 'live' && (
                    <div className="space-y-3 animation-fade-in text-right">
                      <div className="p-3.5 bg-white/[0.02] border border-white/5 rounded-2xl space-y-2">
                        <div className="flex justify-between items-center text-[8px] text-gray-500 font-black">
                          <span>دوري أبطال أوروبا • الجولة 3</span>
                          <span className="text-red-500 font-mono animate-pulse">شوط 2 • '78</span>
                        </div>
                        
                        <div className="flex items-center justify-between py-1 text-center">
                          <div className="flex flex-col items-center gap-1 w-1/3">
                            <span className="text-[10px] font-black text-white leading-tight">ريال مدريد</span>
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#ffffff] to-amber-200 flex items-center justify-center font-bold text-[8px] text-black">RM</div>
                          </div>
                          
                          <div className="w-1/3 flex flex-col items-center">
                            <span className="text-lg font-mono font-black tracking-widest text-[#00ff82]">
                              {liveGoalCount.home} - {liveGoalCount.away}
                            </span>
                            <span className="bg-emerald-500/15 text-emerald-400 font-bold px-1.5 py-0.5 rounded text-[8px] mt-1">توقع AI: فوز RM</span>
                          </div>

                          <div className="flex flex-col items-center gap-1 w-1/3">
                            <span className="text-[10px] font-black text-white leading-tight">بايرن ميونخ</span>
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#ff1133] to-red-800 flex items-center justify-center font-bold text-[8px] text-white">FCB</div>
                          </div>
                        </div>

                        {/* Interactive Click triggers */}
                        <div className="pt-2 border-t border-white/5 flex justify-center gap-1">
                          <button 
                            onClick={() => setLiveGoalCount(prev => ({ ...prev, home: prev.home + 1 }))}
                            className="bg-primary/20 text-primary border border-primary/30 py-1 px-2 rounded-lg text-[8px] font-black hover:bg-primary hover:text-black transition-all cursor-pointer"
                          >
                            + هدف لريال مدريد
                          </button>
                          <button 
                            onClick={() => setLiveGoalCount({ home: 2, away: 1 })}
                            className="bg-white/5 text-gray-400 py-1 px-1.5 rounded-lg text-[8px] font-black"
                          >
                            تصفير
                          </button>
                        </div>
                      </div>

                      {/* Lineup Mock */}
                      <div className="p-3 bg-white/[0.01] border border-white/5 rounded-2xl space-y-1.5">
                        <span className="text-[8px] text-gray-500 font-bold block">أبرز أحداث المباراة الحية:</span>
                        <div className="space-y-1 font-mono text-[8.5px] leading-relaxed">
                          <div className="flex gap-2 items-center text-gray-300">
                            <span className="text-primary">'67</span>
                            <span>⚽ هدف تقليص الفارق لـ بايرن (هاري كين)</span>
                          </div>
                          <div className="flex gap-2 items-center text-gray-300">
                            <span className="text-primary">'54</span>
                            <span>⚽ هدف ريال مدريد الثاني (مبابي)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeScreenTab === 'ai' && (
                    <div className="space-y-3 animation-fade-in text-right">
                      {/* Generative UI preview */}
                      <div className="p-3.5 bg-gradient-to-br from-indigo-950/20 to-[#0e1726]/10 border border-indigo-500/10 rounded-2xl space-y-2">
                        <div className="flex justify-between items-center text-[8px] text-indigo-400 font-bold">
                          <span>ملخص التوقعات بالذكاء الاصطناعي</span>
                          <span className="flex items-center gap-1 bg-indigo-550/15 px-1.5 py-0.5 rounded">
                            <Sparkles size={8} />
                            <span>AI ANALYTICS</span>
                          </span>
                        </div>

                        <div className="space-y-2.5">
                          <div>
                            <span className="text-[10px] text-white font-black block">مقارنة القوة الهجومية:</span>
                            <div className="flex gap-2 items-center mt-1">
                              <span className="text-[8px] text-gray-400 font-bold w-12 text-left">ريال مدريد</span>
                              <div className="flex-1 bg-white/5 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-primary h-full rounded-full" style={{ width: '84%' }} />
                              </div>
                              <span className="text-[8.5px] font-mono text-white">84%</span>
                            </div>
                            <div className="flex gap-2 items-center mt-1">
                              <span className="text-[8px] text-gray-400 font-bold w-12 text-left">الخصم</span>
                              <div className="flex-1 bg-white/5 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-red-500 h-full rounded-full" style={{ width: '56%' }} />
                              </div>
                              <span className="text-[8.5px] font-mono text-white">56%</span>
                            </div>
                          </div>

                          <div className="bg-black/40 p-2.5 rounded-xl border border-white/5 text-[9px] text-gray-300 leading-relaxed font-sans">
                            📝 <span className="font-bold text-white">توصية المحلل الذكي:</span> ريال مدريد يملك احتمالية انتصار تصل لـ <span className="text-primary font-black">72.4%</span> بناءً على الاستمرارية التاريخية في البرنابيو وقوة خط وسطه الإبداعي.
                          </div>
                        </div>
                      </div>

                      {/* Small mock form */}
                      <div className="p-2.5 bg-white/[0.01] border border-white/5 rounded-xl flex items-center justify-between">
                        <span className="text-[8px] text-gray-400 font-bold">توليد توقع مخصص للمباراة</span>
                        <span className="text-[8px] bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded-md font-black">انقر للتوليد</span>
                      </div>
                    </div>
                  )}

                  {activeScreenTab === 'leagues' && (
                    <div className="space-y-3 animation-fade-in text-right">
                      {/* Standings list mock */}
                      <div className="p-3 bg-white/[0.01] border border-white/5 rounded-2xl space-y-2">
                        <span className="text-[9px] text-gray-400 font-black block">جدول الترتيب - الدوري الإسباني 🇪🇸</span>
                        
                        <div className="space-y-1.5 text-[8.5px]">
                          <div className="flex justify-between items-center p-1.5 bg-white/5 rounded-lg border border-white/5">
                            <span className="text-white font-black">1. برشلونة</span>
                            <span className="font-mono font-bold text-emerald-400">82 نقطة</span>
                          </div>
                          <div className="flex justify-between items-center p-1.5 bg-white/[0.02] rounded-lg">
                            <span className="text-gray-300 font-semibold">2. ريال مدريد</span>
                            <span className="font-mono text-gray-400">79 نقطة</span>
                          </div>
                          <div className="flex justify-between items-center p-1.5 bg-[#0a0f18]/40 rounded-lg">
                            <span className="text-gray-400 font-medium">3. أتلتيكو مدريد</span>
                            <span className="font-mono text-gray-500">68 نقطة</span>
                          </div>
                        </div>

                        <div className="text-[8px] text-gray-500 text-center font-bold font-mono">آخر تحديث: منذ دقيقتين</div>
                      </div>
                    </div>
                  )}

                </div>

                {/* Simulated Home Button Anchor */}
                <div className="p-4 bg-[#090e18] border-t border-white/5 flex justify-center">
                  <div className="w-20 h-1 bg-white/20 rounded-full" />
                </div>

              </div>

            </div>

            {/* Right side: Detailed Feature Bulletpoints corresponding is selected tab */}
            <div className="md:col-span-7 space-y-6">
              
              <div className="space-y-2">
                <span className="text-xs text-primary font-black uppercase tracking-wider block">تجربة فريدة متكاملة</span>
                <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                  {activeScreenTab === 'live' && 'بث مباشر لحظي بدون بطء أو استهلاك زائد للبيانات'}
                  {activeScreenTab === 'ai' && 'محرك توقعات متكامل قائم بالكامل على الذكاء الاصطناعي'}
                  {activeScreenTab === 'leagues' && 'أرقام وإحصائيات محدثة بشكل فوري لكل الأندية واللاعبين'}
                </h3>
                <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                  {activeScreenTab === 'live' && 'احصل على الأهداف والبطاقات وتغييرات التشكيل بنظام التنبيه الفوري الذكي. نقوم بضغط حزم البيانات لتوفير ما يزيد عن 60% من استهلاك خطة بيانتك المتنقلة.'}
                  {activeScreenTab === 'ai' && 'لا تكتفي بمشاهدة النتيجة، بل شارك في عمق التحليلات. يقوم الذكاء الاصطناعي بتحليل الأداء الحالي، مستويات التهديف، ومعطيات اللياقة لتوفير احتمالات فوز دقيقة للغاية.'}
                  {activeScreenTab === 'leagues' && 'جدول تفصيلي لترتيب هدافي الدوري، بطولات الكؤوس، تمرير الكرات الحاسمة، وتقييمات اللاعبين المحدثة مع نهاية كل صافرة مباشرة.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="p-4.5 bg-white/[0.02] border border-white/5 rounded-2xl space-y-1">
                  <span className="text-sm font-black text-white block">مزامنة تامة ⚽</span>
                  <p className="text-xs text-gray-450 leading-relaxed font-semibold">تحديث متطابق تماماً مع قنوات البث المباشر وبث الأهداف.</p>
                </div>

                <div className="p-4.5 bg-white/[0.02] border border-white/5 rounded-2xl space-y-1">
                  <span className="text-sm font-black text-white block">الوضع الاقتصادي للبيانات 📉</span>
                  <p className="text-xs text-gray-450 leading-relaxed font-semibold">الحد الأقصى للتوفير مع توفير الإحصاءات والأطوار الكروية.</p>
                </div>

                <div className="p-4.5 bg-white/[0.02] border border-white/5 rounded-2xl space-y-1">
                  <span className="text-sm font-black text-white block">تنبيهات فورية قابلة للتخصيص ⚡</span>
                  <p className="text-xs text-gray-450 leading-relaxed font-semibold">تلقي اهتزاز على الجوال مع كل غرس للأهداف لفريقك المفضّل.</p>
                </div>

                <div className="p-4.5 bg-white/[0.02] border border-white/5 rounded-2xl space-y-1">
                  <span className="text-sm font-black text-white block">محمي ومستقر تماماً 🔒</span>
                  <p className="text-xs text-gray-450 leading-relaxed font-semibold">تشفير تام لبيانات المستخدمين والمفضلة مع خيارات تأمين متعددة.</p>
                </div>

              </div>

              {/* Navigation button highlight inside display */}
              <div className="pt-2">
                <button
                  onClick={handlePwaInstall}
                  className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-black font-black text-xs px-5 py-3 rounded-xl transition-all cursor-pointer"
                >
                  <Activity size={14} className="animate-pulse" />
                  <span>ابدأ تجربة التطبيق الفورية الآن</span>
                </button>
              </div>

            </div>

          </div>
        </div>

        {/* Change Logs / Update History (سجل التحديثات) */}
        <div className="space-y-6">
          <div className="border-b border-white/5 pb-4">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Clock className="text-primary" size={20} />
              <span>سجل التحديثات والإصدارات للبرنامج (Changelog)</span>
            </h2>
            <p className="text-xs text-gray-400 font-medium">خط سير تطوير وتحسين كورة لايف V2 في الشرق الأوسط</p>
          </div>

          <div className="space-y-4">
            
            {/* Version 2.4.0 */}
            <div className="p-6 bg-white/[0.01] border border-white/5 rounded-2xl space-y-3 relative overflow-hidden text-right">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="bg-primary/20 text-primary border border-primary/30 px-2.5 py-1 rounded-lg text-xs font-black">v2.4.0 (الإصدار الحالي)</span>
                  <h3 className="font-black text-sm text-white">إطلاق نظام التنبؤ بالذكاء الاصطناعي الذاتي ومراقبة الخادم الآلي</h3>
                </div>
                <span className="text-[10px] text-gray-500 font-bold">تحديث: مايو 30، 2026</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                في هذا التحديث قمنا بإعادة صياغة شاشات المزامنة لتتلائم مع الخادم الذكي الجديد. يشمل الآن القدرة على فحص صحة ترخيص APIs وإطلاق لوحة تحكم إدارية تفاعلية لفنيي الأنظمة باللغة العربية.
              </p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-emerald-400 font-bold">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 size={12} className="shrink-0" />
                  <span>دمج واجهات Google GenAI SDK لتحليل وتوقع احتمالات الفوز.</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 size={12} className="shrink-0" />
                  <span>إطلاق صفحة تشخيصية شاملة للشبكة والسيرفر /admin/system-health.</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 size={12} className="shrink-0" />
                  <span>إصلاح مشكلة ثبات ومزامنة جداول الدوري الإسباني والإنجليزي.</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 size={12} className="shrink-0" />
                  <span>تقليل نسبة استهلاك الذاكرة العشوائية لتطبيق الـ PWA بمقدار 18%.</span>
                </li>
              </ul>
            </div>

            {/* Version 2.2.0 */}
            <div className="p-6 bg-[#040609]/40 border border-[#141b29]/40 rounded-2xl space-y-3 text-right">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="bg-white/5 text-gray-400 border border-white/5 px-2.5 py-1 rounded-lg text-xs font-bold">v2.2.0</span>
                  <h3 className="font-black text-sm text-gray-300">تحسين تسليم التنبيهات الفورية (Push Alerts) والعمل دون شبكة</h3>
                </div>
                <span className="text-[10px] text-gray-650 font-bold">أبريل 12، 2026</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                تم خلال هذا الإصدار تمكين خوارزميات العمل المخبأ (Offline-First Store). يمكن الآن للاعبين والمشجعين تصفح إحصائيات المباريات ونتائج الجولات السابقة والجدول العام حتى دون وجود خط اتصال إنترنت نشط.
              </p>
            </div>

            {/* Version 2.0.0 */}
            <div className="p-6 bg-[#040609]/40 border border-[#141b29]/40 rounded-2xl space-y-3 text-right">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="bg-white/5 text-gray-400 border border-white/5 px-2.5 py-1 rounded-lg text-xs font-bold">v2.0.0</span>
                  <h3 className="font-black text-sm text-gray-300 font-sans">التصميم الداكن الرياضي الأعمق ودعم الفرق المفضلة</h3>
                </div>
                <span className="text-[10px] text-gray-655 font-bold">يناير 05، 2026</span>
              </div>
              <p className="text-xs text-gray-550 leading-relaxed font-sans">
                تغيير جذري وشامل في الواجهات لتلائم المظهر الرياضي المظلم بالاعتماد على مصفوفات الألوان الفوسفورية والأخضر الرياضي (Neon Sports Style). إضافة خيار "صفحة المفضلة" لتخصيص محتوى الأخبار لتركز على أنديتك ودورياتك المختارة فقط.
              </p>
            </div>

          </div>
        </div>

        {/* Why Install Section (FAQ grid) */}
        <div className="p-8 sm:p-10 bg-white/[0.01] border border-white/5 rounded-[2.5rem] space-y-6">
          <div className="text-center space-y-1">
            <h3 className="text-base sm:text-lg font-black text-white">الأسئلة الشائعة حول تثبيت التطبيق</h3>
            <p className="text-[11.5px] text-gray-400 font-bold">إجابات سريعة لمساعدتك في الحصول على تجربة البث الفورية السليمة</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-right">
            
            <div className="space-y-1.5">
              <h4 className="text-xs font-black text-white flex items-center gap-2">
                <Info size={14} className="text-primary shrink-0" />
                <span>ما القيمة المضافة لتثبيت التطبيق كـ PWA؟</span>
              </h4>
              <p className="text-[11.5px] text-gray-450 leading-relaxed font-medium">
                تثبيت الـ PWA يجعل التطبيق يعمل مباشرة من شاشتك الرئيسية كأي تطبيق أصلي مثبت من متجر جوجل أو آبل، دون الحاجة لتحميل وتحديث حزم كبيرة الحجم، ويوفر ميزة التحديثات الصامتة الفورية بمجرد فتح التطبيق.
              </p>
            </div>

            <div className="space-y-1.5">
              <h4 className="text-xs font-black text-white flex items-center gap-2">
                <Info size={14} className="text-primary shrink-0" />
                <span>هل حزمة الـ APK خالية من الإعلانات المنبثقة؟</span>
              </h4>
              <p className="text-[11.5px] text-gray-450 leading-relaxed font-medium">
                نعم تماماً، حزمة الـ APK تم بناؤها لتوفير جلب آمن للنتائج دون تلطيخ تجربة الاستخدام بالإعلانات والمزعجات المنبثقة، وتعتمد فقط على إعلانات AdMob الأصلية البسيطة والمدعومة من المتجر العالمي.
              </p>
            </div>

            <div className="space-y-1.5">
              <h4 className="text-xs font-black text-white flex items-center gap-2">
                <Info size={14} className="text-primary shrink-0" />
                <span>كيف يمكن ترقية التطبيق للإصدارات الأحدث لاحقاً؟</span>
              </h4>
              <p className="text-[11.5px] text-gray-450 leading-relaxed font-medium">
                يقوم التطبيق بالتحقق الدوري من الخادم التزامني تلقائياً. في حال تم رفع إصدار APK جديد، ستتلقى إشعاراً علوياً فورياً للتحديث بلمسة واحدة دون فقدان فريقك المفضل أو إعدادات تشغيل حسابك.
              </p>
            </div>

            <div className="space-y-1.5">
              <h4 className="text-xs font-black text-white flex items-center gap-2">
                <Info size={14} className="text-primary shrink-0" />
                <span>هل التطبيق مجاني بالكامل؟</span>
              </h4>
              <p className="text-[11.5px] text-gray-450 leading-relaxed font-medium">
                نعم، التطبيق متاح للتحميل والترقية المجانية بالكامل دون الحاجة لدفع مبالغ دورية للبطولات المدرجة كدوري أبطال أوروبا، الدوري الإنجليزي، الإسباني وبطولات الشرق الأوسط.
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
