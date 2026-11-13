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

/** 供表格列名等场景使用：把任意字符串变成合法的唯一键名 */
export function uniqueKey(existing: string[], base: string): string {
  if (!existing.includes(base)) return base;
  let index = 2;
  while (existing.includes(`${base}${index}`)) index += 1;
  return `${base}${index}`;
}
