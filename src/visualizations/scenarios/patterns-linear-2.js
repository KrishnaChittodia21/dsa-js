// patterns-linear-2: step-through animations for matrix spiral order, in-place merge from the back,
// interval-list intersection, jump game reach / BFS levels, min stack + two-stack queue, LRU cache,
// Gray code and sparse-table range-minimum queries.
// Each generate(input) returns frames: { note, panels: [...], predict? } — see scripts/VIZ_BRIEF.md.
const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const stack = (values, opts = {}) => ({ kind: 'stack', values, ...opts });
const queue = (values, label) => ({ kind: 'queue', values, label });
const table = (cells, states, rowLabels, colLabels, label) => ({ kind: 'table', cells, states, rowLabels, colLabels, label });
const intervals = (items, min, max, label) => ({ kind: 'intervals', items, min, max, label });
const ask = (question, options, answer, explain) => ({ question, options, answer, explain });
// Distinct options with the correct one placed at index pos % n; null if fewer than 2 distinct options.
const pick = (question, correct, wrong, pos = 0, explain) => {
  const c = String(correct);
  const w = [...new Set(wrong.filter((o) => o !== null && o !== undefined).map(String))].filter((o) => o !== c).slice(0, 3);
  if (!w.length) return null;
  const at = pos % (w.length + 1);
  return ask(question, [...w.slice(0, at), c, ...w.slice(at)], at, explain);
};
const attach = (frames, p) => {
  if (p && frames.length > 1) frames[frames.length - 1].predict = p;
};
const nums = (xs, max) => (Array.isArray(xs) ? xs : []).filter((x) => typeof x === 'number' && Number.isFinite(x)).slice(0, max);
const clampInt = (v, lo, hi, d) => {
  const x = Math.floor(Number(v));
  return Number.isFinite(x) ? Math.max(lo, Math.min(hi, x)) : d;
};
const fmtList = (xs) => `[${xs.join(', ')}]`;

/* ------------------------------------------------------------------ arrays: matrix spiral */

export const spiralMatrix = {
  title: 'Spiral order: shrinking boundaries',
  description: 'Walk the top row, right column, bottom row and left column, moving each wall inward after its side. The two re-checks stop a lone row or column from being walked twice. Clamped to 6 × 6; missing cells count as 0.',
  defaultInput: { matrix: [[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12]] },
  fields: [{ key: 'matrix', type: 'json', label: 'matrix [[…], …]' }],
  testInputs: [{ matrix: [] }, { matrix: [[]] }, { matrix: [[7]] }, { matrix: [[1, 2, 3, 4]] }, { matrix: [[1], [2], [3]] }, { matrix: [[1, 2], [3, 4]] }, { matrix: [[1, 2, 3], [4, 5, 6], [7, 8, 9], [10, 11, 12]] }, { matrix: [[1, 2], [3]] }],
  generate({ matrix }) {
    if (!Array.isArray(matrix) || !matrix.every(Array.isArray)) throw new Error('matrix must be a list of rows, e.g. [[1, 2], [3, 4]]');
    const R = Math.min(6, matrix.length);
    const C = R ? Math.min(6, Math.max(0, ...matrix.slice(0, R).map((row) => row.length))) : 0;
    if (!R || !C) {
      return [
        { note: 'The matrix has no cells, so there is no layer to peel.', panels: [arr([], { label: 'out' }), vars({ rows: R, cols: C })] },
        { note: 'Spiral order = [] — nothing to visit. O(1).', panels: [arr([], { label: 'out' }), vars({ result: '[]' })] },
      ];
    }
    const ok = (v) => (typeof v === 'number' && Number.isFinite(v)) || (typeof v === 'string' && v.length > 0 && v.length <= 4);
    const M = Array.from({ length: R }, (_, r) => Array.from({ length: C }, (_, c) => (ok(matrix[r][c]) ? matrix[r][c] : 0)));
    let top = 0;
    let bottom = R - 1;
    let left = 0;
    let right = C - 1;
    const seen = Array.from({ length: R }, () => new Array(C).fill(''));
    const out = [];
    const frames = [];
    const view = (cur, extra = {}) => {
      const st = seen.map((row) => [...row]);
      if (cur) st[cur[0]][cur[1]] = 'active';
      const rowLabels = M.map((_, r) => `${r}${r === top ? ' top' : ''}${r === bottom ? ' bottom' : ''}`);
      const colLabels = M[0].map((_, c) => `${c}${c === left ? ' L' : ''}${c === right ? ' R' : ''}`);
      const hl = {};
      if (out.length) hl[out.length - 1] = cur ? 'active' : 'done';
      return [table(M.map((row) => [...row]), st, rowLabels, colLabels, 'matrix'), arr([...out], { label: 'out', highlights: hl }), vars({ top, bottom, left, right, ...extra })];
    };
    frames.push({ note: `Four walls mark the unvisited block: top = 0, bottom = ${R - 1}, left = 0, right = ${C - 1}. Walk one side, then move that wall inward — the matrix is peeled like an onion.`, panels: view(null) });
    let asks = 0;
    let layer = 0;
    const walk = (cells, intro, p) => {
      cells.forEach(([r, c], k) => {
        out.push(M[r][c]);
        seen[r][c] = 'visited';
        frames.push({ note: k === 0 ? `${intro} First (${r}, ${c}) = ${M[r][c]}.` : `(${r}, ${c}) = ${M[r][c]} → out.`, panels: view([r, c]) });
        if (k === 0) attach(frames, p);
      });
    };
    const span = (a, b) => {
      const xs = [];
      if (a <= b) for (let x = a; x <= b; x++) xs.push(x);
      else for (let x = a; x >= b; x--) xs.push(x);
      return xs;
    };
    while (top <= bottom && left <= right) {
      layer++;
      // side 1: top row, left → right
      walk(span(left, right).map((c) => [top, c]), `Layer ${layer}, side 1: walk the top row (row ${top}) left → right over columns ${left}..${right}.`, null);
      top++;
      frames.push({ note: `Row ${top - 1} is finished for good → top++ = ${top}.`, panels: view(null) });
      // side 2: right column, top → bottom
      const rightCells = top <= bottom ? span(top, bottom).map((r) => [r, right]) : [];
      let p = null;
      if (asks < 4 && rightCells.length && layer === 1) {
        p = pick('The top row is done and top moved down. Which cells come next?', `Down the right column (column ${right})`, ['Left along the bottom row', 'Down the left column', 'Along the new top row again'], asks++);
      }
      if (rightCells.length) walk(rightCells, `Side 2: walk the right column (column ${right}) top → bottom over rows ${top}..${bottom}.`, p);
      else frames.push({ note: `Side 2: rows ${top}..${bottom} is empty (top > bottom), so the right column has nothing left to walk.`, panels: view(null) });
      right--;
      frames.push({ note: `Column ${right + 1} is finished → right-- = ${right}.`, panels: view(null) });
      // side 3: bottom row, right → left — only if a row is still unvisited
      if (top <= bottom) {
        const cells = right >= left ? span(right, left).map((c) => [bottom, c]) : [];
        const q = asks < 4 && R !== C ? pick(`top = ${top}, bottom = ${bottom}. Do we walk the bottom row now?`, `Yes — top ≤ bottom, row ${bottom} is still unvisited`, [`No — skip it, it was already walked`, 'No — the loop ends here'], asks++) : null;
        if (cells.length) walk(cells, `Side 3: top ≤ bottom, so row ${bottom} is still unvisited → walk it right → left over columns ${right}..${left}.`, q);
        else {
          frames.push({ note: `Side 3: top ≤ bottom passes, but columns ${right}..${left} is empty (right < left) — nothing to walk on row ${bottom}.`, panels: view(null) });
          attach(frames, q);
        }
        bottom--;
        frames.push({ note: `Row ${bottom + 1} is finished → bottom-- = ${bottom}.`, panels: view(null) });
      } else {
        const q = asks < 4 ? pick(`top = ${top} > bottom = ${bottom}. Do we walk the bottom row?`, 'No — that row was already walked as the top row', [`Yes — walk row ${bottom} right → left`, 'Yes — but only its first cell'], asks++ + 1) : null;
        frames.push({ note: `Side 3 skipped: top = ${top} > bottom = ${bottom}. The only remaining row was just walked as the TOP row — walking it again as the bottom row would duplicate it.`, panels: view(null) });
        attach(frames, q);
      }
      // side 4: left column, bottom → top — only if a column is still unvisited
      if (left <= right) {
        const cells = top <= bottom ? span(bottom, top).map((r) => [r, left]) : [];
        let q = null;
        if (asks < 4 && cells.length) {
          const [r0, c0] = cells[0];
          const others = [M[top - 1]?.[left], M[bottom + 1]?.[left + 1], M[r0]?.[c0 + 1], M[0][0]].filter((v) => v !== undefined && v !== M[r0][c0]);
          q = pick(`Side 4 walks the left column upward. Which value is visited next?`, M[r0][c0], others, asks++ + 2);
        }
        if (cells.length) walk(cells, `Side 4: left ≤ right, so column ${left} is still unvisited → walk it bottom → top over rows ${bottom}..${top}.`, q);
        else frames.push({ note: `Side 4: left ≤ right passes, but rows ${bottom}..${top} is empty (top > bottom) — nothing to walk.`, panels: view(null) });
        left++;
        frames.push({ note: `Column ${left - 1} is finished → left++ = ${left}.${top <= bottom && left <= right ? ' Walls still enclose cells → next layer.' : ''}`, panels: view(null) });
      } else {
        frames.push({ note: `Side 4 skipped: left = ${left} > right = ${right}. The only remaining column was just walked as the RIGHT column.`, panels: view(null) });
      }
    }
    const done = M.map((row) => row.map(() => 'done'));
    frames.push({
      note: `The walls crossed (${top > bottom ? `top ${top} > bottom ${bottom}` : `left ${left} > right ${right}`}) → every cell is visited. Spiral order = ${fmtList(out)}. Each cell once → O(m·n) time, O(1) extra space besides out.`,
      panels: [table(M.map((row) => [...row]), done, M.map((_, r) => String(r)), M[0].map((_, c) => String(c)), 'matrix'), arr([...out], { label: 'out', highlights: Object.fromEntries(out.map((_, i) => [i, 'done'])) }), vars({ count: out.length, result: fmtList(out) })],
    });
    return frames;
  },
};

/* ------------------------------------------------------------------ two pointers: merge from the back */

export const mergeSortedInPlace = {
  title: 'Merge sorted arrays in place (from the back)',
  description: 'nums1 holds m sorted values plus n free slots; write the LARGER of nums1[i] and nums2[j] at k = m + n − 1 and move left, so nothing unread is overwritten. Enter only nums1’s m real values (the free slots are added); inputs are sorted and clamped to 7 each.',
  defaultInput: { nums1: [1, 3, 5, 7], nums2: [2, 4, 6] },
  fields: [
    { key: 'nums1', type: 'numbers', label: 'nums1 (m values)' },
    { key: 'nums2', type: 'numbers', label: 'nums2' },
  ],
  testInputs: [{ nums1: [], nums2: [] }, { nums1: [1], nums2: [] }, { nums1: [], nums2: [1] }, { nums1: [4, 5, 6], nums2: [1, 2, 3] }, { nums1: [1, 2, 3], nums2: [4, 5] }, { nums1: [2, 2], nums2: [2, 2] }, { nums1: [0, -1, 9], nums2: [3, -5] }],
  generate({ nums1, nums2 }) {
    const A = nums(nums1, 7).sort((x, y) => x - y);
    const B = nums(nums2, 7).sort((x, y) => x - y);
    const m = A.length;
    const n = B.length;
    const a = [...A, ...new Array(n).fill('_')];
    const stale = new Set();
    let i = m - 1;
    let j = n - 1;
    let k = m + n - 1;
    const frames = [];
    const view = (hlA = {}, hlB = {}, extra = {}) => {
      const ha = {};
      for (let t = 0; t < m + n; t++) {
        if (t > k) ha[t] = 'done';
        else if (stale.has(t)) ha[t] = 'muted';
      }
      Object.assign(ha, hlA);
      const hb = {};
      for (let t = j + 1; t < n; t++) hb[t] = 'muted';
      Object.assign(hb, hlB);
      const pa = [];
      if (i >= 0) pa.push({ index: i, label: 'i', color: 'a' });
      if (k >= 0) pa.push({ index: k, label: 'k', color: 'c' });
      return [
        arr([...a], { label: `nums1 (m = ${m} + ${n} free)`, highlights: ha, pointers: pa }),
        arr([...B], { label: 'nums2', highlights: hb, pointers: j >= 0 ? [{ index: j, label: 'j', color: 'b' }] : [] }),
        vars({ i: i >= 0 ? i : '—', j: j >= 0 ? j : '—', k: k >= 0 ? k : '—', ...extra }),
      ];
    };
    if (!n) {
      frames.push({ note: `nums2 is empty → nums1 ${fmtList(A)} is already the merged result.`, panels: view() });
      frames.push({ note: `Result ${fmtList(A)}. Nothing to move: O(1).`, panels: view({}, {}, { result: fmtList(A) }) });
      return frames;
    }
    frames.push({
      note: `i = m − 1 = ${i}, j = n − 1 = ${j}, k = m + n − 1 = ${k} (the last free slot). Filling from the BACK with the largest remaining value is safe: k ≥ i always, so no unread nums1 value is overwritten.`,
      panels: view(),
    });
    let step = 0;
    let asks = 0;
    while (j >= 0) {
      const fromA = i >= 0 && a[i] > B[j];
      let p = null;
      if (step % 2 === 1 && asks < 4) {
        if (i >= 0) p = pick(`nums1[i] = ${a[i]}, nums2[j] = ${B[j]}. What is written at nums1[${k}]?`, fromA ? `${a[i]} from nums1` : `${B[j]} from nums2`, [fromA ? `${B[j]} from nums2` : `${a[i]} from nums1`, 'Nothing — shift nums1 right first', `${Math.min(a[i], B[j])} — the smaller value goes first`], asks++);
        else p = pick(`i < 0 — nums1 has no unread values. What happens to nums2[${j}] = ${B[j]}?`, `Copy it to nums1[${k}]`, ['Stop — we are done', `Swap it with nums1[0]`], asks++);
      }
      step++;
      const kk = k;
      if (fromA) {
        const v = a[i];
        a[k] = v;
        stale.add(i);
        const ii = i;
        i--;
        k--;
        frames.push({ note: `${v} > ${B[j]} → nums1[${ii}] is the largest unread value; copy it to slot ${kk}. i-- and k--. (Slot ${ii} keeps a stale copy until k reaches it.)`, panels: view({ [kk]: 'active' }, { [j]: 'window' }) });
      } else {
        const v = B[j];
        a[k] = v;
        const jj = j;
        const why = i < 0 ? `nums1 has nothing left unread → copy nums2[${jj}] = ${v} to slot ${kk}.` : `${a[i]} ${a[i] === v ? '=' : '<'} ${v} → nums2[${jj}] is the largest unread value${a[i] === v ? ' (on a tie either one works; the code takes nums2)' : ''}; write it to slot ${kk}.`;
        j--;
        k--;
        frames.push({ note: `${why} j-- and k--.`, panels: view({ [kk]: 'active', ...(i >= 0 ? { [i]: 'window' } : {}) }, { [jj]: 'active' }) });
      }
      attach(frames, p);
    }
    for (const t of [...stale]) if (t <= i) stale.delete(t);
    if (i >= 0) {
      frames.push({ note: `nums2 is used up (j < 0). nums1[0..${i}] = ${fmtList(a.slice(0, i + 1))} was sorted and is already in its final place — stop, nothing to copy.`, panels: view(Object.fromEntries(Array.from({ length: i + 1 }, (_, t) => [t, 'done']))) });
      attach(frames, pick(`nums2 is exhausted but i = ${i}. Must nums1[0..${i}] be copied anywhere?`, 'No — it is already in place', [`Yes — copy it to the slots ending at k`, 'Yes — reverse it first'], 1));
    }
    const result = a.slice();
    frames.push({
      note: `Merged: ${fmtList(result)}. Every step fills one slot with a single comparison → O(m + n) time, O(1) extra space.`,
      panels: [arr(result, { label: 'nums1 (merged)', highlights: Object.fromEntries(result.map((_, t) => [t, 'done'])) }), arr([...B], { label: 'nums2', highlights: Object.fromEntries(B.map((_, t) => [t, 'muted'])) }), vars({ result: fmtList(result) })],
    });
    return frames;
  },
};

/* ------------------------------------------------------------------ intervals: two-list intersection */

function cleanIntervals(raw, name) {
  if (!Array.isArray(raw)) throw new Error(`${name} must be a list like [[0, 2], [5, 10]]`);
  const list = raw.slice(0, 6).map((iv) => {
    if (!Array.isArray(iv) || iv.length < 2 || !iv.slice(0, 2).every((x) => typeof x === 'number' && Number.isFinite(x))) throw new Error(`each interval in ${name} must be [start, end] numbers`);
    return iv[0] <= iv[1] ? [iv[0], iv[1]] : [iv[1], iv[0]];
  });
  list.sort((x, y) => x[0] - y[0] || x[1] - y[1]);
  const merged = [];
  for (const iv of list) {
    const last = merged[merged.length - 1];
    if (last && iv[0] <= last[1]) last[1] = Math.max(last[1], iv[1]);
    else merged.push([...iv]);
  }
  return { list: merged, changed: merged.length !== raw.slice(0, 6).length };
}

export const intervalIntersection = {
  title: 'Interval list intersections (two pointers)',
  description: 'Two sorted, disjoint lists: the overlap of A[i] and B[j] is [max(starts), min(ends)] when lo ≤ hi; then advance whichever interval ends first. Lists are sorted (overlaps inside one list merged) and clamped to 6 intervals each.',
  defaultInput: { A: [[0, 2], [5, 10], [13, 23], [24, 25]], B: [[1, 5], [8, 12], [15, 24], [25, 26]] },
  fields: [
    { key: 'A', type: 'json', label: 'A [[start, end], …]' },
    { key: 'B', type: 'json', label: 'B [[start, end], …]' },
  ],
  testInputs: [{ A: [], B: [[1, 2]] }, { A: [[1, 3]], B: [] }, { A: [[1, 3]], B: [[4, 6]] }, { A: [[1, 5]], B: [[5, 9]] }, { A: [[0, 10]], B: [[1, 2], [3, 4], [5, 6]] }, { A: [[3, 1], [2, 8]], B: [[4, 4], [6, 7]] }],
  generate({ A: rawA, B: rawB }) {
    const { list: A, changed: chA } = cleanIntervals(rawA, 'A');
    const { list: B, changed: chB } = cleanIntervals(rawB, 'B');
    const all = [...A, ...B];
    const lo0 = all.length ? Math.min(...all.map((x) => x[0])) : 0;
    const hi0 = all.length ? Math.max(...all.map((x) => x[1])) : 1;
    const max = hi0 > lo0 ? hi0 : lo0 + 1;
    const out = [];
    let i = 0;
    let j = 0;
    let fresh = -1;
    const items = (L, idx, cur) => L.map(([s, e], t) => ({ start: s, end: e, state: t < idx ? 'muted' : t === idx ? cur : '' }));
    const view = (cur = 'active', extra = {}) => [
      intervals(items(A, i, cur), lo0, max, `A · i = ${i < A.length ? i : 'end'}`),
      intervals(items(B, j, cur), lo0, max, `B · j = ${j < B.length ? j : 'end'}`),
      intervals(out.map(([s, e], t) => ({ start: s, end: e, state: t === fresh ? 'active' : 'done' })), lo0, max, 'A ∩ B'),
      vars({ i, j, ...extra }),
    ];
    const frames = [];
    const prep = chA || chB ? ' (Overlapping intervals inside one list were merged first — the method needs disjoint lists.)' : '';
    frames.push({ note: `i = 0 walks A, j = 0 walks B. Both lists are sorted and disjoint, so we never need to look back.${prep}`, panels: view() });
    let asks = 0;
    let step = 0;
    while (i < A.length && j < B.length) {
      const [a0, a1] = A[i];
      const [b0, b1] = B[j];
      const lo = Math.max(a0, b0);
      const hi = Math.min(a1, b1);
      const hit = lo <= hi;
      const p = step % 2 === 0 && asks < 5 ? pick(`A[${i}] = [${a0}, ${a1}], B[${j}] = [${b0}, ${b1}]. Is there an intersection?`, hit ? `Yes — [${lo}, ${hi}]` : `No — max start ${lo} > min end ${hi}`, [hit ? `No — they only touch` : `Yes — [${Math.min(a0, b0)}, ${Math.max(a1, b1)}]`, `Yes — [${Math.min(a0, b0)}, ${Math.max(a1, b1)}]`, hit ? `Yes — [${Math.min(a0, b0)}, ${hi}]` : `Yes — [${hi}, ${lo}]`], asks++) : null;
      fresh = -1;
      if (hit) {
        out.push([lo, hi]);
        fresh = out.length - 1;
      }
      frames.push({
        note: `lo = max(${a0}, ${b0}) = ${lo}, hi = min(${a1}, ${b1}) = ${hi}. ${hit ? `lo ≤ hi → they share [${lo}, ${hi}]; record it.${lo === hi ? ' A single shared point counts for closed intervals.' : ''}` : 'lo > hi → no common point; nothing recorded.'}`,
        panels: view('active', { lo, hi }),
      });
      attach(frames, p);
      const advA = a1 < b1;
      const tie = a1 === b1;
      const q = step % 2 === 1 && asks < 5 ? pick(`A[${i}] ends at ${a1}, B[${j}] ends at ${b1}. Which pointer advances?`, advA ? 'i — A[i] ends first' : tie ? 'j — equal ends take the else-branch' : 'j — B[j] ends first', [advA ? 'j — B[j] ends first' : 'i — A[i] ends first', 'Both, always', 'The one that STARTS first'], asks++ + 1) : null;
      step++;
      const why = advA
        ? `A[${i}] ends first (${a1} < ${b1}). Every later B interval starts after ${b1}, so A[${i}] can never meet them → i++.`
        : tie
          ? `Both end at ${a1}. The code's else-branch advances j; next round A[${i}] is dropped too (moving both would also be correct).`
          : `B[${j}] ends first (${b1} < ${a1}). Every later A interval starts after ${a1}, so B[${j}] is finished → j++.`;
      if (advA) i++;
      else j++;
      fresh = -1;
      frames.push({ note: why, panels: view('active', { lo, hi }) });
      attach(frames, q);
    }
    frames.push({
      note: `${i >= A.length ? 'A' : 'B'} is exhausted → nothing left can intersect. Result ${out.length ? out.map((x) => `[${x.join(', ')}]`).join(' ') : '[] (no overlaps)'}. Each step drops one interval → O(n + m) time, O(1) extra space besides the output.`,
      panels: view('active', { result: out.length }),
    });
    return frames;
  },
};

/* ------------------------------------------------------------------ greedy: reach / frontier */

const JG_MODES = ['can reach the end (Jump Game I)', 'fewest jumps (Jump Game II)'];

export const jumpGame = {
  title: 'Jump game: farthest reach & BFS levels',
  description: 'nums[i] = longest jump from i. Jump Game I keeps reach = farthest reachable index and fails at the first i > reach. Jump Game II scans level by level: when i hits curEnd, jumps++ and curEnd = farthest. Clamped to 14 non-negative integers.',
  defaultInput: { nums: [3, 1, 2, 0, 1, 0, 4], mode: JG_MODES[0] },
  fields: [
    { key: 'nums', type: 'numbers', label: 'nums (max jump per index)' },
    { key: 'mode', type: 'select', label: 'question', options: JG_MODES },
  ],
  testInputs: [{ nums: [], mode: JG_MODES[0] }, { nums: [0], mode: JG_MODES[0] }, { nums: [2, 3, 1, 1, 4], mode: JG_MODES[0] }, { nums: [2, 3, 1, 1, 4], mode: JG_MODES[1] }, { nums: [0], mode: JG_MODES[1] }, { nums: [3, 2, 1, 0, 4], mode: JG_MODES[1] }, { nums: [1, 1, 1, 1], mode: JG_MODES[1] }, { nums: [0, 2], mode: JG_MODES[0] }],
  generate({ nums: raw, mode }) {
    const two = mode === JG_MODES[1];
    const a = nums(raw, 14).map((x) => Math.max(0, Math.floor(x)));
    const n = a.length;
    const frames = [];
    if (n <= 1) {
      const msg = n ? 'One index: you already stand on the last index.' : 'No indices at all — there is nothing to reach.';
      return [
        { note: msg, panels: [arr([...a], {}), vars(two ? { jumps: 0 } : { reach: 0 })] },
        { note: two ? `Fewest jumps = 0. O(1).` : 'Reachable = true. O(1).', panels: [arr([...a], { highlights: n ? { 0: 'done' } : {} }), vars(two ? { result: 0 } : { result: true })] },
      ];
    }
    let asks = 0;
    if (!two) {
      let reach = 0;
      const view = (i, st = 'active') => {
        const hl = {};
        const top = Math.min(reach, n - 1);
        for (let t = 0; t < n; t++) hl[t] = t > reach ? 'muted' : t < i ? 'visited' : 'window';
        if (i < n) hl[i] = st;
        const ptrs = [{ index: top, label: 'reach', color: 'b' }];
        if (i < n) ptrs.unshift({ index: i, label: 'i', color: 'a' });
        return [arr([...a], { highlights: hl, pointers: ptrs, range: [0, top] }), vars({ i: i < n ? i : 'end', reach, last: n - 1 })];
      };
      frames.push({ note: `reach = 0. Invariant: every index ≤ reach is reachable (the boxed block). Each reachable i can extend it to i + nums[i].`, panels: view(0, 'window') });
      let result = true;
      for (let i = 0; i < n; i++) {
        if (i > reach) {
          const p = pick(`i = ${i} but reach = ${reach}. What happens?`, `Return false — index ${i} can never be reached`, [`Jump over the gap using nums[${reach}]`, `reach = ${i} + nums[${i}] and continue`], 1);
          frames.push({ note: `i = ${i} > reach = ${reach}: a gap. Every index we could stand on jumps at most to ${reach}, so index ${i} — and the end — is unreachable. Return false.`, panels: view(i, 'bad') });
          attach(frames, p);
          result = false;
          break;
        }
        const old = reach;
        const cand = i + a[i];
        const p = (i % 2 === 1 || a[i] === 0) && asks < 4 ? pick(`i = ${i}, nums[${i}] = ${a[i]}, reach = ${old}. What is reach after this step?`, Math.max(old, cand), [old + a[i], cand, a[i], old + 1], asks++) : null;
        reach = Math.max(reach, cand);
        frames.push({ note: `i = ${i} ≤ reach, so we can stand here. i + nums[i] = ${cand} ${cand > old ? `> ${old} → reach = ${reach}.` : `≤ ${old} → reach stays ${reach}.`}${a[i] === 0 ? ' (A 0 is only a trap if nothing jumps past it.)' : ''}`, panels: view(i) });
        attach(frames, p);
      }
      const hl = {};
      for (let t = 0; t < n; t++) hl[t] = t <= reach ? 'done' : 'muted';
      frames.push({ note: `${result ? `Loop finished with reach = ${reach} ≥ last index ${n - 1} → true.` : `Stopped at a gap: reach = ${reach} < last index ${n - 1} → false.`} One pass, one variable → O(n) time, O(1) space.`, panels: [arr([...a], { highlights: hl, range: [0, Math.min(reach, n - 1)] }), vars({ reach, result })] });
      return frames;
    }
    // Jump Game II: BFS levels on the array
    let jumps = 0;
    let curEnd = 0;
    let farthest = 0;
    let levelStart = 0;
    const view = (i, st = 'active') => {
      const hl = {};
      for (let t = 0; t < n; t++) {
        if (t < levelStart) hl[t] = 'visited';
        else if (t <= curEnd) hl[t] = 'window';
        else if (t <= farthest) hl[t] = '';
        else hl[t] = 'muted';
      }
      if (i >= 0 && i < n) hl[i] = st;
      const ptrs = [];
      if (i >= 0 && i < n) ptrs.push({ index: i, label: 'i', color: 'a' });
      ptrs.push({ index: Math.min(curEnd, n - 1), label: 'curEnd', color: 'b' });
      if (farthest > curEnd) ptrs.push({ index: Math.min(farthest, n - 1), label: 'farthest', color: 'c' });
      return [arr([...a], { highlights: hl, pointers: ptrs, range: [levelStart, Math.min(curEnd, n - 1)] }), vars({ jumps, curEnd, farthest, level: jumps })];
    };
    frames.push({ note: `BFS in disguise: indices reachable with exactly k jumps form one contiguous block (level). Level 0 = [0, 0]. Scan a level tracking farthest; when i reaches curEnd we must jump.`, panels: view(-1) });
    let result = null;
    for (let i = 0; i < n - 1; i++) {
      const old = farthest;
      farthest = Math.max(farthest, i + a[i]);
      if (i === curEnd) {
        if (farthest <= i) {
          frames.push({ note: `i = ${i} = curEnd and farthest = ${farthest} ≤ ${i}: the next level would be empty — no index past ${i} is reachable. Return −1.`, panels: view(i, 'bad') });
          attach(frames, pick(`i = curEnd = ${i}, but farthest = ${farthest}. What happens?`, 'Return −1 — the next level is empty', [`jumps++ and continue`, `Keep scanning past curEnd`], 0));
          result = -1;
          break;
        }
        const p = asks < 5 ? pick(`i = curEnd = ${i}; this level's farthest reach is ${farthest}. What happens?`, `jumps++ → ${jumps + 1}, curEnd = ${farthest}`, ['Keep scanning — no jump yet', `jumps++ → ${jumps + 1}, curEnd = i + nums[i] = ${i + a[i]}`, `jumps++ → ${jumps + 1}, curEnd = ${i + 1}`], asks++) : null;
        levelStart = curEnd + 1;
        jumps++;
        curEnd = farthest;
        const end = curEnd >= n - 1;
        frames.push({ note: `i = ${i} is the end of level ${jumps - 1}${i + a[i] > old ? ` (and it pushes farthest to ${farthest})` : ''}. Every index in this level is scanned, so one more jump is unavoidable: jumps = ${jumps}, next level = [${levelStart}, ${curEnd}].${end ? ` curEnd ≥ last index ${n - 1} → done.` : ''}`, panels: view(i) });
        attach(frames, p);
        if (end) {
          result = jumps;
          break;
        }
      } else {
        const p = asks < 5 && i % 2 === 0 ? pick(`Inside the level: i = ${i}, nums[${i}] = ${a[i]}, farthest = ${old}. What is farthest now?`, farthest, [old + a[i], i + a[i], old, a[i]], asks++ + 1) : null;
        frames.push({ note: `i = ${i} is inside level ${jumps} (ends at curEnd = ${curEnd}). i + nums[i] = ${i + a[i]} → farthest = ${farthest}. No jump yet: we still have indices of this level to scan.`, panels: view(i) });
        attach(frames, p);
      }
    }
    if (result === null) result = jumps;
    const hl = {};
    for (let t = 0; t < n; t++) hl[t] = result === -1 && t > farthest ? 'muted' : 'done';
    frames.push({ note: `${result === -1 ? 'The last index is unreachable → −1.' : `Fewest jumps = ${result}: one jump per level crossed.`} Each index is scanned once → O(n) time, O(1) space (BFS without a queue).`, panels: [arr([...a], { highlights: hl }), vars({ jumps, result })] });
    return frames;
  },
};

/* ------------------------------------------------------------------ stack design: min stack / two-stack queue */

const MS_MODES = ['min stack', 'queue from two stacks'];

function parseStackOps(raw) {
  return (Array.isArray(raw) ? raw : []).slice(0, 20).map((o) => {
    const m = String(o).trim().toLowerCase().match(/^(push|enqueue)\s+(-?\d+(?:\.\d+)?)$|^(pop|dequeue|top|peek|front|getmin|min)$/);
    if (!m) throw new Error(`unknown operation "${o}" — use "push x", "pop", "top" or "getMin"`);
    if (m[1]) return { op: 'push', x: Number(m[2]) };
    const w = m[3];
    return { op: w === 'dequeue' ? 'pop' : w === 'peek' || w === 'front' ? 'top' : w === 'min' ? 'getmin' : w };
  });
}

export const minStack = {
  title: 'Stack design: min stack & two-stack queue',
  description: 'Min stack: every push also records min(x, min below) on a parallel stack, so getMin is O(1) and survives pops. Queue mode: push into inbox; pop/top pour inbox into outbox only when outbox is empty (getMin is ignored there). Ops: "push x", "pop", "top", "getMin"; up to 20.',
  defaultInput: { ops: ['push 5', 'push 2', 'push 7', 'getMin', 'pop', 'getMin', 'push 1', 'getMin', 'pop', 'pop', 'getMin'], mode: MS_MODES[0] },
  fields: [
    { key: 'ops', type: 'strings', label: 'operations' },
    { key: 'mode', type: 'select', label: 'design', options: MS_MODES },
  ],
  testInputs: [{ ops: [], mode: MS_MODES[0] }, { ops: ['pop', 'getMin', 'top'], mode: MS_MODES[0] }, { ops: ['push 3', 'push 3', 'pop', 'getMin'], mode: MS_MODES[0] }, { ops: ['push 1', 'push 2', 'pop', 'push 3', 'pop', 'pop', 'pop', 'top'], mode: MS_MODES[1] }, { ops: [], mode: MS_MODES[1] }, { ops: ['push 5', 'push 2', 'push 7', 'getMin', 'pop', 'getMin', 'push 1', 'getMin', 'pop', 'pop', 'getMin'], mode: MS_MODES[1] }],
  generate({ ops: rawOps, mode }) {
    const ops = parseStackOps(rawOps);
    const frames = [];
    const outputs = [];
    let asks = 0;
    if (mode !== MS_MODES[1]) {
      const vals = [];
      const mins = [];
      const top = (s) => s[s.length - 1];
      const view = (extra = {}) => [stack([...vals], { label: 'values' }), stack([...mins], { label: 'min so far' }), vars({ getMin: mins.length ? top(mins) : '—', size: vals.length, ...extra })];
      frames.push({ note: 'A single "min" variable breaks when the minimum is popped. Instead, each push also records the min of everything at or below it on a parallel stack. A stack only changes at the top, so each record stays true while its entry lives.', panels: view() });
      ops.forEach(({ op, x }) => {
        let p = null;
        if (op === 'push') {
          const prev = mins.length ? top(mins) : null;
          const m = prev === null ? x : Math.min(x, prev);
          if (prev !== null && asks < 4) p = pick(`push ${x} while the current min is ${prev}. What goes on the "min so far" stack?`, m, [m === x ? prev : x, `nothing — ${x} is not a new min`], asks++);
          vals.push(x);
          mins.push(m);
          frames.push({ note: prev === null ? `push ${x} onto an empty stack → it is its own minimum: record ${m}.` : `push ${x} → record min(${x}, ${prev}) = ${m}${m === x && x !== prev ? ' — a new minimum' : ' — the old minimum still rules below'}.`, panels: view({ op: `push ${x}` }) });
        } else if (op === 'pop') {
          if (!vals.length) {
            outputs.push('empty');
            frames.push({ note: 'pop on an empty stack → nothing to remove (a real implementation would throw).', panels: view({ op: 'pop', returns: 'empty' }) });
          } else {
            const v = vals[vals.length - 1];
            const m = top(mins);
            const after = mins.length > 1 ? mins[mins.length - 2] : null;
            if (after !== null && after !== m && asks < 5) p = pick(`pop removes ${v} (min so far ${m}). What does getMin return afterwards?`, after, [m, `rescan the stack to find out`, v === m ? null : v].filter((o) => o !== null), asks++ + 1);
            vals.pop();
            mins.pop();
            outputs.push(v);
            frames.push({ note: `pop → removes ${v} and its record ${m} together.${after === null ? ' The stack is empty now.' : after === m ? ` The record below still says ${after}, so the minimum is unchanged.` : ` The record below says ${after}: the previous minimum is recovered for free, no rescan.`}`, panels: view({ op: 'pop', returns: v }) });
          }
        } else if (op === 'top') {
          const v = vals.length ? top(vals) : 'empty';
          outputs.push(v);
          frames.push({ note: vals.length ? `top → ${v}, the last value pushed. O(1).` : 'top on an empty stack → nothing there.', panels: view({ op: 'top', returns: v }) });
        } else {
          const v = mins.length ? top(mins) : 'empty';
          if (mins.length && asks < 5 && vals.length > 1) p = pick(`getMin: values (bottom → top) = ${fmtList(vals)}. What is returned, and how?`, `${v} — read the top of "min so far", O(1)`, [`${v} — scan all values, O(n)`, top(vals) !== v ? `${top(vals)} — the top value` : null, vals[0] !== v ? `${vals[0]} — the bottom value` : null], asks++ + 2);
          outputs.push(v);
          frames.push({ note: mins.length ? `getMin → the top record says ${v}. One read, O(1) — no scan of the values.` : 'getMin on an empty stack → nothing there.', panels: view({ op: 'getMin', returns: v }) });
        }
        attach(frames, p);
      });
      frames.push({ note: `Outputs: ${outputs.length ? fmtList(outputs) : 'none'}. push, pop, top and getMin are all O(1); the extra stack costs O(n) space.`, panels: view({ outputs: outputs.length ? fmtList(outputs) : '—' }) });
      return frames;
    }
    // queue from two stacks
    const inbox = [];
    const outbox = [];
    const order = () => [...outbox].reverse().concat(inbox);
    const view = (extra = {}) => [stack([...inbox], { label: 'inbox (push here)' }), stack([...outbox], { label: 'outbox (pop here)' }), queue(order(), 'queue order (front → back)'), vars({ size: inbox.length + outbox.length, ...extra })];
    const ignored = ops.some((o) => o.op === 'getmin');
    frames.push({ note: `Queue from two stacks: push into inbox; pop and top read outbox. Pouring inbox into outbox reverses it, so the OLDEST element lands on top.${ignored ? ' (getMin ops are ignored in this mode.)' : ''}`, panels: view() });
    let pourAsked = 0;
    ops.forEach(({ op, x }) => {
      if (op === 'getmin') return;
      if (op === 'push') {
        inbox.push(x);
        frames.push({ note: `push ${x} → onto inbox. O(1); outbox is untouched.`, panels: view({ op: `push ${x}` }) });
        return;
      }
      const name = op === 'pop' ? 'pop' : 'top';
      if (!outbox.length && !inbox.length) {
        outputs.push('empty');
        frames.push({ note: `${name} on an empty queue → nothing there.`, panels: view({ op: name, returns: 'empty' }) });
        return;
      }
      if (!outbox.length) {
        const p = pourAsked < 2 ? pick(`${name}: outbox is empty, inbox (bottom → top) = ${fmtList(inbox)}. After pouring, which value is on top of outbox?`, inbox[0], [inbox[inbox.length - 1], inbox.length > 2 ? inbox[1] : null, 'nothing — pop inbox directly'], pourAsked++ + asks++) : null;
        let first = true;
        while (inbox.length) {
          const v = inbox.pop();
          outbox.push(v);
          frames.push({ note: first ? `${name}: outbox is empty → pour ALL of inbox into it, one pop/push at a time. Move ${v}.` : `Move ${v}.${inbox.length ? '' : ` Inbox is empty; the oldest element ${v} is now on top of outbox.`}`, panels: view({ op: name, pouring: true }) });
          if (first) attach(frames, p);
          first = false;
        }
      }
      const v = outbox[outbox.length - 1];
      let p = null;
      if (inbox.length && outbox.length && asks < 5) p = pick(`${name}: outbox = ${fmtList(outbox)} (top = ${v}), inbox = ${fmtList(inbox)}. Pour first?`, `No — outbox is not empty; use its top ${v}`, [`Yes — pour inbox on top of outbox`, `No — pop from inbox instead`], asks++ + 1);
      if (op === 'pop') outbox.pop();
      outputs.push(v);
      frames.push({ note: `${name} → ${v}, the oldest element (FIFO).${inbox.length ? ' Inbox is NOT poured while outbox has items, or newer elements would be buried under older ones.' : ''}`, panels: view({ op: name, returns: v }) });
      attach(frames, p);
    });
    frames.push({ note: `Outputs: ${outputs.length ? fmtList(outputs) : 'none'}. A pour can cost O(n), but each element is pushed, moved and popped at most once → amortised O(1) per operation, O(n) space.`, panels: view({ outputs: outputs.length ? fmtList(outputs) : '—' }) });
    return frames;
  },
};

/* ------------------------------------------------------------------ linked list: LRU cache */

export const lruCache = {
  title: 'LRU cache: hash map + doubly linked list',
  description: 'The Map finds a key’s node in O(1); the doubly linked list (sentinels H and T) keeps recency order. get moves the node to the front, put inserts at the front and evicts T.prev when full. Ops: "put k v", "get k"; capacity ≤ 5, up to 16 ops.',
  defaultInput: { capacity: 2, ops: ['put 1 1', 'put 2 2', 'get 1', 'put 3 3', 'get 2', 'put 4 4', 'get 1', 'get 3', 'get 4'] },
  fields: [
    { key: 'capacity', type: 'number', label: 'capacity' },
    { key: 'ops', type: 'strings', label: 'operations' },
  ],
  testInputs: [{ capacity: 1, ops: ['put 1 1', 'put 2 2', 'get 1', 'get 2'] }, { capacity: 2, ops: [] }, { capacity: 2, ops: ['get 5'] }, { capacity: 2, ops: ['put 1 1', 'put 1 9', 'get 1', 'put 2 2', 'put 3 3', 'get 1', 'get 2'] }, { capacity: 0, ops: ['put 1 1', 'get 1'] }, { capacity: 3, ops: ['put 1 1', 'put 2 2', 'put 3 3', 'get 1', 'put 4 4', 'get 2', 'get 3'] }],
  generate({ capacity, ops: rawOps }) {
    const cap = clampInt(capacity, 1, 5, 1);
    const ops = (Array.isArray(rawOps) ? rawOps : []).slice(0, 16).map((o) => {
      const m = String(o).trim().toLowerCase().match(/^put\s+(-?\d+)\s+(-?\d+)$|^get\s+(-?\d+)$/);
      if (!m) throw new Error(`unknown operation "${o}" — use "put key value" or "get key"`);
      return m[1] !== undefined ? { op: 'put', k: Number(m[1]), v: Number(m[2]) } : { op: 'get', k: Number(m[3]) };
    });
    let order = []; // most recent first
    const frames = [];
    const outputs = [];
    const view = (hl = {}, keyHl = null, extra = {}) => {
      const values = ['H', ...order.map((x) => `${x.k}:${x.v}`), 'T'];
      const next = values.map((_, i) => (i + 1 < values.length ? i + 1 : null));
      const highlights = { 0: 'visited', [values.length - 1]: 'visited' };
      for (const [pos, st] of Object.entries(hl)) highlights[Number(pos) + 1] = st;
      const pointers = [];
      if (order.length) {
        pointers.push({ index: 1, label: 'MRU', color: 'a' });
        if (order.length > 1) pointers.push({ index: order.length, label: 'LRU', color: 'b' });
      }
      const keys = order.map((x) => x.k).sort((x, y) => x - y);
      const kh = {};
      if (keyHl !== null) {
        const at = keys.indexOf(keyHl.k);
        if (at >= 0) kh[at] = keyHl.st;
      }
      return [
        { kind: 'list', values, next, highlights, pointers, doubly: true },
        arr(keys, { label: 'map: key → node', highlights: kh, showIndices: false }),
        vars({ size: `${order.length}/${cap}`, ...extra }),
      ];
    };
    frames.push({ note: `capacity = ${cap}. H and T are sentinels, so the list is never empty and splicing needs no null checks. Front (after H) = most recently used; T.prev = least recently used.`, panels: view() });
    let asks = 0;
    ops.forEach(({ op, k, v }, idx) => {
      const pos = order.findIndex((x) => x.k === k);
      if (op === 'get') {
        const p = asks < 5 && idx > 2 ? pick(`get ${k}: keys in the cache are ${order.length ? fmtList(order.map((x) => x.k)) : '[]'}. What is returned?`, pos >= 0 ? order[pos].v : -1, [pos >= 0 ? -1 : k, pos >= 0 ? k + 1 : 0, ...order.map((x) => x.v)], asks++) : null;
        if (pos < 0) {
          outputs.push(-1);
          frames.push({ note: `get ${k}: the map has no key ${k} → return −1. One hash lookup, O(1); the list is untouched.`, panels: view({}, null, { op: `get ${k}`, returns: -1 }) });
          attach(frames, p);
          return;
        }
        const node = order[pos];
        outputs.push(node.v);
        if (pos === 0) {
          frames.push({ note: `get ${k}: map[${k}] hands us the node directly → value ${node.v}. It is already the most recent, so nothing moves.`, panels: view({ 0: 'done' }, { k, st: 'active' }, { op: `get ${k}`, returns: node.v }) });
          attach(frames, p);
          return;
        }
        frames.push({ note: `get ${k}: map[${k}] hands us the node directly (no scan) → value ${node.v}. It was just used, so it must move to the front.`, panels: view({ [pos]: 'active' }, { k, st: 'active' }, { op: `get ${k}`, returns: node.v }) });
        attach(frames, p);
        order = [node, ...order.filter((_, i) => i !== pos)];
        frames.push({ note: `Unlink it (node.prev.next = node.next; node.next.prev = node.prev) and insert it after H. Both are O(1) because the node knows its prev — a singly linked list would need a scan.`, panels: view({ 0: 'done' }, { k, st: 'done' }, { op: `get ${k}`, returns: node.v }) });
        return;
      }
      // put
      if (pos >= 0) {
        const node = order[pos];
        const old = node.v;
        order = [{ k, v }, ...order.filter((_, i) => i !== pos)];
        frames.push({ note: `put ${k} ${v}: key ${k} exists → overwrite its value (${old} → ${v}) and move it to the front. No eviction: the size does not change.`, panels: view({ 0: 'active' }, { k, st: 'active' }, { op: `put ${k} ${v}` }) });
        return;
      }
      if (order.length === cap) {
        const lru = order[order.length - 1];
        const p = asks < 5 ? pick(`put ${k} ${v}: the cache is full (${cap}/${cap}), order front → back = ${fmtList(order.map((x) => x.k))}. Which key is evicted?`, lru.k, [...order.slice(0, -1).map((x) => x.k), 'none — the cache grows'], asks++ + 1) : null;
        frames.push({ note: `put ${k} ${v}: key ${k} is new and the cache is full → evict the least recently used node, T.prev = key ${lru.k}. Unlink it and map.delete(${lru.k}) — that is why nodes store their key.`, panels: view({ [order.length - 1]: 'bad' }, { k: lru.k, st: 'bad' }, { op: `put ${k} ${v}`, evict: lru.k }) });
        attach(frames, p);
        order = order.slice(0, -1);
      }
      order = [{ k, v }, ...order];
      frames.push({ note: `Create node ${k}:${v}, insert it right after H (most recent) and map.set(${k}, node). Size ${order.length}/${cap}.`, panels: view({ 0: 'active' }, { k, st: 'active' }, { op: `put ${k} ${v}` }) });
    });
    frames.push({ note: `get results: ${outputs.length ? fmtList(outputs) : 'none'}. Every get / put is one map lookup plus a constant number of pointer splices → O(1) per operation, O(capacity) space.`, panels: view({}, null, { results: outputs.length ? fmtList(outputs) : '—' }) });
    return frames;
  },
};

/* ------------------------------------------------------------------ bits: Gray code */

const GC_MODES = ['i ^ (i >> 1)', 'reflect and prefix'];

export const grayCode = {
  title: 'Gray code: one bit flips at a time',
  description: 'List all n-bit numbers so neighbours differ in exactly one bit — either with g = i ^ (i >> 1), or by writing Gray(n−1) forwards with a 0 prefix and backwards with a 1 prefix. n is clamped to 1..4.',
  defaultInput: { n: 3, mode: GC_MODES[0] },
  fields: [
    { key: 'n', type: 'number', label: 'bits n' },
    { key: 'mode', type: 'select', label: 'construction', options: GC_MODES },
  ],
  testInputs: [{ n: 1, mode: GC_MODES[0] }, { n: 1, mode: GC_MODES[1] }, { n: 2, mode: GC_MODES[1] }, { n: 4, mode: GC_MODES[0] }, { n: 4, mode: GC_MODES[1] }, { n: 0, mode: GC_MODES[0] }, { n: 9, mode: GC_MODES[1] }],
  generate({ n: rawN, mode }) {
    const n = clampInt(rawN, 1, 4, 3);
    const bits = (x, w) => x.toString(2).padStart(w, '0');
    const frames = [];
    const colLabels = (w) => [...Array.from({ length: w }, (_, t) => `b${w - 1 - t}`), 'dec'];
    // which bit (as column index) differs between two equal-width bit strings
    const diffCol = (s, t) => [...s].findIndex((c, i) => c !== t[i]);
    const tableOf = (rows, w, hl = {}) => {
      const cells = rows.map((s) => [...s.split(''), parseInt(s, 2)]);
      const states = rows.map((_, r) => new Array(w + 1).fill(hl[r]?.row || ''));
      for (const [r, h] of Object.entries(hl)) if (h.col !== undefined && h.col >= 0) states[r][h.col] = h.colState || 'active';
      return table(cells, states, rows.map((_, r) => `i=${r}`), colLabels(w), `Gray(${w})`);
    };
    let asks = 0;
    const seq = Array.from({ length: 1 << n }, (_, i) => i ^ (i >> 1));
    if (mode !== GC_MODES[1]) {
      const rows = [];
      frames.push({ note: `g(i) = i ^ (i >> 1). Bit k of g is 1 exactly when bits k and k+1 of i differ — so as i counts up, g changes one bit at a time. n = ${n} → ${1 << n} codes.`, panels: [tableOf([], n), vars({ n, codes: 1 << n })] });
      for (let i = 0; i < 1 << n; i++) {
        const g = seq[i];
        const gs = bits(g, n);
        const prev = rows.length ? rows[rows.length - 1] : null;
        const col = prev ? diffCol(prev, gs) : -1;
        const p = i >= 2 && i % 2 === 0 && asks < 4 ? pick(`i = ${i} (${bits(i, n)}), i >> 1 = ${bits(i >> 1, n)}. What is g(${i})?`, gs, [bits(i, n), bits(i >> 1, n), bits((i - 1) ^ ((i - 1) >> 1) ^ 1, n), bits(g ^ 1, n)], asks++) : null;
        rows.push(gs);
        const hl = { [rows.length - 1]: { row: 'window', col, colState: 'active' } };
        for (let r = 0; r < rows.length - 1; r++) hl[r] = { row: 'visited' };
        const gHl = {};
        if (col >= 0) gHl[col] = 'active';
        frames.push({
          note: i === 0 ? 'g(0) = 0 ^ 0 = 0: the sequence starts at all zeros.' : `${bits(i, n)} XOR ${bits(i >> 1, n)} = ${gs} (= ${g}). Compared with g(${i - 1}) = ${prev}, only bit b${n - 1 - col} flipped.`,
          panels: [arr(bits(i, n).split(''), { label: `i = ${i}` }), arr(bits(i >> 1, n).split(''), { label: `i >> 1 = ${i >> 1}` }), arr(gs.split(''), { label: `g = ${g}`, highlights: gHl }), tableOf(rows, n, hl)],
        });
        attach(frames, p);
      }
    } else {
      let list = ['0', '1'];
      const hl0 = { 0: { row: 'window' }, 1: { row: 'window' } };
      frames.push({ note: `Start with Gray(1) = 0, 1 — they differ in one bit. Each step doubles the list: Gray(k−1) forwards with a 0 prefix, then BACKWARDS with a 1 prefix.${n === 1 ? ' n = 1, so we are already done.' : ''}`, panels: [tableOf(list, 1, hl0), vars({ k: 1, size: 2 })] });
      for (let w = 2; w <= n; w++) {
        const prev = list;
        const fwd = prev.map((s) => `0${s}`);
        const hl = {};
        fwd.forEach((_, r) => (hl[r] = { row: 'visited', col: 0, colState: 'window' }));
        frames.push({ note: `Gray(${w}), first half: copy Gray(${w - 1}) in order and put a 0 in front. Prefixing the same bit keeps every neighbour pair one bit apart.`, panels: [tableOf(fwd, w, hl), vars({ k: w, size: fwd.length })] });
        list = [...fwd];
        for (let t = 0; t < prev.length; t++) {
          const src = prev.length - 1 - t;
          const row = `1${prev[src]}`;
          const p = t === 0 && asks < 4 ? pick(`Gray(${w}) so far ends with ${list[list.length - 1]}. Which row comes next (the reflected half)?`, row, [`1${prev[0]}`, bits(list.length, w), `0${prev[src]}`], asks++ + 1) : t === 1 && asks < 4 ? pick(`Next reflected row: mirror of Gray(${w - 1}) row ${src} (${prev[src]}). Which code?`, row, [`0${prev[src]}`, `1${prev[prev.length - 1 - src]}`, bits(list.length, w)], asks++ + 2) : null;
          list.push(row);
          const h = {};
          list.forEach((_, r) => (h[r] = { row: r < prev.length ? 'visited' : '' }));
          h[src] = { row: 'window' };
          h[list.length - 1] = { row: 'active' };
          frames.push({
            note: t === 0 ? `The seam: the reflected half starts with the LAST row ${prev[src]}, now with a 1 prefix → ${row}. Its lower bits equal the row above, so only the new top bit flips.` : `Mirror of row ${src} (${prev[src]}) with a 1 prefix → ${row}. Inside the reflected half neighbours differ exactly as they did going forwards.`,
            panels: [tableOf(list, w, h), vars({ k: w, size: list.length })],
          });
          attach(frames, p);
        }
      }
    }
    const final = seq.map((g) => bits(g, n));
    const hl = {};
    final.forEach((_, r) => (hl[r] = { row: 'done' }));
    const wrap = n > 1 ? ` The last code ${final[final.length - 1]} and the first ${final[0]} also differ in one bit — the sequence is cyclic.` : '';
    frames.push({ note: `Gray(${n}) = ${fmtList(seq)}.${wrap} 2ⁿ codes, O(1) each → O(2ⁿ) time, O(1) extra space besides the output.`, panels: [tableOf(final, n, hl), vars({ result: fmtList(seq) })] });
    if (mode !== GC_MODES[1] && n >= 2) attach(frames, pick(`How many bits differ between the last code ${final[final.length - 1]} and the first ${final[0]}?`, 'Exactly one', ['None — they are equal', `All ${n}`, 'Two'], 2));
    return frames;
  },
};

/* ------------------------------------------------------------------ advanced structures: sparse table */

export const sparseTable = {
  title: 'Sparse table: O(1) range minimum',
  description: 'st[k][i] = min of the block of length 2^k starting at i, built from two halves of level k − 1. A query [l, r] takes k = ⌊log2(len)⌋ and the min of two overlapping blocks. Clamped to 10 numbers.',
  defaultInput: { nums: [4, 6, 1, 5, 7, 3, 2], l: 1, r: 5 },
  fields: [
    { key: 'nums', type: 'numbers', label: 'nums' },
    { key: 'l', type: 'number', label: 'query l' },
    { key: 'r', type: 'number', label: 'query r' },
  ],
  testInputs: [{ nums: [], l: 0, r: 0 }, { nums: [9], l: 0, r: 0 }, { nums: [5, 3], l: 0, r: 1 }, { nums: [2, 2, 2, 2], l: 1, r: 1 }, { nums: [8, 7, 6, 5, 4, 3, 2, 1, 0, -1], l: 0, r: 9 }, { nums: [3, 1, 4, 1, 5], l: 4, r: 0 }, { nums: [1, 2, 3], l: -5, r: 99 }],
  generate({ nums: raw, l: rawL, r: rawR }) {
    const a = nums(raw, 10);
    const n = a.length;
    if (!n) {
      return [
        { note: 'The array is empty, so there are no blocks to precompute.', panels: [arr([]), vars({ n: 0 })] },
        { note: 'Nothing to query on an empty array. O(1).', panels: [arr([]), vars({ result: '—' })] },
      ];
    }
    const LOG = [0, 0];
    for (let x = 2; x <= n; x++) LOG[x] = LOG[x >> 1] + 1;
    const K = LOG[n];
    const st = [a.slice()];
    for (let k = 1; k <= K; k++) st.push(new Array(n - (1 << k) + 1).fill(null));
    let l = clampInt(rawL, 0, n - 1, 0);
    let r = clampInt(rawR, 0, n - 1, n - 1);
    if (l > r) [l, r] = [r, l];
    const frames = [];
    const view = (cellStates = {}, arrOpts = {}, extra = {}) => {
      const cells = st.map((row) => Array.from({ length: n }, (_, i) => (i < row.length ? (row[i] === null ? '·' : row[i]) : '')));
      const states = st.map((row) => Array.from({ length: n }, (_, i) => (i < row.length ? '' : 'muted')));
      for (const [key, s] of Object.entries(cellStates)) {
        const [k, i] = key.split(',').map(Number);
        states[k][i] = s;
      }
      return [arr([...a], { label: 'nums', ...arrOpts }), table(cells, states, st.map((_, k) => `k=${k}`), a.map((_, i) => String(i)), 'st[k][i] = min of nums[i .. i + 2^k − 1] (block length 2^k)'), vars(extra)];
    };
    frames.push({ note: `Level k = 0 is the array itself (blocks of length 1). Level k stores the min of every block of length 2^k; only n − 2^k + 1 blocks fit, so each row is shorter. ${K} level${K === 1 ? '' : 's'} to build.`, panels: view(Object.fromEntries(a.map((_, i) => [`0,${i}`, 'done'])), {}, { n, levels: K + 1 }) });
    let asks = 0;
    for (let k = 1; k <= K; k++) {
      const half = 1 << (k - 1);
      for (let i = 0; i + (1 << k) <= n; i++) {
        const x = st[k - 1][i];
        const y = st[k - 1][i + half];
        const p = i === 1 && asks < 3 ? pick(`st[${k}][${i}] covers nums[${i}..${i + (1 << k) - 1}]. Which two cells of level ${k - 1} combine into it?`, `st[${k - 1}][${i}] and st[${k - 1}][${i + half}]`, [`st[${k - 1}][${i}] and st[${k - 1}][${i + 1}]`, `st[${k - 1}][${i}] and st[${k - 1}][${i + (1 << k)}]`, `st[0][${i}] and st[0][${i + (1 << k) - 1}]`].filter((o, t) => t !== 0 || half !== 1), asks++) : null;
        st[k][i] = Math.min(x, y);
        const hl = {};
        for (let t = i; t < i + (1 << k); t++) hl[t] = t < i + half ? 'window' : 'visited';
        frames.push({
          note: `st[${k}][${i}] = min(st[${k - 1}][${i}], st[${k - 1}][${i + half}]) = min(${x}, ${y}) = ${st[k][i]}. The block [${i}, ${i + (1 << k) - 1}] is two halves of length ${half} that are already known.`,
          panels: view({ [`${k - 1},${i}`]: 'window', [`${k - 1},${i + half}`]: 'window', [`${k},${i}`]: 'active' }, { highlights: hl, range: [i, i + (1 << k) - 1] }, { k, i, 'block length': 1 << k }),
        });
        attach(frames, p);
      }
    }
    const len = r - l + 1;
    const k = LOG[len];
    const b = 1 << k;
    const s2 = r - b + 1;
    const qVars = { query: `[${l}, ${r}]`, len, k };
    frames.push({ note: `Table built: O(n log n) cells, O(1) each. Query [${l}, ${r}]: len = ${len}, k = ⌊log2(${len})⌋ = ${k} → block length ${b}. Since ${b} ≤ ${len} < ${2 * b}, two blocks of length ${b} cover the range.`, panels: view({}, { range: [l, r], pointers: [{ index: l, label: 'l', color: 'a' }, { index: r, label: 'r', color: 'b' }] }, qVars) });
    attach(frames, pick(`Query [${l}, ${r}] has length ${len}. Which block length do the two blocks use?`, `${b} (k = ${k})`, [`${2 * b} (k = ${k + 1})`, `${len} (exactly the range)`, k > 0 ? `${b / 2} (k = ${k - 1})` : '2 (k = 1)'], asks++ + 1));
    const hl1 = {};
    for (let t = l; t < l + b; t++) hl1[t] = 'window';
    frames.push({ note: `Block 1 starts at l: st[${k}][${l}] = ${st[k][l]} covers [${l}, ${l + b - 1}].`, panels: view({ [`${k},${l}`]: 'active' }, { highlights: hl1, range: [l, r], pointers: [{ index: l, label: 'l', color: 'a' }, { index: r, label: 'r', color: 'b' }] }, { ...qVars, block1: st[k][l] }) });
    const hl2 = { ...hl1 };
    for (let t = s2; t <= r; t++) hl2[t] = hl1[t] ? 'active' : 'visited';
    const overlap = l + b - 1 >= s2 ? `[${s2}, ${l + b - 1}]` : null;
    frames.push({ note: `Block 2 ENDS at r, so it starts at r − 2^k + 1 = ${s2}: st[${k}][${s2}] = ${st[k][s2]} covers [${s2}, ${r}].${overlap ? ` The overlap ${overlap} is counted twice — harmless, because min(x, x) = x.` : ''}`, panels: view({ [`${k},${l}`]: 'active', [`${k},${s2}`]: 'active' }, { highlights: hl2, range: [l, r], pointers: [{ index: l, label: 'l', color: 'a' }, { index: r, label: 'r', color: 'b' }] }, { ...qVars, block1: st[k][l], block2: st[k][s2] }) });
    attach(frames, pick(`Block 2 has length ${b} and must end at r = ${r}. Where does it start?`, s2, [r - b, l + b, r, s2 + 1].filter((x) => x >= 0 && x < n), 2));
    const ans = Math.min(st[k][l], st[k][s2]);
    const brute = Math.min(...a.slice(l, r + 1));
    const fin = {};
    for (let t = l; t <= r; t++) fin[t] = a[t] === ans ? 'done' : 'window';
    frames.push({ note: `min(${st[k][l]}, ${st[k][s2]}) = ${ans} (checking every element of [${l}, ${r}] gives ${brute}). Build O(n log n) once; each query is two lookups → O(1). Only for idempotent ops (min, max, gcd) — a sum would double-count the overlap.`, panels: view({ [`${k},${l}`]: 'done', [`${k},${s2}`]: 'done' }, { highlights: fin, range: [l, r] }, { ...qVars, answer: ans }) });
    return frames;
  },
};
