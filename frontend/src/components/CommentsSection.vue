<template>
  <div class="comments-section">
    <h3>Comments ({{ comments.length }})</h3>
    
    <div class="add-comment">
      <textarea v-model="newComment" placeholder="Add a comment..." rows="3"></textarea>
      <div class="comment-form-actions">
        <button type="button" @click="handleAddComment" :disabled="!newComment.trim() || addingComment" class="btn-add-comment">
          {{ addingComment ? 'Adding...' : 'Add Comment' }}
        </button>
      </div>
    </div>
    
    <div v-if="comments.length > 0" class="comments-list">
      <div v-for="comment in comments" :key="comment.id" class="comment-item">
        <div class="comment-header">
          <div class="comment-meta">
            <span class="comment-author">{{ comment.User?.email || 'Unknown' }}</span>
            <span class="comment-date">{{ formatDate(comment.createdAt) }}</span>
          </div>
          <div class="comment-actions">
            <button type="button" @click="startEditComment(comment)" class="btn-edit-comment" v-if="editingCommentId !== comment.id && canEditComment(comment)">✎</button>
            <button type="button" @click="handleDeleteComment(comment.id)" class="btn-delete-comment" v-if="canEditComment(comment)">×</button>
          </div>
        </div>
        <div v-if="editingCommentId === comment.id" class="edit-comment">
          <textarea v-model="editingCommentContent" rows="3"></textarea>
          <div class="edit-comment-actions">
            <button type="button" @click="handleSaveEditComment(comment.id)" class="btn-save-comment">Save</button>
            <button type="button" @click="cancelEditComment" class="btn-cancel-comment">Cancel</button>
          </div>
        </div>
        <div v-else class="comment-content" v-html="sanitizeComment(comment.content)"></div>
      </div>
    </div>
    
    <div v-else class="no-comments">
      No comments yet. Be the first to comment!
    </div>
    
    <div v-if="error" class="error">{{ error }}</div>
  </div>
</template>

<script>
import api from '../api';
import { authAPI } from '../api/auth.js';
import DOMPurify from 'dompurify';

export default {
  name: 'CommentsSection',
  props: {
    articleId: {
      type: String,
      required: true
    },
    comments: {
      type: Array,
      default: () => []
    }
  },
  emits: ['comment-added', 'comment-updated', 'comment-deleted', 'show-success'],
  data() {
    return {
      newComment: '',
      addingComment: false,
      editingCommentId: null,
      editingCommentContent: '',
      error: null
    }
  },
  methods: {
    async handleAddComment() {
      if (!this.newComment.trim()) return;
      
      this.addingComment = true;
      this.error = null;
      try {
        await api.post(`/articles/${this.articleId}/comments`, {
          content: this.newComment.trim()
        });
        
        this.newComment = '';
        this.$emit('comment-added');
        this.$emit('show-success', 'Comment added successfully');
      } catch (error) {
        this.error = error.response?.data?.error || 'Failed to add comment';
      } finally {
        this.addingComment = false;
      }
    },
    async handleDeleteComment(commentId) {
      if (!confirm('Are you sure you want to delete this comment?')) return;
      
      this.error = null;
      try {
        await api.delete(`/comments/${commentId}`);
        this.$emit('comment-deleted');
        this.$emit('show-success', 'Comment deleted successfully');
      } catch (error) {
        this.error = error.response?.data?.error || 'Failed to delete comment';
      }
    },
    startEditComment(comment) {
      this.editingCommentId = comment.id;
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = comment.content;
      this.editingCommentContent = tempDiv.textContent || tempDiv.innerText || '';
    },
    cancelEditComment() {
      this.editingCommentId = null;
      this.editingCommentContent = '';
    },
    async handleSaveEditComment(commentId) {
      if (!this.editingCommentContent || !this.editingCommentContent.trim()) {
        this.error = 'Comment content cannot be empty';
        return;
      }
      
      this.error = null;
      try {
        await api.put(`/comments/${commentId}`, {
          content: this.editingCommentContent.trim()
        });
        
        this.editingCommentId = null;
        this.editingCommentContent = '';
        this.$emit('comment-updated');
        this.$emit('show-success', 'Comment updated successfully');
      } catch (error) {
        this.error = error.response?.data?.error || `Failed to update comment: ${error.message}`;
      }
    },
    formatDate(dateString) {
      return new Date(dateString).toLocaleString();
    },
    sanitizeComment(content) {
      // Preserve line breaks by converting to <br> tags before sanitization
      const contentWithBreaks = content.replace(/\n/g, '<br>');
      return DOMPurify.sanitize(contentWithBreaks, {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'b', 'i', 'span', 'div'],
        ALLOWED_ATTR: ['style']
      });
    },
    canEditComment(comment) {
      const currentUserEmail = authAPI.getUserEmail();
      return currentUserEmail && comment.User?.email === currentUserEmail;
    }
  }
}
</script>

<style scoped>
.comments-section {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 2px solid #eee;
}

.comments-section h3 {
  color: #333;
  margin-bottom: 20px;
  font-size: 18px;
}

.add-comment {
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #dee2e6;
}

.add-comment textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
  font-family: inherit;
  margin-bottom: 10px;
}

.comment-form-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.btn-add-comment {
  background: #248c58;
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  min-height: 48px;
}

.btn-add-comment:hover:not(:disabled) {
  background: #1e7349;
}

.btn-add-comment:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.comment-item {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 15px;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

.comment-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.comment-author {
  font-weight: 600;
  color: #248c58;
  font-size: 14px;
}

.comment-actions {
  display: flex;
  gap: 5px;
}

.comment-date {
  font-size: 12px;
  color: #6c757d;
}

.btn-edit-comment {
  background: #3574b8;
  color: white;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  padding: 0;
}

.btn-edit-comment:hover {
  background: #2a5fa0;
}

.btn-delete-comment {
  background: #ba3434;
  color: white;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  padding: 0;
}

.btn-delete-comment:hover {
  background: #a02d2d;
}

.edit-comment {
  margin-top: 10px;
}

.edit-comment textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
  font-family: inherit;
  margin-bottom: 10px;
}

.edit-comment-actions {
  display: flex;
  gap: 10px;
}

.btn-save-comment {
  background: #248c58;
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.btn-save-comment:hover {
  background: #1e7349;
}

.btn-cancel-comment {
  background: #6c757d;
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.btn-cancel-comment:hover {
  background: #5a6268;
}

.comment-content {
  color: #333;
  line-height: 1.5;
}

.comment-content :deep(p) {
  margin-bottom: 0.5em;
}

.comment-content :deep(strong) {
  font-weight: bold;
}

.comment-content :deep(em) {
  font-style: italic;
}

.no-comments {
  text-align: center;
  color: #6c757d;
  font-style: italic;
  padding: 20px;
}

.error {
  color: #dc3545;
  background: #f8d7da;
  padding: 10px;
  border-radius: 4px;
  margin-top: 10px;
}
</style>
