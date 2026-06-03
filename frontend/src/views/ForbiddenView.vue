<template>
  <div class="error-page">
    <h1>403</h1>
    <p>抱歉，您没有权限访问此页面</p>
    <el-button type="primary" @click="$router.push('/')">返回工作台</el-button>
  </div>
</template>
<style scoped>
.error-page { text-align: center; padding: 80px 0; }
.error-page h1 { font-size: 64px; color: #e6a23c; }
.error-page p { font-size: 16px; color: #909399; margin: 16px 0 32px; }
</style>
