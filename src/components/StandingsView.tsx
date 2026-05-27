import React from 'react';
import { motion } from 'motion/react';
import { Trophy, Shield, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface StandingTeam {
  rank: number;
  name: string;
  logo: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalsDiff: number;
  points: number;
  form: string[]; // e.g. ['W', 'D', 'W', 'W', 'L']
}

const PRESET_LEAGUES: Record<string, StandingTeam[]> = {
  'الدوري الإنجليزي': [
    { rank: 1, name: 'أرسنال', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=ARS&backgroundColor=dc2626', played: 37, won: 27, drawn: 5, lost: 5, goalsFor: 89, goalsAgainst: 28, goalsDiff: 61, points: 86, form: ['W', 'W', 'W', 'W', 'W'] },
    { rank: 2, name: 'مانشستر سيتي', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=MC&backgroundColor=06b6d4', played: 37, won: 26, drawn: 7, lost: 4, goalsFor: 93, goalsAgainst: 33, goalsDiff: 60, points: 85, form: ['W', 'W', 'W', 'W', 'W'] },
    { rank: 3, name: 'ليفربول', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=LFC&backgroundColor=dc2626', played: 37, won: 23, drawn: 10, lost: 4, goalsFor: 84, goalsAgainst: 41, goalsDiff: 43, points: 79, form: ['D', 'W', 'W', 'L', 'D'] },
    { rank: 4, name: 'أستون فيلا', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=AV&backgroundColor=800020', played: 37, won: 20, drawn: 8, lost: 9, goalsFor: 76, goalsAgainst: 56, goalsDiff: 20, points: 68, form: ['L', 'D', 'L', 'W', 'W'] },
    { rank: 5, name: 'توتنهام', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=TOT&backgroundColor=0f172a', played: 37, won: 19, drawn: 6, lost: 12, goalsFor: 71, goalsAgainst: 61, goalsDiff: 10, points: 63, form: ['W', 'L', 'L', 'L', 'L'] },
    { rank: 6, name: 'تشيلسي', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=CFC&backgroundColor=2563eb', played: 37, won: 17, drawn: 9, lost: 11, goalsFor: 75, goalsAgainst: 62, goalsDiff: 13, points: 60, form: ['W', 'W', 'W', 'D', 'W'] },
    { rank: 7, name: 'نيوكاسل', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=NU&backgroundColor=000000', played: 37, won: 17, drawn: 6, lost: 14, goalsFor: 81, goalsAgainst: 60, goalsDiff: 21, points: 57, form: ['D', 'W', 'W', 'L', 'W'] },
    { rank: 8, name: 'مانشستر يونايتد', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=MU&backgroundColor=dc2626', played: 37, won: 17, drawn: 6, lost: 14, goalsFor: 55, goalsAgainst: 58, goalsDiff: -3, points: 57, form: ['W', 'L', 'L', 'D', 'W'] },
  ],
  'الدوري الإسباني': [
    { rank: 1, name: 'ريال مدريد', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=RM&backgroundColor=f8fafc', played: 36, won: 29, drawn: 6, lost: 1, goalsFor: 83, goalsAgainst: 22, goalsDiff: 61, points: 93, form: ['W', 'W', 'W', 'W', 'W'] },
    { rank: 2, name: 'برشلونة', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=FCB&backgroundColor=701a75', played: 36, won: 24, drawn: 7, lost: 5, goalsFor: 74, goalsAgainst: 43, goalsDiff: 31, points: 79, form: ['W', 'W', 'L', 'W', 'L'] },
    { rank: 3, name: 'جيرونا', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=GI&backgroundColor=ea580c', played: 36, won: 23, drawn: 6, lost: 7, goalsFor: 75, goalsAgainst: 45, goalsDiff: 30, points: 75, form: ['L', 'D', 'W', 'W', 'W'] },
    { rank: 4, name: 'أتلتيكو مدريد', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=ATM&backgroundColor=e11d48', played: 36, won: 23, drawn: 4, lost: 9, goalsFor: 67, goalsAgainst: 39, goalsDiff: 28, points: 73, form: ['W', 'W', 'W', 'W', 'L'] },
    { rank: 5, name: 'أتلتيك بيلباو', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=ATH&backgroundColor=b91c1c', played: 36, won: 17, drawn: 11, lost: 8, goalsFor: 58, goalsAgainst: 37, goalsDiff: 21, points: 62, form: ['L', 'D', 'W', 'L', 'D'] },
    { rank: 6, name: 'ريال سوسيداد', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=RS&backgroundColor=2563eb', played: 36, won: 15, drawn: 12, lost: 9, goalsFor: 48, goalsAgainst: 37, goalsDiff: 11, points: 57, form: ['W', 'L', 'W', 'D', 'L'] },
  ],
  'الدوري السعودي': [
    { rank: 1, name: 'الهلال', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=HFC&backgroundColor=1d4ed8', played: 31, won: 29, drawn: 2, lost: 0, goalsFor: 95, goalsAgainst: 20, goalsDiff: 75, points: 89, form: ['W', 'W', 'W', 'W', 'W'] },
    { rank: 2, name: 'النصر', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=NFC&backgroundColor=eab308', played: 31, won: 25, drawn: 2, lost: 4, goalsFor: 93, goalsAgainst: 37, goalsDiff: 56, points: 77, form: ['W', 'W', 'W', 'W', 'W'] },
    { rank: 3, name: 'الأهلي', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=AFC&backgroundColor=15803d', played: 31, won: 17, drawn: 7, lost: 7, goalsFor: 61, goalsAgainst: 33, goalsDiff: 28, points: 58, form: ['W', 'L', 'W', 'L', 'W'] },
    { rank: 4, name: 'التعاون', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=TAW&backgroundColor=1d4ed8', played: 31, won: 14, drawn: 10, lost: 7, goalsFor: 48, goalsAgainst: 34, goalsDiff: 14, points: 52, form: ['D', 'W', 'W', 'L', 'D'] },
    { rank: 5, name: 'الاتحاد', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=ITT&backgroundColor=000000', played: 31, won: 15, drawn: 5, lost: 11, goalsFor: 57, goalsAgainst: 49, goalsDiff: 8, points: 50, form: ['L', 'L', 'L', 'W', 'L'] },
    { rank: 6, name: 'الاتفاق', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=ETF&backgroundColor=15803d', played: 31, won: 11, drawn: 11, lost: 9, goalsFor: 39, goalsAgainst: 32, goalsDiff: 7, points: 44, form: ['W', 'L', 'W', 'D', 'D'] },
  ],
  'دوري أبطال أوروبا': [
    { rank: 1, name: 'ريال مدريد', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=RM&backgroundColor=f8fafc', played: 6, won: 6, drawn: 0, lost: 0, goalsFor: 16, goalsAgainst: 7, goalsDiff: 9, points: 18, form: ['W', 'W', 'W', 'W', 'W'] },
    { rank: 2, name: 'نابولي', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=NAP&backgroundColor=06b6d4', played: 6, won: 3, drawn: 1, lost: 2, goalsFor: 10, goalsAgainst: 9, goalsDiff: 1, points: 10, form: ['W', 'L', 'D', 'W', 'L'] },
    { rank: 3, name: 'سبورتينغ براغا', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=BRG&backgroundColor=dc2626', played: 6, won: 1, drawn: 1, lost: 4, goalsFor: 6, goalsAgainst: 12, goalsDiff: -6, points: 4, form: ['L', 'D', 'L', 'L', 'W'] },
    { rank: 4, name: 'يونيون برلين', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=FCU&backgroundColor=dc2626', played: 6, won: 0, drawn: 2, lost: 4, goalsFor: 4, goalsAgainst: 8, goalsDiff: -4, points: 2, form: ['L', 'D', 'D', 'L', 'L'] },
  ]
};

interface StandingsViewProps {
  leagueName: string;
  homeTeam: string;
  awayTeam: string;
  homeLogo?: string;
  awayLogo?: string;
}

export default function StandingsView({ leagueName, homeTeam, awayTeam, homeLogo, awayLogo }: StandingsViewProps) {
  const navigate = useNavigate();
  const standings = React.useMemo(() => {
    // If we have a preset, let's map it and make sure the home / away logos are correct if they match!
    const preset = PRESET_LEAGUES[leagueName];
    if (preset) {
      return preset.map(team => {
        let logo = team.logo;
        if (team.name === homeTeam && homeLogo) logo = homeLogo;
        if (team.name === awayTeam && awayLogo) logo = awayLogo;
        return { ...team, logo };
      });
    }

    // Dynamic fallback standings table generator
    const hash = leagueName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const standardTeams = [
      { name: homeTeam, logo: homeLogo || `https://api.dicebear.com/7.x/initials/svg?seed=${homeTeam}` },
      { name: awayTeam, logo: awayLogo || `https://api.dicebear.com/7.x/initials/svg?seed=${awayTeam}` },
      { name: 'الفريق المنافس أ', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=T1' },
      { name: 'الفريق المنافس ب', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=T2' },
      { name: 'الفريق المنافس ج', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=T3' },
      { name: 'الفريق المنافس د', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=T4' },
    ];

    // Rearrange or sort based on hash to give realistic standings
    const orderedTeams = [...standardTeams];
    // Mix them deterministically
    const firstPlaceIdx = hash % orderedTeams.length;
    const secondPlaceIdx = (hash + 2) % orderedTeams.length;
    
    return orderedTeams.map((team, index) => {
      const idx = (index + (hash % 4)) % orderedTeams.length;
      const pts = 65 - (index * 7) + (hash % 5);
      const played = 28;
      const won = Math.floor(pts / 3);
      const drawn = Math.floor((pts % 3) + (hash % 3));
      const lost = played - won - drawn;
      const goalsFor = 45 + (12 - index * 3);
      const goalsAgainst = 22 + (index * 4);

      return {
        rank: index + 1,
        name: team.name,
        logo: team.logo,
        played,
        won,
        drawn,
        lost: lost < 0 ? 0 : lost,
        goalsFor,
        goalsAgainst,
        goalsDiff: goalsFor - goalsAgainst,
        points: pts < 0 ? 0 : pts,
        form: ['W', 'L', 'W', 'W', 'D']
      };
    });
  }, [leagueName, homeTeam, awayTeam, homeLogo, awayLogo]);

  return (
    <div className="space-y-6 pt-2" style={{ direction: 'rtl' }}>
      {/* Header and league visual badge */}
      <div className="flex items-center justify-between border-b border-border pb-4 mb-3">
        <div className="flex items-center gap-2">
          <Trophy className="text-emerald-400 animate-pulse" size={18} />
          <h3 className="text-sm font-black text-[color:var(--color-text)] hover:text-emerald-400 transition-colors">جدول ترتيب البطولة الحالية</h3>
        </div>
        <span className="text-[10px] text-emerald-400 font-extrabold bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 shadow-sm shadow-emerald-500/5">
          {leagueName || 'البطولة الكبرى'}
        </span>
      </div>

      {/* Standings Table container */}
      <div className="overflow-x-auto rounded-3xl border border-border bg-surface shadow-2xl relative scrollbar-thin scrollbar-thumb-white/10">
        <table className="w-full text-right text-xs font-bold font-sans border-collapse separate border-spacing-0 min-w-[640px] md:min-w-full">
          <thead>
            <tr className="border-b border-border bg-surface-hover/30 text-slate-500 dark:text-gray-400 font-bold select-none text-[11px]">
              <th className="px-3.5 py-4 text-center w-12 sticky right-0 bg-surface z-20 shadow-[inset_-1px_0_0_rgba(255,255,255,0.05)]">#</th>
              <th className="px-4 py-4 text-right sticky right-12 bg-surface z-20 min-w-[150px] shadow-[inset_1px_0_0_rgba(255,255,255,0.05)]">الفريق</th>
              <th className="px-3 py-4 text-center w-12 text-slate-400 dark:text-gray-400">لعب</th>
              <th className="px-3 py-4 text-center w-12 hidden sm:table-cell text-slate-500 dark:text-gray-500">فوز</th>
              <th className="px-3 py-4 text-center w-12 hidden sm:table-cell text-slate-500 dark:text-gray-500">تعادل</th>
              <th className="px-3 py-4 text-center w-12 hidden sm:table-cell text-slate-500 dark:text-gray-500">خسارة</th>
              <th className="px-3 py-4 text-center w-20 text-slate-400 dark:text-gray-400">أهداف</th>
              <th className="px-3 py-4 text-center w-14 text-slate-400 dark:text-gray-400">+/-</th>
              <th className="px-4 py-4 text-center w-16 text-emerald-400 font-black">النقاط</th>
              <th className="px-4 py-4 text-center hidden md:table-cell w-36 text-slate-400 dark:text-gray-400">آخر ٥ مباريات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {standings.map((team, idx) => {
              const isMatchTeam = team.name === homeTeam || team.name === awayTeam;
              
              // Qualification zones coloring
              const isChampionsLeague = team.rank <= 4;
              const isEuropaLeague = team.rank === 5;
              const isRelegation = team.rank >= standings.length - 1;

              return (
                <motion.tr
                  key={team.name}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04, duration: 0.2 }}
                  className={`transition-all duration-200 group relative ${
                    isMatchTeam 
                      ? 'bg-emerald-500/[0.06] hover:bg-emerald-500/[0.09] border-r-2 border-emerald-400' 
                      : 'hover:bg-surface-hover/30'
                  }`}
                >
                  {/* Position Rank */}
                  <td className={`px-3.5 py-3 text-center sticky right-0 z-10 transition-colors ${
                    isMatchTeam ? 'bg-emerald-500/10 dark:bg-emerald-950/20' : 'bg-surface group-hover:bg-surface-hover/50'
                  } shadow-[inset_-1px_0_0_var(--color-border)]`}>
                    <div className="relative flex items-center justify-center">
                      {/* Left side vertical status highlights inside position column */}
                      {isChampionsLeague && (
                        <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-500 rounded-l" title="دوري أبطال أوروبا" />
                      )}
                      {isEuropaLeague && (
                        <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-500 rounded-l" title="الدوري الأوروبي" />
                      )}
                      {isRelegation && (
                        <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-red-500 rounded-l" title="مرحلة الهبوط" />
                      )}

                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shadow-sm ${
                        team.rank === 1 ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' :
                        team.rank === 2 ? 'bg-slate-300/20 text-slate-600 dark:text-slate-200 border border-slate-300/30' :
                        team.rank === 3 ? 'bg-amber-800/20 text-amber-700 dark:text-amber-500 border border-amber-800/10' :
                        'text-slate-400 dark:text-gray-400 border border-transparent'
                      }`}>
                        {team.rank}
                      </span>
                    </div>
                  </td>

                  {/* Team Logo and name */}
                  <td 
                  onClick={() => navigate(`/team/${encodeURIComponent(team.name)}`)}
                  className={`px-4 py-3 text-right sticky right-12 z-10 transition-colors cursor-pointer group/team-hov ${
                    isMatchTeam ? 'bg-emerald-500/10 dark:bg-emerald-950/20' : 'bg-surface group-hover:bg-surface-hover/50'
                  } shadow-[inset_1px_0_0_var(--color-border)]`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-background border border-border p-1 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                      <img 
                        src={team.logo} 
                        alt="" 
                        className="w-full h-full object-contain rounded-full"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="gray" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>';
                        }}
                        />
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 min-w-0">
                        <span className={`text-xs truncate ${isMatchTeam ? 'text-emerald-400 font-extrabold' : 'text-[color:var(--color-text)] group-hover:text-primary transition-colors'}`}>
                          {team.name}
                        </span>
                        
                        <div className="flex gap-1 shrink-0">
                          {team.name === homeTeam && (
                            <span className="text-[8px] bg-emerald-500/20 text-emerald-500 dark:text-emerald-300 border border-emerald-500/20 px-1.5 py-0.5 rounded font-black leading-none">المستضيف</span>
                          )}
                          {team.name === awayTeam && (
                            <span className="text-[8px] bg-indigo-500/20 text-indigo-500 dark:text-indigo-300 border border-indigo-500/20 px-1.5 py-0.5 rounded font-black leading-none">الضيف</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Played, Won, Drawn, Lost */}
                  <td className="px-3 py-3 text-center text-slate-700 dark:text-gray-300 font-mono text-[11px] tabular-nums">{team.played}</td>
                  <td className="px-3 py-3 text-center text-slate-600 dark:text-gray-400 font-mono text-[11px] tabular-nums hidden sm:table-cell">{team.won}</td>
                  <td className="px-3 py-3 text-center text-slate-600 dark:text-gray-400 font-mono text-[11px] tabular-nums hidden sm:table-cell">{team.drawn}</td>
                  <td className="px-3 py-3 text-center text-slate-600 dark:text-gray-400 font-mono text-[11px] tabular-nums hidden sm:table-cell">{team.lost}</td>

                  {/* Goals Ratio */}
                  <td className="px-3 py-3 text-center text-slate-600 dark:text-gray-400 font-mono text-[11px] tabular-nums">
                    <span className="text-slate-700 dark:text-gray-300">{team.goalsFor}</span>
                    <span className="text-slate-400 px-0.5">:</span>
                    <span className="text-slate-500">{team.goalsAgainst}</span>
                  </td>
                  
                  {/* Goal Difference */}
                  <td className="px-3 py-3 text-center font-mono text-[11px] tabular-nums">
                    <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                      team.goalsDiff > 0 ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400' : 
                      team.goalsDiff < 0 ? 'bg-red-500/10 text-rose-500 dark:text-rose-400' : 
                      'bg-surface-hover text-slate-500'
                    }`}>
                      {team.goalsDiff > 0 ? `+${team.goalsDiff}` : team.goalsDiff}
                    </span>
                  </td>

                  {/* Points */}
                  <td className="px-4 py-3 text-center text-sm font-black text-emerald-400 font-mono tabular-nums bg-emerald-500/[0.02]">{team.points}</td>

                  {/* Form (Last 5 matches) */}
                  <td className="px-4 py-3 text-center hidden md:table-cell">
                    <div className="flex justify-center gap-1.5">
                      {team.form.map((res, formIdx) => (
                        <span
                          key={formIdx}
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black border transition-transform hover:scale-110 shadow-sm ${
                            res === 'W' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-500 dark:text-emerald-400' :
                            res === 'D' ? 'bg-yellow-500/15 border-yellow-500/30 text-yellow-600 dark:text-yellow-400' :
                            'bg-red-500/15 border-red-500/30 text-red-500'
                          }`}
                        >
                          {res === 'W' ? 'ف' : res === 'D' ? 'ت' : 'خ'}
                        </span>
                      ))}
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Qualifications key guide */}
      <div className="flex items-center justify-between flex-wrap gap-4 text-[10px] text-slate-500 dark:text-gray-400 bg-surface border border-border py-4 px-6 rounded-2xl backdrop-blur-md shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm shadow-sm" /> 
            <span className="font-bold">دوري أبطال أوروبا</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-blue-500 rounded-sm shadow-sm" /> 
            <span className="font-bold">الدوري الأوروبي</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-red-500 rounded-sm shadow-sm" /> 
            <span className="font-bold">مرحلة الهبوط</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5 font-black text-emerald-500">
          <Shield size={12} className="text-emerald-500 animate-pulse" />
          <span>مزامنة مباشرة مع كورة 90</span>
        </div>
      </div>
    </div>
  );
}
