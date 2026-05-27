import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useMatches } from '../context/MatchContext';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Match, StreamingLink } from '../types';
import VideoPlayer from './VideoPlayer';
import AIPrediction from './AIPrediction';
import AdBanner from './AdBanner';
import ShareButton from './ShareButton';
import { ArrowRight, Info, Shield, Users, BarChart3, Activity, Radio, Youtube, Zap, RefreshCw, AlertCircle, CheckCircle2, Edit, Plus, Trash2, X, Save, Search, Trophy, Clock, TrendingUp, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getYoutubeEmbedUrl } from '../lib/utils';
import { useError } from '../context/ErrorContext';
import LineupsView from './LineupsView';
import TimelineView from './TimelineView';
import StandingsView from './StandingsView';
import MatchHeader from './MatchHeader';
import H2HView from './H2HView';
import MatchStatsView from './MatchStatsView';
import MatchMomentumView from './MatchMomentumView';
import MatchAnalyticsView from './MatchAnalyticsView';
import TacticalHeatmapView from './TacticalHeatmapView';
import { useMatchStore } from '../store/matchStore';

type LinkStatus = 'idle' | 'checking' | 'ok' | 'broken';

function highlightQuery(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const escapedQuery = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const regex = new RegExp(`(${escapedQuery})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <span key={i} className="font-extrabold text-primary bg-primary/10 px-0.5 rounded">
        {part}
      </span>
    ) : (
      part
    )
  );
}

interface Scorer {
  rank: number;
  name: string;
  team: string;
  goals: number;
  assists: number;
  matches: number;
  avatar: string;
  teamLogo?: string;
}

const LEAGUE_SCORERS: Record<string, Scorer[]> = {
  'الدوري الإنجليزي': [
    { rank: 1, name: 'إيرلينغ هالاند', team: 'مانشستر سيتي', goals: 27, assists: 5, matches: 31, avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=EH', teamLogo: 'https://api.dicebear.com/7.x/initials/svg?seed=MC&backgroundColor=06b6d4' },
    { rank: 2, name: 'كول بالمر', team: 'تشيلسي', goals: 22, assists: 11, matches: 33, avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=CP', teamLogo: 'https://api.dicebear.com/7.x/initials/svg?seed=CFC&backgroundColor=2563eb' },
    { rank: 3, name: 'ألكسندر إيزاك', team: 'نيوكاسل', goals: 21, assists: 2, matches: 30, avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=AI', teamLogo: 'https://api.dicebear.com/7.x/initials/svg?seed=NU&backgroundColor=000000' },
    { rank: 4, name: 'أوليه واتكينز', team: 'أستون فيلا', goals: 19, assists: 13, matches: 37, avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=OW', teamLogo: 'https://api.dicebear.com/7.x/initials/svg?seed=AV&backgroundColor=800020' },
    { rank: 5, name: 'محمد صلاح', team: 'ليفربول', goals: 18, assists: 10, matches: 32, avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=MS', teamLogo: 'https://api.dicebear.com/7.x/initials/svg?seed=LFC&backgroundColor=dc2626' },
  ],
  'الدوري الإسباني': [
    { rank: 1, name: 'أرتيم دوفبيك', team: 'جيرونا', goals: 24, assists: 8, matches: 36, avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=AD', teamLogo: 'https://api.dicebear.com/7.x/initials/svg?seed=GI&backgroundColor=ea580c' },
    { rank: 2, name: 'ألكسندر سورلوث', team: 'فياريال', goals: 23, assists: 6, matches: 34, avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=AS', teamLogo: 'https://api.dicebear.com/7.x/initials/svg?seed=YF&backgroundColor=eab308' },
    { rank: 3, name: 'جود بيلينغهاي', team: 'ريال مدريد', goals: 19, assists: 6, matches: 28, avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=JB', teamLogo: 'https://api.dicebear.com/7.x/initials/svg?seed=RM&backgroundColor=f8fafc' },
    { rank: 4, name: 'روبرت ليفاندوفسكي', team: 'برشلونة', goals: 19, assists: 8, matches: 35, avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=RL', teamLogo: 'https://api.dicebear.com/7.x/initials/svg?seed=FCB&backgroundColor=701a75' },
    { rank: 5, name: 'أنتي بوديمير', team: 'أوساسونا', goals: 17, assists: 2, matches: 33, avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=AB', teamLogo: 'https://api.dicebear.com/7.x/initials/svg?seed=CA&backgroundColor=b91c1c' },
  ],
  'الدوري السعودي': [
    { rank: 1, name: 'كريستيانو رونالدو', team: 'النصر', goals: 35, assists: 11, matches: 31, avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=CR7', teamLogo: 'https://api.dicebear.com/7.x/initials/svg?seed=NFC&backgroundColor=eab308' },
    { rank: 2, name: 'ألكساندر ميتروفيتش', team: 'الهلال', goals: 28, assists: 5, matches: 28, avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=AM', teamLogo: 'https://api.dicebear.com/7.x/initials/svg?seed=HFC&backgroundColor=1d4ed8' },
    { rank: 3, name: 'عبد الرزاق حمد الله', team: 'الاتحاد', goals: 19, assists: 3, matches: 24, avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=AH', teamLogo: 'https://api.dicebear.com/7.x/initials/svg?seed=ITT&backgroundColor=000000' },
    { rank: 4, name: 'فاشيون ساكالا', team: 'الفيحاء', goals: 19, assists: 6, matches: 31, avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=FS', teamLogo: 'https://api.dicebear.com/7.x/initials/svg?seed=FIH&backgroundColor=f97316' },
    { rank: 5, name: 'فراس البريكان', team: 'الأهلي', goals: 17, assists: 8, matches: 31, avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=FAB', teamLogo: 'https://api.dicebear.com/7.x/initials/svg?seed=AFC&backgroundColor=15803d' },
  ],
  'دوري أبطال أوروبا': [
    { rank: 1, name: 'كليان مبابي', team: 'باريس سان جيرمان', goals: 8, assists: 0, matches: 12, avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=KM', teamLogo: 'https://api.dicebear.com/7.x/initials/svg?seed=PSG&backgroundColor=1e3a8a' },
    { rank: 2, name: 'هاري كين', team: 'بايرن ميونخ', goals: 8, assists: 4, matches: 12, avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=HK', teamLogo: 'https://api.dicebear.com/7.x/initials/svg?seed=FCB&backgroundColor=dc143c' },
    { rank: 3, name: 'إيرلينغ هالاند', team: 'مانشستر سيتي', goals: 6, assists: 1, matches: 9, avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=EH', teamLogo: 'https://api.dicebear.com/7.x/initials/svg?seed=MC&backgroundColor=06b6d4' },
    { rank: 4, name: 'أنطوان غريزمان', team: 'أتلتيكو مدريد', goals: 6, assists: 1, matches: 10, avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=AG', teamLogo: 'https://api.dicebear.com/7.x/initials/svg?seed=ATM&backgroundColor=e11d48' },
    { rank: 5, name: 'فينيسيوس جونيور', team: 'ريال مدريد', goals: 6, assists: 5, matches: 10, avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=VJ', teamLogo: 'https://api.dicebear.com/7.x/initials/svg?seed=RM&backgroundColor=f8fafc' },
  ],
};

const DEFAULT_SCORERS: Scorer[] = [
  { rank: 1, name: 'إيرلينغ هالاند', team: 'مانشستر سيتي', goals: 27, assists: 5, matches: 31, avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=EH', teamLogo: 'https://api.dicebear.com/7.x/initials/svg?seed=MC&backgroundColor=06b6d4' },
  { rank: 2, name: 'كريستيانو رونالدو', team: 'النصر', goals: 35, assists: 11, matches: 31, avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=CR7', teamLogo: 'https://api.dicebear.com/7.x/initials/svg?seed=NFC&backgroundColor=eab308' },
  { rank: 3, name: 'كليان مبابي', team: 'باريس سان جيرمان', goals: 8, assists: 0, matches: 12, avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=KM', teamLogo: 'https://api.dicebear.com/7.x/initials/svg?seed=PSG&backgroundColor=1e3a8a' },
];

export default function MatchDetailView() {
  const { showError } = useError();
  const { id } = useParams<{ id: string }>();
  const { matches } = useMatches();
  const [localMatch, setLocalMatch] = useState<Match | null>(null);
  const [activeServer, setActiveServer] = useState(0);
  const [linkStatuses, setLinkStatuses] = useState<Record<number, LinkStatus>>({});
  const [isCheckingAll, setIsCheckingAll] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  const [blockAds, setBlockAds] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLDivElement>(null);
  const { 
    activeStatsTab, 
    renderedTabs, 
    setActiveStatsTab, 
    setCurrentMatch, 
    resetMatchStore 
  } = useMatchStore();
  const [standingsSubTab, setStandingsSubTab] = useState<'table' | 'scorers'>('table');

  const [user] = useAuthState(auth);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const categorizedResults = React.useMemo(() => {
    if (!searchQuery.trim()) return { leagueMatches: [], teamMatches: [] };
    const query = searchQuery.toLowerCase().trim();
    
    const filtered = matches.filter(m => m.id !== id);
    
    // Matched by league name
    const leagueMatches = filtered.filter(m => 
      m.league.toLowerCase().includes(query)
    );
    
    // Matched by team names (excluding matches already categorized under leagues to avoid duplicate entries)
    const teamMatches = filtered.filter(m => 
      (m.homeTeam.toLowerCase().includes(query) || m.awayTeam.toLowerCase().includes(query)) &&
      !m.league.toLowerCase().includes(query)
    );
    
    return { leagueMatches, teamMatches };
  }, [searchQuery, matches, id]);
  const isAdmin = user?.email === 'abdalziz2022@gmail.com' || user?.email === (import.meta as any).env.VITE_ADMIN_EMAIL;
  
  const [showManageLinks, setShowManageLinks] = useState(false);
  const [editingLinks, setEditingLinks] = useState<StreamingLink[]>([]);
  const [isSavingLinks, setIsSavingLinks] = useState(false);

  const [sortBy, setSortBy] = useState<'DEFAULT' | 'QUALITY' | 'STATUS'>('DEFAULT');

  const match = localMatch;

  useEffect(() => {
    if (!id) return;

    // Initial check from context
    const contextMatch = matches.find(m => m.id === id);
    if (contextMatch && !localMatch) {
      setLocalMatch(contextMatch);
      setCurrentMatch(contextMatch);
    }

    // Dedicated real-time listener for this match
    const unsub = onSnapshot(doc(db, 'matches', id), (snapshot) => {
      if (snapshot.exists()) {
        const updatedMatch = { id: snapshot.id, ...snapshot.data() } as Match;
        setLocalMatch(updatedMatch);
        setCurrentMatch(updatedMatch);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `matches/${id}`);
      showError(error);
    });

    return () => {
      unsub();
      resetMatchStore();
    };
  }, [id, matches]);

  const isLive = match?.status === 'LIVE';
  const isFinished = match?.status === 'FINISHED';
  
  const allLinks = React.useMemo(() => {
    if (!match) return [];
    return [
      ...(match.streamingLinks || []).map(l => ({ ...l, category: 'live' as const })),
      ...(match.youtubeLink ? [{ label: 'YouTube', url: getYoutubeEmbedUrl(match.youtubeLink), quality: 'HD', isYoutube: true, category: 'live' as const }] : []),
      ...(match.highlightsLinks || []).map(l => ({ ...l, category: 'highlights' as const })),
      ...(match.replayLinks || []).map(l => ({ ...l, category: 'replay' as const }))
    ];
  }, [match]);

  const getQualityWeight = (q: string) => {
    const num = parseInt(q.replace(/\D/g, ''));
    if (q.toLowerCase().includes('4k')) return 2160;
    if (q.toLowerCase().includes('hd')) return 720;
    return isNaN(num) ? 0 : num;
  };

  const getStatusWeight = (status: LinkStatus) => {
    switch (status) {
      case 'ok': return 3;
      case 'idle': return 2;
      case 'checking': return 1;
      case 'broken': return 0;
      default: return 0;
    }
  };

  const sortedLinks = React.useMemo(() => {
    const indexedLinks = allLinks.map((link, idx) => ({ link, originalIdx: idx }));
    
    if (sortBy === 'DEFAULT') return indexedLinks;
    
    return [...indexedLinks].sort((a, b) => {
      if (sortBy === 'QUALITY') {
        return getQualityWeight(b.link.quality) - getQualityWeight(a.link.quality);
      }
      if (sortBy === 'STATUS') {
        const sA = linkStatuses[a.originalIdx] || 'idle';
        const sB = linkStatuses[b.originalIdx] || 'idle';
        return getStatusWeight(sB) - getStatusWeight(sA);
      }
      return 0;
    });
  }, [allLinks, sortBy, linkStatuses]);

  useEffect(() => {
    // If finished and no live links but has highlights/replay, set active to first highlight/replay
    if (match?.status === 'FINISHED' && allLinks.length > 0) {
      const firstNonLive = allLinks.findIndex(l => l.category !== 'live');
      if (firstNonLive !== -1 && activeServer === 0 && allLinks[0]?.category === 'live') {
        setActiveServer(firstNonLive);
      }
    }
  }, [match?.status, allLinks.length]);

  if (!match) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-gray-500 font-bold">جاري تحميل تفاصيل المباراة...</p>
      </div>
    </div>
  );

  const showPlayer = (isLive && (match.streamingLinks?.length || match.youtubeLink)) || 
                   (isFinished && (match.highlightsLinks?.length || match.replayLinks?.length));
  
  const currentLink = allLinks[activeServer] || allLinks[0];

  const checkLinksHealth = async () => {
    if (isCheckingAll) return;
    setIsCheckingAll(true);
    
    const newStatuses: Record<number, LinkStatus> = {};
    
    // Set all to checking
    allLinks.forEach((_, idx) => {
      newStatuses[idx] = 'checking';
    });
    setLinkStatuses(newStatuses);

    // Run parallel checks
    const checkPromises = allLinks.map(async (link, idx) => {
      try {
        // We use no-cors to avoid CORS errors for simple pings.
        // Even if we can't see the status code, a catch() usually means it's totally unreachable.
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

        await fetch(link.url, { 
          mode: 'no-cors',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        return { idx, status: 'ok' as LinkStatus };
      } catch (err) {
        console.warn(`Health check failed for link ${idx}:`, err);
        return { idx, status: 'broken' as LinkStatus };
      }
    });

    const results = await Promise.all(checkPromises);
    const finalStatuses: Record<number, LinkStatus> = { ...newStatuses };
    results.forEach(res => {
      finalStatuses[res.idx] = res.status;
    });
    
    setLinkStatuses(finalStatuses);
    setIsCheckingAll(false);
    setLastUpdated(new Date());
    setIsPulsing(true);
    setTimeout(() => setIsPulsing(false), 2000);
  };

  const handleSaveLinks = async () => {
    if (!id || !match) return;
    setIsSavingLinks(true);
    try {
      await updateDoc(doc(db, 'matches', id), {
        streamingLinks: editingLinks
      });
      setShowManageLinks(false);
    } catch (error) {
      console.error(error);
      showError(error instanceof Error ? error : new Error('Failed to update links'));
    } finally {
      setIsSavingLinks(false);
    }
  };

  return (
    <div className="match-detail-view-container max-w-5xl mx-auto px-4 pt-28 md:pt-36 pb-24 space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-primary transition-colors">
          <ArrowRight size={18} />
          <span>العودة للرئيسية</span>
        </Link>
        
        <ShareButton 
          variant="dropdown" 
          align="left" 
          title={`${match.homeTeam} ضد ${match.awayTeam}`} 
          text={`تابع بث أول بأول وتفاصيل لقاء ${match.homeTeam} ضد ${match.awayTeam} بجودة عالية على كورة 90! ⚽`} 
        />
      </div>

      {/* Search Bar for Other Matches */}
      <div className="relative z-50 w-full" ref={searchRef}>
        <div className="relative max-w-md mx-auto md:mx-0">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن مباراة أخرى بالفريق أو الدوري..."
            className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-primary/50 text-white rounded-2xl px-5 py-3.5 pr-12 text-sm outline-none transition-all placeholder:text-gray-500 font-bold text-right"
            style={{ direction: 'rtl' }}
          />
          <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Search results overlay dropdown */}
        <AnimatePresence>
          {searchQuery && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute top-16 right-0 left-0 bg-[#0c111d]/95 backdrop-blur-xl border border-white/5 rounded-2xl shadow-2xl p-3 max-h-96 overflow-y-auto space-y-4 z-[9999] scrollbar-thin scrollbar-thumb-white/10"
              style={{ direction: 'rtl' }}
            >
              {(categorizedResults.leagueMatches.length > 0 || categorizedResults.teamMatches.length > 0) ? (
                <>
                  {/* Leagues Section */}
                  {categorizedResults.leagueMatches.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-black text-gray-400 bg-white/5 rounded-xl border border-white/5 inline-flex">
                        <Trophy size={14} className="text-amber-500" />
                        <span>مباريات حسب الدوري ({categorizedResults.leagueMatches.length})</span>
                      </div>
                      <div className="space-y-1">
                        {categorizedResults.leagueMatches.map((m) => (
                          <Link
                            to={`/match/${m.id}`}
                            key={m.id}
                            onClick={() => setSearchQuery('')}
                            className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all text-right group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2.5 font-bold text-sm text-gray-200 group-hover:text-white transition-colors">
                                <span className="text-gray-100 group-hover:text-primary transition-colors">{highlightQuery(m.homeTeam, searchQuery)}</span>
                                <img src={m.homeLogo || undefined} alt="" className="w-5.5 h-5.5 object-contain" />
                                <span className="text-gray-500 font-medium text-xs">ضد</span>
                                <img src={m.awayLogo || undefined} alt="" className="w-5.5 h-5.5 object-contain" />
                                <span className="text-gray-100 group-hover:text-primary transition-colors">{highlightQuery(m.awayTeam, searchQuery)}</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2.5">
                              <span className="text-xs text-gray-400 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5 hidden sm:inline-block">
                                {highlightQuery(m.league, searchQuery)}
                              </span>
                              {m.status === 'LIVE' ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-red-500 bg-red-500/10 px-2 py-1 rounded-full border border-red-500/20">
                                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                                  مباشر
                                </span>
                              ) : m.status === 'FINISHED' ? (
                                <span className="text-[10px] font-black uppercase text-gray-400 bg-white/5 px-2 py-1 rounded-full border border-white/5">منتهية</span>
                              ) : (
                                <span className="text-[10px] font-black uppercase text-primary bg-primary/10 px-2 py-1 rounded-full border border-primary/20">قادمة</span>
                              )}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Spacer helper if both groups are populated */}
                  {categorizedResults.leagueMatches.length > 0 && categorizedResults.teamMatches.length > 0 && (
                    <div className="border-t border-white/5 my-2" />
                  )}

                  {/* Teams Section */}
                  {categorizedResults.teamMatches.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-black text-gray-400 bg-white/5 rounded-xl border border-white/5 inline-flex">
                        <Users size={14} className="text-blue-400" />
                        <span>مباريات حسب الفرق ({categorizedResults.teamMatches.length})</span>
                      </div>
                      <div className="space-y-1">
                        {categorizedResults.teamMatches.map((m) => (
                          <Link
                            to={`/match/${m.id}`}
                            key={m.id}
                            onClick={() => setSearchQuery('')}
                            className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all text-right group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2.5 font-bold text-sm text-gray-200 group-hover:text-white transition-colors">
                                <span className="text-gray-100 group-hover:text-primary transition-colors">{highlightQuery(m.homeTeam, searchQuery)}</span>
                                <img src={m.homeLogo || undefined} alt="" className="w-5.5 h-5.5 object-contain" />
                                <span className="text-gray-500 font-medium text-xs">ضد</span>
                                <img src={m.awayLogo || undefined} alt="" className="w-5.5 h-5.5 object-contain" />
                                <span className="text-gray-100 group-hover:text-primary transition-colors">{highlightQuery(m.awayTeam, searchQuery)}</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2.5">
                              <span className="text-xs text-gray-400 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5 hidden sm:inline-block">
                                {highlightQuery(m.league, searchQuery)}
                              </span>
                              {m.status === 'LIVE' ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-red-500 bg-red-500/10 px-2 py-1 rounded-full border border-red-500/20">
                                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                                  مباشر
                                </span>
                              ) : m.status === 'FINISHED' ? (
                                <span className="text-[10px] font-black uppercase text-gray-400 bg-white/5 px-2 py-1 rounded-full border border-white/5">منتهية</span>
                              ) : (
                                <span className="text-[10px] font-black uppercase text-primary bg-primary/10 px-2 py-1 rounded-full border border-primary/20">قادمة</span>
                              )}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-6 text-gray-500 font-bold text-sm">
                  لا توجد مباريات أخرى تطابق بحثك حالياً ⚽
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Premium Match Header Card */}
      <MatchHeader match={match} />

      {/* Video / Headline Section */}
      <div className="space-y-6">
        {showPlayer ? (
          <VideoPlayer 
            url={currentLink.url} 
            poster={match.homeLogo}
            title={`${match.homeTeam} ضد ${match.awayTeam} - ${currentLink.label}`}
            blockAds={blockAds}
            qualities={allLinks}
            activeQualityIndex={activeServer}
            onQualityChange={(index) => setActiveServer(index)}
          />
        ) : (
          <div className="glass aspect-video rounded-3xl flex flex-col items-center justify-center p-8 text-center space-y-6">
            <div className="flex items-center justify-center gap-8 md:gap-16">
              <div className="flex flex-col items-center gap-4">
                <img src={match.homeLogo || undefined} alt={match.homeTeam} className="w-20 h-20 md:w-32 md:h-32 object-contain" />
                <h2 className="text-xl md:text-2xl font-black">{match.homeTeam}</h2>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="text-4xl md:text-6xl font-black tabular-nums flex items-center gap-4">
                  <motion.span 
                    key={`home-${match.homeScore}`}
                    initial={{ scale: 1.2, color: '#fcd34d' }}
                    animate={{ scale: 1, color: '#ffffff' }}
                    className="inline-block"
                  >
                    {match.status === 'UPCOMING' ? '' : match.homeScore}
                  </motion.span>
                  <span className="text-gray-600">
                    {match.status === 'UPCOMING' ? 'VS' : '-'}
                  </span>
                  <motion.span 
                    key={`away-${match.awayScore}`}
                    initial={{ scale: 1.2, color: '#fcd34d' }}
                    animate={{ scale: 1, color: '#ffffff' }}
                    className="inline-block"
                  >
                    {match.status === 'UPCOMING' ? '' : match.awayScore}
                  </motion.span>
                </div>
                {isLive && (
                  <div className="flex items-center gap-2 bg-red-500/10 text-red-500 px-3 py-1 rounded-full border border-red-500/20">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest">مباشر الآن</span>
                    {match.minute && <span className="text-[10px] font-black"> - {match.minute}'</span>}
                  </div>
                )}
              </div>
              <div className="flex flex-col items-center gap-4">
                <img src={match.awayLogo || undefined} alt={match.awayTeam} className="w-20 h-20 md:w-32 md:h-32 object-contain transition-transform group-hover:scale-110" />
                <h2 className="text-xl md:text-2xl font-black">{match.awayTeam}</h2>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-primary font-bold text-lg">
                {match.status === 'UPCOMING' ? 'المباراة ستبدأ قريباً' : 'انتهت المباراة'}
              </div>
              <p className="text-gray-500">القناة الناقلة: {match.channel}</p>
              {match.stadium && <p className="text-gray-500">الملعب: {match.stadium}</p>}
              {match.referee && <p className="text-gray-500">الحكم: {match.referee}</p>}
              {match.commentator && <p className="text-gray-500">المعلق: {match.commentator}</p>}
            </div>
          </div>
        )}

        {/* Streaming Servers Tabs */}
        {isLive && allLinks.some(l => l.category === 'live') && (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-gray-400 flex items-center gap-2 uppercase tracking-widest">
                  <Zap size={16} className="text-primary" />
                  سيرفرات البث المباشر
                </h3>
                <p className="text-[10px] text-gray-500 font-medium">اختر السيرفر المناسب لمتابعة المباراة بجودات متعددة</p>
              </div>

              <div className="flex items-center flex-wrap gap-2">
                <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/10">
                  <span className="text-[9px] font-black text-gray-500 px-2 uppercase tracking-widest">ترتيب:</span>
                  {[
                    { val: 'DEFAULT', label: 'افتراضي' },
                    { val: 'QUALITY', label: 'الجودة' },
                    { val: 'STATUS', label: 'الحالة' }
                  ].map(opt => (
                    <button
                      key={opt.val}
                      onClick={() => setSortBy(opt.val as any)}
                      className={`text-[10px] font-black px-3 py-1 rounded-md transition-all ${
                        sortBy === opt.val ? 'bg-primary text-black' : 'hover:bg-white/5 text-gray-400'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                <div className="h-6 w-[1px] bg-white/10 mx-1 hidden md:block" />

                <div className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all border ${
                  isCheckingAll || isPulsing 
                    ? 'animate-pulse text-primary border-primary/30 bg-primary/5 ring-1 ring-primary/20 shadow-[0_0_12px_rgba(245,158,11,0.15)]' 
                    : 'text-gray-400 border-white/10 bg-white/5'
                }`}>
                  <span className="text-[10px] font-black uppercase tracking-tight">آخر تحديث: {lastUpdated.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                </div>

                <button
                  onClick={checkLinksHealth}
                  disabled={isCheckingAll}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all border ${
                    isCheckingAll 
                      ? 'bg-white/5 border-white/5 text-gray-500 cursor-not-allowed' 
                      : 'bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 active:scale-95'
                  }`}
                >
                  <RefreshCw size={12} className={isCheckingAll ? 'animate-spin' : ''} />
                  {isCheckingAll ? 'جاري الفحص...' : 'تحديث الحالة'}
                </button>

                <div className="h-6 w-[1px] bg-white/10 mx-1 hidden md:block" />

                {/* Ad Blocker Toggle */}
                <button
                  onClick={() => setBlockAds(!blockAds)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all border ${
                    blockAds 
                      ? 'bg-green-500/10 border-green-500/20 text-green-500 hover:bg-green-500/20' 
                      : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                  }`}
                  title={blockAds ? "حماية الإعلانات مفعلة" : "تفعيل حماية الإعلانات"}
                >
                  <Shield size={12} fill={blockAds ? "currentColor" : "none"} />
                  {blockAds ? 'مانع الإعلانات مفعل' : 'تعطيل الإعلانات'}
                </button>
                
                {isAdmin && (
                  <>
                    <div className="h-6 w-[1px] bg-white/10 mx-1 hidden md:block" />
                    <button
                      onClick={() => {
                        setEditingLinks([...(match.streamingLinks || [])]);
                        setShowManageLinks(true);
                      }}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all border bg-secondary/10 border-secondary/20 text-secondary hover:bg-secondary/20 active:scale-95"
                    >
                      <Edit size={12} />
                      تعديل الروابط
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {sortedLinks.filter(l => l.link.category === 'live').map(({ link, originalIdx }) => {
                const isActive = activeServer === originalIdx;
                const isYoutube = (link as any).isYoutube;
                const status = linkStatuses[originalIdx] || 'idle';
                
                return (
                  <button
                    key={originalIdx}
                    onClick={() => setActiveServer(originalIdx)}
                    className={`relative overflow-hidden group transition-all duration-300 ${
                      isActive 
                        ? 'bg-primary/40 border-primary ring-2 ring-primary ring-offset-2 ring-offset-background translate-y-[-2px]' 
                        : 'bg-white/5 hover:bg-white/10'
                    } ${
                      status === 'broken' && !isActive ? 'opacity-60 border-red-500/20' : 'bg-white/5 border-white/10'
                    } backdrop-blur-md border rounded-2xl p-4 text-right`}
                  >
                    {/* Status Glow / Indicator */}
                    <AnimatePresence>
                      {status !== 'idle' && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className={`absolute top-2 left-2 w-2 h-2 rounded-full shadow-[0_0_10px_currentColor] z-10 ${
                            status === 'ok' ? 'text-green-500 bg-current' : 
                            status === 'checking' ? 'text-primary bg-current animate-pulse' : 
                            'text-red-500 bg-current'
                          }`}
                        />
                      )}
                    </AnimatePresence>

                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-lg relative ${
                        isActive 
                          ? 'bg-primary text-black' 
                          : isYoutube ? 'bg-red-500/10 text-red-500' : 'bg-white/10 text-white'
                      }`}>
                        {isYoutube ? <Youtube size={20} /> : <Radio size={20} />}
                        
                        {/* Tiny Icon Badge for Status */}
                        {status !== 'idle' && (
                          <div className={`absolute -bottom-1 -right-1 p-0.5 rounded-full border border-black shadow-sm ${
                            status === 'ok' ? 'bg-green-500 text-white' : 
                            status === 'checking' ? 'bg-primary text-white' : 
                            'bg-red-500 text-white'
                          }`}>
                             {status === 'ok' && <CheckCircle2 size={8} />}
                             {status === 'checking' && <RefreshCw size={8} className="animate-spin" />}
                             {status === 'broken' && <AlertCircle size={8} />}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className={`text-[10px] font-bold uppercase tracking-tight truncate ${isActive ? 'text-primary' : 'text-gray-500'}`}>
                          {isYoutube ? 'بث يوتيوب' : `سيرفر ${originalIdx + 1}`}
                        </p>
                        <h4 className={`text-sm font-black truncate ${status === 'broken' ? 'text-red-400' : ''}`}>
                          {link.label || match.channel || 'مشاهدة مباشرة'}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${
                            isActive ? 'bg-primary/20 border-primary/30 text-primary' : 'bg-white/5 border-white/10 text-gray-400'
                          }`}>
                            {link.quality}
                          </span>
                          
                          {isActive && (
                            <motion.span 
                              layoutId="live-indicator"
                              className="text-[9px] font-black text-primary animate-pulse"
                            >
                              متصل الآن
                            </motion.span>
                          )}

                          {status === 'broken' && !isActive && (
                            <span className="text-[9px] font-black text-red-500 bg-red-500/10 px-1 rounded">
                              معطل
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Highlights & Replay Sections */}
        {isFinished && (
          <div className="space-y-8">
            {match.highlightsLinks && match.highlightsLinks.length > 0 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-gray-400 flex items-center gap-2 uppercase tracking-widest">
                    <Zap size={16} className="text-secondary" />
                    ملخص المباراة وهدايا اللقاء
                  </h3>
                  <p className="text-[10px] text-gray-500 font-medium">أبرز اللحظات والأهداف التي حدثت في المباراة</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {sortedLinks.filter(l => l.link.category === 'highlights').map(({ link, originalIdx }) => {
                    const isActive = activeServer === originalIdx;
                    return (
                      <button
                        key={originalIdx}
                        onClick={() => setActiveServer(originalIdx)}
                        className={`relative overflow-hidden group transition-all duration-300 backdrop-blur-md border rounded-2xl p-4 text-right ${
                          isActive 
                            ? 'bg-secondary/40 border-secondary ring-2 ring-secondary ring-offset-2 ring-offset-background translate-y-[-2px]' 
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-lg ${
                            isActive ? 'bg-secondary text-black' : 'bg-secondary/10 text-secondary'
                          }`}>
                            <Youtube size={20} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-[10px] font-bold uppercase tracking-tight truncate ${isActive ? 'text-secondary' : 'text-gray-500'}`}>
                              ملخص HD
                            </p>
                            <h4 className="text-sm font-black truncate">
                              {link.label || 'مشاهدة الملخص'}
                            </h4>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {match.replayLinks && match.replayLinks.length > 0 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-gray-400 flex items-center gap-2 uppercase tracking-widest">
                    <Zap size={16} className="text-blue-500" />
                    إعادة المباراة كاملة (Full Replay)
                  </h3>
                  <p className="text-[10px] text-gray-500 font-medium">شاهد المباراة كاملة بتعليقك المفضل</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {sortedLinks.filter(l => l.link.category === 'replay').map(({ link, originalIdx }) => {
                    const isActive = activeServer === originalIdx;
                    return (
                      <button
                        key={originalIdx}
                        onClick={() => setActiveServer(originalIdx)}
                        className={`relative overflow-hidden group transition-all duration-300 backdrop-blur-md border rounded-2xl p-4 text-right ${
                          isActive 
                            ? 'bg-blue-500/40 border-blue-500 ring-2 ring-blue-500 ring-offset-2 ring-offset-background translate-y-[-2px]' 
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-lg ${
                            isActive ? 'bg-blue-500 text-white' : 'bg-blue-500/10 text-blue-500'
                          }`}>
                            <RefreshCw size={20} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-[10px] font-bold uppercase tracking-tight truncate ${isActive ? 'text-blue-400' : 'text-gray-500'}`}>
                              المباراة كاملة
                            </p>
                            <h4 className="text-sm font-black truncate">
                              {link.label || 'مشاهدة الإعادة'}
                            </h4>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <AdBanner slot="Match_Under_Player" />

      {/* Match Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Stats Overlay */}
          <div className="glass rounded-3xl p-6 space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-white/5 pb-4 gap-4" style={{ direction: 'rtl' }}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                  {activeStatsTab === 'overview' && <Clock className="text-primary" size={16} />}
                  {activeStatsTab === 'stats' && <BarChart3 className="text-primary" size={16} />}
                  {activeStatsTab === 'analytics' && <Activity className="text-primary" size={16} />}
                  {activeStatsTab === 'heatmap' && <Flame className="text-primary" size={16} />}
                  {activeStatsTab === 'momentum' && <TrendingUp className="text-primary" size={16} />}
                  {activeStatsTab === 'lineups' && <Users className="text-primary" size={16} />}
                  {activeStatsTab === 'standings' && <Trophy className="text-primary" size={16} />}
                  {activeStatsTab === 'h2h' && <Radio className="text-primary" size={16} />}
                </div>
                <h3 className="text-base font-black text-white">
                  {activeStatsTab === 'overview' && 'تغطية الأحداث المباشرة'}
                  {activeStatsTab === 'stats' && 'إحصائيات اللقاء التفصيلية'}
                  {activeStatsTab === 'analytics' && 'تطور الاستحواذ والضغط'}
                  {activeStatsTab === 'heatmap' && 'الخريطة الحرارية وأماكن التمركز'}
                  {activeStatsTab === 'momentum' && 'منحنى ضغط وزخم مجريات المباراة'}
                  {activeStatsTab === 'lineups' && 'التشكيل الرسمي والتحركات'}
                  {activeStatsTab === 'standings' && (standingsSubTab === 'table' ? 'جدول ترتيب البطولة' : 'ترتيب جدول الهدافين')}
                  {activeStatsTab === 'h2h' && 'تاريخ المواجهات الثنائية ومستوى الفرق'}
                </h3>
              </div>
              
              <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10 overflow-x-auto no-scrollbar max-w-full">
                {[
                  { id: 'overview', label: 'الرئيسية 🏠', icon: Clock },
                  { id: 'stats', label: 'الإحصائيات', icon: BarChart3 },
                  { id: 'analytics', label: 'الاستحواذ 📊', icon: Activity },
                  { id: 'heatmap', label: 'الحرارية 📍', icon: Flame },
                  { id: 'momentum', label: 'الزخم الرياضي 📈', icon: TrendingUp },
                  { id: 'lineups', label: 'التشكيلة ⚽', icon: Users },
                  { id: 'standings', label: 'الترتيب 🏆', icon: Trophy },
                  { id: 'h2h', label: 'المواجهات 🔄', icon: Radio }
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeStatsTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveStatsTab(tab.id as any)}
                      className={`relative text-[11px] font-black px-3.5 py-2.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer select-none outline-none z-10 ${
                        isActive 
                          ? 'text-black font-extrabold' 
                          : 'hover:bg-white/5 text-gray-400 hover:text-white'
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeStatsTabMarker"
                          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                          className="absolute inset-0 bg-primary rounded-lg -z-10 shadow-[0_2px_10px_rgba(0,255,130,0.25)]"
                        />
                      )}
                      <Icon size={12} className={isActive ? 'text-black' : 'text-gray-500'} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeStatsTab}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                >
                  {activeStatsTab === 'overview' && renderedTabs.overview && (
                    <TimelineView match={match} />
                  )}

                  {activeStatsTab === 'stats' && renderedTabs.stats && (
                    <MatchStatsView match={match} />
                  )}

                  {activeStatsTab === 'analytics' && renderedTabs.analytics && (
                    <MatchAnalyticsView match={match} />
                  )}

                  {activeStatsTab === 'heatmap' && renderedTabs.heatmap && (
                    <TacticalHeatmapView match={match} />
                  )}

                  {activeStatsTab === 'momentum' && renderedTabs.momentum && (
                    <MatchMomentumView match={match} />
                  )}

                  {activeStatsTab === 'lineups' && renderedTabs.lineups && (
                    <LineupsView match={match} />
                  )}

                  {activeStatsTab === 'standings' && renderedTabs.standings && (
                    <div className="space-y-5" style={{ direction: 'rtl' }}>
                      {/* Sub-tabs selector for Standings or Scorers */}
                      <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/10 w-fit">
                        <button
                          onClick={() => setStandingsSubTab('table')}
                          className={`text-[10px] sm:text-[11px] font-black px-4 py-2 rounded-lg transition-all cursor-pointer ${
                            standingsSubTab === 'table'
                              ? 'bg-primary text-black font-extrabold shadow-sm'
                              : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          جدول الترتيب
                        </button>
                        <button
                          onClick={() => setStandingsSubTab('scorers')}
                          className={`text-[10px] sm:text-[11px] font-black px-4 py-2 rounded-lg transition-all cursor-pointer ${
                            standingsSubTab === 'scorers'
                              ? 'bg-primary text-black font-extrabold shadow-sm'
                              : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          الهدافين 🏆
                        </button>
                      </div>

                      <AnimatePresence mode="wait">
                        {standingsSubTab === 'table' ? (
                          <motion.div
                            key="table"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.15 }}
                          >
                            <StandingsView 
                              leagueName={match.league} 
                              homeTeam={match.homeTeam} 
                              awayTeam={match.awayTeam} 
                              homeLogo={match.homeLogo} 
                              awayLogo={match.awayLogo} 
                            />
                          </motion.div>
                        ) : (
                          <motion.div
                            key="scorers"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.15 }}
                            className="space-y-6"
                          >
                            <div className="flex items-center justify-between flex-wrap gap-4 mb-2">
                              <div className="text-sm font-black flex items-center gap-2 text-primary bg-primary/15 px-4 py-2.5 rounded-2xl border border-primary/20 w-fit">
                                <Trophy size={16} className="animate-pulse" />
                                <span>جدول الهدافين • {match.league || 'الدوري'}</span>
                              </div>
                              <span className="text-[10px] text-gray-500 font-bold">موسم ٢٠٢٥ / ٢٠٢٦</span>
                            </div>

                            {(() => {
                              const scorersList = LEAGUE_SCORERS[match.league] || DEFAULT_SCORERS;
                              const maxGoals = scorersList.length > 0 ? Math.max(...scorersList.map(s => s.goals)) : 30;
                              const firstPlace = scorersList.find(s => s.rank === 1);
                              const secondPlace = scorersList.find(s => s.rank === 2);
                              const thirdPlace = scorersList.find(s => s.rank === 3);

                              return (
                                <>
                                  {/* Top 3 Podium Visualization */}
                                  <div className="grid grid-cols-3 gap-2.5 sm:gap-4 pt-4 pb-8 border-b border-white/5 relative items-end">
                                    {/* Rank 2 (Silver Cup) */}
                                    {secondPlace && (
                                      <motion.div
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
                                        className="flex flex-col items-center group relative cursor-pointer"
                                      >
                                        <div className="relative mb-3">
                                          <div className="absolute inset-x-0 -bottom-1 h-3 filter blur-md bg-slate-300/20 rounded-full" />
                                          <img 
                                            src={secondPlace.avatar} 
                                            alt="" 
                                            className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-slate-300 bg-white/5 transition-transform duration-300 group-hover:scale-105"
                                            referrerPolicy="no-referrer"
                                          />
                                          {secondPlace.teamLogo && (
                                            <img 
                                              src={secondPlace.teamLogo} 
                                              alt={secondPlace.team} 
                                              className="absolute -bottom-1 -left-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full border border-white/10 shadow-lg object-cover"
                                              referrerPolicy="no-referrer"
                                            />
                                          )}
                                        </div>
                                        
                                        <span className="text-[10px] sm:text-xs font-black text-gray-400 text-center truncate w-full px-1">{secondPlace.name}</span>
                                        <span className="text-[9px] font-bold text-gray-500 mb-2 truncate w-full text-center">{secondPlace.team}</span>
                                        
                                        <div className="w-full h-16 sm:h-20 bg-gradient-to-t from-slate-300/10 via-slate-300/[0.03] to-transparent border-t border-x border-slate-300/20 rounded-t-xl flex flex-col items-center justify-center p-2 relative overflow-hidden">
                                          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-slate-300/40 to-transparent" />
                                          <span className="text-slate-300 font-extrabold text-[9px] sm:text-[10px] tracking-wider mb-0.5">المركز ٢</span>
                                          <div className="flex items-baseline gap-0.5 text-slate-300">
                                            <span className="text-sm sm:text-base font-black">{secondPlace.goals}</span>
                                            <span className="text-[8px] sm:text-[9px] font-bold text-slate-400">أهداف</span>
                                          </div>
                                        </div>
                                      </motion.div>
                                    )}

                                    {/* Rank 1 (Gold Cup) */}
                                    {firstPlace && (
                                      <motion.div
                                        initial={{ opacity: 0, y: 40 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.65, delay: 0.2, ease: 'easeOut' }}
                                        className="flex flex-col items-center group relative z-10 cursor-pointer"
                                      >
                                        <div className="relative mb-3">
                                          <div className="absolute inset-0 filter blur-xl bg-amber-500/15 rounded-full scale-110 animate-pulse" />
                                          <img 
                                            src={firstPlace.avatar} 
                                            alt="" 
                                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-amber-500 bg-white/5 transition-transform duration-300 group-hover:scale-105 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                                            referrerPolicy="no-referrer"
                                          />
                                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-black rounded-full p-1 border border-black shadow-lg">
                                            <Trophy size={11} className="animate-bounce" />
                                          </div>
                                          {firstPlace.teamLogo && (
                                            <img 
                                              src={firstPlace.teamLogo} 
                                              alt={firstPlace.team} 
                                              className="absolute -bottom-1 -left-1 w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-white/10 shadow-lg object-cover"
                                              referrerPolicy="no-referrer"
                                            />
                                          )}
                                        </div>
                                        
                                        <span className="text-xs sm:text-sm font-black text-amber-500 text-center truncate w-full px-1">{firstPlace.name}</span>
                                        <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 mb-2 truncate w-full text-center">{firstPlace.team}</span>
                                        
                                        <div className="w-full h-24 sm:h-28 bg-gradient-to-t from-amber-500/15 via-amber-500/[0.04] to-transparent border-t border-x border-amber-500/30 rounded-t-2xl flex flex-col items-center justify-center p-2 relative overflow-hidden shadow-[0_-5px_25px_rgba(245,158,11,0.04)]">
                                          <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
                                          <span className="text-amber-500 font-extrabold text-[10px] sm:text-xs tracking-wider mb-0.5">المركز ١</span>
                                          <div className="flex items-baseline gap-0.5 text-amber-400">
                                            <span className="text-base sm:text-xl font-black">{firstPlace.goals}</span>
                                            <span className="text-[8px] sm:text-[10px] font-black text-amber-500/70">أهداف</span>
                                          </div>
                                        </div>
                                      </motion.div>
                                    )}

                                    {/* Rank 3 (Bronze Cup) */}
                                    {thirdPlace && (
                                      <motion.div
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
                                        className="flex flex-col items-center group relative cursor-pointer"
                                      >
                                        <div className="relative mb-3">
                                          <div className="absolute inset-x-0 -bottom-1 h-3 filter blur-md bg-amber-800/20 rounded-full" />
                                          <img 
                                            src={thirdPlace.avatar} 
                                            alt="" 
                                            className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-amber-800 bg-white/5 transition-transform duration-300 group-hover:scale-105"
                                            referrerPolicy="no-referrer"
                                          />
                                          {thirdPlace.teamLogo && (
                                            <img 
                                              src={thirdPlace.teamLogo} 
                                              alt={thirdPlace.team} 
                                              className="absolute -bottom-1 -left-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full border border-white/10 shadow-lg object-cover"
                                              referrerPolicy="no-referrer"
                                            />
                                          )}
                                        </div>
                                        
                                        <span className="text-[10px] sm:text-xs font-black text-gray-400 text-center truncate w-full px-1">{thirdPlace.name}</span>
                                        <span className="text-[9px] font-bold text-gray-500 mb-2 truncate w-full text-center">{thirdPlace.team}</span>
                                        
                                        <div className="w-full h-12 sm:h-16 bg-gradient-to-t from-amber-800/10 via-amber-800/[0.03] to-transparent border-t border-x border-amber-800/20 rounded-t-xl flex flex-col items-center justify-center p-2 relative overflow-hidden">
                                          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-amber-800/40 to-transparent" />
                                          <span className="text-amber-700 font-extrabold text-[9px] sm:text-[10px] tracking-wider mb-0.5">المركز ٣</span>
                                          <div className="flex items-baseline gap-0.5 text-amber-700">
                                            <span className="text-sm sm:text-base font-black">{thirdPlace.goals}</span>
                                            <span className="text-[8px] sm:text-[9px] font-bold text-amber-800/60">أهداف</span>
                                          </div>
                                        </div>
                                      </motion.div>
                                    )}
                                  </div>

                                  {/* Header indicators */}
                                  <div className="flex items-center justify-between px-4 text-xs font-black text-gray-500 pt-2 pb-1 bg-white/[0.01] rounded-xl font-sans">
                                    <div className="flex items-center gap-4 flex-1">
                                      <span className="w-6 text-center">#</span>
                                      <span>اللاعب</span>
                                    </div>
                                    <div className="flex items-center gap-6 sm:gap-10 text-left">
                                      <span className="w-10 text-center">مباريات</span>
                                      <span className="w-10 text-center">صناعة</span>
                                      <span className="w-14 text-center text-primary font-black">الأهداف</span>
                                    </div>
                                  </div>

                                  {/* List of Scorers */}
                                  <div className="space-y-3">
                                    {scorersList.map((scorer, i) => {
                                      const goalPercentage = (scorer.goals / maxGoals) * 100;
                                      return (
                                        <motion.div
                                          key={scorer.name}
                                          initial={{ opacity: 0, x: -25 }}
                                          animate={{ opacity: 1, x: 0 }}
                                          transition={{ duration: 0.4, delay: i * 0.05 }}
                                          className="relative flex flex-col p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 hover:border-white/10 transition-all select-none group"
                                        >
                                          <div className="flex items-center justify-between z-10">
                                            <div className="flex items-center gap-3">
                                              {/* Rank Number */}
                                              <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs ${
                                                scorer.rank === 1 ? 'bg-amber-500 text-black shadow-[0_0_10px_rgba(245,158,11,0.2)]' :
                                                scorer.rank === 2 ? 'bg-slate-300 text-black' :
                                                scorer.rank === 3 ? 'bg-amber-800 text-white' :
                                                'bg-white/10 text-gray-400'
                                              }`}>
                                                {scorer.rank}
                                              </span>

                                              {/* Player Avatar & Team Emblem */}
                                              <div className="relative">
                                                <img 
                                                  src={scorer.avatar} 
                                                  alt="" 
                                                  className="w-10 h-10 rounded-xl object-cover bg-white/5 border border-white/10 group-hover:scale-105 transition-transform"
                                                  referrerPolicy="no-referrer"
                                                />
                                                {scorer.teamLogo && (
                                                  <img 
                                                    src={scorer.teamLogo} 
                                                    alt="" 
                                                    className="absolute -bottom-1 -left-1 w-4.5 h-4.5 rounded-full border border-black shadow"
                                                    referrerPolicy="no-referrer"
                                                  />
                                                )}
                                              </div>

                                              <div className="text-right">
                                                <h4 className="font-extrabold text-sm text-gray-200 group-hover:text-white transition-colors">
                                                  {scorer.name}
                                                </h4>
                                                <span className="text-[10px] font-bold text-gray-500 block mt-0.5">{scorer.team}</span>
                                              </div>
                                            </div>

                                            {/* Stats numeric metrics */}
                                            <div className="flex items-center gap-6 sm:gap-10 text-left font-black text-xs md:text-sm tabular-nums text-gray-300">
                                              <span className="w-10 text-center text-gray-400">{scorer.matches}</span>
                                              <span className="w-10 text-center text-gray-400">{scorer.assists}</span>
                                              <div className="bg-primary/10 group-hover:bg-primary/20 border border-primary/20 px-3 py-1 rounded-xl text-primary font-black text-xs sm:text-sm flex flex-col items-center justify-center min-w-14 transition-colors">
                                                <span className="text-[8px] font-black uppercase text-primary/60 leading-none mb-0.5 font-sans">هدف</span>
                                                <span>{scorer.goals}</span>
                                              </div>
                                            </div>
                                          </div>

                                          {/* Dominance visualization progress bar */}
                                          <div className="w-full h-1 bg-white/[0.04] rounded-full mt-3 overflow-hidden relative">
                                            <motion.div 
                                              initial={{ width: 0 }}
                                              animate={{ width: `${goalPercentage}%` }}
                                              transition={{ duration: 1, delay: i * 0.05, ease: 'easeOut' }}
                                              className="h-full bg-gradient-to-r from-primary via-primary/80 to-primary/40 rounded-full"
                                            />
                                          </div>
                                        </motion.div>
                                      );
                                    })}
                                  </div>
                                </>
                              );
                            })()}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {activeStatsTab === 'h2h' && renderedTabs.h2h && (
                    <H2HView match={match} />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>


        </div>

        <aside className="space-y-6">
          <div className="glass rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-gray-500 flex items-center gap-2">
              <Info size={16} /> معلومات إضافية
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                 <Radio size={16} className="text-primary" />
                 <span className="text-sm font-medium">المعلق: {match.commentator}</span>
              </div>
              <div className="flex items-center gap-3">
                 <Shield size={16} className="text-primary" />
                 <span className="text-sm font-medium">الحكم: دانييل أورساتو</span>
              </div>
              <div className="flex items-center gap-3">
                 <Activity size={16} className="text-primary" />
                 <span className="text-sm font-medium">الملعب: سانتياغو برنابيو</span>
              </div>
            </div>
          </div>

          <AIPrediction match={match} />
          <AdBanner slot="Match_Sidebar" />
        </aside>
      </div>
      <AnimatePresence>
        {showManageLinks && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-background border border-white/10 rounded-3xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-white">إدارة سيرفرات البث</h3>
                  <p className="text-xs text-gray-500 font-bold">أضف روابط مشاهدة مباشرة جديدة أو قم بتعديلها</p>
                </div>
                <button
                  onClick={() => setShowManageLinks(false)}
                  className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
                {editingLinks.map((link, idx) => (
                  <div key={idx} className="bg-white/5 border border-white/5 p-4 rounded-2xl relative group">
                    <button
                      onClick={() => setEditingLinks(prev => prev.filter((_, i) => i !== idx))}
                      className="absolute top-4 left-4 p-1.5 bg-red-500/10 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                    >
                      <Trash2 size={14} />
                    </button>
                    
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="text-[10px] font-black uppercase text-gray-500 mb-1 block">اسم السيرفر</label>
                        <input
                          type="text"
                          value={link.label}
                          onChange={e => {
                            const newLinks = [...editingLinks];
                            newLinks[idx] = { ...link, label: e.target.value };
                            setEditingLinks(newLinks);
                          }}
                          placeholder="مثال: سيرفر 1"
                          className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs font-bold text-white focus:neon-border outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-gray-500 mb-1 block">الجودة</label>
                        <input
                          type="text"
                          value={link.quality}
                          onChange={e => {
                            const newLinks = [...editingLinks];
                            newLinks[idx] = { ...link, quality: e.target.value };
                            setEditingLinks(newLinks);
                          }}
                          placeholder="مثال: 1080p"
                          className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs font-bold text-white focus:neon-border outline-none transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-gray-500 mb-1 block">رابط البث (m3u8)</label>
                      <input
                        type="url"
                        value={link.url}
                        onChange={e => {
                          const newLinks = [...editingLinks];
                          newLinks[idx] = { ...link, url: e.target.value };
                          setEditingLinks(newLinks);
                        }}
                        placeholder="https://..."
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs font-bold text-white focus:neon-border outline-none transition-all"
                      />
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => setEditingLinks(prev => [...prev, { label: `سيرفر ${prev.length + 1}`, url: '', quality: 'Auto' }])}
                  className="w-full py-4 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all group"
                >
                  <Plus size={24} className="group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-black">إضافة سيرفر جديد</span>
                </button>
              </div>

              <div className="p-6 border-t border-white/10 bg-black/20 flex gap-3">
                <button
                  onClick={handleSaveLinks}
                  disabled={isSavingLinks}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${
                    isSavingLinks 
                      ? 'bg-primary/50 text-black cursor-not-allowed' 
                      : 'bg-primary text-black hover:shadow-[0_0_20px_rgba(0,255,0,0.4)] hover:scale-[1.02] active:scale-95'
                  }`}
                >
                  {isSavingLinks ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                  {isSavingLinks ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
