<template>
  <div class="prescription-form-page">
    <h1 class="page-title">{{ isEdit ? '编辑处方' : '新建处方' }}</h1>

    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-position="top"
      class="prescription-form"
      @submit.prevent
    >
      <!-- ==================== Section 1: Patient Selector ==================== -->
      <div class="form-section">
        <div class="section-header">
          <h2 class="section-title">患者信息</h2>
          <el-button type="primary" plain size="small" @click="openPatientDrawer">
            新增患者
          </el-button>
        </div>

        <el-form-item label="选择患者" prop="patientId">
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
        <div v-if="selectedPatient" class="patient-card">
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
          <h2 class="section-title">诊断信息</h2>
          <div class="section-actions">
            <el-dropdown trigger="click" @command="loadTemplate">
              <el-button type="default" size="small">
                加载模板
                <el-icon class="el-icon--right"><ArrowDown /></el-icon>
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
            <el-button type="default" size="small" @click="openSaveTemplateDialog">
              保存为模板
            </el-button>
          </div>
        </div>

        <el-form-item label="诊断描述" prop="diagnosis">
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
          <h2 class="section-title">药品明细</h2>
          <el-button
            type="primary"
            plain
            size="small"
            :disabled="form.items.length >= MAX_ITEMS"
            @click="addDrugItem"
          >
            添加药品
          </el-button>
        </div>

        <div v-if="form.items.length === 0" class="empty-items">
          <p>尚未添加药品，请点击"添加药品"开始</p>
        </div>

        <div
          v-for="(item, index) in form.items"
          :key="item._key"
          class="drug-item-row"
        >
          <div class="drug-item-header">
            <span class="drug-item-index">药品 {{ index + 1 }}</span>
            <el-button
              v-if="form.items.length > MIN_ITEMS"
              type="danger"
              link
              size="small"
              @click="removeDrugItem(index)"
            >
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </div>

          <div class="drug-item-fields">
            <div class="field-group">
              <label class="field-label required">药品名称</label>
              <el-input
                v-model="item.drugName"
                placeholder="如：阿莫西林胶囊"
              />
              <span v-if="itemErrors[index]?.drugName" class="field-error">
                {{ itemErrors[index].drugName }}
              </span>
            </div>

            <div class="field-group">
              <label class="field-label">规格</label>
              <el-input
                v-model="item.specification"
                placeholder="如：0.5g x 24粒"
              />
            </div>

            <div class="field-group">
              <label class="field-label required">用量</label>
              <el-input
                v-model="item.dosage"
                placeholder="如：0.5g"
              />
              <span v-if="itemErrors[index]?.dosage" class="field-error">
                {{ itemErrors[index].dosage }}
              </span>
            </div>

            <div class="field-group">
              <label class="field-label">频次</label>
              <el-select v-model="item.frequency" placeholder="选择频次">
                <el-option label="每日一次 (qd)" value="qd" />
                <el-option label="每日两次 (bid)" value="bid" />
                <el-option label="每日三次 (tid)" value="tid" />
                <el-option label="每晚一次 (qn)" value="qn" />
              </el-select>
            </div>

            <div class="field-group">
              <label class="field-label required">天数</label>
              <el-input-number
                v-model="item.days"
                :min="1"
                :max="90"
                :step="1"
                controls-position="right"
              />
              <span v-if="itemErrors[index]?.days" class="field-error">
                {{ itemErrors[index].days }}
              </span>
            </div>

            <div class="field-group field-group-remark">
              <label class="field-label">备注</label>
              <el-input
                v-model="item.remark"
                placeholder="用药说明..."
              />
            </div>
          </div>
        </div>
      </div>

      <!-- ==================== Section 4: Note ==================== -->
      <div class="form-section">
        <h2 class="section-title">备注</h2>
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
    <el-drawer
      v-model="showPatientDrawer"
      title="新增患者"
      direction="rtl"
      size="480px"
    >
      <el-form
        ref="patientFormRef"
        :model="patientForm"
        :rules="patientRules"
        label-position="top"
      >
        <el-form-item label="姓名" prop="name">
          <el-input v-model="patientForm.name" placeholder="请输入患者姓名" />
        </el-form-item>

        <el-form-item label="性别" prop="gender">
          <el-select v-model="patientForm.gender" placeholder="请选择性别">
            <el-option label="男" value="male" />
            <el-option label="女" value="female" />
          </el-select>
        </el-form-item>

        <el-form-item label="年龄" prop="age">
          <el-input-number v-model="patientForm.age" :min="0" :max="150" />
        </el-form-item>

        <el-form-item label="手机号" prop="phone">
          <el-input v-model="patientForm.phone" placeholder="请输入手机号" />
        </el-form-item>

        <el-form-item label="地址">
          <el-input v-model="patientForm.address" placeholder="请输入地址" />
        </el-form-item>

        <el-form-item label="身份证号">
          <el-input v-model="patientForm.idCard" placeholder="请输入身份证号" />
        </el-form-item>

        <el-form-item label="过敏史">
          <el-input
            v-model="patientForm.allergyHistory"
            type="textarea"
            :rows="2"
            placeholder="如无过敏史请留空"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showPatientDrawer = false">取消</el-button>
        <el-button
          type="primary"
          :loading="creatingPatient"
          @click="handleCreatePatient"
        >
          确认创建
        </el-button>
      </template>
    </el-drawer>

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
        <el-button @click="showSaveTemplateDialog = false">取消</el-button>
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
import { ArrowDown, Delete } from '@element-plus/icons-vue'
import { usePrescriptionStore } from '@/stores/prescription'
import { usePatientStore } from '@/stores/patient'
import { getTemplates, saveTemplate } from '@/api/prescriptions'
import { useDraft } from '@/composables/useDraft'
import type { FormInstance, FormRules } from 'element-plus'

// ==================== Constants ====================
const MIN_ITEMS = 1
const MAX_ITEMS = 20
const DRAFT_KEY = 'prescription_form'

// ==================== Route & Stores ====================
const route = useRoute()
const router = useRouter()
const isEdit = computed(() => route.name === 'PrescriptionEdit')

const prescriptionStore = usePrescriptionStore()
const patientStore = usePatientStore()

// ==================== Draft ====================
const { draft, startAutoSave, stopAutoSave, clearDraft } = useDraft(DRAFT_KEY)

// ==================== Types ====================
interface DrugItem {
  _key: string
  drugName: string
  specification: string
  dosage: string
  frequency: string
  days: number
  remark: string
}

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
const selectedPatient = ref<any>(null)

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
  const found = patientStore.list.find((p: any) => p.id === patientId)
  selectedPatient.value = found || null
}

// ==================== Drug Items ====================
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
const templates = ref<any[]>([])
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

function loadTemplate(template: any) {
  form.diagnosis = template.diagnosis || ''
  if (template.items && template.items.length > 0) {
    form.items = template.items.map((item: any) => ({
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

// ==================== Patient Creation ====================
const showPatientDrawer = ref(false)
const patientFormRef = ref<FormInstance>()
const creatingPatient = ref(false)

const defaultPatientForm = () => ({
  name: '',
  gender: 'male' as string,
  age: 30,
  phone: '',
  address: '',
  idCard: '',
  allergyHistory: '',
})

const patientForm = reactive({ ...defaultPatientForm() })

const patientRules: FormRules = {
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
  ],
  gender: [
    { required: true, message: '请选择性别', trigger: 'change' },
  ],
  age: [
    { required: true, message: '请输入年龄', trigger: 'blur' },
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' },
  ],
}

function openPatientDrawer() {
  Object.assign(patientForm, defaultPatientForm())
  showPatientDrawer.value = true
}

async function handleCreatePatient() {
  if (!patientFormRef.value) return
  try {
    await patientFormRef.value.validate()
  } catch {
    return
  }

  creatingPatient.value = true
  try {
    const newPatient = await patientStore.create({ ...patientForm })
    ElMessage.success('患者创建成功')
    showPatientDrawer.value = false

    // Auto-select the newly created patient
    form.patientId = newPatient.id
    selectedPatient.value = newPatient

    // Refresh patient list in background
    patientStore.fetchList({ name: newPatient.name })
  } catch {
    ElMessage.error('患者创建失败')
  } finally {
    creatingPatient.value = false
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

  // Validate the static form field
  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  submitting.value = true
  try {
    const payload = buildPayload()
    const result = await prescriptionStore.create(payload)
    await prescriptionStore.submit(result.id)
    clearDraft()
    stopAutoSave()
    ElMessage.success('处方已提交审核')
    router.push('/prescriptions')
  } catch {
    ElMessage.error('处方提交失败')
  } finally {
    submitting.value = false
  }
}

// ==================== Draft Utilities ====================
function ensureItemKeys(items: any[]): DrugItem[] {
  return items.map((item: any) => {
    if (!item._key) {
      return { ...item, _key: `drug_${++itemKeyCounter}` }
    }
    return item
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

async function restoreDraft(draftData: any) {
  form.patientId = draftData.patientId || null
  form.diagnosis = draftData.diagnosis || ''
  form.items = ensureItemKeys(draftData.items || [createEmptyItem()])
  form.note = draftData.note || ''

  // Try to restore patient card
  if (draftData.patientId) {
    const found = patientStore.list.find((p: any) => p.id === draftData.patientId)
    if (found) {
      selectedPatient.value = found
    }
  }
}

// ==================== Lifecycle ====================
onMounted(async () => {
  await fetchTemplates()

  // Check for existing draft
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
      // User chose to discard
      clearDraft()
    }
  }

  // Start auto-save
  startAutoSave(() => getDraftData())
})

onBeforeUnmount(() => {
  stopAutoSave()
})
</script>

<style scoped>
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

.drug-item-row {
  background: var(--warm-50);
  border: 1px solid var(--warm-200);
  border-radius: 10px;
  padding: 16px 20px;
  margin-bottom: 12px;
}

.drug-item-row:last-child {
  margin-bottom: 0;
}

.drug-item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.drug-item-index {
  font-size: 14px;
  font-weight: 600;
  color: var(--teal-700);
}

.drug-item-fields {
  display: grid;
  grid-template-columns: 1.5fr 1fr 0.8fr 1fr 90px 1.2fr;
  gap: 12px;
  align-items: start;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field-group-remark {
  grid-column: 6;
}

.field-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--warm-700);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.field-label.required::after {
  content: ' *';
  color: var(--coral);
}

.field-error {
  font-size: 12px;
  color: var(--coral);
  margin-top: 2px;
}

/* ==================== Action Bar ==================== */
.action-bar {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 24px 0;
}

/* ==================== Responsive ==================== */
@media (max-width: 1024px) {
  .drug-item-fields {
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .field-group-remark {
    grid-column: span 2;
  }
}

@media (max-width: 640px) {
  .prescription-form-page {
    padding: 16px;
  }
  .form-section {
    padding: 16px;
  }
  .drug-item-fields {
    grid-template-columns: 1fr;
  }
  .field-group-remark {
    grid-column: 1;
  }
}
</style>
