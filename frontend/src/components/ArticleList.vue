<template>
  <div>
    <h2>Articles List</h2>
    <div class="search-container">
      <input 
        v-model="searchQuery" 
        @input="onSearchInput"
        type="text" 
        placeholder="Search articles by title or content..."
        class="search-input"
      />
    </div>
    <div v-if="loading" class="loading">Loading articles...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="articles.length === 0" class="empty">
      <div v-if="searchQuery.trim()">
        No articles found for "{{ searchQuery.trim() }}"
      </div>
      <div v-else>
        No articles found. Create your first article!
      </div>
    </div>
    <div v-else>
      <div v-for="article in articles" :key="article.id" 
           class="article-item" @click="viewArticle(article.id)">
        <h3>{{ article.title }}</h3>
        <div class="article-meta">
          <span v-if="article.User" class="author">by {{ article.User.email }}</span>
          <span v-if="article.Workspace" class="workspace">in {{ article.Workspace.name }}</span>
          <span v-else class="workspace uncategorized">Uncategorized</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../api';

export default {
  name: 'ArticleList',
  props: {
    workspaceId: {
      type: String,
      default: null
    }
  },
  data() {
    return {
      articles: [],
      loading: false,
      error: null,
      searchQuery: '',
      searchTimeout: null,
      minSearchLength: 1 
    }
  },
  beforeDestroy() {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  },
  async mounted() {
    await this.loadArticles();
  },
  watch: {
    workspaceId() {
      this.loadArticles();
    }
  },
  methods: {
    buildQueryParams() {
      let params = {};
      if (this.workspaceId && this.workspaceId !== 'uncategorized') {
        params.workspace_id = this.workspaceId;
      } else if (this.workspaceId === 'uncategorized') {
        params.workspace_id = 'null';
      }
      
      const trimmedQuery = this.searchQuery.trim();
      if (trimmedQuery.length >= this.minSearchLength) {
        params.search = trimmedQuery;
      }
      return params;
    },
    async loadArticles() {
      this.loading = true;
      this.error = null;
      
      try {
        const params = this.buildQueryParams();
        
        const response = await api.get('/articles', { params });
        this.articles = response.data;
      } catch (error) {
        if (error.response && [401, 403].includes(error.response.status)) {
          this.$emit('auth-error');
          return;
        }
        this.error = 'Failed to load articles. Please check if the server is running.';
      } finally {
        this.loading = false;
      }
    },
    onSearchInput() {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(() => {
        this.loadArticles();
      }, 300);
    },
    viewArticle(id) {
      this.$emit('view-article', id);
    }
  }
}
</script>

<style scoped>
.search-container {
  margin-top: 15px;
  margin-bottom: 20px;
}

.search-input {
  width: 100%;
  padding: 12px 16px;
  font-size: 16px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.article-item {
  padding: 15px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: background-color 0.2s;
}

.article-item:hover {
  background: #e9ecef;
}

.article-item h3 {
  margin: 0 0 8px 0;
  color: #333;
}

.article-meta {
  font-size: 14px;
  color: #6c757d;
  display: flex;
  gap: 15px;
}

.author {
  font-style: italic;
}

.workspace {
  font-style: normal;
}

.workspace.uncategorized {
  color: #6c757d;
  font-style: normal;
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