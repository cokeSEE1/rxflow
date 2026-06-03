<template>
  <el-menu :default-active="route.path" router :collapse="false" background-color="#304156" text-color="#bfcbd9" active-text-color="#409eff">
    <el-menu-item index="/">
      <el-icon><HomeFilled /></el-icon>
      <span>工作台</span>
    </el-menu-item>

    <el-menu-item v-if="can('assistant','doctor')" index="/patients">
      <el-icon><User /></el-icon>
      <span>患者管理</span>
    </el-menu-item>

    <template v-if="can('assistant','doctor','patient')">
      <el-sub-menu index="rx">
        <template #title>
          <el-icon><Document /></el-icon>
          <span>处方管理</span>
        </template>
        <el-menu-item index="/prescriptions">处方列表</el-menu-item>
        <el-menu-item v-if="can('assistant')" index="/prescriptions/new">新建处方</el-menu-item>
      </el-sub-menu>
    </template>

    <el-menu-item v-if="can('courier')" index="/delivery">
      <el-icon><Van /></el-icon>
      <span>配送管理</span>
    </el-menu-item>
  </el-menu>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { usePermission } from '@/composables/usePermission'
const route = useRoute()
const { can } = usePermission()
</script>
