import React from 'react';
import { Link } from 'react-router-dom';
import { Radio } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

export default function Footer() {
  const { settings } = useSettings();
  
  return (
    <footer className="bg-black/40 border-t border-border pt-12 pb-24 md:pb-12 px-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="col-span-1 md:col-span-2 space-y-4">
          <Link to="/" className="flex items-center gap-3">
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt="Logo" className="w-8 h-8 rounded-lg object-cover" />
            ) : (
              <img src="/logo.png" alt="Logo" className="w-8 h-8 rounded-lg object-contain bg-black/40" />
            )}
            <span className="text-xl font-black tracking-tighter uppercase">
              {settings.appName?.split(' ')[0] || 'KOREA'}<span className="text-primary ml-1">{settings.appName?.split(' ')[1] || '90'}</span>
            </span>
          </Link>
          <p className="text-gray-500 text-sm max-w-xs">
            أول موقع رياضي عربي يقدم تغطية شاملة ومباشرة لكافة البطولات العالمية والمحلية بإحصائيات حية وتوقعات الذكاء الاصطناعي.
          </p>
        </div>

        <div>
          <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-xs">روابط سريعة</h4>
          <ul className="space-y-2 text-sm text-gray-400 font-medium">
            <li><Link to="/#live" className="hover:text-primary transition-colors">مباريات مباشرة</Link></li>
            <li><Link to="/#news" className="hover:text-primary transition-colors">آخر الأخبار</Link></li>
            <li><Link to="/#upcoming" className="hover:text-primary transition-colors">المباريات القادمة</Link></li>
            <li><Link to="/#results" className="hover:text-primary transition-colors">نتائج المباريات</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-xs">التطبيق</h4>
          <ul className="space-y-2 text-sm text-gray-400 font-medium">
            <li><Link to="/schedule" className="hover:text-primary transition-colors">جدول المباريات</Link></li>
            <li><Link to="/leagues" className="hover:text-primary transition-colors">البطولات</Link></li>
            <li><Link to="/profile" className="hover:text-primary transition-colors">حسابي</Link></li>
            <li><Link to="/download" className="text-emerald-450 hover:text-primary font-black transition-all">تحميل التطبيق APK / PWA ⚡</Link></li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-gray-600 font-black uppercase tracking-widest">
        <p>© 2026 {settings.appName || 'KOREA 90'}. جميع الحقوق محفوظة</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-gray-400">سياسة الخصوصية</a>
          <a href="#" className="hover:text-gray-400">شروط الاستخدام</a>
        </div>
      </div>
    </footer>
  );
}
