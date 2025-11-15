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
      <div class="file-upload-section">
        <label>Attach Files (optional):</label>
        <div class="file-input-wrapper">
          <input type="file" @change="handleFileSelect" accept=".jpg,.jpeg,.png,.gif,.pdf" multiple ref="fileInput" class="file-input-hidden" />
          <button type="button" @click="$refs.fileInput.click()" class="file-input-button">
            Choose Files (JPG, PNG, GIF, PDF only)
          </button>
          <span class="file-name">{{ selectedFiles.length ? `${selectedFiles.length} file(s) selected` : 'No files selected' }}</span>
        </div>
        <div v-if="selectedFiles.length" class="selected-files">
          <div v-for="(file, index) in selectedFiles" :key="index" class="file-item">
            <span>{{ file.name }}</span>
            <button type="button" @click="removeFile(index)" class="remove-file">×</button>
          </div>
        </div>
        <div v-if="fileError" class="file-error">{{ fileError }}</div>
      </div>
      <button type="submit" :disabled="loading || !title.trim() || !content.trim()">{{ loading ? 'Creating...' : 'Create' }}</button>
    </form>
  </div>
</template>

<script>
import axios from 'axios';
import { QuillEditor } from '@vueup/vue-quill';
import '@vueup/vue-quill/dist/vue-quill.snow.css';
import { API_BASE_URL, EDITOR_OPTIONS } from '../constants.js';

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
      editorOptions: EDITOR_OPTIONS,
      selectedFiles: [],
      fileError: null
    }
  },
  methods: {
    handleFileSelect(event) {
      const files = Array.from(event.target.files);
      this.fileError = null;
      
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
      const allowedExts = /\.(jpg|jpeg|png|gif|pdf)$/i;
      
      const validFiles = [];
      const invalidFiles = [];
      
      files.forEach(file => {
        if (allowedTypes.includes(file.type) && allowedExts.test(file.name)) {
          if (file.size <= 10 * 1024 * 1024) { // 10MB limit
            validFiles.push(file);
          } else {
            invalidFiles.push(`${file.name} (too large, max 10MB)`);
          }
        } else {
          invalidFiles.push(`${file.name} (invalid type)`);
        }
      });
      
      if (invalidFiles.length > 0) {
        this.fileError = `Invalid files: ${invalidFiles.join(', ')}. Only JPG, PNG, GIF, and PDF files under 10MB are allowed.`;
      }
      
      this.selectedFiles = [...this.selectedFiles, ...validFiles];
      
      // Reset input to allow selecting the same file again
      if (this.$refs.fileInput) {
        this.$refs.fileInput.value = '';
      }
    },
    removeFile(index) {
      this.selectedFiles.splice(index, 1);
    },
    async createArticle() {
      this.loading = true;
      this.error = null;
      this.success = null;
      
      try {
        const response = await axios.post(`${API_BASE_URL}/api/articles`, {
          title: this.title,
          content: this.content
        });
        
        const articleId = response.data.id;
        
        // Upload files if any are selected
        if (this.selectedFiles.length > 0) {
          for (const file of this.selectedFiles) {
            const formData = new FormData();
            formData.append('file', file);
            try {
              await axios.post(`${API_BASE_URL}/api/articles/${articleId}/attachments`, formData);
            } catch (uploadError) {
              console.warn(`Failed to upload ${file.name}:`, uploadError);
            }
          }
        }
        
        this.success = 'Article created successfully!';
        
        setTimeout(() => {
          this.$emit('article-created');
        }, 1500);
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

.file-upload-section {
  margin-bottom: 20px;
}

.file-upload-section input[type="file"] {
  margin-bottom: 10px;
}

.selected-files {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px;
  background: #f8f9fa;
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 0;
  border-bottom: 1px solid #eee;
}

.file-item:last-child {
  border-bottom: none;
}

.remove-file {
  background: #dc3545;
  color: white;
  border: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  padding: 0;
  margin: 0;
}

.remove-file:hover {
  background: #c82333;
}

.file-input-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
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