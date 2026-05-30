import Parser from 'rss-parser';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { Router } from 'express';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import { GoogleGenAI } from '@google/genai';

// Initialize Gemini for smart sports category tagging
const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build-sports',
    }
  }
}) : null;

// Setup default dynamic RSS sources centered on Google News Sports categories
export interface RssSource {
  id: string;
  name: string;
  url: string; // matches rssUrl
  website?: string;
  logo?: string; // favicon or custom logo
  category: string;
  language: 'ar' | 'en';
  enabled: boolean; // mapped to active
  status: 'ACTIVE' | 'ERROR' | 'PENDING';
  lastSyncedAt?: string; // mapped to lastUpdate
  fetchedCount?: number;
  errorMessage?: string;
  failureCount?: number;
  circuitTripped?: boolean;
  nextRetryTime?: string;
}

export interface NewsArticle {
  id: string; // GUID hash or url slug
  guid?: string;
  title: string;
  description: string;
  content?: string;
  link: string; // matches url
  image: string;
  sourceId: string;
  sourceName: string;
  sourceLogo?: string;
  category: string;
  language: 'ar' | 'en';
  publishedAt: string;
  author?: string;
  createdAt: string;
  tags?: string[];
  views?: number;
  featured?: boolean;
}

// In-Memory Backups (Pre-populated with high-fidelity Google News RSS Sports Topics in Arabic)
export let localSources: RssSource[] = [
  {
    id: 'google_sports_ar',
    name: 'أخبار الرياضة (جوجل)',
    url: 'https://news.google.com/rss/headlines/section/topic/SPORTS?hl=ar&gl=SA&ceid=SA:ar',
    category: 'رياضة',
    language: 'ar',
    enabled: true,
    status: 'ACTIVE',
    fetchedCount: 0
  },
  {
    id: 'google_saudi_league',
    name: 'الدوري السعودي للمحترفين',
    url: 'https://news.google.com/rss/search?q=%D8%A7%D9%84%D8%AF%D9%88%D8%B1%D9%8A+%D8%A7%D9%84%D8%B3%D8%B9%D9%88%D8%AF%D9%8ي&hl=ar&gl=SA&ceid=SA:ar',
    category: 'رياضة',
    language: 'ar',
    enabled: true,
    status: 'ACTIVE',
    fetchedCount: 0
  },
  {
    id: 'google_champions_league',
    name: 'دوري أبطال أوروبا',
    url: 'https://news.google.com/rss/search?q=%D8%AF%D9%88%D8%B1%D9%8A+%D8%A3%D8%A8%D8%B7%D8%A7%D9%84+%D8%A3%D9%88%D8%B1%D9%88%D8%A8%D8%A7&hl=ar&gl=SA&ceid=SA:ar',
    category: 'رياضة',
    language: 'ar',
    enabled: true,
    status: 'ACTIVE',
    fetchedCount: 0
  },
  {
    id: 'google_premier_league',
    name: 'الدوري الإنجليزي الممتاز',
    url: 'https://news.google.com/rss/search?q=%D8%A7%D9%84%D8%AF%D9%88%D8%B1%D9%8A+%D8%A7%D9%84%D8%A5%D9%86%D8%AC%D9%84%D9%8A%D8%B2%D9%8A&hl=ar&gl=SA&ceid=SA:ar',
    category: 'رياضة',
    language: 'ar',
    enabled: true,
    status: 'ACTIVE',
    fetchedCount: 0
  },
  {
    id: 'google_transfers',
    name: 'سوق الانتقالات والميركاتو',
    url: 'https://news.google.com/rss/search?q=%D8%A7%D9%86%D8%AA%D9%82%D8%A7%D9%84%D8%A7%D8%AA&hl=ar&gl=SA&ceid=SA:ar',
    category: 'رياضة',
    language: 'ar',
    enabled: true,
    status: 'ACTIVE',
    fetchedCount: 0
  },
  {
    id: 'google_fifa_news',
    name: 'أخبار الفيفا والمنتخبات',
    url: 'https://news.google.com/rss/search?q=%D8%A7%D9%84%D9%81%D9%8A%D9%81%D8%A7+%D9%81%D9%8A%D9%81%D8%A7&hl=ar&gl=SA&ceid=SA:ar',
    category: 'رياضة',
    language: 'ar',
    enabled: true,
    status: 'ACTIVE',
    fetchedCount: 0
  }
];

export let localArticles: NewsArticle[] = [];

/**
 * 2. Google News URL Link Decoder.
 * Handles Axios redirect, NoScript fallback content extraction, Meta Refresh, & Base64 decoding fallback.
 */
export async function decodeGoogleNewsLink(googleLink: string): Promise<string> {
  if (!googleLink || !googleLink.includes('news.google.com')) {
    return googleLink;
  }
  
  try {
    const res = await axios.get(googleLink, {
      timeout: 4000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8'
      },
      maxRedirects: 4,
      validateStatus: (status) => status < 400
    });
    
    const finalUrl = res.request?.res?.responseUrl || res.config?.url || googleLink;
    if (finalUrl && finalUrl !== googleLink && finalUrl.includes('http')) {
      return finalUrl;
    }

    const $ = cheerio.load(res.data || '');
    const noscriptA = $('noscript a').attr('href');
    if (noscriptA && noscriptA.startsWith('http')) {
      return noscriptA;
    }

    const metaRefresh = $('meta[http-equiv="refresh"]').attr('content');
    if (metaRefresh) {
      const match = metaRefresh.match(/url=(.*)/i);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
  } catch (error: any) {
    if (error.response?.headers?.location) {
      return error.response.headers.location;
    }
  }

  // Base64 protocol buffer parser fallback
  try {
    const urlParts = googleLink.split('/');
    const base64Part = urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2] || '';
    if (base64Part && base64Part.length > 25) {
      const cleanBase64 = base64Part.replace(/[-_]/g, (m) => (m === '-' ? '+' : '/'));
      const buffer = Buffer.from(cleanBase64, 'base64');
      const decodedStr = buffer.toString('utf-8');
      
      const httpMatches = decodedStr.match(/https?:\/\/[^\s\x00-\x1f\x7f-\xff"]+/g);
      if (httpMatches && httpMatches.length > 0) {
        const targetUrl = httpMatches.find(url => !url.includes('news.google.com'));
        if (targetUrl) return targetUrl;
      }
    }
  } catch (_) {}

  return googleLink;
}

/**
 * 3 & 4 & 5. High-fidelity article scraper using cheerio + JSDOM + Mozilla Readability
 * Automatically fetches the decoded link, extracts the OG properties, selects best HD image quality, cleans the layout, and compiles reader HTML body.
 */
export async function extractFullArticle(decodedLink: string): Promise<{
  title: string;
  image: string;
  body: string;
  author: string;
  publishedAt: string;
  sourceName: string;
  videoEmbeds: string[];
  galleryImages: string[];
}> {
  let title = '';
  let image = '';
  let body = '';
  let author = '';
  let publishedAt = '';
  let sourceName = '';
  const videoEmbeds: string[] = [];
  const galleryImages: string[] = [];

  try {
    const res = await axios.get(decodedLink, {
      timeout: 6000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache'
      }
    });

    if (res.status === 200 && res.data) {
      const html = res.data;
      const $ = cheerio.load(html);

      // Smart Image Fetch: Read Open Graph tags first which contain HD values
      image = $('meta[property="og:image"]').attr('content') ||
              $('meta[name="twitter:image"]').attr('content') ||
              $('meta[property="og:image:secure_url"]').attr('content') ||
              '';

      title = $('meta[property="og:title"]').attr('content') || 
              $('title').text().replace(/[\r\n\t]/g, '').trim() ||
              '';

      author = $('meta[property="article:author"]').attr('content') ||
               $('meta[name="author"]').attr('content') ||
               '';

      publishedAt = $('meta[property="article:published_time"]').attr('content') ||
                    $('meta[name="pubdate"]').attr('content') ||
                    new Date().toISOString();

      try {
        const urlObj = new URL(decodedLink);
        sourceName = $('meta[property="og:site_name"]').attr('content') || 
                     urlObj.hostname.replace('www.', '') || 
                     '';
      } catch (_) {
        sourceName = 'صحيفة رياضية';
      }

      // Video embed extraction
      $('iframe[src*="youtube.com"], iframe[src*="vimeo.com"], iframe[src*="twitter.com"], iframe[src*="facebook.com"]').each((_, elem) => {
        const src = $(elem).attr('src');
        if (src) videoEmbeds.push(src);
      });

      // Mozilla Readability parsing
      const dom = new JSDOM(html, { url: decodedLink });
      const reader = new Readability(dom.window.document);
      const parsedArticle = reader.parse();

      if (parsedArticle) {
        title = parsedArticle.title || title;
        body = parsedArticle.content; // pristine, pre-cleaned HTML reader body
        author = parsedArticle.byline || author;
        sourceName = parsedArticle.siteName || sourceName;
        
        // Gallery images
        const body$ = cheerio.load(parsedArticle.content);
        body$('img').each((_, img) => {
          const src = $(img).attr('src');
          if (src && src.startsWith('http') && src !== image) {
            galleryImages.push(src);
          }
        });
      }

      // Smart Image Fetch: Fallback to first prominent page image if no OG image
      if (!image) {
        $('img').each((_, img) => {
          const src = $(img).attr('src') || $(img).attr('data-src');
          const width = parseInt($(img).attr('width') || '0', 10);
          const height = parseInt($(img).attr('height') || '0', 10);
          
          if (src && src.startsWith('http') && !src.includes('avatar') && !src.includes('logo') && !src.includes('icon') && !src.includes('pixel')) {
            if (width > 200 || height > 200 || (!width && !height)) {
              image = src;
              return false; // break loop
            }
          }
        });
      }
    }
  } catch (ex: any) {
    console.warn(`[Readability Extrator] Failed to read full body from ${decodedLink}: ${ex.message}`);
  }

  // Double sanitize reader body content from potential ads/tracking scripts
  if (body) {
    const body$ = cheerio.load(body);
    body$('script, style, iframe, noscript, form, input, select, textarea, [class*="advert"], [id*="advert"], [class*="popup"], [class*="share"], .wp-block-embed').remove();
    body = body$.html();
  }

  return {
    title: title.trim(),
    image: image || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=800', // Default gorgeous soccer stadium HD
    body: body || '<p>عذرًا، تعذر سحب النص الكامل لهذا المقال تلقائيًا بسبب جدار حماية المصدر الأصلي.</p>',
    author: author || 'محرر جوجل نيوز',
    publishedAt: publishedAt || new Date().toISOString(),
    sourceName: sourceName || 'صحيفة رياضية',
    videoEmbeds,
    galleryImages: galleryImages.slice(0, 6)
  };
}

/**
 * 6. Sports AI Categorization using process.env.GEMINI_API_KEY
 * Categorizes incoming news directly into:
 * [كرة قدم, انتقالات, بطولات, منتخبات, دوري محلي, دوري عالمي, فيديو, إصابات, نتائج]
 */
export async function classifySportsArticleWithAI(title: string, description: string): Promise<string> {
  const categories = [
    'كرة قدم', 'انتقالات', 'بطولات', 'منتخبات', 
    'دوري محلي', 'دوري عالمي', 'فيديو', 'إصابات', 'نتائج'
  ];
  
  // Intelligent keywords lookup fallback engine
  const text = (title + ' ' + description).toLowerCase();
  let defaultCategory = 'كرة قدم';
  
  if (text.includes('انتقال') || text.includes('صفقة') || text.includes('يوقع') || text.includes('ميركاتو') || text.includes('تعاقد') || text.includes('توقيع')) {
    defaultCategory = 'انتقالات';
  } else if (text.includes('كأس') || text.includes('بطولة') || text.includes('دوري الكأس') || text.includes('الأبطال') || text.includes('أبطال')) {
    defaultCategory = 'بطولات';
  } else if (text.includes('منتخب') || text.includes('الفرعون') || text.includes('الأخضر') || text.includes('السامبا') || text.includes('الوطني')) {
    defaultCategory = 'منتخبات';
  } else if (text.includes('الدوري السعودي') || text.includes('دوري روشن') || text.includes('روشن') || text.includes('الهلال') || text.includes('النصر') || text.includes('الاتحاد') || text.includes('الأهلي')) {
    defaultCategory = 'دوري محلي';
  } else if (text.includes('الدوري الإنجليزي') || text.includes('الدوري الإسباني') || text.includes('الدوري الإيطالي') || text.includes('البريميرليغ') || text.includes('البريميرليج') || text.includes('لاليغا') || text.includes('مدريد') || text.includes('برشلونة') || text.includes('السيتي') || text.includes('يونايتيد') || text.includes('ليفربول')) {
    defaultCategory = 'دوري عالمي';
  } else if (text.includes('إصابة') || text.includes('رباط صليبي') || text.includes('مستشفى') || text.includes('غائب') || text.includes('يغيب') || text.includes('إصابات')) {
    defaultCategory = 'إصابات';
  } else if (text.includes('فيديو') || text.includes('ملخص') || text.includes('أهداف المباراة') || text.includes('مقطع') || text.includes('لقطات')) {
    defaultCategory = 'فيديو';
  } else if (text.includes('نتيجة') || text.includes('فاز') || text.includes('خسر') || text.includes('تعادل') || text.includes('ترتيب') || text.includes('أهداف')) {
    defaultCategory = 'نتائج';
  }

  if (!ai) {
    return defaultCategory;
  }

  try {
    const prompt = `صنف الخبر الرياضي التالي إلى فئة واحدة فقط مقتبسة من القائمة المتاحة.
    العنوان: "${title}"
    الوصف: "${description}"
    
    القائمة المتاحة للفئات الحصرية:
    [كرة قدم, انتقالات, بطولات, منتخبات, دوري محلي, دوري عالمي, فيديو, إصابات, نتائج]
    
    الرد المطلوب:
    - اكتب اسم الفئة كما هي تماماً من القائمة، دون أي كلمة إضافية، دون علامات ترقيم، دون شرح.`;

    const result = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });
    
    const aiCategory = result.text.trim().replace(/['"\[\]\.]/g, '');
    if (categories.includes(aiCategory)) {
      return aiCategory;
    }
    return defaultCategory;
  } catch (err) {
    return defaultCategory;
  }
}

/**
 * 7. Title Similarity Detection Helper for Duplicate Prevention
 */
export function areTitlesSimilar(title1: string, title2: string): boolean {
  if (!title1 || !title2) return false;
  
  const cleanStr = (str: string) => str.toLowerCase()
    .replace(/[^\u0621-\u064A\d\s]/g, '') // Keep Arabic characters and Arabic digits + spaces
    .split(/\s+/)
    .filter(w => w.length > 2);

  const words1 = cleanStr(title1);
  const words2 = cleanStr(title2);
  
  if (words1.length === 0 || words2.length === 0) return false;
  
  let matchCount = 0;
  for (const word of words1) {
    if (words2.includes(word)) {
      matchCount++;
    }
  }
  
  const similarityRatio = matchCount / Math.min(words1.length, words2.length);
  return similarityRatio > 0.70; // 70% matching words represents duplicate news
}

// Helper to extract image from RSS Item tags or HTML body
async function extractImage(item: any, itemLink: string): Promise<string> {
  // 1. Check common RSS image tags
  if (item.enclosure?.url) return item.enclosure.url;
  if (item.mediaContent?.url) return item.mediaContent.url;
  if (item.image?.url) return item.image.url;
  if (item['media:content']?.$?.url) return item['media:content'].$.url;
  if (item['media:thumbnail']?.$?.url) return item['media:thumbnail'].$.url;

  // 1b. Check if description/content contains img tag
  const searchHtml = (item.content || item.contentSnippet || item.description || '');
  if (searchHtml && searchHtml.includes('<img')) {
    try {
      const $ = cheerio.load(searchHtml);
      const imgUrl = $('img').first().attr('src');
      if (imgUrl && imgUrl.startsWith('http')) return imgUrl;
    } catch (_) {}
  }

  // 2. Fallback to scraping webpage Open Graph tags
  if (itemLink && itemLink.startsWith('http')) {
    try {
      // Set reasonable fetch configuration (timeout 2.5s)
      const res = await axios.get(itemLink, {
        timeout: 3000,
        headers: {
          'User-Agent': 'Mozilla/5.5 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36'
        }
      });
      if (res.status === 200 && res.data) {
        const $ = cheerio.load(res.data);
        const ogImage = $('meta[property="og:image"]').attr('content') ||
                        $('meta[name="twitter:image"]').attr('content') ||
                        $('meta[property="og:image:secure_url"]').attr('content');
        if (ogImage && ogImage.startsWith('http')) {
          return ogImage;
        }

        // Try extracting first prominent page banner
        const bodyImages = $('article img, .content img, main img');
        for (let i = 0; i < Math.min(bodyImages.length, 3); i++) {
          const src = $(bodyImages[i]).attr('src');
          if (src && src.startsWith('http')) {
            return src;
          }
        }
      }
    } catch (_) {
      // Crawling failed, ignore and drop below to category fallback templates
    }
  }

  // 3. Last fallback matching beautiful high quality category images
  const cat = String(item.category || '').toLowerCase();
  if (cat.includes('tech') || cat.includes('تقني')) {
    return 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=800';
  }
  if (cat.includes('sport') || cat.includes('رياض')) {
    return 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=800';
  }
  if (cat.includes('polit') || cat.includes('سيا')) {
    return 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?q=80&w=800';
  }
  return 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=800';
}

/**
 * Dynamic content-type robust reader that fetches and decodes external XML feeds safely.
 * This helper resolves common User-Agent block lists (yielding 403/404) by sending matching desktop browser credentials first.
 */
async function fetchAndParseRss(url: string, parserInstance: Parser): Promise<any> {
  const customHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'application/rss+xml, application/xml, text/xml, application/xhtml+xml, text/html, */*',
    'Accept-Language': 'ar,en-SA;q=0.9,ar;q=0.8,en-US;q=0.7,en;q=0.6',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Referer': 'https://www.google.com/'
  };

  let primaryError: Error | null = null;

  try {
    const res = await axios.get(url, {
      timeout: 8000,
      headers: customHeaders,
      validateStatus: (status) => status === 200
    });

    if (res.data) {
      try {
        return await parserInstance.parseString(res.data);
      } catch (parseStringErr: any) {
        throw new Error(`XML/RSS parsing failed for fetched text contents on ${url}: ${parseStringErr.message}`);
      }
    }
    throw new Error(`Empty response payload returned from server at ${url}`);
  } catch (err: any) {
    let statusCode = 0;
    let statusText = '';

    if (axios.isAxiosError(err)) {
      statusCode = err.response?.status || 0;
      statusText = err.response?.statusText || '';

      if (statusCode === 404) {
        primaryError = new Error(`HTTP 404 (Not Found): The RSS feed address does not exist or has been permanently deleted (${url}).`);
      } else if (statusCode === 403) {
        primaryError = new Error(`HTTP 403 (Forbidden): Resource block or crawler protection occurred (${url}).`);
      } else if (statusCode > 0) {
        primaryError = new Error(`HTTP Error ${statusCode} (${statusText}): Server failed to render feed from ${url}.`);
      } else {
        primaryError = new Error(`Network Communication Error: ${err.message || 'connection failed'} at ${url}`);
      }
    } else {
      primaryError = new Error(err.message || `Primary source fetching failed for ${url}`);
    }

    // Try standard direct parser.parseURL fallback
    try {
      console.info(`[RSS Engine] Primary fetch failed. Trying direct parser.parseURL fallback for: ${url}`);
      return await parserInstance.parseURL(url);
    } catch (directErr: any) {
      let detailedMsg = `XML Parser helper failed. `;
      if (primaryError) {
        detailedMsg += `Primary request details: ${primaryError.message} `;
      }
      if (directErr.status) {
        detailedMsg += `Fallback request status code: ${directErr.status}. `;
      }
      detailedMsg += `Parser error message: ${directErr.message}`;
      throw new Error(detailedMsg);
    }
  }
}

/**
 * Perform sync fetching across all active Google News feeds and aggregate complete publisher articles.
 */
export async function syncRssFeeds(firestoreInstance?: any) {
  console.log('[RSS Engine] Synchronizing active Google News RSS sports sources...');
  const rssParser = new Parser({
    customFields: {
      item: [
        ['media:content', 'mediaContent'],
        ['enclosure', 'enclosure'],
        ['media:thumbnail', 'mediaThumbnail']
      ]
    }
  });

  // 1. Retrieve list of feeds matching Google News setup
  let activeFeeds = [...localSources];
  if (firestoreInstance) {
    try {
      const snap = await firestoreInstance.collection('rss_sources').get();
      if (!snap.empty) {
        activeFeeds = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
        localSources = [...activeFeeds];
      } else {
        // Initialize firestore with default sources
        for (const fs of localSources) {
          await firestoreInstance.collection('rss_sources').doc(fs.id).set(fs);
        }
      }
    } catch (dbErr) {
      console.warn('[RSS Engine] Firestore access restricted or quota exhausted. Using local RAM sources fallback.');
    }
  }

  let totalScraped = 0;

  for (const source of activeFeeds) {
    if (!source.enabled) continue;

    // Circuit Breaker check: Skip source if circuit is tripped and cooling-down
    if (source.circuitTripped && source.nextRetryTime) {
      const waitTill = new Date(source.nextRetryTime);
      if (waitTill > new Date()) {
        console.warn(`[RSS Engine] Circuit Breaker [OPEN] for "${source.name}". Skipping fetch because it has failed consecutive times (${source.failureCount}). Cooldown active until: ${source.nextRetryTime}`);
        continue;
      } else {
        console.info(`[RSS Engine] Circuit Breaker [HALF-OPEN] for "${source.name}". Cooldown expired, attempting retry...`);
      }
    }

    // Robust Pre-flight URL self-healing for popular Arabic news sources typed incorrectly (like Sky News)
    if (source.url && source.url.includes('skynewsarabia.com')) {
      let correctedUrl = source.url;
      if (source.url.includes('/feed/rss.xml') || source.url.endsWith('/rss.xml') || source.url.includes('/feed/')) {
        const lowerName = (source.name || '').toLowerCase();
        if (lowerName.includes('رياض') || lowerName.includes('sport') || source.category === 'رياضة') {
          correctedUrl = 'https://www.skynewsarabia.com/rss/v1/sport.xml';
        } else {
          correctedUrl = 'https://www.skynewsarabia.com/rss/v1/news.xml';
        }
      }
      
      if (source.url !== correctedUrl) {
        console.info(`[RSS Engine] Pre-flight self-heal: Corrected Sky News Arabia feed URL for "${source.name}" from ${source.url} to ${correctedUrl}`);
        source.url = correctedUrl;
        if (firestoreInstance) {
          try {
            await firestoreInstance.collection('rss_sources').doc(source.id).update({
              url: correctedUrl,
              errorMessage: null,
              status: 'ACTIVE'
            });
          } catch (dbErr: any) {
            console.warn(`[RSS Engine] Pre-flight update Firestore failed: ${dbErr.message}`);
          }
        }
      }
    }

    console.log(`[RSS Engine] Parsing Google News Feed: ${source.url} (${source.name})`);
    
    let computedLogo = source.logo;
    let computedWeb = source.website;
    try {
      const urlObj = new URL(source.url);
      if (!computedWeb) computedWeb = urlObj.origin;
      if (!computedLogo) computedLogo = `https://www.google.com/s2/favicons?sz=64&domain=${urlObj.hostname}`;
    } catch (_) {
      if (!computedLogo) computedLogo = 'https://news.google.com/favicon.ico';
    }

    let itemsToProcess: any[] = [];
    let scraperUsed = false;
    let syncError: string | null = null;

    try {
      const feed = await fetchAndParseRss(source.url, rssParser);
      itemsToProcess = (feed.items || []).slice(0, 3); // Process top 3 newest items to reduce AI and Firestore quota overhead
    } catch (err: any) {
      console.warn(`[RSS Engine] Primary RSS feed failed for "${source.name}" (${source.url}): ${err.message}. Trying Google News RSS Search fallback...`);
      try {
        const fallbackUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(source.name)}&hl=ar&gl=SA&ceid=SA:ar`;
        const feed = await fetchAndParseRss(fallbackUrl, rssParser);
        itemsToProcess = (feed.items || []).slice(0, 3);
        console.info(`[RSS Engine] Fallback succeeded. Loaded ${itemsToProcess.length} news items for "${source.name}" via Google News Search.`);
        
        // Self-heal: update source configurations to use the robust Google News URL
        source.url = fallbackUrl;
        if (firestoreInstance) {
          try {
            await firestoreInstance.collection('rss_sources').doc(source.id).update({
              url: fallbackUrl,
              errorMessage: null,
              status: 'ACTIVE'
            });
          } catch (_) {}
        }
      } catch (fallbackErr: any) {
        console.error(`[RSS Engine] Google News direct parser failed for ${source.name}: ${fallbackErr.message || err.message}.`);
        syncError = `RSS Google News parser error: ${fallbackErr.message || err.message}`;
      }
    }

    let count = 0;
    const batch = firestoreInstance ? firestoreInstance.batch() : null;
    let batchCount = 0;
    
    try {
      for (const item of itemsToProcess) {
        if (!item.title || !item.link) continue;

        // 2 & 2b. Decode Google News redirect link to retrieve real publisher link
        const decodedPublisherLink = await decodeGoogleNewsLink(item.link);

        // Standardize article mapping identifier purely on publisher original URL
        const uniqueId = decodedPublisherLink;
        const articleId = Buffer.from(uniqueId).toString('base64').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 60);

        // 7. Duplicate Prevention Check Part A: Identifier hash logic
        let alreadyExists = false;
        if (firestoreInstance) {
          try {
            const docRef = firestoreInstance.collection('rss_news').doc(articleId);
            const docSnap = await docRef.get();
            if (docSnap.exists) {
              alreadyExists = true;
            }
          } catch (_) {
            alreadyExists = localArticles.some(a => a.id === articleId || a.link === decodedPublisherLink);
          }
        } else {
          alreadyExists = localArticles.some(a => a.id === articleId || a.link === decodedPublisherLink);
        }

        if (alreadyExists) continue;

        // Deduplication Check Part B: Semantic Title similarity to eliminate redundant press coverages
        const titleDuplicate = localArticles.some(a => areTitlesSimilar(a.title, item.title));
        if (titleDuplicate) {
          console.log(`[RSS Engine] Skipping duplicate coverage: "${item.title}"`);
          continue;
        }

        const typedItem = item as any;

        // 3 & 4. Extract Real Article Body, HD quality thumbnail, gallery, video embeds
        console.log(`[RSS Extractor] Extracting publisher content from: ${decodedPublisherLink}`);
        const extracted = await extractFullArticle(decodedPublisherLink);

        // 6. Sports AI Categorization using Google Gemini (with fallbacks)
        const classifiedCategory = await classifySportsArticleWithAI(extracted.title || item.title, extracted.body);

        // Build brief description teaser
        let desc = extracted.body.replace(/<[^>]*>/g, '').trim();
        if (desc.length > 250) {
          desc = desc.substring(0, 250) + '...';
        } else if (!desc) {
          desc = typedItem.contentSnippet || typedItem.summary || typedItem.description || '';
          desc = desc.replace(/<[^>]*>/g, '').trim();
          if (desc.length > 250) desc = desc.substring(0, 250) + '...';
        }

        const newArticle: NewsArticle = {
          id: articleId,
          guid: typedItem.guid || typedItem.link,
          title: extracted.title || typedItem.title,
          description: desc,
          content: extracted.body, // full cleaned reader mode body HTML
          link: decodedPublisherLink,
          image: extracted.image || typedItem.image || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=800',
          sourceId: source.id,
          sourceName: extracted.sourceName || source.name,
          sourceLogo: `https://www.google.com/s2/favicons?sz=64&domain=${new URL(decodedPublisherLink).hostname}`,
          category: classifiedCategory,
          language: source.language || 'ar',
          publishedAt: extracted.publishedAt || typedItem.isoDate || typedItem.pubDate || new Date().toISOString(),
          author: extracted.author || typedItem.creator || typedItem.author || source.name,
          createdAt: new Date().toISOString(),
          views: 0,
          featured: Math.random() > 0.82, // Automatically feature new articles
          tags: [classifiedCategory]
        };

        // Persist article locally or stage onto Firestore database batch
        if (firestoreInstance && batch) {
          try {
            const docRef = firestoreInstance.collection('rss_news').doc(articleId);
            batch.set(docRef, newArticle);
            batchCount++;
            count++;
          } catch (e: any) {
            localArticles.unshift(newArticle);
            count++;
          }
        } else {
          localArticles.unshift(newArticle);
          count++;
        }
      }

      // Commit the batched write at once if there are staged news articles
      if (firestoreInstance && batch && batchCount > 0) {
        await batch.commit().catch(e => console.error('[RSS Engine] Staging commit failed:', e.message));
        console.log(`[RSS Engine] Committed ${batchCount} articles to Firestore via single batch write.`);
      }

      totalScraped += count;

      // Persist source metadata
      const currentFailCount = syncError ? (source.failureCount || 0) + 1 : 0;
      const isTripped = syncError ? (currentFailCount >= 3) : false;
      const nextTime = isTripped ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : null;

      const feedStat = {
        status: syncError ? 'ERROR' as const : 'ACTIVE' as const,
        lastSyncedAt: new Date().toISOString(),
        fetchedCount: count,
        errorMessage: syncError,
        website: computedWeb,
        logo: computedLogo,
        failureCount: currentFailCount,
        circuitTripped: isTripped,
        nextRetryTime: nextTime
      };

      if (firestoreInstance) {
        try {
          await firestoreInstance.collection('rss_sources').doc(source.id).update(feedStat);
        } catch (_) {}
      }
      
      const index = localSources.findIndex(s => s.id === source.id);
      if (index !== -1) {
        localSources[index] = { ...localSources[index], ...feedStat };
      }

      console.log(`[RSS Engine] Sync resolved ${count} articles for ${source.name}`);

    } catch (err: any) {
      console.error(`[RSS Engine] Iteration fail on ${source.name}: ${err.message}`);
      const currentFailCount = (source.failureCount || 0) + 1;
      const isTripped = currentFailCount >= 3;
      const nextTime = isTripped ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : null;

      const feedStat = {
        status: 'ERROR' as const,
        lastSyncedAt: new Date().toISOString(),
        fetchedCount: 0,
        errorMessage: err.message,
        failureCount: currentFailCount,
        circuitTripped: isTripped,
        nextRetryTime: nextTime
      };

      if (firestoreInstance) {
        try {
          await firestoreInstance.collection('rss_sources').doc(source.id).update(feedStat);
        } catch (_) {}
      }

      const index = localSources.findIndex(s => s.id === source.id);
      if (index !== -1) {
        localSources[index] = { ...localSources[index], ...feedStat };
      }
    }
  }

  // Cap local array storage limits
  if (localArticles.length > 250) {
    localArticles = localArticles.slice(0, 200);
  }

  console.log(`[RSS Engine] Completed RSS sync cycle. Loaded: ${totalScraped}`);
}

/**
 * Main Dynamic RSS Feed Endpoint Router
 */
export function setupRssRouter(firestoreInstance?: any): Router {
  const router = Router();

  // GET /api/news - Get articles with filters & lazy loading
  router.get('/news', async (req, res) => {
    try {
      const category = req.query.category as string;
      const sourceId = req.query.sourceId as string;
      const search = req.query.search as string;
      const language = req.query.language as string;
      const limit = parseInt(req.query.limit as string || '15', 10);
      const page = parseInt(req.query.page as string || '1', 10);

      let articles: NewsArticle[] = [];

      if (firestoreInstance) {
        try {
          let query = firestoreInstance.collection('rss_news');
          
          if (category && category !== 'الكل') {
            query = query.where('category', '==', category);
          }
          if (sourceId) {
            query = query.where('sourceId', '==', sourceId);
          }
          if (language) {
            query = query.where('language', '==', language);
          }

          const snap = await query.orderBy('publishedAt', 'desc').limit(100).get();
          if (!snap.empty) {
            articles = snap.docs.map((d: any) => d.data() as NewsArticle);
          } else {
            articles = [...localArticles];
          }
        } catch (dbErr) {
          articles = [...localArticles];
        }
      } else {
        articles = [...localArticles];
      }

      // 1. Filter locally if search query or fallback was active
      if (category && category !== 'الكل') {
        articles = articles.filter(a => a.category === category);
      }
      if (sourceId) {
        articles = articles.filter(a => a.sourceId === sourceId);
      }
      if (language) {
        articles = articles.filter(a => a.language === language);
      }
      if (search) {
        const queryNorm = search.toLowerCase();
        articles = articles.filter(a => 
          a.title.toLowerCase().includes(queryNorm) || 
          (a.description && a.description.toLowerCase().includes(queryNorm))
        );
      }

      // Sort by date descending
      articles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

      // Simple slice pagination
      const total = articles.length;
      const startIndex = (page - 1) * limit;
      const paginatedData = articles.slice(startIndex, startIndex + limit);

      res.json({
        success: true,
        total,
        page,
        limit,
        data: paginatedData
      });

    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // GET /api/news/latest - Fetch latest headlines
  router.get('/news/latest', async (req, res) => {
    try {
      const count = parseInt(req.query.count as string || '6', 10);
      let articles: NewsArticle[] = [];

      if (firestoreInstance) {
        try {
          const snap = await firestoreInstance.collection('rss_news')
            .orderBy('publishedAt', 'desc')
            .limit(count)
            .get();
          if (!snap.empty) {
            articles = snap.docs.map((d: any) => d.data() as NewsArticle);
          } else {
            articles = [...localArticles];
          }
        } catch (_) {
          articles = [...localArticles];
        }
      } else {
        articles = [...localArticles];
      }

      articles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
      res.json({ success: true, count: articles.length, data: articles.slice(0, count) });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // GET /api/news/source/:id - Find articles on specific source
  router.get('/news/source/:id', async (req, res) => {
    try {
      const { id } = req.params;
      let articles: NewsArticle[] = [];

      if (firestoreInstance) {
        try {
          const snap = await firestoreInstance.collection('rss_news')
            .where('sourceId', '==', id)
            .orderBy('publishedAt', 'desc')
            .get();
          if (!snap.empty) {
            articles = snap.docs.map((d: any) => d.data() as NewsArticle);
          } else {
            articles = localArticles.filter(a => a.sourceId === id);
          }
        } catch (_) {
          articles = localArticles.filter(a => a.sourceId === id);
        }
      } else {
        articles = localArticles.filter(a => a.sourceId === id);
      }

      articles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
      res.json({ success: true, count: articles.length, data: articles });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // GET /api/news/sources - Find lists of active feeds
  router.get('/news/sources', async (req, res) => {
    try {
      let sources = [...localSources];
      if (firestoreInstance) {
        try {
          const snap = await firestoreInstance.collection('rss_sources').get();
          if (!snap.empty) {
            sources = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
            localSources = [...sources];
          }
        } catch (_) {}
      }
      res.json({ success: true, count: sources.length, data: sources });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // POST /api/news/sources - Create a new feed
  router.post('/news/sources', async (req, res) => {
    try {
      const { name, url, category, language } = req.body;
      if (!name || !url) {
        return res.status(400).json({ success: false, message: 'الاسم والرابط حقول إلزامية.' });
      }

      const id = name.trim().replace(/[^a-zA-Z0-9]/g, '_').toLowerCase() + '_' + Math.floor(Math.random() * 1000);
      const newSource: RssSource = {
        id,
        name,
        url,
        category: category || 'عام',
        language: language || 'ar',
        enabled: true,
        status: 'PENDING',
        fetchedCount: 0
      };

      if (firestoreInstance) {
        try {
          await firestoreInstance.collection('rss_sources').doc(id).set(newSource);
        } catch (_) {}
      }

      localSources.push(newSource);

      // Trigger asynchronous scan for this new feed specifically so user sees count instantly
      try {
        const parserObj = new Parser();
        const testFeed = await fetchAndParseRss(url, parserObj);
        newSource.status = 'ACTIVE';
        newSource.fetchedCount = testFeed.items?.length || 0;
        newSource.lastSyncedAt = new Date().toISOString();
        
        if (firestoreInstance) {
          try {
            await firestoreInstance.collection('rss_sources').doc(id).set(newSource);
          } catch (_) {}
        }
      } catch (e: any) {
        newSource.status = 'ERROR';
        newSource.errorMessage = e.message;
      }

      res.status(201).json({ success: true, data: newSource });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // PUT /api/news/sources/:id - Update dynamic configuration
  router.put('/news/sources/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { name, category, language, enabled } = req.body;

      const idx = localSources.findIndex(s => s.id === id);
      if (idx === -1) {
        return res.status(404).json({ success: false, message: 'مصدر البث غير موجود.' });
      }

      const updated = {
        ...localSources[idx],
        ...(name !== undefined && { name }),
        ...(category !== undefined && { category }),
        ...(language !== undefined && { language }),
        ...(enabled !== undefined && { enabled })
      };

      if (firestoreInstance) {
        try {
          await firestoreInstance.collection('rss_sources').doc(id).update(updated);
        } catch (_) {}
      }

      localSources[idx] = updated;
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // DELETE /api/news/sources/:id - Delete a feed source
  router.delete('/news/sources/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const idx = localSources.findIndex(s => s.id === id);
      if (idx === -1) {
        return res.status(404).json({ success: false, message: 'المصدر غير موجود.' });
      }

      if (firestoreInstance) {
        try {
          await firestoreInstance.collection('rss_sources').doc(id).delete();
          // Optional: Clean up associated news under that source as well
          const matchNews = await firestoreInstance.collection('rss_news').where('sourceId', '==', id).get();
          if (!matchNews.empty) {
            const batch = firestoreInstance.batch();
            matchNews.docs.forEach((d: any) => batch.delete(d.ref));
            await batch.commit();
          }
        } catch (_) {}
      }

      localSources.splice(idx, 1);
      localArticles = localArticles.filter(a => a.sourceId !== id);

      res.json({ success: true, message: 'تم إزالة مصدر RSS الإخباري بنجاح.' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // POST /api/news/sources/test - Probe raw feed URL and test response latency
  router.post('/news/sources/test', async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ success: false, message: 'رابط تغذية RSS مطلوب.' });
      }

      const testParser = new Parser();
      console.log(`[RSS Engine] Probing connectivity to link: ${url}`);
      
      const parsedFeed = await fetchAndParseRss(url, testParser);
      res.json({
        success: true,
        title: parsedFeed.title,
        description: parsedFeed.description,
        itemsCount: parsedFeed.items?.length || 0,
        sampleItem: parsedFeed.items?.[0] ? {
          title: parsedFeed.items[0].title,
          link: parsedFeed.items[0].link,
          pubDate: parsedFeed.items[0].pubDate || parsedFeed.items[0].isoDate
        } : null
      });

    } catch (err: any) {
      res.json({
        success: false,
        message: `فشل التحقق من الرابط: ${err.message}`
      });
    }
  });

  // POST /api/news/sync - Admin trigger reload cycle
  router.post('/news/sync', async (req, res) => {
    try {
      await syncRssFeeds(firestoreInstance);
      res.json({ success: true, message: 'تم إعادة مزامنة جميع مصادر الأخبار بنجاح.' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // GET /api/news/article-full - Extract web scraped parsed content with ads cleaning using readability + jsdom
  router.get('/news/article-full', async (req, res) => {
    try {
      const { id, link } = req.query;
      if (!link) {
        return res.status(400).json({ success: false, message: 'رابط الخبر مطلوب.' });
      }

      const decodedLink = decodeURIComponent(link as string);
      console.log(`[RSS Extractor] Parsing full article dynamically: ${decodedLink}`);

      // Incremental view registration
      if (id) {
        const artId = id as string;
        try {
          const lIdx = localArticles.findIndex(a => a.id === artId);
          if (lIdx !== -1) {
            localArticles[lIdx].views = (localArticles[lIdx].views || 0) + 1;
          }
          if (firestoreInstance) {
            const docRef = firestoreInstance.collection('rss_news').doc(artId);
            const docSnap = await docRef.get();
            if (docSnap.exists) {
              const currentViews = docSnap.data().views || 0;
              await docRef.update({ views: currentViews + 1 });
            }
          }
        } catch (_) {}
      }

      // Check if we already have it in local memory or Firestore with full context
      let cachedArticle: NewsArticle | undefined;
      if (id) {
        cachedArticle = localArticles.find(a => a.id === id);
        if (!cachedArticle && firestoreInstance) {
          try {
            const snap = await firestoreInstance.collection('rss_news').doc(id as string).get();
            if (snap.exists) {
              cachedArticle = snap.data() as NewsArticle;
            }
          } catch (_) {}
        }
      }

      // Extract full article using Mozilla Readability
      const extracted = await extractFullArticle(decodedLink);

      // Mix in any cached titles or high-res imagery if readability got empty
      const title = extracted.title || cachedArticle?.title || 'مقال رياضي';
      const image = extracted.image || cachedArticle?.image || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=800';
      const body = extracted.body || (cachedArticle ? `<p>${cachedArticle.description}</p><p>${cachedArticle.content || ''}</p>` : null) || '<p>عفوًا، لم نتمكن من جلب تفاصيل هذا الخبر لقواعد جدار الحماية للمصدر.</p>';

      res.json({
        success: true,
        title,
        image,
        body,
        videoEmbeds: extracted.videoEmbeds,
        galleryImages: extracted.galleryImages,
        link: decodedLink,
        sourceName: extracted.sourceName,
        author: extracted.author,
        publishedAt: extracted.publishedAt || cachedArticle?.publishedAt
      });

    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // PUT /api/news/articles/:id - Admin manually edit article fields
  router.put('/news/articles/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { title, description, category, language, image } = req.body;

      let found = false;
      const idx = localArticles.findIndex(a => a.id === id);
      if (idx !== -1) {
        localArticles[idx] = {
          ...localArticles[idx],
          ...(title && { title }),
          ...(description !== undefined && { description }),
          ...(category && { category }),
          ...(language && { language }),
          ...(image && { image })
        };
        found = true;
      }

      if (firestoreInstance) {
        try {
          const docRef = firestoreInstance.collection('rss_news').doc(id);
          const docSnap = await docRef.get();
          if (docSnap.exists) {
            await docRef.update({
              ...(title && { title }),
              ...(description !== undefined && { description }),
              ...(category && { category }),
              ...(language && { language }),
              ...(image && { image })
            });
            found = true;
          }
        } catch (_) {}
      }

      if (!found) {
        return res.status(404).json({ success: false, message: 'مقال الخبر غير موجود.' });
      }

      res.json({ success: true, message: 'تم تحديث البيانات بنجاح.' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // DELETE /api/news/articles/:id - Admin delete news article
  router.delete('/news/articles/:id', async (req, res) => {
    try {
      const { id } = req.params;
      localArticles = localArticles.filter(a => a.id !== id);

      if (firestoreInstance) {
        try {
          await firestoreInstance.collection('rss_news').doc(id).delete();
        } catch (_) {}
      }

      res.json({ success: true, message: 'تم حذف المقال الإخباري بنجاح.' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // POST /api/news/articles/:id/toggle-feature - Pin / Unpin article to Featured Carousel
  router.post('/news/articles/:id/toggle-feature', async (req, res) => {
    try {
      const { id } = req.params;
      let newFeatured = false;

      const idx = localArticles.findIndex(a => a.id === id);
      if (idx !== -1) {
        localArticles[idx].featured = !localArticles[idx].featured;
        newFeatured = !!localArticles[idx].featured;
      }

      if (firestoreInstance) {
        try {
          const docRef = firestoreInstance.collection('rss_news').doc(id);
          const docSnap = await docRef.get();
          if (docSnap.exists) {
            newFeatured = !docSnap.data().featured;
            await docRef.update({ featured: newFeatured });
          }
        } catch (_) {}
      }

      res.json({ success: true, featured: newFeatured, message: 'تم تعديل حالة تثبيت الخبر.' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  return router;
}
