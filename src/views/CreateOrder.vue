<template>
  <div class="create-order-container">
    <div class="create-header">
      <button class="close-btn" @click="handleClose">×</button>
      <h2 class="create-title">新建工单</h2>
    </div>

    <div class="create-body">
      <!-- 工单标题 -->
      <div class="form-group">
        <label class="required">工单标题</label>
        <input
          v-model="form.title"
          type="text"
          placeholder="请输入工单标题"
          class="form-input"
        />
      </div>

      <!-- 工单类型 -->
      <div class="form-group">
        <label>工单类型</label>
        <select v-model="form.type" class="form-select">
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

      <!-- 优先级 -->
      <div class="form-group">
        <label>优先级</label>
        <div class="priority-options">
          <label
            v-for="option in priorityOptions"
            :key="option.value"
            :class="['priority-option', { active: form.priority === option.value }]"
          >
            <input
              type="radio"
              :value="option.value"
              v-model="form.priority"
              class="hidden-radio"
            />
            <span class="priority-icon">{{ option.icon }}</span>
            <span class="priority-text">{{ option.label }}</span>
          </label>
        </div>
      </div>

      <!-- 详细描述（支持语音输入） -->
      <div class="form-group">
        <label>详细描述</label>
        <VoiceInput
          v-model="form.description"
          placeholder="请输入工单详细描述，支持语音输入..."
          :rows="5"
        />
      </div>

      <!-- 附件提示 -->
      <div class="form-group">
        <label>附件</label>
        <div class="upload-area">
          <span class="upload-icon">📎</span>
          <span class="upload-text">点击上传或拖拽文件到这里</span>
          <span class="upload-hint">支持图片、文档等文件</span>
        </div>
      </div>
    </div>

    <div class="create-footer">
      <button class="btn-cancel" @click="handleClose">取消</button>
      <button class="btn-submit" @click="handleSubmit" :disabled="!form.title || submitting">
        <span v-if="submitting">提交中...</span>
        <span v-else>提交工单</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import VoiceInput from '../components/VoiceInput.vue';
import userStore from '../stores/user';
import { ordersApi } from '../api/order';

const emit = defineEmits(['close', 'success']);

const submitting = ref(false);

const form = reactive({
  title: '',
  type: '',
  priority: 'normal',
  description: '',
});

const priorityOptions = [
  { value: 'normal', label: '一般', icon: '📋' },
  { value: 'urgent', label: '紧急', icon: '⚡' },
  { value: 'critical', label: '重大', icon: '🚨' },
];

const handleClose = () => {
  emit('close');
};

const handleSubmit = async () => {
  if (!form.title) return;

  submitting.value = true;

  try {
    const orderData = {
      title: form.title,
      type: form.type,
      priority: form.priority,
      description: form.description,
    };

    await ordersApi.create(orderData);

    emit('success', orderData);
    emit('close');
  } catch (error) {
    console.error('创建工单失败:', error);
    alert('创建工单失败，请重试');
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
.create-order-container {
  background: var(--bg-card);
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.create-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.close-btn:hover {
  color: var(--text-primary);
}

.create-title {
  flex: 1;
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
  color: var(--text-primary);
}

.create-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.form-group {
  margin-bottom: 20px;
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

.form-group label.required::after {
  content: ' *';
  color: #ef4444;
}

.form-input,
.form-select {
  width: 100%;
  padding: 12px 14px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 0.95rem;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: var(--accent);
}

.form-input::placeholder {
  color: var(--text-muted);
}

/* 优先级选项 */
.priority-options {
  display: flex;
  gap: 12px;
}

.priority-option {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px;
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.priority-option:hover {
  border-color: var(--text-muted);
}

.priority-option.active {
  border-color: var(--accent);
  background: var(--accent-bg);
}

.hidden-radio {
  display: none;
}

.priority-icon {
  font-size: 1.5rem;
}

.priority-text {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.priority-option.active .priority-text {
  color: var(--accent);
  font-weight: 600;
}

/* 上传区域 */
.upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px;
  background: var(--bg-secondary);
  border: 2px dashed var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.upload-area:hover {
  border-color: var(--accent);
  background: var(--accent-bg);
}

.upload-icon {
  font-size: 2rem;
}

.upload-text {
  font-size: 0.9rem;
  color: var(--text-primary);
}

.upload-hint {
  font-size: 0.8rem;
  color: var(--text-muted);
}

/* 底部按钮 */
.create-footer {
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
  font-weight: 600;
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
  color: var(--text-primary);
}

.btn-submit {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  border: none;
  color: white;
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(59, 130, 246, 0.4);
}

.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 响应式 */
@media (max-width: 480px) {
  .priority-options {
    flex-direction: column;
  }
}
</style>
