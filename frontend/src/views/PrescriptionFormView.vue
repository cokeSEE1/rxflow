<template>
  <div class="page">
    <h2>{{ isEdit ? '编辑处方' : '新建处方' }}</h2>
    <!-- TODO: student - implement dynamic prescription form
         Sections:
         1. Patient selector (searchSelect: name + phone tail + ID card last 4)
            - Selected patient card (name, gender, age, phone, address, allergy in RED)
            - "Add patient" button -> drawer with patient form
         2. Diagnosis textarea
            - "Load template" dropdown -> fills diagnosis + items
            - "Save as template" button
         3. Drug items (dynamic add/remove rows):
            - drugName (searchSelect) + specification + dosage + frequency (qd/bid/tid/qn) + days + remark
            - At least 1 item, max 20
            - Validation: drug required, dosage number, days 1-90
         4. Note
         Draft auto-save: use useDraft() composable, save every 30s to localStorage
         Submit: call prescriptionStore.create() or prescriptionStore.update()
    -->
    <el-empty description="新建处方 — 学生待实现" />
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
const route = useRoute()
const isEdit = computed(() => route.name === 'PrescriptionEdit')
</script>
<style scoped>.page { max-width: 1000px; }</style>
