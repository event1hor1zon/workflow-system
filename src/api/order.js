// 工单 API
import api from './index';

export const ordersApi = {
  // 创建工单
  create(data) {
    return api.post('/orders', data);
  },

  // 驳回后重新提交
  resubmit(id, data) {
    return api.patch(`/orders/${id}/resubmit`, data);
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

  // 县级经办人分配部门
  assign(id, data) {
    return api.patch(`/orders/${id}/assign`, data);
  },

  // 部门之间流转
  transfer(id, data) {
    return api.post(`/orders/${id}/transfer`, data);
  },

  // 处理工单（部门负责人）
  process(id, data) {
    return api.patch(`/orders/${id}/process`, data);
  },

  // 协同部门处理完成
  complete(id, data) {
    return api.patch(`/orders/${id}/complete`, data);
  },

  // 确认结束（发起人）
  confirm(id, data) {
    return api.patch(`/orders/${id}/confirm`, data);
  },

  // 驳回工单
  reject(id, data) {
    return api.patch(`/orders/${id}/reject`, data);
  },

  // 上传附件
  uploadAttachment(id, formData) {
    return api.post(`/orders/${id}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};
