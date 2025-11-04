<template>
  <div>
    <h2>Create Article</h2>
    <div v-if="error" class="error">{{ error }}</div>
    <div v-if="success" class="success">{{ success }}</div>
    <form @submit.prevent="createArticle">
      <div>
        <label for="title">Title:</label>
        <input type="text" id="title" v-model="title" required>
      </div>
      <div>
        <label>Content:</label>
        <QuillEditor
          v-model:content="content"
          content-type="html"
          :options="editorOptions"
        />
      </div>
      <button type="submit" :disabled="loading || !title.trim() || !content.trim()">{{ loading ? 'Creating...' : 'Create' }}</button>
    </form>
  </div>
</template>

<script>
import axios from 'axios';
import { QuillEditor } from '@vueup/vue-quill';
import '@vueup/vue-quill/dist/vue-quill.snow.css';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api.js';

export default {
  name: 'CreateArticle',

  components: {
    QuillEditor
  },
  data() {
    return {
      title: '',
      content: '',
      loading: false,
      error: null,
      success: null,
      editorOptions: {
        theme: 'snow',
        modules: {
          toolbar: [
            ['bold', 'italic', 'underline'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            ['link']
          ]
        }
      }
    }
  },
  methods: {
    async createArticle() {
      this.loading = true;
      this.error = null;
      this.success = null;
      
      try {
        if (this.title.length > 200) {
          this.error = 'Title must be less than 200 characters';
          this.loading = false;
          return;
        }
        
        if (this.content.length > 50000) {
          this.error = 'Content must be less than 50000 characters';
          this.loading = false;
          return;
        }
        
        await axios.post(`${API_BASE_URL}${API_ENDPOINTS.ARTICLES}`, {
          title: this.title,
          content: this.content
        });
        
        this.success = 'Article created successfully!';
        this.title = '';
        this.content = '';
        
        setTimeout(() => {
          this.$emit('article-created');
        }, 1000);
      } catch (error) {
        this.error = error.response?.data?.error || 'Failed to create article';
      } finally {
        this.loading = false;
      }
    }
  }
}
</script>

<style scoped>
form {
  max-width: 800px;
}

form div {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
}

input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

.ql-editor {
  min-height: 200px;
}

button {
  background: #007bff;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  margin-top: 10px;
}

button:hover:not(:disabled) {
  background: #0056b3;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.error {
  background: #f8d7da;
  color: #721c24;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 15px;
}

.success {
  background: #d4edda;
  color: #155724;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 15px;
}
</style>