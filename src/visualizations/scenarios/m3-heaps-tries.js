import { layoutHeap, layoutNary } from '../layout.js';

const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const stack = (values, label) => ({ kind: 'stack', values, label });
const ask = (question, options, answer, explain) => ({ question, options, answer, explain });
// Distinct options with the correct one placed at index pos % n; null if fewer than 2 distinct options.
const pick = (question, correct, wrong, pos = 0, explain) => {
  const c = String(correct);
  const w = [...new Set(wrong.map(String))].filter((o) => o !== c).slice(0, 3);
  if (!w.length) return null;
  const at = pos % (w.length + 1);
  return ask(question, [...w.slice(0, at), c, ...w.slice(at)], at, explain);
};
const attach = (frames, p) => {
  if (p && frames.length > 1) frames[frames.length - 1].predict = p;
};
const clampInt = (v, lo, hi) => Math.max(lo, Math.min(hi, Math.round(v)));
const numbers = (xs) => (Array.isArray(xs) ? xs : []).map(Number).filter(Number.isFinite);

// Array-backed binary heap; `less(a, b)` = a belongs above b. push/pop return the moved item's final index.
function makeHeap(less) {
  const a = [];
  const up = (i) => {
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (!less(a[i], a[p])) break;
      [a[i], a[p]] = [a[p], a[i]];
      i = p;
    }
    return i;
  };
  return {
    a,
    size: () => a.length,
    peek: () => a[0],
    push(x) {
      a.push(x);
      return up(a.length - 1);
    },
    pop() {
      const top = a[0];
      const last = a.pop();
      if (a.length) {
        a[0] = last;
        let i = 0;
        for (;;) {
          const l = 2 * i + 1;
          const r = l + 1;
          let m = i;
          if (l < a.length && less(a[l], a[m])) m = l;
          if (r < a.length && less(a[r], a[m])) m = r;
          if (m === i) break;
          [a[i], a[m]] = [a[m], a[i]];
          i = m;
        }
      }
      return top;
    },
  };
}

const heapPanel = (items, states = {}, label, show = (x) => x) => {
  const L = layoutHeap(items.map(show));
  return {
    kind: 'nodes',
    nodes: L.nodes.map((n) => ({ id: n.id, label: String(n.val), x: n.x, y: n.y, state: states[n.id] || '' })),
    edges: L.edges.map(([a, b]) => ({ from: a, to: b, state: '' })),
    directed: false,
    label,
  };
};

// Trie drawn from its FINAL shape (layout computed once) so nodes never move; states hide the rest.
function triePanel(root, states, label, getLabel) {
  const toTree = (n) => ({ id: n.id, label: n.id, children: n.kids.map(toTree) });
  const L = layoutNary(toTree(root));
  const byId = {};
  const walk = (n) => {
    byId[n.id] = n;
    n.kids.forEach(walk);
  };
  walk(root);
  return {
    kind: 'nodes',
    nodes: L.nodes.map((n) => ({ id: n.id, label: getLabel(byId[n.id]), x: n.x, y: n.y, state: states[n.id] ?? '' })),
    edges: L.edges.map(([a, b]) => ({ from: a, to: b, state: states[b] === 'muted' || states[b] === 'hidden' ? 'muted' : '' })),
    directed: true,
    label,
  };
}

// ---------------------------------------------------------------------------
// Two heaps: running median.
// ---------------------------------------------------------------------------
export const twoHeapsMedian = {
  title: 'Two heaps: running median',
  description:
    'Find median from data stream: low is a max-heap of the smaller half, high a min-heap of the larger half. Each add pushes to low, moves low’s top to high, and rebalances so low has the extra element. Input is clamped to 8 integers in −99..99.',
  defaultInput: { nums: [5, 2, 8, 3, 9] },
  fields: [{ key: 'nums', type: 'numbers', label: 'stream (≤ 8)' }],
  testInputs: [{ nums: [] }, { nums: [7] }, { nums: [4, 4, 4, 4] }, { nums: [9, 8, 7, 6, 5, 4, 3, 2, 1] }, { nums: [1, 2] }],
  generate({ nums }) {
    const xs = numbers(nums).map((v) => clampInt(v, -99, 99)).slice(0, 8);
    const low = makeHeap((a, b) => a > b);
    const high = makeHeap((a, b) => a < b);
    const medians = [];
    const frames = [];
    const median = () => (low.size() > high.size() ? low.peek() : (low.peek() + high.peek()) / 2);
    const snap = (note, k, ls = {}, hs = {}) =>
      frames.push({
        note,
        panels: [
          arr(xs, { label: 'stream', pointers: k >= 0 ? [{ index: k, label: 'x', color: 'a' }] : [], highlights: Object.fromEntries(xs.map((_, i) => [i, i < k ? 'done' : i === k ? 'active' : 'muted'])) }),
          heapPanel(low.a, ls, `low · max-heap (${low.size()})`),
          heapPanel(high.a, hs, `high · min-heap (${high.size()})`),
          vars({ 'low size': low.size(), 'high size': high.size(), medians: medians.join(', ') || '—' }),
        ],
      });
    snap(xs.length ? 'Two empty heaps. low keeps the smaller half (top = its largest), high keeps the larger half (top = its smallest).' : 'The stream is empty — nothing to add.', -1);
    let asks = 0;
    xs.forEach((x, k) => {
      const i1 = low.push(x);
      snap(`add(${x}): push ${x} into low first.`, k, { [i1]: 'active' });
      const moved = low.pop();
      const i2 = high.push(moved);
      snap(`Move low’s top (${moved}) to high. It is the biggest of the small half, so every value in low stays ≤ every value in high.`, k, {}, { [i2]: 'active' });
      if (k === 1 || k === 3) {
        const others = [x, ...low.a, ...high.a.filter((v) => v !== moved)].filter((v) => v !== moved);
        attach(frames, pick(`We just pushed ${x} into low (low = {${[...low.a, moved].sort((a, b) => a - b).join(', ')}}). Which value moves to high?`, moved, [...others, moved + 1], asks++, 'low is a max-heap, so pop() gives its largest value.'));
      }
      const lowN = low.size();
      const highN = high.size();
      const needs = highN > lowN;
      if (needs) {
        const back = high.pop();
        const i3 = low.push(back);
        snap(`high now has ${highN}, low ${lowN}: high is bigger → move high’s top (${back}) back to low. low may hold one extra, never high.`, k, { [i3]: 'active' });
      } else {
        snap(`low has ${lowN}, high has ${highN} — high is not bigger, so no rebalance.`, k);
      }
      if (k >= 1 && k <= 3) attach(frames, ask(`After the move, low has ${lowN} and high has ${highN}. Do we rebalance?`, ['Yes — move high’s top back to low', 'No — sizes are fine'], needs ? 0 : 1, 'Rebalance only when high is bigger; low is allowed one extra.'));
      const m = median();
      medians.push(m);
      snap(`Median = ${low.size() > high.size() ? `low’s top (odd count) = ${m}` : `(low top ${low.peek()} + high top ${high.peek()}) / 2 = ${m}`}.`, k, { 0: 'done' }, low.size() > high.size() ? {} : { 0: 'done' });
      if (k === 2 || k === xs.length - 1) {
        if (k === xs.length - 1 && k === 2) return;
        const alt = low.size() > high.size() ? [(low.peek() + (high.peek() ?? low.peek())) / 2, high.peek() ?? low.peek() + 1, x] : [low.peek(), high.peek(), x];
        attach(frames, pick(`low top = ${low.peek()}, high top = ${high.peek() ?? '—'}, sizes ${low.size()} / ${high.size()}. What is the median?`, m, alt, k, 'Odd total → low’s top; even total → average of the two tops.'));
      }
    });
    frames.push({
      note: xs.length ? `Medians after each add: ${medians.join(', ')}. Each add is O(log n) (three heap ops at most); median() is O(1).` : 'No values → no median. Each add would be O(log n); median() is O(1).',
      panels: [arr(medians, { label: 'running medians', highlights: Object.fromEntries(medians.map((_, i) => [i, 'done'])) }), heapPanel(low.a, { 0: 'done' }, 'low · max-heap'), heapPanel(high.a, { 0: 'done' }, 'high · min-heap')],
    });
    return frames;
  },
};

// ---------------------------------------------------------------------------
// K-way merge with a heap of heads.
// ---------------------------------------------------------------------------
export const kWayMergeHeap = {
  title: 'K-way merge: heap of list heads',
  description:
    'Merge k sorted lists: the min-heap holds one head per list as {val, i, j}; pop the smallest, output it, push its successor from the same list. Input is clamped to 4 lists and 8 integers (−99..99) in total; each list is sorted first.',
  defaultInput: { lists: [[1, 4, 7], [2, 6], [3, 5, 8]] },
  fields: [{ key: 'lists', type: 'json', label: 'lists (≤ 4, ≤ 8 numbers total)' }],
  testInputs: [{ lists: [] }, { lists: [[], [3]] }, { lists: [[2, 2], [2], [1, 2]] }, { lists: [[5, 1, 9, 9, 9], [4, 4, 4, 4, 4], [0]] }, { lists: 'oops' }],
  generate({ lists }) {
    let budget = 8;
    const L = (Array.isArray(lists) ? lists : []).slice(0, 4).map((l) => {
      const v = numbers(l).map((x) => clampInt(x, -99, 99)).sort((a, b) => a - b).slice(0, budget);
      budget -= v.length;
      return v;
    });
    const frames = [];
    const out = [];
    const heap = makeHeap((a, b) => a.val < b.val || (a.val === b.val && a.i < b.i));
    const cols = Math.max(1, ...L.map((l) => l.length));
    const inHeap = () => new Set(heap.a.map((e) => `${e.i},${e.j}`));
    const used = new Set();
    const snap = (note, hs = {}) => {
      const h = inHeap();
      frames.push({
        note,
        panels: [
          {
            kind: 'table',
            label: 'lists (row i, column j)',
            cells: L.length ? L.map((l) => Array.from({ length: cols }, (_, j) => (j < l.length ? l[j] : ''))) : [['']],
            states: L.map((l, i) => Array.from({ length: cols }, (_, j) => (j >= l.length ? '' : used.has(`${i},${j}`) ? 'done' : h.has(`${i},${j}`) ? 'active' : ''))),
            rowLabels: L.length ? L.map((_, i) => `L${i}`) : ['—'],
            colLabels: Array.from({ length: cols }, (_, j) => String(j)),
          },
          heapPanel(heap.a, hs, `min-heap of heads (${heap.size()})`, (e) => e.val),
          arr([...out], { label: 'out' }),
          vars({ k: L.length, 'heap size': heap.size() }),
        ],
      });
    };
    snap(L.length ? `${L.length} sorted lists. Seed the heap with the head (j = 0) of every non-empty list.` : 'No lists — nothing to merge.');
    L.forEach((l, i) => {
      if (!l.length) return snap(`L${i} is empty → skip it (never push a missing head).`);
      const at = heap.push({ val: l[0], i, j: 0 });
      snap(`Push L${i}’s head ${l[0]} (remember i = ${i}, j = 0 so we can find its successor later).`, { [at]: 'active' });
    });
    let popAsks = 0;
    let succAsks = 0;
    while (heap.size()) {
      const choices = heap.a.map((e) => e.val);
      const { val, i, j } = heap.pop();
      used.add(`${i},${j}`);
      out.push(val);
      snap(`Pop the smallest head: ${val} from L${i} → append to out. The heap only compares k heads, so this is O(log k).`);
      if (popAsks < 2 && out.length > 1 && new Set(choices).size > 1) attach(frames, pick(`The heap holds the heads {${[...choices].sort((a, b) => a - b).join(', ')}}. Which value is popped next?`, val, choices, popAsks++ + 1, 'A min-heap pops its smallest value.'));
      const has = j + 1 < L[i].length;
      if (has) {
        const at = heap.push({ val: L[i][j + 1], i, j: j + 1 });
        snap(`Push ${val}’s successor from the same list: L${i}[${j + 1}] = ${L[i][j + 1]}.`, { [at]: 'active' });
      } else snap(`L${i} has no element after index ${j} → push nothing; the heap shrinks.`);
      if (succAsks < 2 && out.length >= 2 && heap.size()) {
        const other = L.flatMap((l, li) => l.filter((_, lj) => li !== i && !used.has(`${li},${lj}`)));
        attach(frames, pick(`We popped ${val} from L${i}. What do we push now?`, has ? `${L[i][j + 1]} (next in L${i})` : 'Nothing — L' + i + ' is used up', [has ? 'Nothing — wait until the heap is empty' : `${other[0] ?? val} (smallest left elsewhere)`, `${Math.min(...(other.length ? other : [val + 1]))} (smallest left in any list)`, has ? `${L[i][0]} again` : `${val} again`], succAsks++ * 2, 'Only the popped list advances: its successor is the one new candidate.'));
      }
    }
    frames.push({
      note: out.length ? `Merged: [${out.join(', ')}]. N = ${out.length} elements each pass through a heap of at most k = ${L.length} → O(N log k) time, O(k) heap space.` : 'Nothing to merge → out = []. In general O(N log k).',
      panels: [arr(out, { label: 'out (merged)', highlights: Object.fromEntries(out.map((_, x) => [x, 'done'])) }), vars({ N: out.length, k: L.length })],
    });
    return frames;
  },
};

// ---------------------------------------------------------------------------
// Greedy simulation: last stone weight (pop two, combine, push back).
// ---------------------------------------------------------------------------
export const lastStoneWeightHeap = {
  title: 'Greedy heap: last stone weight',
  description:
    'Last stone weight: a max-heap keeps the heaviest stones on top; each turn pop the two heaviest, smash them, and push back the difference if any. Input is clamped to 7 stones of weight 1..99.',
  defaultInput: { stones: [2, 7, 4, 1, 8, 1] },
  fields: [{ key: 'stones', type: 'numbers', label: 'stones (≤ 7)' }],
  testInputs: [{ stones: [] }, { stones: [5] }, { stones: [3, 3] }, { stones: [4, 4, 4, 4] }, { stones: [10, 1, 1, 1, 1, 1, 1, 1, 1] }],
  generate({ stones }) {
    const xs = numbers(stones).map((v) => clampInt(v, 1, 99)).slice(0, 7);
    const heap = makeHeap((a, b) => a > b);
    const frames = [];
    const smashed = [];
    const snap = (note, hs = {}, v = {}) =>
      frames.push({ note, panels: [arr(xs, { label: 'stones' }), heapPanel(heap.a, hs, `max-heap (${heap.size()})`), arr([...smashed], { label: 'turns' }), vars({ size: heap.size(), ...v })] });
    snap(xs.length ? 'Each turn must smash the two HEAVIEST stones, and the set keeps changing → a max-heap gives the heaviest in O(log n).' : 'No stones at all.');
    for (const x of xs) heap.push(x);
    snap(xs.length ? `Push all ${xs.length} stones into the max-heap. The root ${heap.peek()} is the heaviest.` : 'The heap stays empty.', { 0: 'active' });
    let turn = 0;
    while (heap.size() > 1) {
      const top3 = [...heap.a].sort((a, b) => b - a);
      const a = heap.pop();
      const b = heap.pop();
      snap(`Pop the two heaviest: a = ${a}, b = ${b}.`, {}, { a, b });
      if (turn === 1 || turn === 3) attach(frames, pick(`Heap = {${top3.join(', ')}}. Which two stones are smashed this turn?`, `${a} and ${b}`, [`${top3[top3.length - 1]} and ${top3[top3.length - 2] ?? a}`, `${a} and ${top3[top3.length - 1]}`, `${b} and ${top3[2] ?? a}`], turn, 'The rule always takes the two heaviest — the top of the max-heap, twice.'));
      const rest = a - b;
      if (rest) {
        const at = heap.push(rest);
        smashed.push(`${a}-${b}`);
        snap(`${a} ≠ ${b}: both break, a stone of ${a} − ${b} = ${rest} is left → push it back.`, { [at]: 'active' }, { a, b, rest });
      } else {
        smashed.push(`${a}=${b}`);
        snap(`${a} = ${b}: both are destroyed → push nothing.`, {}, { a, b, rest: 0 });
      }
      if (turn === 0 || turn === 2 || (turn === 4 && rest === 0)) attach(frames, pick(`We smash ${a} and ${b}. What goes back into the heap?`, rest ? `${rest}` : 'Nothing', [rest ? 'Nothing' : '0', `${a + b}`, rest ? `${a}` : `${a}`], turn + (rest ? 0 : 1), 'Equal stones vanish; otherwise only the difference survives.'));
      turn++;
    }
    const ans = heap.size() ? heap.peek() : 0;
    frames.push({
      note: `${heap.size() ? `One stone left → answer ${ans}.` : 'No stones left → answer 0.'} Each turn is O(log n) and there are at most n − 1 turns → O(n log n).`,
      panels: [heapPanel(heap.a, { 0: 'done' }, 'max-heap'), arr([...smashed], { label: 'turns' }), vars({ answer: ans })],
    });
    return frames;
  },
};

// ---------------------------------------------------------------------------
// Trie: wildcard search with DFS.
// ---------------------------------------------------------------------------
function buildCharTrie(words) {
  let id = 0;
  const root = { id: id++, ch: '∅', kids: [], map: new Map(), isEnd: false, word: null };
  for (const w of words) {
    let n = root;
    for (const ch of w) {
      if (!n.map.has(ch)) {
        const k = { id: id++, ch, kids: [], map: new Map(), isEnd: false, word: null };
        n.map.set(ch, k);
        n.kids.push(k);
      }
      n = n.map.get(ch);
    }
    n.isEnd = true;
    n.word = w;
  }
  return { root, size: id };
}
// Keep words (a-z, ≤ maxLen) while the trie stays within maxNodes.
function cleanWords(words, maxWords, maxLen, maxNodes) {
  const ws = (Array.isArray(words) ? words : []).map((w) => String(w).toLowerCase().replace(/[^a-z]/g, '')).filter((w) => w && w.length <= maxLen);
  const kept = [];
  for (const w of ws) {
    if (kept.length >= maxWords || kept.includes(w)) continue;
    if (buildCharTrie([...kept, w]).size <= maxNodes) kept.push(w);
  }
  return kept;
}

export const trieWildcardSearch = {
  title: 'Trie: wildcard search (DFS on ".")',
  description:
    'Add and search words: a letter follows one child, a "." tries EVERY child with DFS, and the answer at the end of the query is node.isEnd. Words are clamped to 5 lowercase words; longer words than 3 letters are dropped (≤ 12 trie nodes); the query to 3 characters of a-z or ".".',
  defaultInput: { words: ['bat', 'dad', 'mad'], word: '.ad' },
  fields: [
    { key: 'words', type: 'strings', label: 'dictionary (≤ 5, ≤ 3 letters)' },
    { key: 'word', type: 'string', label: 'query (≤ 3, "." = any)' },
  ],
  testInputs: [
    { words: [], word: '.' },
    { words: ['a'], word: '' },
    { words: ['ab', 'ab', 'ac'], word: 'a.' },
    { words: ['bad', 'dad'], word: '..x' },
    { words: ['cat', 'car', 'ca'], word: '...' },
    { words: ['hello', 'world'], word: 'w.r' },
  ],
  generate({ words, word }) {
    const ws = cleanWords(words, 5, 3, 12);
    const q = String(word ?? '').toLowerCase().replace(/[^a-z.]/g, '').slice(0, 3);
    const { root } = buildCharTrie(ws);
    const frames = [];
    const states = {};
    const calls = [];
    const label = (n) => n.ch + (n.isEnd ? '●' : '');
    const snap = (note, i) =>
      frames.push({
        note,
        panels: [
          triePanel(root, { ...states }, 'trie (● = isEnd)', label),
          arr(q.length ? q.split('') : [''], { label: 'query', pointers: i >= 0 && i < q.length ? [{ index: i, label: 'i', color: 'a' }] : [], highlights: Object.fromEntries(q.split('').map((_, k) => [k, i < 0 ? '' : k < i ? 'done' : k === i ? 'active' : ''])) }),
          stack([...calls], 'calls'),
        ],
      });
    snap(`Dictionary [${ws.join(', ') || '—'}] is in the trie. Search "${q}": start match(root, 0).`, 0);
    let asks = { tryNext: false, end: false, letter: false, miss: false };
    const match = (node, i) => {
      calls.push(`match(${node.ch}, ${i})`);
      states[node.id] = 'active';
      let res;
      if (i === q.length) {
        res = node.isEnd;
        states[node.id] = res ? 'done' : 'bad';
        snap(`i = ${i} = query length → return node.isEnd = ${res}${res ? ` ("${node.word}" ends here)` : ' (a prefix, not a word)'}.`, i);
        if (!asks.end && i > 0) {
          asks.end = true;
          attach(frames, ask(`The whole query is used up at node '${node.ch}'. What does match return?`, ['true — we reached a node', 'false — keep searching deeper', `node.isEnd (${res})`], 2, 'Reaching a node only proves a prefix exists; it must also be the end of a word.'));
        }
      } else if (q[i] === '.') {
        snap(`'.' at i = ${i}: it can be any letter → try every child of '${node.ch}' (${node.kids.map((k) => k.ch).join(', ') || 'none'}).`, i);
        res = false;
        for (let c = 0; c < node.kids.length && !res; c++) {
          const kid = node.kids[c];
          res = match(kid, i + 1);
          if (!res) {
            states[kid.id] = 'bad';
            const next = node.kids[c + 1];
            states[node.id] = 'active';
            snap(next ? `Branch '${kid.ch}' failed → back at '${node.ch}', try the next child '${next.ch}'.` : `Branch '${kid.ch}' failed and '${node.ch}' has no more children → return false.`, i);
            if (next && !asks.tryNext) {
              asks.tryNext = true;
              attach(frames, ask(`Under '.', branch '${kid.ch}' just returned false. What does match do?`, [`Try the next child '${next.ch}'`, 'Return false — the query cannot match', 'Restart from the root'], 0, 'One failed child says nothing about its siblings — "." must try them all.'));
            }
          }
        }
        if (!node.kids.length) snap(`'${node.ch}' has no children → '.' has nothing to match → return false.`, i);
      } else {
        const next = node.map.get(q[i]);
        if (!next) {
          states[node.id] = 'bad';
          snap(`Letter '${q[i]}' at i = ${i}: '${node.ch}' has no child '${q[i]}' → return false (prune: nothing below can match).`, i);
          res = false;
          if (!asks.miss && node.kids.length) {
            asks.miss = true;
            attach(frames, ask(`At node '${node.ch}' (children: ${node.kids.map((k) => k.ch).join(', ')}) the query needs the letter '${q[i]}'. What happens?`, [`Follow '${node.kids[0].ch}' — any child will do`, `Return false for this branch`, 'Return true — the prefix matched so far'], 1, 'Only "." may match any child; a letter with no matching child fails right here.'));
          }
        } else {
          states[node.id] = 'visited';
          states[next.id] = 'active';
          snap(`Letter '${q[i]}' at i = ${i}: a normal trie step — follow the one child '${q[i]}' of '${node.ch}'.`, i);
          if (!asks.letter && i > 0 && node.kids.length > 1) {
            asks.letter = true;
            attach(frames, ask(`At node '${node.ch}', the query letter is '${q[i]}'. How many children do we explore?`, [`All ${node.kids.length} children, like '.'`, 'None — letters are checked at the end', `Only child '${q[i]}'`], 2, 'Only "." branches; a letter follows exactly one edge.'));
          }
          res = match(next, i + 1);
        }
      }
      if (res) states[node.id] = 'done';
      else if (states[node.id] === 'active') states[node.id] = 'visited';
      calls.pop();
      return res;
    };
    const found = match(root, 0);
    frames.push({
      note: `search("${q}") = ${found}. A letter follows one edge; each "." multiplies the work by the number of children, but the trie prunes every dead prefix. Time O(L) without dots, up to O(nodes) with them.`,
      panels: [triePanel(root, { ...states }, 'trie (● = isEnd)', label), vars({ query: q || '""', result: found })],
    });
    return frames;
  },
};

// ---------------------------------------------------------------------------
// Binary trie: maximum XOR of two numbers.
// ---------------------------------------------------------------------------
const BITS = 3;
const bin = (x) => x.toString(2).padStart(BITS, '0');

export const trieMaxXor = {
  title: 'Binary trie: maximum XOR (take the opposite bit)',
  description:
    'Maximum XOR of two numbers: numbers go into a bit trie from the highest bit down; for each x walk the trie preferring the OPPOSITE bit, then insert x. Input is clamped to 5 integers in 0..7 (3 bits) so the trie stays small.',
  defaultInput: { nums: [3, 5, 6, 1] },
  fields: [{ key: 'nums', type: 'numbers', label: 'nums (≤ 5, each 0..7)' }],
  testInputs: [{ nums: [] }, { nums: [4] }, { nums: [2, 2, 2] }, { nums: [0, 7] }, { nums: [9, -1, 1, 2, 3, 4, 5] }],
  generate({ nums }) {
    const xs = numbers(nums).map((v) => clampInt(v, 0, 7)).slice(0, 5);
    // Build the final trie first (for a stable layout); `added` tracks which nodes exist so far.
    let id = 0;
    const root = { id: id++, bit: '∅', kids: [], c: [null, null] };
    const pathOf = (x) => {
      const ids = [];
      let n = root;
      for (let b = BITS - 1; b >= 0; b--) {
        const bit = (x >> b) & 1;
        if (!n.c[bit]) {
          n.c[bit] = { id: id++, bit: String(bit), kids: [], c: [null, null] };
          n.kids = n.c.filter(Boolean);
        }
        n = n.c[bit];
        ids.push(n.id);
      }
      return ids;
    };
    xs.forEach(pathOf);
    const added = new Set([0]);
    const states = {};
    const frames = [];
    let best = 0;
    const panel = (extra = {}) => {
      const s = {};
      for (let k = 0; k < id; k++) s[k] = added.has(k) ? states[k] || '' : 'hidden';
      return triePanel(root, { ...s, ...extra }, 'bit trie (high bit → low bit)', (n) => n.bit);
    };
    const snap = (note, k, extra, v = {}) =>
      frames.push({ note, panels: [panel(extra), arr(xs, { label: 'nums', pointers: k >= 0 ? [{ index: k, label: 'x', color: 'a' }] : [] }), vars({ best: `${bin(best)} (${best})`, ...v })] });
    const insert = (x) => pathOf(x).forEach((n) => added.add(n));
    snap(xs.length ? `Max XOR over all pairs. Each number is ${BITS} bits; a higher bit is worth more than all lower bits together, so we win bits greedily from the top.` : 'No numbers → best stays 0.', -1);
    if (xs.length) {
      insert(xs[0]);
      snap(`Insert nums[0] = ${xs[0]} (${bin(xs[0])}) first, so the very first query has something to walk.`, 0, Object.fromEntries(pathOf(xs[0]).map((n) => [n, 'active'])));
    }
    let asks = 0;
    xs.forEach((x, k) => {
      let n = root;
      let cur = 0;
      const path = {};
      for (let b = BITS - 1; b >= 0; b--) {
        const xb = (x >> b) & 1;
        const want = xb ^ 1;
        const has = !!n.c[want] && added.has(n.c[want].id);
        if (has) {
          cur |= 1 << b;
          n = n.c[want];
        } else n = n.c[want ^ 1];
        path[n.id] = 'active';
        snap(`x = ${bin(x)}, bit ${b} of x is ${xb} → want ${want}. ${has ? `Child ${want} exists → take it; XOR bit ${b} = 1.` : `No child ${want} → forced to take ${want ^ 1}; XOR bit ${b} = 0.`}`, k, { ...path }, { x: `${bin(x)} (${x})`, want, cur: bin(cur) });
        if (k >= 1 && asks < 3 && (b === BITS - 1 || !has) && (k + b) % 2 === 1) {
          attach(frames, ask(`x = ${bin(x)}, bit ${b} is ${xb}, so we want a ${want}. Which way does the walk go?`, [`Go to child ${want} — XOR bit ${b} becomes 1`, `Go to child ${xb} — XOR bit ${b} is 0`, 'Stop — the answer is already known'], has ? 0 : 1, 'Prefer the opposite bit when that child exists; otherwise follow the only child.'));
          asks++;
        }
      }
      const prev = best;
      best = Math.max(best, cur);
      insert(x);
      snap(`Best partner gives ${bin(cur)} (${cur}). best = max(${prev}, ${cur}) = ${best}. Now insert ${x} so later numbers can pair with it.`, k, Object.fromEntries(pathOf(x).map((p) => [p, 'done'])), { x: `${bin(x)} (${x})`, cur: bin(cur) });
      if (k === xs.length - 1 && k >= 1) attach(frames, pick(`The walk for x = ${bin(x)} built cur = ${bin(cur)}. What is best after this number?`, best, [prev, cur ^ 7, best + 1, x], 2, 'best keeps the maximum cur seen so far.'));
    });
    frames.push({
      note: `Maximum XOR = ${best} (${bin(best)}). Each insert and query walks ${BITS} bits (31 in the real problem) → O(n · bits) instead of O(n²) pairs.`,
      panels: [panel(), vars({ answer: `${bin(best)} (${best})` })],
    });
    return frames;
  },
};

// ---------------------------------------------------------------------------
// Word search II: grid backtracking guided by a trie.
// ---------------------------------------------------------------------------
export const trieWordSearchGrid = {
  title: 'Word search II: grid DFS guided by a trie',
  description:
    'Find all dictionary words in a grid: one DFS walks the board and the trie together, stops as soon as the trie has no child for the next letter, records node.word once, and deletes dead leaves. Board clamped to 3×4 letters, rows trimmed to the shortest; up to 4 lowercase words, words longer than 3 letters dropped (≤ 12 trie nodes).',
  defaultInput: { board: ['oat', 'eta', 'ihe'], words: ['oat', 'eat', 'tea'] },
  fields: [
    { key: 'board', type: 'strings', label: 'board rows (≤ 3 × 4)' },
    { key: 'words', type: 'strings', label: 'words (≤ 4, ≤ 3 letters)' },
  ],
  testInputs: [
    { board: [], words: ['a'] },
    { board: ['a'], words: ['a', 'a'] },
    { board: ['ab', 'cd'], words: ['xyz'] },
    { board: ['aaaa', 'aaaa', 'aaaa', 'aaaa'], words: ['aaa', 'aa'] },
    { board: ['ab', 'c'], words: ['abc', 'ac'] },
    { board: ['oat'], words: [] },
  ],
  generate({ board, words }) {
    const rows = (Array.isArray(board) ? board : []).map((r) => (Array.isArray(r) ? r.join('') : String(r)).toLowerCase().replace(/[^a-z]/g, '').slice(0, 4)).filter(Boolean).slice(0, 3);
    const C = rows.length ? Math.min(...rows.map((r) => r.length)) : 0;
    const g = rows.map((r) => r.slice(0, C).split(''));
    const R = C ? g.length : 0;
    const ws = cleanWords(words, 4, 3, 12);
    const { root } = buildCharTrie(ws);
    const frames = [];
    const found = [];
    const tstates = {};
    const deleted = new Set();
    const pathCells = [];
    const label = (n) => n.ch + (n.word ? '●' : '');
    const snap = (note, cur, v = {}) => {
      const st = g.map((row) => row.map(() => ''));
      pathCells.forEach(([r, c]) => (st[r][c] = 'visited'));
      if (cur) st[cur[0]][cur[1]] = cur[2] || 'active';
      const ts = { ...tstates };
      deleted.forEach((d) => (ts[d] = 'muted'));
      frames.push({
        note,
        panels: [
          { kind: 'grid', cells: R ? g.map((row) => [...row]) : [['']], states: R ? st : [['']], label: 'board' },
          triePanel(root, ts, 'trie (● = node.word)', label),
          arr(found.length ? [...found] : [], { label: 'found' }),
          vars({ path: pathCells.map((p) => p[2]).join('') || '—', ...v }),
        ],
      });
    };
    snap(R && ws.length ? `Build one trie of [${ws.join(', ')}] and run ONE grid DFS from every cell, walking the trie alongside.` : 'An empty board or an empty dictionary — no word can be found.');
    let asks = { prune: 0, rec: false, del: false };
    const pathNodes = [];
    const setPath = () => {
      for (const k of Object.keys(tstates)) if (tstates[k] === 'active') tstates[k] = '';
      pathNodes.forEach((n) => (tstates[n.id] = 'active'));
    };
    const dfs = (r, c, parent) => {
      const ch = g[r][c];
      const node = parent.map.get(ch);
      if (!node) {
        snap(`(${r},${c}) = '${ch}': '${parent.ch}' has no child '${ch}' → prune, no word continues this way.`, [r, c, 'bad']);
        if (asks.prune < 1 && parent !== root && parent.map.size) {
          asks.prune++;
          attach(frames, ask(`Path "${pathCells.map((p) => p[2]).join('')}" sits at trie node '${parent.ch}' (children: ${[...parent.map.keys()].join(', ')}). The neighbour is '${ch}'. What happens?`, [`Step onto '${ch}' and keep exploring`, 'Prune — no word has this prefix', 'Record the path as a word'], 1, 'The trie says no word continues with this letter, so the whole branch is skipped.'));
        }
        return;
      }
      pathCells.push([r, c, ch]);
      pathNodes.push(node);
      setPath();
      if (node.word) {
        const w = node.word;
        found.push(w);
        node.word = null;
        tstates[node.id] = 'done';
        snap(`(${r},${c}) = '${ch}' reaches node.word = "${w}" → record it and set node.word = null so a second path cannot add it again.`, [r, c, 'done']);
        if (!asks.rec) {
          asks.rec = true;
          attach(frames, ask(`The path now spells "${w}", a dictionary word. What do we do with node.word?`, ['Record it and keep it, to count every path', 'Nothing — words are collected at the end', 'Record it, then set node.word = null'], 2, 'Nulling node.word records each word once even if the grid spells it twice.'));
        }
      } else snap(`(${r},${c}) = '${ch}' matches a trie child → mark the cell '#' and explore its neighbours.`, [r, c]);
      g[r][c] = '#';
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nc >= 0 && nr < R && nc < C && g[nr][nc] !== '#') dfs(nr, nc, node);
      }
      g[r][c] = ch;
      pathCells.pop();
      pathNodes.pop();
      setPath();
      if (tstates[node.id] !== 'done') tstates[node.id] = 'visited';
      if (node.map.size === 0 && !node.word) {
        parent.map.delete(ch);
        deleted.add(node.id);
        snap(`Un-mark (${r},${c}). Node '${ch}' has no children and no word left → delete it from '${parent.ch}', so later searches never come here again.`, [r, c, 'muted']);
        if (!asks.del && found.length) {
          asks.del = true;
          attach(frames, ask(`Back at '${ch}' after exploring: it has no children and its word was already recorded. What happens to the trie node?`, ['Delete it from its parent — it is a dead leaf', 'Keep it for the next start cell', 'Mark the word as found again'], 0, 'Dead leaves can never lead to a new word; removing them prunes future paths.'));
        }
      } else snap(`Done exploring from (${r},${c}) → un-mark it (backtrack) so other paths may use it.`);
    };
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) dfs(r, c, root);
    frames.push({
      note: `Found ${found.length ? `[${found.join(', ')}]` : 'no words'}. Each grid path is explored once for ALL words, and stops the moment the trie has no child → about O(cells · 3^L) instead of words × grid searches.`,
      panels: [
        { kind: 'grid', cells: R ? g.map((row) => [...row]) : [['']], label: 'board' },
        arr([...found], { label: 'found', highlights: Object.fromEntries(found.map((_, i) => [i, 'done'])) }),
        vars({ words: ws.length, found: found.length }),
      ],
    });
    return frames;
  },
};
