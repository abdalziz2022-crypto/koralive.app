import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, RefreshCw, Calendar, MapPin, ArrowUpRight, ArrowDownLeft, Info, HelpCircle, Award, Shield, Zap, Activity, Flame } from 'lucide-react';
import { Match } from '../types';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

export interface PlayerStats {
  rating: number;
  passesCompleted: number;
  passesAttempted: number;
  duelsWon: number;
  duelsTotal: number;
  extraLabel1: string;
  extraValue1: string;
  extraLabel2: string;
  extraValue2: string;
}

export interface Player {
  number: number;
  name: string;
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
  subbedOut?: boolean;
  subbedIn?: boolean;
  subTime?: string;
  subPlayer?: string; // name of player swapped with
}

export function generatePlayerStats(player: Player): PlayerStats {
  // Use a simple hash of player.name to make sure statistics are deterministic
  let hash = 0;
  for (let i = 0; i < player.name.length; i++) {
    hash = player.name.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash);

  const rating = Number((6.8 + (hash % 23) / 10).toFixed(1)); // 6.8 - 9.0

  const passesAttempted = 25 + (hash % 45); // 25 - 69
  const passPercent = 75 + (hash % 21); // 75% - 95%
  const passesCompleted = Math.round((passesAttempted * passPercent) / 100);

  const duelsTotal = 4 + (hash % 8); // 4 - 11
  const duelsWon = Math.round((duelsTotal * (55 + (hash % 36))) / 100);

  let extraLabel1 = "قطع كرات";
  let extraValue1 = `${2 + (hash % 5)}`;
  let extraLabel2 = "ركض (كم)";
  let extraValue2 = `${(9.5 + (hash % 30) / 10).toFixed(1)}`;

  if (player.position === 'GK') {
    extraLabel1 = "تصديات رائعة";
    extraValue1 = `${3 + (hash % 4)}`;
    extraLabel2 = "تشتيت بنجاح";
    extraValue2 = `${1 + (hash % 3)}`;
  } else if (player.position === 'DEF') {
    extraLabel1 = "تشتيت كرات";
    extraValue1 = `${4 + (hash % 6)}`;
    extraLabel2 = "اعتراض هجمات";
    extraValue2 = `${2 + (hash % 4)}`;
  } else if (player.position === 'MID') {
    extraLabel1 = "تمريرات مفتاحية";
    extraValue1 = `${2 + (hash % 4)}`;
    extraLabel2 = "نجاح الالتحامات";
    extraValue2 = `${60 + (hash % 30)}%`;
  } else if (player.position === 'FWD') {
    extraLabel1 = "على المرمى";
    const totalShots = 2 + (hash % 4);
    const onTarget = Math.max(1, totalShots - (hash % 3));
    extraValue1 = `${onTarget}/${totalShots}`;
    extraLabel2 = "مراوغات ناجحة";
    const totalDribbles = 3 + (hash % 5);
    const succDribbles = Math.max(1, totalDribbles - (hash % 3));
    extraValue2 = `${succDribbles}/${totalDribbles}`;
  }

  return {
    rating,
    passesCompleted,
    passesAttempted,
    duelsWon,
    duelsTotal,
    extraLabel1,
    extraValue1,
    extraLabel2,
    extraValue2
  };
}

export interface TeamRoster {
  formation: string;
  players: Player[];
  substitutes: Player[];
}

const ROSTERS: Record<string, TeamRoster> = {
  'مانشستر سيتي': {
    formation: '4-3-3',
    players: [
      { number: 31, name: 'إيدرسون', position: 'GK' },
      { number: 2, name: 'كايلي ووكر', position: 'DEF' },
      { number: 3, name: 'روبن دياز', position: 'DEF' },
      { number: 25, name: 'مانويل أكانجي', position: 'DEF' },
      { number: 24, name: 'جوسكو غفارديول', position: 'DEF' },
      { number: 16, name: 'رودريغو هيرنانديز', position: 'MID' },
      { number: 17, name: 'كيفين دي بروين', position: 'MID', subbedOut: true, subTime: "75'", subPlayer: 'ماتيو كوفاسيتش' },
      { number: 20, name: 'برناردو سيلفا', position: 'MID' },
      { number: 47, name: 'فيل فودين', position: 'FWD', subbedOut: true, subTime: "82'", subPlayer: 'جيريمي دوكو' },
      { number: 19, name: 'جوليان ألفاريز', position: 'FWD' },
      { number: 9, name: 'إيرلينغ هالاند', position: 'FWD' }
    ],
    substitutes: [
      { number: 18, name: 'ستيفان أورتيغا', position: 'GK' },
      { number: 8, name: 'ماتيو كوفاسيتش', position: 'MID', subbedIn: true, subTime: "75'", subPlayer: 'كيفين دي بروين' },
      { number: 11, name: 'جيريمي دوكو', position: 'FWD', subbedIn: true, subTime: "82'", subPlayer: 'فيل فودين' },
      { number: 5, name: 'جون ستونز', position: 'DEF' },
      { number: 27, name: 'ماتيوس نونيز', position: 'MID' },
      { number: 52, name: 'أوسكار بوب', position: 'FWD' }
    ]
  },
  'ريال مدريد': {
    formation: '4-3-1-2',
    players: [
      { number: 1, name: 'تيبو كورتوا', position: 'GK' },
      { number: 2, name: 'داني كارفاخال', position: 'DEF' },
      { number: 22, name: 'أنطونيو روديغر', position: 'DEF' },
      { number: 18, name: 'أوريليان تشواميني', position: 'DEF' },
      { number: 23, name: 'فيرلاند ميندي', position: 'DEF' },
      { number: 15, name: 'فيديريكو فالفيردي', position: 'MID' },
      { number: 8, name: 'توني كروس', position: 'MID', subbedOut: true, subTime: "80'", subPlayer: 'لوكا مودريتش' },
      { number: 12, name: 'إدواردو كامافينغا', position: 'MID' },
      { number: 5, name: 'جود بيلينغهاي', position: 'MID' },
      { number: 11, name: 'رودريغو غوس', position: 'FWD', subbedOut: true, subTime: "71'", subPlayer: 'إبراهيم دياز' },
      { number: 7, name: 'فينيسيوس جونيور', position: 'FWD' }
    ],
    substitutes: [
      { number: 13, name: 'أندري لونين', position: 'GK' },
      { number: 10, name: 'لوكا مودريتش', position: 'MID', subbedIn: true, subTime: "80'", subPlayer: 'توني كروس' },
      { number: 21, name: 'إبراهيم دياز', position: 'FWD', subbedIn: true, subTime: "71'", subPlayer: 'رودريغو غوس' },
      { number: 17, name: 'لوكاس فاسكيز', position: 'DEF' },
      { number: 19, name: 'داني سيبايوس', position: 'MID' },
      { number: 14, name: 'خوسيلو ماتو', position: 'FWD' }
    ]
  },
  'ليفربول': {
    formation: '4-3-3',
    players: [
      { number: 1, name: 'أليسون بيكر', position: 'GK' },
      { number: 66, name: 'ألكسندر-أرنولد', position: 'DEF' },
      { number: 4, name: 'فيرجيل فان دايك', position: 'DEF' },
      { number: 5, name: 'إبراهيما كوناتي', position: 'DEF' },
      { number: 26, name: 'أندي روبرتسون', position: 'DEF' },
      { number: 10, name: 'ألكسيس ماك أليستير', position: 'MID' },
      { number: 3, name: 'واتارو إندو', position: 'MID', subbedOut: true, subTime: "60'", subPlayer: 'هارفي إليوت' },
      { number: 8, name: 'دومينيك سوبوسلاي', position: 'MID' },
      { number: 11, name: 'محمد صلاح', position: 'FWD' },
      { number: 9, name: 'داروين نونيز', position: 'FWD', subbedOut: true, subTime: "73'", subPlayer: 'كودي جاكبو' },
      { number: 7, name: 'لويس دياز', position: 'FWD' }
    ],
    substitutes: [
      { number: 62, name: 'كويمين كيليهير', position: 'GK' },
      { number: 19, name: 'هارفي إليوت', position: 'MID', subbedIn: true, subTime: "60'", subPlayer: 'واتارو إندو' },
      { number: 18, name: 'كودي جاكبو', position: 'FWD', subbedIn: true, subTime: "73'", subPlayer: 'داروين نونيز' },
      { number: 2, name: 'جو غوميز', position: 'DEF' },
      { number: 17, name: 'كورتيس جونز', position: 'MID' },
      { number: 20, name: 'ديوغو جوتا', position: 'FWD' }
    ]
  },
  'برشلونة': {
    formation: '4-3-3',
    players: [
      { number: 1, name: 'تير شتيغن', position: 'GK' },
      { number: 23, name: 'جول كوندي', position: 'DEF' },
      { number: 4, name: 'رونالد أراوخو', position: 'DEF' },
      { number: 33, name: 'باو كوبارسي', position: 'DEF' },
      { number: 2, name: 'جواو كانسيلو', position: 'DEF' },
      { number: 22, name: 'إيلكاي غوندوغان', position: 'MID' },
      { number: 15, name: 'أندرياس كريستنسن', position: 'MID', subbedOut: true, subTime: "58'", subPlayer: 'بيدري غونزاليس' },
      { number: 21, name: 'فرينكي دي يونغ', position: 'MID' },
      { number: 27, name: 'لامين يامال', position: 'FWD' },
      { number: 9, name: 'روبرت ليفاندوفسكي', position: 'FWD', subbedOut: true, subTime: "78'", subPlayer: 'فيتور روكي' },
      { number: 11, name: 'رافينيا دياز', position: 'FWD', subbedOut: true, subTime: "65'", subPlayer: 'جواو فيليكس' }
    ],
    substitutes: [
      { number: 13, name: 'إينياكي بينيا', position: 'GK' },
      { number: 8, name: 'بيدري غونزاليس', position: 'MID', subbedIn: true, subTime: "58'", subPlayer: 'أندرياس كريستنسن' },
      { number: 14, name: 'جواو فيليكس', position: 'FWD', subbedIn: true, subTime: "65'", subPlayer: 'رافينيا دياز' },
      { number: 19, name: 'فيتور روكي', position: 'FWD', subbedIn: true, subTime: "78'", subPlayer: 'روبرت ليفاندوفسكي' },
      { number: 5, name: 'إينيغو مارتينيز', position: 'DEF' },
      { number: 6, name: 'جافي بايز', position: 'MID' }
    ]
  },
  'النصر': {
    formation: '4-2-3-1',
    players: [
      { number: 26, name: 'دافيد أوسبينا', position: 'GK' },
      { number: 2, name: 'سلطان الغنام', position: 'DEF' },
      { number: 78, name: 'علي لاجامي', position: 'DEF' },
      { number: 27, name: 'إيميرك لابورت', position: 'DEF' },
      { number: 15, name: 'أليكس تيليس', position: 'DEF' },
      { number: 17, name: 'عبد الله الخيبري', position: 'MID' },
      { number: 25, name: 'أوتافيو مونتيرو', position: 'MID', subbedOut: true, subTime: "81'", subPlayer: 'سامي النجعي' },
      { number: 77, name: 'مارسيلو بروزوفيتش', position: 'MID' },
      { number: 10, name: 'ساديو ماني', position: 'FWD', subbedOut: true, subTime: "75'", subPlayer: 'عبد الرحمن غريب' },
      { number: 29, name: 'عبد الرحمن غريب', position: 'FWD' },
      { number: 7, name: 'كريستيانو رونالدو', position: 'FWD' }
    ],
    substitutes: [
      { number: 33, name: 'وليد عبد الله', position: 'GK' },
      { number: 14, name: 'سامي النجعي', position: 'MID', subbedIn: true, subTime: "81'", subPlayer: 'أوتافيو مونتيرو' },
      { number: 23, name: 'أيمن يحيى', position: 'FWD', subbedIn: true, subTime: "75'", subPlayer: 'ساديو ماني' },
      { number: 4, name: 'محمد الفتيل', position: 'DEF' },
      { number: 8, name: 'عبد المجيد الصليهم', position: 'MID' },
      { number: 16, name: 'محمد مران', position: 'FWD' }
    ]
  },
  'الهلال': {
    formation: '4-2-3-1',
    players: [
      { number: 37, name: 'ياسين بونو', position: 'GK' },
      { number: 66, name: 'سعود عبد الحميد', position: 'DEF' },
      { number: 3, name: 'خاليدو كوليبالي', position: 'DEF' },
      { number: 87, name: 'حسان تمبكتي', position: 'DEF' },
      { number: 12, name: 'ياسر الشهراني', position: 'DEF' },
      { number: 8, name: 'روبن نيفيز', position: 'MID' },
      { number: 22, name: 'سيرجي سافيتش', position: 'MID' },
      { number: 77, name: 'مالكوم أوليفيرا', position: 'FWD', subbedOut: true, subTime: "85'", subPlayer: 'محمد كنو' },
      { number: 10, name: 'نيمار دا سيلفا', position: 'FWD', subbedOut: true, subTime: "62'", subPlayer: 'سلمان الفرج' },
      { number: 29, name: 'سالم الدوسري', position: 'FWD' },
      { number: 9, name: 'ألكساندر ميتروفيتش', position: 'FWD' }
    ],
    substitutes: [
      { number: 21, name: 'محمد العويس', position: 'GK' },
      { number: 28, name: 'محمد كنو', position: 'MID', subbedIn: true, subTime: "85'", subPlayer: 'مالكوم أوليفيرا' },
      { number: 7, name: 'سلمان الفرج', position: 'MID', subbedIn: true, subTime: "62'", subPlayer: 'نيمار دا سيلفا' },
      { number: 2, name: 'محمد البريك', position: 'DEF' },
      { number: 16, name: 'ناصر الدوسري', position: 'MID' },
      { number: 11, name: 'صالح الشهري', position: 'FWD' }
    ]
  }
};

export function getTeamRoster(teamName: string, isHome: boolean): TeamRoster {
  const normName = teamName.trim();
  if (ROSTERS[normName]) {
    return ROSTERS[normName];
  }
  
  // Custom fallback generation based on teamName to give a premium feels
  const defaultFormation = isHome ? '4-4-2' : '4-3-3';
  
  const homeFirstNames = ['أحمد', 'محمد', 'عبد الله', 'سعد', 'خالد', 'علي', 'عمر', 'يوسف', 'سالم', 'حسن', 'عبد الرحمن'];
  const homeLastNames = ['العتببي', 'الدوسري', 'القحطاني', 'الشهراني', 'الغامدي', 'المالكي', 'الرشيدي', 'الحربي', 'المطيري', 'الشمري'];
  
  const awayFirstNames = ['طارق', 'كريم', 'ياسين', 'هشام', 'سليم', 'وائل', 'سامح', 'مروان', 'هاني', 'شريف', 'مصطفى'];
  const awayLastNames = ['مصطفى', 'شوقي', 'جمال', 'سمير', 'سعيد', 'الشناوي', 'المحمدي', 'عبد الجواد', 'كمال', 'شاكر'];

  const selectName = (idx: number) => {
    if (isHome) {
      const f = homeFirstNames[idx % homeFirstNames.length];
      const l = homeLastNames[(idx * 3) % homeLastNames.length];
      return `${f} ${l}`;
    } else {
      const f = awayFirstNames[idx % awayFirstNames.length];
      const l = awayLastNames[(idx * 2) % awayLastNames.length];
      return `${f} ${l}`;
    }
  };

  const players: Player[] = [];
  const startNumbers = [1, 2, 3, 4, 5, 6, 8, 10, 11, 7, 9];
  
  const positions: Array<'GK' | 'DEF' | 'MID' | 'FWD'> = ['GK', 'DEF', 'DEF', 'DEF', 'DEF', 'MID', 'MID', 'MID', 'MID', 'FWD', 'FWD'];
  if (defaultFormation === '4-3-3') {
    positions[8] = 'FWD';
  }

  positions.forEach((pos, idx) => {
    const isSubbed = idx === 6 || idx === 8;
    players.push({
      number: startNumbers[idx],
      name: selectName(idx),
      position: pos,
      subbedOut: isSubbed,
      subTime: isSubbed ? (idx === 6 ? "72'" : "83'") : undefined,
      subPlayer: isSubbed ? (idx === 6 ? selectName(11) : selectName(12)) : undefined
    });
  });

  const substitutes: Player[] = [
    { number: 18, name: selectName(11), position: 'MID', subbedIn: true, subTime: "72'", subPlayer: players[6].name },
    { number: 20, name: selectName(12), position: 'FWD', subbedIn: true, subTime: "83'", subPlayer: players[8].name },
    { number: 22, name: isHome ? 'سليمان الفهد' : 'سامر الجابر', position: 'GK' },
    { number: 14, name: isHome ? 'عبد الإله العتيبي' : 'ناصر الدوسري', position: 'DEF' },
    { number: 15, name: isHome ? 'عزام الرشيد' : 'فهد المولد', position: 'MID' }
  ];

  return {
    formation: defaultFormation,
    players,
    substitutes
  };
}

interface LineupsViewProps {
  match: Match;
}

export default function LineupsView({ match }: LineupsViewProps) {
  const navigate = useNavigate();
  const homeRoster = getTeamRoster(match.homeTeam, true);
  const awayRoster = getTeamRoster(match.awayTeam, false);
  const [selectedPlayer, setSelectedPlayer] = React.useState<Player | null>(null);
  const [showHeatmap, setShowHeatmap] = React.useState(false);

  // Distribute players into subsets grouped by role
  const getSubsets = (roster: TeamRoster) => {
    const gk = roster.players.filter(p => p.position === 'GK');
    const def = roster.players.filter(p => p.position === 'DEF');
    const mid = roster.players.filter(p => p.position === 'MID');
    const fwd = roster.players.filter(p => p.position === 'FWD');
    return { gk, def, mid, fwd };
  };

  const homeSubsets = getSubsets(homeRoster);
  const awaySubsets = getSubsets(awayRoster);

  // Group all substitutions to show a modern timeline
  const substitutions = React.useMemo(() => {
    const list: Array<{ time: string, team: string, outPlayer: string, inPlayer: string, isHome: boolean }> = [];
    homeRoster.players.forEach(p => {
      if (p.subbedOut && p.subPlayer && p.subTime) {
        list.push({ time: p.subTime, team: match.homeTeam, outPlayer: p.name, inPlayer: p.subPlayer, isHome: true });
      }
    });
    awayRoster.players.forEach(p => {
      if (p.subbedOut && p.subPlayer && p.subTime) {
        list.push({ time: p.subTime, team: match.awayTeam, outPlayer: p.name, inPlayer: p.subPlayer, isHome: false });
      }
    });
    return list.sort((a, b) => parseInt(a.time) - parseInt(b.time));
  }, [homeRoster, awayRoster, match]);

  return (
    <div className="space-y-8 select-none" style={{ direction: 'rtl' }}>
      {/* Field Overview Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <Users size={18} />
          </div>
          <div>
            <h4 className="text-sm font-black text-gray-200">الرسم التكتيكي للفريقين</h4>
            <p className="text-[10px] text-gray-500 font-bold">انقر على اللاعب لعرض تفاصيل التبديل والبيانات</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Heat map toggle button */}
          <button
            type="button"
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={cn(
              "text-[11px] font-black px-3 py-1.5 rounded-xl border transition-all duration-300 flex items-center gap-1.5 relative overflow-hidden cursor-pointer outline-none",
              showHeatmap 
                ? "bg-red-500/20 text-red-400 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.15)] font-black" 
                : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 font-bold"
            )}
          >
            <Flame size={12} className={cn(showHeatmap && "animate-pulse text-red-500")} />
            <span>{showHeatmap ? 'إغلاق الخريطة الحرارية' : 'الخريطة الحرارية 🔥'}</span>
          </button>

          <span 
            onClick={() => navigate(`/team/${encodeURIComponent(match.homeTeam)}`)}
            className="text-[11px] font-bold bg-white/5 px-3 py-1.5 border border-white/10 rounded-xl text-gray-400 hidden sm:inline-block cursor-pointer hover:text-primary transition-colors"
          >
            {match.homeTeam}: {homeRoster.formation}
          </span>
          <span 
            onClick={() => navigate(`/team/${encodeURIComponent(match.awayTeam)}`)}
            className="text-[11px] font-bold bg-white/5 px-3 py-1.5 border border-white/10 rounded-xl text-gray-400 hidden sm:inline-block cursor-pointer hover:text-secondary transition-colors"
          >
            {match.awayTeam}: {awayRoster.formation}
          </span>
        </div>
      </div>

      {/* Graphical Tactical Football Pitch */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl mx-auto rounded-3xl overflow-hidden shadow-2xl border border-emerald-500/20 bg-[#072412] relative aspect-[3/4] sm:aspect-[2/3] px-2 py-4"
        style={{
          boxShadow: 'inset 0 0 80px rgba(16, 185, 129, 0.08), 0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
      >
        {/* Grass Pattern Strides (Alternating stripes) */}
        <div className="absolute inset-0 flex flex-col pointer-events-none opacity-20">
          {Array.from({ length: 12 }).map((_, i) => (
            <div 
              key={i} 
              className={cn("flex-1 w-full", i % 2 === 0 ? "bg-emerald-950/40" : "bg-transparent")} 
            />
          ))}
        </div>

        {/* Pitch Lines */}
        <div className="absolute inset-4 border border-emerald-500/30 rounded-2xl pointer-events-none">
          {/* Halfway line */}
          <div className="absolute top-1/2 left-0 right-0 h-[1.5px] bg-emerald-500/30" />
          
          {/* Center Circle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border border-emerald-500/30 rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-emerald-400 rounded-full" />

          {/* Top Penalty Area (Away) */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[15%] border-b border-x border-emerald-500/30">
            {/* Goal Area */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[50%] h-[40%] border-b border-x border-emerald-500/20" />
            {/* Penalty spot */}
            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-emerald-400 rounded-full" />
            {/* Penalty arch */}
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-16 h-6 border-b border-emerald-500/30 rounded-b-full pointer-events-none" />
          </div>

          {/* Bottom Penalty Area (Home) */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-[15%] border-t border-x border-emerald-500/30">
            {/* Goal Area */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[50%] h-[40%] border-t border-x border-emerald-500/20" />
            {/* Penalty spot */}
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-emerald-400 rounded-full" />
            {/* Penalty arch */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-16 h-6 border-t border-emerald-500/30 rounded-t-full pointer-events-none" />
          </div>

          {/* Corner Arcs */}
          <div className="absolute top-0 right-0 w-2.5 h-2.5 border-b border-l border-emerald-500/30 rounded-bl-full" />
          <div className="absolute top-0 left-0 w-2.5 h-2.5 border-b border-r border-emerald-500/30 rounded-br-full" />
          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-t border-l border-emerald-500/30 rounded-tl-full" />
          <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-t border-r border-emerald-500/30 rounded-tr-full" />
        </div>

        {/* Heatmap Overlay */}
        <AnimatePresence>
          {showHeatmap && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-4 z-0 pointer-events-none overflow-hidden rounded-2xl"
            >
              {/* Hot Spot 1: Midfield dominance */}
              <div 
                className="absolute w-[45%] h-[30%] rounded-full bg-[radial-gradient(circle,rgba(239,68,68,0.35)_0%,rgba(245,158,11,0.15)_45%,rgba(16,185,129,0.03)_70%,rgba(0,0,0,0)_100%)] blur-md animate-pulse"
                style={{ top: '35%', left: '25%', transform: 'translate(-50%, -50%)' }}
              />

              {/* Hot Spot 2: Home Striker presence / Away Defense */}
              <div 
                className="absolute w-[35%] h-[25%] rounded-full bg-[radial-gradient(circle,rgba(239,68,68,0.3)_0%,rgba(251,191,36,0.12)_50%,rgba(0,0,0,0)_100%)] blur-sm"
                style={{ top: '15%', left: '50%', transform: 'translate(-50%, -50%)' }}
              />

              {/* Hot Spot 3: Home Right Wing flank run */}
              <div 
                className="absolute w-[20%] h-[35%] rounded-full bg-[radial-gradient(circle,rgba(245,158,11,0.25)_0%,rgba(16,185,129,0.05)_60%,rgba(0,0,0,0)_100%)]"
                style={{ top: '65%', left: '15%', transform: 'translate(-50%, -50%)' }}
              />

              {/* Hot Spot 4: Away Left Wing flank run */}
              <div 
                className="absolute w-[22%] h-[35%] rounded-full bg-[radial-gradient(circle,rgba(245,158,11,0.28)_0%,rgba(16,185,129,0.05)_60%,rgba(0,0,0,0)_100%)]"
                style={{ top: '25%', left: '85%', transform: 'translate(-50%, -50%)' }}
              />

              {/* Hot Spot 5: Defensive shield Area Home */}
              <div 
                className="absolute w-[40%] h-[22%] rounded-full bg-[radial-gradient(circle,rgba(239,68,68,0.25)_0%,rgba(245,158,11,0.1)_50%,rgba(0,0,0,0)_100%)] blur-md"
                style={{ top: '78%', left: '48%', transform: 'translate(-50%, -50%)' }}
              />

              {/* Hot Spot 6: Buildup Zone Center */}
              <div 
                className="absolute w-[30%] h-[20%] rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.18)_0%,rgba(16,185,129,0.06)_60%,rgba(0,0,0,0)_100%)]"
                style={{ top: '50%', left: '70%', transform: 'translate(-50%, -50%)' }}
              />

              {/* Interactive Heat labels in empty areas */}
              <div className="absolute top-[18%] left-[78%] border border-red-500/25 bg-red-950/40 backdrop-blur-sm shadow-sm px-1.5 py-0.5 rounded text-[8px] font-black text-red-400 select-none">
                منطقة هجومية مكثفة 🔥
              </div>
              <div className="absolute bottom-[22%] left-[12%] border border-yellow-500/25 bg-yellow-950/40 backdrop-blur-sm shadow-sm px-1.5 py-0.5 rounded text-[8px] font-black text-yellow-400 select-none">
                صناعة الفرص ⚽
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Heatmap Legend */}
        {showHeatmap && (
          <div className="absolute bottom-4 right-4 z-20 bg-black/80 border border-white/10 px-2.5 py-1.5 rounded-xl flex items-center gap-2 text-[9px] font-extrabold backdrop-blur-md">
            <span className="text-gray-400">مفتاح الخريطة:</span>
            <span className="flex items-center gap-1 text-red-400">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> مرتفع
            </span>
            <span className="flex items-center gap-1 text-yellow-500">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" /> متوسط
            </span>
            <span className="flex items-center gap-1 text-blue-400">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> منخفض
            </span>
          </div>
        )}

        {/* Players Overlay container */}
        <div className="absolute inset-4 z-10 flex flex-col justify-between">
          
          {/* ==================== AWAY TEAM ROW (Top-Down index order) ==================== */}
          <div className="relative w-full h-[45%] flex flex-col justify-between pt-2">
            
            {/* Row 1: GK (Away) */}
            <div className="flex justify-center">
              {awaySubsets.gk.map((p, i) => (
                <PlayerNode key={p.name} player={p} isHome={false} onClick={() => setSelectedPlayer(p)} showHeatmap={showHeatmap} />
              ))}
            </div>

            {/* Row 2: DEF (Away) */}
            <div className="flex justify-around px-2">
              {awaySubsets.def.map((p, i) => (
                <PlayerNode key={p.name} player={p} isHome={false} onClick={() => setSelectedPlayer(p)} showHeatmap={showHeatmap} />
              ))}
            </div>

            {/* Row 3: MID (Away) */}
            <div className="flex justify-around px-8">
              {awaySubsets.mid.map((p, i) => (
                <PlayerNode key={p.name} player={p} isHome={false} onClick={() => setSelectedPlayer(p)} showHeatmap={showHeatmap} />
              ))}
            </div>

            {/* Row 4: FWD (Away) */}
            <div className="flex justify-around px-12">
              {awaySubsets.fwd.map((p, i) => (
                <PlayerNode key={p.name} player={p} isHome={false} onClick={() => setSelectedPlayer(p)} showHeatmap={showHeatmap} />
              ))}
            </div>

          </div>

          {/* ==================== HOME TEAM ROW (Bottom-Up index order) ==================== */}
          <div className="relative w-full h-[45%] flex flex-col-reverse justify-between pb-2">
            
            {/* Row 1: GK (Home) */}
            <div className="flex justify-center">
              {homeSubsets.gk.map((p, i) => (
                <PlayerNode key={p.name} player={p} isHome={true} onClick={() => setSelectedPlayer(p)} showHeatmap={showHeatmap} />
              ))}
            </div>

            {/* Row 2: DEF (Home) */}
            <div className="flex justify-around px-2">
              {homeSubsets.def.map((p, i) => (
                <PlayerNode key={p.name} player={p} isHome={true} onClick={() => setSelectedPlayer(p)} showHeatmap={showHeatmap} />
              ))}
            </div>

            {/* Row 3: MID (Home) */}
            <div className="flex justify-around px-8">
              {homeSubsets.mid.map((p, i) => (
                <PlayerNode key={p.name} player={p} isHome={true} onClick={() => setSelectedPlayer(p)} showHeatmap={showHeatmap} />
              ))}
            </div>

            {/* Row 4: FWD (Home) */}
            <div className="flex justify-around px-12">
              {homeSubsets.fwd.map((p, i) => (
                <PlayerNode key={p.name} player={p} isHome={true} onClick={() => setSelectedPlayer(p)} showHeatmap={showHeatmap} />
              ))}
            </div>

          </div>

        </div>

        {/* Selected Player Status Card Popup (Micro Tooltip overlay) */}
        {selectedPlayer && (
          <div className="absolute inset-x-4 bottom-4 z-20 bg-[#0d1512]/95 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between text-white backdrop-blur-md shadow-2xl animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full border border-emerald-500/50 flex items-center justify-center font-black bg-emerald-500/10 text-emerald-400">
                {selectedPlayer.number}
              </div>
              <div>
                <h5 className="font-extrabold text-sm text-white">{selectedPlayer.name}</h5>
                <p className="text-[10px] text-gray-400 uppercase font-black block mt-0.5">
                  المركز • {
                    selectedPlayer.position === 'GK' ? 'حارس مرمى' :
                    selectedPlayer.position === 'DEF' ? 'مدافع' :
                    selectedPlayer.position === 'MID' ? 'خط وسط' : 'مهاجم'
                  }
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {selectedPlayer.subbedOut && (
                <div className="text-right">
                  <span className="text-[10px] text-red-400 font-extrabold flex items-center gap-1">
                    <ArrowDownLeft size={12} />
                    تم تبديله ({selectedPlayer.subTime})
                  </span>
                  <span className="text-[9px] text-gray-400 block mt-0.5">البديل: {selectedPlayer.subPlayer}</span>
                </div>
              )}
              {!selectedPlayer.subbedOut && (
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  خاض المباراة كاملة ⚡
                </span>
              )}
              <button 
                onClick={() => navigate(`/player/${encodeURIComponent(selectedPlayer.name)}`)}
                className="p-1 px-2.5 bg-primary/20 border border-primary/30 text-primary rounded-lg text-xs hover:bg-primary/30 transition-colors font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>الملف الشخصي 👤</span>
              </button>
              <button 
                onClick={() => setSelectedPlayer(null)}
                className="p-1 px-2.5 bg-white/10 rounded-lg text-xs hover:bg-white/20 transition-colors border border-white/5 font-bold cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Starting Squad Table Lists & Substitutes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        {/* Home Team Starting XI List */}
        <div className="glass p-5 rounded-3xl space-y-4 border border-white/5">
          <div className="flex justify-between items-center border-b border-white/5 pb-3">
            <h4 className="font-black text-sm text-gray-200 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary" />
              <span 
                onClick={() => navigate(`/team/${encodeURIComponent(match.homeTeam)}`)}
                className="cursor-pointer hover:text-primary transition-colors hover:underline decoration-primary decoration-2 underline-offset-4"
              >
                تشكيلة {match.homeTeam} الأساسية
              </span>
            </h4>
            <span className="text-[10px] font-black uppercase text-primary/80 bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
              {homeRoster.formation}
            </span>
          </div>
          
          <div className="divide-y divide-white/[0.03] space-y-2.5">
            {homeRoster.players.map((p) => (
              <PlayerListItem key={p.name} player={p} isHome={true} />
            ))}
          </div>

          {/* Substitutes */}
          <div className="pt-4 border-t border-white/5 space-y-3">
            <h5 
              onClick={() => navigate(`/team/${encodeURIComponent(match.homeTeam)}`)}
              className="text-xs font-black text-gray-400 cursor-pointer hover:text-primary transition-colors"
            >
              قائمة بدلاء {match.homeTeam}
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-right">
              {homeRoster.substitutes.map((s) => (
                <div key={s.name} className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.01] border border-white/[0.03] text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-[10px] font-black text-gray-400 w-4">{s.number}</span>
                    <span className="font-bold text-gray-300 truncate">{s.name}</span>
                  </div>
                  {s.subbedIn && (
                    <span className="text-[9px] font-black text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      <ArrowUpRight size={10} />
                      {s.subTime}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Away Team Starting XI List */}
        <div className="glass p-5 rounded-3xl space-y-4 border border-white/5">
          <div className="flex justify-between items-center border-b border-white/5 pb-3">
            <h4 className="font-black text-sm text-gray-200 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
              <span 
                onClick={() => navigate(`/team/${encodeURIComponent(match.awayTeam)}`)}
                className="cursor-pointer hover:text-secondary transition-colors hover:underline decoration-secondary decoration-2 underline-offset-4"
              >
                تشكيلة {match.awayTeam} الأساسية
              </span>
            </h4>
            <span className="text-[10px] font-black uppercase text-secondary/80 bg-secondary/10 px-2 py-0.5 rounded border border-secondary/20">
              {awayRoster.formation}
            </span>
          </div>

          <div className="divide-y divide-white/[0.03] space-y-2.5">
            {awayRoster.players.map((p) => (
              <PlayerListItem key={p.name} player={p} isHome={false} />
            ))}
          </div>

          {/* Substitutes */}
          <div className="pt-4 border-t border-white/5 space-y-3">
            <h5 
              onClick={() => navigate(`/team/${encodeURIComponent(match.awayTeam)}`)}
              className="text-xs font-black text-gray-400 cursor-pointer hover:text-secondary transition-colors"
            >
              قائمة بدلاء {match.awayTeam}
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-right">
              {awayRoster.substitutes.map((s) => (
                <div key={s.name} className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.01] border border-white/[0.03] text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-[10px] font-black text-gray-400 w-4">{s.number}</span>
                    <span className="font-bold text-gray-300 truncate">{s.name}</span>
                  </div>
                  {s.subbedIn && (
                    <span className="text-[9px] font-black text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      <ArrowUpRight size={10} />
                      {s.subTime}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Substitutions Timeline feed */}
      {substitutions.length > 0 && (
        <div className="glass p-5 rounded-3xl border border-white/5 space-y-4">
          <h4 className="font-black text-sm text-gray-200 flex items-center gap-2">
            <RefreshCw size={14} className="text-emerald-400 animate-spin-slow" />
            سجل تبديلات اللقاء
          </h4>
          <div className="relative border-r border-white/5 mr-3 pr-4 py-2 space-y-6">
            {substitutions.map((sub, i) => (
              <div key={i} className="relative flex items-start gap-3">
                {/* Timeline node dot */}
                <div className="absolute top-1 -right-[23px] w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-background ring-4 ring-emerald-400/15" />
                <span className="text-xs font-black text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-lg border border-emerald-400/10">
                  د {sub.time.replace("'", "")}
                </span>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-black text-white">{sub.team}</span>
                    <span className="text-[10px] font-bold text-gray-500">•</span>
                    <span className="text-[11px] font-bold text-gray-400">دخول: </span>
                    <span className="text-xs font-black text-emerald-400">{sub.inPlayer}</span>
                    <span className="text-[10px] text-gray-500 font-bold">بدلاً من</span>
                    <span className="text-xs font-black text-red-400">{sub.outPlayer}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------- PLAYER NODE RENDERED ON FIELD ----------------
interface PlayerNodeProps {
  player: Player;
  isHome: boolean;
  onClick: () => void;
  showHeatmap: boolean;
}

function PlayerNode({ player, isHome, onClick, showHeatmap }: PlayerNodeProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const stats = React.useMemo(() => generatePlayerStats(player), [player]);

  const isTopTeamGKOrDef = !isHome && (player.position === 'GK' || player.position === 'DEF');
  const tooltipPlacementClass = isTopTeamGKOrDef ? "top-full mt-2.5" : "bottom-full mb-2.5";

  return (
    <motion.button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.9 }}
      className="flex flex-col items-center gap-1 cursor-pointer outline-none relative group"
    >
      {/* Localized player heat aura */}
      {showHeatmap && (
        <div 
          className="absolute -inset-4 rounded-full -z-10 bg-[radial-gradient(circle,rgba(239,68,68,0.32)_0%,rgba(245,158,11,0.1)_60%,rgba(0,0,0,0)_100%)] animate-pulse pointer-events-none"
        />
      )}
      
      {/* Hover-glowing player movement zone */}
      {isHovered && showHeatmap && (
        <div 
          className="absolute -inset-10 rounded-full -z-20 bg-[radial-gradient(circle,rgba(239,68,68,0.45)_0%,rgba(245,158,11,0.2)_50%,rgba(0,0,0,0)_100%)] animate-ping duration-1000 pointer-events-none"
        />
      )}

      {/* Jersey circle with glowing state */}
      <div 
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-[11px] border shadow-md relative transition-all duration-300",
          isHome 
            ? "bg-primary/10 border-primary text-primary group-hover:bg-primary/20 group-hover:shadow-[0_0_15px_rgba(250,204,21,0.4)]" 
            : "bg-secondary/10 border-secondary text-secondary group-hover:bg-secondary/20 group-hover:shadow-[0_0_15px_rgba(59,130,246,0.4)]"
        )}
      >
        <span>{player.number}</span>
        
        {/* Red substitution arrow if subbed out */}
        {player.subbedOut && (
          <div className="absolute -top-1 -left-1 bg-red-500/90 text-white rounded-full p-0.5 border border-background shadow-md">
            <RefreshCw size={8} className="animate-spin-slow text-white" />
          </div>
        )}
      </div>

      {/* Player name label styled defensively for readability on complex pitch backgrounds */}
      <span className="px-1.5 py-0.5 rounded-md bg-[#011408]/95 border border-white/5 text-[9px] sm:text-[10px] font-extrabold text-gray-100 max-w-[80px] sm:max-w-[100px] truncate block text-center shadow-lg">
        {player.name.split(' ')[0]}
      </span>

      {/* Exquisite Floating Hover Tooltip with Player Statistics */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: isTopTeamGKOrDef ? -6 : 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: isTopTeamGKOrDef ? -6 : 6 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute left-1/2 -translate-x-1/2 z-50 w-52 p-3.5 rounded-2xl",
              "bg-[#0e2217]/95 border border-emerald-500/30 text-white shadow-2xl backdrop-blur-md pointer-events-none select-none text-right font-sans",
              tooltipPlacementClass
            )}
            style={{ direction: 'rtl' }}
          >
            {/* Caret Arrow */}
            <div 
              className={cn(
                "absolute w-2 h-2 rotate-45 bg-[#0e2217] border-emerald-500/30",
                isTopTeamGKOrDef 
                  ? "-top-1 left-1/2 -translate-x-1/2 border-t border-l" 
                  : "-bottom-1 left-1/2 -translate-x-1/2 border-r border-b"
              )} 
            />

            {/* Header: Name, Position, Number, Rating */}
            <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
              <div className="text-right">
                <div className="font-black text-xs text-white truncate max-w-[130px]">{player.name}</div>
                <div className="text-[9px] text-emerald-400 font-extrabold mt-0.5 flex items-center gap-1">
                  <span>
                    {player.position === 'GK' && 'حارس مرمى'}
                    {player.position === 'DEF' && 'مدافع'}
                    {player.position === 'MID' && 'لاعب وسط'}
                    {player.position === 'FWD' && 'مهاجم'}
                  </span>
                  <span>•</span>
                  <span>#{player.number}</span>
                </div>
              </div>
              <div className={cn(
                "px-2 py-0.5 rounded-lg border text-[10px] font-black flex items-center gap-0.5 shadow-sm",
                stats.rating >= 8.0 
                  ? "text-emerald-400 bg-emerald-500/15 border-emerald-500/30"
                  : stats.rating >= 7.2
                  ? "text-yellow-400 bg-yellow-400/15 border-yellow-400/30"
                  : "text-amber-500 bg-amber-500/15 border-amber-500/30"
              )}>
                <Award size={10} className="inline-block" />
                {stats.rating}
              </div>
            </div>

            {/* Statistics rows */}
            <div className="space-y-2 text-[10px] font-bold">
              {/* Passes Completed */}
              <div className="flex items-center justify-between">
                <span className="text-gray-400 flex items-center gap-1 font-semibold">
                  <Zap size={10} className="text-emerald-400" />
                  التمريرات ناجحة
                </span>
                <span className="text-gray-200">
                  {stats.passesCompleted}/{stats.passesAttempted} ({Math.round((stats.passesCompleted / stats.passesAttempted) * 100)}%)
                </span>
              </div>

              {/* Duels Won */}
              <div className="flex items-center justify-between">
                <span className="text-gray-400 flex items-center gap-1 font-semibold">
                  <Shield size={10} className="text-emerald-400" />
                  الالتحامات بدقة
                </span>
                <span className="text-gray-200">
                  {stats.duelsWon}/{stats.duelsTotal}
                </span>
              </div>

              {/* Dynamic extra 1 */}
              <div className="flex items-center justify-between">
                <span className="text-gray-400 flex items-center gap-1 font-semibold">
                  <Activity size={10} className="text-emerald-400 animate-pulse" />
                  {stats.extraLabel1}
                </span>
                <span className="text-emerald-400 font-black">
                  {stats.extraValue1}
                </span>
              </div>

              {/* Dynamic extra 2 */}
              <div className="flex items-center justify-between">
                <span className="text-gray-400 flex items-center gap-1 font-semibold">
                  <Info size={10} className="text-emerald-400" />
                  {stats.extraLabel2}
                </span>
                <span className="text-gray-200">
                  {stats.extraValue2}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

// ---------------- PLAYER LIST ITEM RENDERED IN LIST ----------------
interface PlayerListItemProps {
  player: Player;
  isHome: boolean;
}

function PlayerListItem({ player, isHome }: PlayerListItemProps) {
  return (
    <div className="flex items-center justify-between py-2.5 text-right">
      <div className="flex items-center gap-3">
        <span className={cn(
          "w-7 h-7 rounded-lg flex items-center justify-center font-black text-[11px] border",
          isHome ? "bg-primary/10 border-primary/20 text-primary" : "bg-secondary/10 border-secondary/20 text-secondary"
        )}>
          {player.number}
        </span>
        <div>
          <h5 className="text-xs font-black text-white">{player.name}</h5>
          <span className="text-[9px] text-gray-500 font-bold block">
            {
              player.position === 'GK' ? 'حارس مرمى' :
              player.position === 'DEF' ? 'مدافع' :
              player.position === 'MID' ? 'لاعب وسط' : 'مهاجم'
            }
          </span>
        </div>
      </div>
      
      {player.subbedOut && player.subPlayer && (
        <div className="flex items-center gap-2">
          <div className="text-left">
            <span className="text-[10px] text-red-400 font-extrabold flex items-center gap-0.5 justify-end">
              <ArrowDownLeft size={11} />
              خرج {player.subTime}
            </span>
            <span className="text-[9px] text-gray-500 block">البديل: {player.subPlayer}</span>
          </div>
        </div>
      )}
    </div>
  );
}
