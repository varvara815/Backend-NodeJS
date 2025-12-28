<template>
  <div>
    <h2>Create Article</h2>
    <div v-if="error" class="error">{{ error }}</div>
    <div v-if="success" class="success">{{ success }}</div>
    <form @submit.prevent="createArticle">
      <div>
        <label for="workspace">Workspace:</label>
        <select id="workspace" v-model="workspaceId" class="large-select">
          <option value="null">No workspace</option>
          <option v-for="workspace in workspaces" :key="workspace.id" :value="workspace.id">
            {{ workspace.name }}
          </option>
        </select>
      </div>
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
import api from '../api';
import { QuillEditor } from '@vueup/vue-quill';
import '@vueup/vue-quill/dist/vue-quill.snow.css';
import { EDITOR_OPTIONS, FILE_SIZE_LIMIT, ALLOWED_FILE_TYPES, ALLOWED_FILE_EXTENSIONS } from '../constants.js';

export default {
  name: 'CreateArticle',
  components: {
    QuillEditor
  },
  props: {
    workspaces: {
      type: Array,
      default: () => []
    },
    selectedWorkspace: {
      type: String,
      default: null
    }
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
      fileError: null,
      workspaceId: this.selectedWorkspace || 'null' // Default to No workspace
    }
  },

  methods: {

    handleFileSelect(event) {
      const files = Array.from(event.target.files);
      this.fileError = null;
      
      const allowedTypes = ALLOWED_FILE_TYPES;
      const allowedExts = ALLOWED_FILE_EXTENSIONS;
      
      const validFiles = [];
      const invalidFiles = [];
      
      // Validate each file by type, extension, and size
      files.forEach(file => {
        if (allowedTypes.includes(file.type) && allowedExts.test(file.name)) {
          if (file.size <= FILE_SIZE_LIMIT) {
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
        const response = await api.post('/articles', {
          title: this.title,
          content: this.content,
          workspace_id: this.workspaceId === 'null' ? null : this.workspaceId || null
        });
        
        const articleId = response.data.id;
        
        if (this.selectedFiles.length > 0) {
          for (const file of this.selectedFiles) {
            const formData = new FormData();
            formData.append('file', file);
            try {
              await api.post(`/articles/${articleId}/attachments`, formData, {
                headers: {
                  'Content-Type': 'multipart/form-data'
                }
              });
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
        if (error.response && [401, 403].includes(error.response.status)) {
          this.$emit('auth-error');
          return;
        }
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
  margin-top: 30px;
}

form div {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
}

input, select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  outline: none;
}

select {
  background: #f8f9fa;
}

.large-select {
  width: 300px;
  max-width: 100%;
}

.ql-editor {
  min-height: 200px;
}

button {
  background: #3574b8;
  color: white;
  border: none;
  padding: 12px 36px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  margin-top: 10px;
}

button:hover:not(:disabled) {
  background: #2a5fa0;
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
  background: #ba3434;
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
  background: #a02d2d;
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
  background: #3574b8;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.file-input-button:hover {
  background: #2a5fa0;
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

select option:hover {
  background-color: #e9ecef !important;
}

select:focus {
  border-color: #ddd;
  outline: none;
}
</style>