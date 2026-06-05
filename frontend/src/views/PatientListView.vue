<template>
  <div class="page">
    <div class="page-header">
      <h2>患者管理</h2>
      <el-button
        type="primary"
        @click="openCreate"
      >
        新增患者
      </el-button>
    </div>

    <el-card>
      <!-- Search Filters -->
      <el-form
        :inline="true"
        :model="filters"
      >
        <el-form-item label="姓名">
          <el-input
            v-model="filters.name"
            placeholder="患者姓名"
            clearable
          />
        </el-form-item>
        <el-form-item label="电话">
          <el-input
            v-model="filters.phone"
            placeholder="手机号码"
            clearable
          />
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
        :data="patientStore.list"
        stripe
      >
        <el-table-column
          prop="name"
          label="姓名"
          width="100"
        />
        <el-table-column
          label="性别"
          width="70"
        >
          <template #default="{ row }">
            {{ genderLabel(row.gender) }}
          </template>
        </el-table-column>
        <el-table-column
          prop="age"
          label="年龄"
          width="70"
        />
        <el-table-column
          prop="phone"
          label="电话"
          width="130"
        />
        <el-table-column
          label="地址"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            {{ row.address }}
          </template>
        </el-table-column>
        <el-table-column
          label="身份证号"
          width="190"
        >
          <template #default="{ row }">
            {{ maskIdCard(row.idCard) }}
          </template>
        </el-table-column>
        <el-table-column
          label="过敏史"
          width="150"
          align="center"
        >
          <template #default="{ row }">
            <el-tag
              v-if="row.allergyHistory"
              type="danger"
              effect="plain"
            >
              {{ row.allergyHistory }}
            </el-tag>
            <span
              v-else
              class="text-muted"
            >无</span>
          </template>
        </el-table-column>
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
          width="240"
          fixed="right"
        >
          <template #default="{ row }">
            <el-button
              size="small"
              @click="openEdit(row)"
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
            <el-button
              size="small"
              text
              type="primary"
              @click="viewPrescriptions(row)"
            >
              查看处方
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- Empty state -->
      <el-empty
        v-if="!loading && patientStore.list.length === 0"
        description="暂无患者数据"
      />

      <!-- Pagination -->
      <el-pagination
        v-if="patientStore.total > 0"
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="patientStore.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        style="margin-top:16px; justify-content:flex-end"
        @change="handleSearch"
      />
    </el-card>

    <!-- Create/Edit Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑患者' : '新增患者'"
      width="560px"
      :close-on-click-modal="false"
      @closed="resetForm"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item
          label="姓名"
          prop="name"
        >
          <el-input
            v-model="form.name"
            placeholder="请输入姓名"
          />
        </el-form-item>
        <el-form-item
          label="性别"
          prop="gender"
        >
          <el-radio-group v-model="form.gender">
            <el-radio value="男">
              男
            </el-radio>
            <el-radio value="女">
              女
            </el-radio>
          </el-radio-group>
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
          label="电话"
          prop="phone"
        >
          <el-input
            v-model="form.phone"
            placeholder="请输入手机号"
          />
        </el-form-item>
        <el-form-item
          label="地址"
          prop="address"
        >
          <el-input
            v-model="form.address"
            placeholder="请输入地址"
          />
        </el-form-item>
        <el-form-item
          label="身份证号"
          prop="idCard"
        >
          <el-input
            v-model="form.idCard"
            placeholder="选填，18位身份证号"
          />
        </el-form-item>
        <el-form-item
          label="过敏史"
          prop="allergyHistory"
        >
          <div class="allergy-label">
            <span class="label-required-star">*</span>
            <span class="label-text-important">重要</span>
          </div>
          <el-input
            v-model="form.allergyHistory"
            type="textarea"
            :rows="3"
            placeholder="请输入过敏史信息"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">
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

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { usePatientStore } from '@/stores/patient'
import type { Patient } from '@/types'

const router = useRouter()
const patientStore = usePatientStore()

// --- Search state ---
const page = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const filters = reactive({ name: '', phone: '' })

// --- Dialog state ---
const dialogVisible = ref(false)
const isEdit = ref(false)
const editingId = ref<number | null>(null)
const submitting = ref(false)
const formRef = ref<FormInstance>()

interface PatientForm {
  name: string
  gender: string
  age: number
  phone: string
  address: string
  idCard: string
  allergyHistory: string
}

const defaultForm = (): PatientForm => ({
  name: '',
  gender: '男',
  age: 0,
  phone: '',
  address: '',
  idCard: '',
  allergyHistory: '',
})

const form = reactive<PatientForm>(defaultForm())

const formRules: FormRules<PatientForm> = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' },
  ],
  address: [{ required: true, message: '请输入地址', trigger: 'blur' }],
  idCard: [
    {
      pattern: /(^$|^\d{17}[\dXx]$)/,
      message: '身份证号格式不正确（18位）',
      trigger: 'blur',
    },
  ],
}

// --- Helpers ---
function maskIdCard(idCard: string | undefined): string {
  if (!idCard) return '-'
  if (idCard.length !== 18) return idCard
  return idCard.slice(0, 3) + '****' + idCard.slice(-4)
}

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleString()
}

function genderLabel(gender: string): string {
  const map: Record<string, string> = { male: '男', female: '女', '男': '男', '女': '女' }
  return map[gender] || gender || '-'
}

// --- Search ---
async function handleSearch() {
  loading.value = true
  try {
    await patientStore.fetchList({
      page: page.value,
      pageSize: pageSize.value,
      name: filters.name || undefined,
      phone: filters.phone || undefined,
    })
  } finally {
    loading.value = false
  }
}

function handleReset() {
  filters.name = ''
  filters.phone = ''
  page.value = 1
  handleSearch()
}

// --- Create / Edit ---
function openCreate() {
  isEdit.value = false
  editingId.value = null
  dialogVisible.value = true
}

function openEdit(row: Patient) {
  isEdit.value = true
  editingId.value = row.id
  form.name = row.name
  form.gender = row.gender || '男'
  form.age = row.age
  form.phone = row.phone
  form.address = row.address || ''
  form.idCard = row.idCard || ''
  form.allergyHistory = row.allergyHistory || ''
  dialogVisible.value = true
}

function resetForm() {
  Object.assign(form, defaultForm())
  formRef.value?.resetFields()
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    const payload = { ...form }
    if (!payload.idCard) delete (payload as Record<string, unknown>).idCard

    if (isEdit.value && editingId.value != null) {
      await patientStore.update(editingId.value, payload)
      ElMessage.success('患者信息已更新')
    } else {
      await patientStore.create(payload)
      ElMessage.success('患者已创建')
    }
    dialogVisible.value = false
    await handleSearch()
  } catch {
    ElMessage.error('操作失败，请重试')
  } finally {
    submitting.value = false
  }
}

// --- Delete ---
async function handleDelete(row: Patient) {
  try {
    await ElMessageBox.confirm(`确定要删除患者「${row.name}」吗？此操作不可撤销。`, '删除确认', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await patientStore.remove(row.id)
    ElMessage.success('患者已删除')
    handleSearch()
  } catch {
    // user cancelled
  }
}

// --- Navigate ---
function viewPrescriptions(row: Patient) {
  router.push({ path: '/prescriptions', query: { patientName: row.name } })
}

// --- Init ---
onMounted(() => handleSearch())
</script>

<style scoped lang="scss">
.page {
  max-width: 1400px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.page-header h2 {
  font-family: 'DM Serif Display', serif;
  font-size: 24px;
  font-weight: 500;
  color: var(--warm-900);
}

.el-card {
  border-radius: 12px;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--warm-200);
}

.text-muted {
  color: var(--warm-700);
  opacity: 0.5;
}

/* Allergy label in form */
.allergy-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.label-required-star {
  color: var(--coral);
}

.label-text-important {
  color: var(--coral);
  font-weight: 500;
}

/* Table stripe override */
:deep(.el-table__row--striped) {
  background: var(--warm-50);
}

/* Dialog */
:deep(.el-dialog) {
  border-radius: 12px;
}

:deep(.el-dialog__header) {
  border-bottom: 1px solid var(--warm-200);
  padding: 20px 24px;
}

:deep(.el-dialog__body) {
  padding: 24px;
}

:deep(.el-dialog__footer) {
  border-top: 1px solid var(--warm-200);
  padding: 16px 24px;
}
</style>
