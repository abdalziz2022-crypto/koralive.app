import axios from 'axios';

/**
 * Service Layer to connect Frontend components to our dynamic RSS Feed aggregator backend.
 */
export const rssNewsService = {
  /**
   * Fetch paginated list of aggregated articles with search and filters.
   */
  async getArticles({ category = 'الكل', sourceId = '', search = '', limit = 12, page = 1 } = {}) {
    try {
      const response = await axios.get('/api/news', {
        params: {
          category,
          sourceId,
          search,
          limit,
          page
        }
      });
      return response.data;
    } catch (err) {
      console.error('[rssNewsService] getArticles failed:', err);
      throw new Error(err.response?.data?.message || 'فشل جلب الأخبار من الخادم.');
    }
  },

  /**
   * Fetch latest scrolling headlines.
   */
  async getLatestArticles(count = 6) {
    try {
      const response = await axios.get('/api/news/latest', {
        params: { count }
      });
      return response.data;
    } catch (err) {
      console.error('[rssNewsService] getLatestArticles failed:', err);
      throw new Error(err.response?.data?.message || 'فشل جلب أحدث الأخبار.');
    }
  },

  /**
   * Fetch all registered RSS Sources.
   */
  async getSources() {
    try {
      const response = await axios.get('/api/news/sources');
      return response.data;
    } catch (err) {
      console.error('[rssNewsService] getSources failed:', err);
      throw new Error(err.response?.data?.message || 'فشل جلب مصادر الأخبار.');
    }
  },

  /**
   * Add a new custom RSS Source (Admin Panel).
   */
  async addSource({ name, url, category, language }) {
    try {
      const response = await axios.post('/api/news/sources', {
        name,
        url,
        category,
        language
      });
      return response.data;
    } catch (err) {
      console.error('[rssNewsService] addSource failed:', err);
      throw new Error(err.response?.data?.message || 'فشل إضافة مصدر الأخبار.');
    }
  },

  /**
   * Update properties or toggle enablement of an RSS Source (Admin Panel).
   */
  async updateSource(id, { name, category, language, enabled }) {
    try {
      const response = await axios.put(`/api/news/sources/${id}`, {
        name,
        category,
        language,
        enabled
      });
      return response.data;
    } catch (err) {
      console.error('[rssNewsService] updateSource failed:', err);
      throw new Error(err.response?.data?.message || 'فشل تحديث المصدر.');
    }
  },

  /**
   * Delete an RSS source and remove its cached items.
   */
  async deleteSource(id) {
    try {
      const response = await axios.delete(`/api/news/sources/${id}`);
      return response.data;
    } catch (err) {
      console.error('[rssNewsService] deleteSource failed:', err);
      throw new Error(err.response?.data?.message || 'فشل حذف مصدر الأخبار.');
    }
  },

  /**
   * Probe feed connection and latency.
   */
  async testSource(url) {
    try {
      const response = await axios.post('/api/news/sources/test', { url });
      return response.data;
    } catch (err) {
      console.error('[rssNewsService] testSource failed:', err);
      throw new Error(err.response?.data?.message || 'فشل اختبار الرابط الإخباري.');
    }
  },

  /**
   * Admin-level trigger to force an instant background feed scan.
   */
  async triggerSync() {
    try {
      const response = await axios.post('/api/news/sync');
      return response.data;
    } catch (err) {
      console.error('[rssNewsService] triggerSync failed:', err);
      throw new Error(err.response?.data?.message || 'فشل تحفيز مزامنة الأخبار.');
    }
  },

  /**
   * Fetch full parsed/cleaned webpage article contents.
   */
  async getFullArticle(id, link) {
    try {
      const response = await axios.get('/api/news/article-full', {
        params: { id, link }
      });
      return response.data;
    } catch (err) {
      console.error('[rssNewsService] getFullArticle failed:', err);
      throw new Error(err.response?.data?.message || 'فشل استخلاص النص الكامل للموقع المصدر.');
    }
  },

  /**
   * Update article meta (title, description, category, language, image)
   */
  async updateArticle(id, fields) {
    try {
      const response = await axios.put(`/api/news/articles/${id}`, fields);
      return response.data;
    } catch (err) {
      console.error('[rssNewsService] updateArticle failed:', err);
      throw new Error(err.response?.data?.message || 'فشل تعديل المقال الإخباري.');
    }
  },

  /**
   * Delete specific cached news article
   */
  async deleteArticle(id) {
    try {
      const response = await axios.delete(`/api/news/articles/${id}`);
      return response.data;
    } catch (err) {
      console.error('[rssNewsService] deleteArticle failed:', err);
      throw new Error(err.response?.data?.message || 'فشل حذف الخبر.');
    }
  },

  /**
   * Pin or unpin article to headlines / featured carousel
   */
  async toggleFeatureArticle(id) {
    try {
      const response = await axios.post(`/api/news/articles/${id}/toggle-feature`);
      return response.data;
    } catch (err) {
      console.error('[rssNewsService] toggleFeatureArticle failed:', err);
      throw new Error(err.response?.data?.message || 'فشل تثبيت واستهداف الخبر.');
    }
  }
};
