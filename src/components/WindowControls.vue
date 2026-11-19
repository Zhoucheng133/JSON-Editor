<template>
  <!-- macOS 使用系统红绿灯按钮，这里只负责 Windows / Linux 的自绘按钮 -->
  <div
    v-if="isTauri && !isMac"
    class="fixed right-0 top-0 z-50 flex items-stretch"
    @dblclick.stop
  >
    <button
      class="flex h-10 w-11 items-center justify-center text-slate-500 transition-colors hover:bg-slate-900/6 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-100/10 dark:hover:text-slate-200"
      :title="t('window.minimize')"
      :aria-label="t('window.minimize')"
      @click="minimize"
    >
      <i class="fa-solid fa-minus text-[11px]"></i>
    </button>
    <button
      class="flex h-10 w-11 items-center justify-center text-slate-500 transition-colors hover:bg-slate-900/6 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-100/10 dark:hover:text-slate-200"
      :title="maximized ? t('window.restore') : t('window.maximize')"
      :aria-label="maximized ? t('window.restore') : t('window.maximize')"
      @click="toggleMaximize"
    >
      <i class="fa-solid text-[11px]" :class="maximized ? 'fa-window-restore' : 'fa-window-maximize'"></i>
    </button>
    <button
      class="flex h-10 w-11 items-center justify-center text-slate-500 transition-colors hover:bg-red-500 hover:text-white dark:text-slate-400"
      :title="t('window.close')"
      :aria-label="t('window.close')"
      @click="close"
    >
      <i class="fa-solid fa-xmark text-[13px]"></i>
    </button>
  </div>
</template>

<script lang="ts" setup>
import type { Window as TauriWindow } from '@tauri-apps/api/window';
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

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
