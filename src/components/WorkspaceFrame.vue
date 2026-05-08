<template>
  <div class="workspace-frame">
    <div class="frame-backdrop" aria-hidden="true">
      <div class="liquid-orb orb-primary"></div>
      <div class="liquid-orb orb-secondary"></div>
      <div class="liquid-orb orb-accent"></div>
      <div class="tech-grid"></div>
    </div>

    <aside class="workspace-sidebar">
      <div class="sidebar-brand">
        <div class="brand-icon">
          <Network />
        </div>
        <div>
          <h2>网络协同中枢</h2>
          <p>企业工单闭环系统</p>
        </div>
      </div>

      <nav class="sidebar-nav">
        <button
          v-for="item in navItems"
          :key="item.key"
          :class="['nav-item', { active: currentPage === item.key }]"
          @click="navigate(item.path)"
        >
          <component :is="item.icon" :size="18" />
          <span>{{ item.label }}</span>
        </button>
      </nav>

      <div class="sidebar-panel">
        <p class="sidebar-kicker">当前身份</p>
        <strong>{{ currentUser?.name || '未登录' }}</strong>
        <span>{{ roleName }}</span>
        <small>{{ currentUser?.countyName || '系统自动匹配员工档案' }}</small>
      </div>

      <div class="sidebar-actions">
        <button class="sidebar-primary" @click="$emit('create')">
          <PlusCircle :size="18" />
          <span>新建工单</span>
        </button>
        <button class="sidebar-ghost" @click="$emit('logout')">
          <LogOut :size="16" />
          <span>退出系统</span>
        </button>
      </div>
    </aside>

    <div class="workspace-main">
      <header class="workspace-topbar">
        <div class="topbar-copy">
          <p class="topbar-kicker">{{ eyebrow }}</p>
          <div class="topbar-title-row">
            <h1>{{ title }}</h1>
            <span class="topbar-date">
              <CalendarDays :size="14" />
              {{ currentDate }}
            </span>
          </div>
          <p v-if="subtitle" class="topbar-subtitle">{{ subtitle }}</p>
        </div>

        <div class="topbar-actions">
          <button class="theme-btn" @click="toggleTheme" :title="isDark ? '切换浅色模式' : '切换深色模式'">
            <SunMedium v-if="isDark" :size="16" />
            <MoonStar v-else :size="16" />
          </button>
          <button class="profile-chip" @click="navigate('/me')">
            <div class="profile-avatar">
              <UserRound :size="16" />
            </div>
            <div class="profile-copy">
              <strong>{{ currentUser?.name || '未登录' }}</strong>
              <span>{{ roleName }}</span>
            </div>
          </button>
        </div>
      </header>

      <main class="workspace-content">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  CalendarDays,
  Home,
  Layers3,
  LogOut,
  MoonStar,
  Network,
  PlusCircle,
  SunMedium,
  UserRound,
} from 'lucide-vue-next';
import userStore, { ROLE_NAMES } from '../stores/user';

const props = defineProps({
  currentPage: {
    type: String,
    default: 'home',
  },
  eyebrow: {
    type: String,
    default: '系统总览',
  },
  title: {
    type: String,
    default: '网络协同平台',
  },
  subtitle: {
    type: String,
    default: '',
  },
});

defineEmits(['create', 'logout']);

const router = useRouter();
const currentUser = computed(() => userStore.user.value);
const roleName = computed(() => ROLE_NAMES[currentUser.value?.role] || '未识别角色');

const navItems = [
  { key: 'home', label: '首页控制台', path: '/', icon: Home },
  { key: 'workspace', label: '个人中心 / 工单', path: '/me', icon: Layers3 },
];

const isDark = ref(document.documentElement.getAttribute('data-theme') === 'dark');

const currentDate = computed(() => new Date().toLocaleDateString('zh-CN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
}));

const navigate = (path) => {
  router.push(path);
};

const toggleTheme = () => {
  isDark.value = !isDark.value;
  const theme = isDark.value ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('sop-theme', theme);
};
</script>

<style scoped>
.workspace-frame {
  position: relative;
  min-height: 100vh;
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  color: var(--text-primary);
}

.frame-backdrop {
  position: fixed;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}

.liquid-orb {
  position: absolute;
  border-radius: 999px;
  filter: blur(72px);
  opacity: 0.22;
  animation: float-orb 18s ease-in-out infinite;
}

.orb-primary {
  top: -120px;
  left: -60px;
  width: 420px;
  height: 420px;
  background: rgba(59, 130, 246, 0.72);
}

.orb-secondary {
  right: -100px;
  top: 140px;
  width: 360px;
  height: 360px;
  background: rgba(16, 185, 129, 0.48);
  animation-delay: -6s;
}

.orb-accent {
  left: 30%;
  bottom: -180px;
  width: 420px;
  height: 420px;
  background: rgba(14, 165, 233, 0.34);
  animation-delay: -12s;
}

.tech-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(to right, var(--grid-color) 1px, transparent 1px),
    linear-gradient(to bottom, var(--grid-color) 1px, transparent 1px);
  background-size: 48px 48px;
  opacity: 0.65;
}

.workspace-sidebar,
.workspace-main {
  position: relative;
  z-index: 1;
}

.workspace-sidebar {
  display: flex;
  flex-direction: column;
  gap: 26px;
  padding: 28px 22px;
  border-right: 1px solid var(--panel-border);
  background: color-mix(in srgb, var(--bg-panel) 76%, transparent);
  backdrop-filter: blur(28px);
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 14px;
}

.brand-icon {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  border-radius: 18px;
  color: white;
  background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));
  box-shadow: 0 18px 40px rgba(59, 130, 246, 0.28);
}

.sidebar-brand h2 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.sidebar-brand p {
  margin: 4px 0 0;
  color: var(--text-tertiary);
  font-size: 0.82rem;
}

.sidebar-nav {
  display: grid;
  gap: 10px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 48px;
  padding: 0 16px;
  border-radius: 16px;
  border: 1px solid transparent;
  color: var(--text-secondary);
  background: transparent;
  transition: transform 180ms ease, border-color 180ms ease, background 180ms ease, color 180ms ease;
}

.nav-item:hover {
  transform: translateX(2px);
  border-color: var(--panel-border);
  background: color-mix(in srgb, var(--bg-surface) 84%, transparent);
  color: var(--text-primary);
}

.nav-item.active {
  border-color: rgba(59, 130, 246, 0.28);
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.14), rgba(59, 130, 246, 0.04));
  color: var(--brand-primary);
  box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.06);
}

.nav-item span {
  font-weight: 700;
  font-size: 0.95rem;
}

.sidebar-panel {
  margin-top: auto;
  padding: 18px;
  border-radius: 24px;
  border: 1px solid var(--panel-border);
  background: color-mix(in srgb, var(--bg-surface) 82%, transparent);
  box-shadow: 0 16px 36px var(--shadow-soft);
}

.sidebar-kicker {
  margin: 0 0 10px;
  color: var(--brand-primary);
  font-size: 0.72rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.sidebar-panel strong {
  display: block;
  font-size: 1rem;
}

.sidebar-panel span,
.sidebar-panel small {
  display: block;
  margin-top: 6px;
  color: var(--text-secondary);
  line-height: 1.55;
}

.sidebar-panel small {
  color: var(--text-tertiary);
}

.sidebar-actions {
  display: grid;
  gap: 10px;
}

.sidebar-primary,
.sidebar-ghost,
.theme-btn,
.profile-chip {
  transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease, background 180ms ease;
}

.sidebar-primary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 50px;
  border-radius: 18px;
  color: white;
  background: linear-gradient(135deg, var(--brand-primary), #2563eb);
  box-shadow: 0 16px 30px rgba(59, 130, 246, 0.26);
}

.sidebar-primary:hover,
.theme-btn:hover,
.profile-chip:hover {
  transform: translateY(-1px);
}

.sidebar-primary span,
.sidebar-ghost span {
  font-weight: 800;
}

.sidebar-ghost {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 46px;
  border-radius: 16px;
  border: 1px solid var(--panel-border);
  color: var(--text-secondary);
  background: color-mix(in srgb, var(--bg-surface) 76%, transparent);
}

.workspace-main {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.workspace-topbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 18px;
  padding: 24px 28px 16px;
  border-bottom: 1px solid var(--panel-border);
}

.topbar-kicker {
  margin: 0 0 8px;
  color: var(--brand-primary);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.topbar-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.topbar-title-row h1 {
  margin: 0;
  font-size: clamp(1.85rem, 2.2vw, 2.4rem);
  line-height: 1.05;
  letter-spacing: -0.04em;
}

.topbar-date {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 999px;
  color: var(--text-secondary);
  background: color-mix(in srgb, var(--bg-surface) 78%, transparent);
  border: 1px solid var(--panel-border);
  font-size: 0.82rem;
  font-weight: 700;
}

.topbar-subtitle {
  margin: 10px 0 0;
  color: var(--text-secondary);
  max-width: 760px;
  line-height: 1.7;
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.theme-btn {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: 16px;
  border: 1px solid var(--panel-border);
  color: var(--text-secondary);
  background: color-mix(in srgb, var(--bg-surface) 78%, transparent);
}

.profile-chip {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 52px;
  padding: 0 16px 0 10px;
  border-radius: 20px;
  border: 1px solid var(--panel-border);
  background: color-mix(in srgb, var(--bg-surface) 82%, transparent);
}

.profile-avatar {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  color: white;
  background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));
}

.profile-copy strong,
.profile-copy span {
  display: block;
  text-align: left;
}

.profile-copy strong {
  font-size: 0.92rem;
}

.profile-copy span {
  margin-top: 3px;
  color: var(--text-tertiary);
  font-size: 0.74rem;
}

.workspace-content {
  padding: 28px;
}

@keyframes float-orb {
  0%, 100% {
    transform: translate3d(0, 0, 0) scale(1);
  }
  50% {
    transform: translate3d(0, 18px, 0) scale(1.06);
  }
}

@media (max-width: 1080px) {
  .workspace-frame {
    grid-template-columns: 1fr;
  }

  .workspace-sidebar {
    gap: 18px;
    padding-bottom: 18px;
    border-right: none;
    border-bottom: 1px solid var(--panel-border);
  }

  .sidebar-nav {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .workspace-topbar,
  .workspace-content {
    padding-left: 20px;
    padding-right: 20px;
  }
}

@media (max-width: 720px) {
  .workspace-sidebar,
  .workspace-topbar,
  .workspace-content {
    padding-left: 16px;
    padding-right: 16px;
  }

  .workspace-topbar {
    flex-direction: column;
    align-items: stretch;
  }

  .topbar-actions {
    justify-content: space-between;
  }

  .sidebar-nav {
    grid-template-columns: 1fr;
  }

  .sidebar-panel {
    margin-top: 0;
  }

  .profile-chip {
    flex: 1;
  }
}
</style>
