<template>
  <div class="page">
    <h2>配送管理</h2>
    <!-- TODO: student - implement courier delivery management
         Filters: status (to pickup/delivering/received/returned)
         Table: prescriptionNo, patient name, address, phone (clickable tel: link), drug count, status
         Actions per status:
           - approved -> "Pick up" button
           - delivering -> "Deliver" button + "Report exception" button
         Deliver flow:
           1. Show drug checklist (drug name x qty)
           2. Upload photo (camera) or enter SMS code
           3. Confirm -> status -> received
         Exception flow:
           1. Select type: patient_reject/wrong_address/unreachable/damaged
           2. If damaged -> upload photo required
           3. Fill description -> submit -> status -> returned
         Import: import { usePrescriptionStore } from '@/stores/prescription'
    -->
    <el-empty description="配送管理 — 学生待实现" />
  </div>
</template>
<style scoped>.page { max-width: 1400px; }</style>
