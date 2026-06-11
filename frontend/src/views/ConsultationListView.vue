<template>
  <div class="page">
    <div class="page-header">
      <h2>问诊管理</h2>
      <el-button v-permission="['doctor']" type="primary" @click="$router.push('/consultations/new')">
        新建问诊
      </el-button>
    </div>

    <el-card>
      <el-form :inline="true" :model="filters">
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部" style="width: 140px" clearable @change="handleSearch">
            <el-option label="草稿" value="draft" />
            <el-option label="问诊中" value="in_progress" />
            <el-option label="已完诊" value="completed" />
          </el-select>
        </el-form-item>
        <el-form-item label="患者">
          <el-input v-model="filters.patientName" placeholder="患者姓名" clearable @clear="handleSearch" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="store.list" v-loading="store.loading" @row-click="(row: Consultation) => $router.push(`/consultations/${row.id}`)" style="cursor: pointer;">
        <el-table-column prop="id" label="编号" width="70" />
        <el-table-column label="患者" width="100">
          <template #default="{ row }">
            {{ (row as Consultation).patient?.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="主诉" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="cell-truncate">{{ (row as Consultation).chiefComplaint }}</span>
          </template>
        </el-table-column>
        <el-table-column label="诊断" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="cell-truncate">{{ (row as Consultation).diagnosis }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTagType((row as Consultation).status)" size="small">
              {{ statusLabel((row as Consultation).status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="处方数" width="80" align="center">
          <template #default="{ row }">
            {{ (row as Consultation)._count?.prescriptions || 0 }}
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="160">
          <template #default="{ row }">
            {{ new Date((row as Consultation).createdAt).toLocaleString('zh-CN') }}
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        :page-size="pagination.pageSize"
        :total="store.total"
        layout="total, prev, pager, next"
        @current-change="handlePageChange"
        style="margin-top: 16px; justify-content: flex-end;"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted } from 'vue'
import { useConsultationStore } from '@/stores/consultation'
import type { Consultation } from '@/types'

const store = useConsultationStore()
const filters = reactive({ status: '' as string, patientName: '' })
const pagination = reactive({ page: 1, pageSize: 20 })

function statusTagType(status: string) {
  const map: Record<string, string> = { draft: 'info', in_progress: 'warning', completed: 'success' }
  return map[status] || 'info'
}
function statusLabel(status: string) {
  const map: Record<string, string> = { draft: '草稿', in_progress: '问诊中', completed: '已完诊' }
  return map[status] || status
}

async function handleSearch() {
  pagination.page = 1
  await store.fetchList({ ...filters, page: 1, pageSize: pagination.pageSize })
}
async function handlePageChange(page: number) {
  pagination.page = page
  await store.fetchList({ ...filters, page, pageSize: pagination.pageSize })
}

onMounted(async () => {
  await store.fetchList({ page: 1, pageSize: pagination.pageSize })
})
</script>

<style scoped>
.page { padding: 0; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.page-header h2 { font-family: 'DM Serif Display', Georgia, serif; font-size: 20px; margin: 0; }

.cell-truncate {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
