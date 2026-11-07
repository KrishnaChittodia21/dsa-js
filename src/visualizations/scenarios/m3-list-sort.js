// Pattern scenes: linked-list merge sort, recursive descent parsing, sort-as-preprocessing (H-Index),
// greedy by earliest end (non-overlapping intervals). Each generate(input) returns frames: { note, panels, predict? }.
const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const stack = (values, label = 'call stack') => ({ kind: 'stack', values, label });
const ask = (question, options, answer, explain) => ({ question, options, answer, explain });
// Distinct options with the correct one placed at index pos % n; undefined if fewer than 2 distinct options.
const pick = (question, correct, wrong, pos = 0, explain) => {
  const c = String(correct);
  const w = [...new Set(wrong.map(String))].filter((o) => o !== c).slice(0, 3);
  if (!w.length) return undefined;
  const at = pos % (w.length + 1);
  return ask(question, [...w.slice(0, at), c, ...w.slice(at)], at, explain);
};
const toInts = (xs, max = 8) => (Array.isArray(xs) ? xs : []).slice(0, max).map((x) => Math.trunc(Number(x) || 0));
const show = (a) => `[${a.join(', ')}]`;

// ───────────────────────── 1. Linked list merge sort (split at middle + merge with dummy) ─────────────────────────
export const listMergeSort = {
  problem: { name: 'Sort List', statement: 'Sort a singly linked list in O(n log n) time.', example: '[4, 2, 5, 1, 3] → [1, 2, 3, 4, 5]', exampleOutput: [1, 2, 3, 4, 5], questionId: 'sort-list' },
  title: 'Linked list: merge sort (split + merge)',
  description: 'Find the first middle with slow/fast, cut mid.next = null, sort both halves, then merge them with a dummy head and a tail pointer. Up to 8 nodes.',
  defaultInput: { list: [4, 2, 5, 1, 3] },
  fields: [{ key: 'list', type: 'numbers', label: 'list' }],
  testInputs: [{ list: [] }, { list: [7] }, { list: [2, 2, 1, 2] }, { list: [-3, 5, -3, 0] }, { list: [9, 8, 7, 6, 5, 4, 3, 2, 1, 0] }],
  generate({ list }) {
    const vals = toInts(list);
    const frames = [];
    const calls = [];
    let q = 0;
    const chainPanel = (ids, opts = {}) => ({
      kind: 'list',
      values: ids.map((id) => vals[id]),
      next: ids.map((_, i) => (i < ids.length - 1 && i !== opts.cutAt ? i + 1 : null)),
      highlights: opts.highlights || {},
      pointers: opts.pointers || [],
      label: opts.label,
    });
    const st = () => stack(calls.map((ids) => `sort(${ids.map((id) => vals[id]).join('→') || '∅'})`));
    frames.push({
      note: vals.length
        ? 'A list cannot be indexed, so quicksort is awkward. Merge sort fits: split at the middle, sort each half, then merge by relinking nodes — no extra array.'
        : 'Empty list: head is null.',
      panels: [chainPanel(vals.map((_, i) => i), { label: 'list' }), st()],
    });

    const merge = (a, b) => {
      const out = [];
      let ia = 0;
      let ib = 0;
      const view = () => {
        const mergedVals = ['D', ...out.map((id) => vals[id])];
        const merged = { kind: 'list', values: mergedVals, next: mergedVals.map((_, i) => (i < mergedVals.length - 1 ? i + 1 : null)), pointers: [{ index: mergedVals.length - 1, label: 'tail', color: 'c' }], highlights: { 0: 'muted' }, label: 'dummy → merged' };
        const side = (ids, k, name, color) => chainPanel(ids, {
          label: name,
          highlights: Object.fromEntries(ids.map((_, i) => [i, i < k ? 'muted' : ''])),
          pointers: k < ids.length ? [{ index: k, label: name, color }] : [],
        });
        return [side(a, ia, 'a', 'a'), side(b, ib, 'b', 'b'), merged, st()];
      };
      frames.push({ note: `Merge ${show(a.map((id) => vals[id]))} and ${show(b.map((id) => vals[id]))}. A dummy node D gives the answer a fixed start; tail marks its last node.`, panels: view() });
      while (ia < a.length && ib < b.length) {
        const x = vals[a[ia]];
        const y = vals[b[ib]];
        const takeA = x <= y;
        let predict;
        if (q < 4 && (out.length > 0 || x === y)) {
          predict = pick(`a is at ${x}, b is at ${y}. Which node does tail.next take?`, takeA ? `a's ${x}` : `b's ${y}`, [takeA ? `b's ${y}` : `a's ${x}`, 'Both, a first'], q, x === y ? 'On a tie, <= takes a first — that keeps the sort stable.' : undefined);
          if (predict) q++;
        }
        if (takeA) out.push(a[ia++]);
        else out.push(b[ib++]);
        frames.push({
          note: `${x} ${takeA ? '<=' : '>'} ${y} → tail.next = ${takeA ? 'a' : 'b'} (${takeA ? x : y}), move ${takeA ? 'a' : 'b'} forward, then tail = tail.next.${x === y ? ' Ties go to a (<=), so equal values keep their order.' : ''}`,
          panels: view(),
          predict,
        });
      }
      const restA = ia < a.length;
      const rest = restA ? a.slice(ia) : b.slice(ib);
      if (rest.length) {
        const name = restA ? 'a' : 'b';
        const predict = q < 5 ? pick(`${restA ? 'b' : 'a'} is used up; ${name} still holds ${show(rest.map((id) => vals[id]))}. What happens?`, 'tail.next = the leftover, in one step', ['Compare the leftover nodes one by one', 'Drop the leftover nodes'], q) : undefined;
        if (predict) q++;
        out.push(...rest);
        if (restA) ia = a.length;
        else ib = b.length;
        frames.push({ note: `${restA ? 'b' : 'a'} is empty → tail.next = a ?? b attaches the whole leftover at once. It is already sorted and all ≥ the merged part.`, panels: view(), predict });
      }
      return out;
    };

    const sort = (ids) => {
      calls.push(ids);
      if (ids.length <= 1) {
        frames.push({ note: `${ids.length ? `One node (${vals[ids[0]]})` : 'No node'} → already sorted, return it. This base case stops the recursion.`, panels: [chainPanel(ids, { highlights: { 0: 'done' } }), st()] });
        calls.pop();
        return ids;
      }
      // slow = head, fast = head.next → slow stops on the first middle.
      let slow = 0;
      let fast = 1;
      const ptrs = () => [{ index: slow, label: 'slow', color: 'a' }, ...(fast < ids.length ? [{ index: fast, label: 'fast', color: 'b' }] : [])];
      frames.push({ note: `sort(${ids.map((id) => vals[id]).join('→')}): find the middle. slow = head, fast = head.next, so slow stops on the FIRST middle.`, panels: [chainPanel(ids, { pointers: ptrs() }), st()] });
      while (fast < ids.length && fast + 1 < ids.length) {
        slow += 1;
        fast += 2;
        frames.push({ note: `fast and fast.next exist → slow moves 1, fast moves 2.`, panels: [chainPanel(ids, { pointers: ptrs(), highlights: { [slow]: 'active' } }), st()] });
      }
      let predict;
      if (q < 5 && ids.length >= 4) {
        predict = pick(`fast cannot jump 2 more. Where is the list cut?`, `after ${vals[ids[slow]]} (slow)`, [`after ${vals[ids[slow + 1]]}`, `after ${vals[ids[Math.max(0, slow - 1)]]}`, `after ${vals[ids[ids.length - 1]]}`], q);
        if (predict) q++;
      }
      const left = ids.slice(0, slow + 1);
      const right = ids.slice(slow + 1);
      frames.push({
        note: `Cut: right = slow.next, then slow.next = null. Without the cut both halves would still be one list → infinite recursion. Halves: ${show(left.map((id) => vals[id]))} and ${show(right.map((id) => vals[id]))}.`,
        panels: [chainPanel(ids, { cutAt: slow, pointers: [{ index: slow, label: 'slow', color: 'a' }], highlights: Object.fromEntries(ids.map((_, i) => [i, i <= slow ? 'visited' : ''])) }), st()],
        predict,
      });
      const a = sort(left);
      const b = sort(right);
      const out = merge(a, b);
      frames.push({ note: `return dummy.next → ${show(out.map((id) => vals[id]))} is sorted. This call is done.`, panels: [chainPanel(out, { highlights: Object.fromEntries(out.map((_, i) => [i, 'done'])) }), st()] });
      calls.pop();
      return out;
    };
    const res = sort(vals.map((_, i) => i));
    frames.push({
      note: `Sorted: ${show(res.map((id) => vals[id]))}. log n levels of splitting, O(n) merging per level → O(n log n) time; only O(log n) recursion stack, no extra array.`,
      panels: [chainPanel(res, { label: 'sorted list', highlights: Object.fromEntries(res.map((_, i) => [i, 'done'])) }), st()],
    });
    frames.at(-1).result = res.map((id) => vals[id]);
    return frames;
  },
};

// ───────────────────────── 2. Recursive descent: parse a boolean expression ─────────────────────────
// Grammar from the pattern: expr = "t" | "f" | "!(expr)" | "&(expr,expr,…)" | "|(expr,expr,…)".
function validBool(s) {
  let i = 0;
  const expr = () => {
    const c = s[i++];
    if (c === 't' || c === 'f') return true;
    if (!'!&|'.includes(c || '#') || s[i++] !== '(') return false;
    let n = 0;
    for (;;) {
      if (!expr()) return false;
      n++;
      if (s[i] === ',') i++;
      else if (s[i] === ')') break;
      else return false;
    }
    i++;
    return c !== '!' || n === 1;
  };
  return s.length > 0 && expr() && i === s.length;
}

export const recursiveDescentBool = {
  problem: { name: 'Parsing A Boolean Expression', statement: 'Evaluate an expression made of t, f, !(e), &(e, …) and |(e, …).', example: '"&(t,!(f))" → true', exampleOutput: true, questionId: 'parsing-a-boolean-expression' },
  title: 'Recursive descent: evaluate a boolean expression',
  description: 'One function expr() parses one level; a shared cursor i moves through the string and each nested "(…)" is a recursive call. Grammar: t, f, !(e), &(e,…), |(e,…). Spaces removed, up to 20 characters.',
  defaultInput: { s: '&(t,!(f))' },
  fields: [{ key: 's', type: 'string', label: 's' }],
  testInputs: [{ s: '' }, { s: 't' }, { s: '|(f,f,f)' }, { s: '&(t' }, { s: '!(&(t,|(f,t),!(t)))' }, { s: '!(t,f)' }],
  generate({ s }) {
    const str = String(s ?? '').replace(/\s+/g, '').slice(0, 20);
    const chars = [...str];
    const frames = [];
    if (!validBool(str)) {
      frames.push({ note: 'The parser expects t, f, !(e), &(e,…) or |(e,…). Check the input against that grammar first.', panels: [arr(chars, { label: 's' })] });
      frames.push({ note: `"${str}" does not follow the grammar (${str ? 'unbalanced, wrong separator or extra characters' : 'empty string'}), so there is nothing to evaluate.`, panels: [arr(chars, { label: 's', highlights: Object.fromEntries(chars.map((_, k) => [k, 'bad'])) })] });
      frames.at(-1).result = null;
      return frames;
    }
    const tf = (b) => (b ? 't' : 'f');
    const calls = [];
    let i = 0;
    let q = 0;
    const view = (hl = {}, extra = {}) => {
      const highlights = {};
      for (let k = 0; k < Math.min(i, chars.length); k++) highlights[k] = 'visited';
      Object.assign(highlights, hl);
      return [
        arr(chars, { label: 's', highlights, pointers: i < chars.length ? [{ index: i, label: 'i', color: 'a' }] : [], showIndices: true }),
        vars({ i, depth: calls.length, ...extra }),
        stack(calls.map((cl) => (cl.c === 't' || cl.c === 'f' ? `expr '${cl.c}'` : `expr '${cl.c}' parts [${cl.parts.map(tf).join(',')}]`))),
      ];
    };
    frames.push({ note: 'The input nests, so one function expr() handles ONE level and calls itself for each nested part. The cursor i is shared: every call moves the same i forward.', panels: view() });
    const expr = () => {
      const at = i;
      const c = chars[i++];
      const call = { c, parts: [] };
      calls.push(call);
      if (c === 't' || c === 'f') {
        let predict;
        if (q === 0) {
          predict = pick(`expr() reads s[${at}] = '${c}'. What does it do?`, `Return ${c === 't' ? 'true' : 'false'} right away`, ['Call expr() again for it', "Skip it like a '('"], 0);
          if (predict) q++;
        }
        frames.push({ note: `s[${at}] = '${c}' is an atom → return ${c === 't' ? 'true' : 'false'}. No recursion needed; i is now ${i}.`, panels: view({ [at]: 'active' }), predict });
        calls.pop();
        return c === 't';
      }
      i++; // skip '('
      frames.push({ note: `s[${at}] = '${c}' is an operator → read it, skip '(' (i++), then parse parts until ')'. The caller's state waits on the call stack.`, panels: view({ [at]: 'active', [at + 1]: 'active' }) });
      while (chars[i] !== ')') {
        const v = expr();
        call.parts.push(v);
        const comma = chars[i] === ',';
        let predict;
        if (q >= 1 && q < 3 && comma) {
          predict = pick(`The nested call returned ${tf(v)} and s[${i}] is ','. What does '${c}' do next?`, "Skip ',' and parse the next part", [`Apply '${c}' now`, 'Return to its caller'], q + 1);
          if (predict) q++;
        }
        const was = i;
        if (comma) i++;
        frames.push({
          note: `The nested call returned ${tf(v)} → parts of '${c}' = [${call.parts.map(tf).join(',')}]. ${comma ? `s[${was}] is ',' → skip it; another part follows.` : `s[${i}] is ')' → the loop will stop.`}`,
          panels: view(comma ? { [was]: 'active' } : {}),
          predict,
        });
      }
      const close = i;
      i++; // skip ')'
      const r = c === '!' ? !call.parts[0] : c === '&' ? call.parts.every(Boolean) : call.parts.some(Boolean);
      let predict;
      if (q < 5) {
        predict = pick(`'${c}' has parts [${call.parts.map(tf).join(',')}]. What does it return?`, tf(r), [tf(!r)], q + 1, c === '!' ? '! flips its single part.' : c === '&' ? '& is true only if every part is true.' : '| is true if any part is true.');
        if (predict) q++;
      }
      frames.push({
        note: `Skip ')' (i++) — forgetting this would make the parent see it. Apply '${c}' to [${call.parts.map(tf).join(',')}] → ${tf(r)}.`,
        panels: view({ [close]: 'active' }, { returns: tf(r) }),
        predict,
      });
      calls.pop();
      return r;
    };
    const res = expr();
    frames.push({ note: `The outermost call returned → the expression is ${res ? 'true' : 'false'}. Every character is read once by the shared cursor → O(n) time, O(depth) call stack.`, panels: view({}, { answer: res ? 'true' : 'false' }) });
    frames.at(-1).result = res;
    return frames;
  },
};

// ───────────────────────── 3. Sort as preprocessing: H-Index ─────────────────────────
export const sortThenScanHIndex = {
  problem: { name: 'H-Index', statement: 'Return the largest h such that at least h papers have h or more citations each.', example: '[3, 0, 6, 1, 5] → 3', exampleOutput: 3, questionId: 'h-index' },
  title: 'Sort first, then scan: H-Index',
  description: 'Sort a copy of the citations descending; then the paper at position i has i + 1 papers with at least its citations, so h is the largest i + 1 with c[i] ≥ i + 1. Up to 8 papers; negatives become 0.',
  defaultInput: { citations: [3, 0, 6, 1, 5] },
  fields: [{ key: 'citations', type: 'numbers', label: 'citations' }],
  testInputs: [{ citations: [] }, { citations: [0] }, { citations: [5] }, { citations: [4, 4, 4, 4] }, { citations: [-2, 1, 1, 9, 3, 2, 7, 0, 8, 5] }],
  generate({ citations }) {
    const c = toInts(citations).map((x) => Math.max(0, x));
    const frames = [];
    frames.push({
      note: 'h = the largest h such that at least h papers have ≥ h citations. In this order you would have to count for every candidate h → O(n²).',
      panels: [arr(c, { label: 'citations (input)', showIndices: true }), vars({ h: 0 })],
    });
    const sorted = [...c].sort((a, b) => b - a); // a copy: the caller's array stays untouched
    frames.push({
      note: `Sort a copy descending: ${show(sorted)}. Now the paper at position i has i + 1 papers (itself and all before it) with at least c[i] citations.`,
      panels: [arr(c, { label: 'citations (input)' }), arr(sorted, { label: 'sorted ↓', showIndices: true }), vars({ h: 0 })],
    });
    let h = 0;
    let q = 0;
    let stopAt = -1;
    for (let i = 0; i < sorted.length; i++) {
      const ok = sorted[i] >= i + 1;
      let predict;
      if (i >= 1 && q < 3) {
        predict = pick(`c[${i}] = ${sorted[i]} and the target is i + 1 = ${i + 1}. What is h after this check?`, ok ? i + 1 : h, [ok ? h : i + 1, sorted[i], i], q + 2);
        if (predict) q++;
      }
      if (ok) h = i + 1;
      const hl = {};
      for (let k = 0; k < i; k++) hl[k] = 'done';
      hl[i] = ok ? 'active' : 'bad';
      frames.push({
        note: ok
          ? `c[${i}] = ${sorted[i]} ≥ ${i + 1} → ${i + 1} papers have ≥ ${i + 1} citations, so h = ${h}.`
          : `c[${i}] = ${sorted[i]} < ${i + 1} → only ${sorted[i]} citation(s) for the ${i + 1}th paper, so h cannot reach ${i + 1}.`,
        panels: [arr(c, { label: 'citations (input)' }), arr(sorted, { label: 'sorted ↓', showIndices: true, highlights: hl, pointers: [{ index: i, label: 'i', color: 'a' }] }), vars({ i, 'c[i]': sorted[i], 'i + 1': i + 1, h })],
        predict,
      });
      if (!ok) {
        stopAt = i;
        break;
      }
    }
    if (stopAt >= 0 && stopAt < sorted.length - 1) {
      const hl = {};
      for (let k = 0; k < sorted.length; k++) hl[k] = k < stopAt ? 'done' : 'muted';
      frames.push({
        note: 'Stop scanning: to the right citations only go down while the target i + 1 goes up, so no later check can pass. Sorting made this early stop safe.',
        panels: [arr(c, { label: 'citations (input)' }), arr(sorted, { label: 'sorted ↓', showIndices: true, highlights: hl }), vars({ h })],
      });
    }
    const hl = {};
    for (let k = 0; k < h; k++) hl[k] = 'done';
    frames.push({
      note: `H-Index = ${h}${c.length ? '' : ' (no papers)'}. The sort costs O(n log n) once; the scan after it is O(n).`,
      panels: [arr(c, { label: 'citations (input)' }), arr(sorted, { label: 'sorted ↓', showIndices: true, highlights: hl }), vars({ answer: h })],
    });
    frames.at(-1).result = h;
    return frames;
  },
};

// ───────────────────────── 4. Intervals: greedy by earliest end (non-overlapping intervals) ─────────────────────────
export const greedyEarliestEnd = {
  problem: { name: 'Non-overlapping Intervals', statement: 'Return the fewest intervals to remove so the rest do not overlap.', example: '[[1,3], [2,4], [3,5], [1,7], [5,6], [6,8]] → 2', exampleOutput: 2, questionId: 'non-overlapping-intervals' },
  title: 'Greedy by earliest end: non-overlapping intervals',
  description: 'Sort by end; keep an interval when it starts at or after lastEnd, otherwise skip it. Removals = n − kept. Up to 8 intervals; a reversed pair [5, 2] is read as [2, 5].',
  defaultInput: { intervals: [[1, 3], [2, 4], [3, 5], [1, 7], [5, 6], [6, 8]] },
  fields: [{ key: 'intervals', type: 'json', label: 'intervals' }],
  testInputs: [{ intervals: [] }, { intervals: [[1, 2]] }, { intervals: [[1, 2], [1, 2], [1, 2]] }, { intervals: [[-5, -1], [-3, 0], [0, 2], [7, 3]] }, { intervals: [[1, 2], [2, 3], [3, 4], [1, 3], [0, 9], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9]] }, { intervals: 'oops' }],
  generate({ intervals }) {
    const list = (Array.isArray(intervals) ? intervals : [])
      .filter((p) => Array.isArray(p) && p.length >= 2)
      .slice(0, 8)
      .map((p) => {
        const a = Math.trunc(Number(p[0]) || 0);
        const b = Math.trunc(Number(p[1]) || 0);
        return [Math.min(a, b), Math.max(a, b)];
      });
    const n = list.length;
    const min = n ? Math.min(...list.map((p) => p[0])) : 0;
    const max = n ? Math.max(Math.max(...list.map((p) => p[1])), min + 1) : 1;
    const frames = [];
    const panel = (items, label, states = []) => ({ kind: 'intervals', label, min, max, items: items.map(([start, end], k) => ({ start, end, state: states[k] || '' })) });
    frames.push({
      note: 'Goal: keep as many non-overlapping intervals as possible (removals = n − kept). Touching ends like [1,3] and [3,5] do NOT overlap here.',
      panels: [panel(list, 'input'), vars({ n })],
    });
    const sorted = list.toSorted((a, b) => a[1] - b[1]); // earliest end first; stable on ties
    const states = sorted.map(() => '');
    frames.push({
      note: 'Sort by END. The interval that finishes first leaves the most room for the rest, so it is always part of some best answer.',
      panels: [panel(sorted, 'sorted by end', states), vars({ kept: 0, lastEnd: '−∞' })],
    });
    let kept = 0;
    let lastEnd = -Infinity;
    let q = 0;
    const KEEP = 'Keep it';
    const SKIP = 'Skip it';
    const SWAP = 'Keep it and drop the last kept one';
    sorted.forEach(([s, e], k) => {
      const ok = s >= lastEnd;
      let predict;
      if (k >= 1 && q < 4) {
        predict = pick(`[${s}, ${e}] starts at ${s}; lastEnd = ${lastEnd}. What happens?`, ok ? KEEP : SKIP, [ok ? SKIP : KEEP, SWAP], q);
        if (predict) q++;
      }
      const shownEnd = lastEnd === -Infinity ? '−∞' : lastEnd;
      if (ok) {
        kept++;
        lastEnd = e;
      }
      states[k] = ok ? 'done' : 'bad';
      const cur = states.map((st, j) => (j === k ? (ok ? 'active' : 'bad') : st));
      frames.push({
        note: ok
          ? `${s} ≥ lastEnd ${shownEnd} → no clash with anything kept. Keep [${s}, ${e}]; lastEnd = ${e}.`
          : `${s} < lastEnd ${shownEnd} → it overlaps the last kept interval. Skip it: it ends at ${e} ≥ ${shownEnd}, so swapping would never leave more room.`,
        panels: [panel(sorted, 'sorted by end', cur), vars({ kept, lastEnd: lastEnd === -Infinity ? '−∞' : lastEnd })],
        predict,
      });
    });
    frames.push({
      note: `Kept ${kept} of ${n} → remove ${n - kept}. One sort O(n log n) plus one pass O(n); no search or DP needed.`,
      panels: [panel(sorted.filter((_, k) => states[k] === 'done'), 'kept', sorted.map(() => 'done')), vars({ kept, removals: n - kept })],
    });
    frames.at(-1).result = n - kept;
    return frames;
  },
};
