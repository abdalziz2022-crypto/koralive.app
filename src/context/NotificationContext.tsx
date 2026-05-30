import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { FAMOUS_TEAMS } from '../api/apiClient';

export type NotificationType = 'goal' | 'news' | 'result' | 'card' | 'status_change';

export interface NotificationLog {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  referenceId?: string; // e.g. newsId, matchId
  metadata?: {
    playerName?: string;
    teamName?: string;
    minute?: number;
    homeScore?: number;
    awayScore?: number;
    category?: string;
  };
}

export interface SubscriptionSettings {
  news: boolean;
  goals: boolean;
  results: boolean;
  cardsAndSubs: boolean;
  audioEffects: boolean;
  arabicVoiceCommentator: boolean;
  onlyFavoriteTeams: boolean;
}

interface NotificationContextType {
  notifications: NotificationLog[];
  subscriptions: SubscriptionSettings;
  unreadCount: number;
  favoriteTeamIds: number[];
  toggleSubscription: (key: keyof SubscriptionSettings) => void;
  toggleFavoriteTeam: (teamId: number) => void;
  addNotificationLog: (
    type: NotificationType,
    title: string,
    body: string,
    referenceId?: string,
    metadata?: any
  ) => void;
  markAllAsRead: () => void;
  clearAllNotifications: () => void;
  playNotificationSound: (type: 'goal' | 'news' | 'result' | 'card') => void;
  triggerArabicSpeech: (text: string) => void;
}

const defaultSubscriptions: SubscriptionSettings = {
  news: true,
  goals: true,
  results: true,
  cardsAndSubs: true,
  audioEffects: true,
  arabicVoiceCommentator: true,
  onlyFavoriteTeams: false,
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [user] = useAuthState(auth);
  
  // Load preferences from localStorage
  const [subscriptions, setSubscriptions] = useState<SubscriptionSettings>(() => {
    const saved = localStorage.getItem('korea90_notification_preferences');
    return saved ? JSON.parse(saved) : defaultSubscriptions;
  });

  // Load favorite team IDs from localStorage
  const [favoriteTeamIds, setFavoriteTeamIds] = useState<number[]>(() => {
    const saved = localStorage.getItem('korea90_favorite_team_ids');
    return saved ? JSON.parse(saved) : [2939, 2940]; // Initialize with Al Hilal & Al Nassr as default favorites!
  });

  // Load history logs from localStorage
  const [notifications, setNotifications] = useState<NotificationLog[]>(() => {
    const saved = localStorage.getItem('korea90_notification_logs');
    return saved ? JSON.parse(saved) : [];
  });

  const sessionStartTimeRef = useRef<number>(Date.now());
  const isInitialNewsLoadRef = useRef<boolean>(true);

  // Sync preferences to localStorage
  const savePreferences = (updated: SubscriptionSettings) => {
    setSubscriptions(updated);
    localStorage.setItem('korea90_notification_preferences', JSON.stringify(updated));
  };

  // Sync favorite team IDs to localStorage
  useEffect(() => {
    localStorage.setItem('korea90_favorite_team_ids', JSON.stringify(favoriteTeamIds));
  }, [favoriteTeamIds]);

  // Sync notifications to localStorage
  useEffect(() => {
    localStorage.setItem('korea90_notification_logs', JSON.stringify(notifications));
  }, [notifications]);

  const toggleSubscription = (key: keyof SubscriptionSettings) => {
    const updated = { ...subscriptions, [key]: !subscriptions[key] };
    savePreferences(updated);
  };

  const toggleFavoriteTeam = (teamId: number) => {
    setFavoriteTeamIds((prev) => 
      prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId]
    );
  };

  // Synthesize custom sound effects on-demand
  const playNotificationSound = useCallback((type: 'goal' | 'news' | 'result' | 'card') => {
    if (!subscriptions.audioEffects) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const now = ctx.currentTime;

      if (type === 'news') {
        // News: A high-fidelity retro news reporting alert chime (3 fast pings climbing)
        const notes = [587.33, 783.99, 1174.66]; // D5, G5, D6
        notes.forEach((freq, idx) => {
          const start = now + idx * 0.12;
          const duration = 0.4;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, start);
          
          gain.gain.setValueAtTime(0, start);
          gain.gain.linearRampToValueAtTime(0.15, start + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + duration);
        });
      } else if (type === 'goal') {
        // Goal: Excited crowd whistle and glorious fanfare chords
        // Whistle blows
        for (let whistle = 0; whistle < 2; whistle++) {
          const start = now + whistle * 0.25;
          const duration = 0.15;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(900, start);
          osc.frequency.exponentialRampToValueAtTime(1400, start + duration);
          
          gain.gain.setValueAtTime(0, start);
          gain.gain.linearRampToValueAtTime(0.2, start + 0.02);
          gain.gain.setValueAtTime(0.2, start + duration - 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + duration);
        }

        // Fanfare chord: C5 -> E5 -> G5 -> C6
        const chords = [523.25, 659.25, 783.99, 1046.50];
        chords.forEach((freq, idx) => {
          const start = now + 0.4 + idx * 0.07;
          const duration = 1.0;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, start);
          
          gain.gain.setValueAtTime(0, start);
          gain.gain.linearRampToValueAtTime(0.15, start + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + duration);
        });
      } else if (type === 'result') {
        // Result: Triple long Referee Final Whistle blows signifying match end
        const whistles = [
          { delay: 0, len: 0.35 },
          { delay: 0.5, len: 0.35 },
          { delay: 1.0, len: 0.8 },
        ];
        whistles.forEach((w) => {
          const start = now + w.delay;
          const duration = w.len;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(800, start);
          osc.frequency.linearRampToValueAtTime(750, start + duration);
          
          gain.gain.setValueAtTime(0, start);
          gain.gain.linearRampToValueAtTime(0.25, start + 0.03);
          gain.gain.setValueAtTime(0.25, start + duration - 0.05);
          gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + duration);
        });
      } else if (type === 'card') {
        // Warning Buzzer for cards
        const duration = 0.3;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(380, now);
        osc.frequency.linearRampToValueAtTime(250, now + duration);
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.15, now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + duration);
      }
    } catch (e) {
      console.warn("Sound synthesis blocked or failed:", e);
    }
  }, [subscriptions.audioEffects]);

  // Excited commentator Arabic Text to Speech
  const triggerArabicSpeech = useCallback((text: string) => {
    if (!subscriptions.arabicVoiceCommentator || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ar';
      utterance.rate = 1.05;
      utterance.pitch = 1.1;
      
      const voices = window.speechSynthesis.getVoices();
      const arVoice = voices.find(v => v.lang.startsWith('ar') || v.lang.includes('ARA'));
      if (arVoice) {
        utterance.voice = arVoice;
      }
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Arabic speech synthesis failed:", e);
    }
  }, [subscriptions.arabicVoiceCommentator]);

  // Add notification to persistent list
  const addNotificationLog = useCallback((
    type: NotificationType,
    title: string,
    body: string,
    referenceId?: string,
    metadata?: any
  ) => {
    // Check user subscriptions settings before queuing/playing
    if (type === 'news' && !subscriptions.news) return;
    if (type === 'goal' && !subscriptions.goals) return;
    if (type === 'result' && !subscriptions.results) return;
    if ((type === 'card' || type === 'status_change') && !subscriptions.cardsAndSubs) return;

    // Filter goals to favorite teams only if enabled
    if (type === 'goal' && subscriptions.onlyFavoriteTeams && metadata?.teamName) {
      const selectedTeamNames = FAMOUS_TEAMS.filter((t) => favoriteTeamIds.includes(t.id)).map((t) => t.name.toLowerCase());
      const eventTeamLower = String(metadata.teamName).toLowerCase();
      const isFavorite = selectedTeamNames.some((name) => eventTeamLower.includes(name) || name.includes(eventTeamLower));
      if (!isFavorite) {
        console.log(`Skipping goal notification since team "${metadata.teamName}" is not on favorites.`);
        return; // Filtered out!
      }
    }

    const newLog: NotificationLog = {
      id: `${type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type,
      title,
      body,
      timestamp: new Date().toISOString(),
      read: false,
      referenceId,
      metadata,
    };

    setNotifications((prev) => {
      // Avoid duplicate logs of standard same ref matches (within a small elapsed window)
      if (prev.some((n) => n.referenceId === referenceId && n.title === title && n.type === type)) {
        return prev;
      }
      // Keep up to 50 logs
      const trimmed = [newLog, ...prev];
      return trimmed.slice(0, 50);
    });

    // Play physical sound effects
    if (type === 'goal') {
      playNotificationSound('goal');
    } else if (type === 'news') {
      playNotificationSound('news');
    } else if (type === 'result') {
      playNotificationSound('result');
    } else if (type === 'card') {
      playNotificationSound('card');
    }

  }, [subscriptions, favoriteTeamIds, playNotificationSound]);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Listen to Firestore real-time News publishes!
  useEffect(() => {
    // Only fetch if news subscription is on
    const newsRef = collection(db, 'news');
    const qNews = query(newsRef, orderBy('createdAt', 'desc'), limit(5));

    const unsubNews = onSnapshot(qNews, (snapshot) => {
      if (isInitialNewsLoadRef.current) {
        // Skip adding past news to real-time popups on first launch
        isInitialNewsLoadRef.current = false;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const newsData = change.doc.data();
          const createdAtTime = new Date(newsData.createdAt || '').getTime();
          
          // Make sure it's newly published within the session runtime to avoid spamming historical news
          if (createdAtTime > sessionStartTimeRef.current - 10000) {
            const title = `🗞️ خبر عاجل: ${newsData.category || 'مستجدات'}`;
            const body = newsData.title || 'تم نشر خبر رياضي جديد في كورة لايف.';
            
            // Add to persistent logs!
            addNotificationLog('news', title, body, change.doc.id, {
              category: newsData.category,
            });

            // Commentate out loud!
            triggerArabicSpeech(`خبر عاجل الآن! ${newsData.title}`);
          }
        }
      });
    }, (error) => {
      console.warn("Firestore news notification adapter subscription warnings:", error);
    });

    return () => {
      unsubNews();
    };
  }, [addNotificationLog, triggerArabicSpeech]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        subscriptions,
        unreadCount,
        favoriteTeamIds,
        toggleSubscription,
        toggleFavoriteTeam,
        addNotificationLog,
        markAllAsRead,
        clearAllNotifications,
        playNotificationSound,
        triggerArabicSpeech,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
