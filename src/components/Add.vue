<template>
  <div
    data-tauri-drag-region="deep"
    class="relative flex h-screen w-screen flex-col overflow-hidden bg-[#f6f7f9] text-slate-800"
  >
    <!-- 背景氛围 -->
    <div
      class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_-10%,rgba(16,185,129,0.10),transparent_45%),radial-gradient(circle_at_88%_8%,rgba(56,189,248,0.08),transparent_42%)]"
    ></div>
    <div
      class="pointer-events-none absolute inset-0 opacity-[0.035]"
      style="
        background-image: linear-gradient(to right, #0f172a 1px, transparent 1px),
          linear-gradient(to bottom, #0f172a 1px, transparent 1px);
        background-size: 36px 36px;
      "
    ></div>

    <main class="relative z-10 flex flex-1 items-center justify-center px-6 pb-10">
      <section class="w-full max-w-[560px]">
        <div class="mb-7 text-center">
          <h1 class="text-2xl font-semibold tracking-tight text-slate-900">打开 JSON 文件</h1>
          <p class="mt-2 text-sm text-slate-500">拖拽文件到下方，或从本地选择，即可开始编辑</p>
        </div>

        <Transition name="fade-slide" mode="out-in">
          <!-- 已选择文件 -->
          <div
            v-if="picked"
            key="preview"
            data-tauri-drag-region="false"
            class="pop-in rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xl shadow-slate-900/5"
          >
            <div class="flex items-start gap-3">
              <div
                class="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-100"
              >
                <i class="fa-solid fa-file-code"></i>
              </div>
              <div class="min-w-0 flex-1 pt-0.5">
                <p class="truncate text-sm font-medium text-slate-900" :title="picked.path">
                  {{ picked.name }}
                </p>
                <p class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500">
                  <span>{{ formatSize(picked.size) }}</span>
                  <span class="h-0.5 w-0.5 rounded-full bg-slate-300"></span>
                  <span>{{ picked.summary.detail }}</span>
                </p>
              </div>
              <span
                class="mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700"
              >
                <i class="fa-solid fa-circle-check"></i>
                有效
              </span>
              <button
                class="-mr-1 -mt-1 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="移除文件"
                @click.stop="resetPicked"
              >
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div class="relative mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
              <div class="flex items-center gap-1.5 border-b border-slate-200 px-3 py-2">
                <span class="h-2 w-2 rounded-full bg-red-300"></span>
                <span class="h-2 w-2 rounded-full bg-amber-300"></span>
                <span class="h-2 w-2 rounded-full bg-emerald-300"></span>
                <span class="ml-2 truncate font-mono text-[10px] text-slate-400">
                  {{ picked.path }}
                </span>
              </div>
              <pre
                class="max-h-40 overflow-hidden p-3 font-mono text-[11px] leading-5 text-slate-600"
              ><code>{{ prettyPreview }}</code></pre>
              <div
                class="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white to-transparent"
              ></div>
            </div>

            <div class="mt-4 flex gap-2">
              <button
                class="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:brightness-105 active:scale-[0.99]"
                @click="startEditing"
              >
                开始编辑
                <i class="fa-solid fa-arrow-right text-xs"></i>
              </button>
              <button
                class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                @click="pickFile"
              >
                <i class="fa-solid fa-rotate-right text-xs"></i>
                更换文件
              </button>
            </div>
          </div>

          <!-- 拖拽上传区 -->
          <div
            v-else
            key="dropzone"
            data-tauri-drag-region="false"
            role="button"
            tabindex="0"
            class="group relative flex min-h-[300px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed px-8 py-10 text-center outline-none transition-all duration-300 focus-visible:border-emerald-400 focus-visible:ring-2 focus-visible:ring-emerald-400/20"
            :class="[
              isDragging
                ? 'scale-[1.01] border-emerald-400 bg-emerald-50/70 shadow-[0_20px_60px_-25px_rgba(16,185,129,0.45)]'
                : 'border-slate-300 bg-white/70 hover:border-emerald-300 hover:bg-white',
              loading ? 'cursor-wait' : '',
            ]"
            @click="pickFile"
            @keydown.enter.prevent="pickFile"
            @keydown.space.prevent="pickFile"
            @dragenter="onDragEnter"
            @dragover="onDragOver"
            @dragleave="onDragLeave"
            @drop="onDrop"
          >
            <div
              class="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"
            ></div>

            <div
              class="relative mb-5 grid h-[74px] w-[74px] place-items-center rounded-2xl border border-slate-200 bg-white shadow-sm transition-transform duration-300 group-hover:-translate-y-0.5"
              :class="isDragging ? 'scale-105 border-emerald-300' : ''"
            >
              <div
                v-if="isDragging"
                class="absolute inset-0 animate-ping rounded-2xl bg-emerald-400/10"
              ></div>
              <i
                v-if="loading"
                class="fa-solid fa-spinner animate-spin text-2xl text-emerald-500"
              ></i>
              <i
                v-else-if="isDragging"
                class="fa-solid fa-file-arrow-down relative text-2xl text-emerald-500"
              ></i>
              <i
                v-else
                class="fa-solid fa-cloud-arrow-up text-2xl text-slate-400 transition-colors group-hover:text-emerald-500"
              ></i>
            </div>

            <p class="text-[15px] font-medium text-slate-800">
              {{
                loading ? '正在读取文件…' : isDragging ? '松开即可添加文件' : '拖拽 JSON 文件到此处'
              }}
            </p>
            <p class="mt-1.5 text-xs text-slate-500">
              <template v-if="loading">正在校验 JSON 内容，请稍候</template>
              <template v-else>
                或
                <span class="text-emerald-600 underline decoration-emerald-300 underline-offset-4">
                  点击浏览本地文件
                </span>
              </template>
            </p>

            <div class="mt-6 flex items-center gap-2 text-[11px] text-slate-400">
              <span class="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 font-mono">
                {{ shortcutLabel }}
              </span>
              <span>快速打开</span>
            </div>
          </div>
        </Transition>

        <Transition name="fade-slide">
          <div
            v-if="error"
            class="mt-3 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-600"
            role="alert"
          >
            <i class="fa-solid fa-triangle-exclamation mt-0.5"></i>
            <p class="flex-1 leading-relaxed">{{ error }}</p>
            <button
              class="-mr-1 rounded p-0.5 text-red-400 transition hover:text-red-600"
              aria-label="关闭提示"
              @click="clearError"
            >
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
        </Transition>

        <p class="mt-4 text-center text-[11px] text-slate-400">
          支持 .json 文件 · 单文件最大 {{ MAX_SIZE_MB }} MB
        </p>
      </section>
    </main>

    <!-- 拖拽到窗口任意位置时的提示 -->
    <Transition name="fade">
      <div
        v-if="isDragging"
        class="pointer-events-none fixed inset-2 z-30 rounded-2xl border-2 border-emerald-400/70 bg-emerald-400/[0.06] shadow-[inset_0_0_80px_rgba(16,185,129,0.10)]"
      >
        <div
          class="absolute left-1/2 top-6 flex -translate-x-1/2 items-center gap-2 rounded-full border border-emerald-200 bg-white/95 px-4 py-1.5 text-xs font-medium text-emerald-600 shadow-xl"
        >
          <i class="fa-solid fa-arrow-down"></i>
          松开即可添加文件
        </div>
      </div>
    </Transition>

    <input
      ref="fileInput"
      type="file"
      accept=".json,application/json"
      class="hidden"
      @change="onInputChange"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import useStore from '../store/index.ts';

const store = useStore();

const MAX_SIZE = 10 * 1024 * 1024;
const MAX_SIZE_MB = MAX_SIZE / 1024 / 1024;
const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

type JsonSummary = {
  kind: 'object' | 'array' | 'value';
  detail: string;
};

type PickedFile = {
  path: string;
  name: string;
  size: number;
  content: string;
  summary: JsonSummary;
};

const fileInput = ref<HTMLInputElement | null>(null);
const picked = ref<PickedFile | null>(null);
const isDragging = ref(false);
const loading = ref(false);
const error = ref('');

const shortcutLabel = /Mac|iPhone|iPad/.test(navigator.userAgent) ? '⌘ O' : 'Ctrl O';

let dragDepth = 0;
let errorTimer: ReturnType<typeof setTimeout> | undefined;
let unlistenDragDrop: (() => void) | undefined;
let disposed = false;

const prettyPreview = computed(() => {
  if (!picked.value) return '';
  try {
    return JSON.stringify(JSON.parse(picked.value.content), null, 2).split('\n').slice(0, 14).join('\n');
  } catch {
    return '';
  }
});

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function baseName(path: string) {
  return path.split(/[\\/]/).pop() || path;
}

function summarise(value: unknown): JsonSummary {
  if (Array.isArray(value)) {
    return { kind: 'array', detail: `数组 · ${value.length} 项` };
  }
  if (value !== null && typeof value === 'object') {
    return { kind: 'object', detail: `对象 · ${Object.keys(value).length} 个键` };
  }
  return { kind: 'value', detail: typeof value === 'string' ? '字符串' : String(value) };
}

function setError(message: string) {
  error.value = message;
  if (errorTimer) clearTimeout(errorTimer);
  errorTimer = setTimeout(() => (error.value = ''), 6000);
}

function clearError() {
  error.value = '';
  if (errorTimer) clearTimeout(errorTimer);
}

function resetPicked() {
  picked.value = null;
  clearError();
}

/** 校验内容并进入待确认状态 */
async function acceptText(name: string, size: number, content: string, path = name) {
  if (!/\.json$/i.test(name)) {
    setError('仅支持 .json 文件，请重新选择');
    return;
  }
  if (size > MAX_SIZE) {
    setError(`文件大小不能超过 ${MAX_SIZE_MB} MB`);
    return;
  }

  const raw = content.replace(/^\uFEFF/, '').trim();
  if (!raw) {
    setError('文件内容为空');
    return;
  }

  try {
    const parsed = JSON.parse(raw);
    picked.value = {
      path,
      name,
      size: new Blob([content]).size,
      content,
      summary: summarise(parsed),
    };
    clearError();
  } catch (e) {
    setError(`JSON 格式错误：${(e as Error).message}`);
  }
}

/** 通过 Tauri 读取本地文件 */
async function loadFromPath(path: string) {
  if (!/\.json$/i.test(path)) {
    setError('仅支持 .json 文件，请重新选择');
    return;
  }

  loading.value = true;
  clearError();
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    const content = await invoke<string>('read_json_file', { path });
    await acceptText(baseName(path), new Blob([content]).size, content, path);
  } catch (e) {
    setError(typeof e === 'string' ? e : (e as Error)?.message || '读取文件失败');
  } finally {
    loading.value = false;
  }
}

/** 浏览器环境：通过 File API 读取 */
async function handleBrowserFile(file: File) {
  if (!/\.json$/i.test(file.name)) {
    setError('仅支持 .json 文件，请重新选择');
    return;
  }
  if (file.size > MAX_SIZE) {
    setError(`文件大小不能超过 ${MAX_SIZE_MB} MB`);
    return;
  }

  loading.value = true;
  clearError();
  try {
    const text = await file.text();
    await acceptText(file.name, file.size, text, file.name);
  } catch {
    setError('读取文件失败，请重试');
  } finally {
    loading.value = false;
  }
}

async function pickFile() {
  if (loading.value) return;
  clearError();

  if (isTauri) {
    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const selected = await open({
        multiple: false,
        directory: false,
        filters: [{ name: 'JSON 文件', extensions: ['json'] }],
      });
      if (typeof selected === 'string') {
        await loadFromPath(selected);
      }
    } catch {
      setError('无法打开文件选择器');
    }
  } else {
    fileInput.value?.click();
  }
}

function onInputChange(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) handleBrowserFile(file);
  input.value = '';
}

/* ---------- 浏览器 HTML5 拖拽 ---------- */
function onDragEnter(e: DragEvent) {
  if (isTauri) return;
  e.preventDefault();
  dragDepth += 1;
  isDragging.value = true;
}

function onDragOver(e: DragEvent) {
  if (isTauri) return;
  e.preventDefault();
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
}

function onDragLeave(e: DragEvent) {
  if (isTauri) return;
  e.preventDefault();
  dragDepth = Math.max(0, dragDepth - 1);
  if (dragDepth === 0) isDragging.value = false;
}

function onDrop(e: DragEvent) {
  if (isTauri) return;  
  e.preventDefault();
  dragDepth = 0;
  isDragging.value = false;

  const file = e.dataTransfer?.files?.[0];
  if (file) {
    handleBrowserFile(file);
  } else {
    setError('未检测到文件，请重试');
  }
}

function startEditing() {
  if (!picked.value) return;
  store.openFile(picked.value.path, picked.value.name, picked.value.content);
}

function onKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'o') {
    e.preventDefault();
    pickFile();
    return;
  }
  if (e.key === 'Escape' && picked.value) {
    resetPicked();
  }
}

onMounted(async () => {
  window.addEventListener('keydown', onKeydown);

  if (!isTauri) return;

  try {
    const { getCurrentWebview } = await import('@tauri-apps/api/webview');
    const unlisten = await getCurrentWebview().onDragDropEvent((event) => {
      const payload = event.payload;
      if (payload.type === 'enter' || payload.type === 'over') {
        isDragging.value = true;
      } else if (payload.type === 'leave') {
        isDragging.value = false;
      } else if (payload.type === 'drop') {
        isDragging.value = false;
        const target = payload.paths.find((p) => /\.json$/i.test(p));
        if (target) {
          loadFromPath(target);
        } else if (payload.paths.length > 0) {
          setError('仅支持拖入 .json 文件');
        }
      }
    });

    if (disposed) {
      unlisten();
    } else {
      unlistenDragDrop = unlisten;
    }
  } catch {
    // 非 Tauri 运行环境或事件不可用时静默降级
  }
});

onBeforeUnmount(() => {
  disposed = true;
  window.removeEventListener('keydown', onKeydown);
  unlistenDragDrop?.();
  if (errorTimer) clearTimeout(errorTimer);
});
</script>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.pop-in {
  animation: pop-in 0.28s cubic-bezier(0.2, 0.9, 0.3, 1.2) both;
}

@keyframes pop-in {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
