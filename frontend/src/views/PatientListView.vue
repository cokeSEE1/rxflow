<template>
  <div class="page">
    <div class="page-header">
      <h2>患者管理</h2>
      <el-button type="primary" @click="showCreateDialog = true">新增患者</el-button>
    </div>
    <!-- TODO: student - implement patient CRUD page
         Filters: name, phone
         Table: name, gender, age, phone, address, allergy (red), created time
         Actions: edit (dialog), delete (confirm), view prescriptions
         Create/Edit dialog form:
           - name (required), gender, age
           - phone (required, regex validate), address (required)
           - idCard (optional, regex validate)
           - allergyHistory (important, red "required" hint)
         Import: import { usePatientStore } from '@/stores/patient'
         Call patientStore.fetchList() on mount
    -->
    <el-empty description="患者管理 — 学生待实现" />
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
const showCreateDialog = ref(false)
</script>
<style scoped>
.page { max-width: 1400px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
</style>
