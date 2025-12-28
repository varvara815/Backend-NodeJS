<template>
  <div id="app">
    <!-- Loading state -->
    <div v-if="appLoading" class="app-loading">
      <div class="spinner"></div>
      <p>Loading...</p>
    </div>

    <!-- App content -->
    <template v-else>
      <div v-if="notification" class="notification">{{ notification }}</div>
      
      <!-- Authentication Views -->
      <div v-if="!isAuthenticated">
        <Login v-if="authView === 'login'" @login-success="onLoginSuccess" @switch-to-register="authView = 'register'" />
        <Register v-if="authView === 'register'" @register-success="authView = 'login'" @switch-to-login="authView = 'login'" />
      </div>

      <!-- Main Application -->
      <div v-else>
      <header>
        <div class="header-content">
          <h1>Article Management System</h1>
          <div class="user-info">
            <span>Welcome, {{ userEmail }}</span>
            <button @click="logout" class="logout-btn">Logout</button>
          </div>
        </div>
        <nav>
          <button @click="goToList" :class="{ active: currentView === 'list' }">
            Articles List
          </button>
          <button @click="goToCreate" :class="{ active: currentView === 'create' }">
            Create Article
          </button>
        </nav>
        <div class="workspace-selector" v-if="workspaces.length > 0">
          <label>Workspace:</label>
          <select v-model="selectedWorkspace" @change="selectWorkspace(selectedWorkspace)">
            <option value="">All Workspaces</option>
            <option v-for="workspace in workspaces" :key="workspace.id" :value="workspace.id">
              {{ workspace.name }}
            </option>
            <option value="uncategorized">Uncategorized</option>
          </select>
        </div>
      </header>

      <main>
        <ArticleList v-if="currentView === 'list'" @view-article="viewArticle" :workspace-id="selectedWorkspace" ref="articleList" @auth-error="logout" />
        <CreateArticle v-if="currentView === 'create'" @article-created="onArticleCreated" :workspaces="workspaces" :selected-workspace="selectedWorkspace" @auth-error="logout" />
        <ViewArticle v-if="currentView === 'view'" :article-id="selectedArticleId" @back="currentView = 'list'" @article-deleted="onArticleDeleted" ref="viewArticle" @auth-error="logout" />
      </main>
    </div>
    </template>
  </div>
</template>

<script>
import ArticleList from './components/ArticleList.vue'
import CreateArticle from './components/CreateArticle.vue'
import ViewArticle from './components/ViewArticle.vue'
import Login from './components/Login.vue'
import Register from './components/Register.vue'
import { authAPI } from './api/auth.js'
import api from './api/index.js'

export default {
  name: 'App',
  components: {
    ArticleList,
    CreateArticle,
    ViewArticle,
    Login,
    Register
  },
  provide() {
    return {
      getWebSocket: () => this.ws
    }
  },
  data() {
    return {
      currentView: 'list',
      selectedArticleId: null,
      notification: null,
      ws: null,
      workspaces: [],
      selectedWorkspace: '',
      authView: 'login',
      isAuthenticated: false,
      userEmail: '',
      appLoading: true
    }
  },
  async mounted() {
    await this.checkAuthentication();
    if (this.isAuthenticated) {
      authAPI.startTokenCheck(); // Start token expiry checking
      this.connectWebSocket();
      this.loadWorkspaces();
      this.restoreStateFromURL();
    }
    this.appLoading = false;
    window.addEventListener('popstate', this.handlePopState);
    window.addEventListener('auth-logout', (e) => this.logout(e.detail?.reason)); // Listen for custom logout event
  },
  beforeUnmount() {
    if (this.ws) this.ws.close();
    window.removeEventListener('popstate', this.handlePopState);
    window.removeEventListener('auth-logout', (e) => this.logout(e.detail?.reason)); // Clean up the event listener
  },
  methods: {
    async checkAuthentication() {
      if (!authAPI.hasToken()) {
        this.isAuthenticated = false;
        return;
      }

      const valid = await authAPI.verifyToken();
      if (valid) {
        this.isAuthenticated = true;
        this.userEmail = authAPI.getUserEmail();
      } else {
        this.logout();
      }
    },
    async onLoginSuccess() {
      await this.checkAuthentication();
      authAPI.startTokenCheck(); // Start token expiry checking after login
      this.connectWebSocket();
      this.loadWorkspaces();
      this.restoreStateFromURL();
    },
    logout(reason) {
      authAPI.logout();
      this.isAuthenticated = false;
      this.userEmail = '';
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }
      this.authView = 'login';
      if (reason === 'expired') {
        this.showNotification('Your session has expired. Please log in again.');
      }
    },
    connectWebSocket() {
      this.ws = new WebSocket('ws://localhost:3001');
      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        // Don't show notification if user is currently editing this article
        const isEditingThisArticle = this.currentView === 'view' && 
                                    this.selectedArticleId === data.articleId && 
                                    this.$refs.viewArticle?.editing;
        
        if (data.type === 'article-updated' && !isEditingThisArticle) {
          this.showNotification(`Article "${data.title}" was updated`);
        } else if (data.type === 'attachment-added' && !isEditingThisArticle) {
          this.showNotification(`Article "${data.title}" was updated`);
        }
      };
      // Auto-reconnect on connection loss
      this.ws.onclose = () => {
        setTimeout(() => this.connectWebSocket(), 3000);
      };
    },
    viewArticle(id) {
      this.selectedArticleId = id;
      this.currentView = 'view';
      this.updateURL();
    },
    onArticleCreated() {
      this.currentView = 'list';
      this.updateURL();
    },
    showNotification(message) {
      this.notification = message;
      setTimeout(() => this.notification = null, 3000);
    },
    updateURL() {
      const url = new URL(window.location);
      if (this.currentView === 'view' && this.selectedArticleId) {
        url.searchParams.set('article', this.selectedArticleId);
        url.searchParams.delete('view');
      } else if (this.currentView === 'create') {
        url.searchParams.set('view', 'create');
        url.searchParams.delete('article');
      } else {
        url.searchParams.delete('article');
        url.searchParams.delete('view');
      }
      window.history.pushState({}, '', url);
    },
    restoreStateFromURL() {
      const params = new URLSearchParams(window.location.search);
      const articleId = params.get('article');
      const view = params.get('view');
      
      if (articleId) {
        this.selectedArticleId = articleId;
        this.currentView = 'view';
      } else if (view === 'create') {
        this.currentView = 'create';
      } else {
        this.currentView = 'list';
      }
    },
    goToList() {
      this.currentView = 'list';
      this.selectedArticleId = null;
      this.updateURL();
    },
    goToCreate() {
      this.currentView = 'create';
      this.selectedArticleId = null;
      this.updateURL();
    },
    handlePopState() {
      this.restoreStateFromURL();
    },
    async loadWorkspaces() {
      try {
        const response = await api.get('/workspaces');
        this.workspaces = response.data || [];
      } catch (error) {
        console.error('Error loading workspaces:', error);
      }
    },
    selectWorkspace(workspaceId) {
      this.selectedWorkspace = workspaceId;
    },
    onArticleDeleted() {
      this.currentView = 'list';
      this.selectedArticleId = null;
      this.updateURL();
      this.$nextTick(() => {
        const articleListComponent = this.$refs.articleList;
        if (articleListComponent && articleListComponent.loadArticles) {
          articleListComponent.loadArticles();
        }
      });
    }
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: Arial, sans-serif;
  background-color: #f5f5f5;
}

#app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

header {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

header h1 {
  margin: 0;
  color: #333;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 15px;
  color: #666;
}

.logout-btn {
  background: #e74c3c;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.logout-btn:hover {
  background: #c0392b;
}

nav button {
  background: #3574b8;
  color: white;
  border: none;
  padding: 12px 28px;
  margin-right: 10px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
  font-size: 16px;
}

nav button:hover {
  background: #2a5fa0;
}

nav button.active {
  background: #2c9e65;
}

.workspace-selector {
  margin-top: 15px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.workspace-selector label {
  font-weight: bold;
  color: #333;
}

.workspace-selector select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #f8f9fa;
  font-size: 14px;
  outline: none;
}

main {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.notification {
  position: fixed;
  top: 20px;
  right: 20px;
  background: #fff3cd;
  color: #856404;
  padding: 15px 20px;
  border-radius: 4px;
  border: 1px solid #ffeaa7;
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  z-index: 1000;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.app-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 20px;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3574b8;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.app-loading p {
  color: #666;
  font-size: 18px;
}
</style>