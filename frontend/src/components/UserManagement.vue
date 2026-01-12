<template>
  <div class="user-management">
    <h2>User Management</h2>
    
    <div v-if="loading" class="loading">Loading users...</div>
    
    <div v-else-if="error" class="error">{{ error }}</div>
    
    <table v-else class="users-table">
      <thead>
        <tr>
          <th>Email</th>
          <th>Role</th>
          <th>Registered</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in users" :key="user.id">
          <td>{{ user.email }}</td>
          <td>
            <span :class="['role-badge', user.role]">{{ user.role }}</span>
          </td>
          <td>{{ formatDate(user.createdAt) }}</td>
          <td>
            <select 
              :value="user.role" 
              @change="updateRole(user.id, $event.target.value)"
              :disabled="user.id === currentUserId"
              class="role-select"
              :class="{ 'disabled': user.id === currentUserId }"
            >
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
            <span v-if="user.id === currentUserId" class="current-user-badge">(You)</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import api from '../api/index.js';
import { authAPI } from '../api/auth.js';

export default {
  name: 'UserManagement',
  data() {
    return {
      users: [],
      loading: true,
      error: null,
      currentUserId: null
    };
  },
  mounted() {
    this.currentUserId = authAPI.getUserId();
    this.loadUsers();
  },
  methods: {
    async loadUsers() {
      try {
        this.loading = true;
        this.error = null;
        const response = await api.get('/users');
        this.users = response.data;
      } catch (error) {
        this.error = 'Failed to load users';
        if (error.response?.status === 403) {
          this.$emit('auth-error');
        }
      } finally {
        this.loading = false;
      }
    },
    async updateRole(userId, newRole) {
      if (userId === this.currentUserId) {
        this.error = 'You cannot change your own role';
        setTimeout(() => this.error = null, 3000);
        return;
      }
      
      try {
        await api.put(`/users/${userId}/role`, { role: newRole });
        const user = this.users.find(u => u.id === userId);
        if (user) {
          user.role = newRole;
        }
      } catch (error) {
        this.error = error.response?.data?.error || 'Failed to update role';
        if (error.response?.status === 403) {
          this.$emit('auth-error');
        }
      }
    },
    formatDate(dateString) {
      return new Date(dateString).toLocaleDateString();
    }
  }
};
</script>

<style scoped>
.user-management {
  padding: 20px;
}

h2 {
  margin-bottom: 20px;
  color: #333;
}

.loading, .error {
  padding: 20px;
  text-align: center;
}

.error {
  color: #e74c3c;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

.users-table th,
.users-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.users-table th {
  background: #f8f9fa;
  font-weight: bold;
  color: #333;
}

.role-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
}

.role-badge.admin {
  background: #e74c3c;
  color: white;
}

.role-badge.user {
  background: #3574b8;
  color: white;
}

.role-select {
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
}

.role-select:hover:not(:disabled) {
  border-color: #3574b8;
}

.role-select.disabled,
.role-select:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
  opacity: 0.6;
}

.current-user-badge {
  margin-left: 8px;
  color: #3574b8;
  font-size: 12px;
  font-weight: bold;
}
</style>
