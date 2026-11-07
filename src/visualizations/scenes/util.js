// Small helpers shared by scene files (see ./index.js for the scene format).

/** the value if it is a plain array of numbers / strings, else null */
export const row = (v) => (Array.isArray(v) && v.every((x) => x === null || typeof x !== 'object') ? v : null);

/** indexes where two equal-length rows differ */
export const changedIdx = (a, b) => (row(a) && row(b) && a.length === b.length ? a.map((x, i) => (x === b[i] ? -1 : i)).filter((i) => i >= 0) : []);

/** [x, y] when exactly two cells traded values between `before` and `after`, else null */
export function swapped(after, before) {
  const d = changedIdx(after, before);
  return d.length === 2 && after[d[0]] === before[d[1]] && after[d[1]] === before[d[0]] ? d : null;
}

export const sorted = (a) => !!row(a) && a.every((x, i) => i === 0 || a[i - 1] <= x);

/** [name, value] of the first of `names` that holds an integer in `vars` */
export function firstInt(vars, names) {
  const n = names.find((k) => Number.isInteger(vars[k]));
  return n === undefined ? [undefined, undefined] : [n, vars[n]];
}

/** node ids marked visited: a Set ($set) or a flag array under a visited-like name */
export function visitedSet(vars) {
  const out = new Set();
  for (const [k, v] of Object.entries(vars)) {
    if (!/visited|seen|^vis$/i.test(k)) continue;
    if (v && v.$set) v.$set.forEach((x) => out.add(x));
    else if (row(v)) v.forEach((x, i) => x && x !== -1 && out.add(i));
  }
  return out;
}

/** a predict card: the right option plus up to three distinct wrong ones, in a stable order */
export function options(question, right, wrong, explain) {
  const opts = [...new Set([String(right), ...wrong.map(String)])].slice(0, 4);
  if (opts.length < 2) return null;
  const num = opts.every((o) => o.trim() !== '' && Number.isFinite(Number(o)));
  opts.sort(num ? (a, b) => Number(a) - Number(b) : undefined); // numbers in numeric order, text alphabetically
  return { question, options: opts, answer: opts.indexOf(String(right)), explain };
}

/** [[key, value], …] of a Map ($map) or a plain object used as one ($obj), else null: scenes read counters with it */
export function entriesOf(v) {
  if (v && v.$map) return v.$map;
  // only a plain counter / lookup: every value simple (a toolkit MinHeap { heap: [...] } is not a counter)
  if (v && v.$obj && Object.values(v.$obj).every((x) => x === null || typeof x !== 'object')) return Object.entries(v.$obj);
  return null;
}

/** cell i of an array snapshot: a plain row, or a long array ({ $array: first 64, $length, $sparse: cells ≠ $fill, $fill }) */
export function cellAt(v, i) {
  if (Array.isArray(v)) return v[i];
  if (!v || !v.$array) return undefined;
  if (i < v.$array.length) return v.$array[i];
  if (v.$sparse) return v.$sparse.find(([k]) => k === i)?.[1] ?? (i < v.$length ? v.$fill ?? 0 : undefined);
  return undefined;
}

/**
 * the items of a stack / queue / deque / heap, front (or bottom) first: a plain row, or a toolkit object snapshot
 * (Queue { items, head }, Deque ring { buf, head, count }, Stack { items }, MinHeap / PriorityQueue { heap })
 */
export function itemsOf(v) {
  if (Array.isArray(v)) return v;
  const o = v && v.$obj;
  if (!o) return null;
  if (Array.isArray(o.heap)) return o.heap;
  if (Array.isArray(o.items)) return Number.isInteger(o.head) ? o.items.slice(o.head) : o.items;
  if (Array.isArray(o.buf) && Number.isInteger(o.head) && Number.isInteger(o.count)) return Array.from({ length: o.count }, (_, k) => o.buf[(o.head + k) % o.buf.length]);
  return null;
}

/**
 * what left and what joined a collection between two steps (multiset difference, order ignored): for heaps and
 * queues, `removed` is what was popped and `added` what was pushed. Items are compared by their JSON text.
 */
export function diffItems(before, after) {
  const count = new Map();
  for (const x of before || []) count.set(JSON.stringify(x), (count.get(JSON.stringify(x)) || 0) + 1);
  const added = [];
  for (const x of after || []) {
    const k = JSON.stringify(x);
    if (count.get(k)) count.set(k, count.get(k) - 1);
    else added.push(x);
  }
  const removed = [];
  for (const x of before || []) {
    const k = JSON.stringify(x);
    if (count.get(k)) {
      removed.push(x);
      count.set(k, count.get(k) - 1);
    }
  }
  return { removed, added };
}

/** union-find: the group leader of x in a parent row (follows parent links; stops on a loop) */
export function leaderOf(parent, x) {
  if (!Array.isArray(parent)) return undefined;
  const seen = new Set();
  while (Number.isInteger(parent[x]) && parent[x] !== x && !seen.has(x)) {
    seen.add(x);
    x = parent[x];
  }
  return x;
}

const PARENT = /^(parent|parents|par|p|root|roots|fa|leader|boss|uf|dsu|ds)$/i;
/**
 * union-find: the parent row in a step's variables (a parent-like name, or a field of a DSU object such as
 * this.parent / uf.parent), else null. `skip`: names never to take (e.g. ctx.params); `empty`: accept [].
 */
export function parentOf(vars, skip = [], empty = false) {
  const ok = (v) => row(v) && (empty || v.length > 0) && v.every(Number.isInteger);
  for (const [k, v] of Object.entries(vars || {})) {
    if (skip.includes(k)) continue;
    if (PARENT.test(k) && ok(v)) return v;
    const o = v && v.$obj;
    if (o) for (const f of ['parent', 'parents', 'par', 'root', 'p', 'fa']) if (ok(o[f])) return o[f];
  }
  return null;
}

/** union-find: the groups of a parent row as [[leader, members…], …], leaders in index order */
export function groupsOf(parent) {
  if (!Array.isArray(parent)) return [];
  const by = new Map();
  parent.forEach((_, i) => {
    const r = leaderOf(parent, i);
    if (!by.has(r)) by.set(r, []);
    by.get(r).push(i);
  });
  return [...by.entries()].sort((a, b) => a[0] - b[0]).map(([r, m]) => [r, ...m.filter((x) => x !== r)]);
}

const FN_HEAD = /(?:function\s+([A-Za-z_$][\w$]*)\s*\(|([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:function\b[^(]*\(|\([^)]*\)\s*=>|[A-Za-z_$][\w$]*\s*=>)|^\s*(?:async\s+)?([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{)/;
const NOT_FN = new Set(['if', 'for', 'while', 'switch', 'catch', 'return', 'function']);
/**
 * the name of the innermost function whose body holds line `at` (1-based), found by brace counting from each
 * function header: tells a helper's steps (and returns) from the main function's. '' when none is found.
 * shortcut: braces inside strings / comments are counted too; fine for interview-style code.
 */
export function functionAt(lines, at) {
  let best = '';
  let bestStart = -1;
  lines.forEach((l, i) => {
    const m = FN_HEAD.exec(l);
    const name = m && (m[1] || m[2] || m[3]);
    if (!name || NOT_FN.has(name) || i + 1 > at) return;
    let depth = 0;
    let opened = false;
    for (let j = i; j < lines.length; j++) {
      for (const c of lines[j]) {
        if (c === '{') (depth++, (opened = true));
        else if (c === '}') depth--;
      }
      if (opened && depth <= 0) {
        if (at <= j + 1 && i > bestStart) (best = name), (bestStart = i);
        return;
      }
      if (!opened && j > i) return; // an arrow with an expression body: no braces to count
    }
  });
  return best;
}

/** a plain hand-over line (`prev = cur;`, `const row = rows[i - 1];`): it moves a name, it does not compute a cell */
export const isHandover = (src) => /^\s*(?:(?:const|let|var)\s+)?[A-Za-z_$][\w$]*\s*=\s*[A-Za-z_$][\w$.]*(?:\[[^\]]*\])?\s*;?\s*(?:\/\/.*)?$/.test(src || '');

/**
 * the cell a line writes, read from the line itself: `dp[i][j - 1] = …` with i = 2, j = 3 → { name: 'dp', at: [2, 2] }.
 * Indexes may be a number, a variable, or a variable ± a number; anything else → null. Use it when a write can leave the
 * value unchanged (boolean tables), so a diff with the previous step finds nothing.
 */
export function writtenCell(src, vars) {
  const m = /([A-Za-z_$][\w$]*)((?:\[[^\]]+\])+)\s*(?:[-+*/%|&^]|\*\*|\|\||&&|\?\?)?=(?!=)/.exec(src || '');
  if (!m) return null;
  const at = [];
  for (const [, e] of m[2].matchAll(/\[([^\]]+)\]/g)) {
    const t = /^\s*(?:(-?\d+)|([A-Za-z_$][\w$]*)\s*(?:([+-])\s*(\d+))?)\s*$/.exec(e);
    if (!t) return null;
    if (t[1] !== undefined) at.push(Number(t[1]));
    else if (Number.isInteger(vars?.[t[2]])) at.push(vars[t[2]] + (t[3] ? (t[3] === '-' ? -1 : 1) * Number(t[4]) : 0));
    else return null;
  }
  return { name: m[1], at };
}

/**
 * the function the current step is in and its parameters' current values: { name, args: { p: value } }, or null.
 * In recursion this is "the call we are in": dfs(i, path) → { name: 'dfs', args: { i: 2, path: [1, 3] } }.
 */
export function callArgs(ctx) {
  const name = functionAt(ctx.lines, ctx.line);
  if (!name) return null;
  const head = ctx.lines.find((l) => FN_HEAD.exec(l) && [1, 2, 3].some((k) => FN_HEAD.exec(l)[k] === name));
  const open = head ? head.indexOf('(', head.indexOf(name)) : -1;
  let params = [];
  if (open >= 0) {
    let depth = 0;
    let cur = '';
    for (const c of head.slice(open + 1)) {
      if ('([{'.includes(c)) depth++;
      if (')]}'.includes(c) && depth-- === 0) break;
      if (c === ',' && depth === 0) (params.push(cur), (cur = ''));
      else cur += c;
    }
    params.push(cur);
    params = params.map((p) => /^\s*(?:\.\.\.)?([A-Za-z_$][\w$]*)/.exec(p)?.[1]).filter(Boolean);
  } else {
    const bare = new RegExp(`${name}\\s*=\\s*([A-Za-z_$][\\w$]*)\\s*=>`).exec(head || '');
    if (bare) params = [bare[1]];
  }
  return { name, args: Object.fromEntries(params.filter((p) => p in (ctx.vars || {})).map((p) => [p, ctx.vars[p]])) };
}
