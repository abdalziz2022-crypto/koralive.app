import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, ArrowUpDown, ChevronDown, ChevronUp, ShieldAlert } from 'lucide-react';

const PRESET_STANDINGS = {
  'الدوري الإنجليزي': [
    { rank: 1, name: 'أرسنال', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=ARS&backgroundColor=dc2626', played: 37, won: 27, drawn: 5, lost: 5, goalsFor: 89, goalsAgainst: 28, goalsDiff: 61, points: 86 },
    { rank: 2, name: 'مانشستر سيتي', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=MC&backgroundColor=06b6d4', played: 37, won: 26, drawn: 7, lost: 4, goalsFor: 93, goalsAgainst: 33, goalsDiff: 60, points: 85 },
    { rank: 3, name: 'ليفربول', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=LFC&backgroundColor=dc2626', played: 37, won: 23, drawn: 10, lost: 4, goalsFor: 84, goalsAgainst: 41, goalsDiff: 43, points: 79 },
    { rank: 4, name: 'أستون فيلا', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=AV&backgroundColor=800020', played: 37, won: 20, drawn: 8, lost: 9, goalsFor: 76, goalsAgainst: 56, goalsDiff: 20, points: 68 },
    { rank: 5, name: 'توتنهام', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=TOT&backgroundColor=0f172a', played: 37, won: 19, drawn: 6, lost: 12, goalsFor: 71, goalsAgainst: 61, goalsDiff: 10, points: 63 },
    { rank: 6, name: 'تشيلسي', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=CFC&backgroundColor=2563eb', played: 37, won: 17, drawn: 9, lost: 11, goalsFor: 75, goalsAgainst: 62, goalsDiff: 13, points: 60 },
    { rank: 7, name: 'نيوكاسل', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=NU&backgroundColor=000000', played: 37, won: 17, drawn: 6, lost: 14, goalsFor: 81, goalsAgainst: 60, goalsDiff: 21, points: 57 },
    { rank: 8, name: 'مانشستر يونايتد', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=MU&backgroundColor=dc2626', played: 37, won: 17, drawn: 6, lost: 14, goalsFor: 55, goalsAgainst: 58, goalsDiff: -3, points: 57 }
  ],
  'الدوري الإسباني': [
    { rank: 1, name: 'ريال مدريد', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=RM&backgroundColor=f8fafc', played: 36, won: 29, drawn: 6, lost: 1, goalsFor: 83, goalsAgainst: 22, goalsDiff: 61, points: 93 },
    { rank: 2, name: 'برشلونة', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=FCB&backgroundColor=701a75', played: 36, won: 24, drawn: 7, lost: 5, goalsFor: 74, goalsAgainst: 43, goalsDiff: 31, points: 79 },
    { rank: 3, name: 'جيرونا', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=GI&backgroundColor=ea580c', played: 36, won: 23, drawn: 6, lost: 7, goalsFor: 75, goalsAgainst: 45, goalsDiff: 30, points: 75 },
    { rank: 4, name: 'أتلتيكو مدريد', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=ATM&backgroundColor=e11d48', played: 36, won: 23, drawn: 4, lost: 9, goalsFor: 67, goalsAgainst: 39, goalsDiff: 28, points: 73 },
    { rank: 5, name: 'أتلتيك بيلباو', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=ATH&backgroundColor=b91c1c', played: 36, won: 17, drawn: 11, lost: 8, goalsFor: 58, goalsAgainst: 37, goalsDiff: 21, points: 62 },
    { rank: 6, name: 'ريال سوسيداد', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=RS&backgroundColor=2563eb', played: 36, won: 15, drawn: 12, lost: 9, goalsFor: 48, goalsAgainst: 37, goalsDiff: 11, points: 57 }
  ],
  'الدوري السعودي': [
    { rank: 1, name: 'الهلال', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=HFC&backgroundColor=1d4ed8', played: 31, won: 29, drawn: 2, lost: 0, goalsFor: 95, goalsAgainst: 20, goalsDiff: 75, points: 89 },
    { rank: 2, name: 'النصر', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=NFC&backgroundColor=eab308', played: 31, won: 25, drawn: 2, lost: 4, goalsFor: 93, goalsAgainst: 37, goalsDiff: 56, points: 77 },
    { rank: 3, name: 'الأهلي', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=AFC&backgroundColor=15803d', played: 31, won: 17, drawn: 7, lost: 7, goalsFor: 61, goalsAgainst: 33, goalsDiff: 28, points: 58 },
    { rank: 4, name: 'التعاون', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=TAW&backgroundColor=1d4ed8', played: 31, won: 14, drawn: 10, lost: 7, goalsFor: 48, goalsAgainst: 34, goalsDiff: 14, points: 52 },
    { rank: 5, name: 'الاتحاد', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=ITT&backgroundColor=000000', played: 31, won: 15, drawn: 5, lost: 11, goalsFor: 57, goalsAgainst: 49, goalsDiff: 8, points: 50 },
    { rank: 6, name: 'الاتفاق', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=ETF&backgroundColor=15803d', played: 31, won: 11, drawn: 11, lost: 9, goalsFor: 39, goalsAgainst: 32, goalsDiff: 7, points: 44 }
  ],
  'دوري أبطال أوروبا': [
    { rank: 1, name: 'ريال مدريد', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=RM&backgroundColor=f8fafc', played: 6, won: 6, drawn: 0, lost: 0, goalsFor: 16, goalsAgainst: 7, goalsDiff: 9, points: 18 },
    { rank: 2, name: 'نابولي', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=NAP&backgroundColor=06b6d4', played: 6, won: 3, drawn: 1, lost: 2, goalsFor: 10, goalsAgainst: 9, goalsDiff: 1, points: 10 },
    { rank: 3, name: 'سبورتينغ براغا', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=BRG&backgroundColor=dc2626', played: 6, won: 1, drawn: 1, lost: 4, goalsFor: 6, goalsAgainst: 12, goalsDiff: -6, points: 4 },
    { rank: 4, name: 'يونيون برلين', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=FCU&backgroundColor=dc2626', played: 6, won: 0, drawn: 2, lost: 4, goalsFor: 4, goalsAgainst: 8, goalsDiff: -4, points: 2 }
  ]
};

export default function LeagueStandingsPreview({ leagueName, initialLimit = 5 }) {
  const [showAll, setShowAll] = useState(false);

  // Generate robust standings based on preset or dynamic hashing fallback
  const standings = useMemo(() => {
    const preset = PRESET_STANDINGS[leagueName];
    if (preset) return preset;

    // Fast deterministic generator if league is brand new
    const hash = leagueName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const mockTeams = [
      { name: 'ريال مدريد', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=RM&backgroundColor=f8fafc' },
      { name: 'برشلونة', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=FCB&backgroundColor=701a75' },
      { name: 'الهلال', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=HFC&backgroundColor=1d4ed8' },
      { name: 'النصر', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=NAS' },
      { name: 'ليفربول', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=LIV' },
      { name: 'بايرن ميونخ', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=FCB' },
      { name: 'باريس سان جيرمان', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=PSG' },
      { name: 'أرسنال', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=ARS' }
    ];

    return mockTeams.map((team, index) => {
      const idx = (index + (hash % 3)) % mockTeams.length;
      return {
        rank: index + 1,
        name: mockTeams[idx].name,
        logo: mockTeams[idx].logo,
        played: 30,
        won: 24 - index * 2,
        drawn: 4 + (index % 2),
        lost: 2 + index,
        goalsFor: 70 - index * 6,
        goalsAgainst: 20 + index * 4,
        goalsDiff: 50 - index * 10,
        points: 76 - index * 5
      };
    });
  }, [leagueName]);

  const displayedStandings = showAll ? standings : standings.slice(0, initialLimit);

  return (
    <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[32px] overflow-hidden p-4 md:p-6 space-y-4" style={{ direction: 'rtl' }}>
      {/* Title */}
      <div className="flex items-center justify-between checkborder pb-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Trophy size={16} className="text-primary animate-pulse" />
          <h2 className="text-sm font-black text-white">ترتيب أندية الدوري</h2>
        </div>
        <span className="text-[10px] text-gray-400 font-mono">
          تم التحديث {new Date().toLocaleDateString('ar-EG')}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto select-none">
        <table className="w-full text-right text-xs border-collapse">
          <thead>
            <tr className="text-gray-400 border-b border-white/5 text-[10px] uppercase tracking-wider h-10 select-none">
              <th className="w-10 text-center">#</th>
              <th className="text-right">الفريق</th>
              <th className="w-12 text-center">لعب</th>
              <th className="w-12 text-center">+/-</th>
              <th className="w-16 text-center text-primary font-black">النقاط</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.02]">
            {displayedStandings.map((team) => (
              <tr 
                key={team.rank + team.name} 
                className="h-12 hover:bg-white/[0.02] transition-colors"
              >
                {/* Seed Rank */}
                <td className="text-center">
                  <span className={`inline-flex w-5 h-5 rounded-md items-center justify-center text-[10px] font-black ${
                    team.rank <= 3 ? 'bg-primary/20 text-primary border border-primary/20' : 'text-gray-400'
                  }`}>
                    {team.rank}
                  </span>
                </td>

                {/* Team Name / Logo */}
                <td>
                  <div className="flex items-center gap-2.5">
                    <img 
                      src={team.logo} 
                      alt="" 
                      className="w-6 h-6 rounded-full bg-white/5 p-0.5 object-contain"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(team.name)}`;
                      }}
                    />
                    <span className="font-extrabold text-gray-200 hover:text-white transition-colors truncate max-w-[130px] md:max-w-none">
                      {team.name}
                    </span>
                  </div>
                </td>

                {/* Played Matches */}
                <td className="text-center font-mono tabular-nums text-gray-400">{team.played}</td>
                
                {/* Diff */}
                <td className="text-center font-mono tabular-nums">
                  <span className={`px-1 py-0.5 rounded text-[10px] ${
                    team.goalsDiff > 0 ? 'text-primary' : 'text-rose-400'
                  }`}>
                    {team.goalsDiff > 0 ? `+${team.goalsDiff}` : team.goalsDiff}
                  </span>
                </td>

                {/* Total points */}
                <td className="text-center text-sm font-black text-primary font-mono tabular-nums select-all">
                  {team.points}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* View Full Table Button */}
      {standings.length > initialLimit && (
        <div className="pt-2 text-center border-t border-white/5">
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowAll(!showAll)}
            className="w-full py-2.5 rounded-xl border border-white/5 hover:border-gray-500 bg-white/5 hover:bg-white/10 text-xs font-black text-gray-200 hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {showAll ? (
              <>
                <ChevronUp size={14} />
                <span>عرض الترتيب المختصر</span>
              </>
            ) : (
              <>
                <ChevronDown size={14} />
                <span>عرض جدول الترتيب بالكامل</span>
              </>
            )}
          </motion.button>
        </div>
      )}
    </div>
  );
}
