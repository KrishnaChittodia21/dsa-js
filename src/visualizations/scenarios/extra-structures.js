// Extra structures & techniques: string matching, bit tricks, range-query trees, BST, backtracking.
import { layoutNary } from '../layout.js';

const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const ask = (question, options, answer, explain) => ({ question, options, answer, explain });
// Build a predict with the correct option placed at a deterministic slot (varies the answer index).
const askAt = (question, correct, wrongs, slot, explain) => {
  const c = String(correct);
  const uniq = [...new Set(wrongs.map(String))].filter((w) => w !== c).slice(0, 3);
  if (!uniq.length) return undefined;
  const pos = Math.abs(slot) % (uniq.length + 1);
  const options = [...uniq];
  options.splice(pos, 0, c);
  return ask(question, options, pos, explain);
};
const nodeLink = (layout, states = {}, opts = {}) => ({
  kind: 'nodes',
  nodes: layout.nodes.map((n) => ({ id: n.id, label: String(n.val), x: n.x, y: n.y, state: states[n.id] || '' })),
  edges: layout.edges.map(([a, b]) => ({ from: a, to: b, state: opts.edgeStates?.[`${a}-${b}`] || '' })),
  directed: opts.directed ?? true,
  ...(opts.label ? { label: opts.label } : {}),
});
const toInt = (v, d = 0) => {
  const x = Math.trunc(Number(v));
  return Number.isFinite(x) ? x : d;
};
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const numList = (nums, max) => (Array.isArray(nums) ? nums : []).map((x) => toInt(x)).slice(0, max);

// ───────────────────────────── KMP ─────────────────────────────
export const kmp = {
  title: 'KMP string search',
  description: 'Build the LPS table (longest proper prefix that is also a suffix), then scan the text without ever moving i backwards. Text clamped to 24 chars, pattern to 10.',
  defaultInput: { text: 'ABABDABACDABABCABAB', pattern: 'ABABCABAB' },
  fields: [
    { key: 'text', type: 'string', label: 'text (≤ 24)' },
    { key: 'pattern', type: 'string', label: 'pattern (≤ 10)' },
  ],
  testInputs: [
    { text: '', pattern: 'A' },
    { text: 'AAAA', pattern: '' },
    { text: 'AAAAAB', pattern: 'AAB' },
    { text: 'AB', pattern: 'ABC' },
    { text: 'AAAAAAAA', pattern: 'AA' },
    { text: 'XYZXYZXYZXYZXYZXYZXYZXYZXYZ', pattern: 'ZXYZ' },
  ],
  generate({ text, pattern }) {
    const t = String(text ?? '').slice(0, 24).split('');
    const p = String(pattern ?? '').slice(0, 10).split('');
    const n = t.length;
    const m = p.length;
    const frames = [];
    if (!m) {
      frames.push({ note: 'The pattern is empty.', panels: [arr(t, { label: 'text' })] });
      frames.push({ note: 'An empty pattern trivially matches at index 0 — there is nothing to search for.', panels: [arr(t, { label: 'text' })] });
      return frames;
    }
    // Phase 1: LPS
    const lps = new Array(m).fill(0);
    let filled = 1;
    let len = 0;
    let i = 1;
    const lpsView = () => lps.map((v, k) => (k < filled ? v : '·'));
    const p1 = (note, hl = {}, lpsHl = {}, predict) =>
      frames.push({
        note,
        panels: [
          arr(p, { label: 'pattern', highlights: hl, pointers: [{ index: len, label: 'len', color: 'a' }, ...(i < m ? [{ index: i, label: 'i', color: 'b' }] : [])] }),
          arr(lpsView(), { label: 'lps', highlights: lpsHl }),
          vars({ len, i }),
        ],
        ...(predict ? { predict } : {}),
      });
    p1(`Phase 1 — build lps: lps[i] = length of the longest proper prefix of pattern[0..i] that is also a suffix. lps[0] = 0 always; start with len = 0, i = 1.`, {}, { 0: 'done' });
    let p1Asks = 0;
    while (i < m) {
      if (p[i] === p[len]) {
        len++;
        lps[i] = len;
        filled = i + 1;
        p1(`p[${i}] = '${p[i]}' equals p[${len - 1}] → the prefix grows: lps[${i}] = ${len}. Move i forward.`, { [i]: 'active', [len - 1]: 'done' }, { [i]: 'done' });
        i++;
      } else if (len > 0) {
        const old = len;
        len = lps[len - 1];
        const predict =
          p1Asks++ < 1
            ? askAt(`p[${i}] = '${p[i]}' ≠ p[${old}] = '${p[old]}' while len = ${old}. What does len become?`, `len = ${len}`, [`len = 0`, `len = ${old - 1}`, `len = ${old + 1}`], old, 'Fall back to lps[len − 1]: the next-shorter prefix that is also a suffix.')
            : undefined;
        p1(`p[${i}] = '${p[i]}' ≠ p[${old}] = '${p[old]}'. Don't restart from 0 — fall back to len = lps[${old - 1}] = ${len}, the next-shorter border, and compare again (i stays).`, { [i]: 'bad', [old]: 'bad' }, { [old - 1]: 'visited' }, predict);
      } else {
        lps[i] = 0;
        filled = i + 1;
        p1(`p[${i}] = '${p[i]}' ≠ p[0] = '${p[0]}' and len = 0 → no border fits: lps[${i}] = 0. Move i forward.`, { [i]: 'bad', 0: 'muted' }, { [i]: 'done' });
        i++;
      }
    }
    p1(`lps done: [${lps.join(', ')}]. It took O(m) because len only falls back as often as it grew.`, {}, Object.fromEntries(lps.map((_, k) => [k, 'done'])));

    // Phase 2: search
    i = 0;
    let j = 0;
    const matches = [];
    let fallAsks = 0;
    const p2 = (note, tHl = {}, pHl = {}, predict) => {
      const highlights = {};
      for (const s of matches) for (let k = s; k < s + m; k++) highlights[k] = 'done';
      Object.assign(highlights, tHl);
      const start = i - j;
      frames.push({
        note,
        panels: [
          arr(t, { label: 'text', highlights, range: n ? [clamp(start, 0, n - 1), clamp(start + m - 1, 0, n - 1)] : undefined, pointers: i < n ? [{ index: i, label: 'i', color: 'a' }] : [] }),
          arr(p, { label: 'pattern (aligned at the box)', highlights: pHl, pointers: [{ index: Math.min(j, m - 1), label: 'j', color: 'b' }] }),
          arr(lps, { label: 'lps' }),
          vars({ i, j, found: matches.length ? matches.join(', ') : '—' }),
        ],
        ...(predict ? { predict } : {}),
      });
    };
    if (!n || m > n) {
      p2(`Phase 2 — the text ${n ? `(length ${n}) is shorter than the pattern (length ${m})` : 'is empty'}, so there can be no match.`);
      p2('No occurrences. KMP would be O(n + m) in general.');
      return frames;
    }
    p2('Phase 2 — scan the text with i and the pattern with j. i never moves backwards; on a mismatch only j falls back using lps.');
    while (i < n) {
      if (t[i] === p[j]) {
        p2(`t[${i}] = p[${j}] = '${t[i]}' → match, advance both i and j.`, { [i]: 'active' }, { [j]: 'active' });
        i++;
        j++;
        if (j === m) {
          matches.push(i - m);
          const nj = lps[m - 1];
          const predict =
            matches.length === 1 ? askAt('j reached the end of the pattern — a full match! Where does j go so we can keep searching?', `j = lps[m−1] = ${nj}`, ['j = 0', `j = ${m}`, `i goes back to ${i - m + 1}`], 2, 'Reuse the longest border so overlapping matches are not missed.') : undefined;
          j = nj;
          p2(`Whole pattern matched → occurrence at index ${i - m}! Continue with j = lps[${m - 1}] = ${nj} so overlapping matches are still found.`, {}, {}, predict);
        }
      } else if (j > 0) {
        const old = j;
        j = lps[j - 1];
        const predict =
          fallAsks++ < 4
            ? askAt(`Mismatch: t[${i}] = '${t[i]}' ≠ p[${old}] = '${p[old]}' (j = ${old}). Where does j go?`, `j = lps[${old - 1}] = ${j}`, [...(j !== 0 ? ['j = 0 (restart the pattern)'] : []), `i goes back to ${i - old + 1}, j = 0`, ...(old - 1 !== j ? [`j = ${old - 1}`] : [])], fallAsks + i, 'The matched part p[0..j−1] is already known; its longest border lets the pattern slide without re-reading text.')
            : undefined;
        p2(`t[${i}] = '${t[i]}' ≠ p[${old}] = '${p[old]}'. We know p[0..${old - 1}] matched, and its longest border is lps[${old - 1}] = ${j} → slide the pattern: j = ${j}. i stays put (no re-reading the text).`, { [i]: 'bad' }, { [j]: 'visited' }, predict);
      } else {
        p2(`t[${i}] = '${t[i]}' ≠ p[0] = '${p[0]}' and j = 0 → nothing to reuse; just move i forward.`, { [i]: 'bad' }, { 0: 'bad' });
        i++;
      }
    }
    p2(matches.length ? `Done: pattern found at index ${matches.join(', ')}. Total O(n + m): i only moves forward and j falls back at most as often as it advanced.` : `Done: no occurrence. Total O(n + m): i only moves forward and j falls back at most as often as it advanced.`);
    return frames;
  },
};

// ───────────────────────────── Rabin–Karp ─────────────────────────────
const RK_B = 31;
const RK_M = 101;
const charVal = (c) => {
  const code = c.toLowerCase().charCodeAt(0);
  return code >= 97 && code <= 122 ? code - 96 : (c.charCodeAt(0) % 26) + 1;
};
const mod = (x) => ((x % RK_M) + RK_M) % RK_M;

export const rollingHash = {
  title: 'Rabin–Karp rolling hash',
  description: `Hash every window in O(1) by removing the left char, shifting, and adding the right char (base ${RK_B}, mod ${RK_M}; a=1 … z=26). Equal hashes are verified char by char. Text clamped to 24, pattern to 8.`,
  defaultInput: { text: 'catchescat', pattern: 'cat' },
  fields: [
    { key: 'text', type: 'string', label: 'text (≤ 24)' },
    { key: 'pattern', type: 'string', label: 'pattern (≤ 8)' },
  ],
  testInputs: [
    { text: '', pattern: 'ab' },
    { text: 'abc', pattern: '' },
    { text: 'ab', pattern: 'abc' },
    { text: 'aaaaa', pattern: 'aa' },
    { text: 'z', pattern: 'z' },
    { text: 'abracadabra', pattern: 'cad' },
  ],
  generate({ text, pattern }) {
    const t = String(text ?? '').slice(0, 24).split('');
    const p = String(pattern ?? '').slice(0, 8).split('');
    const n = t.length;
    const m = p.length;
    const frames = [];
    const matches = [];
    const spurious = [];
    let s = 0;
    let wh = '—';
    let ph = '—';
    let high = '—';
    const snap = (note, tHl = {}, pHl = {}, predict, extra = {}) => {
      const highlights = {};
      for (const k of matches) for (let q = k; q < k + m; q++) highlights[q] = 'done';
      Object.assign(highlights, tHl);
      frames.push({
        note,
        panels: [
          arr(t, { label: 'text', highlights, range: n && m && m <= n ? [s, Math.min(n - 1, s + m - 1)] : undefined }),
          arr(p, { label: 'pattern', highlights: pHl }),
          vars({ 'pattern hash': ph, 'window hash': wh, [`${RK_B}^(m−1) mod ${RK_M}`]: high, ...extra }),
        ],
        ...(predict ? { predict } : {}),
      });
    };
    if (!m || !n || m > n) {
      snap(`Letters become numbers (a=1 … z=26); a string's hash is Σ value × ${RK_B}^power, mod ${RK_M}.`);
      snap(!m ? 'The pattern is empty — nothing to search for.' : !n ? 'The text is empty — no window to hash, no match.' : `The pattern (length ${m}) is longer than the text (length ${n}) — no window fits, no match.`);
      return frames;
    }
    snap(`Letters become numbers (a=1 … z=26). hash(s) = (s₀·${RK_B}^(m−1) + … + s_(m−1)) mod ${RK_M}. Small numbers keep it readable; real code uses a big prime.`);
    ph = 0;
    const steps = [];
    for (const c of p) {
      ph = mod(ph * RK_B + charVal(c));
      steps.push(charVal(c));
    }
    high = 1;
    for (let k = 1; k < m; k++) high = mod(high * RK_B);
    snap(`Pattern hash (Horner): h = (h·${RK_B} + value) mod ${RK_M} over [${steps.join(', ')}] → ${ph}. Also precompute ${RK_B}^(m−1) mod ${RK_M} = ${high} to remove the leftmost char later.`, {}, Object.fromEntries(p.map((_, k) => [k, 'active'])));
    let h = 0;
    for (let k = 0; k < m; k++) h = mod(h * RK_B + charVal(t[k]));
    wh = h;
    let slides = 0;
    const compare = () => {
      if (h !== ph) return false;
      const real = t.slice(s, s + m).join('') === p.join('');
      const predict = ask(`Window "${t.slice(s, s + m).join('')}" has hash ${h} = pattern hash ${ph}. Is it a real match?`, ['Yes — the characters match', 'No — a spurious hit (hash collision)'], real ? 0 : 1, 'Different strings can share a hash, so we must check the characters.');
      if (real) {
        matches.push(s);
        snap(`Hashes match → verify char by char: "${p.join('')}" = "${p.join('')}". Real match at index ${s}!`, {}, Object.fromEntries(p.map((_, k) => [k, 'done'])), predict);
      } else {
        spurious.push(s);
        const bad = {};
        for (let k = 0; k < m; k++) if (t[s + k] !== p[k]) bad[s + k] = 'bad';
        snap(`Hashes match, but verifying shows "${t.slice(s, s + m).join('')}" ≠ "${p.join('')}" — a SPURIOUS hit (collision mod ${RK_M}). That's why we always verify.`, bad, {}, predict);
      }
      return true;
    };
    snap(`First window "${t.slice(0, m).join('')}" hashed the same way → ${h}. ${h === ph ? 'Equal to the pattern hash — check it!' : `≠ ${ph} → definitely not a match, skip without comparing characters.`}`, { ...Object.fromEntries(t.slice(0, m).map((_, k) => [k, 'active'])) });
    compare();
    for (s = 1; s + m <= n; s++) {
      const prev = h;
      const out = charVal(t[s - 1]);
      const inn = charVal(t[s + m - 1]);
      h = mod((prev - out * high) * RK_B + inn);
      wh = h;
      slides++;
      let predict;
      if (slides % 3 === 1) {
        const w1 = mod(prev * RK_B + inn);
        const w2 = mod((prev - out) * RK_B + inn);
        const w3 = mod(prev - out * high + inn);
        predict = askAt(`Slide: remove '${t[s - 1]}' (${out}), add '${t[s + m - 1]}' (${inn}). Old hash ${prev}. New window hash?`, h, [w1, w2, w3, mod(h + 7)], slides, `(old − out·${high}) · ${RK_B} + in, all mod ${RK_M}.`);
      }
      snap(
        `Slide to index ${s}: remove '${t[s - 1]}' (−${out}·${high}), shift (·${RK_B}), add '${t[s + m - 1]}' (+${inn}) → (${prev} − ${out * high})·${RK_B} + ${inn} mod ${RK_M} = ${h}. ${h === ph ? 'Equal to the pattern hash — verify!' : `≠ ${ph} → skip, no char comparisons.`}`,
        { [s - 1]: 'muted', [s + m - 1]: 'active' },
        {},
        predict,
        { removed: `'${t[s - 1]}'=${out}`, added: `'${t[s + m - 1]}'=${inn}` },
      );
      compare();
    }
    s = n - m;
    snap(`Done. Matches at [${matches.join(', ') || 'none'}]${spurious.length ? `, spurious hits at [${spurious.join(', ')}]` : ''}. Each slide is O(1) → O(n + m) expected; many collisions could push it to O(n·m).`);
    return frames;
  },
};

// ───────────────────────────── Bit operations ─────────────────────────────
const bitsOf = (v, W) => Array.from({ length: W }, (_, idx) => (v >>> (W - 1 - idx)) & 1);

export const bitOps = {
  title: 'Bit manipulation basics',
  description: 'Check / set / clear / toggle bit k with a mask, then count set bits with x & (x − 1). x clamped to 0..65535 (8 or 16 bits shown).',
  defaultInput: { x: 44, k: 1 },
  fields: [
    { key: 'x', type: 'number', label: 'x (0..65535)' },
    { key: 'k', type: 'number', label: 'bit k' },
  ],
  testInputs: [{ x: 0, k: 0 }, { x: 255, k: 7 }, { x: 1000, k: 20 }, { x: -5, k: -1 }, { x: 1, k: 0 }],
  generate({ x, k }) {
    x = clamp(toInt(x), 0, 65535);
    const W = x > 255 ? 16 : 8;
    k = clamp(toInt(k), 0, W - 1);
    const mask = 1 << k;
    const kIdx = W - 1 - k;
    const frames = [];
    const positions = arr(Array.from({ length: W }, (_, idx) => W - 1 - idx), { label: 'bit position', showIndices: false });
    const row = (name, v, hl = {}, ptr = true) => arr(bitsOf(v, W), { label: `${name} = ${v}`, showIndices: false, highlights: hl, pointers: ptr ? [{ index: kIdx, label: `bit ${k}`, color: 'a' }] : [] });
    const diffHl = (a, b, st = 'active') => {
      const hl = {};
      for (let idx = 0; idx < W; idx++) if (bitsOf(a, W)[idx] !== bitsOf(b, W)[idx]) hl[idx] = st;
      return hl;
    };
    const push = (note, panels, predict) => frames.push({ note, panels: [positions, ...panels], ...(predict ? { predict } : {}) });
    push(`x = ${x} in ${W}-bit binary. Bit i is worth 2^i, so bit 0 is on the right.`, [row('x', x), vars({ x, k })]);
    push(`mask = 1 << ${k} = ${mask}: a single 1 shifted to position ${k}. Every single-bit operation uses this mask.`, [row('x', x), row('mask', mask, { [kIdx]: 'active' }), vars({ x, k, mask })]);
    const isSet = (x & mask) !== 0;
    push(`CHECK: x & mask = ${x & mask} → bit ${k} is ${isSet ? 'SET (1)' : 'NOT set (0)'}. AND keeps only the bit the mask points at.`, [row('x', x, { [kIdx]: isSet ? 'done' : 'bad' }), row('mask', mask), row('x & mask', x & mask, { [kIdx]: 'active' }), vars({ 'bit k set?': isSet })], ask(`Is bit ${k} of x = ${x} set?`, ['Yes (1)', 'No (0)'], isSet ? 0 : 1, `x & (1 << ${k}) is non-zero exactly when bit ${k} is 1.`));
    const setV = x | mask;
    const clrV = x & ~mask;
    const togV = x ^ mask;
    push(`SET: x | mask = ${setV}. OR forces bit ${k} to 1 and leaves every other bit alone${isSet ? ' (it was already 1, so nothing changes)' : ''}.`, [row('x', x), row('mask', mask), row('x | mask', setV, { [kIdx]: 'done' }), vars({ result: setV })], askAt(`x | mask = ?`, setV, [togV, clrV, x + mask + 1, mask], 0, 'OR with the mask turns bit k on.'));
    push(`CLEAR: x & ~mask = ${clrV}. ~mask has 0 only at bit ${k}, so AND switches that bit off${isSet ? '' : ' (it was already 0)'}.`, [row('x', x), row('~mask', ~mask & ((1 << W) - 1)), row('x & ~mask', clrV, { [kIdx]: 'bad' }), vars({ result: clrV })]);
    push(`TOGGLE: x ^ mask = ${togV}. XOR with 1 flips a bit, XOR with 0 keeps it — so only bit ${k} flips (${isSet ? '1 → 0' : '0 → 1'}).`, [row('x', x), row('mask', mask), row('x ^ mask', togV, { [kIdx]: 'active' }), vars({ result: togV })], askAt(`x ^ mask = ?`, togV, [setV === togV ? clrV : setV, x, x & mask], 2, 'XOR flips exactly the bit under the mask.'));
    // Counting with x & (x-1)
    let y = x;
    let count = 0;
    push(`Count set bits (Brian Kernighan): y & (y − 1) erases the LOWEST set bit. Repeat until y = 0; the number of rounds is the answer.`, [row('y', y, {}, false), vars({ y, count })]);
    let round = 0;
    while (y) {
      const low = y & -y;
      const lowPos = Math.log2(low);
      const lowIdx = W - 1 - lowPos;
      const next = y & (y - 1);
      round++;
      let highPos = 0;
      for (let b = W - 1; b >= 0; b--) if ((y >> b) & 1) {
        highPos = b;
        break;
      }
      const predict = round % 2 === 1 ? askAt(`y = ${y}. Which bit does y & (y − 1) remove?`, `bit ${lowPos}`, [`bit ${highPos}`, `bit 0`, `bit ${lowPos + 1}`], round + lowPos, 'Subtracting 1 flips the lowest 1 and the 0s below it; AND then wipes them.') : undefined;
      push(`y − 1 = ${y - 1}: subtracting 1 turns the lowest 1 (bit ${lowPos}) into 0 and the 0s below it into 1s. AND with y wipes all of them → ${next}. count = ${count + 1}.`, [row('y', y, { [lowIdx]: 'bad' }, false), row('y − 1', y - 1, diffHl(y, y - 1), false), row('y & (y − 1)', next, {}, false), vars({ count: count + 1 })], predict);
      y = next;
      count++;
    }
    push(`y = 0 → x = ${x} has ${count} set bit${count === 1 ? '' : 's'}. Each mask op is O(1); counting takes O(number of set bits), not O(${W}).`, [row('x', x, Object.fromEntries(bitsOf(x, W).map((b, idx) => [idx, b ? 'done' : ''])), false), vars({ popcount: count })]);
    return frames;
  },
};

// ───────────────────────────── XOR single number ─────────────────────────────
export const xorSingle = {
  title: 'XOR: find the single number',
  description: 'Every number appears twice except one. a ^ a = 0 and a ^ 0 = a, so XOR-ing everything leaves the loner. Non-negative values ≤ 65535, first 12 kept.',
  defaultInput: { nums: [4, 1, 2, 1, 2] },
  fields: [{ key: 'nums', type: 'numbers', label: 'nums' }],
  testInputs: [{ nums: [] }, { nums: [7] }, { nums: [2, 2] }, { nums: [5, 3, 5, 3, 9, 300, 300] }, { nums: [-1, 1, 1] }],
  generate({ nums }) {
    const a = numList(nums, 12).map((v) => clamp(v, 0, 65535));
    const maxV = Math.max(0, ...a);
    const W = Math.max(4, maxV.toString(2).length);
    const frames = [];
    let acc = 0;
    const seen = new Map();
    const bits = (name, v, hl = {}) => arr(bitsOf(v, W), { label: `${name} = ${v}`, showIndices: false, highlights: hl });
    const positions = arr(Array.from({ length: W }, (_, idx) => W - 1 - idx), { label: 'bit position', showIndices: false });
    const numsPanel = (hl = {}) => arr(a, { label: 'nums', highlights: hl });
    frames.push({ note: 'acc starts at 0. XOR rules: a ^ a = 0, a ^ 0 = a, and order does not matter — so pairs cancel wherever they are.', panels: [numsPanel(), positions, bits('acc', acc), vars({ acc })] });
    if (!a.length) {
      frames.push({ note: 'No numbers → acc stays 0. O(n) time, O(1) space.', panels: [numsPanel(), positions, bits('acc', acc), vars({ answer: 0 })] });
      return frames;
    }
    a.forEach((v, i) => {
      const before = Array.from(seen.keys());
      const repeat = (seen.get(v) || 0) % 2 === 1;
      const flip = {};
      bitsOf(v, W).forEach((b, idx) => {
        if (b) flip[idx] = 'active';
      });
      frames.push({ note: `Next: nums[${i}] = ${v}. Its 1-bits (highlighted) will flip the matching bits of acc.${repeat ? ` ${v} was seen before — watch it cancel.` : ''}`, panels: [numsPanel({ [i]: 'active' }), positions, bits('acc', acc), bits(`nums[${i}]`, v, flip), vars({ acc })] });
      const next = acc ^ v;
      const predict = i >= 1 && (repeat || i % 2 === 0) ? askAt(`acc = ${acc}, x = ${v}. What is acc ^ x?`, next, [acc | v, acc & v, acc + v, v], i, 'XOR flips the bits of acc wherever x has a 1.') : undefined;
      seen.set(v, (seen.get(v) || 0) + 1);
      const resHl = {};
      bitsOf(next, W).forEach((b, idx) => {
        if (flip[idx]) resHl[idx] = b ? 'done' : 'bad';
      });
      acc = next;
      frames.push({ note: `acc ^= ${v} → ${acc}.${repeat ? ` ${v} cancelled itself out (${v} ^ ${v} = 0): its bits flipped back.` : ` ${v}'s bits are now mixed into acc.`}${before.length === 0 ? '' : ''}`, panels: [numsPanel({ [i]: 'done' }), positions, bits('acc', acc, resHl), vars({ acc, 'acc (binary)': acc.toString(2) })], ...(predict ? { predict } : {}) });
    });
    const odd = [...seen.entries()].filter(([, c]) => c % 2 === 1).map(([v]) => v);
    const verdict = odd.length === 1 ? `${acc} is the number without a partner.` : odd.length === 0 ? 'Every value appeared an even number of times, so everything cancelled.' : `More than one value appears an odd number of times (${odd.join(', ')}), so acc is their XOR, not a single number.`;
    frames.push({ note: `Final acc = ${acc}. ${verdict} O(n) time, O(1) extra space — no hash map needed.`, panels: [numsPanel(), positions, bits('answer', acc, Object.fromEntries(bitsOf(acc, W).map((b, idx) => [idx, b ? 'done' : '']))), vars({ answer: acc })] });
    return frames;
  },
};

// ───────────────────────────── Segment tree ─────────────────────────────
export const segmentTree = {
  title: 'Segment tree: range sum + point update',
  description: 'Each node stores the sum of a range. A query takes whole nodes that fit, skips nodes outside, and splits the rest; an update fixes one root-to-leaf path. First 8 numbers kept.',
  defaultInput: { nums: [5, 8, 6, 3, 2, 7, 2, 6], l: 2, r: 6, updateIndex: 3, updateValue: 10 },
  fields: [
    { key: 'nums', type: 'numbers', label: 'nums (≤ 8)' },
    { key: 'l', type: 'number', label: 'query l' },
    { key: 'r', type: 'number', label: 'query r' },
    { key: 'updateIndex', type: 'number', label: 'update index' },
    { key: 'updateValue', type: 'number', label: 'new value' },
  ],
  testInputs: [
    { nums: [], l: 0, r: 0, updateIndex: 0, updateValue: 1 },
    { nums: [4], l: 0, r: 0, updateIndex: 0, updateValue: 9 },
    { nums: [1, 2, 3], l: 2, r: 0, updateIndex: 5, updateValue: -1 },
    { nums: [3, 3, 3, 3, 3], l: 0, r: 4, updateIndex: 4, updateValue: 0 },
    { nums: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], l: -3, r: 99, updateIndex: 7, updateValue: 2 },
  ],
  generate({ nums, l, r, updateIndex, updateValue }) {
    const a = numList(nums, 8);
    const n = a.length;
    const frames = [];
    if (!n) {
      frames.push({ note: 'No numbers → the segment tree is empty.', panels: [arr([], { label: 'nums' })] });
      frames.push({ note: 'Every query on an empty array returns 0. Build O(n), query/update O(log n).', panels: [arr([], { label: 'nums' })] });
      return frames;
    }
    l = clamp(toInt(l), 0, n - 1);
    r = clamp(toInt(r), 0, n - 1);
    if (l > r) [l, r] = [r, l];
    const u = clamp(toInt(updateIndex), 0, n - 1);
    const newVal = toInt(updateValue);
    let nid = 0;
    const all = [];
    const build = (lo, hi) => {
      const node = { id: nid++, lo, hi, sum: 0, left: null, right: null };
      all.push(node);
      if (lo < hi) {
        const mid = (lo + hi) >> 1;
        node.left = build(lo, mid);
        node.right = build(mid + 1, hi);
      }
      return node;
    };
    const root = build(0, n - 1);
    const toTree = (nd) => ({ id: nd.id, label: '', children: nd.left ? [toTree(nd.left), toTree(nd.right)] : [] });
    const layout = layoutNary(toTree(root));
    const revealed = new Set();
    const label = (nd) => (nd.lo === nd.hi ? `[${nd.lo}]=${nd.sum}` : `[${nd.lo}..${nd.hi}]=${nd.sum}`);
    const byId = Object.fromEntries(all.map((nd) => [nd.id, nd]));
    const draw = (note, states = {}, extra = {}, arrOpts = {}, predict) => {
      const lay = { nodes: layout.nodes.map((ln) => ({ ...ln, val: label(byId[ln.id]) })), edges: layout.edges };
      const st = {};
      for (const nd of all) st[nd.id] = revealed.has(nd.id) ? states[nd.id] || '' : 'hidden';
      frames.push({ note, panels: [nodeLink(lay, st, { directed: false }), arr([...a], { label: 'nums', ...arrOpts }), vars(extra)], ...(predict ? { predict } : {}) });
    };
    // Build (post-order); leaves first.
    for (const nd of all)
      if (nd.lo === nd.hi) {
        nd.sum = a[nd.lo];
        revealed.add(nd.id);
      }
    draw('Build: every leaf [i] holds nums[i]. Parents will store the sum of their two children.', Object.fromEntries(all.filter((nd) => nd.lo === nd.hi).map((nd) => [nd.id, 'active'])));
    const post = (nd) => {
      if (!nd.left) return;
      post(nd.left);
      post(nd.right);
      nd.sum = nd.left.sum + nd.right.sum;
      revealed.add(nd.id);
      draw(`[${nd.lo}..${nd.hi}] = ${nd.left.sum} + ${nd.right.sum} = ${nd.sum} (left half + right half).`, { [nd.id]: 'active', [nd.left.id]: 'visited', [nd.right.id]: 'visited' }, {}, { range: [nd.lo, nd.hi] });
    };
    post(root);
    if (n === 1) draw('A single element: the root is the leaf. Build is O(n) overall.', { [root.id]: 'done' });
    // Query
    let total = 0;
    const qStates = {};
    let visits = 0;
    const cases = ['Full overlap — use its sum', 'No overlap — return 0', 'Partial — split into children'];
    draw(`Query sum of nums[${l}..${r}]. Start at the root and compare each node's range with [${l}..${r}].`, {}, { query: `[${l}..${r}]`, total }, { range: [l, r] });
    const q = (nd) => {
      visits++;
      const kind = nd.hi < l || nd.lo > r ? 1 : l <= nd.lo && nd.hi <= r ? 0 : 2;
      const predict = visits % 2 === 0 ? ask(`Node [${nd.lo}..${nd.hi}] vs query [${l}..${r}] — which case?`, cases, kind, 'Inside → take it whole; outside → ignore; straddling → ask both children.') : undefined;
      if (kind === 1) {
        qStates[nd.id] = 'muted';
        draw(`[${nd.lo}..${nd.hi}] lies completely outside [${l}..${r}] → no overlap, contributes 0. Don't go deeper.`, { ...qStates }, { query: `[${l}..${r}]`, total }, { range: [l, r] }, predict);
      } else if (kind === 0) {
        qStates[nd.id] = 'done';
        total += nd.sum;
        draw(`[${nd.lo}..${nd.hi}] is fully inside [${l}..${r}] → full overlap: add ${nd.sum} without visiting its children. total = ${total}.`, { ...qStates }, { query: `[${l}..${r}]`, total }, { range: [l, r] }, predict);
      } else {
        draw(`[${nd.lo}..${nd.hi}] only partly overlaps [${l}..${r}] → partial: split into the two halves.`, { ...qStates, [nd.id]: 'active' }, { query: `[${l}..${r}]`, total }, { range: [l, r] }, predict);
        qStates[nd.id] = 'visited';
        q(nd.left);
        q(nd.right);
      }
    };
    q(root);
    draw(`sum(${l}..${r}) = ${total}. Only O(log n) nodes were touched — at most ~2 partial nodes per level.`, { ...qStates }, { query: `[${l}..${r}]`, answer: total }, { range: [l, r], highlights: Object.fromEntries(a.map((_, i) => [i, i >= l && i <= r ? 'done' : 'muted'])) });
    // Update
    const old = a[u];
    const delta = newVal - old;
    draw(`Update nums[${u}]: ${old} → ${newVal}. Only the nodes whose range contains index ${u} change — one path from root to leaf.`, { [root.id]: 'active' }, { index: u, 'new value': newVal }, { highlights: { [u]: 'active' } });
    const path = [];
    let cur = root;
    let descents = 0;
    while (cur.left) {
      path.push(cur);
      const mid = (cur.lo + cur.hi) >> 1;
      const goLeft = u <= mid;
      descents++;
      const predict = descents === 1 ? ask(`Index ${u} at node [${cur.lo}..${cur.hi}] (mid = ${mid}). Which child holds it?`, [`left [${cur.lo}..${mid}]`, `right [${mid + 1}..${cur.hi}]`], goLeft ? 0 : 1, `Index ≤ mid lives in the left half.`) : undefined;
      const nxt = goLeft ? cur.left : cur.right;
      draw(`${u} ${goLeft ? '≤' : '>'} mid ${mid} → go ${goLeft ? 'left' : 'right'} to [${nxt.lo}..${nxt.hi}].`, { ...Object.fromEntries(path.map((p) => [p.id, 'visited'])), [nxt.id]: 'active' }, { index: u, 'new value': newVal }, { highlights: { [u]: 'active' } }, predict);
      cur = nxt;
    }
    a[u] = newVal;
    cur.sum = newVal;
    draw(`Leaf [${u}] = ${newVal} (change of ${delta >= 0 ? '+' : ''}${delta}). Now walk back up, re-summing each parent.`, { ...Object.fromEntries(path.map((p) => [p.id, 'visited'])), [cur.id]: 'done' }, { index: u, delta }, { highlights: { [u]: 'done' } });
    const fixed = { [cur.id]: 'done' };
    for (let k = path.length - 1; k >= 0; k--) {
      const nd = path[k];
      nd.sum = nd.left.sum + nd.right.sum;
      fixed[nd.id] = 'done';
      const predict = k === 0 && path.length > 1 ? askAt(`Root's old sum was ${nd.sum - delta}. What is it after the update?`, nd.sum, [nd.sum - delta, newVal, nd.sum + delta], 1, 'Every node on the path changes by the same delta.') : undefined;
      draw(`[${nd.lo}..${nd.hi}] = ${nd.left.sum} + ${nd.right.sum} = ${nd.sum}${k === 0 ? ' — the root is fixed.' : '.'}`, { ...Object.fromEntries(path.slice(0, k).map((p) => [p.id, 'visited'])), ...fixed, [nd.id]: 'active' }, { index: u, delta }, { highlights: { [u]: 'done' } }, predict);
    }
    draw(`Update done: ${path.length + 1} node${path.length ? 's' : ''} changed (the tree height). Build O(n), range query O(log n), point update O(log n).`, fixed, { 'total sum': root.sum });
    return frames;
  },
};

// ───────────────────────────── Fenwick tree ─────────────────────────────
const lowbit = (i) => i & -i;
export const fenwickTree = {
  title: 'Fenwick tree (Binary Indexed Tree)',
  description: 'tree[i] stores the sum of the lowbit(i) = i & −i elements ending at position i (1-indexed). Updates climb with i += i & −i, prefix queries descend with i −= i & −i. First 12 numbers kept.',
  defaultInput: { nums: [3, 2, -1, 6, 5, 4, -3, 3], queryIndex: 7, updateIndex: 3, delta: 2 },
  fields: [
    { key: 'nums', type: 'numbers', label: 'nums (≤ 12)' },
    { key: 'queryIndex', type: 'number', label: 'prefix query up to (1-indexed)' },
    { key: 'updateIndex', type: 'number', label: 'update position (1-indexed)' },
    { key: 'delta', type: 'number', label: 'add delta' },
  ],
  testInputs: [
    { nums: [], queryIndex: 1, updateIndex: 1, delta: 1 },
    { nums: [5], queryIndex: 1, updateIndex: 1, delta: -5 },
    { nums: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], queryIndex: 12, updateIndex: 1, delta: 3 },
    { nums: [2, 4, 6], queryIndex: 0, updateIndex: 9, delta: 0 },
  ],
  generate({ nums, queryIndex, updateIndex, delta }) {
    const a = numList(nums, 12);
    const n = a.length;
    const frames = [];
    const bin = (i) => i.toString(2).padStart(Math.max(1, n.toString(2).length), '0');
    if (!n) {
      frames.push({ note: 'No numbers → the BIT is empty.', panels: [arr([], { label: 'tree' })] });
      frames.push({ note: 'Every prefix sum is 0. Query and update are O(log n) in general.', panels: [arr([], { label: 'tree' })] });
      return frames;
    }
    const qi = clamp(toInt(queryIndex), 1, n);
    const ui = clamp(toInt(updateIndex), 1, n);
    const d = toInt(delta);
    const tree = new Array(n + 1).fill(null);
    const items = () => {
      const out = [];
      for (let i = 1; i <= n; i++) if (tree[i] !== null) out.push({ i, start: i - lowbit(i) + 1, end: i });
      return out;
    };
    const draw = (note, { tHl = {}, nHl = {}, cover = {}, extra = {}, predict } = {}) =>
      frames.push({
        note,
        panels: [
          arr(['-', ...a], { label: 'nums (1-indexed)', highlights: { 0: 'muted', ...nHl } }),
          arr(tree.map((v, i) => (i === 0 ? '-' : v === null ? '·' : v)), { label: 'tree (BIT)', highlights: { 0: 'muted', ...tHl } }),
          { kind: 'intervals', label: 'range covered by tree[i]', min: 1, max: Math.max(2, n), items: items().map((it) => ({ start: it.start, end: it.end, state: cover[it.i] || '' })) },
          vars(extra),
        ],
        ...(predict ? { predict } : {}),
      });
    draw('Positions are 1-indexed. tree[i] will hold the sum of nums over (i − lowbit(i), i], where lowbit(i) = i & −i is the value of the lowest set bit of i.');
    for (let i = 1; i <= n; i++) {
      const lb = lowbit(i);
      let s = 0;
      for (let k = i - lb + 1; k <= i; k++) s += a[k - 1];
      tree[i] = s;
      const nHl = {};
      for (let k = i - lb + 1; k <= i; k++) nHl[k] = 'visited';
      const predict = i >= 4 && i % 2 === 0 ? askAt(`i = ${i} (binary ${bin(i)}). How many elements does tree[${i}] cover?`, lb, [1, 2, 4, 8, i].filter((v) => v !== lb), i / 2, 'It covers lowbit(i) elements: the value of the lowest 1-bit.') : undefined;
      draw(`i = ${i} = ${bin(i)}₂ → lowbit = ${lb}, so tree[${i}] covers positions ${i - lb + 1}..${i}: sum = ${s}.`, { tHl: { [i]: 'active' }, nHl, cover: { [i]: 'active' }, extra: { i, 'i (binary)': bin(i), 'i & -i': lb }, predict });
    }
    const allMuted = () => Object.fromEntries(items().map((it) => [it.i, 'muted']));
    // Prefix query
    const prefix = (label, withPredicts) => {
      let i = qi;
      let sum = 0;
      const used = {};
      const cov = allMuted();
      draw(`${label}: prefix sum of positions 1..${qi}. Start at i = ${qi} and hop DOWN by removing the lowest set bit each time.`, { cover: cov, extra: { i, 'i (binary)': bin(i), sum } });
      let steps = 0;
      while (i > 0) {
        const lb = lowbit(i);
        sum += tree[i];
        used[i] = 'done';
        cov[i] = 'done';
        const ni = i - lb;
        steps++;
        const predict = withPredicts && steps === 1 && ni !== i - 1 ? askAt(`After adding tree[${i}] (covers ${i - lb + 1}..${i}), which index comes next?`, `i = ${ni}`, [`i = ${i - 1}`, `i = ${i + lb}`, `i = ${Math.floor(i / 2)}`], i, 'i −= i & −i jumps straight past the block tree[i] already covered.') : withPredicts && steps === 1 ? askAt(`After adding tree[${i}], which index comes next?`, `i = ${ni}`, [`i = ${i + lb}`, `i = ${Math.max(0, i - 2)}`, `i = ${i * 2}`], i, 'i −= i & −i.') : undefined;
        draw(`Add tree[${i}] = ${tree[i]} (positions ${i - lb + 1}..${i}) → sum = ${sum}. Next i = ${i} − ${lb} = ${ni}${ni ? ` (${bin(ni)}₂)` : ' → stop'}.`, { tHl: { ...used, [i]: 'active' }, cover: { ...cov, [i]: 'active' }, extra: { i, 'i (binary)': bin(i), 'i & -i': lb, sum }, predict });
        i = ni;
      }
      return sum;
    };
    const before = prefix('Query', true);
    draw(`prefix(${qi}) = ${before}, using only ${qi.toString(2).split('').filter((c) => c === '1').length} cell(s) — one per 1-bit of ${qi}. O(log n).`, { tHl: {}, extra: { [`prefix(${qi})`]: before } });
    // Point update
    let i = ui;
    a[ui - 1] += d;
    const cov = allMuted();
    const touched = {};
    draw(`Update: add ${d} to position ${ui} (nums[${ui}] becomes ${a[ui - 1]}). Every cell whose range contains ${ui} must change — climb UP with i += i & −i.`, { nHl: { [ui]: 'active' }, cover: cov, extra: { i, 'i (binary)': bin(i), delta: d } });
    let ups = 0;
    while (i <= n) {
      const lb = lowbit(i);
      tree[i] += d;
      touched[i] = 'done';
      cov[i] = 'done';
      const ni = i + lb;
      ups++;
      const predict = ups === 2 ? askAt(`tree[${i}] updated. Which cell must be updated next?`, ni <= n ? `tree[${ni}]` : 'none — past the end', [`tree[${i + 1}]`, `tree[${i * 2 + 1}]`, ni <= n ? 'none — stop here' : `tree[${i - lb}]`], ni, 'i += i & −i finds the next, larger block that also contains this position.') : undefined;
      draw(`tree[${i}] += ${d} → ${tree[i]} (it covers ${i - lb + 1}..${i}, which includes ${ui}). Next i = ${i} + ${lb} = ${ni}${ni > n ? ` > ${n} → stop` : ''}.`, { tHl: { ...touched, [i]: 'active' }, nHl: { [ui]: 'active' }, cover: { ...cov, [i]: 'active' }, extra: { i, 'i (binary)': bin(i), 'i & -i': lb }, predict });
      i = ni;
    }
    let after = 0;
    for (let k = qi; k > 0; k -= lowbit(k)) after += tree[k];
    draw(`prefix(${qi}) is now ${after} (${ui <= qi ? `was ${before}, +${d} because position ${ui} ≤ ${qi}` : `unchanged: position ${ui} > ${qi}`}). Both operations are O(log n) with just an array — no explicit tree.`, { tHl: touched, extra: { [`prefix(${qi})`]: after } });
    return frames;
  },
};

// ───────────────────────────── BST insert / delete ─────────────────────────────
function layoutBst(root) {
  const nodes = [];
  const edges = [];
  let x = 0;
  const walk = (nd, depth) => {
    if (!nd) return;
    walk(nd.left, depth + 1);
    nodes.push({ id: nd.id, val: nd.val, x: x++, y: depth });
    walk(nd.right, depth + 1);
    if (nd.left) edges.push([nd.id, nd.left.id]);
    if (nd.right) edges.push([nd.id, nd.right.id]);
  };
  walk(root, 0);
  return { nodes, edges };
}
const inorder = (nd, out = []) => {
  if (nd) {
    inorder(nd.left, out);
    out.push(nd.val);
    inorder(nd.right, out);
  }
  return out;
};

export const bstOperations = {
  title: 'BST: insert and delete',
  description: 'Insert walks down comparing (smaller → left, bigger → right). Delete handles three cases: leaf, one child, two children (swap in the in-order successor). First 12 values kept; duplicates skipped.',
  defaultInput: { values: [50, 30, 70, 20, 40, 60, 80, 35], remove: 30 },
  fields: [
    { key: 'values', type: 'numbers', label: 'insert values' },
    { key: 'remove', type: 'number', label: 'delete value' },
  ],
  testInputs: [
    { values: [], remove: 5 },
    { values: [7], remove: 7 },
    { values: [5, 5, 3], remove: 4 },
    { values: [1, 2, 3, 4, 5], remove: 1 },
    { values: [8, 4, 12, 2, 6, 10, 14], remove: 8 },
    { values: [10, 5, 15, 3], remove: 3 },
  ],
  generate({ values, remove }) {
    const vals = numList(values, 12);
    const del = toInt(remove);
    const frames = [];
    let root = null;
    let nid = 0;
    let comps = 0;
    const draw = (note, states = {}, extra = {}, predict) => frames.push({ note, panels: [nodeLink(layoutBst(root), states, { directed: false }), arr(inorder(root), { label: 'in-order (always sorted)' }), vars(extra)], ...(predict ? { predict } : {}) });
    draw(`Insert ${vals.length ? vals.join(', ') : 'nothing'}, then delete ${del}. BST rule: left subtree < node < right subtree.`);
    for (const v of vals) {
      if (!root) {
        root = { id: nid++, val: v, left: null, right: null };
        draw(`Tree is empty → ${v} becomes the root.`, { [root.id]: 'done' }, { inserting: v });
        continue;
      }
      let cur = root;
      const path = {};
      for (;;) {
        if (v === cur.val) {
          draw(`${v} = ${cur.val} → already in the tree. This BST keeps unique keys, so skip it.`, { ...path, [cur.id]: 'bad' }, { inserting: v });
          break;
        }
        const goLeft = v < cur.val;
        comps++;
        const predict = comps % 3 === 0 ? ask(`Inserting ${v}, at node ${cur.val}: go left or right?`, ['left', 'right'], goLeft ? 0 : 1, 'Smaller keys go left, bigger keys go right.') : undefined;
        const child = goLeft ? cur.left : cur.right;
        draw(`${v} ${goLeft ? '<' : '>'} ${cur.val} → go ${goLeft ? 'left' : 'right'}${child ? '.' : ' — that spot is empty.'}`, { ...path, [cur.id]: 'active' }, { inserting: v }, predict);
        path[cur.id] = 'visited';
        if (!child) {
          const nd = { id: nid++, val: v, left: null, right: null };
          if (goLeft) cur.left = nd;
          else cur.right = nd;
          draw(`Place ${v} as the ${goLeft ? 'left' : 'right'} child of ${cur.val}. Cost = depth of the new node = O(h).`, { ...path, [nd.id]: 'done' }, { inserting: v });
          break;
        }
        cur = child;
      }
    }
    // Delete
    let parent = null;
    let cur = root;
    const path = {};
    let dComps = 0;
    while (cur && cur.val !== del) {
      const goLeft = del < cur.val;
      dComps++;
      const predict = dComps === 1 ? ask(`Searching for ${del} to delete, at node ${cur.val}: go left or right?`, ['left', 'right'], goLeft ? 0 : 1, 'Same rule as insert: smaller → left.') : undefined;
      draw(`Delete ${del}: ${del} ${goLeft ? '<' : '>'} ${cur.val} → go ${goLeft ? 'left' : 'right'}.`, { ...path, [cur.id]: 'active' }, { deleting: del }, predict);
      path[cur.id] = 'visited';
      parent = cur;
      cur = goLeft ? cur.left : cur.right;
    }
    if (!cur) {
      draw(`Fell off the tree → ${del} is not in the BST, nothing to delete. Search is O(h).`, path, { deleting: del });
      return frames;
    }
    const kids = (cur.left ? 1 : 0) + (cur.right ? 1 : 0);
    const caseNames = ['Leaf — just remove it', 'One child — link the child to the parent', 'Two children — copy in the in-order successor'];
    const caseIdx = kids === 2 ? 2 : kids;
    const replaceInParent = (target, withNode) => {
      if (!parent) root = withNode;
      else if (parent.left === target) parent.left = withNode;
      else parent.right = withNode;
    };
    const casePredict = ask(`Found ${del}. It has ${kids} child${kids === 1 ? '' : 'ren'}. Which delete case applies?`, caseNames, caseIdx, 'The number of children decides the case.');
    if (kids === 0) {
      draw(`Found ${del}: it is a leaf (no children) → simply cut it off${parent ? ` from ${parent.val}` : ' — the tree becomes empty'}.`, { ...path, [cur.id]: 'bad' }, { deleting: del }, casePredict);
      replaceInParent(cur, null);
      draw(`${del} removed. Order is preserved because nothing hung below it. O(h).`, path, { deleting: del });
    } else if (kids === 1) {
      const child = cur.left || cur.right;
      draw(`Found ${del}: it has one child (${child.val}) → let ${child.val}'s subtree take ${del}'s place${parent ? ` under ${parent.val}` : ' as the new root'}.`, { ...path, [cur.id]: 'bad', [child.id]: 'active' }, { deleting: del }, casePredict);
      replaceInParent(cur, child);
      draw(`${del} removed; its child moved up. Everything in that subtree was already on the correct side of ${parent ? parent.val : 'the old root'}. O(h).`, { ...path, [child.id]: 'done' }, { deleting: del });
    } else {
      draw(`Found ${del}: two children → we can't just unlink it. Replace its value with the in-order successor: the smallest key in its right subtree.`, { ...path, [cur.id]: 'bad' }, { deleting: del }, casePredict);
      let sp = cur;
      let s = cur.right;
      const sPath = { [cur.id]: 'bad' };
      draw(`Successor search: step right once to ${s.val}, then go left as far as possible.`, { ...path, ...sPath, [s.id]: 'active' }, { deleting: del });
      while (s.left) {
        sPath[s.id] = 'visited';
        sp = s;
        s = s.left;
        draw(`${s.val} is smaller → keep going left.`, { ...path, ...sPath, [s.id]: 'active' }, { deleting: del });
      }
      const sVal = s.val;
      const leftMax = (() => {
        let p = cur.left;
        while (p.right) p = p.right;
        return p.val;
      })();
      const succPredict = askAt(`Which value will replace ${del}?`, sVal, [cur.right.val === sVal ? cur.left.val : cur.right.val, leftMax, root.val === del ? cur.left.val : root.val], 1, 'The successor is the leftmost node of the right subtree.');
      draw(`No left child → ${sVal} is the successor: the next bigger key. It is bigger than everything on the left and smaller than the rest of the right, so it can sit where ${del} was.`, { ...path, ...sPath, [s.id]: 'done' }, { deleting: del, successor: sVal }, succPredict);
      cur.val = sVal;
      // remove successor node (it has at most a right child)
      if (sp === cur) sp.right = s.right;
      else sp.left = s.right;
      draw(`Copy ${sVal} into ${del}'s node, then delete the old ${sVal} node — it has no left child, so that is the easy 0/1-child case${s.right ? ` (${s.right.val} moves up)` : ''}.`, { ...path, [cur.id]: 'done' }, { deleting: del, successor: sVal });
    }
    draw(`Final tree — in-order is still sorted: [${inorder(root).join(', ')}]. Insert, search and delete are O(h): O(log n) if balanced, O(n) for a sorted-input chain.`, {}, { size: inorder(root).length });
    return frames;
  },
};

// ───────────────────────────── Backtracking: permutations ─────────────────────────────
export const backtrackingPermutations = {
  title: 'Backtracking: permutations',
  description: 'Pick any unused element (mark used[j]), recurse, then undo the choice. Leaves are the permutations. First 4 items kept (4 items show a compact run).',
  defaultInput: { nums: [1, 2, 3] },
  fields: [{ key: 'nums', type: 'numbers', label: 'nums (≤ 4)' }],
  testInputs: [{ nums: [] }, { nums: [7] }, { nums: [1, 1] }, { nums: [1, 2, 3, 4] }, { nums: [1, 2, 3, 4, 5] }],
  generate({ nums }) {
    const a = numList(nums, 4);
    const n = a.length;
    const compact = n >= 4;
    const sep = compact ? '' : ',';
    let id = 0;
    const root = { id: id++, label: '[]', children: [], path: [], pick: null };
    const build = (node, used) => {
      for (let j = 0; j < n; j++) {
        if (used[j]) continue;
        const path = [...node.path, a[j]];
        const child = { id: id++, label: path.join(sep), children: [], path, pick: j };
        node.children.push(child);
        used[j] = true;
        build(child, used);
        used[j] = false;
      }
    };
    build(root, new Array(n).fill(false));
    const layout = layoutNary(root);
    const frames = [];
    const seen = new Set();
    const pathIds = [];
    const results = [];
    const used = new Array(n).fill(false);
    const stack = [];
    const draw = (active, note, predict) => {
      const states = {};
      for (const nd of layout.nodes) states[nd.id] = seen.has(nd.id) ? 'visited' : 'hidden';
      for (const p of pathIds) states[p] = 'active';
      if (active != null) states[active] = 'active';
      for (const r of results) states[r.id] = 'done';
      frames.push({
        note,
        panels: [nodeLink(layout, states), arr([...a], { label: 'nums (highlight = used[j])', highlights: Object.fromEntries(used.map((u, j) => [j, u ? 'visited' : ''])) }), { kind: 'stack', label: 'path', values: [...stack] }, arr(results.map((r) => r.label), { label: 'permutations found' })],
        ...(predict ? { predict } : {}),
      });
    };
    seen.add(root.id);
    pathIds.push(root.id);
    if (!n) {
      results.push({ id: root.id, label: '[]' });
      draw(root.id, 'No items: the empty path is already complete.');
      draw(null, 'Exactly 1 permutation (the empty one). 0! = 1.');
      return frames;
    }
    draw(root.id, `Path is empty. At each level choose any unused item; when the path has ${n} item${n === 1 ? '' : 's'}, record it.`);
    let asks = 0;
    const dfs = (node) => {
      node.children.forEach((child, ci) => {
        const j = child.pick;
        let predict;
        if (ci > 0 && asks < 6) {
          asks++;
          predict = askAt(`Back at path [${node.path.join(', ')}] after undoing. Which item is chosen next?`, `nums[${j}] = ${a[j]}`, a.map((v, k) => `nums[${k}] = ${v}`), asks + j, 'Scan left to right for the next index that is not used and not tried yet at this level.');
        }
        used[j] = true;
        stack.push(a[j]);
        seen.add(child.id);
        pathIds.push(child.id);
        if (child.path.length === n) {
          results.push({ id: child.id, label: `[${child.path.join(',')}]` });
          draw(child.id, `Choose ${a[j]} (used[${j}] = true). Path [${child.path.join(', ')}] has all ${n} items → record permutation #${results.length}.${compact ? ' Then undo and go back up.' : ''}`, predict);
        } else {
          draw(child.id, `Choose ${a[j]}: mark used[${j}] = true and push it. Explore deeper with the remaining items.`, predict);
          dfs(child);
        }
        used[j] = false;
        stack.pop();
        pathIds.pop();
        if (!compact) draw(node.id, `Undo: pop ${a[j]} and set used[${j}] = false — back to [${node.path.join(', ')}], so ${a[j]} is free for other branches.`);
      });
    };
    dfs(root);
    pathIds.length = 0;
    const dup = new Set(a).size !== n;
    draw(null, `All ${results.length} = ${n}! permutations generated${dup ? ' (duplicates appear because the input repeats a value — skip equal siblings to avoid them)' : ''}. n! leaves × O(n) to copy each → O(n · n!).`);
    return frames;
  },
};

// ───────────────────────────── N-Queens ─────────────────────────────
export const nQueens = {
  title: 'Backtracking: N-Queens',
  description: 'Place one queen per row so no two share a column or diagonal. Try columns left to right; if a row has no safe column, undo the previous queen. n is clamped to 4..6; stops at the first solution.',
  defaultInput: { n: 4 },
  fields: [{ key: 'n', type: 'number', label: 'n (4–6)' }],
  testInputs: [{ n: 5 }, { n: 6 }, { n: 1 }, { n: 12 }],
  generate({ n }) {
    n = clamp(toInt(n, 4), 4, 6);
    const frames = [];
    const queens = [];
    const safe = (r, c) => queens.every((qc, qr) => qr >= r || (qc !== c && Math.abs(qc - c) !== r - qr));
    const attacked = (r, c) => queens.some((qc, qr) => qr < r && (qc === c || Math.abs(qc - c) === Math.abs(r - qr)));
    const countAll = () => {
      let cnt = 0;
      const cols = [];
      const go = (r) => {
        if (r === n) {
          cnt++;
          return;
        }
        for (let c = 0; c < n; c++)
          if (cols.every((qc, qr) => qc !== c && Math.abs(qc - c) !== r - qr)) {
            cols.push(c);
            go(r + 1);
            cols.pop();
          }
      };
      go(0);
      return cnt;
    };
    const total = countAll();
    const draw = (note, { activeCell, row, triedBefore = 0, predict } = {}) => {
      const cells = [];
      const states = [];
      for (let r = 0; r < n; r++) {
        cells.push([]);
        states.push([]);
        for (let c = 0; c < n; c++) {
          const isQ = queens[r] === c;
          cells[r].push(isQ ? '♛' : '');
          let st = 'none';
          if (isQ) st = 'done';
          else if (r >= queens.length && attacked(r, c)) st = 'bad';
          else if (r === row && c < triedBefore) st = 'muted';
          if (activeCell && activeCell[0] === r && activeCell[1] === c) st = 'active';
          states[r].push(st);
        }
      }
      frames.push({ note, panels: [{ kind: 'grid', label: `${n} × ${n} board (red = attacked)`, cells, states }, arr([...queens], { label: 'queen column per row' }), vars({ row: row ?? '—', 'queens placed': queens.length })], ...(predict ? { predict } : {}) });
    };
    draw(`Place ${n} queens on a ${n}×${n} board, one per row. A queen attacks its whole column and both diagonals, so each new queen needs a cell no earlier queen attacks.`);
    let decisions = 0;
    const question = (r, start) => `Row ${r}${start > 0 ? ` (continue from column ${start})` : ''}: which is the first safe column?`;
    const solve = (r) => {
      if (r === n) return true;
      let start = 0;
      for (;;) {
        let c = start;
        while (c < n && !safe(r, c)) c++;
        decisions++;
        const wrongCols = [];
        for (let k = start; k < n; k++) if (k !== c) wrongCols.push(`column ${k}`);
        if (c === n) {
          const predict = decisions % 2 === 0 ? askAt(question(r, start), 'none — backtrack', wrongCols.slice(0, 3), decisions, 'Every remaining cell in this row is attacked.') : undefined;
          draw(`Row ${r}: ${start >= n ? 'no columns left to try' : start === n - 1 ? `column ${start} is attacked` : start > 0 ? `columns ${start}..${n - 1} are attacked` : 'every column is attacked'} → dead end. Backtrack: remove the queen from row ${r - 1} (column ${queens[r - 1]}) and try its next column.`, { row: r, triedBefore: start, predict });
          return false;
        }
        const skipped = [];
        for (let k = start; k < c; k++) skipped.push(k);
        queens[r] = c;
        const predict = decisions % 2 === 0 ? askAt(question(r, start), `column ${c}`, ['none — backtrack', ...wrongCols].slice(0, 3), decisions + c, 'Scan left to right; skip any column or diagonal already taken.') : undefined;
        draw(`Row ${r}: ${skipped.length ? `column${skipped.length > 1 ? 's' : ''} ${skipped.join(', ')} ${skipped.length > 1 ? 'are' : 'is'} attacked; ` : ''}column ${c} is safe → place a queen. Its column and diagonals become attacked below.`, { activeCell: [r, c], row: r, triedBefore: start, predict });
        if (solve(r + 1)) return true;
        queens.length = r;
        start = c + 1;
      }
    };
    solve(0);
    draw(`All ${n} queens placed — first solution: columns [${queens.join(', ')}]. There are ${total} solutions in total for n = ${n}. Pruning attacked cells keeps the search far below the n! worst case.`, { row: undefined });
    return frames;
  },
};
