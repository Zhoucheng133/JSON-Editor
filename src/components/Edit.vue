<template>
  <div
    class="relative flex h-screen w-screen flex-col overflow-hidden bg-[#f6f7f9] text-slate-800"
  >
    <!-- 标题栏（窗口拖拽区域） -->
    <header
      data-tauri-drag-region="deep"
      class="relative z-20 flex h-10 shrink-0 items-center gap-2 border-b border-slate-200 bg-white"
      :class="[leftPad, rightPad]"
    >
      <!-- 文件信息 -->
      <div class="flex min-w-0 flex-1 items-center gap-2">
        <div
          class="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-100"
        >
          <i class="fa-solid fa-file-code text-[10px]"></i>
        </div>
        <span class="max-w-60 shrink-0 truncate text-[12px] font-medium text-slate-800">
          {{ name || '未命名' }}
        </span>
        <span
          v-if="dirty"
          class="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400"
          title="有未保存的修改"
        ></span>
        <span
          class="hidden min-w-0 truncate font-mono text-[11px] text-slate-400 lg:block"
          :title="path"
        >
          {{ path }}
        </span>
      </div>

      <!-- 与窗口控制按钮之间的分隔线 -->
      <div v-if="isTauri && !isMac" class="h-4 w-px shrink-0 bg-slate-200"></div>
    </header>

    <!-- 工具栏 -->
    <div
      class="relative z-10 flex h-12 shrink-0 items-center gap-3 border-b border-slate-200 bg-white/90 px-3 backdrop-blur"
    >
      <!-- 编辑方式切换 -->
      <div class="flex shrink-0 items-center gap-0.5 rounded-lg bg-slate-100 p-0.5">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] font-medium transition"
          :class="
            mode === tab.id
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          "
          @click="mode = tab.id"
        >
          <i class="fa-solid text-[11px]" :class="tab.icon"></i>
          {{ tab.label }}
        </button>
      </div>

      <!-- 操作按钮 -->
      <div class="ml-auto flex shrink-0 items-center gap-1">
        <button
          class="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent"
          title="撤销 (⌘Z)"
          :disabled="!canUndo"
          @click="undo"
        >
          <i class="fa-solid fa-rotate-left text-[13px]"></i>
        </button>
        <button
          class="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent"
          title="恢复 (⇧⌘Z)"
          :disabled="!canRedo"
          @click="redo"
        >
          <i class="fa-solid fa-rotate-right text-[13px]"></i>
        </button>
        <button
          class="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          title="格式化"
          @click="format"
        >
          <i class="fa-solid fa-indent text-[13px]"></i>
        </button>

        <div class="mx-1 h-5 w-px bg-slate-200"></div>

        <button
          class="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[12px] font-semibold transition disabled:cursor-not-allowed"
          :class="
            saving || !dirty
              ? 'bg-slate-100 text-slate-400'
              : 'bg-linear-to-r from-amber-400 to-amber-500 text-white shadow-sm shadow-amber-500/20 hover:brightness-105'
          "
          :disabled="saving || !dirty"
          title="保存 (⌘S)"
          @click="save"
        >
          <i class="fa-solid text-[11px]" :class="saving ? 'fa-spinner animate-spin' : 'fa-floppy-disk'"></i>
          保存
        </button>
        <button
          class="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          title="关闭文件"
          @click="requestClose"
        >
          <i class="fa-solid fa-xmark text-[14px]"></i>
        </button>
      </div>
    </div>

    <!-- 编辑区 -->
    <main data-tauri-drag-region="false" class="relative min-h-0 flex-1">
      <Tree v-if="mode === 'tree'" @request-raw="mode = 'raw'" />
      <Table
        v-else-if="mode === 'table'"
        @request-raw="mode = 'raw'"
        @request-tree="mode = 'tree'"
      />
      <Raw v-else />
    </main>

    <!-- 提示 -->
    <Transition name="toast">
      <div
        v-if="toastState"
        class="pointer-events-none fixed bottom-6 left-1/2 z-40 -translate-x-1/2"
      >
        <div
          class="flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium shadow-lg"
          :class="
            toastState.type === 'error'
              ? 'border-red-200 bg-red-50 text-red-600'
              : toastState.type === 'info'
                ? 'border-slate-200 bg-white text-slate-600'
                : 'border-amber-200 bg-amber-50 text-amber-700'
          "
        >
          <i
            class="fa-solid text-[11px]"
            :class="
              toastState.type === 'error'
                ? 'fa-circle-exclamation'
                : toastState.type === 'info'
                  ? 'fa-circle-info'
                  : 'fa-circle-check'
            "
          ></i>
          {{ toastState.message }}
        </div>
      </div>
    </Transition>
  </div>
</template>

<script lang="ts" setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import useStore from '../store/index.ts';
import { parseJson, stringifyJson } from '../utils/json.ts';
import Tree from './edit_components/Tree.vue';
import Table from './edit_components/Table.vue';
import Raw from './edit_components/Raw.vue';

const store = useStore();
const { path, name, content, dirty, canUndo, canRedo } = storeToRefs(store);
const { commit, undo, redo, markSaved, closeFile } = store;

const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
const isMac = /Mac|iPhone|iPad/.test(navigator.userAgent);
// macOS 让开左上角红绿灯，Windows / Linux 让开右上角自绘按钮
const leftPad = isTauri && isMac ? 'pl-[78px]' : 'pl-3';
const rightPad = isTauri && !isMac ? 'pr-[140px]' : 'pr-3';

const tabs = [
  { id: 'tree', label: '树状图', icon: 'fa-sitemap' },
  { id: 'table', label: '表格', icon: 'fa-table' },
  { id: 'raw', label: '原始文件', icon: 'fa-file-lines' },
] as const;

const mode = ref<(typeof tabs)[number]['id']>('tree');
const saving = ref(false);

/* ---------------- 提示 ---------------- */
const toastState = ref<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
let toastTimer: ReturnType<typeof setTimeout> | undefined;

function toast(message: string, type: 'success' | 'error' | 'info' = 'success') {
  toastState.value = { message, type };
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toastState.value = null), 2600);
}

/* ---------------- 操作 ---------------- */
async function save() {
  if (!isTauri) {
    toast('浏览器预览模式暂不支持保存', 'error');
    return;
  }
  if (!path.value) return;

  const parsed = parseJson(content.value);
  if (!parsed.ok) {
    toast(`JSON 格式错误，无法保存：${parsed.error}`, 'error');
    return;
  }

  saving.value = true;
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('save_json_file', { path: path.value, content: content.value });
    markSaved();
    toast(`已保存到 ${name.value}`);
  } catch (error) {
    toast(typeof error === 'string' ? error : ((error as Error)?.message ?? '保存失败'), 'error');
  } finally {
    saving.value = false;
  }
}

function format() {
  const parsed = parseJson(content.value);
  if (!parsed.ok) {
    toast(`无法格式化：${parsed.error}`, 'error');
    return;
  }
  const next = stringifyJson(parsed.value);
  if (next === content.value) {
    toast('内容已是格式化状态', 'info');
    return;
  }
  commit(next);
  toast('已格式化');
}

async function confirmDiscard(message: string) {
  const { ask } = await import('@tauri-apps/plugin-dialog');
  return ask(message, { title: '未保存的修改', kind: 'warning' });
}

async function requestClose() {
  if (dirty.value && isTauri && !(await confirmDiscard('有未保存的修改，确定要关闭吗？'))) return;
  closeFile();
}

/* ---------------- 快捷键 ---------------- */
function onKeydown(event: KeyboardEvent) {
  if (!(event.metaKey || event.ctrlKey)) return;
  const key = event.key.toLowerCase();

  if (key === 's') {
    event.preventDefault();
    save();
  } else if (key === 'z' && !event.shiftKey) {
    event.preventDefault();
    undo();
  } else if ((key === 'z' && event.shiftKey) || key === 'y') {
    event.preventDefault();
    redo();
  }
}

let unlistenClose: (() => void) | undefined;

onMounted(async () => {
  window.addEventListener('keydown', onKeydown);
  if (!isTauri) return;

  const { getCurrentWindow } = await import('@tauri-apps/api/window');
  const appWindow = getCurrentWindow();
  unlistenClose = await appWindow.onCloseRequested(async (event) => {
    if (!dirty.value) return;
    event.preventDefault();
    if (await confirmDiscard('有未保存的修改，确定要退出吗？')) {
      await appWindow.destroy();
    }
  });
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown);
  unlistenClose?.();
  if (toastTimer) clearTimeout(toastTimer);
});
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.2s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
}
</style>
