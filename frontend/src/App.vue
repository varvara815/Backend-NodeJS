<template>
  <div id="app">
    <header>
      <h1>Article Management System</h1>
      <nav>
        <button @click="currentView = 'list'" :class="{ active: currentView === 'list' }">
          Articles List
        </button>
        <button @click="currentView = 'create'" :class="{ active: currentView === 'create' }">
          Create Article
        </button>
      </nav>
    </header>

    <main>
      <ArticleList v-if="currentView === 'list'" @view-article="viewArticle" />
      <CreateArticle v-if="currentView === 'create'" @article-created="onArticleCreated" />
      <ViewArticle v-if="currentView === 'view'" :article-id="selectedArticleId" @back="currentView = 'list'" />
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
  data() {
    return {
      currentView: 'list',
      selectedArticleId: null
    }
  },
  methods: {
    viewArticle(id) {
      this.selectedArticleId = id
      this.currentView = 'view'
    },
    onArticleCreated() {
      this.currentView = 'list';
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
</style>