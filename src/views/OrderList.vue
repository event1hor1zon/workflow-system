<template>
  <div class="order-list-container">
    <!-- 顶部导航 -->
    <div class="list-header">
      <div class="header-left">
        <button class="back-btn" @click="goBack">
          <span>←</span>
          <span>返回</span>
        </button>
        <h1 class="page-title">工单列表</h1>
      </div>
      <div class="header-right">
        <button class="theme-toggle-btn" @click="toggleTheme">
          {{ isDark ? '☀️' : '🌙' }}
        </button>
        <button class="create-btn" @click="showCreateModal = true">
          <span>➕</span>
          <span>新建工单</span>
        </button>
      </div>
    </div>

    <!-- 角色信息 -->
    <div class="role-info-bar">
      <span class="role-badge" :class="userRole">
        {{ roleName }}
      </span>
      <span class="user-name">{{ user?.name || '未登录' }}</span>
      <span class="user-dept">{{ user?.departmentName || user?.dept || '' }}</span>
    </div>

    <!-- 状态筛选 -->
    <div class="filter-bar">
      <button
        v-for="filter in filters"
        :key="filter.value"
        :class="['filter-btn', { active: currentFilter === filter.value }]"
        @click="currentFilter = filter.value"
      >
        <span class="filter-text">{{ filter.label }}</span>
        <span v-if="filter.count" class="filter-count">{{ filter.count }}</span>
      </button>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <span>加载中...</span>
    </div>

    <!-- 空状态 -->
    <div v-else-if="!filteredOrders.length" class="empty-state">
      <span class="empty-icon">📋</span>
      <p class="empty-text">暂无工单</p>
      <button class="empty-btn" @click="showCreateModal = true">创建第一个工单</button>
    </div>

    <!-- 工单列表 -->
    <div v-else class="order-grid">
      <OrderCard
        v-for="order in filteredOrders"
        :key="order.id"
        :order="order"
        @click="goToDetail(order)"
      />
    </div>

    <!-- 创建工单弹窗 -->
    <div class="modal-overlay" v-if="showCreateModal" @click="showCreateModal = false">
      <div class="create-modal" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">新建工单</h3>
          <button class="modal-close" @click="showCreateModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>工单标题 *</label>
            <input
              v-model="newOrder.title"
              type="text"
              placeholder="请输入工单标题"
            />
          </div>
          <div class="form-group">
            <label>工单类型</label>
            <select v-model="newOrder.type">
              <option value="">请选择</option>
              <option value="5g">5G基站建设</option>
              <option value="broadband">家宽建设</option>
              <option value="enterprise">政企专线</option>
              <option value="shop">沿街商铺</option>
              <option value="industry">垂直行业</option>
              <option value="maintenance">集家客维护</option>
              <option value="resource">现网资源维护</option>
            </select>
          </div>
          <div class="form-group">
            <label>优先级</label>
            <select v-model="newOrder.priority">
              <option value="normal">一般</option>
              <option value="urgent">紧急</option>
              <option value="critical">重大</option>
            </select>
          </div>
          <div class="form-group">
            <label>详细描述</label>
            <VoiceInput
              v-model="newOrder.description"
              placeholder="请输入工单描述，支持语音输入..."
              :rows="4"
            />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="showCreateModal = false">取消</button>
          <button class="btn-submit" @click="handleCreate" :disabled="!newOrder.title">
            提交工单
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue';
import { useRouter } from 'vue-router';
import OrderCard from '../components/OrderCard.vue';
import VoiceInput from '../components/VoiceInput.vue';
import userStore, { ROLE_NAMES } from '../stores/user';
import { ordersApi } from '../api/order';

const router = useRouter();
const isDark = ref(true);

// 用户信息
const user = computed(() => userStore.user.value);
const userRole = computed(() => user.value?.role || 'user');
const roleName = computed(() => ROLE_NAMES[userRole.value] || '普通员工');

// 工单列表
const orders = ref([]);
const loading = ref(false);
const currentFilter = ref('all');

// 筛选器
const filters = computed(() => {
  const statusCounts = {
    all: orders.value.length,
    pending: orders.value.filter(o => o.status === 'pending').length,
    processing: orders.value.filter(o => o.status === 'processing').length,
    waiting_confirm: orders.value.filter(o => o.status === 'waiting_confirm').length,
    completed: orders.value.filter(o => o.status === 'completed').length,
  };

  return [
    { label: '全部', value: 'all', count: statusCounts.all },
    { label: '待处理', value: 'pending', count: statusCounts.pending },
    { label: '处理中', value: 'processing', count: statusCounts.processing },
    { label: '待确认', value: 'waiting_confirm', count: statusCounts.waiting_confirm },
    { label: '已结束', value: 'completed', count: statusCounts.completed },
  ];
});

// 筛选后的工单
const filteredOrders = computed(() => {
  if (currentFilter.value === 'all') {
    return orders.value;
  }
  return orders.value.filter(order => order.status === currentFilter.value);
});

// 创建工单弹窗
const showCreateModal = ref(false);
const newOrder = reactive({
  title: '',
  type: '',
  priority: 'normal',
  description: '',
});

// 加载工单列表
const loadOrders = async () => {
  loading.value = true;
  try {
    // 根据用户角色获取不同的工单列表
    const params = {};
    if (userRole.value === 'user') {
      // 普通员工只能看到自己发起的
      params.creatorId = user.value?.id;
    } else if (userRole.value === 'county_handler') {
      // 县级经办人只能看到自己县的
      params.countyId = user.value?.countyId;
    }
    // department_head 和 top_leader、admin 可以看到所有或部门相关的

    const response = await ordersApi.getList(params);
    orders.value = response.data || response || [];
  } catch (error) {
    console.error('加载工单列表失败:', error);
    // 使用模拟数据
    orders.value = getMockOrders();
  } finally {
    loading.value = false;
  }
};

// 模拟数据
const getMockOrders = () => {
  return [
    {
      id: 'ORD-20260408-001',
      title: '昆区某小区5G基站建设需求',
      status: 'processing',
      priority: 'normal',
      creatorName: '李明',
      currentNode: '网络部',
      progress: 45,
      createdAt: '2026-04-08 09:00',
    },
    {
      id: 'ORD-20260407-002',
      title: '九原区商业街宽带接入需求',
      status: 'pending',
      priority: 'urgent',
      creatorName: '王芳',
      currentNode: '待分配',
      progress: 10,
      createdAt: '2026-04-07 14:30',
    },
    {
      id: 'ORD-20260406-003',
      title: '某工厂政企专线接入',
      status: 'waiting_confirm',
      priority: 'critical',
      creatorName: '张强',
      currentNode: '客户响应中心',
      progress: 85,
      createdAt: '2026-04-06 10:00',
    },
    {
      id: 'ORD-20260405-004',
      title: '青山区家宽覆盖需求',
      status: 'completed',
      priority: 'normal',
      creatorName: '孙丽',
      currentNode: '已闭环',
      progress: 100,
      createdAt: '2026-04-05 08:30',
    },
  ];
};

// 创建工单
const handleCreate = async () => {
  if (!newOrder.title) return;

  try {
    const response = await ordersApi.create({
      title: newOrder.title,
      type: newOrder.type,
      priority: newOrder.priority,
      description: newOrder.description,
      creatorId: user.value?.id,
      creatorName: user.value?.name,
    });

    // 添加到列表
    const newOrderItem = {
      id: response.id || `ORD-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${String(orders.value.length + 1).padStart(3,'0')}`,
      title: newOrder.title,
      status: 'pending',
      priority: newOrder.priority,
      creatorName: user.value?.name,
      currentNode: '待分配',
      progress: 0,
      createdAt: new Date().toLocaleString('zh-CN'),
    };

    orders.value.unshift(newOrderItem);

    // 重置表单
    newOrder.title = '';
    newOrder.type = '';
    newOrder.priority = 'normal';
    newOrder.description = '';
    showCreateModal.value = false;
  } catch (error) {
    console.error('创建工单失败:', error);
    alert('创建工单失败，请重试');
  }
};

// 跳转详情
const goToDetail = (order) => {
  router.push(`/orders/${order.id}`);
};

// 返回上一页
const goBack = () => {
  router.push('/');
};

// 切换主题
const toggleTheme = () => {
  isDark.value = !isDark.value;
  document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light');
  localStorage.setItem('sop-theme', isDark.value ? 'dark' : 'light');
};

onMounted(() => {
  // 初始化主题
  const savedTheme = localStorage.getItem('sop-theme');
  if (savedTheme) {
    isDark.value = savedTheme === 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
  }

  loadOrders();
});
</script>

<style scoped>
.order-list-container {
  min-height: 100vh;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.list-header {
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
  transition: all 0.2s;
}

.back-btn:hover {
  border-color: var(--accent);
}

.page-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.theme-toggle-btn {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  cursor: pointer;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.theme-toggle-btn:hover {
  border-color: var(--accent);
}

.create-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.create-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(59, 130, 246, 0.4);
}

/* 角色信息栏 */
.role-info-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 24px;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-color);
}

.role-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
}

.role-badge.user {
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
}

.role-badge.county_handler {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.role-badge.department_head {
  background: rgba(139, 92, 246, 0.2);
  color: #a78bfa;
}

.role-badge.top_leader,
.role-badge.admin {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

.user-name {
  font-size: 0.9rem;
  color: var(--text-primary);
}

.user-dept {
  font-size: 0.85rem;
  color: var(--text-muted);
}

/* 筛选栏 */
.filter-bar {
  display: flex;
  gap: 8px;
  padding: 16px 24px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  overflow-x: auto;
}

.filter-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  color: var(--text-secondary);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.filter-btn:hover {
  border-color: var(--accent);
}

.filter-btn.active {
  background: var(--accent);
  border-color: var(--accent);
  color: white;
}

.filter-count {
  padding: 2px 6px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  font-size: 0.75rem;
}

.filter-btn:not(.active) .filter-count {
  background: var(--bg-secondary);
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
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

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  gap: 16px;
}

.empty-icon {
  font-size: 4rem;
  opacity: 0.5;
}

.empty-text {
  font-size: 1rem;
  color: var(--text-muted);
  margin: 0;
}

.empty-btn {
  padding: 12px 24px;
  background: var(--accent);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 0.95rem;
  cursor: pointer;
}

/* 工单列表 */
.order-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
  padding: 20px 24px;
}

/* 创建工单弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.create-modal {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.modal-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
  color: var(--text-primary);
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--text-muted);
  cursor: pointer;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.form-group {
  margin-bottom: 16px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 10px 12px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 0.95rem;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--accent);
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
}

.btn-cancel,
.btn-submit {
  flex: 1;
  padding: 12px;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
}

.btn-cancel:hover {
  border-color: var(--text-muted);
}

.btn-submit {
  background: var(--accent);
  border: none;
  color: white;
}

.btn-submit:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 响应式 */
@media (max-width: 768px) {
  .list-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .header-left {
    justify-content: space-between;
  }

  .header-right {
    justify-content: flex-end;
  }

  .role-info-bar {
    flex-wrap: wrap;
  }

  .filter-bar {
    padding: 12px 16px;
  }

  .order-grid {
    padding: 16px;
    grid-template-columns: 1fr;
  }
}
</style>
