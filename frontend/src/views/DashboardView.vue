<template>
  <div class="page">
    <h2>工作台</h2>
    <!-- TODO: student - implement role-dynamic dashboard
         Assistant: stat cards (draft/pending/rejected/approved) + rejected list + today's prescriptions
         Doctor: stat cards (pending/today reviewed/rejected) + sorted pending list with overdue/urgent flags
         Courier: stat cards (to pickup/delivering/delivered) + task cards + returned list
         Patient: my prescriptions status card + delivering with ETA + history link
         Use: import { getStats } from '@/api/dashboard'
              import { usePermission } from '@/composables/usePermission'
    -->
    <el-empty description="工作台 — 学生待实现" />
  </div>
</template>
<style scoped>.page { max-width: 1400px; }</style>
