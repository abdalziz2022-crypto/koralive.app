import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { AdMob } from '@capacitor-community/admob';
import MainLayout from './components/layouts/MainLayout';
import HomePage from './pages/HomePage';
import MatchDetailsPage from './pages/MatchDetailsPage';
import AdminPanel from './components/AdminPanel';
import Profile from './components/Profile';
import AnnouncementBar from './components/AnnouncementBar';
import SplashScreen from './components/SplashScreen';
import Schedule from './components/Schedule';
import ScrollToHash from './components/ScrollToHash';
import Footer from './components/Footer';
import { MatchProvider } from './context/MatchContext';
import { SettingsProvider } from './context/SettingsContext';
import { ErrorProvider } from './context/ErrorContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import GoalNotifier from './components/GoalNotifier';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import MatchTestPage from './pages/MatchTestPage';
import ApiFootballTestPage from './pages/ApiFootballTestPage';
import NewsAggregatorPage from './pages/NewsAggregatorPage';
import BrandSystemPage from './pages/BrandSystemPage';
import FootballDebugScreen from './pages/FootballDebugScreen';
import SystemHealthPage from './pages/SystemHealthPage';
import DownloadPage from './pages/DownloadPage';

import LeaguesPage from './pages/LeaguesPage';
import LeaguePage from './pages/LeaguePage';
import TeamPage from './pages/TeamPage';
import PlayerPage from './pages/PlayerPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export default function App() {
  useEffect(() => {
    // Run automated startup diagnostics check
    const runStartupDiagnostics = async () => {
      console.log("%c⚽ [Korea90 V2 System Startup Check] Initializing audit...", "color: #10b981; font-weight: bold; font-size: 13px;");
      
      const viteApiKey = import.meta.env.VITE_API_KEY || '';
      const localOverride = localStorage.getItem('korea90_user_api_key') || '';
      
      console.log(`[Startup Audit] VITE_API_KEY Configured: ${viteApiKey ? '✅ YES' : '❌ NO'}`);
      if (localOverride) {
        console.info(`[Startup Audit] UI Local Storage override detected: ✅ YES (Active)`);
      }
      
      try {
        const res = await fetch('/api/diagnostics');
        if (res.ok) {
          const report = await res.json();
          console.log("%c[Startup Audit] Server diagnostics report:", "color: #3b82f6;", report);
          if (!report.viteApiKeyStatus && !localOverride) {
            console.error("[Startup Audit Error] CRITICAL: VITE_API_KEY is completely missing on server. App is running on offline backups.");
          }
          if (!report.geminiApiKeyStatus) {
            console.warn("[Startup Audit Warning] GEMINI_API_KEY is not configured on the server. AI features may be disabled.");
          }
          if (!report.firebaseStatus) {
            console.error("[Startup Audit Error] Firestore database is not responding correctly.");
          }
        } else {
          console.error(`[Startup Audit Error] Server diagnostics endpoint responded with status ${res.status}`);
        }
      } catch (err: any) {
        console.error("[Startup Audit Error] Failed to ping server diagnostics:", err.message || err);
      }
    };
    runStartupDiagnostics();

    const initAdMob = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          await AdMob.initialize({
            testingDevices: ['2077ef9a63d2b398840261c8221a0c9b'],
            initializeForTesting: true,
          });
        } catch (e) {
          console.error("AdMob initialize error:", e);
        }
      }
    };
    initAdMob();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ErrorProvider>
          <SettingsProvider>
            <MatchProvider>
              <NotificationProvider>
                <GoalNotifier />
                <Router>
                  <ScrollToHash />
                  <MainLayout>
                    <SplashScreen />
                    <Routes>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/league/:id" element={<LeaguePage />} />
                      <Route path="/team/:id" element={<TeamPage />} />
                      <Route path="/player/:id" element={<PlayerPage />} />
                      <Route path="/match/:id" element={<MatchDetailsPage />} />
                      <Route path="/schedule" element={<Schedule />} />
                      <Route path="/leagues" element={<LeaguesPage />} />
                      <Route path="/admin" element={<AdminPanel />} />
                      <Route path="/admin/system-health" element={<SystemHealthPage />} />
                      <Route path="/download" element={<DownloadPage />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/test-match" element={<MatchTestPage />} />
                      <Route path="/apifootball-test" element={<ApiFootballTestPage />} />
                      <Route path="/news" element={<NewsAggregatorPage />} />
                      <Route path="/brand" element={<BrandSystemPage />} />
                      <Route path="/football-debug" element={<FootballDebugScreen />} />
                    </Routes>
                  </MainLayout>
                </Router>
              </NotificationProvider>
            </MatchProvider>
          </SettingsProvider>
        </ErrorProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
