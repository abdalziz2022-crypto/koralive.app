import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  X, 
  CheckCircle2, 
  Trash2, 
  Newspaper, 
  Trophy, 
  Volume2, 
  VolumeX, 
  Megaphone, 
  Clock, 
  Sparkles, 
  Settings, 
  AlertTriangle,
  Play,
  ArrowLeftRight,
  Info
} from 'lucide-react';
import { useNotifications, NotificationType, NotificationLog } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../lib/utils';
import { FAMOUS_TEAMS } from '../api/apiClient';

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'LOGS' | 'SETTINGS'>('SETTINGS');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const {
    notifications,
    subscriptions,
    unreadCount,
    toggleSubscription,
    addNotificationLog,
    markAllAsRead,
    clearAllNotifications,
    playNotificationSound,
    triggerArabicSpeech,
    favoriteTeamIds,
    toggleFavoriteTeam,
  } = useNotifications();

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleNotificationClick = (notif: NotificationLog) => {
    setIsOpen(false);
    
    // Custom actions or navigation depending on reference type
    if (notif.type === 'news' && notif.referenceId) {
      // Navigate to news section or link directly
      navigate(`/news`);
      // Smooth scroll if anchor exists
      setTimeout(() => {
        const item = document.getElementById(`news-${notif.referenceId}`);
        if (item) {
          item.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
    } else if ((notif.type === 'goal' || notif.type === 'result' || notif.type === 'card') && notif.referenceId) {
      // Navigate to match details page
      navigate(`/match/${notif.referenceId}`);
    }
  };

  // Simulates news, goals, results, card alerts directly on-demand!
  const triggerDemoSimulator = (type: 'goal' | 'news' | 'result' | 'card') => {
    if (type === 'goal') {
      addNotificationLog(
        'goal',
        '⚽ هددددف خيالي مذهل!',
        'جووووول! النجم العربي يسجل هدف الموسم بضربة مقصية رائعة تهز الشباك!',
        'demo-match-1',
        { playerName: 'النجم العربي', teamName: 'المنتخب الوطني', minute: 88, matchInfo: 'الوطني [ 1 - 0 ] المنافس' }
      );
      triggerArabicSpeech('ما شاء الله! هدف للتاريخ في اللحظات الأخيرة!');
    } else if (type === 'news') {
      addNotificationLog(
        'news',
        '🚨 انتقال رسمي عالمي!',
        'عاجل: بطل أوروبا ينهي إجراءات التعاقد مع الهداف الشاب في صفقة قياسية!',
        'demo-news-1',
        { category: 'عاجل' }
      );
      // speech triggers automatically for news in the context, but let's test sound/speech directly
    } else if (type === 'result') {
      addNotificationLog(
        'result',
        '🏁 صافرة النهاية وجنون الصدارة!',
        'رسمياً: انتهى ديربي الغضب لمصلحة المتصدر بنتيجة مثيرة وممتازة!',
        'demo-match-2',
        { homeScore: 3, awayScore: 2 }
      );
      triggerArabicSpeech('نهاية المعركة الكروية يا له من حماس منقطع النظير!');
    } else if (type === 'card') {
      addNotificationLog(
        'card',
        '🟥 بطاقة حمراء مباشرة وطرد!',
        'طرد وتدخل خشن للغاية يترك الفريق بعشرة لاعبين قبل نهاية الشوط الأول بأربع دقائق.',
        'demo-match-3',
        { playerName: 'صخرة الدفاع', teamName: 'الفريق الملكي', minute: 41 }
      );
      triggerArabicSpeech('طرد مباشر وبطاقة حمراء في الملعب يعلنها الحكم بدون تردد!');
    }
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'goal':
        return <Trophy className="w-4 h-4 text-emerald-400 animate-bounce" />;
      case 'news':
        return <Newspaper className="w-4 h-4 text-orange-400" />;
      case 'result':
        return <Clock className="w-4 h-4 text-indigo-400" />;
      case 'card':
        return <AlertTriangle className="w-4 h-4 text-yellow-400 animate-pulse" />;
      default:
        return <Bell className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      
      {/* Premium Notification Bell Trigger */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2.5 rounded-xl hover:bg-surface-hover text-gray-400 hover:text-primary transition-all duration-300 transform active:scale-95 ${isOpen ? 'bg-surface-hover text-primary' : ''}`}
        aria-label="لوحة الإشعارات"
        id="notification-bell-btn"
      >
        <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'animate-swing' : ''}`} />
        
        {unreadCount > 0 && (
          <span className="absolute top-2.5 left-2.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[8px] font-black text-white shadow-lg ring-2 ring-background animate-pulse">
            {unreadCount > 9 ? '+9' : unreadCount}
          </span>
        )}
      </button>

      {/* Floating Panel Drawer Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 380, damping: 26 }}
            className="absolute left-0 mt-4.5 w-[340px] md:w-[410px] max-h-[85vh] md:max-h-[75vh] bg-[#090d1a]/80 border border-white/10 backdrop-blur-2xl rounded-[2.25rem] shadow-[0_25px_60px_rgba(0,0,0,0.85)] z-[100] flex flex-col p-5 overflow-hidden ring-1 ring-white/5"
            style={{ direction: 'rtl' }}
            id="notification-dropdown-panel"
          >
            
            {/* Header Block */}
            <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-[0_0_15px_rgba(var(--color-primary),0.05)]">
                  <Bell className="w-4.5 h-4.5 animate-swing" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white tracking-wide">
                    {activeTab === 'SETTINGS' ? 'تفضيلات الأهداف الحية' : 'مركز الإشعارات الحية'}
                  </h3>
                  <p className="text-[10px] text-gray-400 mt-0.5 text-right font-medium">
                    {activeTab === 'SETTINGS' ? 'تخصيص مستويات أصوات وبث أهداف أنديتك المفضلة' : 'تابع الأخبار، الأهداف والنتائج عاجلاً بأول'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-all cursor-pointer border border-transparent hover:border-white/5 active:scale-90"
              >
                <X size={15} />
              </button>
            </div>

            {/* Premium Selector Tabs */}
            <div className="grid grid-cols-2 bg-black/45 p-1 rounded-2xl my-4 border border-white/5 text-[11px] font-black shadow-inner">
              <button
                onClick={() => setActiveTab('SETTINGS')}
                className={`py-2 rounded-xl text-center transition-all duration-300 cursor-pointer flex items-center justify-center gap-1.5 ${activeTab === 'SETTINGS' ? 'bg-primary text-black font-black shadow-md shadow-primary/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              >
                <Settings size={13} className={activeTab === 'SETTINGS' ? 'rotate-45 transition-transform duration-300' : ''} />
                <span>تفضيلات الأهداف</span>
              </button>
              <button
                onClick={() => setActiveTab('LOGS')}
                className={`py-2 rounded-xl text-center transition-all duration-300 cursor-pointer flex items-center justify-center gap-1.5 ${activeTab === 'LOGS' ? 'bg-primary text-black font-black shadow-md shadow-primary/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              >
                <span>سجل الإشعارات</span>
                {unreadCount > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black transition-all ${activeTab === 'LOGS' ? 'bg-black text-primary' : 'bg-red-500 text-white animate-pulse shadow-sm shadow-red-500/20'}`}>
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>

            {/* Tab Body Contents */}
            <div className="flex-grow overflow-y-auto pr-1 space-y-3 scrollbar-thin scrollbar-thumb-white/10">
              {activeTab === 'LOGS' ? (
                <div className="space-y-3">
                  
                  {/* Action Bar */}
                  {notifications.length > 0 && (
                    <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 bg-white/3 p-2 rounded-xl border border-white/5 shadow-sm">
                      <button 
                        onClick={markAllAsRead}
                        className="flex items-center gap-1 text-primary hover:text-white transition-all cursor-pointer"
                      >
                        <CheckCircle2 size={12} />
                        <span>تحديد الكل كمقروء</span>
                      </button>
                      <button 
                        onClick={clearAllNotifications}
                        className="flex items-center gap-1 text-red-400 hover:text-red-300 transition-all cursor-pointer"
                      >
                        <Trash2 size={12} />
                        <span>مسح سجل الإشعارات</span>
                      </button>
                    </div>
                  )}

                  {notifications.length > 0 ? (
                    <div className="space-y-2">
                      {notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          className={`p-3 rounded-2xl border transition-all duration-200 cursor-pointer relative overflow-hidden flex gap-3 hover:scale-[1.015] active:scale-[0.99]
                            ${notif.read ? 'bg-[#121829]/40 border-white/5 text-gray-300' : 'bg-primary/5 border-primary/25 hover:bg-primary/10 text-white shadow-lg shadow-primary/5'}
                          `}
                        >
                          {/* Left unread bar */}
                          {!notif.read && (
                            <div className="absolute top-0 bottom-0 right-0 w-1 bg-primary"></div>
                          )}

                          {/* Icon Container */}
                          <div className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center shrink-0 mt-0.5
                            ${notif.type === 'goal' ? 'bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.1)]' : ''}
                            ${notif.type === 'news' ? 'bg-orange-500/10 border border-orange-500/20 shadow-[0_0_8px_rgba(249,115,22,0.1)]' : ''}
                            ${notif.type === 'result' ? 'bg-indigo-500/10 border border-indigo-500/20 shadow-[0_0_8px_rgba(99,102,241,0.1)]' : ''}
                            ${notif.type === 'card' ? 'bg-yellow-500/10 border border-yellow-500/20 shadow-[0_0_8px_rgba(234,179,8,0.1)]' : ''}
                          `}>
                            {getIcon(notif.type)}
                          </div>

                          {/* Text Body */}
                          <div className="flex-grow space-y-1 text-right">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-xs font-black leading-tight line-clamp-1">{notif.title}</h4>
                              <span className="text-[9px] text-gray-400 shrink-0 font-bold flex items-center gap-1 leading-none mt-0.5">
                                <Clock size={8} />
                                {formatDate(notif.timestamp)}
                              </span>
                            </div>
                            <p className={`text-[11px] leading-relaxed line-clamp-2 ${notif.read ? 'text-gray-400' : 'text-gray-200 font-bold'}`}>
                              {notif.body}
                            </p>
                            
                            {/* Player highlighting tags or scores */}
                            {notif.metadata?.playerName && (
                              <div className="flex items-center gap-2 mt-1.5 text-[9px] text-gray-400 font-black">
                                <span className="bg-white/5 border border-white/5 px-2 py-0.5 rounded-md text-primary shadow-sm">
                                  ⚽ {notif.metadata?.playerName}
                                </span>
                                {notif.metadata?.minute && (
                                  <span>الدقيقة {notif.metadata?.minute}'</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-14 px-6 flex flex-col items-center justify-center text-center space-y-3.5">
                      <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-gray-400 border border-white/5 shadow-inner">
                        <Bell className="w-6 h-6 opacity-30" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-white">لا توجد إشعارات مسجلة</h4>
                        <p className="text-[10px] text-gray-400 max-w-[220px] leading-relaxed mx-auto mt-1">عند حدوث أهداف، بطاقات، نتائج، أو نشر أخبار عاجلة، ستظهر هنا في قائمة الإشعارات الحية.</p>
                      </div>
                    </div>
                  )}

                </div>
              ) : (
                <div className="space-y-4 pt-1 pb-2">
                  
                  {/* LIVE GOAL PREFERENCES & FAVORITE TEAMS MULTI-SELECT */}
                  <div className="bg-[#121829]/40 border border-white/10 p-4.5 rounded-3xl space-y-4 relative overflow-hidden shadow-inner">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                      <h4 className="text-xs font-black text-white flex items-center gap-1.5 focus:outline-none">
                        <span>تفضيلات إشعارات الأهداف المباشرة ⚽</span>
                      </h4>
                      <span className="text-[9px] text-primary font-black bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full shadow-sm">
                        {favoriteTeamIds?.length || 0} فرق حددت
                      </span>
                    </div>

                    {/* Toggle: notifications for favorite teams ONLY ("الوضع الصامت للأهداف غير الهامة") */}
                    <div className="bg-[#1a233a]/45 border border-primary/20 p-3.5 rounded-2xl flex items-center justify-between shadow-xl ring-1 ring-primary/5 transition-all">
                      <div className="text-right max-w-[70%]">
                        <span className="text-xs font-black text-white block">الوضع الصامت للأهداف غير الهامة 🤫</span>
                        <span className="text-[9px] text-gray-400 leading-relaxed block mt-0.5">عند تفعيله، لن تظهر أي نوافذ منبثقة أو تنبيهات تفاعلية إلا لأهداف الفرق التي تحددها في تفضيلاتك بالأسفل.</span>
                      </div>
                      <button
                        onClick={() => toggleSubscription('onlyFavoriteTeams')}
                        className={`w-11 h-6 rounded-full transition-all duration-300 flex items-center cursor-pointer relative shadow-inner shrink-0 ${
                          subscriptions.onlyFavoriteTeams 
                            ? 'bg-[#1bc480] shadow-[0_0_10px_rgba(27,196,128,0.35)]' 
                            : 'bg-white/10'
                        }`}
                        id="silent-mode-toggle-btn"
                        aria-label="الوضع الصامت للأهداف غير الهامة"
                      >
                        <span 
                          className={`absolute top-[3px] w-4.5 h-4.5 rounded-full transition-all duration-300 bg-white shadow-md ${
                            subscriptions.onlyFavoriteTeams 
                              ? 'right-[3px]' 
                              : 'right-[23px]'
                          }`} 
                        />
                      </button>
                    </div>

                    {/* Teams selector list */}
                    <div className="space-y-2.5">
                      <p className="text-[10px] text-gray-400 leading-normal text-right font-medium">
                        انقر على شعارات الأندية لإضافتها وتنشيط تنبيهاتها الخاصة فوراً:
                      </p>
                      
                      <div className="grid grid-cols-3 gap-2 max-h-[175px] overflow-y-auto p-1.5 bg-black/35 rounded-2xl border border-white/5 scrollbar-thin scrollbar-thumb-white/10">
                        {FAMOUS_TEAMS.map((team) => {
                           const isFav = favoriteTeamIds?.includes(team.id);
                           return (
                             <button
                               key={team.id}
                               onClick={() => toggleFavoriteTeam(team.id)}
                               className={`p-2.5 rounded-2xl border flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer transition-all duration-300 transform hover:scale-[1.03] active:scale-95 relative overflow-hidden
                                 ${isFav 
                                   ? 'bg-primary/10 border-primary/30 text-primary shadow-sm' 
                                   : 'bg-white/3 border-white/5 text-gray-400 hover:border-white/10 hover:text-white'
                                 }
                               `}
                             >
                               {isFav && (
                                 <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_8px_rgba(var(--color-primary),0.8)]" />
                               )}
                               <img 
                                 src={team.logo} 
                                 alt={team.name} 
                                 className="w-7 h-7 object-contain"
                                 referrerPolicy="no-referrer"
                               />
                               <span className="text-[9px] font-black tracking-tight truncate w-full">{team.name}</span>
                             </button>
                           );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Preferences Toggles List */}
                  <div className="bg-[#121829]/40 border border-white/10 p-4.5 rounded-3xl space-y-4 shadow-inner">
                    <h4 className="text-xs font-black text-white border-b border-white/5 pb-2">تفضيلات البث والتنبيهات:</h4>
                    
                    {/* Toggle: News */}
                    <div className="flex items-center justify-between">
                      <div className="text-right">
                        <span className="text-xs font-black text-white block">موجز الأخبار والتحليلات العاجلة 📰</span>
                        <span className="text-[9px] text-gray-400">تنبيهات فورية عند إضافة أي خبر رياضي عاجل.</span>
                      </div>
                      <button
                        onClick={() => toggleSubscription('news')}
                        className={`w-11 h-6 rounded-full transition-all duration-300 flex items-center cursor-pointer relative shadow-inner shrink-0 ${
                          subscriptions.news 
                            ? 'bg-[#1bc480] shadow-[0_0_10px_rgba(27,196,128,0.35)]' 
                            : 'bg-white/10'
                        }`}
                        aria-label="موجز الأخبار والتحليلات العاجلة"
                      >
                        <span 
                          className={`absolute top-[3px] w-4.5 h-4.5 rounded-full transition-all duration-300 bg-white shadow-md ${
                            subscriptions.news 
                              ? 'right-[3px]' 
                              : 'right-[23px]'
                          }`} 
                        />
                      </button>
                    </div>

                    {/* Toggle: Goals */}
                    <div className="flex items-center justify-between">
                      <div className="text-right">
                        <span className="text-xs font-black text-white block">أهداف المباريات المباشرة ⚽</span>
                        <span className="text-[9px] text-gray-400">صوت وخط إشعاري للأهداف في المباريات المفضلة.</span>
                      </div>
                      <button
                        onClick={() => toggleSubscription('goals')}
                        className={`w-11 h-6 rounded-full transition-all duration-300 flex items-center cursor-pointer relative shadow-inner shrink-0 ${
                          subscriptions.goals 
                            ? 'bg-[#1bc480] shadow-[0_0_10px_rgba(27,196,128,0.35)]' 
                            : 'bg-white/10'
                        }`}
                        aria-label="أهداف المباريات المباشرة"
                      >
                        <span 
                          className={`absolute top-[3px] w-4.5 h-4.5 rounded-full transition-all duration-300 bg-white shadow-md ${
                            subscriptions.goals 
                              ? 'right-[3px]' 
                              : 'right-[23px]'
                          }`} 
                        />
                      </button>
                    </div>

                    {/* Toggle: Results */}
                    <div className="flex items-center justify-between">
                      <div className="text-right">
                        <span className="text-xs font-black text-white block">صفارات النهاية والنتائج الرسمية 🏁</span>
                        <span className="text-[9px] text-gray-400">عرض نهاية المباريات ونقاط الحصيلة فوراً.</span>
                      </div>
                      <button
                        onClick={() => toggleSubscription('results')}
                        className={`w-11 h-6 rounded-full transition-all duration-300 flex items-center cursor-pointer relative shadow-inner shrink-0 ${
                          subscriptions.results 
                            ? 'bg-[#1bc480] shadow-[0_0_10px_rgba(27,196,128,0.35)]' 
                            : 'bg-white/10'
                        }`}
                        aria-label="صفارات النهاية والنتائج الرسمية"
                      >
                        <span 
                          className={`absolute top-[3px] w-4.5 h-4.5 rounded-full transition-all duration-300 bg-white shadow-md ${
                            subscriptions.results 
                              ? 'right-[3px]' 
                              : 'right-[23px]'
                          }`} 
                        />
                      </button>
                    </div>

                    {/* Toggle: Cards and general events */}
                    <div className="flex items-center justify-between">
                      <div className="text-right">
                        <span className="text-xs font-black text-white block">البطاقات والتغييرات التكتيكية 🟨</span>
                        <span className="text-[9px] text-gray-400">إنذارات وطرد وتبديلات اللاعبين بالمباراة.</span>
                      </div>
                      <button
                        onClick={() => toggleSubscription('cardsAndSubs')}
                        className={`w-11 h-6 rounded-full transition-all duration-300 flex items-center cursor-pointer relative shadow-inner shrink-0 ${
                          subscriptions.cardsAndSubs 
                            ? 'bg-[#1bc480] shadow-[0_0_10px_rgba(27,196,128,0.35)]' 
                            : 'bg-white/10'
                        }`}
                        aria-label="البطاقات والتغييرات التكتيكية"
                      >
                        <span 
                          className={`absolute top-[3px] w-4.5 h-4.5 rounded-full transition-all duration-300 bg-white shadow-md ${
                            subscriptions.cardsAndSubs 
                              ? 'right-[3px]' 
                              : 'right-[23px]'
                          }`} 
                        />
                      </button>
                    </div>
                  </div>

                  {/* Sound configuration */}
                  <div className="bg-[#121829]/40 border border-white/10 p-4.5 rounded-3xl space-y-4 shadow-inner">
                    <h4 className="text-xs font-black text-white border-b border-white/5 pb-2">تفاصيل المؤثرات والأصوات:</h4>
                    
                    {/* Toggle: Audio Synthesizer Effects */}
                    <div className="flex items-center justify-between">
                      <div className="text-right flex gap-2 items-center">
                        <div className="p-1 rounded-lg bg-primary/10 border border-primary/20 text-primary">
                          <Volume2 size={13} />
                        </div>
                        <div>
                          <span className="text-xs font-black text-white block">المؤثرات الصوتية للأحداث 🔊</span>
                          <span className="text-[9px] text-gray-400">نغمات رنين ومؤثرات صوتية فريدة تفاعلية.</span>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleSubscription('audioEffects')}
                        className={`w-11 h-6 rounded-full transition-all duration-300 flex items-center cursor-pointer relative shadow-inner shrink-0 ${
                          subscriptions.audioEffects 
                            ? 'bg-[#1bc480] shadow-[0_0_10px_rgba(27,196,128,0.35)]' 
                            : 'bg-white/10'
                        }`}
                        aria-label="المؤثرات الصوتية للأحداث"
                      >
                        <span 
                          className={`absolute top-[3px] w-4.5 h-4.5 rounded-full transition-all duration-300 bg-white shadow-md ${
                            subscriptions.audioEffects 
                              ? 'right-[3px]' 
                              : 'right-[23px]'
                          }`} 
                        />
                      </button>
                    </div>

                    {/* Toggle: Voice Commentary TTS */}
                    <div className="flex items-center justify-between">
                      <div className="text-right flex gap-2 items-center">
                        <div className="p-1 rounded-lg bg-primary/10 border border-primary/20 text-primary">
                          <Megaphone size={13} className="animate-pulse" />
                        </div>
                        <div>
                          <span className="text-xs font-black text-white block">معلق صوتي ذكي عربي 🎙️</span>
                          <span className="text-[9px] text-gray-400">قراءة منطوقة صوتية حماسية للأهداف والنتائج.</span>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleSubscription('arabicVoiceCommentator')}
                        className={`w-11 h-6 rounded-full transition-all duration-300 flex items-center cursor-pointer relative shadow-inner shrink-0 ${
                          subscriptions.arabicVoiceCommentator 
                            ? 'bg-[#1bc480] shadow-[0_0_10px_rgba(27,196,128,0.35)]' 
                            : 'bg-white/10'
                        }`}
                        aria-label="معلق صوتي ذكي عربي"
                      >
                        <span 
                          className={`absolute top-[3px] w-4.5 h-4.5 rounded-full transition-all duration-300 bg-white shadow-md ${
                            subscriptions.arabicVoiceCommentator 
                              ? 'right-[3px]' 
                              : 'right-[23px]'
                          }`} 
                        />
                      </button>
                    </div>
                  </div>

                  {/* Simulator Testing Interface */}
                  <div className="bg-[#121829]/40 border border-white/10 p-4.5 rounded-3xl space-y-3 shadow-inner">
                    <div className="flex items-center gap-1.5 text-[11px] font-black text-primary border-b border-white/5 pb-2.5">
                      <Sparkles size={12} className="animate-spin" />
                      <h4>لوحة فحص ومحاكاة الإشعارات الحية:</h4>
                    </div>
                    
                    <p className="text-[9px] text-gray-400 leading-relaxed text-right font-medium">
                      مرحباً بك! انقر فوق أي زر بالأسفل لمحاكاة وصول نداء مباشر للإشعارات، المؤثرات الصوتية الحاشدة، وقراءة الذكاء الاصطناعي:
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-[10px] font-black">
                      <button
                        onClick={() => triggerDemoSimulator('goal')}
                        className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 py-2.5 rounded-xl text-center cursor-pointer transition-all flex items-center justify-center gap-1 hover:scale-[1.02] active:scale-95"
                      >
                        <span>⚽ هدف ديمو</span>
                      </button>
                      <button
                        onClick={() => triggerDemoSimulator('news')}
                        className="bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 py-2.5 rounded-xl text-center cursor-pointer transition-all flex items-center justify-center gap-1 hover:scale-[1.02] active:scale-95"
                      >
                        <span>🗞️ خبر ديمو</span>
                      </button>
                      <button
                        onClick={() => triggerDemoSimulator('result')}
                        className="bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 py-2.5 rounded-xl text-center cursor-pointer transition-all flex items-center justify-center gap-1 hover:scale-[1.02] active:scale-95"
                      >
                        <span>🏁 صافرة ديمو</span>
                      </button>
                      <button
                        onClick={() => triggerDemoSimulator('card')}
                        className="bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/20 py-2.5 rounded-xl text-center cursor-pointer transition-all flex items-center justify-center gap-1 hover:scale-[1.02] active:scale-95"
                      >
                        <span>🟥 كارت أحمر</span>
                      </button>
                    </div>
                  </div>

                </div>
              )}
            </div>

            {/* Sticky info tip */}
            <div className="mt-3.5 pt-2 text-[9px] text-gray-500 border-t border-white/10 text-center flex items-center justify-center gap-1.5 font-bold">
              <Info size={10} />
              <span>مقتبس تماماً مع أنظمة بث FotMob و 365Scores</span>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
