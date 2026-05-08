import { createRouter, createWebHistory } from 'vue-router';
import Login from '../views/Login.vue';
import Panorama from '../views/Panorama.vue';
import OrderList from '../views/OrderList.vue';
import userStore from '../stores/user';

const routes = [
  {
    path: '/login',
    name: 'login',
    component: Login,
    meta: { requiresAuth: false },
  },
  {
    path: '/',
    name: 'panorama',
    component: Panorama,
    meta: { requiresAuth: true },
  },
  {
    path: '/me',
    name: 'profile-center',
    component: OrderList,
    meta: { requiresAuth: true },
  },
  {
    path: '/orders',
    redirect: (to) => ({ path: '/me', query: to.query }),
  },
  {
    path: '/orders/:id',
    redirect: (to) => ({ path: '/me', query: { ...to.query, selected: String(to.params.id) } }),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 路由守卫
router.beforeEach((to, from, next) => {
  const requiresAuth = to.meta.requiresAuth !== false;

  if (requiresAuth && !userStore.isLoggedIn.value) {
    // 需要登录但未登录，跳转到登录页
    next('/login');
  } else if (to.path === '/login' && userStore.isLoggedIn.value) {
    // 已登录访问登录页，跳转到首页
    next('/');
  } else {
    next();
  }
});

export default router;
