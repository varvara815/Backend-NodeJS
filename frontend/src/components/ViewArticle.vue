<template>
  <div>
    <div class="button-group">
      <button @click="$emit('back')" class="btn-back">← Back</button>
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
      </div>
      <div v-else class="edit-form">
        <h2>Edit Article</h2>
        <input v-model="editForm.title" placeholder="Title" />
        <QuillEditor
          v-model:content="editForm.content"
          content-type="html"
          :options="editorOptions"
        />
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
  props: ['articleId'],
  data() {
    return {
      article: null,
      loading: false,
      error: null,
      editing: false,
      editForm: { title: '', content: '' },
      editError: null,
      editorOptions: EDITOR_OPTIONS
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
      this.editing = true;
      this.editError = null;
    },
    cancelEdit() {
      this.editing = false;
      this.editError = null;
    },
    async saveEdit() {
      this.editError = null;
      try {
        await axios.put(`${API_BASE_URL}/api/articles/${this.articleId}`, this.editForm);
        await this.loadArticle(this.articleId);
        this.editing = false;
      } catch (error) {
        this.editError = error.response?.data?.error || 'Failed to update article';
      }
    },
    async deleteArticle() {
      if (!confirm('Are you sure you want to delete this article?')) return;
      try {
        await axios.delete(`${API_BASE_URL}/api/articles/${this.articleId}`);
        this.$emit('back');
      } catch (error) {
        this.error = error.response?.data?.error || 'Failed to delete article';
      }
    }
  }
}
</script>

<style scoped>
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
</style>