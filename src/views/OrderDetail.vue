<template>
  <div class="order-detail-container">
    <!-- 顶部导航 -->
    <div class="detail-header">
      <div class="header-left">
        <button class="back-btn" @click="goBack">
          <span>←</span>
          <span>返回</span>
        </button>
        <div class="order-id-badge">{{ order?.id || '加载中...' }}</div>
      </div>
      <div class="header-right">
        <span :class="['status-badge', order?.status]">
          {{ statusText }}
        </span>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <span>加载中...</span>
    </div>

    <!-- 工单详情 -->
    <div v-else-if="order" class="detail-content">
      <!-- 基本信息 -->
      <div class="info-section">
        <h2 class="section-title">📋 工单信息</h2>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">标题</span>
            <span class="info-value">{{ order.title }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">类型</span>
            <span class="info-value">{{ orderTypeText }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">优先级</span>
            <span :class="['priority-tag', order.priority]">
              {{ priorityText }}
            </span>
          </div>
          <div class="info-item">
            <span class="info-label">发起人</span>
            <span class="info-value">{{ order.creatorName }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">发起时间</span>
            <span class="info-value">{{ formatDate(order.createdAt) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">当前环节</span>
            <span class="info-value highlight">{{ order.currentNode }}</span>
          </div>
        </div>
        <div v-if="order.description" class="description-box">
          <span class="info-label">详细描述</span>
          <p class="description-text">{{ order.description }}</p>
        </div>
      </div>

      <!-- 拓扑图 -->
      <div class="topology-section">
        <h2 class="section-title">🔄 流转拓扑图</h2>
        <div class="topology-wrapper">
          <TopologyGraph
            :nodes="topologyNodes"
            :connections="topologyConnections"
            :width="topologyWidth"
            :height="topologyHeight"
            @node-click="handleTopologyNodeClick"
          />
        </div>
      </div>

      <!-- 流转历史 -->
      <div class="history-section">
        <h2 class="section-title">📜 流转历史</h2>
        <div class="timeline">
          <div
            v-for="(item, index) in flowHistory"
            :key="index"
            :class="['timeline-item', { latest: index === 0 }]"
          >
            <div class="timeline-marker">
              <span class="marker-icon">{{ item.icon }}</span>
            </div>
            <div class="timeline-content">
              <div class="timeline-header">
                <span class="timeline-action">{{ item.action }}</span>
                <span class="timeline-time">{{ formatDate(item.time) }}</span>
              </div>
              <div class="timeline-body">
                <span class="timeline-dept">{{ item.department }}</span>
                <span v-if="item.handler" class="timeline-handler">
                  处理人: {{ item.handler }}
                </span>
              </div>
              <div v-if="item.note" class="timeline-note">
                {{ item.note }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 操作区域 -->
      <div v-if="availableActions.length" class="action-section">
        <h2 class="section-title">⚡ 可执行操作</h2>

        <!-- 县级经办人：选择流转部门 -->
        <div v-if="canTransfer" class="action-card">
          <h3 class="action-title">流转工单</h3>
          <p class="action-desc">选择要流转到的部门（可多选）</p>
          <div class="dept-checkboxes">
            <label
              v-for="dept in targetDepts"
              :key="dept.id"
              class="dept-checkbox"
            >
              <input
                type="checkbox"
                :value="dept.id"
                v-model="selectedDepts"
              />
              <span class="checkbox-label">
                <span class="dept-icon">{{ dept.icon }}</span>
                <span class="dept-name">{{ dept.name }}</span>
              </span>
            </label>
          </div>
          <button
            class="action-btn primary"
            @click="handleTransfer"
            :disabled="selectedDepts.length === 0"
          >
            确认流转
          </button>
        </div>

        <!-- 部门负责人：处理工单 -->
        <div v-if="canProcess" class="action-card">
          <h3 class="action-title">处理工单</h3>
          <div class="form-group">
            <label>处理结果</label>
            <select v-model="processResult">
              <option value="resolved">已解决</option>
              <option value="partial">部分解决</option>
              <option value="unresolved">未解决</option>
            </select>
          </div>
          <div class="form-group">
            <label>处理说明</label>
            <textarea
              v-model="processNote"
              placeholder="请输入处理说明..."
              rows="3"
            ></textarea>
          </div>
          <button class="action-btn primary" @click="handleProcess">
            提交处理
          </button>
        </div>

        <!-- 发起人：确认结束 -->
        <div v-if="canConfirm && order.status === 'waiting_confirm'" class="action-card">
          <h3 class="action-title">确认结束</h3>
          <p class="action-desc">确认工单处理结果，结束工单流程</p>
          <div class="confirm-buttons">
            <button class="action-btn success" @click="handleConfirm('normal')">
              普通确认
            </button>
            <button
              v-if="order.priority === 'critical'"
              class="action-btn warning"
              @click="handleConfirm('critical')"
            >
              重大事件确认
            </button>
          </div>
        </div>

        <!-- 驳回操作 -->
        <div v-if="canReject" class="action-card reject-card">
          <h3 class="action-title">驳回工单</h3>
          <div class="form-group">
            <label>驳回原因</label>
            <textarea
              v-model="rejectReason"
              placeholder="请输入驳回原因..."
              rows="2"
            ></textarea>
          </div>
          <button
            class="action-btn danger"
            @click="handleReject"
            :disabled="!rejectReason"
          >
            确认驳回
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import TopologyGraph from '../components/TopologyGraph.vue';
import userStore from '../stores/user';
import { ordersApi } from '../api/order';

const router = useRouter();
const route = useRoute();

// 状态
const loading = ref(true);
const order = ref(null);

// 操作相关
const selectedDepts = ref([]);
const processResult = ref('resolved');
const processNote = ref('');
const rejectReason = ref('');

// 拓扑图尺寸
const topologyWidth = ref(800);
const topologyHeight = ref(400);

// 目标部门
const targetDepts = ref([
  { id: 'gjjsc', name: '工程建设部', icon: '🏗️' },
  { id: 'wlb', name: '网络部', icon: '🌐' },
  { id: 'kxyx', name: '客户响应中心', icon: '📡' },
]);

// 状态映射
const statusMap = {
  pending: '待处理',
  processing: '处理中',
  waiting_confirm: '待确认',
  completed: '已完成',
  rejected: '已驳回',
};

// 状态文本
const statusText = computed(() => {
  return statusMap[order.value?.status] || order.value?.statusText || '未知';
});

// 类型文本
const orderTypeText = computed(() => {
  const typeMap = {
    '5g': '5G基站建设',
    'broadband': '家宽建设',
    'enterprise': '政企专线',
    'shop': '沿街商铺',
    'industry': '垂直行业',
    'maintenance': '集家客维护',
    'resource': '现网资源维护',
  };
  return typeMap[order.value?.type] || order.value?.type || '其他';
});

// 优先级文本
const priorityText = computed(() => {
  const priorityMap = {
    normal: '一般',
    urgent: '紧急',
    critical: '重大',
  };
  return priorityMap[order.value?.priority] || '一般';
});

// 拓扑节点
const topologyNodes = computed(() => {
  if (!order.value) return [];

  const nodes = [
    {
      id: 'start',
      name: order.value.creatorName || '发起人',
      icon: '👤',
      status: 'completed',
      x: 100,
      y: 200,
      isEllipse: false,
      radius: 40,
    },
    {
      id: 'county',
      name: order.value.countyName || '县级经办',
      icon: '🏢',
      status: 'completed',
      x: 200,
      y: 200,
      isEllipse: false,
      radius: 35,
    },
    // 椭圆形三部门
    {
      id: 'gjjsc',
      name: '工程建设部',
      icon: '🏗️',
      status: order.value.currentNode === '工程建设部' ? 'current' : 'pending',
      isCurrent: order.value.currentNode === '工程建设部',
      isEllipse: true,
      radiusX: 60,
      radiusY: 40,
      angle: -60,
      x: 350,
      y: 100,
    },
    {
      id: 'wlb',
      name: '网络部',
      icon: '🌐',
      status: order.value.currentNode === '网络部' ? 'current' : 'completed',
      isCurrent: order.value.currentNode === '网络部',
      isEllipse: true,
      radiusX: 60,
      radiusY: 40,
      angle: 0,
      x: 500,
      y: 200,
    },
    {
      id: 'kxyx',
      name: '客户响应中心',
      icon: '📡',
      status: order.value.currentNode === '客户响应中心' ? 'current' : 'pending',
      isCurrent: order.value.currentNode === '客户响应中心',
      isEllipse: true,
      radiusX: 60,
      radiusY: 40,
      angle: 60,
      x: 350,
      y: 300,
    },
    {
      id: 'end',
      name: '闭环存档',
      icon: '✅',
      status: order.value.status === 'completed' ? 'completed' : 'pending',
      x: 700,
      y: 200,
      isEllipse: false,
      radius: 40,
    },
  ];

  // 根据当前状态更新节点状态
  const currentIndex = nodes.findIndex(n => n.isCurrent);
  nodes.forEach((node, index) => {
    if (index < currentIndex && node.id !== 'end') {
      node.status = 'completed';
    }
  });

  return nodes;
});

// 拓扑连接线
const topologyConnections = computed(() => {
  return [
    { path: 'M 100 200 L 200 200', isActive: true },
    { path: 'M 200 200 L 350 200', isActive: true },
    { path: 'M 500 200 L 600 200', isActive: true },
    { path: 'M 600 200 L 700 200', isActive: true },
    // 椭圆连接
    { path: 'M 350 100 Q 425 150 500 200', isActive: true },
    { path: 'M 500 200 Q 425 250 350 300', isActive: true },
    { path: 'M 350 300 L 600 200', isActive: true },
  ];
});

// 流转历史
const flowHistory = computed(() => {
  if (!order.value?.history) {
    return [
      {
        action: '工单创建',
        department: '发起人',
        icon: '📝',
        time: order.value?.createdAt,
        note: order.value?.description,
      },
      {
        action: '县级受理',
        department: order.value?.countyName || '县级经办',
        handler: order.value?.countyHandler,
        icon: '🏢',
        time: order.value?.countyTime,
      },
      {
        action: '部门处理中',
        department: order.value?.currentNode,
        icon: '🔄',
        time: new Date().toISOString(),
      },
    ];
  }
  return order.value.history;
});

// 权限判断
const canTransfer = computed(() => {
  return userStore.isCountyHandler.value && order.value?.status === 'pending';
});

const canProcess = computed(() => {
  return userStore.isDepartmentHead.value && order.value?.status === 'processing';
});

const canConfirm = computed(() => {
  return userStore.isUser.value || userStore.isTopLeader.value;
});

const canReject = computed(() => {
  return userStore.isDepartmentHead.value || userStore.isCountyHandler.value;
});

// 可用操作
const availableActions = computed(() => {
  const actions = [];
  if (canTransfer.value) actions.push('transfer');
  if (canProcess.value) actions.push('process');
  if (canConfirm.value && order.value?.status === 'waiting_confirm') {
    actions.push('confirm');
  }
  if (canReject.value) actions.push('reject');
  return actions;
});

// 加载工单详情
const loadOrderDetail = async () => {
  loading.value = true;
  const orderId = route.params.id;

  try {
    const response = await ordersApi.getById(orderId);
    order.value = response.data || response;
  } catch (error) {
    console.error('加载工单详情失败:', error);
    // 使用模拟数据
    order.value = {
      id: orderId,
      title: '昆区某小区5G基站建设需求',
      type: '5g',
      priority: 'normal',
      status: 'processing',
      creatorName: '李明',
      countyName: '昆都仑区',
      currentNode: '网络部',
      countyHandler: '王磊',
      createdAt: '2026-04-08 09:00:00',
      description: '需要在昆区某小区建设5G基站，覆盖居民区，提升网络服务质量。',
      progress: 45,
    };
  } finally {
    loading.value = false;
  }
};

// 处理拓扑节点点击
const handleTopologyNodeClick = (node) => {
  console.log('点击节点:', node);
};

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// 流转工单
const handleTransfer = async () => {
  if (selectedDepts.value.length === 0) return;

  try {
    await ordersApi.transfer(order.value.id, {
      targetDepts: selectedDepts.value,
    });
    alert('工单已流转');
    loadOrderDetail();
  } catch (error) {
    console.error('流转失败:', error);
    alert('流转失败，请重试');
  }
};

// 处理工单
const handleProcess = async () => {
  try {
    await ordersApi.process(order.value.id, {
      result: processResult.value,
      note: processNote.value,
    });
    alert('处理成功');
    loadOrderDetail();
  } catch (error) {
    console.error('处理失败:', error);
    alert('处理失败，请重试');
  }
};

// 确认结束
const handleConfirm = async (type) => {
  try {
    await ordersApi.confirm(order.value.id, { type });
    alert('工单已结束');
    router.push('/orders');
  } catch (error) {
    console.error('确认失败:', error);
    alert('确认失败，请重试');
  }
};

// 驳回工单
const handleReject = async () => {
  if (!rejectReason.value) return;

  try {
    await ordersApi.reject(order.value.id, {
      reason: rejectReason.value,
    });
    alert('工单已驳回');
    loadOrderDetail();
  } catch (error) {
    console.error('驳回失败:', error);
    alert('驳回失败，请重试');
  }
};

// 返回列表
const goBack = () => {
  router.push('/orders');
};

// 响应式拓扑图尺寸
const updateTopologySize = () => {
  const width = window.innerWidth;
  if (width < 768) {
    topologyWidth.value = width - 40;
    topologyHeight.value = 300;
  } else {
    topologyWidth.value = 800;
    topologyHeight.value = 400;
  }
};

onMounted(() => {
  updateTopologySize();
  window.addEventListener('resize', updateTopologySize);
  loadOrderDetail();
});
</script>

<style scoped>
.order-detail-container {
  min-height: 100vh;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 0.9rem;
  cursor: pointer;
}

.order-id-badge {
  font-family: monospace;
  font-size: 0.9rem;
  color: var(--text-muted);
}

.status-badge {
  padding: 6px 14px;
  border-radius: 14px;
  font-size: 0.85rem;
  font-weight: 600;
}

.status-badge.pending {
  background: rgba(167, 139, 250, 0.2);
  color: #a78bfa;
}

.status-badge.processing {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

.status-badge.waiting_confirm {
  background: rgba(96, 165, 250, 0.2);
  color: #60a5fa;
}

.status-badge.completed {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.status-badge.rejected {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  gap: 16px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-color);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 内容区域 */
.detail-content {
  padding: 20px 24px;
  max-width: 900px;
  margin: 0 auto;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--accent);
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
}

/* 信息区域 */
.info-section,
.topology-section,
.history-section,
.action-section {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.info-value {
  font-size: 0.95rem;
  color: var(--text-primary);
}

.info-value.highlight {
  color: var(--accent);
  font-weight: 600;
}

.priority-tag {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  width: fit-content;
}

.priority-tag.normal {
  background: rgba(148, 163, 184, 0.2);
  color: #94a3b8;
}

.priority-tag.urgent {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

.priority-tag.critical {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.description-box {
  margin-top: 16px;
  padding: 12px;
  background: var(--bg-secondary);
  border-radius: 8px;
}

.description-text {
  margin: 8px 0 0 0;
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.6;
}

/* 拓扑图 */
.topology-wrapper {
  background: var(--bg-secondary);
  border-radius: 8px;
  padding: 16px;
  min-height: 300px;
}

/* 时间线 */
.timeline {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.timeline-item {
  display: flex;
  gap: 16px;
  padding: 16px 0;
  border-bottom: 1px solid var(--border-color);
  position: relative;
}

.timeline-item:last-child {
  border-bottom: none;
}

.timeline-item.latest {
  background: var(--accent-bg);
  margin: 0 -20px;
  padding: 16px 20px;
  border-radius: 8px;
}

.timeline-marker {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.timeline-item.latest .timeline-marker {
  border-color: var(--accent);
  background: var(--accent);
}

.marker-icon {
  font-size: 1.2rem;
}

.timeline-content {
  flex: 1;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.timeline-action {
  font-weight: 600;
  color: var(--text-primary);
}

.timeline-time {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.timeline-body {
  display: flex;
  gap: 16px;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.timeline-handler {
  color: var(--text-muted);
}

.timeline-note {
  margin-top: 8px;
  padding: 8px 12px;
  background: var(--bg-secondary);
  border-radius: 6px;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

/* 操作区域 */
.action-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.action-card:last-child {
  margin-bottom: 0;
}

.action-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: var(--text-primary);
}

.action-desc {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin: 0 0 16px 0;
}

.dept-checkboxes {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.dept-checkbox {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.dept-checkbox input {
  display: none;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: var(--bg-card);
  border: 2px solid var(--border-color);
  border-radius: 8px;
  transition: all 0.2s;
}

.dept-checkbox input:checked + .checkbox-label {
  border-color: var(--accent);
  background: var(--accent-bg);
}

.dept-icon {
  font-size: 1.2rem;
}

.dept-name {
  font-size: 0.9rem;
  color: var(--text-primary);
}

.form-group {
  margin-bottom: 12px;
}

.form-group label {
  display: block;
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 0.9rem;
}

.form-group textarea {
  resize: vertical;
}

.action-btn {
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.action-btn.primary {
  background: var(--accent);
  color: white;
}

.action-btn.primary:hover:not(:disabled) {
  opacity: 0.9;
}

.action-btn.primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn.success {
  background: #10b981;
  color: white;
}

.action-btn.warning {
  background: #f59e0b;
  color: #0f172a;
}

.action-btn.danger {
  background: #ef4444;
  color: white;
}

.confirm-buttons {
  display: flex;
  gap: 12px;
}

.confirm-buttons .action-btn {
  flex: 1;
}

.reject-card {
  border-color: rgba(239, 68, 68, 0.3);
}

/* 响应式 */
@media (max-width: 768px) {
  .detail-content {
    padding: 16px;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .timeline-body {
    flex-direction: column;
    gap: 4px;
  }

  .dept-checkboxes {
    flex-direction: column;
  }

  .confirm-buttons {
    flex-direction: column;
  }
}
</style>
