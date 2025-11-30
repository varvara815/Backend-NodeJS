<template>
  <div>
    <div v-if="successMessage" class="success-notification">
      {{ successMessage }}
    </div>
    <div v-if="hasNewVersion && !editing" class="new-version-banner">
      <span>A new version of this article is available.</span>
      <button @click="reloadArticle" class="btn-reload">Reload</button>
    </div>
    <div class="button-group">
      <button @click="goBack" class="btn-back">← Back</button>
      <div v-if="article && !editing">
        <button @click="startEdit" class="btn-edit">Edit</button>
        <button @click="deleteArticle" class="btn-delete">Delete</button>
      </div>
    </div>
    <div v-if="loading" class="loading">Loading...</div>
    <div v-else-if="article">
      <div v-if="!editing">
        <h2>{{ article.title }}</h2>
        <div v-if="article.Workspace" class="article-workspace">
          <span class="workspace-label">Workspace:</span> {{ article.Workspace.name }}
        </div>
        <div v-else class="article-workspace">
          <span class="workspace-label">Workspace:</span> No workspace
        </div>
        <div class="article-content" v-html="sanitizedContent"></div>
        <div v-if="article.attachments && article.attachments.length" class="attachments">
          <h3>Attachments</h3>
          <div class="attachment-list">
            <div v-for="att in article.attachments" :key="att.filename" class="attachment-item">
              <a :href="`http://localhost:3001/uploads/${att.filename}`" target="_blank">{{ att.originalName }}</a>
            </div>
          </div>
        </div>
        
        <CommentsSection 
          :article-id="articleId" 
          :comments="article.Comments" 
          @comment-added="loadArticle(articleId)"
          @comment-updated="loadArticle(articleId)"
          @comment-deleted="loadArticle(articleId)"
          @show-success="showSuccessMessage"
        />
      </div>
      <ArticleEditor 
        v-else
        :article="article"
        :workspaces="workspaces"
        @save="handleSave"
        @cancel="editing = false"
        @show-success="showSuccessMessage"
      />
    </div>
    <div v-else-if="error" class="error">{{ error }}</div>
  </div>
</template>

<script>
import axios from 'axios';
import DOMPurify from 'dompurify';
import ArticleEditor from './ArticleEditor.vue';
import CommentsSection from './CommentsSection.vue';
import { API_BASE_URL } from '../constants.js';

export default {
  name: 'ViewArticle',
  components: { ArticleEditor, CommentsSection },
  props: ['articleId'],
  data() {
    return {
      article: null,
      loading: false,
      error: null,
      editing: false,
      successMessage: null,
      workspaces: [],
      hasNewVersion: false
    }
  },
  computed: {
    sanitizedContent() {
      return this.article ? DOMPurify.sanitize(this.article.content, {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'b', 'i', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'a', 'img'],
        ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'style', 'class']
      }) : '';
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
  mounted() {
    this.loadWorkspaces();
    this.setupWebSocketListener();
  },
  beforeUnmount() {
    if (this.wsMessageHandler) {
      const ws = this.$root.ws;
      if (ws) {
        ws.removeEventListener('message', this.wsMessageHandler);
      }
    }
  },
  methods: {
    async loadArticle(id) {
      this.loading = true;
      this.error = null;
      this.article = null;
      
      try {
        const response = await axios.get(`${API_BASE_URL}/api/articles/${id}`);
        this.article = response.data;
      } catch (error) {
        this.error = error.response?.status === 404 ? 'Article not found' : 'Failed to load article';
      } finally {
        this.loading = false;
      }
    },
    async loadWorkspaces() {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/workspaces`);
        this.workspaces = response.data;
      } catch (error) {
        console.error('Error loading workspaces:', error);
      }
    },
    startEdit() {
      this.editing = true;
    },
    goBack() {
      this.$emit('back');
      this.$parent.updateURL();
    },
    async deleteArticle() {
      if (!confirm('Are you sure you want to delete this article?')) return;
      try {
        const response = await axios.delete(`${API_BASE_URL}/api/articles/${this.articleId}`);
        if (response.status === 204) {
          this.showSuccessMessage('Article deleted successfully');
          this.$emit('article-deleted');
          setTimeout(() => {
            this.goBack();
          }, 500);
        }
      } catch (error) {
        console.error('Delete error:', error);
        this.error = error.response?.data?.error || 'Failed to delete article';
      }
    },
    handleSave() {
      this.editing = false;
      this.loadArticle(this.articleId);
    },
    showSuccessMessage(message) {
      this.successMessage = message;
      setTimeout(() => {
        this.successMessage = null;
      }, 3000);
    },
    setupWebSocketListener() {
      const ws = this.$root.ws;
      if (!ws) return;
      
      this.wsMessageHandler = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'article-updated' && data.articleId === this.articleId && !this.editing) {
          this.hasNewVersion = true;
        }
      };
      
      ws.addEventListener('message', this.wsMessageHandler);
    },
    reloadArticle() {
      this.hasNewVersion = false;
      this.loadArticle(this.articleId);
    }
  }
}
</script>

<style scoped>
.success-notification {
  background: #d4edda;
  color: #155724;
  padding: 12px 16px;
  border-radius: 4px;
  margin-bottom: 15px;
  border: 1px solid #c3e6cb;
  animation: slideIn 0.3s ease;
}

.new-version-banner {
  background: #fff3cd;
  color: #856404;
  padding: 12px 16px;
  border-radius: 4px;
  margin-bottom: 15px;
  border: 1px solid #ffeaa7;
  display: flex;
  justify-content: space-between;
  align-items: center;
  animation: slideIn 0.3s ease;
}

.btn-reload {
  background: #ffc107;
  color: #000;
  border: none;
  padding: 8px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
}

.btn-reload:hover {
  background: #ffb300;
}

.button-group {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

button {
  color: white;
  border: none;
  padding: 12px 28px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  margin-left: 8px;
}

.btn-back {
  background: #8a8a89;
}

.btn-back:hover {
  background: #757574;
}

.btn-edit {
  background: #3574b8;
}

.btn-edit:hover {
  background: #2a5fa0;
}

.btn-delete {
  background: #ba3434;
}

.btn-delete:hover {
  background: #a02d2d;
}

h2 {
  color: #333;
  margin-bottom: 10px;
  border-bottom: 2px solid #007bff;
  padding-bottom: 10px;
}

.article-workspace {
  color: #6c757d;
  font-size: 14px;
  margin-bottom: 20px;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 4px;
  border-left: 3px solid #007bff;
}

.workspace-label {
  font-weight: bold;
  color: #495057;
}

.article-content {
  line-height: 1.6;
  color: #555;
  margin-top: 20px;
}

.article-content :deep(p) {
  margin-bottom: 1em;
}

.article-content :deep(ul), 
.article-content :deep(ol) {
  margin: 1em 0;
  padding-left: 2em;
}

.article-content :deep(li) {
  margin-bottom: 0.5em;
}

.article-content :deep(strong) {
  font-weight: bold;
}

.article-content :deep(em) {
  font-style: italic;
}

.article-content :deep(a) {
  color: #007bff;
  text-decoration: underline;
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

.attachments {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.attachments h3 {
  margin: 0 0 10px 0;
  font-size: 16px;
  color: #333;
}

.attachment-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.attachment-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: white;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.attachment-item a {
  color: #007bff;
  text-decoration: none;
  flex: 1;
}

.attachment-item a:hover {
  text-decoration: underline;
}

</style>