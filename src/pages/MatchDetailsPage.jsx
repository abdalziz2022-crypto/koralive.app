import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { getMatchById, getLeagueStandings } from '../api/footballApi';
import { mapFootballDataResponse } from '../services/matchMapper';
import { mapMatchDetails } from '../services/matchDetailsMapper';
import { mapMatchStats } from '../services/statsMapper';
import { mapTimelineEvents } from '../services/timelineMapper';
import { mapMatchLineups } from '../services/lineupsMapper';
import { mapLeagueStandings } from '../services/standingsMapper';

// Subcomponents
import OverviewTab from '../components/match/OverviewTab';
import StatsTab from '../components/match/StatsTab';
import TimelineTab from '../components/match/TimelineTab';
import LineupsTab from '../components/match/LineupsTab';
import StandingsTab from '../components/match/StandingsTab';
import MatchDetailView from '../components/MatchDetailView';
import AdBanner from '../components/AdBanner';

import { 
  Trophy, Clock, MapPin, Users, ArrowLeft, RefreshCw, 
  Info, Calendar, Zap, AlertCircle, Sparkles, Award, Play, ChevronLeft, Shield, BarChart3, Tv
} from 'lucide-react';

export default function MatchDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [match, setMatch] = useState(null);
  const [matchDetailsData, setMatchDetailsData] = useState(null);
  const [matchStatsData, setMatchStatsData] = useState(null);
  const [matchTimelineData, setMatchTimelineData] = useState([]);
  const [matchLineupsData, setMatchLineupsData] = useState(null);
  const [matchStandingsData, setMatchStandingsData] = useState(null);
  const [activeTab, setActiveTab] = useState('Overview');

  const isFirestoreId = id && (isNaN(Number(id)) || id.length > 8);

  useEffect(() => {
    if (isFirestoreId) {
      return;
    }

    let isMounted = true;
    const fetchMatchDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const rawData = await getMatchById(id);
        if (!isMounted) return;

        if (rawData) {
          const mapped = mapFootballDataResponse(rawData);
          setMatch(mapped);
          
          const detailsMapped = mapMatchDetails(rawData);
          setMatchDetailsData(detailsMapped);

          const statsMapped = mapMatchStats(rawData);
          setMatchStatsData(statsMapped);

          const timelineMapped = mapTimelineEvents(rawData);
          setMatchTimelineData(timelineMapped);

          const lineupsMapped = mapMatchLineups(rawData);
          setMatchLineupsData(lineupsMapped);

          let rawStandings = null;
          if (rawData.competition?.id) {
            try {
              rawStandings = await getLeagueStandings(rawData.competition.id);
            } catch (errStandings) {
              console.warn('Real standings API fetch failed, resorting to premium fallback:', errStandings);
            }
          }
          const standingsMapped = mapLeagueStandings(rawStandings, mapped.homeTeam, mapped.awayTeam);
          setMatchStandingsData(standingsMapped);
        } else {
          throw new Error('لم يتم العثور على بيانات المباراة');
        }
      } catch (err) {
        console.error('Error fetching match details:', err);
        if (!isMounted) return;
        setError(err.message || 'فشل تحميل تفاصيل المباراة. يرجى المحاولة لاحقاً.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchMatchDetails();

    return () => {
      isMounted = false;
    };
  }, [id, isFirestoreId]);

  if (isFirestoreId) {
    return <MatchDetailView />;
  }

  const handleBack = () => {
    navigate(-1);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'LIVE':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-red-500/15 text-red-500 border border-red-500/30 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block"></span>
            مباشر الآن
          </span>
        );
      case 'PAUSED':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-amber-500/15 text-amber-500 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block"></span>
            استراحة الشوطين
          </span>
        );
      case 'FINISHED':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-slate-500/15 text-slate-400 border border-slate-500/35">
            مباراة منتهية
          </span>
        );
      case 'POSTPONED':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-yellow-500/15 text-yellow-500 border border-yellow-500/30">
            مؤجلة
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            مجدولة اليوم
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-[color:var(--color-text)] flex flex-col justify-center items-center p-6 space-y-4 pt-28">
        <div className="w-14 h-14 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-slate-400 text-sm font-black tracking-wide animate-pulse" style={{ direction: 'rtl' }}>جاري استخراج تفاصيل اللقاء المباشر...</p>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="min-h-screen bg-background text-[color:var(--color-text)] flex flex-col justify-center items-center p-6 pt-28 space-y-6">
        <div className="p-4 bg-red-500/10 border border-red-500/25 text-red-400 rounded-full max-w-sm flex items-center justify-center">
          <AlertCircle size={40} />
        </div>
        <div className="space-y-2 text-center max-w-md">
          <h3 className="text-lg font-black text-white">عذراً، حدث خطأ أثناء التحميل</h3>
          <p className="text-xs text-slate-400 leading-relaxed font-bold">
            {error || 'تعذر استرجاع أحداث المباراة. يرجى تجربة التحديث بعد قليل.'}
          </p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => window.location.reload()}
            className="flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-primary text-black font-black text-xs transition duration-300 hover:bg-primary/90"
          >
            <RefreshCw size={14} /> إعادة المحاولة
          </button>
          <button 
            onClick={handleBack}
            className="flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-surface border border-border text-[color:var(--color-text)] font-black text-xs transition duration-300"
          >
            <ArrowLeft size={14} /> العودة للخلف
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-[color:var(--color-text)] pb-28 pt-4 md:pt-6 selection:bg-primary/30 selection:text-primary">
      <div className="max-w-7xl mx-auto px-4 space-y-8" style={{ direction: 'rtl' }}>
        
        {/* Navigation Breadcrumb & Back bar */}
        <div className="flex items-center justify-between pb-2 border-b border-border/40 select-none">
          <button 
            onClick={handleBack}
            className="flex items-center gap-2 text-xs font-black text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={14} />
            <span>رجوع للجدول</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-white">{match.league || 'الدوري الممتاز'}</span>
            <Trophy size={14} className="text-primary" />
          </div>
        </div>

        {/* 🎬 PHASE 5: Premium SofaScore-inspired Header & Scoreboard */}
        <div className="relative overflow-hidden rounded-[28px] border border-border bg-gradient-to-br from-surface to-surface-hover p-6 md:p-8 shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 filter blur-3xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10 w-full">
            {/* Home Team */}
            <div className="flex flex-col items-center space-y-3 w-full md:w-1/3">
              <img 
                src={match.homeLogo} 
                alt={match.homeTeam} 
                className="w-16 h-16 md:w-20 md:h-20 object-contain filter drop-shadow hover:scale-105 transition-transform" 
                referrerPolicy="no-referrer"
              />
              <span className="text-sm md:text-base font-black text-white text-center">
                {match.homeTeam}
              </span>
              <span className="text-[10px] bg-white/5 px-2.5 py-1 rounded text-slate-400 font-extrabold uppercase">
                صاحب الأرض
              </span>
            </div>

            {/* Scoreboard Middle Details */}
            <div className="flex flex-col items-center justify-center space-y-4 w-full md:w-1/3 text-center">
              {getStatusBadge(match.status)}

              <div className="flex items-center gap-4">
                <span className="text-4xl md:text-5xl font-black text-white tracking-widest font-mono">
                  {match.homeScore ?? Number(match.score?.home ?? 0)}
                </span>
                <span className="text-slate-500 font-bold text-lg">:</span>
                <span className="text-4xl md:text-5xl font-black text-white tracking-widest font-mono">
                  {match.awayScore ?? Number(match.score?.away ?? 0)}
                </span>
              </div>

              <div className="text-xs text-slate-400 font-black flex items-center gap-1.5 justify-center">
                <Clock size={13} className="text-primary" />
                <span>
                  {match.startTime 
                    ? new Date(match.startTime).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) 
                    : '20:45'}
                </span>
                <span className="text-slate-600">|</span>
                <span>
                  {match.startTime 
                    ? new Date(match.startTime).toLocaleDateString('ar-SA', { weekday: 'long', month: 'short', day: 'numeric' }) 
                    : 'جدول اليوم'}
                </span>
              </div>
            </div>

            {/* Away Team */}
            <div className="flex flex-col items-center space-y-3 w-full md:w-1/3">
              <img 
                src={match.awayLogo} 
                alt={match.awayTeam} 
                className="w-16 h-16 md:w-20 md:h-20 object-contain filter drop-shadow hover:scale-105 transition-transform" 
                referrerPolicy="no-referrer"
              />
              <span className="text-sm md:text-base font-black text-white text-center">
                {match.awayTeam}
              </span>
              <span className="text-[10px] bg-white/5 px-2.5 py-1 rounded text-slate-400 font-extrabold uppercase">
                الفريق الضيف
              </span>
            </div>
          </div>
        </div>

        {/* Match stream players options link */}
        {match.streamingLinks && match.streamingLinks.length > 0 && (
          <section className="bg-primary/10 border border-primary/25 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 select-none">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary shrink-0">
                <Play size={18} className="fill-current" />
              </div>
              <div className="text-right space-y-1">
                <h4 className="text-sm font-black text-white">متوفر قنوات بث مباشر متعددة اللقاء الآن</h4>
                <p className="text-xs text-slate-400 font-bold">بث مباشر متطور بدون أي تقطيع وبصوت المعلم المفضل لديك.</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              {match.streamingLinks.map((link, idx) => (
                <a 
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-primary hover:bg-primary/95 text-black px-4 py-2.5 rounded-full text-xs font-black shadow-lg transition-transform hover:scale-105"
                >
                  {link.label || `سيرفر بث ${idx + 1}`} ({link.quality || '1080p'})
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Stadium Info, Referee & Commentator Widgets Bar */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
          <div className="bg-surface border border-border rounded-2xl p-4 flex items-center gap-3">
            <MapPin size={18} className="text-primary" />
            <div className="flex flex-col text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase">ملعب اللقاء</span>
              <span className="text-xs font-black text-white truncate w-40">{matchDetailsData?.venue || 'ملعب اللقاء الرئيسي الدولي'}</span>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-4 flex items-center gap-3">
            <Users size={18} className="text-primary" />
            <div className="flex flex-col text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase">حكم الساحة</span>
              <span className="text-xs font-black text-white">{matchDetailsData?.referee || 'حكم دولي معتمد'}</span>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-4 flex items-center gap-3">
            <Info size={18} className="text-primary" />
            <div className="flex flex-col text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase">المعلق الرياضي</span>
              <span className="text-xs font-black text-white">{match.commentator || 'عصام الشوالي'}</span>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-4 flex items-center gap-3">
            <Tv size={18} className="text-primary" />
            <div className="flex flex-col text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase">القناة الناقلة</span>
              <span className="text-xs font-black text-white">{match.channel || 'beIN Sports HD'}</span>
            </div>
          </div>
        </section>

        {/* 📑 PHASE 5: TABS NAVIGATION SEGMENT */}
        <div className="space-y-6">
          <div className="flex border-b border-border select-none overflow-x-auto gap-2 pb-px justify-center md:justify-start">
            {[
              { id: 'Overview', name: 'نظرة عامة', icon: Trophy },
              { id: 'Timeline', name: 'أحداث اللقاء', icon: Sparkles },
              { id: 'Stats', name: 'الإحصاءات الفنية', icon: BarChart3 },
              { id: 'Lineups', name: 'تشكيلة الفريقين', icon: Users },
              { id: 'Standings', name: 'ترتيب المجموعة', icon: Trophy }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-5 py-3 text-xs font-black border-b-2 transition-all shrink-0 cursor-pointer ${
                  activeTab === tab.id 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <tab.icon size={14} />
                <span>{tab.name}</span>
              </button>
            ))}
          </div>

          {/* Ad Banner between details tabs */}
          <div className="py-2.5">
            <AdBanner slot="Match_Under_Player" />
          </div>

          {/* TAB CONTENTS RENDERER WITH SMOOTH ANIMATIONS */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="min-h-[220px]"
            >
              {activeTab === 'Overview' && (
                <OverviewTab 
                  details={matchDetailsData} 
                  loading={loading}
                  error={error}
                />
              )}
              
              {activeTab === 'Timeline' && (
                <TimelineTab 
                  timelineEvents={matchTimelineData} 
                  loading={loading}
                  error={error}
                />
              )}

              {activeTab === 'Stats' && (
                <StatsTab 
                  stats={matchStatsData} 
                  loading={loading}
                  error={error}
                />
              )}

              {activeTab === 'Lineups' && (
                <LineupsTab 
                  lineups={matchLineupsData} 
                  loading={loading}
                  error={error}
                />
              )}

              {activeTab === 'Standings' && (
                <StandingsTab 
                  standings={matchStandingsData} 
                  loading={loading}
                  error={error}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
