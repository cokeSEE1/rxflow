<template>
  <div class="page">
    <div class="page-header">
      <h2>处方管理</h2>
      <el-button v-permission="['assistant']" type="primary" @click="$router.push('/prescriptions/new')">
        新建处方
      </el-button>
    </div>

    <el-card>
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
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="prescriptionStore.list" v-loading="prescriptionStore.loading" stripe>
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
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <StatusTag :status="row.status" />
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
import { ref, reactive, onMounted } from 'vue'
import { usePrescriptionStore } from '@/stores/prescription'
import { ElMessage } from 'element-plus'
import StatusTag from '@/components/StatusTag.vue'

const prescriptionStore = usePrescriptionStore()
const page = ref(1)
const pageSize = ref(20)
const filters = reactive({ status: '', patientName: '' })

async function handleSearch() {
  await prescriptionStore.fetchList({ page: page.value, pageSize: pageSize.value, ...filters })
}
function handleReset() { filters.status = ''; filters.patientName = ''; handleSearch() }
async function handleSubmit(id: number) {
  await prescriptionStore.submit(id)
  ElMessage.success('已提交审核')
  handleSearch()
}

onMounted(() => handleSearch())
</script>

<style scoped>
.page { max-width: 1400px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
</style>
