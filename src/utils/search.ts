/** 搜索相关的共享工具 */

export type TextMatch = { start: number; end: number };

/** 不区分大小写地查找所有匹配位置；query 为空时返回空数组（结果不重叠） */
export function findMatches(text: string, query: string): TextMatch[] {
  if (!query) return [];

  const haystack = text.toLowerCase();
  const needle = query.toLowerCase();
  const matches: TextMatch[] = [];
  let from = 0;

  while (from + needle.length <= haystack.length) {
    const index = haystack.indexOf(needle, from);
    if (index === -1) break;
    matches.push({ start: index, end: index + needle.length });
    from = index + needle.length;
  }

  return matches;
}

/** 文本是否包含查询内容（不区分大小写） */
export function containsQuery(text: string, query: string): boolean {
  if (!query) return false;
  return text.toLowerCase().includes(query.toLowerCase());
}
