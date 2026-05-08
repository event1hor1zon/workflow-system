<template>
  <WorkspaceFrame
    current-page="workspace"
    eyebrow="个人中心"
    title="我的工单工作台"
    subtitle="工单详情、审批状态、处理轨迹和当前动作全部集中在个人中心内完成。"
    @create="openCreateModal"
    @logout="handleLogout"
  >
    <div class="workspace-page">
      <section class="hero-strip glass-panel">
        <div class="hero-copy">
          <div class="hero-tag">
            <Sparkles :size="14" />
            个人工作台
          </div>
          <h2>工单详情与办理全部收拢到同一页面</h2>
          <p>
            当前账号为 <strong>{{ currentUser?.name || '未登录' }}</strong>，
            系统已根据员工档案自动识别所属公司和权限范围。你可以在这里查看可见工单、办理待办事项、
            提交处理结果，或直接发起新的工单。
          </p>
        </div>
        <div class="hero-side">
          <article class="hero-side-card">
            <span>当前账号</span>
            <strong>{{ currentUser?.name || '未登录' }}</strong>
            <small>{{ roleName }}</small>
          </article>
          <article class="hero-side-card">
            <span>所属公司</span>
            <strong>{{ currentUser?.countyName || '系统自动识别' }}</strong>
            <small>提交工单时无需手动选择</small>
          </article>
          <button class="hero-create-btn" @click="openCreateModal">
            <span>
              <strong>新建协同工单</strong>
              <small>只填详情描述即可发起</small>
            </span>
            <ArrowRight :size="18" />
          </button>
        </div>
      </section>

      <section class="stats-row">
        <article class="stat-card surface-card">
          <div class="stat-icon blue">
            <Activity :size="18" />
          </div>
          <div>
            <strong>{{ orders.length }}</strong>
            <span>当前可见工单</span>
          </div>
        </article>
        <article class="stat-card surface-card">
          <div class="stat-icon amber">
            <TimerReset :size="18" />
          </div>
          <div>
            <strong>{{ filteredTodoOrders() }}</strong>
            <span>{{ todoLabel() }}</span>
          </div>
        </article>
        <article class="stat-card surface-card">
          <div class="stat-icon green">
            <CheckCircle2 :size="18" />
          </div>
          <div>
            <strong>{{ completedCount }}</strong>
            <span>已完成闭环</span>
          </div>
        </article>
        <article class="stat-card surface-card">
          <div class="stat-icon red">
            <ShieldAlert :size="18" />
          </div>
          <div>
            <strong>{{ rejectedCount }}</strong>
            <span>已驳回工单</span>
          </div>
        </article>
      </section>

      <section class="board-grid">
        <aside class="list-panel glass-panel">
          <div class="panel-head">
            <div>
              <p class="panel-kicker">工单台账</p>
              <h3>工单清单</h3>
            </div>
            <span class="list-count mono-text">{{ filteredOrders.length }} ITEMS</span>
          </div>

          <div class="filter-chip-row">
            <button
              v-for="tab in filterTabs"
              :key="tab.value"
              :class="['filter-chip', { active: currentFilter === tab.value }]"
              @click="currentFilter = tab.value"
            >
              <span>{{ tab.label }}</span>
              <strong>{{ tab.count }}</strong>
            </button>
          </div>

          <div v-if="listLoading" class="panel-state">工单加载中...</div>
          <div v-else-if="listError" class="panel-state">
            <span>{{ listError }}</span>
            <button class="panel-btn" @click="loadWorkspace()">重新加载</button>
          </div>
          <div v-else-if="!filteredOrders.length" class="panel-state">
            <span>当前筛选条件下暂无工单</span>
            <button class="panel-btn primary" @click="openCreateModal">新建一张工单</button>
          </div>
          <div v-else class="order-stream">
            <OrderCard
              v-for="item in filteredOrders"
              :key="item.id"
              :order="item"
              :class="{ selected: selectedOrderId === item.id }"
              @click="selectOrder(item.id)"
            />
          </div>
        </aside>

        <section class="detail-panel">
          <div v-if="detailLoading" class="detail-state glass-panel">详情加载中...</div>
          <div v-else-if="detailError" class="detail-state glass-panel">
            <span>{{ detailError }}</span>
            <button v-if="selectedOrderId" class="panel-btn" @click="loadSelectedOrder(selectedOrderId)">
              重新加载
            </button>
          </div>
          <div v-else-if="selectedOrder" class="detail-shell">
            <section class="detail-hero glass-panel">
              <div class="detail-header">
                <div class="detail-header-copy">
                  <div class="detail-badges">
                    <span :class="['status-pill', selectedOrder.status]">{{ selectedOrder.statusText }}</span>
                    <span v-if="selectedPriorityLabel" :class="['priority-pill', selectedOrder.priority]">
                      {{ selectedPriorityLabel }}
                    </span>
                    <span class="id-pill mono-text">#{{ selectedOrder.id }}</span>
                  </div>
                  <h3>{{ selectedOrder.title }}</h3>
                  <p>
                    {{ selectedOrder.creatorCountyName || '-' }} · {{ selectedOrder.creatorName }} ·
                    {{ formatDate(selectedOrder.createTime) }}
                  </p>
                </div>
              </div>

              <div class="detail-grid">
                <article class="detail-card">
                  <span>当前环节</span>
                  <strong>{{ selectedOrder.currentNode || '待公司网络部审核' }}</strong>
                </article>
                <article class="detail-card">
                  <span>当前部门</span>
                  <strong>{{ selectedOrder.currentDepartmentName || '待公司网络部负责人审核' }}</strong>
                </article>
                <article class="detail-card">
                  <span>工单级别</span>
                  <strong>{{ selectedOrder.priorityText }}</strong>
                </article>
                <article class="detail-card">
                  <span>确认规则</span>
                  <strong>{{ selectedOrder.priority === 'critical' ? '发起人 + 最高领导确认' : '发起人确认' }}</strong>
                </article>
              </div>
            </section>

            <section v-if="hasAvailableActions" class="action-stage">
              <article v-if="selectedPermissions.canAssign" class="action-card assign-card glass-panel">
                <div class="action-head">
                  <div class="action-head-icon blue">
                    <ArrowRightLeft :size="18" />
                  </div>
                  <div>
                    <h4>提交到市级处理部门</h4>
                    <p>公司网络部负责人审核通过后，选择一个市级处理部门继续办理。</p>
                  </div>
                </div>
                <div class="action-form">
                  <label>
                    <span>目标部门</span>
                    <select v-model="assignDepartmentId">
                      <option value="">请选择市级部门</option>
                      <option v-for="department in coreDepartments" :key="department.id" :value="String(department.id)">
                        {{ department.name }}
                      </option>
                    </select>
                  </label>
                  <label>
                    <span>备注说明</span>
                    <textarea
                      v-model="assignComment"
                      rows="3"
                      placeholder="补充需要同步给市级部门的背景说明"
                    ></textarea>
                  </label>
                </div>
                <button class="action-submit blue-btn" :disabled="!assignDepartmentId || saving" @click="handleAssign">
                  {{ saving ? '提交中...' : '提交到市级部门' }}
                </button>
              </article>

              <article v-if="selectedPermissions.canReject" class="action-card reject-card glass-panel">
                <div class="action-head">
                  <div class="action-head-icon red">
                    <ShieldAlert :size="18" />
                  </div>
                  <div>
                    <h4>驳回工单</h4>
                    <p>如描述不完整或不符合受理条件，可直接驳回，发起人会在个人中心看到原因。</p>
                  </div>
                </div>
                <div class="action-form">
                  <label>
                    <span>驳回原因</span>
                    <textarea
                      v-model="rejectReason"
                      rows="3"
                      placeholder="请填写驳回原因"
                    ></textarea>
                  </label>
                </div>
                <button class="action-submit red-btn" :disabled="!rejectReason || saving" @click="handleReject">
                  {{ saving ? '提交中...' : '确认驳回' }}
                </button>
              </article>

              <article v-if="selectedPermissions.canProcess" class="action-card process-card glass-panel">
                <div class="action-head">
                  <div class="action-head-icon amber">
                    <BadgeCheck :size="18" />
                  </div>
                  <div>
                    <h4>市级部门定级并提交处理结果</h4>
                    <p>市级三部门负责人接单后，需要先选择工单级别，再提交处理说明进入确认环节。</p>
                  </div>
                </div>
                <div class="priority-selector">
                  <button
                    v-for="option in priorityOptions"
                    :key="option.value"
                    :class="['priority-option', option.value, { active: processPriority === option.value }]"
                    @click="processPriority = option.value"
                  >
                    <strong>{{ option.label }}</strong>
                    <span>{{ option.note }}</span>
                  </button>
                </div>
                <div class="action-form">
                  <label>
                    <span>处理说明</span>
                    <textarea
                      v-model="processComment"
                      rows="3"
                      placeholder="请说明处理结果，提交后进入确认闭环阶段"
                    ></textarea>
                  </label>
                </div>
                <button class="action-submit amber-btn" :disabled="saving" @click="handleProcess">
                  {{ saving ? '提交中...' : '提交处理结果' }}
                </button>
              </article>

              <article v-if="selectedPermissions.canConfirm" class="action-card confirm-card glass-panel">
                <div class="action-head">
                  <div class="action-head-icon green">
                    <CheckCircle2 :size="18" />
                  </div>
                  <div>
                    <h4>确认工单闭环</h4>
                    <p>{{ pendingApprovalLabel }}</p>
                  </div>
                </div>
                <button class="action-submit green-btn" :disabled="saving" @click="handleConfirm">
                  {{ saving ? '提交中...' : '确认办结' }}
                </button>
              </article>
            </section>

            <section class="detail-columns">
              <article class="detail-section glass-panel">
                <div class="section-mini-head">
                  <FileText :size="16" />
                  <h4>工单描述</h4>
                </div>
                <p class="description-text">{{ selectedOrder.description || '暂无描述' }}</p>
              </article>

              <article v-if="approvalList.length" class="detail-section glass-panel">
                <div class="section-mini-head">
                  <UserRoundCheck :size="16" />
                  <h4>审批状态</h4>
                </div>
                <div class="approval-list">
                  <div v-for="approval in approvalList" :key="approval.id" class="approval-row">
                    <div>
                      <strong>{{ approval.approverName }}</strong>
                      <p>{{ approval.approvalType === 'creator' ? '发起人确认' : '最高领导确认' }}</p>
                    </div>
                    <span :class="['approval-pill', approval.status]">
                      {{ approval.status === 'approved' ? '已确认' : '待确认' }}
                    </span>
                  </div>
                </div>
              </article>

              <article v-if="selectedOrder.flows?.length" class="detail-section glass-panel">
                <div class="section-mini-head">
                  <Clock3 :size="16" />
                  <h4>处理轨迹</h4>
                </div>
                <div class="timeline">
                  <div v-for="flow in orderedFlows" :key="flow.id" class="timeline-row">
                    <div class="timeline-dot"></div>
                    <div class="timeline-content">
                      <div class="timeline-head">
                        <strong>{{ flow.actionText }}</strong>
                        <span>{{ formatDate(flow.createTime) }}</span>
                      </div>
                      <p>{{ flow.operatorName || '系统' }}</p>
                      <small>{{ flow.comment || '无备注' }}</small>
                    </div>
                  </div>
                </div>
              </article>
            </section>
          </div>

          <div v-else class="detail-state glass-panel empty-detail">
            <Layers3 :size="28" />
            <h3>请选择一张工单</h3>
            <p>左侧选择工单后，这里会展示详情、审批状态、处理轨迹和当前可执行动作。</p>
          </div>
        </section>
      </section>

      <div v-if="showCreateModal" class="create-overlay" @click.self="closeCreateModal">
        <div class="create-shell">
          <header class="create-header">
            <button class="create-close" @click="closeCreateModal">
              <X :size="18" />
            </button>
            <div>
              <p class="panel-kicker">发起协同</p>
              <h3>新建工单</h3>
            </div>
            <div class="create-spacer"></div>
          </header>

          <div class="create-content">
            <section class="create-identity glass-panel">
              <article class="identity-tile">
                <span>姓名 / 工号</span>
                <strong>{{ currentUser?.name || '-' }}</strong>
                <small>{{ currentUser?.username || '登录工号自动识别' }}</small>
              </article>
              <article class="identity-tile">
                <span>所属公司</span>
                <strong>{{ currentUser?.countyName || '系统自动识别' }}</strong>
                <small>提交后自动流转到所属公司网络部负责人</small>
              </article>
              <article class="identity-tile">
                <span>闭环规则</span>
                <strong>普通/紧急单签，重大双签</strong>
                <small>重大工单需要发起人和最高领导全部确认</small>
              </article>
            </section>

            <section class="create-body">
              <label class="create-label">工单详情描述</label>
              <div class="create-editor glass-panel">
                <VoiceInput
                  v-model="createForm.description"
                  placeholder="请输入详细现场情况或协同诉求，也可以直接点击麦克风进行语音转文字..."
                  :rows="10"
                />
              </div>
              <p class="create-tip">
                系统会按你的工号自动识别所属公司、员工身份和权限，提交后自动流转到所属公司网络部负责人。
              </p>
            </section>
          </div>

          <footer class="create-footer">
            <button class="footer-cancel" @click="closeCreateModal">取消</button>
            <button class="footer-submit" :disabled="!createForm.description.trim() || creating" @click="handleCreate">
              <span>{{ creating ? '提交中...' : '立即提交工单' }}</span>
              <Send :size="18" />
            </button>
          </footer>
        </div>
      </div>
    </div>
  </WorkspaceFrame>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  Activity,
  ArrowRight,
  ArrowRightLeft,
  BadgeCheck,
  CheckCircle2,
  Clock3,
  FileText,
  Layers3,
  Send,
  ShieldAlert,
  Sparkles,
  TimerReset,
  UserRoundCheck,
  X,
} from 'lucide-vue-next';
import OrderCard from '../components/OrderCard.vue';
import VoiceInput from '../components/VoiceInput.vue';
import WorkspaceFrame from '../components/WorkspaceFrame.vue';
import { departmentsApi } from '../api/department';
import { ordersApi } from '../api/order';
import userStore, { ROLE_NAMES, ROLES } from '../stores/user';

const router = useRouter();
const route = useRoute();

const listLoading = ref(false);
const detailLoading = ref(false);
const creating = ref(false);
const saving = ref(false);
const listError = ref('');
const detailError = ref('');
const orders = ref([]);
const selectedOrder = ref(null);
const selectedOrderId = ref(null);
const currentFilter = ref('all_visible');
const showCreateModal = ref(false);
const coreDepartments = ref([]);

const assignDepartmentId = ref('');
const assignComment = ref('');
const processPriority = ref('normal');
const processComment = ref('');
const rejectReason = ref('');

const createForm = reactive({
  description: '',
});

const currentUser = computed(() => userStore.user.value);
const roleName = computed(() => ROLE_NAMES[currentUser.value?.role] || '未识别角色');
const selectedPermissions = computed(() => selectedOrder.value?.permissions || {});
const approvalList = computed(() => selectedOrder.value?.approvals || []);
const orderedFlows = computed(() => [...(selectedOrder.value?.flows || [])].reverse());

const hasAvailableActions = computed(() =>
  selectedPermissions.value.canAssign ||
  selectedPermissions.value.canProcess ||
  selectedPermissions.value.canConfirm ||
  selectedPermissions.value.canReject,
);

const completedCount = computed(() => orders.value.filter((order) => order.status === 'completed').length);
const rejectedCount = computed(() => orders.value.filter((order) => order.status === 'rejected').length);

const selectedPriorityLabel = computed(() => {
  if (!selectedOrder.value?.priority) {
    return '';
  }

  if (selectedOrder.value.priority === 'critical') return '重大';
  if (selectedOrder.value.priority === 'urgent') return '紧急';
  if (selectedOrder.value.priority === 'normal') return '普通';
  return selectedOrder.value.priorityText || '';
});

const priorityOptions = [
  { value: 'normal', label: '普通', note: '发起人确认后闭环' },
  { value: 'urgent', label: '紧急', note: '优先处置，仍由发起人确认' },
  { value: 'critical', label: '重大', note: '发起人和最高领导双确认' },
];

const filteredOrders = computed(() => {
  if (currentFilter.value === 'all_visible') {
    return orders.value;
  }

  if (currentFilter.value === 'created_by_me') {
    return orders.value.filter((order) => order.creatorId === currentUser.value?.id);
  }

  if (currentFilter.value === 'todo_for_me') {
    if (currentUser.value?.role === ROLES.COUNTY_HANDLER) {
      return orders.value.filter(
        (order) => order.status === 'pending' && order.creatorCountyId === currentUser.value?.countyId,
      );
    }

    if (currentUser.value?.role === ROLES.DEPARTMENT_HEAD) {
      return orders.value.filter(
        (order) => order.status === 'processing' && order.currentDepartmentId === currentUser.value?.departmentId,
      );
    }

    if (currentUser.value?.role === ROLES.TOP_LEADER) {
      return orders.value.filter(
        (order) => order.status === 'waiting_confirm' && order.priority === 'critical',
      );
    }

    return orders.value.filter(
      (order) => order.status === 'waiting_confirm' && order.creatorId === currentUser.value?.id,
    );
  }

  if (currentFilter.value === 'finished') {
    return orders.value.filter((order) => order.status === 'completed');
  }

  if (currentFilter.value === 'rejected') {
    return orders.value.filter((order) => order.status === 'rejected');
  }

  return orders.value;
});

const filterTabs = computed(() => [
  { label: '全部可见', value: 'all_visible', count: orders.value.length },
  {
    label: '我发起的',
    value: 'created_by_me',
    count: orders.value.filter((order) => order.creatorId === currentUser.value?.id).length,
  },
  {
    label: todoLabel(),
    value: 'todo_for_me',
    count: filteredTodoOrders(),
  },
  {
    label: '已完成',
    value: 'finished',
    count: completedCount.value,
  },
  {
    label: '已驳回',
    value: 'rejected',
    count: rejectedCount.value,
  },
]);

const pendingApprovalLabel = computed(() => {
  const approval = approvalList.value.find(
    (item) => item.userId === currentUser.value?.id && item.status === 'pending',
  );

  if (!approval) {
    return '当前没有待确认事项';
  }

  return approval.approvalType === 'leader'
    ? '重大工单需要你作为最高领导确认后，整张工单才会闭环'
    : '请确认处理结果，确认后工单即可闭环';
});

const filteredTodoOrders = () => {
  if (currentUser.value?.role === ROLES.COUNTY_HANDLER) {
    return orders.value.filter(
      (order) => order.status === 'pending' && order.creatorCountyId === currentUser.value?.countyId,
    ).length;
  }

  if (currentUser.value?.role === ROLES.DEPARTMENT_HEAD) {
    return orders.value.filter(
      (order) => order.status === 'processing' && order.currentDepartmentId === currentUser.value?.departmentId,
    ).length;
  }

  if (currentUser.value?.role === ROLES.TOP_LEADER) {
    return orders.value.filter(
      (order) => order.status === 'waiting_confirm' && order.priority === 'critical',
    ).length;
  }

  return orders.value.filter(
    (order) => order.status === 'waiting_confirm' && order.creatorId === currentUser.value?.id,
  ).length;
};

const todoLabel = () => {
  if (currentUser.value?.role === ROLES.COUNTY_HANDLER) {
    return '待我审核';
  }

  if (currentUser.value?.role === ROLES.DEPARTMENT_HEAD) {
    return '待我处理';
  }

  return '待我确认';
};

const clearCreateIntent = () => {
  if (route.query.create !== '1') {
    return;
  }

  const nextQuery = { ...route.query };
  delete nextQuery.create;
  router.replace({ path: '/me', query: nextQuery });
};

const syncSelectedQuery = (orderId) => {
  const nextQuery = { ...route.query };

  if (orderId) {
    nextQuery.selected = String(orderId);
  } else {
    delete nextQuery.selected;
  }

  router.replace({ path: '/me', query: nextQuery });
};

const resetCreateForm = () => {
  createForm.description = '';
};

const openCreateModal = () => {
  showCreateModal.value = true;
};

const closeCreateModal = () => {
  showCreateModal.value = false;
  resetCreateForm();
  clearCreateIntent();
};

const loadDepartments = async () => {
  try {
    const response = await departmentsApi.getThreeDepartments();
    coreDepartments.value = Array.isArray(response) ? response : [];
  } catch (error) {
    console.error('市级部门列表加载失败:', error);
  }
};

const loadOrders = async (preferredOrderId = selectedOrderId.value) => {
  listLoading.value = true;
  listError.value = '';

  try {
    const response = await ordersApi.getList();
    orders.value = response.orders || [];

    const nextOrderId = preferredOrderId
      && orders.value.some((order) => order.id === preferredOrderId)
      ? preferredOrderId
      : orders.value[0]?.id || null;

    selectedOrderId.value = nextOrderId;
  } catch (error) {
    orders.value = [];
    selectedOrderId.value = null;
    listError.value = error.message || '工单列表加载失败';
  } finally {
    listLoading.value = false;
  }
};

const loadSelectedOrder = async (orderId) => {
  if (!orderId) {
    selectedOrder.value = null;
    detailError.value = '';
    return;
  }

  detailLoading.value = true;
  detailError.value = '';

  try {
    const response = await ordersApi.getById(orderId);
    selectedOrder.value = response;
    processPriority.value = response.priority || 'normal';
  } catch (error) {
    selectedOrder.value = null;
    detailError.value = error.message || '工单详情加载失败';
  } finally {
    detailLoading.value = false;
  }
};

const loadWorkspace = async (preferredOrderId = selectedOrderId.value) => {
  await Promise.all([loadDepartments(), loadOrders(preferredOrderId)]);
};

const selectOrder = (orderId) => {
  selectedOrderId.value = orderId;
};

const withAction = async (handler) => {
  saving.value = true;

  try {
    await handler();
    await loadWorkspace(selectedOrderId.value);
    await loadSelectedOrder(selectedOrderId.value);
  } catch (error) {
    window.alert(error.message || '操作失败，请重试');
  } finally {
    saving.value = false;
  }
};

const handleCreate = async () => {
  if (!createForm.description.trim()) {
    return;
  }

  creating.value = true;

  try {
    const createdOrder = await ordersApi.create({
      description: createForm.description,
    });

    currentFilter.value = 'all_visible';
    await loadWorkspace(createdOrder.id);
    await loadSelectedOrder(createdOrder.id);
    closeCreateModal();
  } catch (error) {
    window.alert(error.message || '工单提交失败，请重试');
  } finally {
    creating.value = false;
  }
};

const handleAssign = async () => {
  if (!assignDepartmentId.value || !selectedOrder.value) {
    return;
  }

  await withAction(async () => {
    await ordersApi.assign(selectedOrder.value.id, {
      departmentId: Number(assignDepartmentId.value),
      comment: assignComment.value,
    });

    assignDepartmentId.value = '';
    assignComment.value = '';
  });
};

const handleProcess = async () => {
  if (!selectedOrder.value) {
    return;
  }

  await withAction(async () => {
    await ordersApi.process(selectedOrder.value.id, {
      priority: processPriority.value,
      comment: processComment.value,
    });

    processComment.value = '';
  });
};

const handleReject = async () => {
  if (!selectedOrder.value || !rejectReason.value) {
    return;
  }

  await withAction(async () => {
    await ordersApi.reject(selectedOrder.value.id, {
      reason: rejectReason.value,
    });

    rejectReason.value = '';
  });
};

const handleConfirm = async () => {
  if (!selectedOrder.value) {
    return;
  }

  await withAction(async () => {
    await ordersApi.confirm(selectedOrder.value.id, {});
  });
};

const handleLogout = () => {
  userStore.logout();
  router.push('/login');
};

const formatDate = (value) => {
  if (!value) {
    return '-';
  }

  return new Date(value).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

watch(
  () => route.query.create,
  (createFlag) => {
    if (createFlag === '1') {
      openCreateModal();
    }
  },
  { immediate: true },
);

watch(
  () => route.query.selected,
  (queryValue) => {
    if (!queryValue) {
      return;
    }

    const nextId = Number(queryValue);
    if (!Number.isNaN(nextId) && nextId !== selectedOrderId.value) {
      selectedOrderId.value = nextId;
    }
  },
  { immediate: true },
);

watch(selectedOrderId, async (orderId) => {
  syncSelectedQuery(orderId);
  await loadSelectedOrder(orderId);
});

onMounted(async () => {
  await loadWorkspace(route.query.selected ? Number(route.query.selected) : null);

  if (selectedOrderId.value) {
    await loadSelectedOrder(selectedOrderId.value);
  }
});
</script>

<style scoped>
.workspace-page {
  display: grid;
  gap: 22px;
}

.hero-strip {
  display: grid;
  grid-template-columns: minmax(0, 1.18fr) minmax(280px, 0.82fr);
  gap: 20px;
  padding: 30px;
  border-radius: 34px;
}

.hero-tag {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 34px;
  padding: 0 14px;
  border-radius: 999px;
  color: var(--brand-primary);
  background: rgba(59, 130, 246, 0.1);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.hero-copy h2 {
  margin: 18px 0 12px;
  font-size: clamp(2rem, 2.7vw, 3rem);
  line-height: 1.05;
  letter-spacing: -0.05em;
}

.hero-copy p {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.8;
}

.hero-side {
  display: grid;
  gap: 12px;
}

.hero-side-card,
.detail-card {
  padding: 18px;
  border-radius: 22px;
  border: 1px solid var(--panel-border);
  background: color-mix(in srgb, var(--bg-surface) 76%, transparent);
}

.hero-side-card span,
.hero-side-card small,
.detail-card span {
  display: block;
}

.hero-side-card span,
.detail-card span {
  color: var(--text-tertiary);
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.hero-side-card strong,
.detail-card strong {
  display: block;
  margin-top: 10px;
  line-height: 1.55;
}

.hero-side-card small {
  margin-top: 8px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.hero-create-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  min-height: 74px;
  padding: 0 20px;
  border-radius: 24px;
  color: white;
  background: linear-gradient(135deg, var(--brand-primary), #2563eb);
  box-shadow: 0 20px 42px rgba(59, 130, 246, 0.28);
}

.hero-create-btn strong,
.hero-create-btn small {
  display: block;
  text-align: left;
}

.hero-create-btn strong {
  font-size: 1rem;
}

.hero-create-btn small {
  margin-top: 6px;
  opacity: 0.74;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 112px;
  padding: 22px;
  border-radius: 26px;
}

.stat-icon {
  width: 52px;
  height: 52px;
  display: grid;
  place-items: center;
  border-radius: 16px;
}

.stat-icon.blue {
  background: rgba(59, 130, 246, 0.12);
  color: var(--brand-primary);
}

.stat-icon.amber {
  background: rgba(245, 158, 11, 0.12);
  color: var(--brand-warning);
}

.stat-icon.green {
  background: rgba(16, 185, 129, 0.12);
  color: var(--brand-secondary);
}

.stat-icon.red {
  background: rgba(239, 68, 68, 0.12);
  color: var(--brand-danger);
}

.stat-card strong,
.stat-card span {
  display: block;
}

.stat-card strong {
  font-size: 1.45rem;
}

.stat-card span {
  margin-top: 6px;
  color: var(--text-secondary);
}

.board-grid {
  display: grid;
  grid-template-columns: minmax(340px, 420px) minmax(0, 1fr);
  gap: 18px;
  align-items: start;
}

.list-panel {
  padding: 22px;
  border-radius: 32px;
}

.panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.panel-kicker {
  margin: 0 0 8px;
  color: var(--brand-primary);
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.panel-head h3 {
  margin: 0;
  font-size: 1.3rem;
  letter-spacing: -0.03em;
}

.list-count {
  color: var(--text-muted);
  font-size: 0.78rem;
}

.filter-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 16px;
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 40px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid var(--panel-border);
  background: color-mix(in srgb, var(--bg-surface) 72%, transparent);
  color: var(--text-secondary);
  font-weight: 700;
}

.filter-chip strong {
  display: inline-grid;
  place-items: center;
  min-width: 24px;
  height: 24px;
  padding: 0 7px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.08);
  color: inherit;
  font-size: 0.76rem;
}

.filter-chip.active {
  border-color: rgba(59, 130, 246, 0.28);
  background: rgba(59, 130, 246, 0.12);
  color: var(--brand-primary);
}

.order-stream {
  display: grid;
  gap: 12px;
}

.order-stream :deep(.order-card.selected) {
  border-color: rgba(59, 130, 246, 0.28);
  box-shadow: 0 24px 46px rgba(59, 130, 246, 0.14);
}

.panel-state,
.detail-state {
  display: grid;
  place-items: center;
  gap: 14px;
  min-height: 240px;
  text-align: center;
  color: var(--text-secondary);
  padding: 20px;
}

.panel-btn,
.footer-cancel,
.footer-submit,
.action-submit {
  min-height: 46px;
  border-radius: 16px;
  font-weight: 700;
}

.panel-btn {
  padding: 0 16px;
  border: 1px solid var(--panel-border);
  color: var(--text-primary);
  background: color-mix(in srgb, var(--bg-surface) 74%, transparent);
}

.panel-btn.primary {
  color: white;
  background: linear-gradient(135deg, var(--brand-primary), #2563eb);
}

.detail-panel {
  min-width: 0;
}

.detail-shell {
  display: grid;
  gap: 18px;
}

.detail-hero,
.detail-section,
.action-card {
  padding: 24px;
  border-radius: 30px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 18px;
}

.detail-badges {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.status-pill,
.priority-pill,
.id-pill {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
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

.status-pill.waiting_confirm {
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

.id-pill {
  color: var(--text-tertiary);
  border: 1px solid var(--panel-border);
}

.detail-header-copy h3 {
  margin: 16px 0 10px;
  font-size: clamp(1.5rem, 2vw, 2.1rem);
  line-height: 1.18;
  letter-spacing: -0.04em;
}

.detail-header-copy p {
  margin: 0;
  color: var(--text-secondary);
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.action-stage {
  display: grid;
  gap: 16px;
}

.action-card {
  display: grid;
  gap: 18px;
}

.action-head {
  display: flex;
  gap: 14px;
  align-items: flex-start;
}

.action-head-icon {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: 16px;
  flex: none;
}

.action-head-icon.blue {
  color: var(--brand-primary);
  background: rgba(59, 130, 246, 0.12);
}

.action-head-icon.red {
  color: var(--brand-danger);
  background: rgba(239, 68, 68, 0.12);
}

.action-head-icon.amber {
  color: var(--brand-warning);
  background: rgba(245, 158, 11, 0.12);
}

.action-head-icon.green {
  color: var(--brand-secondary);
  background: rgba(16, 185, 129, 0.12);
}

.action-head h4 {
  margin: 0;
  font-size: 1.05rem;
}

.action-head p {
  margin: 6px 0 0;
  color: var(--text-secondary);
  line-height: 1.7;
}

.action-form {
  display: grid;
  gap: 14px;
}

.action-form label,
.create-body {
  display: grid;
  gap: 10px;
}

.action-form span,
.create-label {
  color: var(--text-tertiary);
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.action-form select,
.action-form textarea {
  width: 100%;
  padding: 14px 16px;
  border-radius: 18px;
  border: 1px solid var(--panel-border);
  background: color-mix(in srgb, var(--bg-surface) 78%, transparent);
  color: var(--text-primary);
}

.action-form textarea {
  resize: vertical;
  line-height: 1.7;
}

.priority-selector {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.priority-option {
  padding: 18px;
  border-radius: 20px;
  border: 1px solid var(--panel-border);
  background: color-mix(in srgb, var(--bg-surface) 76%, transparent);
  text-align: left;
}

.priority-option strong,
.priority-option span {
  display: block;
}

.priority-option strong {
  font-size: 1rem;
}

.priority-option span {
  margin-top: 8px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.priority-option.active.normal {
  border-color: rgba(16, 185, 129, 0.28);
  background: rgba(16, 185, 129, 0.1);
}

.priority-option.active.urgent {
  border-color: rgba(245, 158, 11, 0.28);
  background: rgba(245, 158, 11, 0.1);
}

.priority-option.active.critical {
  border-color: rgba(239, 68, 68, 0.28);
  background: rgba(239, 68, 68, 0.1);
}

.action-submit {
  justify-self: start;
  padding: 0 18px;
  color: white;
}

.blue-btn {
  background: linear-gradient(135deg, var(--brand-primary), #2563eb);
}

.red-btn {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.amber-btn {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.green-btn {
  background: linear-gradient(135deg, #10b981, #059669);
}

.action-submit:disabled,
.footer-submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.detail-columns {
  display: grid;
  gap: 16px;
}

.section-mini-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 18px;
}

.section-mini-head h4 {
  margin: 0;
  font-size: 1.02rem;
}

.description-text {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.85;
}

.approval-list,
.timeline {
  display: grid;
  gap: 14px;
}

.approval-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 18px;
  border-radius: 20px;
  background: color-mix(in srgb, var(--bg-surface) 74%, transparent);
  border: 1px solid var(--panel-border);
}

.approval-row strong,
.approval-row p {
  display: block;
}

.approval-row p {
  margin: 6px 0 0;
  color: var(--text-secondary);
}

.approval-pill {
  min-height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  font-size: 0.78rem;
  font-weight: 700;
}

.approval-pill.approved {
  background: rgba(16, 185, 129, 0.12);
  color: var(--brand-secondary);
}

.approval-pill.pending {
  background: rgba(245, 158, 11, 0.12);
  color: var(--brand-warning);
}

.timeline-row {
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr);
  gap: 14px;
}

.timeline-dot {
  width: 12px;
  height: 12px;
  margin-top: 8px;
  border-radius: 999px;
  background: var(--brand-primary);
  box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.1);
}

.timeline-content {
  padding: 16px 18px;
  border-radius: 20px;
  border: 1px solid var(--panel-border);
  background: color-mix(in srgb, var(--bg-surface) 74%, transparent);
}

.timeline-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.timeline-head span,
.timeline-content p,
.timeline-content small {
  display: block;
}

.timeline-head span,
.timeline-content p,
.timeline-content small {
  color: var(--text-secondary);
}

.timeline-content p {
  margin: 10px 0 0;
}

.timeline-content small {
  margin-top: 6px;
  line-height: 1.7;
}

.empty-detail h3 {
  margin: 0;
  font-size: 1.3rem;
}

.empty-detail p {
  margin: 0;
  max-width: 460px;
  line-height: 1.8;
}

.create-overlay {
  position: fixed;
  inset: 0;
  z-index: 80;
  padding: 24px;
  background: rgba(9, 17, 31, 0.48);
  backdrop-filter: blur(18px);
}

.create-shell {
  width: min(1040px, 100%);
  max-height: calc(100vh - 48px);
  margin: 0 auto;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  border-radius: 34px;
  background:
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.1), transparent 24%),
    color-mix(in srgb, var(--bg-primary) 94%, black 6%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 30px 80px rgba(2, 8, 23, 0.34);
  overflow: hidden;
}

.create-header {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr) 48px;
  align-items: center;
  gap: 12px;
  padding: 22px 24px 18px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.16);
}

.create-header h3 {
  margin: 0;
  font-size: 1.8rem;
  letter-spacing: -0.04em;
}

.create-close,
.create-spacer {
  width: 44px;
  height: 44px;
  border-radius: 16px;
}

.create-close {
  display: grid;
  place-items: center;
  color: var(--text-secondary);
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: color-mix(in srgb, var(--bg-surface) 72%, transparent);
}

.create-content {
  min-height: 0;
  overflow: auto;
  padding: 22px 24px 24px;
  display: grid;
  gap: 20px;
}

.create-identity {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  padding: 20px;
  border-radius: 28px;
}

.identity-tile {
  padding: 18px;
  border-radius: 22px;
  border: 1px solid var(--panel-border);
  background: color-mix(in srgb, var(--bg-surface) 74%, transparent);
}

.identity-tile span,
.identity-tile small {
  display: block;
}

.identity-tile span {
  color: var(--text-tertiary);
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.identity-tile strong {
  display: block;
  margin-top: 10px;
  line-height: 1.55;
}

.identity-tile small {
  margin-top: 8px;
  color: var(--text-secondary);
  line-height: 1.65;
}

.create-editor {
  padding: 20px;
  border-radius: 30px;
}

.create-editor :deep(.voice-input-wrapper) {
  gap: 14px;
}

.create-editor :deep(.voice-input-container) {
  flex-direction: column;
  align-items: stretch;
}

.create-editor :deep(.voice-textarea) {
  min-height: 280px;
  padding: 20px 22px;
  border-radius: 24px;
  background: color-mix(in srgb, var(--bg-surface) 80%, transparent);
  border-color: var(--panel-border);
  font-size: 1rem;
  line-height: 1.85;
}

.create-editor :deep(.voice-btn) {
  flex-direction: row;
  justify-content: center;
  min-height: 52px;
  border-radius: 18px;
  background: color-mix(in srgb, var(--bg-surface) 76%, transparent);
  border-color: var(--panel-border);
}

.create-tip {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.75;
}

.create-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 18px 24px 22px;
  border-top: 1px solid rgba(148, 163, 184, 0.16);
}

.footer-cancel {
  padding: 0 18px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  color: var(--text-primary);
  background: color-mix(in srgb, var(--bg-surface) 72%, transparent);
}

.footer-submit {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 0 20px;
  color: white;
  background: linear-gradient(135deg, var(--brand-primary), #2563eb);
  box-shadow: 0 18px 34px rgba(59, 130, 246, 0.26);
}

@media (max-width: 1200px) {
  .board-grid,
  .hero-strip {
    grid-template-columns: 1fr;
  }

  .stats-row,
  .detail-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .create-identity,
  .priority-selector {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .hero-strip,
  .list-panel,
  .detail-hero,
  .detail-section,
  .action-card {
    padding: 20px;
    border-radius: 26px;
  }

  .stats-row,
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .create-overlay {
    padding: 12px;
  }

  .create-shell {
    max-height: calc(100vh - 24px);
    border-radius: 24px;
  }

  .create-header,
  .create-content,
  .create-footer {
    padding-left: 16px;
    padding-right: 16px;
  }

  .create-footer {
    flex-direction: column;
  }

  .footer-cancel,
  .footer-submit,
  .action-submit {
    width: 100%;
    justify-content: center;
  }
}
</style>
