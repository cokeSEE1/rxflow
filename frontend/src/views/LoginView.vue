<template>
  <div class="login-page">
    <div class="login-card">
      <h1>RxFlow</h1>
      <p class="subtitle">处方配送管理平台</p>
      <el-form ref="formRef" :model="form" :rules="rules" @submit.prevent="handleLogin">
        <el-form-item prop="phone">
          <el-input v-model="form.phone" placeholder="手机号" size="large" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" placeholder="密码" size="large" show-password />
        </el-form-item>
        <el-button type="primary" size="large" :loading="loading" native-type="submit" style="width:100%">
          登录
        </el-button>
      </el-form>
      <div class="test-accounts">
        <p>测试账号（密码：123456）</p>
        <p>助理 13800001111 | 医生 13800002222</p>
        <p>快递员 13800003333 | 病人 13800004444</p>
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

const form = reactive({ phone: '13800001111', password: '123456' })
const rules = {
  phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

async function handleLogin() {
  loading.value = true
  try {
    await userStore.login(form.phone, form.password)
    ElMessage.success(`欢迎回来，${userStore.user?.name}`)
    router.push('/')
  } catch (e: any) {
    ElMessage.error(e.response?.data?.error || '登录失败')
  } finally { loading.value = false }
}
</script>

<style scoped>
.login-page { display: flex; align-items: center; justify-content: center; height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.login-card { background: #fff; padding: 40px; border-radius: 12px; width: 400px; box-shadow: 0 10px 40px rgba(0,0,0,0.15); }
.login-card h1 { text-align: center; color: #409eff; margin-bottom: 4px; }
.subtitle { text-align: center; color: #909399; margin-bottom: 32px; font-size: 14px; }
.test-accounts { margin-top: 20px; font-size: 12px; color: #c0c4cc; text-align: center; line-height: 1.8; }
</style>
