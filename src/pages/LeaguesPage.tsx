import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Trophy, 
  Globe, 
  Search, 
  Flame, 
  Activity, 
  Compass, 
  ArrowLeftRight 
} from 'lucide-react';
import HomeHeader from '../components/home/HomeHeader';

// Complete list of world-famous leagues with logo and country mappings
const WORLD_LEAGUES = [
  {
    id: 'l1',
    apiId: 307,
    name: 'الدوري السعودي للمحترفين',
    country: 'السعودية',
    emoji: '🇸🇦',
    logo: 'https://media.api-sports.io/football/leagues/307.png',
    bg: 'from-emerald-500/10 to-transparent border-emerald-500/25',
    tag: 'روشن للمحترفين'
  },
  {
    id: 'l2',
    apiId: 39,
    name: 'الدوري الإنجليزي الممتاز',
    country: 'إنجلترا',
    emoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    logo: 'https://media.api-sports.io/football/leagues/39.png',
    bg: 'from-violet-500/10 to-transparent border-violet-500/25',
    tag: 'بريميرليغ'
  },
  {
    id: 'l3',
    apiId: 140,
    name: 'الدوري الإسباني (لا ليغا)',
    country: 'إسبانيا',
    emoji: '🇪🇸',
    logo: 'https://media.api-sports.io/football/leagues/140.png',
    bg: 'from-amber-500/10 to-transparent border-amber-500/25',
    tag: 'لا ليغا إسباير'
  },
  {
    id: 'l4',
    apiId: 2,
    name: 'دوري أبطال أوروبا',
    country: 'أوروبا',
    emoji: '🇪🇺',
    logo: 'https://media.api-sports.io/football/leagues/2.png',
    bg: 'from-blue-500/10 to-transparent border-blue-500/25',
    tag: 'كأس ذات الأذنين'
  },
  {
    id: '135',
    apiId: 135,
    name: 'الدوري الإيطالي الممتاز',
    country: 'إيطاليا',
    emoji: '🇮🇹',
    logo: 'https://media.api-sports.io/football/leagues/135.png',
    bg: 'from-rose-500/10 to-transparent border-rose-500/25',
    tag: 'سيري آ'
  },
  {
    id: '78',
    apiId: 78,
    name: 'الدوري الألماني (البوندسليغا)',
    country: 'ألمانيا',
    emoji: '🇩🇪',
    logo: 'https://media.api-sports.io/football/leagues/78.png',
    bg: 'from-red-500/10 to-transparent border-red-500/25',
    tag: 'البوندسليغا'
  },
  {
    id: '61',
    apiId: 61,
    name: 'الدوري الفرنسي (ليغ 1)',
    country: 'فرنسا',
    emoji: '🇫🇷',
    logo: 'https://media.api-sports.io/football/leagues/61.png',
    bg: 'from-sky-500/10 to-transparent border-sky-500/25',
    tag: 'ليغ 1'
  }
];

export default function LeaguesPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter list based on search term
  const filteredLeagues = WORLD_LEAGUES.filter(l => 
    l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.tag.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background text-[color:var(--color-text)] pb-20 transition-colors duration-300 select-none" style={{ direction: 'rtl' }}>
      {/* Home Header */}
      <HomeHeader />

      {/* Main content body */}
      <main className="max-w-7xl mx-auto px-4 pt-6 space-y-8">
        
        {/* Banner with ambient glows */}
        <div className="relative overflow-hidden rounded-[32px] bg-slate-900/40 backdrop-blur-xl border border-white/5 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="space-y-2 text-center md:text-right">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <Trophy size={20} className="text-primary animate-bounce animate-duration-1000" />
              <h1 className="text-2xl md:text-3xl font-black text-white">البطولات الكروية والمجموعات</h1>
            </div>
            <p className="text-xs text-gray-400 font-bold max-w-[500px] leading-relaxed">
              تصفح جداول الترتيب، تفاصيل المباريات، وإحصائيات أفضل اللاعبين والهدافين وصناع اللعب لأقوى المسابقات المحلية والعالمية.
            </p>
          </div>

          {/* Real-time search implementation */}
          <div className="relative w-full md:w-80 select-all">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-4.5 h-4.5" />
            <input
              type="text"
              placeholder="ابحث عن بطولة أو دولة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-11 pl-4 py-3 text-xs font-black text-white bg-slate-950/60 border border-white/5 rounded-2xl focus:outline-none focus:border-primary transition-all shadow-xl"
            />
          </div>
        </div>

        {/* Dynamic Grid list */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-widest">
              <Activity size={14} className="text-primary animate-pulse" />
              <span>متاح حالياً ({filteredLeagues.length} مسابقات مجهزة)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredLeagues.map((league) => (
              <motion.div
                key={league.id}
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/league/${league.id}`)}
                className={`group relative overflow-hidden rounded-[24px] bg-slate-900/40 hover:bg-slate-900/70 border border-white/5 p-5 cursor-pointer flex flex-col justify-between h-[230px] transition-all bg-gradient-to-b ${league.bg} hover:shadow-2xl hover:shadow-primary/5`}
              >
                {/* Visual Top details */}
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-black text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full uppercase shadow-sm">
                    {league.tag}
                  </span>
                  
                  <span className="text-sm rounded-lg bg-slate-950/80 px-2 py-1 flex items-center gap-1 border border-white/5">
                    <Globe size={11} className="text-slate-400" />
                    <span className="text-[10px] text-gray-300 font-bold">{league.country}</span>
                    <span className="text-xs">{league.emoji}</span>
                  </span>
                </div>

                {/* Main Logo & title info details */}
                <div className="flex items-center gap-4.5 pt-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-950/80 p-2.5 border border-white/10 flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-108">
                    <img 
                      src={league.logo} 
                      alt="" 
                      className="w-full h-full object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(league.name)}`;
                      }}
                    />
                  </div>

                  <div className="space-y-1 overflow-hidden min-w-0 flex-1">
                    <h3 className="text-xs font-black text-white group-hover:text-primary transition-colors truncate leading-snug">
                      {league.name}
                    </h3>
                    <p className="text-[10px] text-gray-400 font-bold">موسم 2024 - 2025</p>
                  </div>
                </div>

                {/* Hover Indicator Link */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5 text-[10px] text-gray-500 group-hover:text-primary font-black transition-colors">
                  <span>تفاصيل ومباريات الكالتشيو</span>
                  <div className="flex items-center gap-1 font-bold">
                    <span>عرض التفاصيل</span>
                    <span>←</span>
                  </div>
                </div>
              </motion.div>
            ))}

            {filteredLeagues.length === 0 && (
              <div className="col-span-full py-16 text-center text-gray-400 space-y-3">
                <Compass className="w-12 h-12 text-slate-600 mx-auto animate-spin" />
                <p className="text-sm font-black text-white">لم نجد أي بطولة تطابق بحثك!</p>
                <p className="text-xs text-slate-500 font-bold">يرجى تجربة كلمات بحث بديلة مثل "السعودية" أو "إنجلترا".</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
