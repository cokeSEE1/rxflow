<template>
  <div class="prescription-form-page">
    <h1 class="page-title">
      {{ resubmitMode ? '修改并重新提交' : isEdit ? '编辑处方' : '新建处方' }}
    </h1>

    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-position="top"
      class="prescription-form"
      @submit.prevent
    >
      <!-- Reject Alert Banner -->
      <el-alert
        v-if="resubmitMode && rejectedInfo"
        title="驳回原因"
        type="warning"
        :closable="false"
        show-icon
        class="reject-alert"
      >
        <template #default>
          <div class="reject-info-banner">
            <div class="reject-line">
              <span class="reject-label">驳回类型：</span>
              <el-tag
                :type="rejectTagType"
                size="small"
              >
                {{ rejectTypeLabel }}
              </el-tag>
            </div>
            <div class="reject-line">
              <span class="reject-label">驳回理由：</span>
              <span class="reject-text">{{ rejectedInfo.reason }}</span>
            </div>
          </div>
        </template>
      </el-alert>

      <!-- ==================== Section 1: Patient Selector ==================== -->
      <div class="form-section">
        <div class="section-header">
          <h2 class="section-title">
            患者信息
          </h2>
          <el-button
            type="default"
            size="small"
            @click="showPatientDrawer = true"
          >
            新增患者
          </el-button>
        </div>

        <el-form-item
          label="选择患者"
          prop="patientId"
        >
          <el-select
            v-model="form.patientId"
            filterable
            remote
            reserve-keyword
            :remote-method="searchPatients"
            :loading="patientLoading"
            placeholder="输入患者姓名搜索..."
            clearable
            class="patient-select"
            @change="onPatientSelect"
          >
            <el-option
              v-for="p in patientOptions"
              :key="p.id"
              :label="`${p.name} · ${p.phone?.slice(-4) || ''}`"
              :value="p.id"
            />
          </el-select>
        </el-form-item>

        <!-- Selected Patient Info Card -->
        <div
          v-if="selectedPatient"
          class="patient-card"
        >
          <div class="patient-card-header">
            <span class="patient-name">{{ selectedPatient.name }}</span>
            <el-tag
              size="small"
              :type="selectedPatient.gender === 'male' ? '' : 'danger'"
              effect="plain"
            >
              {{ selectedPatient.gender === 'male' ? '男' : '女' }}
            </el-tag>
          </div>
          <div class="patient-card-body">
            <div class="patient-info-row">
              <span class="info-label">年龄</span>
              <span class="info-value">{{ selectedPatient.age }} 岁</span>
            </div>
            <div class="patient-info-row">
              <span class="info-label">电话</span>
              <span class="info-value">{{ selectedPatient.phone }}</span>
            </div>
            <div class="patient-info-row">
              <span class="info-label">地址</span>
              <span class="info-value">{{ selectedPatient.address || '未填写' }}</span>
            </div>
            <div
              v-if="selectedPatient.allergyHistory"
              class="patient-info-row allergy-row"
            >
              <span class="info-label">过敏史</span>
              <span class="info-value allergy-value">
                {{ selectedPatient.allergyHistory }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- ==================== Section 2: Diagnosis ==================== -->
      <div class="form-section">
        <div class="section-header">
          <h2 class="section-title">
            诊断信息
          </h2>
          <div class="section-actions">
            <el-dropdown
              trigger="click"
              @command="loadTemplate"
            >
              <el-button
                type="default"
                size="small"
              >
                加载模板
                <el-icon class="el-icon--right">
                  <ArrowDown />
                </el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item
                    v-for="t in templates"
                    :key="t.id"
                    :command="t"
                  >
                    {{ t.name }}
                  </el-dropdown-item>
                  <el-dropdown-item
                    v-if="templates.length === 0"
                    disabled
                  >
                    暂无模板
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-button
              type="default"
              size="small"
              @click="openSaveTemplateDialog"
            >
              保存为模板
            </el-button>
          </div>
        </div>

        <el-form-item
          label="诊断描述"
          prop="diagnosis"
        >
          <el-input
            v-model="form.diagnosis"
            type="textarea"
            :rows="3"
            placeholder="请输入诊断描述..."
          />
        </el-form-item>
      </div>

      <!-- ==================== Section 3: Drug Items ==================== -->
      <div class="form-section">
        <div class="section-header">
          <h2 class="section-title">
            药品明细
          </h2>
          <el-button
            type="default"
            size="small"
            :disabled="form.items.length >= MAX_ITEMS"
            @click="addDrugItem"
          >
            添加药品
          </el-button>
        </div>

        <div
          v-if="form.items.length === 0"
          class="empty-items"
        >
          <p>尚未添加药品，请点击"添加药品"开始</p>
        </div>

        <PrescriptionDrugItemRow
          v-for="(item, index) in form.items"
          :key="item._key"
          :item="item"
          :index="index"
          :can-delete="form.items.length > MIN_ITEMS"
          :errors="itemErrors[index]"
          @update:item="onUpdateItem(index, $event)"
          @remove="removeDrugItem(index)"
        />
      </div>

      <!-- ==================== Section 4: Note ==================== -->
      <div class="form-section">
        <h2 class="section-title">
          备注
        </h2>
        <el-form-item prop="note">
          <el-input
            v-model="form.note"
            type="textarea"
            :rows="2"
            placeholder="其他需要说明的事项..."
          />
        </el-form-item>
      </div>

      <!-- ==================== Action Bar ==================== -->
      <div class="action-bar">
        <el-button
          size="large"
          :loading="saving"
          @click="handleSaveDraft"
        >
          保存草稿
        </el-button>
        <el-button
          type="primary"
          size="large"
          :loading="submitting"
          @click="handleSubmit"
        >
          提交审核
        </el-button>
      </div>
    </el-form>

    <!-- ==================== Patient Creation Drawer ==================== -->
    <PrescriptionPatientDrawer
      v-model="showPatientDrawer"
      @created="onPatientCreated"
    />

    <!-- ==================== Save Template Dialog ==================== -->
    <el-dialog
      v-model="showSaveTemplateDialog"
      title="保存为模板"
      width="420px"
    >
      <el-form label-position="top">
        <el-form-item label="模板名称">
          <el-input
            v-model="templateName"
            placeholder="给这个模板起个名字..."
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showSaveTemplateDialog = false">
          取消
        </el-button>
        <el-button
          type="primary"
          :loading="savingTemplate"
          @click="handleSaveTemplate"
        >
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'
import { usePrescriptionStore } from '@/stores/prescription'
import { usePatientStore } from '@/stores/patient'
import { getTemplates, saveTemplate } from '@/api/prescriptions'
import { useDraft } from '@/composables/useDraft'
import PrescriptionPatientDrawer from '@/components/PrescriptionPatientDrawer.vue'
import PrescriptionDrugItemRow from '@/components/PrescriptionDrugItemRow.vue'
import type { DrugItem } from '@/components/PrescriptionDrugItemRow.vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { Patient, PrescriptionItem, PrescriptionTemplate, Prescription } from '@/types'

/** 草稿恢复数据结构 */
interface DraftData {
  patientId?: number
  diagnosis?: string
  items?: DrugItem[]
  note?: string
}

// ==================== Constants ====================
const MIN_ITEMS = 1
const MAX_ITEMS = 20
const DRAFT_KEY = 'prescription_form'

// ==================== Route & Stores ====================
const route = useRoute()
const router = useRouter()
const isEdit = computed(() => route.name === 'PrescriptionEdit')

const prescriptionId = computed(() => route.params.id ? Number(route.params.id) : null)
const originalPrescription = ref<Prescription | null>(null)
const resubmitMode = ref(false)

const rejectedInfo = computed(() => {
  if (!resubmitMode.value || !originalPrescription.value) return null
  return {
    type: originalPrescription.value.rejectedType,
    reason: originalPrescription.value.rejectedReason || '无',
  }
})

const rejectTypeLabel = computed(() => {
  const map: Record<string, string> = { serious: '严重', normal: '一般', suggestion: '建议' }
  return map[rejectedInfo.value?.type ?? ''] || rejectedInfo.value?.type || '-'
})

const rejectTagType = computed(() => {
  const map: Record<string, string> = { serious: 'danger', normal: 'warning', suggestion: 'info' }
  return map[rejectedInfo.value?.type ?? ''] || 'info'
})

const prescriptionStore = usePrescriptionStore()
const patientStore = usePatientStore()

// ==================== Draft ====================
const { draft, startAutoSave, stopAutoSave, clearDraft } = useDraft(DRAFT_KEY)

// ==================== Form State ====================
const formRef = ref<FormInstance>()
const saving = ref(false)
const submitting = ref(false)

let itemKeyCounter = 0

function createEmptyItem(): DrugItem {
  return {
    _key: `drug_${++itemKeyCounter}`,
    drugName: '',
    specification: '',
    dosage: '',
    frequency: 'qd',
    days: 7,
    remark: '',
  }
}

const form = reactive<{
  patientId: number | null
  diagnosis: string
  items: DrugItem[]
  note: string
}>({
  patientId: null,
  diagnosis: '',
  items: [createEmptyItem()],
  note: '',
})

// ==================== Form Rules ====================
const rules: FormRules = {
  patientId: [
    { required: true, message: '请选择患者', trigger: 'change' },
  ],
}

// ==================== Patient Selector ====================
const patientLoading = ref(false)
const patientOptions = computed(() => patientStore.list)
const selectedPatient = ref<Patient | null>(null)
const showPatientDrawer = ref(false)

function searchPatients(query: string) {
  if (!query || query.trim().length === 0) return
  patientLoading.value = true
  patientStore.fetchList({ name: query }).finally(() => {
    patientLoading.value = false
  })
}

function onPatientSelect(patientId: number | null) {
  if (!patientId) {
    selectedPatient.value = null
    return
  }
  const found = patientStore.list.find((p: Patient) => p.id === patientId)
  selectedPatient.value = found || null
}

function onPatientCreated(newPatient: { id: number; name: string }) {
  form.patientId = newPatient.id
  const found = patientStore.list.find((p: Patient) => p.id === newPatient.id)
  selectedPatient.value = found || null
  patientStore.fetchList({ name: newPatient.name })
}

// ==================== Drug Items ====================
function onUpdateItem(index: number, updated: DrugItem) {
  form.items[index] = updated
}

function addDrugItem() {
  if (form.items.length >= MAX_ITEMS) return
  form.items.push(createEmptyItem())
}

function removeDrugItem(index: number) {
  if (form.items.length <= MIN_ITEMS) return
  form.items.splice(index, 1)
}

const itemErrors = computed(() => {
  return form.items.map((item) => {
    const errors: Record<string, string> = {}
    if (!item.drugName.trim()) {
      errors.drugName = '药品名称不能为空'
    }
    if (!item.dosage.trim()) {
      errors.dosage = '用量不能为空'
    }
    if (!item.days || item.days < 1 || item.days > 90) {
      errors.days = '天数须在 1-90 之间'
    }
    return errors
  })
})

function validateItems(): boolean {
  const errors = itemErrors.value
  const hasError = errors.some((e) => Object.keys(e).length > 0)
  if (hasError) {
    ElMessage.warning('请完善药品明细后再提交')
    return false
  }
  return true
}

// ==================== Templates ====================
const templates = ref<PrescriptionTemplate[]>([])
const showSaveTemplateDialog = ref(false)
const templateName = ref('')
const savingTemplate = ref(false)

async function fetchTemplates() {
  try {
    const result = await getTemplates()
    templates.value = result.data || []
  } catch {
    // silently ignore template fetch errors
  }
}

function loadTemplate(template: PrescriptionTemplate) {
  form.diagnosis = template.diagnosis || ''
  if (template.items && template.items.length > 0) {
    form.items = template.items.map((item: PrescriptionItem) => ({
      ...createEmptyItem(),
      drugName: item.drugName || '',
      specification: item.specification || '',
      dosage: item.dosage || '',
      frequency: item.frequency || 'qd',
      days: item.days || 7,
      remark: item.remark || '',
    }))
  }
  ElMessage.success(`已加载模板：${template.name}`)
}

function openSaveTemplateDialog() {
  if (form.items.length === 0 || !form.items.some((i) => i.drugName.trim())) {
    ElMessage.warning('请先添加药品后再保存模板')
    return
  }
  templateName.value = ''
  showSaveTemplateDialog.value = true
}

async function handleSaveTemplate() {
  if (!templateName.value.trim()) {
    ElMessage.warning('请输入模板名称')
    return
  }
  savingTemplate.value = true
  try {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const cleanItems = form.items.map(({ _key, ...rest }) => rest)
    await saveTemplate(templateName.value, form.diagnosis, cleanItems)
    ElMessage.success('模板保存成功')
    showSaveTemplateDialog.value = false
    templateName.value = ''
    await fetchTemplates()
  } catch {
    ElMessage.error('模板保存失败')
  } finally {
    savingTemplate.value = false
  }
}

// ==================== Load for Edit / Resubmit ====================
async function loadPrescriptionForEdit() {
  if (!prescriptionId.value) return
  try {
    await prescriptionStore.fetchDetail(prescriptionId.value)
    originalPrescription.value = prescriptionStore.current
    if (!originalPrescription.value) {
      ElMessage.error('处方数据不存在')
      router.push('/prescriptions')
      return
    }
    const p = originalPrescription.value
    form.patientId = p.patientId
    form.diagnosis = p.diagnosis || ''
    form.note = p.note || ''
    if (p.items?.length > 0) {
      form.items = ensureItemKeys(p.items.map((item: PrescriptionItem) => ({
        drugName: item.drugName || '',
        specification: item.specification || '',
        dosage: item.dosage || '',
        frequency: item.frequency || 'qd',
        days: item.days || 7,
        remark: item.remark || '',
      })))
    }
    if (p.status === 'rejected') {
      resubmitMode.value = true
    }
    if (form.patientId) {
      await patientStore.fetchList({})
      onPatientSelect(form.patientId)
    }
  } catch {
    ElMessage.error('加载处方数据失败')
    router.push('/prescriptions')
  }
}

// ==================== Save & Submit ====================
function buildPayload() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const cleanItems = form.items.map(({ _key, ...rest }) => rest)
  return {
    patientId: form.patientId,
    diagnosis: form.diagnosis,
    items: cleanItems,
    note: form.note,
  }
}

async function handleSaveDraft() {
  if (!form.patientId) {
    ElMessage.warning('请先选择患者')
    return
  }
  if (!validateItems()) return

  saving.value = true
  try {
    const payload = buildPayload()
    await prescriptionStore.create(payload)
    ElMessage.success('草稿已保存')
  } catch {
    ElMessage.error('草稿保存失败')
  } finally {
    saving.value = false
  }
}

async function handleSubmit() {
  if (!form.patientId) {
    ElMessage.warning('请先选择患者')
    return
  }
  if (!validateItems()) return

  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  submitting.value = true
  try {
    const payload = buildPayload()
    if (isEdit.value && prescriptionId.value) {
      await prescriptionStore.update(prescriptionId.value, payload)
      await prescriptionStore.submit(prescriptionId.value)
    } else {
      const result = await prescriptionStore.create(payload)
      await prescriptionStore.submit(result.id)
    }
    clearDraft()
    stopAutoSave()
    const successMsg = resubmitMode.value ? '处方已重新提交审核' : '处方已提交审核'
    ElMessage.success(successMsg)
    router.push('/prescriptions')
  } catch {
    ElMessage.error('处方提交失败')
  } finally {
    submitting.value = false
  }
}

// ==================== Draft Utilities ====================
function ensureItemKeys(items: Partial<PrescriptionItem>[]): DrugItem[] {
  return items.map((item) => {
    if (!item._key) {
      return { ...item, _key: `drug_${++itemKeyCounter}` } as DrugItem
    }
    return item as DrugItem
  })
}

function getDraftData() {
  if (!form.patientId && !form.diagnosis && !form.items.some((i) => i.drugName.trim())) {
    return null
  }
  return {
    patientId: form.patientId,
    diagnosis: form.diagnosis,
    items: form.items.map(({ _key, ...rest }) => ({ ...rest, _key })),
    note: form.note,
  }
}

async function restoreDraft(draftData: DraftData) {
  form.patientId = draftData.patientId || null
  form.diagnosis = draftData.diagnosis || ''
  form.items = ensureItemKeys(draftData.items || [createEmptyItem()])
  form.note = draftData.note || ''

  if (draftData.patientId) {
    const found = patientStore.list.find((p: Patient) => p.id === draftData.patientId)
    if (found) {
      selectedPatient.value = found
    }
  }
}

// ==================== Lifecycle ====================
onMounted(async () => {
  await fetchTemplates()

  if (isEdit.value) {
    await loadPrescriptionForEdit()
    return
  }

  if (draft.value) {
    try {
      await ElMessageBox.confirm(
        '检测到未完成的草稿，是否恢复？',
        '恢复草稿',
        {
          confirmButtonText: '恢复',
          cancelButtonText: '放弃',
          type: 'info',
        },
      )
      await restoreDraft(draft.value)
    } catch {
      clearDraft()
    }
  }

  startAutoSave(() => getDraftData())
})

onBeforeUnmount(() => {
  stopAutoSave()
})
</script>

<style scoped lang="scss">
.prescription-form-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px 32px;
}

.page-title {
  font-family: 'DM Serif Display', Georgia, serif;
  font-size: 28px;
  font-weight: 400;
  color: var(--teal-900);
  margin-bottom: 28px;
  letter-spacing: -0.5px;
}

.prescription-form {
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* ==================== Form Sections ==================== */
.form-section {
  background: #fff;
  border: 1px solid var(--warm-200);
  border-radius: 12px;
  box-shadow: var(--shadow-sm);
  padding: 24px 28px;
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.section-title {
  font-family: 'DM Serif Display', Georgia, serif;
  font-size: 18px;
  font-weight: 400;
  color: var(--warm-900);
  margin: 0;
  letter-spacing: -0.3px;
}

.section-actions {
  display: flex;
  gap: 8px;
}

/* ==================== Patient Selector ==================== */
.patient-select {
  width: 100%;
}

/* ==================== Patient Info Card ==================== */
.patient-card {
  margin-top: 16px;
  background: var(--warm-50);
  border: 1px solid var(--warm-200);
  border-radius: 10px;
  padding: 16px 20px;
}

.patient-card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--warm-200);
}

.patient-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--warm-900);
}

.patient-card-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.patient-info-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 14px;
}

.info-label {
  min-width: 48px;
  color: var(--warm-700);
  font-weight: 500;
  flex-shrink: 0;
}

.info-value {
  color: var(--warm-900);
}

.allergy-row {
  margin-top: 6px;
  padding: 8px 12px;
  background: rgba(244, 63, 94, 0.06);
  border-left: 3px solid var(--coral);
  border-radius: 0 6px 6px 0;
}

.allergy-value {
  color: var(--coral) !important;
  font-weight: 600;
}

/* ==================== Drug Items ==================== */
.empty-items {
  text-align: center;
  padding: 32px 0;
  color: var(--warm-700);
  font-size: 14px;
}

/* ==================== Action Bar ==================== */
.action-bar {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 24px 0;
}

/* ==================== Reject Alert ==================== */
.reject-alert {
  margin-bottom: 20px;
}

.reject-info-banner {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.reject-line {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.reject-label {
  color: var(--warm-700);
  font-weight: 500;
  flex-shrink: 0;
}

.reject-text {
  color: var(--coral);
}

/* ==================== Responsive ==================== */
@media (max-width: 640px) {
  .prescription-form-page {
    padding: 16px;
  }
  .form-section {
    padding: 16px;
  }
}
</style>
