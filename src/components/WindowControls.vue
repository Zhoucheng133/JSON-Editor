<template>
  <!-- macOS 使用系统红绿灯按钮，这里只负责 Windows / Linux 的自绘按钮 -->
  <div
    v-if="isTauri && !isMac"
    class="fixed right-0 top-0 z-50 flex items-stretch"
    @dblclick.stop
  >
    <button
      class="flex h-10 w-11 items-center justify-center text-slate-500 transition-colors hover:bg-slate-900/6 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-100/10 dark:hover:text-slate-200"
      title="最小化"
      aria-label="最小化"
      @click="minimize"
    >
      <i class="fa-solid fa-minus text-[11px]"></i>
    </button>
    <button
      class="flex h-10 w-11 items-center justify-center text-slate-500 transition-colors hover:bg-slate-900/6 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-100/10 dark:hover:text-slate-200"
      :title="maximized ? '向下还原' : '最大化'"
      :aria-label="maximized ? '向下还原' : '最大化'"
      @click="toggleMaximize"
    >
      <i class="fa-solid text-[11px]" :class="maximized ? 'fa-window-restore' : 'fa-window-maximize'"></i>
    </button>
    <button
      class="flex h-10 w-11 items-center justify-center text-slate-500 transition-colors hover:bg-red-500 hover:text-white dark:text-slate-400"
      title="关闭"
      aria-label="关闭"
      @click="close"
    >
      <i class="fa-solid fa-xmark text-[13px]"></i>
    </button>
  </div>
</template>

<script lang="ts" setup>
import type { Window as TauriWindow } from '@tauri-apps/api/window';
import { onBeforeUnmount, onMounted, ref } from 'vue';

const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
const isMac = /Mac|iPhone|iPad/.test(navigator.userAgent);

const maximized = ref(false);
let appWindow: TauriWindow | null = null;
let unlistenResized: (() => void) | undefined;

async function refreshMaximized() {
  if (!appWindow) return;
  maximized.value = await appWindow.isMaximized();
}

function minimize() {
  appWindow?.minimize();
}

function toggleMaximize() {
  appWindow?.toggleMaximize();
}

function close() {
  appWindow?.close();
}

onMounted(async () => {
  if (!isTauri || isMac) return;

  const { getCurrentWindow } = await import('@tauri-apps/api/window');
  appWindow = getCurrentWindow();

  await refreshMaximized();
  unlistenResized = await appWindow.onResized(() => refreshMaximized());
});

onBeforeUnmount(() => {
  unlistenResized?.();
});
</script>
