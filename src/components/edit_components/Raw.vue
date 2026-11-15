<template>
  <div class="flex h-full min-h-0 flex-col bg-white dark:bg-slate-950">
    <div class="relative flex min-h-0 flex-1">
      <!-- 行号 -->
      <div class="w-12 shrink-0 overflow-hidden border-r border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/70">
        <div ref="gutterEl" class="py-3 font-mono text-[13px] leading-6 text-slate-300 select-none dark:text-slate-600">
          <div v-for="n in lineCount" :key="n" class="pr-2 text-right">{{ n }}</div>
        </div>
      </div>

      <div class="relative min-w-0 flex-1">
        <!-- 高亮层：与文本框严格对齐，滚动同步 -->
        <pre
          ref="preEl"
          aria-hidden="true"
          class="pointer-events-none absolute inset-0 m-0 overflow-hidden p-3 font-mono text-[13px] leading-6 whitespace-pre"
        ><code v-html="highlighted"></code></pre>

        <textarea
          ref="textareaEl"
          v-model="text"
          spellcheck="false"
          wrap="off"
          class="relative h-full w-full resize-none bg-transparent p-3 font-mono text-[13px] leading-6 text-transparent caret-slate-800 outline-none selection:bg-amber-300/40 placeholder:text-slate-300 dark:caret-slate-100 dark:placeholder:text-slate-600 dark:selection:bg-amber-400/30"
          placeholder="在这里直接编辑 JSON 文本…"
          @input="scheduleCommit"
          @blur="flush"
          @scroll="syncScroll"
        ></textarea>
      </div>
    </div>

    <!-- 状态栏 -->
    <div
      class="flex shrink-0 items-center gap-2 border-t border-slate-200 px-3 py-1.5 text-[11px] dark:border-slate-800"
      :class="status.ok ? 'bg-white text-slate-400 dark:bg-slate-950 dark:text-slate-500' : 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'"
    >
      <i
        class="fa-solid text-[10px]"
        :class="status.ok ? 'fa-circle-check text-amber-500' : 'fa-triangle-exclamation'"
      ></i>
      <span v-if="status.ok">JSON 有效 · {{ lineCount }} 行</span>
      <span v-else class="truncate" :title="status.error">{{ status.error }}</span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import useStore from '../../store/index.ts';
import { highlightJson, parseJson } from '../../utils/json.ts';
import { findMatches } from '../../utils/search.ts';

const props = defineProps<{ search?: { query: string; index: number } | null }>();

const emit = defineEmits<{ (e: 'search-count', count: number): void }>();

const store = useStore();
const { content } = storeToRefs(store);

const text = ref(content.value);
const gutterEl = ref<HTMLElement | null>(null);
const preEl = ref<HTMLElement | null>(null);
const textareaEl = ref<HTMLTextAreaElement | null>(null);

const status = computed(() => parseJson(text.value));
const lineCount = computed(() => text.value.split('\n').length);

/* ---------------- 搜索 ---------------- */
const searchMatches = computed(() => findMatches(text.value, props.search?.query ?? ''));
const currentMatchIndex = computed(() => {
  if (searchMatches.value.length === 0) return -1;
  const index = props.search?.index ?? 0;
  return Math.min(Math.max(index, 0), searchMatches.value.length - 1);
});

watch(
  () => searchMatches.value.length,
  (count) => emit('search-count', count),
  { immediate: true },
);

watch(
  [() => props.search?.query, () => props.search?.index, () => searchMatches.value.length],
  async () => {
    if (!props.search?.query) return;
    await nextTick();
    const mark = preEl.value?.querySelector<HTMLElement>('.find-hit-current');
    const area = textareaEl.value;
    if (!mark || !area) return;
    area.scrollTop = Math.max(
      0,
      mark.offsetTop - area.clientHeight / 2 + mark.offsetHeight / 2,
    );
    area.scrollLeft = Math.max(
      0,
      mark.offsetLeft - area.clientWidth / 2 + mark.offsetWidth / 2,
    );
    syncScroll();
  },
  { immediate: true },
);

/** 末尾补一个换行，让高亮层与文本框的行数完全一致 */
const highlighted = computed(() => {
  const html = highlightJson(text.value, {
    query: props.search?.query ?? '',
    index: currentMatchIndex.value,
  });
  return `${html}\n`;
});

let timer: ReturnType<typeof setTimeout> | undefined;

// 外部改动（撤销/重做、切换标签）时同步到本地
watch(content, (value) => {
  if (value !== text.value) text.value = value;
});

watch(highlighted, () => nextTick(syncScroll));

function scheduleCommit() {
  if (timer) clearTimeout(timer);
  timer = setTimeout(flush, 600);
}

function flush() {
  if (timer) clearTimeout(timer);
  if (text.value !== content.value) store.commit(text.value);
}

function syncScroll() {
  const area = textareaEl.value;
  if (!area) return;
  if (preEl.value) {
    preEl.value.scrollTop = area.scrollTop;
    preEl.value.scrollLeft = area.scrollLeft;
  }
  if (gutterEl.value) {
    gutterEl.value.style.transform = `translateY(${-area.scrollTop}px)`;
  }
}

onMounted(() => {
  textareaEl.value?.focus();
  syncScroll();
});

onBeforeUnmount(flush);
</script>
