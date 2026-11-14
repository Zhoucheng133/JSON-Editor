<template>
  <button
    ref="triggerEl"
    type="button"
    class="inline-flex shrink-0 items-center justify-center gap-1 rounded-md border border-slate-200 bg-white text-slate-600 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus:border-amber-400"
    :class="compact ? 'h-6 w-6' : 'px-1.5 py-1 text-[11px]'"
    :title="current?.label"
    @click.stop="toggle"
    @pointerdown.stop
  >
    <i class="fa-solid text-[10px]" :class="current?.icon" :style="{ color: current?.color }"></i>
    <template v-if="!compact">
      <span class="whitespace-nowrap">{{ current?.label }}</span>
      <i class="fa-solid fa-chevron-down text-[8px] text-slate-400"></i>
    </template>
  </button>

  <Teleport to="body">
    <Transition name="drop">
      <div
        v-if="open"
        ref="menuEl"
        class="fixed z-60 min-w-32 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-xl shadow-slate-900/10"
        :style="{ top: `${pos.top}px`, left: `${pos.left}px` }"
      >
        <button
          v-for="option in options"
          :key="option.value"
          type="button"
          class="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-[11px] transition hover:bg-slate-50"
          :class="option.value === modelValue ? 'font-medium text-slate-800' : 'text-slate-600'"
          @click="select(option.value)"
        >
          <i
            class="fa-solid w-3 shrink-0 text-center text-[10px]"
            :class="option.icon"
            :style="{ color: option.color }"
          ></i>
          <span class="flex-1 whitespace-nowrap">{{ option.label }}</span>
          <i
            v-if="option.value === modelValue"
            class="fa-solid fa-check text-[9px] text-amber-500"
          ></i>
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import type { DropdownOption } from '../../utils/json.ts';

const props = withDefaults(
  defineProps<{ modelValue: string; options: DropdownOption[]; compact?: boolean }>(),
  { compact: false },
);

const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>();

const triggerEl = ref<HTMLButtonElement | null>(null);
const menuEl = ref<HTMLElement | null>(null);
const open = ref(false);
const pos = ref({ top: 0, left: 0 });

const current = computed(
  () => props.options.find((option) => option.value === props.modelValue) ?? props.options[0],
);

/** 根据触发按钮的位置计算菜单坐标（fixed 定位，避免被滚动容器裁剪） */
function place() {
  const el = triggerEl.value;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const menuHeight = props.options.length * 30 + 10;
  const openUp = window.innerHeight - rect.bottom < menuHeight + 8 && rect.top > menuHeight + 8;
  const width = Math.max(rect.width, 132);

  pos.value = {
    top: Math.max(8, openUp ? rect.top - menuHeight - 4 : rect.bottom + 4),
    left: Math.min(Math.max(8, rect.left), window.innerWidth - width - 8),
  };
}

async function toggle() {
  if (open.value) {
    open.value = false;
    return;
  }
  place();
  open.value = true;
  await nextTick();
  place();
}

function select(value: string) {
  emit('update:modelValue', value);
  open.value = false;
}

function onPointerDown(event: PointerEvent) {
  const target = event.target as Node;
  if (triggerEl.value?.contains(target) || menuEl.value?.contains(target)) return;
  open.value = false;
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') open.value = false;
}

function reposition() {
  if (open.value) place();
}

watch(open, (value) => {
  if (value) {
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('keydown', onKeydown, true);
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
  } else {
    document.removeEventListener('pointerdown', onPointerDown, true);
    document.removeEventListener('keydown', onKeydown, true);
    window.removeEventListener('resize', reposition);
    window.removeEventListener('scroll', reposition, true);
  }
});

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onPointerDown, true);
  document.removeEventListener('keydown', onKeydown, true);
  window.removeEventListener('resize', reposition);
  window.removeEventListener('scroll', reposition, true);
});
</script>

<style scoped>
.drop-enter-active,
.drop-leave-active {
  transition:
    opacity 0.12s ease,
    transform 0.12s ease;
}

.drop-enter-from,
.drop-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
