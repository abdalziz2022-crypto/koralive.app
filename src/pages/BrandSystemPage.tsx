import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Flame, 
  Award, 
  Star, 
  Zap, 
  Tv, 
  Share2, 
  Palette, 
  Type, 
  Compass, 
  Shield, 
  Bell, 
  Sparkles, 
  Smartphone,
  Check, 
  ExternalLink,
  ChevronLeft,
  Volume2,
  Lock,
  Search,
  CheckCircle,
  Eye,
  Settings,
  AlertOctagon,
  BookOpen
} from 'lucide-react';

export default function BrandSystemPage() {
  const [activeTab, setActiveTab] = useState<'brand' | 'colors' | 'typography' | 'logos' | 'voice' | 'pwa'>('brand');
  const [selectedOption, setSelectedOption] = useState<'A' | 'B' | 'C'>('A');
  const [simulatedNotify, setSimulatedNotify] = useState<string | null>(null);

  // Apply chosen color option variables locally to test performance and visuals
  useEffect(() => {
    const root = document.documentElement;
    if (selectedOption === 'A') {
      root.style.setProperty('--color-primary', '#00DF82');
      root.style.setProperty('--color-background', '#090d16');
      root.style.setProperty('--color-surface', '#12182c');
      root.style.setProperty('--color-surface-hover', '#1c243f');
    } else if (selectedOption === 'B') {
      root.style.setProperty('--color-primary', '#10b981');
      root.style.setProperty('--color-background', '#03120a');
      root.style.setProperty('--color-surface', '#072e19');
      root.style.setProperty('--color-surface-hover', '#0c4728');
    } else if (selectedOption === 'C') {
      root.style.setProperty('--color-primary', '#3b82f6');
      root.style.setProperty('--color-background', '#080710');
      root.style.setProperty('--color-surface', '#111022');
      root.style.setProperty('--color-surface-hover', '#1a1934');
    }
  }, [selectedOption]);

  const triggerSimulation = (msg: string) => {
    setSimulatedNotify(msg);
    setTimeout(() => setSimulatedNotify(null), 3000);
  };

  return (
    <div className="min-h-screen bg-background text-[color:var(--color-text)] pb-24 transition-all duration-500" dir="rtl">
      
      {/* Brand Hero Banner */}
      <section className="relative overflow-hidden rounded-[32px] border border-primary/20 bg-gradient-to-br from-surface via-surface to-primary/5 p-8 md:p-12 shadow-2xl mb-12">
        <div className="absolute top-0 left-0 lg:left-8 lg:top-8 flex items-center gap-1.5 bg-primary text-black text-[10px] font-black px-3.5 py-1.5 rounded-full select-none shadow">
          <Sparkles size={11} className="animate-spin" />
          <span>هوية العلامة التجارية V2</span>
        </div>

        <div className="max-w-3xl space-y-4">
          <h1 className="text-3xl md:text-5xl font-black text-white leading-tight">
            نظام الهوية البصرية والذكاء التصميمي لـ <span className="text-primary italic">كورة 90 V2</span>
          </h1>
          <p className="text-sm md:text-base text-gray-400 font-medium leading-relaxed">
            استكشف واختبر الهوية الكروية العربية الأرقى. تم بناء هذا الدليل بنظام تفاعلي كامل يمكنّك من تجربة الألوان والمحاكاة المباشرة لشاشات وعناصر الـ SDK المتطورة.
          </p>
          
          <div className="flex flex-wrap gap-3 pt-2">
            <button 
              onClick={() => setSelectedOption('A')}
              className={`px-4 py-2 rounded-full text-xs font-black border transition-all ${
                selectedOption === 'A' 
                  ? 'bg-primary text-black border-primary' 
                  : 'bg-white/5 text-gray-300 border-border hover:bg-white/10'
              }`}
            >
              الخيار أ: رياضي غامق بريميوم
            </button>
            <button 
              onClick={() => setSelectedOption('B')}
              className={`px-4 py-2 rounded-full text-xs font-black border transition-all ${
                selectedOption === 'B' 
                  ? 'bg-emerald-500 text-black border-emerald-500' 
                  : 'bg-white/5 text-gray-300 border-border hover:bg-white/10'
              }`}
            >
              الخيار ب: عشب أخضر كلاسيكي
            </button>
            <button 
              onClick={() => setSelectedOption('C')}
              className={`px-4 py-2 rounded-full text-xs font-black border transition-all ${
                selectedOption === 'C' 
                  ? 'bg-blue-600 text-white border-blue-500' 
                  : 'bg-white/5 text-gray-300 border-border hover:bg-white/10'
              }`}
            >
              الخيار ج: فضائي نيون حديث
            </button>
          </div>
        </div>
      </section>

      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto gap-2 pb-4 scrollbar-none border-b border-border/10 mb-8">
        {[
          { id: 'brand', label: 'شخصية الهوية', icon: Compass },
          { id: 'colors', label: 'اللوحة اللونية', icon: Palette },
          { id: 'typography', label: 'الخطوط والحجوم', icon: Type },
          { id: 'logos', label: 'الشعارات والأيقونات', icon: Award },
          { id: 'voice', label: 'نبرة الصوت والتنبيهات', icon: Volume2 },
          { id: 'pwa', label: 'إستراتيجية النشر APK & PWA', icon: Smartphone },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all ${
                isActive 
                  ? 'bg-primary/20 text-primary border border-primary/30' 
                  : 'bg-surface hover:bg-surface-hover/80 text-gray-400 border border-border/10'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-primary' : 'text-gray-400'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Sandbox Window */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Interactive Playground */}
        <div className="lg:col-span-2 space-y-8">
          <AnimatePresence mode="wait">
            
            {/* BRAND PERSONALITY VIEW */}
            {activeTab === 'brand' && (
              <motion.div
                key="brand"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div className="glass p-6 md:p-8 rounded-3xl space-y-6">
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <Compass className="text-primary" />
                    <span>رؤية وشخصية كورة 90 V2</span>
                  </h2>
                  <p className="text-xs text-gray-400 font-bold leading-relaxed">
                    لا نهدف فقط إلى محاكاة نتائج مباريات جافة. "كورة 90" تهدف لتبوء الصدارة كمنصة بصرية وثقافية رياضية للمشجع العربي الحديث الذي يبحث عن السرعة والدقة والراحة البصرية التامة.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { title: 'موثوق ودقيق', desc: 'نربط بيانات المباريات بسيرفرات فائقة القوة تمنع تضارب الإحصائيات أو سقوط النتائج.' },
                      { title: 'رياضي حاد ونظيف', desc: 'نبتعد بالكامل عن الإعلانات المغطية والنوافذ المنبثقة لنبقي واجهة اللعبة ناصعة وسلسة.' },
                      { title: 'منصة محتوى متكاملة', desc: 'حتى بحال عدم وجود مباريات، لا تدع المستخدم يرى واجهة فارغة؛ نوفر له ترشيحات، أخبار ومقالات تحليلية.' },
                      { title: 'تنبيهات فورية متقدمة', desc: 'إشعار فوري لبطاقة حمراء أو أهداف مباشرة بأقل زمن تأخير ممكن.' }
                    ].map((item, idx) => (
                      <div key={idx} className="bg-background border border-border/10 rounded-2xl p-5 space-y-1.5 hover:border-primary/20 transition-all">
                        <span className="text-xs font-black text-white">{item.title}</span>
                        <p className="text-[11px] text-gray-500 font-bold leading-normal">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass p-6 rounded-3xl space-y-4">
                  <h3 className="text-sm font-black text-primary">القيم البصرية الأساسية للمشروع</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white/5 border border-border/10 p-4 rounded-xl text-center space-y-1">
                      <Zap className="text-amber-500 mx-auto" size={18} />
                      <span className="text-[10px] font-black text-white block">صوت وصورة</span>
                    </div>
                    <div className="bg-white/5 border border-border/10 p-4 rounded-xl text-center space-y-1">
                      <Shield className="text-emerald-500 mx-auto" size={18} />
                      <span className="text-[10px] font-black text-white block">أمان وخصوصية</span>
                    </div>
                    <div className="bg-white/5 border border-border/10 p-4 rounded-xl text-center space-y-1">
                      <Trophy className="text-primary mx-auto" size={18} />
                      <span className="text-[10px] font-black text-white block">متعة كروية</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* COLOR PALETTE VIEW */}
            {activeTab === 'colors' && (
              <motion.div
                key="colors"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div className="glass p-6 md:p-8 rounded-3xl space-y-6">
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <Palette className="text-primary" />
                    <span>منظومة المقارنة للألوان الرياضية</span>
                  </h2>
                  <p className="text-xs text-gray-400 font-bold leading-relaxed">
                    اضغط على خيارات الأسفل لتبديل ألوان كامل التطبيق لرؤية تأثير السمة البصرية فوراً.
                  </p>

                  <div className="space-y-4">
                    {/* Option A */}
                    <div 
                      onClick={() => setSelectedOption('A')}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        selectedOption === 'A' ? 'border-primary bg-primary/5' : 'border-border/10 bg-surface hover:bg-surface-hover/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black text-white">الخيار (أ): رياضي كوزميك فائق الجبروت (الموصى به)</span>
                        <div className="flex gap-1.5">
                          <span className="w-3.5 h-3.5 rounded bg-[#090d16]" />
                          <span className="w-3.5 h-3.5 rounded bg-[#12182c]" />
                          <span className="w-3.5 h-3.5 rounded bg-[#00DF82]" />
                          <span className="w-3.5 h-3.5 rounded bg-[#EAB308]" />
                        </div>
                      </div>
                      <p className="text-[10px] text-gray-500 font-medium">يوفر أعلى درجة تباين للعين أثناء تصفح المباريات ليلاً لتقليل الإجهاد البصري.</p>
                    </div>

                    {/* Option B */}
                    <div 
                      onClick={() => setSelectedOption('B')}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        selectedOption === 'B' ? 'border-emerald-500 bg-emerald-500/5' : 'border-border/10 bg-surface hover:bg-surface-hover/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black text-white">الخيار (ب): عشب أخضر كلاسيكي مستلهم من الملاعب العالمية</span>
                        <div className="flex gap-1.5">
                          <span className="w-3.5 h-3.5 rounded bg-[#03120a]" />
                          <span className="w-3.5 h-3.5 rounded bg-[#072e19]" />
                          <span className="w-3.5 h-3.5 rounded bg-[#10b981]" />
                          <span className="w-3.5 h-3.5 rounded bg-[#34d399]" />
                        </div>
                      </div>
                      <p className="text-[10px] text-gray-500 font-medium">لون العشب المنعش ليعيد للمشجع شعور التواجد في مدرجات المونديال.</p>
                    </div>

                    {/* Option C */}
                    <div 
                      onClick={() => setSelectedOption('C')}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        selectedOption === 'C' ? 'border-blue-500 bg-blue-500/5' : 'border-border/10 bg-surface hover:bg-surface-hover/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black text-white">الخيار (ج): فضائي نيون كلاسيكي ملتهب</span>
                        <div className="flex gap-1.5">
                          <span className="w-3.5 h-3.5 rounded bg-[#080710]" />
                          <span className="w-3.5 h-3.5 rounded bg-[#111022]" />
                          <span className="w-3.5 h-3.5 rounded bg-[#3b82f6]" />
                          <span className="w-3.5 h-3.5 rounded bg-[#f43f5e]" />
                        </div>
                      </div>
                      <p className="text-[10px] text-gray-500 font-medium font-mono">طابع نيون جذاب يناسب البث المباشر والإحصائات المضاءة ليلاً.</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TYPOGRAPHY VIEW */}
            {activeTab === 'typography' && (
              <motion.div
                key="typography"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div className="glass p-6 md:p-8 rounded-3xl space-y-6">
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <Type className="text-primary" />
                    <span>تدرج الخطوط العربي واللاتيني للمطابقة</span>
                  </h2>
                  <p className="text-xs text-gray-400 font-bold leading-relaxed">
                    نستخدم خط وعاء العناوين <span className="font-sans font-extrabold text-white">"Tajawal"</span> المدمج بخط الأرقام والبيانات المعقدة <span className="font-mono text-primary font-bold">"JetBrains Mono"</span> لضمان سلاسة القراءة.
                  </p>

                  <div className="space-y-5 bg-background border border-border/10 p-6 rounded-2xl">
                    <div className="space-y-1">
                      <span className="text-[10px] text-gray-400 font-mono">Display Heading • font-black italic</span>
                      <h3 className="text-3xl md:text-4xl font-black italic text-white">كلاسيكو الأرض 90'</h3>
                    </div>
                    
                    <div className="border-t border-border/5 my-3" />

                    <div className="space-y-1">
                      <span className="text-[10px] text-gray-400 font-mono">H1 / Subtitle • font-extrabold</span>
                      <h4 className="text-xl md:text-2xl font-extrabold text-slate-100">تحليلات المباراة والإحصائيات دقيقة بدقيقة</h4>
                    </div>

                    <div className="border-t border-border/5 my-3" />

                    <div className="space-y-1">
                      <span className="text-[10px] text-gray-400 font-mono">Body Content • font-medium text-xs</span>
                      <p className="text-xs text-gray-300 font-medium leading-relaxed">
                        تابع استوديو البث الحصري والتحليل التفاعلي مع أقوى سيرفرات البث المتنوعة لتفادي التقطيع في المباريات الكبيرة المصيرية.
                      </p>
                    </div>

                    <div className="border-t border-border/5 my-3" />

                    <div className="space-y-1">
                      <span className="text-[10px] text-gray-400 font-mono">Status & Fast Stats • font-mono</span>
                      <p className="text-sm font-mono text-primary font-bold">FT • 90:00 +3' • Score: 3 - 2</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* LOGOS & VECTOR WORKSPACE */}
            {activeTab === 'logos' && (
              <motion.div
                key="logos"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div className="glass p-6 md:p-8 rounded-3xl space-y-6">
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <Award className="text-primary" />
                    <span>مفهوم الشعار وحقيبة الوسائط (Vector Design System)</span>
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Primary Interactive SVG Logo Card */}
                    <div className="bg-background border border-border/10 p-6 rounded-2xl flex flex-col items-center justify-center space-y-4">
                      <span className="text-[10px] text-gray-500 font-bold">1. الشعار الأساسي وعلامة الرأس</span>
                      
                      <div className="relative group p-4 border border-primary/20 bg-surface/50 rounded-2xl flex items-center gap-2.5">
                        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-30 group-hover:opacity-60 transition-all" />
                        <div className="relative w-12 h-12 bg-gradient-to-br from-primary to-emerald-600 rounded-xl flex items-center justify-center shadow">
                          <span className="font-extrabold text-black text-xl tracking-wider">K90</span>
                          <span className="absolute bottom-0 inset-x-0 h-1 bg-yellow-400" />
                        </div>
                        <div className="flex flex-col text-right">
                          <span className="text-base font-black text-white leading-tight">كورة 90</span>
                          <span className="text-[10px] font-mono text-primary tracking-widest font-bold">KOREA90 V2</span>
                        </div>
                      </div>

                      <p className="text-[10px] text-gray-500 text-center font-medium">شعار مدمج، حديث ومحمي بأس رصاصي لمنع فقد دقة العناصر عند الدقة المنخفضة.</p>
                    </div>

                    {/* App Launcher Icon Concept */}
                    <div className="bg-background border border-border/10 p-6 rounded-2xl flex flex-col items-center justify-center space-y-4">
                      <span className="text-[10px] text-gray-500 font-bold">2. أيقونة مشغل التطبيق APK Icon</span>
                      
                      <div className="w-20 h-20 bg-gradient-to-br from-[#12182c] to-[#04060b] border-2 border-primary/30 rounded-[22px] flex flex-col items-center justify-center shadow-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors" />
                        <span className="text-xs font-black text-primary font-mono select-none tracking-widest">KOREA</span>
                        <span className="text-3xl font-black text-white italic tracking-tighter -mt-1 scale-105">90</span>
                        <div className="absolute bottom-1 w-8 h-1 bg-primary rounded-full" />
                      </div>

                      <p className="text-[10px] text-gray-500 text-center font-medium">مصمم بحواف منحنية للمطابقة مع إرشادات متجر آبل وسامسونغ ونظام آندرويد الحديث.</p>
                    </div>

                    {/* Splash experience preview */}
                    <div className="col-span-1 md:col-span-2 bg-background border border-border/10 p-6 rounded-2xl flex flex-col items-center justify-center space-y-4">
                      <span className="text-[10px] text-gray-500 font-bold">3. علامة Splash Mark التحميلية الخفيفة</span>
                      
                      <div className="relative p-6 bg-surface/50 w-full rounded-xl flex flex-col items-center space-y-3">
                        <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                        <span className="text-[11px] font-black text-gray-400">تحميل محرك البيانات الكروية...</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* BRAND VOICE & NOTIFICATIONS SYSTEM */}
            {activeTab === 'voice' && (
              <motion.div
                key="voice"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div className="glass p-6 md:p-8 rounded-3xl space-y-6">
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <Volume2 className="text-primary" />
                    <span>نغمة ونبرة الإشعارات والأخبار (بدون فوضى)</span>
                  </h2>
                  <p className="text-xs text-gray-400 font-bold leading-relaxed">
                    نعتمد على نصوص قصيرة، غنية بالمعلومات وخالية من اللّغو لتشعير المستخدم بالحماسة المطلوبة. اختبر محاكاة نبرة الصوت ببطاقات الإشعار التالية:
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button 
                      onClick={() => triggerSimulation('⚽ جووووول! الهلال يحرز هدف التقدم الأول بصاروخية من سالم الدوسري')}
                      className="bg-background border border-border/10 p-4 rounded-xl text-right hover:border-primary/30 transition-all cursor-pointer block w-full"
                    >
                      <span className="text-[10px] font-black text-primary block mb-1">محاكاة هدف مباشر (Goal Alert)</span>
                      <p className="text-xs text-white font-extrabold">⚽ جووووول!</p>
                      <span className="text-[9px] text-gray-400 font-medium">اضغط لمحاكاة التنبيه</span>
                    </button>

                    <button 
                      onClick={() => triggerSimulation('🚨 عاجل: تعيين مدرب جديد رسمياً للمنتخب السعودي الكابتن رينارد')}
                      className="bg-background border border-border/10 p-4 rounded-xl text-right hover:border-primary/30 transition-all cursor-pointer block w-full"
                    >
                      <span className="text-[10px] font-black text-rose-500 block mb-1">محاكاة خبر عاجل (Breaking News)</span>
                      <p className="text-xs text-white font-extrabold">🚨 خبر عاجل</p>
                      <span className="text-[9px] text-gray-400 font-medium">اضغط لمحاكاة التنبيه</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* PWA AND APK STRATEGY */}
            {activeTab === 'pwa' && (
              <motion.div
                key="pwa"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div className="glass p-6 md:p-8 rounded-3xl space-y-6">
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <Smartphone className="text-primary" />
                    <span>إستراتيجية النشر وجودة الـ PWA & APK</span>
                  </h2>
                  <p className="text-xs text-gray-400 font-bold leading-relaxed">
                    تم بناء Korea90 V2 بأحدث التقنيات القابلة للنشر فوراً كـ Progressive Web App (PWA) أو حزم APK للهندسة الأصلية بالتعاون مع Capacitor.
                  </p>

                  <div className="space-y-4">
                    <div className="bg-background border border-border/10 p-5 rounded-2xl flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <Check className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs font-black text-white block">تحسين استهلاك البيانات والأفلاين (Offline-First)</span>
                        <p className="text-[11px] text-gray-500 font-medium leading-normal">يقوم محرك الكاش المطور بحفظ آخر المباريات المعروضة لتبسيط فتح البرنامج حال غياب الاتصال بالإنترنت تماماً.</p>
                      </div>
                    </div>

                    <div className="bg-background border border-border/10 p-5 rounded-2xl flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <Check className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs font-black text-white block">ملف Manifest مسبق متكامل</span>
                        <p className="text-[11px] text-gray-500 font-medium leading-normal">يدعم تفاصيل التثبيت للشاشة الرئيسية وسرعة التفاعل ومطابقة الألوان مع شريط التطبيقات.</p>
                      </div>
                    </div>

                    <div className="bg-background border border-border/10 p-5 rounded-2xl flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <Check className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs font-black text-white block">التوافق مع أدوات تغليف الموبايل</span>
                        <p className="text-[11px] text-gray-500 font-medium leading-normal">الواجهة تدعم تفعيل المحتويات بنسب 100% وحماية المساحات الآمنة للهواتف ذات الشاشات المنحنية أو شريط الكاميرا الأمامي (Safe Area Insets).</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Right Side Info Panel & Simulation Notifications Popup */}
        <div className="space-y-6">
          
          <div className="glass p-6 rounded-3xl space-y-4 relative overflow-hidden">
            <h3 className="text-sm font-black text-white flex items-center gap-1.5">
              <Sparkles className="text-amber-500" size={16} />
              <span>محاكي إشعارات الهاتف المباشر</span>
            </h3>
            
            <p className="text-[11px] text-gray-500 font-medium">الرجاء الضغط على أحد عناصر بطاقة "نبرة الصوت والتنبيهات" لاختبار محاكاة تفعيل تنبيه مباريات القاعة والأخبار العاجلة في هواتف المشجعين.</p>
            
            <div className="h-44 bg-black/60 border border-white/5 rounded-2xl flex flex-col items-center justify-center p-4 relative overflow-hidden">
              <AnimatePresence>
                {simulatedNotify ? (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: -10 }}
                    className="w-full bg-[#12182c] border border-primary/20 p-4 rounded-xl shadow-2xl relative z-10"
                  >
                    <div className="flex items-center gap-2 justify-between mb-1">
                      <span className="text-[9px] text-primary font-black">كورة 90 لايف • الآن</span>
                      <Bell size={12} className="text-[#00DF82] animate-bounce" />
                    </div>
                    <p className="text-xs text-white font-black text-right">{simulatedNotify}</p>
                  </motion.div>
                ) : (
                  <div className="text-center space-y-2">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center mx-auto">
                      <Bell size={14} className="text-gray-600" />
                    </div>
                    <span className="text-[10px] text-gray-600 font-bold block">بانتظار وصول الإشعارات...</span>
                  </div>
                )}
              </AnimatePresence>
              <div className="absolute inset-x-0 bottom-0 h-1.5 bg-primary/20" />
            </div>
          </div>

          {/* Core App Stability Matrix */}
          <div className="glass p-6 rounded-3xl space-y-4">
            <h3 className="text-sm font-black text-white flex items-center gap-1.5">
              <Shield className="text-emerald-500" size={16} />
              <span>نظام الاستقرار والتحكيم الفني</span>
            </h3>

            <div className="space-y-3">
              {[
                { label: 'فحص تضارب البيانات', value: 'نشط ومستقر ✓', color: 'text-primary' },
                { label: 'سجلات كاش الـ API', value: 'مفعلة تلقائياً', color: 'text-[#EAB308]' },
                { label: 'مراقبة سقوط المباريات', value: 'حارس نشط', color: 'text-primary' },
                { label: 'إعلانات مدمجة غير معرقلة', value: 'مفعلة كلياً', color: 'text-primary' }
              ].map((stat, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs font-bold border-b border-white/5 pb-2">
                  <span className="text-gray-400">{stat.label}</span>
                  <span className={stat.color}>{stat.value}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
