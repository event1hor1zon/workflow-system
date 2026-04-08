<template>
  <div class="voice-input-wrapper">
    <div class="voice-input-container">
      <textarea
        ref="textareaRef"
        v-model="text"
        :placeholder="placeholder"
        :rows="rows"
        :disabled="disabled"
        class="voice-textarea"
        @input="handleInput"
      ></textarea>
      <button
        type="button"
        :class="['voice-btn', { recording: isRecording, disabled: disabled }]"
        @click="toggleRecording"
        :disabled="disabled || !isSupported"
        :title="isSupported ? (isRecording ? '停止录音' : '开始语音输入') : '浏览器不支持语音输入'"
      >
        <span class="voice-icon">{{ isRecording ? '🔴' : '🎤' }}</span>
        <span v-if="isRecording" class="recording-text">录音中</span>
      </button>
    </div>
    <div v-if="isRecording" class="recording-indicator">
      <span class="wave"></span>
      <span class="wave"></span>
      <span class="wave"></span>
      <span class="recognized-text">{{ recognizedText || '正在识别...' }}</span>
    </div>
    <div v-if="error" class="voice-error">{{ error }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: '请输入内容...',
  },
  rows: {
    type: Number,
    default: 3,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:modelValue']);

const textareaRef = ref(null);
const text = ref(props.modelValue);
const isRecording = ref(false);
const recognizedText = ref('');
const error = ref('');
const isSupported = ref(false);

let recognition = null;

// 监听 modelValue 变化
const handleInput = () => {
  emit('update:modelValue', text.value);
};

// 切换录音状态
const toggleRecording = () => {
  if (isRecording.value) {
    stopRecording();
  } else {
    startRecording();
  }
};

// 开始录音
const startRecording = () => {
  if (!isSupported.value) {
    error.value = '您的浏览器不支持语音识别功能';
    return;
  }

  error.value = '';
  recognizedText.value = '';

  try {
    recognition.lang = 'zh-CN';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.start();
    isRecording.value = true;
  } catch (err) {
    error.value = '无法启动语音识别：' + err.message;
    console.error('Speech recognition error:', err);
  }
};

// 停止录音
const stopRecording = () => {
  if (recognition) {
    recognition.stop();
  }
  isRecording.value = false;
};

// 处理识别结果
const handleResult = (event) => {
  let finalTranscript = '';
  let interimTranscript = '';

  for (let i = event.resultIndex; i < event.results.length; i++) {
    const transcript = event.results[i][0].transcript;
    if (event.results[i].isFinal) {
      finalTranscript += transcript;
    } else {
      interimTranscript += transcript;
    }
  }

  if (finalTranscript) {
    text.value += finalTranscript;
    emit('update:modelValue', text.value);
    recognizedText.value = '';
  } else if (interimTranscript) {
    recognizedText.value = interimTranscript;
  }
};

// 处理识别错误
const handleError = (event) => {
  console.error('Speech recognition error:', event.error);

  switch (event.error) {
    case 'no-speech':
      error.value = '未检测到语音，请重试';
      break;
    case 'audio-capture':
      error.value = '无法访问麦克风';
      break;
    case 'not-allowed':
      error.value = '麦克风权限被拒绝，请在浏览器设置中允许';
      break;
    case 'network':
      error.value = '网络错误，请检查网络连接';
      break;
    case 'aborted':
      // 用户主动停止，不显示错误
      break;
    default:
      error.value = '语音识别出错：' + event.error;
  }

  isRecording.value = false;
};

// 初始化语音识别
onMounted(() => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (SpeechRecognition) {
    isSupported.value = true;
    recognition = new SpeechRecognition();

    recognition.onresult = handleResult;
    recognition.onerror = handleError;
    recognition.onend = () => {
      isRecording.value = false;
    };
  } else {
    isSupported.value = false;
    error.value = '您的浏览器不支持 Web Speech API';
  }
});

onUnmounted(() => {
  if (recognition) {
    recognition.abort();
  }
});
</script>

<style scoped>
.voice-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.voice-input-container {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.voice-textarea {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 14px;
  line-height: 1.6;
  resize: vertical;
  min-height: 60px;
  transition: border-color 0.2s;
}

.voice-textarea:focus {
  outline: none;
  border-color: var(--accent);
}

.voice-textarea:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.voice-textarea::placeholder {
  color: var(--text-muted);
}

.voice-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 60px;
}

.voice-btn:hover:not(.disabled) {
  background: var(--accent-bg);
  border-color: var(--accent);
}

.voice-btn.recording {
  background: rgba(239, 68, 68, 0.2);
  border-color: #ef4444;
  animation: pulse-recording 1s ease-in-out infinite;
}

.voice-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@keyframes pulse-recording {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 0 0 8px rgba(239, 68, 68, 0);
  }
}

.voice-icon {
  font-size: 1.5rem;
  line-height: 1;
}

.recording-text {
  font-size: 0.7rem;
  color: #ef4444;
  font-weight: 600;
}

.recording-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 6px;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.wave {
  width: 4px;
  height: 16px;
  background: #ef4444;
  border-radius: 2px;
  animation: wave 0.8s ease-in-out infinite;
}

.wave:nth-child(1) { animation-delay: 0s; }
.wave:nth-child(2) { animation-delay: 0.1s; }
.wave:nth-child(3) { animation-delay: 0.2s; }

@keyframes wave {
  0%, 100% {
    transform: scaleY(0.5);
  }
  50% {
    transform: scaleY(1);
  }
}

.recognized-text {
  flex: 1;
  font-size: 0.85rem;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.voice-error {
  padding: 8px 12px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 6px;
  color: #ef4444;
  font-size: 0.8rem;
}
</style>
