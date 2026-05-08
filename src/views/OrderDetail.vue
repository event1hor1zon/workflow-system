<template>
  <div class="order-detail-container">
    <div class="detail-header">
      <div class="header-left">
        <button class="back-btn" @click="goBack">
          <span>←</span>
          <span>返回</span>
        </button>
        <div class="order-id-badge">{{ order?.id || route.params.id }}</div>
      </div>
      <div class="header-right">
        <span :class="['status-badge', order?.status]">
          {{ order?.statusText || '加载中' }}
        </span>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <span>加载中...</span>
    </div>

    <div v-else-if="error" class="loading-state">
      <span>{{ error }}</span>
      <button class="action-btn primary" @click="loadOrderDetail">重新加载</button>
    </div>

    <div v-else-if="order" class="detail-content">
      <section class="info-section">
        <h2 class="section-title">工单信息</h2>
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
              {{ order.priorityText }}
            </span>
          </div>
          <div class="info-item">
            <span class="info-label">发起人</span>
            <span class="info-value">{{ order.creatorName }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">所属旗县</span>
            <span class="info-value">{{ order.creatorCountyName || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">当前环节</span>
            <span class="info-value highlight">{{ order.currentNode }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">当前部门</span>
            <span class="info-value">{{ order.currentDepartmentName || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">创建时间</span>
            <span class="info-value">{{ formatDate(order.createTime) }}</span>
          </div>
        </div>
        <div v-if="order.description" class="description-box">
          <span class="info-label">详细描述</span>
          <p class="description-text">{{ order.description }}</p>
        </div>
      </section>

      <section class="topology-section">
        <h2 class="section-title">流转拓扑图</h2>
        <div class="topology-wrapper">
          <TopologyGraph
            :nodes="topologyNodes"
            :connections="topologyConnections"
            :width="topologyWidth"
            :height="topologyHeight"
            @node-click="handleTopologyNodeClick"
          />
        </div>
      </section>

      <section class="history-section">
        <h2 class="section-title">流转历史</h2>
        <div v-if="flowHistory.length" class="timeline">
          <div v-for="item in flowHistory" :key="item.id" class="timeline-item">
            <div class="timeline-marker">{{ item.icon }}</div>
            <div class="timeline-content">
              <div class="timeline-header">
                <span class="timeline-action">{{ item.action }}</span>
                <span class="timeline-time">{{ formatDate(item.time) }}</span>
              </div>
              <div class="timeline-body">
                <span>{{ item.department }}</span>
                <span v-if="item.handler">处理人：{{ item.handler }}</span>
              </div>
              <div v-if="item.note" class="timeline-note">{{ item.note }}</div>
            </div>
          </div>
        </div>
        <div v-else class="empty-block">暂无流转记录</div>
      </section>

      <section v-if="approvalList.length" class="history-section">
        <h2 class="section-title">审批状态</h2>
        <div class="approval-list">
          <div v-for="approval in approvalList" :key="approval.id" class="approval-item">
            <span>{{ approval.approverName }}</span>
            <span>{{ approval.approvalType === 'creator' ? '发起人确认' : '最高领导确认' }}</span>
            <span :class="['approval-status', approval.status]">
              {{ approval.status === 'approved' ? '已确认' : '待确认' }}
            </span>
          </div>
        </div>
      </section>

      <section v-if="hasAvailableActions" class="action-section">
        <h2 class="section-title">可执行操作</h2>

        <div v-if="permissions.canAssign" class="action-card">
          <h3 class="action-title">县级经办分配</h3>
          <div class="form-group">
            <label>目标部门</label>
            <select v-model="assignDepartmentId">
              <option value="">请选择</option>
              <option v-for="department in coreDepartments" :key="department.id" :value="department.id">
                {{ department.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>备注</label>
            <textarea v-model="assignComment" rows="3" placeholder="选填"></textarea>
          </div>
          <button
            class="action-btn primary"
            :disabled="!assignDepartmentId || saving"
            @click="handleAssign"
          >
            {{ saving ? '提交中...' : '确认分配' }}
          </button>
        </div>

        <div v-if="permissions.canTransfer" class="action-card">
          <h3 class="action-title">部门流转</h3>
          <div class="form-group">
            <label>目标部门</label>
            <select v-model="transferDepartmentId">
              <option value="">请选择</option>
              <option
                v-for="department in transferTargets"
                :key="department.id"
                :value="department.id"
              >
                {{ department.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>流转说明</label>
            <textarea v-model="transferComment" rows="3" placeholder="请输入流转原因或补充说明"></textarea>
          </div>
          <button
            class="action-btn primary"
            :disabled="!transferDepartmentId || saving"
            @click="handleTransfer"
          >
            {{ saving ? '提交中...' : '确认流转' }}
          </button>
        </div>

        <div v-if="permissions.canProcess" class="action-card">
          <h3 class="action-title">提交处理结果</h3>
          <div class="form-group">
            <label>事件级别</label>
            <select v-model="processPriority">
              <option value="normal">一般</option>
              <option value="urgent">紧急</option>
              <option value="critical">重大</option>
            </select>
          </div>
          <div class="form-group">
            <label>处理说明</label>
            <textarea v-model="processComment" rows="3" placeholder="请输入处理结果"></textarea>
          </div>
          <button class="action-btn primary" :disabled="saving" @click="handleProcess">
            {{ saving ? '提交中...' : '提交处理并进入确认' }}
          </button>
        </div>

        <div v-if="permissions.canConfirm" class="action-card">
          <h3 class="action-title">确认处理结果</h3>
          <p class="action-desc">{{ pendingApprovalLabel }}</p>
          <button class="action-btn success" :disabled="saving" @click="handleConfirm">
            {{ saving ? '提交中...' : '确认通过' }}
          </button>
        </div>

        <div v-if="permissions.canReject" class="action-card reject-card">
          <h3 class="action-title">驳回工单</h3>
          <div class="form-group">
            <label>驳回原因</label>
            <textarea
              v-model="rejectReason"
              rows="3"
              placeholder="请输入驳回原因"
            ></textarea>
          </div>
          <button
            class="action-btn danger"
            :disabled="!rejectReason || saving"
            @click="handleReject"
          >
            {{ saving ? '提交中...' : '确认驳回' }}
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import TopologyGraph from '../components/TopologyGraph.vue';
import userStore from '../stores/user';
import { departmentsApi } from '../api/department';
import { ordersApi } from '../api/order';

const router = useRouter();
const route = useRoute();

const loading = ref(true);
const saving = ref(false);
const error = ref('');
const order = ref(null);
const coreDepartments = ref([]);
const topologyWidth = ref(800);
const topologyHeight = ref(400);

const assignDepartmentId = ref('');
const assignComment = ref('');
const transferDepartmentId = ref('');
const transferComment = ref('');
const processPriority = ref('normal');
const processComment = ref('');
const rejectReason = ref('');

const orderTypeMap = {
  other: '其他',
  '5g': '5G基站建设',
  broadband: '家宽建设',
  enterprise: '政企专线',
  shop: '沿街商铺',
  industry: '垂直行业',
  maintenance: '集家客维护',
  resource: '现网资源维护',
};

const permissions = computed(() => order.value?.permissions || {});
const approvalList = computed(() => order.value?.approvals || []);

const hasAvailableActions = computed(() =>
  permissions.value.canAssign ||
  permissions.value.canTransfer ||
  permissions.value.canProcess ||
  permissions.value.canConfirm ||
  permissions.value.canReject,
);

const orderTypeText = computed(() => {
  if (!order.value) {
    return '-';
  }

  return orderTypeMap[order.value.type] || order.value.type || '其他';
});

const transferTargets = computed(() =>
  coreDepartments.value.filter((department) => department.id !== order.value?.currentDepartmentId),
);

const visitedDepartmentIds = computed(() => {
  const departmentIds = new Set();

  (order.value?.flows || []).forEach((flow) => {
    if (flow.fromDepartmentId) {
      departmentIds.add(flow.fromDepartmentId);
    }

    if (flow.toDepartmentId) {
      departmentIds.add(flow.toDepartmentId);
    }
  });

  return departmentIds;
});

const topologyNodes = computed(() => {
  if (!order.value) {
    return [];
  }

  const positionMap = {
    engineering: { x: 350, y: 100, icon: '🏗️' },
    network: { x: 500, y: 200, icon: '🌐' },
    maintenance: { x: 350, y: 300, icon: '📡' },
  };

  const departmentNodes = coreDepartments.value.map((department) => {
    const position = positionMap[department.type] || { x: 350, y: 200, icon: '📌' };
    const isCurrent =
      order.value.status === 'processing' && order.value.currentDepartmentId === department.id;
    const isVisited = visitedDepartmentIds.value.has(department.id);

    return {
      id: `dept-${department.id}`,
      name: department.name,
      icon: position.icon,
      status: isCurrent ? 'current' : isVisited ? 'completed' : 'pending',
      isCurrent,
      isEllipse: true,
      radiusX: 60,
      radiusY: 40,
      x: position.x,
      y: position.y,
    };
  });

  return [
    {
      id: 'creator',
      name: order.value.creatorName,
      icon: '👤',
      status: 'completed',
      x: 100,
      y: 200,
      radius: 38,
    },
    {
      id: 'county',
      name: order.value.creatorCountyName || '县级经办',
      icon: '🏢',
      status: order.value.status === 'pending' ? 'current' : 'completed',
      isCurrent: order.value.status === 'pending',
      x: 200,
      y: 200,
      radius: 36,
    },
    ...departmentNodes,
    {
      id: 'end',
      name: '闭环存档',
      icon: '✅',
      status:
        order.value.status === 'completed'
          ? 'completed'
          : order.value.status === 'waiting_confirm'
            ? 'current'
            : 'pending',
      isCurrent: order.value.status === 'waiting_confirm',
      x: 700,
      y: 200,
      radius: 38,
    },
  ];
});

const topologyConnections = computed(() => [
  { path: 'M 100 200 L 200 200', isActive: true },
  { path: 'M 200 200 L 350 200', isActive: true },
  { path: 'M 500 200 L 600 200', isActive: true },
  { path: 'M 600 200 L 700 200', isActive: true },
  { path: 'M 350 100 Q 425 150 500 200', isActive: true },
  { path: 'M 500 200 Q 425 250 350 300', isActive: true },
  { path: 'M 350 300 Q 350 200 350 100', isActive: true },
]);

const flowHistory = computed(() => {
  const iconMap = {
    create: '📝',
    assign: '📥',
    transfer: '🔄',
    process: '✅',
    confirm: '✍️',
    reject: '⛔',
  };

  return [...(order.value?.flows || [])]
    .reverse()
    .map((flow) => ({
      id: flow.id,
      action: flow.actionText,
      time: flow.createTime,
      department: flow.toDepartmentName || flow.fromDepartmentName || '系统',
      handler: flow.operatorName,
      note: flow.comment,
      icon: iconMap[flow.action] || '📌',
    }));
});

const pendingApprovalLabel = computed(() => {
  const pendingApproval = approvalList.value.find(
    (approval) =>
      approval.userId === userStore.user.value?.id &&
      approval.status === 'pending',
  );

  if (!pendingApproval) {
    return '当前没有待确认审批';
  }

  return pendingApproval.approvalType === 'creator'
    ? '请确认处理结果并完成闭环'
    : '请以最高领导身份完成重大事件确认';
});

const updateTopologySize = () => {
  if (window.innerWidth < 768) {
    topologyWidth.value = window.innerWidth - 32;
    topologyHeight.value = 320;
    return;
  }

  topologyWidth.value = 800;
  topologyHeight.value = 400;
};

const loadOrderDetail = async () => {
  loading.value = true;
  error.value = '';

  try {
    const [orderResponse, departmentResponse] = await Promise.all([
      ordersApi.getById(route.params.id),
      departmentsApi.getThreeDepartments(),
    ]);

    order.value = orderResponse;
    coreDepartments.value = departmentResponse || [];
    processPriority.value = order.value.priority || 'normal';
  } catch (err) {
    error.value = err.message || '加载工单详情失败';
  } finally {
    loading.value = false;
  }
};

const withAction = async (handler) => {
  saving.value = true;

  try {
    await handler();
    await loadOrderDetail();
  } catch (err) {
    window.alert(err.message || '操作失败，请重试');
  } finally {
    saving.value = false;
  }
};

const handleAssign = async () => {
  if (!assignDepartmentId.value) {
    return;
  }

  await withAction(async () => {
    await ordersApi.assign(order.value.id, {
      departmentId: Number(assignDepartmentId.value),
      comment: assignComment.value,
    });

    assignDepartmentId.value = '';
    assignComment.value = '';
  });
};

const handleTransfer = async () => {
  if (!transferDepartmentId.value) {
    return;
  }

  await withAction(async () => {
    await ordersApi.transfer(order.value.id, {
      targetDepartmentId: Number(transferDepartmentId.value),
      comment: transferComment.value,
    });

    transferDepartmentId.value = '';
    transferComment.value = '';
  });
};

const handleProcess = async () => {
  await withAction(async () => {
    await ordersApi.process(order.value.id, {
      priority: processPriority.value,
      comment: processComment.value,
    });

    processComment.value = '';
  });
};

const handleConfirm = async () => {
  await withAction(async () => {
    await ordersApi.confirm(order.value.id, {});
  });
};

const handleReject = async () => {
  if (!rejectReason.value) {
    return;
  }

  await withAction(async () => {
    await ordersApi.reject(order.value.id, {
      reason: rejectReason.value,
    });

    rejectReason.value = '';
  });
};

const goBack = () => {
  router.push('/orders');
};

const handleTopologyNodeClick = () => {};

const formatDate = (dateStr) => {
  if (!dateStr) {
    return '-';
  }

  return new Date(dateStr).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

onMounted(() => {
  updateTopologySize();
  window.addEventListener('resize', updateTopologySize);
  loadOrderDetail();
});

onUnmounted(() => {
  window.removeEventListener('resize', updateTopologySize);
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
  gap: 16px;
  padding: 16px 24px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.header-left,
.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-card);
  color: var(--text-primary);
}

.order-id-badge {
  font-family: monospace;
  color: var(--text-secondary);
}

.status-badge {
  padding: 6px 14px;
  border-radius: 999px;
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

.loading-state {
  min-height: 50vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
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

.detail-content {
  max-width: 980px;
  margin: 0 auto;
  padding: 24px;
}

.info-section,
.topology-section,
.history-section,
.action-section {
  margin-bottom: 20px;
  padding: 20px;
  border: 1px solid var(--border-color);
  border-radius: 16px;
  background: var(--bg-card);
}

.section-title {
  margin: 0 0 16px;
  color: var(--accent);
  font-size: 1.05rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  color: var(--text-muted);
  font-size: 0.85rem;
}

.info-value {
  color: var(--text-primary);
}

.info-value.highlight {
  color: var(--accent);
  font-weight: 600;
}

.priority-tag {
  display: inline-flex;
  width: fit-content;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 600;
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
  padding: 14px;
  border-radius: 12px;
  background: var(--bg-secondary);
}

.description-text {
  margin: 8px 0 0;
  line-height: 1.6;
  color: var(--text-secondary);
}

.topology-wrapper {
  min-height: 320px;
  border-radius: 12px;
  background: var(--bg-secondary);
  overflow: hidden;
}

.timeline {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.timeline-item {
  display: grid;
  grid-template-columns: 36px 1fr;
  gap: 12px;
}

.timeline-marker {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--bg-secondary);
}

.timeline-content {
  padding: 12px 14px;
  border-radius: 12px;
  background: var(--bg-secondary);
}

.timeline-header,
.timeline-body,
.approval-item {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.timeline-action {
  font-weight: 600;
}

.timeline-time,
.timeline-body,
.timeline-note,
.action-desc,
.empty-block {
  color: var(--text-secondary);
}

.timeline-note {
  margin-top: 8px;
  line-height: 1.5;
}

.approval-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.approval-item {
  padding: 12px 14px;
  border-radius: 12px;
  background: var(--bg-secondary);
}

.approval-status.pending {
  color: #f59e0b;
}

.approval-status.approved {
  color: #10b981;
}

.action-card {
  padding: 16px;
  border-radius: 14px;
  background: var(--bg-secondary);
  margin-bottom: 16px;
}

.action-title {
  margin: 0 0 10px;
}

.form-group {
  margin-bottom: 14px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: var(--text-secondary);
}

.form-group select,
.form-group textarea {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  background: var(--bg-card);
  color: var(--text-primary);
}

.action-btn {
  padding: 10px 16px;
  border: none;
  border-radius: 10px;
  color: #fff;
  font-weight: 600;
}

.action-btn.primary {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
}

.action-btn.success {
  background: linear-gradient(135deg, #10b981, #059669);
}

.action-btn.danger {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .detail-header {
    flex-wrap: wrap;
  }

  .detail-content {
    padding: 16px;
  }
}
</style>
