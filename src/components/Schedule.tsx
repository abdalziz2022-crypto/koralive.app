import React, { useState, useMemo, useEffect } from 'react';
import { useMatches } from '../context/MatchContext';
import { 
  CalendarDays, 
  Search, 
  Trophy, 
  Tv, 
  RotateCw, 
  AlertTriangle, 
  ChevronLeft, 
  Radio, 
  Flame, 
  Compass, 
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Match } from '../types';
import MatchCard from './MatchCard';
import AdBanner from './AdBanner';

type TabType = 'LIVE' | 'TODAY' | 'UPCOMING' | 'FINISHED';

export default function Schedule() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { matches, leagues, loading, activeProvider, changeProvider } = useMatches();

  // Active Tab determined by URL Search Param or fallback to TODAY
  const activeTab = (searchParams.get('tab') as TabType) || 'TODAY';

  // Filters state
  const [selectedLeague, setSelectedLeague] = useState<string>('ALL');
  const [selectedDate, setSelectedDate] = useState<string>(''); // For custom date select
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Synchronize Tab change into URL search parameter
  const handleTabChange = (tab: TabType) => {
    setSearchParams({ tab });
  };

  const formattedStartTime = (timeString: string) => {
    if (!timeString) return '';
    try {
      return new Date(timeString).toLocaleTimeString('ar-SA', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (_) {
      return '';
    }
  };

  // Filter & categorization engine based on activeTab and filters
  const processedMatches = useMemo(() => {
    let result = Array.isArray(matches) ? [...matches] : [];

    // Status / Tab categorization
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (activeTab === 'LIVE') {
      result = result.filter(m => m.status === 'LIVE' || m.isLive);
    } else if (activeTab === 'TODAY') {
      result = result.filter(m => {
        const mDate = m.startTime || m.utcDate;
        if (!mDate) return false;
        return mDate.startsWith(todayStr);
      });
    } else if (activeTab === 'UPCOMING') {
      result = result.filter(m => {
        if (m.status === 'LIVE' || m.status === 'FINISHED') return false;
        const mDate = m.startTime || m.utcDate;
        if (!mDate) return true;
        return new Date(mDate).getTime() > now.getTime();
      });
    } else if (activeTab === 'FINISHED') {
      result = result.filter(m => m.status === 'FINISHED');
    }

    // League filter
    if (selectedLeague !== 'ALL') {
      result = result.filter(m => {
        const leagueName = typeof m.league === 'object' ? m.league?.name : m.league;
        return leagueName === selectedLeague;
      });
    }

    // Custom selected date filter
    if (selectedDate) {
      result = result.filter(m => {
        const mDate = m.startTime || m.utcDate;
        return mDate && mDate.startsWith(selectedDate);
      });
    }

    // Optional lightweight Search Query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(m => {
        const hName = typeof m.homeTeam === 'object' ? m.homeTeam?.name : m.homeTeam;
        const aName = typeof m.awayTeam === 'object' ? m.awayTeam?.name : m.awayTeam;
        const lName = typeof m.league === 'object' ? m.league?.name : m.league;
        return (
          hName?.toLowerCase().includes(q) ||
          aName?.toLowerCase().includes(q) ||
          lName?.toLowerCase().includes(q)
        );
      });
    }

    return result;
  }, [matches, activeTab, selectedLeague, selectedDate, searchQuery]);

  // Handle retry / refresh action
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Simulate real-time API polling refresh triggers
      await new Promise(resolve => setTimeout(resolve, 800));
    } catch (e) {
      console.error(e);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div 
      className="max-w-5xl mx-auto px-4 pt-20 md:pt-28 pb-12 space-y-6 font-sans select-none"
      style={{ direction: 'rtl' }}
    >
      {/* 1. COMPACT PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <CalendarDays size={20} className="text-primary" />
            <span>جدول مباريات اليوم مباشر</span>
          </h1>
          <p className="text-[10px] text-gray-500 font-bold mt-1">
            تابع مواعيد اللقاءات، استوديو البث، والنتائج لحظة بلحظة بنطاق متعدد
          </p>
        </div>

        {/* Real-time sync tracker */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <div className="flex flex-col items-end">
            <span className="text-[9px] text-[#00df82] font-black tracking-wider uppercase flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-[#00df82] rounded-full inline-block animate-pulse"></span>
              محدث لـ {activeProvider}
            </span>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`p-2.5 rounded-xl border border-white/5 bg-[#0b1424] hover:border-primary/20 transition-all cursor-pointer ${isRefreshing ? 'opacity-50' : ''}`}
            title="تحديث البيانات"
          >
            <RotateCw size={14} className={`text-primary ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. TAB CONTROLLER: LIVE, TODAY, UPCOMING, FINISHED */}
      <div className="bg-[#0b1424] p-1.5 rounded-2xl border border-white/5 flex items-center">
        {(['TODAY', 'LIVE', 'UPCOMING', 'FINISHED'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`flex-1 text-center py-3 rounded-xl text-xs font-black tracking-wide transition-all duration-300 relative cursor-pointer ${
              activeTab === tab 
                ? 'text-[#060b13] bg-primary shadow-lg font-black' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab === 'TODAY' && 'مباريات اليوم'}
            {tab === 'LIVE' && (
              <span className="flex items-center justify-center gap-1">
                <span>مباشر الآن</span>
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
              </span>
            )}
            {tab === 'UPCOMING' && 'القادمة'}
            {tab === 'FINISHED' && 'المنتهية'}
          </button>
        ))}
      </div>

      {/* 3. LIGHTWEIGHT FILTERS PANEL */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* League Selector */}
        <div className="relative">
          <Trophy size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <select
            value={selectedLeague}
            onChange={(e) => setSelectedLeague(e.target.value)}
            className="w-full text-right bg-[#0b1424] border border-white/5 p-3 pr-10 pl-3 rounded-xl text-xs font-bold text-gray-200 outline-none focus:border-primary transition-all cursor-pointer appearance-none"
          >
            <option value="ALL">جميع البطولات الكبرى</option>
            {leagues.map(l => (
              <option key={l.id || l.name} value={l.name}>{l.name}</option>
            ))}
          </select>
        </div>

        {/* Date Selector input */}
        <div className="relative">
          <CalendarDays size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full text-right bg-[#0b1424] border border-white/5 p-3 pr-10 pl-3 rounded-xl text-xs font-bold text-gray-200 outline-none focus:border-primary transition-all cursor-text appearance-none"
          />
          {selectedDate && (
            <button
              onClick={() => setSelectedDate('')}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[9px] font-black text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded cursor-pointer"
            >
              مسح
            </button>
          )}
        </div>

        {/* Team / Search Filter */}
        <div className="relative">
          <Search size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="ابحث باسم الفريق، البطولة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-right bg-[#0b1424] border border-white/5 p-3 pr-10 pl-3 rounded-xl text-xs font-bold text-gray-200 outline-none focus:border-primary transition-all"
          />
        </div>
      </div>

      {/* LIGHT NATIVE AD SLATE BETWEEN FILTERS & MATCHES */}
      <div className="w-full">
        <AdBanner slot="Schedule_Top" />
      </div>

      {/* 4. MATCH LISTINGS WITH HIGH PERFORMANCE */}
      <div className="space-y-4 pt-2">
        {loading ? (
          // Visual-first Skeletons
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div 
                key={i} 
                className="h-28 bg-[#0b1424]/40 rounded-2xl border border-white/5 flex items-center justify-between p-4 animate-pulse"
              >
                <div className="flex items-center gap-3 w-1/3">
                  <div className="w-10 h-10 rounded-full bg-white/5" />
                  <div className="h-3 w-16 bg-white/5 rounded" />
                </div>
                <div className="flex flex-col items-center gap-2 w-1/4">
                  <div className="h-4 w-12 bg-white/5 rounded" />
                  <div className="h-2.5 w-6 bg-white/5 rounded" />
                </div>
                <div className="flex items-center gap-3 w-1/3 justify-end">
                  <div className="h-3 w-16 bg-white/5 rounded text-left" />
                  <div className="w-10 h-10 rounded-full bg-white/5" />
                </div>
              </div>
            ))}
          </div>
        ) : processedMatches.length > 0 ? (
          <div className="space-y-3">
            {processedMatches.map(match => (
              <div key={match.id} className="relative">
                <MatchCard match={match} />
              </div>
            ))}
          </div>
        ) : (
          // Smart Empty States with Actions
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[24px] border border-white/5 bg-[#0c1322] p-8 text-center space-y-4 max-w-md mx-auto my-6"
          >
            <AlertTriangle className="text-amber-500 w-10 h-10 mx-auto animate-bounce" />
            <div className="space-y-1">
              <h3 className="text-sm font-black text-white">لا توجد مباريات حالياً</h3>
              <p className="text-[11px] text-gray-400 font-bold leading-relaxed">
                لم نجد أي مباريات جارية أو مجدولة تتوافق مع التصفية الحالية. تفقد هذه الاقتراحات السريعة:
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => navigate('/news')}
                className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 text-[10px] font-black text-gray-200 flex flex-col items-center gap-1.5 cursor-pointer"
              >
                <Sparkles size={14} className="text-primary animate-pulse" />
                <span>تصفح الأخبار الرياضية</span>
              </button>
              <button
                onClick={() => navigate('/leagues')}
                className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 text-[10px] font-black text-gray-200 flex flex-col items-center gap-1.5 cursor-pointer"
              >
                <Trophy size={14} className="text-primary" />
                <span>شاهد ترتيب البطولات</span>
              </button>
            </div>

            <button
              onClick={() => {
                setSelectedLeague('ALL');
                setSelectedDate('');
                setSearchQuery('');
                setSearchParams({ tab: 'TODAY' });
              }}
              className="w-full py-2 bg-primary text-[#060b13] hover:bg-primary/95 font-black text-xs rounded-xl cursor-pointer"
            >
              إعادة تهيئة الفلاتر وعرض مباريات اليوم
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
