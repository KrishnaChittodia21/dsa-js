import { layoutNary } from '../layout.js';

const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const ask = (question, options, answer, explain) => ({ question, options, answer, explain });
// Distinct options with the correct one placed at index pos % n; null if fewer than 2 distinct options.
const pick = (question, correct, wrong, pos = 0, explain) => {
  const c = String(correct);
  const w = [...new Set(wrong.map(String))].filter((o) => o !== c).slice(0, 3);
  if (!w.length) return null;
  const at = pos % (w.length + 1);
  return ask(question, [...w.slice(0, at), c, ...w.slice(at)], at, explain);
};
const clampInt = (v, lo, hi) => Math.max(lo, Math.min(hi, Math.round(v)));
const numbers = (xs) => (Array.isArray(xs) ? xs : []).map(Number).filter(Number.isFinite);
const bits4 = (x) => [3, 2, 1, 0].map((b) => (x >> b) & 1);
const bin = (x, w) => x.toString(2).padStart(w, '0');

// ---------------------------------------------------------------------------
// Bit-by-bit processing: every number appears k times except one → count each bit mod k.
// ---------------------------------------------------------------------------
export const bitCountsModK = {
  problem: { name: 'Single Number II', statement: 'Every number appears k times except one, which appears once. Find it.', example: 'nums = [5, 3, 5, 5, 3, 3, 6], k = 3 → 6', exampleOutput: 6, questionId: 'single-number-ii' },
  title: 'Bit by bit: count each bit mod k',
  description:
    'Single number II: every number appears k times except one. For each bit position b, count how many numbers have bit b set; if count % k ≠ 0, the unique number owns bit b. nums clamped to 8 integers in 0..15 (4 bits), k to 2..5.',
  defaultInput: { nums: [5, 3, 5, 5, 3, 3, 6], k: 3 },
  fields: [
    { key: 'nums', type: 'numbers', label: 'nums (≤ 8, each 0..15)' },
    { key: 'k', type: 'number', label: 'k (2..5)' },
  ],
  testInputs: [
    { nums: [], k: 3 },
    { nums: [9], k: 3 },
    { nums: [0, 0, 0, 0], k: 3 },
    { nums: [7, 7, 7, 7], k: 3 },
    { nums: [2, 2, 1], k: 2 },
    { nums: [20, -3, 1, 1, 1, 4, 4, 4, 9, 9], k: 9 },
  ],
  generate({ nums, k }) {
    const a = numbers(nums).map((v) => clampInt(v, 0, 15)).slice(0, 8);
    const K = clampInt(Number.isFinite(Number(k)) ? Number(k) : 3, 2, 5);
    const n = a.length;
    const frames = [];
    let result = 0;
    const table = (cur) => ({
      kind: 'table',
      label: 'bits of each number',
      rowLabels: a.map(String),
      colLabels: ['3', '2', '1', '0'],
      cells: a.map(bits4),
      states: a.map((x) => [3, 2, 1, 0].map((b) => (b === cur ? ((x >> b) & 1 ? 'active' : 'muted') : b < cur && (x >> b) & 1 ? 'visited' : ''))),
    });
    const resPanel = (cur, st) =>
      arr(bits4(result), {
        label: `result = ${result}`,
        showIndices: false,
        highlights: cur >= 0 && st ? { [3 - cur]: st } : {},
        pointers: cur >= 0 ? [{ index: 3 - cur, label: `bit ${cur}`, color: 'a' }] : [],
      });
    const push = (note, panels, predict) => frames.push({ note, panels, ...(predict ? { predict } : {}) });
    push(
      n
        ? `Every number appears k = ${K} times except one. Treat each of the 4 bit positions as its own small problem: count the 1s in that column.`
        : 'No numbers → every column has 0 ones, so result stays 0.',
      [table(-1), resPanel(-1), vars({ k: K, result })],
    );
    for (let b = 0; b < 4; b++) {
      let count = 0;
      for (const x of a) count += (x >> b) & 1;
      const r = count % K;
      push(
        `Bit ${b}: (x >> ${b}) & 1 reads it for each number. ${count} of ${n} numbers have bit ${b} set.`,
        [table(b), resPanel(b), vars({ b, count, k: K, result })],
        n && (b === 1 || b === 3) ? pick(`How many numbers have bit ${b} set?`, count, [count + 1, Math.max(0, count - 1), n - count, K], b, 'Count the 1s in that column of the table.') : null,
      );
      const own = r !== 0;
      if (own) result |= 1 << b;
      push(
        own
          ? `count % k = ${count} % ${K} = ${r} ≠ 0. The repeated numbers add 1s in groups of ${K}, so the leftover comes from the unique number → result |= 1 << ${b}.`
          : `count % k = ${count} % ${K} = 0. Every 1 here comes in a full group of ${K}, so the unique number has a 0 at bit ${b}.`,
        [table(b), resPanel(b, own ? 'done' : 'muted'), vars({ b, count, 'count % k': r, result })],
        n && (b === 0 || b === 2) ? ask(`count = ${count}, k = ${K}. Does result get bit ${b}?`, [`Yes — set bit ${b}`, `No — leave bit ${b} as 0`], own ? 0 : 1, 'Only a count that is not a multiple of k leaves a bit for the unique number.') : null,
      );
    }
    push(
      `result = ${result} (${bin(result, 4)}) — the number that does not appear ${K} times. Each of the 4 positions (32 in the real problem) scans all n numbers → O(bits · n) time, O(1) space.`,
      [table(-1), arr(bits4(result), { label: `result = ${result}`, showIndices: false, highlights: Object.fromEntries(bits4(result).map((v, i) => [i, v ? 'done' : ''])) }), vars({ answer: result })],
    );
    frames.at(-1).result = result;
    return frames;
  },
};

// ---------------------------------------------------------------------------
// Bitmask as a set: maximum product of word lengths (letters a–d → 4-bit masks).
// ---------------------------------------------------------------------------
export const letterMaskProduct = {
  problem: { name: 'Maximum Product of Word Lengths', statement: 'Return the largest length(a) × length(b) over two words that share no letter.', example: '[ab, cd, abc, dd, bd] → 6 (abc × dd)', exampleOutput: 6, questionId: 'maximum-product-of-word-lengths' },
  title: 'Bitmask as a set: words with no common letter',
  description:
    'Maximum product of word lengths: build one letter mask per word with mask |= bitOf(ch), then two words share no letter exactly when (maskA & maskB) === 0. Only letters a–d are kept (4-bit masks), up to 6 words of ≤ 4 letters.',
  defaultInput: { words: ['ab', 'cd', 'abc', 'dd', 'bd'] },
  fields: [{ key: 'words', type: 'strings', label: 'words (≤ 6, letters a–d)' }],
  testInputs: [
    { words: [] },
    { words: ['abcd'] },
    { words: ['', 'a'] },
    { words: ['ab', 'ab', 'ab'] },
    { words: ['a', 'b', 'c', 'd', 'xyz', 'ABCDEF', 'dcba', 'ca'] },
  ],
  generate({ words }) {
    const ws = (Array.isArray(words) ? words : [])
      .map((w) => String(w).toLowerCase().replace(/[^a-d]/g, '').slice(0, 4))
      .slice(0, 6);
    const n = ws.length;
    const bitOf = (ch) => 1 << (ch.charCodeAt(0) - 97);
    const masks = ws.map(() => 0);
    const built = new Set();
    const frames = [];
    const table = (rowStates = {}, colHl = null) => ({
      kind: 'table',
      label: 'masks (one column per letter)',
      rowLabels: ws.map((w) => w || '""'),
      colLabels: ['d', 'c', 'b', 'a'],
      cells: masks.map(bits4),
      states: masks.map((m, i) =>
        bits4(m).map((v, c) => {
          if (rowStates[i] === 'build') return c === colHl ? 'active' : v ? 'visited' : '';
          if (rowStates[i]) return v ? rowStates[i] : '';
          return built.has(i) ? '' : 'muted';
        }),
      ),
    });
    const push = (note, panels, predict) => frames.push({ note, panels, ...(predict ? { predict } : {}) });
    push(
      n
        ? 'Each word becomes a 4-bit set: bit 0 = a, bit 1 = b, bit 2 = c, bit 3 = d. First build every mask, then compare pairs with one AND each.'
        : 'No words → no pair, so the best product is 0.',
      [table(), vars({ words: n })],
    );
    let askedRepeat = false;
    ws.forEach((w, i) => {
      built.add(i);
      if (!w.length) {
        push(`Word ${i} is empty → its mask stays 0 (the empty set) and its length is 0.`, [table({ [i]: 'build' }), vars({ i, mask: 0 })]);
        return;
      }
      [...w].forEach((ch, ci) => {
        const bit = bitOf(ch);
        const before = masks[i];
        masks[i] |= bit;
        const had = (before & bit) !== 0;
        const predict =
          had && !askedRepeat
            ? pick(`'${ch}' is already in mask ${before} (${bin(before, 4)}). What is mask |= bitOf('${ch}')?`, before, [before + bit, before ^ bit, bit], 2, 'OR with a bit that is already 1 changes nothing.')
            : null;
        if (predict) askedRepeat = true;
        push(
          had
            ? `"${w}"[${ci}] = '${ch}': bit ${Math.log2(bit)} is already 1, so mask |= ${bit} changes nothing — a set stores each letter once.`
            : `"${w}"[${ci}] = '${ch}': bitOf('${ch}') = 1 << ${Math.log2(bit)} = ${bit}. mask |= ${bit} adds '${ch}' → mask = ${masks[i]}.`,
          [table({ [i]: 'build' }, 3 - Math.log2(bit)), arr(bits4(bit), { label: `bitOf('${ch}') = ${bit}`, showIndices: false, highlights: { [3 - Math.log2(bit)]: 'active' } }), vars({ word: w, ch, mask: masks[i] })],
          predict,
        );
      });
    });
    let best = 0;
    let bestPair = null;
    let c = 0;
    let asks = 0;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const and = masks[i] & masks[j];
        const disjoint = and === 0;
        const product = ws[i].length * ws[j].length;
        const better = disjoint && product > best;
        const prev = best;
        if (better) {
          best = product;
          bestPair = [i, j];
        }
        const hl = {};
        bits4(and).forEach((v, idx) => v && (hl[idx] = 'bad'));
        const predict =
          c % 3 === 1 && asks < 3
            ? ask(`"${ws[i]}" (${bin(masks[i], 4)}) and "${ws[j]}" (${bin(masks[j], 4)}): is (maskA & maskB) === 0?`, ['Yes — no common letter', 'No — they share a letter'], disjoint ? 0 : 1, 'A 1 in the AND is a letter both words contain.')
            : null;
        if (predict) asks++;
        push(
          disjoint
            ? `masks[${i}] & masks[${j}] = 0 → "${ws[i]}" and "${ws[j]}" share no letter. Product ${ws[i].length} × ${ws[j].length} = ${product}${better ? ` > ${prev} → new best.` : ` is not better than ${prev}.`}`
            : `masks[${i}] & masks[${j}] = ${and} ≠ 0 → the red bit${Object.keys(hl).length > 1 ? 's are letters' : ' is a letter'} both words use, so this pair is skipped.`,
          [table({ [i]: 'active', [j]: disjoint ? 'done' : 'bad' }), arr(bits4(and), { label: `masks[${i}] & masks[${j}] = ${and}`, showIndices: false, highlights: hl }), vars({ i, j, product: disjoint ? product : '—', best })],
          predict,
        );
        c++;
      }
    }
    push(
      `Best product = ${best}${bestPair ? ` ("${ws[bestPair[0]]}" × "${ws[bestPair[1]]}")` : ' (no disjoint pair with letters)'}. Masks cost O(total letters); each pair test is one AND, so pairs cost O(n²) instead of O(n² · L).`,
      [table(bestPair ? { [bestPair[0]]: 'done', [bestPair[1]]: 'done' } : {}), vars({ answer: best })],
    );
    frames.at(-1).result = best;
    return frames;
  },
};

// ---------------------------------------------------------------------------
// Binary trie, offline queries with a bound: maximum XOR with an element ≤ m.
// ---------------------------------------------------------------------------
const BITS = 3;
function triePanel(root, states, label) {
  const toTree = (n) => ({ id: n.id, label: n.id, children: n.c.filter(Boolean).map(toTree) });
  const L = layoutNary(toTree(root));
  const byId = {};
  const walk = (n) => {
    byId[n.id] = n;
    n.c.filter(Boolean).forEach(walk);
  };
  walk(root);
  return {
    kind: 'nodes',
    nodes: L.nodes.map((n) => ({ id: n.id, label: byId[n.id].bit, x: n.x, y: n.y, state: states[n.id] ?? '' })),
    edges: L.edges.map(([a, b]) => ({ from: a, to: b, state: states[b] === 'hidden' ? 'muted' : '' })),
    directed: true,
    label,
  };
}

export const trieMaxXorWithLimit = {
  problem: { name: 'Maximum XOR With an Element From Array', statement: 'For each query [x, m], return the largest x XOR v over values v ≤ m, or -1.', example: 'nums [0, 1, 2, 3, 4], queries [3,1] [1,3] [5,6] → [3, 3, 7]', exampleOutput: [3, 3, 7], questionId: 'maximum-xor-with-an-element-from-array' },
  title: 'Binary trie: maximum XOR with an element ≤ m',
  description:
    'Queries [x, m]: max x ^ nums[j] over nums[j] ≤ m, or −1. Sort nums and answer queries in order of m, inserting every num ≤ m into the bit trie before walking it (prefer the opposite bit). nums clamped to 6 integers in 0..7 (3 bits), up to 4 queries with x, m in 0..7.',
  defaultInput: { nums: [0, 1, 2, 3, 4], queries: [[3, 1], [1, 3], [5, 6]] },
  fields: [
    { key: 'nums', type: 'numbers', label: 'nums (≤ 6, each 0..7)' },
    { key: 'queries', type: 'json', label: 'queries [[x, m], …] (≤ 4)' },
  ],
  testInputs: [
    { nums: [], queries: [[1, 7]] },
    { nums: [5], queries: [] },
    { nums: [0, 0, 0], queries: [[0, 0], [7, 7]] },
    { nums: [3, 3, 3], queries: [[4, 2], [4, 3], [3, 3]] },
    { nums: [9, -1, 6, 2, 7, 5, 1, 4], queries: [[2, 5], [7, 0], 'x', [6, 9], [1, 2], [0, 1]] },
  ],
  generate({ nums, queries }) {
    const sorted = numbers(nums).map((v) => clampInt(v, 0, 7)).slice(0, 6).sort((p, q) => p - q);
    const qs = (Array.isArray(queries) ? queries : [])
      .filter((q) => Array.isArray(q) && q.length >= 2)
      .map((q) => q.slice(0, 2).map((v) => clampInt(Number.isFinite(Number(v)) ? Number(v) : 0, 0, 7)))
      .slice(0, 4);
    const order = qs.map((_, i) => i).sort((p, q) => qs[p][1] - qs[q][1] || p - q);
    const n = sorted.length;
    // Build the full trie up front for a stable layout; `added` marks nodes inserted so far.
    let id = 0;
    const root = { id: id++, bit: '∅', c: [null, null] };
    const pathOf = (x) => {
      const ids = [];
      let node = root;
      for (let b = BITS - 1; b >= 0; b--) {
        const bit = (x >> b) & 1;
        if (!node.c[bit]) node.c[bit] = { id: id++, bit: String(bit), c: [null, null] };
        node = node.c[bit];
        ids.push(node.id);
      }
      return ids;
    };
    sorted.forEach(pathOf);
    const added = new Set([0]);
    const ans = qs.map(() => null);
    const frames = [];
    let p = 0;
    let cur = -1;
    const view = (extra = {}, v = {}) => {
      const s = {};
      for (let k = 0; k < id; k++) s[k] = added.has(k) ? '' : 'hidden';
      const hl = {};
      for (let k = 0; k < p; k++) hl[k] = 'done';
      return [
        triePanel(root, { ...s, ...extra }, 'bit trie of nums ≤ m'),
        arr(sorted, { label: 'nums (sorted)', highlights: hl, pointers: p < n ? [{ index: p, label: 'p', color: 'a' }] : [] }),
        {
          kind: 'table',
          label: 'queries (– means −1)',
          rowLabels: qs.map((_, i) => `q${i}`),
          colLabels: ['x', 'm', 'ans'],
          cells: qs.map(([x, m], i) => [x, m, ans[i] === null ? '?' : ans[i] < 0 ? '–' : ans[i]]),
          states: qs.map((_, i) => [0, 1, 2].map(() => (i === cur ? 'active' : ans[i] !== null ? 'done' : ''))),
        },
        vars(v),
      ];
    };
    const push = (note, extra, v, predict) => frames.push({ note, panels: view(extra, v), ...(predict ? { predict } : {}) });
    push(
      qs.length
        ? `Sort nums and answer queries from the smallest m up. Then the trie only grows: before query (x, m) we insert every num ≤ m, so it holds exactly the allowed elements.`
        : 'No queries → nothing to answer.',
      {},
      { queries: qs.length },
    );
    let walkAsks = 0;
    let stopAsked = false;
    order.forEach((qi, t) => {
      const [x, m] = qs[qi];
      cur = qi;
      push(`Query q${qi}: x = ${x} (${bin(x, BITS)}), m = ${m}. First insert the next nums while nums[p] ≤ ${m}.`, {}, { x: bin(x, BITS), m });
      while (p < n && sorted[p] <= m) {
        const v = sorted[p];
        const path = pathOf(v);
        path.forEach((k) => added.add(k));
        p++;
        push(`nums[${p - 1}] = ${v} ≤ ${m} → insert ${bin(v, BITS)} into the trie, highest bit first.`, Object.fromEntries(path.map((k) => [k, 'active'])), { x: bin(x, BITS), m, inserted: v });
      }
      if (p < n) {
        const predict =
          !stopAsked && p > 0 ? ask(`Next is nums[${p}] = ${sorted[p]} and m = ${m}. What happens?`, [`Insert ${sorted[p]} too`, `Stop inserting — ${sorted[p]} > ${m}`], 1, 'Only elements ≤ m may be used by this query.') : null;
        if (predict) stopAsked = true;
        push(`nums[${p}] = ${sorted[p]} > ${m} → stop. Because nums are sorted, everything after it is too big as well; it waits for a later query with a bigger m.`, {}, { x: bin(x, BITS), m }, predict);
      }
      if (p === 0) {
        ans[qi] = -1;
        push(`The trie is empty — no num ≤ ${m} exists → q${qi} = −1.`, {}, { x: bin(x, BITS), m, answer: -1 });
        return;
      }
      let node = root;
      let res = 0;
      const path = {};
      for (let b = BITS - 1; b >= 0; b--) {
        const xb = (x >> b) & 1;
        const want = xb ^ 1;
        const has = !!node.c[want] && added.has(node.c[want].id);
        if (has) {
          res |= 1 << b;
          node = node.c[want];
        } else node = node.c[want ^ 1];
        path[node.id] = 'active';
        const predict =
          walkAsks < 2 && (b === BITS - 1 || !has) && (t + b) % 2 === 0
            ? ask(`x = ${bin(x, BITS)}, bit ${b} is ${xb}, so we want a ${want}. Which way does the walk go?`, [`Child ${want} — XOR bit ${b} becomes 1`, `Child ${xb} — XOR bit ${b} stays 0`, 'Stop — the answer is already known'], has ? 0 : 1, 'Prefer the opposite bit when that child exists; otherwise follow the only child.')
            : null;
        if (predict) walkAsks++;
        push(
          `Bit ${b} of x is ${xb} → want ${want}. ${has ? `Child ${want} exists → take it; XOR bit ${b} = 1.` : `No child ${want} → forced to take ${want ^ 1}; XOR bit ${b} = 0.`}`,
          { ...path },
          { x: bin(x, BITS), m, want, res: bin(res, BITS) },
          predict,
        );
      }
      ans[qi] = res;
      const isLast = t === order.length - 1;
      push(
        `q${qi} = ${res} (${bin(res, BITS)}): the leaf reached is the allowed num ${res ^ x}, and ${x} ^ ${res ^ x} = ${res}. A higher bit beats all lower bits together, so this greedy walk is optimal.`,
        Object.fromEntries(Object.keys(path).map((k) => [k, 'done'])),
        { x: bin(x, BITS), m, answer: res },
        isLast && order.length > 1 ? pick(`The walk for x = ${x} built res = ${bin(res, BITS)}. What is q${qi}?`, res, [res ^ 1, x, m, res ^ x], 2, 'res collects a 1 for every bit where the walk found the opposite bit.') : null,
      );
    });
    cur = -1;
    push(
      `Answers in query order: [${ans.join(', ')}]. Sorting costs O(n log n + q log q); every insert and query walks ${BITS} bits (30 in the real problem) → O((n + q) · bits) after sorting.`,
      {},
      { answer: `[${ans.join(', ')}]` },
    );
    frames.at(-1).result = ans;
    return frames;
  },
};
