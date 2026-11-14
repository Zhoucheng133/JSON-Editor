<template>
  <WindowControls />

  <Transition name="page" mode="out-in">
    <Add v-if="path.length == 0" key="add" />
    <Edit v-else key="edit" />
  </Transition>
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

<style scoped>
.page-enter-active,
.page-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.22s cubic-bezier(0.22, 1, 0.36, 1);
}

.page-enter-from {
  opacity: 0;
  transform: translateY(12px) scale(0.995);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.995);
}
</style>
