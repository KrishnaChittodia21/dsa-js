// Pattern animations for partition binary search, 1D string DP, tree building, functional graphs,
// halving recursion and digit DP: median of two sorted arrays, decode ways, word break,
// build a tree from preorder + inorder, peel a functional graph, fast power, sorted array → balanced BST,
// digit DP (count the 1s in 0…N).
import { layoutCircle } from '../layout.js';

const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const stack = (values, label) => ({ kind: 'stack', values, label });
const queue = (values, label) => ({ kind: 'queue', values, label });
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
const INF = Infinity;
const fmt = (v) => (v === INF ? '+∞' : v === -INF ? '−∞' : v < 0 ? `−${-v}` : String(v));
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const cleanNums = (xs, max, lo = -999, hi = 999) =>
  (Array.isArray(xs) ? xs : [])
    .map(Number)
    .filter(Number.isFinite)
    .slice(0, max)
    .map((v) => clamp(Math.round(v * 100) / 100, lo, hi));
const errorFrames = (msg, hint, v = {}) => [
  { note: msg, panels: [vars(v)] },
  { note: hint, panels: [vars({ ...v, answer: '—' })] },
];
// Binary tree drawn from precomputed nodes [{id, val, x, y, left, right}] — nodes not built yet are hidden.
const treePanel = (nodes, states, label) => ({
  kind: 'nodes',
  nodes: nodes.map((n) => ({ id: n.id, label: String(n.val), x: n.x, y: n.y, state: states[n.id] || 'hidden' })),
  edges: nodes.flatMap((n) => [n.left, n.right].filter((c) => c != null).map((c) => ({ from: n.id, to: c, state: '' }))),
  directed: true,
  label,
});
// Level-order serialization (trailing nulls trimmed), e.g. [3, 9, 20, null, null, 15, 7].
const levelOrder = (nodes, rootId) => {
  if (rootId == null) return '[]';
  const out = [];
  const q = [rootId];
  for (let h = 0; h < q.length; h++) {
    const id = q[h];
    if (id == null) {
      out.push('null');
      continue;
    }
    out.push(fmt(nodes[id].val));
    q.push(nodes[id].left, nodes[id].right);
  }
  while (out[out.length - 1] === 'null') out.pop();
  return `[${out.join(', ')}]`;
};

/* ------------------------------------------------------------------ binary search the partition: median of two sorted arrays */
export const medianPartition = {
  title: 'Binary search the cut: median of two sorted arrays',
  description:
    'Binary search i = how many of the SHORTER array go to the left half; the other array must give j = half − i. The cut is right when both left neighbours ≤ both right neighbours (−∞ / +∞ beyond the ends). (≤ 10 numbers per array; unsorted input is sorted first.)',
  defaultInput: { a: [1, 12, 15, 26, 38], b: [2, 13, 17, 30, 45, 50] },
  fields: [
    { key: 'a', type: 'numbers', label: 'A (sorted, ≤ 10)' },
    { key: 'b', type: 'numbers', label: 'B (sorted, ≤ 10)' },
  ],
  testInputs: [
    { a: [], b: [] },
    { a: [], b: [1, 2, 3, 4] },
    { a: [2], b: [] },
    { a: [1, 2], b: [3, 4] },
    { a: [5, 6, 7], b: [1, 2, 3, 4] },
    { a: [1, 2, 3], b: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14] },
    { a: [3, 1, 2], b: [2, 2, 2] },
    { a: [1.5, -2], b: [0] },
    { a: [20, 30, 40, 50, 60, 70], b: [1, 2] },
    { a: [1, 3, 8, 9, 15], b: [7, 11, 18, 19, 21, 25] },
  ],
  generate(input) {
    let A = cleanNums(input.a, 10);
    let B = cleanNums(input.b, 10);
    const notes = [];
    const sorted = (xs) => xs.every((v, k) => k === 0 || xs[k - 1] <= v);
    if (!sorted(A) || !sorted(B)) {
      A = [...A].sort((x, y) => x - y);
      B = [...B].sort((x, y) => x - y);
      notes.push('The input was not sorted, so it was sorted first.');
    }
    let names = ['A', 'B'];
    if (A.length > B.length) {
      [A, B] = [B, A];
      names = ['B', 'A'];
      notes.push(`We binary search the shorter array, so the two arrays are swapped (top row = the shorter one).`);
    }
    const m = A.length;
    const n = B.length;
    if (m + n === 0) return errorFrames('Both arrays are empty — there is no median.', 'Enter at least one number in either array.', { total: 0 });
    const total = m + n;
    const half = Math.floor((total + 1) / 2);
    const frames = [];
    // Each array is drawn with sentinels: display index 0 = −∞, 1…len = the values, len + 1 = +∞.
    // A cut after `cut` elements puts the left neighbour at display index cut and the right one at cut + 1.
    const side = (xs, cut, name, st) => {
      const hl = { 0: 'muted', [xs.length + 1]: 'muted' };
      for (let k = 1; k <= cut; k++) hl[k] = 'visited';
      if (st) {
        hl[cut] = st[0];
        hl[cut + 1] = st[1];
      }
      return arr(['−∞', ...xs.map(fmt), '+∞'], {
        label: `${name} — cut after ${cut} (left half shaded)`,
        showIndices: false,
        highlights: hl,
        pointers: [
          { index: cut, label: 'L', color: 'a' },
          { index: cut + 1, label: 'R', color: 'b' },
        ],
        range: cut > 0 ? [1, cut] : undefined,
      });
    };
    const snap = (note, { i, lo, hi, st = {}, v = {}, predict } = {}) => {
      const j = half - i;
      const cuts = Array.from({ length: m + 1 }, (_, k) => k);
      const hl = {};
      for (let k = 0; k <= m; k++) if (k < lo || k > hi) hl[k] = 'muted';
      hl[i] = 'active';
      const f = {
        note,
        panels: [
          arr(cuts, { label: `i = how many of ${names[0]} go left (search range)`, highlights: hl, range: lo <= hi ? [lo, hi] : undefined, pointers: [{ index: i, label: 'i', color: 'c' }] }),
          side(A, i, `${names[0]} (shorter, m = ${m})`, st.a),
          side(B, j, `${names[1]} (n = ${n}), j = half − i`, st.b),
          vars({ half, lo, hi, i, j, ...v }),
        ],
      };
      if (predict) f.predict = predict;
      frames.push(f);
    };
    let lo = 0;
    let hi = m;
    snap(
      `${notes.join(' ')}${notes.length ? ' ' : ''}Total ${total} numbers → the left half must hold half = ⌈${total}/2⌉ = ${half}. Choosing i from ${names[0]} FORCES j = ${half} − i from ${names[1]}, so we only search i in [0, ${m}] — no merging.`,
      { i: (lo + hi) >> 1, lo, hi },
    );
    let iter = 0;
    let found = null;
    while (lo <= hi) {
      const i = (lo + hi) >> 1;
      const j = half - i;
      const aL = i > 0 ? A[i - 1] : -INF;
      const aR = i < m ? A[i] : INF;
      const bL = j > 0 ? B[j - 1] : -INF;
      const bR = j < n ? B[j] : INF;
      let predict;
      if (iter === 0 && m > 0) {
        predict = pick(`lo = ${lo}, hi = ${hi}, so i = ${i}. How many elements must ${names[1]} put on the left?`, j, [i, half, n - j, j + 1], 1, `i + j must equal half = ${half}, so j = ${half} − ${i}.`);
      }
      const sentinel = [aL, bL].includes(-INF) || [aR, bR].includes(INF) ? ' Past an end we read −∞ (left) or +∞ (right), so an empty side never blocks.' : '';
      snap(`Try i = (${lo} + ${hi}) >> 1 = ${i}, so j = ${half} − ${i} = ${j}. Left half = ${i} from ${names[0]} + ${j} from ${names[1]}. Only the four neighbours of the cuts need checking, because each array is sorted.${sentinel}`, {
        i,
        lo,
        hi,
        st: { a: ['active', 'active'], b: ['active', 'active'] },
        v: { [`${names[0]}L`]: fmt(aL), [`${names[0]}R`]: fmt(aR), [`${names[1]}L`]: fmt(bL), [`${names[1]}R`]: fmt(bR) },
        predict,
      });
      const okA = aL <= bR;
      const okB = bL <= aR;
      const verdict = okA && okB ? 0 : !okA ? 1 : 2;
      predict = ask(
        `${names[0]}: ${fmt(aL)} | ${fmt(aR)}   ${names[1]}: ${fmt(bL)} | ${fmt(bR)}. What happens next?`,
        ['Cut is valid — stop', `i is too big — move left (hi = i − 1)`, `i is too small — move right (lo = i + 1)`],
        verdict,
        'Valid needs both left neighbours ≤ both right neighbours. If A’s left neighbour is too big, A gave too many; if B’s left neighbour is too big, B gave too many, so A must give more.',
      );
      iter++;
      if (verdict === 0) {
        found = { i, j, aL, aR, bL, bR };
        snap(`${fmt(aL)} ≤ ${fmt(bR)} and ${fmt(bL)} ≤ ${fmt(aR)}: every number on the left is ≤ every number on the right. This is the median cut.`, {
          i,
          lo,
          hi,
          st: { a: ['done', 'done'], b: ['done', 'done'] },
          v: { maxLeft: fmt(Math.max(aL, bL)), minRight: fmt(Math.min(aR, bR)) },
          predict,
        });
        break;
      }
      if (verdict === 1) {
        snap(`${names[0]}'s left neighbour ${fmt(aL)} > ${names[1]}'s right neighbour ${fmt(bR)}: ${names[0]} put a number that is too big on the left → i is too big. Every larger i is worse too, so hi = i − 1 = ${i - 1}.`, {
          i,
          lo,
          hi,
          st: { a: ['bad', ''], b: ['', 'bad'] },
          predict,
        });
        hi = i - 1;
      } else {
        snap(`${names[1]}'s left neighbour ${fmt(bL)} > ${names[0]}'s right neighbour ${fmt(aR)}: ${names[1]} gave too many → j must shrink, which means i must grow. lo = i + 1 = ${i + 1}.`, {
          i,
          lo,
          hi,
          st: { a: ['', 'bad'], b: ['bad', ''] },
          predict,
        });
        lo = i + 1;
      }
    }
    // A valid cut always exists for sorted input, so `found` is set here.
    const { i, aL, aR, bL, bR } = found;
    const maxLeft = Math.max(aL, bL);
    const minRight = Math.min(aR, bR);
    const median = total % 2 ? maxLeft : (maxLeft + minRight) / 2;
    snap(
      total % 2
        ? `Odd total (${total}): the median is the largest number on the left = max(${fmt(aL)}, ${fmt(bL)}) = ${fmt(median)}. ${iter} probe(s) of the cut → O(log min(m, n)) time, O(1) space.`
        : `Even total (${total}): median = (max(left) + min(right)) / 2 = (${fmt(maxLeft)} + ${fmt(minRight)}) / 2 = ${fmt(median)}. ${iter} probe(s) of the cut → O(log min(m, n)) time, O(1) space.`,
      { i, lo: i, hi: i, st: { a: ['done', 'done'], b: ['done', 'done'] }, v: { answer: median } },
    );
    return frames;
  },
};

/* ------------------------------------------------------------------ 1D DP: decode ways */
const letter = (code) => String.fromCharCode(64 + code);

export const decodeWays = {
  title: 'Decode ways: 1- and 2-digit steps',
  description:
    'dp[i] = number of ways to decode the first i digits (1 → A … 26 → Z). The last letter uses one digit (not "0") → add dp[i−1], or two digits (10–26, no leading 0) → add dp[i−2]. (≤ 12 digits.)',
  defaultInput: { s: '12206' },
  fields: [{ key: 's', type: 'string', label: 'digits (≤ 12)' }],
  testInputs: [{ s: '' }, { s: '0' }, { s: '10' }, { s: '226' }, { s: '06' }, { s: '30' }, { s: '100' }, { s: '11106' }, { s: '1111111111111111' }, { s: '12a' }, { s: '27' }],
  generate(input) {
    const raw = String(input.s ?? '').trim();
    if (/[^0-9]/.test(raw)) return errorFrames(`"${raw.slice(0, 16)}" contains characters other than the digits 0–9.`, 'Enter only digits, e.g. 226 or 11106.', { s: raw.slice(0, 16) });
    const s = raw.slice(0, 12);
    const n = s.length;
    const dp = new Array(n + 1).fill(null);
    dp[0] = 1;
    const frames = [];
    const snap = (note, { i, piece, ok, dpHl = {}, v = {}, predict } = {}) => {
      const sHl = {};
      if (piece) for (let k = piece[0]; k <= piece[1]; k++) sHl[k] = ok ? 'active' : 'bad';
      const dHl = { ...dpHl };
      if (i !== undefined) dHl[i] = dHl[i] || 'active';
      const f = {
        note,
        panels: [
          arr([...s], { label: `s${raw.length > 12 ? ' (first 12 digits)' : ''}`, highlights: sHl, range: piece ? piece : undefined }),
          arr(
            dp.map((x) => (x === null ? '' : x)),
            { label: 'dp[i] = ways to decode the first i digits', highlights: dHl, pointers: i !== undefined ? [{ index: i, label: 'i', color: 'a' }] : [] },
          ),
          vars(v),
        ],
      };
      if (predict) f.predict = predict;
      frames.push(f);
    };
    snap(
      n
        ? `dp[0] = 1: the empty prefix has exactly one decoding (the empty one). Then, for each i, the LAST letter of a decoding covers either one digit or two digits — try both and add the counts.`
        : 'Empty string: dp[0] = 1 — the single empty decoding. (Problems usually give at least one digit.)',
      { dpHl: { 0: 'done' }, v: { 'dp[0]': 1 } },
    );
    let zeroAsked = false;
    let twoAsks = 0;
    let valAsks = 0;
    for (let i = 1; i <= n; i++) {
      const c = s[i - 1];
      const oneOk = c !== '0';
      const one = oneOk ? dp[i - 1] : 0;
      let predict;
      if (!oneOk && !zeroAsked) {
        zeroAsked = true;
        predict = ask(`Digit ${i - 1} is "0". Can it be a letter on its own?`, ['Yes — 0 → J', 'No — codes run from 1 to 26', 'Yes — 0 → A'], 1, 'There is no letter with code 0; a 0 can only be the second digit of 10 or 20.');
      }
      if (i === 1) dp[1] = one;
      snap(
        oneOk
          ? `i = ${i}: last letter = "${c}" → ${letter(Number(c))}. Every decoding of the first ${i - 1} digit(s) can end with it: +dp[${i - 1}] = ${dp[i - 1]}.${i === 1 ? ` dp[1] = ${dp[1]}.` : ''}`
          : `i = ${i}: last letter = "0" alone → no letter has code 0, so this way adds 0.${i === 1 ? ' dp[1] = 0: a string starting with 0 cannot be decoded at all.' : ''}`,
        { i, piece: [i - 1, i - 1], ok: oneOk, dpHl: { [i - 1]: oneOk ? 'done' : 'muted' }, v: { 'one digit': `"${c}" → +${one}` }, predict },
      );
      if (i === 1) continue;
      const t = s.slice(i - 2, i);
      const val = Number(t);
      const twoOk = t[0] !== '0' && val <= 26;
      const two = twoOk ? dp[i - 2] : 0;
      dp[i] = one + two;
      predict = undefined;
      const trap = t[0] === '0' || val > 26;
      if (trap && twoAsks < 2) {
        predict = ask(`Is "${t}" a valid two-digit code?`, ['Yes', 'No'], 1, t[0] === '0' ? `"${t}" has a leading zero — "06" is not 6; codes are written without leading zeros.` : `${val} > 26 — there are only 26 letters.`);
        twoAsks++;
      } else if (twoOk && oneOk && valAsks < 2) {
        predict = pick(`dp[${i - 1}] = ${dp[i - 1]}, dp[${i - 2}] = ${dp[i - 2]}; "${c}" and "${t}" are both valid. What is dp[${i}]?`, dp[i], [dp[i - 1], dp[i - 2], dp[i - 1] * dp[i - 2], dp[i] + 1], valAsks + 1, 'Decodings ending in a 1-digit letter and those ending in a 2-digit letter are different, so the counts add.');
        if (predict) valAsks++;
      }
      const why = twoOk
        ? `"${t}" = ${val} → ${letter(val)}: +dp[${i - 2}] = ${dp[i - 2]}.`
        : t[0] === '0'
          ? `"${t}" starts with 0 — not a code ("06" ≠ 6) → +0.`
          : `"${t}" = ${val} > 26 → no letter → +0.`;
      const zero = dp[i] === 0 ? ` No decoding of the first ${i} digits exists${!oneOk ? ` — "${t}" ends in a 0 that cannot attach to anything` : ''}, and every later count builds on it.` : '';
      snap(`Two digits: ${why} dp[${i}] = ${one} + ${two} = ${dp[i]}.${zero}`, {
        i,
        piece: [i - 2, i - 1],
        ok: twoOk,
        dpHl: { [i - 2]: twoOk ? 'done' : 'muted', [i - 1]: oneOk ? 'done' : 'muted' },
        v: { 'one digit': `+${one}`, 'two digits': `"${t}" → +${two}`, [`dp[${i}]`]: dp[i] },
        predict,
      });
    }
    const ans = dp[n];
    let example = '';
    if (ans > 0 && n > 0) {
      // Walk back from the end, preferring a one-digit letter when the rest still decodes.
      const parts = [];
      let i = n;
      while (i > 0) {
        if (s[i - 1] !== '0' && dp[i - 1] > 0) {
          parts.unshift(s[i - 1]);
          i -= 1;
        } else {
          parts.unshift(s.slice(i - 2, i));
          i -= 2;
        }
      }
      example = ` One of them: ${parts.join(' ')} → ${parts.map((p) => letter(Number(p))).join('')}.`;
    }
    snap(`Answer dp[${n}] = ${ans} decoding(s).${example} O(n) time; dp[i] only reads dp[i−1] and dp[i−2], so two variables give O(1) space.`, {
      dpHl: { [n]: 'done' },
      v: { answer: ans },
    });
    return frames;
  },
};

/* ------------------------------------------------------------------ 1D DP: word break */
export const wordBreak = {
  title: 'Word break: segment a prefix',
  description:
    'dp[i] = can the first i letters be split into dictionary words? dp[i] is true when some j has dp[j] true AND s[j..i) is a word. j with dp[j] false are skipped; the first match wins. (≤ 16 letters, ≤ 10 words.)',
  defaultInput: { s: 'catsanddog', words: ['cat', 'cats', 'and', 'sand', 'dog'] },
  fields: [
    { key: 's', type: 'string', label: 's (≤ 16 letters)' },
    { key: 'words', type: 'strings', label: 'dictionary words' },
  ],
  testInputs: [
    { s: '', words: ['a'] },
    { s: 'leetcode', words: ['leet', 'code'] },
    { s: 'catsandog', words: ['cats', 'dog', 'sand', 'and', 'cat'] },
    { s: 'applepenapple', words: ['apple', 'pen'] },
    { s: 'aaaaaaaaaaaaaaab', words: ['a', 'aa', 'aaa'] },
    { s: 'abc', words: [] },
    { s: 'A B', words: ['a', 'b'] },
    { s: 'x', words: 'x' },
  ],
  generate(input) {
    const s = String(input.s ?? '')
      .toLowerCase()
      .replace(/\s+/g, '')
      .slice(0, 16);
    const words = [...new Set((Array.isArray(input.words) ? input.words : []).map((w) => String(w).trim().toLowerCase().slice(0, 12)).filter(Boolean))].slice(0, 10);
    const dict = new Set(words);
    const n = s.length;
    const dp = new Array(n + 1).fill(null);
    dp[0] = true;
    const par = new Array(n + 1).fill(-1);
    const frames = [];
    const mark = (x) => (x === null ? '' : x ? '✓' : '✗');
    const dictText = words.length ? words.join(' ') : '(empty)';
    const snap = (note, { i, j, ok, sHl, dpHl = {}, v = {}, predict } = {}) => {
      const ptrS = [];
      const ptrD = [];
      if (j !== undefined) {
        ptrS.push({ index: j, label: 'j', color: 'b' });
        ptrD.push({ index: j, label: 'j', color: 'b' });
      }
      if (i !== undefined) {
        if (i - 1 !== j) ptrS.push({ index: i - 1, label: 'i−1', color: 'a' });
        ptrD.push({ index: i, label: 'i', color: 'a' });
      }
      const hl = sHl || {};
      if (!sHl && j !== undefined) for (let k = j; k < i; k++) hl[k] = ok ? 'done' : 'bad';
      const dHl = { ...dpHl };
      if (j !== undefined) dHl[j] = dHl[j] || 'visited';
      if (i !== undefined) dHl[i] = dHl[i] || 'active';
      const f = {
        note,
        panels: [
          arr([...s], { label: 's — candidate last word s[j..i) boxed', highlights: hl, range: j !== undefined ? [j, i - 1] : undefined, pointers: ptrS }),
          arr(dp.map(mark), { label: 'dp[i] = first i letters can be split', highlights: dHl, pointers: ptrD }),
          vars({ dictionary: dictText, ...v }),
        ],
      };
      if (predict) f.predict = predict;
      frames.push(f);
    };
    snap(
      n
        ? `dp[0] = ✓: the empty prefix is trivially split. For each end i, look for a split point j where the first j letters already split (dp[j] ✓) and the rest s[j..i) is one dictionary word.`
        : 'Empty string: dp[0] = ✓ — zero words split it.',
      { dpHl: { 0: 'done' } },
    );
    let skipAsks = 0;
    let hitAsks = 0;
    for (let i = 1; i <= n; i++) {
      const cands = [];
      for (let j = 0; j < i; j++) if (dp[j]) cands.push(j);
      const skipped = i - cands.length;
      let matched = false;
      for (let c = 0; c < cands.length; c++) {
        const j = cands[c];
        const w = s.slice(j, i);
        const hit = dict.has(w);
        const last = c === cands.length - 1;
        let predict;
        if (c > 0 && skipAsks < 2 && j - cands[c - 1] > 1) {
          const opts = [cands[c - 1] + 1, j, j - 1 > cands[c - 1] + 1 ? j - 1 : i - 1, i];
          predict = pick(`dp[${cands[c - 1]}] was tried. Which j is checked next for i = ${i}?`, `j = ${j}`, opts.map((x) => `j = ${x}`), skipAsks + 1, `Every j with dp[j] = ✗ is skipped — no valid split ends there, so s[j..i) cannot help.`);
          if (predict) skipAsks++;
        } else if (!predict && hitAsks < 2 && (hit || c === 0) && w.length > 1 && i > 2) {
          predict = ask(`dp[${j}] = ✓ and s[${j}..${i}) = "${w}". Does this make dp[${i}] ✓?`, ['Yes', 'No'], hit ? 0 : 1, hit ? `"${w}" is in the dictionary, so a valid split of the first ${j} letters plus "${w}" splits the first ${i}.` : `"${w}" is not a dictionary word, so this j does not help.`);
          hitAsks++;
        }
        const skipNote = c === 0 && skipped > 0 ? ` (j with dp[j] = ✗ are skipped: ${skipped} of them.)` : '';
        if (hit) {
          dp[i] = true;
          par[i] = j;
          matched = true;
          snap(`i = ${i}, j = ${j}: dp[${j}] = ✓ and "${w}" is a word → dp[${i}] = ✓. Stop scanning j (break).${skipNote}`, { i, j, ok: true, dpHl: { [i]: 'done', [j]: 'done' }, v: { 's[j..i)': `"${w}" ✓` }, predict });
          break;
        }
        if (last) dp[i] = false;
        snap(
          `i = ${i}, j = ${j}: dp[${j}] = ✓ but "${w}" is not a word.${skipNote}${last ? ` No j works → dp[${i}] = ✗.` : ' Keep scanning j.'}`,
          { i, j, ok: false, dpHl: last ? { [i]: 'bad' } : {}, v: { 's[j..i)': `"${w}" ✗` }, predict },
        );
      }
      if (!matched && !cands.length) {
        dp[i] = false;
        snap(`i = ${i}: no j has dp[j] = ✓ → dp[${i}] = ✗.`, { i, dpHl: { [i]: 'bad' } });
      }
    }
    if (!dp[n]) {
      let best = 0;
      for (let k = 0; k <= n; k++) if (dp[k]) best = k;
      snap(`dp[${n}] = ✗: "${s}" cannot be split. The longest prefix that can is the first ${best} letter(s)${best ? ` ("${s.slice(0, best)}")` : ''}. O(n²) checks × O(n) per slice → O(n³) time worst case, O(n) space.`, {
        sHl: Object.fromEntries(Array.from({ length: best }, (_, k) => [k, 'visited'])),
        dpHl: { [n]: 'bad' },
        v: { answer: 'false' },
      });
      return frames;
    }
    const parts = [];
    for (let i = n; i > 0; i = par[i]) parts.unshift([par[i], i]);
    const sHl = {};
    parts.forEach(([a, b], k) => {
      for (let x = a; x < b; x++) sHl[x] = k % 2 ? 'visited' : 'done';
    });
    const dpHl = {};
    for (const [a] of parts) dpHl[a] = 'done';
    dpHl[n] = 'done';
    const sentence = parts.map(([a, b]) => s.slice(a, b)).join(' ');
    snap(
      n
        ? `dp[${n}] = ✓. Follow the stored j back from the end to rebuild one split: "${sentence}". n + 1 states, up to n split points each → O(n²) checks (each slice costs up to its length), O(n) space.`
        : 'dp[0] = ✓ — the empty string needs no words.',
      { sHl, dpHl, v: { answer: 'true', split: sentence || '(empty)' } },
    );
    return frames;
  },
};

/* ------------------------------------------------------------------ tree construction: preorder + inorder */
export const treeFromTraversals = {
  title: 'Build a tree from preorder + inorder',
  description:
    'The next preorder value is always the root of the current inorder range; its inorder index (from a value → index Map) splits the range into the left and right subtrees. Recurse left first. (≤ 12 unique values.)',
  defaultInput: { preorder: [8, 3, 1, 6, 4, 10, 14, 13], inorder: [1, 3, 4, 6, 8, 10, 13, 14] },
  fields: [
    { key: 'preorder', type: 'numbers', label: 'preorder (≤ 12)' },
    { key: 'inorder', type: 'numbers', label: 'inorder' },
  ],
  testInputs: [
    { preorder: [], inorder: [] },
    { preorder: [1], inorder: [1] },
    { preorder: [3, 9, 20, 15, 7], inorder: [9, 3, 15, 20, 7] },
    { preorder: [1, 2, 3, 4], inorder: [4, 3, 2, 1] },
    { preorder: [1, 2, 3, 4], inorder: [1, 2, 3, 4] },
    { preorder: [1, 2, 4, 5, 3, 6, 7], inorder: [4, 2, 5, 1, 6, 3, 7] },
    { preorder: [1, 2], inorder: [1, 3] },
    { preorder: [1, 1], inorder: [1, 1] },
    { preorder: [1, 2, 3], inorder: [1, 2] },
    { preorder: [1, 2, 3], inorder: [2, 3, 1] },
    { preorder: [3, 1, 2], inorder: [1, 3, 2] },
  ],
  generate(input) {
    const pre = cleanNums(input.preorder, 12);
    const ino = cleanNums(input.inorder, 12);
    if (!pre.length && !ino.length) return errorFrames('Both traversals are empty → the tree is empty (null).', 'Enter a preorder and an inorder of the same unique values.', { nodes: 0 });
    if (pre.length !== ino.length) return errorFrames(`preorder has ${pre.length} values but inorder has ${ino.length} — both list every node exactly once, so the lengths must match.`, 'Fix the lengths and try again.', { preorder: pre.length, inorder: ino.length });
    if (new Set(pre).size !== pre.length) return errorFrames('Values repeat — with duplicates the root’s position in inorder is ambiguous, so the tree is not unique.', 'Use unique values.', { nodes: pre.length });
    const idx = new Map(ino.map((v, k) => [v, k]));
    if (pre.some((v) => !idx.has(v))) return errorFrames('preorder and inorder contain different values — they cannot describe the same tree.', 'Both lists must hold the same values.', { nodes: pre.length });
    // Dry run: build the shape (x = inorder index, y = depth) and detect inconsistent traversals.
    const nodes = [];
    let p = 0;
    let bad = null;
    const build = (lo, hi, depth) => {
      if (lo > hi || bad) return null;
      const val = pre[p++];
      const mid = idx.get(val);
      if (mid < lo || mid > hi) {
        bad = { val, lo, hi, mid };
        return null;
      }
      const node = { id: nodes.length, val, x: mid, y: depth, lo, hi, mid, left: null, right: null };
      nodes.push(node);
      node.left = build(lo, mid - 1, depth + 1);
      node.right = build(mid + 1, hi, depth + 1);
      return node.id;
    };
    build(0, ino.length - 1, 0);
    if (bad)
      return errorFrames(
        `These traversals do not match one tree: ${fmt(bad.val)} should be the root of inorder[${bad.lo}..${bad.hi}], but it sits at index ${bad.mid}, outside that range.`,
        'Check the input: both lists must come from the same tree.',
        { nodes: pre.length },
      );
    const frames = [];
    const states = {};
    const calls = [];
    let ptr = 0;
    const snap = (note, { cur, v = {}, predict } = {}) => {
      const c = cur !== undefined ? nodes[cur] : null;
      const preHl = {};
      for (let k = 0; k < ptr; k++) preHl[k] = 'done';
      if (c) preHl[c.id] = 'active';
      const inHl = {};
      if (c) {
        for (let k = 0; k < ino.length; k++) if (k < c.lo || k > c.hi) inHl[k] = 'muted';
        inHl[c.mid] = 'active';
      }
      const f = {
        note,
        panels: [
          arr(pre.map(fmt), { label: 'preorder (root first)', highlights: preHl, pointers: ptr < pre.length || c ? [{ index: c ? c.id : ptr, label: 'p', color: 'a' }] : [] }),
          arr(ino.map(fmt), { label: c ? `inorder — range [${c.lo}..${c.hi}], root splits it` : 'inorder (left subtree, root, right subtree)', highlights: inHl, range: c ? [c.lo, c.hi] : undefined, pointers: c ? [{ index: c.mid, label: 'mid', color: 'b' }] : [] }),
          treePanel(nodes, states, 'tree (x = inorder position)'),
          stack([...calls], 'call stack'),
          vars(v),
        ],
      };
      if (predict) f.predict = predict;
      frames.push(f);
    };
    snap(`Preorder visits a root before its subtrees; inorder puts the left subtree, then the root, then the right subtree. First build a Map value → inorder index so each split is O(1), then call build(0, ${ino.length - 1}).`, {
      v: { 'Map size': ino.length, p: 0 },
    });
    let asks = 0;
    const walk = (id, parent, sideName) => {
      const nd = nodes[id];
      calls.push(`build(${nd.lo}, ${nd.hi})`);
      ptr = nd.id;
      states[id] = 'active';
      if (parent !== undefined) states[parent] = 'visited';
      let predict;
      if (asks < 4 && nd.hi > nd.lo) {
        if (asks % 2 === 0) {
          const others = ino.slice(nd.lo, nd.hi + 1).filter((x) => x !== nd.val);
          predict = pick(`build(${nd.lo}, ${nd.hi}) starts. Which value becomes the root of inorder[${nd.lo}..${nd.hi}]?`, fmt(nd.val), others.map(fmt), asks + 1, 'Always the NEXT unused preorder value — preorder lists every subtree’s root first.');
        } else {
          predict = pick(`Root ${fmt(nd.val)} sits at inorder index ${nd.mid} in range [${nd.lo}..${nd.hi}]. How many nodes go into its LEFT subtree?`, nd.mid - nd.lo, [nd.hi - nd.mid, nd.mid, nd.hi - nd.lo, nd.mid - nd.lo + 1], asks + 1, 'Everything left of the root inside the range: mid − lo nodes.');
        }
        if (predict) asks++;
      }
      const leftN = nd.mid - nd.lo;
      const rightN = nd.hi - nd.mid;
      const kids =
        leftN + rightN === 0
          ? ' Both sides are empty → a leaf (build returns null for each).'
          : ` Left: ${leftN} node(s) [${ino.slice(nd.lo, nd.mid).map(fmt).join(', ') || '—'}], right: ${rightN} [${ino.slice(nd.mid + 1, nd.hi + 1).map(fmt).join(', ') || '—'}]. ${leftN ? 'Build the left side first — those values come next in preorder.' : 'No left subtree, so the next preorder values belong to the right side.'}`;
      snap(`preorder[${nd.id}] = ${fmt(nd.val)} is the root of inorder[${nd.lo}..${nd.hi}]${parent !== undefined ? ` (${sideName} child of ${fmt(nodes[parent].val)})` : ''}; the Map says it sits at index ${nd.mid}.${kids}`, {
        cur: id,
        v: { p: nd.id, root: fmt(nd.val), mid: nd.mid, left: leftN, right: rightN },
        predict,
      });
      ptr = nd.id + 1;
      if (nd.left !== null) walk(nd.left, id, 'left');
      if (nd.right !== null) walk(nd.right, id, 'right');
      calls.pop();
      states[id] = 'done';
      if (parent !== undefined) states[parent] = 'active';
      if (nd.left !== null || nd.right !== null) {
        snap(`Both subtrees of ${fmt(nd.val)} are built → return it${parent !== undefined ? ` to ${fmt(nodes[parent].val)} as its ${sideName} child` : ' — it is the whole tree'}.`, { v: { p: ptr, returned: fmt(nd.val) } });
      }
    };
    walk(0);
    const depth = Math.max(...nodes.map((x) => x.y)) + 1;
    snap(`Done: every preorder value was used once, left to right. Level order ${levelOrder(nodes, 0)}, height ${depth}. One Map lookup per node → O(n) time, O(n) for the Map + O(h) stack. (indexOf or slicing per call would make it O(n²).)`, {
      v: { answer: levelOrder(nodes, 0), height: depth },
    });
    return frames;
  },
};

/* ------------------------------------------------------------------ functional graph: peel the trees, keep the cycles */
export const functionalGraph = {
  title: 'Functional graph: peel trees, find cycles',
  description:
    'Every node has exactly one arrow i → f[i], so each piece is a cycle with trees feeding into it. Kahn-style peeling removes nodes with in-degree 0 (tree nodes) and tracks the longest chain into each node; whatever is never peeled lies on a cycle. (≤ 10 nodes.)',
  defaultInput: { f: [1, 2, 0, 0, 0, 4, 3] },
  fields: [{ key: 'f', type: 'numbers', label: 'f[i] = node i points to (≤ 10)' }],
  testInputs: [{ f: [] }, { f: [0] }, { f: [1, 2, 0] }, { f: [1, 1] }, { f: [1, 0, 3, 2] }, { f: [1, 2, 3, 4, 5, 6, 7, 8, 9, 9, 3, 2] }, { f: [3, 0, 1, 7] }, { f: [2, 2, 1, 1, 0, 4] }],
  generate(input) {
    const raw = Array.isArray(input.f) ? input.f.slice(0, 10) : [];
    const n = raw.length;
    if (!n) return errorFrames('No nodes — enter f, e.g. 1, 2, 0, 0 (node i points to f[i]).', 'With no nodes there are no cycles.', { n: 0 });
    const f = raw.map((v) => Number(v));
    if (f.some((v) => !Number.isInteger(v) || v < 0 || v >= n))
      return errorFrames(`Every f[i] must be a node index 0…${n - 1}${input.f.length > 10 ? ' (only the first 10 nodes are used)' : ''} — each node points to exactly one existing node.`, 'Fix the out-of-range values and try again.', { n });
    const pos = layoutCircle(n);
    const indeg = new Array(n).fill(0);
    for (const v of f) indeg[v]++;
    const depth = new Array(n).fill(0);
    const peeled = new Array(n).fill(false);
    const q = [];
    let head = 0;
    const frames = [];
    const nodeSt = {};
    const edgeSt = {};
    const snap = (note, { cur, target, showIn = true, v = {}, predict } = {}) => {
      const inHl = {};
      if (target !== undefined) inHl[target] = 'active';
      for (let k = 0; k < n; k++) if (peeled[k]) inHl[k] = 'muted';
      const f2 = {
        note,
        panels: [
          {
            kind: 'nodes',
            nodes: pos.map((p) => ({ id: p.id, label: String(p.id), x: p.x, y: p.y, state: p.id === cur ? 'active' : nodeSt[p.id] || '' })),
            edges: f.map((to, from) => ({ from, to, state: edgeSt[from] || '' })),
            directed: true,
            freeLayout: true,
            label: 'i → f[i] (one arrow out of every node)',
          },
          arr([...f], { label: 'f[i]', highlights: cur !== undefined ? { [cur]: 'active' } : {} }),
          arr(showIn ? [...indeg] : f.map(() => ''), { label: 'indeg[i] = arrows into i', highlights: inHl }),
          arr([...depth], { label: 'depth[i] = longest tree chain ending at i', highlights: target !== undefined ? { [target]: 'active' } : {} }),
          queue(q.slice(head), 'queue (in-degree 0)'),
          vars(v),
        ],
      };
      if (predict) f2.predict = predict;
      frames.push(f2);
    };
    snap(`Each node i has exactly one arrow, to f[i]. Follow arrows from anywhere and you must eventually revisit a node — so every piece is ONE cycle with trees hanging into it.`, { showIn: false });
    snap(`Count arrows INTO each node: indeg = [${indeg.join(', ')}]. A tree leaf has nobody pointing at it; a cycle node always has at least its cycle predecessor.`, {});
    for (let k = 0; k < n; k++)
      if (indeg[k] === 0) {
        q.push(k);
        nodeSt[k] = 'visited';
      }
    snap(
      q.length
        ? `Queue every node with in-degree 0: [${q.join(', ')}]. Nothing points to them, so they cannot be on a cycle — they are tree leaves.`
        : 'No node has in-degree 0: every node is on a cycle, there are no trees to peel.',
      {},
    );
    let joinAsks = 0;
    while (head < q.length) {
      const u = q[head++];
      const v = f[u];
      const old = indeg[v];
      let predict;
      if (joinAsks < 3 && !peeled[v]) {
        predict = ask(`Peel ${u}: remove its arrow ${u} → ${v} (indeg[${v}] = ${old}). Does ${v} join the queue?`, ['Yes — nothing points to it any more', `No — ${v} still has incoming arrows`], old - 1 === 0 ? 0 : 1, 'A node joins once its in-degree reaches 0: all of its incoming tree branches are gone.');
        joinAsks++;
      }
      indeg[v]--;
      peeled[u] = true;
      nodeSt[u] = 'muted';
      edgeSt[u] = 'muted';
      const oldDepth = depth[v];
      depth[v] = Math.max(depth[v], depth[u] + 1);
      const joins = indeg[v] === 0;
      if (joins) {
        q.push(v);
        nodeSt[v] = 'visited';
      }
      snap(
        `Peel ${u}: drop its arrow ${u} → ${v}, so indeg[${v}] ${old} → ${indeg[v]}. depth[${v}] = max(${oldDepth}, depth[${u}] + 1 = ${depth[u] + 1}) = ${depth[v]}. ${joins ? `${v} has no incoming arrows left → it is a tree node too: queue it.` : `${v} still has ${indeg[v]} incoming arrow(s) → stays.`}`,
        { cur: u, target: v, v: { peeled: u, 'arrow removed': `${u} → ${v}` }, predict },
      );
    }
    const onCycle = indeg.map((d) => d > 0);
    const cycNodes = onCycle.map((c, k) => (c ? k : -1)).filter((k) => k >= 0);
    const wrongs = [cycNodes.slice(0, -1), [...cycNodes, ...q.slice(0, 1)], q.slice(0, cycNodes.length), cycNodes.slice(1)].filter((x) => x.length).map((x) => `{${x.join(', ')}}`);
    const predict = q.length ? pick('The queue is empty. Which nodes were never peeled?', `{${cycNodes.join(', ')}}`, wrongs, 2, 'A cycle node always keeps the arrow from its cycle predecessor, so its in-degree never reaches 0.') : undefined;
    for (const k of cycNodes) nodeSt[k] = 'done';
    snap(`Queue empty. Nodes never peeled (indeg > 0): {${cycNodes.join(', ')}} — these are exactly the cycle nodes, because each keeps the arrow from its predecessor on the cycle.`, { v: { 'cycle nodes': cycNodes.length }, predict });
    const seen = new Array(n).fill(false);
    const cycles = [];
    for (const c of cycNodes) {
      if (seen[c]) continue;
      const cyc = [];
      for (let x = c; !seen[x]; x = f[x]) {
        seen[x] = true;
        cyc.push(x);
      }
      cycles.push(cyc);
      for (const x of cyc) edgeSt[x] = 'done';
      const chain = Math.max(...cyc.map((x) => depth[x]));
      snap(`Walk the cycle from ${c}: ${[...cyc, c].join(' → ')} — length ${cyc.length}${cyc.length === 1 ? ' (a self-loop)' : ''}. Longest tree chain feeding into it: ${chain}.`, {
        v: { cycle: cyc.join('→'), length: cyc.length, 'longest chain in': chain },
      });
    }
    const longest = Math.max(...cycles.map((c) => c.length));
    snap(`${cycles.length} cycle(s), lengths [${cycles.map((c) => c.length).join(', ')}]; ${n - cycNodes.length} tree node(s). Every node is queued at most once and every arrow removed once → O(n) time, O(n) space — no need to simulate a walk from every node.`, {
      v: { cycles: cycles.length, 'longest cycle': longest, answer: cycles.map((c) => c.join('→')).join(' | ') },
    });
    return frames;
  },
};

/* ------------------------------------------------------------------ halving recursion: fast power */
const num = (v) => {
  if (v === INF) return '∞';
  if (v === -INF) return '−∞';
  const s = Number.isInteger(v) && Math.abs(v) < 1e15 ? String(Math.abs(v)) : String(Number(Math.abs(v).toPrecision(6)));
  return v < 0 ? `−${s}` : s;
};

export const fastPower = {
  title: 'Fast power: halve the exponent',
  description:
    'pow(e) calls pow(⌊e/2⌋) ONCE and squares the result (times x when e is odd), so the call stack is only about log₂ n deep. A negative n flips x to 1/x first. (|n| ≤ 1 000 000, |x| ≤ 100.)',
  defaultInput: { x: 2, n: 10 },
  fields: [
    { key: 'x', type: 'number', label: 'x' },
    { key: 'n', type: 'number', label: 'n (integer)' },
  ],
  testInputs: [{ x: 2, n: 0 }, { x: 2, n: 1 }, { x: 3, n: 13 }, { x: 2, n: -3 }, { x: 0, n: 5 }, { x: 0, n: -1 }, { x: -2, n: 5 }, { x: 1.5, n: 1000000 }, { x: 2, n: 2.6 }],
  generate(input) {
    let x = Number(input.x);
    if (!Number.isFinite(x)) x = 2;
    x = clamp(Math.round(x * 1e4) / 1e4, -100, 100);
    let n = Number(input.n);
    if (!Number.isFinite(n)) n = 0;
    n = clamp(Math.trunc(n), -1000000, 1000000);
    if (x === 0 && n < 0) return errorFrames(`0 to a negative power means 1 / 0^${-n} = 1 / 0 — division by zero, so it has no value.`, 'Pick x ≠ 0 or n ≥ 0.', { x: 0, n });
    const base = n < 0 ? 1 / x : x;
    const E = Math.abs(n);
    const es = [];
    for (let e = E; ; e = Math.floor(e / 2)) {
      es.push(e);
      if (e === 0) break;
    }
    const res = new Array(es.length).fill(null);
    const frames = [];
    let depth = 0; // number of calls currently on the stack
    let made = 0; // number of calls started so far (their e values stay visible)
    const snap = (note, { cur, v = {}, predict } = {}) => {
      const shown = es.slice(0, made);
      const hl = {};
      shown.forEach((e, k) => {
        if (res[k] !== null) hl[k] = 'done';
      });
      if (cur !== undefined) hl[cur] = 'active';
      const f = {
        note,
        panels: [
          arr(shown, { label: 'e in each call (halves every level)', highlights: hl, pointers: cur !== undefined ? [{ index: cur, label: 'e', color: 'a' }] : [] }),
          arr(
            shown.map((_, k) => (res[k] === null ? '' : num(res[k]))),
            { label: 'value returned by pow(e)', highlights: hl },
          ),
          stack(es.slice(0, depth).map((e) => `pow(${e})`), 'call stack'),
          vars({ x: num(base), ...v }),
        ],
      };
      if (predict) f.predict = predict;
      frames.push(f);
    };
    snap(
      `power(${num(x)}, ${n < 0 ? `−${E}` : E}): multiplying ${E} times is O(n). Instead use x^e = (x^⌊e/2⌋)², times x once more when e is odd. Each call halves e, so there are only ${es.length} calls.`,
      {},
    );
    if (n < 0) snap(`n is negative: x^−${E} = (1/x)^${E}. Flip x once: x = 1/${num(x)} = ${num(base)}, and continue with e = ${E}.`, { v: { 'x was': num(x) } });
    let callAsk = false;
    for (let k = 0; k < es.length; k++) {
      const e = es[k];
      depth = k + 1;
      made = k + 1;
      let predict;
      if (k === 1 && e > 1 && !callAsk) {
        callAsk = true;
        predict = pick(`pow(${es[0]}) needs a smaller power. Which call does it make?`, `pow(${e}) once`, [`pow(${es[0] - 1}) once`, `pow(${e}) twice`, `pow(${Math.ceil(es[0] / 2)}) and pow(${e})`], 2, 'One call on ⌊e/2⌋; its result is reused (squared), never recomputed.');
      }
      if (e === 0) {
        res[k] = 1;
        snap(`pow(0) = 1: the base case — nothing left to multiply. Now the stack unwinds; every caller squares what it gets back.`, { cur: k, v: { e: 0, returns: 1 }, predict });
      } else {
        snap(`pow(${e}): ${e} is ${e % 2 ? 'odd' : 'even'}. First get half = pow(⌊${e}/2⌋) = pow(${Math.floor(e / 2)}) — push it and wait.${k === 0 ? '' : ' The stack grows by one frame per halving.'}`, {
          cur: k,
          v: { e, 'e odd?': e % 2 ? 'yes' : 'no' },
          predict,
        });
      }
    }
    let oddAsk = false;
    let evenAsk = false;
    for (let k = es.length - 2; k >= 0; k--) {
      const e = es[k];
      const h = res[k + 1];
      const odd = e % 2 === 1;
      const r = odd ? h * h * base : h * h;
      depth = k + 1;
      res[k] = r;
      let predict;
      if ((odd && !oddAsk) || (!odd && !evenAsk)) {
        const wrong = odd ? [h * h, h * base, h * h * base * base, 2 * h * base] : [h * h * base, 2 * h, h * base, h];
        predict = pick(`Back in pow(${e}) with half = ${num(h)}. ${e} is ${odd ? 'odd' : 'even'}. What does it return?`, num(r), wrong.map(num), odd ? 1 : 2, odd ? '⌊e/2⌋ + ⌊e/2⌋ = e − 1, so one extra factor x is needed.' : 'e = ⌊e/2⌋ + ⌊e/2⌋ exactly, so the square is the answer.');
        if (predict) {
          if (odd) oddAsk = true;
          else evenAsk = true;
        }
      }
      depth = k; // this frame is popped as it returns
      snap(
        odd
          ? `Back in pow(${e}) with half = ${num(h)}. ${e} is odd: ⌊${e}/2⌋ twice is ${e - 1}, one short → ${num(h)} · ${num(h)} · ${num(base)} = ${num(r)}. Pop and return it.`
          : `Back in pow(${e}) with half = ${num(h)}. ${e} is even → ${num(h)} · ${num(h)} = ${num(r)}. Pop and return it.`,
        { cur: k, v: { e, half: num(h), returns: num(r) }, predict },
      );
    }
    depth = 0;
    const bin = E.toString(2);
    snap(
      E === 0
        ? `${num(x)}^0 = 1: the base case answers immediately. In general there is one call per binary digit of n plus the base case — n = 2³¹ needs only 33 calls. O(log n) time and stack.`
        : `${num(x)}^${n < 0 ? `−${E}` : E} = ${num(res[0])}. ${es.length} call(s) for exponent ${E} (one per binary digit, plus the base case — n = 2³¹ would need only 33): ${E} = ${bin}₂, and each odd step (a 1 bit) adds the extra · x. O(log n) time and O(log n) stack — computing half ONCE is what keeps it from doubling back to O(n).`,
      { v: { answer: num(res[0]), calls: es.length } },
    );
    return frames;
  },
};

/* ------------------------------------------------------------------ BST: sorted array → height-balanced */
export const bstBuildBalanced = {
  title: 'Sorted array → balanced BST',
  description:
    'build(lo, hi) makes the middle element the root, then builds the left half into the left subtree and the right half into the right subtree. Every level halves the range, so the height is ⌈log₂(n + 1)⌉. (≤ 15 values; input is sorted and de-duplicated.)',
  defaultInput: { nums: [-10, -3, 0, 5, 9, 12, 20] },
  fields: [{ key: 'nums', type: 'numbers', label: 'sorted values (≤ 15)' }],
  testInputs: [{ nums: [] }, { nums: [4] }, { nums: [1, 2] }, { nums: [-10, -3, 0, 5, 9] }, { nums: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17] }, { nums: [5, 1, 3, 3, 2] }],
  generate(input) {
    const raw = cleanNums(input.nums, 30);
    const nums = [...new Set(raw)].sort((a, b) => a - b).slice(0, 15);
    const changed = raw.length !== nums.length || raw.some((v, k) => v !== nums[k]);
    if (!nums.length) return errorFrames('Empty array → build(0, −1) returns null: the empty tree (height 0).', 'Enter some values to see the tree grow.', { n: 0, answer: 'null' });
    const nodes = [];
    const build = (lo, hi, depth) => {
      if (lo > hi) return null;
      const mid = (lo + hi) >> 1;
      const node = { id: nodes.length, val: nums[mid], x: mid, y: depth, lo, hi, mid, left: null, right: null };
      nodes.push(node);
      node.left = build(lo, mid - 1, depth + 1);
      node.right = build(mid + 1, hi, depth + 1);
      return node.id;
    };
    build(0, nums.length - 1, 0);
    const height = Math.max(...nodes.map((x) => x.y)) + 1;
    const frames = [];
    const states = {};
    const calls = [];
    const snap = (note, { cur, v = {}, predict } = {}) => {
      const c = cur !== undefined ? nodes[cur] : null;
      const hl = {};
      for (const nd of nodes) if (states[nd.id] && states[nd.id] !== 'hidden') hl[nd.mid] = 'done';
      if (c) {
        for (let k = 0; k < nums.length; k++) if (k < c.lo || k > c.hi) hl[k] = hl[k] || 'muted';
        hl[c.mid] = 'active';
      }
      const f = {
        note,
        panels: [
          arr(nums.map(fmt), { label: c ? `nums — range [${c.lo}..${c.hi}], middle becomes the root` : 'nums (sorted)', highlights: hl, range: c ? [c.lo, c.hi] : undefined, pointers: c ? [{ index: c.mid, label: 'mid', color: 'a' }] : [] }),
          treePanel(nodes, states, 'BST (x = position in nums)'),
          stack([...calls], 'call stack'),
          vars(v),
        ],
      };
      if (predict) f.predict = predict;
      frames.push(f);
    };
    snap(
      `${changed ? 'Input sorted and de-duplicated first. ' : ''}Inserting sorted values one by one would make a chain of height ${nums.length}. Instead take the MIDDLE as the root: half the values go left, half go right, at every level. Call build(0, ${nums.length - 1}).`,
      { v: { n: nums.length } },
    );
    let asks = 0;
    const walk = (id, parent, sideName) => {
      const nd = nodes[id];
      calls.push(`build(${nd.lo}, ${nd.hi})`);
      states[id] = 'active';
      if (parent !== undefined) states[parent] = 'visited';
      let predict;
      if (nd.hi - nd.lo >= 1 && asks < 3 && (id > 0 || nums.length > 2)) {
        const opts = [nd.lo, nd.hi, (nd.lo + nd.hi + 1) >> 1, nd.lo + 1].map((k) => fmt(nums[k]));
        predict = pick(`build(${nd.lo}, ${nd.hi}) on [${nums.slice(nd.lo, nd.hi + 1).map(fmt).join(', ')}]. Which value becomes this subtree's root (mid = (lo + hi) >> 1)?`, fmt(nd.val), opts, asks + 1, `mid = (${nd.lo} + ${nd.hi}) >> 1 = ${nd.mid}: the left-middle when the range has even length.`);
        if (predict) asks++;
      }
      const leftN = nd.mid - nd.lo;
      const rightN = nd.hi - nd.mid;
      snap(
        `build(${nd.lo}, ${nd.hi}): mid = (${nd.lo} + ${nd.hi}) >> 1 = ${nd.mid} → root ${fmt(nd.val)}${parent !== undefined ? ` (${sideName} child of ${fmt(nodes[parent].val)})` : ''}. ${
          leftN + rightN === 0 ? 'Both halves are empty → a leaf.' : `${leftN} smaller value(s) go left, ${rightN} larger go right — the BST order holds automatically because nums is sorted.`
        }`,
        { cur: id, v: { lo: nd.lo, hi: nd.hi, mid: nd.mid, root: fmt(nd.val) }, predict },
      );
      if (nd.left !== null) walk(nd.left, id, 'left');
      if (nd.right !== null) walk(nd.right, id, 'right');
      calls.pop();
      states[id] = 'done';
      if (parent !== undefined) states[parent] = 'active';
      if (nd.left !== null || nd.right !== null) snap(`Both halves of [${nd.lo}..${nd.hi}] are built → return ${fmt(nd.val)}${parent !== undefined ? ` to ${fmt(nodes[parent].val)}` : ' — the root of the whole tree'}.`, { v: { returned: fmt(nd.val) } });
    };
    walk(0);
    const ideal = Math.ceil(Math.log2(nums.length + 1));
    snap(`Done: ${nums.length} node(s), height ${height} = ⌈log₂(${nums.length} + 1)⌉ = ${ideal} — the minimum possible (a sorted insert chain would have height ${nums.length}). In-order traversal gives back nums. O(n) time, O(log n) recursion depth.`, {
      v: { answer: levelOrder(nodes, 0), height },
    });
    return frames;
  },
};

/* ------------------------------------------------------------------ digit DP: count the digit 1 in 0…N */
export const digitDpOnes = {
  title: 'Digit DP: count the 1s in 0…N',
  description:
    'go(pos, tight, ones) chooses digits left to right. While tight (the prefix equals N’s) the digit is capped at N’s digit; once free it can be 0–9, and free states are memoised in memo[pos][ones] — repeats become memo hits. (0 ≤ N ≤ 9999.)',
  defaultInput: { n: 235 },
  fields: [{ key: 'n', type: 'number', label: 'N (0–9999)' }],
  testInputs: [{ n: 0 }, { n: 1 }, { n: 9 }, { n: 10 }, { n: 13 }, { n: 111 }, { n: 1000 }, { n: 9999 }, { n: -5 }, { n: 3.7 }, { n: 99999 }],
  generate(input) {
    let N = Math.floor(Number(input.n));
    if (!Number.isFinite(N)) N = 0;
    const clampedNote = N < 0 ? ' (negative input → N = 0)' : N > 9999 ? ' (capped at 9999)' : '';
    N = clamp(N, 0, 9999);
    const D = String(N).split('').map(Number);
    const L = D.length;
    const memo = new Map();
    const frames = [];
    const calls = [];
    const prefix = [];
    let tightNow = true;
    const cellSt = {};
    const rowLabels = D.map((_, p) => `pos ${p}`);
    const colLabels = Array.from({ length: L }, (_, o) => `ones=${o}`);
    const tf = (t) => (t ? 'tight' : 'free');
    const snap = (note, { pos, hl = {}, v = {}, predict } = {}) => {
      const cells = rowLabels.map((_, p) => colLabels.map((_, o) => (o > p ? '·' : memo.has(`${p},${o}`) ? memo.get(`${p},${o}`) : '')));
      const states = rowLabels.map((_, p) => colLabels.map((_, o) => hl[`${p},${o}`] || (o > p ? 'muted' : memo.has(`${p},${o}`) ? 'visited' : '')));
      const dHl = {};
      if (pos !== undefined && pos < L) dHl[pos] = 'active';
      const built = Array.from({ length: L }, (_, k) => (k < prefix.length ? prefix[k] : '_'));
      const bHl = {};
      for (let k = 0; k < prefix.length; k++) bHl[k] = tightNow ? 'active' : 'visited';
      const f = {
        note,
        panels: [
          arr([...D], { label: `N = ${N}${clampedNote} — digits`, highlights: dHl, pointers: pos !== undefined && pos < L ? [{ index: pos, label: 'pos', color: 'a' }] : [] }),
          arr(built, { label: `number being built (${tightNow ? 'tight: equals N so far' : 'free: already below N'})`, highlights: bHl }),
          table(cells, states, rowLabels, colLabels, 'memo[pos][ones] — free states only'),
          stack([...calls], 'call stack'),
          vars(v),
        ],
      };
      if (predict) f.predict = predict;
      frames.push(f);
    };
    snap(
      `Count every digit 1 written in 0, 1, …, ${N}. Build the numbers digit by digit from the left with go(pos, tight, ones): ones = 1s chosen so far, tight = "the prefix equals N’s prefix", which caps the next digit. go(${L}, …) — a finished number — contributes its ones.`,
      { v: { N, digits: L } },
    );
    let tightAsk = false;
    let hitAsk = false;
    let lastAsk = false;
    let retAsks = 0;
    const go = (pos, tight, ones, entryPredict) => {
      const limit = tight ? D[pos] : 9;
      const key = `${pos},${ones}`;
      const label = `go(${pos}, ${tf(tight)}, ${ones})`;
      calls.push(label);
      const wasTight = tightNow;
      tightNow = tight;
      if (pos === L - 1) {
        const total = (limit + 1) * ones + (limit >= 1 ? 1 : 0);
        let predict = entryPredict;
        if (!predict && !lastAsk && !tight && ones > 0) {
          lastAsk = true;
          predict = pick(`${label} picks the LAST digit d = 0…9; each finished number has ${ones} earlier 1(s), plus one if d = 1. Total?`, total, [10 * ones, ones + 1, total + 1, 10 * (ones + 1)], 2, `${limit + 1} numbers × ${ones} + 1 (the one with d = 1).`);
        }
        if (!tight) memo.set(key, total);
        snap(
          `${label}: the LAST digit d = 0…${limit}${tight ? ` (capped by N’s ${limit})` : ''}. Each finished number carries ${ones} earlier 1(s), and d = 1 adds one more: ${limit + 1} × ${ones}${limit >= 1 ? ' + 1' : ''} = ${total}.${tight ? ' Tight → used once, not memoised.' : ` Store memo[${pos}][${ones}] = ${total}.`}`,
          { pos, hl: { [key]: tight ? '' : 'active' }, v: { pos, tight: tf(tight), ones, limit, returns: total }, predict },
        );
        calls.pop();
        tightNow = wasTight;
        return total;
      }
      snap(
        `${label}: ${tight ? `still equal to N’s prefix, so digit ${pos} may only be 0…${limit} (N’s digit).` : 'already below N, so digit ' + pos + ' can be anything 0…9.'} Try each digit d; the next state is (pos + 1, ${tight ? `tight only if d === ${limit}` : 'free'}, ones + (d === 1)).`,
        { pos, hl: tight ? {} : { [key]: 'active' }, v: { pos, tight: tf(tight), ones, limit }, predict: entryPredict },
      );
      let total = 0;
      const parts = [];
      for (let d = 0; d <= limit; ) {
        const ct = tight && d === limit;
        const co = ones + (d === 1 ? 1 : 0);
        const ck = `${pos + 1},${co}`;
        if (!ct && memo.has(ck)) {
          let d2 = d;
          while (d2 + 1 <= limit && !(tight && d2 + 1 === limit) && ones + (d2 + 1 === 1 ? 1 : 0) === co) d2++;
          const cnt = d2 - d + 1;
          const val = memo.get(ck);
          total += cnt * val;
          parts.push(cnt > 1 ? `${cnt}×${val}` : String(val));
          let predict;
          if (!hitAsk) {
            hitAsk = true;
            predict = ask(`d = ${d}${cnt > 1 ? `…${d2}` : ''} leads to state go(${pos + 1}, free, ${co}) again. What happens?`, ['Recurse and recompute its whole subtree', 'Read memo[' + (pos + 1) + '][' + co + '] — a memo hit'], 1, 'A free state means "the remaining digits are unrestricted", so its answer is the same no matter which prefix led here.');
          }
          snap(
            `d = ${d}${cnt > 1 ? `…${d2}` : ''} → go(${pos + 1}, free, ${co}) is already in the memo = ${val}. Memo hit${cnt > 1 ? ` ×${cnt}` : ''}: add ${cnt > 1 ? `${cnt} × ${val} = ${cnt * val}` : val} without recursing. Running total ${total}.`,
            { pos, hl: { [ck]: 'done', ...(tight ? {} : { [key]: 'active' }) }, v: { pos, tight: tf(tight), d: cnt > 1 ? `${d}…${d2}` : d, total }, predict },
          );
          d = d2 + 1;
          continue;
        }
        let predict;
        if (tight && !tightAsk && pos + 1 < L) {
          tightAsk = true;
          predict = ask(`Tight at pos ${pos}: the cap is ${limit}, and we choose d = ${d}. Is the next state tight or free?`, ['Tight — the next digit is capped by N', 'Free — the next digit can be 0…9'], ct ? 0 : 1, 'We stay tight only when d equals the cap; any smaller digit makes the number already smaller than N.');
        }
        prefix.push(d);
        const val = go(pos + 1, ct, co, predict);
        prefix.pop();
        total += val;
        parts.push(String(val));
        d++;
      }
      let predict;
      if (retAsks < 2 && parts.length > 1) {
        predict = pick(`${label} has tried every digit: contributions ${parts.join(' + ')}. What does it return?`, total, [total - 1, total + 1, Math.max(...parts.map((x) => Number(x.split('×').pop()))), total * 2], retAsks + 1, 'Add every digit’s contribution (a memo hit for k digits counts k times).');
        if (predict) retAsks++;
      }
      if (!tight) memo.set(key, total);
      calls.pop();
      tightNow = wasTight;
      snap(
        `${label} returns ${parts.join(' + ')} = ${total}.${tight ? ' Tight → only one such call exists, so it is not memoised.' : ` Store memo[${pos}][${ones}] = ${total}.`}`,
        { pos, hl: tight ? {} : { [key]: 'active' }, v: { pos, tight: tf(tight), ones, returns: total }, predict },
      );
      return total;
    };
    const ans = go(0, true, 0);
    snap(`Answer: digit 1 appears ${ans} time(s) in 0…${N}. Only ${memo.size} free state(s) were computed; every repeat was a memo hit. O(digits × ones-states × 10) time instead of walking all ${N + 1} numbers.`, {
      v: { answer: ans, 'memo states': memo.size },
    });
    return frames;
  },
};
