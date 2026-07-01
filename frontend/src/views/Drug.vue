<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as echarts from 'echarts'
import type { FormInstance, FormRules } from 'element-plus'
import { listAllergens, createAllergen, updateAllergen, deleteAllergen } from '@/api/allergens'
import type { Allergen } from '@/api/allergens'
import { listPatients } from '@/api/patients'
import { listPatientAllergies, createPatientAllergy, updatePatientAllergy, deletePatientAllergy, setPatientAllergyPin, updatePatientAllergySortOrders, uploadAllergyImage } from '@/api/drugs'

// --- Sub tab ---
const activeSubTab = ref('list')

// --- Search state ---
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const loading = ref(false)
const filters = reactive({ patientName: '', allergenName: '', severity: '' })

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
  pinned: boolean
  imageUrl: string
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
const fileInputRef = ref<HTMLInputElement>()
const imagePreviewUrl = ref<string>('')
const imageFile = ref<File | null>(null)

function handleImageSelect(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  imageFile.value = file
  imagePreviewUrl.value = URL.createObjectURL(file)
  input.value = ''
}

function handleImageRemove() {
  imageFile.value = null
  imagePreviewUrl.value = ''
}

function resetImage() {
  if (imagePreviewUrl.value) {
    URL.revokeObjectURL(imagePreviewUrl.value)
  }
  imageFile.value = null
  imagePreviewUrl.value = ''
}

const formRules: FormRules<AllergyForm> = {
  patientId: [{ required: true, message: '请选择患者', trigger: 'change' }],
  allergenId: [{ required: true, message: '请选择过敏源', trigger: 'change' }],
}

// --- Allergen dialog ---
const allergenDialogVisible = ref(false)
const isAllergenEdit = ref(false)
const allergenEditingId = ref<number | null>(null)
const allergenSubmitting = ref(false)
const allergenFormRef = ref<FormInstance>()

interface AllergenForm {
  name: string
  category: string
  description: string
}

const defaultAllergenForm = (): AllergenForm => ({
  name: '',
  category: '',
  description: '',
})

const allergenForm = reactive<AllergenForm>(defaultAllergenForm())

const allergenFormRules: FormRules<AllergenForm> = {
  name: [{ required: true, message: '请输入过敏原名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
}

function openAllergenCreate() {
  isAllergenEdit.value = false
  allergenEditingId.value = null
  Object.assign(allergenForm, defaultAllergenForm())
  allergenFormRef.value?.resetFields()
  allergenDialogVisible.value = true
}

function handleAllergenEdit(row: Allergen) {
  isAllergenEdit.value = true
  allergenEditingId.value = row.id
  allergenForm.name = row.name
  allergenForm.category = row.category
  allergenForm.description = row.description || ''
  allergenDialogVisible.value = true
}

async function handleAllergenDelete(row: Allergen) {
  try {
    await ElMessageBox.confirm(`确定要删除过敏原「${row.name}」吗？`, '删除确认', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await deleteAllergen(row.id)
    ElMessage.success('过敏原已删除')
    fetchDropdownData()
  } catch {
    // user cancelled
  }
}

async function handleAllergenSubmit() {
  const valid = await allergenFormRef.value?.validate().catch(() => false)
  if (!valid) return

  allergenSubmitting.value = true
  try {
    if (isAllergenEdit.value && allergenEditingId.value != null) {
      await updateAllergen(allergenEditingId.value, {
        name: allergenForm.name,
        category: allergenForm.category,
        description: allergenForm.description || undefined,
      })
      ElMessage.success('过敏原已更新')
    } else {
      await createAllergen({
        name: allergenForm.name,
        category: allergenForm.category,
        description: allergenForm.description || undefined,
      })
      ElMessage.success('过敏原已创建')
    }
    allergenDialogVisible.value = false
    fetchDropdownData()
  } catch {
    ElMessage.error('操作失败，请重试')
  } finally {
    allergenSubmitting.value = false
  }
}

function handleAllergenCancel() {
  allergenDialogVisible.value = false
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

const dictFilter = ref('all')
const dictPage = ref(1)
const dictPageSize = ref(10)

const filteredAllergens = computed(() =>
  dictFilter.value === 'all'
    ? allergens.value
    : allergens.value.filter((a) => a.category === dictFilter.value),
)

const pagedAllergens = computed(() => {
  const start = (dictPage.value - 1) * dictPageSize.value
  return filteredAllergens.value.slice(start, start + dictPageSize.value)
})

function onDictFilterChange() {
  dictPage.value = 1
}

const CATEGORY_TAG_TYPES: Record<string, string> = {
  antibiotic: 'danger',
  antipyretic: 'warning',
  enzyme: '',
  other: 'info',
}

function categoryTagType(cat: string): string {
  return CATEGORY_TAG_TYPES[cat] || 'info'
}

const severeCount = computed(() => tableData.value.filter((i) => i.rawSeverity === 'severe').length)
const moderateCount = computed(() => tableData.value.filter((i) => i.rawSeverity === 'moderate').length)
const compatibleCount = computed(() => tableData.value.filter((i) => i.rawSeverity === 'compatible').length)

// --- ECharts 柱形图 ---
const chartRef = ref<HTMLDivElement>()
let chartInstance: echarts.ECharts | null = null

const chartData = computed(() => {
  const names = ['青霉素', '阿司匹林', '乳胶', '布洛芬', '对乙酰氨基酚']
  return names.map((name) => ({
    name,
    value: tableData.value.filter((i) => i.allergenName === name).length,
  }))
})

function initChart() {
  if (!chartRef.value) return
  if (chartInstance) chartInstance.dispose()
  chartInstance = echarts.init(chartRef.value)
  const data = chartData.value
  chartInstance.setOption({
    dataset: [{
      source: data.map((d) => [d.name, d.value]),
    }, {
      transform: { type: 'sort', config: { dimension: 1, order: 'desc' } },
    }],
    xAxis: { type: 'value', axisLabel: { show: false }, splitLine: { show: false } },
    yAxis: {
      type: 'category',
      axisLabel: { fontSize: 12, color: '#78716c' },
      axisLine: { show: false },
      axisTick: { show: false },
      inverse: true,
    },
    series: {
      type: 'bar',
      datasetIndex: 1,
      barWidth: 16,
      itemStyle: {
        borderRadius: [0, 4, 4, 0],
        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: '#0f766e' },
          { offset: 1, color: '#2dd4bf' },
        ]),
      },
      label: { show: false },
    },
    dataZoom: [{ type: 'inside', yAxisIndex: 0, minSpan: 5, maxSpan: 5 }],
    grid: { left: 80, right: 40, top: 4, bottom: 4 },
  })
}

watch(activeSubTab, (tab) => {
  if (tab === 'stats') nextTick(() => initChart())
})

onMounted(() => {
  if (activeSubTab.value === 'stats') nextTick(() => initChart())
})

// --- Search ---
async function handleSearch() {
  loading.value = true
  try {
    const res = await listPatientAllergies({
      patientName: filters.patientName || undefined,
      allergenName: filters.allergenName || undefined,
      severity: filters.severity || undefined,
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
      pinned: item.pinned || false,
      imageUrl: item.images?.[0]?.url || '',
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

// --- Pinned sort state ---
const MAX_PIN = 10
const sortSaving = ref(false)
const sortList = ref<AllergyRecord[]>([])

const pinnedCount = computed(() => tableData.value.filter((i) => i.pinned).length)

function syncSortList() {
  sortList.value = tableData.value
    .filter((i) => i.pinned)
    .map((i) => ({ ...i }))
}

// Drag state
const dragIdx = ref<number | null>(null)

function onSortDragStart(idx: number) {
  dragIdx.value = idx
}

function onSortDragOver(e: Event, idx: number) {
  e.preventDefault()
  if (dragIdx.value === null || dragIdx.value === idx) return
  ;(e.currentTarget as HTMLElement).classList.add('drag-over')
}

function onSortDragLeave(e: Event) {
  ;(e.currentTarget as HTMLElement).classList.remove('drag-over')
}

function onSortDrop(e: Event, toIdx: number) {
  e.preventDefault()
  ;(e.currentTarget as HTMLElement).classList.remove('drag-over')
  if (dragIdx.value === null || dragIdx.value === toIdx) return
  const list = [...sortList.value]
  const [moved] = list.splice(dragIdx.value, 1)
  list.splice(toIdx, 0, moved)
  sortList.value = list
  dragIdx.value = null
}

function onSortDragEnd() {
  dragIdx.value = null
  document.querySelectorAll('.drag-over').forEach((el) => el.classList.remove('drag-over'))
}

async function handleUnpin(item: AllergyRecord) {
  try {
    await setPatientAllergyPin(item.id, false)
    item.pinned = false
    sortList.value = sortList.value.filter((i) => i.id !== item.id)
    ElMessage.success('已取消置顶')
  } catch {
    ElMessage.error('操作失败')
  }
}

async function handleSaveSort() {
  sortSaving.value = true
  try {
    const orders = sortList.value.map((item, idx) => ({ id: item.id, sortOrder: idx + 1 }))
    await updatePatientAllergySortOrders(orders)
    ElMessage.success('排序已保存')
    handleSearch()
  } catch {
    ElMessage.error('保存排序失败')
  } finally {
    sortSaving.value = false
  }
}

function handleClickPinned() {
  syncSortList()
  activeSubTab.value = 'sort'
}

function handleSubTabChange() {
  if (activeSubTab.value === 'sort') {
    syncSortList()
  }
}

async function togglePin(row: AllergyRecord) {
  const newPinned = !row.pinned
  try {
    await setPatientAllergyPin(row.id, newPinned)
    row.pinned = newPinned
    ElMessage.success(newPinned ? '已置顶' : '已取消置顶')
  } catch {
    // revert on error
  }
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
  resetImage()
  if (row.imageUrl) {
    imagePreviewUrl.value = row.imageUrl
  }
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
  resetImage()
  dialogVisible.value = true
}

function handleCancel() {
  dialogVisible.value = false
  resetImage()
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    const payload: any = {
      patientId: form.patientId || undefined,
      allergenId: form.allergenId || undefined,
      severity: form.severity || undefined,
      remark: form.remark || undefined,
      source: form.source || undefined,
    }

    // 上传图片
    if (imageFile.value) {
      const uploadRes = await uploadAllergyImage(imageFile.value)
      if (uploadRes.url) {
        payload.images = [{ name: uploadRes.filename || imageFile.value.name, url: uploadRes.url }]
      }
    }

    if (isEdit.value && editingId.value != null) {
      await updatePatientAllergy(editingId.value, payload)
      ElMessage.success('过敏档案已更新')
    } else {
      await createPatientAllergy(payload)
      ElMessage.success('过敏档案已创建')
    }
    dialogVisible.value = false
    resetImage()
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
        v-if="activeSubTab !== 'dict'"
        type="primary"
        class="add-btn"
        @click="openCreate"
      >
        新增过敏档案
      </el-button>
      <el-button
        v-else
        type="primary"
        class="add-btn"
        @click="openAllergenCreate"
      >
        新增过敏原
      </el-button>
    </div>

    <div class="sub-nav-bar">
      <el-radio-group
        v-model="activeSubTab"
        size="small"
        @change="handleSubTabChange"
      >
        <el-radio-button value="list">
          过敏档案列表
        </el-radio-button>
        <el-radio-button value="dict">
          过敏原字典
        </el-radio-button>
        <el-radio-button value="stats">
          统计概念
        </el-radio-button>
        <el-radio-button value="sort">
          置顶排序
        </el-radio-button>
      </el-radio-group>
    </div>

    <el-card v-if="activeSubTab === 'list'">
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
        <el-form-item label="严重程度">
          <el-select
            v-model="filters.severity"
            placeholder="全部"
            clearable
            style="width: 110px"
            @change="handleSearch"
          >
            <el-option label="严重" value="severe" />
            <el-option label="中等" value="moderate" />
            <el-option label="轻微" value="compatible" />
            <el-option label="无风险" value="null" />
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
          <el-button
            class="pinned-btn"
            @click="handleClickPinned"
          >
            ⭐ {{ pinnedCount }}条置顶
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
          width="80"
        />
        <el-table-column
          prop="allergenName"
          label="过敏原"
          width="110"
        />
        <el-table-column
          prop="type"
          label="类型"
          width="75"
        />
        <el-table-column
          label="严重程度"
          width="85"
        >
          <template #default="{ row }">
            <el-tag
              :type="severityType(row.severity)"
              effect="plain"
              size="small"
            >
              {{ row.severity }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="备注"
          min-width="100"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            {{ row.remark || '-' }}
          </template>
        </el-table-column>
        <el-table-column
          label="图片"
          width="55"
          align="center"
        >
          <template #default="{ row }">
            <el-image
              v-if="row.imageUrl"
              :src="row.imageUrl"
              fit="cover"
              style="width: 32px; height: 32px; border-radius: 4px"
              preview-teleported
            />
            <span v-else class="no-image">—</span>
          </template>
        </el-table-column>
        <el-table-column
          prop="source"
          label="来源"
          width="60"
        />
        <el-table-column
          label="创建时间"
          width="145"
        >
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column
          label="置顶"
          width="50"
          align="center"
        >
          <template #default="{ row }">
            <span
              class="pin-star"
              :class="{ pinned: row.pinned }"
              @click="togglePin(row)"
            >
              ★
            </span>
          </template>
        </el-table-column>
        <el-table-column
          label="操作"
          width="140"
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
        layout="total, sizes, prev, next"
        style="margin-top:16px; justify-content:flex-end"
        @change="handleSearch"
      />
    </el-card>

    <!-- Allergen Dictionary Sub-page -->
    <div
      v-if="activeSubTab === 'dict'"
      class="dict-layout"
    >
      <el-card class="dict-main">
        <div class="dict-header">
          <el-radio-group
            v-model="dictFilter"
            size="small"
            @change="onDictFilterChange"
          >
            <el-radio-button value="all">
              全部
            </el-radio-button>
            <el-radio-button value="antibiotic">
              抗生素类
            </el-radio-button>
            <el-radio-button value="antipyretic">
              解热镇痛类
            </el-radio-button>
            <el-radio-button value="enzyme">
              酶类
            </el-radio-button>
            <el-radio-button value="other">
              其他
            </el-radio-button>
          </el-radio-group>
        </div>
        <el-table
          :data="pagedAllergens"
          stripe
          max-height="520"
        >
          <el-table-column
            prop="name"
            label="过敏原名称"
            width="180"
          />
          <el-table-column
            label="分类"
            width="130"
          >
            <template #default="{ row }">
              <el-tag
                size="small"
                effect="plain"
                :type="categoryTagType(row.category)"
              >
                {{ CATEGORY_MAP[row.category] || row.category }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            prop="description"
            label="描述"
            show-overflow-tooltip
          />
          <el-table-column
            label="创建时间"
            width="160"
          >
            <template #default="{ row }">
              {{ formatDate(row.createdAt) }}
            </template>
          </el-table-column>
          <el-table-column
            label="操作"
            width="120"
          >
            <template #default="{ row }">
              <el-button
                class="dict-edit-btn"
                size="small"
                link
                @click="handleAllergenEdit(row)"
              >
                编辑
              </el-button>
              <el-button
                class="dict-del-btn"
                size="small"
                link
                @click="handleAllergenDelete(row)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <el-pagination
          v-model:current-page="dictPage"
          v-model:page-size="dictPageSize"
          :total="filteredAllergens.length"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, next"
          size="small"
          style="margin-top:16px; justify-content:flex-end"
        />
      </el-card>
    </div>

    <!-- Stats Sub-page -->
    <el-card v-if="activeSubTab === 'stats'">
      <div class="stats-title-row">
      </div>
      <div class="stats-row">
        <div class="stats-item severe">
          <div class="stats-item-value">{{ severeCount }}</div>
          <div class="stats-item-label">重度过敏</div>
        </div>
        <div class="stats-item moderate">
          <div class="stats-item-value">{{ moderateCount }}</div>
          <div class="stats-item-label">中度过敏</div>
        </div>
        <div class="stats-item compatible">
          <div class="stats-item-value">{{ compatibleCount }}</div>
          <div class="stats-item-label">轻度过敏</div>
        </div>
        <div class="stats-item total">
          <div class="stats-item-value">{{ total }}</div>
          <div class="stats-item-label">总档案数</div>
        </div>
      </div>
      <div class="stats-chart-row">
        <div class="stats-chart-box">
          <div class="stats-chart-title">过敏原分布TOP5</div>
          <div class="stats-chart-divider" />
          <div
            ref="chartRef"
            class="stats-chart"
          />
        </div>
      </div>
    </el-card>

    <!-- Pinned Sort Sub-page -->
    <el-card v-if="activeSubTab === 'sort'">
      <div class="sort-box">
        <div class="sort-box-header">
          <span class="sort-box-label">已置顶 <strong>{{ sortList.length }}</strong>/{{ MAX_PIN }}条，拖拽调整排序</span>
        </div>

        <div class="sort-box-body">
          <TransitionGroup
            v-if="sortList.length > 0"
            name="sort-row-anim"
            tag="div"
            class="sort-rows"
          >
            <div
              v-for="(item, idx) in sortList"
              :key="item.id"
              class="sort-row"
              :class="{ 'dragging': dragIdx === idx }"
              draggable="true"
              @dragstart="onSortDragStart(idx)"
              @dragover="onSortDragOver($event, idx)"
              @dragleave="onSortDragLeave($event)"
              @drop="onSortDrop($event, idx)"
              @dragend="onSortDragEnd"
            >
              <span class="sort-handle" title="拖拽排序">⋮⋮</span>
              <span class="sort-num">{{ idx + 1 }}</span>
              <span class="sort-name">{{ item.patientName }}</span>
              <span class="sort-allergen">{{ item.allergenName }}</span>
              <el-tag
                size="small"
                effect="plain"
                :type="severityType(item.severity)"
              >
                {{ item.severity }}
              </el-tag>
              <span class="sort-remark">{{ item.remark || '-' }}</span>
              <button
                class="sort-unpin"
                title="取消置顶"
                @click="handleUnpin(item)"
              >
                ✕
              </button>
            </div>
          </TransitionGroup>

          <div v-else class="sort-empty">
            <span class="sort-empty-icon">⭐</span>
            <span>暂无置顶档案，在列表中点击 ★ 即可置顶</span>
          </div>
        </div>
      </div>

      <div class="sort-actions">
        <el-button @click="activeSubTab = 'list'">
          返回列表
        </el-button>
        <el-button
          type="primary"
          :loading="sortSaving"
          :disabled="sortList.length === 0"
          @click="handleSaveSort"
        >
          保存排序
        </el-button>
      </div>
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
        <el-form-item label="过敏图片">
          <div class="image-upload-area">
            <input
              ref="fileInputRef"
              type="file"
              accept="image/*"
              hidden
              @change="handleImageSelect"
            >
            <div
              v-if="!imagePreviewUrl"
              class="upload-box"
              @click="fileInputRef?.click()"
            >
              <span class="upload-plus">+</span>
            </div>
            <div
              v-else
              class="preview-box"
            >
              <img
                :src="imagePreviewUrl"
                alt="预览"
                class="preview-img"
              >
              <div
                class="preview-mask"
                @click="handleImageRemove"
              >
                <span>删除</span>
              </div>
            </div>
          </div>
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

    <!-- Allergen Dialog -->
    <el-dialog
      v-model="allergenDialogVisible"
      width="480px"
      :close-on-click-modal="false"
      @closed="handleAllergenCancel"
    >
      <template #header>
        <span class="dialog-title">{{ isAllergenEdit ? '编辑过敏原' : '新增过敏原' }}</span>
      </template>

      <el-divider />

      <el-form
        ref="allergenFormRef"
        :model="allergenForm"
        :rules="allergenFormRules"
        label-width="60px"
      >
        <el-form-item
          label="名称"
          prop="name"
          :required="true"
        >
          <el-input
            v-model="allergenForm.name"
            placeholder="如：青霉素"
          />
        </el-form-item>
        <el-form-item
          label="分类"
          prop="category"
          :required="true"
        >
          <el-select
            v-model="allergenForm.category"
            placeholder="请选择"
          >
            <el-option label="抗生素类" value="antibiotic" />
            <el-option label="解热镇痛类" value="antipyretic" />
            <el-option label="酶类" value="enzyme" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="说明">
          <el-input
            v-model="allergenForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入说明"
          />
        </el-form-item>
      </el-form>

      <el-divider />

      <template #footer>
        <el-button @click="handleAllergenCancel">
          取消
        </el-button>
        <el-button
          type="primary"
          :loading="allergenSubmitting"
          @click="handleAllergenSubmit"
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
  overflow: hidden;
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
  margin: 16px 0;
}

.sub-nav-bar {
  margin-bottom: 16px;
}

.pinned-btn {
  background: #fefce8 !important;
  border: 1.5px solid #facc15 !important;
  color: #a16207 !important;
  border-radius: 20px !important;
  font-weight: 600 !important;
  padding: 5px 16px !important;
  box-shadow: 0 2px 6px rgba(250, 204, 21, 0.25) !important;
  transition: all 0.2s ease !important;
}

.pinned-btn:hover {
  background: #fef08a !important;
  border-color: #eab308 !important;
  box-shadow: 0 4px 12px rgba(250, 204, 21, 0.4) !important;
  transform: translateY(-1px);
}

.pin-star {
  font-size: 20px;
  color: #d4d4d8;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.pin-star:hover {
  color: #facc15;
  transform: scale(1.2);
}

.pin-star.pinned {
  color: #facc15;
}

.no-image {
  color: #d4d4d8;
  font-size: 13px;
}

/* ── Sort box ─────────────────────────────────────────────────── */
.sort-box {
  border: 1.5px solid var(--warm-200);
  border-radius: 12px;
  overflow: hidden;
  background: #fafaf9;
}

.sort-box-header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--warm-100);
  background: #fff;
}

.sort-box-label {
  font-size: 13px;
  color: var(--warm-600);
}

.sort-box-label strong {
  color: var(--teal-700);
  font-weight: 700;
}

.sort-box-body {
  padding: 12px;
  min-height: 160px;
  max-height: 420px;
  overflow-y: auto;
}

.sort-rows {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sort-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: #fefce8;
  border: 1.5px solid #facc15;
  border-radius: 10px;
  cursor: grab;
  transition: all 0.15s;
  user-select: none;
}

.sort-row:hover {
  border-color: #eab308;
  box-shadow: 0 2px 8px rgba(250, 204, 21, 0.2);
}

.sort-row.dragging {
  opacity: 0.35;
  transform: scale(0.96);
  border-style: dashed;
}

.sort-row.drag-over {
  border-color: var(--teal-500);
  box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.12);
  background: #f0fdfa;
}

.sort-handle {
  flex-shrink: 0;
  color: #a8a29e;
  font-size: 14px;
  letter-spacing: -2px;
  cursor: grab;
  padding: 2px 4px;
  border-radius: 4px;
  line-height: 1;
}

.sort-handle:active {
  cursor: grabbing;
}

.sort-num {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  background: var(--warm-100);
  color: var(--warm-500);
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.sort-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--warm-900);
  white-space: nowrap;
}

.sort-allergen {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  background: #f2f1ef;
  border-radius: 6px;
  font-size: 12px;
  color: var(--warm-600);
  white-space: nowrap;
  flex-shrink: 0;
}

.sort-remark {
  flex: 1;
  font-size: 12px;
  color: #a8a29e;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.sort-unpin {
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  border: 1px solid transparent;
  background: transparent;
  color: #a8a29e;
  cursor: pointer;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  padding: 0;
  line-height: 1;
}

.sort-unpin:hover {
  background: #fff1f2;
  border-color: #fecaca;
  color: #f43f5e;
}

.sort-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
}

.sort-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 40px 20px;
  color: #a8a29e;
  font-size: 13px;
}

.sort-empty-icon {
  font-size: 32px;
}

/* ── Sort row transition ──────────────────────────────────────── */
.sort-row-anim-enter-active {
  transition: all 0.3s ease-out;
}

.sort-row-anim-leave-active {
  transition: all 0.2s ease-in;
}

.sort-row-anim-enter-from {
  opacity: 0;
  transform: translateY(-6px);
}

.sort-row-anim-leave-to {
  opacity: 0;
  transform: translateX(-12px);
}

.sort-row-anim-move {
  transition: transform 0.25s ease;
}

/* ── Allergen Dictionary Layout ────────────────────────────────── */
.dict-layout {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.dict-main {
  flex: 1;
  min-width: 0;
}

.dict-header {
  margin-bottom: 16px;
}

.dict-title {
  font-family: 'DM Serif Display', serif;
  font-size: 17px;
  font-weight: 500;
  color: var(--warm-900);
  margin: 0;
}

.dict-edit-btn {
  color: #16a34a !important;
}

.dict-edit-btn:hover {
  color: #15803d !important;
}

.dict-del-btn {
  color: #ef4444 !important;
}

.dict-del-btn:hover {
  color: #dc2626 !important;
}

/* ── Stats Sub-page ────────────────────────────────────────────── */
.stats-title-row {
  margin-bottom: 20px;
}

.stats-row {
  display: flex;
  gap: 20px;
}

.stats-item {
  flex: 1;
  text-align: left;
  padding: 24px 16px;
  border-radius: 14px;
  border: 1.5px solid #d6d3d1;
  background: #fff;
}

.stats-item-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.stats-item-value {
  font-family: 'DM Serif Display', serif;
  font-size: 28px;
  font-weight: 700;
  color: var(--warm-900);
  line-height: 1.2;
}

.stats-item.severe .stats-item-value {
  color: #ef4444;
}

.stats-item.moderate .stats-item-value {
  color: #f97316;
}

.stats-item.compatible .stats-item-value {
  color: #3b82f6;
}

.stats-item.total .stats-item-value {
  color: #16a34a;
}

.stats-item-label {
  font-size: 13px;
  color: #a8a29e;
  margin-top: 4px;
}

.stats-chart-row {
  margin-top: 20px;
}

.stats-chart-box {
  width: 50%;
  border: 1.5px solid #d6d3d1;
  border-radius: 14px;
  background: #fff;
  overflow: hidden;
}

.stats-chart-title {
  font-family: 'DM Serif Display', serif;
  font-size: 15px;
  font-weight: 500;
  color: var(--warm-900);
  padding: 14px 16px 0;
}

.stats-chart-divider {
  height: 1px;
  background: var(--warm-100);
  margin: 10px 16px 0;
}

.stats-chart {
  width: 100%;
  height: 160px;
}

/* ── Image upload ──────────────────────────────────────────────── */
.image-upload-area {
  width: 100%;
}

.upload-box {
  width: 100px;
  height: 100px;
  border: 2px dashed var(--warm-200);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color 0.2s;
}

.upload-box:hover {
  border-color: #0f766e;
}

.upload-plus {
  font-size: 32px;
  color: var(--warm-400);
  font-weight: 300;
  line-height: 1;
}

.upload-box:hover .upload-plus {
  color: #0f766e;
}

.preview-box {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 8px;
  overflow: hidden;
}

.preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 13px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
}

.preview-box:hover .preview-mask {
  opacity: 1;
}
</style>
