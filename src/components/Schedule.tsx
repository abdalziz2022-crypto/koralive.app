import React, { useState, useMemo, useEffect } from 'react';
import { useMatches } from '../context/MatchContext';
import { Calendar, Filter, SortAsc, SortDesc, Trophy, Search, Clock, RotateCw, Power, CalendarPlus, Users, Tv, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { Match } from '../types';
import { downloadICS } from '../lib/calendar';

type DateFilter = 'ALL' | 'TODAY' | 'TOMORROW' | 'WEEKEND' | 'CUSTOM' | 'RANGE';
type StatusFilter = 'ALL' | 'LIVE' | 'UPCOMING' | 'FINISHED';
type SortBy = 'TIME' | 'LEAGUE';

import AdBanner from './AdBanner';
import MatchQuickViewCard from './MatchQuickViewCard';
import ShareButton from './ShareButton';

export default function Schedule() {
  const { matches, leagues, loading } = useMatches();
  const [dateFilter, setDateFilter] = useState<DateFilter>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [customDate, setCustomDate] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('00:00');
  const [endTime, setEndTime] = useState<string>('23:59');
  const [selectedLeague, setSelectedLeague] = useState<string>('ALL');
  const [selectedChannel, setSelectedChannel] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<SortBy>('TIME');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const [searchQuery, setSearchQuery] = useState('');
  const [teamQuery, setTeamQuery] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const channels = useMemo(() => {
    const set = new Set<string>();
    matches.forEach(m => {
      if (m.channel && m.channel.trim()) {
        set.add(m.channel.trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'ar'));
  }, [matches]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/matches/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error(`API response status was ${response.status}`);
      }
    } catch (e) {
      console.error("Error refreshing match database:", e);
    } finally {
      setLastUpdated(new Date());
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      handleManualRefresh();
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const filteredMatches = useMemo(() => {
    let result = [...matches];

    // Date Filtering
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const tomorrow = today + 86400000;
    const dayAfterTomorrow = tomorrow + 86400000;

    if (dateFilter === 'TODAY') {
      result = result.filter(m => {
        const d = new Date(m.startTime).getTime();
        return d >= today && d < tomorrow;
      });
    } else if (dateFilter === 'TOMORROW') {
      result = result.filter(m => {
        const d = new Date(m.startTime).getTime();
        return d >= tomorrow && d < dayAfterTomorrow;
      });
    } else if (dateFilter === 'WEEKEND') {
      // Find matches on Friday, Saturday, and Sunday (matchdays weekend)
      result = result.filter(m => {
        const d = new Date(m.startTime);
        const day = d.getDay(); // 0 is Sunday, 5 is Friday, 6 is Saturday
        return day === 5 || day === 6 || day === 0;
      });
    } else if (dateFilter === 'CUSTOM' && customDate) {
      const selected = new Date(customDate).toDateString();
      result = result.filter(m => new Date(m.startTime).toDateString() === selected);
    } else if (dateFilter === 'RANGE' && (startDate || endDate)) {
      const start = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : null;
      const end = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : null;
      result = result.filter(m => {
        const d = new Date(m.startTime).getTime();
        if (start !== null && end !== null) {
          return d >= start && d <= end;
        } else if (start !== null) {
          return d >= start;
        } else if (end !== null) {
          return d <= end;
        }
        return true;
      });
    }

    // Status Filtering
    if (statusFilter !== 'ALL') {
      result = result.filter(m => m.status === statusFilter);
    }

    // Time Range Filtering
    if (startTime !== '00:00' || endTime !== '23:59') {
      result = result.filter(m => {
        const matchTime = new Date(m.startTime);
        const timeStr = `${matchTime.getHours().toString().padStart(2, '0')}:${matchTime.getMinutes().toString().padStart(2, '0')}`;
        return timeStr >= startTime && timeStr <= endTime;
      });
    }

    // League Filtering
    if (selectedLeague !== 'ALL') {
      result = result.filter(m => m.league === selectedLeague);
    }

    // Channel Filtering
    if (selectedChannel !== 'ALL') {
      result = result.filter(m => m.channel === selectedChannel);
    }

    // Team Filtering
    if (teamQuery) {
      const q = teamQuery.toLowerCase();
      result = result.filter(m => 
        m.homeTeam.toLowerCase().includes(q) || 
        m.awayTeam.toLowerCase().includes(q)
      );
    }

    // Search Filtering
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(m => 
        m.homeTeam.toLowerCase().includes(q) || 
        m.awayTeam.toLowerCase().includes(q) ||
        m.league.toLowerCase().includes(q) ||
        (m.channel && m.channel.toLowerCase().includes(q))
      );
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'TIME') {
        const timeA = new Date(a.startTime).getTime();
        const timeB = new Date(b.startTime).getTime();
        return sortOrder === 'ASC' ? timeA - timeB : timeB - timeA;
      } else {
        return sortOrder === 'ASC' 
          ? a.league.localeCompare(b.league) 
          : b.league.localeCompare(a.league);
      }
    });

    return result;
  }, [matches, dateFilter, customDate, startDate, endDate, statusFilter, startTime, endTime, selectedLeague, selectedChannel, sortBy, sortOrder, searchQuery, teamQuery]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 pt-24 md:pt-32 pb-8 space-y-8">
      {/* Header & Search */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <h1 className="text-3xl font-black italic flex items-center gap-3">
            <Calendar className="text-primary" /> جدول <span className="text-primary text-4xl">المباريات</span>
          </h1>

          <div className="flex items-center gap-2">
            <div className="flex flex-col items-end">
               <div className="flex items-center gap-2">
                 <span className={`text-[10px] font-black uppercase tracking-tighter ${autoRefresh ? 'text-primary' : 'text-gray-500'}`}>
                   {autoRefresh ? 'تحديث تلقائي مفعل' : 'تحديث تلقائي معطل'}
                 </span>
                 <button 
                   onClick={() => setAutoRefresh(!autoRefresh)}
                   className={`relative w-10 h-5 rounded-full transition-colors ${autoRefresh ? 'bg-primary' : 'bg-surface border border-border'}`}
                 >
                   <motion.div 
                     animate={{ x: autoRefresh ? 20 : 0 }}
                     className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full ${autoRefresh ? 'bg-black' : 'bg-gray-500'}`}
                   />
                 </button>
               </div>
               <span className="text-[9px] text-gray-600 font-bold">آخر تحديث: {lastUpdated.toLocaleTimeString('ar-EG')}</span>
            </div>

            <button 
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className={`p-4 rounded-2xl border transition-all ${isRefreshing ? 'bg-surface border-primary' : 'bg-surface border-border hover:neon-border'}`}
            >
              <RotateCw size={18} className={`text-primary ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>

            <button 
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`p-4 rounded-2xl border transition-all ${showAdvancedFilters ? 'bg-primary text-black border-primary' : 'bg-surface border-border text-primary hover:neon-border'}`}
            >
              <Filter size={18} />
            </button>

            {/* Schedule page share button */}
            <ShareButton variant="icon" align="left" text="تصفح جدول ونتائج ومواعيد مباريات كرة القدم اليوم مباشر على كورة 90!" />
          </div>
        </div>
      </div>

      <AdBanner slot="Schedule_Top" />
      <AnimatePresence>
        {showAdvancedFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="glass p-6 rounded-3xl border border-white/5 space-y-6">
              {/* Filter Rows */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Status Selection */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-1.5">
                    <Trophy size={12} className="text-primary" /> حالة المباراة
                  </label>
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                    className="w-full bg-black/40 border border-white/5 p-3 rounded-xl font-bold focus:neon-border outline-none transition-all"
                  >
                    <option value="ALL">كل الحالات</option>
                    <option value="LIVE">مباشر الآن</option>
                    <option value="UPCOMING">المباريات القادمة</option>
                    <option value="FINISHED">المباريات المنتهية</option>
                  </select>
                </div>

                {/* League Selection Dropdown */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-1.5">
                    <Trophy size={12} className="text-primary" /> البطولة
                  </label>
                  <select 
                    value={selectedLeague}
                    onChange={(e) => setSelectedLeague(e.target.value)}
                    className="w-full bg-black/40 border border-white/5 p-3 rounded-xl font-bold focus:neon-border outline-none transition-all"
                  >
                    <option value="ALL">كل البطولات</option>
                    {leagues.map(l => (
                      <option key={l.id} value={l.name}>{l.name}</option>
                    ))}
                  </select>
                </div>

                {/* Channel Selection */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-1.5">
                    <Tv size={12} className="text-primary" /> القناة الناقلة (Channel)
                  </label>
                  <select 
                    value={selectedChannel}
                    onChange={(e) => setSelectedChannel(e.target.value)}
                    className="w-full bg-black/40 border border-white/5 p-3 rounded-xl font-bold focus:neon-border outline-none transition-all"
                  >
                    <option value="ALL">كل القنوات</option>
                    {channels.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Team Search specifically */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-1.5">
                    <Users size={12} className="text-primary" /> ابحث عن فريق (Team)
                  </label>
                  <div className="relative">
                    <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input 
                      type="text"
                      placeholder="اسم الفريق..."
                      value={teamQuery}
                      onChange={(e) => setTeamQuery(e.target.value)}
                      className="w-full bg-black/40 border border-white/5 p-3 pl-10 rounded-xl font-bold focus:neon-border outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Custom Date */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-1.5">
                    <Calendar size={12} className="text-primary" /> حدد يوم معين
                  </label>
                  <input 
                    type="date"
                    value={customDate}
                    onChange={(e) => {
                      setCustomDate(e.target.value);
                      if (e.target.value) setDateFilter('CUSTOM');
                    }}
                    className="w-full bg-black/40 border border-white/5 p-3 rounded-xl font-bold focus:neon-border outline-none transition-all"
                  />
                </div>
                {/* Custom Date Ranges */}
                <div className="md:col-span-2 space-y-3 pt-2 border-t border-white/5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                    <Calendar size={12} /> تصفية بنطاق تاريخ
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 space-y-1">
                      <span className="text-[9px] text-gray-500 block">من تاريخ</span>
                      <input 
                        type="date"
                        value={startDate}
                        onChange={(e) => {
                          setStartDate(e.target.value);
                          if (e.target.value && endDate) setDateFilter('RANGE');
                        }}
                        className="w-full bg-black/40 border border-white/5 p-3 rounded-xl font-bold focus:neon-border outline-none transition-all"
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <span className="text-[9px] text-gray-500 block">إلى تاريخ</span>
                      <input 
                        type="date"
                        value={endDate}
                        onChange={(e) => {
                          setEndDate(e.target.value);
                          if (startDate && e.target.value) setDateFilter('RANGE');
                        }}
                        className="w-full bg-black/40 border border-white/5 p-3 rounded-xl font-bold focus:neon-border outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Time Range */}
              <div className="space-y-3 pt-2 border-t border-white/5">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                  <Clock size={12} /> النطاق الزمني للمباريات
                </label>
                <div className="flex items-center gap-4">
                  <div className="flex-1 space-y-1">
                    <span className="text-[9px] text-gray-500 block">من</span>
                    <input 
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full bg-black/40 border border-white/5 p-3 rounded-xl font-bold focus:neon-border outline-none transition-all"
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <span className="text-[9px] text-gray-500 block">إلى</span>
                    <input 
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full bg-black/40 border border-white/5 p-3 rounded-xl font-bold focus:neon-border outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Sorting Options in Advanced Panel */}
              <div className="space-y-3 pt-2 border-t border-white/5">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">ترتيب النتائج</label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex bg-black/40 rounded-xl p-1 border border-white/5">
                    <button
                      onClick={() => setSortBy('TIME')}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${sortBy === 'TIME' ? 'bg-primary text-black' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                      حسب الوقت
                    </button>
                    <button
                      onClick={() => setSortBy('LEAGUE')}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${sortBy === 'LEAGUE' ? 'bg-primary text-black' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                      حسب البطولة
                    </button>
                  </div>
                  <button
                    onClick={() => setSortOrder(prev => prev === 'ASC' ? 'DESC' : 'ASC')}
                    className="flex items-center justify-center gap-3 bg-black/40 border border-white/5 rounded-xl p-3 font-bold text-xs hover:border-primary transition-all"
                  >
                    {sortOrder === 'ASC' ? <><SortAsc size={16} /> تصاعدي</> : <><SortDesc size={16} /> تنازلي</>}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters & Sorting */}
      <div className="space-y-3 mb-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Date Filter Chips & Date Picker */}
          <div className="flex-1 flex gap-2 p-1 bg-surface rounded-xl border border-border overflow-x-auto whitespace-nowrap hide-scrollbar items-center">
            {(['ALL', 'TODAY', 'TOMORROW', 'WEEKEND', 'RANGE'] as const).map(dt => (
              <button
                key={dt}
                onClick={() => { 
                  setDateFilter(dt); 
                  if (dt !== 'RANGE') {
                    setCustomDate('');
                  }
                }}
                className={`px-5 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  dateFilter === dt ? 'bg-primary text-black shadow-lg scale-105' : 'hover:bg-white/5 text-gray-400'
                }`}
              >
                {dt === 'ALL' ? 'الكل' : dt === 'TODAY' ? 'اليوم' : dt === 'TOMORROW' ? 'غداً' : dt === 'WEEKEND' ? 'نهاية الأسبوع' : 'نطاق مخصص'}
              </button>
            ))}
            <div className="relative flex items-center px-2 border-l border-white/10">
              <span className="text-gray-500 font-bold text-xs pl-1 select-none">يوم معين:</span>
              <input 
                type="date"
                value={customDate}
                onChange={(e) => {
                  setCustomDate(e.target.value);
                  if (e.target.value) {
                    setDateFilter('CUSTOM');
                  } else {
                    setDateFilter('ALL');
                  }
                }}
                className="bg-black/40 border border-white/10 p-1.5 rounded-lg text-xs font-bold text-gray-300 focus:neon-border outline-none transition-all cursor-pointer"
              />
            </div>
          </div>

          {/* Sort & Order */}
          <div className="flex items-center gap-2">
            <div className="flex-1 flex gap-2 p-1 bg-surface rounded-xl border border-border">
               <button
                onClick={() => setSortBy('TIME')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-[10px] font-bold cursor-pointer ${sortBy === 'TIME' ? 'bg-white/10 text-primary' : 'text-gray-500'}`}
              >
                <Clock size={12} /> الوقت
              </button>
              <button
                onClick={() => setSortBy('LEAGUE')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-[10px] font-bold cursor-pointer ${sortBy === 'LEAGUE' ? 'bg-white/10 text-primary' : 'text-gray-500'}`}
              >
                <Trophy size={12} /> البطولة
              </button>
            </div>
            <button 
              onClick={() => setSortOrder(prev => prev === 'ASC' ? 'DESC' : 'ASC')}
              className="p-3 bg-surface border border-border rounded-xl hover:bg-surface-hover text-primary transition-all active:scale-95 cursor-pointer"
            >
              {sortOrder === 'ASC' ? <SortAsc size={20} /> : <SortDesc size={20} />}
            </button>
          </div>
        </div>

        {/* Conditional Date Range Smooth Panel */}
        <AnimatePresence>
          {dateFilter === 'RANGE' && (
            <motion.div
              initial={{ height: 0, opacity: 0, y: -10 }}
              animate={{ height: 'auto', opacity: 1, y: 0 }}
              exit={{ height: 0, opacity: 0, y: -10 }}
              className="overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-surface p-4 rounded-xl border border-border shadow-md">
                <span className="text-xs font-black text-primary flex items-center gap-1.5 select-none">
                  <Calendar size={14} /> تصفية بنطاق مخصص:
                </span>
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 font-bold">من تاريخ:</span>
                    <input 
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                      }}
                      className="bg-black/45 border border-white/10 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-300 focus:neon-border outline-none transition-all cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 font-bold">إلى تاريخ:</span>
                    <input 
                      type="date"
                      value={endDate}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                      }}
                      className="bg-black/45 border border-white/10 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-300 focus:neon-border outline-none transition-all cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="relative group">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors" size={20} />
            <input 
              type="search" 
              placeholder="ابحث عن فريق أو بطولة..."
              className="w-full bg-surface border border-border p-4 pr-12 pl-4 rounded-2xl font-bold focus:neon-border outline-none transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="relative group">
            <Users className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors" size={20} />
            <input 
              type="search" 
              placeholder="تصفية حسب اسم الفريق..."
              className="w-full bg-surface border border-border p-4 pr-12 pl-4 rounded-2xl font-bold focus:neon-border outline-none transition-all"
              value={teamQuery}
              onChange={(e) => setTeamQuery(e.target.value)}
            />
          </div>
          <div className="relative group">
            <Tv className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors" size={20} />
            <select
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
              className="w-full bg-surface border border-border p-4 pr-12 pl-10 rounded-2xl font-bold focus:neon-border outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="ALL">كل القنوات (All Channels)</option>
              {channels.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 group-focus-within:text-primary transition-colors">
              <ChevronDown size={18} />
            </div>
          </div>
      </div>

      {/* League Selection (Horizontal Scroll) */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 px-1">تصفية حسب البطولة</label>
        <div className="flex gap-3 overflow-x-auto pb-4 hide-scrollbar">
          <button
            onClick={() => setSelectedLeague('ALL')}
            className={`shrink-0 flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
              selectedLeague === 'ALL' ? 'bg-primary/20 border-primary scale-105 neon-border' : 'bg-surface border-border hover:border-gray-700'
            }`}
          >
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
              <Trophy size={20} className={selectedLeague === 'ALL' ? 'text-primary' : 'text-gray-400'} />
            </div>
            <span className="text-[10px] font-black whitespace-nowrap">الكل</span>
          </button>
          {leagues.map(league => (
            <button
              key={league.id}
              onClick={() => setSelectedLeague(league.name)}
              className={`shrink-0 flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
                selectedLeague === league.name ? 'bg-primary/20 border-primary scale-105 neon-border' : 'bg-surface border-border hover:border-gray-700'
              }`}
            >
              <img src={league.logo || undefined} alt={league.name} className="w-12 h-12 object-contain" />
              <span className="text-[10px] font-black whitespace-nowrap">{league.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Result Count */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs text-gray-500 font-bold">وجدنا {filteredMatches.length} مباراة</p>
          <button 
          onClick={() => { 
            setDateFilter('ALL'); 
            setSelectedLeague('ALL'); 
            setSelectedChannel('ALL');
            setSearchQuery(''); 
            setTeamQuery('');
            setStatusFilter('ALL');
            setCustomDate('');
            setStartDate('');
            setEndDate('');
            setStartTime('00:00');
            setEndTime('23:59');
          }} 
          className="text-[10px] text-primary font-black hover:underline"
        >
          إعادة ضبط
        </button>
      </div>

      {/* Match List */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredMatches.length > 0 ? (
            filteredMatches.map((match, idx) => (
              <MatchQuickViewCard key={match.id} match={match} idx={idx} />
            ))
          ) : (
            <motion.div 
              initial={{opacity: 0}} 
              animate={{opacity: 1}} 
              className="text-center py-20 glass rounded-3xl space-y-4"
            >
              <Filter size={40} className="mx-auto text-gray-700" />
              <p className="text-gray-500 font-bold">لا يوجد مباريات تطابق هذه الفلاتر</p>
              <button 
                onClick={() => { 
                  setDateFilter('ALL'); 
                  setSelectedLeague('ALL'); 
                  setSelectedChannel('ALL');
                  setSearchQuery(''); 
                  setTeamQuery('');
                  setStatusFilter('ALL');
                  setCustomDate('');
                  setStartDate('');
                  setEndDate('');
                  setStartTime('00:00');
                  setEndTime('23:59');
                }}
                className="text-primary hover:underline text-sm font-black"
              >
                عرض كل المباريات
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
