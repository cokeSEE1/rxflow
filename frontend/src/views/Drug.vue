<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { listAllergens } from '@/api/allergens'
import type { Allergen } from '@/api/allergens'
import { listPatients } from '@/api/patients'
import { listPatientAllergies, createPatientAllergy, updatePatientAllergy, deletePatientAllergy } from '@/api/drugs'

// --- Search state ---
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const loading = ref(false)
const filters = reactive({ patientName: '', allergenName: '' })

interface AllergyRecord {
  id: number
  patientId: number
  patientName: string
  allergenId: number
  allergenName: string
  type: string
  severity: string       // 表格显示用（中文）
  rawSeverity: string     // 编辑回填用（英文原始值）
  rawSource: string       // 编辑回填用（英文原始值）
  remark: string
  source: string          // 表格显示用（中文）
  createdAt: string
}

const tableData = ref<AllergyRecord[]>([])

// --- Dropdown data ---
const allergens = ref<Allergen[]>([])
// 搜索表单用（value = name 字符串）
const allergenOptions = ref<{ label: string; value: string }[]>([])
// 弹窗表单用（value = id 数字）
const allergenSelectOptions = ref<{ label: string; value: number }[]>([])
const patients = ref<{ id: number; name: string }[]>([])

// --- Dialog state ---
const dialogVisible = ref(false)
const isEdit = ref(false)
const editingId = ref<number | null>(null)
const submitting = ref(false)
const formRef = ref<FormInstance>()

interface AllergyForm {
  patientId: number | ''
  allergenId: number | ''
  severity: string
  source: string
  remark: string
}

const sourceOptions = [
  { label: '自行来院', value: '自行来院' },
  { label: '其他医院转入', value: '其他医院转入' },
  { label: '网络引流', value: '网络引流' },
]

const defaultForm = (): AllergyForm => ({
  patientId: '',
  allergenId: '',
  severity: '',
  source: '',
  remark: '',
})

const form = reactive<AllergyForm>(defaultForm())

const formRules: FormRules<AllergyForm> = {
  patientId: [{ required: true, message: '请选择患者', trigger: 'change' }],
  allergenId: [{ required: true, message: '请选择过敏源', trigger: 'change' }],
}

// --- Severity map ---
const SEVERITY_MAP: Record<string, string> = {
  severe: '严重',
  moderate: '中等',
  compatible: '轻微',
  'null': '无风险',
}

// --- Source map ---
const SOURCE_MAP: Record<string, string> = {
  自行来院: '自行来院',
  其他医院转入: '其他医院转入',
  网络引流: '网络引流',
  manual: '手动录入',
  migration: '数据迁移',
}

// --- Category map ---
const CATEGORY_MAP: Record<string, string> = {
  antibiotic: '抗生素类',
  antipyretic: '解热镇痛类',
  enzyme: '酶类',
  other: '其他',
}

// --- Search ---
async function handleSearch() {
  loading.value = true
  try {
    const res = await listPatientAllergies({
      patientName: filters.patientName || undefined,
      allergenName: filters.allergenName || undefined,
      page: page.value,
      pageSize: pageSize.value,
    })
    tableData.value = res.data.map((item) => ({
      id: item.id,
      patientId: item.patientId,
      patientName: item.patient.name,
      allergenId: item.allergenId,
      allergenName: item.allergen.name,
      type: CATEGORY_MAP[item.allergen.category] || item.allergen.category,
      severity: SEVERITY_MAP[item.severity] || item.severity,
      rawSeverity: item.severity,
      remark: item.remark,
      source: SOURCE_MAP[item.source] || item.source,
      rawSource: item.source,
      createdAt: item.createdAt,
    }))
    total.value = res.total
  } finally {
    loading.value = false
  }
}

function handleReset() {
  filters.patientName = ''
  filters.allergenName = ''
  page.value = 1
  handleSearch()
}

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleString()
}

function severityType(severity: string): string {
  const map: Record<string, string> = {
    '严重': 'danger',
    '中等': 'warning',
    '轻微': '',
    '无风险': 'info',
  }
  return map[severity] || 'info'
}

function handleEdit(row: AllergyRecord) {
  isEdit.value = true
  editingId.value = row.id
  form.patientId = row.patientId
  form.allergenId = row.allergenId
  form.severity = row.rawSeverity
  form.source = row.rawSource
  form.remark = row.remark
  dialogVisible.value = true
}

async function handleDelete(row: AllergyRecord) {
  try {
    await ElMessageBox.confirm(`确定要删除「${row.patientName}」的「${row.allergenName}」过敏档案吗？`, '删除确认', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await deletePatientAllergy(row.id)
    ElMessage.success('过敏档案已删除')
    handleSearch()
  } catch {
    // user cancelled
  }
}

// --- Dialog handlers ---
function openCreate() {
  isEdit.value = false
  editingId.value = null
  Object.assign(form, defaultForm())
  formRef.value?.resetFields()
  dialogVisible.value = true
}

function handleCancel() {
  dialogVisible.value = false
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    const payload = {
      patientId: form.patientId || undefined,
      allergenId: form.allergenId || undefined,
      severity: form.severity || undefined,
      remark: form.remark || undefined,
      source: form.source || undefined,
    }
    if (isEdit.value && editingId.value != null) {
      await updatePatientAllergy(editingId.value, payload)
      ElMessage.success('过敏档案已更新')
    } else {
      await createPatientAllergy(payload as { patientId: number; allergenId: number; severity?: string; remark?: string; source?: string })
      ElMessage.success('过敏档案已创建')
    }
    dialogVisible.value = false
    handleSearch()
  } catch {
    ElMessage.error('创建失败，请重试')
  } finally {
    submitting.value = false
  }
}

// --- Dropdown data fetch ---
async function fetchDropdownData() {
  try {
    const [allergenRes, patientRes] = await Promise.all([
      listAllergens(),
      listPatients({}),
    ])
    allergens.value = allergenRes.data
    allergenOptions.value = allergenRes.data.map((a) => ({ label: a.name, value: a.name }))
    allergenSelectOptions.value = allergenRes.data.map((a) => ({ label: a.name, value: a.id }))
    patients.value = patientRes.data.map((p: any) => ({ id: p.id, name: p.name }))
  } catch {
    // 静默失败，不影响页面加载
  }
}

// --- Init ---
onMounted(() => {
  handleSearch()
  fetchDropdownData()
})
</script>

<template>
  <div class="drug-page">
    <div class="page-header">
      <h1 class="page-title">过敏档案管理</h1>
      <el-button
        type="primary"
        class="add-btn"
        @click="openCreate"
      >
        新增过敏档案
      </el-button>
    </div>

    <el-card>
      <!-- Search Filters -->
      <el-form
        :inline="true"
        :model="filters"
      >
        <el-form-item label="患者姓名">
          <el-input
            v-model="filters.patientName"
            placeholder="搜索患者姓名"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="过敏源">
          <el-select
            v-model="filters.allergenName"
            placeholder="搜索过敏原名称"
            clearable
            filterable
            style="width: 200px"
          >
            <el-option
              v-for="opt in allergenOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            @click="handleSearch"
          >
            查询
          </el-button>
          <el-button @click="handleReset">
            重置
          </el-button>
        </el-form-item>
      </el-form>

      <!-- Table -->
      <el-table
        v-loading="loading"
        :data="tableData"
        stripe
      >
        <el-table-column
          prop="patientName"
          label="患者"
          width="100"
        />
        <el-table-column
          prop="allergenName"
          label="过敏原"
          width="140"
        />
        <el-table-column
          prop="type"
          label="类型"
          width="100"
        />
        <el-table-column
          label="严重程度"
          width="120"
        >
          <template #default="{ row }">
            <el-tag
              :type="severityType(row.severity)"
              effect="plain"
            >
              {{ row.severity }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="备注"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            {{ row.remark || '-' }}
          </template>
        </el-table-column>
        <el-table-column
          prop="source"
          label="来源"
          width="100"
        />
        <el-table-column
          label="创建时间"
          width="170"
        >
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column
          label="操作"
          width="180"
          fixed="right"
        >
          <template #default="{ row }">
            <el-button
              size="small"
              @click="handleEdit(row)"
            >
              编辑
            </el-button>
            <el-button
              size="small"
              type="danger"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- Empty state -->
      <el-empty
        v-if="!loading && tableData.length === 0"
        description="暂无过敏档案数据"
      />

      <!-- Pagination -->
      <el-pagination
        v-if="total > 0"
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        style="margin-top:16px; justify-content:flex-end"
        @change="handleSearch"
      />
    </el-card>

    <!-- Create Dialog -->
    <el-dialog
      v-model="dialogVisible"
      width="520px"
      :close-on-click-modal="false"
      @closed="handleCancel"
    >
      <template #header>
        <span class="dialog-title">{{ isEdit ? '编辑过敏档案' : '新增过敏档案' }}</span>
      </template>

      <el-divider />

      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="80px"
      >
        <el-form-item
          label="患者"
          prop="patientId"
          :required="true"
        >
          <el-select
            v-model="form.patientId"
            placeholder="请选择患者"
            filterable
            clearable
          >
            <el-option
              v-for="p in patients"
              :key="p.id"
              :label="p.name"
              :value="p.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item
          label="过敏源"
          prop="allergenId"
          :required="true"
        >
          <el-select
            v-model="form.allergenId"
            placeholder="请选择过敏源"
            filterable
            clearable
          >
            <el-option
              v-for="a in allergenSelectOptions"
              :key="a.value"
              :label="a.label"
              :value="a.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="严重程度">
          <el-radio-group v-model="form.severity">
            <el-radio value="severe">
              严重
            </el-radio>
            <el-radio value="moderate">
              中等
            </el-radio>
            <el-radio value="compatible">
              轻微
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="病人来源">
          <el-select
            v-model="form.source"
            placeholder="请选择病人来源"
            clearable
          >
            <el-option
              v-for="s in sourceOptions"
              :key="s.value"
              :label="s.label"
              :value="s.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="form.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>

      <el-divider />

      <template #footer>
        <el-button @click="handleCancel">
          取消
        </el-button>
        <el-button
          type="primary"
          :loading="submitting"
          @click="handleSubmit"
        >
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.drug-page {
  max-width: 1400px;
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.page-title {
  font-family: 'DM Serif Display', serif;
  font-size: 24px;
  font-weight: 500;
  color: var(--warm-900);
  margin: 0;
}

.add-btn {
  background: linear-gradient(180deg, #0d5c56 0%, var(--teal-900) 100%) !important;
  border: none !important;
  color: #fff;
}

.add-btn:hover {
  background: linear-gradient(180deg, #0e655e 0%, #165750 100%) !important;
}

.el-card {
  border-radius: 12px;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--warm-200);
}

/* Table stripe override */
:deep(.el-table__row--striped) {
  background: var(--warm-50);
}

/* Pagination flex */
:deep(.el-pagination) {
  display: flex;
}

/* ====== Dialog styles ====== */
.dialog-title {
  font-family: 'DM Serif Display', serif;
  font-size: 18px;
  font-weight: 500;
  color: var(--warm-900);
}

:deep(.el-dialog) {
  border-radius: 12px;
}

:deep(.el-dialog__header) {
  padding: 20px 24px 0;
}

:deep(.el-dialog__body) {
  padding: 0 24px;
}

:deep(.el-dialog__footer) {
  padding: 16px 24px;
}

/* Form required asterisk — red */
:deep(.el-form-item.is-required .el-form-item__label::before) {
  color: var(--coral) !important;
}

/* Radio checked color — teal matching sidebar */
:deep(.el-radio__input.is-checked .el-radio__inner) {
  background: #0f766e !important;
  border-color: #0f766e !important;
}

:deep(.el-radio__input.is-checked + .el-radio__label) {
  color: #0f766e !important;
}

/* Divider in dialog */
:deep(.el-divider) {
  margin: 16px 0;}
</style>
