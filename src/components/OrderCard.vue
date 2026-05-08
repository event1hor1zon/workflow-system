<template>
  <article class="order-card" @click="$emit('click', order)">
    <div class="card-top">
      <div class="card-top-left">
        <span :class="['status-pill', statusClass]">{{ statusText }}</span>
        <span class="order-id mono-text">#{{ order.id }}</span>
      </div>
      <span v-if="priorityLabel" :class="['priority-pill', order.priority]">
        {{ priorityLabel }}
      </span>
    </div>

    <h3 class="card-title">{{ order.title }}</h3>
    <p class="card-description">{{ order.description || '暂无描述' }}</p>

    <div class="meta-grid">
      <div class="meta-row">
        <UserRound :size="14" />
        <span class="meta-label">发起人</span>
        <strong>{{ order.creatorName || order.creator || '-' }}</strong>
      </div>
      <div class="meta-row">
        <Building2 :size="14" />
        <span class="meta-label">所属公司</span>
        <strong>{{ order.countyName || order.creatorCountyName || '-' }}</strong>
      </div>
      <div class="meta-row full">
        <ArrowRightLeft :size="14" />
        <span class="meta-label">当前环节</span>
        <strong>{{ order.currentNode || '待公司网络部审核' }}</strong>
      </div>
    </div>

    <div class="card-footer">
      <span class="footer-time">
        <Clock3 :size="14" />
        {{ formatTime(order.createdAt || order.createTime || order.updateTime) }}
      </span>
      <span class="footer-link">
        查看详情
        <ArrowUpRight :size="14" />
      </span>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue';
import {
  ArrowRightLeft,
  ArrowUpRight,
  Building2,
  Clock3,
  UserRound,
} from 'lucide-vue-next';

const props = defineProps({
  order: {
    type: Object,
    required: true,
  },
});

defineEmits(['click']);

const statusMap = {
  pending: { text: '待公司网络部审核', class: 'pending' },
  processing: { text: '市级部门处理中', class: 'processing' },
  waiting_confirm: { text: '待确认', class: 'waiting' },
  completed: { text: '已完成', class: 'completed' },
  rejected: { text: '已驳回', class: 'rejected' },
};

const statusText = computed(() => statusMap[props.order.status]?.text || props.order.statusText || '未知状态');
const statusClass = computed(() => statusMap[props.order.status]?.class || 'pending');

const priorityLabel = computed(() => {
  if (props.order.priority === 'critical') return '重大';
  if (props.order.priority === 'urgent') return '紧急';
  if (props.order.priority === 'normal') return '普通';
  return '';
});

const formatTime = (value) => {
  if (!value) {
    return '刚刚';
  }

  const date = new Date(value);
  const now = new Date();
  const diff = now - date;

  if (diff > 86400000) {
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  if (diff > 3600000) {
    return `${Math.floor(diff / 3600000)}小时前`;
  }

  if (diff > 60000) {
    return `${Math.floor(diff / 60000)}分钟前`;
  }

  return '刚刚';
};
</script>

<style scoped>
.order-card {
  padding: 22px;
  border-radius: 28px;
  border: 1px solid var(--panel-border);
  background: color-mix(in srgb, var(--bg-surface) 84%, transparent);
  box-shadow: 0 16px 34px var(--shadow-soft);
  transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
}

.order-card:hover {
  transform: translateY(-2px);
  border-color: rgba(59, 130, 246, 0.26);
  box-shadow: 0 22px 44px var(--shadow-strong);
}

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.card-top-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.status-pill,
.priority-pill {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 12px;
  border-radius: 999px;
  font-size: 0.76rem;
  font-weight: 700;
}

.status-pill.pending {
  background: rgba(245, 158, 11, 0.12);
  color: var(--brand-warning);
}

.status-pill.processing {
  background: rgba(59, 130, 246, 0.12);
  color: var(--brand-primary);
}

.status-pill.waiting {
  background: rgba(16, 185, 129, 0.12);
  color: var(--brand-secondary);
}

.status-pill.completed {
  background: rgba(16, 185, 129, 0.12);
  color: var(--brand-secondary);
}

.status-pill.rejected {
  background: rgba(239, 68, 68, 0.12);
  color: var(--brand-danger);
}

.priority-pill.normal {
  background: rgba(16, 185, 129, 0.1);
  color: var(--brand-secondary);
}

.priority-pill.urgent {
  background: rgba(245, 158, 11, 0.12);
  color: var(--brand-warning);
}

.priority-pill.critical {
  background: rgba(239, 68, 68, 0.12);
  color: var(--brand-danger);
}

.order-id {
  color: var(--text-muted);
  font-size: 0.78rem;
}

.card-title {
  margin: 16px 0 10px;
  font-size: 1.14rem;
  line-height: 1.45;
  letter-spacing: -0.02em;
}

.card-description {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.72;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.meta-grid {
  display: grid;
  gap: 10px;
  margin-top: 18px;
}

.meta-row {
  display: grid;
  grid-template-columns: 16px 56px minmax(0, 1fr);
  align-items: start;
  gap: 10px;
  color: var(--text-secondary);
}

.meta-row.full {
  align-items: center;
}

.meta-label {
  color: var(--text-tertiary);
  font-size: 0.82rem;
}

.meta-row strong {
  min-width: 0;
  font-size: 0.88rem;
  color: var(--text-primary);
  line-height: 1.55;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--panel-border);
}

.footer-time,
.footer-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.82rem;
}

.footer-time {
  color: var(--text-tertiary);
}

.footer-link {
  color: var(--brand-primary);
  font-weight: 700;
}
</style>
