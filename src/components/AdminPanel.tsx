import React, { useState, useEffect, useMemo } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, updateDoc, doc, deleteDoc, setDoc, getDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Match, MatchStatus, StreamingLink, News, League, Announcement, Ad } from '../types';
import { 
  Plus, Trash2, Send, ShieldAlert, LayoutGrid, Newspaper, ListFilter, X, 
  Megaphone, Trophy, Edit3, Radio, Info, Settings, ExternalLink, 
  Search, CheckCircle2, AlertCircle, Clock, Activity, BarChart2,
  ChevronRight, ArrowLeft, RefreshCw, Layers, Database
} from 'lucide-react';
import ManagementList from './ManagementList';
import DataEngine from './DataEngine';
import StatsManager from './StatsManager';
import { motion, AnimatePresence } from 'motion/react';
import { useSettings } from '../context/SettingsContext';
import { useError } from '../context/ErrorContext';
import { extractIframeSrc, stripUndefined, cn } from '../lib/utils';

type Tab = 
  | 'DASHBOARD' 
  | 'MATCHES_LIST' | 'MATCH_FORM'
  | 'NEWS_LIST' | 'NEWS_FORM'
  | 'LEAGUES_LIST' | 'LEAGUE_FORM'
  | 'ANNOUNCEMENTS_LIST' | 'ANNOUNCEMENT_FORM'
  | 'DATA_ENGINE' | 'STATS_MANAGER' | 'SETTINGS' | 'DATA_CLEANUP'
  | 'ADS_LIST' | 'AD_FORM';

export default function AdminPanel() {
  const [user] = useAuthState(auth);
  const { settings: globalSettings } = useSettings();
  const { showError, showToast } = useError();
  const [activeTab, setActiveTab] = useState<Tab>('DASHBOARD');
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data States
  const [dbMatches, setDbMatches] = useState<Match[]>([]);
  const [dbNews, setDbNews] = useState<News[]>([]);
  const [dbLeagues, setDbLeagues] = useState<League[]>([]);
  const [dbAnnouncements, setDbAnnouncements] = useState<Announcement[]>([]);
  const [dbAds, setDbAds] = useState<Ad[]>([]);
  const [dbSources, setDbSources] = useState<any[]>([]);

  // Deletion Confirmation Modal States
  const [showMatchesModal, setShowMatchesModal] = useState(false);
  const [showNewsModal, setShowNewsModal] = useState(false);
  const [showAllModal, setShowAllModal] = useState(false);
  const [deleteInProgress, setDeleteInProgress] = useState(false);

  // Form Initializers
  const initialMatch = {
    homeTeam: '', awayTeam: '', homeLogo: '', awayLogo: '',
    homeScore: 0, awayScore: 0, status: 'UPCOMING' as MatchStatus,
    league: '', leagueLogo: '', startTime: new Date().toISOString(),
    commentator: '', channel: '', youtubeLink: '', 
    streamingLinks: [], replayLinks: [], highlightsLinks: []
  };
  const initialNews = { title: '', content: '', image: '', category: 'عام' };
  const initialLeague = { name: '', country: '', logo: '' };
  const initialAnnouncement = { text: '', active: true, type: 'info' as const, link: '', priority: 0, expiresAt: '' };
  const initialAd = { title: '', slot: 'Home_Top', type: 'IMAGE' as 'IMAGE' | 'CODE', code: '', imageUrl: '', linkUrl: '', active: true };

  // API Fetch State
  const [apiKey, setApiKey] = useState('');
  const [fetchingApi, setFetchingApi] = useState(false);

  // Form States
  const [matchData, setMatchData] = useState<Partial<Match>>(initialMatch);
  const [newsData, setNewsData] = useState<Partial<News>>(initialNews);
  const [leagueData, setLeagueData] = useState<Partial<League>>(initialLeague);
  const [announcementData, setAnnouncementData] = useState<Partial<Announcement>>(initialAnnouncement);
  const [adData, setAdData] = useState<Partial<Ad>>(initialAd);
  const [settingsData, setSettingsData] = useState({ 
    logoUrl: globalSettings.logoUrl || '/logo.png', 
    iconUrl: globalSettings.iconUrl || '/logo.png',
    appName: globalSettings.appName || '',
    adsEnabled: globalSettings.adsEnabled || false,
    adPublisherId: globalSettings.adPublisherId || '',
    admobAppId: globalSettings.admobAppId || '',
  });

  useEffect(() => {
    setSettingsData({
      logoUrl: globalSettings.logoUrl || '/logo.png', 
      iconUrl: globalSettings.iconUrl || '/logo.png',
      appName: globalSettings.appName || '',
      adsEnabled: globalSettings.adsEnabled || false,
      adPublisherId: globalSettings.adPublisherId || '',
      admobAppId: globalSettings.admobAppId || '',
    });
  }, [globalSettings]);

  const [newLink, setNewLink] = useState<StreamingLink>({ label: '', url: '', quality: '720p' });
  const [linkType, setLinkType] = useState<'streamingLinks' | 'replayLinks' | 'highlightsLinks'>('streamingLinks');
  const [showLinkInputs, setShowLinkInputs] = useState(false);

  useEffect(() => {
    const qM = query(collection(db, 'matches'), orderBy('startTime', 'desc'));
    const qN = query(collection(db, 'news'), orderBy('createdAt', 'desc'));
    const qL = query(collection(db, 'leagues'), orderBy('name', 'asc'));
    const qA = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
    const qAds = query(collection(db, 'ads'), orderBy('createdAt', 'desc'));
    const qSources = query(collection(db, 'sources'));
    
    const unsubMatches = onSnapshot(qM, (s) => {
      setDbMatches(s.docs.map(d => ({ id: d.id, ...d.data() } as Match)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'matches'));
    
    const unsubNews = onSnapshot(qN, (s) => {
      setDbNews(s.docs.map(d => ({ id: d.id, ...d.data() } as News)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'news'));
    
    const unsubLeagues = onSnapshot(qL, (s) => {
      setDbLeagues(s.docs.map(d => ({ id: d.id, ...d.data() } as League)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'leagues'));
    
    const unsubAnnouncements = onSnapshot(qA, (s) => {
      setDbAnnouncements(s.docs.map(d => ({ id: d.id, ...d.data() } as Announcement)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'announcements'));

    const unsubAds = onSnapshot(qAds, (s) => {
      setDbAds(s.docs.map(d => ({ id: d.id, ...d.data() } as Ad)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'ads'));
    
    const unsubSources = onSnapshot(qSources, (s) => {
      setDbSources(s.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'sources'));
    
    return () => { unsubMatches(); unsubNews(); unsubLeagues(); unsubAnnouncements(); unsubAds(); unsubSources(); };
  }, []);

  const [checkingLinks, setCheckingLinks] = useState(false);
  const [brokenLinks, setBrokenLinks] = useState<Record<string, { label: string, error: string }[]>>({});

  const checkAllLinks = async () => {
    setCheckingLinks(true);
    const results: Record<string, { label: string, error: string }[]> = {};
    
    for (const match of dbMatches) {
      if (match.status !== 'FINISHED' && (match.streamingLinks?.length > 0)) {
        const deadLinks: { label: string, error: string }[] = [];
        for (const link of match.streamingLinks) {
          try {
            await fetch(link.url, { method: 'HEAD', mode: 'no-cors' });
          } catch (e) {
            const errorMsg = e instanceof Error ? e.message : 'Network Error';
            deadLinks.push({ label: link.label, error: errorMsg });
          }
        }
        if (deadLinks.length > 0) results[match.id] = deadLinks;
      }
    }
    
    setBrokenLinks(results);
    setCheckingLinks(false);
    if (Object.keys(results).length === 0) {
      showToast('جميع الروابط تعمل بشكل سليم', 'success');
    } else {
      showToast(`تم اكتشاف روابط معطلة في ${Object.keys(results).length} مباريات`, 'warning');
    }
  };

  const handleDeleteAllMatches = async () => {
    try {
      setDeleteInProgress(true);
      showToast('جاري حذف المباريات وبدء التنظيم...', 'info');
      const batchSize = 10;
      for (let i = 0; i < dbMatches.length; i += batchSize) {
        const batch = dbMatches.slice(i, i + batchSize);
        await Promise.all(batch.map(m => {
          if (!m.id) return Promise.resolve();
          return deleteDoc(doc(db, 'matches', m.id));
        }));
      }
      showToast('تم حذف كافة المباريات بنجاح!', 'success');
      setShowMatchesModal(false);
    } catch (e: any) {
      showToast('حدث خطأ أثناء حذف المباريات: ' + e.message, 'warning');
    } finally {
      setDeleteInProgress(false);
    }
  };

  const handleDeleteAllNews = async () => {
    try {
      setDeleteInProgress(true);
      showToast('جاري حذف الأخبار...', 'info');
      const batchSize = 10;
      for (let i = 0; i < dbNews.length; i += batchSize) {
        const batch = dbNews.slice(i, i + batchSize);
        await Promise.all(batch.map(n => {
          if (!n.id) return Promise.resolve();
          return deleteDoc(doc(db, 'news', n.id));
        }));
      }
      showToast('تم حذف كافة الأخبار بنجاح!', 'success');
      setShowNewsModal(false);
    } catch (e: any) {
      showToast('حدث خطأ أثناء حذف الأخبار: ' + e.message, 'warning');
    } finally {
      setDeleteInProgress(false);
    }
  };

  const handleDeleteAllData = async () => {
    try {
      setDeleteInProgress(true);
      showToast('جاري التنظيف الشامل للبيانات...', 'info');
      const batchSize = 10;
      const matchDeletions = [];
      for (let i = 0; i < dbMatches.length; i += batchSize) {
        const batch = dbMatches.slice(i, i + batchSize);
        matchDeletions.push(Promise.all(batch.map(m => {
          if (!m.id) return Promise.resolve();
          return deleteDoc(doc(db, 'matches', m.id));
        })));
      }
      const newsDeletions = [];
      for (let i = 0; i < dbNews.length; i += batchSize) {
        const batch = dbNews.slice(i, i + batchSize);
        newsDeletions.push(Promise.all(batch.map(n => {
          if (!n.id) return Promise.resolve();
          return deleteDoc(doc(db, 'news', n.id));
        })));
      }
      await Promise.all([...matchDeletions, ...newsDeletions]);
      showToast('تم تصفية وحذف كافة المباريات والأخبار بنجاح!', 'success');
      setShowAllModal(false);
    } catch (e: any) {
      showToast('حدث خطأ أثناء التنظيف الشامل: ' + e.message, 'warning');
    } finally {
      setDeleteInProgress(false);
    }
  };

  const isAdmin = user?.email === 'abdalziz2022@gmail.com';

  const triggerPushNotification = async (title: string, body: string, link: string = '/') => {
    try {
      await fetch('/api/send-push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title, body, link })
      });
    } catch (e) {
      console.error('Error sending push notification broadcast:', e);
    }
  };

  const resetForms = () => {
    setMatchData(initialMatch);
    setNewsData(initialNews);
    setLeagueData(initialLeague);
    setAnnouncementData(initialAnnouncement);
    setAdData(initialAd);
    setEditingId(null);
    setSearchQuery('');
  };

  const handleSaveMatch = async () => {
    setLoading(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, 'matches', editingId), stripUndefined({ ...matchData, updatedAt: new Date().toISOString() }));
        // Broadcast push notification for match update
        const scoreString = `${matchData.homeScore ?? 0} - ${matchData.awayScore ?? 0}`;
        const matchStateDesc = matchData.status === 'LIVE' ? `جارية الآن دقيقة ${matchData.minute ?? 1}` : matchData.status === 'FINISHED' ? 'انتهت المباراة' : 'انطلاق قريباً';
        await triggerPushNotification(
          'تحديث مباراة مباشر ⚽', 
          `${matchData.homeTeam} [ ${scoreString} ] ${matchData.awayTeam} (${matchStateDesc})`, 
          '/#live'
        );
      } else {
        await addDoc(collection(db, 'matches'), stripUndefined({ ...matchData, createdAt: new Date().toISOString() }));
        // Broadcast push notification for new match
        await triggerPushNotification(
          'مباراة جديدة مضافة ⚽', 
          `${matchData.homeTeam} ضد ${matchData.awayTeam} - تابع التغطية الحصرية على كورة لايف!`, 
          '/#live'
        );
      }
      showToast('تم حفظ المباراة بنجاح', 'success');
      resetForms();
      setActiveTab('MATCHES_LIST');
    } catch (e) { 
      handleFirestoreError(e, editingId ? OperationType.UPDATE : OperationType.CREATE, `matches/${editingId || ''}`);
    } finally { setLoading(false); }
  };

  const [deletingAnnouncementId, setDeletingAnnouncementId] = useState<string | null>(null);

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'announcements', id));
      showToast('تم حذف التنبيه بنجاح', 'success');
      setDeletingAnnouncementId(null);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `announcements/${id}`);
    }
  };

  const handleGenerateMatchStats = async (matchId: string) => {
    const match = dbMatches.find(m => m.id === matchId);
    if (!match) return;

    try {
      showToast('جاري توليد الإحصائيات...', 'info');
      const response = await fetch('/api/matches/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          homeTeam: match.homeTeam,
          awayTeam: match.awayTeam,
          status: match.status,
          league: match.league
        })
      });

      if (!response.ok) throw new Error('فشل جلب الإحصائيات');
      const stats = await response.json();

      await updateDoc(doc(db, 'matches', matchId), { 
        stats,
        updatedAt: new Date().toISOString() 
      });
      showToast('تم تحديث الإحصائيات بنجاح', 'success');
    } catch (e: any) {
      showError('خطأ أثناء جلب الإحصائيات.');
    }
  };

  const handleSaveNews = async () => {
    setLoading(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, 'news', editingId), stripUndefined(newsData));
        // Broadcast news update push notification
        await triggerPushNotification('تحديث خبر عاجل 📰', newsData.title, '/news');
      } else {
        await addDoc(collection(db, 'news'), stripUndefined({ 
          ...newsData, 
          createdAt: new Date().toISOString(),
          author: user?.displayName || 'المسؤول'
        }));
        // Broadcast new article push notification
        await triggerPushNotification('خبر رياضي عاجل 📰', newsData.title, '/news');
      }
      showToast('تم حفظ الخبر بنجاح', 'success');
      resetForms();
      setActiveTab('NEWS_LIST');
    } catch (e) { 
      handleFirestoreError(e, editingId ? OperationType.UPDATE : OperationType.CREATE, `news/${editingId || ''}`);
    } finally { setLoading(false); }
  };

  const handleSaveLeague = async () => {
    setLoading(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, 'leagues', editingId), stripUndefined(leagueData));
      } else {
        await addDoc(collection(db, 'leagues'), stripUndefined(leagueData));
      }
      showToast('تم حفظ البطولة', 'success');
      resetForms();
      setActiveTab('LEAGUES_LIST');
    } catch (e) { 
      handleFirestoreError(e, editingId ? OperationType.UPDATE : OperationType.CREATE, `leagues/${editingId || ''}`);
    } finally { setLoading(false); }
  };

  const handleSaveAnnouncement = async () => {
    setLoading(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, 'announcements', editingId), stripUndefined(announcementData));
      } else {
        await addDoc(collection(db, 'announcements'), stripUndefined({ ...announcementData, createdAt: new Date().toISOString() }));
      }
      showToast('تم حفظ التنبيه', 'success');
      resetForms();
      setActiveTab('ANNOUNCEMENTS_LIST');
    } catch (e) { 
      handleFirestoreError(e, editingId ? OperationType.UPDATE : OperationType.CREATE, `announcements/${editingId || ''}`);
    } finally { setLoading(false); }
  };

  const [deletingAdId, setDeletingAdId] = useState<string | null>(null);

  const handleSaveAd = async () => {
    setLoading(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, 'ads', editingId), stripUndefined({ ...adData, updatedAt: new Date().toISOString() }));
      } else {
        await addDoc(collection(db, 'ads'), stripUndefined({ ...adData, createdAt: new Date().toISOString() }));
      }
      showToast('تم حفظ الإعلان بنجاح', 'success');
      resetForms();
      setActiveTab('ADS_LIST');
    } catch (e) {
      handleFirestoreError(e, editingId ? OperationType.UPDATE : OperationType.CREATE, `ads/${editingId || ''}`);
    } finally { setLoading(false); }
  };

  const handleDeleteAd = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'ads', id));
      showToast('تم حذف الإعلان بنجاح', 'success');
      setDeletingAdId(null);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `ads/${id}`);
    }
  };

  const toggleAdActive = async (ad: Ad) => {
    try {
      await updateDoc(doc(db, 'ads', ad.id), { active: !ad.active, updatedAt: new Date().toISOString() });
      showToast(ad.active ? 'تم إيقاف الإعلان بنجاح' : 'تم تفعيل الإعلان بنجاح', 'success');
    } catch (e) {
      showError('فشل تغيير حالة الإعلان');
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      await setDoc(doc(db, 'settings', 'config'), settingsData, { merge: true });
      showToast('تم تحديث الإعدادات بنجاح', 'success');
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'settings/config');
    } finally { setLoading(false); }
  };

  const handleFetchNewsFromAPI = async () => {
    setFetchingApi(true);
    try {
      const globalDoc = await getDoc(doc(db, 'settings', 'global'));
      const apiKey = globalDoc.data()?.newsApiKey;
      if (!apiKey) {
        showToast('يرجى إضافة مفتاح NewsAPI في محرك البيانات أولاً.', 'warning');
        return;
      }
      
      const response = await fetch(`https://newsapi.org/v2/everything?q=football OR soccer OR رياضة OR كرة قدم&language=ar&sortBy=publishedAt&apiKey=${apiKey}`);
      const data: any = await response.json();

      if (data.status === 'ok' && data.articles && data.articles.length > 0) {
        let count = 0;
        for (const article of data.articles.slice(0, 10)) {
          if (!article.urlToImage || !article.title) continue;
          
          const newsId = article.url.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase().substring(0, 50);
          await setDoc(doc(db, 'news', newsId), {
            title: article.title,
            content: article.content || article.description || article.title,
            image: article.urlToImage,
            author: article.source.name || 'NewsAPI',
            category: 'أخبار عالمية',
            createdAt: new Date(article.publishedAt).toISOString(),
            link: article.url
          }, { merge: true });
          count++;
        }
        showToast(`تم استيراد/تحديث ${count} خبر من NewsAPI`, 'success');
      } else {
        showToast('لم يتم العثور على أخبار.', 'info');
      }
    } catch (e) { showError('خطأ في الاتصال بخادم NewsAPI'); }
    finally { setFetchingApi(false); }
  };

  const handleFetchMatchesFromAPI = async () => {
    setFetchingApi(true);
    try {
      const globalDoc = await getDoc(doc(db, 'settings', 'global'));
      const apiKey = globalDoc.data()?.theSportsDbApiKey || '3'; // Default free key for TheSportsDB
      
      const date = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
      const response = await fetch(`https://www.thesportsdb.com/api/v1/json/${apiKey}/eventsday.php?d=${date}&s=Soccer`);
      const data: any = await response.json();

      if (data.events && Array.isArray(data.events)) {
        console.log(`TheSportsDB API found ${data.events.length} matches.`);
        const todayStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
        
        for (const f of data.events) {
          const matchId = `${f.strLeague}-${f.strHomeTeam}-${f.strAwayTeam}-${todayStr.replace(/\s/g, '_')}`.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
          
          await setDoc(doc(db, 'matches', matchId), {
            homeTeam: f.strHomeTeam,
            awayTeam: f.strAwayTeam,
            homeLogo: f.strHomeTeamBadge || '',
            awayLogo: f.strAwayTeamBadge || '',
            homeScore: parseInt(f.intHomeScore) || 0,
            awayScore: parseInt(f.intAwayScore) || 0,
            status: f.strStatus === 'Match Finished' ? 'FINISHED' : (f.strStatus === 'Not Started' ? 'UPCOMING' : 'LIVE'),
            league: f.strLeague,
            leagueLogo: f.strLeagueBadge || '',
            startTime: f.strTimestamp || (f.dateEvent + 'T' + f.strTime),
            createdAt: new Date().toISOString()
          }, { merge: true });
        }
        showToast(`تم استيراد/تحديث ${data.events.length} مباراة من TheSportsDB`, 'success');
      } else {
        showToast('لم يتم العثور على مباريات لهذا اليوم.', 'info');
      }
    } catch (e) { showError('خطأ في الاتصال بخادم TheSportsDB'); }
    finally { setFetchingApi(false); }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        showToast('يتم الآن ضغط الصورة...', 'info');
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          const MAX_SIZE = 800;
          if (width > height && width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          } else if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          let quality = 0.8;
          let b64 = canvas.toDataURL(file.type === 'image/png' && quality === 0.8 ? 'image/png' : 'image/jpeg', quality);
          
          // Ensure it's under ~300KB (base64 is ~400k characters) to avoid 1MB Firestore limit
          while (b64.length > 400000 && quality > 0.1) {
            quality -= 0.1;
            b64 = canvas.toDataURL('image/jpeg', quality);
          }

          if (type === 'news') setNewsData(s => ({ ...s, image: b64 }));
          else if (type === 'match_home') setMatchData(s => ({ ...s, homeLogo: b64 }));
          else if (type === 'match_away') setMatchData(s => ({ ...s, awayLogo: b64 }));
          else if (type === 'logo') setSettingsData(s => ({ ...s, logoUrl: b64 }));
          else if (type === 'icon') setSettingsData(s => ({ ...s, iconUrl: b64 }));
          else if (type === 'ad') setAdData(s => ({ ...s, imageUrl: b64 }));
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const startEdit = (entity: string, item: any) => {
    setEditingId(item.id);
    const { id, broken, ...cleanItem } = item;
    if (entity === 'MATCH') { setMatchData(cleanItem); setActiveTab('MATCH_FORM'); }
    if (entity === 'NEWS') { setNewsData(cleanItem); setActiveTab('NEWS_FORM'); }
    if (entity === 'LEAGUE') { setLeagueData(cleanItem); setActiveTab('LEAGUE_FORM'); }
    if (entity === 'ANNOUNCEMENT') { setAnnouncementData(cleanItem); setActiveTab('ANNOUNCEMENT_FORM'); }
    if (entity === 'AD') { setAdData(cleanItem); setActiveTab('AD_FORM'); }
  };

  // Stats for Dashboard
  const stats = useMemo(() => ({
    totalMatches: dbMatches.length,
    liveMatches: dbMatches.filter(m => m.status === 'LIVE').length,
    upcomingMatches: dbMatches.filter(m => m.status === 'UPCOMING').length,
    totalNews: dbNews.length,
    activeAnnouncements: dbAnnouncements.filter(a => a.active).length,
    totalAds: dbAds.length,
    activeAds: dbAds.filter(a => a.active).length
  }), [dbMatches, dbNews, dbAnnouncements, dbAds]);

  const filteredMatches = dbMatches.filter(m => 
    m.homeTeam.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.awayTeam.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.league.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4 px-4 text-center">
        <ShieldAlert size={64} className="text-red-500" />
        <h1 className="text-2xl font-bold">غير مصرح لك بالدخول</h1>
        <p className="text-gray-400">هذه الصفحة مخصصة للمطور فقط لإدارة مباريات البث.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-28 md:pt-36 pb-12">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
        
        {/* Dashboard Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Sidebar Navigation */}
          <aside className="lg:col-span-3 space-y-6">
            <div className="glass p-6 rounded-3xl border border-white/5">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-black font-black italic">G</div>
                <div>
                  <h1 className="text-lg font-black uppercase tracking-tighter">Korea 90 <span className="text-primary italic">Admin</span></h1>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{user?.displayName || 'Developer'}</p>
                </div>
              </div>

              <nav className="space-y-2">
                {[
                  { id: 'DASHBOARD', label: 'الرئيسية', icon: LayoutGrid },
                  { id: 'MATCHES', label: 'المباريات', icon: Trophy, sub: 'MATCHES_LIST' },
                  { id: 'NEWS', label: 'الأخبار', icon: Newspaper, sub: 'NEWS_LIST' },
                  { id: 'ANNOUNCEMENTS', label: 'التنبيهات', icon: Megaphone, sub: 'ANNOUNCEMENTS_LIST' },
                  { id: 'CONFIG', label: 'البطولات', icon: Trophy, sub: 'LEAGUES_LIST' },
                  { id: 'ADS', label: 'إدارة الإعلانات', icon: ExternalLink, sub: 'ADS_LIST' },
                  { id: 'DATA_ENGINE', label: 'محرك البيانات', icon: Radio },
                  { id: 'STATS_MANAGER', label: 'الإحصائيات والترتيب', icon: BarChart2 },
                  { id: 'SETTINGS', label: 'الإعدادات المظهرية', icon: Settings },
                  { id: 'DATA_CLEANUP', label: 'تنظيف وتنظيم البيانات', icon: Trash2 },
                ].map(nav => {
                  const isActive = activeTab === nav.id || activeTab.startsWith(nav.id.split('_')[0]);
                  return (
                    <button
                      key={nav.id}
                      onClick={() => {
                        if (nav.sub) setActiveTab(nav.sub as Tab);
                        else setActiveTab(nav.id as Tab);
                        resetForms();
                      }}
                      className={cn(
                        "w-full flex items-center justify-between p-3 rounded-2xl font-bold text-sm transition-all group",
                        isActive ? "bg-primary text-black shadow-lg shadow-primary/20" : "text-gray-400 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <nav.icon size={18} />
                        <span>{nav.label}</span>
                      </div>
                      <ChevronRight size={14} className={cn("transition-transform", isActive ? "rotate-90" : "opacity-0 group-hover:opacity-100")} />
                    </button>
                  );
                })}
              </nav>

              <div className="mt-12 pt-6 border-t border-white/5">
                <div className="glass p-3 rounded-2xl flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center">
                      <CheckCircle2 size={16} />
                   </div>
                   <div className="text-[10px]">
                      <p className="font-black uppercase text-gray-400">Database</p>
                      <p className="font-bold">Firestore Online</p>
                   </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="lg:col-span-9 space-y-8">
            
             {/* Header / Stats Summary */}
             <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                {[
                  { label: 'إجمالي المباريات', value: stats.totalMatches, icon: Trophy, color: 'text-primary' },
                  { label: 'بث مباشر الآن', value: stats.liveMatches, icon: Activity, color: 'text-red-500' },
                  { label: 'الأخبار المنشورة', value: stats.totalNews, icon: Newspaper, color: 'text-secondary' },
                  { label: 'تنبيهات نشطة', value: stats.activeAnnouncements, icon: Megaphone, color: 'text-yellow-500' },
                  { label: 'الإعلانات النشطة', value: `${stats.activeAds}/${stats.totalAds}`, icon: ExternalLink, color: 'text-blue-500' },
                  { label: 'إجمالي الجلب الآلي', value: dbSources.reduce((acc, src) => acc + (src.itemsFetched || 0), 0), icon: Database, color: 'text-green-500' }
                ].map((s, i) => (
                  <div key={i} className="glass p-4 rounded-3xl border border-white/5 flex flex-col gap-1">
                    <div className="flex items-center justify-between mb-2">
                       <s.icon size={16} className={s.color} />
                       <span className="text-[10px] font-black opacity-30">PRO</span>
                    </div>
                    <p className="text-2xl font-black">{s.value}</p>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{s.label}</p>
                  </div>
                ))}
             </div>

             {/* Dynamic Views */}
             <AnimatePresence mode="wait">
               {activeTab === 'DASHBOARD' && (
                 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} key="dashboard">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="glass p-8 rounded-[2rem] border border-white/5 space-y-6">
                       <h2 className="text-xl font-black">أهلاً بك، {user?.displayName || 'المطور'}</h2>
                       <p className="text-gray-400 text-sm leading-relaxed">هذه اللوحة توفر لك تحكماً كاملاً في بث المباريات المباشر، نشر الأخبار العاجلة، وإدارة محتوى التطبيق بالكامل.</p>
                       <div className="flex gap-3">
                         <button onClick={() => setActiveTab('MATCH_FORM')} className="flex-1 bg-primary text-black font-black py-4 rounded-2xl hover:scale-105 transition-all text-sm">مباراة جديدة</button>
                         <button onClick={() => setActiveTab('NEWS_FORM')} className="flex-1 bg-secondary text-black font-black py-4 rounded-2xl hover:scale-105 transition-all text-sm text-center">نشر خبر</button>
                       </div>
                     </div>
                     
                     <div className="glass p-8 rounded-[2rem] border border-white/5 space-y-6">
                        <h3 className="font-black text-sm uppercase tracking-widest text-gray-500">أدوات الوصول السريع</h3>
                        <div className="space-y-3">
                           <button onClick={checkAllLinks} className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all group">
                              <div className="flex items-center gap-3">
                                 <ListFilter size={18} className="text-primary" />
                                 <span className="font-bold text-sm">فحص جودة روابط البث</span>
                              </div>
                              <ChevronRight size={14} className="group-hover:translate-x-[-4px] transition-transform" />
                           </button>
                           <button onClick={() => setActiveTab('ADS_LIST')} className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all group">
                              <div className="flex items-center gap-3">
                                 <ExternalLink size={18} className="text-yellow-500" />
                                 <span className="font-bold text-sm">إدارة الإعلانات البانر والويب</span>
                              </div>
                              <ChevronRight size={14} className="group-hover:translate-x-[-4px] transition-transform" />
                           </button>
                           <button onClick={() => setActiveTab('DATA_ENGINE')} className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all group">
                              <div className="flex items-center gap-3">
                                 <Radio size={18} className="text-blue-500" />
                                 <span className="font-bold text-sm">إدارة محركات البيانات (AI/API)</span>
                              </div>
                              <ChevronRight size={14} className="group-hover:translate-x-[-4px] transition-transform" />
                           </button>
                           <button onClick={() => setActiveTab('DATA_CLEANUP')} className="w-full flex items-center justify-between p-4 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 transition-all group">
                              <div className="flex items-center gap-3">
                                 <Trash2 size={18} />
                                 <span className="font-bold text-sm">تنظيف وتنظيم البيانات (منطقة الخطر)</span>
                              </div>
                              <ChevronRight size={14} className="transition-transform" />
                           </button>
                        </div>
                     </div>
                   </div>

                    {/* Custom Branding & Display Settings Card (Logo & App Name config) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                      
                      <div className="glass p-8 rounded-[2rem] border border-white/5 space-y-6 text-right" dir="rtl">
                        <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-sans">
                            <Settings size={18} />
                          </div>
                          <div>
                            <h3 className="font-black text-base text-white">إدارة هوية وشعار التطبيق</h3>
                            <p className="text-[10px] text-gray-400 font-bold">تغيير اسم وواجهة الموقع وتحديث الشعار والرمز فوراً</p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          {/* App Name field */}
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase text-gray-500">اسم الموقع / التطبيق</label>
                            <input 
                              placeholder="مثال: كورة 90" 
                              className="w-full bg-white/5 border border-white/10 p-4 rounded-xl font-black text-white focus:neon-border outline-none transition-all text-right" 
                              value={settingsData.appName} 
                              onChange={e => setSettingsData({...settingsData, appName: e.target.value})} 
                            />
                          </div>

                          {/* Logo Upload + link field */}
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase text-gray-500 block">شعار الموقع (للشريط العلوي)</label>
                            <div className="flex gap-3">
                              <div className="flex-1">
                                <input 
                                  placeholder="أو الصق رابط صورة الشعار..." 
                                  className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl font-bold font-sans text-xs focus:neon-border outline-none transition-all text-left text-white" 
                                  value={settingsData.logoUrl} 
                                  onChange={e => setSettingsData({...settingsData, logoUrl: e.target.value})} 
                                  style={{ direction: 'ltr' }}
                                />
                              </div>
                              <label className="glass px-5 py-4 rounded-2xl cursor-pointer hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center gap-2 border border-white/10 shrink-0 select-none">
                                <Plus size={16} className="text-primary" />
                                <span className="text-xs font-black">رفع ملف</span>
                                <input type="file" className="hidden" accept="image/*" onChange={e => handleImageUpload(e, 'logo')} />
                              </label>
                            </div>

                            <div className="flex items-center justify-between bg-black/45 p-3.5 rounded-2xl border border-white/5 mt-2">
                              <span className="text-[10px] text-gray-400 font-bold">معاينة الشعار الحالي:</span>
                              {settingsData.logoUrl ? (
                                <img src={settingsData.logoUrl} className="h-10 max-w-[120px] rounded-lg object-contain bg-slate-950 p-1 border border-white/5 flex-shrink-0" alt="Logo Preview" />
                              ) : (
                                <span className="text-[10px] text-red-400 font-black">لم يتم رفع شعار مخصص بعد</span>
                              )}
                            </div>
                          </div>

                          {/* Icon Url fields */}
                          <div className="space-y-1.5 border-t border-white/5 pt-4">
                            <label className="text-[10px] font-black uppercase text-gray-500 block">أيقونة الهاتف / PWA المفضلة</label>
                            <div className="flex gap-3">
                              <div className="flex-1">
                                <input 
                                  placeholder="أو الصق رابط الأيقونة..." 
                                  className="w-full bg-white/5 border border-white/10 p-4 rounded-xl font-bold font-sans text-xs focus:neon-border outline-none transition-all text-left text-white" 
                                  value={settingsData.iconUrl || ''} 
                                  onChange={e => setSettingsData({...settingsData, iconUrl: e.target.value})} 
                                  style={{ direction: 'ltr' }}
                                />
                              </div>
                              <label className="glass px-5 py-4 rounded-2xl cursor-pointer hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center gap-2 border border-white/10 shrink-0 select-none">
                                <Plus size={16} className="text-primary" />
                                <span className="text-xs font-black">رفع ملف</span>
                                <input type="file" className="hidden" accept="image/*" onChange={e => handleImageUpload(e, 'icon')} />
                              </label>
                            </div>

                            <div className="flex items-center justify-between bg-black/45 p-3.5 rounded-2xl border border-white/5 mt-2">
                              <span className="text-[10px] text-gray-400 font-bold">معاينة الأيقونة:</span>
                              {settingsData.iconUrl ? (
                                <img src={settingsData.iconUrl} className="h-10 w-10 rounded-lg object-contain bg-slate-950 p-1 border border-white/5 flex-shrink-0" alt="Icon Preview" />
                              ) : (
                                <span className="text-[10px] text-red-500 font-black">لم ترفع مسبقاً</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <button 
                          onClick={handleSaveSettings} 
                          disabled={loading}
                          className="w-full bg-primary text-black font-black py-4.5 rounded-2xl shadow-xl shadow-primary/10 hover:scale-[1.01] transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50 select-none cursor-pointer mt-4"
                        >
                          {loading ? <RefreshCw className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                          <span>حفظ وتطبيق بيانات الهوية</span>
                        </button>
                      </div>

                      {/* Custom Display settings for ADS (Quick ads configuration) */}
                      <div className="glass p-8 rounded-[2rem] border border-white/5 space-y-6 text-right" dir="rtl">
                        <div className="flex items-center justify-between border-b border-white/5 pb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-500 font-sans">
                              <ExternalLink size={18} />
                            </div>
                            <div>
                              <h3 className="font-black text-base text-white">الإعلانات وشركاء الرعاية</h3>
                              <p className="text-[10px] text-gray-400 font-bold">التحكم بظهور المساحات الإعلانية والتبديل السريع</p>
                            </div>
                          </div>

                          {/* Switch toggle control for global ads status */}
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${settingsData.adsEnabled ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                              {settingsData.adsEnabled ? 'مفعلة' : 'متوقفة'}
                            </span>
                            <label className="relative inline-flex items-center cursor-pointer select-none">
                              <input 
                                type="checkbox" 
                                className="sr-only peer" 
                                checked={settingsData.adsEnabled} 
                                onChange={e => {
                                  const updated = { ...settingsData, adsEnabled: e.target.checked };
                                  setSettingsData(updated);
                                  // Save instantly for convenience
                                  setDoc(doc(db, 'settings', 'config'), updated, { merge: true })
                                    .then(() => showToast('تم تحديث حالة تفعيل الإعلانات فوراً!', 'success'))
                                    .catch(() => showToast('فشل حفظ التحديث', 'warning'));
                                }} 
                              />
                              <div className="w-10 h-5 bg-white/10 rounded-full peer peer-checked:after:-translate-x-full rtl:peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                          </div>
                        </div>

                        {/* List of active campaigns/ sponsorship items with toggles */}
                        <div className="space-y-3.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">المعلنون بقاعدة البيانات ({dbAds.length})</span>
                            <button 
                              onClick={() => {
                                setAdData(initialAd);
                                setActiveTab('AD_FORM');
                              }} 
                              className="text-primary text-[10px] font-black border border-primary/20 px-3 py-1 bg-primary/5 hover:bg-primary/10 rounded-lg flex items-center gap-1 cursor-pointer"
                            >
                              <Plus size={10} />
                              <span>إضافة إعلان جديد</span>
                            </button>
                          </div>

                          {dbAds.length === 0 ? (
                            <div className="bg-black/20 rounded-2xl p-6 text-center text-gray-500 text-xs font-bold leading-relaxed border border-white/5 border-dashed">
                              لا توجد إعلانات مخصصة نشطة مصممة بعد.
                              <br />
                              <span className="text-[10px] text-gray-600 mt-1 block">يفضل رفع أو كتابة كود Adsense للرعاة.</span>
                            </div>
                          ) : (
                            <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
                              {dbAds.slice(0, 3).map((ad) => (
                                <div key={ad.id} className="bg-white/[0.02] border border-white/5 p-3 rounded-xl flex items-center justify-between gap-3 text-right">
                                  <div className="flex items-center gap-2.5 overflow-hidden">
                                    <div className="w-10 h-10 rounded-lg bg-black/40 border border-white/5 overflow-hidden shrink-0 flex items-center justify-center">
                                      {ad.type === 'IMAGE' && ad.imageUrl ? (
                                        <img src={ad.imageUrl} alt="" className="w-full h-full object-cover" />
                                      ) : (
                                        <ExternalLink size={16} className="text-gray-500" />
                                      )}
                                    </div>
                                    <div className="overflow-hidden space-y-0.5">
                                      <h5 className="text-xs font-black text-white truncate max-w-[140px]">{ad.title}</h5>
                                      <p className="text-[9px] text-gray-500 font-bold">الموضع: {
                                        ad.slot === 'Home_Top' ? 'أعلى الصفحة' : 
                                        ad.slot === 'Match_Under_Player' ? 'تحت المشغل' : 
                                        ad.slot === 'Home_Middle' ? 'منتصف الصفحة' : ad.slot
                                      }</p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    {/* Toggle display state instantly on dashboard */}
                                    <button 
                                       onClick={() => toggleAdActive(ad)}
                                       className={`px-2 py-1 rounded-lg text-[9px] font-black transition-all ${
                                         ad.active 
                                           ? "bg-green-500/10 text-green-400 border border-green-500/10" 
                                           : "bg-red-500/10 text-red-400 border border-red-500/10"
                                       }`}
                                    >
                                      {ad.active ? 'نشط' : 'معطل'}
                                    </button>
                                    <button 
                                      onClick={() => startEdit('AD', ad)}
                                      className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
                                      title="تعديل"
                                    >
                                      <Edit3 size={11} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                              {dbAds.length > 3 && (
                                <button 
                                  onClick={() => setActiveTab('ADS_LIST')}
                                  className="w-full text-center text-[10px] text-primary hover:underline font-black mt-1"
                                >
                                  شاهد بقية الإعلانات الـ ({dbAds.length - 3}) المسجلة »
                                </button>
                              )}
                            </div>
                          )}

                          {/* Information / tip label */}
                          <div className="bg-[#0b1324] p-3 rounded-2xl border border-white/5 space-y-1.5 leading-relaxed">
                            <div className="flex items-center gap-1.5 text-[10px] font-black text-yellow-500">
                              <Info size={12} />
                              <span>معلومة للممولين والناشرين</span>
                            </div>
                            <p className="text-[9px] text-gray-400 font-bold">
                              تتوافق مناطق الإعلانات لدينا مع شفرات Google Adsense بنظام الاستجابة الكاملة أو إعلانات تطبيقات الجوال بنظام AdMob SDK المدمج.
                            </p>
                          </div>
                         </div>
                       </div>
                     </div>
                  </motion.div>
                )}
              {activeTab === 'MATCHES_LIST' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6" key="matches_list">
                  <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
                    <h2 className="text-2xl font-black italic flex items-center gap-3">
                       <Trophy className="text-primary" /> المباريات <span className="text-xs text-gray-500 not-italic font-bold">({stats.totalMatches})</span>
                    </h2>
                    <div className="flex gap-2">
                       <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                          <input 
                            placeholder="بحث في المباريات..." 
                            className="glass py-2 pl-10 pr-4 rounded-xl text-xs font-bold w-48 focus:w-64 transition-all focus:neon-border outline-none"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                          />
                       </div>
                       <button onClick={handleFetchMatchesFromAPI} disabled={fetchingApi} className="bg-secondary text-black px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-50">
                          <RefreshCw size={14} className={fetchingApi ? "animate-spin" : ""} /> جلب اليوم (TheSportsDB)
                       </button>
                       <button onClick={() => setActiveTab('MATCH_FORM')} className="bg-primary text-black px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all hover:scale-105">
                          <Plus size={14} /> إضافة
                       </button>
                    </div>
                  </div>
                  
                  {Object.keys(brokenLinks).length > 0 && (
                    <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-3xl flex items-center gap-3">
                      <ShieldAlert className="text-red-500" />
                      <p className="text-xs font-bold text-red-500">تم اكتشاف {Object.keys(brokenLinks).length} مباراة بروابط قد تكون معطلة.</p>
                    </div>
                  )}
                  
                  <div className="glass p-6 rounded-[2.5rem] border border-white/5">
                    <ManagementList 
                      items={filteredMatches.map(m => ({ ...m, broken: brokenLinks[m.id] }))} 
                      type="matches" 
                      onEdit={(item) => startEdit('MATCH', item)} 
                      onGenerateStats={handleGenerateMatchStats}
                    />
                  </div>
                </motion.div>
              )}

              {activeTab === 'MATCH_FORM' && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6" key="match_form">
                  <div className="flex items-center gap-4">
                     <button onClick={() => setActiveTab('MATCHES_LIST')} className="glass p-2 rounded-full hover:bg-white/10"><ArrowLeft size={20} /></button>
                     <h2 className="text-2xl font-black">{editingId ? 'تعديل المباراة' : 'إضافة مباراة جديدة'}</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="glass p-8 rounded-[2.5rem] space-y-6">
                       <h3 className="font-black text-xs uppercase tracking-widest text-primary">المعلومات الأساسية</h3>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-4">
                             <div className="w-full aspect-square glass rounded-3xl flex items-center justify-center overflow-hidden border border-white/5 group relative">
                                {matchData.homeLogo ? <img src={matchData.homeLogo} className="w-16 h-16 object-contain" alt="Home" /> : <Plus className="text-gray-600" />}
                                <label className="absolute inset-0 cursor-pointer flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/60 transition-opacity">
                                   <RefreshCw size={24} className="text-white" />
                                   <input type="file" className="hidden" accept="image/*" onChange={e => handleImageUpload(e, 'match_home')} />
                                </label>
                             </div>
                             <input placeholder="الفريق المستضيف" className="w-full bg-white/5 border border-white/10 p-3 rounded-2xl font-bold text-center" value={matchData.homeTeam} onChange={e => setMatchData({...matchData, homeTeam: e.target.value})} />
                          </div>
                          <div className="space-y-4">
                             <div className="w-full aspect-square glass rounded-3xl flex items-center justify-center overflow-hidden border border-white/5 group relative">
                                {matchData.awayLogo ? <img src={matchData.awayLogo} className="w-16 h-16 object-contain" alt="Away" /> : <Plus className="text-gray-600" />}
                                <label className="absolute inset-0 cursor-pointer flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/60 transition-opacity">
                                   <RefreshCw size={24} className="text-white" />
                                   <input type="file" className="hidden" accept="image/*" onChange={e => handleImageUpload(e, 'match_away')} />
                                </label>
                             </div>
                             <input placeholder="الفريق الضيف" className="w-full bg-white/5 border border-white/10 p-3 rounded-2xl font-bold text-center" value={matchData.awayTeam} onChange={e => setMatchData({...matchData, awayTeam: e.target.value})} />
                          </div>
                       </div>

                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-gray-500 px-1">البطولة</label>
                          <input placeholder="مثل: الدوري الإسباني" className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl font-bold" value={matchData.league} onChange={e => setMatchData({...matchData, league: e.target.value})} />
                       </div>
                    </div>

                    <div className="glass p-8 rounded-[2.5rem] space-y-6">
                       <h3 className="font-black text-xs uppercase tracking-widest text-primary">الموعد والحالة</h3>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-gray-500 px-1">تاريخ ووقت المباراة</label>
                          <input type="datetime-local" className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl font-bold" value={matchData.startTime?.slice(0, 16)} onChange={e => setMatchData({...matchData, startTime: new Date(e.target.value).toISOString()})} />
                       </div>
                       
                       <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase text-gray-500 px-1">نتيجة الأرض</label>
                             <input type="number" className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl font-black text-center text-xl" value={matchData.homeScore} onChange={e => setMatchData({...matchData, homeScore: parseInt(e.target.value) || 0})} />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase text-gray-500 px-1">نتيجة الضيف</label>
                             <input type="number" className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl font-black text-center text-xl" value={matchData.awayScore} onChange={e => setMatchData({...matchData, awayScore: parseInt(e.target.value) || 0})} />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase text-gray-500 px-1">الدقيقة</label>
                             <input type="number" className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl font-black text-center text-xl" value={matchData.minute || ''} placeholder="-" onChange={e => setMatchData({...matchData, minute: e.target.value ? parseInt(e.target.value) : undefined})} />
                          </div>
                       </div>

                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-gray-500 px-1">حالة المباراة</label>
                          <div className="grid grid-cols-3 gap-2">
                             {['UPCOMING', 'LIVE', 'FINISHED'].map(s => (
                               <button 
                                 key={s}
                                 onClick={() => setMatchData({...matchData, status: s as MatchStatus})}
                                 className={cn(
                                   "py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                   matchData.status === s ? "bg-primary text-black" : "bg-white/5 text-gray-500 hover:bg-white/10"
                                 )}
                               >
                                 {s === 'UPCOMING' ? 'قادمة' : s === 'LIVE' ? 'مباشرة' : 'منتهية'}
                               </button>
                             ))}
                          </div>
                       </div>
                    </div>
                  </div>

                  <div className="glass p-8 rounded-[2.5rem] space-y-6 flex flex-col md:flex-row gap-8">
                    <div className="flex-1 space-y-4">
                       <h3 className="font-black text-xs uppercase tracking-widest text-primary">تفاصيل إضافية</h3>
                       
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase text-gray-500 px-1">القناة الناقلة</label>
                             <input className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-sm" value={matchData.channel || ''} onChange={e => setMatchData({...matchData, channel: e.target.value})} />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase text-gray-500 px-1">المعلق</label>
                             <input className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-sm" value={matchData.commentator || ''} onChange={e => setMatchData({...matchData, commentator: e.target.value})} />
                          </div>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase text-gray-500 px-1">الملعب</label>
                             <input className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-sm" value={matchData.stadium || ''} onChange={e => setMatchData({...matchData, stadium: e.target.value})} />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase text-gray-500 px-1">الحكم</label>
                             <input className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-sm" value={matchData.referee || ''} onChange={e => setMatchData({...matchData, referee: e.target.value})} />
                          </div>
                       </div>
                    </div>
                  </div>

                  <div className="glass p-8 rounded-[2.5rem] space-y-6">
                     <div className="flex items-center justify-between">
                        <h3 className="font-black text-xs uppercase tracking-widest text-primary">روابط البث والوسائط</h3>
                        <div className="flex gap-2">
                           <button onClick={() => { setLinkType('streamingLinks'); setShowLinkInputs(true); }} className="bg-primary/10 text-primary px-3 py-1.5 rounded-xl text-[10px] font-black border border-primary/20">سيرفر بث</button>
                           <button onClick={() => { setLinkType('highlightsLinks'); setShowLinkInputs(true); }} className="bg-secondary/10 text-secondary px-3 py-1.5 rounded-xl text-[10px] font-black border border-secondary/20">ملخص</button>
                           <button onClick={() => { setLinkType('replayLinks'); setShowLinkInputs(true); }} className="bg-blue-500/10 text-blue-500 px-3 py-1.5 rounded-xl text-[10px] font-black border border-blue-500/20">كاملة</button>
                        </div>
                     </div>

                     <AnimatePresence>
                       {showLinkInputs && (
                         <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-4 p-6 bg-white/5 rounded-3xl border border-white/5 overflow-hidden">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                               <div className="space-y-1">
                                  <label className="text-[9px] font-black uppercase text-gray-500 px-1">النوع</label>
                                  <select className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-xs" value={linkType} onChange={e => setLinkType(e.target.value as any)}>
                                     <option value="streamingLinks">بث مباشر</option>
                                     <option value="highlightsLinks">ملخص</option>
                                     <option value="replayLinks">إعادة كاملة</option>
                                  </select>
                               </div>
                               <div className="space-y-1">
                                  <label className="text-[9px] font-black uppercase text-gray-500 px-1">الاسم</label>
                                  <input placeholder="مثال: الرئيسية HD" className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-xs" value={newLink.label} onChange={e => setNewLink({...newLink, label: e.target.value})} />
                               </div>
                               <div className="space-y-1">
                                  <label className="text-[9px] font-black uppercase text-gray-500 px-1">الجودة</label>
                                  <select className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-xs" value={newLink.quality} onChange={e => setNewLink({...newLink, quality: e.target.value})}>
                                     {['4K', '1080p', '720p', '480p', 'متعددة'].map(q => <option key={q} value={q}>{q}</option>)}
                                  </select>
                               </div>
                               <div className="space-y-1">
                                  <label className="text-[9px] font-black uppercase text-gray-500 px-1">الرابط / آيفريم</label>
                                  <input placeholder="http... أو <iframe>" className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-xs" value={newLink.url} onChange={e => setNewLink({...newLink, url: e.target.value})} />
                               </div>
                            </div>
                            <div className="flex gap-2">
                               <button onClick={() => {
                                 if (!newLink.label || !newLink.url) return showToast('أكمل البيانات', 'warning');
                                 const current = (matchData as any)[linkType] || [];
                                 setMatchData({...matchData, [linkType]: [...current, { ...newLink, url: extractIframeSrc(newLink.url) }]});
                                 setNewLink({ label: '', url: '', quality: '720p' });
                                 setShowLinkInputs(false);
                               }} className="flex-1 bg-white text-black font-black py-3 rounded-xl text-sm">إضافة الرابط</button>
                               <button onClick={() => setShowLinkInputs(false)} className="px-6 glass text-xs font-bold rounded-xl">إلغاء</button>
                            </div>
                         </motion.div>
                       )}
                     </AnimatePresence>

                     <div className="space-y-4">
                        {[
                          { key: 'streamingLinks', label: 'سيرفرات البث', color: 'text-primary' },
                          { key: 'highlightsLinks', label: 'ملخصات المباراة', color: 'text-secondary' },
                          { key: 'replayLinks', label: 'المباراة كاملة', color: 'text-blue-500' }
                        ].map(type => {
                          const links = (matchData as any)[type.key] || [];
                          if (links.length === 0) return null;
                          return (
                            <div key={type.key} className="space-y-2">
                               <p className={cn("text-[10px] font-black uppercase tracking-widest px-2", type.color)}>{type.label}</p>
                               <div className="flex flex-wrap gap-2">
                                  {links.map((l: StreamingLink, i: number) => (
                                    <div key={i} className="glass pl-4 pr-2 py-1.5 rounded-full border border-white/5 flex items-center gap-3 text-[11px] font-bold">
                                       <span>{l.label} ({l.quality})</span>
                                       <button onClick={() => {
                                         const updated = [...links];
                                         updated.splice(i, 1);
                                         setMatchData({...matchData, [type.key]: updated});
                                       }} className="w-5 h-5 flex items-center justify-center bg-red-500/20 text-red-500 rounded-full hover:bg-red-500/40 transition-colors">
                                         <X size={12} />
                                       </button>
                                    </div>
                                  ))}
                               </div>
                            </div>
                          );
                        })}
                        
                        {!matchData.streamingLinks?.length && !matchData.highlightsLinks?.length && !matchData.replayLinks?.length && (
                          <div className="text-center py-10 opacity-20 italic text-sm">لم يتم إضافة أي روابط بعد</div>
                        )}
                     </div>
                  </div>

                  <button 
                    onClick={handleSaveMatch}
                    disabled={loading}
                    className="w-full bg-primary text-black font-black py-5 rounded-[2rem] shadow-2xl shadow-primary/20 flex items-center justify-center gap-3 hover:scale-[1.02] transition-all disabled:opacity-50"
                  >
                    {loading ? <RefreshCw className="animate-spin" /> : <CheckCircle2 size={24} />}
                    <span className="text-lg">{editingId ? 'تحديث بيانات المباراة' : 'حفظ ونشر المباراة'}</span>
                  </button>
                </motion.div>
              )}

              {activeTab === 'NEWS_LIST' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6" key="news_list">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black italic flex items-center gap-3">
                       <Newspaper className="text-secondary" /> الأخبار <span className="text-xs text-gray-500 not-italic font-bold">({stats.totalNews})</span>
                    </h2>
                    <div className="flex items-center gap-3">
                       <button onClick={handleFetchNewsFromAPI} disabled={fetchingApi} className="bg-primary text-black px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-50">
                          <RefreshCw size={14} className={fetchingApi ? "animate-spin" : ""} /> جلب تلقائي (NewsAPI)
                       </button>
                       <button onClick={() => setActiveTab('NEWS_FORM')} className="bg-secondary text-black px-6 py-2.5 rounded-xl text-xs font-black flex items-center gap-2">
                          <Plus size={14} /> نشر خبر جديد
                       </button>
                    </div>
                  </div>
                  <div className="glass p-6 rounded-[2.5rem] border border-white/5">
                    <ManagementList items={dbNews} type="news" onEdit={(item) => startEdit('NEWS', item)} />
                  </div>
                </motion.div>
              )}

              {activeTab === 'NEWS_FORM' && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6" key="news_form">
                   <div className="flex items-center gap-4">
                     <button onClick={() => setActiveTab('NEWS_LIST')} className="glass p-2 rounded-full hover:bg-white/10"><ArrowLeft size={20} /></button>
                     <h2 className="text-2xl font-black">{editingId ? 'تعديل الخبر' : 'نشر خبر جديد'}</h2>
                  </div>

                  <div className="glass p-8 rounded-[2.5rem] border border-white/5 space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-gray-500 px-1">عنوان الخبر</label>
                              <input placeholder="عنوان جذاب للخبر..." className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl font-black text-xl" value={newsData.title} onChange={e => setNewsData({...newsData, title: e.target.value})} />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-gray-500 px-1">محتوى الخبر</label>
                              <textarea placeholder="اكتب تفاصيل الخبر هنا..." className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl min-h-[300px] leading-relaxed" value={newsData.content} onChange={e => setNewsData({...newsData, content: e.target.value})} />
                           </div>
                        </div>

                        <div className="space-y-6">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-gray-500 px-1">صورة الخبر</label>
                              <div className="w-full aspect-video glass rounded-3xl overflow-hidden relative group border border-white/5">
                                 {newsData.image ? <img src={newsData.image} className="w-full h-full object-cover" alt="News" /> : <div className="absolute inset-0 flex flex-col items-center justify-center opacity-20"><Newspaper size={48} /><p className="text-xs font-bold mt-2">لا توجد صورة</p></div>}
                                 <label className="absolute inset-0 cursor-pointer bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                    <Plus size={32} />
                                    <span className="font-black text-xs uppercase">رفع صورة</span>
                                    <input type="file" className="hidden" accept="image/*" onChange={e => handleImageUpload(e, 'news')} />
                                 </label>
                              </div>
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-gray-500 px-1">التصنيف</label>
                              <input 
                                list="news-categories"
                                placeholder="اختر من القائمة أو اكتب تصنيفاً جديداً..." 
                                className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl font-bold focus:neon-border outline-none transition-all" 
                                value={newsData.category} 
                                onChange={e => setNewsData({...newsData, category: e.target.value})} 
                              />
                              <datalist id="news-categories">
                                <option value="أخبار الانتقالات" />
                                <option value="تحليل المباريات" />
                                <option value="تحديثات اللاعبين" />
                                <option value="كرة عالمية" />
                                <option value="كرة محلية" />
                                <option value="بطولات كبرى" />
                              </datalist>
                           </div>
                        </div>
                     </div>

                     <button 
                        onClick={handleSaveNews}
                        disabled={loading}
                        className="w-full bg-secondary text-black font-black py-5 rounded-[2rem] shadow-2xl shadow-secondary/20 flex items-center justify-center gap-3 hover:scale-[1.02] transition-all disabled:opacity-50"
                      >
                        {loading ? <RefreshCw className="animate-spin" /> : <Send size={24} />}
                        <span className="text-lg">{editingId ? 'تحديث الخبر' : 'نشر الخبر الآلان'}</span>
                      </button>
                  </div>
                </motion.div>
              )}

              {activeTab === 'ANNOUNCEMENTS_LIST' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6" key="announcements_list">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black italic flex items-center gap-3">
                       <Megaphone className="text-yellow-500" /> التنبيهات <span className="text-xs text-gray-500 not-italic font-bold">({stats.activeAnnouncements})</span>
                    </h2>
                    <button onClick={() => setActiveTab('ANNOUNCEMENT_FORM')} className="bg-yellow-500 text-black px-6 py-2.5 rounded-xl text-xs font-black flex items-center gap-2">
                       <Plus size={14} /> إضافة تنبيه
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {dbAnnouncements.map(a => (
                      <div key={a.id} className="glass p-6 rounded-[2rem] border border-white/5 flex flex-col gap-4 group hover:neon-border transition-all">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-2">
                              <span className={cn(
                                "text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest",
                                a.type === 'breaking' ? "bg-red-500 text-white" : a.type === 'warning' ? "bg-amber-500 text-black" : "bg-primary text-black"
                              )}>{a.type === 'breaking' ? 'عاجل' : a.type === 'warning' ? 'تنبيه' : 'إعلان'}</span>
                              <span className={cn("text-[9px] px-2 py-0.5 rounded-full font-bold", a.active ? "bg-green-500/10 text-green-500" : "bg-gray-500/20 text-gray-400")}>{a.active ? 'نشط' : 'معطل'}</span>
                           </div>
                           <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {deletingAnnouncementId === a.id ? (
                                <div className="flex items-center gap-1 bg-red-500/10 p-1 rounded-xl">
                                  <button onClick={() => handleDeleteAnnouncement(a.id)} className="bg-red-500 text-white px-2 py-1 rounded-lg text-[10px] font-bold">تأكيد</button>
                                  <button onClick={() => setDeletingAnnouncementId(null)} className="bg-white/10 px-2 py-1 rounded-lg text-[10px]">إلغاء</button>
                                </div>
                              ) : (
                                <>
                                  <button onClick={() => startEdit('ANNOUNCEMENT', a)} className="p-2 hover:bg-white/10 rounded-xl"><Edit3 size={14} /></button>
                                  <button onClick={() => setDeletingAnnouncementId(a.id)} className="p-2 hover:bg-red-500/20 text-red-500 rounded-xl"><Trash2 size={14} /></button>
                                </>
                              )}
                           </div>
                        </div>
                        <p className="text-sm font-bold line-clamp-2">{a.text}</p>
                        <div className="text-[9px] text-gray-500 flex justify-between border-t border-white/5 pt-3">
                           <span>تاريخ النشر: {(() => {
                              try {
                                const d = new Date(a.createdAt);
                                return isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
                              } catch {
                                return '—';
                              }
                            })()}</span>
                           {a.priority > 0 && <span className="font-black text-blue-500">P:{a.priority}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'ANNOUNCEMENT_FORM' && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6" key="announcement_form">
                   <div className="flex items-center gap-4">
                     <button onClick={() => setActiveTab('ANNOUNCEMENTS_LIST')} className="glass p-2 rounded-full hover:bg-white/10"><ArrowLeft size={20} /></button>
                     <h2 className="text-2xl font-black">إدارة التنبيه العلوي</h2>
                  </div>

                  <div className="glass p-8 rounded-[2.5rem] space-y-6">
                     <textarea placeholder="نص التنبيه..." className="w-full bg-white/5 border border-white/10 p-6 rounded-[2rem] font-black text-lg h-32" value={announcementData.text} onChange={e => setAnnouncementData({...announcementData, text: e.target.value})} />
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase text-gray-500 px-1">النوع</label>
                           <select className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl font-bold" value={announcementData.type} onChange={e => setAnnouncementData({...announcementData, type: e.target.value as any})}>
                              <option value="info">إعلان عادي</option>
                              <option value="warning">تنبيه هام</option>
                              <option value="breaking">خبر عاجل</option>
                           </select>
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase text-gray-500 px-1">رابط (اختياري)</label>
                           <input placeholder="رابط خارجي للدقة..." className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl" value={announcementData.link} onChange={e => setAnnouncementData({...announcementData, link: e.target.value})} />
                        </div>
                     </div>

                     <div className="flex items-center gap-4">
                        <button 
                          onClick={() => setAnnouncementData({...announcementData, active: !announcementData.active})}
                          className={cn("px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest", announcementData.active ? "bg-green-500 text-black border-2 border-green-400" : "bg-red-500 text-white border-2 border-red-400")}
                        >
                          {announcementData.active ? 'ظهور فعلي' : 'مخفي حالياً'}
                        </button>
                     </div>

                     <button onClick={handleSaveAnnouncement} className="w-full bg-yellow-500 text-black font-black py-5 rounded-[2rem] shadow-xl shadow-yellow-500/10">حفظ ونشر التنبيه</button>
                  </div>
                </motion.div>
              )}

              {activeTab === 'LEAGUES_LIST' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6" key="leagues_list">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black italic flex items-center gap-3">
                       <Trophy className="text-green-500" /> البطولات
                    </h2>
                    <button onClick={() => setActiveTab('LEAGUE_FORM')} className="bg-green-500 text-black px-6 py-2.5 rounded-xl text-xs font-black flex items-center gap-2">
                       <Plus size={14} /> إضافة بطولة
                    </button>
                  </div>
                  <div className="glass p-6 rounded-[2.5rem] border border-white/5">
                    <ManagementList items={dbLeagues} type="leagues" onEdit={(item) => startEdit('LEAGUE', item)} />
                  </div>
                </motion.div>
              )}

              {activeTab === 'SETTINGS' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6" key="settings_tab">
                  <div className="pt-2">
                    <h2 className="text-2xl font-black italic mb-6 flex items-center gap-3">
                       <Settings className="text-primary" /> إعدادات التطبيق
                    </h2>
                    <div className="glass p-8 rounded-[2.5rem] border border-white/5 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase text-gray-500">اسم الموقع</label>
                             <input className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl font-bold" value={settingsData.appName} onChange={e => setSettingsData({...settingsData, appName: e.target.value})} />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase text-gray-500">صورة الشعار (اللوجو)</label>
                             <div className="flex gap-2">
                                <input className="flex-1 bg-white/5 border border-white/10 p-4 rounded-2xl font-bold" value={settingsData.logoUrl} onChange={e => setSettingsData({...settingsData, logoUrl: e.target.value})} />
                                <label className="glass p-4 rounded-2xl cursor-pointer"><Plus size={18} /><input type="file" className="hidden" accept="image/*" onChange={e => handleImageUpload(e, 'logo')} /></label>
                             </div>
                             {settingsData.logoUrl && <img src={settingsData.logoUrl} className="h-10 rounded mt-2 object-contain bg-black/40 p-1" alt="Preview" />}
                          </div>
                          
                          <div className="space-y-2 col-span-1 md:col-span-2">
                             <h4 className="text-sm font-bold text-gray-300 mb-2 border-t border-white/5 pt-4">أيقونة التطبيق (PWA / شاشة البداية)</h4>
                          </div>

                          <div className="space-y-2 md:col-span-2">
                             <label className="text-[10px] font-black uppercase text-gray-500">رابط أيقونة التطبيق</label>
                             <div className="flex gap-2">
                                <input className="flex-1 bg-white/5 border border-white/10 p-4 rounded-2xl font-bold" value={settingsData.iconUrl} onChange={e => setSettingsData({...settingsData, iconUrl: e.target.value})} />
                                <label className="glass p-4 rounded-2xl cursor-pointer"><Plus size={18} /><input type="file" className="hidden" accept="image/*" onChange={e => handleImageUpload(e, 'icon')} /></label>
                             </div>
                             {settingsData.iconUrl && <img src={settingsData.iconUrl} className="h-10 rounded mt-2 object-contain bg-black/40 p-1" alt="Preview" />}
                          </div>

                          <div className="space-y-4 col-span-1 md:col-span-2 border-t border-white/5 pt-6">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-bold text-primary flex items-center gap-2">إعدادات الإعلانات (AdMob / AdSense)</h4>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={settingsData.adsEnabled} onChange={e => setSettingsData({...settingsData, adsEnabled: e.target.checked})} />
                                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full rtl:peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                              </label>
                            </div>
                            
                            {settingsData.adsEnabled && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div className="space-y-2">
                                  <label className="text-[10px] font-black uppercase text-gray-400">معرف الناشر (AdSense Publisher ID)</label>
                                  <input placeholder="مثال: ca-pub-1234567890123456" className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl font-mono text-sm opacity-80" value={settingsData.adPublisherId} onChange={e => setSettingsData({...settingsData, adPublisherId: e.target.value})} />
                                  <p className="text-[10px] text-gray-500">يستخدم لتفعيل إعلانات جوجل أدسنس على الموقع</p>
                                </div>
                                <div className="space-y-2">
                                  <label className="text-[10px] font-black uppercase text-gray-400">معرف تطبيق AdMob (للتطبيقات)</label>
                                  <input placeholder="مثال: ca-app-pub-1234567890123456~1234567890" className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl font-mono text-sm opacity-80" value={settingsData.admobAppId} onChange={e => setSettingsData({...settingsData, admobAppId: e.target.value})} />
                                  <p className="text-[10px] text-gray-500">يستخدم لمعرف تطبيق AdMob (لمنصة Capacitor/موبايل)</p>
                                </div>
                              </div>
                            )}
                          </div>
                       </div>
                       <button onClick={handleSaveSettings} className="w-full bg-primary text-black font-black py-5 rounded-[2rem]">حفظ الإعدادات</button>
                    </div>

                    {/* منطقة الخطر - Danger Zone Link */}
                    <div className="pt-8">
                       <h3 className="text-xl font-black text-red-500 mb-4 flex items-center gap-3">
                          <Trash2 size={24} /> إدارة البيانات وتنظيم التطبيق
                       </h3>
                       <div className="glass p-6 rounded-[2rem] border border-red-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <p className="text-xs text-gray-400 font-bold leading-relaxed max-w-lg">
                             لقد تم نقل أدوات مسح وتنظيم قاعدتي بيانات الأخبار والمباريات إلى تبويب مخصص لتسهيل وتأمين إدارته بشكل مدروس وحمايته من الضغط العشوائي.
                          </p>
                          <button 
                             onClick={() => setActiveTab('DATA_CLEANUP')}
                             className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/30 px-6 py-3 rounded-xl text-xs font-black transition-all flex-shrink-0"
                          >
                             الانتقال لأدوات تنظيف البيانات
                          </button>
                       </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'DATA_CLEANUP' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6" key="data_cleanup_tab">
                  <div className="pt-2">
                    <h2 className="text-2xl font-black italic mb-6 text-red-500 flex items-center gap-3">
                       <Trash2 className="text-red-500 animate-pulse" /> تنظيف وإعادة تنظيم بيانات التطبيق
                    </h2>
                    
                    <div className="glass p-8 rounded-[2.5rem] border border-red-500/20 space-y-8">
                      <div>
                        <h3 className="text-lg font-bold text-white mb-2">منطقة التحكم الكاملة بنظام حذف البيانات</h3>
                        <p className="text-sm text-gray-400 leading-relaxed">
                          يمكنك من هنا تفريغ وتنظيف قاعدة بيانات التطبيق (المباريات والمقالات الإخبارية فقط) للبدء في تنظيم المحتوى مجدداً أو استيراد بيانات جديدة نقية دون تعارض.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* كارد حذف المباريات */}
                        <div className="glass p-6 rounded-[2rem] border border-white/5 space-y-4 flex flex-col justify-between">
                          <div className="space-y-2">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                              <Trophy size={24} />
                            </div>
                            <h4 className="text-md font-bold text-white">إفراغ جميع المباريات</h4>
                            <p className="text-xs text-gray-400 font-bold whitespace-normal leading-relaxed text-right md:text-right">
                              سيتم حذف جميع المباريات المسجلة مسبقاً في قاعدة البيانات بشكل فوري وتطهير الجدول.
                            </p>
                          </div>
                          
                          <div className="mt-4 pt-4 border-t border-white/5">
                            {showMatchesModal ? (
                              <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/30 space-y-3">
                                <p className="text-xs text-red-400 font-black">هل أنت متأكد تماماً من حذف جميع المباريات؟ هذا الإجراء فوري ولا يمكن التراجع عنه.</p>
                                <div className="flex gap-2 justify-end">
                                  <button
                                    disabled={deleteInProgress}
                                    onClick={() => setShowMatchesModal(false)}
                                    className="bg-white/10 hover:bg-white/20 text-white text-[11px] px-3.5 py-2 rounded-lg font-bold transition-all"
                                  >
                                    تراجع
                                  </button>
                                  <button
                                    disabled={deleteInProgress}
                                    onClick={handleDeleteAllMatches}
                                    className="bg-red-500 hover:bg-red-600 text-white text-[11px] px-3.5 py-2 rounded-lg font-black transition-all flex items-center gap-1.5"
                                  >
                                    {deleteInProgress && <RefreshCw size={12} className="animate-spin" />}
                                    نعم، احذف الكل
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-gray-500">العدد الحالي: {dbMatches.length}</span>
                                <button
                                  onClick={() => setShowMatchesModal(true)}
                                  className="bg-red-500/15 text-red-500 hover:bg-red-500 hover:text-white font-black text-xs px-6 py-3 rounded-xl transition-all"
                                >
                                  تفريغ المباريات
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* كارد حذف الأخبار */}
                        <div className="glass p-6 rounded-[2rem] border border-white/5 space-y-4 flex flex-col justify-between">
                          <div className="space-y-2">
                            <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary">
                              <Newspaper size={24} />
                            </div>
                            <h4 className="text-md font-bold text-white">إفراغ جميع الأخبار</h4>
                            <p className="text-xs text-gray-400 font-bold whitespace-normal leading-relaxed text-right md:text-right">
                              سيتم إزالة جميع المقالات والأخبار المنشورة في التطبيق لتنظيم الأخبار من جديد.
                            </p>
                          </div>

                          <div className="mt-4 pt-4 border-t border-white/5">
                            {showNewsModal ? (
                              <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/30 space-y-3">
                                <p className="text-xs text-red-400 font-black">هل أنت متأكد تماماً من حذف جميع المقالات الإخبارية؟ هذا الإجراء غير قابل للتراجع.</p>
                                <div className="flex gap-2 justify-end">
                                  <button
                                    disabled={deleteInProgress}
                                    onClick={() => setShowNewsModal(false)}
                                    className="bg-white/10 hover:bg-white/20 text-white text-[11px] px-3.5 py-2 rounded-lg font-bold transition-all"
                                  >
                                    تراجع
                                  </button>
                                  <button
                                    disabled={deleteInProgress}
                                    onClick={handleDeleteAllNews}
                                    className="bg-red-500 hover:bg-red-600 text-white text-[11px] px-3.5 py-2 rounded-lg font-black transition-all flex items-center gap-1.5"
                                  >
                                    {deleteInProgress && <RefreshCw size={12} className="animate-spin" />}
                                    نعم، احذف الأخبار
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-gray-500">العدد الحالي: {dbNews.length}</span>
                                <button
                                  onClick={() => setShowNewsModal(true)}
                                  className="bg-red-500/15 text-red-500 hover:bg-red-500 hover:text-white font-black text-xs px-6 py-3 rounded-xl transition-all"
                                >
                                  تفريغ الأخبار
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* زر الحذف الكامل */}
                      <div className="p-6 rounded-2xl bg-red-500/5 border border-red-500/15">
                        {showAllModal ? (
                          <div className="bg-red-600/10 p-5 rounded-xl border border-red-600/30 space-y-4">
                            <p className="text-sm font-black text-red-500 flex items-center gap-2">
                              <AlertCircle size={18} /> هل أنت متأكد بنسبة 100% أنك تريد تصفية كافة المباريات والأخبار معاً؟
                            </p>
                            <div className="flex gap-3 justify-end">
                              <button
                                disabled={deleteInProgress}
                                onClick={() => setShowAllModal(false)}
                                className="bg-white/10 hover:bg-white/20 text-white text-xs px-5 py-2.5 rounded-lg font-bold transition-all"
                              >
                                إلغاء الأمر
                              </button>
                              <button
                                disabled={deleteInProgress}
                                onClick={handleDeleteAllData}
                                className="bg-red-600 hover:bg-red-700 text-white text-xs px-5 py-2.5 rounded-lg font-black transition-all flex items-center gap-2"
                              >
                                {deleteInProgress && <RefreshCw size={12} className="animate-spin" />}
                                تأكيد الحذف والمطلق للكل ({dbMatches.length + dbNews.length})
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="space-y-1">
                              <h4 className="font-bold text-white flex items-center gap-2">
                                <AlertCircle size={16} className="text-red-500" /> الحذف الشامل والمطلق للبيانات
                              </h4>
                              <p className="text-xs text-gray-400">سيقوم هذا الزر بمسح جميع المباريات والأخبار دفعة واحدة لبدء المزامنة فوراً من الصفر.</p>
                            </div>
                            <button
                              onClick={() => setShowAllModal(true)}
                              className="w-full md:w-auto bg-red-600 hover:bg-red-700 text-white font-black text-sm px-8 py-4 rounded-xl transition-all"
                            >
                              تنظيف وحذف الكل ({dbMatches.length + dbNews.length})
                            </button>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'LEAGUE_FORM' && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6" key="league_form">
                   <div className="flex items-center gap-4">
                     <button onClick={() => setActiveTab('LEAGUES_LIST')} className="glass p-2 rounded-full hover:bg-white/10"><ArrowLeft size={20} /></button>
                     <h2 className="text-2xl font-black">إضافة بطولة جديدة</h2>
                  </div>
                  <div className="glass p-8 rounded-[2.5rem] space-y-6">
                     <input placeholder="اسم البطولة..." className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl font-black text-lg" value={leagueData.name} onChange={e => setLeagueData({...leagueData, name: e.target.value})} />
                     <input placeholder="الدولة (مثال: إسبانيا، قاري، دولي)" className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl font-bold" value={leagueData.country} onChange={e => setLeagueData({...leagueData, country: e.target.value})} />
                     <button onClick={handleSaveLeague} className="w-full bg-green-500 text-black font-black py-5 rounded-[2rem]">حفظ البطولة</button>
                  </div>
                </motion.div>
              )}

              {activeTab === 'ADS_LIST' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6" key="ads_list">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black italic flex items-center gap-3">
                       <ExternalLink className="text-blue-500" /> إدارة الإعلانات <span className="text-xs text-gray-500 not-italic font-bold">({stats.totalAds})</span>
                    </h2>
                    <button onClick={() => setActiveTab('AD_FORM')} className="bg-primary text-black px-6 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all hover:scale-105 shadow-lg shadow-primary/20">
                       <Plus size={14} /> إضافة إعلان جديد
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {dbAds.length === 0 ? (
                      <div className="col-span-full glass p-12 text-center text-gray-400 font-bold flex flex-col items-center justify-center gap-4 rounded-[2rem]">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-gray-500">
                          <ExternalLink size={32} />
                        </div>
                        <p>لا توجد إعلانات نشطة حالياً. ابدأ بإضافة إعلان جديد!</p>
                        <button onClick={() => setActiveTab('AD_FORM')} className="bg-primary/10 text-primary border border-primary/20 px-4 py-2 rounded-xl text-xs font-bold hover:bg-primary/20 transition-all">إضافة إعلان</button>
                      </div>
                    ) : (
                      dbAds.map(ad => (
                        <div key={ad.id} className="glass p-6 rounded-[2rem] border border-white/5 flex flex-col gap-4 group hover:neon-border transition-all">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest bg-blue-500/10 text-blue-400">
                                {ad.slot === 'Home_Top' ? 'أعلى الرئيسية' : 
                                 ad.slot === 'Home_Middle' ? 'منتصف الرئيسية' : 
                                 ad.slot === 'Home_Bottom' ? 'أسفل الرئيسية' : 
                                 ad.slot === 'Match_Sidebar' ? 'القائمة الجانبية للمباريات' : 
                                 ad.slot === 'Schedule_Top' ? 'أعلى جدول المباريات' : 
                                 ad.slot === 'News_Detail_Sidebar' ? 'تفاصيل الخبر' : 
                                 'تحت المشغل'}
                              </span>
                              <span className={cn(
                                "text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest",
                                ad.type === 'IMAGE' ? "bg-primary/10 text-primary" : "bg-purple-500/10 text-purple-400"
                              )}>
                                {ad.type === 'IMAGE' ? 'بانر صورة' : 'شفرة برمجية HTML'}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {deletingAdId === ad.id ? (
                                <div className="flex items-center gap-1 bg-red-500/10 p-1 rounded-xl">
                                  <button onClick={() => handleDeleteAd(ad.id)} className="bg-red-500 text-white px-2 py-1 rounded-lg text-[10px] font-bold">تأكيد</button>
                                  <button onClick={() => setDeletingAdId(null)} className="bg-white/10 px-2 py-1 rounded-lg text-[10px]">إلغاء</button>
                                </div>
                              ) : (
                                <>
                                  <button onClick={() => startEdit('AD', ad)} className="p-2 hover:bg-white/10 rounded-xl"><Edit3 size={14} /></button>
                                  <button onClick={() => setDeletingAdId(ad.id)} className="p-2 hover:bg-red-500/20 text-red-500 rounded-xl"><Trash2 size={14} /></button>
                                </>
                              )}
                            </div>
                          </div>
                          
                          <div className="space-y-2 text-right">
                            <h3 className="font-bold text-sm leading-tight text-white">{ad.title}</h3>
                            {ad.type === 'IMAGE' ? (
                              <div className="w-full h-24 bg-black/40 rounded-xl overflow-hidden border border-white/5 relative">
                                {ad.imageUrl ? (
                                  <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">لا توجد صورة بعد</div>
                                )}
                              </div>
                            ) : (
                              <div className="bg-black/40 p-3 rounded-xl border border-white/5 max-h-24 overflow-y-auto font-mono text-[10px] text-gray-400 text-left cursor-text">
                                {ad.code}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between border-t border-white/5 pt-3">
                            <span className="text-[10px] text-gray-500">مضاف: {(() => {
                              try {
                                const d = new Date(ad.createdAt);
                                return isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
                              } catch {
                                return '—';
                              }
                            })()}</span>
                            <button
                              onClick={() => toggleAdActive(ad)}
                              className={cn(
                                "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold transition-all",
                                ad.active ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-400"
                              )}
                            >
                              <span className={cn("w-1.5 h-1.5 rounded-full", ad.active ? "bg-green-500" : "bg-red-500")} />
                              {ad.active ? 'نشط (معروض)' : 'معطل ومخفي'}
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'AD_FORM' && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6" key="ad_form">
                   <div className="flex items-center gap-4">
                     <button onClick={() => setActiveTab('ADS_LIST')} className="glass p-2 rounded-full hover:bg-white/10"><ArrowLeft size={20} /></button>
                     <h2 className="text-2xl font-black">{editingId ? 'تعديل الإعلان الحالي' : 'إنشاء إعلان جديد'}</h2>
                   </div>

                   <div className="glass p-8 rounded-[2.5rem] border border-white/5 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 col-span-1 md:col-span-2 text-right">
                           <label className="text-[10px] font-black uppercase text-gray-500 px-1">اسم / عنوان الإعلان</label>
                           <input placeholder="مثل: إعلان متجر كورة (أعلى الموقع)..." className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl font-black text-lg focus:neon-border outline-none transition-all text-right" value={adData.title} onChange={e => setAdData({...adData, title: e.target.value})} />
                        </div>

                        <div className="space-y-4 text-right">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-gray-500 px-1">الموضع / المساحة الإعلانية</label>
                              <select className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl font-bold focus:neon-border outline-none text-right" value={adData.slot} onChange={e => setAdData({...adData, slot: e.target.value})}>
                                 <option value="Home_Top">أعلى الصفحة الرئيسية (Home_Top)</option>
                                 <option value="Home_Middle">منتصف الصفحة الرئيسية (Home_Middle)</option>
                                 <option value="Home_Bottom">أسفل الصفحة الرئيسية (Home_Bottom)</option>
                                 <option value="Schedule_Top">أعلى صفحة المباريات (Schedule_Top)</option>
                                 <option value="Match_Under_Player">تحت مشغل البث (Match_Under_Player)</option>
                                 <option value="Match_Sidebar">القائمة الجانبية بالبث (Match_Sidebar)</option>
                                 <option value="News_Detail_Sidebar">جانب تفاصيل الخبر (News_Detail_Sidebar)</option>
                              </select>
                           </div>

                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-gray-500 px-1">نوع الإعلان</label>
                              <select className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl font-bold focus:neon-border outline-none text-right" value={adData.type} onChange={e => setAdData({...adData, type: e.target.value as any})}>
                                 <option value="IMAGE">بانر صورة ورابط تحويل</option>
                                 <option value="CODE">شفرة مخصصة HTML / iframe Script</option>
                                 <option value="ADMOB_BANNER">إعلان AdMob (Banner)</option>
                                 <option value="ADMOB_INTERSTITIAL">إعلان AdMob (بيني / Interstitial)</option>
                              </select>
                           </div>

                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-gray-500 px-1">حالة الإعلان</label>
                              <div className="flex items-center gap-4 py-2">
                                 <button 
                                   onClick={() => setAdData({...adData, active: !adData.active})}
                                   className={cn("px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest border transition-all", adData.active ? "bg-green-500 text-black border-green-400" : "bg-red-500 text-white border-red-400")}
                                 >
                                   {adData.active ? 'نشط وتظهر للزوار فوراً' : 'معطل ومخفي حالياً'}
                                 </button>
                              </div>
                           </div>
                        </div>

                        <div className="space-y-4 text-right">
                           {adData.type === 'IMAGE' ? (
                              <>
                                 <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-gray-500 px-1">صورة البانر الإعلاني</label>
                                    <div className="w-full aspect-video glass rounded-3xl overflow-hidden relative group border border-white/5 flex items-center justify-center">
                                       {adData.imageUrl ? (
                                         <img src={adData.imageUrl} className="w-full h-full object-cover" alt="Banner" />
                                       ) : (
                                         <div className="absolute inset-0 flex flex-col items-center justify-center opacity-20"><Plus size={48} /><p className="text-xs font-bold mt-2">لا توجد صورة</p></div>
                                       )}
                                       <label className="absolute inset-0 cursor-pointer bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                          <Plus size={32} />
                                          <span className="font-black text-xs uppercase text-white">رفع صورة إعلان</span>
                                          <input type="file" className="hidden" accept="image/*" onChange={e => handleImageUpload(e, 'ad')} />
                                       </label>
                                    </div>
                                 </div>
                                 <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-gray-500 px-1">رابط التوجيه عند الضغط على الإعلان (Link URL)</label>
                                    <input placeholder="https://..." className="w-full bg-white/5 border border-white/10 p-4 rounded-xl font-bold focus:neon-border outline-none transition-all text-right" value={adData.linkUrl} onChange={e => setAdData({...adData, linkUrl: e.target.value})} />
                                 </div>
                              </>
                           ) : adData.type === 'CODE' ? (
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black uppercase text-gray-500 px-1">رمز HTML / Embed Code</label>
                                 <textarea placeholder="الصق شفرة الـ iframe أو كود إعلانات جوجل أدسنس هنا..." className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl font-mono text-xs leading-relaxed min-h-[220px] focus:neon-border outline-none transition-all text-left" value={adData.code} onChange={e => setAdData({...adData, code: e.target.value})} style={{ direction: 'ltr' }} />
                              </div>
                           ) : (
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <label className="text-[10px] font-black uppercase text-gray-500 px-1">معرف الوحدة الإعلانية (Ad Unit ID)</label>
                                  <input placeholder="مثال: ca-app-pub-3940256099942544/6300978111" className="w-full bg-white/5 border border-white/10 p-4 rounded-xl font-bold font-mono text-sm focus:neon-border outline-none transition-all text-left" style={{ direction: 'ltr' }} value={adData.admobAdUnitId || ''} onChange={e => setAdData({...adData, admobAdUnitId: e.target.value})} />
                                </div>
                                <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-xs text-gray-400 font-bold leading-relaxed">
                                  سيتم عرض إعلان متوافق مع AdMob في هذه المساحة.
                                  <br/>
                                  تأكد من إعداد AdMob App ID في تبويب الإعدادات العامة.
                                </div>
                              </div>
                           )}
                        </div>
                      </div>

                      <button onClick={handleSaveAd} disabled={loading} className="w-full bg-primary text-black font-black py-5 rounded-[2rem] shadow-2xl shadow-primary/20 flex items-center justify-center gap-3 hover:scale-[1.02] transition-all disabled:opacity-50">
                         {loading ? <RefreshCw className="animate-spin" /> : <CheckCircle2 size={24} />}
                         <span className="text-lg">{editingId ? 'حفظ وتحديث بيانات الإعلان' : 'حفظ ونشر الإعلان فوراً'}</span>
                      </button>
                   </div>
                </motion.div>
              )}

              {activeTab === 'DATA_ENGINE' && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6" key="data_engine">
                  <DataEngine />
                </motion.div>
              )}

              {activeTab === 'STATS_MANAGER' && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6" key="stats_manager">
                  <StatsManager />
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}
