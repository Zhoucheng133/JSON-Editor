<template>
  <h1 class="text-3xl font-bold underline">
    Hello world!
  </h1>
</template>

<script lang="ts" setup>
import { getCurrentWindow } from '@tauri-apps/api/window';
import { onMounted } from 'vue';
onMounted(async ()=>{
  const appWindow = getCurrentWindow()
  appWindow.show();
})
</script>