<template>
  <Add v-if="path.length == 0" />

  <!-- 文件已打开：编辑器视图占位，下一步可在此接入真正的编辑器 -->
  <div
    v-else
    data-tauri-drag-region
    class="relative flex h-screen w-screen flex-col overflow-hidden bg-[#f6f7f9] text-slate-800"
  >
    <div
      class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_-10%,rgba(16,185,129,0.10),transparent_45%),radial-gradient(circle_at_88%_8%,rgba(56,189,248,0.08),transparent_42%)]"
    ></div>

    <main class="relative z-10 flex flex-1 items-center justify-center px-6 pb-10">
      <div
        class="w-full max-w-[560px] rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xl shadow-slate-900/5"
      >
        <div class="flex items-start gap-3">
          <div
            class="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-100"
          >
            <i class="fa-solid fa-file-code"></i>
          </div>
          <div class="min-w-0 flex-1 pt-0.5">
            <p class="truncate text-sm font-medium text-slate-900">
              {{ name || '已打开的 JSON 文件' }}
            </p>
            <p class="mt-1 truncate font-mono text-[11px] text-slate-500" :title="path">{{ path }}</p>
          </div>
          <span
            class="mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700"
          >
            <i class="fa-solid fa-circle-check"></i>
            已就绪
          </span>
        </div>

        <div
          class="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-9 text-center"
        >
          <i class="fa-solid fa-code text-xl text-slate-400"></i>
          <p class="mt-2.5 text-sm text-slate-600">编辑器视图即将上线</p>
          <p class="mt-1 text-[11px] text-slate-400">
            文件内容已存入 store（{{ content.length }} 个字符），可直接用于下一步开发
          </p>
        </div>

        <button
          class="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
          @click="closeFile"
        >
          <i class="fa-solid fa-arrow-left text-xs"></i>
          返回，选择其他文件
        </button>
      </div>
    </main>
  </div>
</template>

<script lang="ts" setup>
import { getCurrentWindow } from '@tauri-apps/api/window';
import { onMounted } from 'vue';
import store from './store';
import { storeToRefs } from 'pinia';
import Add from './components/Add.vue';

const storeRef = store();
const { path, name, content } = storeToRefs(storeRef);
const { closeFile } = storeRef;

onMounted(async () => {
  const appWindow = getCurrentWindow();
  appWindow.show();
});
</script>
