<template>
  <button class="theme-toggle" @click="toggleTheme" :title="isDark ? '切换浅色模式' : '切换深色模式'">
    <span class="toggle-icon">{{ isDark ? '🌙' : '☀️' }}</span>
  </button>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const isDark = ref(true)

function toggleTheme() {
  isDark.value = !isDark.value
  document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light')
  localStorage.setItem('sop-theme', isDark.value ? 'dark' : 'light')
}

onMounted(() => {
  const saved = localStorage.getItem('sop-theme')
  if (saved) {
    isDark.value = saved === 'dark'
    document.documentElement.setAttribute('data-theme', saved)
  }
})
</script>

<style scoped>
.theme-toggle {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 9999;
  background: rgba(30, 41, 59, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 50%;
  width: 44px;
  height: 44px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  backdrop-filter: blur(8px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}
.theme-toggle:hover {
  transform: scale(1.1);
  background: rgba(59, 130, 246, 0.8);
}
.toggle-icon {
  font-size: 1.4rem;
  line-height: 1;
}

/* Light mode styles */
:global([data-theme="light"]) {
  --bg-primary: #f8fafc;
  --bg-secondary: #e2e8f0;
  --bg-card: #ffffff;
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-muted: #94a3b8;
  --border-color: #cbd5e1;
  --accent: #3b82f6;
}

:global([data-theme="dark"]) {
  --bg-primary: #0a0a1a;
  --bg-secondary: #1e293b;
  --bg-card: #1e293b;
  --text-primary: #e2e8f0;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;
  --border-color: #334155;
  --accent: #60a5fa;
}
</style>
