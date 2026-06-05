<template>
  <el-dialog
    :model-value="modelValue"
    title="电子签名确认"
    width="460px"
    :close-on-click-modal="false"
    destroy-on-close
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div class="sign-modal-subtitle">
      根据《电子签名法》，需通过密码二次确认完成可靠电子签名
    </div>

    <div class="hash-display">
      <span class="hash-label">内容摘要 SHA-256</span>
      <span class="hash-value">{{ contentHash }}</span>
    </div>

    <div class="sign-meta">
      <span>📋 处方号：<strong>{{ prescriptionNo }}</strong></span>
      <span>👤 签名人：<strong>{{ signerName }}</strong></span>
    </div>

    <div class="form-group">
      <label>请输入登录密码以完成签名 <span class="required">*</span></label>
      <el-input
        v-model="password"
        type="password"
        placeholder="输入密码确认操作..."
        :class="{ 'shake-input': signError }"
        @keyup.enter="handleSign"
      />
    </div>

    <template #footer>
      <el-button @click="close">
        取消
      </el-button>
      <el-button
        type="primary"
        @click="handleSign"
      >
        确认签名
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps<{
  modelValue: boolean
  prescriptionNo: string
  signerName: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  signed: []
}>()

const password = ref('')
const signError = ref(false)

const contentHash = ref('')

// Generate simulated hash on open
import { watch } from 'vue'
watch(() => props.modelValue, (val) => {
  if (val) {
    const chars = '0123456789abcdef'
    let hash = ''
    for (let i = 0; i < 64; i++) hash += chars[Math.floor(Math.random() * 16)]
    contentHash.value = hash
  }
})

function close() {
  password.value = ''
  signError.value = false
  emit('update:modelValue', false)
}

function handleSign() {
  if (!password.value) {
    signError.value = true
    setTimeout(() => { signError.value = false }, 500)
    return
  }
  close()
  ElMessage.success('签名成功！配药完成，此操作已记录。')
  emit('signed')
}
</script>

<style scoped lang="scss">
.sign-modal-subtitle {
  font-size: 12px;
  color: var(--warm-500);
  margin-bottom: 20px;
}

.hash-display {
  background: var(--warm-50);
  border: 1.5px solid var(--warm-200);
  border-radius: 10px;
  padding: 14px 16px;
  font-family: 'SF Mono', 'Cascadia Code', monospace;
  font-size: 11px;
  color: var(--warm-700);
  word-break: break-all;
  line-height: 1.6;
  margin-bottom: 16px;
}

.hash-label {
  font-size: 10px;
  font-weight: 600;
  color: var(--warm-400);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: block;
  margin-bottom: 6px;
}

.hash-value {
  color: var(--teal-700);
  font-weight: 600;
}

.sign-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: var(--warm-700);
  margin-bottom: 16px;
}

.form-group {
  label {
    display: block;
    font-size: 11px;
    font-weight: 600;
    color: var(--warm-700);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 6px;
  }

  .required {
    color: var(--coral);
  }
}

.shake-input :deep(.el-input__wrapper) {
  animation: shake 0.4s ease-out;
  border-color: var(--coral) !important;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-4px); }
  40% { transform: translateX(4px); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(4px); }
}
</style>
