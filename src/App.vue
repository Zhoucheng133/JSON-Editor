<template>
  <i class="fa-solid fa-house"></i>
</template>

<script lang="ts" setup>
import { getCurrentWindow } from '@tauri-apps/api/window';
import { onMounted } from 'vue';
onMounted(async ()=>{
  const appWindow = getCurrentWindow()
  appWindow.show();
})
</script>