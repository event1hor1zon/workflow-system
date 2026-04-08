<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <span class="header-icon">🤝</span>
        <h1>握手协同 SOP</h1>
        <p>包头分公司网络条线工作流系统</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label>用户名</label>
          <input
            v-model="form.username"
            type="text"
            placeholder="请输入用户名"
            required
            :disabled="loading"
          />
        </div>

        <div class="form-group">
          <label>密码</label>
          <input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            required
            :disabled="loading"
          />
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <button type="submit" class="login-btn" :disabled="loading">
          <span v-if="loading">登录中...</span>
          <span v-else>登 录</span>
        </button>
      </form>

      <div class="login-footer">
        <p class="test-hint">测试账号: admin / 123456</p>
        <div class="role-list">
          <span class="role-item">普通员工</span>
          <span class="role-item">县级经办人</span>
          <span class="role-item">部门负责人</span>
          <span class="role-item">最高领导</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { authApi } from '../api/auth';
import userStore from '../stores/user';

const router = useRouter();

const form = ref({
  username: '',
  password: '',
});

const loading = ref(false);
const error = ref('');

const handleLogin = async () => {
  error.value = '';
  loading.value = true;

  try {
    const response = await authApi.login(form.value.username, form.value.password);
    userStore.login(response.user, response.access_token);
    router.push('/');
  } catch (err) {
    error.value = err.message || '登录失败，请检查用户名和密码';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  padding: 20px;
}

.login-card {
  background: var(--bg-card, #1e293b);
  border-radius: 16px;
  padding: 40px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.header-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 16px;
  animation: pulse-glow 2s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% { filter: drop-shadow(0 0 10px #60a5fa); }
  50% { filter: drop-shadow(0 0 25px #a78bfa); }
}

.login-header h1 {
  font-size: 28px;
  color: var(--text-primary, #f1f5f9);
  margin: 0 0 8px 0;
  background: linear-gradient(90deg, #60a5fa, #a78bfa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-size: 200% 200%;
  animation: gradient-shift 3s ease infinite;
}

@keyframes gradient-shift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.login-header p {
  color: var(--text-secondary, #94a3b8);
  margin: 0;
  font-size: 0.9rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 14px;
  color: var(--text-secondary, #94a3b8);
}

.form-group input {
  padding: 12px 16px;
  border: 1px solid var(--border-color, #334155);
  border-radius: 8px;
  background: var(--bg-secondary, #0f172a);
  color: var(--text-primary, #f1f5f9);
  font-size: 16px;
  transition: border-color 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: var(--accent, #3b82f6);
}

.form-group input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-group input::placeholder {
  color: var(--text-muted, #64748b);
}

.error-message {
  padding: 12px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  color: #ef4444;
  font-size: 14px;
  text-align: center;
}

.login-btn {
  padding: 14px;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(59, 130, 246, 0.4);
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-footer {
  margin-top: 24px;
  text-align: center;
}

.test-hint {
  color: var(--text-muted, #64748b);
  font-size: 12px;
  margin: 0 0 12px 0;
}

.role-list {
  display: flex;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}

.role-item {
  padding: 4px 10px;
  background: var(--bg-secondary);
  border-radius: 12px;
  font-size: 0.7rem;
  color: var(--text-muted);
}
</style>
