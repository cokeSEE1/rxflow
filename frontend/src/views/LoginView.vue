<template>
  <div class="login-page">
    <div class="login-card">
      <!-- Left: Brand Panel -->
      <div class="brand-panel">
        <div class="brand-content">
          <h1 class="logo">Rx<span class="logo-accent">Flow</span></h1>
          <p class="tagline">处方配送管理平台</p>
          <ul class="features">
            <li>
              <span class="feature-icon">&#9671;</span>
              <span>四角色协作</span>
            </li>
            <li>
              <span class="feature-icon">&#9671;</span>
              <span>六状态流转</span>
            </li>
            <li>
              <span class="feature-icon">&#9671;</span>
              <span>角色权限隔离</span>
            </li>
          </ul>
        </div>
        <p class="copyright">RxFlow v1.0 &middot; Healthcare Logistics</p>
      </div>

      <!-- Right: Form Panel -->
      <div class="form-panel">
        <h2 class="form-title">欢迎回来</h2>
        <p class="form-subtitle">选择角色并登录您的账号</p>

        <!-- Role chips -->
        <div class="role-chips">
          <button
            v-for="role in roles"
            :key="role.key"
            class="role-chip"
            :class="{ active: activeRole === role.key }"
            @click="selectRole(role.key)"
            type="button"
          >
            {{ role.label }}
          </button>
        </div>

        <!-- Login form -->
        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          @submit.prevent="handleLogin"
          class="login-form"
        >
          <el-form-item prop="phone">
            <el-input
              v-model="form.phone"
              placeholder="手机号"
              size="large"
            />
          </el-form-item>
          <el-form-item prop="password">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="密码"
              size="large"
              show-password
            />
          </el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            native-type="submit"
            class="login-btn"
          >
            {{ loading ? '登录中...' : '登录' }}
          </el-button>
        </el-form>

        <!-- Test accounts hint (hidden in production) -->
        <div v-if="false" class="test-hint">
          <p class="test-hint-title">测试账号（密码统一：123456）</p>
          <div class="test-hint-grid">
            <span>助理 13800001111</span>
            <span>医生 13800002222</span>
            <span>快递员 13800003333</span>
            <span>患者 13800004444</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)
const activeRole = ref('assistant')

interface Role {
  key: string
  label: string
  phone: string
}

const roles: Role[] = [
  { key: 'assistant', label: '医生助理', phone: '13800001111' },
  { key: 'doctor', label: '医生', phone: '13800002222' },
  { key: 'courier', label: '快递员', phone: '13800003333' },
  { key: 'patient', label: '患者', phone: '13800004444' },
]

const form = reactive({ phone: import.meta.env.DEV ? '13800001111' : '', password: import.meta.env.DEV ? '123456' : '' })
const rules = {
  phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

function selectRole(key: string) {
  activeRole.value = key
  const role = roles.find(r => r.key === key)
  if (role) form.phone = role.phone
}

async function handleLogin() {
  loading.value = true
  try {
    await userStore.login(form.phone, form.password)
    ElMessage.success(`欢迎回来，${userStore.user?.name}`)
    router.push('/')
  } catch (e: any) {
    ElMessage.error(e.response?.data?.error || '登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* ========= CSS Variables ========= */
.login-page {
  --teal-900: #134e4a;
  --teal-700: #0f766e;
  --teal-500: #14b8a6;
  --teal-100: #ccfbf1;
  --coral: #f43f5e;
  --warm-50: #fafaf9;
  --warm-100: #f5f5f4;
  --warm-200: #e7e5e4;
  --warm-700: #44403c;
  --warm-900: #1c1917;
}

/* ========= Page Background ========= */
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background:
    radial-gradient(ellipse at 30% 50%, var(--teal-100) 0%, transparent 50%),
    linear-gradient(135deg, #f0fdfa 0%, var(--warm-50) 50%, #f0fdfa 100%);
  position: relative;
}

/* Grid pattern overlay */
.login-page::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(15, 118, 110, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(15, 118, 110, 0.04) 1px, transparent 1px);
  background-size: 60px 60px;
  pointer-events: none;
}

/* ========= Card ========= */
.login-card {
  display: flex;
  width: 880px;
  min-height: 520px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 1;
  animation: fadeSlideIn 0.5s ease-out;
}

@keyframes fadeSlideIn {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ========= Brand Panel (Left) ========= */
.brand-panel {
  flex: 1;
  background: linear-gradient(160deg, var(--teal-900) 0%, var(--teal-700) 100%);
  color: #fff;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 48px 40px;
  position: relative;
  overflow: hidden;
}

/* Decorative circles */
.brand-panel::before {
  content: '';
  position: absolute;
  width: 260px;
  height: 260px;
  border: 2px solid rgba(255, 255, 255, 0.08);
  border-radius: 50%;
  top: -80px;
  right: -80px;
}

.brand-panel::after {
  content: '';
  position: absolute;
  width: 160px;
  height: 160px;
  border: 2px solid rgba(255, 255, 255, 0.06);
  border-radius: 50%;
  bottom: -40px;
  left: -40px;
}

.brand-content {
  position: relative;
  z-index: 1;
}

.logo {
  font-family: 'DM Serif Display', Georgia, serif;
  font-size: 36px;
  font-weight: 400;
  margin-bottom: 8px;
  letter-spacing: -0.5px;
}

.logo-accent {
  color: var(--teal-500);
}

.tagline {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 40px;
  letter-spacing: 1px;
}

.features {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.features li {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.85);
}

.feature-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
}

.copyright {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  position: relative;
  z-index: 1;
}

/* ========= Form Panel (Right) ========= */
.form-panel {
  flex: 1;
  background: #fff;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 48px 40px;
}

.form-title {
  font-family: 'DM Serif Display', Georgia, serif;
  font-size: 28px;
  font-weight: 400;
  color: var(--warm-900);
  margin-bottom: 4px;
}

.form-subtitle {
  font-size: 14px;
  color: #78716c;
  margin-bottom: 24px;
}

/* Role chips */
.role-chips {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
}

.role-chip {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--warm-200);
  border-radius: 20px;
  background: var(--warm-50);
  font-size: 13px;
  color: var(--warm-700);
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  white-space: nowrap;
}

.role-chip:hover {
  border-color: var(--teal-500);
  color: var(--teal-700);
}

.role-chip.active {
  background: var(--teal-700);
  color: #fff;
  border-color: var(--teal-700);
}

/* Login form */
.login-form {
  margin-bottom: 20px;
}

.login-form :deep(.el-form-item) {
  margin-bottom: 16px;
}

.login-form :deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px var(--warm-200) inset;
  border-radius: 8px;
}

.login-form :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px var(--teal-500) inset;
}

.login-btn {
  width: 100%;
  background: var(--teal-700);
  border-color: var(--teal-700);
  border-radius: 8px;
  font-size: 15px;
  height: 44px;
}

.login-btn:hover,
.login-btn:focus {
  background: var(--teal-900);
  border-color: var(--teal-900);
}

/* Test accounts hint */
.test-hint {
  background: var(--warm-100);
  border-radius: 8px;
  padding: 16px;
}

.test-hint-title {
  font-size: 12px;
  color: #78716c;
  margin-bottom: 8px;
}

.test-hint-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  font-size: 12px;
  color: #a8a29e;
}

/* ========= Responsive ========= */
@media (max-width: 768px) {
  .login-card {
    flex-direction: column;
    width: 92vw;
  }

  .brand-panel {
    padding: 32px 24px;
  }

  .form-panel {
    padding: 32px 24px;
  }
}
</style>
