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
.sidebar { width: 220px; background: linear-gradient(180deg, var(--teal-900) 0%, #0d5c56 40%, var(--teal-700) 100%); overflow-y: auto; flex-shrink: 0; }
.main-area { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.content { flex: 1; overflow-y: auto; padding: 24px; background: var(--warm-50); }
</style>
