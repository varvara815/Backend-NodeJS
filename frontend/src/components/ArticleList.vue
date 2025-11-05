<template>
  <div>
    <h2>Articles List</h2>
    <div v-if="loading" class="loading">Loading articles...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="articles.length === 0" class="empty">No articles found. Create your first article!</div>
    <div v-else>
      <div v-for="article in articles" :key="article.id" 
           class="article-item" @click="$emit('view-article', article.id)">
        <h3>{{ article.title }}</h3>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { API_BASE_URL } from '../constants.js';

export default {
  name: 'ArticleList',
  data() {
    return {
      articles: [],
      loading: false,
      error: null
    }
  },
  async mounted() {
    await this.loadArticles();
  },
  methods: {
    async loadArticles() {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await axios.get(`${API_BASE_URL}/api/articles`);
        this.articles = response.data;
      } catch (error) {
        this.error = 'Failed to load articles. Please check if the server is running.';
      } finally {
        this.loading = false;
      }
    }
  }
}
</script>

<style scoped>
.article-item {
  padding: 15px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: background-color 0.2s;
}

.article-item:hover {
  background: #f8f9fa;
}

.article-item h3 {
  margin: 0;
  color: #333;
}

.loading, .error, .empty {
  text-align: center;
  padding: 40px 20px;
  font-size: 16px;
}

.loading {
  color: #007bff;
}

.error {
  color: #dc3545;
  background: #f8d7da;
  border-radius: 4px;
}

.empty {
  color: #6c757d;
  font-style: italic;
}
</style>