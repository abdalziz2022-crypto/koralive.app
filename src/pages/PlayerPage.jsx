import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPlayerById, getPlayerMatches, getPlayerStats } from '../api/playerApi';
import { mapPlayerHeader, mapPlayerInfo, mapPlayerStats, mapPlayerMatches } from '../services/playerMapper';
import { motion } from 'motion/react';
import { AlertCircle, RefreshCw, ChevronRight, User } from 'lucide-react';

// Components imports
import PlayerHeader from '../components/player/PlayerHeader';
import PlayerInfoCard from '../components/player/PlayerInfoCard';
import PlayerStatsCard from '../components/player/PlayerStatsCard';
import PlayerMatchesSection from '../components/player/PlayerMatchesSection';
import PlayerPerformanceChart from '../components/player/PlayerPerformanceChart';
import PlayerStatisticsTab from '../components/player/PlayerStatisticsTab';
import HomeHeader from '../components/home/HomeHeader';

export default function PlayerPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'stats'

  const [headerInfo, setHeaderInfo] = useState(null);
  const [playerBiog, setPlayerBiog] = useState(null);
  const [playerStats, setPlayerStats] = useState(null);
  const [playerMatches, setPlayerMatches] = useState([]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const decodedId = decodeURIComponent(id || '').trim();
      if (!decodedId) {
        throw new Error('معرف اللاعب غير صالح.');
      }

      // Fetch basic details
      const rawPlayer = await getPlayerById(decodedId);
      if (!rawPlayer) {
        throw new Error('لم نعثر على بيانات هذا اللاعب كوار لايف.');
      }

      // Fetch matches and stats
      const rawMatches = await getPlayerMatches(decodedId);
      const rawStats = await getPlayerStats(decodedId);

      // Perform mapping securely
      setHeaderInfo(mapPlayerHeader(rawPlayer));
      setPlayerBiog(mapPlayerInfo(rawPlayer));
      setPlayerStats(mapPlayerStats(rawStats));
      setPlayerMatches(mapPlayerMatches(rawMatches));

    } catch (err) {
      console.error('Error loading player details:', err);
      setError(err.message || 'فشل تحميل بيانات اللاعب. يرجى التحقق من اتصال الشبكة.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  // Premium Loading State Loader
  if (loading) {
    return (
      <div className="min-h-screen bg-[#070c16] text-gray-100 pb-20">
        <HomeHeader />
        <div className="max-w-7xl mx-auto px-4 pt-6 space-y-6 animate-pulse" style={{ direction: 'rtl' }}>
          {/* Header Skeleton card */}
          <div className="h-44 bg-white/5 rounded-[32px] border border-white/5" />
          
          {/* Triple Layout style */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Matches List Skeleton column (Left - 2/3 cols) */}
            <div className="lg:col-span-2 space-y-4">
              <div className="h-10 bg-white/5 rounded-2xl w-1/3" />
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 animate-pulse">
                {[1, 2, 3, 4].map(idx => (
                  <div key={idx} className="h-32 bg-white/5 rounded-[24px] border border-white/5" />
                ))}
              </div>
            </div>

            {/* Right col (bio / stats cards) */}
            <div className="space-y-6">
              <div className="h-56 bg-white/5 rounded-[32px]" />
              <div className="h-64 bg-white/5 rounded-[32px]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error Content Layout
  if (error || !headerInfo) {
    return (
      <div className="min-h-screen bg-[#070c16] text-gray-100 pb-20 flex flex-col">
        <HomeHeader />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900/50 border border-white/5 p-8 rounded-[32px] text-center space-y-5" style={{ direction: 'rtl' }}>
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto animate-bounce" />
            <h2 className="text-lg font-black text-white">خطأ في جلب بيانات اللاعب</h2>
            <p className="text-xs text-gray-400 font-bold leading-normal">{error || 'الملف الشخصي غير متاح حالياً.'}</p>
            
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={loadData}
                className="flex-1 py-3 bg-primary/20 border border-primary/30 hover:bg-primary/30 text-primary rounded-2xl text-xs font-black cursor-pointer transition-all flex items-center justify-center gap-1.5"
              >
                <RefreshCw size={14} />
                <span>إعادة تحميل</span>
              </button>
              <button
                onClick={() => navigate('/')}
                className="flex-1 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 rounded-2xl text-xs font-black cursor-pointer transition-all flex items-center justify-center gap-1.5"
              >
                <ChevronRight size={14} />
                <span>الرئيسية</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-[color:var(--color-text)] pb-20 transition-colors duration-300 selection:bg-primary/20">
      {/* Universal header */}
      <HomeHeader />

      {/* Main container */}
      <main className="max-w-7xl mx-auto px-4 pt-6 space-y-6">
        
        {/* Dynamic header Banner */}
        <PlayerHeader header={headerInfo} />

        {/* Tabs Bar */}
        <div className="flex border-b border-white/5 space-x-reverse space-x-6 pb-2 select-none" style={{ direction: 'rtl' }}>
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2.5 text-xs sm:text-sm font-black transition-all border-b-2 relative cursor-pointer ${
              activeTab === 'overview' 
                ? 'border-emerald-500 text-white' 
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            الملخص والمباريات
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`pb-2.5 text-xs sm:text-sm font-black transition-all border-b-2 relative cursor-pointer ${
              activeTab === 'stats' 
                ? 'border-emerald-500 text-white' 
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            إحصائيات اللاعبين (الرسوم البيانية)
          </button>
        </div>

        {/* Dynamic info columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Matches column (Left/Center - 2/3 wide) */}
          <div className="lg:col-span-2 space-y-6">
            {activeTab === 'overview' ? (
              <>
                <PlayerPerformanceChart player={{ name: headerInfo.name, position: headerInfo.position, stats: playerStats }} />
                <PlayerMatchesSection matches={playerMatches} />
              </>
            ) : (
              <PlayerStatisticsTab player={headerInfo} stats={playerStats} />
            )}
          </div>

          {/* Biography details & active statistics column (Right - 1/3 wide) */}
          <div className="space-y-6">
            {/* Bio info list */}
            <PlayerInfoCard info={playerBiog} />

            {/* Performance Stats list */}
            <PlayerStatsCard stats={playerStats} />
          </div>

        </div>
      </main>
    </div>
  );
}
