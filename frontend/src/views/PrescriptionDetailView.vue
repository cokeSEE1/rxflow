<template>
  <div class="page">
    <h2>处方详情</h2>
    <!-- TODO: student - implement prescription detail + review page
         Sections:
         1. Basic info card (prescriptionNo, status, creator, create time)
         2. Patient info card (name, gender, age, phone, address, allergy RED)
         3. Diagnosis section
         4. Drug items table
         5. Status timeline (el-timeline): created->submitted->approved/rejected->picked_up->delivered->received
            Each node: operator, time, detail. Rejection shown in red.
         6. Review actions (only for doctor + status=pending):
            - "Approve" button (green, confirm dialog)
            - "Reject" button (red, opens form):
              - reject type: serious/normal/suggestion
              - reject reason: required >=10 chars, template library
              - Drug item annotation (inline per-row remarks)
         7. Modification diff view (for resubmitted prescriptions):
            - Side-by-side: original rejected vs modified, changed fields highlighted green
         8. Delivery info (visible when approved/delivering/received):
            - Courier name, phone (masked), tracking number, address, delivery proof photo
         Call prescriptionStore.fetchDetail(id) on mount
    -->
    <el-empty description="处方详情 — 学生待实现" />
  </div>
</template>
<style scoped>.page { max-width: 1200px; }</style>
