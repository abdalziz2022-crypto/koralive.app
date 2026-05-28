import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Globe, 
  Search, 
  Flame, 
  Activity, 
  Compass, 
  Plus,
  Trash2,
  Check,
  AlertCircle,
  Settings,
  X
} from 'lucide-react';
import HomeHeader from '../components/home/HomeHeader';
import { getStoredFilterSettings, saveStoredFilterSettings, CustomLeague } from '../utils/leagueFilter';

export default function LeaguesPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Customization state
  const [filterEnabled, setFilterEnabled] = useState(false);
  const [leaguesList, setLeaguesList] = useState<CustomLeague[]>([]);
  const [showAdder, setShowAdder] = useState(false);
  const [isCustomizing, setIsCustomizing] = useState(false);

  // New league form fields
  const [newLeagueName, setNewLeagueName] = useState('');
  const [newLeagueApiId, setNewLeagueApiId] = useState('');
  const [newLeagueCountry, setNewLeagueCountry] = useState('');
  const [newLeagueEmoji, setNewLeagueEmoji] = useState('⚽');

  React.useEffect(() => {
    const { isEnabled, leagues } = getStoredFilterSettings();
    setFilterEnabled(isEnabled);
    setLeaguesList(leagues);
  }, []);

  const handleToggleLeague = (id: string) => {
    const updated = leaguesList.map(l => l.id === id ? { ...l, enabled: !l.enabled } : l);
    setLeaguesList(updated);
    saveStoredFilterSettings(filterEnabled, updated);
  };

  const handleToggleFilterEnabled = () => {
    const newVal = !filterEnabled;
    setFilterEnabled(newVal);
    saveStoredFilterSettings(newVal, leaguesList);
  };

  const handleAddCustomLeague = (e: React.FormEvent) => {
    e.preventDefault();
    const apiIdNum = parseInt(newLeagueApiId.trim(), 10);
    if (!newLeagueName || isNaN(apiIdNum)) {
      return;
    }

    const newL: CustomLeague = {
      id: `custom-${Date.now()}`,
      apiId: apiIdNum,
      name: newLeagueName.trim(),
      country: newLeagueCountry.trim() || 'دولي',
      emoji: newLeagueEmoji.trim() || '⚽',
      logo: `https://media.api-sports.io/football/leagues/${apiIdNum}.png`,
      bg: 'from-cyan-500/10 to-transparent border-cyan-500/25',
      tag: 'بطولة مخصصة',
      enabled: true
    };

    const updated = [...leaguesList, newL];
    setLeaguesList(updated);
    saveStoredFilterSettings(filterEnabled, updated);

    // Reset form
    setNewLeagueName('');
    setNewLeagueApiId('');
    setNewLeagueCountry('');
    setNewLeagueEmoji('⚽');
    setShowAdder(false);
  };

  const handleDeleteCustomLeague = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = leaguesList.filter(l => l.id !== id);
    setLeaguesList(updated);
    saveStoredFilterSettings(filterEnabled, updated);
  };

  // Filter list based on search term
  const filteredLeagues = leaguesList.filter(l => 
    l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.tag || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#070c16] text-gray-100 pb-20 transition-colors duration-300 select-none font-sans" style={{ direction: 'rtl' }}>
      {/* Home Header */}
      <HomeHeader />

      {/* Main content body */}
      <main className="max-w-7xl mx-auto px-4 pt-6 space-y-8">
        
        {/* Banner with ambient glows */}
        <div className="relative overflow-hidden rounded-[32px] bg-slate-900/40 backdrop-blur-xl border border-white/5 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="space-y-2 text-center md:text-right">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <Trophy size={20} className="text-cyan-400 animate-bounce animate-duration-1000" />
              <h1 className="text-2xl md:text-3xl font-black text-white">إعدادات تخصيص الدوريات والبطولات</h1>
            </div>
            <p className="text-xs text-gray-400 font-bold max-w-[500px] leading-relaxed">
              تصفح جداول الترتيب، أو قم بتفعيل "التصفية الذكية" للتحكم بالبطولات المعروضة بالموقع وجلب مباريات دوريات محددة فقط.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            {/* Real-time search implementation */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="البحث عن بطولة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-11 pl-4 py-2.5 text-xs font-black text-white bg-slate-950/60 border border-white/5 rounded-2xl focus:outline-none focus:border-cyan-500 transition-all shadow-xl"
              />
            </div>

            <button
              onClick={() => setIsCustomizing(!isCustomizing)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-black rounded-2xl border transition-all cursor-pointer ${
                isCustomizing 
                  ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/35' 
                  : 'bg-slate-900/80 text-gray-300 border-white/5 hover:border-white/10'
              }`}
            >
              <Settings size={14} className={isCustomizing ? 'animate-spin' : ''} />
              <span>{isCustomizing ? 'خروج من التخصيص' : 'لوحة التحكم بالتصفية'}</span>
            </button>
          </div>
        </div>

        {/* Customization Dashboard Control Panel */}
        {isCustomizing && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[28px] bg-slate-900/40 backdrop-blur-md border border-white/5 p-6 space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse" />
                  <h2 className="text-sm font-black text-white">ميزة التصفية الذكية للمباريات</h2>
                </div>
                <p className="text-xs text-gray-400 font-bold">عند تفعيل الميزة، سيتم فلترة جميع مباريات وجداول البطولة في الموقع لتظهر الدوريات المفعلة فقط.</p>
              </div>

              <button
                onClick={handleToggleFilterEnabled}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  filterEnabled ? 'bg-cyan-500' : 'bg-slate-800'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    filterEnabled ? '-translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex flex-col md:flex-row items-start justify-between gap-6">
              <div className="flex-1 space-y-3">
                <h3 className="text-xs font-black text-gray-300 uppercase tracking-wider">حدد الدوريات التي تريد عرضها بالموقع:</h3>
                <div className="flex flex-wrap gap-2">
                  {leaguesList.map((league) => (
                    <button
                      key={league.id}
                      onClick={() => handleToggleLeague(league.id)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
                        league.enabled 
                          ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 font-black' 
                          : 'bg-slate-950/40 text-gray-500 border-white/5 hover:border-white/10'
                      }`}
                    >
                      <span>{league.emoji}</span>
                      <span>{league.name}</span>
                      {league.enabled ? <Check size={12} className="text-cyan-400" /> : <X size={12} className="text-gray-600" />}
                      {league.id.startsWith('custom-') && (
                        <Trash2 
                          size={12} 
                          className="text-red-500 hover:text-red-400 transition-colors ml-1" 
                          onClick={(e) => handleDeleteCustomLeague(league.id, e)}
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="w-full md:w-80 shrink-0 bg-slate-950/40 rounded-2xl p-4 border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white">إضافة دوري مخصص عبر API</span>
                  <Plus 
                    size={16} 
                    className={`cursor-pointer transition-transform ${showAdder ? 'rotate-45 text-red-400' : 'text-cyan-400'}`}
                    onClick={() => setShowAdder(!showAdder)} 
                  />
                </div>

                {showAdder && (
                  <form onSubmit={handleAddCustomLeague} className="space-y-3 pt-2">
                    <div>
                      <label className="block text-[10px] text-gray-400 font-bold mb-1">اسم البطولة بالعربية</label>
                      <input
                        type="text"
                        required
                        placeholder="مثال: الدوري المصري الممتاز"
                        value={newLeagueName}
                        onChange={(e) => setNewLeagueName(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-900 border border-white/5 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-gray-400 font-bold mb-1">معرّف البطولة في API-Sports</label>
                        <input
                          type="text"
                          required
                          placeholder="مثال: 233"
                          value={newLeagueApiId}
                          onChange={(e) => setNewLeagueApiId(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-slate-900 border border-white/5 rounded-xl text-white focus:outline-none focus:border-cyan-500 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-400 font-bold mb-1">الدولة أو القارة</label>
                        <input
                          type="text"
                          placeholder="مصر"
                          value={newLeagueCountry}
                          onChange={(e) => setNewLeagueCountry(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-slate-900 border border-white/5 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-400 font-bold mb-1">رمز تعبيري العلم / البطولة (Emoji)</label>
                      <input
                        type="text"
                        placeholder="🇪🇬"
                        value={newLeagueEmoji}
                        onChange={(e) => setNewLeagueEmoji(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-900 border border-white/5 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-xs font-black text-white rounded-xl cursor-pointer shadow-lg shadow-cyan-500/10"
                    >
                      تأكيد وحفظ البطولة
                    </button>
                  </form>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Dynamic Grid list */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-widest">
              <Activity size={14} className="text-cyan-400 animate-pulse" />
              <span>البطولات المعتمدة ({filteredLeagues.length})</span>
            </div>

            {filterEnabled && (
              <span className="text-[10px] font-black text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-full animate-pulse">
                وضع التصفية النشطة مفعلة
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredLeagues.map((league) => (
              <motion.div
                key={league.id}
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/league/${league.apiId}`)}
                className={`group relative overflow-hidden rounded-[24px] bg-slate-900/40 hover:bg-slate-900/70 border p-5 cursor-pointer flex flex-col justify-between h-[230px] transition-all bg-gradient-to-b ${
                  league.bg || 'from-cyan-500/5 to-transparent'
                } ${
                  league.enabled ? 'border-white/5 hover:border-cyan-500/20' : 'border-dashed border-white/5 opacity-50 hover:opacity-100'
                } hover:shadow-2xl hover:shadow-cyan-500/5`}
              >
                {/* Visual Top details */}
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-black text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-full uppercase shadow-sm">
                    {league.tag || 'سلس لمطابقة'}
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
                    <h3 className="text-xs font-black text-white group-hover:text-cyan-400 transition-colors truncate leading-snug">
                      {league.name}
                    </h3>
                    <p className="text-[10px] text-gray-400 font-bold">معرف البطولة: {league.apiId}</p>
                    <p className="text-[9px] text-cyan-500 font-black">{league.enabled ? 'نشط في الاستيراد والتصفية' : 'مستثنى حالياً'}</p>
                  </div>
                </div>

                {/* Hover Indicator Link */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5 text-[10px] text-gray-500 group-hover:text-cyan-400 font-black transition-colors">
                  <span>أهداف المجموعات وجداول الترتيب</span>
                  <div className="flex items-center gap-1 font-bold">
                    <span>تصفح الآن</span>
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
