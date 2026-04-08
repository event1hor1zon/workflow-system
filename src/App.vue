<template>
  <div id="app" :data-theme="currentTheme">
    <router-view />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const currentTheme = ref('dark');

// 从 localStorage 恢复主题设置
onMounted(() => {
  const savedTheme = localStorage.getItem('sop-theme');
  if (savedTheme) {
    currentTheme.value = savedTheme;
    document.documentElement.setAttribute('data-theme', savedTheme);
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
});
</script>

<style>
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>
