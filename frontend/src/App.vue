<template>
  <div id="app">
    <div v-if="notification" class="notification">{{ notification }}</div>
    <header>
      <h1>Article Management System</h1>
      <nav>
        <button @click="goToList" :class="{ active: currentView === 'list' }">
          Articles List
        </button>
        <button @click="goToCreate" :class="{ active: currentView === 'create' }">
          Create Article
        </button>
      </nav>
    </header>

    <main>
      <ArticleList v-if="currentView === 'list'" @view-article="viewArticle" />
      <CreateArticle v-if="currentView === 'create'" @article-created="onArticleCreated" />
      <ViewArticle v-if="currentView === 'view'" :article-id="selectedArticleId" @back="currentView = 'list'" ref="viewArticle" />
    </main>
  </div>
</template>

<script>
import ArticleList from './components/ArticleList.vue'
import CreateArticle from './components/CreateArticle.vue'
import ViewArticle from './components/ViewArticle.vue'

export default {
  name: 'App',
  components: {
    ArticleList,
    CreateArticle,
    ViewArticle
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
      ws: null
    }
  },
  mounted() {
    this.connectWebSocket();
    this.restoreStateFromURL();
    window.addEventListener('popstate', this.handlePopState);
  },
  beforeUnmount() {
    if (this.ws) this.ws.close();
    window.removeEventListener('popstate', this.handlePopState);
  },
  methods: {
    connectWebSocket() {
      this.ws = new WebSocket('ws://localhost:3001');
      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        const isEditingThisArticle = this.currentView === 'view' && 
                                    this.selectedArticleId === data.articleId && 
                                    this.$refs.viewArticle?.editing;
        
        const isViewingThisArticle = this.currentView === 'view' && 
                                    this.selectedArticleId === data.articleId;
        
        if (data.type === 'article-updated' && !isEditingThisArticle) {
          this.showNotification(`Article "${data.title}" was updated`);
        } else if (data.type === 'attachment-added' && !isEditingThisArticle) {
          this.showNotification(`Article "${data.title}" was updated`);
        } else if (data.type === 'attachment-deleted' && !isEditingThisArticle) {
          this.showNotification(`Article "${data.title}" was updated`);
        }
      };
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

header h1 {
  margin-bottom: 15px;
  color: #333;
}

nav button {
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  margin-right: 10px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

nav button:hover {
  background: #0056b3;
}

nav button.active {
  background: #28a745;
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
  background: #28a745;
  color: white;
  padding: 15px 20px;
  border-radius: 4px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  z-index: 1000;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from { transform: translateX(400px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
</style>