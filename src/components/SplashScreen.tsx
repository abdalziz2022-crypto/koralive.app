import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useSettings } from '../context/SettingsContext';

export default function SplashScreen() {
  const [show, setShow] = useState(true);
  const { settings } = useSettings();

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
    }, 2500); // Show for 2.5 seconds
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center space-y-8"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              duration: 0.8,
              ease: "easeOut",
              repeat: Infinity,
              repeatType: "reverse"
            }}
            className="relative"
          >
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
            <img src={settings.iconUrl || settings.logoUrl || "/logo.png"} alt="App Logo" className="w-24 h-24 object-contain relative z-10 drop-shadow-2xl rounded-2xl" />
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center space-y-2"
          >
            <h1 className="text-4xl font-black italic tracking-tighter uppercase">
              {settings.appName?.split(' ')[0] || 'KOREA'}<span className="text-primary ml-1">{settings.appName?.split(' ')[1] || '90'}</span>
            </h1>
            <p className="text-gray-500 text-sm font-medium">الوجهة الأولى لعشاق كرة القدم</p>
          </motion.div>

          <div className="absolute bottom-12 flex flex-col items-center gap-2">
            <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="w-1/2 h-full bg-primary"
              />
            </div>
            <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Loading Engine</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
