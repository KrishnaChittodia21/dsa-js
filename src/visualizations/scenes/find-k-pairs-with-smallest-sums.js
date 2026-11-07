// Scene: Find K Pairs with Smallest Sums. Row i pairs nums1[i] with every nums2[j]; each row is sorted, so only the
// front pair of each row can be the next cheapest. The heap is the waiting room of those row fronts. Reads a
// heap of [sum, i, j] items (toolkit PriorityQueue / MinHeap or a plain array named heap / pq) and the output.
const HEAPISH = /heap|^pq$|^q$|queue|^h$|prio|frontier|^minh/i;
const isItem = (x) => Array.isArray(x) && x.length >= 2 && x.every(Number.isFinite);

/** [name, items] of the heap: a toolkit object's heap array, or a heap-named plain array of number tuples */
function heapOf(vars, params) {
  for (const [k, v] of Object.entries(vars || {})) {
    if (params.includes(k)) continue;
    const arr = Array.isArray(v) && HEAPISH.test(k) ? v : Array.isArray(v?.$obj?.heap) ? v.$obj.heap : null;
    if (arr && arr.every(isItem)) return [k, arr];
  }
  return [null, null];
}
/** [name, pairs] of the answer list: a non-heap array of [a, b] pairs */
function outOf(vars, params, heapName) {
  const e = Object.entries(vars || {}).find(([k, v]) => k !== heapName && !params.includes(k) && !HEAPISH.test(k) && Array.isArray(v) && v.every((p) => Array.isArray(p) && p.length === 2));
  return e || [null, null];
}
function minus(a, b) {
  const left = b.map(String);
  return a.filter((p) => {
    const i = left.indexOf(String(p));
    if (i < 0) return true;
    left.splice(i, 1);
    return false;
  });
}
/** a heap item in words: "1 + 4 = 5 (row 0, col 1)" when it is [sum, i, j], else the raw tuple */
function say(item, a, b) {
  const [s, i, j] = item;
  if (item.length === 3 && Array.isArray(a) && Array.isArray(b) && a[i] + b[j] === s) return `${a[i]} + ${b[j]} = ${s} (row ${i}, col ${j})`;
  return `[${item.join(', ')}]`;
}

export default {
  id: 'find-k-pairs-with-smallest-sums',
  metaphor: 'Cheapest pair from each row’s front',
  caption: 'Row i pairs nums1[i] with nums2[0], nums2[1], …; each row gets dearer to the right. The heap holds the front pair of each row as [sum, i, j]; its top (index 0) is always the next cheapest pair.',
  narrate(ctx) {
    const [n1, n2, kName] = ctx.params;
    const a = ctx.vars[n1];
    const b = ctx.vars[n2];
    const [hName, heap] = heapOf(ctx.vars, ctx.params);
    const [pName, was] = heapOf(ctx.prev, ctx.params);
    const [oName, out] = outOf(ctx.vars, ctx.params, hName);
    const [, outWas] = outOf(ctx.prev, ctx.params, pName);
    if (ctx.ret && out) return `${out.length} cheapest pairs collected: ${out.map((p) => `(${p})`).join(' ')}`;
    if (hName && hName === pName) {
      const added = minus(heap, was);
      const gone = minus(was, heap);
      if (added.length === 1 && !gone.length) return `${say(added[0], a, b)} waits in the heap${heap.length > 1 ? ` (${heap.length} waiting)` : ''}`;
      if (gone.length === 1 && !added.length) return `cheapest waiting pair leaves the heap: ${say(gone[0], a, b)}`;
      if (gone.length === 1 && added.length === 1) return `${say(gone[0], a, b)} leaves the heap; ${say(added[0], a, b)} takes its row's place`;
    }
    if (out && Array.isArray(outWas) && out.length === outWas.length + 1) {
      const k = ctx.vars[kName];
      return `(${out[out.length - 1]}) joins the answer: ${out.length}${Number.isInteger(k) ? ` of ${k}` : ''} pairs`;
    }
    return null;
  },
  predict(ctx) {
    const [n1, n2] = ctx.params;
    const a = ctx.vars[n1];
    const b = ctx.vars[n2];
    const [hName, heap] = heapOf(ctx.vars, ctx.params);
    const [nName, after] = heapOf(ctx.next.vars, ctx.params);
    if (!hName || hName !== nName) return null;
    const added = minus(after, heap);
    const gone = minus(heap, after);
    // before a pop: which waiting pair is the cheapest?
    // (skipped on a tie: which of two equal sums comes out first is up to the heap)
    if (gone.length === 1 && !added.length && heap.length > 1 && heap.filter((x) => x[0] === gone[0][0]).length === 1) {
      const right = say(gone[0], a, b);
      const opts = [...new Set([right, ...heap.map((x) => say(x, a, b))])].slice(0, 4).sort();
      if (opts.length < 2) return null;
      return {
        question: `${heap.length} pairs wait in the heap. Which one is taken next?`,
        options: opts,
        answer: opts.indexOf(right),
        explain: `The heap's top is the smallest sum waiting: ${right}.`,
      };
    }
    // right after a pair is taken from row i: which pair of that row steps up?
    const [oName, out] = outOf(ctx.vars, ctx.params, hName);
    const [, outWas] = outOf(ctx.prev, ctx.params, hName);
    if (added.length === 1 && !gone.length && added[0].length === 3 && out && Array.isArray(outWas) && out.length === outWas.length + 1) {
      const [, i, j] = added[0];
      if (!Number.isInteger(i) || !Number.isInteger(j) || j < 1) return null;
      const pair = (r, c) => `row ${r}, col ${c}`;
      const right = pair(i, j);
      const opts = [...new Set([right, pair(i + 1, j - 1), pair(i + 1, j), pair(i, j + 1)])].sort();
      return {
        question: `(${out[out.length - 1]}) from row ${i}, col ${j - 1} was just taken. Which pair joins the heap?`,
        options: opts,
        answer: opts.indexOf(right),
        explain: `The next pair in the same row: ${say(added[0], a, b)}. Every other row already has its front pair waiting, so nothing is pushed twice.`,
      };
    }
    return null;
  },
  bugs: [
    {
      label: 'Max-heap: biggest sum first',
      find: 'a[0] - b[0]',
      replace: 'b[0] - a[0]',
      explain: 'The comparator puts the largest sum on top, so each pop takes the dearest waiting pair instead of the cheapest.',
    },
    {
      label: 'Row runs past its end',
      find: 'j + 1 < nums2.length',
      replace: 'j + 1 <= nums2.length',
      explain: 'After the last column the row pushes a pair with nums2[j + 1] = undefined, so a bogus pair can be taken.',
    },
  ],
};
