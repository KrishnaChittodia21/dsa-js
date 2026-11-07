// Hashing + two-pointer pattern scenarios. Each generate(input) returns frames: { note, panels, predict? }.
const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const table = (cells, states, rowLabels, colLabels, label) => ({ kind: 'table', cells, states, rowLabels, colLabels, label });
const ask = (question, options, answer, explain) => ({ question, options, answer, explain });
// Distinct options with the correct one placed at index pos % n; undefined if fewer than 2 distinct options.
const pick = (question, correct, wrong, pos = 0, explain) => {
  const c = String(correct);
  const w = [...new Set(wrong.map(String))].filter((o) => o !== c).slice(0, 3);
  if (!w.length) return undefined;
  const at = pos % (w.length + 1);
  return ask(question, [...w.slice(0, at), c, ...w.slice(at)], at, explain);
};
const clampInt = (x, lo, hi, dflt = 0) => {
  const n = Math.trunc(Number(x));
  return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : dflt;
};
const toInts = (xs, max, lo = -999, hi = 999) => (Array.isArray(xs) ? xs : []).slice(0, max).map((x) => clampInt(x, lo, hi));
// value → index map drawn as a one-column table (placeholder row when empty).
const mapTable = (map, hl = {}, label) =>
  map.size
    ? table([...map.values()].map((v) => [v]), [...map.keys()].map((k) => [hl[k] || '']), [...map.keys()].map((k) => `${k}`), ['index'], label)
    : table([['—']], [['muted']], ['(empty)'], ['index'], label);

// ───────────────────────────── 1. Complement lookup (two sum) ─────────────────────────────
export const complementLookup = {
  problem: { name: 'Two Sum', statement: 'Return the indices of the two numbers that add up to the target.', example: 'nums = [4, 1, 7, 3, 8, 5], target = 12 → [0, 4] (4 + 8)', exampleOutput: [0, 4], questionId: 'two-sum' },
  title: 'Complement lookup: two sum with a map',
  description: 'Scan once; for each x ask the map (value → index of EARLIER elements) for target − x; if it is missing, store x. Up to 10 integers in −999..999.',
  defaultInput: { nums: [4, 1, 7, 3, 8, 5], target: 12 },
  fields: [
    { key: 'nums', type: 'numbers', label: 'nums' },
    { key: 'target', type: 'number', label: 'target' },
  ],
  testInputs: [
    { nums: [], target: 5 },
    { nums: [6], target: 12 },
    { nums: [3, 3], target: 6 },
    { nums: [-3, 4, -1, 9], target: -4 },
    { nums: [2, 2, 2], target: 5 },
    { nums: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], target: 23 },
  ],
  generate({ nums, target }) {
    const a = toInts(nums, 10);
    const T = clampInt(target, -1999, 1999);
    const indexOf = new Map();
    const frames = [];
    let q = 0;
    const label = 'indexOf: value → index (earlier only)';
    const ptr = (i) => [{ index: i, label: 'i', color: 'a' }];
    const seen = (i) => Object.fromEntries(Array.from({ length: i }, (_, k) => [k, 'visited']));
    frames.push({
      note: `Find two indices whose values add up to ${T}. Instead of trying every pair (O(n²)), scan once and remember each value we have passed in a map.`,
      panels: [arr(a), mapTable(indexOf, {}, label), vars({ target: T })],
    });
    for (let i = 0; i < a.length; i++) {
      const x = a[i];
      const need = T - x;
      frames.push({
        note: `i = ${i}, x = ${x}. The partner we need is target − x = ${T} − ${x} = ${need}. Ask the map: did we already pass a ${need}?`,
        panels: [arr(a, { pointers: ptr(i), highlights: { ...seen(i), [i]: 'active' } }), mapTable(indexOf, {}, label), vars({ i, x, need })],
        predict: i === 2 ? pick(`x = ${x}, target = ${T}. Which value do we look up in the map?`, need, [x, T + x, need + 1], q++) : undefined,
      });
      const has = indexOf.has(need);
      const p = i >= 1 && (i % 2 === 1 || has) ? pick(`Is ${need} in the map right now?`, has ? 'Yes — we are done' : 'No — store x and move on', [has ? 'No — store x and move on' : 'Yes — we are done'], q++) : undefined;
      if (has) {
        const j = indexOf.get(need);
        frames.push({
          note: `Yes! The map says ${need} was at index ${j}. ${a[j]} + ${x} = ${T}, so the answer is [${j}, ${i}]. One pass: O(n) time, O(n) extra space for the map.`,
          panels: [arr(a, { pointers: ptr(i), highlights: { ...seen(i), [j]: 'done', [i]: 'done' } }), mapTable(indexOf, { [need]: 'done' }, label), vars({ answer: `[${j}, ${i}]` })],
          predict: p,
        });
        frames.at(-1).result = [j, i];
        return frames;
      }
      indexOf.set(x, i);
      frames.push({
        note: `No ${need} yet. Store ${x} → ${i} AFTER checking, so x can never pair with itself (that would break target = 2x). A later element may need ${x}.`,
        panels: [arr(a, { pointers: ptr(i), highlights: { ...seen(i), [i]: 'visited' } }), mapTable(indexOf, { [x]: 'active' }, label), vars({ i, x, stored: `${x} → ${indexOf.get(x)}` })],
        predict: p,
      });
    }
    frames.push({
      note: `Scanned every element and no complement was ever in the map, so no pair adds up to ${T}: return []. Still one pass: O(n) time, O(n) space.`,
      panels: [arr(a, { highlights: seen(a.length) }), mapTable(indexOf, {}, label), vars({ answer: '[]' })],
    });
    frames.at(-1).result = [];
    return frames;
  },
};

// ───────────────────────────── 2. Canonical key (group anagrams) ─────────────────────────────
export const canonicalKeyGroups = {
  problem: { name: 'Group Anagrams', statement: 'Group the words that are anagrams of each other.', example: '[eat, tea, tan, ate, nat, bat] → [[eat, tea, ate], [tan, nat], [bat]]', exampleOutput: [['eat', 'tea', 'ate'], ['tan', 'nat'], ['bat']], questionId: 'group-anagrams' },
  title: 'Canonical keys: group anagrams',
  description: 'Each word → its sorted-letters key; words with the same key land in the same Map bucket. Up to 8 words of up to 8 characters.',
  defaultInput: { words: ['eat', 'tea', 'tan', 'ate', 'nat', 'bat'] },
  fields: [{ key: 'words', type: 'strings', label: 'words' }],
  testInputs: [{ words: [] }, { words: ['a'] }, { words: ['ab', 'ba', 'ab'] }, { words: ['', 'b', ''] }, { words: ['abc', 'bca', 'cab', 'xyz', 'zyx', 'q', 'q', 'aa', 'bb', 'cc'] }],
  generate({ words }) {
    const ws = (Array.isArray(words) ? words : []).slice(0, 8).map((w) => String(w ?? '').slice(0, 8));
    const groups = new Map();
    const frames = [];
    let q = 0;
    const show = (k) => (k === '' ? '""' : k);
    const groupTable = (hl) =>
      groups.size
        ? table([...groups.values()].map((g) => [g.map(show).join(', ')]), [...groups.keys()].map((k) => [hl === k ? 'active' : '']), [...groups.keys()].map(show), ['words'], 'groups: key → words')
        : table([['—']], [['muted']], ['(empty)'], ['words'], 'groups: key → words');
    const done = (i) => Object.fromEntries(Array.from({ length: i }, (_, k) => [k, 'visited']));
    frames.push({
      note: 'A Map compares keys exactly, but anagrams are only "equal up to order". So turn each word into a canonical key — its letters sorted — that is the same for every anagram.',
      panels: [arr(ws.map(show)), groupTable(), vars({ words: ws.length, groups: 0 })],
    });
    ws.forEach((w, i) => {
      const key = [...w].sort().join('');
      const rev = [...w].reverse().join('');
      frames.push({
        note: `Word '${w}': sort its letters → key "${key}". Every anagram of '${w}' sorts to the same string.`,
        panels: [arr(ws.map(show), { pointers: [{ index: i, label: 'i', color: 'a' }], highlights: { ...done(i), [i]: 'active' } }), groupTable(), vars({ word: show(w), key: show(key) })],
        predict: i % 3 === 1 ? pick(`What is the canonical key of '${w}'?`, show(key), [show(w), show(rev), show(key + key[0])], q++) : undefined,
      });
      const isNew = !groups.has(key);
      if (isNew) groups.set(key, []);
      groups.get(key).push(w);
      frames.push({
        note: isNew ? `No group has key "${key}" yet → create one and put '${w}' in it.` : `Key "${key}" already exists → '${w}' joins that group. The map did the grouping for us.`,
        panels: [arr(ws.map(show), { pointers: [{ index: i, label: 'i', color: 'a' }], highlights: { ...done(i), [i]: 'done' } }), groupTable(key), vars({ word: show(w), key: show(key), groups: groups.size })],
        predict: i >= 2 && i % 3 !== 1 ? pick(`Key "${show(key)}": new group or an existing one?`, isNew ? 'New group' : 'Existing group', [isNew ? 'Existing group' : 'New group'], q++) : undefined,
      });
    });
    const k = Math.max(0, ...ws.map((w) => w.length));
    frames.push({
      note: `Done: ${groups.size} group(s) = [...groups.values()]. Each word costs one sort, so O(n · k log k) for n words of length ≤ k. (A string key works; an array key would not — Map compares arrays by reference.)`,
      panels: [arr(ws.map(show), { highlights: done(ws.length) }), groupTable(), vars({ groups: groups.size, n: ws.length, k })],
    });
    frames.at(-1).result = [...groups.values()];
    return frames;
  },
};

// ───────────────────────────── 3. Index map + array (RandomizedSet) ─────────────────────────────
export const randomizedSetDesign = {
  problem: { name: 'Insert Delete GetRandom O(1)', statement: 'Design a set with insert, remove and getRandom, each in average O(1) time.', example: 'insert 10, 20, 30, 40, remove 20 → 40 moves into 20’s slot: [10, 40, 30]', exampleInput: { ops: ['insert 10', 'insert 20', 'insert 30', 'insert 40', 'remove 20'] }, exampleOutput: [10, 40, 30], questionId: 'insert-delete-getrandom-o1' },
  title: 'Index map + array: O(1) insert / remove / getRandom',
  description: 'vals[] plus a map value → index; remove swaps the last element into the hole and pops. getRandom uses a FIXED Math.random() = 0.5 (index ⌊0.5 · size⌋) so the run is repeatable. Up to 10 ops like "insert 5", "remove 5", "getRandom".',
  defaultInput: { ops: ['insert 10', 'insert 20', 'insert 30', 'insert 40', 'remove 20', 'insert 30', 'getRandom', 'remove 30', 'remove 99', 'getRandom'] },
  fields: [{ key: 'ops', type: 'strings', label: 'operations' }],
  testInputs: [
    { ops: [] },
    { ops: ['getRandom'] },
    { ops: ['insert 7', 'remove 7', 'remove 7', 'getRandom'] },
    { ops: ['insert -1', 'insert -1', 'insert 2', 'remove -1', 'getRandom'] },
    { ops: ['bogus', 'insert x', 'insert 1', 'insert 2', 'insert 3', 'insert 4', 'insert 5', 'insert 6', 'insert 7', 'insert 8', 'insert 9', 'insert 10'] },
  ],
  generate({ ops }) {
    const list = (Array.isArray(ops) ? ops : []).slice(0, 10).map((o) => String(o ?? ''));
    const vals = [];
    const pos = new Map();
    const out = [];
    const frames = [];
    let q = 0;
    const label = 'pos: value → index';
    const panels = (hl = {}, mapHl = {}, extra = {}) => [arr([...vals], { label: 'vals', highlights: hl }), mapTable(pos, mapHl, label), vars({ ...extra, returns: out.length ? out.join(', ') : '—' })];
    frames.push({
      note: 'vals[] gives O(1) access by position (needed for getRandom); pos maps value → index (needed to find a value in O(1)). Together every operation is O(1) average.',
      panels: panels(),
    });
    list.forEach((raw) => {
      const m = raw.trim().match(/^(insert|remove)\s+(-?\d+)$/i);
      const op = m ? m[1].toLowerCase() : /^getrandom$/i.test(raw.trim()) ? 'getRandom' : null;
      if (!op) {
        frames.push({ note: `"${raw.slice(0, 20)}" is not insert v / remove v / getRandom — skipped.`, panels: panels() });
        return;
      }
      if (op === 'getRandom') {
        if (!vals.length) {
          out.push('undefined');
          frames.push({ note: 'getRandom on an empty set: vals has no elements, so it returns undefined.', panels: panels({}, {}, { op: 'getRandom()' }) });
          return;
        }
        const idx = Math.floor(0.5 * vals.length);
        out.push(vals[idx]);
        frames.push({
          note: `getRandom(): pick a random index into vals — here the fixed 0.5 gives ⌊0.5 × ${vals.length}⌋ = ${idx} → ${vals[idx]}. O(1) because vals is an array; a Map alone would need O(n) to reach the k-th key.`,
          panels: panels({ [idx]: 'done' }, { [vals[idx]]: 'done' }, { op: 'getRandom()', index: idx }),
          predict: pick(`vals = [${vals.join(', ')}]; with the fixed 0.5, getRandom() returns…`, vals[idx], vals.filter((_, k) => k !== idx), q++),
        });
        return;
      }
      const v = clampInt(m[2], -999, 999);
      const has = pos.has(v);
      if (op === 'insert') {
        if (has) {
          out.push('false');
          frames.push({
            note: `insert(${v}): pos already has ${v} → return false, nothing changes (it is a set).`,
            panels: panels({ [pos.get(v)]: 'bad' }, { [v]: 'bad' }, { op: `insert(${v})` }),
            predict: pick(`insert(${v}) — what does it return?`, 'false', ['true'], q++),
          });
          return;
        }
        pos.set(v, vals.length);
        vals.push(v);
        out.push('true');
        frames.push({ note: `insert(${v}): new value → pos.set(${v}, ${vals.length - 1}) and push it on the end. O(1).`, panels: panels({ [vals.length - 1]: 'active' }, { [v]: 'active' }, { op: `insert(${v})` }) });
        return;
      }
      if (!has) {
        out.push('false');
        frames.push({
          note: `remove(${v}): pos has no ${v} → return false. The map answers "is it here?" in O(1), no scan needed.`,
          panels: panels({}, {}, { op: `remove(${v})` }),
          predict: pick(`remove(${v}) — what does it return?`, 'false', ['true'], q++),
        });
        return;
      }
      const i = pos.get(v);
      const lastIdx = vals.length - 1;
      const last = vals[lastIdx];
      frames.push({
        note: `remove(${v}): pos says ${v} is at index ${i}. splice would shift everything after it (O(n)); instead fill the hole with the LAST element, ${last}.`,
        panels: panels({ [i]: 'bad', [lastIdx]: 'active' }, { [v]: 'bad' }, { op: `remove(${v})`, i, last }),
      });
      vals[i] = last;
      pos.set(last, i);
      frames.push({
        note:
          i === lastIdx
            ? `${v} IS the last element, so it moves onto itself — harmless. pos.set(${last}, ${i}) happens before the delete, so the delete still wins.`
            : `vals[${i}] = ${last} and pos.set(${last}, ${i}): the moved element's index is updated BEFORE we delete ${v}.`,
        panels: panels({ [i]: 'active', [lastIdx]: 'muted' }, { [last]: 'active' }, { op: `remove(${v})`, i, last }),
        predict: i !== lastIdx ? pick(`remove(${v}) leaves a hole at index ${i}. Which value fills it?`, last, [vals[0], vals[Math.max(0, i - 1)], vals[i + 1], `nothing — shift left`].filter((x) => x !== undefined && x !== v), q++) : undefined,
      });
      vals.pop();
      pos.delete(v);
      out.push('true');
      frames.push({ note: `Pop the duplicate tail and pos.delete(${v}) → return true. Every step was O(1); the order of vals changed, which a set does not care about.`, panels: panels({ [i]: i < vals.length ? 'done' : undefined }, {}, { op: `remove(${v})` }) });
    });
    frames.push({
      note: `All operations done. Returns: ${out.length ? out.join(', ') : '(none)'}. insert, remove and getRandom are each O(1) average; space O(n).`,
      panels: panels(Object.fromEntries(vals.map((_, k) => [k, 'done'])), {}, { size: vals.length }),
    });
    frames.at(-1).result = [...vals];
    return frames;
  },
};

// ───────────────────────────── 4. Sort + two pointers (3Sum) ─────────────────────────────
export const threeSumDedup = {
  problem: { name: '3Sum', statement: 'Find all unique triplets in the array that sum to 0.', example: '[-1, 0, 1, 2, -1, -4] → [[-1, -1, 2], [-1, 0, 1]]', exampleOutput: [[-1, -1, 2], [-1, 0, 1]], questionId: '3sum' },
  title: '3Sum: sort, fix i, two pointers, skip duplicates',
  description: 'Sort, fix nums[i], then move l / r on the rest to hit sum 0; equal values are skipped so each triplet appears once. Up to 10 integers in −99..99.',
  defaultInput: { nums: [-1, 0, 1, 2, -1, -4] },
  fields: [{ key: 'nums', type: 'numbers', label: 'nums' }],
  testInputs: [{ nums: [] }, { nums: [0] }, { nums: [0, 0, 0, 0] }, { nums: [1, 2, 3] }, { nums: [-2, 0, 1, 1, 2, -1, -4, 3, 3, -2, 5, 7] }],
  generate({ nums }) {
    const orig = toInts(nums, 10, -99, 99);
    const a = [...orig].sort((x, y) => x - y);
    const res = [];
    const frames = [];
    let q = 0;
    let step = 0;
    const resTable = (hl) =>
      res.length ? table(res.map((t) => [...t]), res.map((_, k) => [hl === k ? 'done' : '', hl === k ? 'done' : '', hl === k ? 'done' : '']), res.map((_, k) => `#${k + 1}`), ['a', 'b', 'c'], 'triplets found') : table([['—', '—', '—']], [['muted', 'muted', 'muted']], ['none yet'], ['a', 'b', 'c'], 'triplets found');
    const view = (i, l, r, hl = {}) => {
      const pointers = [{ index: i, label: 'i', color: 'c' }];
      if (l < r) pointers.push({ index: l, label: 'l', color: 'a' }, { index: r, label: 'r', color: 'b' });
      return arr(a, { pointers, highlights: hl, range: l < r ? [l, r] : undefined });
    };
    frames.push({
      note: 'Find all unique triplets with sum 0. Brute force is O(n³). First sort — that lets two pointers solve the pair part, and puts equal values next to each other.',
      panels: [arr(orig, { label: 'input' }), resTable()],
    });
    frames.push({ note: `Sorted: [${a.join(', ')}]. Now fix nums[i] and look for a pair in the rest with sum −nums[i].`, panels: [arr(a), resTable()] });
    for (let i = 0; i < a.length - 2; i++) {
      if (i > 0 && a[i] === a[i - 1]) {
        frames.push({
          note: `nums[${i}] = ${a[i]} equals nums[${i - 1}]. Every triplet starting with ${a[i]} was already found in the previous round → skip it.`,
          panels: [view(i, i, i, { [i]: 'muted', [i - 1]: 'visited' }), resTable()],
          predict: pick(`nums[${i}] = ${a[i]} is the same as the previous first value. What now?`, 'Skip this i', ['Run l and r again', 'Stop the whole search'], q++),
        });
        continue;
      }
      let l = i + 1;
      let r = a.length - 1;
      frames.push({ note: `Fix i = ${i} (nums[i] = ${a[i]}). Put l just after i and r at the end; we need nums[l] + nums[r] = ${-a[i]}.`, panels: [view(i, l, r, { [i]: 'active' }), resTable()] });
      while (l < r) {
        const sum = a[i] + a[l] + a[r];
        const opts = ['Record triplet, move both', 'Move l right (l++)', 'Move r left (r--)'];
        const c = sum === 0 ? 0 : sum < 0 ? 1 : 2;
        const p = step++ % 2 === 1 ? pick(`${a[i]} + ${a[l]} + ${a[r]} = ${sum}. What happens?`, opts[c], opts.filter((_, k) => k !== c), q++) : undefined;
        const hl = { [i]: 'active', [l]: 'active', [r]: 'active' };
        if (sum < 0) {
          frames.push({ note: `${a[i]} + ${a[l]} + ${a[r]} = ${sum} < 0. Too small, and nums[r] is already the largest partner → l++.`, panels: [view(i, l, r, hl), resTable()], predict: p });
          l++;
        } else if (sum > 0) {
          frames.push({ note: `${a[i]} + ${a[l]} + ${a[r]} = ${sum} > 0. Too big, and nums[l] is already the smallest partner → r--.`, panels: [view(i, l, r, hl), resTable()], predict: p });
          r--;
        } else {
          res.push([a[i], a[l], a[r]]);
          const done = { [i]: 'done', [l]: 'done', [r]: 'done' };
          const [l0, r0] = [l, r];
          l++;
          r--;
          let skipped = 0;
          while (l < r && a[l] === a[l - 1]) {
            l++;
            skipped++;
          }
          frames.push({
            note: `${a[i]} + ${a[l0]} + ${a[r0]} = 0 → record [${res[res.length - 1].join(', ')}]. Move BOTH pointers (else the loop never ends)${skipped ? `, then skip ${skipped} more equal l value(s) so this triplet is not recorded twice` : ''}.`,
            panels: [view(i, l0, r0, done), resTable(res.length - 1)],
            predict: p,
          });
        }
      }
    }
    frames.push({
      note: `Done: ${res.length ? res.map((t) => `[${t.join(', ')}]`).join(', ') : 'no triplet sums to 0'}. Sorting is O(n log n), each fixed i runs one O(n) two-pointer pass → O(n²) total, O(1) extra space besides the output.`,
      panels: [arr(a), resTable()],
    });
    frames.at(-1).result = res;
    return frames;
  },
};

// ───────────────────────────── 5. Hoare partition (evens before odds) ─────────────────────────────
export const hoarePartitionParity = {
  problem: { name: 'Sort Array By Parity', statement: 'Move all even numbers before all odd numbers, in place.', example: '[3, 8, 5, 2, 7, 4, 6, 1] → [6, 8, 4, 2, 7, 5, 3, 1]', exampleOutput: [6, 8, 4, 2, 7, 5, 3, 1], questionId: 'sort-array-by-parity' },
  title: 'Hoare partition: evens before odds',
  description: 'isLeft = "is even". l skips evens, r skips odds; then nums[l] and nums[r] are both misplaced and one swap fixes both. Up to 10 integers in −999..999.',
  defaultInput: { nums: [3, 8, 5, 2, 7, 4, 6, 1] },
  fields: [{ key: 'nums', type: 'numbers', label: 'nums' }],
  testInputs: [{ nums: [] }, { nums: [5] }, { nums: [2, 4, 6] }, { nums: [1, 3, 5] }, { nums: [-3, -2, 7, 0, -5, 4, 4, 1, 9, 2, 8, 6] }],
  generate({ nums }) {
    const a = toInts(nums, 10);
    const n = a.length;
    const isLeft = (x) => x % 2 === 0;
    const frames = [];
    let q = 0;
    let l = 0;
    let r = n - 1;
    const view = (hl = {}) => {
      const highlights = {};
      for (let k = 0; k < Math.min(l, n); k++) highlights[k] = 'done';
      for (let k = Math.max(r + 1, 0); k < n; k++) highlights[k] = 'visited';
      const pointers = [];
      if (l < n) pointers.push({ index: l, label: 'l', color: 'a' });
      if (r >= 0) pointers.push({ index: r, label: 'r', color: 'b' });
      return arr([...a], { highlights: { ...highlights, ...hl }, pointers });
    };
    const v = (extra = {}) => vars({ l, r, ...extra });
    frames.push({
      note: 'Goal: all evens before all odds, in place, order not kept. l starts at the left end, r at the right end. Green = settled even side, blue = settled odd side.',
      panels: [view(), v()],
    });
    let round = 0;
    while (l <= r) {
      const l0 = l;
      while (l <= r && isLeft(a[l])) l++;
      frames.push({
        note: l === l0 ? (l <= r ? `a[${l}] = ${a[l]} is odd — it belongs on the right, so l stops here.` : 'l has passed r.') : `l skips even value(s) already on the correct side and stops at ${l <= r ? `index ${l} (a[${l}] = ${a[l]} is odd)` : `index ${l}, past r`}.`,
        panels: [view(l <= r && l < n ? { [l]: 'bad' } : {}), v()],
        predict: round === 1 ? pick(`From l = ${l0}, l skips evens. Where does l stop?`, `index ${l}`, [`index ${l0}`, `index ${l + 1}`, `index ${Math.max(0, l - 1)}`], q++) : undefined,
      });
      const r0 = r;
      while (l <= r && !isLeft(a[r])) r--;
      if (l <= r || r !== r0)
        frames.push({
          note: r === r0 ? `a[${r}] = ${a[r]} is even — it belongs on the left, so r stops here.` : `r skips odd value(s) already on the correct side and stops at ${l <= r ? `index ${r} (a[${r}] = ${a[r]} is even)` : `index ${r}, past l`}.`,
          panels: [view(l <= r ? { [l]: 'bad', [r]: 'bad' } : {}), v()],
        });
      const swap = l < r;
      if (swap) {
        [a[l], a[r]] = [a[r], a[l]];
        const [sl, sr] = [l, r];
        l++;
        r--;
        frames.push({
          note: `a[${sl}] was odd and a[${sr}] was even — both misplaced. One swap fixes BOTH, then l++ and r--.`,
          panels: [view({ [sl]: 'active', [sr]: 'active' }), v({ swapped: `${sl} ↔ ${sr}` })],
          predict: round % 2 === 0 ? pick(`l = ${sl} (odd ${a[sr]}), r = ${sr} (even ${a[sl]}). What happens?`, 'Swap them, l++, r--', ['Stop — l has passed r', 'Only l++'], q++) : undefined,
        });
      }
      round++;
    }
    frames.push({
      note: `l > r: every element is on its side. Return boundary l = ${l}: [0, ${l}) are even, [${l}, ${n}) are odd. O(n) time, O(1) space, at most one swap per misplaced pair.`,
      panels: [view(), vars({ boundary: l, result: `[${a.join(', ')}]` })],
      predict: n > 1 ? pick('l has passed r. What does the partition return?', `boundary ${l}`, [`boundary ${Math.max(0, l - 1)}`, `boundary ${l + 1}`, `boundary ${n}`], q++) : undefined,
    });
    frames.at(-1).result = a;
    return frames;
  },
};

// ───────────────────────────── 6. Move the bottleneck (trapping rain water) ─────────────────────────────
export const trapBottleneck = {
  problem: { name: 'Trapping Rain Water', statement: 'Bars of the given heights stand side by side. How much rain water is trapped between them?', example: '[3, 0, 2, 0, 4, 1, 2] → 8', exampleOutput: 8, questionId: 'trapping-rain-water' },
  title: 'Move the bottleneck: trapping rain water',
  description: 'leftMax / rightMax are the running maxima; the side with the smaller one is the bottleneck, so its water level is known exactly — add it and move that pointer. Up to 10 bars, heights 0..20.',
  defaultInput: { height: [3, 0, 2, 0, 4, 1, 2] },
  fields: [{ key: 'height', type: 'numbers', label: 'height' }],
  testInputs: [{ height: [] }, { height: [5] }, { height: [2, 2, 2] }, { height: [4, 2, 0, 3, 2, 5] }, { height: [-3, 9, 1, 9, 30, 0, 2, 2, 7, 1, 5, 3] }],
  generate({ height }) {
    const h = toInts(height, 10, 0, 20);
    const n = h.length;
    const water = h.map(() => '?');
    const frames = [];
    let q = 0;
    let l = 0;
    let r = n - 1;
    let leftMax = 0;
    let rightMax = 0;
    let total = 0;
    const view = (hl = {}) => {
      const highlights = {};
      for (let k = 0; k < n; k++) if (k < l || k > r) highlights[k] = 'done';
      const pointers = l < r ? [{ index: l, label: 'l', color: 'a' }, { index: r, label: 'r', color: 'b' }] : [];
      return [arr(h, { label: 'height', highlights: { ...highlights, ...hl }, pointers }), arr([...water], { label: 'water above bar' }), vars({ leftMax, rightMax, water: total })];
    };
    frames.push({
      note: 'Water above a bar = min(tallest bar on its left, tallest on its right) − its height. Pointers at both ends keep leftMax and rightMax as running maxima.',
      panels: view(),
    });
    let it = 0;
    while (l < r) {
      leftMax = Math.max(leftMax, h[l]);
      rightMax = Math.max(rightMax, h[r]);
      frames.push({ note: `Update the maxima first: leftMax = max(…, ${h[l]}) = ${leftMax}, rightMax = max(…, ${h[r]}) = ${rightMax}. (Updating first means water is never negative.)`, panels: view({ [l]: 'active', [r]: 'active' }) });
      const left = leftMax < rightMax;
      const k = left ? l : r;
      const level = left ? leftMax : rightMax;
      const w = level - h[k];
      water[k] = w;
      total += w;
      const p =
        it % 2 === 0
          ? pick(`leftMax = ${leftMax}, rightMax = ${rightMax}. Which side is the bottleneck and moves?`, left ? 'Left (l++)' : 'Right (r--)', [left ? 'Right (r--)' : 'Left (l++)'], q++)
          : pick(`The ${left ? 'left' : 'right'} side moves. How much water sits above bar ${k} (height ${h[k]})?`, w, [w + 1, level, Math.abs(leftMax - rightMax), Math.max(0, w - 1)], q++);
      if (left) l++;
      else r--;
      frames.push({
        note: left
          ? `leftMax ${leftMax} < rightMax ${rightMax}: bar ${k}'s left wall is exactly ${leftMax}, and its right wall is at least ${rightMax}. So its level is exactly ${leftMax} → water ${leftMax} − ${h[k]} = ${w}. l++.`
          : `rightMax ${rightMax} ≤ leftMax ${leftMax}: bar ${k}'s level is exactly ${rightMax}, whatever the unseen middle bars are → water ${rightMax} − ${h[k]} = ${w}. r--.`,
        panels: view({ [k]: 'active' }),
        predict: p,
      });
      it++;
    }
    if (n) water[l] = water[l] === '?' ? 0 : water[l];
    frames.push({
      note: `l meets r${n ? ` at bar ${l}, the tallest bar seen — it holds no water` : ''}. Total water = ${total}. Each step settles one bar: O(n) time, O(1) space.`,
      panels: [arr(h, { label: 'height', highlights: Object.fromEntries(h.map((_, k) => [k, 'done'])) }), arr([...water], { label: 'water above bar' }), vars({ water: total })],
    });
    frames.at(-1).result = total;
    return frames;
  },
};
