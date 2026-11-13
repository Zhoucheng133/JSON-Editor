<template>
  <WindowControls />

  <Add v-if="path.length == 0" />
  <Edit v-else />
</template>

<script lang="ts" setup>
import { getCurrentWindow } from '@tauri-apps/api/window';
import { onMounted } from 'vue';
import store from './store';
import { storeToRefs } from 'pinia';
import Add from './components/Add.vue';
import Edit from './components/Edit.vue';
import WindowControls from './components/WindowControls.vue';

const { path } = storeToRefs(store());

const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

onMounted(async () => {
  // 窗口默认隐藏，等前端挂载完成后再显示，避免出现白屏闪烁
  if (!isTauri) return;
  await getCurrentWindow().show();
});
</script>
