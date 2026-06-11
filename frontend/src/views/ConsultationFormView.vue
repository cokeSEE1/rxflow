<template>
  <div class="page">
    <div class="page-header">
      <h2>{{ isCreate ? '新建问诊' : '问诊详情' }}</h2>
      <div style="display: flex; gap: 8px;">
        <el-button v-if="isCreate" @click="$router.back()">取消</el-button>
        <el-button v-if="isCreate" type="primary" :loading="submitting" @click="handleCreate">保存草稿</el-button>
        <template v-if="!isCreate && store.current && store.current.status !== 'completed' && isDoctor">
          <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
          <el-button type="success" :loading="completing" @click="handleComplete">标记完诊</el-button>
        </template>
      </div>
    </div>

    <el-card v-if="!isCreate && store.current" style="margin-bottom: 16px;">
      <div class="meta-bar">
        <span>患者：<strong>{{ store.current.patient?.name }}</strong></span>
        <el-tag :type="statusTagType(store.current.status)" size="small">{{ statusLabel(store.current.status) }}</el-tag>
        <span v-if="store.current.doctor">医生：{{ store.current.doctor.name }}</span>
      </div>
    </el-card>

    <!-- Step 1: Core (always visible) -->
    <el-card>
      <template #header><h3>核心信息</h3></template>
      <el-form label-position="top">
        <el-form-item v-if="isCreate" label="选择患者" required>
          <el-select
            v-model="form.patientId"
            filterable
            remote
            reserve-keyword
            :remote-method="searchPatients"
            :loading="patientLoading"
            placeholder="输入患者姓名搜索..."
            clearable
            style="width: 100%;"
          >
            <el-option v-for="p in patientOptions" :key="p.id" :label="`${p.name} · ${p.phone || ''}`" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="主诉" required>
          <el-input
            v-model="form.chiefComplaint"
            type="textarea"
            :rows="2"
            placeholder="患者主要症状及持续时间，如：反复头晕、头痛1月余"
            :disabled="!canEdit"
          />
        </el-form-item>
        <el-form-item label="诊断结论" required>
          <el-input
            v-model="form.diagnosis"
            type="textarea"
            :rows="2"
            placeholder="诊断结论，如：高血压病2级"
            :disabled="!canEdit"
          />
        </el-form-item>
        <el-form-item label="ICD-10编码">
          <el-input v-model="form.icdCode" placeholder="如：I10" :disabled="!canEdit" style="max-width: 200px;" />
        </el-form-item>
      </el-form>
    </el-card>

    <!-- Step 2: History & Exam (visible in detail mode) -->
    <el-card v-if="!isCreate && store.current">
      <template #header><h3>病史与检查</h3></template>
      <el-form label-position="top">
        <el-form-item label="现病史">
          <el-input v-model="form.presentIllness" type="textarea" :rows="3" placeholder="疾病发生发展过程..." :disabled="!canEdit" />
        </el-form-item>
        <el-form-item label="既往史">
          <el-input v-model="form.pastHistory" type="textarea" :rows="2" placeholder="既往疾病、手术、过敏史..." :disabled="!canEdit" />
        </el-form-item>
        <el-form-item label="体格检查">
          <el-input v-model="form.physicalExam" type="textarea" :rows="2" placeholder="查体结果..." :disabled="!canEdit" />
        </el-form-item>
        <el-form-item label="辅助检查">
          <el-input v-model="form.auxiliaryExam" type="textarea" :rows="2" placeholder="实验室及影像学检查结果..." :disabled="!canEdit" />
        </el-form-item>
      </el-form>
    </el-card>

    <!-- Step 3: Treatment Plan (visible in detail mode) -->
    <el-card v-if="!isCreate && store.current">
      <template #header><h3>治疗方案</h3></template>
      <el-form label-position="top">
        <el-form-item label="用药建议">
          <el-input v-model="form.treatmentPlan" type="textarea" :rows="3" placeholder="推荐用药方案..." :disabled="!canEdit" />
        </el-form-item>
      </el-form>
    </el-card>

    <!-- Linked Prescriptions -->
    <el-card v-if="!isCreate && store.current && store.current.status === 'completed'">
      <template #header><h3>关联处方</h3></template>
      <el-table :data="linkedPrescriptions" v-loading="loadingLinked" empty-text="暂无关联处方">
        <el-table-column prop="prescriptionNo" label="处方编号" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="160">
          <template #default="{ row }">
            {{ new Date(row.createdAt).toLocaleString('zh-CN') }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useConsultationStore } from '@/stores/consultation'
import { useUserStore } from '@/stores/user'
import { usePatientStore } from '@/stores/patient'
import * as consultationApi from '@/api/consultations'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const store = useConsultationStore()
const userStore = useUserStore()
const patientStore = usePatientStore()

const isCreate = computed(() => route.name === 'ConsultationCreate')
const isDoctor = computed(() => userStore.role === 'doctor')
const canEdit = computed(() => isCreate.value || (isDoctor.value && store.current?.status !== 'completed'))

const submitting = ref(false)
const saving = ref(false)
const completing = ref(false)
const loadingLinked = ref(false)
const linkedPrescriptions = ref<any[]>([])

const form = reactive({
  patientId: undefined as number | undefined,
  chiefComplaint: '',
  diagnosis: '',
  icdCode: '',
  presentIllness: '',
  pastHistory: '',
  physicalExam: '',
  auxiliaryExam: '',
  treatmentPlan: '',
})

const patientOptions = ref<any[]>([])
const patientLoading = ref(false)

async function searchPatients(query: string) {
  if (!query) { patientOptions.value = []; return }
  patientLoading.value = true
  try {
    await patientStore.fetchList({ name: query, pageSize: 10 })
    patientOptions.value = patientStore.list
  } finally { patientLoading.value = false }
}

function statusTagType(status: string) {
  const map: Record<string, string> = { draft: 'info', in_progress: 'warning', completed: 'success' }
  return map[status] || 'info'
}
function statusLabel(status: string) {
  const map: Record<string, string> = { draft: '草稿', in_progress: '问诊中', completed: '已完诊' }
  return map[status] || status
}

async function handleCreate() {
  if (!form.patientId || !form.chiefComplaint.trim() || !form.diagnosis.trim()) {
    ElMessage.warning('请填写患者、主诉和诊断结论')
    return
  }
  submitting.value = true
  try {
    await store.create({
      patientId: form.patientId,
      chiefComplaint: form.chiefComplaint,
      diagnosis: form.diagnosis,
      icdCode: form.icdCode || undefined,
    })
    ElMessage.success('问诊记录已创建')
    router.push('/consultations')
  } finally { submitting.value = false }
}

async function handleSave() {
  saving.value = true
  try {
    await store.update(store.current!.id, {
      presentIllness: form.presentIllness || undefined,
      pastHistory: form.pastHistory || undefined,
      physicalExam: form.physicalExam || undefined,
      auxiliaryExam: form.auxiliaryExam || undefined,
      treatmentPlan: form.treatmentPlan || undefined,
    })
    ElMessage.success('已保存')
  } finally { saving.value = false }
}

async function handleComplete() {
  completing.value = true
  try {
    await store.complete(store.current!.id)
    ElMessage.success('已标记完诊')
  } finally { completing.value = false }
}

onMounted(async () => {
  if (!isCreate.value) {
    const id = parseInt(route.params.id as string)
    await store.fetchDetail(id)
    const c = store.current!
    form.chiefComplaint = c.chiefComplaint
    form.diagnosis = c.diagnosis
    form.icdCode = c.icdCode || ''
    form.presentIllness = c.presentIllness || ''
    form.pastHistory = c.pastHistory || ''
    form.physicalExam = c.physicalExam || ''
    form.auxiliaryExam = c.auxiliaryExam || ''
    form.treatmentPlan = c.treatmentPlan || ''

    if (c.status === 'completed') {
      loadingLinked.value = true
      try {
        linkedPrescriptions.value = await consultationApi.getConsultationPrescriptions(id)
      } finally { loadingLinked.value = false }
    }
  }
})
</script>

<style scoped>
.page { padding: 0; max-width: 860px; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.page-header h2 { font-family: 'DM Serif Display', Georgia, serif; font-size: 20px; margin: 0; }
.meta-bar { display: flex; align-items: center; gap: 16px; font-size: 13px; color: var(--warm-700); }
</style>
