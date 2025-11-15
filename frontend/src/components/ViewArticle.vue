<template>
  <div>
    <div v-if="successMessage" class="success-notification">
      {{ successMessage }}
    </div>
    <div v-if="pendingUpdate && !editing" class="update-notification">
      Article has been updated. <button @click="refreshArticle" class="btn-refresh">Refresh to see changes</button>
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
        <div class="article-content" v-html="sanitizedContent"></div>
        <div v-if="article.attachments && article.attachments.length" class="attachments">
          <h3>Attachments</h3>
          <div class="attachment-list">
            <div v-for="att in article.attachments" :key="att.filename" class="attachment-item">
              <a :href="`http://localhost:3001/uploads/${att.filename}`" target="_blank">{{ att.originalName }}</a>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="edit-form">
        <h2>Edit Article</h2>
        <input v-model="editForm.title" placeholder="Title" />
        <QuillEditor
          v-model:content="editForm.content"
          content-type="html"
          :options="editorOptions"
        />
        <div v-if="article.attachments && article.attachments.length" class="attachments">
          <h3>Attachments</h3>
          <div class="attachment-list">
            <div v-for="att in article.attachments" :key="att.filename" class="attachment-item">
              <a :href="`http://localhost:3001/uploads/${att.filename}`" target="_blank">{{ att.originalName }}</a>
              <button @click="deleteAttachment(att.filename)" class="btn-delete-att">×</button>
            </div>
          </div>
        </div>
        <div class="upload-section">
          <div class="file-input-wrapper">
            <input type="file" @change="handleFileSelect" accept=".jpg,.jpeg,.png,.gif,.pdf" ref="fileInput" class="file-input-hidden" />
            <button @click="$refs.fileInput.click()" class="file-input-button">
              Choose File (JPG, PNG, GIF, PDF only)
            </button>
            <span class="file-name">{{ selectedFile ? selectedFile.name : 'No file selected' }}</span>
          </div>
          <button @click="uploadFile" :disabled="!selectedFile || uploading" class="btn-upload">
            {{ uploading ? 'Uploading...' : 'Upload File' }}
          </button>
          <div v-if="fileError" class="file-error">{{ fileError }}</div>
        </div>
        <div class="edit-buttons">
          <button @click="saveEdit" class="btn-save">Save</button>
          <button @click="cancelEdit" class="btn-cancel">Cancel</button>
        </div>
        <div v-if="editError" class="error">{{ editError }}</div>
      </div>
    </div>
    <div v-else-if="error" class="error">{{ error }}</div>
  </div>
</template>

<script>
import axios from 'axios';
import DOMPurify from 'dompurify';
import { QuillEditor } from '@vueup/vue-quill';
import '@vueup/vue-quill/dist/vue-quill.snow.css';
import { API_BASE_URL, EDITOR_OPTIONS } from '../constants.js';

export default {
  name: 'ViewArticle',
  components: { QuillEditor },
  inject: ['getWebSocket'],
  props: ['articleId'],
  data() {
    return {
      article: null,
      loading: false,
      error: null,
      editing: false,
      editForm: { title: '', content: '' },
      editError: null,
      editorOptions: EDITOR_OPTIONS,
      selectedFile: null,
      uploading: false,
      wsMessageHandler: null,
      fileError: null,
      originalAttachments: [],
      pendingUpdate: false,
      successMessage: null
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
  mounted() {
    this.setupWebSocketListener();
  },
  beforeUnmount() {
    if (this.wsMessageHandler) {
      const ws = this.getWebSocket();
      ws?.removeEventListener('message', this.wsMessageHandler);
    }
  },
  methods: {
    setupWebSocketListener() {
      this.wsMessageHandler = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'article-updated' && data.articleId === this.articleId && !this.editing) {
          this.pendingUpdate = true;
        }
      };
      
      const ws = this.getWebSocket();
      if (ws) {
        ws.addEventListener('message', this.wsMessageHandler);
      }
    },
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
    startEdit() {
      this.editForm = { title: this.article.title, content: this.article.content };
      this.originalAttachments = [...(this.article.attachments || [])];
      this.editing = true;
      this.editError = null;
    },
    cancelEdit() {
      this.editing = false;
      this.editError = null;
    },
    async saveEdit() {
      this.editError = null;
      
      const hasTextChanges = this.editForm.title.trim() !== this.article.title || 
                             this.editForm.content.trim() !== this.article.content;
      
      const currentAttachments = this.article.attachments || [];
      const hasAttachmentChanges = JSON.stringify(this.originalAttachments) !== JSON.stringify(currentAttachments);
      
      if (!hasTextChanges && !hasAttachmentChanges) {
        this.editing = false;
        return;
      }
      
      if (hasTextChanges) {
        try {
          await axios.put(`${API_BASE_URL}/api/articles/${this.articleId}`, this.editForm);
          await this.loadArticle(this.articleId);
        } catch (error) {
          this.editError = error.response?.data?.error || 'Failed to update article';
          return;
        }
      } else if (hasAttachmentChanges) {
        try {
          await axios.post(`${API_BASE_URL}/api/articles/${this.articleId}/notify-update`, {
            title: this.article.title
          });
        } catch (error) {
          console.warn('Failed to send notification:', error);
        }
      }
      
      this.editing = false;
      this.pendingUpdate = false;
      this.showSuccessMessage('Article updated successfully');
    },
    goBack() {
      this.$emit('back');
      this.$parent.updateURL();
    },
    async deleteArticle() {
      if (!confirm('Are you sure you want to delete this article?')) return;
      try {
        await axios.delete(`${API_BASE_URL}/api/articles/${this.articleId}`);
        this.goBack();
      } catch (error) {
        this.error = error.response?.data?.error || 'Failed to delete article';
      }
    },
    handleFileSelect(event) {
      const file = event.target.files[0];
      this.fileError = null;
      
      if (!file) {
        this.selectedFile = null;
        return;
      }
      
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
      const allowedExts = /\.(jpg|jpeg|png|gif|pdf)$/i;
      
      if (!allowedTypes.includes(file.type) || !allowedExts.test(file.name)) {
        this.fileError = `Invalid file type. Only JPG, PNG, GIF, and PDF files are allowed.`;
        this.selectedFile = null;
        this.$refs.fileInput.value = '';
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) {
        this.fileError = `File too large. Maximum size is 10MB.`;
        this.selectedFile = null;
        this.$refs.fileInput.value = '';
        return;
      }
      
      this.selectedFile = file;
    },
    async uploadFile() {
      if (!this.selectedFile) return;
      this.uploading = true;
      const formData = new FormData();
      formData.append('file', this.selectedFile);
      try {
        await axios.post(`${API_BASE_URL}/api/articles/${this.articleId}/attachments`, formData);
        await this.loadArticle(this.articleId);
        this.selectedFile = null;
        this.$refs.fileInput.value = '';
      } catch (error) {
        this.error = error.response?.data?.error || 'Upload failed';
      } finally {
        this.uploading = false;
      }
    },
    async deleteAttachment(filename) {
      try {
        await axios.delete(`${API_BASE_URL}/api/articles/${this.articleId}/attachments/${filename}`);
        await this.loadArticle(this.articleId);
      } catch (error) {
        this.error = 'Failed to delete attachment';
      }
    },
    refreshArticle() {
      this.loadArticle(this.articleId);
      this.pendingUpdate = false;
    },
    showSuccessMessage(message) {
      this.successMessage = message;
      setTimeout(() => {
        this.successMessage = null;
      }, 3000);
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

.update-notification {
  background: #fff3cd;
  color: #856404;
  padding: 12px 16px;
  border-radius: 4px;
  margin-bottom: 15px;
  border: 1px solid #ffeaa7;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.btn-refresh {
  background: #007bff;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  margin-left: 10px;
}

.btn-refresh:hover {
  background: #0056b3;
}

.button-group {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

button {
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  margin-left: 8px;
}

.btn-back {
  background: #6c757d;
}

.btn-back:hover {
  background: #5a6268;
}

.btn-edit {
  background: #007bff;
}

.btn-edit:hover {
  background: #0056b3;
}

.btn-delete {
  background: #dc3545;
}

.btn-delete:hover {
  background: #c82333;
}

.btn-save {
  background: #28a745;
}

.btn-save:hover {
  background: #218838;
}

.btn-cancel {
  background: #6c757d;
}

.btn-cancel:hover {
  background: #5a6268;
}

.edit-form input {
  width: 100%;
  padding: 10px;
  margin-bottom: 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.edit-form .ql-editor {
  min-height: 200px;
}

.edit-form .ql-container {
  margin-bottom: 15px;
}

.edit-buttons {
  display: flex;
  gap: 10px;
  margin-top: 10px;
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

.btn-delete-att {
  background: #dc3545;
  color: white;
  border: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  padding: 0;
  margin: 0;
}

.btn-delete-att:hover {
  background: #c82333;
}

.upload-section {
  display: flex;
  gap: 10px;
  margin-top: 20px;
  margin-bottom: 20px;
  align-items: center;
}

.upload-section input[type="file"] {
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.btn-upload {
  background: #28a745;
  padding: 8px 16px;
}

.btn-upload:hover:not(:disabled) {
  background: #218838;
}

.btn-upload:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.file-input-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.file-input-hidden {
  display: none;
}

.file-input-button {
  background: #007bff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.file-input-button:hover {
  background: #0056b3;
}

.file-name {
  color: #666;
  font-size: 14px;
  flex: 1;
}

.file-input:hover {
  border-color: #007bff;
}

.file-error {
  background: #f8d7da;
  color: #721c24;
  padding: 8px;
  border-radius: 4px;
  margin-top: 10px;
  font-size: 14px;
}
</style>