// 旗县 API
import api from './index';

export const countiesApi = {
  // 获取所有旗县
  getAll() {
    return api.get('/counties');
  },

  // 获取旗县详情
  getById(id) {
    return api.get(`/counties/${id}`);
  },

  // 获取旗县下的用户
  getUsers(countyId) {
    return api.get(`/counties/${countyId}/users`);
  },
};
