<template>
  <div class="flex h-full min-h-0 flex-col bg-white">
    <!-- JSON 无效时的提示 -->
    <div v-if="!parsed.ok" class="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <i class="fa-solid fa-triangle-exclamation text-2xl text-amber-500"></i>
      <p class="text-sm font-medium text-slate-700">当前内容不是合法的 JSON，无法以树状图编辑</p>
      <p class="max-w-md text-xs text-slate-500">{{ parsed.error }}</p>
      <button
        class="mt-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 transition hover:bg-slate-50"
        @click="emit('request-raw')"
      >
        切换到「原始文件」修复
      </button>
    </div>

    <div
      v-else
      ref="scrollerRef"
      class="min-h-0 flex-1 overflow-auto py-2 font-mono text-[13px]"
    >
      <template v-for="row in rows" :key="row.id">
        <div
          class="group flex items-center gap-1.5 rounded-md py-0.75 pr-2 hover:bg-slate-50"
          :class="highlightId === row.id ? 'locate-highlight' : ''"
          :data-node-id="row.id"
          :style="{ paddingLeft: `${10 + row.depth * 18}px` }"
        >
          <!-- 展开/折叠 -->
          <button
            v-if="row.expandable"
            class="grid h-4 w-4 shrink-0 place-items-center rounded text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"
            :aria-label="row.expanded ? '折叠' : '展开'"
            @click="toggle(row.id)"
          >
            <i
              class="fa-solid fa-chevron-right text-[9px] transition-transform"
              :class="row.expanded ? 'rotate-90' : ''"
            ></i>
          </button>
          <span v-else class="h-4 w-4 shrink-0"></span>

          <!-- 键 -->
          <template v-if="row.key !== null">
            <input
              v-if="isEditing(row, 'key')"
              v-model="editText"
              v-focus
              spellcheck="false"
              class="w-32 rounded border border-amber-400 bg-white px-1 py-px text-slate-700 outline-none"
              @keydown.enter.prevent="commitKey"
              @keydown.esc.prevent="cancelEdit"
            />
            <span
              v-else
              class="cursor-text rounded px-1 transition hover:bg-slate-200/70"
              :class="[
                row.parentType === 'array' ? 'text-slate-400' : 'text-sky-700',
                isSearchHit(row, 'key') ? 'bg-amber-200/70' : '',
                isCurrentSearchHit(row, 'key') ? 'bg-amber-400/80 ring-1 ring-amber-500' : '',
              ]"
              :title="String(row.key)"
              @click="startEditKey(row)"
            >
              {{ row.key }}
            </span>
            <span class="text-slate-400">:</span>
          </template>

          <!-- 容器 -->
          <template v-if="row.expandable">
            <span class="text-slate-400">{{ row.type === 'array' ? '[' : '{' }}</span>
            <span v-if="!row.expanded" class="text-slate-400">…</span>
            <span v-if="!row.expanded" class="text-slate-400">{{ row.type === 'array' ? ']' : '}' }}</span>
            <span class="ml-1 text-[11px] text-slate-400">{{ row.size }} 项</span>
          </template>

          <!-- 原始值 -->
          <template v-else-if="isEditing(row, 'value')">
            <DropSelect
              :model-value="editType"
              :options="TYPE_OPTIONS"
              @update:model-value="setEditType($event as JsonType)"
            />
            <DropSelect
              v-if="editType === 'boolean'"
              :model-value="editText"
              :options="BOOL_OPTIONS"
              @update:model-value="editText = $event"
            />
            <input
              v-else-if="editType === 'null'"
              class="w-16 rounded border border-slate-200 bg-slate-50 px-1 py-px text-slate-400 outline-none"
              value="null"
              spellcheck="false"
              disabled
            />
            <input
              v-else
              v-model="editText"
              v-focus
              spellcheck="false"
              class="min-w-24 rounded border border-amber-400 bg-white px-1 py-px text-slate-700 outline-none"
              :class="editType === 'number' ? 'w-28' : 'w-48'"
              @keydown.enter.prevent="commitValue"
              @keydown.esc.prevent="cancelEdit"
            />
            <button
              class="grid h-5 w-5 shrink-0 place-items-center rounded text-amber-600 transition hover:bg-amber-50"
              title="确认"
              @click="commitValue"
            >
              <i class="fa-solid fa-check text-[10px]"></i>
            </button>
          </template>

          <span
            v-else
            class="cursor-text truncate rounded px-1 transition hover:bg-slate-200/70"
            :class="[
              valueClass(row.type),
              isSearchHit(row, 'value') ? 'bg-amber-200/70' : '',
              isCurrentSearchHit(row, 'value') ? 'bg-amber-400/80 ring-1 ring-amber-500' : '',
            ]"
            :title="valueText(row)"
            @click="startEditValue(row)"
          >
            {{ valueText(row) }}
          </span>

          <!-- 行操作 -->
          <div
            class="ml-auto flex shrink-0 items-center gap-0.5 opacity-0 transition group-hover:opacity-100"
          >
            <button
              v-if="row.expandable"
              class="grid h-5 w-5 place-items-center rounded text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
              title="添加"
              @click="startAdd(row)"
            >
              <i class="fa-solid fa-plus text-[10px]"></i>
            </button>
            <button
              v-if="row.path.length > 0"
              class="grid h-5 w-5 place-items-center rounded text-slate-400 transition hover:bg-red-50 hover:text-red-500"
              title="删除"
              @click="remove(row)"
            >
              <i class="fa-solid fa-trash-can text-[10px]"></i>
            </button>
          </div>
        </div>

        <!-- 新增字段的输入行（放在容器子树的末尾） -->
        <div
          v-if="adding && addAfterId === row.id"
          class="flex items-center gap-1.5 rounded-md py-0.75 pr-2"
          :style="{ paddingLeft: `${10 + row.depth * 18 + 22}px` }"
        >
          <span class="text-slate-400">+</span>
          <input
            v-model="adding.key"
            v-focus
            placeholder="字段名"
            spellcheck="false"
            class="w-32 rounded border border-amber-400 bg-white px-1 py-px text-sky-700 outline-none"
            @keydown.enter.prevent="commitAdd"
            @keydown.esc.prevent="cancelAdd"
          />
          <span class="text-slate-400">:</span>
          <span class="text-slate-400">""</span>
          <button
            class="grid h-5 w-5 place-items-center rounded text-amber-600 transition hover:bg-amber-50"
            title="确认"
            @click="commitAdd"
          >
            <i class="fa-solid fa-check text-[10px]"></i>
          </button>
        </div>
      </template>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import useStore from '../../store/index.ts';
import {
  BOOL_OPTIONS,
  cloneJson,
  convertValue,
  getAt,
  jsonType,
  parentOf,
  parseJson,
  pathKey,
  stringifyJson,
  TYPE_OPTIONS,
  type JsonPath,
  type JsonType,
} from '../../utils/json.ts';
import DropSelect from './DropSelect.vue';
import { containsQuery } from '../../utils/search.ts';

const props = defineProps<{
  locate?: { path: JsonPath; token: number } | null;
  search?: { query: string; index: number } | null;
}>();

const emit = defineEmits<{
  (e: 'request-raw'): void;
  (e: 'search-count', count: number): void;
}>();

const store = useStore();
const { content } = storeToRefs(store);

const vFocus = {
  mounted: (el: HTMLElement) => {
    const input = el as HTMLInputElement | HTMLSelectElement;
    input.focus();
    if (input instanceof HTMLInputElement) input.select();
  },
};

const parsed = computed(() => parseJson(content.value));
const collapsed = ref<Set<string>>(new Set());

type Row = {
  id: string;
  path: JsonPath;
  key: string | number | null;
  value: unknown;
  type: JsonType;
  depth: number;
  parentType: 'object' | 'array' | null;
  expandable: boolean;
  expanded: boolean;
  size: number;
};

const rows = computed<Row[]>(() => {
  if (!parsed.value.ok) return [];
  const list: Row[] = [];

  const walk = (
    value: unknown,
    path: JsonPath,
    key: string | number | null,
    depth: number,
    parentType: 'object' | 'array' | null,
  ) => {
    const type = jsonType(value);
    const expandable = type === 'object' || type === 'array';
    const expanded = expandable && !collapsed.value.has(pathKey(path));
    const size = expandable
      ? Array.isArray(value)
        ? value.length
        : Object.keys(value as object).length
      : 0;

    list.push({
      id: pathKey(path),
      path,
      key,
      value,
      type,
      depth,
      parentType,
      expandable,
      expanded,
      size,
    });

    if (!expanded) return;
    if (Array.isArray(value)) {
      value.forEach((item, index) => walk(item, [...path, index], index, depth + 1, 'array'));
    } else if (value && typeof value === 'object') {
      for (const [childKey, childValue] of Object.entries(value)) {
        walk(childValue, [...path, childKey], childKey, depth + 1, 'object');
      }
    }
  };

  walk(parsed.value.value, [], null, 0, null);
  return list;
});

/* ---------------- 定位（从表格跳转过来） ---------------- */
const scrollerRef = ref<HTMLElement | null>(null);
/** 当前高亮的节点 id */
const highlightId = ref<string | null>(null);
let highlightTimer: ReturnType<typeof setTimeout> | undefined;

/** 展开目标路径的所有父节点，滚动到目标节点并短暂高亮 */
async function revealPath(path: JsonPath) {
  const expanded = new Set(collapsed.value);
  for (let i = 0; i < path.length; i += 1) {
    expanded.delete(pathKey(path.slice(0, i)));
  }
  collapsed.value = expanded;

  const id = pathKey(path);
  highlightId.value = id;
  await nextTick();

  const target = Array.from(
    scrollerRef.value?.querySelectorAll<HTMLElement>('[data-node-id]') ?? [],
  ).find((el) => el.dataset.nodeId === id);
  target?.scrollIntoView({ block: 'center', behavior: 'smooth' });

  if (highlightTimer) clearTimeout(highlightTimer);
  highlightTimer = setTimeout(() => {
    if (highlightId.value === id) highlightId.value = null;
  }, 2000);
}

watch(
  () => props.locate,
  (locate) => {
    if (locate) revealPath(locate.path);
  },
  { immediate: true },
);

/* ---------------- 搜索 ---------------- */
type SearchHit = { id: string; field: 'key' | 'value'; key: string };

const searchHits = computed<SearchHit[]>(() => {
  const query = props.search?.query ?? '';
  if (!query) return [];

  const hits: SearchHit[] = [];
  for (const row of rows.value) {
    if (row.key !== null && containsQuery(String(row.key), query)) {
      hits.push({ id: row.id, field: 'key', key: `${row.id}:key` });
    }
    if (!row.expandable && containsQuery(valueText(row), query)) {
      hits.push({ id: row.id, field: 'value', key: `${row.id}:value` });
    }
  }
  return hits;
});

const searchHitKeys = computed(() => new Set(searchHits.value.map((hit) => hit.key)));
const currentSearchHit = computed(() => searchHits.value[props.search?.index ?? 0] ?? null);
const currentSearchKey = computed(() => currentSearchHit.value?.key ?? null);

function isSearchHit(row: Row, field: 'key' | 'value') {
  return searchHitKeys.value.has(`${row.id}:${field}`);
}

function isCurrentSearchHit(row: Row, field: 'key' | 'value') {
  return currentSearchKey.value === `${row.id}:${field}`;
}

watch(
  () => searchHits.value.length,
  (count) => emit('search-count', count),
  { immediate: true },
);

watch(
  currentSearchHit,
  async (hit) => {
    if (!hit) return;
    await nextTick();
    const el = Array.from(
      scrollerRef.value?.querySelectorAll<HTMLElement>('[data-node-id]') ?? [],
    ).find((item) => item.dataset.nodeId === hit.id);
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  },
  { immediate: true },
);

/* ---------------- 编辑状态 ---------------- */
const editId = ref<string | null>(null);
const editTarget = ref<'value' | 'key'>('value');
const editPath = ref<JsonPath>([]);
const editType = ref<JsonType>('string');
const editText = ref('');
const editOriginal = ref('');
/** 进入编辑时的原始值，切换到数组/对象时用来转换 */
const editValue = ref<unknown>(null);

const adding = ref<{ id: string; path: JsonPath; key: string } | null>(null);

/** 新增输入行应该插在容器子树的最后一行之后 */
const addAfterId = computed(() => {
  const target = adding.value;
  if (!target || !parsed.value.ok) return null;
  const prefix = pathKey(target.path);
  let last = target.id;
  for (const row of rows.value) {
    const isSelf = row.id === prefix;
    const isDescendant = row.path.length > target.path.length
      && pathKey(row.path.slice(0, target.path.length)) === prefix;
    if (isSelf || isDescendant) last = row.id;
  }
  return last;
});

function isEditing(row: Row, target: 'value' | 'key') {
  return editId.value === row.id && editTarget.value === target;
}

function startEditValue(row: Row) {
  if (row.expandable) return;
  editId.value = row.id;
  editTarget.value = 'value';
  editPath.value = row.path;
  editType.value = row.type;
  editValue.value = row.value;
  editText.value = row.type === 'null' ? '' : String(row.value);
}

function startEditKey(row: Row) {
  if (row.key === null || row.parentType === 'array') return;
  editId.value = row.id;
  editTarget.value = 'key';
  editPath.value = row.path;
  editText.value = String(row.key);
  editOriginal.value = String(row.key);
}

function cancelEdit() {
  editId.value = null;
}

/** 切换正在编辑的值类型；选到数组/对象时直接转换并结束编辑 */
function setEditType(type: JsonType) {
  if (type === editType.value) return;

  if (type === 'array' || type === 'object') {
    const path = editPath.value;
    const next = convertValue(editValue.value, type);
    cancelEdit();
    if (path.length === 0) {
      store.commit(stringifyJson(next));
      return;
    }
    withRoot((root) => {
      const parent = parentOf(root, path);
      parent[path[path.length - 1]] = next;
    });
    return;
  }

  if (type === 'boolean') {
    editText.value = editText.value === 'false' ? 'false' : 'true';
  } else if (editType.value === 'null') {
    editText.value = '';
  }
  editType.value = type;
}

/* ---------------- 修改数据 ---------------- */
function withRoot(mutator: (root: any) => void) {
  if (!parsed.value.ok) return;
  const root = cloneJson(parsed.value.value);
  mutator(root);
  store.commit(stringifyJson(root));
}

function expand(path: JsonPath) {
  const id = pathKey(path);
  if (collapsed.value.has(id)) {
    const next = new Set(collapsed.value);
    next.delete(id);
    collapsed.value = next;
  }
}

function toggle(id: string) {
  const next = new Set(collapsed.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  collapsed.value = next;
}

function coerceValue(): unknown {
  switch (editType.value) {
    case 'number': {
      const num = Number(editText.value);
      return Number.isFinite(num) ? num : 0;
    }
    case 'boolean':
      return editText.value === 'true';
    case 'null':
      return null;
    default:
      return editText.value;
  }
}

function commitValue() {
  if (editId.value === null) return;
  const path = editPath.value;
  const value = coerceValue();
  cancelEdit();

  if (path.length === 0) {
    store.commit(stringifyJson(value));
    return;
  }
  withRoot((root) => {
    const parent = parentOf(root, path);
    parent[path[path.length - 1]] = value;
  });
}

function commitKey() {
  if (editId.value === null) return;
  const path = editPath.value;
  const newKey = editText.value.trim();
  const oldKey = editOriginal.value;
  cancelEdit();

  if (!newKey || newKey === oldKey) return;
  withRoot((root) => {
    const parent = parentOf(root, path);
    if (!parent || Array.isArray(parent)) return;
    const entries = Object.entries(parent);
    for (const key of Object.keys(parent)) delete parent[key];
    for (const [key, value] of entries) {
      parent[key === oldKey ? newKey : key] = value;
    }
  });
}

function remove(row: Row) {
  if (row.path.length === 0) return;
  withRoot((root) => {
    const parent = parentOf(root, row.path);
    const key = row.path[row.path.length - 1];
    if (Array.isArray(parent)) parent.splice(key as number, 1);
    else delete parent[key as string];
  });
}

function startAdd(row: Row) {
  if (row.type === 'array') {
    withRoot((root) => {
      (getAt(root, row.path) as unknown[]).push('');
    });
    expand(row.path);
    return;
  }
  adding.value = { id: row.id, path: row.path, key: '' };
  expand(row.path);
}

function commitAdd() {
  const target = adding.value;
  if (!target) return;
  const key = target.key.trim();
  if (!key) {
    cancelAdd();
    return;
  }
  withRoot((root) => {
    const parent = getAt(root, target.path) as Record<string, unknown>;
    parent[key] = '';
  });
  adding.value = null;
}

function cancelAdd() {
  adding.value = null;
}

/* ---------------- 展示 ---------------- */
function valueText(row: Row) {
  switch (row.type) {
    case 'string':
      return `"${row.value as string}"`;
    case 'null':
      return 'null';
    default:
      return String(row.value);
  }
}

function valueClass(type: JsonType) {
  switch (type) {
    case 'string':
      return 'text-amber-600';
    case 'number':
      return 'text-emerald-600';
    case 'boolean':
      return 'text-violet-600';
    case 'null':
      return 'text-slate-400';
    default:
      return 'text-slate-600';
  }
}

onBeforeUnmount(() => {
  if (highlightTimer) clearTimeout(highlightTimer);
});
</script>

<style scoped>
.locate-highlight {
  animation: locate-flash 2s ease-out;
}

@keyframes locate-flash {
  0%,
  30% {
    background-color: #fef3c7;
    box-shadow: inset 0 0 0 1px #fcd34d;
  }
  100% {
    background-color: transparent;
    box-shadow: inset 0 0 0 1px transparent;
  }
}
</style>
