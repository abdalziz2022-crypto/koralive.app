import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

interface AppSettings {
  logoUrl?: string;
  iconUrl?: string;
  appName?: string;
  primaryColor?: string;
  adsEnabled?: boolean;
  adPublisherId?: string; // ca-pub-XXX
  admobAppId?: string; // ca-app-pub-XXX
}

interface SettingsContextType {
  settings: AppSettings;
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>({
    appName: 'Korea 90',
    logoUrl: '/logo.png',
    iconUrl: '/logo.png'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'config'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as AppSettings;
        setSettings(prev => ({ ...prev, ...data }));
        
        // Update Favicon and Title
        const iconSource = data.iconUrl || data.logoUrl;
        if (iconSource) {
          const link: HTMLLinkElement = document.querySelector("link[rel*='icon']") || document.createElement('link');
          link.type = 'image/x-icon';
          link.rel = 'shortcut icon';
          link.href = iconSource;
          document.getElementsByTagName('head')[0].appendChild(link);

          // Also update apple-touch-icon
          const appleLink: HTMLLinkElement = document.querySelector("link[rel='apple-touch-icon']") || document.createElement('link');
          appleLink.rel = 'apple-touch-icon';
          appleLink.href = iconSource;
          document.getElementsByTagName('head')[0].appendChild(appleLink);
        }

        if (data.appName) {
          document.title = data.appName;
        }

        // Adsense integration
        if (data.adsEnabled && data.adPublisherId) {
          const adsenseId = 'google-adsense-script';
          if (!document.getElementById(adsenseId)) {
            const script = document.createElement('script');
            script.id = adsenseId;
            script.async = true;
            script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${data.adPublisherId}`;
            script.crossOrigin = 'anonymous';
            document.head.appendChild(script);
          }
        } else {
           const existingScript = document.getElementById('google-adsense-script');
           if (existingScript) existingScript.remove();
        }
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
