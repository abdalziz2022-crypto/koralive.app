import React from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, 
  TrendingUp, 
  ArrowLeftRight, 
  Tv, 
  AlertTriangle, 
  Trophy, 
  AlertCircle, 
  ArrowUpRight, 
  ArrowDownLeft 
} from 'lucide-react';
import { Match } from '../types';

export interface TimelineEvent {
  id: string;
  minute: number;
  type: 'goal' | 'yellow_card' | 'red_card' | 'sub' | 'var' | 'milestone';
  team?: 'home' | 'away';
  player?: string;
  detail?: string;
  playerOut?: string; // For subs
  subType?: 'penalty' | 'own_goal' | 'normal'; // For goals
  varType?: 'cancelled' | 'confirmed'; // For VAR
  scoreAtMinute?: string; // e.g. "1 - 0"
}

// Deterministic generator for rich match events, score progressive line & VAR reviews
export function generateMatchEvents(match: Match): TimelineEvent[] {
  let hash = 0;
  const combinedTeams = (match.homeTeam + match.awayTeam);
  for (let i = 0; i < combinedTeams.length; i++) {
    hash = combinedTeams.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash);

  const events: TimelineEvent[] = [];

  // Goal scorers pool
  const homeScorers = [
    'كريستيانو رونالدو', 'كريم بنزيما', 'فيل فودين', 'هاري كين', 'محمد صلاح', 'ليفاندوفسكي', 'كيليان مبابي', 'إيرلينغ هالاند', 'جود بيلينغهام'
  ];
  const awayScorers = [
    'لويس دياز', 'بوكايو ساكا', 'عمر مرموش', 'رياض محرز', 'ليروي ساني', 'جادون سانشو', 'ماركوس راشفورد', 'أنطوان غريزمان', 'أرتيم دوفبيك'
  ];

  const homeAssists = ['كيفين دي بروين', 'برناردو سيلفا', 'فيديريكو فالفيردي', 'توني كروس', 'ألكسندر أرنولد', 'ماك أليستير'];
  const awayAssists = ['مارتن أوديغارد', 'ديكلان رايس', 'جمال موسيالا', 'سيرج غنابري', 'داني أولمو', 'أليكس غريمالدو'];

  // Add Home Goals
  const homeGoalsCount = match.homeScore || 0;
  const homeGoalMins = [14, 38, 56, 76, 89].map((min, idx) => (min + (hash % (idx + 6))) % 90).sort((a, b) => a - b);
  for (let i = 0; i < homeGoalsCount; i++) {
    const min = homeGoalMins[i % homeGoalMins.length] || (15 + i * 20);
    const scorerIdx = (hash + i) % homeScorers.length;
    const assistIdx = (hash * (i + 1)) % homeAssists.length;
    
    // Add goal variety (penalties, standard)
    const subType = (hash + i) % 4 === 0 ? 'penalty' : 'normal';

    events.push({
      id: `h-goal-${i}`,
      minute: min,
      type: 'goal',
      team: 'home',
      player: homeScorers[scorerIdx],
      subType,
      detail: subType === 'penalty' ? 'ركلة جزاء ناجحة' : `صناعة: ${homeAssists[assistIdx]}`
    });
  }

  // Add Away Goals
  const awayGoalsCount = match.awayScore || 0;
  const awayGoalMins = [24, 42, 65, 82, 87].map((min, idx) => (min + (hash % (idx + 8))) % 90).sort((a, b) => a - b);
  for (let i = 0; i < awayGoalsCount; i++) {
    const min = awayGoalMins[i % awayGoalMins.length] || (25 + i * 18);
    const scorerIdx = (hash + i + 2) % awayScorers.length;
    const assistIdx = (hash * (i + 3)) % awayAssists.length;

    // Own goal variety
    const isOwnGoal = (hash + i) % 5 === 0;
    const subType = isOwnGoal ? 'own_goal' : 'normal';

    events.push({
      id: `a-goal-${i}`,
      minute: min,
      type: 'goal',
      team: 'away',
      player: isOwnGoal ? homeScorers[(scorerIdx + 4) % homeScorers.length] : awayScorers[scorerIdx],
      subType,
      detail: isOwnGoal ? 'هدف عكسي في مرماه' : `صناعة: ${awayAssists[assistIdx]}`
    });
  }

  if (match.status !== 'UPCOMING') {
    // Deterministic cards
    const yellowCount = 2 + (hash % 4);
    for (let c = 0; c < yellowCount; c++) {
      const isHomeCard = (hash + c) % 2 === 0;
      const min = (12 + (hash % 12) + (c * 19)) % 90;
      const team = isHomeCard ? 'home' : 'away';
      
      const homeDefenders = ['روبن دياز', 'مانويل أكانجي', 'جوسكو غفارديول', 'ناثان أكي', 'كايل ووكر'];
      const awayDefenders = ['ويليام ساليبا', 'غابرييل ماغاليس', 'بن وايت', 'يوريان تيمبر', 'أولكسندر زينتشينكو'];
      
      const defender = team === 'home' 
        ? homeDefenders[(hash + c) % homeDefenders.length]
        : awayDefenders[(hash + c) % awayDefenders.length];

      const detailsList = ['تدخل خشين', 'اعتراض على قرار الحكم', 'إضاعة الوقت', 'عرقلة هجمة واعدة'];

      events.push({
        id: `card-yellow-${c}`,
        minute: min === 0 ? 41 : min,
        type: 'yellow_card',
        team,
        player: defender,
        detail: detailsList[(hash + c) % detailsList.length]
      });
    }

    // Deterministic Substitutions
    const subCount = 2 + (hash % 3);
    for (let s = 0; s < subCount; s++) {
      const isHomeSub = (hash + s + 2) % 2 === 0;
      const min = 55 + (s * 9) + (hash % 5);
      const team = isHomeSub ? 'home' : 'away';
      
      const homeOut = ['ماتيو كوفاسيتش', 'جاك غريليش', 'جون ستونز', 'خوليان ألفاريز'];
      const homeIn = ['جيريمي دوكو', 'ماتيوس نونيز', 'ريكو لويس', 'أوسكار بوب'];
      
      const awayOut = ['توماس بارتي', 'لياندرو تروسار', 'كايل هافيرتز', 'غابرييل جيسوس'];
      const awayIn = ['جورجينيو', 'غابرييل مارتينيلي', 'إيثان نوانيري', 'رحيم ستيرلينغ'];

      events.push({
        id: `sub-${s}`,
        minute: min > 90 ? 84 : min,
        type: 'sub',
        team,
        player: team === 'home' ? homeIn[(hash + s) % homeIn.length] : awayIn[(hash + s) % awayIn.length],
        playerOut: team === 'home' ? homeOut[(hash + s) % homeOut.length] : awayOut[(hash + s) % awayOut.length],
        detail: 'تبديل تكتيكي'
      });
    }

    // Add Red cards based on stats
    if (match.stats?.redCards?.home && match.stats.redCards.home > 0) {
      events.push({
        id: 'red-home-direct',
        minute: 74,
        type: 'red_card',
        team: 'home',
        player: 'جوسكو غفارديول',
        detail: 'بطاقة حمراء مباشرة بعد مراجعة الـ VAR لتدخل عنيف'
      });
    }
    if (match.stats?.redCards?.away && match.stats.redCards.away > 0) {
      events.push({
        id: 'red-away-direct',
        minute: 85,
        type: 'red_card',
        team: 'away',
        player: 'بن وايت',
        detail: 'بطاقة حمراء لمنع فرصة هدف محقق صريح'
      });
    }

    // Deterministic VAR Events
    // Let's add at least one simulated VAR check for high-fidelity realism!
    const varMinutes = [28, 51, 69, 72];
    const targetVarMin = varMinutes[hash % varMinutes.length];
    
    if (hash % 2 === 0) {
      events.push({
        id: `var-disallowed-goal`,
        minute: targetVarMin,
        type: 'var',
        team: hash % 4 === 0 ? 'home' : 'away',
        player: hash % 4 === 0 ? homeScorers[hash % homeScorers.length] : awayScorers[hash % awayScorers.length],
        varType: 'cancelled',
        detail: 'إلغاء هدف بعد المراجعة بداعي وجود تسلل مسبق ❌'
      });
    } else {
      events.push({
        id: `var-confirmed-penalty`,
        minute: targetVarMin,
        type: 'var',
        team: hash % 3 === 0 ? 'away' : 'home',
        player: hash % 3 === 0 ? awayScorers[2] : homeScorers[1],
        varType: 'confirmed',
        detail: 'احتساب ركلة جزاء بعد مراجعة لمسة يد داخل صندوق العمليات ✅'
      });
    }
  }

  // Sort events chronologically to compute score changes accurately
  const sorted = events.sort((a, b) => a.minute - b.minute);

  let runHome = 0;
  let runAway = 0;

  // Add progression score to each goal event
  const eventsWithScores = sorted.map(ev => {
    if (ev.type === 'goal') {
      if (ev.team === 'home') {
        runHome++;
      } else {
        runAway++;
      }
      return {
        ...ev,
        scoreAtMinute: `${runHome} - ${runAway}`
      };
    }
    return ev;
  });

  // Inject Match Milestones (Halftime & Fulltime)
  const finalTimeline: TimelineEvent[] = [];
  
  // Halftime whistle (placed chronologically)
  let halftimeAdded = false;
  eventsWithScores.forEach(ev => {
    if (ev.minute > 45 && !halftimeAdded) {
      finalTimeline.push({
        id: 'halftime-whistle',
        minute: 45,
        type: 'milestone',
        detail: 'نهاية الشوط الأول واستراحة قصيرة للاعبين ☕'
      });
      halftimeAdded = true;
    }
    finalTimeline.push(ev);
  });

  if (!halftimeAdded) {
    finalTimeline.push({
      id: 'halftime-whistle',
      minute: 45,
      type: 'milestone',
      detail: 'نهاية الشوط الأول واستراحة قصيرة للاعبين ☕'
    });
  }

  // Fulltime whistle at the end
  if (match.status === 'FINISHED') {
    finalTimeline.push({
      id: 'fulltime-whistle',
      minute: 90,
      type: 'milestone',
      detail: `صافرة نهاية المباراة بنتيجة تفصيلية ${match.homeScore} - ${match.awayScore} 🏁`
    });
  }

  // Final chronological sort ensuring milestones fit right in
  return finalTimeline.sort((a, b) => a.minute - b.minute);
}

interface TimelineViewProps {
  match: Match;
}

export default function TimelineView({ match }: TimelineViewProps) {
  const navigate = useNavigate();
  const events = React.useMemo(() => generateMatchEvents(match), [match]);

  if (match.status === 'UPCOMING') {
    return (
      <div className="py-20 text-center space-y-5" style={{ direction: 'rtl' }}>
        <div className="w-20 h-20 bg-[#0e2217]/60 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto shadow-[0_4px_24px_rgba(0,255,130,0.06)]">
          <Clock size={32} className="text-primary animate-pulse" />
        </div>
        <div className="space-y-2">
          <p className="text-white font-black text-lg">بانتظار صافرة البداية</p>
          <p className="text-gray-400 font-bold text-xs max-w-sm mx-auto px-4 leading-relaxed">
            سيتم تحديث الأحداث والمجريات مباشرة (الأهداف، البطاقات، التبديلات الميدانية وتقنية الـ VAR) فور انطلاق اللقاء ⚽
          </p>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="py-16 text-center text-gray-500 font-bold text-sm" style={{ direction: 'rtl' }}>
        لا توجد أحداث مسجلة في هذه المباراة حتى الآن.
      </div>
    );
  }

  return (
    <div className="space-y-8 pt-2" style={{ direction: 'rtl' }}>
      {/* Tab Header Status */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="text-primary animate-pulse" size={18} />
          <h3 className="text-sm font-black text-white">الجدول الحركي لأحداث المباراة</h3>
        </div>
        <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
          <span className={`w-2 h-2 rounded-full ${match.status === 'LIVE' ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`} />
          {match.status === 'LIVE' ? 'مباشر الآن' : 'انتهى اللقاء'}
        </span>
      </div>

      {/* Timeline core tree */}
      <div className="relative mt-8 select-none">
        
        {/* Central timeline axis line (Visible only on desktop md and up) */}
        <div className="absolute left-1/2 -translate-x-1/2 top-4 bottom-4 w-[2px] bg-gradient-to-b from-primary/30 via-white/5 to-transparent hidden md:block" />

        {/* Left timeline axis line (Visible only on mobile) */}
        <div className="absolute right-4 top-4 bottom-4 w-[2px] bg-gradient-to-b from-primary/30 via-white/5 to-transparent block md:hidden" />

        <div className="space-y-8 relative">
          {events.map((event, idx) => {
            const isHome = event.team === 'home';
            const isMilestone = event.type === 'milestone';

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ delay: Math.min(idx * 0.05, 0.3), duration: 0.35, ease: 'easeOut' }}
                className={`relative flex flex-col md:flex-row items-stretch md:items-center w-full ${
                  isMilestone 
                    ? 'justify-center' 
                    : isHome 
                      ? 'md:flex-row' // Home aligns to the right side of the screen
                      : 'md:flex-row-reverse' // Away aligns to the left side
                }`}
              >
                
                {/* 1. Minute Badge Node */}
                {/* On desktop: absolutely centered. On mobile: absolute right-0 */}
                <div className={`absolute z-20 top-2 md:top-1/2 md:-translate-y-1/2 ${
                  isMilestone 
                    ? 'left-1/2 -translate-x-1/2' 
                    : 'right-1.5 md:left-1/2 md:-translate-x-1/2'
                }`}>
                  <div className={`w-7 h-7 rounded-xl border flex items-center justify-center font-sans font-black text-[10px] shadow-lg transition-transform hover:scale-110 ${
                    isMilestone
                      ? 'bg-slate-900 border-slate-700 dark:bg-black dark:border-white/20 text-white'
                      : event.type === 'goal'
                        ? 'bg-emerald-500 border-emerald-400 text-slate-950 ring-4 ring-emerald-500/20 dark:ring-emerald-500/10'
                        : event.type === 'var'
                          ? 'bg-indigo-600 border-indigo-400 text-white ring-4 ring-indigo-500/20'
                          : 'bg-surface border-border text-slate-700 dark:text-gray-300'
                  }`}>
                    {event.minute}'
                  </div>
                </div>

                {/* 2. Left side spacer/balancer for Desktop dual columns */}
                <div className="hidden md:block w-1/2 shrink-0 px-8" />

                {/* 3. Event Card Content */}
                {/* Takes half-width on desktop, full-width with a right-padding on mobile */}
                <div className={`w-full md:w-1/2 shrink-0 px-4 pr-12 md:pr-8 md:pl-8 ${
                  isMilestone ? 'md:max-w-md mx-auto !px-0' : ''
                }`}>
                  
                  {isMilestone ? (
                    /* MILESTONE CARD */
                    <div className="bg-surface/60 border border-border p-4 rounded-2xl text-center space-y-1.5 backdrop-blur-sm shadow-sm relative overflow-hidden">
                      <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider block">
                        {event.minute === 45 ? 'انتصاف الوقت ⏳' : 'صافرة النهاية 🏁'}
                      </span>
                      <p className="text-xs font-bold text-slate-700 dark:text-gray-300">{event.detail}</p>
                    </div>
                  ) : (
                    /* INTERACTIVE EVENT CARD */
                    <div className={`relative bg-surface border hover:border-slate-300 dark:hover:border-white/15 p-4 rounded-2xl transition-all duration-300 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.15)] group overflow-hidden ${
                      event.type === 'goal'
                        ? 'border-emerald-500/25 border-r-4 border-r-emerald-500'
                        : event.type === 'red_card'
                          ? 'border-red-500/25 border-r-4 border-r-red-500 animate-pulse'
                          : event.type === 'yellow_card'
                            ? 'border-yellow-500/25 border-r-4 border-r-yellow-500'
                            : event.type === 'var'
                              ? 'border-indigo-500/25 border-r-4 border-r-indigo-500'
                              : 'border-sky-500/25 border-r-4 border-r-sky-500'
                    }`}>
                      
                      {/* Dynamic Background subtle glows */}
                      <div className={`absolute -right-20 -top-20 w-40 h-40 rounded-full filter blur-3xl opacity-[0.03] dark:opacity-[0.06] transition-opacity duration-300 group-hover:opacity-[0.08] dark:group-hover:opacity-[0.12] pointer-events-none ${
                        event.type === 'goal' ? 'bg-emerald-500' :
                        event.type === 'red_card' ? 'bg-red-500' :
                        event.type === 'yellow_card' ? 'bg-yellow-500' :
                        event.type === 'var' ? 'bg-indigo-500' :
                        'bg-blue-500'
                      }`} />

                      <div className="flex items-center justify-between gap-3 relative z-10">
                        <div className="flex items-center gap-3">
                          
                          {/* Event Specific High-Fidelity Icon */}
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 relative transition-transform group-hover:scale-105`}>
                            
                            {/* GOAL: Spinning ball inside dual glowing circles with award stars */}
                            {event.type === 'goal' && (
                              <div className="relative flex items-center justify-center w-8 h-8">
                                <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping opacity-60" />
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
                                  className="text-[19px] relative z-20 select-none drop-shadow-[0_2px_8px_rgba(16,185,129,0.5)]"
                                >
                                  ⚽
                                </motion.div>
                                <motion.div 
                                  animate={{ y: [-2, 1, -2] }}
                                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                                  className="absolute -top-1.5 -right-1 text-[9px]"
                                >
                                  ⭐
                                </motion.div>
                              </div>
                            )}

                            {/* YELLOW CARD: 3D Glossy Card with shadow depth & overlay warning indicator */}
                            {event.type === 'yellow_card' && (
                              <div className="relative w-8 h-8 flex items-center justify-center">
                                <motion.div 
                                  whileHover={{ scale: 1.15, rotate: 15 }}
                                  className="relative w-[13px] h-[19px] rounded-[3px] bg-gradient-to-tr from-amber-500 via-yellow-400 to-yellow-300 shadow-[0_3px_10px_rgba(234,179,8,0.35)] border border-yellow-200/50 transform -rotate-6 transition-all"
                                >
                                  {/* Glossy overlay sheen */}
                                  <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent rounded-[2px]" />
                                  <div className="absolute inset-0 flex items-center justify-center text-[7px] font-black text-amber-950 font-sans select-none leading-none">
                                    !
                                  </div>
                                </motion.div>
                                <div className="absolute w-[11px] h-[17px] rounded-[3px] bg-amber-600/20 dark:bg-amber-600/30 transform rotate-12 -z-10 translate-x-1" />
                              </div>
                            )}

                            {/* RED CARD: Beautiful glowing warning card */}
                            {event.type === 'red_card' && (
                              <div className="relative w-8 h-8 flex items-center justify-center">
                                <div className="absolute inset-0 rounded-full bg-rose-500/10 dark:bg-rose-500/20 animate-pulse" />
                                <motion.div 
                                  whileHover={{ scale: 1.15, rotate: -15 }}
                                  className="relative w-[13px] h-[19px] rounded-[3px] bg-gradient-to-tr from-red-600 via-rose-500 to-rose-400 shadow-[0_3px_10px_rgba(239,68,68,0.4)] border border-rose-300/40 transform rotate-6 transition-all"
                                >
                                  {/* Glossy overlay sheen */}
                                  <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent rounded-[2px]" />
                                  <div className="absolute inset-0 flex items-center justify-center text-[7px] font-black text-rose-950 font-sans select-none leading-none">
                                    ✕
                                  </div>
                                </motion.div>
                                <div className="absolute w-[11px] h-[17px] rounded-[3px] bg-rose-950/40 transform -rotate-12 -z-10 -translate-x-1" />
                              </div>
                            )}

                            {/* SUBSTITUTION: Elegant player exchange dashboard (rotating outer ring & dual overlay cards) */}
                            {event.type === 'sub' && (
                              <div className="relative w-10 h-10 flex items-center justify-center">
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ repeat: Infinity, duration: 18, ease: "linear" }}
                                  className="absolute inset-0 rounded-full border border-sky-500/15 border-t-emerald-400 border-b-rose-400"
                                />
                                <div className="relative flex items-center justify-center gap-0.5">
                                  <div className="w-4 h-4 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-sm">
                                    <ArrowUpRight size={10} className="text-emerald-500 dark:text-emerald-400 font-extrabold" />
                                  </div>
                                  <div className="w-4 h-4 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center shadow-sm">
                                    <ArrowDownLeft size={10} className="text-red-500 dark:text-rose-400 font-extrabold" />
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* VAR SCREEN: Custom HUD console with glowing scanner laser sweeper */}
                            {event.type === 'var' && (
                              <div className="relative w-9 h-7 bg-slate-950 rounded-md border border-indigo-500/40 overflow-hidden flex items-center justify-center shadow-[0_3px_10px_rgba(99,102,241,0.25)]">
                                <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.06)_1px,transparent_1px)] bg-[size:3px_3px]" />
                                <motion.div 
                                  animate={{ translateY: [-10, 10, -10] }}
                                  transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                                  className="absolute h-[1.5px] w-full bg-indigo-400 shadow-[0_0_6px_#6366f1]"
                                />
                                <span className="absolute top-0.5 right-0.5 w-[3px] h-[3px] rounded-full bg-rose-500 animate-pulse" />
                                <Tv size={11} className="text-indigo-400 relative z-10 animate-pulse" />
                                <div className="absolute inset-0.5 border border-indigo-500/20 rounded-[3px] pointer-events-none" />
                              </div>
                            )}

                          </div>

                          <div className="text-right">
                            
                            {/* Top Meta Tag info */}
                            <span className={`text-[9px] font-black uppercase tracking-wider block ${
                              event.type === 'goal' ? 'text-emerald-600 dark:text-emerald-400' :
                              event.type === 'red_card' ? 'text-red-600 dark:text-red-400 animate-pulse' :
                              event.type === 'yellow_card' ? 'text-amber-600 dark:text-yellow-400' :
                              event.type === 'sub' ? 'text-sky-600 dark:text-sky-400' :
                              'text-indigo-600 dark:text-indigo-400'
                            }`}>
                              {event.type === 'goal' && (
                                event.subType === 'penalty' ? 'ركلة جزاء ناجحة 🎯' :
                                event.subType === 'own_goal' ? 'هدف عكسي خطأ ⚠️' :
                                'هدف رائع 🥅'
                              )}
                              {event.type === 'yellow_card' && 'بطاقة صفراء رسمية'}
                              {event.type === 'red_card' && 'طرد بطاقة حمراء مباشرة ⚔️'}
                              {event.type === 'sub' && 'تبديل تكتيكي'}
                              {event.type === 'var' && 'مراجعة تقنية الفيديو VAR 🖥️'}
                            </span>

                            {/* Main Subject Name / Action Title */}
                            {event.type === 'sub' ? (
                              <div className="mt-1 space-y-1">
                                <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                  <ArrowUpRight size={11} className="shrink-0" />
                                  <span className="cursor-pointer hover:underline" onClick={() => event.player && navigate(`/player/${encodeURIComponent(event.player)}`)}>دخول: {event.player}</span>
                                </span>
                                <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-gray-400">
                                  <ArrowDownLeft size={11} className="text-red-500 shrink-0" />
                                  <span className="cursor-pointer hover:underline hover:text-red-500 dark:hover:text-red-300" onClick={() => event.playerOut && navigate(`/player/${encodeURIComponent(event.playerOut)}`)}>خروج: {event.playerOut}</span>
                                </span>
                              </div>
                            ) : event.type === 'var' ? (
                              <span className="text-xs font-black text-slate-800 dark:text-gray-200 block mt-0.5">
                                {event.varType === 'cancelled' ? 'إلغاء الهدف' : 'تأكيد المخالفة واحتساب القرار'}
                              </span>
                            ) : (
                              <span 
                                onClick={() => event.player && navigate(`/player/${encodeURIComponent(event.player)}`)}
                                className="text-xs font-black text-slate-900 dark:text-white mt-0.5 block hover:text-primary hover:underline cursor-pointer transition-colors"
                              >
                                {event.player}
                              </span>
                            )}

                            {/* Additional Details info below */}
                            {event.type !== 'sub' && event.detail && (
                              <span className="text-[10px] font-medium text-slate-500 dark:text-gray-400 mt-1 block leading-relaxed">
                                {event.detail}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Right aligned scoreboard, Team Logo or VAR Decision Status */}
                        <div className="text-left shrink-0">
                          
                          {event.type === 'goal' && event.scoreAtMinute ? (
                            /* SCOREBOARD DISPLAY indicator for goals */
                            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-black px-2.5 py-1 rounded-xl tracking-wider select-none tabular-nums font-mono">
                              {event.scoreAtMinute}
                            </div>
                          ) : (
                            /* TEAM EMBLEM OR RECENT UPDATE */
                            <div className="flex flex-col items-end">
                              <span className="text-[10px] font-black text-slate-600 dark:text-gray-400 bg-surface-hover/30 border border-border px-2.5 py-1 rounded-lg">
                                {isHome ? match.homeTeam : match.awayTeam}
                              </span>
                            </div>
                          )}
                        </div>

                      </div>

                    </div>
                  )}

                </div>

              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
