import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Share2, 
  Twitter, 
  Send, 
  Copy, 
  Check, 
  MessageSquare,
  Facebook,
  Sparkles
} from 'lucide-react';

interface ShareButtonProps {
  url?: string;
  title?: string;
  text?: string;
  variant?: 'dropdown' | 'inline' | 'icon';
  align?: 'left' | 'right' | 'center';
}

export default function ShareButton({ 
  url, 
  title, 
  text = 'شاهد البث المباشر والملخصات على كورة 90!', 
  variant = 'dropdown',
  align = 'left'
}: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Helper function to format the URL so that it doesn't share internal AI Studio Dev URLs
  const getFormattedUrl = (customUrl?: string) => {
    let fallbackUrl = typeof window !== 'undefined' ? window.location.href : 'https://ais-pre-7yjy6apxcqr3vnxii4n4s5-425742923336.europe-west1.run.app';
    let target = customUrl || fallbackUrl;
    
    // Replace the restricted AI Studio development environment (ais-dev-) with the public shared app URL (ais-pre-)
    // This allows users to open the link without encountering a Google Account login page.
    if (target.includes('ais-dev-')) {
      return target.replace('ais-dev-', 'ais-pre-');
    }
    
    // If it's localhost, we can just return it for local testing
    return target;
  };

  const shareUrl = getFormattedUrl(url);
  const shareTitle = title || (typeof document !== 'undefined' ? document.title : 'كورة 90');

  // Handle outside click to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleNativeShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: text,
          url: shareUrl,
        });
      } catch (err) {
        console.log('Share canceled or failed', err);
      }
    } else {
      setIsOpen(!isOpen);
    }
  };

  // Predefined social shares
  const shareLinks = {
    whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(shareTitle + ' ' + shareUrl)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
  };

  const socialPlatforms = [
    { 
      name: 'واتساب', 
      icon: MessageSquare, 
      color: 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20',
      link: shareLinks.whatsapp 
    },
    { 
      name: 'تويتر / X', 
      icon: Twitter, 
      color: 'bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border-sky-500/20',
      link: shareLinks.twitter 
    },
    { 
      name: 'تيليجرام', 
      icon: Send, 
      color: 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border-cyan-500/20',
      link: shareLinks.telegram 
    },
    { 
      name: 'فيسبوك', 
      icon: Facebook, 
      color: 'bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border-blue-600/20',
      link: shareLinks.facebook 
    },
  ];

  if (variant === 'inline') {
    return (
      <div className="flex flex-wrap items-center gap-2.5">
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-3.5 py-2 rounded-2xl text-xs font-black text-gray-200 active:scale-95 transition-all"
        >
          {copied ? (
            <>
              <Check size={14} className="text-primary" />
              <span className="text-primary">تم النسخ</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              <span>نسخ الرابط</span>
            </>
          )}
        </button>

        {socialPlatforms.map((platform) => (
          <a
            key={platform.name}
            href={platform.link}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-1.5 border px-3 py-2 rounded-2xl text-xs font-black active:scale-95 transition-all ${platform.color}`}
          >
            <platform.icon size={14} />
            <span>{platform.name}</span>
          </a>
        ))}
      </div>
    );
  }

  if (variant === 'icon') {
    return (
      <div className="relative inline-block" ref={containerRef}>
        <button
          onClick={navigator.share ? handleNativeShare : (e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
          className="w-10 h-10 rounded-full glass border border-border/80 flex items-center justify-center text-gray-300 hover:text-primary hover:border-primary/50 hover:bg-primary/5 hover:scale-105 transition-all active:scale-95 shadow-lg"
          title="مشاركة"
        >
          <Share2 size={16} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className={`absolute z-[999] mt-3 w-56 glass rounded-2xl border border-border/80 shadow-[0_15px_35px_rgba(0,0,0,0.6)] ${
                align === 'left' ? 'left-0' : align === 'right' ? 'right-0' : 'left-1/2 -translate-x-1/2'
              }`}
            >
              <div className="p-3.5 space-y-2">
                <div className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1 mb-2 border-b border-white/5 pb-1.5">
                  <Sparkles size={11} /> مشاركة عبر
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {socialPlatforms.map((platform) => (
                    <a
                      key={platform.name}
                      href={platform.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex flex-col items-center justify-center gap-1.5 py-2.5 rounded-xl border text-[10px] font-black tracking-wide text-center active:scale-95 transition-all ${platform.color}`}
                      onClick={() => setIsOpen(false)}
                    >
                      <platform.icon size={16} />
                      <span>{platform.name}</span>
                    </a>
                  ))}
                </div>

                <button
                  onClick={handleCopy}
                  className="w-full mt-1.5 flex items-center justify-center gap-2 bg-primary hover:bg-primary/95 text-black font-black py-2.5 px-3 rounded-xl text-xs active:scale-[0.97] transition-all shadow-[0_5px_15px_rgba(0,223,130,0.2)]"
                >
                  {copied ? (
                    <>
                      <Check size={14} />
                      <span>تم النسخ بنجاح!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>نسخ رابط الصفحة</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        onClick={navigator.share ? handleNativeShare : (e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        className="flex items-center gap-2 bg-gradient-to-r from-surface to-surface-hover/80 border border-border/80 px-4.5 py-2.5 rounded-2xl text-xs font-black text-gray-200 hover:text-primary hover:border-primary/50 transition-all shadow-md active:scale-95"
      >
        <Share2 size={14} className="text-primary" />
        <span>أنشر وشارك</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            className={`absolute z-[999] mt-3 w-64 glass rounded-3xl border border-border/80 shadow-[0_20px_45px_rgba(0,0,0,0.7)] ${
              align === 'left' ? 'left-0' : align === 'right' ? 'right-0' : 'left-1/2 -translate-x-1/2'
            }`}
          >
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1">
                  <Sparkles size={11} /> خيارات المشاركة
                </span>
                {copied && (
                  <span className="text-[9px] bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 rounded-md font-black">
                    تم نسخ الرابط!
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {socialPlatforms.map((platform) => (
                  <a
                    key={platform.name}
                    href={platform.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex flex-col items-center justify-center gap-2 py-3 rounded-2xl border text-[10px] font-black tracking-wider active:scale-95 transition-all text-center ${platform.color}`}
                    onClick={() => setIsOpen(false)}
                  >
                    <platform.icon size={18} />
                    <span>{platform.name}</span>
                  </a>
                ))}
              </div>

              <button
                onClick={handleCopy}
                className="w-full mt-2 flex items-center justify-center gap-2 bg-primary hover:bg-primary/95 text-black font-black py-3 px-4 rounded-2xl text-xs active:scale-[0.97] transition-all shadow-[0_8px_20px_rgba(0,223,130,0.15)]"
              >
                {copied ? (
                  <>
                    <Check size={15} />
                    <span>تمخ النسخ بنجاح!</span>
                  </>
                ) : (
                  <>
                    <Copy size={15} />
                    <span>نسخ رابط الصفحة مباشر</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
