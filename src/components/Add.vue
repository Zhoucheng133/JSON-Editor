<template>
  <div
    data-tauri-drag-region="deep"
    class="relative flex h-screen w-screen flex-col overflow-hidden bg-[#f6f7f9] text-slate-800 dark:bg-slate-950 dark:text-slate-200"
  >
    <!-- 背景氛围 -->
    <div
      class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_-10%,rgba(245,158,11,0.10),transparent_45%),radial-gradient(circle_at_88%_8%,rgba(251,191,36,0.06),transparent_42%)]"
    ></div>
    <div
      class="pointer-events-none absolute inset-0 text-slate-900 opacity-[0.035] dark:text-slate-100"
      style="
        background-image: linear-gradient(to right, currentColor 1px, transparent 1px),
          linear-gradient(to bottom, currentColor 1px, transparent 1px);
        background-size: 36px 36px;
      "
    ></div>

    <!-- 语言切换 -->
    <div
      data-tauri-drag-region="false"
      class="absolute top-4 z-20"
      :class="isTauri && !isMac ? 'right-37.5' : 'right-4'"
    >
      <button
        ref="langTrigger"
        type="button"
        class="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white/90 px-2.5 text-[12px] text-slate-700 shadow-sm outline-none backdrop-blur transition hover:border-slate-300 hover:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-900"
        :aria-label="t('add.lang.label')"
        @click.stop="toggleLangMenu"
      >
        <i class="fa-solid fa-globe text-[11px] text-slate-400 dark:text-slate-500"></i>
        <span>{{ locale === 'zh-CN' ? t('add.lang.zhCN') : t('add.lang.en') }}</span>
        <i class="fa-solid fa-chevron-down text-[9px] text-slate-400 dark:text-slate-500"></i>
      </button>
    </div>

    <main class="relative z-10 flex flex-1 items-center justify-center px-6 pb-10">
      <section class="w-full max-w-140">
        <div class="mb-7 text-center">
          <h1 class="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">{{ t('add.title') }}</h1>
          <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">{{ t('add.subtitle') }}</p>
        </div>

        <Transition name="fade-slide" mode="out-in">
          <!-- 已选择文件 -->
          <div
            v-if="picked"
            key="preview"
            data-tauri-drag-region="false"
            class="pop-in rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xl shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/30"
          >
            <div class="flex items-start gap-3">
              <div
                class="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20"
              >
                <i class="fa-solid fa-file-code"></i>
              </div>
              <div class="min-w-0 flex-1 pt-0.5">
                <p class="truncate text-sm font-medium text-slate-900 dark:text-slate-100" :title="picked.path">
                  {{ picked.name }}
                </p>
                <p class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <span>{{ formatSize(picked.size) }}</span>
                  <span class="h-0.5 w-0.5 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                  <span>{{ summaryLabel(picked.summary) }}</span>
                </p>
              </div>
              <span
                class="mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
              >
                <i class="fa-solid fa-circle-check"></i>
                {{ t('add.valid') }}
              </span>
              <button
                class="-mr-1 -mt-1 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                :aria-label="t('add.removeFile')"
                @click.stop="resetPicked"
              >
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div class="relative mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/60">
              <div class="flex items-center gap-1.5 border-b border-slate-200 px-3 py-2 dark:border-slate-800">
                <span class="h-2 w-2 rounded-full bg-red-300"></span>
                <span class="h-2 w-2 rounded-full bg-amber-300"></span>
                <span class="h-2 w-2 rounded-full bg-emerald-300"></span>
                <span class="ml-2 truncate font-mono text-[10px] text-slate-400 dark:text-slate-500">
                  {{ picked.path }}
                </span>
              </div>
              <pre
                class="max-h-40 overflow-hidden p-3 font-mono text-[11px] leading-5 text-slate-600 dark:text-slate-300"
              ><code>{{ prettyPreview }}</code></pre>
              <div
                class="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-linear-to-t from-white to-transparent dark:from-slate-950"
              ></div>
            </div>

            <div class="mt-4 flex gap-2">
              <button
                class="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-linear-to-r from-amber-400 to-amber-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/20 transition hover:brightness-105 active:scale-[0.99]"
                @click="startEditing"
              >
                {{ t('add.startEditing') }}
                <i class="fa-solid fa-arrow-right text-xs"></i>
              </button>
              <button
                class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800"
                @click="pickFile"
              >
                <i class="fa-solid fa-rotate-right text-xs"></i>
                {{ t('add.changeFile') }}
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
            class="group relative flex min-h-75 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed px-8 py-10 text-center outline-none transition-all duration-300 focus-visible:border-amber-400 focus-visible:ring-2 focus-visible:ring-amber-400/20"
            :class="[
              isDragging
                ? 'scale-[1.01] border-amber-400 bg-amber-50/70 shadow-[0_20px_60px_-25px_rgba(245,158,11,0.45)] dark:border-amber-500/70 dark:bg-amber-500/10'
                : 'border-slate-300 bg-white/70 hover:border-amber-300 hover:bg-white dark:border-slate-700 dark:bg-slate-900/60 dark:hover:border-amber-500/60 dark:hover:bg-slate-900',
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
              class="pointer-events-none absolute inset-x-10 top-0 h-px bg-linear-to-r from-transparent via-slate-200 to-transparent dark:via-slate-800"
            ></div>

            <div
              class="relative mb-5 grid h-18.5 w-18.5 place-items-center rounded-2xl border border-slate-200 bg-white shadow-sm transition-transform duration-300 group-hover:-translate-y-0.5 dark:border-slate-700 dark:bg-slate-900"
              :class="isDragging ? 'scale-105 border-amber-300' : ''"
            >
              <div
                v-if="isDragging"
                class="absolute inset-0 animate-ping rounded-2xl bg-amber-400/10"
              ></div>
              <i
                v-if="loading"
                class="fa-solid fa-spinner animate-spin text-2xl text-amber-500"
              ></i>
              <i
                v-else-if="isDragging"
                class="fa-solid fa-file-arrow-down relative text-2xl text-amber-500"
              ></i>
              <i
                v-else
                class="fa-solid fa-cloud-arrow-up text-2xl text-slate-400 transition-colors group-hover:text-amber-500 dark:text-slate-500"
              ></i>
            </div>

            <p class="text-[15px] font-medium text-slate-800 dark:text-slate-200">
              {{ loading ? t('add.reading') : isDragging ? t('add.dropToAdd') : t('add.dragHere') }}
            </p>
            <p class="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              <template v-if="loading">{{ t('add.validating') }}</template>
              <template v-else>
                {{ t('add.or') }}
                <span class="text-amber-600 underline decoration-amber-300 underline-offset-4 dark:text-amber-400 dark:decoration-amber-500/60">
                  {{ t('add.browseLocal') }}
                </span>
              </template>
            </p>

            <div class="mt-6 flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500">
              <span class="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 font-mono dark:border-slate-700 dark:bg-slate-900">
                {{ shortcutLabel }}
              </span>
              <span>{{ t('add.quickOpen') }}</span>
            </div>
          </div>
        </Transition>

        <Transition name="fade-slide">
          <div
            v-if="error"
            class="mt-3 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400"
            role="alert"
          >
            <i class="fa-solid fa-triangle-exclamation mt-0.5"></i>
            <p class="flex-1 leading-relaxed">{{ error }}</p>
            <button
              class="-mr-1 rounded p-0.5 text-red-400 transition hover:text-red-600 dark:hover:text-red-300"
              :aria-label="t('add.closeNotice')"
              @click="clearError"
            >
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
        </Transition>

        <p class="mt-4 text-center text-[11px] text-slate-400 dark:text-slate-500">
          {{ t('add.support', { size: MAX_SIZE_MB }) }}
        </p>
        <p v-if="!isTauri" class="mt-1 text-center text-[11px] text-slate-400 dark:text-slate-500">
          {{ t('add.privacy') }}
        </p>
      </section>
    </main>

    <!-- 拖拽到窗口任意位置时的提示 -->
    <Transition name="fade">
      <div
        v-if="isDragging"
        class="pointer-events-none fixed inset-2 z-30 rounded-2xl border-2 border-amber-400/70 bg-amber-400/6 shadow-[inset_0_0_80px_rgba(245,158,11,0.10)]"
      >
        <div
          class="absolute left-1/2 top-6 flex -translate-x-1/2 items-center gap-2 rounded-full border border-amber-200 bg-white/95 px-4 py-1.5 text-xs font-medium text-amber-600 shadow-xl dark:border-amber-500/30 dark:bg-slate-900/95 dark:text-amber-300"
        >
          <i class="fa-solid fa-arrow-down"></i>
          {{ t('add.dropToAdd') }}
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

    <Teleport to="body">
      <Transition name="ctx">
        <div
          v-if="langMenuOpen"
          ref="langMenuEl"
          class="fixed z-70 min-w-36 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-xl shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/40"
          :style="{ top: `${langMenuPos.top}px`, left: `${langMenuPos.left}px` }"
        >
          <button
            type="button"
            class="flex w-full cursor-pointer items-center gap-2 px-2.5 py-1.5 text-left text-[12px] transition hover:bg-slate-50 dark:hover:bg-slate-800"
            :class="locale === 'zh-CN' ? 'font-medium text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300'"
            @click="selectLocale('zh-CN')"
          >
            <span class="flex-1 whitespace-nowrap">{{ t('add.lang.zhCN') }}</span>
            <i
              v-if="locale === 'zh-CN'"
              class="fa-solid fa-check text-[10px] text-amber-500 dark:text-amber-400"
            ></i>
          </button>
          <button
            type="button"
            class="flex w-full cursor-pointer items-center gap-2 px-2.5 py-1.5 text-left text-[12px] transition hover:bg-slate-50 dark:hover:bg-slate-800"
            :class="locale === 'en' ? 'font-medium text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300'"
            @click="selectLocale('en')"
          >
            <span class="flex-1 whitespace-nowrap">{{ t('add.lang.en') }}</span>
            <i
              v-if="locale === 'en'"
              class="fa-solid fa-check text-[10px] text-amber-500 dark:text-amber-400"
            ></i>
          </button>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import useStore from '../store/index.ts';
import { setLocale, type Locale } from '../i18n';

const store = useStore();
const { t, locale } = useI18n();

const MAX_SIZE = 10 * 1024 * 1024;
const MAX_SIZE_MB = MAX_SIZE / 1024 / 1024;
const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
const isMac = /Mac|iPhone|iPad/.test(navigator.userAgent);

type JsonSummary =
  | { kind: 'array'; count: number }
  | { kind: 'object'; count: number }
  | { kind: 'string' }
  | { kind: 'value'; valueType: string };

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

const shortcutLabel = isMac ? '⌘ O' : 'Ctrl O';

const langTrigger = ref<HTMLElement | null>(null);
const langMenuEl = ref<HTMLElement | null>(null);
const langMenuOpen = ref(false);
const langMenuPos = ref({ top: 0, left: 0 });

let dragDepth = 0;
let errorTimer: ReturnType<typeof setTimeout> | undefined;
let unlistenDragDrop: (() => void) | undefined;
let disposed = false;

function placeLangMenu() {
  const trigger = langTrigger.value;
  if (!trigger) return;
  const rect = trigger.getBoundingClientRect();
  langMenuPos.value = { top: rect.bottom + 4, left: rect.right - 144 };
}

function clampLangMenu() {
  const menu = langMenuEl.value;
  const trigger = langTrigger.value;
  if (!menu || !trigger) return;
  const margin = 8;
  const tRect = trigger.getBoundingClientRect();
  const rect = menu.getBoundingClientRect();
  let left = tRect.right - rect.width;
  let top = tRect.bottom + 4;
  left = Math.min(Math.max(margin, left), window.innerWidth - rect.width - margin);
  top = Math.min(Math.max(margin, top), window.innerHeight - rect.height - margin);
  langMenuPos.value = { top, left };
}

async function toggleLangMenu() {
  if (langMenuOpen.value) {
    langMenuOpen.value = false;
    return;
  }
  placeLangMenu();
  langMenuOpen.value = true;
  await nextTick();
  clampLangMenu();
}

function selectLocale(next: Locale) {
  setLocale(next);
  langMenuOpen.value = false;
}

function closeLangMenu() {
  langMenuOpen.value = false;
}

function onLangPointerDown(event: PointerEvent) {
  const target = event.target as Node;
  if (langTrigger.value?.contains(target) || langMenuEl.value?.contains(target)) return;
  closeLangMenu();
}

function onLangKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') closeLangMenu();
}

function onLangReposition() {
  if (langMenuOpen.value) closeLangMenu();
}

watch(langMenuOpen, (value) => {
  if (value) {
    document.addEventListener('pointerdown', onLangPointerDown, true);
    document.addEventListener('keydown', onLangKeydown, true);
    window.addEventListener('scroll', onLangReposition, true);
    window.addEventListener('resize', onLangReposition);
  } else {
    document.removeEventListener('pointerdown', onLangPointerDown, true);
    document.removeEventListener('keydown', onLangKeydown, true);
    window.removeEventListener('scroll', onLangReposition, true);
    window.removeEventListener('resize', onLangReposition);
  }
});

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
    return { kind: 'array', count: value.length };
  }
  if (value !== null && typeof value === 'object') {
    return { kind: 'object', count: Object.keys(value).length };
  }
  if (typeof value === 'string') {
    return { kind: 'string' };
  }
  return { kind: 'value', valueType: String(value) };
}

function summaryLabel(summary: JsonSummary): string {
  if (summary.kind === 'array') return t('add.summary.array', { count: summary.count });
  if (summary.kind === 'object') return t('add.summary.object', { count: summary.count });
  if (summary.kind === 'string') return t('add.summary.string');
  return summary.valueType;
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
    setError(t('add.error.onlyJson'));
    return;
  }
  if (size > MAX_SIZE) {
    setError(t('add.error.tooLarge', { size: MAX_SIZE_MB }));
    return;
  }

  const raw = content.replace(/^\uFEFF/, '').trim();
  if (!raw) {
    setError(t('add.error.empty'));
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
    setError(t('add.error.invalidJson', { message: (e as Error).message }));
  }
}

/** 通过 Tauri 读取本地文件 */
async function loadFromPath(path: string) {
  if (!/\.json$/i.test(path)) {
    setError(t('add.error.onlyJson'));
    return;
  }

  loading.value = true;
  clearError();
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    const content = await invoke<string>('read_json_file', { path });
    await acceptText(baseName(path), new Blob([content]).size, content, path);
  } catch (e) {
    setError(typeof e === 'string' ? e : (e as Error)?.message || t('add.error.readFailed'));
  } finally {
    loading.value = false;
  }
}

/** 浏览器环境：通过 File API 读取 */
async function handleBrowserFile(file: File) {
  if (!/\.json$/i.test(file.name)) {
    setError(t('add.error.onlyJson'));
    return;
  }
  if (file.size > MAX_SIZE) {
    setError(t('add.error.tooLarge', { size: MAX_SIZE_MB }));
    return;
  }

  loading.value = true;
  clearError();
  try {
    const text = await file.text();
    await acceptText(file.name, file.size, text, file.name);
  } catch {
    setError(t('add.error.readFailedRetry'));
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
        filters: [{ name: t('add.dialog.jsonFiles'), extensions: ['json'] }],
      });
      if (typeof selected === 'string') {
        await loadFromPath(selected);
      }
    } catch {
      setError(t('add.error.pickerFailed'));
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
    setError(t('add.error.noFile'));
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
          setError(t('add.error.dropOnlyJson'));
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
  document.removeEventListener('pointerdown', onLangPointerDown, true);
  document.removeEventListener('keydown', onLangKeydown, true);
  window.removeEventListener('scroll', onLangReposition, true);
  window.removeEventListener('resize', onLangReposition);
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

.ctx-enter-active,
.ctx-leave-active {
  transition:
    opacity 0.12s ease,
    transform 0.12s ease;
}

.ctx-enter-from,
.ctx-leave-to {
  opacity: 0;
  transform: scale(0.96);
}
</style>
