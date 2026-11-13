<template>
  <div class="flex h-full min-h-0 flex-col bg-white">
    <div class="relative flex min-h-0 flex-1">
      <!-- 行号 -->
      <div class="w-12 shrink-0 overflow-hidden border-r border-slate-200 bg-slate-50/70">
        <div ref="gutterEl" class="py-3 font-mono text-[13px] leading-6 text-slate-300 select-none">
          <div v-for="n in lineCount" :key="n" class="pr-2 text-right">{{ n }}</div>
        </div>
      </div>

      <textarea
        ref="textareaEl"
        v-model="text"
        spellcheck="false"
        wrap="off"
        class="min-w-0 flex-1 resize-none bg-transparent p-3 font-mono text-[13px] leading-6 text-slate-700 outline-none"
        placeholder="在这里直接编辑 JSON 文本…"
        @input="scheduleCommit"
        @blur="flush"
        @scroll="syncScroll"
      ></textarea>
    </div>

    <!-- 状态栏 -->
    <div
      class="flex shrink-0 items-center gap-2 border-t border-slate-200 px-3 py-1.5 text-[11px]"
      :class="status.ok ? 'bg-white text-slate-400' : 'bg-red-50 text-red-600'"
    >
      <i
        class="fa-solid text-[10px]"
        :class="status.ok ? 'fa-circle-check text-emerald-500' : 'fa-triangle-exclamation'"
      ></i>
      <span v-if="status.ok">JSON 有效 · {{ lineCount }} 行</span>
      <span v-else class="truncate" :title="status.error">{{ status.error }}</span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import useStore from '../../store/index.ts';
import { parseJson } from '../../utils/json.ts';

const store = useStore();
const { content } = storeToRefs(store);

const text = ref(content.value);
const gutterEl = ref<HTMLElement | null>(null);
const textareaEl = ref<HTMLTextAreaElement | null>(null);

const status = computed(() => parseJson(text.value));
const lineCount = computed(() => text.value.split('\n').length);

let timer: ReturnType<typeof setTimeout> | undefined;

// 外部改动（撤销/重做、切换标签）时同步到本地
watch(content, (value) => {
  if (value !== text.value) text.value = value;
});

function scheduleCommit() {
  if (timer) clearTimeout(timer);
  timer = setTimeout(flush, 600);
}

function flush() {
  if (timer) clearTimeout(timer);
  if (text.value !== content.value) store.commit(text.value);
}

function syncScroll() {
  if (gutterEl.value && textareaEl.value) {
    gutterEl.value.style.transform = `translateY(${-textareaEl.value.scrollTop}px)`;
  }
}

onBeforeUnmount(flush);
</script>
