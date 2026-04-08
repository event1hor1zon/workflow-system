<template>
  <div class="panorama-container">
    <div class="panorama-header">
      <button class="theme-toggle-btn" @click="toggleTheme">
        {{ isDark ? '☀️' : '🌙' }}
      </button>
      <div class="header-brand">
        <span class="brand-icon">🤝</span>
        <span class="brand-title">握手协同 SOP 工作闭环全景图</span>
      </div>
      <div class="header-subtitle">包头分公司网络条线 · 点击部门节点查看详情</div>
    </div>

    <div class="panorama-body">
      <!-- 顶部：各旗县分公司 -->
      <div class="tier-section upper-section">
        <div class="section-label">各旗县分公司</div>
        <div class="tier-nodes">
          <div
            v-for="county in counties"
            :key="county.id"
            class="tier-node county-node"
            @click="openModal(county, 'county')"
          >
            <span class="node-icon">🏢</span>
            <span class="node-name">{{ county.name }}</span>
          </div>
        </div>
      </div>

      <!-- 连接线 -->
      <div class="connector-line vertical-connector"></div>

      <!-- 中间层1：市场经营部、政企客户部、客户服务中心 -->
      <div class="tier-section middle-section-1">
        <div class="section-label">需求发起部门</div>
        <div class="tier-nodes horizontal-nodes">
          <div
            v-for="dept in upperDepts"
            :key="dept.id"
            class="tier-node demand-node"
            @click="openModal(dept, 'demand')"
          >
            <span class="node-icon">{{ dept.icon }}</span>
            <span class="node-name">{{ dept.name }}</span>
          </div>
        </div>
      </div>

      <!-- 椭圆形布局：三部门 -->
      <div class="ellipse-section">
        <div class="section-label">核心处理部门（椭圆形握手）</div>
        <div class="ellipse-container">
          <!-- 椭圆形 SVG 背景 -->
          <svg class="ellipse-svg" viewBox="0 0 500 300">
            <defs>
              <ellipse
                id="mainEllipse"
                cx="250"
                cy="150"
                rx="220"
                ry="120"
                fill="none"
                stroke="var(--border-color)"
                stroke-width="2"
                stroke-dasharray="8 4"
              />
            </defs>
            <!-- 绘制椭圆 -->
            <use href="#mainEllipse" />
          </svg>

          <!-- 三个部门节点 -->
          <div
            v-for="(dept, index) in ellipseDepts"
            :key="dept.id"
            class="ellipse-node"
            :class="dept.colorClass"
            :style="getEllipseNodeStyle(index)"
            @click="openModal(dept, 'department')"
          >
            <span class="node-icon">{{ dept.icon }}</span>
            <span class="node-name">{{ dept.name }}</span>
            <div class="node-pulse"></div>
          </div>

          <!-- 握手图标 -->
          <div class="handshake-icons">
            <span class="handshake-icon">🤝</span>
          </div>
        </div>
      </div>

      <!-- 连接线 -->
      <div class="connector-line vertical-connector down"></div>

      <!-- 底部：闭环存档 -->
      <div class="tier-section lower-section">
        <div class="section-label">闭环存档</div>
        <div class="tier-nodes">
          <div class="tier-node archive-node" @click="openModal({ name: '闭环存档' }, 'archive')">
            <span class="node-icon">✅</span>
            <span class="node-name">闭环存档</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 图例 -->
    <div class="legend-bar">
      <div class="legend-item">
        <span class="legend-dot completed"></span>
        <span class="legend-text">已完成</span>
      </div>
      <div class="legend-item">
        <span class="legend-dot processing"></span>
        <span class="legend-text">进行中</span>
      </div>
      <div class="legend-item">
        <span class="legend-dot pending"></span>
        <span class="legend-text">待处理</span>
      </div>
    </div>

    <!-- 底部导航 -->
    <div class="bottom-nav">
      <button class="nav-btn primary" @click="goToOrders">
        <span class="nav-icon">📋</span>
        <span class="nav-text">工单列表</span>
      </button>
      <button class="nav-btn" @click="goToCreate">
        <span class="nav-icon">➕</span>
        <span class="nav-text">创建工单</span>
      </button>
    </div>

    <!-- 详情弹窗 -->
    <div class="modal-overlay" v-if="modalVisible" @click="closeModal">
      <div class="modal-panel" @click.stop>
        <div class="modal-header">
          <span class="modal-icon">{{ modalData.icon || '📋' }}</span>
          <span class="modal-title">{{ modalData.name }}</span>
          <button class="modal-close" @click="closeModal">×</button>
        </div>
        <div class="modal-content">
          <div class="modal-section">
            <h4 class="section-title">{{ getModalTitle() }}</h4>
            <div class="section-content">
              <p v-for="(item, index) in getModalContent()" :key="index" class="content-item">
                {{ item }}
              </p>
            </div>
          </div>

          <div class="modal-section">
            <h4 class="section-title">📌 职责说明</h4>
            <div class="section-content">
              <p class="content-text">{{ getResponsibility() }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const isDark = ref(true);

// 旗县数据
const counties = ref([
  { id: 'dq', name: '东河区' },
  { id: 'klgd', name: '昆都仑区' },
  { id: 'qjl', name: '青山区' },
  { id: 'jy', name: '九原区' },
  { id: 'shg', name: '石拐区' },
  { id: 'bdt', name: '白云鄂博矿区' },
]);

// 上级部门（需求发起）
const upperDepts = ref([
  { id: 'scjy', name: '市场经营部', icon: '📊' },
  { id: 'zqkh', name: '政企客户部', icon: '🏢' },
  { id: 'khfw', name: '客户服务中心', icon: '📞' },
]);

// 椭圆形三部门
const ellipseDepts = ref([
  { id: 'gjjsc', name: '工程建设部', icon: '🏗️', colorClass: 'blue', angle: -60 },
  { id: 'wlb', name: '网络部', icon: '🌐', colorClass: 'purple', angle: 0 },
  { id: 'kxyx', name: '客户响应中心', icon: '📡', colorClass: 'green', angle: 60 },
]);

// 弹窗状态
const modalVisible = ref(false);
const modalData = ref({});
const modalType = ref('');

// 计算椭圆形节点位置
const getEllipseNodeStyle = (index) => {
  const ellipseWidth = 440;
  const ellipseHeight = 200;
  const centerX = 250;
  const centerY = 150;

  // 三个节点均匀分布在椭圆上
  const angles = [-60, 0, 60]; // 度
  const angle = (angles[index] * Math.PI) / 180;

  const x = centerX + ellipseWidth / 2 * Math.cos(angle);
  const y = centerY + ellipseHeight / 2 * Math.sin(angle);

  return {
    left: `${x}px`,
    top: `${y}px`,
    transform: 'translate(-50%, -50%)',
  };
};

// 切换主题
const toggleTheme = () => {
  isDark.value = !isDark.value;
  document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light');
  localStorage.setItem('sop-theme', isDark.value ? 'dark' : 'light');
};

// 打开弹窗
const openModal = (data, type) => {
  modalData.value = data;
  modalType.value = type;
  modalVisible.value = true;
};

// 关闭弹窗
const closeModal = () => {
  modalVisible.value = false;
};

// 获取弹窗标题
const getModalTitle = () => {
  switch (modalType.value) {
    case 'county':
      return '旗县分公司';
    case 'demand':
      return '需求发起部门职责';
    case 'department':
      return '核心处理部门职责';
    case 'archive':
      return '闭环存档';
    default:
      return '部门详情';
  }
};

// 获取弹窗内容
const getModalContent = () => {
  const name = modalData.value.name;

  if (modalType.value === 'county') {
    return [
      '统一上报网络建设和维护需求',
      '依托统一管理平台进行问题上报',
      '分级处置：一般问题自行处理，复杂问题上报网络部',
    ];
  }

  if (modalType.value === 'demand') {
    if (name === '市场经营部') {
      return ['市场拓展需求梳理', '商务谈判网络支持', '业务发展目标制定'];
    }
    if (name === '政企客户部') {
      return ['政企项目网络评估', '客户需求分析', '方案协同制定'];
    }
    if (name === '客户服务中心') {
      return ['客户服务需求收集', '投诉热点反馈', '满意度回访'];
    }
  }

  if (modalType.value === 'department') {
    if (name === '工程建设部') {
      return ['承接网络建设类需求', '项目设计与实施', '资源协调与进度管控'];
    }
    if (name === '网络部') {
      return ['作为枢纽汇总评估需求', '横向分配至各部门', '联席会商跟踪进度'];
    }
    if (name === '客户响应中心') {
      return ['客户响应协调', '服务最后一公里', '客户满意度保障'];
    }
  }

  if (modalType.value === 'archive') {
    return ['问题台账统一归档', '定期通报总结', '效能评估与优化'];
  }

  return [];
};

// 获取职责说明
const getResponsibility = () => {
  if (modalType.value === 'county') {
    return '各旗县分公司负责属地网络问题的统一上报和落地支撑，配合网络条线完成工程建设和维护保障。';
  }
  if (modalType.value === 'demand') {
    return '需求发起部门负责收集和分析各类网络需求，确保需求的准确性和完整性，为后续处理提供依据。';
  }
  if (modalType.value === 'department') {
    return '三部门通过"握手协同"机制实现横向联动，纵向对接上下级部门，确保问题全闭环处理。';
  }
  if (modalType.value === 'archive') {
    return '通过联席会商机制，推动问题处置、复核确认、台账销号和定期通报，确保工作闭环落地。';
  }
  return '';
};

// 跳转到工单列表
const goToOrders = () => {
  router.push('/orders');
};

// 跳转到创建工单
const goToCreate = () => {
  router.push('/orders');
};

// 初始化主题
onMounted(() => {
  const savedTheme = localStorage.getItem('sop-theme');
  if (savedTheme) {
    isDark.value = savedTheme === 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
});
</script>

<style scoped>
.panorama-container {
  min-height: 100vh;
  background: var(--bg-primary);
  color: var(--text-primary);
  display: flex;
  flex-direction: column;
}

.panorama-header {
  padding: 20px;
  text-align: center;
  position: relative;
  border-bottom: 1px solid var(--border-color);
}

.theme-toggle-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  cursor: pointer;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.theme-toggle-btn:hover {
  background: var(--accent-bg);
  border-color: var(--accent);
}

.header-brand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 8px;
}

.brand-icon {
  font-size: 2rem;
  animation: pulse-glow 2s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% { filter: drop-shadow(0 0 10px #60a5fa); }
  50% { filter: drop-shadow(0 0 25px #a78bfa); }
}

.brand-title {
  font-size: 1.5rem;
  font-weight: 700;
  background: linear-gradient(90deg, #60a5fa, #a78bfa, #f472b6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-size: 200% 200%;
  animation: gradient-shift 3s ease infinite;
}

@keyframes gradient-shift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.header-subtitle {
  color: var(--text-secondary);
  font-size: 0.85rem;
}

.panorama-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px 20px;
  gap: 20px;
}

.tier-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.section-label {
  font-size: 0.85rem;
  color: var(--text-muted);
  font-weight: 500;
}

.tier-nodes {
  display: flex;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
}

.tier-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 24px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
  min-width: 100px;
}

.tier-node:hover {
  transform: scale(1.05);
  border-color: var(--accent);
  box-shadow: 0 4px 20px var(--shadow);
}

.node-icon {
  font-size: 2rem;
}

.node-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
  text-align: center;
}

.county-node {
  background: linear-gradient(135deg, #10b981, #059669);
  border-color: #10b981;
}

.county-node .node-name {
  color: white;
}

.demand-node {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  border-color: #f59e0b;
}

.demand-node .node-name {
  color: #0f172a;
}

.connector-line {
  width: 2px;
  height: 40px;
  background: linear-gradient(to bottom, #f59e0b, #3b82f6);
  animation: line-pulse 1.5s ease-in-out infinite;
}

.connector-line.down {
  background: linear-gradient(to bottom, #3b82f6, #10b981);
}

@keyframes line-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* 椭圆形布局 */
.ellipse-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  width: 100%;
  max-width: 600px;
}

.ellipse-container {
  position: relative;
  width: 500px;
  height: 300px;
}

.ellipse-svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}

.ellipse-node {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s;
  z-index: 1;
  width: 100px;
  height: 100px;
  justify-content: center;
}

.ellipse-node:hover {
  transform: translate(-50%, -50%) scale(1.1) !important;
  z-index: 10;
}

.ellipse-node.blue {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  box-shadow: 0 0 30px rgba(59, 130, 246, 0.5);
}

.ellipse-node.purple {
  background: linear-gradient(135deg, #8b5cf6, #6d28d9);
  box-shadow: 0 0 30px rgba(139, 92, 246, 0.5);
}

.ellipse-node.green {
  background: linear-gradient(135deg, #10b981, #047857);
  box-shadow: 0 0 30px rgba(16, 185, 129, 0.5);
}

.ellipse-node .node-icon {
  font-size: 2rem;
  color: white;
}

.ellipse-node .node-name {
  color: white;
  font-size: 0.75rem;
}

.ellipse-node .node-pulse {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.3);
  animation: ripple 1.5s ease-out infinite;
}

@keyframes ripple {
  0% { transform: scale(1); opacity: 0.8; }
  100% { transform: scale(1.5); opacity: 0; }
}

.handshake-icons {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 5;
}

.handshake-icon {
  font-size: 2.5rem;
  animation: handshake-bounce 2s ease-in-out infinite;
}

@keyframes handshake-bounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

.archive-node {
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  border-color: #6366f1;
}

.archive-node .node-name {
  color: white;
}

/* 图例 */
.legend-bar {
  display: flex;
  justify-content: center;
  gap: 24px;
  padding: 16px;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.legend-dot.completed {
  background: #10b981;
}

.legend-dot.processing {
  background: #f59e0b;
  animation: legend-pulse 1.5s ease-in-out infinite;
}

.legend-dot.pending {
  background: #a78bfa;
}

@keyframes legend-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4); }
  50% { box-shadow: 0 0 0 6px rgba(245, 158, 11, 0); }
}

.legend-text {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

/* 底部导航 */
.bottom-nav {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 20px;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  color: var(--text-primary);
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.nav-btn:hover {
  border-color: var(--accent);
  background: var(--accent-bg);
}

.nav-btn.primary {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  border: none;
  color: white;
}

.nav-btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(59, 130, 246, 0.4);
}

.nav-icon {
  font-size: 1.2rem;
}

/* 弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-panel {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.4);
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.modal-icon {
  font-size: 1.5rem;
}

.modal-title {
  flex: 1;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.modal-close:hover {
  color: var(--text-primary);
}

.modal-content {
  padding: 20px;
  overflow-y: auto;
}

.modal-section {
  margin-bottom: 20px;
}

.modal-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--accent);
  margin-bottom: 12px;
}

.section-content {
  background: var(--bg-secondary);
  border-radius: 8px;
  padding: 12px;
}

.content-item {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-bottom: 8px;
  padding-left: 16px;
  position: relative;
}

.content-item::before {
  content: '•';
  position: absolute;
  left: 0;
  color: var(--accent);
}

.content-item:last-child {
  margin-bottom: 0;
}

.content-text {
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.6;
}

/* 响应式 */
@media (max-width: 768px) {
  .ellipse-container {
    width: 350px;
    height: 220px;
  }

  .ellipse-node {
    width: 80px;
    height: 80px;
    padding: 12px;
  }

  .ellipse-node .node-icon {
    font-size: 1.5rem;
  }

  .ellipse-node .node-name {
    font-size: 0.65rem;
  }

  .handshake-icon {
    font-size: 1.8rem;
  }

  .tier-nodes {
    gap: 10px;
  }

  .tier-node {
    padding: 12px 16px;
    min-width: 80px;
  }

  .node-icon {
    font-size: 1.5rem;
  }

  .node-name {
    font-size: 0.75rem;
  }

  .brand-title {
    font-size: 1.2rem;
  }

  .bottom-nav {
    flex-direction: column;
    gap: 12px;
  }

  .nav-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
