<template>
  <div class="page">
    <div class="page-header">
      <h2>配送管理</h2>
    </div>

    <!-- Filters -->
    <el-card class="filter-card">
      <el-form
        :inline="true"
        :model="filters"
      >
        <el-form-item label="状态">
          <el-select
            v-model="filters.status"
            placeholder="全部"
            clearable
            @change="handleSearch"
          >
            <el-option
              label="全部"
              value=""
            />
            <el-option
              label="待取件"
              value="approved"
            />
            <el-option
              label="配送中"
              value="delivering"
            />
            <el-option
              label="已签收"
              value="received"
            />
            <el-option
              label="异常退回"
              value="returned"
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
    </el-card>

    <!-- Table -->
    <el-card class="table-card">
      <el-table
        v-loading="prescriptionStore.loading"
        :data="prescriptionStore.list"
        stripe
      >
        <el-table-column
          prop="prescriptionNo"
          label="处方编号"
          width="180"
        />
        <el-table-column
          label="患者"
          width="100"
        >
          <template #default="{ row }">
            {{ row.patient?.name }}
          </template>
        </el-table-column>
        <el-table-column
          label="地址"
          min-width="180"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            {{ row.patient?.address || '—' }}
          </template>
        </el-table-column>
        <el-table-column
          label="电话"
          width="140"
        >
          <template #default="{ row }">
            <a
              v-if="row.patient?.phone"
              :href="'tel:' + row.patient.phone"
              class="phone-link"
            >
              <el-icon><Phone /></el-icon>
              {{ row.patient.phone }}
            </a>
            <span v-else>—</span>
          </template>
        </el-table-column>
        <el-table-column
          label="药品数"
          width="80"
          align="center"
        >
          <template #default="{ row }">
            {{ row.items?.length || 0 }}
          </template>
        </el-table-column>
        <el-table-column
          label="状态"
          width="100"
        >
          <template #default="{ row }">
            <StatusTag :status="row.status" />
          </template>
        </el-table-column>
        <el-table-column
          label="操作"
          width="240"
          fixed="right"
        >
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'approved'"
              size="small"
              type="primary"
              @click="handlePickup(row)"
            >
              确认取件
            </el-button>

            <template v-if="row.status === 'delivering'">
              <el-button
                size="small"
                type="success"
                @click="openDeliverDialog(row)"
              >
                确认签收
              </el-button>
              <el-button
                size="small"
                type="danger"
                @click="openExceptionDialog(row)"
              >
                上报异常
              </el-button>
            </template>

            <template v-if="row.status === 'returned'">
              <el-button
                size="small"
                type="primary"
                @click="handleRedeliver(row)"
              >
                重新配送
              </el-button>
              <el-button
                size="small"
                type="info"
                @click="openExceptionDetail(row)"
              >
                查看异常
              </el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="prescriptionStore.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        style="margin-top: 16px; justify-content: flex-end"
        @change="handleSearch"
      />
    </el-card>

    <!-- Deliver Dialog -->
    <el-dialog
      v-model="deliverDialogVisible"
      title="确认签收"
      width="640px"
      :close-on-click-modal="false"
      @closed="deliverStep = 0"
    >
      <el-steps
        :active="deliverStep"
        align-center
        style="margin-bottom: 24px"
      >
        <el-step title="核对药品" />
        <el-step title="签收凭证" />
        <el-step title="确认签收" />
      </el-steps>

      <!-- Step 0: Drug checklist -->
      <div
        v-show="deliverStep === 0"
        class="step-content"
      >
        <el-table
          :data="currentRx?.items"
          size="small"
          max-height="300"
        >
          <el-table-column
            prop="drugName"
            label="药品名称"
          />
          <el-table-column
            prop="specification"
            label="规格"
            width="120"
          >
            <template #default="{ row: item }">
              {{ item.specification || item.spec || '—' }}
            </template>
          </el-table-column>
          <el-table-column
            prop="quantity"
            label="数量"
            width="80"
            align="center"
          />
        </el-table>
      </div>

      <!-- Step 1: Proof -->
      <div
        v-show="deliverStep === 1"
        class="step-content"
      >
        <el-radio-group
          v-model="deliverProofType"
          class="proof-type-group"
        >
          <el-radio-button value="photo">
            拍照上传
          </el-radio-button>
          <el-radio-button value="sms">
            短信验证码
          </el-radio-button>
        </el-radio-group>

        <div
          v-if="deliverProofType === 'photo'"
          class="proof-section"
        >
          <el-upload
            ref="deliverPhotoUploadRef"
            :auto-upload="false"
            list-type="picture-card"
            :limit="1"
            :on-change="handleDeliverPhotoChange"
            :on-remove="() => (deliverPhotoBase64 = '')"
            accept="image/*"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
          <p class="upload-hint">
            请拍摄签收照片或上传图片
          </p>
        </div>

        <div
          v-else
          class="proof-section"
        >
          <el-input
            v-model="deliverSmsCode"
            placeholder="请输入6位短信验证码"
            maxlength="6"
            show-word-limit
            style="max-width: 260px"
          />
          <p class="upload-hint">
            验证码已发送至患者手机
          </p>
        </div>
      </div>

      <!-- Step 2: Confirm -->
      <div
        v-show="deliverStep === 2"
        class="step-content"
      >
        <div class="confirm-summary">
          <div class="summary-row">
            <span class="summary-label">处方编号</span>
            <span>{{ currentRx?.prescriptionNo }}</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">患者</span>
            <span>{{ currentRx?.patient?.name }}</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">药品数</span>
            <span>{{ currentRx?.items?.length || 0 }} 种</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">凭证方式</span>
            <span>{{ deliverProofType === 'photo' ? '拍照上传' : '短信验证码' }}</span>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button
            v-if="deliverStep > 0"
            @click="deliverPrev"
          >
            上一步
          </el-button>
          <el-button
            v-if="deliverStep < 2"
            type="primary"
            @click="deliverNext"
          >
            下一步
          </el-button>
          <el-button
            v-if="deliverStep === 2"
            type="primary"
            @click="handleConfirmDeliver"
          >
            确认签收
          </el-button>
          <el-button @click="deliverDialogVisible = false">
            取消
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- Exception Report Dialog -->
    <el-dialog
      v-model="exceptionDialogVisible"
      title="上报异常"
      width="520px"
      :close-on-click-modal="false"
    >
      <el-form
        :model="exceptionForm"
        label-position="top"
      >
        <el-form-item
          label="异常类型"
          required
        >
          <el-select
            v-model="exceptionForm.type"
            placeholder="请选择异常类型"
            style="width: 100%"
          >
            <el-option
              v-for="opt in exTypeOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item
          label="异常描述"
          required
        >
          <el-input
            v-model="exceptionForm.description"
            type="textarea"
            :rows="4"
            placeholder="请详细描述异常情况（至少10个字）"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <el-form-item
          v-if="exceptionForm.type === 'damaged'"
          label="破损照片"
          required
        >
          <el-upload
            ref="exceptionPhotoUploadRef"
            :auto-upload="false"
            list-type="picture-card"
            :limit="1"
            :on-change="handleExceptionPhotoChange"
            :on-remove="() => (exceptionForm.photo = '')"
            accept="image/*"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
          <p class="upload-hint">
            药品破损必须上传照片
          </p>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="exceptionDialogVisible = false">
            取消
          </el-button>
          <el-button
            type="danger"
            @click="handleSubmitException"
          >
            确认上报
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- Exception Detail Dialog (read-only) -->
    <el-dialog
      v-model="exceptionDetailVisible"
      title="异常详情"
      width="480px"
    >
      <el-descriptions
        v-if="exceptionDetail"
        :column="1"
        border
      >
        <el-descriptions-item label="异常类型">
          {{ exTypeMap[exceptionDetail.type] || exceptionDetail.type }}
        </el-descriptions-item>
        <el-descriptions-item label="描述">
          {{ exceptionDetail.description }}
        </el-descriptions-item>
        <el-descriptions-item
          v-if="exceptionDetail.photo"
          label="照片"
        >
          <el-image
            :src="exceptionDetail.photo"
            :preview-src-list="[exceptionDetail.photo]"
            style="max-width: 200px; border-radius: 8px"
          />
        </el-descriptions-item>
        <el-descriptions-item
          v-if="exceptionDetail.createdAt"
          label="上报时间"
        >
          {{ new Date(exceptionDetail.createdAt).toLocaleString() }}
        </el-descriptions-item>
      </el-descriptions>
      <el-empty
        v-else
        description="暂无异常信息"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Phone, Plus } from '@element-plus/icons-vue'
import { usePrescriptionStore } from '@/stores/prescription'
import StatusTag from '@/components/StatusTag.vue'
import type { UploadFile } from 'element-plus'
import type { Prescription } from '@/types'

const prescriptionStore = usePrescriptionStore()

// Pagination & filters
const page = ref(1)
const pageSize = ref(20)
const filters = reactive({ status: '' })

// Exception type config
const exTypeOptions = [
  { label: '患者拒收', value: 'patient_reject' },
  { label: '地址错误', value: 'wrong_address' },
  { label: '联系不上', value: 'unreachable' },
  { label: '药品破损', value: 'damaged' },
]

const exTypeMap: Record<string, string> = {
  patient_reject: '患者拒收',
  wrong_address: '地址错误',
  unreachable: '联系不上',
  damaged: '药品破损',
}

// -------------------------------------------------------
// Search
// -------------------------------------------------------
async function handleSearch() {
  await prescriptionStore.fetchList({
    page: page.value,
    pageSize: pageSize.value,
    ...filters,
  })
}

function handleReset() {
  filters.status = ''
  handleSearch()
}

// -------------------------------------------------------
// Pickup (approved → delivering)
// -------------------------------------------------------
async function handlePickup(row: Prescription) {
  try {
    await ElMessageBox.confirm(
      `确认取件：处方 ${row.prescriptionNo}？`,
      '确认取件',
      { confirmButtonText: '确认取件', type: 'info' },
    )
    await prescriptionStore.pickup(row.id)
    ElMessage.success('取件成功，已开始配送')
    handleSearch()
  } catch {
    // user cancelled
  }
}

// -------------------------------------------------------
// Deliver Dialog (delivering → received)
// -------------------------------------------------------
const deliverDialogVisible = ref(false)
const deliverStep = ref(0)
const deliverProofType = ref<'photo' | 'sms'>('photo')
const deliverPhotoBase64 = ref('')
const deliverSmsCode = ref('')
const currentRx = ref<any>(null)

function openDeliverDialog(row: Prescription) {
  currentRx.value = row
  deliverStep.value = 0
  deliverProofType.value = 'photo'
  deliverPhotoBase64.value = ''
  deliverSmsCode.value = ''
  deliverDialogVisible.value = true
}

function handleDeliverPhotoChange(file: UploadFile) {
  const reader = new FileReader()
  reader.onload = (e) => {
    deliverPhotoBase64.value = e.target?.result as string
  }
  if (file.raw) reader.readAsDataURL(file.raw)
}

function deliverNext() {
  if (deliverStep.value === 0) {
    deliverStep.value = 1
    return
  }
  if (deliverStep.value === 1) {
    if (deliverProofType.value === 'photo' && !deliverPhotoBase64.value) {
      ElMessage.warning('请上传签收照片')
      return
    }
    if (deliverProofType.value === 'sms' && !deliverSmsCode.value) {
      ElMessage.warning('请输入短信验证码')
      return
    }
    deliverStep.value = 2
  }
}

function deliverPrev() {
  if (deliverStep.value > 0) deliverStep.value--
}

async function handleConfirmDeliver() {
  const proof =
    deliverProofType.value === 'photo'
      ? deliverPhotoBase64.value
      : deliverSmsCode.value

  try {
    await ElMessageBox.confirm(
      `确认处方 ${currentRx.value.prescriptionNo} 已由患者签收？`,
      '确认签收',
      { confirmButtonText: '确认签收', type: 'info' },
    )
    await prescriptionStore.deliver(currentRx.value.id, proof)
    ElMessage.success('签收成功')
    deliverDialogVisible.value = false
    handleSearch()
  } catch {
    // user cancelled
  }
}

// -------------------------------------------------------
// Exception Dialog (delivering → returned)
// -------------------------------------------------------
const exceptionDialogVisible = ref(false)
const exceptionForm = reactive({
  type: '',
  description: '',
  photo: '',
})

function openExceptionDialog(row: Prescription) {
  currentRx.value = row
  exceptionForm.type = ''
  exceptionForm.description = ''
  exceptionForm.photo = ''
  exceptionDialogVisible.value = true
}

function handleExceptionPhotoChange(file: UploadFile) {
  const reader = new FileReader()
  reader.onload = (e) => {
    exceptionForm.photo = e.target?.result as string
  }
  if (file.raw) reader.readAsDataURL(file.raw)
}

async function handleSubmitException() {
  if (!exceptionForm.type) {
    ElMessage.warning('请选择异常类型')
    return
  }
  if (exceptionForm.type === 'damaged' && !exceptionForm.photo) {
    ElMessage.warning('药品破损必须上传照片')
    return
  }
  if (!exceptionForm.description || exceptionForm.description.trim().length < 10) {
    ElMessage.warning('异常描述至少需要10个字')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确认上报异常：${exTypeMap[exceptionForm.type]}？`,
      '上报异常',
      { confirmButtonText: '确认上报', type: 'warning' },
    )
    await prescriptionStore.reportEx(
      currentRx.value.id,
      exceptionForm.type,
      exceptionForm.description.trim(),
      exceptionForm.photo || undefined,
    )
    ElMessage.success('异常已上报')
    exceptionDialogVisible.value = false
    handleSearch()
  } catch {
    // user cancelled
  }
}

// -------------------------------------------------------
// Exception Detail (returned — read-only)
// -------------------------------------------------------
const exceptionDetailVisible = ref(false)
const exceptionDetail = ref<any>(null)

function openExceptionDetail(row: Prescription) {
  exceptionDetail.value = row.exception || null
  exceptionDetailVisible.value = true
}

// -------------------------------------------------------
// Redeliver (returned → approved)
// -------------------------------------------------------
async function handleRedeliver(row: Prescription) {
  try {
    const { value: reason } = await ElMessageBox.prompt(
      '请输入重新配送原因',
      '重新配送',
      {
        confirmButtonText: '确认配送',
        cancelButtonText: '取消',
        inputType: 'textarea',
        inputPlaceholder: '请输入重新配送原因',
        inputValidator: (value) => {
          if (!value || value.trim().length === 0) return '请输入配送原因'
          return true
        },
      },
    )
    await prescriptionStore.requestRedeliver(row.id, reason.trim())
    ElMessage.success('已提交重新配送，处方回到待配送队列')
    handleSearch()
  } catch {
    // user cancelled
  }
}

// -------------------------------------------------------
// Init
// -------------------------------------------------------
onMounted(() => handleSearch())
</script>

<style scoped lang="scss">
.page {
  max-width: 1400px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  font-family: 'DM Serif Display', serif;
  font-size: 24px;
  color: var(--warm-900);
}

/* Cards */
.filter-card {
  margin-bottom: 16px;
}

.filter-card,
.table-card {
  border-radius: 12px;
  border: 1px solid var(--warm-200);
  background: #fff;
}

/* Phone link */
.phone-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--teal-700);
  text-decoration: none;
  font-weight: 500;
}

.phone-link:hover {
  color: var(--teal-500);
  text-decoration: underline;
}

/* Deliver steps */
.step-content {
  min-height: 180px;
}

.proof-type-group {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.proof-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.upload-hint {
  font-size: 13px;
  color: var(--warm-700);
}

/* Confirm summary */
.confirm-summary {
  max-width: 360px;
  margin: 0 auto;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid var(--warm-200);
  font-size: 14px;
}

.summary-row:last-child {
  border-bottom: none;
}

.summary-label {
  color: var(--warm-700);
}

/* Dialog footer */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
