<template>
  <div>
    <button @click="$emit('back')">← Back</button>
    <div v-if="loading" class="loading">Loading...</div>
    <div v-else-if="article">
      <h2>{{ article.title }}</h2>
      <div class="article-content" v-html="sanitizedContent"></div>
    </div>
    <div v-else-if="error" class="error">{{ error }}</div>
  </div>
</template>

<script>
import axios from 'axios';
import DOMPurify from 'dompurify';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api.js';

export default {
  name: 'ViewArticle',
  props: ['articleId'],
  data() {
    return {
      article: null,
      loading: false,
      error: null
    }
  },
  
  computed: {
    sanitizedContent() {
      return this.article ? DOMPurify.sanitize(this.article.content) : '';
    }
  },
  
  watch: {
    articleId: {
      immediate: true,
      async handler(newId) {
        if (newId) {
          this.loadArticle(newId);
        }
      }
    }
  },
  methods: {
    async loadArticle(id) {
      this.loading = true;
      this.error = null;
      this.article = null;
      
      try {
        const response = await axios.get(`${API_BASE_URL}${API_ENDPOINTS.ARTICLE_BY_ID(id)}`);
        this.article = response.data;
      } catch (error) {
        this.error = error.response?.status === 404 ? 'Article not found' : 'Failed to load article';
      } finally {
        this.loading = false;
      }
    }
  }
}
</script>

<style scoped>
button {
  background: #6c757d;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  margin-bottom: 20px;
  font-size: 14px;
}

button:hover {
  background: #5a6268;
}

h2 {
  color: #333;
  margin-bottom: 15px;
  border-bottom: 2px solid #007bff;
  padding-bottom: 10px;
}

.article-content {
  line-height: 1.6;
  color: #555;
  white-space: pre-wrap;
  margin-top: 20px;
}

.loading, .error {
  text-align: center;
  padding: 20px;
  font-size: 16px;
}

.loading {
  color: #007bff;
}

.error {
  color: #dc3545;
}
</style>