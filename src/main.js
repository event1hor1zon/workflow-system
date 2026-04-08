import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
import router from './router';

// 创建应用实例
const app = createApp(App);

// 注册路由
app.use(router);

// 挂载应用
app.mount('#app');

// 初始化主题
const savedTheme = localStorage.getItem('sop-theme');
if (savedTheme) {
  document.documentElement.setAttribute('data-theme', savedTheme);
} else {
  document.documentElement.setAttribute('data-theme', 'dark');
}
