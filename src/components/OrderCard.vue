<template>
  <div class="order-card" @click="$emit('click', order)">
    <div class="card-header">
      <span class="order-id">{{ order.id }}</span>
      <span :class="['order-status', statusClass]">{{ statusText }}</span>
    </div>
    <div class="card-title">{{ order.title }}</div>
    <div class="card-info">
      <div class="info-row">
        <span class="info-icon">👤</span>
        <span class="info-text">{{ order.creatorName || order.creator }}</span>
      </div>
      <div v-if="order.countyName" class="info-row">
        <span class="info-icon">📍</span>
        <span class="info-text">{{ order.countyName }}</span>
      </div>
      <div v-if="order.currentNode" class="info-row">
        <span class="info-icon">📌</span>
        <span class="info-text">{{ order.currentNode }}</span>
      </div>
    </div>
    <div v-if="showProgress" class="progress-section">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: order.progress + '%' }"></div>
      </div>
      <span class="progress-text">{{ order.progress || 0 }}%</span>
    </div>
    <div class="card-footer">
      <span class="footer-time">{{ formatTime(order.createdAt || order.createTime) }}</span>
      <span v-if="order.priority === 'urgent'" class="priority-badge urgent">紧急</span>
      <span v-if="order.priority === 'critical'" class="priority-badge critical">重大</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  order: {
    type: Object,
    required: true,
  },
  showProgress: {
    type: Boolean,
    default: true,
  },
});

defineEmits(['click']);

// 状态映射
const statusMap = {
  pending: { text: '待处理', class: 'pending' },
  processing: { text: '处理中', class: 'processing' },
  waiting_confirm: { text: '待确认', class: 'waiting' },
  completed: { text: '已结束', class: 'completed' },
  rejected: { text: '已驳回', class: 'rejected' },
};

const statusText = computed(() => {
  return statusMap[props.order.status]?.text || props.order.statusText || '未知';
});

const statusClass = computed(() => {
  return statusMap[props.order.status]?.class || 'pending';
});

// 格式化时间
const formatTime = (time) => {
  if (!time) return '';
  const date = new Date(time);
  const now = new Date();
  const diff = now - date;

  // 超过24小时显示日期
  if (diff > 86400000) {
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // 超过1小时显示小时
  if (diff > 3600000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours}小时前`;
  }

  // 超过1分钟显示分钟
  if (diff > 60000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes}分钟前`;
  }

  return '刚刚';
};
</script>

<style scoped>
.order-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.order-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px var(--shadow);
  border-color: var(--accent);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.order-id {
  font-family: monospace;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.order-status {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.order-status.pending {
  background: rgba(167, 139, 250, 0.2);
  color: #a78bfa;
}

.order-status.processing {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

.order-status.waiting {
  background: rgba(96, 165, 250, 0.2);
  color: #60a5fa;
}

.order-status.completed {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.order-status.rejected {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.card-title {
  font-weight: 600;
  font-size: 1rem;
  color: var(--text-primary);
  margin-bottom: 12px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.info-icon {
  font-size: 0.9rem;
}

.info-text {
  flex: 1;
}

.progress-section {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.progress-bar {
  flex: 1;
  height: 4px;
  background: var(--bg-secondary);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #10b981);
  border-radius: 2px;
  transition: width 0.3s;
}

.progress-text {
  font-size: 0.75rem;
  color: var(--text-muted);
  min-width: 35px;
  text-align: right;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid var(--border-color);
}

.footer-time {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.priority-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
}

.priority-badge.urgent {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

.priority-badge.critical {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}
</style>
