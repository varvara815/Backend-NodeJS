<template>
  <div class="edit-form">
    <h2>Edit Article</h2>
    <div class="workspace-field">
      <label for="edit-workspace">Workspace:</label>
      <select id="edit-workspace" v-model="editForm.workspace_id" class="workspace-select">
        <option value="">No workspace</option>
        <option v-for="workspace in workspaces" :key="workspace.id" :value="workspace.id">
          {{ workspace.name }}
        </option>
      </select>
    </div>
    <div class="title-field">
      <label for="edit-title">Title:</label>
      <input id="edit-title" v-model="editForm.title" placeholder="Title" />
    </div>
    <div class="content-field">
      <label>Content:</label>
      <QuillEditor
        v-model:content="editForm.content"
        content-type="html"
        :options="editorOptions"
      />
    </div>
    <div v-if="article.attachments && article.attachments.length" class="attachments">
      <h3>Attachments</h3>
      <div class="attachment-list">
        <div v-for="att in article.attachments" :key="att.filename" class="attachment-item">
          <a :href="`http://localhost:3001/uploads/${att.filename}`" target="_blank">{{ att.originalName }}</a>
          <button @click="handleDeleteAttachment(att.filename)" class="btn-delete-att">×</button>
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
      <button @click="handleUploadFile" :disabled="!selectedFile || uploading" class="btn-upload">
        {{ uploading ? 'Uploading...' : 'Upload File' }}
      </button>
      <div v-if="fileError" class="file-error">{{ fileError }}</div>
    </div>
    <div class="edit-buttons">
      <button @click="handleSave" class="btn-save">Save</button>
      <button @click="$emit('cancel')" class="btn-cancel">Cancel</button>
    </div>
    <div v-if="error" class="error">{{ error }}</div>
  </div>
</template>

<script>
import axios from 'axios';
import { QuillEditor } from '@vueup/vue-quill';
import '@vueup/vue-quill/dist/vue-quill.snow.css';
import { API_BASE_URL, EDITOR_OPTIONS } from '../constants.js';

export default {
  name: 'ArticleEditor',
  components: { QuillEditor },
  props: {
    article: {
      type: Object,
      required: true
    },
    workspaces: {
      type: Array,
      default: () => []
    },
    originalAttachments: {
      type: Array,
      default: () => []
    }
  },
  emits: ['save', 'cancel', 'attachment-deleted', 'file-uploaded', 'show-success'],
  data() {
    return {
      editForm: {
        title: this.article.title,
        content: this.article.content,
        workspace_id: this.article.workspace_id || ''
      },
      editorOptions: EDITOR_OPTIONS,
      selectedFile: null,
      uploading: false,
      fileError: null,
      error: null,
      initialAttachments: JSON.stringify(this.article.attachments || [])
    }
  },
  mounted() {
    this.initialAttachments = JSON.stringify(this.article.attachments || []);
  },
  methods: {
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
    async handleUploadFile() {
      if (!this.selectedFile) return;
      this.uploading = true;
      const formData = new FormData();
      formData.append('file', this.selectedFile);
      try {
        const response = await axios.post(`${API_BASE_URL}/api/articles/${this.article.id}/attachments`, formData);
        if (response.data.attachments) {
          this.article.attachments = [...response.data.attachments];
        }
        this.selectedFile = null;
        this.$refs.fileInput.value = '';
      } catch (error) {
        this.error = error.response?.data?.error || 'Upload failed';
      } finally {
        this.uploading = false;
      }
    },
    async handleDeleteAttachment(filename) {
      try {
        const response = await axios.delete(`${API_BASE_URL}/api/articles/${this.article.id}/attachments/${filename}`);
        if (response.data.attachments) {
          this.article.attachments = [...response.data.attachments];
        }
      } catch (error) {
        this.error = 'Failed to delete attachment';
      }
    },
    async handleSave() {
      this.error = null;
      
      const currentWorkspaceId = this.article.workspace_id || '';
      const newWorkspaceId = this.editForm.workspace_id || '';
      
      const hasTextChanges = this.editForm.title.trim() !== this.article.title || 
                             this.editForm.content.trim() !== this.article.content ||
                             newWorkspaceId !== currentWorkspaceId;
      
      const currentAttachments = JSON.stringify(this.article.attachments || []);
      const hasAttachmentChanges = this.initialAttachments !== currentAttachments;
      
      // Skip save if nothing changed
      if (!hasTextChanges && !hasAttachmentChanges) {
        this.$emit('cancel');
        return;
      }
      
      if (hasTextChanges) {
        try {
          await axios.put(`${API_BASE_URL}/api/articles/${this.article.id}`, {
            title: this.editForm.title,
            content: this.editForm.content,
            workspace_id: this.editForm.workspace_id === '' ? null : this.editForm.workspace_id
          });
          this.$emit('show-success', 'Article updated successfully');
          this.$emit('save');
        } catch (error) {
          this.error = error.response?.data?.error || 'Failed to update article';
          return;
        }
      } else if (hasAttachmentChanges) {
        try {
          await axios.post(`${API_BASE_URL}/api/articles/${this.article.id}/notify-update`, {
            title: this.article.title
          });
          this.$emit('show-success', 'Article updated successfully');
          this.$emit('save');
        } catch (error) {
          console.warn('Failed to send notification:', error);
          this.$emit('show-success', 'Article updated successfully');
          this.$emit('save');
        }
      }
    }
  }
}
</script>

<style scoped>
.edit-form input {
  width: 100%;
  padding: 10px;
  margin-bottom: 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  outline: none;
}

.title-field, .content-field {
  margin-bottom: 15px;
}

.title-field label, .content-field label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #333;
}

.workspace-field {
  margin-bottom: 15px;
}

.workspace-field label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #333;
}

.workspace-select {
  width: 300px;
  max-width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  background: #f8f9fa;
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

button {
  color: white;
  border: none;
  padding: 12px 28px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.btn-save {
  background: #2c9e65;
}

.btn-save:hover {
  background: #248556;
}

.btn-cancel {
  background: #686867;
}

.btn-cancel:hover {
  background: #5a5a59;
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
  background: #ba3434;
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
  background: #a02d2d;
}

.upload-section {
  display: flex;
  gap: 10px;
  margin-top: 20px;
  margin-bottom: 20px;
  align-items: center;
}

.btn-upload {
  background: #248c58;
  padding: 8px 16px;
}

.btn-upload:hover:not(:disabled) {
  background: #1e7349;
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

.file-error {
  background: #f8d7da;
  color: #721c24;
  padding: 8px;
  border-radius: 4px;
  margin-top: 10px;
  font-size: 14px;
}

.error {
  color: #dc3545;
  background: #f8d7da;
  padding: 10px;
  border-radius: 4px;
  margin-top: 10px;
}
</style>
