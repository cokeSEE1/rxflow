<template>
  <div class="error-page">
    <h1>404</h1>
    <p>页面不存在</p>
    <el-button type="primary" @click="$router.push('/')">返回工作台</el-button>
  </div>
</template>
<style scoped>
.error-page { text-align: center; padding: 80px 0; }
.error-page h1 { font-size: 64px; color: #909399; }
.error-page p { font-size: 16px; color: #909399; margin: 16px 0 32px; }
</style>
