<template>
  <div class="flex h-full min-h-0 flex-col bg-white">
    <!-- JSON 无效 -->
    <div v-if="!parsed.ok" class="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <i class="fa-solid fa-triangle-exclamation text-2xl text-amber-500"></i>
      <p class="text-sm font-medium text-slate-700">当前内容不是合法的 JSON，无法以表格编辑</p>
      <p class="max-w-md text-xs text-slate-500">{{ parsed.error }}</p>
      <button
        class="mt-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 transition hover:bg-slate-50"
        @click="emit('request-raw')"
      >
        切换到「原始文件」修复
      </button>
    </div>

    <!-- 无法表格化 -->
    <div
      v-else-if="!model"
      class="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center"
    >
      <i class="fa-solid fa-table-cells text-2xl text-slate-300"></i>
      <p class="text-sm font-medium text-slate-700">当前 JSON 无法用表格展示</p>
      <p class="max-w-md text-xs text-slate-500">
        表格视图适合「对象数组」「对象」或「数组」，请改用树状图或原始文件编辑。
      </p>
      <button
        class="mt-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 transition hover:bg-slate-50"
        @click="emit('request-tree')"
      >
        切换到「树状图」
      </button>
    </div>

    <template v-else>
      <div class="min-h-0 flex-1 overflow-auto">
        <table class="w-full border-collapse text-[13px]">
          <thead class="sticky top-0 z-10 bg-slate-50">
            <tr>
              <th
                v-for="(head, index) in model.head"
                :key="index"
                class="border-b border-slate-200 px-2 py-1.5 text-left text-[11px] font-medium text-slate-500"
              >
                <div v-if="model.kind === 'records'" class="group flex items-center gap-1">
                  <input
                    v-if="editingColumn === head"
                    v-model="columnText"
                    v-focus
                    class="w-28 rounded border border-emerald-400 bg-white px-1 py-px text-slate-700 outline-none"
                    @keydown.enter.prevent="commitColumn(head)"
                    @keydown.esc.prevent="editingColumn = null"
                  />
                  <button
                    v-else
                    class="cursor-text rounded px-1 py-px transition hover:bg-slate-200/70"
                    title="点击重命名列"
                    @click="startColumn(head)"
                  >
                    {{ head }}
                  </button>
                  <button
                    class="grid h-4 w-4 place-items-center rounded text-slate-400 opacity-0 transition group-hover:opacity-100 hover:bg-red-50 hover:text-red-500"
                    title="删除列"
                    @click="removeColumn(head)"
                  >
                    <i class="fa-solid fa-xmark text-[9px]"></i>
                  </button>
                </div>
                <span v-else>{{ head }}</span>
              </th>
              <th
                v-if="model.kind === 'records'"
                class="w-10 border-b border-slate-200 px-1 py-1.5"
              >
                <button
                  class="grid h-5 w-5 place-items-center rounded text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
                  title="添加列"
                  @click="addColumn"
                >
                  <i class="fa-solid fa-plus text-[10px]"></i>
                </button>
              </th>
              <th v-else-if="model.kind === 'list'" class="w-10 border-b border-slate-200"></th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="(row, rowIndex) in model.rows" :key="rowIndex" class="group hover:bg-slate-50">
              <td
                v-for="(cell, cellIndex) in row.cells"
                :key="cellIndex"
                class="border-b border-slate-100 px-1 py-0.5"
              >
                <span v-if="cell.kind === 'index'" class="px-2 text-[11px] text-slate-400">
                  {{ cell.value }}
                </span>

                <input
                  v-else-if="cell.kind === 'key'"
                  :value="String(cell.value)"
                  class="w-full min-w-24 rounded border border-transparent bg-transparent px-1.5 py-1 font-mono text-[12px] text-sky-700 outline-none transition hover:border-slate-200 focus:border-emerald-400 focus:bg-white"
                  @change="onKeyChange(cell.value, $event)"
                />

                <!-- 该行不存在这个字段 -->
                <div v-else-if="cell.value === undefined" class="px-0.5">
                  <button
                    class="inline-flex items-center gap-1 rounded-md border border-dashed border-slate-300 px-1.5 py-0.5 text-[11px] text-slate-400 transition hover:border-emerald-400 hover:text-emerald-600"
                    title="该字段在当前行不存在，点击添加"
                    @click="addCell(row.ref, cell.column)"
                  >
                    <i class="fa-solid fa-plus text-[9px]"></i>
                    无数据
                  </button>
                </div>

                <!-- 有数据的单元格 -->
                <div v-else class="group/cell flex items-center gap-1">
                  <button
                    v-if="cellType(cell.value) === 'boolean'"
                    class="min-w-0 flex-1 rounded border border-transparent px-1.5 py-1 text-left font-mono text-[12px] text-violet-600 transition hover:border-slate-200 hover:bg-white"
                    title="点击切换 true / false"
                    @click="toggleBoolean(row.ref, cell.column)"
                  >
                    {{ cell.value }}
                  </button>
                  <input
                    v-else-if="!isComplex(cell.value)"
                    :type="cellType(cell.value) === 'number' ? 'number' : 'text'"
                    :value="cellText(cell.value)"
                    :placeholder="cell.value === null ? 'null' : ''"
                    class="min-w-0 flex-1 rounded border border-transparent bg-transparent px-1.5 py-1 font-mono text-[12px] outline-none transition hover:border-slate-200 focus:border-emerald-400 focus:bg-white"
                    :class="valueClass(cellType(cell.value))"
                    @change="onValueChange(row.ref, cell.column, $event)"
                  />
                  <input
                    v-else
                    type="text"
                    :value="cellText(cell.value)"
                    title="编辑 JSON 内容"
                    class="min-w-0 flex-1 rounded border border-transparent bg-transparent px-1.5 py-1 font-mono text-[12px] text-slate-400 outline-none transition hover:border-slate-200 focus:border-emerald-400 focus:bg-white"
                    :class="
                      invalidCells.has(cellKey(row.ref, cell.column))
                        ? 'border-red-400 ring-1 ring-red-300'
                        : ''
                    "
                    @change="onComplexChange(row.ref, cell.column, $event)"
                  />

                  <DropSelect
                    compact
                    :model-value="cellType(cell.value)"
                    :options="TYPE_OPTIONS"
                    @update:model-value="onTypeChange(row.ref, cell.column, $event)"
                  />

                  <button
                    v-if="canDeleteCell(row.ref)"
                    class="grid h-5 w-5 shrink-0 place-items-center rounded text-slate-300 opacity-0 transition group-hover/cell:opacity-100 hover:bg-red-50 hover:text-red-500"
                    title="删除该字段"
                    @click="deleteCell(row.ref, cell.column)"
                  >
                    <i class="fa-solid fa-trash-can text-[10px]"></i>
                  </button>
                </div>
              </td>

              <td
                v-if="model.kind !== 'entries'"
                class="w-10 border-b border-slate-100 px-1"
              >
                <button
                  class="grid h-5 w-5 place-items-center rounded text-slate-400 opacity-0 transition group-hover:opacity-100 hover:bg-red-50 hover:text-red-500"
                  title="删除行"
                  @click="removeRow(row.ref)"
                >
                  <i class="fa-solid fa-trash-can text-[10px]"></i>
                </button>
              </td>
            </tr>

            <tr v-if="model.rows.length === 0">
              <td
                :colspan="model.head.length + (model.kind === 'entries' ? 0 : 1)"
                class="px-3 py-6 text-center text-xs text-slate-400"
              >
                暂无数据
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 底部操作栏 -->
      <div
        class="flex shrink-0 items-center justify-between border-t border-slate-200 px-3 py-1.5 text-[11px] text-slate-400"
      >
        <span>{{ model.rows.length }} 行 · {{ model.head.length }} 列</span>
        <button
          class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1 text-slate-600 transition hover:bg-slate-50"
          @click="addRow"
        >
          <i class="fa-solid fa-plus text-[10px]"></i>
          添加行
        </button>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import useStore from '../../store/index.ts';
import {
  cloneJson,
  convertValue,
  jsonType,
  parseJson,
  stringifyJson,
  TYPE_OPTIONS,
  uniqueKey,
  type JsonType,
} from '../../utils/json.ts';
import DropSelect from './DropSelect.vue';

const emit = defineEmits<{ (e: 'request-raw'): void; (e: 'request-tree'): void }>();

const store = useStore();
const { content } = storeToRefs(store);

const vFocus = {
  mounted: (el: HTMLElement) => {
    (el as HTMLInputElement).focus();
    (el as HTMLInputElement).select();
  },
};

const parsed = computed(() => parseJson(content.value));

type RowRef =
  | { kind: 'record'; index: number }
  | { kind: 'entry'; key: string }
  | { kind: 'list'; index: number };

type Cell = { kind: 'index' | 'key' | 'value'; value: unknown; column?: string | number };
type Row = { ref: RowRef; cells: Cell[] };
type Model = { kind: 'records' | 'entries' | 'list'; head: string[]; rows: Row[] };

const model = computed<Model | null>(() => {
  if (!parsed.value.ok) return null;
  const value = parsed.value.value;

  if (Array.isArray(value)) {
    const isRecords = value.length > 0 && value.every((item) => item !== null && typeof item === 'object' && !Array.isArray(item));
    if (isRecords) {
      const columns: string[] = [];
      for (const item of value) {
        for (const key of Object.keys(item as object)) {
          if (!columns.includes(key)) columns.push(key);
        }
      }
      return {
        kind: 'records',
        head: columns,
        rows: value.map((item, index) => ({
          ref: { kind: 'record', index },
          cells: columns.map((column) => ({
            kind: 'value' as const,
            value: (item as Record<string, unknown>)[column],
            column,
          })),
        })),
      };
    }
    return {
      kind: 'list',
      head: ['#', '值'],
      rows: value.map((item, index) => ({
        ref: { kind: 'list', index },
        cells: [
          { kind: 'index' as const, value: index },
          { kind: 'value' as const, value: item, column: index },
        ],
      })),
    };
  }

  if (value !== null && typeof value === 'object') {
    return {
      kind: 'entries',
      head: ['键', '值'],
      rows: Object.entries(value).map(([key, item]) => ({
        ref: { kind: 'entry', key },
        cells: [
          { kind: 'key' as const, value: key },
          { kind: 'value' as const, value: item, column: key },
        ],
      })),
    };
  }

  return null;
});

/* ---------------- 编辑 ---------------- */
const editingColumn = ref<string | null>(null);
const columnText = ref('');
/** 输入了非法 JSON 的单元格，短暂标红 */
const invalidCells = ref<Set<string>>(new Set());

function withRoot(mutator: (root: any) => void) {
  if (!parsed.value.ok) return;
  const root = cloneJson(parsed.value.value);
  mutator(root);
  store.commit(stringifyJson(root));
}

function cellType(value: unknown): JsonType | 'undefined' {
  return value === undefined ? 'undefined' : jsonType(value);
}

function isComplex(value: unknown) {
  return value !== null && typeof value === 'object';
}

function cellText(value: unknown) {
  if (value === undefined || value === null) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function valueClass(type: JsonType | 'undefined') {
  switch (type) {
    case 'string':
      return 'text-emerald-600';
    case 'number':
      return 'text-amber-600';
    case 'boolean':
      return 'text-violet-600';
    case 'null':
      return 'text-slate-400';
    default:
      return 'text-slate-600';
  }
}

function currentValue(ref_: RowRef, column?: string | number) {
  if (!parsed.value.ok) return undefined;
  const root: any = parsed.value.value;
  if (ref_.kind === 'record') return root[ref_.index]?.[column as string];
  if (ref_.kind === 'entry') return root[ref_.key];
  return root[column as number];
}

function setValue(ref_: RowRef, column: string | number | undefined, value: unknown) {
  withRoot((root) => {
    if (ref_.kind === 'record') {
      root[ref_.index][column as string] = value;
    } else if (ref_.kind === 'entry') {
      root[ref_.key] = value;
    } else {
      root[column as number] = value;
    }
  });
}

function onValueChange(ref_: RowRef, column: string | number | undefined, event: Event) {
  const input = event.target as HTMLInputElement;
  const raw = input.value;
  const type = cellType(currentValue(ref_, column));

  let value: unknown;
  switch (type) {
    case 'number': {
      const num = Number(raw);
      if (raw.trim() === '' || !Number.isFinite(num)) {
        input.value = cellText(currentValue(ref_, column));
        return;
      }
      value = num;
      break;
    }
    case 'null':
      value = raw.trim() === '' ? null : raw;
      break;
    case 'boolean':
      value = raw === 'true';
      break;
    default:
      value = raw;
  }

  setValue(ref_, column, value);
}

/** 通过下拉菜单切换单元格类型 */
function onTypeChange(ref_: RowRef, column: string | number | undefined, next: string) {
  const value = currentValue(ref_, column);
  setValue(ref_, column, convertValue(value, next as JsonType));
}

/** 布尔值点击翻转 */
function toggleBoolean(ref_: RowRef, column: string | number | undefined) {
  setValue(ref_, column, currentValue(ref_, column) !== true);
}

/** 列表视图里没有独立字段可删，直接删行 */
function canDeleteCell(ref_: RowRef) {
  return ref_.kind !== 'list';
}

function cellKey(ref_: RowRef, column: string | number | undefined) {
  if (ref_.kind === 'record') return `r:${ref_.index}:${String(column)}`;
  if (ref_.kind === 'entry') return `e:${ref_.key}`;
  return `l:${ref_.index}`;
}

function flashInvalid(key: string) {
  invalidCells.value = new Set(invalidCells.value).add(key);
  window.setTimeout(() => {
    const next = new Set(invalidCells.value);
    next.delete(key);
    invalidCells.value = next;
  }, 1200);
}

/** 数组 / 对象单元格：按 JSON 文本编辑，非法输入则还原并标红 */
function onComplexChange(ref_: RowRef, column: string | number | undefined, event: Event) {
  const input = event.target as HTMLInputElement;
  const original = currentValue(ref_, column);
  try {
    setValue(ref_, column, JSON.parse(input.value));
  } catch {
    input.value = cellText(original);
    flashInvalid(cellKey(ref_, column));
  }
}

/** 删除字段（键值对），删除后该单元格会显示「无数据」标记 */
function deleteCell(ref_: RowRef, column: string | number | undefined) {
  withRoot((root) => {
    if (ref_.kind === 'record') {
      const row = root[ref_.index];
      if (row !== null && typeof row === 'object') delete row[column as string];
    } else if (ref_.kind === 'entry') {
      delete root[ref_.key];
    }
  });
}

/** 为缺失的字段补上默认值 */
function addCell(ref_: RowRef, column: string | number | undefined) {
  withRoot((root) => {
    if (ref_.kind === 'record') {
      const row = root[ref_.index];
      if (row !== null && typeof row === 'object') row[column as string] = '';
    }
  });
}

function onKeyChange(oldKey: unknown, event: Event) {
  const newKey = (event.target as HTMLInputElement).value.trim();
  if (!newKey || newKey === oldKey) return;
  withRoot((root) => {
    if (root[newKey] !== undefined) return;
    const entries = Object.entries(root);
    for (const key of Object.keys(root)) delete root[key];
    for (const [key, value] of entries) {
      root[key === oldKey ? newKey : key] = value;
    }
  });
}

function addRow() {
  withRoot((root) => {
    if (Array.isArray(root)) {
      root.push(root.length > 0 && model.value?.kind === 'records' ? {} : '');
    } else {
      root[uniqueKey(Object.keys(root), '新字段')] = '';
    }
  });
}

function removeRow(ref_: RowRef) {
  withRoot((root) => {
    if (ref_.kind === 'record' || ref_.kind === 'list') root.splice(ref_.index, 1);
    else delete root[ref_.key];
  });
}

function startColumn(head: string) {
  editingColumn.value = head;
  columnText.value = head;
}

function commitColumn(head: string) {
  const next = columnText.value.trim();
  editingColumn.value = null;
  if (!next || next === head) return;
  withRoot((root) => {
    for (const row of root) {
      if (row === null || typeof row !== 'object') continue;
      if (next in row && row[next] !== undefined) continue;
      const entries = Object.entries(row);
      for (const key of Object.keys(row)) delete row[key];
      for (const [key, value] of entries) row[key === head ? next : key] = value;
    }
  });
}

function addColumn() {
  const columns = model.value?.head ?? [];
  withRoot((root) => {
    const key = uniqueKey(columns, '新字段');
    for (const row of root) {
      if (row === null || typeof row !== 'object') continue;
      row[key] = '';
    }
  });
}

function removeColumn(head: string) {
  withRoot((root) => {
    for (const row of root) {
      if (row !== null && typeof row === 'object') delete row[head];
    }
  });
}
</script>
