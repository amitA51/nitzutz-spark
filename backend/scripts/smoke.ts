import axios from 'axios';

const BASE = process.env.SMOKE_BASE_URL || 'http://localhost:5000/api';

async function main() {
  console.log('=== Nitzutz Spark Smoke Test ===');
  console.log('Base URL:', BASE);

  // Health check
  try {
    const health = await axios.get(`${BASE.replace(/\/$/, '')}/health`);
    console.log('Health:', health.data);
  } catch (e: any) {
    console.error('Health check failed:', e.response?.status, e.response?.data || e.message);
  }

  // Seed (non-prod)
  try {
    const r = await axios.post(`${BASE}/articles/seed`);
    console.log('Seed dummy articles:', r.data);
  } catch (e: any) {
    if (e.response?.status === 403) {
      console.log('Seed blocked (likely production). Skipping.');
    } else {
      console.warn('Seed failed (non-fatal):', e.response?.status, e.response?.data || e.message);
    }
  }

  // Get articles
  let articles: any[] = [];
  try {
    const list = await axios.get(`${BASE}/articles`, {
      params: { page: 1, limit: 5, includeContent: 1 },
    });
    console.log('Articles pagination:', list.data.pagination);
    articles = list.data.articles || [];
  } catch (e: any) {
    console.error('Fetch articles failed:', e.response?.status, e.response?.data || e.message);
  }

  // Create one article if empty
  if (articles.length === 0) {
    try {
      const created = await axios.post(`${BASE}/articles`, {
        title: 'מאמר בדיקה',
        content: 'זהו מאמר בדיקה קצר.',
        category: 'Testing',
        excerpt: 'מאמר בדיקה',
        readTime: 1,
      });
      console.log('Created article id:', created.data.id);
      articles = [created.data];
    } catch (e: any) {
      console.error('Create article failed:', e.response?.status, e.response?.data || e.message);
    }
  }

  const first = articles[0];
  if (first?.id) {
    // Save article
    try {
      const saved = await axios.post(`${BASE}/saved-articles`, { articleId: first.id });
      console.log('Saved article:', saved.data.id || first.id);
    } catch (e: any) {
      if (e.response?.status === 400 && /already saved/i.test(e.response?.data?.error || '')) {
        console.log('Article already saved.');
      } else {
        console.warn('Save article failed (non-fatal):', e.response?.status, e.response?.data || e.message);
      }
    }

    // List saved
    try {
      const savedList = await axios.get(`${BASE}/saved-articles`);
      console.log('Saved count:', Array.isArray(savedList.data) ? savedList.data.length : 0);
    } catch (e: any) {
      console.warn('List saved failed (non-fatal):', e.response?.status, e.response?.data || e.message);
    }

    // Remove saved
    try {
      await axios.delete(`${BASE}/saved-articles/${first.id}`);
      console.log('Removed saved article:', first.id);
    } catch (e: any) {
      console.warn('Remove saved failed (non-fatal):', e.response?.status, e.response?.data || e.message);
    }

    // Article by id
    try {
      const full = await axios.get(`${BASE}/articles/${first.id}`);
      console.log('Single article fields:', Object.keys(full.data));
    } catch (e: any) {
      console.warn('Get article by id failed (non-fatal):', e.response?.status, e.response?.data || e.message);
    }
  }

  // Categories
  try {
    const cats = await axios.get(`${BASE}/articles/categories/list`);
    console.log('Categories:', cats.data);
  } catch (e: any) {
    console.warn('Categories failed (non-fatal):', e.response?.status, e.response?.data || e.message);
  }

  // Export all
  try {
    const exp = await axios.get(`${BASE}/export/all`);
    console.log('Export keys:', Object.keys(exp.data));
  } catch (e: any) {
    console.warn('Export failed (non-fatal):', e.response?.status, e.response?.data || e.message);
  }

  console.log('=== Smoke Test Done ===');
}

main().catch((e) => {
  console.error('Smoke test crashed:', e);
  process.exit(1);
});