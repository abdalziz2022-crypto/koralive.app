import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Home, 
  Calendar, 
  Newspaper, 
  Bookmark, 
  User, 
  Moon, 
  Sun, 
  Search,
  Bell,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation();
  const { settings, toggleTheme } = useAppStore();
  
  const navItems = [
    { name: 'الرئيسية', path: '/', icon: Home },
    { name: 'المباريات', path: '/schedule', icon: Calendar },
    { name: 'الأخبار', path: '/news', icon: Newspaper },
    { name: 'المفضلة', path: '/profile#bookmarks', icon: Bookmark },
    { name: 'حسابي', path: '/profile', icon: User },
  ];

  const handleSearchClick = () => {
    // We will build a neat search modal inside our MVP
    const event = new CustomEvent('open-search-modal');
    window.dispatchEvent(event);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-[color:var(--color-text)] font-sans antialiased selection:bg-primary/30 selection:text-white" dir="rtl">
      
      {/* Premium Sleek Top Header */}
      <header className="sticky top-0 z-40 w-full glass border-b border-border/10 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* Logo Brand Zone */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="relative w-9 h-9 bg-gradient-to-br from-primary to-emerald-600 rounded-xl flex items-center justify-center shadow-md shadow-primary/20 overflow-hidden transform group-hover:scale-105 transition-all duration-300">
              <span className="font-extrabold text-black text-lg tracking-wider">K90</span>
              <div className="absolute inset-x-0 bottom-0 h-1 bg-yellow-400"></div>
            </div>
            <div className="flex flex-col">
              <span className="font-black text-base tracking-tight text-white group-hover:text-primary transition-colors">كورة لايف V2</span>
              <span className="text-[10px] font-mono text-gray-400 text-right leading-none">KOREA90 V2</span>
            </div>
          </Link>

          {/* Core Controls: Search, Theme, Alarm */}
          <div className="flex items-center gap-2">
            
            {/* Elegant Quick Search Button */}
            <button 
              onClick={handleSearchClick}
              className="p-2.5 rounded-xl hover:bg-surface-hover hover:text-primary text-gray-400 transition-all duration-300 transform active:scale-95"
              aria-label="بحث"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Notification Simulation Bell */}
            <button 
              className="relative p-2.5 rounded-xl hover:bg-surface-hover hover:text-primary text-gray-400 transition-all duration-300 transform active:scale-95"
              aria-label="تنبيهات"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 left-2 w-2 h-2 bg-primary rounded-full neon-glow"></span>
            </button>

            {/* Premium Theme Mode Toggle with Flip animation */}
            <button 
              onClick={toggleTheme}
              className="p-2.5 rounded-xl hover:bg-surface-hover text-gray-400 hover:text-yellow-400 transition-all duration-300 transform active:rotate-180"
              aria-label="مغير السمة"
            >
              {settings.theme === 'dark' ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-indigo-500" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-6 pb-28 md:pb-12 transition-all duration-300">
        {children}
      </main>

      {/* Sticky Bottom Premium Navigation Bar (Mobile & Tablet) */}
      <nav className="fixed bottom-0 inset-x-0 z-50 glass border-t border-border/10 py-2.5 px-4 shadow-[0_-8px_30px_rgb(0,0,0,0.12)] md:rounded-t-[2.5rem] md:max-w-xl md:mx-auto md:mb-4 md:border">
        <ul className="flex items-center justify-around w-full">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path.includes('#') && location.pathname + location.hash === item.path);
            const Icon = item.icon;
            
            return (
              <li key={item.path} className="relative">
                <Link 
                  to={item.path}
                  className="flex flex-col items-center gap-1 group px-3.5 py-1.5 rounded-2xl transition-all duration-300"
                >
                  <div className={`relative p-1 rounded-lg transform ${isActive ? 'scale-110 text-primary' : 'text-gray-400 group-hover:text-gray-200'} transition-all duration-300`}>
                    <Icon className="w-5 h-5" />
                    {isActive && (
                      <motion.div 
                        layoutId="active-nav-indicator" 
                        className="absolute -inset-1.5 bg-primary/10 rounded-xl -z-10" 
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                  </div>
                  <span className={`text-[10px] font-semibold tracking-tight ${isActive ? 'text-primary font-bold' : 'text-gray-400 group-hover:text-gray-300'} transition-colors duration-200`}>
                    {item.name}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
    </div>
  );
}
