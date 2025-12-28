<template>
  <div class="auth-container">
    <div class="auth-form">
      <h2>Register</h2>
      <form @submit.prevent="register">
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
            placeholder="Enter your password (min 6 characters)"
            minlength="6"
          />
        </div>
        <div class="form-group">
          <label for="confirmPassword">Confirm Password:</label>
          <input
            type="password"
            id="confirmPassword"
            v-model="confirmPassword"
            required
            placeholder="Confirm your password"
          />
        </div>
        <button type="submit" :disabled="loading">
          {{ loading ? 'Registering...' : 'Register' }}
        </button>
        <div v-if="error" class="error">{{ error }}</div>
        <div v-if="success" class="success">{{ success }}</div>
      </form>
      <p class="auth-switch">
        Already have an account? 
        <a href="#" @click.prevent="$emit('switch-to-login')">Login here</a>
      </p>
    </div>
  </div>
</template>

<script>
import { authAPI } from '../api/auth.js';

export default {
  name: 'Register',
  emits: ['register-success', 'switch-to-login'],
  data() {
    return {
      email: '',
      password: '',
      confirmPassword: '',
      loading: false,
      error: null,
      success: null
    }
  },
  methods: {
    async register() {
      this.loading = true;
      this.error = null;
      this.success = null;

      if (this.password !== this.confirmPassword) {
        this.error = 'Passwords do not match';
        this.loading = false;
        return;
      }
      
      // Frontend validation can be kept for good UX
      if (this.password.length < 6) { 
        this.error = 'Password must be at least 6 characters';
        this.loading = false;
        return;
      }

      try {
        const { data, ok } = await authAPI.register(this.email, this.password);

        if (ok) {
          this.success = 'Registration successful! You can now login.';
          setTimeout(() => {
            this.$emit('register-success');
          }, 2000);
        } else {
          this.error = data.error || 'Registration failed';
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

.success {
  color: #2c9e65;
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