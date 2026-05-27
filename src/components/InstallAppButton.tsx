import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

export default function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if running as standalone (PWA)
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstallable(false);
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  };

  // As a fallback to encourage users even when PWA prompt isn't fired yet (or on iOS Safari)
  const isIos = /ipad|iphone|ipod/.test(navigator.userAgent.toLowerCase());
  const showIosInstructions = isIos && !isInstalled;

  if (!isInstallable && !showIosInstructions) {
    return null; // Don't show if already installed or not supported
  }

  return (
    <button
      onClick={() => {
        if (isInstallable) {
          handleInstallClick();
        } else if (showIosInstructions) {
          alert('لتحميل التطبيق على الآيفون: اضغط على زر المشاركة ثم اختر "إضافة إلى الشاشة الرئيسية" (Add to Home Screen)');
        }
      }}
      className="flex items-center gap-1.5 bg-primary/20 hover:bg-primary border border-primary/30 text-primary hover:text-black font-black px-3.5 py-1.5 rounded-xl text-[10px] md:text-xs transition-all animate-pulse hover:animate-none shadow-[0_0_15px_rgba(0,223,130,0.15)] active:scale-95"
      title="تحميل التطبيق على جهازك"
    >
      <Download size={14} />
      <span className="hidden md:inline">تحميل التطبيق</span>
      <span className="md:hidden">تحميل</span>
    </button>
  );
}
