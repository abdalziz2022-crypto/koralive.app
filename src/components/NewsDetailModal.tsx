import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, X, Layout, Share2, MessageSquare, Newspaper, BookOpen, AArrowUp, AArrowDown, Bookmark, BookmarkCheck } from 'lucide-react';
import { News } from '../types';
import { formatDate } from '../lib/utils';
import Markdown from 'react-markdown';
import AdBanner from './AdBanner';
import ShareButton from './ShareButton';
import { auth, db } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { useError } from '../context/ErrorContext';

interface Props {
  news: News | null;
  onClose: () => void;
}

export default function NewsDetailModal({ news, onClose }: Props) {
  const { showError, showToast } = useError();
  const [user] = useAuthState(auth);
  const [isSaved, setIsSaved] = useState(false);
  const [savingAction, setSavingAction] = useState(false);
  const [readingMode, setReadingMode] = useState(false);
  const [fontSizeLevel, setFontSizeLevel] = useState(2);
  const [readingTheme, setReadingTheme] = useState<'dark' | 'light' | 'sepia' | 'book'>('dark');
  const proseSizes = ['prose-sm', 'prose-base', 'prose-lg', 'prose-xl', 'prose-2xl'];

  // Reading Mode Theme styles mapping
  const themeClasses: Record<'dark' | 'light' | 'sepia' | 'book', { bg: string; text: string; prose: string; heading: string; container: string; desc: string; border: string; from: string; buttonGroup: string }> = {
    dark: {
      bg: 'bg-[#0f0f11]',
      text: 'text-zinc-100',
      prose: 'prose prose-invert prose-emerald',
      heading: 'text-white',
      container: 'bg-[#141416]/90 border-white/10',
      desc: 'text-zinc-400',
      border: 'border-white/10',
      buttonGroup: 'bg-black/40 border-white/10 text-white hover:bg-black/65',
      from: 'from-[#0f0f11] via-[#0f0f11]/80 to-transparent'
    },
    light: {
      bg: 'bg-[#f4f4f5]',
      text: 'text-zinc-900',
      prose: 'prose prose-zinc prose-emerald',
      heading: 'text-zinc-950',
      container: 'bg-white border-zinc-200/80',
      desc: 'text-zinc-600',
      border: 'border-zinc-200',
      buttonGroup: 'bg-zinc-200 border-zinc-300 text-zinc-900 hover:bg-zinc-300/80',
      from: 'from-[#f4f4f5] via-[#f4f4f5]/85 to-transparent'
    },
    sepia: {
      bg: 'bg-[#fbf0db]',
      text: 'text-[#432c1c]',
      prose: 'prose prose-amber prose-emerald',
      heading: 'text-[#432c1c]',
      container: 'bg-[#faf0d9] border-[#ebdcb3]/60',
      desc: 'text-[#6c543f]',
      border: 'border-[#ebd9b1]',
      buttonGroup: 'bg-[#eedeb9] border-[#d8c599] text-[#432c1c] hover:bg-[#e4d4b0]',
      from: 'from-[#fbf0db] via-[#fbf0db]/85 to-transparent'
    },
    book: {
      bg: 'bg-[#0e1726]',
      text: 'text-slate-100',
      prose: 'prose prose-invert prose-slate prose-emerald',
      heading: 'text-white',
      container: 'bg-[#111c2e] border-slate-700/50',
      desc: 'text-slate-400',
      border: 'border-slate-800',
      buttonGroup: 'bg-[#0c1421] border-slate-700/40 text-slate-100 hover:bg-[#131d2e]',
      from: 'from-[#0e1726] via-[#0e1726]/85 to-transparent'
    }
  };

  const activeTheme = themeClasses[readingTheme];

  const handleIncreaseFont = () => setFontSizeLevel(prev => Math.min(prev + 1, 4));
  const handleDecreaseFont = () => setFontSizeLevel(prev => Math.max(prev - 1, 0));

  useEffect(() => {
    if (user && news) {
      const checkSaved = async () => {
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setIsSaved(data.savedArticles?.includes(news.id) || false);
          }
        } catch (error) {
          console.error("Error checking saved state:", error);
        }
      };
      checkSaved();
    } else {
      setIsSaved(false);
    }
  }, [user, news]);

  const handleToggleSave = async () => {
    if (!user) {
      showToast('يرجى تسجيل الدخول أولاً لحفظ المقال في قائمة اقرأ لاحقاً.', 'info');
      return;
    }
    if (!news) return;

    setSavingAction(true);
    try {
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      let currentSaved: string[] = [];
      if (docSnap.exists()) {
        currentSaved = docSnap.data().savedArticles || [];
      }
      
      let newSaved: string[];
      if (currentSaved.includes(news.id)) {
        newSaved = currentSaved.filter(id => id !== news.id);
        await updateDoc(docRef, { savedArticles: newSaved });
        setIsSaved(false);
        showToast('تم إزالة المقال من قائمة اقرأ لاحقاً', 'success');
      } else {
        newSaved = [...currentSaved, news.id];
        if (!docSnap.exists()) {
          await setDoc(docRef, {
            uid: user.uid,
            displayName: user.displayName || 'مستخدم جديد',
            email: user.email || '',
            photoURL: user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user.uid}`,
            isAdmin: user.email === 'abdalziz2022@gmail.com',
            favoriteLeagues: [],
            favoriteTeams: [],
            savedArticles: [news.id]
          });
        } else {
          await updateDoc(docRef, { savedArticles: newSaved });
        }
        setIsSaved(true);
        showToast('تم حفظ المقال في قائمة اقرأ لاحقاً بنجاح!', 'success');
      }
    } catch (error: any) {
      console.error("Error toggling save article:", error);
      showError(error.message || 'حدث خطأ أثناء حفظ المقال');
    } finally {
      setSavingAction(false);
    }
  };

  return (
    <AnimatePresence>
      {news && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 lg:p-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            key="modal-backdrop"
          />
          
          <motion.div
            key="modal-content"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`relative w-full ${readingMode ? 'max-w-3xl' : 'max-w-4xl'} max-h-[90vh] ${readingMode ? activeTheme.bg : 'glass'} rounded-[40px] overflow-hidden flex flex-col shadow-2xl transition-all duration-500`}
          >
            {/* Close Button Mobile */}
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-black transition-colors md:hidden"
            >
              <X size={20} />
            </button>

            {/* Reading Mode Controls - Floating */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
              <button 
                onClick={() => setReadingMode(!readingMode)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs transition-all ${
                  readingMode 
                    ? `${activeTheme.buttonGroup} border-primary text-primary` 
                    : 'bg-black/60 text-white border border-white/10 hover:bg-white/10 backdrop-blur-md'
                }`}
              >
                <BookOpen size={16} />
                <span className="hidden md:inline">{readingMode ? 'إلغاء وضع القراءة' : 'وضع القراءة'}</span>
              </button>
              
              <button 
                onClick={handleToggleSave}
                disabled={savingAction}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs transition-all ${
                  isSaved 
                    ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/10 hover:bg-emerald-400' 
                    : readingMode
                      ? activeTheme.buttonGroup
                      : 'bg-black/60 text-white border border-white/10 hover:bg-white/10 backdrop-blur-md'
                }`}
              >
                {isSaved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                <span className="hidden md:inline">{isSaved ? 'محفوظ في المفضلة' : 'حفظ في اقرأ لاحقاً'}</span>
              </button>
            </div>

            <div className={`flex-1 overflow-y-auto news-scroll ${readingMode ? 'p-0 md:p-4' : ''}`}>
              {/* Reading Settings Toolbar - Displays at the very top of content when readingMode is active */}
              {readingMode && (
                <div className={`mx-6 mt-16 md:mx-10 md:mt-16 p-5 rounded-3xl border ${activeTheme.border} ${activeTheme.container} flex flex-col md:flex-row gap-4 items-center justify-between shadow-md animate-fade-in`}>
                  {/* Left: Metadata info */}
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="w-10 h-10 rounded-2xl bg-secondary/10 flex items-center justify-center text-primary shrink-0">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className={`text-xs font-black ${activeTheme.text}`}>إعدادات وضع القراءة</h4>
                      <p className={`text-[10px] ${activeTheme.desc}`}>خصص حجم ونوع وحبر مظهر القراءة المريح لعينيك</p>
                    </div>
                  </div>

                  {/* Right Controls: FontSize and Themes */}
                  <div className="flex items-center gap-4 flex-wrap justify-end w-full md:w-auto">
                    {/* Size Selector */}
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold ${activeTheme.desc}`}>حجم الخط:</span>
                      <div className={`flex items-center border ${activeTheme.border} rounded-xl p-0.5 bg-black/5`}>
                        <button 
                          onClick={handleDecreaseFont} 
                          disabled={fontSizeLevel === 0} 
                          className={`p-1 w-6 h-6 rounded flex items-center justify-center ${activeTheme.text} hover:bg-black/10 disabled:opacity-30`}
                          title="تصغير الخط"
                        >
                          <AArrowDown size={14} />
                        </button>
                        <span className={`text-[10px] font-black px-2 select-none min-w-[50px] text-center ${activeTheme.text}`}>
                          {fontSizeLevel === 0 ? 'صغير' : fontSizeLevel === 1 ? 'عادي' : fontSizeLevel === 2 ? 'متوسط' : fontSizeLevel === 3 ? 'كبير' : 'ضخم'}
                        </span>
                        <button 
                          onClick={handleIncreaseFont} 
                          disabled={fontSizeLevel === 4} 
                          className={`p-1 w-6 h-6 rounded flex items-center justify-center ${activeTheme.text} hover:bg-black/10 disabled:opacity-30`}
                          title="تكبير الخط"
                        >
                          <AArrowUp size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Color Presets */}
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold ${activeTheme.desc}`}>سمة الورق:</span>
                      <div className={`flex items-center gap-1.5 border ${activeTheme.border} rounded-xl p-1 bg-black/5`}>
                        <button
                          onClick={() => setReadingTheme('dark')}
                          className={`w-5 h-5 rounded-lg bg-[#0f0f11] border transition-all ${readingTheme === 'dark' ? 'border-primary ring-2 ring-primary/20 scale-110' : 'border-zinc-700 hover:scale-105'}`}
                          title="الوضع المظلم البارد"
                        />
                        <button
                          onClick={() => setReadingTheme('book')}
                          className={`w-5 h-5 rounded-lg bg-[#0e1726] border transition-all ${readingTheme === 'book' ? 'border-primary ring-2 ring-primary/20 scale-110' : 'border-slate-700 hover:scale-105'}`}
                          title="الحبر المسائي الهادئ"
                        />
                        <button
                          onClick={() => setReadingTheme('sepia')}
                          className={`w-5 h-5 rounded-lg bg-[#fbf0db] border transition-all ${readingTheme === 'sepia' ? 'border-primary ring-2 ring-primary/20 scale-110' : 'border-amber-700/30 hover:scale-105'}`}
                          title="الورق الدافئ (سيبيا)"
                        />
                        <button
                          onClick={() => setReadingTheme('light')}
                          className={`w-5 h-5 rounded-lg bg-[#f4f4f5] border transition-all ${readingTheme === 'light' ? 'border-primary ring-2 ring-primary/20 scale-110' : 'border-zinc-400 hover:scale-105'}`}
                          title="الورق الفاتح"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Header Image */}
              <div className={`relative w-full transition-all duration-500 ${readingMode ? 'h-32 md:h-48 mt-4 rounded-t-[40px] md:rounded-[36px] overflow-hidden' : 'h-64 md:h-96'}`}>
                <img 
                  src={news.image || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800'} 
                  alt="" 
                  className={`w-full h-full object-cover transition-all duration-500 ${readingMode ? 'opacity-20 grayscale' : 'opacity-100'}`}
                />
                <div className={`absolute inset-0 bg-gradient-to-t transition-all duration-300 ${readingMode ? activeTheme.from : 'from-black via-black/20 to-transparent'}`} />
                
                <div className={`absolute bottom-0 left-0 right-0 ${readingMode ? 'p-6' : 'p-6 md:p-10'} space-y-4`}>
                  <div className="flex items-center gap-3">
                    <span className="bg-secondary text-black text-[10px] md:text-sm font-black px-3 py-1 rounded-full uppercase">
                      {news.category}
                    </span>
                    <div className={`flex items-center gap-2 text-[10px] md:text-xs ${readingMode ? activeTheme.desc : 'text-white/70'}`}>
                      <Clock size={14} />
                      <span>{formatDate(news.createdAt)}</span>
                    </div>
                  </div>
                  <h2 className={`font-black leading-tight transition-all duration-300 ${readingMode ? activeTheme.heading : 'text-white'} ${readingMode ? 'text-xl md:text-3xl' : 'text-2xl md:text-5xl'}`}>
                    {news.title}
                  </h2>
                </div>
              </div>

              <div className={`p-6 md:p-10 ${readingMode ? 'max-w-3xl mx-auto' : 'grid grid-cols-1 lg:grid-cols-3 gap-10'}`}>
                <div className={`${readingMode ? 'w-full' : 'lg:col-span-2'} space-y-8`}>
                  <div className={`prose ${readingMode ? activeTheme.prose : 'prose prose-invert prose-primary'} ${proseSizes[fontSizeLevel]} max-w-none prose-img:rounded-2xl prose-headings:font-black prose-a:text-primary transition-all duration-300`}>
                    <Markdown>{news.content || 'لا تتوفر تفاصيل إضافية لهذا الخبر. يرجى زيارة الرابط الأصلي للحصول على القصة الكاملة.'}</Markdown>
                  </div>

                  <div className={`pt-8 border-t ${readingMode ? activeTheme.border : 'border-white/5'} flex items-center justify-between`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                        <Layout size={20} />
                      </div>
                      <div>
                        <p className={`text-[10px] ${readingMode ? activeTheme.desc : 'text-gray-500'} font-bold uppercase`}>الكاتب</p>
                        <p className={`font-black text-sm ${readingMode ? activeTheme.text : 'text-white'}`}>{news.author}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 md:gap-4 flex-wrap">
                      {news.link && (
                        <a 
                          href={news.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-primary text-black px-4 md:px-6 py-2 md:py-2.5 rounded-full text-xs font-black flex items-center gap-2 hover:scale-105 transition-all"
                        >
                          اقرأ المصدر
                        </a>
                      )}
                      
                      <button
                        onClick={handleToggleSave}
                        disabled={savingAction}
                        className={`flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 rounded-full text-xs font-black transition-all border ${
                          isSaved 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20' 
                            : readingMode
                              ? activeTheme.buttonGroup
                              : 'bg-white/5 text-white border-white/10 hover:bg-white/10'
                        }`}
                      >
                        {isSaved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                        <span>{isSaved ? 'حُفظ لاحقاً' : 'اقرأ لاحقاً'}</span>
                      </button>

                      <ShareButton 
                        variant="dropdown" 
                        align="right" 
                        title={news.title} 
                        url={news.link || window.location.href} 
                        text={`اقرأ الخبر كاملاً: "${news.title}" على كورة 90 البوابة الرياضية الشاملة!`} 
                      />
                    </div>
                  </div>
                </div>

                {/* Sidebar/Ad - Hidden in Reading Mode */}
                {!readingMode && (
                  <div className="hidden lg:block space-y-6">
                    <div className="p-6 glass rounded-3xl border-secondary/20 border">
                      <h4 className="font-black text-secondary mb-4 flex items-center gap-2">
                         <Newspaper size={16} /> مميز لك
                      </h4>
                      <p className="text-sm text-gray-400 font-medium leading-relaxed">
                         تابع كل أخبار الكرة العالمية والعربية لحظة بلحظة.
                      </p>
                    </div>
                    <AdBanner slot="News_Detail_Sidebar" />
                  </div>
                )}
              </div>
            </div>

            {/* Top Close Button Desktop */}
            <button 
              onClick={onClose}
              className={`absolute top-6 right-6 hidden md:flex p-3 ${
                readingMode 
                  ? activeTheme.buttonGroup 
                  : 'glass hover:bg-white/20 text-white'
              } rounded-full transition-all z-[101] group`}
            >
              <X size={24} className="group-hover:rotate-90 transition-transform" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
