// Extra array / hashing / recursion scenarios. Each generate(input) returns frames: { note, panels, predict? }.
import { layoutNary } from '../layout.js';

const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const table = (cells, states, rowLabels, colLabels, label) => ({ kind: 'table', cells, states, rowLabels, colLabels, label });
const stackPanel = (values, label) => ({ kind: 'stack', values, label });
const ask = (question, options, answer, explain) => ({ question, options, answer, explain });

// Numeric multiple choice: the answer plus up to 3 distractors (in [lo, hi]), sorted so the answer index varies.
const askNum = (question, answer, others, fmt = String, lo = -Infinity, hi = Infinity, explain) => {
  const vals = [answer, ...others.filter((x) => Number.isFinite(x) && x >= lo && x <= hi)];
  const uniq = [...new Set(vals)].slice(0, 4).sort((x, y) => x - y);
  if (uniq.length < 2) return undefined;
  return ask(question, uniq.map(fmt), uniq.indexOf(answer), explain);
};
const toInts = (xs) => (Array.isArray(xs) ? xs : []).map((x) => Math.floor(Number(x) || 0));

// ───────────────────────────── 1. Hash map with chaining ─────────────────────────────
export const hashMap = {
  title: 'Hash map: buckets and chaining',
  description: 'hash(key) = sum of char codes % buckets picks a bucket; colliding keys share a chain. Then one lookup walks its chain. Up to 10 keys, 1–10 buckets.',
  defaultInput: { keys: ['cat', 'dog', 'bird', 'fish', 'ant', 'cow'], buckets: 5, find: 'bird' },
  fields: [
    { key: 'keys', type: 'strings', label: 'keys to insert' },
    { key: 'buckets', type: 'number', label: 'buckets' },
    { key: 'find', type: 'string', label: 'key to look up' },
  ],
  testInputs: [
    { keys: [], buckets: 5, find: 'x' },
    { keys: ['a'], buckets: 1, find: 'a' },
    { keys: ['ab', 'ba', 'ab'], buckets: 3, find: 'zz' },
    { keys: ['k1', 'k2', 'k3', 'k4', 'k5', 'k6', 'k7', 'k8', 'k9', 'k10', 'k11', 'k12'], buckets: 0, find: '' },
    { keys: ['same', 'same'], buckets: 20, find: 'same' },
  ],
  generate({ keys, buckets, find }) {
    const B = Math.max(1, Math.min(10, Math.floor(Number(buckets) || 5)));
    const ks = (Array.isArray(keys) ? keys : []).slice(0, 10).map((k) => String(k).slice(0, 12));
    const chains = Array.from({ length: B }, () => []);
    const frames = [];
    const codeSum = (k) => [...k].reduce((s, ch) => s + ch.charCodeAt(0), 0);
    const codes = (k) => (k.length ? [...k].map((ch) => `${ch}(${ch.charCodeAt(0)})`).join(' + ') : '(empty) 0');
    // cellStates: { 'b:j': state } ; rowState: { b: state } applied to filled cells of that row.
    const view = (cellStates = {}, rowState = {}) => {
      const w = Math.max(1, ...chains.map((c) => c.length));
      const cells = chains.map((c) => [...c, ...new Array(w - c.length).fill('')]);
      const states = cells.map((row, b) => row.map((v, j) => cellStates[`${b}:${j}`] || (v !== '' && rowState[b]) || ''));
      return table(cells, states, chains.map((_, b) => `bucket ${b}`), Array.from({ length: w }, (_, j) => `#${j}`), 'buckets (each row is a chain)');
    };
    const otherBuckets = (b) => [(b + 1) % B, (b + B - 1) % B, (b + 2) % B];
    frames.push({
      note: `${B} empty buckets. To store a key we turn it into a number (sum of its character codes) and take % ${B} to pick a bucket — so we jump straight to one row instead of scanning everything.`,
      panels: [view(), vars({ buckets: B, keys: ks.length })],
    });
    ks.forEach((k, i) => {
      const sum = codeSum(k);
      const b = sum % B;
      frames.push({
        note: `hash('${k}') = ${sum} (sum of char codes). ${sum} % ${B} = ${b}, so '${k}' goes to bucket ${b}.`,
        panels: [view({}, { [b]: 'visited' }), vars({ key: k, codes: codes(k), sum, bucket: `${sum} % ${B} = ${b}` })],
        predict: i % 2 === 0 ? askNum(`Which bucket does '${k}' land in? (sum of char codes = ${sum})`, b, otherBuckets(b), (x) => `bucket ${x}`) : undefined,
      });
      const chain = chains[b];
      const existing = chain.indexOf(k);
      if (existing >= 0) {
        frames.push({
          note: `'${k}' is already in bucket ${b}. A map keeps keys unique, so we just overwrite its value — no new entry.`,
          panels: [view({ [`${b}:${existing}`]: 'done' }), vars({ key: k, bucket: b, size: chains.reduce((s, c) => s + c.length, 0) })],
        });
        return;
      }
      const collided = chain.length > 0;
      const before = [...chain];
      chain.push(k);
      const n = chains.reduce((s, c) => s + c.length, 0);
      frames.push({
        note: collided
          ? `Collision! Bucket ${b} already holds ${before.map((x) => `'${x}'`).join(', ')}. Different keys, same bucket — chaining appends '${k}' to that bucket's list.`
          : `Bucket ${b} was empty — no collision. '${k}' becomes its first entry.`,
        panels: [view({ [`${b}:${chain.length - 1}`]: 'active' }, collided ? { [b]: 'bad' } : {}), vars({ key: k, bucket: b, size: n, loadFactor: (n / B).toFixed(2) })],
        predict: i % 2 === 1 ? ask(`'${k}' hashes to bucket ${b}. Collision or not?`, ['Collision — the bucket already has a key', 'No collision — the bucket is empty'], collided ? 0 : 1) : undefined,
      });
    });

    // Lookup
    const target = typeof find === 'string' && find.length ? find.slice(0, 12) : ks[0] ?? 'cat';
    const sum = codeSum(target);
    const b = sum % B;
    const chain = chains[b];
    frames.push({
      note: `Look up '${target}': hash it the same way → ${sum} % ${B} = ${b}. Only bucket ${b} can contain it, so we ignore every other bucket.`,
      panels: [view({}, { [b]: 'visited' }), vars({ find: target, codes: codes(target), sum, bucket: b })],
      predict: askNum(`Which bucket do we search for '${target}'?`, b, otherBuckets(b), (x) => `bucket ${x}`),
    });
    let found = -1;
    for (let j = 0; j < chain.length; j++) {
      const match = chain[j] === target;
      const st = {};
      for (let q = 0; q < j; q++) st[`${b}:${q}`] = 'muted';
      st[`${b}:${j}`] = match ? 'done' : 'bad';
      frames.push({
        note: match ? `Chain position ${j}: '${chain[j]}' === '${target}' → found after ${j + 1} comparison(s).` : `Chain position ${j}: '${chain[j]}' ≠ '${target}' → follow the chain to the next entry.`,
        panels: [view(st), vars({ find: target, bucket: b, comparisons: j + 1 })],
      });
      if (match) {
        found = j;
        break;
      }
    }
    if (found < 0)
      frames.push({
        note: chain.length ? `End of bucket ${b}'s chain — '${target}' is not in the map.` : `Bucket ${b} is empty — '${target}' is not in the map (0 comparisons).`,
        panels: [view({}, { [b]: 'muted' }), vars({ find: target, bucket: b, found: false })],
      });
    const n = chains.reduce((s, c) => s + c.length, 0);
    const longest = Math.max(...chains.map((c) => c.length));
    frames.push({
      note: `Load factor = ${n}/${B} = ${(n / B).toFixed(2)}. With short chains insert/lookup are O(1) on average; if every key collided, one chain of n keys makes it O(n). That is why JS Map (like Java's HashMap) grows its bucket array and rehashes when the load factor gets high — chains stay short.`,
      panels: [view(), vars({ entries: n, buckets: B, loadFactor: (n / B).toFixed(2), longestChain: longest })],
    });
    return frames;
  },
};

// ───────────────────────────── 2. Frequency map / anagram ─────────────────────────────
export const frequencyMap = {
  title: 'Frequency map: is t an anagram of s?',
  description: 'Count each character of s in a Map, then walk t decrementing; a count that would drop below 0 means not an anagram. Strings clamped to 16 chars.',
  defaultInput: { s: 'anagram', t: 'nagaram' },
  fields: [
    { key: 's', type: 'string', label: 's' },
    { key: 't', type: 'string', label: 't' },
  ],
  testInputs: [{ s: '', t: '' }, { s: 'a', t: 'b' }, { s: 'rat', t: 'car' }, { s: 'aab', t: 'abb' }, { s: 'abc', t: 'ab' }, { s: 'aaaa', t: 'aaaa' }],
  generate({ s, t }) {
    const a = [...String(s ?? '')].slice(0, 16);
    const b = [...String(t ?? '')].slice(0, 16);
    const map = new Map();
    const frames = [];
    const mapPanel = (hl = {}) => {
      const ks = [...map.keys()];
      return table([ks.map((k) => map.get(k))], [ks.map((k) => hl[k] || (map.get(k) === 0 ? 'muted' : ''))], ['count'], ks.map((k) => `'${k}'`), 'Map: char → count');
    };
    const panels = (iS, iT, hl, extra) => [
      arr(a, { label: 's', ...(iS != null ? { pointers: [{ index: iS, label: 'i', color: 'a' }], highlights: { [iS]: 'active' } } : {}) }),
      arr(b, { label: 't', ...(iT != null ? { pointers: [{ index: iT, label: 'j', color: 'b' }], highlights: { [iT]: hl?.__t || 'active' } } : {}) }),
      mapPanel(hl),
      vars(extra),
    ];
    frames.push({ note: 'Plan: count every character of s in a Map. Then walk t and decrement; if t ever needs a character s has run out of, they are not anagrams.', panels: panels(null, null, {}, { s: a.join(''), t: b.join('') }) });
    a.forEach((c, i) => {
      const existed = map.has(c);
      map.set(c, (map.get(c) || 0) + 1);
      frames.push({
        note: existed ? `'${c}' is already a key → map.set('${c}', count + 1) = ${map.get(c)}.` : `'${c}' is new → map.set('${c}', 1).`,
        panels: panels(i, null, { [c]: 'active' }, { char: c, distinctKeys: map.size }),
        predict: i % 2 === 1 ? ask(`s[${i}] = '${c}'. New key or increment?`, ['New key → set to 1', 'Already in the map → increment'], existed ? 1 : 0) : undefined,
      });
    });
    if (a.length !== b.length) {
      frames.push({ note: `Lengths differ (${a.length} vs ${b.length}) → t cannot be an anagram of s. We can answer false without walking t. O(n).`, panels: panels(null, null, {}, { anagram: false }) });
      return frames;
    }
    frames.push({ note: `Both have length ${a.length}. Now walk t: every character must "spend" one count from the map.`, panels: panels(null, null, {}, { phase: 'decrement' }) });
    for (let j = 0; j < b.length; j++) {
      const c = b[j];
      const cnt = map.get(c) || 0;
      const ok = cnt > 0;
      const predict = j % 2 === 0 || !ok ? ask(`t[${j}] = '${c}'. Can we decrement its count?`, ['Yes — count > 0, decrement it', 'No — count is 0 or missing → not an anagram'], ok ? 0 : 1) : undefined;
      if (!ok) {
        frames.push({
          note: `'${c}' has count ${map.has(c) ? 0 : '(missing)'} — t uses more '${c}' than s has → NOT an anagram. Stop early. O(n) time.`,
          panels: panels(null, j, { [c]: 'bad', __t: 'bad' }, { char: c, anagram: false }),
          predict,
        });
        return frames;
      }
      map.set(c, cnt - 1);
      frames.push({ note: `'${c}': count ${cnt} → ${cnt - 1}. One '${c}' of s is matched.`, panels: panels(null, j, { [c]: 'active' }, { char: c }), predict });
    }
    frames.push({
      note: `Every decrement succeeded and lengths match, so all counts are 0 → t IS an anagram of s. O(n) time, O(k) space for k distinct characters.`,
      panels: panels(null, null, {}, { anagram: true }),
    });
    return frames;
  },
};

// ───────────────────────────── 3. Recursion tree (naive fib) ─────────────────────────────
export const recursionTree = {
  title: 'Recursion tree: naive fib(n)',
  description: 'Each call becomes a node; the call stack shows frames being pushed and popped. Red nodes recompute work already done. n clamped to 0–6.',
  defaultInput: { n: 5 },
  fields: [{ key: 'n', type: 'number', label: 'n (≤ 6)' }],
  testInputs: [{ n: 0 }, { n: 1 }, { n: 2 }, { n: 6 }, { n: 50 }, { n: -3 }],
  generate({ n }) {
    n = Math.max(0, Math.min(6, Math.floor(Number(n) || 0)));
    let id = 0;
    const meta = {};
    const build = (k) => {
      const node = { id: id++, label: `f(${k})`, children: [] };
      meta[node.id] = { k, node };
      if (k >= 2) node.children.push(build(k - 1), build(k - 2));
      return node;
    };
    const root = build(n);
    const layout = layoutNary(root);
    const labels = Object.fromEntries(layout.nodes.map((nd) => [nd.id, String(nd.val)]));
    const states = Object.fromEntries(layout.nodes.map((nd) => [nd.id, 'hidden']));
    const stackIds = [];
    const counts = {};
    const computed = new Set();
    const askedRepeat = new Set();
    const askedValue = new Set();
    let calls = 0;
    const frames = [];
    const draw = (note, predict) =>
      frames.push({
        note,
        panels: [
          { kind: 'nodes', nodes: layout.nodes.map((nd) => ({ id: nd.id, label: labels[nd.id], x: nd.x, y: nd.y, state: states[nd.id] })), edges: layout.edges.map(([f, t]) => ({ from: f, to: t, state: '' })), directed: true, label: 'call tree' },
          stackPanel(stackIds.map((i) => `fib(${meta[i].k})`), 'call stack'),
          vars({ calls }),
        ],
        predict,
      });
    draw(`We call fib(${n}). Every call appears as a node when it starts; the call stack holds the calls still waiting for an answer.`);
    const go = (node) => {
      const { k } = meta[node.id];
      calls++;
      counts[k] = (counts[k] || 0) + 1;
      const repeat = computed.has(k);
      if (stackIds.length) states[stackIds[stackIds.length - 1]] = 'visited';
      stackIds.push(node.id);
      states[node.id] = 'active';
      if (k < 2) {
        labels[node.id] = `f(${k})=${k}`;
        states[node.id] = repeat ? 'bad' : 'done';
        draw(`Push fib(${k}): base case → return ${k} immediately.${repeat ? ` fib(${k}) was already computed before (call #${counts[k]}).` : ''}`);
        stackIds.pop();
        computed.add(k);
        return k;
      }
      let predict;
      if (repeat && !askedRepeat.has(k)) {
        askedRepeat.add(k);
        predict = ask(`fib(${k}) is being called again — its answer was already computed. Does naive recursion reuse it?`, ['Yes — it remembers earlier results', 'No — it recomputes the whole subtree'], 1);
      }
      draw(
        repeat
          ? `Push fib(${k}) — but fib(${k}) was computed before! Naive recursion has no memory, so it re-does the entire subtree.`
          : `Push fib(${k}). Not a base case, so it must first call fib(${k - 1}), then fib(${k - 2}).`,
        predict,
      );
      const x = go(node.children[0]);
      const y = go(node.children[1]);
      const v = x + y;
      stackIds.pop();
      if (stackIds.length) states[stackIds[stackIds.length - 1]] = 'active';
      labels[node.id] = `f(${k})=${v}`;
      states[node.id] = repeat ? 'bad' : 'done';
      const askValue = !askedValue.has(k);
      askedValue.add(k);
      draw(
        `fib(${k}) = fib(${k - 1}) + fib(${k - 2}) = ${x} + ${y} = ${v}. Pop its frame and return ${v} to the caller.`,
        askValue ? askNum(`Both children of fib(${k}) returned (${x} and ${y}). What does fib(${k}) return?`, v, [v + 1, v - 1, v + 2, x * y], String, 0) : undefined,
      );
      computed.add(k);
      return v;
    };
    const ans = go(root);
    const repeats = Object.keys(counts)
      .map(Number)
      .sort((p, q) => q - p)
      .filter((k) => counts[k] > 1)
      .map((k) => `fib(${k}) computed ${counts[k]} times`);
    const countVars = Object.fromEntries(
      Object.keys(counts)
        .map(Number)
        .sort((p, q) => q - p)
        .map((k) => [`fib(${k})`, `${counts[k]}×`]),
    );
    frames.push({
      note: `fib(${n}) = ${ans} using ${calls} calls. ${repeats.length ? repeats.join(', ') + '. ' : ''}With memoization each of fib(0..${n}) is computed once → ${n + 1} computations. Naive: O(2ⁿ) time, memo: O(n). Stack depth is O(n) either way.`,
      panels: [frames[frames.length - 1].panels[0], stackPanel([], 'call stack'), vars({ answer: ans, naiveCalls: calls, memoizedCalls: n + 1, ...countVars })],
    });
    return frames;
  },
};

// ───────────────────────────── 4. Quick sort (Lomuto) ─────────────────────────────
export const quickSort = {
  title: 'Quick sort (Lomuto partition)',
  description: 'Pivot = last element. j scans the range; values < pivot are swapped to the boundary i. The pivot then lands at i, its final spot. Clamped to 10 items.',
  defaultInput: { nums: [7, 2, 9, 4, 1, 8, 3, 6] },
  fields: [{ key: 'nums', type: 'numbers', label: 'nums (≤ 10)' }],
  testInputs: [{ nums: [] }, { nums: [5] }, { nums: [2, 2, 2, 2] }, { nums: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] }, { nums: [3, -1, 3, 0, -1] }, { nums: [2, 1] }],
  generate({ nums }) {
    const a = (Array.isArray(nums) ? nums : []).slice(0, 10).map((x) => Number(x) || 0);
    const done = new Set();
    const frames = [];
    let comparisons = 0;
    let swaps = 0;
    const view = (lo, hi, pointers, hl, note, predict) => {
      const highlights = {};
      a.forEach((_, k) => {
        if (done.has(k)) highlights[k] = 'done';
        else if (lo != null && (k < lo || k > hi)) highlights[k] = 'muted';
      });
      Object.assign(highlights, hl);
      frames.push({ note, panels: [arr([...a], { highlights, pointers, ...(lo != null ? { range: [lo, hi] } : {}) }), vars({ comparisons, swaps })], predict });
    };
    view(null, null, [], {}, 'Quick sort: pick a pivot, move everything smaller to its left, put the pivot in between, then sort both sides the same way.');
    const qs = (lo, hi) => {
      if (lo > hi) return;
      if (lo === hi) {
        done.add(lo);
        view(lo, hi, [], { [lo]: 'done' }, `Subarray [${lo}..${hi}] has one element → it is already in its final place.`);
        return;
      }
      const pivot = a[hi];
      let i = lo;
      const ptrs = (j) => [{ index: i, label: 'i', color: 'a' }, ...(j != null ? [{ index: j, label: 'j', color: 'c' }] : []), { index: hi, label: 'pivot', color: 'b' }];
      const small = () => Object.fromEntries(Array.from({ length: i - lo }, (_, q) => [lo + q, 'visited']));
      view(lo, hi, ptrs(null), {}, `Partition [${lo}..${hi}]: pivot = last element ${pivot}. i marks where the next value < pivot goes; j scans ${lo}..${hi - 1}.`);
      for (let j = lo; j < hi; j++) {
        const v = a[j];
        const less = v < pivot;
        comparisons++;
        let note;
        if (less) {
          if (i !== j) {
            note = `${v} < pivot ${pivot} → it belongs on the left: swap nums[${i}] ↔ nums[${j}], then i++.`;
            [a[i], a[j]] = [a[j], a[i]];
            swaps++;
          } else note = `${v} < pivot ${pivot} and it is already at i → nothing to move, just i++.`;
          i++;
        } else note = `${v} ≥ pivot ${pivot} → it stays on the right side; only j moves on.`;
        view(lo, hi, ptrs(j), { ...small(), [j]: 'active' }, note, comparisons % 2 === 1 ? ask(`nums[j] = ${v}, pivot = ${pivot}. Is nums[j] < pivot → swap?`, ['Yes — swap it into the "< pivot" zone, i++', 'No — leave it, just move j'], less ? 0 : 1) : undefined);
      }
      const predict = hi - lo + 1 >= 3 ? askNum(`j finished scanning [${lo}..${hi - 1}] with i = ${i}. Where does pivot ${pivot} land?`, i, [i + 1, i - 1, hi, lo], (x) => `index ${x}`, lo, hi) : undefined;
      if (i !== hi) {
        [a[i], a[hi]] = [a[hi], a[i]];
        swaps++;
      }
      done.add(i);
      view(lo, hi, [{ index: i, label: 'pivot', color: 'b' }], { ...small(), [i]: 'done' }, `Swap the pivot with nums[i]: ${pivot} lands at index ${i}. Everything left of it is smaller, everything right is ≥ — this is its final sorted spot.`, predict);
      qs(lo, i - 1);
      qs(i + 1, hi);
    };
    qs(0, a.length - 1);
    view(null, null, [], {}, `Sorted: [${a.join(', ')}] with ${comparisons} comparisons. Average O(n log n): each level does O(n) work and a decent pivot halves the range. Worst case O(n²) when the pivot is always the min/max (e.g. already-sorted input). In place, not stable.`);
    return frames;
  },
};

// ───────────────────────────── 5. Counting sort ─────────────────────────────
export const countingSort = {
  title: 'Counting sort',
  description: 'Count each value, turn counts into starting positions (prefix sums), then place values left to right — stable, no comparisons. Values clamped to 0–20, length to 12.',
  defaultInput: { nums: [4, 2, 2, 8, 3, 3, 1] },
  fields: [{ key: 'nums', type: 'numbers', label: 'nums (0–20, ≤ 12)' }],
  testInputs: [{ nums: [] }, { nums: [0] }, { nums: [5, 5, 5] }, { nums: [20, 0, 20, 1, 30, -4] }, { nums: [3, 1, 2, 3, 1, 2, 0, 0, 9, 9, 4, 4, 7, 7] }],
  generate({ nums }) {
    const a = toInts(nums)
      .slice(0, 12)
      .map((x) => Math.max(0, Math.min(20, x)));
    const n = a.length;
    const K = n ? Math.max(...a) : 0;
    const count = new Array(K + 1).fill(0);
    const pos = new Array(K + 1).fill('·');
    const out = new Array(n).fill('·');
    const frames = [];
    const panels = (hlIn = {}, hlCount = {}, hlPos = {}, hlOut = {}, ptr) => [
      arr(a, { label: 'nums', highlights: hlIn, ...(ptr != null ? { pointers: [{ index: ptr, label: 'i', color: 'a' }] } : {}) }),
      arr([...count], { label: 'count[v]', highlights: hlCount }),
      arr([...pos], { label: 'pos[v] (next output index for v)', highlights: hlPos }),
      arr([...out], { label: 'output', highlights: hlOut }),
    ];
    frames.push({ note: `Values are small integers (max ${K}), so we make one counter per possible value 0..${K} instead of comparing elements.`, panels: panels() });
    a.forEach((v, i) => {
      count[v]++;
      frames.push({
        note: `nums[${i}] = ${v} → count[${v}]++ (now ${count[v]}).`,
        panels: panels({ [i]: 'active' }, { [v]: 'active' }, {}, {}, i),
        predict: i % 3 === 1 ? askNum(`nums[${i}] = ${v}. Which counter goes up?`, v, [v + 1, v - 1, i], (x) => `count[${x}]`, 0, K) : undefined,
      });
    });
    let running = 0;
    for (let v = 0; v <= K; v++) {
      pos[v] = running;
      const before = running;
      running += count[v];
      frames.push({
        note: count[v]
          ? `pos[${v}] = ${before}: all smaller values fill indices 0..${before - 1}, so the ${count[v]} copy/copies of ${v} start at ${before}. Running total → ${running}.`
          : `No ${v}s. pos[${v}] = ${before} (unused); the running total stays ${running}.`,
        panels: panels({}, { [v]: 'active' }, { [v]: 'done' }),
        predict: v % 3 === 2 && count[v] ? askNum(`count[0..${v - 1}] sums to ${before}. What is pos[${v}]?`, before, [before + count[v], before + 1, before - 1], String, 0) : undefined,
      });
    }
    a.forEach((v, i) => {
      const idx = pos[v];
      out[idx] = v;
      pos[v]++;
      frames.push({
        note: `nums[${i}] = ${v} goes to output[${idx}] (pos[${v}]), then pos[${v}]++ so the next ${v} lands right after it. Scanning left to right keeps equal values in input order → stable.`,
        panels: panels({ [i]: 'active' }, {}, { [v]: 'active' }, { [idx]: 'done' }, i),
        predict: i % 3 === 0 && n > 1 ? askNum(`pos[${v}] = ${idx}. Where does nums[${i}] = ${v} go?`, idx, [idx + 1, idx - 1, i], (x) => `output[${x}]`, 0, n - 1) : undefined,
      });
    });
    frames.push({ note: `Sorted: [${out.join(', ')}]. O(n + k) time and O(n + k) space, k = max value (${K}). It beats O(n log n) because it never compares — but only works for small integer keys.`, panels: panels({}, {}, {}, Object.fromEntries(out.map((_, i) => [i, 'done']))) });
    return frames;
  },
};

// ───────────────────────────── 6. Cyclic sort ─────────────────────────────
export const cyclicSort = {
  title: 'Cyclic sort: find missing & duplicates',
  description: 'Values are 1..n, so value v belongs at index v−1. Swap each value home, then any index i not holding i+1 reveals a missing number and a duplicate. Clamped to 10 items.',
  defaultInput: { nums: [4, 3, 2, 7, 8, 2, 3, 1] },
  fields: [{ key: 'nums', type: 'numbers', label: 'nums (values 1..n)' }],
  testInputs: [{ nums: [] }, { nums: [1] }, { nums: [1, 1] }, { nums: [3, 1, 2] }, { nums: [5, 5, 5, 5, 5] }, { nums: [0, 99, 2, 2, 1, 7, 3, 3, 3, 3, 3, 3] }],
  generate({ nums }) {
    const raw = toInts(nums).slice(0, 10);
    const n = raw.length;
    const a = raw.map((x) => Math.max(1, Math.min(n, x)));
    const frames = [];
    const home = () => Object.fromEntries(a.map((v, k) => [k, v === k + 1 ? 'done' : '']).filter(([, s]) => s));
    const view = (note, hl = {}, ptr, extra = {}, predict) =>
      frames.push({ note, panels: [arr([...a], { highlights: { ...home(), ...hl }, ...(ptr != null ? { pointers: [{ index: ptr, label: 'i', color: 'a' }] } : {}) }), vars(extra)], predict });
    view(`Values lie in 1..${n}, so value v has a "home" at index v−1. We swap values home; green cells already hold their own value.`, {}, null, { n });
    let i = 0;
    let steps = 0;
    while (i < n) {
      const v = a[i];
      const c = v - 1;
      steps++;
      let note;
      let hl;
      const willSwap = a[c] !== v;
      const predict = steps % 2 === 0 ? ask(`nums[${i}] = ${v} (home index ${c}, which holds ${a[c]}). Swap or move on?`, [`Swap it to index ${c}`, 'Move on: i++'], willSwap ? 0 : 1) : undefined;
      if (willSwap) {
        const other = a[c];
        [a[i], a[c]] = [a[c], a[i]];
        note = `nums[${i}] = ${v} belongs at index ${c}, which holds ${other}. Swap them. Stay at i: the ${other} we received may need a home too.`;
        hl = { [i]: 'active' };
        view(note, hl, i, { i, swapped: `${v} ↔ ${other}` }, predict);
      } else {
        note = c === i ? `nums[${i}] = ${v} is already home → i++.` : `nums[${i}] = ${v} belongs at index ${c}, but nums[${c}] is already ${v} → this ${v} is a duplicate. Leave it, i++.`;
        hl = c === i ? { [i]: 'done' } : { [i]: 'bad' };
        view(note, hl, i, { i }, predict);
        i++;
      }
    }
    const missing = [];
    const dups = new Set();
    view('Placement done. Now scan: index k should hold k+1. Any index that does not tells us k+1 is missing and its value is a duplicate.', {}, null, {});
    for (let k = 0; k < n; k++) {
      const ok = a[k] === k + 1;
      if (!ok) {
        missing.push(k + 1);
        dups.add(a[k]);
      }
      view(
        ok ? `Index ${k} holds ${k + 1} ✓.` : `Index ${k} holds ${a[k]}, not ${k + 1} → ${k + 1} is missing and ${a[k]} appears twice.`,
        { [k]: ok ? 'done' : 'bad' },
        k,
        { missing: `[${missing.join(', ')}]`, duplicates: `[${[...dups].join(', ')}]` },
        k % 3 === 2 ? ask(`Does index ${k} hold ${k + 1}?`, ['Yes — it is home', `No — ${k + 1} is missing`], ok ? 0 : 1) : undefined,
      );
    }
    view(
      `Missing: [${missing.join(', ')}], duplicates: [${[...dups].join(', ')}]. Every swap puts one value home for good, so there are at most n swaps → O(n) time, O(1) extra space.`,
      {},
      null,
      { missing: `[${missing.join(', ')}]`, duplicates: `[${[...dups].join(', ')}]` },
    );
    return frames;
  },
};

// ───────────────────────────── 7. Sweep line (meeting rooms II) ─────────────────────────────
export const sweepLine = {
  title: 'Sweep line: meeting rooms II',
  description: 'Turn each meeting [start, end) into a +1 and a −1 event, sort them (ends first on ties), and sweep: the peak running total is the number of rooms. Up to 8 meetings; zero-length ones are ignored.',
  defaultInput: { intervals: [[0, 30], [5, 10], [10, 20], [15, 25], [25, 35]] },
  fields: [{ key: 'intervals', type: 'json', label: 'intervals [[start, end], …]' }],
  testInputs: [{ intervals: [] }, { intervals: [[1, 5]] }, { intervals: [[1, 5], [5, 9]] }, { intervals: [[1, 4], [1, 4], [1, 4]] }, { intervals: [[9, 3], [2, 2], [0, 1]] }, { intervals: Array.from({ length: 10 }, (_, k) => [k, k + 3]) }],
  generate({ intervals }) {
    const ivs = (Array.isArray(intervals) ? intervals : [])
      .slice(0, 8)
      .map((p) => (Array.isArray(p) ? [Number(p[0]) || 0, Number(p[1]) || 0] : [0, 0]))
      .map(([s, e]) => (s <= e ? [s, e] : [e, s]))
      .filter(([s, e]) => s < e);
    const events = [];
    ivs.forEach(([s, e], i) => events.push({ t: s, d: 1, i }, { t: e, d: -1, i }));
    const fmt = (ev) => `${ev.t}:${ev.d > 0 ? '+1' : '−1'}`;
    const min = ivs.length ? Math.min(...ivs.map((x) => x[0])) : 0;
    const max = ivs.length ? Math.max(...ivs.map((x) => x[1])) : 1;
    const frames = [];
    const ivState = ivs.map(() => '');
    const ivPanel = () => ({ kind: 'intervals', label: 'meetings', items: ivs.map(([s, e], i) => ({ start: s, end: e, state: ivState[i] })), min, max });
    frames.push({
      note: 'Each meeting becomes two events: +1 when it starts, −1 when it ends. Walking the events in time order, the running total = meetings in progress; its peak = rooms needed.',
      panels: [ivPanel(), arr(events.map(fmt), { label: 'events (unsorted)' }), vars({ meetings: ivs.length })],
    });
    const sorted = [...events].sort((x, y) => x.t - y.t || x.d - y.d);
    const tieTimes = [...new Set(sorted.filter((ev) => ev.d > 0 && sorted.some((o) => o.d < 0 && o.t === ev.t)).map((ev) => ev.t))];
    frames.push({
      note: tieTimes.length
        ? `Sort by time; at a tie (t = ${tieTimes.join(', ')}) the −1 comes first. A meeting ending at ${tieTimes[0]} frees its room exactly when the next one starts, so they do not overlap — processing +1 first would count a fake overlap.`
        : 'Sort events by time (on ties, ends before starts, because [start, end) meetings touching at one point do not overlap).',
      panels: [ivPanel(), arr(sorted.map(fmt), { label: 'events (sorted)' }), vars({ overlap: 0, maxRooms: 0 })],
      predict: tieTimes.length ? ask(`At t = ${tieTimes[0]} one meeting ends and another starts. Which event should come first?`, ['The start (+1)', 'The end (−1) — the room is freed and reused'], 1) : undefined,
    });
    let cur = 0;
    let best = 0;
    sorted.forEach((ev, k) => {
      const prev = cur;
      cur += ev.d;
      const newMax = cur > best;
      best = Math.max(best, cur);
      ivState[ev.i] = ev.d > 0 ? 'active' : 'muted';
      const [s, e] = ivs[ev.i];
      let predict;
      if (k % 3 === 1) predict = askNum(`Event ${fmt(ev)} (overlap was ${prev}). What is the overlap after it?`, cur, [prev, cur + 1, cur - 1, cur + 2], String, 0);
      else if (k % 3 === 2 && ev.d > 0) predict = ask(`A meeting starts at t = ${ev.t} (overlap ${prev} → ${cur}, max so far ${best - (newMax ? 1 : 0)}). Does maxRooms grow?`, ['Yes — a new peak', 'No — still within the max'], newMax ? 0 : 1);
      frames.push({
        note:
          ev.d > 0
            ? `t = ${ev.t}: meeting [${s}, ${e}) starts → overlap ${prev} → ${cur}.${newMax ? ` New peak → we need ${best} rooms.` : ` Max stays ${best}.`}`
            : `t = ${ev.t}: meeting [${s}, ${e}) ends → its room frees up, overlap ${prev} → ${cur}.`,
        panels: [
          ivPanel(),
          arr(sorted.map(fmt), { label: 'events (sorted)', highlights: Object.fromEntries(sorted.map((_, q) => [q, q < k ? 'visited' : q === k ? 'active' : ''])), pointers: [{ index: k, label: 'now', color: 'a' }] }),
          vars({ time: ev.t, overlap: cur, maxRooms: best }),
        ],
        predict,
      });
    });
    ivs.forEach((_, i) => (ivState[i] = 'done'));
    frames.push({
      note: `Answer: ${best} room(s). Sorting the 2n events costs O(n log n); the sweep itself is O(n).`,
      panels: [ivPanel(), arr(sorted.map(fmt), { label: 'events (sorted)' }), vars({ maxRooms: best })],
    });
    return frames;
  },
};

// ───────────────────────────── 8. LIS via patience sorting ─────────────────────────────
export const lisPatience = {
  title: 'LIS in O(n log n) (patience / tails)',
  description: 'tails[k] = smallest possible last value of an increasing subsequence of length k+1. Binary-search each number into tails: append it or replace the first tail ≥ it. Clamped to 12 numbers.',
  defaultInput: { nums: [10, 9, 2, 5, 3, 7, 101, 18] },
  fields: [{ key: 'nums', type: 'numbers', label: 'nums (≤ 12)' }],
  testInputs: [{ nums: [] }, { nums: [7] }, { nums: [7, 7, 7, 7] }, { nums: [5, 4, 3, 2, 1] }, { nums: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] }, { nums: [0, 8, 4, 12, 2, 10, 6, 14, 1, 9] }],
  generate({ nums }) {
    const a = (Array.isArray(nums) ? nums : []).slice(0, 12).map((x) => Number(x) || 0);
    const tails = [];
    const frames = [];
    frames.push({
      note: 'Keep tails[k] = the smallest last value of any increasing subsequence of length k+1 seen so far. tails is always sorted, so each number can be placed with binary search.',
      panels: [arr(a, { label: 'nums' }), arr([], { label: 'tails' }), vars({ length: 0 })],
    });
    a.forEach((x, i) => {
      const before = [...tails];
      let lo = 0;
      let hi = tails.length;
      const trace = [];
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (tails[mid] < x) {
          trace.push(`mid ${mid}: ${tails[mid]} < ${x} → lo=${mid + 1}`);
          lo = mid + 1;
        } else {
          trace.push(`mid ${mid}: ${tails[mid]} ≥ ${x} → hi=${mid}`);
          hi = mid;
        }
      }
      const p = lo;
      const append = p === tails.length;
      const old = tails[p];
      tails[p] = x;
      const L = before.length;
      let predict;
      if (i % 2 === 1) {
        const label = (q) => (q === L ? 'Append (new pile)' : `Replace tails[${q}] (${before[q]})`);
        predict = askNum(`tails = [${before.join(', ')}], next number ${x}. Append or replace which pile?`, p, [p - 1, p + 1, L, 0], label, 0, L);
      }
      frames.push({
        note: append
          ? `${x} is bigger than every tail → it extends the longest subsequence: append. LIS length is now ${tails.length}.`
          : `The first tail ≥ ${x} is tails[${p}] = ${old} → replace it with ${x}. Same length ${p + 1}, but a smaller tail is easier to extend later.`,
        panels: [
          arr(a, { label: 'nums', highlights: Object.fromEntries(a.map((_, q) => [q, q < i ? 'visited' : q === i ? 'active' : ''])), pointers: [{ index: i, label: 'x', color: 'a' }] }),
          arr([...tails], { label: 'tails', highlights: { [p]: append ? 'done' : 'active' } }),
          vars({ x, binarySearch: trace.length ? trace.join(' · ') : 'tails empty → pos 0', pos: p, length: tails.length }),
        ],
        predict,
      });
    });
    frames.push({
      note: `LIS length = ${tails.length}. Careful: tails [${tails.join(', ')}] need not be a real subsequence — only its length is guaranteed. n numbers × O(log n) search = O(n log n), vs O(n²) for the simple DP.`,
      panels: [arr(a, { label: 'nums' }), arr([...tails], { label: 'tails', highlights: Object.fromEntries(tails.map((_, q) => [q, 'done'])) }), vars({ length: tails.length })],
    });
    return frames;
  },
};
