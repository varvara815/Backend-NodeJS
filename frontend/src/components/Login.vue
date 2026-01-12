<template>
  <div class="auth-container">
    <div class="auth-form">
      <h2>Login</h2>
      <form @submit.prevent="login">
        <div class="form-group">
          <label for="email">Email:</label>
          <input
            type="email"
            id="email"
            v-model="email"
            required
            placeholder="Enter your email"
          />
        </div>
        <div class="form-group">
          <label for="password">Password:</label>
          <input
            type="password"
            id="password"
            v-model="password"
            required
            placeholder="Enter your password"
          />
        </div>
        <button type="submit" :disabled="loading">
          {{ loading ? 'Logging in...' : 'Login' }}
        </button>
        <div v-if="error" class="error">{{ error }}</div>
      </form>
      <p class="auth-switch">
        Don't have an account? 
        <a href="#" @click.prevent="$emit('switch-to-register')">Register here</a>
      </p>
    </div>
  </div>
</template>

<script>
import { authAPI } from '../api/auth.js';

export default {
  name: 'Login',
  emits: ['login-success', 'switch-to-register'],
  data() {
    return {
      email: '',
      password: '',
      loading: false,
      error: null
    }
  },
  methods: {
    async login() {
      this.loading = true;
      this.error = null;

      try {
        const { data, ok } = await authAPI.login(this.email, this.password);

        if (ok) {
          this.$emit('login-success');
        } else {
          this.error = data.error || 'Login failed';
        }
      } catch (error) {
        this.error = 'Network error. Please try again.';
      } finally {
        this.loading = false;
      }
    }
  }
}
</script>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f5f5;
}

.auth-form {
  background: white;
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  width: 100%;
  max-width: 400px;
}

.auth-form h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #333;
}

.form-group input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  outline: none;
}

.form-group input:focus {
  border-color: #3574b8;
}

button {
  width: 100%;
  background: #3574b8;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}

button:hover:not(:disabled) {
  background: #2a5fa0;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.error {
  color: #e74c3c;
  margin-top: 10px;
  text-align: center;
}

.auth-switch {
  text-align: center;
  margin-top: 20px;
  color: #666;
}

.auth-switch a {
  color: #3574b8;
  text-decoration: none;
}

.auth-switch a:hover {
  text-decoration: underline;
}
</style>