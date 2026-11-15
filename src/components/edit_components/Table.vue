<template>
  <div class="flex h-full min-h-0 flex-col bg-white dark:bg-slate-950">
    <!-- JSON 无效 -->
    <div v-if="!parsed.ok" class="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <i class="fa-solid fa-triangle-exclamation text-2xl text-amber-500"></i>
      <p class="text-sm font-medium text-slate-700 dark:text-slate-300">当前内容不是合法的 JSON，无法以表格编辑</p>
      <p class="max-w-md text-xs text-slate-500 dark:text-slate-400">{{ parsed.error }}</p>
      <button
        class="mt-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
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
      <i class="fa-solid fa-table-cells text-2xl text-slate-300 dark:text-slate-600"></i>
      <p class="text-sm font-medium text-slate-700 dark:text-slate-300">当前 JSON 无法用表格展示</p>
      <p class="max-w-md text-xs text-slate-500 dark:text-slate-400">
        表格视图适合「对象数组」「对象」或「数组」，请改用树状图或原始文件编辑。
      </p>
      <button
        class="mt-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
        @click="emit('request-tree')"
      >
        切换到「树状图」
      </button>
    </div>

    <template v-else>
      <div class="min-h-0 flex-1 overflow-auto">
        <table
          ref="tableRef"
          class="border-collapse text-[13px]"
          :style="{
            tableLayout: frozen ? 'fixed' : 'auto',
            width: frozen ? totalWidth + 'px' : '100%',
          }"
        >
          <colgroup v-if="frozen">
            <col style="width: 24px" />
            <col
              v-for="(head, index) in model.head"
              :key="'col-' + head + '-' + index"
              :style="{ width: colWidth(index) + 'px' }"
            />
            <col v-if="model.kind !== 'entries'" style="width: 40px" />
          </colgroup>
          <thead class="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900">
            <tr>
              <th class="w-6 border-b border-slate-200 dark:border-slate-800"></th>
              <th
                v-for="(head, index) in model.head"
                :key="index"
                :data-col-index="index"
                class="group relative border-b border-slate-200 px-2 py-1.5 text-left text-[11px] font-medium text-slate-500 dark:border-slate-800 dark:text-slate-400"
                :class="[
                  isHeadSearchHit(index) ? 'bg-amber-100/80 dark:bg-amber-500/25' : '',
                  isCurrentHeadSearchHit(index) ? 'bg-amber-300/80 dark:bg-amber-500/40' : '',
                ]"
              >
                <div v-if="model.kind === 'records'" class="group flex items-center gap-1">
                  <input
                    v-if="editingColumn === head"
                    v-model="columnText"
                    v-focus
                    spellcheck="false"
                    class="w-28 rounded border border-amber-400 bg-white px-1 py-px text-slate-700 outline-none dark:bg-slate-900 dark:text-slate-100"
                    @keydown.enter.prevent="commitColumn(head)"
                    @keydown.esc.prevent="editingColumn = null"
                  />
                  <button
                    v-else
                    class="cursor-text rounded px-1 py-px transition hover:bg-slate-200/70 dark:hover:bg-slate-800/70"
                    title="点击重命名列"
                    @click="startColumn(head)"
                  >
                    {{ head }}
                  </button>
                  <button
                    class="grid h-4 w-4 place-items-center rounded text-slate-400 opacity-0 transition group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 dark:text-slate-500 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                    title="删除列"
                    @click="removeColumn(head)"
                  >
                    <i class="fa-solid fa-xmark text-[9px]"></i>
                  </button>
                </div>
                <span v-else>{{ head }}</span>

                <!-- 列宽拖拽手柄 -->
                <span
                  class="absolute -right-0.5 top-0 z-20 h-full w-1.5 cursor-col-resize touch-none select-none"
                  :class="
                    resizingCol === colKey(index)
                      ? 'bg-amber-400'
                      : 'hover:bg-amber-300/80'
                  "
                  title="拖动调整列宽，双击恢复默认"
                  @pointerdown.stop.prevent="onResizeStart($event, index)"
                  @dblclick.stop="resetColWidth(index)"
                ></span>
              </th>
              <th
                v-if="model.kind === 'records'"
                class="w-10 border-b border-slate-200 px-1 py-1.5 dark:border-slate-800"
              >
                <button
                  class="grid h-5 w-5 place-items-center rounded text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                  title="添加列"
                  @click="addColumn"
                >
                  <i class="fa-solid fa-plus text-[10px]"></i>
                </button>
              </th>
              <th v-else-if="model.kind === 'list'" class="w-10 border-b border-slate-200 dark:border-slate-800"></th>
            </tr>
          </thead>

          <tbody ref="tbodyRef">
            <tr
              v-for="(row, rowIndex) in model.rows"
              :key="rowIndex"
              :data-row-index="rowIndex"
              class="group hover:bg-slate-50 dark:hover:bg-slate-900"
              :class="dragFrom === rowIndex ? 'bg-amber-50 opacity-60 dark:bg-amber-500/10' : ''"
            >
              <td class="w-6 border-b border-slate-100 px-0 align-middle dark:border-slate-800/70">
                <button
                  class="mx-auto grid h-6 w-5 cursor-grab touch-none place-items-center rounded text-slate-300 transition hover:bg-slate-100 hover:text-slate-500 active:cursor-grabbing dark:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-400"
                  title="拖拽调整顺序"
                  @pointerdown="onDragStart($event, rowIndex)"
                >
                  <i class="fa-solid fa-grip-vertical text-[10px]"></i>
                </button>
              </td>
              <td
                v-for="(cell, cellIndex) in row.cells"
                :key="cellIndex"
                :data-cell-index="cellIndex"
                class="border-b border-slate-100 px-1 py-0.5 dark:border-slate-800/70"
                :class="[
                  isCellSearchHit(rowIndex, cellIndex) ? 'bg-amber-100/70 dark:bg-amber-500/20' : '',
                  isCurrentCellSearchHit(rowIndex, cellIndex)
                    ? 'bg-amber-300/80 ring-1 ring-inset ring-amber-500 dark:bg-amber-500/35 dark:ring-amber-400'
                    : '',
                ]"
                @contextmenu.prevent="openCellMenu($event, rowIndex, cellIndex, row.ref, cell)"
              >
                <span v-if="cell.kind === 'index'" class="px-2 text-[11px] text-slate-400 dark:text-slate-500">
                  {{ cell.value }}
                </span>

                <input
                  v-else-if="cell.kind === 'key'"
                  :value="String(cell.value)"
                  spellcheck="false"
                  class="w-full min-w-0 rounded border border-transparent bg-transparent px-1.5 py-1 font-mono text-[12px] text-sky-700 outline-none transition hover:border-slate-200 focus:border-amber-400 focus:bg-white dark:text-sky-300 dark:hover:border-slate-700 dark:focus:bg-slate-900"
                  @keydown.enter="blurOnEnter"
                  @change="onKeyChange(cell.value, $event)"
                />

                <!-- 该行不存在这个字段 -->
                <div v-else-if="cell.value === undefined" class="px-0.5">
                  <button
                    class="inline-flex items-center gap-1 rounded-md border border-dashed border-slate-300 px-1.5 py-0.5 text-[11px] text-slate-400 transition hover:border-amber-400 hover:text-amber-600 dark:border-slate-700 dark:text-slate-500 dark:hover:border-amber-500/70 dark:hover:text-amber-400"
                    title="该字段在当前行不存在，点击添加"
                    @click="addCell(row.ref, cell.column)"
                  >
                    <i class="fa-solid fa-plus text-[9px]"></i>
                    无数据
                  </button>
                </div>

                <!-- 有数据的单元格 -->
                <div v-else class="group/cell flex items-center gap-1">
                  <DropSelect
                    compact
                    :model-value="cellType(cell.value)"
                    :options="TYPE_OPTIONS"
                    @update:model-value="onTypeChange(row.ref, cell.column, $event)"
                  />

                  <button
                    v-if="cellType(cell.value) === 'boolean'"
                    class="min-w-0 flex-1 rounded border border-transparent px-1.5 py-1 text-left font-mono text-[12px] text-violet-600 transition hover:border-slate-200 hover:bg-white dark:text-violet-400 dark:hover:border-slate-700 dark:hover:bg-slate-900"
                    title="点击切换 true / false"
                    @click="toggleBoolean(row.ref, cell.column)"
                  >
                    {{ cell.value }}
                  </button>
                  <input
                    v-else-if="!isComplex(cell.value)"
                    :type="cellType(cell.value) === 'number' ? 'number' : 'text'"
                    :value="cellText(cell.value)"
                    spellcheck="false"
                    :placeholder="cell.value === null ? 'null' : ''"
                    class="min-w-0 flex-1 rounded border border-transparent bg-transparent px-1.5 py-1 font-mono text-[12px] outline-none transition hover:border-slate-200 focus:border-amber-400 focus:bg-white dark:hover:border-slate-700 dark:focus:bg-slate-900"
                    :class="valueClass(cellType(cell.value))"
                    @keydown.enter="blurOnEnter"
                    @change="onValueChange(row.ref, cell.column, $event)"
                  />
                  <input
                    v-else
                    type="text"
                    :value="cellText(cell.value)"
                    spellcheck="false"
                    title="直接输入 JSON 编辑，Esc 还原"
                    class="min-w-0 flex-1 rounded border border-transparent bg-transparent px-1.5 py-1 font-mono text-[12px] text-slate-500 outline-none transition hover:border-slate-200 focus:border-amber-400 focus:bg-white dark:text-slate-400 dark:hover:border-slate-700 dark:focus:bg-slate-900"
                    :class="
                      invalidCells.has(cellKey(row.ref, cell.column))
                        ? 'border-red-400 ring-1 ring-red-300 dark:border-red-500 dark:ring-red-500/40'
                        : ''
                    "
                    @keydown.enter="blurOnEnter"
                    @keydown.esc="revertComplex($event, row.ref, cell.column)"
                    @change="onComplexChange(row.ref, cell.column, $event)"
                  />

                  <button
                    v-if="canDeleteCell(row.ref)"
                    class="grid h-5 w-5 shrink-0 place-items-center rounded text-slate-300 opacity-0 transition group-hover/cell:opacity-100 hover:bg-red-50 hover:text-red-500 dark:text-slate-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                    title="删除该字段"
                    @click="deleteCell(row.ref, cell.column)"
                  >
                    <i class="fa-solid fa-trash-can text-[10px]"></i>
                  </button>
                </div>
              </td>

              <td
                v-if="model.kind !== 'entries'"
                class="w-10 border-b border-slate-100 px-1 dark:border-slate-800/70"
              >
                <button
                  class="grid h-5 w-5 place-items-center rounded text-slate-400 opacity-0 transition group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 dark:text-slate-500 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                  title="删除行"
                  @click="removeRow(row.ref)"
                >
                  <i class="fa-solid fa-trash-can text-[10px]"></i>
                </button>
              </td>
            </tr>

            <tr v-if="model.rows.length === 0">
              <td
                :colspan="model.head.length + (model.kind === 'entries' ? 0 : 1) + 1"
                class="px-3 py-6 text-center text-xs text-slate-400 dark:text-slate-500"
              >
                暂无数据
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 底部操作栏 -->
      <div
        class="flex shrink-0 items-center justify-between border-t border-slate-200 px-3 py-1.5 text-[11px] text-slate-400 dark:border-slate-800 dark:text-slate-500"
      >
        <span>{{ model.rows.length }} 行 · {{ model.head.length }} 列</span>
        <button
          class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1 text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          @click="addRow"
        >
          <i class="fa-solid fa-plus text-[10px]"></i>
          添加行
        </button>
      </div>
    </template>

    <!-- 拖拽时显示的目标插入位置 -->
    <div
      v-if="indicator"
      class="pointer-events-none fixed z-50 h-0.75 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.7)]"
      :style="{
        top: `${indicator.top}px`,
        left: `${indicator.left}px`,
        width: `${indicator.width}px`,
      }"
    >
      <span
        class="absolute -left-1 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-amber-500"
      ></span>
      <span
        class="absolute -right-1 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-amber-500"
      ></span>
    </div>

    <!-- 单元格右键菜单 -->
    <Teleport to="body">
      <Transition name="ctx">
        <div
          v-if="contextMenu"
          ref="ctxMenuEl"
          class="fixed z-70 min-w-44 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-xl shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/40"
          :style="{ top: `${ctxPos.top}px`, left: `${ctxPos.left}px` }"
        >
          <template v-for="(item, index) in contextItems" :key="index">
            <div v-if="'divider' in item" class="my-1 h-px bg-slate-100 dark:bg-slate-800"></div>
            <button
              v-else
              type="button"
              class="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-[12px] transition"
              :class="
                item.danger
                  ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10'
                  : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
              "
              @click="runContextItem(item)"
            >
              <i
                class="fa-solid w-3.5 shrink-0 text-center text-[11px]"
                :class="item.icon"
              ></i>
              <span class="flex-1 whitespace-nowrap">{{ item.label }}</span>
            </button>
          </template>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
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
  type JsonPath,
  type JsonType,
} from '../../utils/json.ts';
import DropSelect from './DropSelect.vue';
import { containsQuery } from '../../utils/search.ts';

const props = defineProps<{ search?: { query: string; index: number } | null }>();

const emit = defineEmits<{
  (e: 'request-raw'): void;
  (e: 'request-tree'): void;
  (e: 'locate', path: JsonPath): void;
  (e: 'notify', message: string, type?: 'success' | 'error' | 'info'): void;
  (e: 'search-count', count: number): void;
}>();

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
      return 'text-amber-600 dark:text-amber-400';
    case 'number':
      return 'text-emerald-600 dark:text-emerald-400';
    case 'boolean':
      return 'text-violet-600 dark:text-violet-400';
    case 'null':
      return 'text-slate-400 dark:text-slate-500';
    default:
      return 'text-slate-600 dark:text-slate-300';
  }
}

/* ---------------- 搜索 ---------------- */
type SearchHit =
  | { kind: 'head'; column: number; key: string }
  | { kind: 'cell'; row: number; cell: number; key: string };

const searchHits = computed<SearchHit[]>(() => {
  const m = model.value;
  const query = props.search?.query ?? '';
  if (!m || !query) return [];

  const hits: SearchHit[] = [];

  // 对象数组的表头就是字段名，也纳入搜索
  if (m.kind === 'records') {
    m.head.forEach((head, column) => {
      if (containsQuery(head, query)) hits.push({ kind: 'head', column, key: `head:${column}` });
    });
  }

  m.rows.forEach((row, rowIndex) => {
    row.cells.forEach((cell, cellIndex) => {
      if (cell.kind === 'index' || cell.value === undefined) return;
      const text =
        cell.kind === 'key'
          ? String(cell.value)
          : cell.value === null
            ? 'null'
            : cellText(cell.value);
      if (containsQuery(text, query)) {
        hits.push({
          kind: 'cell',
          row: rowIndex,
          cell: cellIndex,
          key: `cell:${rowIndex}:${cellIndex}`,
        });
      }
    });
  });

  return hits;
});

const searchHitKeys = computed(() => new Set(searchHits.value.map((hit) => hit.key)));
const currentSearchHit = computed(() => searchHits.value[props.search?.index ?? 0] ?? null);
const currentSearchKey = computed(() => currentSearchHit.value?.key ?? null);

function isCellSearchHit(rowIndex: number, cellIndex: number) {
  return searchHitKeys.value.has(`cell:${rowIndex}:${cellIndex}`);
}

function isCurrentCellSearchHit(rowIndex: number, cellIndex: number) {
  return currentSearchKey.value === `cell:${rowIndex}:${cellIndex}`;
}

function isHeadSearchHit(column: number) {
  return searchHitKeys.value.has(`head:${column}`);
}

function isCurrentHeadSearchHit(column: number) {
  return currentSearchKey.value === `head:${column}`;
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
    const el =
      hit.kind === 'head'
        ? tableRef.value?.querySelector<HTMLElement>(`th[data-col-index="${hit.column}"]`)
        : tbodyRef.value?.querySelector<HTMLElement>(
            `tr[data-row-index="${hit.row}"] td[data-cell-index="${hit.cell}"]`,
          );
    el?.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
  },
  { immediate: true },
);

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

/** 数组 / 对象单元格：按 JSON 文本编辑，无法解析时提示并还原为原值 */
function onComplexChange(ref_: RowRef, column: string | number | undefined, event: Event) {
  const input = event.target as HTMLInputElement;
  const original = currentValue(ref_, column);
  const text = input.value.trim();

  if (!text) {
    input.value = cellText(original);
    flashInvalid(cellKey(ref_, column));
    emit('notify', '内容为空，已还原为原值', 'error');
    return;
  }

  try {
    setValue(ref_, column, JSON.parse(text));
  } catch (error) {
    input.value = cellText(original);
    flashInvalid(cellKey(ref_, column));
    emit('notify', `JSON 格式错误，已还原：${(error as Error).message}`, 'error');
  }
}

/** 按 Esc 放弃本次编辑，直接恢复原值 */
function revertComplex(
  event: KeyboardEvent,
  ref_: RowRef,
  column: string | number | undefined,
) {
  const input = event.target as HTMLInputElement;
  input.value = cellText(currentValue(ref_, column));
  input.blur();
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

/** 按下回车时移除输入框焦点（触发 blur → change，从而提交修改） */
function blurOnEnter(event: KeyboardEvent) {
  if (event.isComposing) return;
  (event.target as HTMLElement).blur();
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

/** 在指定行上方 / 下方插入一行 */
function insertRowAt(rowIndex: number, position: 'above' | 'below') {
  const at = position === 'above' ? rowIndex : rowIndex + 1;
  withRoot((root) => {
    if (Array.isArray(root)) {
      root.splice(at, 0, model.value?.kind === 'records' ? {} : '');
      return;
    }
    const entries = Object.entries(root);
    entries.splice(Math.min(at, entries.length), 0, [uniqueKey(Object.keys(root), '新字段'), '']);
    for (const key of Object.keys(root)) delete root[key];
    for (const [key, value] of entries) root[key] = value;
  });
}

/** 在指定列左侧 / 右侧插入一列（仅对象数组） */
function insertColumnAt(colIndex: number, position: 'left' | 'right') {
  const m = model.value;
  if (!m || m.kind !== 'records') return;
  const at = position === 'left' ? colIndex : colIndex + 1;
  const key = uniqueKey(m.head, '新字段');
  withRoot((root) => {
    for (const row of root) {
      if (row === null || typeof row !== 'object') continue;
      const entries = Object.entries(row);
      entries.splice(Math.min(at, entries.length), 0, [key, '']);
      for (const k of Object.keys(row)) delete row[k];
      for (const [k, v] of entries) row[k] = v;
    }
  });
}

/** 删除指定下标的列 */
function deleteColumnAt(colIndex: number) {
  const head = model.value?.head[colIndex];
  if (head !== undefined) removeColumn(head);
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

/* ---------------- 调整列宽 ---------------- */
const MIN_COL_WIDTH = 80;
/** 冻结后新增列的默认宽度 */
const DEFAULT_COL_WIDTH = 160;
/** 是否已按内容测量并冻结列宽（冻结后才切换到固定布局） */
const frozen = ref(false);
/** 冻结后的列宽（key -> px） */
const colWidths = ref<Record<string, number>>({});

/** 列的身份标识（按下标，重命名列时宽度也能保留） */
function colKey(index: number) {
  const m = model.value;
  return `${m?.kind ?? 'x'}:${index}`;
}

function colWidth(index: number) {
  return colWidths.value[colKey(index)] ?? DEFAULT_COL_WIDTH;
}

/** 首次拖动时，把浏览器按内容算出的各列宽度量下来并冻结 */
function freezeWidths() {
  const table = tableRef.value;
  if (!table) return;
  const widths: Record<string, number> = {};
  table.querySelectorAll<HTMLElement>('th[data-col-index]').forEach((cell) => {
    const index = Number(cell.dataset.colIndex);
    widths[colKey(index)] = Math.round(cell.getBoundingClientRect().width);
  });
  colWidths.value = widths;
  frozen.value = true;
}

/** 表格总宽度（含拖拽列与操作列） */
const totalWidth = computed(() => {
  const m = model.value;
  if (!m) return 0;
  const fixed = 24 + (m.kind === 'entries' ? 0 : 40);
  return fixed + m.head.reduce((sum, _head, index) => sum + colWidth(index), 0);
});

const resizingCol = ref<string | null>(null);
let resizeKey = '';
let resizeStartX = 0;
let resizeStartWidth = 0;

function onResizeStart(event: PointerEvent, index: number) {
  if (event.button !== 0) return;
  if (!frozen.value) freezeWidths();
  resizeKey = colKey(index);
  resizeStartX = event.clientX;
  resizeStartWidth = colWidth(index);
  resizingCol.value = resizeKey;

  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  window.addEventListener('pointermove', onResizeMove);
  window.addEventListener('pointerup', stopResize);
  window.addEventListener('pointercancel', stopResize);
}

function onResizeMove(event: PointerEvent) {
  if (!resizingCol.value) return;
  const next = Math.max(
    MIN_COL_WIDTH,
    Math.round(resizeStartWidth + event.clientX - resizeStartX),
  );
  colWidths.value = { ...colWidths.value, [resizeKey]: next };
}

function stopResize() {
  resizingCol.value = null;
  window.removeEventListener('pointermove', onResizeMove);
  window.removeEventListener('pointerup', stopResize);
  window.removeEventListener('pointercancel', stopResize);
}

/** 双击手柄恢复该列默认宽度 */
function resetColWidth(index: number) {
  const key = colKey(index);
  if (!(key in colWidths.value)) return;
  const next = { ...colWidths.value };
  delete next[key];
  colWidths.value = next;
}

/** 表格结构（records / entries / list）变化时，回到按内容自适应的状态 */
watch(
  () => model.value?.kind,
  () => {
    frozen.value = false;
    colWidths.value = {};
  },
);

/* ---------------- 拖拽调整行顺序 ---------------- */
const tbodyRef = ref<HTMLElement | null>(null);
const tableRef = ref<HTMLElement | null>(null);
/** 正在拖拽的行下标 */
const dragFrom = ref<number | null>(null);
/** 插入位置（0 ~ 行数），用于显示插入指示线 */
const dropAt = ref<number | null>(null);
/** 指示线的屏幕坐标（fixed 定位，视口坐标系） */
const indicator = ref<{ top: number; left: number; width: number } | null>(null);
let rowRects: DOMRect[] = [];

/** 根据目标插入下标算出指示线该画在哪 */
function updateIndicator(target: number) {
  const table = tableRef.value;
  if (!table || rowRects.length === 0) {
    indicator.value = null;
    return;
  }
  const rect = table.getBoundingClientRect();
  const last = rowRects[rowRects.length - 1];
  const top = target >= rowRects.length ? last.bottom : rowRects[target].top;

  indicator.value = { top: top - 1, left: rect.left, width: rect.width };
}

function onDragStart(event: PointerEvent, index: number) {
  if (event.button !== 0) return;
  const rows = tbodyRef.value?.querySelectorAll<HTMLElement>('tr[data-row-index]');
  if (!rows || rows.length < 2) return;

  event.preventDefault();
  dragFrom.value = index;
  dropAt.value = index;
  rowRects = Array.from(rows).map((row) => row.getBoundingClientRect());
  updateIndicator(index);

  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  window.addEventListener('pointermove', onDragMove);
  window.addEventListener('pointerup', onDragEnd);
  window.addEventListener('pointercancel', onDragEnd);
}

function onDragMove(event: PointerEvent) {
  if (dragFrom.value === null) return;
  const y = event.clientY;
  let target = rowRects.length;
  for (let i = 0; i < rowRects.length; i += 1) {
    const rect = rowRects[i];
    if (y < rect.top + rect.height / 2) {
      target = i;
      break;
    }
  }
  dropAt.value = target;
  updateIndicator(target);
}

function onDragEnd() {
  const from = dragFrom.value;
  const to = dropAt.value;
  stopDrag();
  if (from === null || to === null || to === from || to === from + 1) return;
  moveRow(from, to);
}

function stopDrag() {
  dragFrom.value = null;
  dropAt.value = null;
  indicator.value = null;
  rowRects = [];
  window.removeEventListener('pointermove', onDragMove);
  window.removeEventListener('pointerup', onDragEnd);
  window.removeEventListener('pointercancel', onDragEnd);
}

/** 把第 from 行移动到插入位置 to（数组走 splice，对象则重建键顺序） */
function moveRow(from: number, to: number) {
  withRoot((root) => {
    const insertAt = to > from ? to - 1 : to;
    if (Array.isArray(root)) {
      const [moved] = root.splice(from, 1);
      root.splice(insertAt, 0, moved);
      return;
    }
    const entries = Object.entries(root);
    const [moved] = entries.splice(from, 1);
    entries.splice(insertAt, 0, moved);
    for (const key of Object.keys(root)) delete root[key];
    for (const [key, value] of entries) root[key] = value;
  });
}

/* ---------------- 单元格右键菜单 ---------------- */
type MenuItem = { label: string; icon: string; run: () => void; danger?: boolean };
type MenuEntry = MenuItem | { divider: true };

type CtxTarget = {
  rowIndex: number;
  cellIndex: number;
  ref: RowRef;
  column?: string | number;
  hasValue: boolean;
};

const contextMenu = ref<(CtxTarget & { x: number; y: number }) | null>(null);
const ctxMenuEl = ref<HTMLElement | null>(null);
const ctxPos = ref({ top: 0, left: 0 });

/** 右键目标在树状图中的路径 */
function contextPath(ctx: CtxTarget): JsonPath {
  if (ctx.ref.kind === 'record') return [ctx.ref.index, ctx.column as string];
  if (ctx.ref.kind === 'entry') return [ctx.ref.key];
  return [ctx.rowIndex];
}

/** 当前右键目标可执行的操作 */
const contextItems = computed<MenuEntry[]>(() => {
  const ctx = contextMenu.value;
  const m = model.value;
  if (!ctx || !m) return [];

  const items: MenuEntry[] = [];

  if (ctx.hasValue) {
    items.push(
      {
        label: '在树状图中定位',
        icon: 'fa-crosshairs',
        run: () => emit('locate', contextPath(ctx)),
      },
      { divider: true },
    );
  }

  items.push(
    { label: '在上方插入行', icon: 'fa-arrow-up', run: () => insertRowAt(ctx.rowIndex, 'above') },
    { label: '在下方插入行', icon: 'fa-arrow-down', run: () => insertRowAt(ctx.rowIndex, 'below') },
    { label: '删除本行', icon: 'fa-trash-can', danger: true, run: () => removeRow(ctx.ref) },
  );

  if (m.kind === 'records') {
    items.push(
      { divider: true },
      { label: '在左侧插入列', icon: 'fa-arrow-left', run: () => insertColumnAt(ctx.cellIndex, 'left') },
      { label: '在右侧插入列', icon: 'fa-arrow-right', run: () => insertColumnAt(ctx.cellIndex, 'right') },
      { label: '删除本列', icon: 'fa-trash-can', danger: true, run: () => deleteColumnAt(ctx.cellIndex) },
    );
  }

  if (ctx.hasValue && ctx.ref.kind !== 'list') {
    items.push(
      { divider: true },
      { label: '删除该字段', icon: 'fa-eraser', danger: true, run: () => deleteCell(ctx.ref, ctx.column) },
    );
  }

  return items;
});

function openCellMenu(
  event: MouseEvent,
  rowIndex: number,
  cellIndex: number,
  ref_: RowRef,
  cell: Cell,
) {
  contextMenu.value = {
    rowIndex,
    cellIndex,
    ref: ref_,
    column: cell.column,
    hasValue: cell.value !== undefined,
    x: event.clientX,
    y: event.clientY,
  };
  ctxPos.value = { top: event.clientY, left: event.clientX };
  nextTick(clampContextMenu);
}

/** 让菜单不出界 */
function clampContextMenu() {
  const el = ctxMenuEl.value;
  if (!el) return;
  const margin = 8;
  const rect = el.getBoundingClientRect();
  const left = Math.min(ctxPos.value.left, window.innerWidth - rect.width - margin);
  const top = Math.min(ctxPos.value.top, window.innerHeight - rect.height - margin);
  ctxPos.value = { top: Math.max(margin, top), left: Math.max(margin, left) };
}

function runContextItem(item: MenuEntry) {
  if ('divider' in item) return;
  item.run();
  contextMenu.value = null;
}

function closeContextMenu() {
  contextMenu.value = null;
}

function onCtxPointerDown(event: PointerEvent) {
  if (ctxMenuEl.value?.contains(event.target as Node)) return;
  closeContextMenu();
}

function onCtxKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') closeContextMenu();
}

function onCtxReposition() {
  if (contextMenu.value) closeContextMenu();
}

watch(contextMenu, (value) => {
  if (value) {
    document.addEventListener('pointerdown', onCtxPointerDown, true);
    document.addEventListener('keydown', onCtxKeydown, true);
    window.addEventListener('scroll', onCtxReposition, true);
    window.addEventListener('resize', onCtxReposition);
  } else {
    document.removeEventListener('pointerdown', onCtxPointerDown, true);
    document.removeEventListener('keydown', onCtxKeydown, true);
    window.removeEventListener('scroll', onCtxReposition, true);
    window.removeEventListener('resize', onCtxReposition);
  }
});

onBeforeUnmount(() => {
  stopDrag();
  stopResize();
  document.removeEventListener('pointerdown', onCtxPointerDown, true);
  document.removeEventListener('keydown', onCtxKeydown, true);
  window.removeEventListener('scroll', onCtxReposition, true);
  window.removeEventListener('resize', onCtxReposition);
});
</script>

<style scoped>
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
