// 工单 API
import api from './index';

export const ordersApi = {
  // 创建工单
  create(data) {
    return api.post('/orders', data);
  },

  // 获取工单列表
  getList(params = {}) {
    return api.get('/orders', { params });
  },

  // 获取工单详情
  getById(id) {
    return api.get(`/orders/${id}`);
  },

  // 获取工单拓扑信息
  getTopology(id) {
    return api.get(`/orders/${id}/topology`);
  },

  // 获取工单流转历史
  getFlows(id) {
    return api.get(`/orders/${id}/flows`);
  },

  // 流转工单（县级经办人）
  transfer(id, data) {
    return api.post(`/orders/${id}/transfer`, data);
  },

  // 处理工单（部门负责人）
  process(id, data) {
    return api.patch(`/orders/${id}/process`, data);
  },

  // 确认结束（发起人）
  confirm(id, data) {
    return api.patch(`/orders/${id}/confirm`, data);
  },

  // 驳回工单
  reject(id, data) {
    return api.patch(`/orders/${id}/reject`, data);
  },
};
