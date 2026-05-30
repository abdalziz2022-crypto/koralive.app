import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Image, 
  Pressable, 
  ScrollView, 
  Modal, 
  Share, 
  Platform,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { Share2, Clock, Eye, X, BookOpen } from 'lucide-react-native';

const NEWS_MOCK = [
  {
    id: "news-1",
    title: "رسمياً: الهلال يحسم صفقة الموسم ويتعاقد مع نجم خط الوسط الجديد كبديل لنيمار المصاب",
    creator: "قسم الأخبار السعودية",
    source: "في المرمى",
    pubDate: "منذ ساعة",
    imageUrl: "https://media.api-sports.io/football/teams/2939.png",
    contentSnippet: "أعلن نادي الهلال السعودي رسمياً عبر حسابه الرسمي عن اتمام صفقة انتقال مميزة لتعزيز صفوفه في بطولة النخبة الآسيوية ودوري روشن للمحترفين...",
    content: "أعلن نادي الهلال السعودي رسمياً عبر حساباته الرسمية على مواقع التواصل الاجتماعي عن إتمام التوقيع مع صانع الألعاب الدولي بعد مفاوضات ماراثونية دامت أكثر من أسبوعين. يأتي هذا القرار الحاسم لتعزيز تشكيلة الزعيم وتغطية الغياب الطويل للمهاجم البرازيلي نيمار جونيور الذي يخضع لبرنامج علاجي ممتد. ووفقاً للتقارير الطبية وإدارة الكرة بالهلال، من المتوقع مشاركة اللاعب الجديد مباشرة في اللقاء القادم ضد نادي النصر."
  },
  {
    id: "news-2",
    title: "ليفربول يسحق يونايتد بثلاثية وصلاح يتربع على عرش هدافي الكلاسيكو الإنجليزي بالملعب التاريخي",
    creator: "الصحافة العالمية",
    source: "beIN Sports",
    pubDate: "منذ 3 ساعات",
    imageUrl: "https://media.api-sports.io/football/teams/40.png",
    contentSnippet: "تألق الفرعون المصري محمد صلاح في قيادة فريقه ليفربول للفوز على الغريم التقليدي مانشستر يونايتد بثلاثة أهداف نظيفة على ملعب أولد ترافورد...",
    content: "واصل ليفربول تقديمه للعروض الهجومية الرائعة تحت قيادة المدير الفني الجديد، حيث فرض سيطرته المطلقة على خصمه التاريخي مانشستر يونايتد ضمن منافسات الدوري الإنجليزي الممتاز. محمد صلاح كان ممرراً حاسماً للهدفين الأول والثاني، وتوج مجهوده بتسجيل الهدف الثالث بلمسة فنية أسكن بها الكرة في الزاوية الضيقة للحارس أونانا."
  },
  {
    id: "news-3",
    title: "مواعيد مباريات ربع نهائي دوري أبطال أوروبا والقنوات الناقلة والمعلقين بالكامل",
    creator: "مراسل الكورة العالمية",
    source: "يوروسبورت",
    pubDate: "منذ 6 ساعات",
    imageUrl: "https://media.api-sports.io/football/leagues/2.png",
    contentSnippet: "أصدر الاتحاد الأوروبي لكرة القدم جدول وتواقيت مواجهات ربع نهائي التشامبيونزليج النارية مع تحديد القنوات والترددات...",
    content: "مواجهات حارقة تنظر محبي كرة القدم الأوروبية في قرعة دوري الأبطال الحالية. حيث يصطدم نادي ريال مدريد بخصمه العنيد مانشستر سيتي في نهائي مبكر مكرر، بينما ترحل كتيبة بايرن ميونخ لمقابلة أرسنال الإنجليزي. تم جدولة البث التلفزيوني بالكامل لتنقل حصرياً عبر قنوات beIN Sports العربية تحت أصوات المعلقين العرب الأبرز."
  }
];

const getBackendUrl = () => {
  if (typeof window !== 'undefined' && window.location) {
    return window.location.origin;
  }
  return 'https://ais-dev-7yjy6apxcqr3vnxii4n4s5-425742923336.europe-west1.run.app';
};

const formatArabicDate = (dateStr: string) => {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 5) return 'الآن';
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    if (hours < 24) return `منذ ${hours} ساعة`;
    return `منذ ${days} يوم`;
  } catch (_) {
    return 'قريباً';
  }
};

export default function NewsScreen() {
  const [news, setNews] = useState(NEWS_MOCK);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedNews, setSelectedNews] = useState<any>(null);
  const [activeCategory, setActiveCategory] = useState('ALL'); // ALL, SAUDI, LATIN, EUROPE

  const fetchNews = async () => {
    setLoading(true);
    try {
      const baseUrl = getBackendUrl();
      let categoryParam = 'الكل';
      if (activeCategory === 'SAUDI') categoryParam = 'الأخبار المحلية والسعودية';
      else if (activeCategory === 'EUROPE') categoryParam = 'الكرة العالمية والأوروبية';
      else if (activeCategory === 'TRANSFERS') categoryParam = 'سوق الانتقالات';

      const response = await fetch(`${baseUrl}/api/news?limit=25&category=${encodeURIComponent(categoryParam)}`);
      if (response.ok) {
        const result = await response.json();
        const articles = result.data || result.articles || result || [];
        if (Array.isArray(articles) && articles.length > 0) {
          const mapped = articles.map((article: any, index: number) => ({
            id: article.id || `news-${index}`,
            title: article.title || '',
            creator: article.creator || article.author || 'قسم الأخبار',
            source: article.sourceName || article.source || 'كورة لايف',
            pubDate: article.publishedAt ? formatArabicDate(article.publishedAt) : 'ساعة واحدة',
            imageUrl: article.image || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=600',
            contentSnippet: article.description || article.contentSnippet || '',
            content: article.content || article.body || article.description || ''
          }));
          setNews(mapped);
        }
      }
    } catch (e) {
      console.warn("Failed fetching news feeds:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, [activeCategory]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNews();
  };

  // Share action
  const handleShare = async (title: string) => {
    try {
      await Share.share({
        message: `${title} \n\nتمت المشاركة من تطبيق كورة لايف للجوال`,
      });
    } catch (error) {
      console.warn(error);
    }
  };

  const categories = [
    { id: 'ALL', name: 'كل الأخبار' },
    { id: 'SAUDI', name: 'أخبار روشن' },
    { id: 'EUROPE', name: 'الكرة العالمية' },
    { id: 'TRANSFERS', name: 'أخبار الانتقالات' }
  ];

  return (
    <View style={styles.container}>
      {/* Categories Scroller */}
      <View style={styles.catSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
          {categories.map(c => (
            <Pressable 
              key={c.id}
              onPress={() => setActiveCategory(c.id)}
              style={[styles.catButton, activeCategory === c.id && styles.activeCat]}
            >
              <Text style={[styles.catText, activeCategory === c.id && styles.activeCatText]}>{c.name}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* News Feeds List */}
      {loading && news.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#030712' }}>
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : (
        <FlatList
          data={news}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable 
              onPress={() => setSelectedNews(item)}
              style={styles.newsCard}
            >
              {/* News Image Header Background */}
              <View style={styles.imageWrapper}>
                <Image source={{ uri: item.imageUrl }} style={styles.newsImage} />
                <View style={styles.newsOverlay} />
                <View style={styles.sourcePill}>
                  <Text style={styles.sourceText}>{item.source}</Text>
                </View>
              </View>

              {/* Content info */}
              <View style={styles.newsInfo}>
                <Text style={styles.newsTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.newsSnippet} numberOfLines={2}>{item.contentSnippet}</Text>
                
                {/* Bottom Row info */}
                <View style={styles.headerMeta}>
                  <View style={styles.metaCol}>
                    <Clock size={12} color="#9ca3af" />
                    <Text style={styles.metaText}>{item.pubDate}</Text>
                  </View>
                  
                  <Pressable hitSlop={12} onPress={() => handleShare(item.title)} style={styles.shareBtn}>
                    <Share2 size={16} color="#10b981" />
                  </Pressable>
                </View>
              </View>
            </Pressable>
          )}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#10b981']}
              tintColor="#10b981"
            />
          }
        />
      )}

      {/* Reader Modal Panel */}
      {selectedNews && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={selectedNews !== null}
          onRequestClose={() => setSelectedNews(null)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContent}>
              {/* Header inside modal */}
              <View style={styles.modalHeader}>
                <Pressable onPress={() => setSelectedNews(null)} style={styles.closeBtn}>
                  <X size={20} color="#ffffff" />
                </Pressable>
                <Text style={styles.modalTitleHeader}>القارئ الرياضي 📖</Text>
              </View>

              <ScrollView style={styles.modalScroll}>
                <Image source={{ uri: selectedNews.imageUrl }} style={styles.modalImage} />
                
                <View style={styles.modalBodyPadding}>
                  <View style={styles.modalMetaRow}>
                    <Text style={styles.modalSource}>{selectedNews.source}</Text>
                    <Text style={styles.modalDate}>{selectedNews.pubDate}</Text>
                  </View>

                  <Text style={styles.modalHeadline}>{selectedNews.title}</Text>
                  
                  <View style={styles.divider} />
                  
                  <Text style={styles.modalParagraph}>{selectedNews.content}</Text>
                  <Text style={styles.modalParagraph}>{selectedNews.contentSnippet}</Text>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
  catSection: {
    paddingVertical: 12,
    backgroundColor: '#0c1223',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.02)',
  },
  catScroll: {
    paddingHorizontal: 16,
    flexDirection: 'row-reverse',
    gap: 8,
  },
  catButton: {
    backgroundColor: '#1f2937',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
  },
  activeCat: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: '#10b981',
  },
  catText: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '800',
  },
  activeCatText: {
    color: '#10b981',
  },
  newsCard: {
    backgroundColor: '#0c1223',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
  },
  imageWrapper: {
    height: 160,
    position: 'relative',
    backgroundColor: '#111827',
  },
  newsImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
    opacity: 0.85,
  },
  newsOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(3, 7, 18, 0.2)',
  },
  sourcePill: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#10b981',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  sourceText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },
  newsInfo: {
    padding: 16,
  },
  newsTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'right',
    lineHeight: 22,
    marginBottom: 8,
  },
  newsSnippet: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
    lineHeight: 18,
    marginBottom: 12,
  },
  headerMeta: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.03)',
    paddingTop: 12,
  },
  metaCol: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: '#9ca3af',
    fontSize: 11,
    fontWeight: '700',
  },
  shareBtn: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(3, 7, 18, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0c1223',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '90%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth:1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
    backgroundColor: '#111827',
  },
  closeBtn: {
    backgroundColor: '#ef4444',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitleHeader: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  modalScroll: {
    flex: 1,
  },
  modalImage: {
    width: '100%',
    height: 200,
    resizeMode: 'contain',
    backgroundColor: '#030712',
  },
  modalBodyPadding: {
    padding: 20,
  },
  modalMetaRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalSource: {
    color: '#10b981',
    fontWeight: '900',
    fontSize: 13,
  },
  modalDate: {
    color: '#9ca3af',
    fontWeight: '700',
    fontSize: 12,
  },
  modalHeadline: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'right',
    lineHeight: 28,
  },
  divider: {
    height: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginVertical: 14,
  },
  modalParagraph: {
    color: '#d1d5db',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
    lineHeight: 24,
    marginBottom: 12,
  }
});
