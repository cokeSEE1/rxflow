<template>
  <el-drawer
    :model-value="modelValue"
    title="新增患者"
    direction="rtl"
    size="480px"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-position="top"
    >
      <el-form-item
        label="姓名"
        prop="name"
      >
        <el-input
          v-model="form.name"
          placeholder="请输入患者姓名"
        />
      </el-form-item>

      <el-form-item
        label="性别"
        prop="gender"
      >
        <el-select
          v-model="form.gender"
          placeholder="请选择性别"
        >
          <el-option
            label="男"
            value="male"
          />
          <el-option
            label="女"
            value="female"
          />
        </el-select>
      </el-form-item>

      <el-form-item
        label="年龄"
        prop="age"
      >
        <el-input-number
          v-model="form.age"
          :min="0"
          :max="150"
        />
      </el-form-item>

      <el-form-item
        label="手机号"
        prop="phone"
      >
        <el-input
          v-model="form.phone"
          placeholder="请输入手机号"
        />
      </el-form-item>

      <el-form-item label="地址">
        <el-input
          v-model="form.address"
          placeholder="请输入地址"
        />
      </el-form-item>

      <el-form-item label="身份证号">
        <el-input
          v-model="form.idCard"
          placeholder="请输入身份证号"
        />
      </el-form-item>

      <el-form-item label="过敏史">
        <el-input
          v-model="form.allergyHistory"
          type="textarea"
          :rows="2"
          placeholder="如无过敏史请留空"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="$emit('update:modelValue', false)">
        取消
      </el-button>
      <el-button
        type="primary"
        :loading="submitting"
        @click="handleSubmit"
      >
        确认创建
      </el-button>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { usePatientStore } from '@/stores/patient'
import type { FormInstance, FormRules } from 'element-plus'

defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  created: [patient: { id: number; name: string }]
}>()

const patientStore = usePatientStore()
const formRef = ref<FormInstance>()
const submitting = ref(false)

const defaultForm = () => ({
  name: '',
  gender: 'male' as string,
  age: 30,
  phone: '',
  address: '',
  idCard: '',
  allergyHistory: '',
})

const form = reactive({ ...defaultForm() })

const rules: FormRules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  gender: [{ required: true, message: '请选择性别', trigger: 'change' }],
  age: [{ required: true, message: '请输入年龄', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' },
  ],
}

async function handleSubmit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  submitting.value = true
  try {
    const newPatient = await patientStore.create({ ...form })
    ElMessage.success('患者创建成功')
    emit('update:modelValue', false)
    emit('created', newPatient)
    Object.assign(form, defaultForm())
  } catch {
    ElMessage.error('患者创建失败')
  } finally {
    submitting.value = false
  }
}
</script>
