<template>
  <div class="drug-selector">
    <!-- Allergy Summary Bar -->
    <div
      v-if="allergySummary.severity"
      class="allergy-summary"
      :class="allergySummary.severity"
    >
      <span class="summary-icon">{{ allergySummary.icon }}</span>
      <div class="summary-body">
        <div
          class="summary-title"
          :class="allergySummary.severity"
        >
          {{ allergySummary.title }}
        </div>
        <div
          class="summary-detail"
          v-html="allergySummary.details"
        />
      </div>
      <el-button
        size="small"
        text
        type="primary"
        @click="showAllergyDetail = true"
      >
        查看详情 →
      </el-button>
    </div>

    <!-- Search Box -->
    <div
      ref="searchWrapRef"
      class="search-wrap"
    >
      <el-input
        ref="searchInputRef"
        v-model="keyword"
        :prefix-icon="Search"
        placeholder="搜索药品名称、拼音首字母..."
        size="large"
        clearable
        @input="handleSearch"
        @focus="handleFocus"
        @clear="handleClear"
      />
      <p class="search-hint">
        支持拼音首字母搜索：<kbd>amxl</kbd> → 阿莫西林
      </p>

      <!-- Search Results Dropdown -->
      <div
        v-if="showDropdown"
        class="search-results"
      >
        <template v-if="drugStore.searchResults.length > 0">
          <div
            v-for="drug in drugStore.searchResults"
            :key="drug.id"
            class="result-item"
            :class="[
              drug.allergyRisk || '',
              { selected: isSelected(drug.id) },
            ]"
            @click="handleAddDrug(drug)"
          >
            <div class="result-main">
              <div class="result-name">
                {{ drug.name }}
                <span
                  v-if="drug.allergyRisk === 'moderate'"
                  class="allergy-badge moderate"
                >
                  <span class="allergy-dot moderate" /> 中度过敏
                </span>
                <span
                  v-if="drug.allergyRisk === 'compatible'"
                  class="allergy-badge compatible"
                >
                  <span class="allergy-dot compatible" /> 注意
                </span>
              </div>
              <div class="result-sub">
                {{ drug.maker }} · {{ drug.spec }}
                <template v-if="drug.allergyRisk === 'severe'">
                  · <span class="allergy-note severe">患者对{{ drug.allergenName }}重度过敏</span>
                </template>
                <template v-if="drug.allergyRisk === 'moderate'">
                  · <span class="allergy-note moderate">患者对{{ drug.allergenName }}中度过敏</span>
                </template>
              </div>
            </div>
            <div class="result-meta">
              <span
                class="insurance-tag"
                :class="'insurance-' + drug.insurance"
              >
                {{ insuranceLabelMap[drug.insurance] || drug.insurance }}
              </span>
              <span class="result-price">&yen;{{ drug.price }}</span>
              <span class="result-unit">/{{ drug.unit }}</span>
            </div>
            <span
              v-if="drug.allergyRisk === 'severe'"
              class="severe-label"
            >禁止使用</span>
            <span
              v-else-if="isSelected(drug.id)"
              class="selected-label"
            >已添加 &check;</span>
          </div>
        </template>
        <div
          v-else-if="keyword"
          class="results-empty"
        >
          未找到匹配药品
        </div>
      </div>
    </div>

    <!-- Selected Drugs List -->
    <div class="selected-wrap">
      <div class="selected-header">
        <h4>已选药品</h4>
        <span class="count-badge">已选 {{ selectedDrugs.length }} 种</span>
      </div>

      <TransitionGroup
        name="drug-row-anim"
        tag="div"
      >
        <div
          v-for="(item, index) in selectedDrugs"
          :key="item.drugId"
          class="drug-row"
          :class="getAllergyClass(item.allergyRisk)"
        >
          <div class="drug-row-name">
            <span
              v-if="item.allergyRisk === 'severe'"
              class="allergy-badge severe"
            >
              <span class="allergy-dot severe" /> 严重过敏
            </span>
            <span
              v-if="item.allergyRisk === 'moderate'"
              class="allergy-badge moderate"
            >
              <span class="allergy-dot moderate" /> 中度过敏
            </span>
            <span
              v-if="item.allergyRisk === 'compatible'"
              class="allergy-badge compatible"
            >
              <span class="allergy-dot compatible" /> 注意
            </span>
            <span class="drug-name-text">{{ item.drugName }}</span>
            <span
              v-if="item.insurance"
              class="insurance-tag"
              :class="'insurance-' + item.insurance"
            >
              {{ insuranceLabelMap[item.insurance] || item.insurance }}
            </span>
            <span
              v-if="item.price !== undefined"
              class="price-hint"
            >&yen;{{ item.price }}/{{ item.unit }}</span>
          </div>
          <el-input
            v-model="item.dosage"
            placeholder="剂量"
            size="small"
            @change="emitUpdate"
          />
          <el-select
            v-model="item.freq"
            size="small"
            @change="emitUpdate"
          >
            <el-option
              v-for="opt in freqOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
          <el-input-number
            v-model="item.days"
            :min="1"
            :max="365"
            size="small"
            controls-position="right"
            @change="emitUpdate"
          />
          <button
            class="remove-btn"
            title="移除"
            @click="removeDrug(index)"
          >
            &times;
          </button>
        </div>
      </TransitionGroup>

      <button
        class="add-btn"
        @click="focusSearch"
      >
        + 添加药品
      </button>
    </div>

    <!-- Allergy Detail Dialog -->
    <el-dialog
      v-model="showAllergyDetail"
      title="过敏风险详情"
      width="520px"
      destroy-on-close
    >
      <div
        v-for="drug in allergyDetailDrugs"
        :key="drug.drugId"
        class="allergy-detail-item"
        :class="drug.allergyRisk || ''"
      >
        <div class="detail-header">
          <span
            class="detail-icon"
            :class="drug.allergyRisk || ''"
          >{{ allergyDetailIcon(drug.allergyRisk) }}</span>
          <span
            class="detail-title"
            :class="drug.allergyRisk || ''"
          >
            {{ allergyDetailLabel(drug.allergyRisk) }} — {{ drug.allergenName }}
          </span>
        </div>
        <div class="detail-body">
          涉及药品：<strong>{{ drug.drugName }}</strong>
        </div>
      </div>
      <template #footer>
        <el-button
          type="primary"
          @click="showAllergyDetail = false"
        >
          我知道了
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'
import { useDrugStore } from '../stores/drug'
import type { DrugSearchResult, SelectedDrug } from '@/types'

const props = defineProps<{
  modelValue?: SelectedDrug[]
  patientId?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: SelectedDrug[]]
}>()

const drugStore = useDrugStore()

// ── Search state ──────────────────────────────────────────────
const keyword = ref('')
const showDropdown = ref(false)
const searchWrapRef = ref<HTMLElement | null>(null)
const searchInputRef = ref<InstanceType<typeof import('element-plus').ElInput> | null>(null)

// ── Selected drugs (local copy synced with modelValue) ────────
const selectedDrugs = ref<SelectedDrug[]>([...(props.modelValue || [])])

watch(
  () => props.modelValue,
  (val) => {
    selectedDrugs.value = val ? [...val] : []
  },
)

function emitUpdate() {
  emit('update:modelValue', [...selectedDrugs.value])
}

// ── Constants ─────────────────────────────────────────────────
const freqOptions = [
  { value: 'qd', label: '每日1次' },
  { value: 'bid', label: '每日2次' },
  { value: 'tid', label: '每日3次' },
  { value: 'qid', label: '每日4次' },
  { value: 'qn', label: '每晚1次' },
  { value: 'prn', label: '必要时' },
]

const insuranceLabelMap: Record<string, string> = {
  A: '甲',
  B: '乙',
  C: '丙',
  self: '自费',
}

// ── Search logic ──────────────────────────────────────────────
let debounceTimer: ReturnType<typeof setTimeout>

function handleSearch(value: string) {
  clearTimeout(debounceTimer)
  if (!value || !value.trim()) {
    drugStore.clearSearch()
    showDropdown.value = false
    return
  }
  showDropdown.value = true
  debounceTimer = setTimeout(() => {
    drugStore.search(value.trim())
  }, 200)
}

function handleFocus() {
  if (drugStore.searchResults.length > 0) {
    showDropdown.value = true
  }
}

function handleClear() {
  drugStore.clearSearch()
  showDropdown.value = false
}

function focusSearch() {
  searchInputRef.value?.focus()
  if (drugStore.searchResults.length > 0) {
    showDropdown.value = true
  }
}

// ── Click outside to close dropdown ───────────────────────────
// eslint-disable-next-line no-undef
function handleClickOutside(event: Event) {
  const target = event.target as HTMLElement
  if (searchWrapRef.value && target && !searchWrapRef.value.contains(target)) {
    showDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// ── Drug selection ────────────────────────────────────────────
function isSelected(drugId: number): boolean {
  return selectedDrugs.value.some((d) => d.drugId === drugId)
}

async function handleAddDrug(drug: DrugSearchResult) {
  // Prevent duplicate selection
  if (isSelected(drug.id)) return

  // Severe allergy: cannot select
  if (drug.allergyRisk === 'severe') return

  // Moderate allergy: confirm before adding
  if (drug.allergyRisk === 'moderate') {
    try {
      await ElMessageBox.confirm(
        `${drug.name} — 患者对${drug.allergenName}有中度过敏史。\n\n已知晓风险，仍然添加？`,
        '过敏风险提示',
        {
          confirmButtonText: '仍然添加',
          cancelButtonText: '取消',
          type: 'warning',
        },
      )
    } catch {
      return
    }
  }

  // Add the drug
  const selected: SelectedDrug = {
    drugId: drug.id,
    drugName: drug.name,
    dosage: '',
    freq: 'qd',
    days: 7,
    allergyRisk: drug.allergyRisk || null,
    allergenName: drug.allergenName,
    insurance: drug.insurance,
    price: drug.price,
    unit: drug.unit,
  }

  selectedDrugs.value.push(selected)
  emitUpdate()

  // Close dropdown and reset search
  showDropdown.value = false
  keyword.value = ''
  drugStore.clearSearch()
}

function removeDrug(index: number) {
  selectedDrugs.value.splice(index, 1)
  emitUpdate()
}

// ── Allergy helpers ───────────────────────────────────────────
function getAllergyClass(risk?: 'severe' | 'moderate' | 'compatible' | null): string {
  if (risk === 'severe') return 'allergy-severe'
  if (risk === 'moderate') return 'allergy-moderate'
  if (risk === 'compatible') return 'allergy-compatible'
  return ''
}

// ── Allergy summary ───────────────────────────────────────────
const allergySummary = computed(() => {
  const severe = selectedDrugs.value.filter((d) => d.allergyRisk === 'severe')
  const moderate = selectedDrugs.value.filter((d) => d.allergyRisk === 'moderate')
  const compatible = selectedDrugs.value.filter((d) => d.allergyRisk === 'compatible')

  const hasSevere = severe.length > 0
  const hasModerate = moderate.length > 0
  const hasCompatible = compatible.length > 0

  if (!hasSevere && !hasModerate && !hasCompatible) {
    return { severity: null, icon: '', title: '', details: '' }
  }

  if (hasSevere) {
    const total = severe.length + moderate.length
    const sevDetails = severe
      .map((d) => `<strong>${d.drugName}</strong> — 患者对 <strong>${d.allergenName}</strong> 有重度过敏史`)
      .join('<br>')
    const modDetails = moderate
      .map((d) => `<strong>${d.drugName}</strong> — 患者对 <strong>${d.allergenName}</strong> 有中度过敏史`)
      .join('<br>')
    const details = sevDetails + (moderate.length > 0 ? '<br>' + modDetails : '')
    return {
      severity: 'severe' as const,
      icon: '⚠️',
      title: `过敏风险警告 — ${total} 个药品存在风险`,
      details,
    }
  }

  if (hasModerate) {
    const details = moderate
      .map((d) => `<strong>${d.drugName}</strong> — 患者对 <strong>${d.allergenName}</strong> 有中度过敏史`)
      .join('<br>')
    return {
      severity: 'moderate' as const,
      icon: '⚠️',
      title: `过敏风险提示 — ${moderate.length} 个药品需关注`,
      details,
    }
  }

  // Compatible only
  const details = compatible
    .map((d) => `<strong>${d.drugName}</strong> — 患者对 <strong>${d.allergenName}</strong> 存在轻度过敏风险`)
    .join('<br>')
  return {
    severity: 'compatible' as const,
    icon: 'ℹ️',
    title: '用药提示 — 部分药品需注意',
    details,
  }
})

// ── Allergy detail dialog ─────────────────────────────────────
const showAllergyDetail = ref(false)

const allergyDetailDrugs = computed(() =>
  selectedDrugs.value.filter(
    (d) =>
      d.allergyRisk === 'severe' ||
      d.allergyRisk === 'moderate' ||
      d.allergyRisk === 'compatible',
  ),
)

function allergyDetailLabel(risk?: 'severe' | 'moderate' | 'compatible' | null): string {
  if (risk === 'severe') return '重度过敏'
  if (risk === 'moderate') return '中度过敏'
  if (risk === 'compatible') return '兼容性提示'
  return ''
}

function allergyDetailIcon(risk?: 'severe' | 'moderate' | 'compatible' | null): string {
  if (risk === 'severe') return '🚨'
  if (risk === 'moderate') return '⚠️'
  if (risk === 'compatible') return 'ℹ️'
  return ''
}
</script>

<style scoped lang="scss">
/* ── Local color tokens (not in global.scss) ────────────────── */
.drug-selector {
  --red-50: #fef2f2;
  --red-100: #fee2e2;
  --red-500: #ef4444;
  --orange-50: #fff7ed;
  --orange-100: #ffedd5;
  --orange-500: #f97316;
  --yellow-50: #fefce8;
  --yellow-100: #fef9c3;
  --yellow-500: #eab308;
  --green-100: #dcfce7;
  --blue-50: #eff6ff;
  --amber-100: #fef3c7;

  width: 100%;
}

/* ── Allergy Summary Bar ────────────────────────────────────── */
.allergy-summary {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 16px 20px;
  border-radius: 14px;
  margin-bottom: 20px;
  border: 1.5px solid;
  transition: all 0.3s ease;

  &.severe {
    background: linear-gradient(135deg, var(--red-50), #fff5f5);
    border-color: var(--red-100);
  }

  &.moderate {
    background: linear-gradient(135deg, var(--orange-50), #fffcf5);
    border-color: #fed7aa;
  }

  &.compatible {
    background: linear-gradient(135deg, var(--yellow-50), #fffef5);
    border-color: #fef08a;
  }
}

.summary-icon {
  font-size: 24px;
  flex-shrink: 0;
  line-height: 1;
}

.summary-body {
  flex: 1;
}

.summary-title {
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 6px;

  &.severe {
    color: var(--coral);
  }

  &.moderate {
    color: var(--orange-500);
  }

  &.compatible {
    color: #a16207;
  }
}

.summary-detail {
  font-size: 12px;
  color: var(--warm-700);
  line-height: 1.7;

  :deep(strong) {
    color: var(--warm-900);
  }
}

/* ── Search Area ────────────────────────────────────────────── */
.search-wrap {
  position: relative;
  margin-bottom: 20px;
}

.search-hint {
  font-size: 11px;
  color: #a8a29e;
  margin-top: 6px;
  margin-left: 4px;

  kbd {
    padding: 1px 6px;
    background: var(--warm-100);
    border: 1px solid var(--warm-200);
    border-radius: 3px;
    font-size: 10px;
    font-family: 'DM Sans', monospace;
    font-weight: 500;
  }
}

/* Override ElInput style to match design system */
:deep(.el-input__wrapper) {
  border-radius: 10px;
  box-shadow: none;
  border: 1.5px solid var(--warm-200);
  transition: all 0.2s ease;
  padding-left: 14px;
  padding-right: 14px;
}

:deep(.el-input__wrapper:hover) {
  box-shadow: none;
  border-color: var(--warm-300);
}

:deep(.el-input.is-focus .el-input__wrapper) {
  box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
  border-color: var(--teal-500);
}

:deep(.el-input .el-input__prefix) {
  color: #d6d3d1;
}

/* ── Search Results Dropdown ────────────────────────────────── */
.search-results {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 20;
  background: #fff;
  border: 1.5px solid var(--warm-200);
  border-radius: 14px;
  box-shadow: var(--shadow-lg);
  max-height: 400px;
  overflow-y: auto;
  animation: dropdownIn 0.15s ease-out;
}

@keyframes dropdownIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.result-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  cursor: pointer;
  transition: all 0.12s ease;
  border-bottom: 1px solid var(--warm-100);
  position: relative;

  &:last-child {
    border-bottom: none;
  }

  &:hover:not(.severe):not(.selected) {
    background: #f0fdfa;
  }

  &.severe {
    background: linear-gradient(135deg, var(--red-50), #fff5f5);
    cursor: not-allowed;
  }

  &.moderate {
    background: linear-gradient(135deg, var(--orange-50), #fffcf5);
  }

  &.compatible {
    background: linear-gradient(135deg, var(--yellow-50), #fffef5);
  }

  &.selected {
    opacity: 0.5;
    cursor: default;
    pointer-events: none;
  }
}

.result-main {
  flex: 1;
  min-width: 0;
}

.result-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--warm-900);
  display: flex;
  align-items: center;
  gap: 8px;
}

.result-sub {
  font-size: 12px;
  color: var(--warm-700);
  margin-top: 3px;
}

.result-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.result-price {
  font-size: 14px;
  font-weight: 600;
  color: var(--teal-700);
}

.result-unit {
  font-size: 11px;
  color: #a8a29e;
}

.allergy-note {
  font-weight: 600;

  &.severe {
    color: var(--coral);
  }

  &.moderate {
    color: var(--orange-500);
    font-weight: 500;
  }
}

.severe-label {
  position: absolute;
  right: 18px;
  font-size: 11px;
  font-weight: 700;
  color: var(--coral);
}

.selected-label {
  font-size: 11px;
  color: var(--teal-700);
  font-weight: 600;
}

.results-empty {
  padding: 24px;
  text-align: center;
  color: #a8a29e;
}

/* ── Insurance Tags ─────────────────────────────────────────── */
.insurance-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.02em;
  flex-shrink: 0;
}

.insurance-A {
  background: var(--green-100);
  color: #15803d;
}

.insurance-B {
  background: var(--blue-50);
  color: #1d4ed8;
}

.insurance-C {
  background: var(--amber-100);
  color: #b45309;
}

.insurance-self {
  background: var(--warm-100);
  color: #a8a29e;
}

/* ── Allergy Badges ─────────────────────────────────────────── */
.allergy-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;

  &.severe {
    background: var(--red-100);
    color: var(--coral);
  }

  &.moderate {
    background: var(--orange-100);
    color: var(--orange-500);
  }

  &.compatible {
    background: var(--yellow-100);
    color: #a16207;
  }
}

.allergy-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;

  &.severe {
    background: var(--coral);
  }

  &.moderate {
    background: var(--orange-500);
  }

  &.compatible {
    background: var(--yellow-500);
  }
}

/* ── Selected Drugs Section ─────────────────────────────────── */
.selected-wrap {
  margin-top: 0;
}

.selected-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;

  h4 {
    font-family: 'DM Serif Display', Georgia, serif;
    font-size: 15px;
    color: var(--warm-700);
    margin: 0;
  }
}

.count-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 20px;
  background: #f0fdfa;
  color: var(--teal-700);
}

/* ── Drug Row ───────────────────────────────────────────────── */
.drug-row {
  display: grid;
  grid-template-columns: 1.8fr 0.9fr 1fr 0.7fr 40px;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 10px;
  background: var(--warm-50);
  margin-bottom: 8px;
  border: 1.5px solid var(--warm-100);
  transition: all 0.2s ease;

  &:last-child {
    margin-bottom: 0;
  }

  &:hover:not(.allergy-severe) {
    border-color: #d6d3d1;
  }

  &.allergy-severe {
    background: linear-gradient(135deg, var(--red-50), #fff5f5);
    border-color: var(--red-100);
  }

  &.allergy-moderate {
    background: linear-gradient(135deg, var(--orange-50), #fffcf5);
    border-color: #fed7aa;
  }

  &.allergy-compatible {
    background: linear-gradient(135deg, var(--yellow-50), #fffef5);
    border-color: #fef08a;
  }
}

.drug-row-name {
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.drug-name-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.price-hint {
  font-size: 11px;
  color: #a8a29e;
  white-space: nowrap;
}

/* Override ElInput/ElSelect/ElInputNumber inside drug rows */
.drug-row :deep(.el-input__wrapper),
.drug-row :deep(.el-select .el-input__wrapper),
.drug-row :deep(.el-input-number .el-input__wrapper) {
  border-radius: 6px;
}

.drug-row :deep(.el-input-number.is-controls-right .el-input__wrapper) {
  padding-right: 32px;
}

.remove-btn {
  width: 30px;
  height: 30px;
  border-radius: 6px;
  border: 1px solid var(--warm-200);
  background: #fff;
  color: #a8a29e;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  padding: 0;
  line-height: 1;
  font-family: 'DM Sans', system-ui, sans-serif;

  &:hover {
    background: #fff1f2;
    border-color: var(--coral);
    color: var(--coral);
  }
}

/* ── Add Drug Button ────────────────────────────────────────── */
.add-btn {
  margin-top: 12px;
  padding: 10px 16px;
  border: 1.5px dashed #d6d3d1;
  border-radius: 10px;
  background: var(--warm-50);
  color: var(--teal-700);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  width: 100%;
  text-align: center;
  transition: all 0.15s;
  font-family: 'DM Sans', system-ui, sans-serif;

  &:hover {
    border-color: var(--teal-500);
    background: #f0fdfa;
  }
}

/* ── Transition Group Animations ────────────────────────────── */
.drug-row-anim-enter-active {
  transition: all 0.35s ease-out;
}

.drug-row-anim-leave-active {
  transition: all 0.25s ease-in;
}

.drug-row-anim-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}

.drug-row-anim-leave-to {
  opacity: 0;
  transform: translateX(-12px);
}

.drug-row-anim-move {
  transition: transform 0.3s ease;
}

/* ── Allergy Detail Dialog Items ────────────────────────────── */
.allergy-detail-item {
  padding: 16px;
  border-radius: 14px;
  margin-bottom: 12px;

  &.severe {
    background: linear-gradient(135deg, var(--red-50), #fff5f5);
    border: 1.5px solid var(--red-100);
  }

  &.moderate {
    background: linear-gradient(135deg, var(--orange-50), #fffcf5);
    border: 1.5px solid #fed7aa;
  }

  &.compatible {
    background: linear-gradient(135deg, var(--yellow-50), #fffef5);
    border: 1.5px solid #fef08a;
  }
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.detail-icon {
  font-size: 20px;
}

.detail-title {
  font-size: 14px;
  font-weight: 700;

  &.severe {
    color: var(--coral);
  }

  &.moderate {
    color: var(--orange-500);
  }

  &.compatible {
    color: #a16207;
  }
}

.detail-body {
  font-size: 12px;
  color: var(--warm-700);
  line-height: 1.7;

  strong {
    color: var(--warm-900);
  }
}
</style>
