<template>
  <div>
    <div v-if="successMessage" class="success-notification">
      {{ successMessage }}
    </div>
    <div v-if="hasNewVersion && !editing" class="new-version-banner">
      <span>A new version of this article is available.</span>
      <button @click="reloadArticle" class="btn-reload">Reload</button>
    </div>
    <!-- Version indicator -->
    <div v-if="isViewingVersion" class="version-banner">
      <div class="version-info">
        <span class="version-text">Viewing version {{ currentVersion }} (read-only)</span>
        <button @click="viewCurrentVersion" class="btn btn-sm btn-outline">View Current Version</button>
      </div>
    </div>
    
    <div class="button-group">
      <div class="left-buttons">
        <button @click="goBack" class="btn-back">← Back</button>
        <button v-if="article && !editing" @click="showVersions = !showVersions" class="btn-versions">
          {{ showVersions ? 'Hide' : 'Show' }} Versions
        </button>
      </div>
      <div v-if="article && !editing && !isViewingVersion" class="action-buttons">
        <button @click="startEdit" class="btn-edit">Edit</button>
        <button @click="deleteArticle" class="btn-delete">Delete</button>
      </div>
    </div>
    <!-- Versions list -->
    <div v-if="showVersions && !editing" class="versions-section">
      <h3>Article Versions</h3>
      <div v-if="loadingVersions" class="loading">Loading versions...</div>
      <div v-else-if="versions.length === 0" class="no-versions">No versions available</div>
      <div v-else class="versions-list">
        <div 
          v-for="version in versions" 
          :key="version.id"
          :class="['version-item', { active: currentVersion === version.version_number }]"
          @click="viewVersion(version.version_number)"
        >
          <div class="version-header">
            <span class="version-number">Version {{ version.version_number }}</span>
            <span class="version-date"> {{ formatDate(version.createdAt) }}</span>
          </div>
          <div class="version-title">{{ version.title }}</div>
        </div>
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
      hasNewVersion: false,
      versions: [],
      showVersions: false,
      loadingVersions: false,
      currentVersion: null,
      isViewingVersion: false
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
    this.fetchVersions();
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
        this.fetchVersions();
      } catch (error) {
        this.error = error.response?.status === 404 ? 'Article not found' : 'Failed to load article';
      } finally {
        this.loading = false;
      }
    },
    
    async fetchVersions() {
      if (!this.articleId) return;
      try {
        this.loadingVersions = true;
        const response = await axios.get(`${API_BASE_URL}/api/articles/${this.articleId}/versions`);
        this.versions = response.data;
        // By default, select the latest version if not viewing a specific version
        if (!this.isViewingVersion && this.versions.length > 0) {
          this.currentVersion = this.versions[0].version_number;
        }
      } catch (error) {
        console.error('Failed to fetch versions:', error);
      } finally {
        this.loadingVersions = false;
      }
    },
    
    async viewVersion(versionNumber) {
      // If this is the latest version, show the current article
      const latestVersion = this.versions.length > 0 ? this.versions[0].version_number : 1;
      if (versionNumber === latestVersion) {
        this.viewCurrentVersion();
        return;
      }
      
      try {
        this.loading = true;
        const response = await axios.get(`${API_BASE_URL}/api/articles/${this.articleId}/versions/${versionNumber}`);
        this.article = response.data;
        this.currentVersion = versionNumber;
        this.isViewingVersion = true;
      } catch (error) {
        this.error = error.message;
      } finally {
        this.loading = false;
      }
    },
    
    async viewCurrentVersion() {
      this.isViewingVersion = false;
      const latestVersion = this.versions.length > 0 ? this.versions[0].version_number : 1;
      this.currentVersion = latestVersion;
      await this.loadArticle(this.articleId);
    },
    
    formatDate(dateString) {
      return new Date(dateString).toLocaleString();
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
      this.fetchVersions();
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
      this.fetchVersions();
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

.left-buttons {
  display: flex;
  gap: 8px;
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

.btn-versions {
  background: #17a2b8;
  font-size: 14px;
}

.btn-versions:hover {
  background: #138496;
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

.version-banner {
  background: #e3f2fd;
  border: 1px solid #90caf9;
  border-radius: 4px;
  padding: 12px 16px;
  margin-bottom: 15px;
}

.version-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.version-text {
  color: #1976d2;
  font-weight: 500;
}

.btn {
  padding: 6px 12px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-size: 14px;
}

.btn-sm {
  padding: 8px 16px;
  font-size: 14px;
}

.btn-outline {
  background: transparent;
  border: 1px solid #1976d2;
  color: #1976d2;
}

.btn-outline:hover {
  background: #1976d2;
  color: white;
}

.versions-section {
  background: #f8f9fa;
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 20px;
}

.versions-section h3 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 18px;
}

.versions-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.version-item {
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.version-item:hover {
  border-color: #007bff;
  box-shadow: 0 2px 4px rgba(0,123,255,0.1);
}

.version-item.active {
  border-color: #007bff;
  background: #e3f2fd;
}

.version-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.version-number {
  font-weight: bold;
  color: #333;
}

.version-date {
  color: #6c757d;
  font-size: 14px;
}

.version-title {
  color: #555;
  font-size: 14px;
  margin-top: 4px;
}

.no-versions {
  text-align: center;
  color: #6c757d;
  padding: 20px;
  font-style: italic;
}

</style>