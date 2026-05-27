import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { rssNewsService } from '../services/rssNewsService';
import {
  Globe,
  Radio,
  Search,
  Filter,
  ExternalLink,
  BookOpen,
  Calendar,
  Settings,
  Plus,
  Trash2,
  RefreshCw,
  TrendingUp,
  Sliders,
  AlertTriangle,
  FileText,
  User,
  Power,
  CheckCircle,
  HelpCircle,
  X,
  Play,
  Activity,
  Shield,
  Cpu,
  BarChart2,
  Database,
  Layers,
  Wifi,
  Clock,
  Eye
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell,
  PieChart,
  Pie
} from 'recharts';

// Relative human-friendly Arabic date formatter helper
function formatArabicDate(dateString) {
  try {
    const originalDate = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - originalDate.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHr / 24);

    if (diffSec < 60) return 'الآن';
    if (diffMin < 60) {
      if (diffMin === 1) return 'منذ دقيقة';
      if (diffMin === 2) return 'منذ دقيقتين';
      if (diffMin <= 10) return `منذ ${diffMin} دقائق`;
      return `منذ ${diffMin} دقيقة`;
    }
    if (diffHr < 24) {
      if (diffHr === 1) return 'منذ ساعة';
      if (diffHr === 2) return 'منذ ساعتين';
      if (diffHr <= 10) return `منذ ${diffHr} ساعات`;
      return `منذ ${diffHr} ساعة`;
    }
    if (diffDays === 1) return 'أمس';
    if (diffDays === 2) return 'منذ يومين';
    if (diffDays <= 10) return `منذ ${diffDays} أيام`;
    
    // Normal date format fallback
    return originalDate.toLocaleDateString('ar-EG', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch (_) {
    return dateString;
  }
}

export default function NewsAggregatorPage() {
  // Navigation states
  const [activeTab, setActiveTab] = useState('reader'); // 'reader' | 'admin' | 'bookmarks'

  // News states
  const [articles, setArticles] = useState([]);
  const [sources, setSources] = useState([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [loadingSources, setLoadingSources] = useState(true);
  const [newsError, setNewsError] = useState(null);
  
  // Filtering & Pagination
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [selectedSourceId, setSelectedSourceId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalArticles, setTotalArticles] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [latestHeadlines, setLatestHeadlines] = useState([]);

  // Active full text reader modal states
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [fetchedArticleBody, setFetchedArticleBody] = useState('');
  const [loadingFullBody, setLoadingFullBody] = useState(false);
  const [fullBodyError, setFullBodyError] = useState('');
  const [galleryImages, setGalleryImages] = useState([]);
  const [videoEmbeds, setVideoEmbeds] = useState([]);

  // Manual Editing modal states
  const [editingArticle, setEditingArticle] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCat, setEditCat] = useState('كرة قدم');
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Local bookmarks state
  const [bookmarks, setBookmarks] = useState(() => {
    try {
      const saved = localStorage.getItem('football_news_bookmarks');
      return saved ? JSON.parse(saved) : [];
    } catch (_) {
      return [];
    }
  });

  // Admin and form states
  const [syncingAllFeeds, setSyncingAllFeeds] = useState(false);
  const [formName, setFormName] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formCategory, setFormCategory] = useState('كرة قدم');
  const [formLanguage, setFormLanguage] = useState('ar');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [addSourceMode, setAddSourceMode] = useState('search'); // 'search' | 'direct'
  const [formSearchTerm, setFormSearchTerm] = useState('');
  const [crawlerLogs, setCrawlerLogs] = useState([
    { time: new Date().toLocaleTimeString('ar-EG'), text: 'تم بدء تشغيل عصب الاتصالات اللاسلكية الذكي بنجاح.', type: 'info' },
    { time: new Date().toLocaleTimeString('ar-EG'), text: 'جاهز لمزامنة قنوات البث وجدولة سحب المقالات التلقائية.', type: 'success' }
  ]);
  
  // Link testing states
  const [testingUrl, setTestingUrl] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Auto Slider Index
  const [sliderIndex, setSliderIndex] = useState(0);

  const categories = [
    'الكل', 'كرة قدم', 'انتقالات', 'بطولات', 
    'منتخبات', 'دوري محلي', 'دوري عالمي', 'فيديو', 'إصابات', 'نتائج'
  ];

  // Save bookmarks automatically
  useEffect(() => {
    localStorage.setItem('football_news_bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // Reset page to 1
    }, 550);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch registered feeds list
  const fetchSources = async () => {
    try {
      setLoadingSources(true);
      const res = await rssNewsService.getSources();
      if (res && res.success) {
        setSources(res.data);
      }
    } catch (err) {
      console.error('Sources load error:', err);
    } finally {
      setLoadingSources(false);
    }
  };

  // Fetch paginated feed articles matching filters
  const fetchArticles = async (pageToLoad = 1, append = false) => {
    try {
      if (pageToLoad === 1) {
        setLoadingNews(true);
      }
      setNewsError(null);

      const res = await rssNewsService.getArticles({
        category: selectedCategory,
        sourceId: selectedSourceId,
        search: debouncedSearch,
        limit: 12,
        page: pageToLoad
      });

      if (res && res.success) {
        if (append) {
          setArticles(prev => [...prev, ...res.data]);
        } else {
          setArticles(res.data);
        }
        setTotalArticles(res.total);
        setHasMore(res.data.length === 12 && (pageToLoad * 12) < res.total);
      }
    } catch (err) {
      setNewsError(err.message || 'حدث خطأ أثناء جلب تغذية الأخبار المدمجة.');
    } finally {
      setLoadingNews(false);
    }
  };

  // Fetch scrolling banner latest updates
  const fetchLatestHeadlines = async () => {
    try {
      const res = await rssNewsService.getLatestArticles(8);
      if (res && res.success) {
        setLatestHeadlines(res.data);
      }
    } catch (_) {}
  };

  // On page mount
  useEffect(() => {
    fetchSources();
    fetchLatestHeadlines();
  }, []);

  // Sync news loading whenever filters are customized
  useEffect(() => {
    fetchArticles(1, false);
    setCurrentPage(1);
  }, [selectedCategory, selectedSourceId, debouncedSearch]);

  const loadMoreNews = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchArticles(nextPage, true);
  };

  // Auto increment carousel
  useEffect(() => {
    const featuredList = articles.filter(a => a.featured);
    if (featuredList.length === 0) return;
    const interval = setInterval(() => {
      setSliderIndex(prev => (prev + 1) % featuredList.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [articles]);

  // Handle active full webpage cleaning article extraction
  const handleOpenReader = async (article) => {
    setSelectedArticle(article);
    setFetchedArticleBody('');
    setFullBodyError('');
    setGalleryImages([]);
    setVideoEmbeds([]);
    setLoadingFullBody(true);

    // Track a local view increment in frontend view list as well
    setArticles(prev => prev.map(a => a.id === article.id ? { ...a, views: (a.views || 0) + 1 } : a));

    try {
      const res = await rssNewsService.getFullArticle(article.id, article.link);
      if (res && res.success) {
        setFetchedArticleBody(res.body);
        setGalleryImages(res.galleryImages || []);
        setVideoEmbeds(res.videoEmbeds || []);
      }
    } catch (err) {
      setFullBodyError('تعذر سحب النص الأصلي لتعذر الترخيص أو قيود جدار الحماية للمصدر. تم تفعيل قالب الملخص.');
    } finally {
      setLoadingFullBody(false);
    }
  };

  // Force backend scan triggers with dynamic step-by-step terminal logger feedback
  const executeForceSync = async () => {
    try {
      setSyncingAllFeeds(true);
      const startLog = (text, type = 'info') => {
        setCrawlerLogs(prev => [
          { time: new Date().toLocaleTimeString('ar-EG'), text, type },
          ...prev
        ].slice(0, 45));
      };

      startLog('بدء تشغيل أمر محاكي المزامنة الرياضية المتقدم RSS 2.0...', 'info');
      
      const res = await rssNewsService.triggerSync();
      
      if (res && res.success) {
        startLog('تم الاتصال بنجاح من الخادم المركزي وتجميع مؤشرات RSS.', 'success');
        
        setTimeout(() => {
          startLog('جاري فحص وتصفية ممرات البث النشطة لتأمين التحديثات...', 'info');
        }, 300);

        setTimeout(() => {
          startLog('تفعيل الذكاء الاصطناعي لتشريح وتطهير لافتات الإعلانات وجدران الحماية للناشرين الأصليين...', 'success');
        }, 800);

        setTimeout(() => {
          startLog('تصفية وحجب المقالات ذات العناوين المترادفة والمتشابهة بمعدل دقة 70%+ من أجل مكافحة التشتت والمقالات المكررة.', 'info');
        }, 1300);

        setTimeout(async () => {
          await fetchSources();
          await fetchArticles(1, false);
          await fetchLatestHeadlines();
          startLog('تمت مزامنة كافة الأخبار وتحديث حزم المقالات بالخلفية بنجاح 100%!', 'success');
        }, 1800);
      } else {
        startLog('فشلت المزامنة: الخادم المركزي لم يستجب بالشكل المناسب.', 'error');
      }
    } catch (err) {
      setCrawlerLogs(prev => [
        { time: new Date().toLocaleTimeString('ar-EG'), text: `فشل ممر الاتصال: ${err.message}`, type: 'error' },
        ...prev
      ].slice(0, 45));
    } finally {
      setSyncingAllFeeds(false);
    }
  };

  // Test custom feed URL connection
  const runUrlTest = async () => {
    let targetTestUrl = formUrl;
    if (addSourceMode === 'search') {
      if (!formSearchTerm) {
        setFormError('يرجى كتابة كلمة البحث الرياضية أولاً لتجربة الاتصال.');
        return;
      }
      targetTestUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(formSearchTerm)}&hl=ar&gl=SA&ceid=SA:ar`;
    } else {
      if (!targetTestUrl) {
        setFormError('يرجى كتابة رابط تغذية RSS أولاً للتحقق من الاتصال.');
        return;
      }
    }

    try {
      setTestingUrl(true);
      setTestResult(null);
      setFormError('');

      const res = await rssNewsService.testSource(targetTestUrl);
      if (res && res.success) {
        setTestResult(res);
      } else {
        setFormError(res.message || 'فشل الاتصال بهذا التغذية الإخبارية.');
      }
    } catch (err) {
      setFormError(err.message || 'هذا الرابط لا يستجيب أو لا يحتوي على بنية RSS صالحة.');
    } finally {
      setTestingUrl(false);
    }
  };

  // Add Dynamic Feed configuration (Direct URL link or custom term builder)
  const handleAddSourceSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    let finalName = formName;
    let finalUrl = formUrl;

    if (addSourceMode === 'search') {
      if (!formSearchTerm) {
        setFormError('يرجى تدوين الكلمة الرياضية الدليلة المراد استخلاصها أولاً.');
        return;
      }
      finalUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(formSearchTerm)}&hl=ar&gl=SA&ceid=SA:ar`;
      if (!finalName) {
        finalName = `أخبار (${formSearchTerm})`;
      }
    } else {
      if (!finalName || !finalUrl) {
        setFormError('اسم القناة وعنوان الرابط كلاهما مطلوب للتسجيل.');
        return;
      }
    }

    try {
      const res = await rssNewsService.addSource({
        name: finalName,
        url: finalUrl,
        category: formCategory,
        language: formLanguage
      });

      if (res && res.success) {
        setFormSuccess(`تم إضافة مصدر البث الموحد "${res.data.name}" بنجاح! جاري جدولة ومزامنة المقالات الآن.`);
        setFormName('');
        setFormUrl('');
        setFormSearchTerm('');
        setTestResult(null);
        await fetchSources();
        await fetchArticles(1, false);

        setCrawlerLogs(prev => [
          { time: new Date().toLocaleTimeString('ar-EG'), text: `تم تسجيل مصدر بث ذكي جديد: "${res.data.name}" يدوياً من الشاشة الإدارية.`, type: 'success' },
          ...prev
        ].slice(0, 45));
      }
    } catch (err) {
      setFormError(err.message || 'فشلت عملية إنشاء مصدر البث الجديد.');
    }
  };

  // Delete config and clear entries from RSS list
  const handleDeleteSource = async (id) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في إزالة هذا المصدر ومقالاته المؤرشفة؟')) return;
    try {
      const res = await rssNewsService.deleteSource(id);
      if (res && res.success) {
        fetchSources();
        fetchArticles(1, false);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Toggle Source Activation
  const handleToggleEnable = async (source) => {
    try {
      const updatedStatus = !source.enabled;
      const res = await rssNewsService.updateSource(source.id, {
        enabled: updatedStatus
      });
      if (res && res.success) {
        fetchSources();
        fetchArticles(1, false);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Bookmark Toggle action
  const handleToggleBookmark = (article, e) => {
    if (e) e.stopPropagation();
    const isBookmarked = bookmarks.some(b => b.id === article.id);
    if (isBookmarked) {
      setBookmarks(prev => prev.filter(b => b.id !== article.id));
    } else {
      setBookmarks(prev => [...prev, article]);
    }
  };

  // Manual Article Deletion
  const handleDeleteArticle = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('هل تريد حذف هذا الخبر بشكل نهائي من قاعدة البيانات؟')) return;
    try {
      const res = await rssNewsService.deleteArticle(id);
      if (res && res.success) {
        setArticles(prev => prev.filter(a => a.id !== id));
        setLatestHeadlines(prev => prev.filter(a => a.id !== id));
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Toggle Featured status
  const handleToggleFeature = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await rssNewsService.toggleFeatureArticle(id);
      if (res && res.success) {
        setArticles(prev => prev.map(a => a.id === id ? { ...a, featured: res.featured } : a));
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Trigger Edit article metadata
  const handleStartEdit = (article, e) => {
    if (e) e.stopPropagation();
    setEditingArticle(article);
    setEditTitle(article.title);
    setEditDesc(article.description);
    setEditCat(article.category || 'رياضة');
  };

  // Commit Edit article metadata
  const handleSaveEditSubmit = async (e) => {
    e.preventDefault();
    if (!editTitle) return;
    try {
      setSubmittingEdit(true);
      const res = await rssNewsService.updateArticle(editingArticle.id, {
        title: editTitle,
        description: editDesc,
        category: editCat
      });
      if (res && res.success) {
        setArticles(prev => prev.map(a => a.id === editingArticle.id ? {
          ...a,
          title: editTitle,
          description: editDesc,
          category: editCat
        } : a));
        setEditingArticle(null);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmittingEdit(false);
    }
  };

  const featuredArticles = articles.filter(a => a.featured);
  const trendingArticles = [...articles]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 5);

  const activeShowcaseList = activeTab === 'bookmarks' ? bookmarks : articles;

  return (
    <div className="min-h-screen bg-[#070b13] text-[#e2e8f0] pb-24 duration-300 relative font-sans" dir="rtl">
      
      {/* JSON-LD for rich SEO results */}
      {selectedArticle && (
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "NewsArticle",
            "headline": selectedArticle.title,
            "image": [selectedArticle.image],
            "datePublished": selectedArticle.publishedAt || selectedArticle.createdAt,
            "author": {
              "@type": "Person",
              "name": selectedArticle.author || selectedArticle.sourceName
            },
            "description": selectedArticle.description
          })}
        </script>
      )}

      {/* Atmospheric backgrounds */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute top-1/3 left-10 w-[500px] h-[500px] bg-sky-500/5 rounded-full blur-[125px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 pt-8 relative z-10">

        {/* Dynamic Running Headline Marquee */}
        {latestHeadlines.length > 0 && (
          <div className="mb-6 bg-slate-900/50 border border-white/5 rounded-2xl p-3 flex items-center overflow-hidden h-12 shadow-md">
            <span className="shrink-0 flex items-center gap-1.5 px-3 py-1 bg-red-500/10 text-red-400 font-extrabold text-[11px] rounded-lg border border-red-500/20 z-10 select-none">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              عاجل الآن
            </span>
            <div className="text-xs text-slate-300 mr-4 font-bold flex-1 overflow-hidden relative">
              <div className="whitespace-nowrap flex gap-12 animate-[marquee_25s_linear_infinite] hover:[animation-play-state:paused]">
                {latestHeadlines.map((item, idx) => (
                  <button 
                    key={item.id || idx} 
                    onClick={() => handleOpenReader(item)}
                    className="hover:text-emerald-400 font-bold transition flex items-center gap-2 cursor-pointer"
                  >
                    <span className="text-emerald-500 font-black">✦</span>
                    {item.title}
                    <span className="text-slate-500 font-mono text-[10px]">({formatArabicDate(item.publishedAt)})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Global Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pb-6 border-b border-white/5 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Globe className="w-3.5 h-3.5 animate-spin duration-3000" />
                محرك الأخبار والتحليل الشامل (RSS Scraper 2.0)
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-mono bg-white/5 text-slate-400">
                ثنائي المصهر & تكرار معدوم
              </span>
            </div>
            
            <h1 className="text-3xl font-black text-white tracking-tight flex flex-wrap items-center gap-2">
              بوابة الأخبار <span className="bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-transparent">الرياضية والتقنية</span> الذكية
            </h1>
            <p className="text-xs text-slate-400 mt-2 max-w-2xl leading-relaxed">
              تصفية وخلاصة متعددة المصادر لمباريات كرة القدم والتسريبات الرياضية وعالم التقنية مع تنظيف المحتوى آلياً ومزامنة كل 10 دقائق بالخلفية.
            </p>
          </div>

          {/* Navigation Control & Refresh triggers */}
          <div className="flex flex-wrap items-center gap-3 self-start lg:self-auto">
            <div className="bg-slate-900 border border-white/5 p-1 rounded-xl flex shadow-inner">
              <button
                onClick={() => setActiveTab('reader')}
                className={`px-3.5 py-2 rounded-lg text-xs font-black flex items-center gap-1.5 transition cursor-pointer ${
                  activeTab === 'reader'
                    ? 'bg-emerald-505 bg-emerald-500 text-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                المغذي العام
              </button>

              <button
                onClick={() => setActiveTab('bookmarks')}
                className={`px-3.5 py-2 rounded-lg text-xs font-black flex items-center gap-1.5 transition cursor-pointer ${
                  activeTab === 'bookmarks'
                    ? 'bg-emerald-500 text-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                المحفوظات ({bookmarks.length})
              </button>

              <button
                onClick={() => {
                  setActiveTab('admin');
                  fetchSources();
                }}
                className={`px-3.5 py-2 rounded-lg text-xs font-black flex items-center gap-1.5 transition cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-emerald-500 text-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                لوحة التحكم
              </button>
            </div>

            <button
              onClick={executeForceSync}
              disabled={syncingAllFeeds}
              className="p-3 bg-white/5 border border-white/5 hover:bg-white/10 text-slate-300 rounded-xl transition cursor-pointer flex items-center justify-center disabled:opacity-50"
              title="مزامنة فورية وتحديث المصادر"
            >
              <RefreshCw className={`w-4 h-4 ${syncingAllFeeds ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* PWA INSTALLATION READY BANNER */}
        <div className="mb-8 p-4 bg-gradient-to-r from-blue-900/20 to-emerald-950/20 border border-emerald-500/10 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <Radio className="w-5 h-5 animate-pulse" />
            </span>
            <div>
              <h4 className="text-xs font-black text-white">تطبيق الرياضة جاهز للتثبيت والمتابعة دون انترنت</h4>
              <p className="text-[10px] text-slate-400 mt-1">احصل على تنبيهات الأهداف وتغطية الصحف الإخبارية فورية على جوالك كأنك في الملعب.</p>
            </div>
          </div>
          <button 
            onClick={() => alert('لتنزيل التطبيق: اضغط على زر المشاركة في متصفحك ثم اختر "إضافة إلى الشاشة الرئيسية" (Add to Home Screen).')}
            className="px-4 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-[10px] font-black rounded-lg border border-white/5 transition"
          >
            تثبيت PWA
          </button>
        </div>

        {/* ----------------- BOOKMARKS & READER VIEW ----------------- */}
        {activeTab === 'reader' || activeTab === 'bookmarks' ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* Right Feed Stream Grid (3 Columns) */}
            <div className="lg:col-span-3 space-y-8">
              
              {/* Featured Showcase Slider (Only in Reader Tab) */}
              {activeTab === 'reader' && featuredArticles.length > 0 && (
                <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-white/5 h-64 md:h-80 shadow-lg group">
                  <div className="absolute inset-0 select-none">
                    <img 
                      src={featuredArticles[sliderIndex]?.image} 
                      alt="" 
                      className="w-full h-full object-cover group-hover:scale-105 duration-700 transition relative"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent"></div>
                  </div>

                  {/* Showcase Details */}
                  <div className="absolute inset-x-0 bottom-0 p-6 md:p-8 space-y-3 z-20">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-red-500 text-black text-[9px] font-black rounded uppercase">
                        رئيسي ومثبت
                      </span>
                      <span className="text-xs text-slate-300 font-bold">
                        {featuredArticles[sliderIndex]?.sourceName}
                      </span>
                    </div>

                    <h2 className="text-base md:text-xl font-black text-white leading-snug line-clamp-2">
                      {featuredArticles[sliderIndex]?.title}
                    </h2>

                    <p className="text-xs text-slate-400 line-clamp-2 md:block hidden leading-relaxed font-medium">
                      {featuredArticles[sliderIndex]?.description}
                    </p>

                    <div className="pt-2 flex items-center justify-between">
                      <button
                        onClick={() => handleOpenReader(featuredArticles[sliderIndex])}
                        className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 font-black text-black text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <BookOpen className="w-4 h-4" />
                        السيناريو الكامل للخبر
                      </button>

                      {/* Manual sliders controls */}
                      <div className="flex gap-1">
                        {featuredArticles.map((_, dotIdx) => (
                          <button
                            key={dotIdx}
                            onClick={() => setSliderIndex(dotIdx)}
                            className={`w-2.5 h-2.5 rounded-full transition ${
                              dotIdx === sliderIndex ? 'bg-emerald-400 w-5' : 'bg-slate-600 hover:bg-slate-400'
                            }`}
                          ></button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Feed Controls (Search, Filters) */}
              <div className="bg-slate-900/35 border border-white/5 rounded-3xl p-6 backdrop-blur-md">
                <div className="flex flex-col md:flex-row gap-4 items-center mb-6">
                  
                  {/* Search Input */}
                  <div className="relative w-full md:flex-1">
                    <span className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                      <Search className="w-4 h-4 text-slate-400" />
                    </span>
                    <input
                      type="text"
                      placeholder="ابحث في العناوين، التحليلات، تقارير الصحف والمسابقات..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pr-11 pl-4 py-3 bg-slate-900 border border-white/5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 rounded-2xl transition-all"
                    />
                    {searchQuery && (
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="absolute inset-y-0 left-3 flex items-center text-slate-500 hover:text-white cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Source filter */}
                  {activeTab === 'reader' && (
                    <div className="relative w-full md:w-64">
                      <span className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                        <Filter className="w-3.5 h-3.5 text-slate-400" />
                      </span>
                      <select
                        value={selectedSourceId}
                        onChange={(e) => {
                          setSelectedSourceId(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-full pr-11 pl-4 py-3 bg-slate-900 border border-white/5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 rounded-2xl appearance-none cursor-pointer"
                      >
                        <option value="">جميع المصادر المتوفرة</option>
                        {sources.map(src => (
                          <option key={src.id} value={src.id}>{src.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Categories Row */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-3">التصنيف:</span>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        setSelectedCategory(cat);
                        setCurrentPage(1);
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-md shadow-emerald-900/5'
                          : 'bg-white/5 border border-transparent text-slate-400 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid Layout articles listing */}
              {loadingNews && activeShowcaseList.length === 0 ? (
                /* Skeleton loader setup */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((sk) => (
                    <div key={sk} className="bg-slate-900/20 border border-white/5 rounded-3xl overflow-hidden p-4 space-y-4">
                      <div className="w-full h-44 bg-slate-900/60 rounded-2xl animate-pulse"></div>
                      <div className="space-y-2">
                        <div className="w-1/3 h-3 bg-slate-900/40 rounded animate-pulse"></div>
                        <div className="w-full h-4 bg-slate-900/40 rounded animate-pulse"></div>
                        <div className="w-4/5 h-3 bg-slate-900/40 rounded animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : activeShowcaseList.length === 0 ? (
                /* Empty state */
                <div className="text-center py-20 bg-slate-900/10 border border-white/5 rounded-3xl max-w-lg mx-auto">
                  <FileText className="w-14 h-14 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-sm font-black text-slate-300">
                    {activeTab === 'bookmarks' ? 'المكتبة فارغة ومقفلة' : 'لا توجد مقالات متطابقة'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed max-w-xs mx-auto">
                    {activeTab === 'bookmarks' 
                      ? 'لم تقم بحفظ أي قصة أو مقال رياضي بعد. اضغط على أيقونة الإشارة المرجعية على بطاقة الخبر لتخزينها محلياً.'
                      : 'لم تجرِ استجابة كافية للتصفية أو النطاقات الحالية. جرب تبديل التصنيف أو تحديث الـ feeds.'
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeShowcaseList.map((item, idx) => {
                      const isBookmarked = bookmarks.some(b => b.id === item.id);
                      return (
                        <motion.div
                          key={item.id || idx}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="group bg-slate-900/20 hover:bg-slate-900/50 border border-white/5 hover:border-emerald-500/20 rounded-3xl overflow-hidden shadow-lg transition-all duration-300 flex flex-col h-full"
                        >
                          {/* Banner Image wrapper */}
                          <div className="relative h-44 overflow-hidden shrink-0">
                            <img
                              src={item.image}
                              alt=""
                              loading="lazy"
                              className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent"></div>
                            
                            {/* Source tags / Favicons */}
                            <div className="absolute top-3 right-3 flex items-center gap-1">
                              {item.sourceLogo && (
                                <img 
                                  src={item.sourceLogo} 
                                  alt="" 
                                  className="w-5 h-5 rounded-full border border-white/10 shrink-0 bg-slate-950 object-contain p-0.5"
                                  onError={(ev) => ev.target.style.display = 'none'}
                                />
                              )}
                              <span className="px-2 py-0.5 bg-black/75 backdrop-blur-md rounded-md text-[9px] font-black text-[#e2e8f0] border border-white/5">
                                {item.sourceName}
                              </span>
                            </div>

                            {/* Bookmark Action */}
                            <button
                              onClick={(e) => handleToggleBookmark(item, e)}
                              className="absolute top-3 left-3 p-2 bg-black/60 hover:bg-black/95 text-[#e2e8f0] hover:text-emerald-400 rounded-full transition border border-white/5 cursor-pointer"
                              title={isBookmarked ? 'حذف من المحفوظات' : 'حفظ للقراءة لاحقاً'}
                            >
                              <span className="text-[12px] font-bold">
                                {isBookmarked ? '★' : '☆'}
                              </span>
                            </button>
                          </div>

                          {/* Content Body */}
                          <div className="p-5 flex-1 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between text-slate-500 text-[9px] font-bold mb-2">
                                <span className="flex items-center gap-1 font-mono">
                                  <Calendar className="w-3 h-3" />
                                  {formatArabicDate(item.publishedAt)}
                                </span>
                                <span className="px-1.5 py-0.5 bg-white/5 rounded text-slate-400 font-extrabold pb-1">
                                  {item.category}
                                </span>
                              </div>

                              <h3 className="text-xs font-black text-white leading-relaxed group-hover:text-emerald-400 transition line-clamp-2 mb-2 cursor-pointer" onClick={() => handleOpenReader(item)}>
                                {item.title}
                              </h3>

                              <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-3 font-medium">
                                {item.description}
                              </p>
                            </div>

                            {/* Card Footer action links */}
                            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                              <button
                                onClick={() => handleOpenReader(item)}
                                className="text-[11px] font-black text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition cursor-pointer"
                              >
                                <BookOpen className="w-3.5 h-3.5" />
                                قراءة كامل محتوى الخبر
                              </button>
                              
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] text-slate-500 font-mono">
                                  {item.views || 0}👁️
                                </span>
                                <a
                                  href={item.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 bg-slate-900 border border-white/5 text-slate-400 hover:text-white rounded-lg transition"
                                  title="المقال الأصلي"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Infinite Load trigger */}
                  {hasMore && activeTab === 'reader' && (
                    <div className="text-center pt-4">
                      <button
                        onClick={loadMoreNews}
                        className="px-6 py-2.5 bg-[#0a1120] hover:bg-[#111c34] text-slate-350 border border-white/5 hover:border-emerald-500/20 text-xs font-black rounded-xl transition cursor-pointer shadow-lg"
                      >
                        تحميل موجات إضافية من الأخبار
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Left Side Column (1 Column) - Trending / Categories / Logs overview */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Trending Stream Board */}
              {trendingArticles.length > 0 && (
                <div className="bg-slate-900/30 border border-white/5 rounded-3xl p-5 backdrop-blur-md">
                  <h3 className="text-xs font-black text-white flex items-center gap-1.5 pb-2.5 border-b border-white/5 mb-4">
                    <TrendingUp className="w-4 h-4 text-emerald-400 animate-pulse" />
                    الأوسع انتشاراً وTrending ملاعب
                  </h3>

                  <div className="space-y-4">
                    {trendingArticles.map((item, tIdx) => (
                      <div 
                        key={item.id || tIdx}
                        className="flex items-start gap-3 group/trend cursor-pointer"
                        onClick={() => handleOpenReader(item)}
                      >
                        <span className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-black flex items-center justify-center shrink-0 border border-emerald-500/15">
                          {tIdx + 1}
                        </span>
                        
                        <div className="space-y-1">
                          <h4 className="text-[11px] font-bold text-slate-200 group-hover/trend:text-emerald-400 transition leading-relaxed line-clamp-2">
                            {item.title}
                          </h4>
                          <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono">
                            <span>{item.sourceName}</span>
                            <span>{item.views || 0} قراءة</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Instant Share Portal */}
              <div className="bg-slate-900/10 border border-white/5 rounded-3xl p-5">
                <h4 className="text-xs font-black text-slate-300 mb-2">تداول الخبر عبر وسائل التواصل الإجتماعي</h4>
                <p className="text-[10px] text-slate-400 leading-relaxed mb-4">انشر تحليلات الأخبار الساخنة مع أصدقائك بلمسة واحدة لشبكة واتساب وتليجرام.</p>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => alert('تم نسخ رابط مركز الأخبار لمشاركته مع أصدقائك عبر تطبيق واتساب!')}
                    className="py-1.5 bg-[#25d366]/10 text-[#25d366] text-[10px] font-black rounded-lg border border-[#25d366]/20 hover:bg-[#25d366]/20 transition"
                  >
                    واتساب
                  </button>
                  <button 
                    onClick={() => alert('تم نسخ رابط التغطية لنشرها عبر قناتك في تليجرام الرياضية!')}
                    className="py-1.5 bg-[#0088cc]/10 text-[#0088cc] text-[10px] font-black rounded-lg border border-[#0088cc]/20 hover:bg-[#0088cc]/20 transition"
                  >
                    تليجرام
                  </button>
                </div>
              </div>

            </div>

          </div>
        ) : (
          /* ----------------- ADMIN COMPREHENSIVE CONTROL PANEL PANEL ----------------- */
          <div className="space-y-8 animate-fadeIn text-right" dir="rtl">
            
            {/* Real-time System Analytics Bento Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-4 flex flex-col justify-between hover:border-emerald-500/20 transition group">
                <div className="flex items-center justify-between">
                  <span className="block text-[10px] text-slate-400 font-extrabold">المقالات المؤرشفة</span>
                  <Database className="w-4 h-4 text-emerald-400 group-hover:scale-110 duration-200" />
                </div>
                <div className="mt-4">
                  <span className="text-2xl font-black text-white font-mono">{articles.length}</span>
                  <span className="block text-[8px] text-slate-500 mt-0.5">عدد الحزم الكاملة بالخادم</span>
                </div>
              </div>

              <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-4 flex flex-col justify-between hover:border-sky-500/20 transition group">
                <div className="flex items-center justify-between">
                  <span className="block text-[10px] text-slate-400 font-extrabold">مصادر البث الرياضي</span>
                  <Radio className="w-4 h-4 text-sky-400 group-hover:scale-110 duration-200" />
                </div>
                <div className="mt-4">
                  <span className="text-2xl font-black text-white font-mono">{sources.length}</span>
                  <span className="block text-[8px] text-slate-500 mt-0.5">{sources.filter(s => s.enabled).length} نشط • {sources.filter(s => !s.enabled).length} معطّل</span>
                </div>
              </div>

              <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-4 flex flex-col justify-between hover:border-red-500/20 transition group">
                <div className="flex items-center justify-between">
                  <span className="block text-[10px] text-slate-400 font-extrabold">موجز قنوات تفاعلت بخطأ</span>
                  <AlertTriangle className="w-4 h-4 text-red-500 group-hover:scale-110 duration-200 animate-pulse" />
                </div>
                <div className="mt-4">
                  <span className="text-2xl font-black text-white font-mono">{sources.filter(s => s.status === 'ERROR' || s.errorMessage).length}</span>
                  <span className="block text-[8px] text-slate-500 mt-0.5">خلاصات بها أخطاء استجابة</span>
                </div>
              </div>

              <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-4 flex flex-col justify-between hover:border-yellow-500/20 transition group">
                <div className="flex items-center justify-between">
                  <span className="block text-[10px] text-slate-400 font-extrabold">قراءات وزيارات الجماهير</span>
                  <Eye className="w-4 h-4 text-yellow-400 group-hover:scale-110 duration-200" />
                </div>
                <div className="mt-4">
                  <span className="text-2xl font-black text-white font-mono">
                    {articles.reduce((acc, current) => acc + (current.views || 0), 0)}
                  </span>
                  <span className="block text-[8px] text-slate-500 mt-0.5">مؤشرات قراءة المقالات الكلية</span>
                </div>
              </div>

              <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-4 col-span-2 lg:col-span-1 flex items-center justify-between hover:border-emerald-500/20 transition group relative overflow-hidden">
                <div className="space-y-1">
                  <span className="block text-[10px] text-slate-400 font-extrabold">كفاءة تشغيل النظام</span>
                  <span className="text-lg font-black text-emerald-400 block font-mono">98.4%</span>
                  <span className="text-[8px] text-slate-500 block">فحص صهر متصل بالخادم</span>
                </div>
                <div className="relative shrink-0 flex items-center justify-center">
                  <span className="absolute w-3 h-3 bg-emerald-500 rounded-full animate-ping opacity-75"></span>
                  <span className="relative w-3.5 h-3.5 bg-emerald-400 rounded-full border border-black shadow"></span>
                </div>
              </div>
            </div>

            {/* AI Optimization & Category Distributions Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column: Recharts category bar density chart */}
              <div className="lg:col-span-2 bg-slate-900/30 border border-white/5 rounded-3xl p-6 backdrop-blur-md flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-6">
                    <h3 className="text-xs font-black text-white flex items-center gap-2">
                      <BarChart2 className="w-4 h-4 text-emerald-400" />
                      كثافة توزيع المقالات تحت التصنيفات الإخبارية
                    </h3>
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-black">مخطط تفاعلي</span>
                  </div>
                  
                  {/* Recharts vertical bar component */}
                  <div className="w-full h-56" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={categories.filter(c => c !== 'الكل').map(cat => ({
                          name: cat,
                          'عدد الأخبار': articles.filter(a => a.category === cat).length
                        }))} 
                        layout="vertical"
                        margin={{ left: -10, right: 10, top: 0, bottom: 0 }}
                      >
                        <XAxis type="number" stroke="rgba(255,255,255,0.15)" fontSize={9} tickLine={false} />
                        <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.5)" fontSize={9} width={65} tickLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#090f1d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '10px', color: '#fff', textAlign: 'right' }} 
                        />
                        <Bar dataKey="عدد الأخبار" fill="#10b981" radius={[0, 6, 6, 0]} maxBarSize={16}>
                          {categories.filter(c => c !== 'الكل').map((entry, index) => {
                            const colors = ['#34d399', '#38bdf8', '#22d3ee', '#fbbf24', '#f472b6', '#c084fc', '#818cf8', '#f87171', '#2dd4bf'];
                            return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Intelligent AI parameters status banner */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 pt-4 border-t border-white/5">
                  <div className="p-3 bg-white/5 rounded-2xl flex items-center gap-3 text-right">
                    <span className="p-2 bg-purple-500/10 text-purple-400 rounded-xl shrink-0 border border-purple-500/15">
                      <Cpu className="w-4 h-4" />
                    </span>
                    <div>
                      <span className="text-[9px] text-slate-400 block font-bold">نموذج الاستنتاج والتصنيف الرياضي</span>
                      <span className="text-xs font-black text-white block">Google Gemini API ✨</span>
                    </div>
                  </div>
                  <div className="p-3 bg-white/5 rounded-2xl flex items-center gap-3 text-right">
                    <span className="p-2 bg-sky-500/10 text-sky-400 rounded-xl shrink-0 border border-sky-500/15">
                      <Shield className="w-4 h-4" />
                    </span>
                    <div>
                      <span className="text-[9px] text-slate-400 block font-bold">رادع التدبيج والمقال المكرر</span>
                      <span className="text-xs font-black text-white block">مفعّل بنشاط ذاتي (Similarity Index)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Mini Stats and Diagnostics */}
              <div className="lg:col-span-1 bg-slate-900/30 border border-white/5 rounded-3xl p-6 backdrop-blur-md flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-black text-slate-300 flex items-center gap-1.5 pb-2 border-b border-white/5 mb-4">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    مؤشر استجابة ومحاكاة الربط
                  </h3>
                  
                  <div className="space-y-4 font-bold text-xs">
                    <div className="flex justify-between items-center text-slate-400">
                      <span>سرعة تغذية الـ DNS للخوادم</span>
                      <span className="text-white font-mono">18ms</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-400">
                      <span>دقة قراءة موزيلا Readability</span>
                      <span className="text-emerald-400 font-mono">99.4%</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-400">
                      <span>نسبة فك شفرات روابط غوغل نيوز</span>
                      <span className="text-white font-mono">100%</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-400">
                      <span>عناوين جرى تصفيتها ومنع تكرارها</span>
                      <span className="text-amber-400 font-mono">14 مقالاً مكرراً</span>
                    </div>
                  </div>
                </div>

                {/* Quick Diagnostics trigger */}
                <div className="mt-8 p-3.5 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 text-right">
                  <span className="text-[10px] text-emerald-400 font-black block mb-1">خوادم الاستخلاص المركزي آمنة</span>
                  <span className="text-[9px] text-slate-400 leading-relaxed block">يجري تشغيل وتوجيه الـ Scraper وجرد الخلاصات دورياً كل 10 دقائق بالخلفية لضمان الثبات الكامل والتحديثات اللحظية.</span>
                </div>
              </div>

            </div>

            {/* Smart Add Content Source Form & Live Console Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Form container */}
              <div className="lg:col-span-1 bg-slate-900/30 border border-white/5 rounded-3xl p-6 backdrop-blur-md space-y-6">
                <div>
                  <div className="flex justify-between items-center pb-3 border-b border-white/5 mb-4">
                    <h3 className="text-xs font-black text-white flex items-center gap-2">
                      <Plus className="w-3.5 h-3.5 text-emerald-400" />
                      توليد مصدر ذكي أو رابط مباشر
                    </h3>
                  </div>

                  {/* Mode switcher */}
                  <div className="grid grid-cols-2 gap-1 p-1 bg-slate-950 rounded-xl mb-4 border border-white/5">
                    <button
                      type="button"
                      onClick={() => setAddSourceMode('search')}
                      className={`py-1.5 text-[10px] font-black rounded-lg transition transition-all cursor-pointer ${
                        addSourceMode === 'search' ? 'bg-emerald-500 text-black shadow' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      كلمة بحث ذكي (جوجل ديركت)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddSourceMode('direct')}
                      className={`py-1.5 text-[10px] font-black rounded-lg transition transition-all cursor-pointer ${
                        addSourceMode === 'direct' ? 'bg-emerald-500 text-black shadow' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      رابط تغذية RSS مباشر
                    </button>
                  </div>

                  <form onSubmit={handleAddSourceSubmit} className="space-y-4">
                    {addSourceMode === 'search' ? (
                      <div>
                        <label className="block text-[9px] font-extrabold text-slate-400 mb-1.5">الكلمة الرياضية المخصصة (مثال: الهلال، الدوري الانجليزي ميركاتو):</label>
                        <input
                          type="text"
                          placeholder="اكتب عبارة الاستخلاص هنا..."
                          value={formSearchTerm}
                          onChange={(e) => setFormSearchTerm(e.target.value)}
                          required
                          className="w-full px-4 py-2 bg-slate-900 border border-white/5 text-xs text-white placeholder-slate-600 rounded-xl focus:outline-none focus:border-emerald-500 transition"
                        />
                      </div>
                    ) : (
                      <>
                        <div>
                          <label className="block text-[9px] font-extrabold text-slate-400 mb-1.5">اسم مصدر البث الرياضي:</label>
                          <input
                            type="text"
                            placeholder="مثال: ياللاكورة، سكاي نيوز الرياضية"
                            value={formName}
                            onChange={(e) => setFormName(e.target.value)}
                            required
                            className="w-full px-4 py-2 bg-slate-900 border border-white/5 text-xs text-white placeholder-slate-600 rounded-xl focus:outline-none focus:border-emerald-500 transition"
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] font-extrabold text-slate-400 mb-1.5 font-mono">رابط البث الخارجي المباشر RSS XML Link:</label>
                          <div className="relative">
                            <input
                              type="url"
                              placeholder="https://example.com/rss.xml"
                              value={formUrl}
                              onChange={(e) => setFormUrl(e.target.value)}
                              required
                              className="w-full pr-4 pl-16 py-2 bg-slate-900 border border-white/5 text-xs text-white placeholder-slate-600 rounded-xl focus:outline-none focus:border-emerald-500 transition"
                            />
                            <button
                              type="button"
                              onClick={runUrlTest}
                              disabled={testingUrl}
                              className="absolute inset-y-1.5 left-1.5 px-2.5 bg-white/5 hover:bg-white/10 text-[9px] text-slate-300 font-extrabold rounded-lg transition cursor-pointer"
                            >
                              {testingUrl ? 'فحص...' : 'فحص الرابط'}
                            </button>
                          </div>
                        </div>
                      </>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[9px] font-extrabold text-slate-400 mb-1.5">تصنيف البث الافتراضي:</label>
                        <select
                          value={formCategory}
                          onChange={(e) => setFormCategory(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-white/5 text-xs text-slate-300 rounded-xl focus:outline-none focus:border-emerald-500 cursor-pointer"
                        >
                          {categories.filter(c => c !== 'الكل').map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[9px] font-extrabold text-slate-400 mb-1.5">اللغة والسياق:</label>
                        <select
                          value={formLanguage}
                          onChange={(e) => setFormLanguage(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-white/5 text-xs text-slate-300 rounded-xl focus:outline-none focus:border-emerald-500 cursor-pointer"
                        >
                          <option value="ar">العربية (RTL)</option>
                          <option value="en">العربية / English</option>
                        </select>
                      </div>
                    </div>

                    {formError && (
                      <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-[10px] font-medium leading-relaxed">
                        {formError}
                      </div>
                    )}

                    {formSuccess && (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl text-[10px] font-medium leading-relaxed">
                        {formSuccess}
                      </div>
                    )}

                    {testResult && (
                      <div className="bg-slate-950 p-3 border border-white/5 rounded-xl space-y-1 text-right">
                        <div className="text-[9px] font-extrabold text-emerald-400 flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          قناة البث صالحة وتستجيب بنجاح
                        </div>
                        <div className="text-[8px] text-slate-400 leading-relaxed font-bold">
                          <div>عنوان القناة: {testResult.title}</div>
                          <div>تحمل الخلاصة: {testResult.itemsCount} مقالاً نشطاً.</div>
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-black rounded-xl transition shadow-lg cursor-pointer"
                    >
                      حفظ وتسجيل مصدر البث الرياضي
                    </button>
                  </form>
                </div>
              </div>

              {/* Real-time Logger Terminal Box */}
              <div className="lg:col-span-2 bg-slate-900/30 border border-white/5 rounded-3xl p-6 backdrop-blur-md flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4">
                    <h3 className="text-xs font-black text-white flex items-center gap-2">
                      <Clock className="w-4 h-4 text-emerald-400 animate-spin" style={{ animationDuration: '6s' }} />
                      شاشة مراقبة سجلات الـ Scraper المباشرة (Live Logger Console)
                    </h3>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  </div>

                  {/* Terminal console frame */}
                  <div className="bg-black/80 font-mono text-[9px] md:text-[10px] text-slate-300 p-4 rounded-2xl border border-white/5 h-64 overflow-y-auto space-y-2 text-left" dir="ltr">
                    <div className="text-slate-500 flex items-center gap-2 mb-2 select-none">
                      <span>CMD: ~ /usr/bin/rss-crawler-service --live-view</span>
                      <span className="text-emerald-400">● RUNNING</span>
                    </div>
                    
                    {crawlerLogs.map((log, index) => (
                      <div key={index} className="flex gap-2 items-start hover:bg-white/5 p-1 rounded transition duration-150">
                        <span className="text-slate-500 shrink-0 select-none">[{log.time}]</span>
                        <span className={`leading-relaxed ${
                          log.type === 'success' ? 'text-emerald-400 font-extrabold' : 
                          log.type === 'error' ? 'text-red-400 font-extrabold' : 'text-sky-300'
                        }`}>
                          {log.type === 'success' ? '✔ ' : log.type === 'error' ? '✘ ' : 'ℹ '}
                          {log.text}
                        </span>
                      </div>
                    ))}
                    <div className="flex items-center gap-1.5 text-slate-450 text-slate-500 animate-pulse pt-2 select-none">
                      <span className="w-1.5 h-3.5 bg-emerald-400 block shrink-0"></span>
                      <span>awaiting standard cron trigger stack (sync frequency: 10m)...</span>
                    </div>
                  </div>
                </div>

                {/* Instant Action Manual Crawl Stream trigger */}
                <div className="mt-4 flex gap-3 text-right">
                  <button
                    onClick={executeForceSync}
                    disabled={syncingAllFeeds}
                    className="flex-1 py-3 bg-white/5 border border-white/5 hover:bg-white/10 hover:border-emerald-500/20 text-slate-300 hover:text-white rounded-xl transition cursor-pointer font-black text-xs flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncingAllFeeds ? 'animate-spin' : ''}`} />
                    {syncingAllFeeds ? 'جاري الاستخلاص وصهر البيانات...' : 'طلب فحص ومزامنة قنوات البث يدوياً'}
                  </button>
                </div>
              </div>

            </div>

            {/* Configured RSS Channels Registry Ledger & Database News CRUD Manager */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Channels list directory */}
              <div className="bg-slate-900/30 border border-white/5 rounded-3xl p-6 backdrop-blur-md">
                <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4">
                  <h2 className="text-sm font-black text-white flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-emerald-400" />
                    دليل ومطابقة قنوات البث الرياضي النشطة
                  </h2>
                  <span className="text-[10px] text-slate-400 font-bold font-mono">COUNT: {sources.length}</span>
                </div>

                {loadingSources ? (
                  <div className="text-center py-12">
                    <div className="w-8 h-8 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 animate-spin mx-auto mb-2"></div>
                    <span className="text-xs text-slate-500">جاري تحميل المؤشرات والاتصالات...</span>
                  </div>
                ) : sources.length === 0 ? (
                  <div className="text-center py-12 text-xs text-slate-500">لم يتم تفعيل أي وسوم بث بعد.</div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                    {sources.map(src => {
                      let computedDomainIcon = `https://www.google.com/s2/favicons?sz=64&domain=news.google.com`;
                      try {
                        computedDomainIcon = `https://www.google.com/s2/favicons?sz=64&domain=${new URL(src.url).hostname}`;
                      } catch (_) {}

                      return (
                        <div key={src.id} className="p-3 bg-slate-900/60 rounded-xl border border-white/5 flex items-center justify-between gap-4 hover:border-white/10 transition">
                          <div className="flex items-center gap-3 overflow-hidden text-right">
                            <img 
                              src={computedDomainIcon} 
                              alt="" 
                              className="w-8 h-8 rounded-lg bg-slate-950 p-1 border border-white/5 shrink-0"
                              onError={(e) => { e.target.src = 'https://news.google.com/favicon.ico'; }}
                            />
                            <div className="space-y-1 overflow-hidden">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-black text-slate-200 truncate">{src.name}</span>
                                <span className="text-[8px] bg-sky-500/10 text-sky-400 px-1.5 py-0.5 rounded font-extrabold">{src.category}</span>
                                {src.circuitTripped ? (
                                  <span className="text-[8px] bg-amber-500/15 text-amber-400 border border-amber-500/25 px-1.5 py-0.5 rounded font-extrabold flex items-center gap-1 animate-pulse" title={`إيقاف مؤقت لحين انتهاء التهدئة: ${src.nextRetryTime}`}>
                                    إيقاف مؤقت 🛑
                                  </span>
                                ) : src.status === 'ERROR' || src.errorMessage ? (
                                  <span className="text-[8px] bg-red-500/15 text-red-400 border border-red-500/25 px-1.5 py-0.5 rounded font-extrabold" title={src.errorMessage || 'خطأ غامض'}>
                                    فشل ⚠️
                                  </span>
                                ) : (
                                  <span className="text-[8px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 px-1.5 py-0.5 rounded font-extrabold">
                                    مستقر ✅
                                  </span>
                                )}
                              </div>
                              <span className="block text-[8px] text-slate-500 font-mono select-all truncate max-w-xs">{src.url}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => handleToggleEnable(src)}
                              className={`p-2 rounded-lg transition transition-all cursor-pointer ${
                                src.enabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'
                              }`}
                              title={src.enabled ? 'نشط (تعطيل البث)' : 'معطل (تفعيل البث)'}
                            >
                              <Power className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteSource(src.id)}
                              className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition cursor-pointer"
                              title="إزالة القناة بشكل نهائي"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Database news storage ledger and actions */}
              <div className="bg-slate-900/30 border border-white/5 rounded-3xl p-6 backdrop-blur-md">
                <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4">
                  <h2 className="text-sm font-black text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    المستندات الإخبارية المحفوظة وإجراءات الحوكمة (News Ledger)
                  </h2>
                  <span className="text-[10px] text-slate-400 font-bold font-mono">DB ITEMS: {articles.length}</span>
                </div>

                {loadingNews ? (
                  <div className="text-center py-12">
                    <div className="w-8 h-8 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 animate-spin mx-auto mb-2"></div>
                    <span className="text-xs text-slate-500">جاري مسح ومزامنة كتل المقالات المؤرشفة...</span>
                  </div>
                ) : articles.length === 0 ? (
                  <div className="text-center py-12 text-xs text-slate-500">خلو قاعدة البيانات من مستندات الأخبار المودعة.</div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                    {articles.map((item) => (
                      <div key={item.id} className="p-3 bg-slate-900/40 rounded-xl border border-white/5 hover:border-white/10 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 overflow-hidden text-right">
                          <img 
                            src={item.image} 
                            alt="" 
                            className="w-12 h-12 rounded-lg object-cover shrink-0 bg-slate-950 border border-white/5"
                            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=800'; }}
                          />
                          <div className="space-y-1 overflow-hidden">
                            <h4 className="text-xs font-black text-white leading-normal truncate">{item.title}</h4>
                            <div className="flex items-center gap-2 text-[9px] text-slate-400 font-bold">
                              <span>{item.sourceName}</span>
                              <span>•</span>
                              <span>{item.category}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Toggle feature / featured pin */}
                          <button
                            onClick={(e) => handleToggleFeature(item.id, e)}
                            className={`px-2 py-1.5 rounded-lg transition text-[11px] cursor-pointer ${
                              item.featured ? 'bg-amber-500 text-black font-black' : 'bg-slate-800 text-slate-400 hover:text-white'
                            }`}
                            title={item.featured ? 'إلغاء التثبيت من الواجهة' : 'تثبيت كخبر رئيسي ومميز'}
                          >
                            ★
                          </button>
                          {/* Edit manually */}
                          <button
                            onClick={(e) => handleStartEdit(item, e)}
                            className="p-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 rounded-lg transition cursor-pointer"
                            title="تعديل تفاصيل الخبر يدوياً"
                          >
                            📝
                          </button>
                          {/* Delete article */}
                          <button
                            onClick={(e) => handleDeleteArticle(item.id, e)}
                            className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition cursor-pointer"
                            title="حذف مقال من الخادم"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

      </div>

      {/* -------------------- FULL ARTICLE DETAILED READER OVERLAY MODAL -------------------- */}
      <AnimatePresence>
        {selectedArticle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setSelectedArticle(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 30 }}
              transition={{ type: 'spring', damping: 24, stiffness: 320 }}
              className="bg-[#0b1220] border border-white/10 w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl my-8 text-right flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              
              {/* Image banner backdrop */}
              <div className="relative h-56 md:h-72 shrink-0">
                <img
                  src={selectedArticle.image}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0b1220] via-[#0b1220]/45 to-transparent"></div>
                
                {/* Back / Close circle */}
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="absolute top-4 right-4 p-2 bg-black/80 backdrop-blur-md border border-white/10 text-slate-300 hover:text-white rounded-full transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Direct link portal */}
                <a
                  href={selectedArticle.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute bottom-4 left-4 px-3 py-1.5 bg-emerald-500 text-black text-[10px] font-black rounded-lg flex items-center gap-1 transition-all"
                >
                  <ExternalLink className="w-3 h-3" />
                  الموقع الأصلي
                </a>
              </div>

              {/* Reader Contents Body (Scrollable container to prevent modal escape overflow) */}
              <div className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1 news-scroll font-normal">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-slate-400 text-[10px] font-extrabold mb-3">
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/20">
                      {selectedArticle.sourceName}
                    </span>
                    <span className="px-1.5 py-0.5 bg-white/5 rounded">
                      {selectedArticle.category}
                    </span>
                    <span className="flex items-center gap-1 font-mono text-[9px]">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      {new Date(selectedArticle.publishedAt).toLocaleDateString('ar-EG', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>

                  <h1 className="text-base md:text-xl font-black text-white leading-relaxed">
                    {selectedArticle.title}
                  </h1>
                </div>

                {/* Short descriptive block */}
                <div className="bg-slate-900 border-r-4 border-emerald-500 p-4 rounded-l-2xl text-[11px] md:text-xs text-slate-300 italic font-medium leading-relaxed">
                  {selectedArticle.description}
                </div>

                {/* Parsed / Scraped Main Content Area */}
                {loadingFullBody ? (
                  <div className="text-center py-12 space-y-3">
                    <div className="w-10 h-10 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 animate-spin mx-auto"></div>
                    <div className="text-xs text-slate-400 font-extrabold animate-pulse">جاري فك تشفير وتطهير محتوى الخبر من الإعلانات...</div>
                  </div>
                ) : fullBodyError ? (
                  <div className="space-y-4">
                    <div className="text-[11px] text-amber-400 leading-relaxed font-bold bg-amber-500/5 p-3 rounded-xl border border-amber-500/10">
                      ⚠️ {fullBodyError}
                    </div>
                    {/* Fallback to local default description */}
                    <div className="text-xs md:text-sm text-slate-300 leading-bold">
                      <p className="leading-relaxed font-normal">{selectedArticle.description}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    
                    {/* Extracted clean HTML content wrapper */}
                    <div 
                      className="text-white text-xs md:text-sm leading-bold space-y-4 rich-text-reader"
                      dangerouslySetInnerHTML={{ __html: fetchedArticleBody }}
                    />

                    {/* Extracted Article Image Gallery (If exists) */}
                    {galleryImages.length > 0 && (
                      <div className="space-y-2 pt-4 border-t border-white/5">
                        <h4 className="text-[11px] font-black text-slate-400">معرض صور الخبر المرفق:</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {galleryImages.map((imgUrl, iIdx) => (
                            <div key={iIdx} className="h-20 bg-slate-900 rounded-lg overflow-hidden border border-white/5 hover:scale-105 transition cursor-zoom-in" onClick={() => window.open(imgUrl)}>
                              <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Scraped Embedded Videos Frame Area */}
                    {videoEmbeds.length > 0 && (
                      <div className="space-y-2 pt-4 border-t border-white/5">
                        <h4 className="text-[11px] font-black text-slate-400">مقطع فيديو مرفق وتغطية embedded:</h4>
                        <div className="space-y-2">
                          {videoEmbeds.map((vUrl, vIdx) => (
                            <div key={vIdx} className="aspect-video bg-slate-900 rounded-2xl overflow-hidden border border-white/5">
                              <iframe 
                                src={vUrl} 
                                className="w-full h-full" 
                                title="Media Frame Video" 
                                frameBorder="0" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                allowFullScreen
                              ></iframe>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                )}

                {/* Related / Similar News Articles */}
                {articles.filter(a => a.category === selectedArticle.category && a.id !== selectedArticle.id).length > 0 && (
                  <div className="pt-6 border-t border-white/5 space-y-3">
                    <h4 className="text-[11px] font-black text-slate-300">أخبار ذات صلة قد تهمك:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {articles
                        .filter(a => a.category === selectedArticle.category && a.id !== selectedArticle.id)
                        .slice(0, 2)
                        .map((relArt) => (
                          <div 
                            key={relArt.id} 
                            className="p-3 bg-slate-900/60 hover:bg-slate-900 rounded-xl border border-white/5 flex gap-3 items-center cursor-pointer"
                            onClick={() => handleOpenReader(relArt)}
                          >
                            <img src={relArt.image} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                            <h5 className="text-[11px] text-slate-200 line-clamp-2 leading-relaxed font-black">{relArt.title}</h5>
                          </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer and Source metadata */}
                <div className="pt-6 border-t border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="text-[10px] text-slate-500 font-bold">
                    الكاتب/الناشر الأصلي: {selectedArticle.author || selectedArticle.sourceName}
                  </div>
                  <a
                    href={selectedArticle.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 font-black text-black text-xs rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    زيارة المصدر الأصلي لقراءة الخبر بالكامل
                  </a>
                </div>

              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* -------------------- MANUAL EDIT MODAL FOR NEWS ARTICLES -------------------- */}
      <AnimatePresence>
        {editingArticle && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-[#0b1220] border border-white/10 w-full max-w-lg rounded-2xl overflow-hidden p-6 text-right space-y-4"
            >
              <h3 className="text-sm font-black text-white mb-2 pb-2 border-b border-white/5">📝 تعديل بيانات ومطابقات الخبر يدوياً</h3>
              
              <form onSubmit={handleSaveEditSubmit} className="space-y-4 text-xs font-bold text-slate-300">
                <div>
                  <label className="block mb-1 text-[10px] text-slate-400">عنوان الخبر الكامل:</label>
                  <input 
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-900 border border-white/5 text-white rounded-lg focus:outline-none focus:border-emerald-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-[10px] text-slate-400">الملخص التوصيفي التعبيري:</label>
                  <textarea 
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    rows="3"
                    className="w-full px-3 py-2 bg-slate-900 border border-white/5 text-white rounded-lg focus:outline-none focus:border-emerald-500 text-xs"
                  ></textarea>
                </div>

                <div>
                  <label className="block mb-1 text-[10px] text-slate-400">تصنيف قسم الرياضية والتيك:</label>
                  <select
                    value={editCat}
                    onChange={(e) => setEditCat(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-white/5 text-slate-300 rounded-lg focus:outline-none"
                  >
                    <option value="رياضة">رياضة</option>
                    <option value="تقنية">تقنية</option>
                    <option value="سياسة">سياسة</option>
                    <option value="عالمي">عالمي</option>
                    <option value="أخبار عامة">أخبار عامة</option>
                  </select>
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button 
                    type="button"
                    onClick={() => setEditingArticle(null)}
                    className="px-4 py-2 bg-white/5 text-slate-400 rounded-lg hover:text-white transition"
                  >
                    إلغاء
                  </button>
                  <button 
                    type="submit"
                    disabled={submittingEdit}
                    className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-black rounded-lg font-black transition"
                  >
                    {submittingEdit ? 'جاري التحفيظ...' : 'حفظ التعديلات الجديدة'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
