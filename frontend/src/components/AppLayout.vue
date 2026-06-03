<template>
  <div class="app-layout">
    <aside class="sidebar">
      <SidebarMenu />
    </aside>
    <div class="main-area">
      <HeaderBar />
      <main class="content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import SidebarMenu from './SidebarMenu.vue'
import HeaderBar from './HeaderBar.vue'
</script>

<style scoped>
.app-layout { display: flex; height: 100vh; }
.sidebar { width: 220px; background: #304156; overflow-y: auto; flex-shrink: 0; }
.main-area { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.content { flex: 1; overflow-y: auto; padding: 24px; background: #f5f7fa; }
</style>
