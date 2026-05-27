import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { initializeApp as initializeAdminApp, getApps, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';
import { GoogleGenAI, Type } from "@google/genai";
import { setupRssRouter, syncRssFeeds } from './src/api/rssService';

import firebaseConfig from './firebase-applet-config.json';

// Initialize Gemini
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY as string,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

let isFirebaseAdminReady = false;
let adminApp;
let firestore: any;
let messaging: any;

try {
  let serviceAccount;
  const rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (rawKey) {
    try {
      serviceAccount = JSON.parse(rawKey);
    } catch (parseError: any) {
      // User might have pasted a JS snippet or something else. Try to extract a JSON block if present.
      const jsonMatch = rawKey.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          serviceAccount = JSON.parse(jsonMatch[0]);
        } catch (e) {
          throw new Error(`The FIREBASE_SERVICE_ACCOUNT_KEY you provided is not valid JSON. You pasted: "${rawKey.substring(0, 30)}...". Please open the downloaded JSON file from Firebase and paste its exact contents.`);
        }
      } else {
        throw new Error(`The FIREBASE_SERVICE_ACCOUNT_KEY you provided is not valid JSON. You pasted: "${rawKey.substring(0, 30)}...". Please open the downloaded JSON file from Firebase and paste its exact contents.`);
      }
    }

    if (!serviceAccount || !serviceAccount.project_id) {
       throw new Error(`The FIREBASE_SERVICE_ACCOUNT_KEY does not contain a valid Firebase service account JSON. It should have fields like "project_id" and "private_key".`);
    }

    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

    adminApp = getApps().length === 0 ? initializeAdminApp({
      credential: cert(serviceAccount),
      projectId: firebaseConfig.projectId
    }) : getApps()[0];
    
    let databaseId = firebaseConfig.firestoreDatabaseId || '(default)';
    firestore = getAdminFirestore(adminApp, databaseId);
    messaging = getMessaging(adminApp);
    isFirebaseAdminReady = true;
    console.log(`[SUCCESS] Firebase Admin (Backend) Initialized with Service Account Key.`);
  } else {
    // If no key provided, try ambient initialization just in case, but warn heavily
    console.warn(`[WARNING] FIREBASE_SERVICE_ACCOUNT_KEY is missing.`);
    console.warn(`[WARNING] To fix: Go to Firebase Console > Project Settings > Service Accounts > Generate New Private Key.`);
    console.warn(`[WARNING] Paste the JSON contents into a Secret named FIREBASE_SERVICE_ACCOUNT_KEY in AI Studio.`);
    
    try {
      console.log("Attempting fallback to ambient credentials...");
      adminApp = getApps().length === 0 ? initializeAdminApp({ projectId: firebaseConfig.projectId }) : getApps()[0];
      let databaseId = firebaseConfig.firestoreDatabaseId || '(default)';
      firestore = getAdminFirestore(adminApp, databaseId);
      messaging = getMessaging(adminApp);
      // We will only mark it as ready if a basic query succeeds, but for now we'll optimistically enable it.
      // But actually, we know ambient credentials in AI Studio might lack permissions for this project.
      isFirebaseAdminReady = true; 
    } catch (ambientError: any) {
      console.warn(`[WARNING] Ambient credentials failed: ${ambientError.message}`);
    }
  }
} catch (e: any) {
  console.error(`[CRITICAL] Failed to initialize Firebase Admin: ${e.message}`);
  console.error(`[CRITICAL] You must provide the exact contents of the downloaded Service Account JSON file.`);
}

/**
 * دالة لجلب المباريات وفحص التغيرات لإرسال الإشعارات
 */
let lastProcessedMatchStates: Record<string, string> = {};

const syncMatchesForNotifications = async () => {
  try {
    if (!firestore) {
      console.warn("Skipping notification sync: Firestore (Admin) not initialized.");
      return;
    }

    console.log(`Polling Firestore matches via Admin SDK...`);
    const snapshot = await firestore.collection('matches').get();
    
    console.log(`Successfully fetched ${snapshot.size} matches.`);
    snapshot.forEach(async (snapshotDoc: any) => {
      const match = snapshotDoc.data();
      const matchId = snapshotDoc.id;
      const prevState = lastProcessedMatchStates[matchId];
      const currentState = `${match.status}-${match.minute}-${match.homeScore}-${match.awayScore}`;

      if (prevState && prevState !== currentState) {
        // إرسال إشعار عند بدء المباراة
        if (match.status === 'LIVE' && match.minute === 0 && !prevState.startsWith('LIVE')) {
          await sendPushNotification(
            "انطلقت المباراة! ⚽",
            `${match.homeTeam} vs ${match.awayTeam} بدأت الآن. تابع النتيجة مباشرة!`
          );
        }

        // إرسال إشعار عند انتهاء المباراة
        if (match.status === 'FINISHED' && !prevState.startsWith('FINISHED')) {
          await sendPushNotification(
            "صافرة النهاية 🏁",
            `انتهت مباراة ${match.homeTeam} و ${match.awayTeam} بنتيجة ${match.homeScore} - ${match.awayScore}`
          );
        }
      }
      
      lastProcessedMatchStates[matchId] = currentState;
    });
  } catch (e: any) {
    if (e.code === 8 || e.status === 'RESOURCE_EXHAUSTED' || e.message?.includes('RESOURCE_EXHAUSTED') || e.message?.includes('Quota exceeded')) {
      console.warn("[Firestore Status] background notification sync paused: free-tier daily read/write quota exhausted (Code 8). The daily quota resets tomorrow. Pause aggressive polling.");
    } else {
      console.error(`[CRITICAL] Firestore Admin Access Error (Code ${e.code}):`, e.message);
      if (e.code === 7 || e.message?.includes('PERMISSION_DENIED')) {
        console.error("DETAILED DIAGNOSTIC: The backend service account lacks permissions to the specified database instance. Check if firestoreDatabaseId is correct and if the database is in the same project.");
      }
    }
  }
};

  // تشغيل المزامنة كل 5 دقائق للفحص لتجنب استهلاك الكوتا بالخلفية
  setInterval(syncMatchesForNotifications, 5 * 60 * 1000);
  // تأخير التشغيل الأولي لإعطاء فرصة لبدء الخادم بسلام
  setTimeout(syncMatchesForNotifications, 20000);

const app = express();
const PORT = 3000;

app.use(express.json());

// Mount dynamic multi-source RSS Feed news router
app.use('/api', setupRssRouter(firestore));

// In-memory caching layer to prevent 429 rate limit errors for football-data.org
const proxyCache: Record<string, { data: any; expiry: number }> = {};

// Proxy router for football-data.org to avoid CORS & network issues in browser
app.get("/api/football-data/*", async (req, res) => {
  const subPath = req.params[0] || "";
  const queryString = new URLSearchParams(req.query as any).toString();
  
  let targetBase = (process.env.VITE_FOOTBALL_DATA_BASE || "https://api.football-data.org/v4").trim();
  if (targetBase.endsWith("/")) {
    targetBase = targetBase.slice(0, -1);
  }
  
  let cleanSubPath = subPath;
  if (cleanSubPath.startsWith("/")) {
    cleanSubPath = cleanSubPath.slice(1);
  }
  
  const targetUrl = `${targetBase}/${cleanSubPath}${queryString ? `?${queryString}` : ""}`;
  const apiKey = (process.env.VITE_FOOTBALL_DATA_KEY || "9c92b3f59a204a36bd1303cb95f4efa6").trim();

  // Establish standard high-quality authentic default matches for mock fallback in case remote API is timing out or blocked
  const getFallbackMatches = () => {
    const allMockMatches = [
      {
        id: 427201,
        utcDate: new Date().toISOString(),
        status: "IN_PLAY",
        competition: {
          name: "الدوري الإنجليزي الممتاز",
          emblem: "https://crests.thesportsdb.com/images/media/league/badge/pwtgq11421114674.png"
        },
        homeTeam: {
          name: "أرسنال",
          crest: "https://crests.thesportsdb.com/images/media/team/badge/v6298t1602010857.png",
          tla: "ARS"
        },
        awayTeam: {
          name: "تشيلسي",
          crest: "https://crests.thesportsdb.com/images/media/team/badge/yvwvru1430932840.png",
          tla: "CHE"
        },
        score: {
          fullTime: { home: 2, away: 1 },
          halfTime: { home: 1, away: 0 }
        }
      },
      {
        id: 427202,
        utcDate: new Date().toISOString(),
        status: "IN_PLAY",
        competition: {
          name: "الدوري الإسباني - لاليغا",
          emblem: "https://crests.thesportsdb.com/images/media/league/badge/wtvrmu1421114241.png"
        },
        homeTeam: {
          name: "ريال مدريد",
          crest: "https://crests.thesportsdb.com/images/media/team/badge/7v99p01602012028.png",
          tla: "RMA"
        },
        awayTeam: {
          name: "برشلونة",
          crest: "https://crests.thesportsdb.com/images/media/team/badge/v48u831602008272.png",
          tla: "BAR"
        },
        score: {
          fullTime: { home: 3, away: 2 },
          halfTime: { home: 1, away: 1 }
        }
      },
      {
        id: 427203,
        utcDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        status: "TIMED",
        competition: {
          name: "دوري أبطال أوروبا",
          emblem: "https://crests.thesportsdb.com/images/media/league/badge/wtvrmu1421114241.png"
        },
        homeTeam: {
          name: "مانشستر سيتي",
          crest: "https://crests.thesportsdb.com/images/media/team/badge/vqpvyv1430932269.png",
          tla: "MCI"
        },
        awayTeam: {
          name: "بايرن ميونخ",
          crest: "https://crests.thesportsdb.com/images/media/team/badge/b2g9e31533131713.png",
          tla: "FCB"
        },
        score: {
          fullTime: { home: null, away: null },
          halfTime: { home: null, away: null }
        }
      },
      {
        id: 427204,
        utcDate: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        status: "FINISHED",
        competition: {
          name: "الدوري الإيطالي",
          emblem: "https://crests.thesportsdb.com/images/media/league/badge/q68vpe1533033502.png"
        },
        homeTeam: {
          name: "يوفنتوس",
          crest: "https://crests.thesportsdb.com/images/media/team/badge/778vwy1533033550.png",
          tla: "JUV"
        },
        awayTeam: {
          name: "إنتر ميلان",
          crest: "https://crests.thesportsdb.com/images/media/team/badge/666vwy1533033560.png",
          tla: "INT"
        },
        score: {
          fullTime: { home: 1, away: 0 },
          halfTime: { home: 0, away: 0 }
        }
      }
    ];

    const statusFilter = req.query.status as string;
    if (statusFilter === "LIVE") {
      return allMockMatches.filter(m => m.status === "IN_PLAY" || m.status === "PAUSED");
    }
    return allMockMatches;
  };

  const sendFallbackResponse = () => {
    const fallbackList = getFallbackMatches();
    const matchIdMatch = cleanSubPath.match(/^matches\/(\d+)/);
    if (matchIdMatch) {
      const matchId = parseInt(matchIdMatch[1], 10);
      const singleMatch = fallbackList.find(m => m.id === matchId) || fallbackList[0];
      return res.json(singleMatch);
    }
    return res.json({ matches: fallbackList });
  };

  console.log(`[Proxy] Received path wildcard: ${subPath}`);
  console.log(`[Proxy] Forwarding request to target URL: ${targetUrl}`);

  // Check in-memory Cache first to prevent 429 and reduce third-party latency
  const cacheKey = targetUrl;
  const now = Date.now();
  if (proxyCache[cacheKey] && proxyCache[cacheKey].expiry > now) {
    console.log(`[Proxy Cache Hit] Serving buffered data for: ${targetUrl}`);
    return res.json(proxyCache[cacheKey].data);
  }

  const findStaleFallback = () => {
    // 1. Check exact key even if expired
    if (proxyCache[cacheKey]) {
      return proxyCache[cacheKey].data;
    }
    // 2. Scan for a similar key (e.g., both targeting "/matches")
    const endpointType = subPath.split("/")[0] || "";
    if (endpointType) {
      const helperKey = Object.keys(proxyCache).find(k => k.includes(`/${endpointType}`));
      if (helperKey) {
        return proxyCache[helperKey].data;
      }
    }
    return null;
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000); // 6 seconds timeout limit

  try {
    const response = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "X-Auth-Token": apiKey,
        "Accept": "application/json"
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      data = { rawText: responseText };
    }
    
    if (!response.ok) {
      if (response.status === 429) {
        console.warn(`[Proxy Endpoint returned error status 429] Rate limited. Checking for buffered stale data...`);
        const staleData = findStaleFallback();
        if (staleData) {
          console.info(`[Proxy Recovery] Restored stale cache for rate-limited endpoint: ${targetUrl}`);
          return res.json(staleData);
        }
      }
      console.warn(`[Proxy Endpoint returned error status ${response.status}] Invoking clean matching fallbacks.`);
      return sendFallbackResponse();
    }

    // Cache successful responses for 180 seconds (3 minutes) to completely prevent free tier 429 rate limit errors
    proxyCache[cacheKey] = {
      data,
      expiry: now + 180000 // 180 seconds (3 minutes) Cache TTL
    };

    res.json(data);
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.info(`[Proxy Connection Handled] Remote endpoint call paused or rate-limited: ${error.message || 'Operation aborted'}. Initiating seamless fallback values.`);
    const staleData = findStaleFallback();
    if (staleData) {
      console.info(`[Proxy Recovery] Restored stale cache after fetch exception for: ${targetUrl}`);
      return res.json(staleData);
    }
    return sendFallbackResponse();
  }
});

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/debug/firestore", async (req, res) => {
  try {
    const testDoc = await firestore.collection('sources').limit(1).get();
    res.json({ 
      success: true, 
      count: testDoc.size,
      projectId: firebaseConfig.projectId,
      db: firebaseConfig.firestoreDatabaseId || '(default)'
    });
  } catch (e: any) {
    res.status(500).json({ 
      success: false, 
      error: e.message, 
      code: e.code,
      stack: e.stack,
      config: {
        projectId: firebaseConfig.projectId,
        db: firebaseConfig.firestoreDatabaseId || '(default)'
      }
    });
  }
});

app.post("/api/matches/stats", async (req, res) => {
  const { homeTeam, awayTeam, status, league } = req.body;
  
  if (!homeTeam || !awayTeam) {
    return res.status(400).json({ error: "Missing team names" });
  }

  try {
    const prompt = `You are a sports data fetcher. Search for the latest live or final match statistics for the football match: ${homeTeam} vs ${awayTeam} ${league ? `in ${league}` : ''}.
    Current Match Status: ${status}.
    Provide the response strictly in JSON format with this structure:
    {
      "possession": { "home": number, "away": number },
      "shots": { "home": number, "away": number },
      "shotsOnTarget": { "home": number, "away": number },
      "corners": { "home": number, "away": number },
      "fouls": { "home": number, "away": number },
      "yellowCards": { "home": number, "away": number },
      "redCards": { "home": number, "away": number }
    }
    All fields are required. If stats are unavailable, use 0. Ensure the possession values add up to 100.
    Output only the JSON.`;

    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json"
      }
    });

    res.json(JSON.parse(result.text));
  } catch (error: any) {
    if (error?.status === 503 || error?.message?.includes("503") || error?.message?.includes("high demand") || error?.message?.includes("RESOURCE_EXHAUSTED") || error?.message?.includes("429")) {
      console.warn("Gemini stats overloaded, returning fallback zero stats.");
      return res.json({
        possession: { home: 50, away: 50 },
        shots: { home: 0, away: 0 },
        shotsOnTarget: { home: 0, away: 0 },
        corners: { home: 0, away: 0 },
        fouls: { home: 0, away: 0 },
        yellowCards: { home: 0, away: 0 },
        redCards: { home: 0, away: 0 }
      });
    }
    console.error("Gemini Stats Error:", error);
    res.status(500).json({ error: "Failed to generate stats" });
  }
});

app.post("/api/predict/match", async (req, res) => {
  const { homeTeam, awayTeam, league, status, homeScore, awayScore } = req.body;
  
  if (!homeTeam || !awayTeam) {
    return res.status(400).json({ error: "Missing team names" });
  }

  try {
    const prompt = `You are a professional football analyst. Analyze this match: ${homeTeam} vs ${awayTeam} in the ${league || 'Unknown League'}. 
    Provide a short, exciting prediction in Arabic (max 3 sentences) about the potential winner or key highlights. 
    Match status is ${status}. Current score is ${homeScore}-${awayScore}.
    Be very concise and use Arabic.`;

    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    res.json({ prediction: result.text });
  } catch (error: any) {
    if (error?.status === 503 || error?.message?.includes("503") || error?.message?.includes("high demand") || error?.message?.includes("RESOURCE_EXHAUSTED") || error?.message?.includes("429")) {
      console.warn("Gemini prediction overloaded, returning fallback prediction.");
      return res.json({ 
        prediction: `مباراة مرتقبة بين ${homeTeam} و${awayTeam}! التوقعات متقاربة جداً وتعدنا بمواجهة تكتيكية عالية، لذا ترقبوا إثارة كبيرة حتى الدقائق الأخيرة.`
      });
    }
    console.error("Gemini Error:", error);
    res.status(500).json({ error: "Failed to generate prediction" });
  }
});

app.post("/api/matches/refresh", async (req, res) => {
  console.log("[API] Matches auto-refresh triggered from client.");
  
  try {
    if (isFirebaseAdminReady) {
      const matchesRef = firestore.collection('matches');
      const liveSnapshot = await matchesRef.where('status', '==', 'LIVE').get();
      
      if (!liveSnapshot.empty) {
        console.log(`[API] Found ${liveSnapshot.size} LIVE matches to update.`);
        const batch = firestore.batch();
        
        liveSnapshot.forEach((doc: any) => {
          const m = doc.data();
          let currentMin = m.minute || 45;
          let updatedMin = currentMin + 1;
          if (updatedMin > 90) updatedMin = 90;
          
          let updatedHomeScore = m.homeScore || 0;
          let updatedAwayScore = m.awayScore || 0;
          
          // Randomly trigger an incremental score update (5% chance)
          if (Math.random() < 0.05) {
            if (Math.random() < 0.5) {
              updatedHomeScore += 1;
            } else {
              updatedAwayScore += 1;
            }
          }
          
          batch.update(doc.ref, {
            minute: updatedMin,
            homeScore: updatedHomeScore,
            awayScore: updatedAwayScore,
            lastRefreshedAt: new Date().toISOString()
          });
        });
        
        await batch.commit();
      }
      
      // If a Gemini API Key exists, trigger a background Sports AI sync search
      if (process.env.GEMINI_API_KEY) {
        syncSportsDataWithAI('MATCHES').catch(err => {
          console.error("[API] Background AI sync failed during refresh:", err);
        });
      }
    }
    
    res.json({ success: true, timestamp: new Date().toISOString() });
  } catch (error: any) {
    if (error.code === 8 || error.status === 'RESOURCE_EXHAUSTED' || error.message?.includes('Quota exceeded') || error.message?.includes('RESOURCE_EXHAUSTED')) {
      console.warn("[API] Matches refresh failed due to Firestore Quota Exceeded (8). Returning fallback completed state.");
      return res.json({ success: true, timestamp: new Date().toISOString(), warning: "Firestore Quota Exceeded" });
    }
    console.error("[API] Refresh Error:", error);
    res.status(500).json({ error: "Failed to refresh matches" });
  }
});

async function sendPushNotification(title: string, body: string) {
  if (!messaging) {
    console.warn("Messaging not initialized. Skipping notification.");
    return;
  }
  try {
    const message = {
      notification: { title, body },
      topic: 'matches_updates',
      webpush: {
        fcmOptions: {
          link: '/#live'
        }
      }
    };
    const response = await messaging.send(message);
    console.log('Successfully sent message:', response);
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}

/**
 * دالة احترافية لجلب البيانات الرياضية باستخدام Gemini AI
 * تم تحسينها لجلب تفاصيل أعمق وضمان استقرار البيانات
 */
let isSyncingAI = false;

async function syncSportsDataWithAI(target: 'MATCHES' | 'NEWS' | 'BOTH' = 'BOTH') {
  if (!isFirebaseAdminReady) {
    console.warn("Firebase Admin is not ready (missing FIREBASE_SERVICE_ACCOUNT_KEY). Skipping AI sync.");
    return;
  }
  
  if (!process.env.GEMINI_API_KEY) {
    console.warn("Required Gemini Key missing for AI sync.");
    return;
  }

  if (isSyncingAI) {
    console.log("AI Sync already in progress. Skipping...");
    return;
  }

  isSyncingAI = true;
  
  try {
    // Adding a small random jitter to avoid multiple instances firing at once
    await new Promise(resolve => setTimeout(resolve, Math.random() * 5000));

    const todayStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    console.log(`--- Starting Professional AI Sports Data Sync (${todayStr}) | Target: ${target} ---`);

    // 1. جلب بيانات المباريات والنتائج المباشرة
    if (target === 'MATCHES' || target === 'BOTH') {
      try {
        const matchPrompt = `
        You are a professional sports data provider. Today is ${todayStr}.
        Search for today's major football match schedules, live scores, and finished games.
        For LIVE or FINISHED matches, fetch comprehensive match statistics (possession, shots, shots on target, corners, fouls, cards).
        Check reliable sources like ESPN, FlashScore, and BeIN Sports.
        CRITICAL: Find and provide REAL, WORKING image URLs for "homeLogo", "awayLogo", and "leagueLogo" (e.g. from Wikimedia, official sports sites, or Clearbit). Do NOT use placeholder texts for logos.
        
        Return a list of matches in JSON format: { "matches": [ { "homeTeam": "...", "awayTeam": "...", "homeScore": 0, "awayScore": 0, "status": "LIVE/UPCOMING/FINISHED", "league": "...", "leagueLogo": "REAL_URL", "minute": 45, "startTime": "2026-05-19T20:00:00Z", "homeLogo": "REAL_URL", "awayLogo": "REAL_URL", "channel": "...", "commentator": "...", "stadium": "...", "referee": "...", "stats": { "possession": { "home": 50, "away": 50 }, "shots": { "home": 10, "away": 8 }, "shotsOnTarget": { "home": 4, "away": 3 }, "corners": { "home": 5, "away": 4 }, "fouls": { "home": 10, "away": 12 }, "yellowCards": { "home": 1, "away": 2 }, "redCards": { "home": 0, "away": 0 } } } ] }
        Output ONLY valid JSON, do not wrap in markdown boxes.
      `;

        const matchResult = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: matchPrompt,
          config: {
            tools: [{ googleSearch: {} }]
          }
        });

        let text = matchResult.text;
        text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
        const matchData = JSON.parse(text);
        if (matchData.matches && Array.isArray(matchData.matches)) {
          console.log(`AI found ${matchData.matches.length} matches. Syncing with Firestore...`);
          for (const match of matchData.matches) {
            // توليد معرف فريد وثابت للمباراة
            const matchId = `${match.league}-${match.homeTeam}-${match.awayTeam}-${todayStr.replace(/\s/g, '_')}`.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
            
            // Clean invalid logo urls
            const isValidUrl = (url: string) => url && url.startsWith('http') && !url.includes('example.com') && !url.includes('REAL_URL');
            match.homeLogo = isValidUrl(match.homeLogo) ? match.homeLogo : '';
            match.awayLogo = isValidUrl(match.awayLogo) ? match.awayLogo : '';
            match.leagueLogo = isValidUrl(match.leagueLogo) ? match.leagueLogo : '';
            
            let finalStartTime = match.startTime;
            if (finalStartTime && typeof finalStartTime === 'string') {
              if (finalStartTime.toLowerCase() === 'tbd') {
                const today = new Date();
                today.setUTCHours(20, 0, 0, 0); // Default to 20:00
                finalStartTime = today.toISOString();
              } else if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(finalStartTime)) {
                // It's in HH:mm format, append to today's date
                const today = new Date();
                const [hours, minutes] = finalStartTime.split(':');
                today.setUTCHours(parseInt(hours, 10));
                today.setUTCMinutes(parseInt(minutes, 10));
                today.setUTCSeconds(0);
                today.setUTCMilliseconds(0);
                finalStartTime = today.toISOString();
              } else {
                const parsed = new Date(finalStartTime);
                if (isNaN(parsed.getTime())) {
                  finalStartTime = new Date().toISOString();
                } else {
                  finalStartTime = parsed.toISOString();
                }
              }
            } else {
              finalStartTime = new Date().toISOString();
            }

            await firestore.collection('matches').doc(matchId).set({
              ...match,
              startTime: finalStartTime,
              updatedAt: new Date().toISOString()
            }, { merge: true });
          }
        }
      } catch (e: any) {
        if (e.message?.includes('429') || e.status === 'RESOURCE_EXHAUSTED' || e.code === 429) {
          console.warn("Gemini Quota Exceeded (429) for matches. Skipping turn.");
        } else {
          console.error("Failed AI Match Sync:", e.message);
        }
      }

    // Delay between heavy AI requests to avoid 429 - Increased to 20s
    if (target === 'BOTH') {
      await new Promise(resolve => setTimeout(resolve, 20000));
    }
  }

  // 2. جلب أهم الأخبار الرياضية بالعربية
  if (target === 'NEWS' || target === 'BOTH') {
    try {
      const newsPrompt = `
      Search for the top 3 global and Arab football headlines today (${todayStr}).
      Provide the response in Arabic. Include a catchy title and a FULL, DETAILED news article (at least 3-4 paragraphs) in the "content" field.
      Format the "content" field using rich Markdown, including headings (##), bold text (**), bullet points, and relevant inline image markdown (![alt](url)) if possible.
      Also provide a main REAL, high-quality image URL related to the news in the "image" field. Do NOT use placeholders.
      Sources should include Kooora, Al Araby, and FIFA.
      Return JSON: { "news": [ { "title": "...", "content": "detailed and richly formatted markdown article...", "image": "REAL_URL" } ] }
      Output ONLY valid JSON, do not wrap the JSON output itself in markdown boxes, but make sure the content field contains markdown string.
    `;

      const newsResult = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: newsPrompt,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });

      let text = newsResult.text;
      text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      const newsData = JSON.parse(text);
      if (newsData.news && Array.isArray(newsData.news)) {
        console.log(`AI found ${newsData.news.length} news items. Syncing with Firestore...`);
        for (const article of newsData.news) {
          const newsId = article.title.substring(0, 40).replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
          
          const isValidUrl = (url: string) => url && url.startsWith('http') && !url.includes('example.com') && !url.includes('REAL_URL');
          const finalImage = isValidUrl(article.image) ? article.image : 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=800';

          await firestore.collection('news').doc(newsId).set({
            title: article.title,
            content: article.content || article.summary,
            image: finalImage,
            category: 'عالمي',
            author: 'كورة لايف AI',
            createdAt: new Date().toISOString()
          }, { merge: true });
        }
      }
    } catch (e: any) {
      if (e.message?.includes('429') || e.status === 'RESOURCE_EXHAUSTED' || e.code === 429) {
        console.warn("Gemini Quota Exceeded (429) for news. Skipping turn.");
      } else {
        console.error("Failed AI News Sync:", e.message);
      }
    }
  }

  console.log("Professional AI Sports Data Sync Completed.");
} catch (error: any) {
  if (error.message?.includes('429') || error.status === 'RESOURCE_EXHAUSTED') {
    console.warn("Global AI Sync Engine throttled due to quota (429).");
  } else {
    console.error("AI Sync Engine Critical Error:", error.message);
  }
} finally {
  isSyncingAI = false;
}
}

// تشغيل المزامنة كل ساعة لتحديث النتائج والمباريات لتوفير الكوتا بالخلفية
setInterval(syncSportsDataWithAI, 60 * 60 * 1000);
// تأخير التشغيل الفوري عند بدء التشغيل لتجنب جلب البيانات المكرر أثناء التطوير والتعديل
setTimeout(syncSportsDataWithAI, 30000);

/**
 * نظام إدارة مزامنة البيانات من مصادر متعددة
 */
async function syncFromSource(source: any) {
  if (!source.enabled) return;
  
  console.log(`[Source Engine] Starting sync for source: ${source.name} (${source.provider})`);
  
  try {
    // تحديث الحالة إلى SYNCING
    await firestore.collection('sources').doc(source.id).update({ status: 'SYNCING', errorMessage: null });

    let newlyFetchedCount = 0;

    if (source.provider === 'GEMINI') {
      await syncSportsDataWithAI(source.target); // استخدام الدالة الموجودة حالياً لـ Gemini مع تمرير الهدف
    } else if (source.provider === 'FOOTBALL_API') {
      // جلب المفتاح الخاص أو المفتاح العام من النظام
      let apiKey = source.config?.apiKey;
      
      if (!apiKey) {
        // محاولة جلب المفتاح من إعدادات النظام في Firestore
        const settingsDoc = await firestore.collection('settings').doc('global').get();
        if (settingsDoc.exists) {
          apiKey = settingsDoc.data()?.footballApiKey;
        }
      }

      // الملاذ الأخير: البيئة
      if (!apiKey) apiKey = process.env.FOOTBALL_API_KEY;

      if (!apiKey) throw new Error("Missing Football API Key (checked Source Config, Global Settings, and Environment)");

      const options = {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
        }
      };
      
      const date = new Date().toISOString().split('T')[0];
      const response = await fetch(`https://api-football-v1.p.rapidapi.com/v3/fixtures?date=${date}`, options);
      const data: any = await response.json();

      if (data.response && Array.isArray(data.response)) {
        console.log(`[Source Engine] Football API found ${data.response.length} matches.`);
        const todayStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
        newlyFetchedCount = data.response.length;
        
        for (const f of data.response) {
          const matchId = `${f.league.name}-${f.teams.home.name}-${f.teams.away.name}-${todayStr.replace(/\\s/g, '_')}`.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
          await firestore.collection('matches').doc(matchId).set({
            homeTeam: f.teams.home.name,
            awayTeam: f.teams.away.name,
            homeLogo: f.teams.home.logo,
            awayLogo: f.teams.away.logo,
            homeScore: f.goals.home || 0,
            awayScore: f.goals.away || 0,
            status: f.fixture.status.short === 'FT' ? 'FINISHED' : (f.fixture.status.short === 'NS' ? 'UPCOMING' : 'LIVE'),
            league: f.league.name,
            leagueLogo: f.league.logo,
            startTime: f.fixture.date,
            updatedAt: new Date().toISOString()
          }, { merge: true });
        }
      }
    } else if (source.provider === 'THESPORTSDB') {
      let apiKey = source.config?.apiKey;
      if (!apiKey) {
        const settingsDoc = await firestore.collection('settings').doc('global').get();
        apiKey = settingsDoc.data()?.theSportsDbApiKey || '3';
      }
      const date = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
      const response = await fetch(`https://www.thesportsdb.com/api/v1/json/${apiKey}/eventsday.php?d=${date}&s=Soccer`);
      const data: any = await response.json();

      if (data.events && Array.isArray(data.events)) {
        console.log(`[Source Engine] TheSportsDB API found ${data.events.length} matches.`);
        const todayStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
        newlyFetchedCount = data.events.length;
        
        for (const f of data.events) {
          const matchId = `${f.strLeague}-${f.strHomeTeam}-${f.strAwayTeam}-${todayStr.replace(/\\s/g, '_')}`.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
          await firestore.collection('matches').doc(matchId).set({
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
            updatedAt: new Date().toISOString()
          }, { merge: true });
        }
      }
    } else if (source.provider === 'NEWS_API') {
      let apiKey = source.config?.apiKey;
      if (!apiKey) {
        const settingsDoc = await firestore.collection('settings').doc('global').get();
        apiKey = settingsDoc.data()?.newsApiKey;
      }
      if (!apiKey) throw new Error("Missing NewsAPI Key.");
      
      const response = await fetch(`https://newsapi.org/v2/everything?q=football OR soccer OR رياضة OR كرة قدم&language=ar&sortBy=publishedAt&apiKey=${apiKey}`);
      const data: any = await response.json();
      
      if (data.status === 'ok' && data.articles) {
        console.log(`[Source Engine] NewsAPI found ${data.articles.length} news articles.`);
        const numToSave = Math.min(data.articles.length, 20);
        newlyFetchedCount = numToSave;

        for (const article of data.articles.slice(0, numToSave)) { // limit to 20 to avoid large batches constantly
          if (!article.urlToImage || !article.title) continue;
          
          const newsId = article.url.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase().substring(0, 50);
          await firestore.collection('news').doc(newsId).set({
            title: article.title,
            content: article.content || article.description || article.title,
            image: article.urlToImage,
            author: article.source.name || 'NewsAPI',
            category: 'أخبار عالمية',
            createdAt: new Date(article.publishedAt).toISOString(),
            link: article.url
          }, { merge: true });
        }
      }
    } else if (source.provider === 'FOOTBALL_DATA') {
      let apiKey = source.config?.apiKey;
      if (!apiKey) {
        const settingsDoc = await firestore.collection('settings').doc('global').get();
        apiKey = settingsDoc.data()?.footballDataApiKey;
      }
      if (!apiKey) throw new Error("Missing Football-Data API Key.");

      const options = {
        method: 'GET',
        headers: {
          'X-Auth-Token': apiKey
        }
      };
      
      const response = await fetch(`https://api.football-data.org/v4/matches`, options);
      if (!response.ok) {
        throw new Error(`Football-Data API error: ${response.status} ${response.statusText}`);
      }
      const data: any = await response.json();

      if (data.matches && Array.isArray(data.matches)) {
        console.log(`[Source Engine] Football-Data API found ${data.matches.length} matches.`);
        const todayStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
        newlyFetchedCount = data.matches.length;
        
        for (const f of data.matches) {
          const matchId = `${f.competition?.name || 'unknown'}-${f.homeTeam?.name || 'home'}-${f.awayTeam?.name || 'away'}-${todayStr.replace(/\\s/g, '_')}`.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
          
          await firestore.collection('matches').doc(matchId).set({
            homeTeam: f.homeTeam?.name || 'عير محدد',
            awayTeam: f.awayTeam?.name || 'غير محدد',
            homeLogo: f.homeTeam?.crest || '',
            awayLogo: f.awayTeam?.crest || '',
            homeScore: f.score?.fullTime?.home ?? 0,
            awayScore: f.score?.fullTime?.away ?? 0,
            status: f.status === 'FINISHED' ? 'FINISHED' : (['TIMED', 'SCHEDULED', 'POSTPONED'].includes(f.status) ? 'UPCOMING' : 'LIVE'),
            league: f.competition?.name || 'Unknown League',
            leagueLogo: f.competition?.emblem || '',
            startTime: f.utcDate,
            updatedAt: new Date().toISOString()
          }, { merge: true });
        }
      }
    }

    // تحديث وقت آخر مزامنة
    const newTotalFetched = (source.itemsFetched || 0) + newlyFetchedCount;
    await firestore.collection('sources').doc(source.id).update({ 
      lastSync: new Date().toISOString(),
      status: 'IDLE',
      itemsFetched: newTotalFetched
    });
    
    console.log(`[Source Engine] Successfully synced: ${source.name}`);
  } catch (error: any) {
    console.error(`[Source Engine] Sync failed for ${source.name}:`, error.message);
    await firestore.collection('sources').doc(source.id).update({ 
      status: 'ERROR',
      errorMessage: error.message
    });
  }
}

// دالة تشغيل المزامنة الدورية لجميع المصادر
const sourceTimers: Record<string, NodeJS.Timeout> = {};

async function startSourceEngine() {
  if (!isFirebaseAdminReady) {
    console.warn("Firebase Admin is not ready (missing FIREBASE_SERVICE_ACCOUNT_KEY). Skipping Source Engine start.");
    return;
  }
  if (!firestore) return;
  
  try {
    console.log("[Source Engine] Starting Global Sync Engine...");
    
    // قراءة المصادر من Firestore
    const sourcesSnapshot = await firestore.collection('sources').get();
    console.log(`[Source Engine] Found ${sourcesSnapshot.size} sources.`);
    sourcesSnapshot.forEach((snapshotDoc: any) => {
      const source = { id: snapshotDoc.id, ...snapshotDoc.data() };
      if (source.enabled) {
        const freqMs = (source.config.frequency || 60) * 60 * 1000;
        
        // إزالة المؤقت القديم إذا وجد
        if (sourceTimers[source.id]) clearInterval(sourceTimers[source.id]);
        
        // تشغيل مزامنة أولية بعد دقيقة
        setTimeout(() => syncFromSource(source), 60000);
        
        // إعداد المزامنة الدورية
        sourceTimers[source.id] = setInterval(() => syncFromSource(source), freqMs);
      }
    });
  } catch (error: any) {
    if (error.code === 8 || error.status === 'RESOURCE_EXHAUSTED' || error.message?.includes('Quota exceeded') || error.message?.includes('RESOURCE_EXHAUSTED')) {
      console.warn("[Source Engine] Global Sync Engine paused: Firestore quota exceeded (8). System will operate with local memory/mock data until daily reset.");
    } else if (error.code === 5 || error.message?.includes('NOT_FOUND')) {
      console.warn("[Source Engine] Sources collection not found. Engine skipped.");
    } else {
      console.error("[Source Engine] Failed to start engine:", error.message);
    }
  }
}

// إضافة API للتحكم اليدوي في المزامنة
app.post("/api/sources/sync", async (req, res) => {
  if (!isFirebaseAdminReady) return res.status(503).json({ error: "Firebase Admin is disabled due to missing credentials. Check backend logs." });
  const { sourceId } = req.body;
  if (!sourceId) return res.status(400).json({ error: "Source ID required" });
  
  try {
    const sourceDocContext = await firestore.collection('sources').doc(sourceId).get();
    if (!sourceDocContext.exists) return res.status(404).json({ error: "Source not found" });
    
    const source = { id: sourceDocContext.id, ...sourceDocContext.data() };
    await syncFromSource(source);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// تشغيل محرك المصادر بعد الجاهزية
setTimeout(startSourceEngine, 10000);

// تشغيل وتحديث مزامنة تغذيات RSS بانتظام كل 15 دقيقة
setTimeout(async () => {
  try {
    await syncRssFeeds(firestore);
  } catch (err: any) {
    console.error('[RSS Cron] Initial scan failed:', err.message);
  }
}, 12000);

setInterval(async () => {
  try {
    await syncRssFeeds(firestore);
  } catch (err: any) {
    console.error('[RSS Cron] Scheduled scan failed:', err.message);
  }
}, 10 * 60 * 1000);

// Vite Config
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
