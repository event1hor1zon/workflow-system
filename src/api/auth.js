// 认证 API
import api from './index';

export const authApi = {
  login(username, password) {
    return api.post('/auth/login', { username, password });
  },

  logout() {
    return api.post('/auth/logout');
  },
};

export const usersApi = {
  getProfile() {
    return api.get('/auth/me');
  },
  getAll() {
    return api.get('/users');
  },
  getLeaders() {
    return api.get('/users/leaders');
  },
};
