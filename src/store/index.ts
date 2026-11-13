import { defineStore } from "pinia";
import { ref } from "vue";

export default defineStore("index", () => {
  const path = ref<string>("");
  const name = ref<string>("");
  const content = ref<string>("");

  /** 打开一个 JSON 文件，交由后续编辑器视图使用 */
  function openFile(filePath: string, fileName: string, text: string) {
    path.value = filePath;
    name.value = fileName;
    content.value = text;
  }

  function closeFile() {
    path.value = "";
    name.value = "";
    content.value = "";
  }

  return {
    path,
    name,
    content,
    openFile,
    closeFile,
  };
});
