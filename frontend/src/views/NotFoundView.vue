<template>
  <div class="error-page">
    <!-- Decorative circles -->
    <div
      class="deco-circle deco-circle--tl"
      aria-hidden="true"
    />
    <div
      class="deco-circle deco-circle--br"
      aria-hidden="true"
    />
    <div
      class="deco-circle deco-circle--tr"
      aria-hidden="true"
    />

    <div class="error-center">
      <!-- Watermark number -->
      <div
        class="watermark"
        aria-hidden="true"
      >
        404
      </div>

      <!-- Medical cross icon -->
      <div
        class="medical-cross"
        aria-hidden="true"
      />

      <!-- Title -->
      <h1 class="error-title">
        页面未找到
      </h1>

      <!-- Subtitle -->
      <p class="error-subtitle">
        您访问的处方或页面不存在，可能已被移除或地址输入有误
      </p>

      <!-- Action button -->
      <el-button
        v-if="userStore.isLoggedIn"
        class="action-btn"
        size="large"
        @click="goHome"
      >
        返回工作台
      </el-button>
      <el-button
        v-else
        class="action-btn"
        size="large"
        @click="goLogin"
      >
        前往登录
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

function goHome() {
  router.push('/')
}

function goLogin() {
  router.push('/login')
}
</script>

<style scoped lang="scss">
/* ========= Page Background ========= */
.error-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background:
    radial-gradient(ellipse at 30% 50%, var(--teal-100) 0%, transparent 50%),
    linear-gradient(135deg, #f0fdfa 0%, var(--warm-50) 50%, #f0fdfa 100%);
  position: relative;
  overflow: hidden;
}

/* Grid pattern overlay */
.error-page::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(15, 118, 110, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(15, 118, 110, 0.04) 1px, transparent 1px);
  background-size: 60px 60px;
  pointer-events: none;
}

/* ========= Decorative Circles ========= */
.deco-circle {
  position: absolute;
  border-radius: 50%;
  border: 2px solid;
  pointer-events: none;
}

.deco-circle--tl {
  width: 320px;
  height: 320px;
  border-color: rgba(15, 118, 110, 0.06);
  top: -120px;
  left: -80px;
  animation: circleDrift 20s ease-in-out infinite;
}

.deco-circle--br {
  width: 240px;
  height: 240px;
  border-color: rgba(15, 118, 110, 0.05);
  bottom: -80px;
  right: -60px;
  animation: circleDrift 25s ease-in-out infinite reverse;
}

.deco-circle--tr {
  width: 160px;
  height: 160px;
  border-color: rgba(15, 118, 110, 0.04);
  top: 60px;
  right: 120px;
  animation: circleDrift 18s ease-in-out infinite 5s;
}

@keyframes circleDrift {
  0%, 100% {
    transform: translate(0, 0);
  }
  25% {
    transform: translate(10px, -8px);
  }
  50% {
    transform: translate(-5px, 12px);
  }
  75% {
    transform: translate(-8px, -4px);
  }
}

/* ========= Content Center ========= */
.error-center {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 40px;
  max-width: 520px;
  animation: contentReveal 0.6s ease-out;
}

@keyframes contentReveal {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ========= Watermark ========= */
.watermark {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -55%);
  font-family: 'DM Serif Display', Georgia, serif;
  font-size: clamp(160px, 22vw, 260px);
  font-weight: 400;
  color: var(--teal-700);
  opacity: 0.06;
  line-height: 1;
  letter-spacing: -4px;
  pointer-events: none;
  user-select: none;
  animation: watermarkReveal 0.8s ease-out 0.1s both;
}

@keyframes watermarkReveal {
  from {
    opacity: 0;
    transform: translate(-50%, -65%);
  }
  to {
    opacity: 0.06;
    transform: translate(-50%, -55%);
  }
}

/* ========= Medical Cross ========= */
.medical-cross {
  position: relative;
  width: 48px;
  height: 48px;
  margin: 0 auto 32px;
  opacity: 0.5;
  animation: crossReveal 0.5s ease-out 0.2s both;
}

.medical-cross::before,
.medical-cross::after {
  content: '';
  position: absolute;
  background: var(--teal-700);
  border-radius: 4px;
}

.medical-cross::before {
  width: 48px;
  height: 8px;
  top: 20px;
  left: 0;
}

.medical-cross::after {
  width: 8px;
  height: 48px;
  left: 20px;
  top: 0;
}

@keyframes crossReveal {
  from {
    opacity: 0;
    transform: scale(0.6);
  }
  to {
    opacity: 0.5;
    transform: scale(1);
  }
}

/* ========= Typography ========= */
.error-title {
  font-family: 'DM Serif Display', Georgia, serif;
  font-size: 28px;
  font-weight: 400;
  color: var(--warm-900);
  margin-bottom: 12px;
  letter-spacing: -0.3px;
  position: relative;
  animation: textReveal 0.5s ease-out 0.35s both;
}

.error-subtitle {
  font-family: 'DM Sans', system-ui, -apple-system, sans-serif;
  font-size: 14px;
  line-height: 1.7;
  color: var(--warm-700);
  margin-bottom: 36px;
  max-width: 380px;
  margin-left: auto;
  margin-right: auto;
  animation: textReveal 0.5s ease-out 0.45s both;
}

@keyframes textReveal {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ========= Action Button ========= */
.action-btn {
  animation: btnReveal 0.5s ease-out 0.55s both;
  --el-button-bg-color: var(--teal-700);
  --el-button-border-color: var(--teal-700);
  --el-button-hover-bg-color: var(--teal-900);
  --el-button-hover-border-color: var(--teal-900);
  --el-button-active-bg-color: var(--teal-900);
  --el-button-active-border-color: var(--teal-900);
  border-radius: 8px;
  font-size: 15px;
  font-family: 'DM Sans', system-ui, -apple-system, sans-serif;
  padding: 12px 36px;
  height: auto;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(15, 118, 110, 0.3);
}

.action-btn:active {
  transform: translateY(0);
}

@keyframes btnReveal {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ========= Responsive ========= */
@media (max-width: 768px) {
  .error-center {
    padding: 24px;
    max-width: 100%;
  }

  .watermark {
    font-size: clamp(120px, 30vw, 180px);
    letter-spacing: -2px;
  }

  .error-title {
    font-size: 24px;
  }

  .error-subtitle {
    font-size: 13px;
    max-width: 300px;
  }

  .deco-circle--tl {
    width: 200px;
    height: 200px;
    top: -60px;
    left: -40px;
  }

  .deco-circle--br {
    width: 150px;
    height: 150px;
    bottom: -40px;
    right: -30px;
  }

  .deco-circle--tr {
    display: none;
  }
}
</style>
