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
import GoalNotifier from './components/GoalNotifier';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import MatchTestPage from './pages/MatchTestPage';
import ApiFootballTestPage from './pages/ApiFootballTestPage';
import NewsAggregatorPage from './pages/NewsAggregatorPage';
import BrandSystemPage from './pages/BrandSystemPage';

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
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/test-match" element={<MatchTestPage />} />
                    <Route path="/apifootball-test" element={<ApiFootballTestPage />} />
                    <Route path="/news" element={<NewsAggregatorPage />} />
                    <Route path="/brand" element={<BrandSystemPage />} />
                  </Routes>
                </MainLayout>
              </Router>
            </MatchProvider>
          </SettingsProvider>
        </ErrorProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
