import React, { useState, useEffect, useRef, useMemo } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Ad } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Capacitor } from '@capacitor/core';
import { AdMob, BannerAdOptions, BannerAdSize, BannerAdPosition, BannerAdPluginEvents } from '@capacitor-community/admob';
import { Sparkles, X, Tv, Smartphone, Trophy, ShoppingBag, TrendingUp, ChevronRight, ChevronLeft } from 'lucide-react';


interface AdBannerProps {
  slot: string;
  className?: string;
}

// Executable Ad Code Renderer (for custom JS, HTML or Google AdSense blocks)
function AdCodeRenderer({ code }: { code: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous contents
    containerRef.current.innerHTML = '';

    // Create a container to parse the HTML safely
    const tempDiv = document.createElement('div');
    tempDiv.className = 'w-full flex flex-col items-center justify-center';
    tempDiv.innerHTML = code;

    // Find all script elements (including nested ones)
    const originalScripts = tempDiv.querySelectorAll('script');

    // Create real executable script elements
    const executableScripts: HTMLScriptElement[] = [];
    originalScripts.forEach((origScript) => {
      const newScript = document.createElement('script');
      
      // Copy all attributes
      Array.from(origScript.attributes).forEach((attr) => {
        newScript.setAttribute(attr.name, attr.value);
      });
      
      // Copy inline text
      newScript.text = origScript.text;
      
      executableScripts.push(newScript);
      
      // Remove original script element so it isn't duplicated/stale in DOM
      origScript.parentNode?.removeChild(origScript);
    });

    // Append the cleaned HTML (with script tags removed)
    containerRef.current.appendChild(tempDiv);

    // Append and execute scripts
    executableScripts.forEach((script) => {
      containerRef.current?.appendChild(script);
    });

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [code]);

  return <div ref={containerRef} className="w-full flex justify-center items-center" />;
}

// Built-in Premium Dynamic Campaigns (Fallback Ads that rotate automatically and look extremely elegant)
interface BuiltInCampaign {
  id: string;
  title: string;
  subtitle: string;
  ctaText: string;
  badgeText: string;
  linkUrl: string;
  theme: {
    from: string;
    to: string;
    text: string;
    accent: string;
    iconBg: string;
  };
  icon: React.ComponentType<{ className?: string; size?: number }>;
}

const BUILT_IN_CAMPAIGNS: Record<string, BuiltInCampaign[]> = {
  Home_Top: [
    {
      id: "vip-promo",
      title: "باقة كورة 90 VIP الرياضية الشاملة ✨",
      subtitle: "شاهد جميع المباريات المفضلة لديك بأعلى جودة 4K وبدون أي فواصل إعلانية مزعجة على الإطلاق!",
      ctaText: "ترقية الحساب الآن مجاناً",
      badgeText: "باقة النخبة / VIP",
      linkUrl: "/profile",
      theme: {
        from: "from-amber-600/20 via-yellow-600/10 to-black/40",
        to: "border-amber-500/30",
        text: "text-amber-400Title",
        accent: "bg-amber-500 text-black",
        iconBg: "bg-amber-500/15 text-amber-400"
      },
      icon: Sparkles
    },
    {
      id: "predictions-promo",
      title: "توقعات مباريات اليوم بالذكاء الاصطناعي 🧠",
      subtitle: "استعن بأقوى تحليلات الذكاء الذاتي التنبؤية المرتكزة على إحصاءات الفرق وأدائها التاريخي المحدث!",
      ctaText: "تصفح التوقعات الرياضية",
      badgeText: "تحليل ذكي / AI",
      linkUrl: "/",
      theme: {
        from: "from-primary/20 via-teal-900/10 to-black/40",
        to: "border-primary/30",
        text: "text-primary",
        accent: "bg-primary text-black",
        iconBg: "bg-primary/10 text-primary"
      },
      icon: TrendingUp
    },
    {
      id: "mobile-app-promo",
      title: "تطبيق كورة 90 للهواتف المحمولة 📱",
      subtitle: "احصل على إشعارات الأهداف الفورية، جداول المباريات الحية، وتشكيلات الفرق المباشرة فور صدورها!",
      ctaText: "تنزيل التطبيق المجاني",
      badgeText: "تطبيق ذكي / App",
      linkUrl: "/",
      theme: {
        from: "from-blue-600/20 via-indigo-950/10 to-black/40",
        to: "border-blue-500/30",
        text: "text-blue-400",
        accent: "bg-blue-500 text-white",
        iconBg: "bg-blue-500/10 text-blue-400"
      },
      icon: Smartphone
    }
  ],
  Match_Under_Player: [
    {
      id: "match-premium-vip",
      title: "بث مباشر بدون انقطاع بجردات فائقة السرعة ⚡",
      subtitle: "استمتع بالبث ذو الجودة الفائقة المتعدد وسيرفرات احتياطية قوية للاتصالات البطيئة والمباريات الكبيرة.",
      ctaText: "ترقية تجربتك الرياضية",
      badgeText: "سيرفر VIP الساخن",
      linkUrl: "/profile",
      theme: {
        from: "from-red-600/20 via-rose-950/10 to-black/40",
        to: "border-red-500/30",
        text: "text-red-400",
        accent: "bg-red-500 text-white",
        iconBg: "bg-red-500/10 text-red-400"
      },
      icon: Tv
    },
    {
      id: "jersey-store-promo",
      title: "متجر قمصان كورة 90 لجميع الأندية والمنتخبات 👕",
      subtitle: "خصم حصري 25% مع شحن سريع مجاني لجميع مناطق الوطن العربي! استعمل الكود: KORA25",
      ctaText: "تصفح المتجر الآن",
      badgeText: "متجر المشجعين",
      linkUrl: "/profile",
      theme: {
        from: "from-amber-500/15 via-orange-950/10 to-black/40",
        to: "border-amber-500/30",
        text: "text-amber-400",
        accent: "bg-amber-500 text-black",
        iconBg: "bg-amber-500/10 text-amber-400"
      },
      icon: ShoppingBag
    }
  ],
  News_Detail_Sidebar: [
    {
      id: "sidebar-predictions",
      title: "مستشار الذكاء الاصطناعي للمباريات 📡",
      subtitle: "توقعات دقيقة وإحصائيات احتمالية تفصيلية لمجريات أحداث اليوم الكروية.",
      ctaText: "شاهد التوقعات",
      badgeText: "موصى به / AI",
      linkUrl: "/",
      theme: {
        from: "from-primary/10 via-background to-black/30",
        to: "border-primary/20",
        text: "text-primary",
        accent: "bg-primary text-black",
        iconBg: "bg-primary/10 text-primary"
      },
      icon: Trophy
    },
    {
      id: "sidebar-app",
      title: "تابع أولاً بأول بجوالك",
      subtitle: "قم بتحميل كورة 90 للآيفون والأندرويد للخدمات العاجلة والنتائج.",
      ctaText: "تحميل مجاني",
      badgeText: "تطبيق مجاني",
      linkUrl: "/",
      theme: {
        from: "from-cyan-600/15 via-background to-black/30",
        to: "border-cyan-500/20",
        text: "text-cyan-400",
        accent: "bg-cyan-500 text-black",
        iconBg: "bg-cyan-500/10 text-cyan-400"
      },
      icon: Smartphone
    }
  ]
};

export default function AdBanner({ slot, className = "" }: AdBannerProps) {
  const [dbAds, setDbAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  // Auto-play interval timer ref
  const rotationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch ads from Firestore with realtime updates
  useEffect(() => {
    const q = query(
      collection(db, 'ads'),
      where('slot', '==', slot),
      where('active', '==', true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedAds: Ad[] = [];
      snapshot.forEach((doc) => {
        fetchedAds.push({ id: doc.id, ...doc.data() } as Ad);
      });
      setDbAds(fetchedAds);
      setLoading(false);
      // Reset index on change
      setActiveIndex(0);
    }, (error) => {
      console.error("Error listening to Ads:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [slot]);

  // Combine database ads and built-in promotions
  const activeCampaignsList = useMemo(() => {
    if (dbAds.length > 0) {
      return dbAds;
    }
    // Fallback to custom elegant native campaigns
    return BUILT_IN_CAMPAIGNS[slot] || BUILT_IN_CAMPAIGNS["Home_Top"] || [];
  }, [dbAds, slot]);

  // Handle auto rotation of advertisements smoothly
  useEffect(() => {
    if (activeCampaignsList.length <= 1 || !isVisible) {
      if (rotationTimerRef.current) clearInterval(rotationTimerRef.current);
      return;
    }

    rotationTimerRef.current = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % activeCampaignsList.length);
    }, 12000); // Elegant 12 seconds per ad display

    return () => {
      if (rotationTimerRef.current) {
        clearInterval(rotationTimerRef.current);
      }
    };
  }, [activeCampaignsList, isVisible]);

  const handleNextAd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveIndex((prev) => (prev + 1) % activeCampaignsList.length);
  };

  const handlePrevAd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveIndex((prev) => (prev - 1 + activeCampaignsList.length) % activeCampaignsList.length);
  };

  const handleCloseAd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsVisible(false);
  };

  const currentAd = activeCampaignsList[activeIndex];

  useEffect(() => {
    if (!currentAd || !isVisible || !Capacitor.isNativePlatform()) return;

    if ('type' in currentAd && (currentAd.type === 'ADMOB_BANNER' || currentAd.type === 'ADMOB_INTERSTITIAL')) {
      const showAd = async () => {
        try {
          if (currentAd.type === 'ADMOB_BANNER') {
            const options: BannerAdOptions = {
              adId: currentAd.admobAdUnitId || 'ca-app-pub-3940256099942544/6300978111', // fallback test ID
              adSize: BannerAdSize.ADAPTIVE_BANNER,
              position: slot.includes('Bottom') ? BannerAdPosition.BOTTOM_CENTER : BannerAdPosition.TOP_CENTER,
              margin: 0,
              isTesting: true, // Should use real settings logic here in prod
            };
            await AdMob.showBanner(options);
          } else if (currentAd.type === 'ADMOB_INTERSTITIAL') {
            // Usually you wouldn't show interstitial just on mount in a banner slot, but we'll prepare the logic
            await AdMob.prepareInterstitial({
              adId: currentAd.admobAdUnitId || 'ca-app-pub-3940256099942544/1033173712',
              isTesting: true
            });
            await AdMob.showInterstitial();
          }
        } catch (e) {
          console.error("Error displaying AdMob ad:", e);
        }
      };

      showAd();

      return () => {
        if (currentAd.type === 'ADMOB_BANNER') {
          AdMob.hideBanner().catch(console.error);
          AdMob.removeBanner().catch(console.error);
        }
      };
    }
  }, [currentAd, isVisible, slot]);

  if (!isVisible) return null;

  if (loading) {
    return (
      <div className={`w-full bg-surface/20 animate-pulse rounded-3xl min-h-[90px] border border-white/5 flex items-center justify-center ${className}`}>
        <span className="text-[10px] font-black text-gray-600 tracking-wider">جاري تحميل المساحة الإعلانية...</span>
      </div>
    );
  }

  if (!currentAd) return null;

  // Render check
  const isDbRegisteredAd = 'active' in currentAd; // database model has 'active' property

  return (
    <div className={`w-full relative group/ad overflow-hidden rounded-[24px] md:rounded-[32px] border transition-all duration-300 ${className} ${
      !isDbRegisteredAd 
        ? `bg-gradient-to-r ${(currentAd as any).theme.from} ${(currentAd as any).theme.to} shadow-[0_10px_25px_rgba(0,0,0,0.4)]` 
        : "bg-surface/25 border-white/5 hover:border-white/10"
    }`}>
      {/* Decorative top strip */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary/30 via-amber-500/20 to-primary/30" />

      {/* Close Option */}
      <button 
        onClick={handleCloseAd}
        className="absolute top-3 left-3 z-30 p-1.5 rounded-full bg-black/60 hover:bg-black/95 text-gray-400 hover:text-white border border-white/5 hover:border-white/15 transition-all outline-none"
        title="إخفاء الإعلان"
      >
        <X size={12} />
      </button>

      {/* Premium Badge */}
      <span className={`absolute top-3 right-3 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full z-20 select-none ${
        !isDbRegisteredAd 
          ? (currentAd as any).theme.accent 
          : "text-primary bg-primary/10 border border-primary/20"
      }`}>
        {isDbRegisteredAd ? "إعلان خارجي" : (currentAd as any).badgeText}
      </span>

      {/* Render Ad Body */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${currentAd.id}-${activeIndex}`}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.4 }}
          className="w-full"
        >
          {isDbRegisteredAd ? (
            // Database-configured Ad
            (currentAd as Ad).type === 'IMAGE' ? (
              <a
                href={(currentAd as Ad).linkUrl || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full block relative overflow-hidden min-h-[110px] py-6 px-8 hover:opacity-95 transition-opacity"
              >
                {(currentAd as Ad).imageUrl ? (
                  <img 
                    src={(currentAd as Ad).imageUrl} 
                    alt={currentAd.title} 
                    className="absolute inset-0 w-full h-full object-cover group-hover/ad:scale-[1.03] transition-transform duration-500 ease-out z-0" 
                  />
                ) : (
                  <div className="w-full min-h-[90px] bg-gradient-to-r from-surface to-background flex flex-col items-center justify-center font-bold text-sm text-center px-4">
                    <span className="text-white text-base font-black relative z-10">{currentAd.title}</span>
                  </div>
                )}
                {/* Fallback Overlay text for static background images if needed */}
                <div className="absolute inset-0 bg-black/30 group-hover/ad:bg-black/15 transition-colors duration-300 z-0" />
                
                <div className="relative z-10 flex flex-col justify-center h-full max-w-[80%] pr-4 pt-1">
                  <h4 className="text-base font-extrabold text-white leading-tight drop-shadow-md">{currentAd.title}</h4>
                  <p className="text-xs text-slate-350 mt-1 line-clamp-2 drop-shadow-sm font-medium">سارع للاستفادة من هذا الراعي والمميز الآن.</p>
                </div>
              </a>
            ) : (currentAd as Ad).type === 'ADMOB_BANNER' || (currentAd as Ad).type === 'ADMOB_INTERSTITIAL' ? (
              // AdMob Ad Placeholder (Web view)
              <div className="w-full flex flex-col justify-center items-center py-6 px-4 bg-black/40 min-h-[90px] border border-white/5 border-dashed rounded-xl">
                 <span className="text-primary text-sm font-bold flex items-center gap-2">
                    <Sparkles size={16} /> 
                    إعلان AdMob سيظهر هنا في التطبيق
                 </span>
                 <span className="text-xs text-gray-500 mt-1 font-mono">
                    ID: {(currentAd as Ad).admobAdUnitId || 'غير محدد'}
                 </span>
              </div>
            ) : (
              // Raw Script Code Ad (e.g. Google Adsense, custom iframe widgets)
              <div className="w-full flex justify-center items-center py-4 px-3 bg-black/20 min-h-[90px]">
                 <AdCodeRenderer code={(currentAd as Ad).code || ''} />
              </div>
            )
          ) : (
            // Native Super Elegant Campaign
            <a
              href={(currentAd as any).linkUrl}
              className="w-full flex flex-col md:flex-row items-center justify-between gap-4 py-5 md:py-6 px-6 md:px-8 relative block overflow-hidden"
              onClick={(e) => {
                // If it points to external or relative, handle properly
                if ((currentAd as any).linkUrl.startsWith('/')) {
                  // Let react-router handle normally or trigger clicks
                }
              }}
            >
              <div className="flex items-center gap-4 text-right flex-1 select-none">
                {/* Campaign Custom Icon Box */}
                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center shrink-0 border border-white/5 ${(currentAd as any).theme.iconBg} shadow-inner`}>
                  {React.createElement((currentAd as any).icon, { size: 24, className: "animate-pulse" })}
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm md:text-base font-black text-white hover:text-primary transition-colors pr-2">
                    {currentAd.title}
                  </h4>
                  <p className="text-xs text-gray-300 font-semibold line-clamp-2 md:line-clamp-1 leading-relaxed max-w-[480px]">
                    {currentAd.subtitle}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="shrink-0 flex items-center gap-3 w-full md:w-auto justify-end mt-2 md:mt-0 z-10">
                <span className={`px-4.5 py-2 rounded-xl text-xs font-black transition-all hover:scale-[1.03] active:scale-[0.97] ease-out duration-300 shadow-md flex items-center gap-1.5 ${(currentAd as any).theme.accent}`}>
                  <span>{(currentAd as any).ctaText}</span>
                  <ChevronRight size={14} className="rtl:rotate-180" />
                </span>
              </div>
            </a>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Slide Navigation Pagination Indicators (Visible on Hover if there are multiple ads) */}
      {activeCampaignsList.length > 1 && (
        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/45 px-3 py-1 rounded-full border border-white/5 opacity-0 group-hover/ad:opacity-100 transition-opacity duration-300 z-20">
          <button 
            type="button" 
            onClick={handlePrevAd}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={10} className="rtl:rotate-180" />
          </button>
          
          {activeCampaignsList.map((_, index) => (
            <span
              key={index}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActiveIndex(index);
              }}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                index === activeIndex ? "w-3 bg-primary" : "w-1.5 bg-gray-500 hover:bg-gray-400"
              }`}
            />
          ))}

          <button 
            type="button" 
            onClick={handleNextAd}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <ChevronRight size={10} className="rtl:rotate-180" />
          </button>
        </div>
      )}
    </div>
  );
}
