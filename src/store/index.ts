import { defineStore } from "pinia";
import { computed, ref } from "vue";

/** 撤销栈的最大长度 */
const MAX_HISTORY = 200;

export default defineStore("index", () => {
  const path = ref<string>("");
  const name = ref<string>("");
  /** 当前编辑中的文本，是三个编辑器共同的数据源 */
  const content = ref<string>("");
  /** 最近一次保存到磁盘的文本，用来计算 dirty */
  const savedContent = ref<string>("");

  const history = ref<string[]>([]);
  const historyIndex = ref(-1);

  const dirty = computed(() => content.value !== savedContent.value);
  const canUndo = computed(() => historyIndex.value > 0);
  const canRedo = computed(
    () => historyIndex.value >= 0 && historyIndex.value < history.value.length - 1,
  );

  function resetHistory(text: string) {
    history.value = [text];
    historyIndex.value = 0;
  }

  /** 打开一个 JSON 文件，交由编辑器视图使用 */
  function openFile(filePath: string, fileName: string, text: string) {
    path.value = filePath;
    name.value = fileName;
    content.value = text;
    savedContent.value = text;
    resetHistory(text);
  }

  function closeFile() {
    path.value = "";
    name.value = "";
    content.value = "";
    savedContent.value = "";
    resetHistory("");
  }

  /** 记录一次可撤销的修改 */
  function commit(next: string) {
    if (next === content.value) return;
    content.value = next;
    history.value = history.value.slice(0, historyIndex.value + 1);
    history.value.push(next);
    if (history.value.length > MAX_HISTORY) history.value.shift();
    historyIndex.value = history.value.length - 1;
  }

  function undo() {
    if (!canUndo.value) return;
    historyIndex.value -= 1;
    content.value = history.value[historyIndex.value];
  }

  function redo() {
    if (!canRedo.value) return;
    historyIndex.value += 1;
    content.value = history.value[historyIndex.value];
  }

  /** 保存成功后调用 */
  function markSaved() {
    savedContent.value = content.value;
  }

  return {
    path,
    name,
    content,
    savedContent,
    history,
    historyIndex,
    dirty,
    canUndo,
    canRedo,
    openFile,
    closeFile,
    commit,
    undo,
    redo,
    markSaved,
  };
});
