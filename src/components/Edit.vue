<template>
  <div
    class="relative flex h-screen w-screen flex-col overflow-hidden bg-[#f6f7f9] text-slate-800 dark:bg-slate-950 dark:text-slate-200"
  >
    <!-- 标题栏（窗口拖拽区域） -->
    <header
      data-tauri-drag-region="deep"
      class="relative z-20 flex h-10 shrink-0 items-center gap-2 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
      :class="[leftPad, rightPad]"
    >
      <!-- 文件信息 -->
      <div class="flex min-w-0 flex-1 items-center gap-2">
        <div
          class="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20"
        >
          <i class="fa-solid fa-file-code text-[10px]"></i>
        </div>
        <span class="max-w-60 shrink-0 truncate text-[12px] font-medium text-slate-800 dark:text-slate-100">
          {{ name || '未命名' }}
        </span>
        <span
          v-if="dirty"
          class="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400"
          title="有未保存的修改"
        ></span>
        <span
          class="hidden min-w-0 truncate font-mono text-[11px] text-slate-400 lg:block dark:text-slate-500"
          :title="path"
        >
          {{ path }}
        </span>
      </div>

      <!-- 与窗口控制按钮之间的分隔线 -->
      <div v-if="isTauri && !isMac" class="h-4 w-px shrink-0 bg-slate-200 dark:bg-slate-700"></div>
    </header>

    <!-- 工具栏 -->
    <div
      class="relative z-10 flex h-12 shrink-0 items-center gap-3 border-b border-slate-200 bg-white/90 px-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90"
    >
      <!-- 编辑方式切换 -->
      <div class="flex shrink-0 items-center gap-0.5 rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] font-medium transition"
          :class="
            mode === tab.id
              ? 'bg-white text-slate-800 shadow-sm dark:bg-slate-700 dark:text-slate-100'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
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
          class="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 dark:disabled:hover:bg-transparent"
          title="撤销 (⌘Z)"
          :disabled="!canUndo"
          @click="undo"
        >
          <i class="fa-solid fa-rotate-left text-[13px]"></i>
        </button>
        <button
          class="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 dark:disabled:hover:bg-transparent"
          title="恢复 (⇧⌘Z)"
          :disabled="!canRedo"
          @click="redo"
        >
          <i class="fa-solid fa-rotate-right text-[13px]"></i>
        </button>
        <button
          class="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          :title="`搜索 (${isMac ? '⌘F' : 'Ctrl+F'})`"
          @click="openSearch"
        >
          <i class="fa-solid fa-magnifying-glass text-[13px]"></i>
        </button>
        <button
          class="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          title="格式化"
          @click="format"
        >
          <i class="fa-solid fa-indent text-[13px]"></i>
        </button>

        <div class="mx-1 h-5 w-px bg-slate-200 dark:bg-slate-700"></div>

        <button
          class="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[12px] font-semibold transition disabled:cursor-not-allowed"
          :class="
            saving || !dirty
              ? 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
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
          class="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          title="关闭文件"
          @click="requestClose"
        >
          <i class="fa-solid fa-xmark text-[14px]"></i>
        </button>
      </div>
    </div>

    <!-- 编辑区 -->
    <main data-tauri-drag-region="false" class="relative min-h-0 flex-1">
      <Tree
        v-if="mode === 'tree'"
        :locate="locateRequest"
        :search="activeSearch"
        @request-raw="mode = 'raw'"
        @search-count="onSearchCount"
      />
      <Table
        v-else-if="mode === 'table'"
        :search="activeSearch"
        @request-raw="mode = 'raw'"
        @request-tree="mode = 'tree'"
        @locate="locateInTree"
        @notify="toast"
        @search-count="onSearchCount"
      />
      <Raw v-else :search="activeSearch" @search-count="onSearchCount" />

      <!-- 搜索框 -->
      <Transition name="find">
        <div
          v-if="searchOpen"
          class="absolute right-3 top-2 z-30 flex items-center gap-1 rounded-xl border border-slate-200 bg-white/95 px-2 py-1.5 shadow-lg shadow-slate-900/10 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95 dark:shadow-black/40"
        >
          <i class="fa-solid fa-magnifying-glass shrink-0 text-[11px] text-slate-400 dark:text-slate-500"></i>
          <input
            ref="searchInputEl"
            v-model="searchQuery"
            spellcheck="false"
            placeholder="搜索当前视图"
            class="w-52 bg-transparent text-[12px] text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-200 dark:placeholder:text-slate-500"
            @keydown.enter.prevent="stepSearch($event.shiftKey ? -1 : 1)"
            @keydown.esc.prevent="closeSearch"
          />
          <span
            class="min-w-12 shrink-0 text-right text-[11px] tabular-nums"
            :class="searchQuery && searchCount === 0 ? 'text-red-500 dark:text-red-400' : 'text-slate-400 dark:text-slate-500'"
          >
            {{ searchQuery ? `${searchCount === 0 ? 0 : searchIndex + 1}/${searchCount}` : '' }}
          </span>
          <button
            class="grid h-6 w-6 shrink-0 place-items-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200 dark:disabled:hover:bg-transparent"
            title="上一个 (⇧ Enter)"
            :disabled="searchCount === 0"
            @click="stepSearch(-1)"
          >
            <i class="fa-solid fa-chevron-up text-[10px]"></i>
          </button>
          <button
            class="grid h-6 w-6 shrink-0 place-items-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200 dark:disabled:hover:bg-transparent"
            title="下一个 (Enter)"
            :disabled="searchCount === 0"
            @click="stepSearch(1)"
          >
            <i class="fa-solid fa-chevron-down text-[10px]"></i>
          </button>
          <button
            class="grid h-6 w-6 shrink-0 place-items-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            title="关闭 (Esc)"
            @click="closeSearch"
          >
            <i class="fa-solid fa-xmark text-[11px]"></i>
          </button>
        </div>
      </Transition>
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
              ? 'border-red-200 bg-red-50 text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400'
              : toastState.type === 'info'
                ? 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
                : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300'
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
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import useStore from '../store/index.ts';
import { parseJson, stringifyJson, type JsonPath } from '../utils/json.ts';
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

/** 从表格跳转到树状图并定位到指定节点；token 用于重复定位时触发 watch */
const locateRequest = ref<{ path: JsonPath; token: number } | null>(null);
let locateToken = 0;

function locateInTree(path: JsonPath) {
  locateToken += 1;
  locateRequest.value = { path, token: locateToken };
  mode.value = 'tree';
}

/* ---------------- 搜索 ---------------- */
const searchOpen = ref(false);
const searchQuery = ref('');
const searchIndex = ref(0);
/** 当前视图中匹配到的数量，由子组件上报 */
const searchCount = ref(0);
const searchInputEl = ref<HTMLInputElement | null>(null);

/** 传给子视图的搜索状态；关闭搜索框时清空，避免继续高亮 */
const activeSearch = computed(() =>
  searchOpen.value ? { query: searchQuery.value, index: searchIndex.value } : null,
);

function openSearch() {
  searchOpen.value = true;
  nextTick(() => {
    searchInputEl.value?.focus();
    searchInputEl.value?.select();
  });
}

function closeSearch() {
  searchOpen.value = false;
}

function stepSearch(delta: number) {
  if (searchCount.value === 0) return;
  searchIndex.value = (searchIndex.value + delta + searchCount.value) % searchCount.value;
}

function onSearchCount(count: number) {
  searchCount.value = count;
  if (count === 0) searchIndex.value = 0;
  else if (searchIndex.value >= count) searchIndex.value = count - 1;
}

watch(searchQuery, () => {
  searchIndex.value = 0;
});

watch(mode, () => {
  searchCount.value = 0;
  searchIndex.value = 0;
});

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
  const parsed = parseJson(content.value);
  if (!parsed.ok) {
    toast(`JSON 格式错误，无法保存：${parsed.error}`, 'error');
    return;
  }

  if (!isTauri) {
    const fileName = name.value || 'data.json';
    const blob = new Blob([content.value], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    markSaved();
    toast(`已下载 ${fileName}`);
    return;
  }

  if (!path.value) return;

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
  if (event.key === 'Escape' && searchOpen.value) {
    closeSearch();
    return;
  }

  if (!(event.metaKey || event.ctrlKey)) return;
  const key = event.key.toLowerCase();

  if (key === 'f') {
    event.preventDefault();
    openSearch();
  } else if (key === 's') {
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

.find-enter-active,
.find-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}

.find-enter-from,
.find-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
