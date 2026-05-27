import React from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, BarChart3, TrendingUp, Calendar, Trophy } from 'lucide-react';
import { Match } from '../types';

interface H2HViewProps {
  match: Match;
}

interface H2HMatch {
  date: string;
  competition: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  winner: 'home' | 'away' | 'draw';
}

// Generate high-fidelity previous encounters
function getPreviousEncounters(homeTeam: string, awayTeam: string): H2HMatch[] {
  let hash = 0;
  const combined = homeTeam + awayTeam;
  for (let i = 0; i < combined.length; i++) {
    hash = combined.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash);

  // A list of realistic competitions
  const competitions = ['الدوري الممتاز', 'كأس الملك', 'رابطة المحترفين', 'دوري أبطال أوروبا', 'كأس السوبر'];

  // Presets for El Clasico
  if ((homeTeam.includes('مدريد') && awayTeam.includes('برشلونة')) || (homeTeam.includes('برشلونة') && awayTeam.includes('مدريد'))) {
    const isRealHome = homeTeam.includes('مدريد');
    return [
      { date: '٢١ أبريل ٢٠٢٤', competition: 'الدوري الإسباني', homeTeam: isRealHome ? 'ريال مدريد' : 'برشلونة', awayTeam: isRealHome ? 'برشلونة' : 'ريال مدريد', homeScore: isRealHome ? 3 : 2, awayScore: isRealHome ? 2 : 3, winner: isRealHome ? 'home' : 'away' },
      { date: '١٤ يناير ٢٠٢٤', competition: 'كأس السوبر الإسباني', homeTeam: isRealHome ? 'ريال مدريد' : 'برشلونة', awayTeam: isRealHome ? 'برشلونة' : 'ريال مدريد', homeScore: isRealHome ? 4 : 1, awayScore: isRealHome ? 1 : 4, winner: isRealHome ? 'home' : 'away' },
      { date: '٢٨ أكتوبر ٢٠٢٣', competition: 'الدوري الإسباني', homeTeam: isRealHome ? 'برشلونة' : 'ريال مدريد', awayTeam: isRealHome ? 'ريال مدريد' : 'برشلونة', homeScore: isRealHome ? 1 : 2, awayScore: isRealHome ? 2 : 1, winner: isRealHome ? 'away' : 'home' },
      { date: '٥ أبريل ٢٠٢٣', competition: 'كأس ملك إسبانيا', homeTeam: isRealHome ? 'برشلونة' : 'ريال مدريد', awayTeam: isRealHome ? 'ريال مدريد' : 'برشلونة', homeScore: isRealHome ? 0 : 4, awayScore: isRealHome ? 4 : 0, winner: isRealHome ? 'away' : 'home' },
      { date: '١٩ مارس ٢٠٢٣', competition: 'الدوري الإسباني', homeTeam: isRealHome ? 'برشلونة' : 'ريال مدريد', awayTeam: isRealHome ? 'ريال مدريد' : 'برشلونة', homeScore: isRealHome ? 2 : 1, awayScore: isRealHome ? 1 : 2, winner: isRealHome ? 'home' : 'away' },
    ];
  }

  // Presets for Manchester Derby (City / United)
  if ((homeTeam.includes('سيتي') && awayTeam.includes('يونايتد')) || (homeTeam.includes('يونايتد') && awayTeam.includes('سيتي'))) {
    const isCityHome = homeTeam.includes('سيتي');
    return [
      { date: '٣ مارس ٢٠٢٤', competition: 'الدوري الإنجليزي الممتاز', homeTeam: isCityHome ? 'مانشستر سيتي' : 'مانشستر يونايتد', awayTeam: isCityHome ? 'مانشستر يونايتد' : 'مانشستر سيتي', homeScore: isCityHome ? 3 : 1, awayScore: isCityHome ? 1 : 3, winner: isCityHome ? 'home' : 'away' },
      { date: '٢٩ أكتوبر ٢٠٢٣', competition: 'الدوري الإنجليزي الممتاز', homeTeam: isCityHome ? 'مانشستر يونايتد' : 'مانشستر سيتي', awayTeam: isCityHome ? 'مانشستر سيتي' : 'مانشستر يونايتد', homeScore: isCityHome ? 0 : 3, awayScore: isCityHome ? 3 : 0, winner: isCityHome ? 'away' : 'home' },
      { date: '٣ يونيو ٢٠٢٣', competition: 'كأس الاتحاد الإنجليزي', homeTeam: isCityHome ? 'مانشستر سيتي' : 'مانشستر يونايتد', awayTeam: isCityHome ? 'مانشستر يونايتد' : 'مانشستر سيتي', homeScore: isCityHome ? 2 : 1, awayScore: isCityHome ? 1 : 2, winner: isCityHome ? 'home' : 'away' },
      { date: '١٤ يناير ٢٠٢٣', competition: 'الدوري الإنجليزي الممتاز', homeTeam: isCityHome ? 'مانشستر يونايتد' : 'مانشستر سيتي', awayTeam: isCityHome ? 'مانشستر سيتي' : 'مانشستر يونايتد', homeScore: isCityHome ? 2 : 1, awayScore: isCityHome ? 1 : 2, winner: isCityHome ? 'home' : 'away' },
      { date: '٢ أكتوبر ٢٠٢٢', competition: 'الدوري الإنجليزي الممتاز', homeTeam: isCityHome ? 'مانشستر سيتي' : 'مانشستر يونايتد', awayTeam: isCityHome ? 'مانشستر يونايتد' : 'مانشستر سيتي', homeScore: isCityHome ? 6 : 3, awayScore: isCityHome ? 3 : 6, winner: isCityHome ? 'home' : 'away' },
    ];
  }

  // Deterministically generate matches
  const results: H2HMatch[] = [];
  const startYears = [2024, 2023, 2023, 2022, 2022];
  const months = ['أكتوبر', 'نوفمبر', 'ديسمبر', 'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو'];

  for (let i = 0; i < 5; i++) {
    const compIdx = (hash + i) % competitions.length;
    const year = startYears[i];
    const month = months[(hash * (i + 1)) % months.length];
    const day = 1 + ((hash + i * 7) % 28);
    
    // Deteriministic scores
    const homeScore = (hash + i * 3) % 4;
    const awayScore = (hash + i * 2) % 3;

    let winner: 'home' | 'away' | 'draw' = 'draw';
    if (homeScore > awayScore) winner = 'home';
    if (awayScore > homeScore) winner = 'away';

    // Randomize who was home and away for variety
    const isSwapped = (hash + i) % 2 === 1;

    results.push({
      date: `${day} ${month} ${year}`,
      competition: competitions[compIdx],
      homeTeam: isSwapped ? awayTeam : homeTeam,
      awayTeam: isSwapped ? homeTeam : awayTeam,
      homeScore: isSwapped ? awayScore : homeScore,
      awayScore: isSwapped ? homeScore : awayScore,
      winner: isSwapped 
        ? (winner === 'home' ? 'away' : winner === 'away' ? 'home' : 'draw')
        : winner
    });
  }

  return results;
}

export default function H2HView({ match }: H2HViewProps) {
  const previousEncounters = React.useMemo(() => {
    return getPreviousEncounters(match.homeTeam, match.awayTeam);
  }, [match.homeTeam, match.awayTeam]);

  // Compute summary metrics based on matches list
  const statsSummary = React.useMemo(() => {
    let homeWins = 0;
    let awayWins = 0;
    let draws = 0;
    let totalGoals = 0;

    previousEncounters.forEach(m => {
      totalGoals += m.homeScore + m.awayScore;
      
      const isHomeTeamActualHome = m.homeTeam === match.homeTeam;
      if (m.winner === 'draw') {
        draws++;
      } else if (m.winner === 'home') {
        if (isHomeTeamActualHome) homeWins++;
        else awayWins++;
      } else {
        if (isHomeTeamActualHome) awayWins++;
        else homeWins++;
      }
    });

    const averageGoals = totalGoals / previousEncounters.length;
    const totalCount = previousEncounters.length;

    const homeWinPercent = Math.round((homeWins / totalCount) * 100);
    const awayWinPercent = Math.round((awayWins / totalCount) * 100);
    const drawPercent = 100 - homeWinPercent - awayWinPercent;

    return {
      homeWins,
      awayWins,
      draws,
      averageGoals: averageGoals.toFixed(1),
      homeWinPercent,
      awayWinPercent,
      drawPercent
    };
  }, [previousEncounters, match.homeTeam, match.awayTeam]);

  return (
    <div className="space-y-6 pt-2" style={{ direction: 'rtl' }}>
      {/* Title & Badge header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="text-secondary animate-pulse" size={18} />
          <h3 className="text-sm font-black text-white">تاريخ المواجهات المباشرة (H2H)</h3>
        </div>
        <span className="text-[10px] text-gray-400 font-extrabold bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
          آخر {previousEncounters.length} لقاءات
        </span>
      </div>

      {/* Probabilities / Wins Indicator Bar */}
      <div className="bg-white/[0.01] border border-white/5 p-4 rounded-2xl space-y-3.5">
        <div className="flex items-center justify-between text-xs font-black">
          <span className="text-primary">{match.homeTeam} ({statsSummary.homeWins} فوز)</span>
          <span className="text-gray-400">التعادلات ({statsSummary.draws})</span>
          <span className="text-secondary">({statsSummary.awayWins} فوز) {match.awayTeam}</span>
        </div>

        {/* Dynamic percentage layout slider */}
        <div className="h-3 bg-white/5 rounded-full overflow-hidden flex gap-1 shadow-inner">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${statsSummary.homeWinPercent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="bg-primary h-full rounded-r-full select-none flex items-center justify-center text-[7px] text-black font-extrabold"
            title={`${statsSummary.homeWinPercent}%`}
          />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${statsSummary.drawPercent}%` }}
            transition={{ duration: 0.8, delay: 0.1, ease: 'easeOut' }}
            className="bg-gray-600 h-full select-none flex items-center justify-center text-[7px] text-white font-extrabold"
            title={`${statsSummary.drawPercent}%`}
          />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${statsSummary.awayWinPercent}%` }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
            className="bg-secondary h-full rounded-l-full select-none flex items-center justify-center text-[7px] text-black font-extrabold"
            title={`${statsSummary.awayWinPercent}%`}
          />
        </div>

        {/* Quick details */}
        <div className="grid grid-cols-2 gap-3 text-center pt-2">
          <div className="bg-white/[0.01] border border-white/5 p-3 rounded-xl">
            <span className="block text-[10px] text-gray-500 font-bold mb-0.5">معدل الأهداف في اللقاء</span>
            <span className="text-sm font-black text-white font-mono">{statsSummary.averageGoals}</span>
          </div>
          <div className="bg-white/[0.01] border border-white/5 p-3 rounded-xl">
            <span className="block text-[10px] text-gray-500 font-bold mb-0.5">نسبة التفوق للأرض</span>
            <span className="text-sm font-black text-white font-mono">
              {Math.max(statsSummary.homeWinPercent, statsSummary.awayWinPercent)}%
            </span>
          </div>
        </div>
      </div>

      {/* List of encounters */}
      <div className="space-y-3">
        <h4 className="text-xs font-black text-gray-400 px-1">مباريات سابقة بالتفصيل</h4>
        
        <div className="space-y-2.5">
          {previousEncounters.map((enc, idx) => {
            const isHomeWinner = enc.winner === 'home';
            const isAwayWinner = enc.winner === 'away';
            const isDraw = enc.winner === 'draw';

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                className="bg-white/[0.02] border border-white/5 hover:border-white/10 p-3.5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3.5 transition-all duration-300"
              >
                {/* Info and date */}
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-[11px] font-sans">
                    ⚽
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 font-black flex items-center gap-1">
                      <Calendar size={10} /> {enc.date}
                    </span>
                    <span className="text-xs font-black text-white block mt-0.5">{enc.competition}</span>
                  </div>
                </div>

                {/* Main teams and Score results */}
                <div className="flex items-center gap-4 justify-center flex-1 w-full max-w-[340px] px-2 font-sans">
                  {/* Home Team */}
                  <span className={`text-xs font-black text-left flex-1 truncate ${
                    enc.homeTeam === match.homeTeam ? 'text-primary' : 'text-gray-300'
                  }`}>
                    {enc.homeTeam}
                  </span>

                  {/* Scoreboard badge structure */}
                  <div className="flex items-center gap-2 bg-[#090f19] border border-white/5 px-3 py-1.5 rounded-xl font-bold font-mono">
                    <span className={`text-xs ${isHomeWinner ? 'text-emerald-400 font-extrabold' : 'text-gray-400'}`}>
                      {enc.homeScore}
                    </span>
                    <span className="text-gray-600 text-[10px] font-black">:</span>
                    <span className={`text-xs ${isAwayWinner ? 'text-emerald-400 font-extrabold' : 'text-gray-400'}`}>
                      {enc.awayScore}
                    </span>
                  </div>

                  {/* Away Team */}
                  <span className={`text-xs font-black text-right flex-1 truncate ${
                    enc.awayTeam === match.homeTeam ? 'text-primary' : 'text-gray-300'
                  }`}>
                    {enc.awayTeam}
                  </span>
                </div>

                {/* Match Outcome Badge */}
                <div className="w-full sm:w-[90px] text-center">
                  <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md inline-block border ${
                    isDraw 
                      ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/15'
                      : (enc.winner === 'home' && enc.homeTeam === match.homeTeam) || 
                        (enc.winner === 'away' && enc.awayTeam === match.homeTeam)
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/15'
                        : 'bg-red-500/10 text-red-400 border-red-500/15'
                  }`}>
                    {isDraw 
                      ? 'تعادل مستحق' 
                      : (enc.winner === 'home' && enc.homeTeam === match.homeTeam) || 
                        (enc.winner === 'away' && enc.awayTeam === match.homeTeam)
                        ? `فوز ${match.homeTeam}`
                        : `فوز ${match.awayTeam}`
                    }
                  </span>
                </div>

              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
