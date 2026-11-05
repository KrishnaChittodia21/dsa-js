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
  opts.sort();
  return { question, options: opts, answer: opts.indexOf(String(right)), explain };
}

/** [[key, value], …] of a Map ($map) or a plain object used as one ($obj), else null: scenes read counters with it */
export function entriesOf(v) {
  if (v && v.$map) return v.$map;
  if (v && v.$obj) return Object.entries(v.$obj);
  return null;
}

/** cell i of an array snapshot: a plain row, or a long array ({ $array: first 64, $length, $sparse: non-zero cells }) */
export function cellAt(v, i) {
  if (Array.isArray(v)) return v[i];
  if (!v || !v.$array) return undefined;
  if (i < v.$array.length) return v.$array[i];
  if (v.$sparse) return v.$sparse.find(([k]) => k === i)?.[1] ?? (i < v.$length ? 0 : undefined);
  return undefined;
}
