import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, Trophy, User, LogIn, LogOut, Radio, Settings, Globe } from 'lucide-react';
import { motion } from 'motion/react';
import { auth } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useSettings } from '../context/SettingsContext';
import { useTheme } from '../context/ThemeContext';
import ShareButton from './ShareButton';
import InstallAppButton from './InstallAppButton';

export default function Navbar() {
  const [user] = useAuthState(auth);
  const location = useLocation();
  const { settings } = useSettings();
  const { theme } = useTheme();

  const isDark = theme.mode === 'dark';
  const isAdmin = user?.email === 'abdalziz2022@gmail.com';

  const navItems = [
    { name: 'الرئيسية', icon: Home, path: '/' },
    { name: 'الجدول', icon: Calendar, path: '/schedule' },
    { name: 'البطولات', icon: Trophy, path: '/leagues' },
    { name: 'الأخبار', icon: Globe, path: '/news' },
  ];

  if (isAdmin) {
    navItems.push({ name: 'اختبار API', icon: Radio, path: '/test-match' });
    navItems.push({ name: 'مباريات API-Football', icon: Trophy, path: '/apifootball-test' });
    navItems.push({ name: 'الإدارة', icon: Settings, path: '/admin' });
  }

  return (
    <nav className="fixed bottom-4 left-4 right-4 z-50 md:top-4 md:bottom-auto md:left-4 md:right-4 rounded-2xl md:rounded-3xl glass border border-border/70 px-4 md:px-6 py-2.5 md:py-3 flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.55)]">
      <Link to="/" className="hidden md:flex items-center gap-3 group">
        {settings.logoUrl ? (
          <img src={settings.logoUrl} alt="Logo" className="w-9 h-9 rounded-xl object-cover border border-border/45 group-hover:scale-105 transition-transform" />
        ) : (
          <img src="/logo.png" alt="Logo" className="w-9 h-9 rounded-xl object-contain bg-black/40 group-hover:scale-105 transition-transform" />
        )}
        <span className="text-xl font-black tracking-tighter uppercase flex items-center">
          {(() => {
            const name = settings.appName || 'كورة 90';
            const parts = name.split(' ');
            if (parts.length > 1) {
              const lastPart = parts.pop();
              return (
                <>
                  {parts.join(' ')}<span className="text-primary ml-1.5 inline-block">{lastPart}</span>
                </>
              );
            }
            return name;
          })()}
        </span>
      </Link>

      <div className="flex flex-1 justify-around md:justify-center gap-6">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col md:flex-row items-center gap-1 md:gap-2 transition-all relative py-1.5 px-3.5 rounded-xl group/item ${
                isActive 
                  ? 'text-primary font-extrabold bg-primary/5' 
                  : isDark 
                    ? 'text-gray-400 hover:text-white hover:bg-white/[0.03]' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
              }`}
            >
              <item.icon size={18} className="transition-transform group-hover/item:scale-110" />
              <span className="text-[10px] md:text-xs font-black tracking-wide">{item.name}</span>
              {isActive && (
                <motion.div
                  layoutId="activeNavIndicator"
                  className="absolute -bottom-1 left-3 right-3 h-[2px] bg-primary rounded-full hidden md:block"
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                />
              )}
            </Link>
          );
        })}
      </div>

      <div className="flex items-center gap-3 md:gap-4">
        {/* App Install Button */}
        <InstallAppButton />

        {/* Global Share Button */}
        <ShareButton variant="icon" align="left" text="شاهد البث المباشر والملخصات على كورة 90 بقمة الجودة والاحترافية!" />
        
        {user ? (
          <Link to="/profile" className="flex items-center gap-3 group">
            <span className={`hidden md:block text-xs font-black transition-colors ${isDark ? 'text-gray-400 group-hover:text-primary' : 'text-slate-600 group-hover:text-primary'}`}>{user.displayName}</span>
            <img 
              src={user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user.uid}`} 
              alt="avatar" 
              className="w-8 h-8 rounded-full border border-border group-hover:neon-border transition-all"
            />
          </Link>
        ) : (
          <Link 
            to="/profile"
            className="flex items-center gap-2 bg-surface border border-border text-[color:var(--color-text)] font-bold px-4 py-2.5 rounded-xl text-[10px] uppercase tracking-tighter hover:neon-border hover:bg-surface-hover transition-all active:scale-95 group"
          >
            <User size={14} className="text-primary group-hover:animate-pulse" />
            <span className="hidden md:inline">دخول / زائر</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
