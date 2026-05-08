<template>
  <div class="login-page">
    <div class="login-backdrop" aria-hidden="true">
      <div class="login-orb orb-a"></div>
      <div class="login-orb orb-b"></div>
      <div class="login-orb orb-c"></div>
      <div class="tech-grid"></div>
    </div>

    <button
      class="theme-toggle"
      @click="toggleTheme"
      :title="isDark ? '切换浅色模式' : '切换深色模式'"
    >
      <SunMedium v-if="isDark" :size="18" />
      <MoonStar v-else :size="18" />
    </button>

    <section class="login-shell">
      <div class="login-brand-panel glass-panel">
        <div class="brand-chip">
          <span class="chip-dot"></span>
          中国移动包头分公司 · 网络协同中枢
        </div>

        <div class="brand-copy">
          <div class="brand-mark">
            <Network :size="26" />
          </div>
          <h1>企业网络条线工单协同平台</h1>
          <p>
            按工号识别员工档案和权限，工单自动流转至所属公司网络部负责人，
            市级部门定级处理后完成闭环确认。
          </p>
        </div>

        <div class="brand-flow">
          <article class="flow-node">
            <strong>01</strong>
            <span>员工发起</span>
          </article>
          <article class="flow-node">
            <strong>02</strong>
            <span>公司网络部审核</span>
          </article>
          <article class="flow-node">
            <strong>03</strong>
            <span>市级三部门处理</span>
          </article>
          <article class="flow-node">
            <strong>04</strong>
            <span>确认闭环</span>
          </article>
        </div>

        <div class="brand-footer">
          <div class="brand-metric">
            <ShieldCheck :size="16" />
            <span>重大工单双确认机制</span>
          </div>
          <div class="brand-metric">
            <Building2 :size="16" />
            <span>所属公司自动识别</span>
          </div>
          <div class="brand-metric">
            <Mic :size="16" />
            <span>支持语音转文字提单</span>
          </div>
        </div>
      </div>

      <div class="login-card glass-panel">
        <div class="login-card-head">
          <div class="login-logo">
            <Network :size="30" />
          </div>
          <h2>授权登录</h2>
          <p>请输入工号和密码进入协同工作台</p>
        </div>

        <form class="login-form" @submit.prevent="handleLogin">
          <label class="field">
            <span>工号 / EMPLOYEE_ID</span>
            <div class="field-box">
              <UserRound :size="18" />
              <input
                v-model="form.username"
                type="text"
                placeholder="请输入工号"
                required
                :disabled="loading"
              />
            </div>
          </label>

          <label class="field">
            <span>密码 / PASSWORD</span>
            <div class="field-box">
              <KeyRound :size="18" />
              <input
                v-model="form.password"
                type="password"
                placeholder="请输入密码"
                required
                :disabled="loading"
              />
            </div>
          </label>

          <p v-if="error" class="error-message">{{ error }}</p>

          <button type="submit" class="login-btn" :disabled="loading">
            <span>{{ loading ? '登录中...' : '进入系统' }}</span>
            <ArrowRight :size="18" />
          </button>
        </form>

        <div class="login-footer">
          <p class="footer-label">测试账号</p>
          <div class="account-grid">
            <span>admin / 123456</span>
            <span>user_a1 / 123456</span>
            <span>a_county_handler / 123456</span>
            <span>leader / 123456</span>
          </div>
          <div class="role-list">
            <span>公司员工</span>
            <span>公司网络部负责人</span>
            <span>市级部门负责人</span>
            <span>最高领导</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  ArrowRight,
  Building2,
  KeyRound,
  Mic,
  MoonStar,
  Network,
  ShieldCheck,
  SunMedium,
  UserRound,
} from 'lucide-vue-next';
import { authApi } from '../api/auth';
import userStore from '../stores/user';

const router = useRouter();

const form = ref({
  username: '',
  password: '',
});

const loading = ref(false);
const error = ref('');
const isDark = ref(false);

const toggleTheme = () => {
  isDark.value = !isDark.value;
  const theme = isDark.value ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('sop-theme', theme);
};

const handleLogin = async () => {
  error.value = '';
  loading.value = true;

  try {
    const response = await authApi.login(form.value.username, form.value.password);
    userStore.login(response.user, response.access_token);
    router.push('/');
  } catch (err) {
    error.value = err.message || '登录失败，请检查工号和密码';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  isDark.value = document.documentElement.getAttribute('data-theme') === 'dark';
});
</script>

<style scoped>
.login-page {
  position: relative;
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 28px;
  overflow: hidden;
}

.login-backdrop {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.login-orb {
  position: absolute;
  border-radius: 999px;
  filter: blur(72px);
  opacity: 0.24;
  animation: drift 18s ease-in-out infinite;
}

.orb-a {
  top: -120px;
  left: -120px;
  width: 420px;
  height: 420px;
  background: rgba(59, 130, 246, 0.72);
}

.orb-b {
  right: -120px;
  bottom: -120px;
  width: 360px;
  height: 360px;
  background: rgba(16, 185, 129, 0.5);
  animation-delay: -6s;
}

.orb-c {
  left: 48%;
  top: 20%;
  width: 300px;
  height: 300px;
  background: rgba(14, 165, 233, 0.32);
  animation-delay: -11s;
}

.theme-toggle {
  position: absolute;
  top: 28px;
  right: 28px;
  z-index: 2;
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  border-radius: 18px;
  color: var(--text-secondary);
  border: 1px solid var(--panel-border);
  background: color-mix(in srgb, var(--bg-surface) 76%, transparent);
  box-shadow: 0 16px 36px var(--shadow-soft);
  backdrop-filter: blur(24px);
}

.login-shell {
  position: relative;
  z-index: 1;
  width: min(1180px, 100%);
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(380px, 0.72fr);
  gap: 24px;
  align-items: stretch;
}

.login-brand-panel,
.login-card {
  border-radius: 36px;
}

.login-brand-panel {
  padding: 34px;
}

.brand-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 34px;
  padding: 0 14px;
  border-radius: 999px;
  color: var(--brand-primary);
  background: rgba(59, 130, 246, 0.1);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.chip-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--brand-primary);
  box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.12);
}

.brand-copy {
  margin-top: 34px;
}

.brand-mark {
  width: 74px;
  height: 74px;
  display: grid;
  place-items: center;
  border-radius: 28px;
  color: white;
  background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));
  box-shadow: 0 20px 46px rgba(59, 130, 246, 0.3);
}

.brand-copy h1 {
  margin: 24px 0 14px;
  font-size: clamp(2.4rem, 4vw, 4rem);
  line-height: 0.98;
  letter-spacing: -0.05em;
}

.brand-copy p {
  margin: 0;
  max-width: 580px;
  color: var(--text-secondary);
  font-size: 1rem;
  line-height: 1.8;
}

.brand-flow {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-top: 34px;
}

.flow-node {
  min-height: 128px;
  padding: 18px;
  border-radius: 24px;
  border: 1px solid var(--panel-border);
  background: color-mix(in srgb, var(--bg-surface) 72%, transparent);
}

.flow-node strong {
  display: inline-grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 14px;
  color: var(--brand-primary);
  background: rgba(59, 130, 246, 0.1);
  font-family: "JetBrains Mono", monospace;
}

.flow-node span {
  display: block;
  margin-top: 20px;
  font-weight: 700;
  line-height: 1.6;
}

.brand-footer {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-top: 34px;
}

.brand-metric {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 54px;
  padding: 0 16px;
  border-radius: 18px;
  border: 1px solid var(--panel-border);
  background: color-mix(in srgb, var(--bg-surface) 82%, transparent);
  color: var(--text-secondary);
  font-weight: 700;
}

.login-card {
  padding: 34px 30px 28px;
}

.login-card-head {
  text-align: center;
}

.login-logo {
  width: 78px;
  height: 78px;
  margin: 0 auto 22px;
  display: grid;
  place-items: center;
  border-radius: 30px;
  color: white;
  background: linear-gradient(135deg, var(--brand-primary), #2563eb);
  box-shadow: 0 24px 50px rgba(59, 130, 246, 0.28);
}

.login-card-head h2 {
  margin: 0;
  font-size: 2rem;
  letter-spacing: -0.04em;
}

.login-card-head p {
  margin: 10px 0 0;
  color: var(--text-secondary);
  line-height: 1.7;
}

.login-form {
  display: grid;
  gap: 18px;
  margin-top: 32px;
}

.field {
  display: grid;
  gap: 10px;
}

.field > span {
  color: var(--text-tertiary);
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.field-box {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 62px;
  padding: 0 18px;
  border-radius: 20px;
  border: 1px solid var(--panel-border);
  background: color-mix(in srgb, var(--bg-surface) 78%, transparent);
  color: var(--text-tertiary);
}

.field-box:focus-within {
  border-color: rgba(59, 130, 246, 0.34);
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.08);
}

.field-box input {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 1rem;
  font-weight: 600;
}

.field-box input::placeholder {
  color: var(--text-muted);
}

.error-message {
  margin: 0;
  padding: 12px 14px;
  border-radius: 18px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.18);
  color: var(--brand-danger);
  font-size: 0.9rem;
}

.login-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 62px;
  margin-top: 8px;
  border-radius: 22px;
  color: white;
  background: linear-gradient(135deg, var(--brand-primary), #2563eb);
  box-shadow: 0 20px 42px rgba(59, 130, 246, 0.28);
}

.login-btn span {
  font-size: 1rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.login-footer {
  margin-top: 28px;
  padding-top: 24px;
  border-top: 1px solid var(--panel-border);
}

.footer-label {
  margin: 0 0 12px;
  color: var(--text-tertiary);
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.account-grid,
.role-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.account-grid span,
.role-list span {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid var(--panel-border);
  background: color-mix(in srgb, var(--bg-surface) 72%, transparent);
  color: var(--text-secondary);
  font-size: 0.8rem;
  font-weight: 600;
}

.role-list {
  margin-top: 12px;
}

@keyframes drift {
  0%,
  100% {
    transform: translate3d(0, 0, 0) scale(1);
  }
  50% {
    transform: translate3d(0, 16px, 0) scale(1.06);
  }
}

@media (max-width: 1080px) {
  .login-shell {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .login-page {
    padding: 16px;
  }

  .theme-toggle {
    top: 16px;
    right: 16px;
  }

  .login-brand-panel,
  .login-card {
    padding: 22px 20px;
    border-radius: 28px;
  }

  .brand-flow,
  .brand-footer {
    grid-template-columns: 1fr;
  }
}
</style>
