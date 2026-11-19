import { createI18n } from 'vue-i18n';

export type Locale = 'en' | 'zh-CN';

const messages = {
  en: {
    common: {
      untitled: 'Untitled',
      save: 'Save',
      confirm: 'Confirm',
      close: 'Close',
    },
    add: {
      title: 'Open JSON File',
      subtitle: 'Drag a file below, or choose one locally to start editing',
      valid: 'Valid',
      removeFile: 'Remove file',
      startEditing: 'Start editing',
      changeFile: 'Change file',
      reading: 'Reading file…',
      dropToAdd: 'Drop to add the file',
      dragHere: 'Drag a JSON file here',
      validating: 'Validating JSON content, please wait',
      or: 'or',
      browseLocal: 'browse a local file',
      quickOpen: 'Quick open',
      closeNotice: 'Dismiss notice',
      support: 'Supports .json files · Max {size} MB per file',
      privacy: 'This website does not store any files you upload',
      summary: {
        array: 'Array · {count} items',
        object: 'Object · {count} keys',
        string: 'String',
      },
      error: {
        onlyJson: 'Only .json files are supported, please choose again',
        tooLarge: 'File size cannot exceed {size} MB',
        empty: 'The file is empty',
        invalidJson: 'Invalid JSON: {message}',
        readFailed: 'Failed to read the file',
        readFailedRetry: 'Failed to read the file, please try again',
        pickerFailed: 'Unable to open file picker',
        noFile: 'No file detected, please try again',
        dropOnlyJson: 'Only .json files can be dropped here',
      },
      dialog: {
        jsonFiles: 'JSON Files',
      },
      lang: {
        label: 'Language',
        en: 'English',
        zhCN: '简体中文',
      },
    },
    edit: {
      tabs: {
        tree: 'Tree',
        table: 'Table',
        raw: 'Raw',
      },
      unsaved: 'Unsaved changes',
      undo: 'Undo ({shortcut})',
      redo: 'Redo ({shortcut})',
      search: 'Search ({shortcut})',
      format: 'Format',
      save: 'Save ({shortcut})',
      closeFile: 'Close file',
      searchPlaceholder: 'Search current view',
      searchPrev: 'Previous (Shift+Enter)',
      searchNext: 'Next (Enter)',
      searchClose: 'Close (Esc)',
      toast: {
        saveInvalid: 'Invalid JSON, cannot save: {error}',
        downloaded: 'Downloaded {name}',
        saved: 'Saved to {name}',
        saveFailed: 'Save failed',
        formatInvalid: 'Cannot format: {error}',
        alreadyFormatted: 'Content is already formatted',
        formatted: 'Formatted',
      },
      dialog: {
        unsavedTitle: 'Unsaved changes',
        confirmClose: 'You have unsaved changes. Close anyway?',
        confirmExit: 'You have unsaved changes. Quit anyway?',
      },
    },
    raw: {
      placeholder: 'Edit JSON text here…',
      valid: 'Valid JSON · {lines} lines',
    },
    tree: {
      invalidTitle: 'The current content is not valid JSON and cannot be edited as a tree',
      switchToRaw: 'Switch to "Raw" to fix it',
      expand: 'Expand',
      collapse: 'Collapse',
      items: '{count} items',
      confirm: 'Confirm',
      add: 'Add',
      delete: 'Delete',
      keyPlaceholder: 'Key name',
    },
    table: {
      invalidTitle: 'The current content is not valid JSON and cannot be edited as a table',
      switchToRaw: 'Switch to "Raw" to fix it',
      unsupportedTitle: 'The current JSON cannot be displayed as a table',
      unsupportedDesc: 'Table view works best with "arrays of objects", "objects", or "arrays". Please use Tree or Raw view instead.',
      switchToTree: 'Switch to "Tree"',
      clickToRename: 'Click to rename column',
      deleteColumn: 'Delete column',
      resizeColumn: 'Drag to resize column, double-click to reset',
      addColumn: 'Add column',
      dragRow: 'Drag to reorder',
      missingFieldTitle: 'This field does not exist in this row. Click to add',
      noData: 'No data',
      toggleBoolean: 'Click to toggle true / false',
      complexHint: 'Edit as JSON text, press Esc to revert',
      deleteField: 'Delete field',
      deleteRow: 'Delete row',
      empty: 'No data',
      summary: '{rows} rows · {cols} columns',
      addRow: 'Add row',
      headers: {
        index: '#',
        value: 'Value',
        key: 'Key',
      },
      menu: {
        locateInTree: 'Locate in tree',
        insertRowAbove: 'Insert row above',
        insertRowBelow: 'Insert row below',
        deleteRow: 'Delete this row',
        insertColLeft: 'Insert column left',
        insertColRight: 'Insert column right',
        deleteColumn: 'Delete this column',
        deleteField: 'Delete this field',
      },
      notify: {
        emptyReverted: 'Content is empty, reverted to original value',
        invalidReverted: 'Invalid JSON, reverted: {message}',
      },
      newField: 'New field',
    },
    window: {
      minimize: 'Minimize',
      maximize: 'Maximize',
      restore: 'Restore',
      close: 'Close',
    },
    types: {
      string: 'String',
      number: 'Number',
      boolean: 'Boolean',
      null: 'null',
      array: 'Array',
      object: 'Object',
    },
    json: {
      empty: 'Content is empty',
    },
  },
  'zh-CN': {
    common: {
      untitled: '未命名',
      save: '保存',
      confirm: '确认',
      close: '关闭',
    },
    add: {
      title: '打开 JSON 文件',
      subtitle: '拖拽文件到下方，或从本地选择，即可开始编辑',
      valid: '有效',
      removeFile: '移除文件',
      startEditing: '开始编辑',
      changeFile: '更换文件',
      reading: '正在读取文件…',
      dropToAdd: '松开即可添加文件',
      dragHere: '拖拽 JSON 文件到此处',
      validating: '正在校验 JSON 内容，请稍候',
      or: '或',
      browseLocal: '点击浏览本地文件',
      quickOpen: '快速打开',
      closeNotice: '关闭提示',
      support: '支持 .json 文件 · 单文件最大 {size} MB',
      privacy: '本网站不会存储你上传的任何文件',
      summary: {
        array: '数组 · {count} 项',
        object: '对象 · {count} 个键',
        string: '字符串',
      },
      error: {
        onlyJson: '仅支持 .json 文件，请重新选择',
        tooLarge: '文件大小不能超过 {size} MB',
        empty: '文件内容为空',
        invalidJson: 'JSON 格式错误：{message}',
        readFailed: '读取文件失败',
        readFailedRetry: '读取文件失败，请重试',
        pickerFailed: '无法打开文件选择器',
        noFile: '未检测到文件，请重试',
        dropOnlyJson: '仅支持拖入 .json 文件',
      },
      dialog: {
        jsonFiles: 'JSON 文件',
      },
      lang: {
        label: '语言',
        en: 'English',
        zhCN: '简体中文',
      },
    },
    edit: {
      tabs: {
        tree: '树状图',
        table: '表格',
        raw: '原始文件',
      },
      unsaved: '有未保存的修改',
      undo: '撤销 ({shortcut})',
      redo: '恢复 ({shortcut})',
      search: '搜索 ({shortcut})',
      format: '格式化',
      save: '保存 ({shortcut})',
      closeFile: '关闭文件',
      searchPlaceholder: '搜索当前视图',
      searchPrev: '上一个 (⇧ Enter)',
      searchNext: '下一个 (Enter)',
      searchClose: '关闭 (Esc)',
      toast: {
        saveInvalid: 'JSON 格式错误，无法保存：{error}',
        downloaded: '已下载 {name}',
        saved: '已保存到 {name}',
        saveFailed: '保存失败',
        formatInvalid: '无法格式化：{error}',
        alreadyFormatted: '内容已是格式化状态',
        formatted: '已格式化',
      },
      dialog: {
        unsavedTitle: '未保存的修改',
        confirmClose: '有未保存的修改，确定要关闭吗？',
        confirmExit: '有未保存的修改，确定要退出吗？',
      },
    },
    raw: {
      placeholder: '在这里直接编辑 JSON 文本…',
      valid: 'JSON 有效 · {lines} 行',
    },
    tree: {
      invalidTitle: '当前内容不是合法的 JSON，无法以树状图编辑',
      switchToRaw: '切换到「原始文件」修复',
      expand: '展开',
      collapse: '折叠',
      items: '{count} 项',
      confirm: '确认',
      add: '添加',
      delete: '删除',
      keyPlaceholder: '字段名',
    },
    table: {
      invalidTitle: '当前内容不是合法的 JSON，无法以表格编辑',
      switchToRaw: '切换到「原始文件」修复',
      unsupportedTitle: '当前 JSON 无法用表格展示',
      unsupportedDesc: '表格视图适合「对象数组」「对象」或「数组」，请改用树状图或原始文件编辑。',
      switchToTree: '切换到「树状图」',
      clickToRename: '点击重命名列',
      deleteColumn: '删除列',
      resizeColumn: '拖动调整列宽，双击恢复默认',
      addColumn: '添加列',
      dragRow: '拖拽调整顺序',
      missingFieldTitle: '该字段在当前行不存在，点击添加',
      noData: '无数据',
      toggleBoolean: '点击切换 true / false',
      complexHint: '直接输入 JSON 编辑，Esc 还原',
      deleteField: '删除该字段',
      deleteRow: '删除行',
      empty: '暂无数据',
      summary: '{rows} 行 · {cols} 列',
      addRow: '添加行',
      headers: {
        index: '#',
        value: '值',
        key: '键',
      },
      menu: {
        locateInTree: '在树状图中定位',
        insertRowAbove: '在上方插入行',
        insertRowBelow: '在下方插入行',
        deleteRow: '删除本行',
        insertColLeft: '在左侧插入列',
        insertColRight: '在右侧插入列',
        deleteColumn: '删除本列',
        deleteField: '删除该字段',
      },
      notify: {
        emptyReverted: '内容为空，已还原为原值',
        invalidReverted: 'JSON 格式错误，已还原：{message}',
      },
      newField: '新字段',
    },
    window: {
      minimize: '最小化',
      maximize: '最大化',
      restore: '向下还原',
      close: '关闭',
    },
    types: {
      string: '字符串',
      number: '数字',
      boolean: '布尔',
      null: 'null',
      array: '数组',
      object: '对象',
    },
    json: {
      empty: '内容为空',
    },
  },
} as const;

function detectLocale(): Locale {
  if (typeof navigator === 'undefined') return 'en';
  const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('locale') : null;
  if (saved === 'en' || saved === 'zh-CN') return saved;

  const candidates = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const lang of candidates) {
    const lower = (lang || '').toLowerCase();
    if (lower.startsWith('zh')) return 'zh-CN';
    if (lower.startsWith('en')) return 'en';
  }
  return 'en';
}

const locale = detectLocale();

export const i18n = createI18n({
  legacy: false,
  locale,
  fallbackLocale: 'en',
  messages,
});

if (typeof document !== 'undefined') {
  document.documentElement.lang = locale;
}

export function setLocale(next: Locale) {
  i18n.global.locale.value = next;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('locale', next);
  }
  if (typeof document !== 'undefined') {
    document.documentElement.lang = next;
  }
}
