<template>
  <div class="page">
    <div class="page-header">
      <h2>处方管理</h2>
      <el-button v-permission="['assistant']" type="primary" @click="$router.push('/prescriptions/new')">
        新建处方
      </el-button>
    </div>

    <el-card>
      <!-- Quick filter tabs -->
      <div class="quick-filters" v-if="quickFilters.length > 0">
        <el-radio-group
          v-model="activeQuickFilter"
          size="small"
          @change="handleQuickFilter"
        >
          <el-radio-button
            v-for="qf in quickFilters"
            :key="qf.label"
            :value="qf.label"
          >{{ qf.label }}</el-radio-button>
        </el-radio-group>
      </div>

      <el-form :inline="true" :model="filters">
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部" clearable @change="handleSearch">
            <el-option label="草稿" value="draft" />
            <el-option label="待审核" value="pending" />
            <el-option label="已驳回" value="rejected" />
            <el-option label="已通过" value="approved" />
            <el-option label="配送中" value="delivering" />
            <el-option label="已签收" value="received" />
            <el-option label="异常退回" value="returned" />
          </el-select>
        </el-form-item>
        <el-form-item label="患者">
          <el-input v-model="filters.patientName" placeholder="患者姓名" clearable />
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            @change="handleDateRangeChange"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- Batch action bar -->
      <div class="batch-bar" v-if="selectedRows.length > 0">
        <span>已选择 {{ selectedRows.length }} 项</span>
        <el-button
          v-permission="['assistant']"
          type="primary"
          size="small"
          @click="handleBatchSubmit"
          :loading="batchSubmitting"
        >批量提交</el-button>
      </div>

      <el-table
        :data="prescriptionStore.list"
        v-loading="prescriptionStore.loading"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column
          v-if="userStore.role === 'assistant'"
          type="selection"
          width="50"
          :selectable="(row: any) => row.status === 'draft'"
        />
        <el-table-column prop="prescriptionNo" label="处方编号" width="180" />
        <el-table-column label="患者" width="120">
          <template #default="{ row }">{{ row.patient?.name }}</template>
        </el-table-column>
        <el-table-column label="电话" width="120">
          <template #default="{ row }">{{ row.patient?.phone }}</template>
        </el-table-column>
        <el-table-column prop="diagnosis" label="诊断" show-overflow-tooltip />
        <el-table-column label="药品数" width="80" align="center">
          <template #default="{ row }">{{ row.items?.length || 0 }}</template>
        </el-table-column>
        <el-table-column label="状态" width="140">
          <template #default="{ row }">
            <StatusTag :status="row.status" />
            <el-tag v-if="row.isResubmit" type="warning" size="small" style="margin-left: 4px">重提</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="等待时间" width="100" align="center">
          <template #default="{ row }">
            <template v-if="hasWaitTime(row)">
              <el-tag :type="waitTimeTag(row)" size="small">{{ waitTimeLabel(row) }}</el-tag>
            </template>
            <template v-else>
              <span class="text-muted">--</span>
            </template>
          </template>
        </el-table-column>
        <el-table-column label="创建人" width="100">
          <template #default="{ row }">{{ row.assistant?.name }}</template>
        </el-table-column>
        <el-table-column label="创建时间" width="160">
          <template #default="{ row }">{{ new Date(row.createdAt).toLocaleString() }}</template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="$router.push(`/prescriptions/${row.id}`)">详情</el-button>
            <el-button v-if="row.status === 'draft'" size="small" type="warning" @click="handleSubmit(row.id)">提交</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="page" v-model:page-size="pageSize"
        :total="prescriptionStore.total" :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next" @change="handleSearch"
        style="margin-top:16px; justify-content:flex-end"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { usePrescriptionStore } from '@/stores/prescription'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import StatusTag from '@/components/StatusTag.vue'

const prescriptionStore = usePrescriptionStore()
const userStore = useUserStore()
const page = ref(1)
const pageSize = ref(20)
const filters = reactive<{ status: string; patientName: string; dateFrom: string; dateTo: string }>({
  status: '',
  patientName: '',
  dateFrom: '',
  dateTo: '',
})

const dateRange = ref<string[] | null>(null)
const selectedRows = ref<any[]>([])
const batchSubmitting = ref(false)
const activeQuickFilter = ref('')

// Role-based quick filters
const quickFilters = computed(() => {
  const role = userStore.role
  if (role === 'assistant') {
    return [
      { label: '全部', status: '' },
      { label: '我的草稿', status: 'draft' },
      { label: '已提交', status: '__not_draft' },
    ]
  }
  if (role === 'doctor') {
    return [
      { label: '全部', status: '' },
      { label: '待审核', status: 'pending' },
      { label: '已审核', status: '__reviewed' },
    ]
  }
  if (role === 'courier') {
    return [
      { label: '全部', status: '' },
      { label: '待取件', status: 'approved' },
      { label: '配送中', status: 'delivering' },
      { label: '已签收', status: 'received' },
    ]
  }
  return []
})

function handleQuickFilter(label: string) {
  const qf = quickFilters.value.find(q => q.label === label)
  if (!qf) return

  // Single-status filters pass through directly; compound filters
  // (__not_draft, __reviewed) use an empty status to list all
  const singleStatus = ['draft', 'pending', 'approved', 'delivering', 'received']
  filters.status = singleStatus.includes(qf.status) ? qf.status : ''

  page.value = 1
  handleSearch()
}

function handleDateRangeChange(val: string[] | null) {
  if (val && val.length === 2) {
    filters.dateFrom = val[0]
    filters.dateTo = val[1]
  } else {
    filters.dateFrom = ''
    filters.dateTo = ''
  }
  handleSearch()
}

async function handleSearch() {
  await prescriptionStore.fetchList({
    page: page.value,
    pageSize: pageSize.value,
    status: filters.status,
    patientName: filters.patientName,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
  })
}

function handleReset() {
  filters.status = ''
  filters.patientName = ''
  filters.dateFrom = ''
  filters.dateTo = ''
  dateRange.value = null
  activeQuickFilter.value = quickFilters.value[0]?.label || ''
  handleSearch()
}

async function handleSubmit(id: number) {
  await prescriptionStore.submit(id)
  ElMessage.success('已提交审核')
  handleSearch()
}

// Batch operations
function handleSelectionChange(rows: any[]) {
  selectedRows.value = rows
}

async function handleBatchSubmit() {
  const draftRows = selectedRows.value.filter(r => r.status === 'draft')
  if (draftRows.length === 0) {
    ElMessage.warning('请选择草稿状态的处方')
    return
  }
  batchSubmitting.value = true
  try {
    let successCount = 0
    let failCount = 0
    for (const row of draftRows) {
      try {
        await prescriptionStore.submit(row.id)
        successCount++
      } catch {
        failCount++
      }
    }
    if (failCount > 0) {
      ElMessage.warning(`成功提交 ${successCount} 条，失败 ${failCount} 条`)
    } else {
      ElMessage.success(`已成功提交 ${successCount} 条处方`)
    }
    selectedRows.value = []
    handleSearch()
  } finally {
    batchSubmitting.value = false
  }
}

// Wait time helpers
function hasWaitTime(row: any): boolean {
  return (row.status === 'pending' || row.status === 'rejected') && !!row.submittedAt
}

function getWaitHours(row: any): number {
  if (!row.submittedAt) return 0
  const diff = Date.now() - new Date(row.submittedAt).getTime()
  return Math.floor(diff / (1000 * 60 * 60))
}

function waitTimeLabel(row: any): string {
  const hours = getWaitHours(row)
  if (hours < 1) return '刚刚'
  if (hours < 24) return `${hours}小时`
  const days = Math.floor(hours / 24)
  return `${days}天`
}

function waitTimeTag(row: any): string {
  const hours = getWaitHours(row)
  if (hours > 48) return 'danger'
  if (hours > 24) return 'warning'
  return 'info'
}

onMounted(() => {
  activeQuickFilter.value = quickFilters.value[0]?.label || ''
  handleSearch()
})
</script>

<style scoped>
.page { max-width: 1400px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }

.quick-filters { margin-bottom: 16px; }

.batch-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  margin-bottom: 12px;
  background: var(--teal-50, #f0fdfa);
  border: 1px solid var(--teal-200, #99f6e4);
  border-radius: 6px;
  font-size: 14px;
  color: var(--warm-700, #44403c);
}

.text-muted { color: var(--warm-400, #a8a29e); font-size: 13px; }
</style>
