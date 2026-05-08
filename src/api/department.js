// 部门 API
import api from './index';

export const departmentsApi = {
  // 获取所有部门
  getAll() {
    return api.get('/departments');
  },

  // 获取三部门（网络部、客户响应中心、工程建设部）
  getThreeDepartments() {
    return api.get('/departments/three');
  },

  getTransferable() {
    return api.get('/departments/transferable');
  },

  // 获取部门详情
  getById(id) {
    return api.get(`/departments/${id}`);
  },
};
