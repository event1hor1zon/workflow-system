<template>
  <WorkspaceFrame
    current-page="home"
    eyebrow="系统全景图"
    title="首页控制台"
    subtitle="最醒目的入口始终是新建工单，下面依次展示流程路径、部门职能和系统运行状态。"
    @create="goToCreate"
    @logout="handleLogout"
  >
    <div class="dashboard-page">
      <section class="hero-panel glass-panel">
        <div class="hero-copy">
          <div class="hero-pill">
            <span class="hero-pill-dot"></span>
            次世代协同指挥中心
          </div>
          <h2>
            一键发起
            <span>企业工单协同</span>
          </h2>
          <p>
            登录后系统会按员工工号自动识别所属公司和角色权限。新建工单时只需填写详情描述，
            提交后自动流转到对应公司的网络部负责人，再由市级三部门接单定级处理。
          </p>

          <div class="hero-actions">
            <button class="hero-primary" @click="goToCreate">
              <span>
                <strong>启动核心任务</strong>
                <small>只需填写详情描述即可提交</small>
              </span>
              <ArrowRight :size="22" />
            </button>
            <button class="hero-secondary" @click="goToWorkspace">
              进入个人中心
            </button>
          </div>

          <div class="hero-quick-info">
            <article class="quick-card">
              <span>当前登录</span>
              <strong>{{ currentUser?.name || '未登录用户' }}</strong>
              <small>{{ roleName }}</small>
            </article>
            <article class="quick-card">
              <span>所属公司</span>
              <strong>{{ currentUser?.countyName || '由员工档案自动匹配' }}</strong>
              <small>新建工单无需手动选择公司</small>
            </article>
            <article class="quick-card">
              <span>闭环规则</span>
              <strong>普通/紧急单签 · 重大双签</strong>
              <small>最高领导可查看全部工单</small>
            </article>
          </div>
        </div>

        <div class="hero-visual">
          <div class="visual-grid"></div>
          <div class="visual-bars">
            <span v-for="bar in 8" :key="bar"></span>
          </div>
          <div class="visual-ring ring-a"></div>
          <div class="visual-ring ring-b"></div>
          <div class="visual-ring ring-c"></div>
          <div class="visual-core">
            <Network :size="42" />
          </div>
          <div class="visual-float float-a">
            <Zap :size="16" />
            <span>工单自动归档</span>
          </div>
          <div class="visual-float float-b">
            <ShieldCheck :size="16" />
            <span>重大工单双确认</span>
          </div>
          <div class="visual-float float-c">
            <Building2 :size="16" />
            <span>所属公司自动识别</span>
          </div>
        </div>
      </section>

      <section class="metric-row">
        <article class="metric-card surface-card">
          <div class="metric-icon blue">
            <Gauge :size="20" />
          </div>
          <div>
            <strong>99.98%</strong>
            <span>系统可靠性</span>
          </div>
        </article>
        <article class="metric-card surface-card">
          <div class="metric-icon green">
            <Mic :size="20" />
          </div>
          <div>
            <strong>语音直录</strong>
            <span>支持语音转文字提单</span>
          </div>
        </article>
        <article class="metric-card surface-card">
          <div class="metric-icon orange">
            <Clock3 :size="20" />
          </div>
          <div>
            <strong>固定流转</strong>
            <span>公司审核后直达市级三部门</span>
          </div>
        </article>
      </section>

      <section class="dashboard-section">
        <div class="section-head">
          <div>
            <p class="section-kicker">流转路径</p>
            <h3>从发起到闭环的固定流程</h3>
          </div>
        </div>

        <div class="flow-grid">
          <article class="flow-card surface-card">
            <strong>01</strong>
            <h4>员工发起工单</h4>
            <p>首页直接点击“新建工单”，只填写详情描述，可直接输入，也可语音转文字。</p>
          </article>
          <article class="flow-card surface-card">
            <strong>02</strong>
            <h4>所属公司网络部审核</h4>
            <p>系统自动识别所属公司，工单先到本公司网络部负责人，负责人可驳回或提交市级部门。</p>
          </article>
          <article class="flow-card surface-card">
            <strong>03</strong>
            <h4>市级三部门定级处理</h4>
            <p>市网络部、市工程建设部、市客户响应中心负责人接单后选择普通、紧急或重大级别。</p>
          </article>
          <article class="flow-card surface-card">
            <strong>04</strong>
            <h4>发起人 / 最高领导确认</h4>
            <p>普通和紧急工单由发起人确认结束，重大工单需发起人和最高领导全部确认。</p>
          </article>
        </div>
      </section>

      <section class="dashboard-section">
        <div class="section-head">
          <div>
            <p class="section-kicker">职能支撑矩阵</p>
            <h3>具体部门职责介绍</h3>
          </div>
        </div>

        <div class="department-grid">
          <article v-for="department in departments" :key="department.name" class="department-card surface-card">
            <div class="department-icon" :class="department.tone">
              <component :is="department.icon" :size="22" />
            </div>
            <span class="department-tag">{{ department.tag }}</span>
            <h4>{{ department.name }}</h4>
            <p>{{ department.desc }}</p>
          </article>
        </div>
      </section>

      <section class="notice-panel glass-panel">
        <div class="section-head">
          <div>
            <p class="section-kicker">办理须知</p>
            <h3>上线前统一说明</h3>
          </div>
        </div>

        <div class="notice-grid">
          <article class="notice-card">
            <strong>工号即身份</strong>
            <p>登录后按员工登记表自动识别所属公司和权限。只有管理员和最高领导是固定高权限角色。</p>
          </article>
          <article class="notice-card">
            <strong>个人中心承载详情</strong>
            <p>工单详情、审批状态、处理轨迹和所有动作区都集中在个人中心内，不再分散跳转。</p>
          </article>
          <article class="notice-card">
            <strong>领导全局查看</strong>
            <p>最高领导对普通、紧急、重大工单都具备全局查看能力，重大工单还承担最终确认职责。</p>
          </article>
        </div>
      </section>
    </div>
  </WorkspaceFrame>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import {
  ArrowRight,
  Building2,
  Clock3,
  Gauge,
  Layers3,
  Mic,
  Network,
  ShieldCheck,
  UserRoundCheck,
  Zap,
} from 'lucide-vue-next';
import WorkspaceFrame from '../components/WorkspaceFrame.vue';
import userStore, { ROLE_NAMES } from '../stores/user';

const router = useRouter();

const currentUser = computed(() => userStore.user.value);
const roleName = computed(() => ROLE_NAMES[currentUser.value?.role] || '未识别角色');

const departments = [
  {
    name: '公司网络部负责人',
    tag: '公司审核',
    desc: '负责接收本公司员工提交的工单，判断是否驳回，或分派到市网络部、市工程建设部、市客户响应中心。',
    icon: Building2,
    tone: 'blue',
  },
  {
    name: '市网络部',
    tag: '网络支撑',
    desc: '负责网络能力评估、资源协调、网络类故障定位和支撑处置，是市级处理链路中的核心部门之一。',
    icon: Network,
    tone: 'green',
  },
  {
    name: '市工程建设部',
    tag: '工程交付',
    desc: '负责建设类需求落地、施工推进和资源建设协调，接单后负责定级和处理结果提交。',
    icon: Layers3,
    tone: 'orange',
  },
  {
    name: '市客户响应中心',
    tag: '服务响应',
    desc: '负责客户侧服务协同、交付收口和响应质检，接单后同样需要完成工单级别判断和处理。',
    icon: UserRoundCheck,
    tone: 'purple',
  },
];

const goToCreate = () => {
  router.push({ path: '/me', query: { create: '1' } });
};

const goToWorkspace = () => {
  router.push('/me');
};

const handleLogout = () => {
  userStore.logout();
  router.push('/login');
};
</script>

<style scoped>
.dashboard-page {
  display: grid;
  gap: 24px;
}

.hero-panel {
  position: relative;
  overflow: hidden;
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.9fr);
  gap: 24px;
  padding: 34px;
  border-radius: 36px;
}

.hero-copy {
  position: relative;
  z-index: 1;
}

.hero-pill {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 34px;
  padding: 0 14px;
  border-radius: 999px;
  background: rgba(59, 130, 246, 0.1);
  color: var(--brand-primary);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.hero-pill-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--brand-primary);
  box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.1);
}

.hero-copy h2 {
  margin: 22px 0 14px;
  font-size: clamp(2.8rem, 4vw, 4.8rem);
  line-height: 0.92;
  letter-spacing: -0.06em;
}

.hero-copy h2 span {
  display: block;
  color: transparent;
  background: linear-gradient(90deg, var(--brand-primary), #8b5cf6, var(--brand-secondary));
  -webkit-background-clip: text;
  background-clip: text;
}

.hero-copy p {
  margin: 0;
  max-width: 650px;
  color: var(--text-secondary);
  line-height: 1.85;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 28px;
}

.hero-primary,
.hero-secondary {
  min-height: 58px;
  border-radius: 22px;
}

.hero-primary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  min-width: min(100%, 320px);
  padding: 0 22px;
  color: white;
  background: linear-gradient(135deg, var(--brand-primary), #2563eb);
  box-shadow: 0 24px 46px rgba(59, 130, 246, 0.28);
}

.hero-primary strong,
.hero-primary small {
  display: block;
  text-align: left;
}

.hero-primary strong {
  font-size: 1rem;
  letter-spacing: 0.04em;
}

.hero-primary small {
  margin-top: 4px;
  opacity: 0.72;
}

.hero-secondary {
  padding: 0 22px;
  border: 1px solid var(--panel-border);
  background: color-mix(in srgb, var(--bg-surface) 78%, transparent);
  color: var(--text-primary);
  font-weight: 700;
}

.hero-quick-info {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-top: 28px;
}

.quick-card {
  padding: 18px;
  border-radius: 22px;
  border: 1px solid var(--panel-border);
  background: color-mix(in srgb, var(--bg-surface) 78%, transparent);
}

.quick-card span,
.quick-card small {
  display: block;
}

.quick-card span {
  color: var(--text-tertiary);
  font-size: 0.76rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.quick-card strong {
  display: block;
  margin-top: 10px;
  font-size: 1rem;
}

.quick-card small {
  margin-top: 8px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.hero-visual {
  position: relative;
  min-height: 420px;
  border-radius: 32px;
  border: 1px solid var(--panel-border);
  background:
    radial-gradient(circle at center, rgba(59, 130, 246, 0.14), transparent 60%),
    color-mix(in srgb, var(--bg-surface) 66%, transparent);
  overflow: hidden;
}

.visual-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(to right, var(--grid-color) 1px, transparent 1px),
    linear-gradient(to bottom, var(--grid-color) 1px, transparent 1px);
  background-size: 36px 36px;
  opacity: 0.55;
}

.visual-bars {
  position: absolute;
  inset: auto 14% 12% 14%;
  display: flex;
  align-items: end;
  justify-content: space-between;
  height: 42%;
  opacity: 0.36;
}

.visual-bars span {
  width: 10px;
  border-radius: 999px 999px 0 0;
  background: linear-gradient(180deg, rgba(59, 130, 246, 0.08), rgba(59, 130, 246, 0.8));
  animation: rise 5.2s ease-in-out infinite;
}

.visual-bars span:nth-child(2n) {
  animation-delay: -1.1s;
}

.visual-bars span:nth-child(3n) {
  animation-delay: -2.4s;
}

.visual-ring {
  position: absolute;
  left: 50%;
  top: 50%;
  border-radius: 999px;
  border: 1px solid rgba(59, 130, 246, 0.2);
  transform: translate(-50%, -50%);
}

.ring-a {
  width: 320px;
  height: 320px;
  animation: rotate-ring 28s linear infinite;
}

.ring-b {
  width: 250px;
  height: 250px;
  border-style: dashed;
  animation: rotate-ring 18s linear infinite reverse;
}

.ring-c {
  width: 170px;
  height: 170px;
  border-color: rgba(16, 185, 129, 0.2);
}

.visual-core {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 108px;
  height: 108px;
  display: grid;
  place-items: center;
  border-radius: 32px;
  color: white;
  background: linear-gradient(135deg, var(--brand-primary), #2563eb);
  box-shadow: 0 24px 56px rgba(59, 130, 246, 0.3);
  transform: translate(-50%, -50%);
}

.visual-float {
  position: absolute;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 38px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: color-mix(in srgb, var(--bg-surface) 76%, transparent);
  color: var(--text-secondary);
  font-size: 0.8rem;
  font-weight: 700;
  backdrop-filter: blur(14px);
}

.float-a {
  left: 22px;
  top: 24px;
}

.float-b {
  right: 18px;
  top: 94px;
}

.float-c {
  left: 24px;
  bottom: 22px;
}

.metric-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.metric-card {
  display: flex;
  align-items: center;
  gap: 18px;
  min-height: 114px;
  padding: 24px;
  border-radius: 28px;
}

.metric-icon {
  width: 56px;
  height: 56px;
  display: grid;
  place-items: center;
  border-radius: 18px;
}

.metric-icon.blue {
  color: var(--brand-primary);
  background: rgba(59, 130, 246, 0.12);
}

.metric-icon.green {
  color: var(--brand-secondary);
  background: rgba(16, 185, 129, 0.12);
}

.metric-icon.orange {
  color: var(--brand-warning);
  background: rgba(245, 158, 11, 0.12);
}

.metric-card strong,
.metric-card span {
  display: block;
}

.metric-card strong {
  font-size: 1.3rem;
}

.metric-card span {
  margin-top: 6px;
  color: var(--text-secondary);
}

.dashboard-section {
  display: grid;
  gap: 18px;
}

.section-head {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 12px;
}

.section-kicker {
  margin: 0 0 8px;
  color: var(--brand-primary);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.section-head h3 {
  margin: 0;
  font-size: clamp(1.45rem, 2.1vw, 2rem);
  letter-spacing: -0.04em;
}

.flow-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.flow-card,
.department-card {
  min-height: 220px;
  padding: 24px;
  border-radius: 28px;
}

.flow-card strong {
  display: inline-grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 16px;
  background: rgba(59, 130, 246, 0.1);
  color: var(--brand-primary);
  font-family: "JetBrains Mono", monospace;
}

.flow-card h4,
.department-card h4 {
  margin: 20px 0 12px;
  font-size: 1.05rem;
}

.flow-card p,
.department-card p {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.75;
}

.department-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.department-icon {
  width: 52px;
  height: 52px;
  display: grid;
  place-items: center;
  border-radius: 18px;
}

.department-icon.blue {
  color: var(--brand-primary);
  background: rgba(59, 130, 246, 0.12);
}

.department-icon.green {
  color: var(--brand-secondary);
  background: rgba(16, 185, 129, 0.12);
}

.department-icon.orange {
  color: var(--brand-warning);
  background: rgba(245, 158, 11, 0.12);
}

.department-icon.purple {
  color: #8b5cf6;
  background: rgba(139, 92, 246, 0.12);
}

.department-tag {
  display: inline-flex;
  margin-top: 18px;
  min-height: 28px;
  align-items: center;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(59, 130, 246, 0.08);
  color: var(--brand-primary);
  font-size: 0.75rem;
  font-weight: 700;
}

.notice-panel {
  padding: 28px;
  border-radius: 32px;
}

.notice-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-top: 18px;
}

.notice-card {
  min-height: 150px;
  padding: 22px;
  border-radius: 24px;
  border: 1px solid var(--panel-border);
  background: color-mix(in srgb, var(--bg-surface) 74%, transparent);
}

.notice-card strong {
  display: block;
  font-size: 1rem;
}

.notice-card p {
  margin: 12px 0 0;
  color: var(--text-secondary);
  line-height: 1.75;
}

@keyframes rise {
  0%,
  100% {
    height: 28px;
    opacity: 0.38;
  }
  50% {
    height: 180px;
    opacity: 1;
  }
}

@keyframes rotate-ring {
  from {
    transform: translate(-50%, -50%) rotate(0deg);
  }
  to {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

@media (max-width: 1200px) {
  .hero-panel {
    grid-template-columns: 1fr;
  }

  .flow-grid,
  .department-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .hero-quick-info,
  .metric-row,
  .notice-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 680px) {
  .hero-panel,
  .notice-panel {
    padding: 22px;
    border-radius: 28px;
  }

  .hero-copy h2 {
    font-size: 2.8rem;
  }

  .flow-grid,
  .department-grid {
    grid-template-columns: 1fr;
  }

  .hero-visual {
    min-height: 320px;
  }
}
</style>
