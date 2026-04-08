<template>
  <div class="topology-graph" ref="containerRef">
    <svg :width="width" :height="height" class="topology-svg">
      <defs>
        <!-- 连接线渐变 -->
        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#60a5fa"/>
          <stop offset="100%" stop-color="#10b981"/>
        </linearGradient>
        <!-- 发光效果 -->
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <!-- 连接线 -->
      <g class="connections">
        <path
          v-for="(line, index) in connections"
          :key="'line-' + index"
          :d="line.path"
          :class="['connection-line', { animated: line.isActive }]"
          fill="none"
          stroke="url(#lineGradient)"
          stroke-width="3"
          stroke-linecap="round"
        />
        <!-- 流动粒子 -->
        <circle
          v-for="(particle, index) in particles"
          :key="'particle-' + index"
          :cx="particle.x"
          :cy="particle.y"
          r="4"
          fill="#60a5fa"
          filter="url(#glow)"
          class="flow-particle"
        />
      </g>

      <!-- 节点 -->
      <g
        v-for="node in nodes"
        :key="node.id"
        :transform="`translate(${node.x}, ${node.y})`"
        class="node-group"
        @click="handleNodeClick(node)"
        style="cursor: pointer;"
      >
        <!-- 椭圆背景 -->
        <ellipse
          v-if="node.isEllipse"
          :rx="node.radiusX"
          :ry="node.radiusY"
          :class="['node-ellipse', node.status]"
          :style="{ transform: `rotate(${node.rotation}deg)` }"
        />
        <!-- 普通圆形节点 -->
        <circle
          v-else
          :r="node.radius || 35"
          :class="['node-circle', node.status]"
        />
        <!-- 节点图标 -->
        <text
          class="node-icon"
          text-anchor="middle"
          dominant-baseline="middle"
          dy="-8"
        >
          {{ node.icon }}
        </text>
        <!-- 节点名称 -->
        <text
          class="node-name"
          text-anchor="middle"
          dominant-baseline="middle"
          dy="16"
        >
          {{ node.name }}
        </text>
        <!-- 脉冲环（当前节点） -->
        <circle
          v-if="node.isCurrent"
          :r="(node.radius || 35) + 8"
          class="pulse-ring"
        />
      </g>
    </svg>

    <!-- 节点详情弹窗 -->
    <div v-if="selectedNode" class="node-detail-popup" :style="popupStyle">
      <div class="popup-header">
        <span class="popup-icon">{{ selectedNode.icon }}</span>
        <span class="popup-title">{{ selectedNode.name }}</span>
        <button class="popup-close" @click="selectedNode = null">×</button>
      </div>
      <div class="popup-content">
        <div class="popup-row">
          <span class="popup-label">状态：</span>
          <span :class="['popup-status', selectedNode.status]">
            {{ getStatusText(selectedNode.status) }}
          </span>
        </div>
        <div v-if="selectedNode.handler" class="popup-row">
          <span class="popup-label">处理人：</span>
          <span class="popup-value">{{ selectedNode.handler }}</span>
        </div>
        <div v-if="selectedNode.time" class="popup-row">
          <span class="popup-label">处理时长：</span>
          <span class="popup-value">{{ selectedNode.time }}</span>
        </div>
        <div v-if="selectedNode.note" class="popup-row">
          <span class="popup-label">备注：</span>
          <span class="popup-value">{{ selectedNode.note }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  // 拓扑数据
  nodes: {
    type: Array,
    default: () => [],
  },
  // 连接关系
  connections: {
    type: Array,
    default: () => [],
  },
  // SVG 尺寸
  width: {
    type: Number,
    default: 800,
  },
  height: {
    type: Number,
    default: 500,
  },
});

const emit = defineEmits(['node-click']);

const containerRef = ref(null);
const selectedNode = ref(null);
const particles = ref([]);
let animationFrame = null;
let particleProgress = 0;

// 计算弹窗位置
const popupStyle = computed(() => {
  if (!selectedNode.value) return {};
  return {
    left: `${selectedNode.value.x + 50}px`,
    top: `${selectedNode.value.y - 50}px`,
  };
});

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    completed: '已完成',
    processing: '进行中',
    current: '当前环节',
    pending: '待处理',
    start: '发起人',
    end: '闭环存档',
  };
  return statusMap[status] || status;
};

// 处理节点点击
const handleNodeClick = (node) => {
  selectedNode.value = node;
  emit('node-click', node);
};

// 粒子动画
const animateParticles = () => {
  if (!props.connections.length) {
    animationFrame = requestAnimationFrame(animateParticles);
    return;
  }

  particleProgress += 0.005;
  if (particleProgress > 1) particleProgress = 0;

  const newParticles = [];
  props.connections.forEach((conn, connIndex) => {
    if (conn.isActive) {
      // 计算沿路径的位置
      const t = (particleProgress + connIndex * 0.3) % 1;
      const pos = getPointOnPath(conn.path, t);
      if (pos) {
        newParticles.push({
          x: pos.x,
          y: pos.y,
          id: connIndex,
        });
      }
    }
  });

  particles.value = newParticles;
  animationFrame = requestAnimationFrame(animateParticles);
};

// 获取路径上的点
const getPointOnPath = (pathD, t) => {
  if (!pathD) return null;

  // 简化处理：假设路径是直线或二次贝塞尔
  const commands = pathD.match(/[MLQCZS][^MLQCZS]*/gi) || [];
  if (commands.length === 0) return null;

  let totalLength = 0;
  const lengths = [];

  commands.forEach(cmd => {
    const len = estimatePathLength(cmd);
    lengths.push(len);
    totalLength += len;
  });

  const targetLength = t * totalLength;
  let currentLength = 0;

  for (let i = 0; i < commands.length; i++) {
    if (currentLength + lengths[i] >= targetLength) {
      const localT = (targetLength - currentLength) / lengths[i];
      return getPointOnCommand(commands[i], localT);
    }
    currentLength += lengths[i];
  }

  return getPointOnCommand(commands[commands.length - 1], 1);
};

// 估算路径长度
const estimatePathLength = (cmd) => {
  const match = cmd.match(/[-+]?[0-9]*\.?[0-9]+/g);
  if (!match) return 100;
  const nums = match.map(Number);
  return Math.sqrt(nums.slice(-2).reduce((acc, n, i, arr) =>
    acc + Math.pow(n - (arr[i-2] || n), 2), 0));
};

// 获取命令上的点
const getPointOnCommand = (cmd, t) => {
  const type = cmd[0].toUpperCase();
  const match = cmd.match(/[-+]?[0-9]*\.?[0-9]+/g) || [];
  const nums = match.map(Number);

  if (type === 'M' || type === 'L') {
    const x = nums[0];
    const y = nums[1];
    return { x, y };
  }

  return { x: nums[0] || 0, y: nums[1] || 0 };
};

onMounted(() => {
  animateParticles();
});

onUnmounted(() => {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
  }
});
</script>

<style scoped>
.topology-graph {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 400px;
}

.topology-svg {
  display: block;
  width: 100%;
  height: 100%;
}

/* 连接线 */
.connection-line {
  opacity: 0.6;
  transition: opacity 0.3s;
}

.connection-line.animated {
  opacity: 1;
  stroke-dasharray: 8 4;
  animation: dash 1s linear infinite;
}

@keyframes dash {
  to {
    stroke-dashoffset: -24;
  }
}

/* 流动粒子 */
.flow-particle {
  animation: particle-glow 1s ease-in-out infinite;
}

@keyframes particle-glow {
  0%, 100% {
    opacity: 0.8;
    r: 4;
  }
  50% {
    opacity: 1;
    r: 6;
  }
}

/* 节点组 */
.node-group {
  cursor: pointer;
  transition: transform 0.2s;
}

.node-group:hover {
  transform: scale(1.1);
}

/* 圆形节点 */
.node-circle {
  fill: var(--bg-secondary);
  stroke: var(--border-color);
  stroke-width: 2;
  transition: all 0.3s;
}

.node-circle.start {
  fill: #3b82f6;
  stroke: #3b82f6;
}

.node-circle.end,
.node-circle.completed {
  fill: #10b981;
  stroke: #10b981;
}

.node-circle.processing,
.node-circle.current {
  fill: #f59e0b;
  stroke: #f59e0b;
}

.node-circle.pending {
  fill: #a78bfa;
  stroke: #a78bfa;
}

/* 椭圆节点 */
.node-ellipse {
  fill: var(--bg-secondary);
  stroke: var(--border-color);
  stroke-width: 2;
  transition: all 0.3s;
}

.node-ellipse.start {
  fill: #3b82f6;
  stroke: #3b82f6;
}

.node-ellipse.end,
.node-ellipse.completed {
  fill: #10b981;
  stroke: #10b981;
}

.node-ellipse.processing,
.node-ellipse.current {
  fill: #f59e0b;
  stroke: #f59e0b;
}

/* 节点图标 */
.node-icon {
  font-size: 24px;
  fill: white;
  pointer-events: none;
}

/* 节点名称 */
.node-name {
  font-size: 11px;
  font-weight: 600;
  fill: var(--text-primary);
  pointer-events: none;
}

/* 脉冲环 */
.pulse-ring {
  fill: none;
  stroke: #f59e0b;
  stroke-width: 2;
  opacity: 0;
  animation: pulse-ring 1.5s ease-out infinite;
}

@keyframes pulse-ring {
  0% {
    transform: scale(1);
    opacity: 0.8;
  }
  100% {
    transform: scale(1.8);
    opacity: 0;
  }
}

/* 节点详情弹窗 */
.node-detail-popup {
  position: absolute;
  z-index: 100;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 0;
  min-width: 200px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.popup-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.popup-icon {
  font-size: 1.2rem;
}

.popup-title {
  flex: 1;
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.95rem;
}

.popup-close {
  background: none;
  border: none;
  font-size: 1.2rem;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.popup-close:hover {
  color: var(--text-primary);
}

.popup-content {
  padding: 12px 16px;
}

.popup-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 0.85rem;
}

.popup-row:last-child {
  margin-bottom: 0;
}

.popup-label {
  color: var(--text-muted);
}

.popup-value {
  color: var(--text-primary);
}

.popup-status {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.popup-status.completed,
.popup-status.end {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.popup-status.processing,
.popup-status.current {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

.popup-status.pending {
  background: rgba(167, 139, 250, 0.2);
  color: #a78bfa;
}

.popup-status.start {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}
</style>
