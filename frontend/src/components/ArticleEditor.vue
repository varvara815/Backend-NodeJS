<template>
  <div class="edit-form">
    <h2>Edit Article</h2>
    <div class="version-notice">
      <strong>Note:</strong> Editing this article will create a new version. Previous versions will remain accessible.
    </div>
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
    <div v-if="visibleAttachments.length" class="attachments">
      <h3>Attachments</h3>
      <div class="attachment-list">
        <div v-for="att in visibleAttachments" :key="att.filename" class="attachment-item">
          <a :href="`http://localhost:3001/uploads/${att.filename}`" target="_blank">{{ att.originalName }}</a>
          <button @click="markForDeletion(att.filename)" class="btn-delete-att">×</button>
        </div>
      </div>
    </div>
    <div v-if="filesToDelete.length" class="files-to-delete">
      <h3>Files to Delete (on Save)</h3>
      <div class="delete-file-list">
        <div v-for="filename in filesToDelete" :key="filename" class="delete-file-item">
          <span class="delete-file-name">{{ getAttachmentName(filename) }}</span>
          <button @click="unmarkForDeletion(filename)" class="btn-restore">Restore</button>
        </div>
      </div>
    </div>
    <div class="upload-section">
      <div class="file-input-wrapper">
        <input type="file" @change="handleFileSelect" accept=".jpg,.jpeg,.png,.gif,.pdf" ref="fileInput" class="file-input-hidden" />
        <button @click="$refs.fileInput.click()" class="file-input-button">
          Add File (JPG, PNG, GIF, PDF only)
        </button>
      </div>
      <div v-if="fileError" class="file-error">{{ fileError }}</div>
    </div>
    <div v-if="pendingFiles.length" class="pending-files">
      <h3>Files to Upload (on Save)</h3>
      <div class="pending-file-list">
        <div v-for="(file, index) in pendingFiles" :key="index" class="pending-file-item">
          <span class="pending-file-name">{{ file.name }}</span>
          <button @click="removePendingFile(index)" class="btn-delete-pending">×</button>
        </div>
      </div>
    </div>
    <div class="edit-buttons">
      <button @click="handleSave" :disabled="saving" class="btn-save">
        {{ saving ? 'Saving...' : 'Save' }}
      </button>
      <button @click="$emit('cancel')" :disabled="saving" class="btn-cancel">Cancel</button>
    </div>
    <div v-if="error" class="error">{{ error }}</div>
  </div>
</template>

<script>
import axios from 'axios';
import { QuillEditor } from '@vueup/vue-quill';
import '@vueup/vue-quill/dist/vue-quill.snow.css';
import { API_BASE_URL, EDITOR_OPTIONS, FILE_SIZE_LIMIT, ALLOWED_FILE_TYPES, ALLOWED_FILE_EXTENSIONS } from '../constants.js';

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
    }
  },
  emits: ['save', 'cancel', 'show-success'],
  data() {
    return {
      editForm: {
        title: this.article.title,
        content: this.article.content,
        workspace_id: this.article.workspace_id || ''
      },
      editorOptions: EDITOR_OPTIONS,
      pendingFiles: [],
      filesToDelete: [],
      fileError: null,
      error: null,
      saving: false,
      initialAttachments: JSON.parse(JSON.stringify(this.article.attachments || []))
    }
  },
  computed: {
    visibleAttachments() {
      return (this.article.attachments || []).filter(att => !this.filesToDelete.includes(att.filename));
    }
  },
  watch: {
    article: {
      handler(newVal) {
        this.initialAttachments = JSON.parse(JSON.stringify(newVal.attachments || []));
        this.filesToDelete = [];
        this.pendingFiles = [];
      },
      deep: true
    }
  },
  methods: {
    handleFileSelect(event) {
      const file = event.target.files[0];
      this.fileError = null;
      
      if (!file) return;
      
      const allowedTypes = ALLOWED_FILE_TYPES;
      const allowedExts = ALLOWED_FILE_EXTENSIONS;
      
      if (!allowedTypes.includes(file.type) || !allowedExts.test(file.name)) {
        this.fileError = `Invalid file type. Only JPG, PNG, GIF, and PDF files are allowed.`;
        this.$refs.fileInput.value = '';
        return;
      }
      
      if (file.size > FILE_SIZE_LIMIT) {
        this.fileError = `File too large. Maximum size is 10MB.`;
        this.$refs.fileInput.value = '';
        return;
      }
      
      this.pendingFiles.push(file);
      this.$refs.fileInput.value = '';
    },
    removePendingFile(index) {
      this.pendingFiles.splice(index, 1);
    },
    markForDeletion(filename) {
      if (!this.filesToDelete.includes(filename)) {
        this.filesToDelete.push(filename);
      }
    },
    unmarkForDeletion(filename) {
      this.filesToDelete = this.filesToDelete.filter(f => f !== filename);
    },
    getAttachmentName(filename) {
      const att = this.article.attachments?.find(a => a.filename === filename);
      return att?.originalName || filename;
    },
    async handleSave() {
      this.error = null;
      this.saving = true;
      
      try {
        const currentWorkspaceId = this.article.workspace_id || this.article.Workspace?.id || '';
        const newWorkspaceId = this.editForm.workspace_id || '';
        
        const hasTextChanges = this.editForm.title.trim() !== this.article.title || 
                               this.editForm.content.trim() !== this.article.content ||
                               newWorkspaceId !== currentWorkspaceId;
        
        const hasPendingFiles = this.pendingFiles.length > 0;
        const hasFilesToDelete = this.filesToDelete.length > 0;
        
        if (!hasTextChanges && !hasPendingFiles && !hasFilesToDelete) {
          this.$emit('cancel');
          return;
        }
        
        // Delete marked files first
        if (hasFilesToDelete) {
          for (const filename of this.filesToDelete) {
            await axios.delete(`${API_BASE_URL}/api/articles/${this.article.id}/attachments/${filename}`);
          }
          const response = await axios.get(`${API_BASE_URL}/api/articles/${this.article.id}`);
          this.article.attachments = response.data.attachments || [];
          this.filesToDelete = [];
        }
        
        // Upload pending files
        if (hasPendingFiles) {
          for (const file of this.pendingFiles) {
            const formData = new FormData();
            formData.append('file', file);
            const response = await axios.post(`${API_BASE_URL}/api/articles/${this.article.id}/attachments`, formData);
            if (response.data.attachments) {
              this.article.attachments = [...response.data.attachments];
            }
          }
          this.pendingFiles = [];
        }
        
        // Update article text if changed
        if (hasTextChanges) {
          await axios.put(`${API_BASE_URL}/api/articles/${this.article.id}`, {
            title: this.editForm.title,
            content: this.editForm.content,
            workspace_id: this.editForm.workspace_id === '' ? null : this.editForm.workspace_id
          });
        } else if (hasPendingFiles || hasFilesToDelete) {
          await axios.post(`${API_BASE_URL}/api/articles/${this.article.id}/notify-update`, {
            title: this.article.title
          });
        }
        
        this.$emit('show-success', 'Article updated successfully');
        this.$emit('save');
      } catch (error) {
        this.error = error.response?.data?.error || 'Failed to update article';
      } finally {
        this.saving = false;
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

.btn-save:hover:not(:disabled) {
  background: #248556;
}

.btn-save:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-cancel {
  background: #686867;
}

.btn-cancel:hover:not(:disabled) {
  background: #5a5a59;
}

.btn-cancel:disabled {
  background: #ccc;
  cursor: not-allowed;
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
  margin-top: 20px;
  margin-bottom: 15px;
}

.file-input-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
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

.pending-files {
  background: #d1ecf1;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
  border: 1px solid #17a2b8;
}

.pending-files h3 {
  margin: 0 0 10px 0;
  font-size: 16px;
  color: #0c5460;
}

.pending-file-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pending-file-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: white;
  border-radius: 4px;
  border: 1px solid #17a2b8;
}

.pending-file-name {
  color: #333;
  font-size: 14px;
  flex: 1;
}

.btn-delete-pending {
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

.btn-delete-pending:hover {
  background: #c82333;
}

.files-to-delete {
  background: #f8d7da;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
  border: 1px solid #dc3545;
}

.files-to-delete h3 {
  margin: 0 0 10px 0;
  font-size: 16px;
  color: #721c24;
}

.delete-file-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.delete-file-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: white;
  border-radius: 4px;
  border: 1px solid #dc3545;
}

.delete-file-name {
  color: #333;
  font-size: 14px;
  flex: 1;
  text-decoration: line-through;
}

.btn-restore {
  background: #28a745;
  color: white;
  border: none;
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-restore:hover {
  background: #218838;
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

.version-notice {
  background: #d1ecf1;
  color: #0c5460;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 20px;
  border-left: 4px solid #17a2b8;
}
</style>
