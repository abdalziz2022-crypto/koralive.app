import React, { useState } from 'react';
import { Maximize2, Play, Volume2, VolumeX, Settings2, Sliders, ExternalLink, RefreshCw, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface QualityLink {
  label: string;
  quality: string;
  url: string;
}

interface VideoPlayerProps {
  url: string;
  poster?: string;
  title?: string;
  blockAds?: boolean;
  qualities?: QualityLink[];
  activeQualityIndex?: number;
  onQualityChange?: (index: number) => void;
  onQualityToggle?: () => void;
  currentQuality?: string;
  nextQualityLabel?: string;
}

export default function VideoPlayer({ 
  url, 
  poster, 
  title, 
  blockAds = true,
  qualities = [],
  activeQualityIndex = 0,
  onQualityChange,
  onQualityToggle,
  currentQuality,
  nextQualityLabel
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [activeMenu, setActiveMenu] = useState<'main' | 'speed' | 'quality'>('main');

  const toggleSettings = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowSettings(!showSettings);
    setActiveMenu('main');
  };

  const handleRefresh = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Simple way to refresh iframe
    const iframe = document.querySelector('iframe');
    if (iframe) {
      const currentSrc = iframe.src;
      iframe.src = '';
      setTimeout(() => {
        iframe.src = currentSrc;
      }, 10);
    }
  };

  return (
    <div className="relative aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10 group">
      {!isPlaying ? (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-500 h-full">
          {poster && <img src={poster} alt="poster" className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-overlay" />}
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsPlaying(true)}
            className="w-20 h-20 bg-primary text-black rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(0,255,0,0.3)] transition-all cursor-pointer relative z-20"
          >
            <Play fill="black" size={32} />
          </motion.button>
          
          <div className="mt-4 text-center relative z-20">
            <h3 className="text-xl font-bold text-white mb-2">{title || 'بث مباشر للمباراة'}</h3>
            <p className="text-gray-400 text-sm">اضغط للتشغيل بأعلى جودة</p>
          </div>
        </div>
      ) : (
        <iframe
          src={url}
          className="w-full h-full border-0 absolute inset-0"
          allowFullScreen
          allow="autoplay; encrypted-media; picture-in-picture"
          sandbox={blockAds 
            ? "allow-scripts allow-same-origin allow-presentation" 
            : "allow-scripts allow-same-origin allow-presentation allow-forms allow-popups-to-escape-sandbox"}
          title="Match Stream"
          referrerPolicy="no-referrer"
        />
      )}

      {/* Overlay UI */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 z-20">
        {/* Top Header */}
        <div className="flex justify-between items-start opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-auto">
          <div className="flex gap-2">
            <div className="glass px-3 py-1 rounded-full flex items-center gap-2 border border-white/10">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
              <span className="text-[10px] font-black tracking-widest uppercase">Live {currentQuality || 'HD'}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={handleRefresh}
              className="glass p-2 rounded-full hover:bg-white/10 transition-colors"
              title="تحديث المشغل"
            >
              <RefreshCw size={16} />
            </button>
            <button className="glass p-2 rounded-full hover:bg-white/10 transition-colors">
              <ExternalLink size={16} />
            </button>
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-auto px-2 pb-2">
          <div className="bg-black/60 backdrop-blur-xl rounded-2xl p-3 flex items-center justify-between gap-4 border border-white/10 shadow-lg">
             <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsMuted(!isMuted)}
                  className="hover:text-primary transition-colors text-white"
                >
                  {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                <div className="hidden sm:flex items-center gap-2 group/volume w-24">
                   <div className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden relative group-hover/volume:h-2 transition-all">
                      <div 
                        className="h-full bg-primary" 
                        style={{ width: `${isMuted ? 0 : volume}%` }} 
                      />
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={isMuted ? 0 : volume}
                        onChange={(e) => {
                          setVolume(parseInt(e.target.value));
                          if (parseInt(e.target.value) > 0) setIsMuted(false);
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer h-full"
                      />
                   </div>
                </div>
             </div>

             <div className="flex items-center gap-3">
                {onQualityToggle && (
                  <button 
                    onClick={onQualityToggle}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all border border-white/5 active:scale-95"
                  >
                    <Settings2 size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                      {currentQuality ? `${currentQuality}` : 'Auto'}
                    </span>
                    {nextQualityLabel && (
                      <span className="text-[9px] opacity-60 hidden md:inline">→ {nextQualityLabel}</span>
                    )}
                  </button>
                )}

                <div className="relative">
                  <button 
                    onClick={toggleSettings}
                    className={`p-2 rounded-full transition-colors relative ${showSettings ? 'bg-primary text-black' : 'hover:bg-white/10 text-white'}`}
                  >
                    <Sliders size={18} />
                  </button>
                  
                  <AnimatePresence>
                    {showSettings && (
                      <motion.div 
                        initial={{ opacity: 0, y: 15, scale: 0.9, transformOrigin: 'bottom right' }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="absolute bottom-full right-0 mb-4 w-72 bg-black/80 backdrop-blur-2xl rounded-3xl p-5 border border-white/10 shadow-2xl z-30"
                      >
                        <div className="space-y-4">
                           {activeMenu === 'main' && (
                             <motion.div 
                               initial={{ opacity: 0, x: 20 }}
                               animate={{ opacity: 1, x: 0 }}
                               className="space-y-2"
                             >
                                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest text-right mb-4">الإعدادات</p>
                                
                                <button 
                                  onClick={() => setActiveMenu('quality')}
                                  className="flex items-center justify-between w-full p-3 hover:bg-white/10 rounded-xl transition-all group"
                                >
                                  <div className="flex items-center gap-3 text-white">
                                    <ChevronLeft size={16} className="text-gray-500 group-hover:-translate-x-1 group-hover:text-white transition-all" />
                                    <span className="text-xs font-black bg-white/10 px-2 py-0.5 rounded-md">{qualities[activeQualityIndex]?.quality || currentQuality || 'Auto'}</span>
                                  </div>
                                  <span className="text-sm font-bold text-white">الجودة</span>
                                </button>

                                <button 
                                  onClick={() => setActiveMenu('speed')}
                                  className="flex items-center justify-between w-full p-3 hover:bg-white/10 rounded-xl transition-all group"
                                >
                                  <div className="flex items-center gap-3 text-white">
                                    <ChevronLeft size={16} className="text-gray-500 group-hover:-translate-x-1 group-hover:text-white transition-all" />
                                    <span className="text-xs font-black bg-white/10 px-2 py-0.5 rounded-md">{speed}x</span>
                                  </div>
                                  <span className="text-sm font-bold text-white">سرعة التشغيل</span>
                                </button>

                                <div className="pt-3 mt-2 border-t border-white/10">
                                   <button className="flex items-center justify-between w-full p-3 hover:bg-white/10 rounded-xl transition-all group text-gray-400 hover:text-white">
                                      <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                                      <span className="text-[11px] font-black uppercase tracking-widest">إحصائيات متقدمة</span>
                                   </button>
                                </div>
                             </motion.div>
                           )}

                           {activeMenu === 'speed' && (
                             <motion.div 
                               initial={{ opacity: 0, x: -20 }}
                               animate={{ opacity: 1, x: 0 }}
                               className="space-y-4"
                             >
                                <button 
                                  onClick={() => setActiveMenu('main')}
                                  className="flex items-center gap-2 text-[11px] font-black uppercase text-gray-300 hover:text-white hover:bg-white/10 w-full p-2 rounded-xl transition-colors"
                                >
                                   <ChevronLeft size={16} className="rotate-180" />
                                   <span>سرعة التشغيل</span>
                                </button>
                                <div className="grid grid-cols-2 gap-2">
                                   {[0.5, 0.75, 1, 1.25, 1.5, 2].map(s => (
                                     <button 
                                       key={s}
                                       onClick={() => {
                                         setSpeed(s);
                                         setActiveMenu('main');
                                       }}
                                       className={`text-sm p-3 rounded-xl font-bold transition-all border ${
                                         speed === s 
                                           ? 'bg-primary border-primary text-black shadow-[0_0_15px_rgba(0,255,0,0.3)]' 
                                           : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/20 hover:border-white/20'
                                       }`}
                                     >
                                       {s}x
                                     </button>
                                   ))}
                                </div>
                             </motion.div>
                           )}

                           {activeMenu === 'quality' && (
                             <motion.div 
                               initial={{ opacity: 0, x: -20 }}
                               animate={{ opacity: 1, x: 0 }}
                               className="space-y-3"
                             >
                                <button 
                                  onClick={() => setActiveMenu('main')}
                                  className="flex items-center gap-2 text-[11px] font-black uppercase text-gray-300 hover:text-white hover:bg-white/10 w-full p-2 rounded-xl transition-colors"
                                >
                                   <ChevronLeft size={16} className="rotate-180" />
                                   <span>اختيار الجودة</span>
                                </button>
                                <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                                   {(qualities.length > 0 ? qualities : [{ label: 'افتراضي', quality: currentQuality || 'Auto', url: '' }]).map((q, idx) => (
                                     <button 
                                       key={idx}
                                       onClick={() => {
                                         onQualityChange?.(idx);
                                         setActiveMenu('main');
                                       }}
                                       className={`flex items-center justify-between w-full p-3 rounded-xl transition-all border ${
                                         activeQualityIndex === idx 
                                           ? 'bg-primary border-primary text-black shadow-[0_0_15px_rgba(0,255,0,0.3)]' 
                                           : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/20 hover:border-white/20'
                                       }`}
                                     >
                                       <span className="text-[10px] font-black uppercase tracking-widest opacity-80">{q.quality}</span>
                                       <span className="text-sm font-bold truncate ml-4">{q.label}</span>
                                     </button>
                                   ))}
                                </div>
                             </motion.div>
                           )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="bg-white/10 p-2 text-white rounded-full cursor-pointer hover:bg-white/20 hover:scale-105 transition-all">
                  <Maximize2 size={18} />
                </div>
             </div>
          </div>
        </div>
      </div>
      
      {/* Settings Backdrop */}
      {showSettings && (
        <div 
          className="absolute inset-0 z-20 cursor-default"
          onClick={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
