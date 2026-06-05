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
        403
      </div>

      <!-- Shield-lock icon (abstract geometric) -->
      <div
        class="shield-icon"
        aria-hidden="true"
      >
        <div class="shield-body" />
        <div class="shield-lock" />
      </div>

      <!-- Title -->
      <h1 class="error-title">
        访问受限
      </h1>

      <!-- Subtitle -->
      <p class="error-subtitle">
        您的当前角色没有访问此页面的权限，如需切换角色请重新登录
      </p>

      <!-- Action buttons -->
      <div class="action-group">
        <el-button
          class="action-btn action-btn--primary"
          size="large"
          @click="goHome"
        >
          返回工作台
        </el-button>
        <el-button
          class="action-btn action-btn--secondary"
          size="large"
          @click="goLogin"
        >
          切换角色
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

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
    radial-gradient(ellipse at 70% 40%, rgba(244, 63, 94, 0.05) 0%, transparent 50%),
    radial-gradient(ellipse at 30% 60%, var(--teal-100) 0%, transparent 50%),
    linear-gradient(135deg, #fefaf9 0%, var(--warm-50) 50%, #fefafa 100%);
  position: relative;
  overflow: hidden;
}

/* Grid pattern overlay */
.error-page::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(15, 118, 110, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(15, 118, 110, 0.03) 1px, transparent 1px);
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
  width: 300px;
  height: 300px;
  border-color: rgba(244, 63, 94, 0.05);
  top: -100px;
  left: -60px;
  animation: circleDrift 22s ease-in-out infinite;
}

.deco-circle--br {
  width: 220px;
  height: 220px;
  border-color: rgba(244, 63, 94, 0.04);
  bottom: -70px;
  right: -50px;
  animation: circleDrift 26s ease-in-out infinite reverse;
}

.deco-circle--tr {
  width: 140px;
  height: 140px;
  border-color: rgba(244, 63, 94, 0.03);
  top: 80px;
  right: 100px;
  animation: circleDrift 19s ease-in-out infinite 5s;
}

@keyframes circleDrift {
  0%, 100% {
    transform: translate(0, 0);
  }
  25% {
    transform: translate(12px, -6px);
  }
  50% {
    transform: translate(-4px, 14px);
  }
  75% {
    transform: translate(-10px, -3px);
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
  opacity: 0.05;
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
    opacity: 0.05;
    transform: translate(-50%, -55%);
  }
}

/* ========= Shield Icon (geometric lock motif) ========= */
.shield-icon {
  position: relative;
  width: 48px;
  height: 48px;
  margin: 0 auto 32px;
  animation: iconReveal 0.5s ease-out 0.2s both;
}

.shield-body {
  width: 40px;
  height: 40px;
  border: 2px solid var(--coral);
  border-radius: 50%;
  opacity: 0.35;
  margin: 0 auto;
  position: relative;
}

.shield-lock {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 10px;
  height: 14px;
  border: 2px solid var(--coral);
  border-radius: 2px;
  opacity: 0.4;
}

.shield-lock::before {
  content: '';
  position: absolute;
  top: -8px;
  left: -2px;
  width: 14px;
  height: 8px;
  border: 2px solid var(--coral);
  border-bottom: none;
  border-radius: 4px 4px 0 0;
  box-sizing: content-box;
}

@keyframes iconReveal {
  from {
    opacity: 0;
    transform: scale(0.6);
  }
  to {
    opacity: 1;
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

/* ========= Action Buttons ========= */
.action-group {
  display: flex;
  gap: 12px;
  justify-content: center;
  animation: btnReveal 0.5s ease-out 0.55s both;
}

.action-btn {
  border-radius: 8px;
  font-size: 15px;
  font-family: 'DM Sans', system-ui, -apple-system, sans-serif;
  padding: 12px 28px;
  height: auto;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.action-btn:hover {
  transform: translateY(-2px);
}

.action-btn:active {
  transform: translateY(0);
}

.action-btn--primary {
  --el-button-bg-color: var(--teal-700);
  --el-button-border-color: var(--teal-700);
  --el-button-hover-bg-color: var(--teal-900);
  --el-button-hover-border-color: var(--teal-900);
  --el-button-active-bg-color: var(--teal-900);
  --el-button-active-border-color: var(--teal-900);
}

.action-btn--primary:hover {
  box-shadow: 0 6px 24px rgba(15, 118, 110, 0.3);
}

.action-btn--secondary {
  --el-button-text-color: var(--warm-700);
  --el-button-border-color: var(--warm-200);
  --el-button-bg-color: #fff;
  --el-button-hover-text-color: var(--coral);
  --el-button-hover-border-color: var(--coral);
  --el-button-hover-bg-color: rgba(244, 63, 94, 0.04);
}

.action-btn--secondary:hover {
  box-shadow: 0 6px 20px rgba(244, 63, 94, 0.12);
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

  .action-group {
    flex-direction: column;
    align-items: center;
  }

  .action-btn {
    width: 100%;
    max-width: 260px;
    justify-content: center;
  }

  .deco-circle--tl {
    width: 180px;
    height: 180px;
    top: -50px;
    left: -30px;
  }

  .deco-circle--br {
    width: 130px;
    height: 130px;
    bottom: -30px;
    right: -20px;
  }

  .deco-circle--tr {
    display: none;
  }
}
</style>
