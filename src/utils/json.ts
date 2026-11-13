/** JSON 编辑相关的共享工具 */

export type JsonType = "string" | "number" | "boolean" | "null" | "object" | "array";

export function jsonType(value: unknown): JsonType {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  const type = typeof value;
  if (type === "string" || type === "number" || type === "boolean") return type;
  return "object";
}

export type ParseResult = { ok: true; value: unknown } | { ok: false; error: string };

export function parseJson(text: string): ParseResult {
  const raw = text.replace(/^\uFEFF/, "").trim();
  if (!raw) return { ok: false, error: "内容为空" };
  try {
    return { ok: true, value: JSON.parse(raw) };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
}

export function stringifyJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export type JsonPath = (string | number)[];

export function pathKey(path: JsonPath): string {
  return JSON.stringify(path);
}

export function getAt(root: unknown, path: JsonPath): unknown {
  let current: any = root;
  for (const key of path) {
    if (current === null || current === undefined) return undefined;
    current = current[key];
  }
  return current;
}

export function parentOf(root: unknown, path: JsonPath): any {
  return path.length === 0 ? undefined : getAt(root, path.slice(0, -1));
}

/** 把值转换成指定类型，用于类型切换 */
export function convertValue(value: unknown, type: JsonType): unknown {
  switch (type) {
    case "string":
      if (value === null || value === undefined) return "";
      if (typeof value === "object") return JSON.stringify(value);
      return String(value);
    case "number": {
      if (typeof value === "number") return value;
      if (typeof value === "boolean") return value ? 1 : 0;
      const num = Number(value);
      return Number.isFinite(num) ? num : 0;
    }
    case "boolean":
      if (typeof value === "boolean") return value;
      if (typeof value === "number") return value !== 0;
      if (typeof value === "string") return value === "true" || value === "1";
      return false;
    case "null":
      return null;
    case "array":
      if (Array.isArray(value)) return value;
      // 把标量包成单元素数组，尽量不丢数据
      return value === null || value === undefined ? [] : [value];
    case "object":
      if (value !== null && typeof value === "object" && !Array.isArray(value)) return value;
      return {};
    default:
      return value;
  }
}

export type DropdownOption = { value: string; label: string; icon?: string; color?: string };

/** 数据类型选项（带图标与配色，供自绘下拉菜单使用） */
export const TYPE_OPTIONS: DropdownOption[] = [
  { value: "string", label: "字符串", icon: "fa-font", color: "#059669" },
  { value: "number", label: "数字", icon: "fa-hashtag", color: "#d97706" },
  { value: "boolean", label: "布尔", icon: "fa-toggle-on", color: "#7c3aed" },
  { value: "null", label: "null", icon: "fa-ban", color: "#94a3b8" },
  { value: "array", label: "数组", icon: "fa-list-ul", color: "#0284c7" },
  { value: "object", label: "对象", icon: "fa-cube", color: "#db2777" },
];

export const BOOL_OPTIONS: DropdownOption[] = [
  { value: "true", label: "true", icon: "fa-check", color: "#7c3aed" },
  { value: "false", label: "false", icon: "fa-xmark", color: "#94a3b8" },
];

const HTML_ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;" };

function escapeHtml(text: string): string {
  return text.replace(/[&<>]/g, (char) => HTML_ESCAPES[char]);
}

/**
 * 给 JSON 文本生成高亮 HTML（键 / 字符串 / 数字 / 布尔 / null / 标点分色）。
 * 未闭合的字符串也会被识别，方便边输入边高亮。
 */
export function highlightJson(text: string): string {
  const tokenRe =
    /("(?:\\.|[^"\\])*"?)|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|\b(true|false|null)\b|([{}[\],:])/g;

  let html = "";
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRe.exec(text)) !== null) {
    if (match.index > last) html += escapeHtml(text.slice(last, match.index));

    const token = match[0];
    let cls = "text-slate-400";

    if (match[1] !== undefined) {
      const rest = text.slice(match.index + token.length);
      cls = /^\s*:/.test(rest) ? "text-sky-700" : "text-emerald-600";
    } else if (match[2] !== undefined) {
      cls = "text-amber-600";
    } else if (match[3] === "null") {
      cls = "text-slate-400";
    } else if (match[3] !== undefined) {
      cls = "text-violet-600";
    }

    html += `<span class="${cls}">${escapeHtml(token)}</span>`;
    last = match.index + token.length;
  }

  if (last < text.length) html += escapeHtml(text.slice(last));
  return html;
}

/** 供表格列名等场景使用：把任意字符串变成合法的唯一键名 */
export function uniqueKey(existing: string[], base: string): string {
  if (!existing.includes(base)) return base;
  let index = 2;
  while (existing.includes(`${base}${index}`)) index += 1;
  return `${base}${index}`;
}
