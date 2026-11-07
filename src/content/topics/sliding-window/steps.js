// Step lessons for Sliding Window (M2). Format: src/content/stepSchema.js. Facts come only from topic.js.
// Every window below is produced by actually running the algorithm on the example input.
const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const table = (rowLabels, colLabels, cells, states) => ({ kind: 'table', rowLabels, colLabels, cells, ...(states ? { states } : {}) });
const code = (text) => vars({ code: text });
const hl = (n, f) => Object.fromEntries(Array.from({ length: n }, (_, k) => [k, f(k)]));
const ptr = (index, label, color = 'a') => ({ index, label, color });
// window [lo, hi] shaded, with per-index overrides (e.g. { 3: 'active' })
const win = (n, lo, hi, extra = {}) => hl(n, (k) => extra[k] ?? (k >= lo && k <= hi ? 'window' : ''));
const lr = (left, right) => [ptr(left, 'left'), ptr(right, 'right', 'b')];
const setStr = (set) => `{${[...set].join(', ')}}`;
// a Map of counts as a table panel
const mapTable = (m, label = 'count') => (m.size ? table([...m.keys()].map(String), [label], [...m.values()].map((v) => [String(v)])) : vars({ count: '{}' }));

// ---------- fixed window, k = 3 (what / why / when / intuition) ----------
const A = [2, 1, 5, 1, 3, 2];
const K = 3;
const sums = A.slice(0, A.length - K + 1).map((_, s) => A.slice(s, s + K).reduce((x, y) => x + y, 0)); // 8 7 9 6
const fixedArr = (lo, extra, opts = {}) => arr(A, { label: 'nums, k = 3', range: [lo, lo + K - 1], highlights: win(A.length, lo, lo + K - 1, extra), ...opts });

// brute force: 4 windows × 3 additions; sliding: one add per element + one subtract per slide
const bruteFrames = sums.map((s, start) => ({
  say: 0,
  note: `Window ${start}: add ${A.slice(start, start + K).join(' + ')} from zero = ${s}.`,
  panels: [arr(A, { label: 'recompute', range: [start, start + K - 1], highlights: win(A.length, start, start + K - 1, { [start]: 'visited', [start + 1]: 'visited', [start + 2]: 'visited' }) }), vars({ additions: (start + 1) * K, subtractions: 0 })],
}));
const slideFrames = [];
{
  let sum = 0;
  for (let right = 0; right < A.length; right++) {
    sum += A[right];
    if (right >= K) sum -= A[right - K];
    const lo = Math.max(0, right - K + 1);
    const out = right >= K ? { [right - K]: 'bad' } : {};
    slideFrames.push({
      say: 1,
      note: right >= K ? `${A[right]} enters, ${A[right - K]} leaves: sum = ${sum}.` : `Fill the first window: + ${A[right]}, sum = ${sum}.`,
      panels: [arr(A, { label: 'slide', range: [lo, right], highlights: win(A.length, lo, right, { ...out, [right]: 'active' }) }), vars({ additions: right + 1, subtractions: Math.max(0, right - K + 1) })],
    });
  }
}

// intuition: two fingers on the fixed window, counting adds and removes
const fingerFrames = [];
{
  let left = 0,
    added = 0,
    removed = 0;
  for (let right = 0; right < A.length; right++) {
    added++;
    let leftNote = '';
    if (right >= K) {
      removed++;
      left++;
      leftNote = ` Left steps to ${left}.`;
    }
    fingerFrames.push({
      say: right >= K ? 2 : 1,
      note: `Right moves to ${right}: ${A[right]} is added.${leftNote}`,
      panels: [arr(A, { label: 'nums, k = 3', pointers: lr(left, right), range: [left, right], highlights: win(A.length, left, right, { [right]: 'active', ...(right >= K ? { [left - 1]: 'muted' } : {}) }) }), vars({ added, removed })],
    });
  }
  fingerFrames.push({ say: 3, note: 'Done: 6 adds, 3 removes. No finger ever went back.', panels: [arr(A, { label: 'nums, k = 3', pointers: lr(left, A.length - 1), range: [left, A.length - 1], highlights: win(A.length, left, A.length - 1) }), vars({ added, removed })] });
}

// ---------- brute force on "abcabcbb" ----------
const S = 'abcabcbb'.split('');
const bruteRun = []; // { start, end (where it stopped), dup, looks, best }
{
  let best = 0,
    looks = 0;
  for (let start = 0; start < S.length; start++) {
    const seen = new Set();
    let end = start,
      dup = false;
    for (; end < S.length; end++) {
      looks++;
      if (seen.has(S[end])) {
        dup = true;
        break;
      }
      seen.add(S[end]);
      best = Math.max(best, end - start + 1);
      if (start === 0) bruteRun.push({ start, end, dup: false, looks, best, set: new Set(seen) });
    }
    bruteRun.push({ start, end: dup ? end : S.length - 1, dup, looks, best, set: seen, final: true });
  }
}
const bruteSFrames = bruteRun.map((r) => {
  const hi = r.dup ? r.end - 1 : r.end;
  const extra = r.dup ? { [r.end]: 'bad' } : r.final ? {} : { [r.end]: 'active' };
  const note =
    !r.final ? `start 0, end ${r.end}: "${S[r.end]}" is new, add it. Length ${r.end + 1}.` : r.dup ? `start ${r.start}: "${S[r.end]}" at ${r.end} is a duplicate → break. Length ${r.end - r.start}.` : `start ${r.start}: reached the end of the string. Length ${S.length - r.start}.`;
  return {
    say: r.start === 0 ? (r.final ? 2 : 1) : r.start < 7 ? 2 : 3,
    note,
    panels: [arr(S, { label: 's', pointers: [ptr(r.start, 'start'), ptr(r.end, 'end', 'b')], range: [r.start, hi], highlights: win(S.length, r.start, hi, extra) }), vars({ seen: setStr(r.set), best: r.best, 'chars looked at': r.looks })],
  };
});

// ---------- optimized: variable window with a Set on "pwwkew" ----------
const P = 'pwwkew'.split('');
const optFrames = [{ say: 0, note: 'left = 0, the Set is empty.', panels: [arr(P, { label: 's', pointers: [ptr(0, 'left')] }), vars({ inWindow: '{}', best: 0 })] }];
{
  const set = new Set();
  let left = 0,
    best = 0;
  for (let right = 0; right < P.length; right++) {
    if (set.has(P[right]))
      optFrames.push({ say: 2, note: `right = ${right}: "${P[right]}" is already in the Set. The window is invalid.`, panels: [arr(P, { label: 's', pointers: lr(left, right), range: [left, right], highlights: win(P.length, left, right, { [right]: 'bad' }) }), vars({ inWindow: setStr(set), best })] });
    while (set.has(P[right])) {
      set.delete(P[left]);
      left++;
      optFrames.push({ say: 2, note: `Remove "${P[left - 1]}", left = ${left}.`, panels: [arr(P, { label: 's', pointers: lr(left, right), range: [left, right], highlights: win(P.length, left, right, { [left - 1]: 'muted', [right]: set.has(P[right]) ? 'bad' : 'active' }) }), vars({ inWindow: setStr(set), best })] });
    }
    set.add(P[right]);
    best = Math.max(best, right - left + 1);
    optFrames.push({ say: 3, note: `Add "${P[right]}". Window length ${right - left + 1}, best = ${best}.`, panels: [arr(P, { label: 's', pointers: lr(left, right), range: [left, right], highlights: win(P.length, left, right, { [right]: 'active' }) }), vars({ inWindow: setStr(set), best })] });
  }
}
// frames up to right = 4, then the turn asks about right = 5
const optCut = optFrames.findIndex((f) => f.note.startsWith('right = 5'));

// ---------- template: shortest valid, sum >= 7 ----------
const T = [2, 3, 1, 2, 4, 3];
const TARGET = 7;
const shortFrames = [];
{
  let left = 0,
    sum = 0,
    best = Infinity;
  for (let right = 0; right < T.length; right++) {
    sum += T[right];
    shortFrames.push({ say: 0, note: `right = ${right}: add ${T[right]}, sum = ${sum}${sum >= TARGET ? ' ≥ 7, valid.' : ' < 7.'}`, panels: [arr(T, { label: 'arr, target 7', pointers: lr(left, right), range: [left, right], highlights: win(T.length, left, right, { [right]: 'active' }) }), vars({ sum, best: best === Infinity ? '∞' : best })] });
    while (sum >= TARGET) {
      best = Math.min(best, right - left + 1);
      sum -= T[left];
      left++;
      shortFrames.push({ say: 2, note: `Record length ${right - left + 2} (best ${best}), then remove ${T[left - 1]}: sum = ${sum}, left = ${left}.`, panels: [arr(T, { label: 'arr, target 7', pointers: lr(Math.min(left, right), right), range: [left, right], highlights: win(T.length, left, right, { [left - 1]: 'muted' }) }), vars({ sum, best })] });
    }
  }
}

// ---------- template: atMost(2) distinct on [1, 2, 1, 3] ----------
const D = [1, 2, 1, 3];
function atMost(k, frames) {
  const count = new Map();
  let left = 0,
    total = 0;
  for (let right = 0; right < D.length; right++) {
    count.set(D[right], (count.get(D[right]) ?? 0) + 1);
    while (count.size > k) {
      const x = D[left];
      count.set(x, count.get(x) - 1);
      if (count.get(x) === 0) count.delete(x);
      left++;
      frames?.push({ say: 0, note: `3 distinct > 2: remove ${x}, left = ${left}.`, panels: [arr(D, { label: 'nums, K = 2', pointers: lr(left, right), range: [left, right], highlights: win(D.length, left, right, { [left - 1]: 'muted' }) }), mapTable(count), vars({ total })] });
    }
    total += right - left + 1;
    frames?.push({ say: 2, note: `Window [${left}, ${right}] is valid: + ${right - left + 1} subarrays ending at ${right}. total = ${total}.`, panels: [arr(D, { label: 'nums, K = 2', pointers: lr(left, right), range: [left, right], highlights: win(D.length, left, right, { [right]: 'active' }) }), mapTable(count), vars({ total })] });
  }
  return total;
}
const countFrames = [];
const AT2 = atMost(2, countFrames); // 8
const AT1 = atMost(1); // 4

// ---------- implementation: lastSeen jump on "abba" ----------
const AB = 'abba'.split('');
const jump = [];
{
  const last = new Map();
  let left = 0,
    best = 0;
  for (let right = 0; right < AB.length; right++) {
    const ch = AB[right];
    const before = new Map(last);
    let moved = '';
    if (last.has(ch) && last.get(ch) >= left) {
      left = last.get(ch) + 1;
      moved = `"${ch}" was last at ${last.get(ch)} ≥ left, so left jumps to ${left}. `;
    }
    last.set(ch, right);
    best = Math.max(best, right - left + 1);
    jump.push({ right, left, best, before, after: new Map(last), moved });
  }
}
const jumpFrame = (j, say, note) => ({
  say,
  note,
  panels: [arr(AB, { label: 's', pointers: lr(j.left, j.right), range: [j.left, j.right], highlights: win(AB.length, j.left, j.right, { [j.right]: 'active' }) }), mapTable(j.after, 'last index'), vars({ best: j.best })],
});

// ---------- dry run: the lesson's table for "abcabcbb" ----------
const dry = [];
{
  const set = new Set();
  let left = 0,
    best = 0,
    leftMoves = 0;
  for (let right = 0; right < S.length; right++) {
    const gone = [];
    while (set.has(S[right])) {
      set.delete(S[left]);
      gone.push(left);
      left++;
      leftMoves++;
    }
    set.add(S[right]);
    best = Math.max(best, right - left + 1);
    dry.push({ right, left, best, gone, leftMoves, window: S.slice(left, right + 1).join('') });
  }
}
// action text straight from the lesson's dry-run table
const ACTIONS = ['add a', 'add b', 'add c', 'duplicate → remove a, left=1; add a', 'duplicate → remove b, left=2; add b', 'duplicate → remove c, left=3; add c', 'remove a, remove b (left=5); add b', 'remove c, remove b (left=7); add b'];
const dryFrame = (d) => ({
  say: d.gone.length ? 1 : 0,
  note: `right = ${d.right}: ${ACTIONS[d.right]}. Window "${d.window}".`,
  panels: [
    arr(S, { label: 's', pointers: lr(d.left, d.right), range: [d.left, d.right], highlights: win(S.length, d.left, d.right, { ...Object.fromEntries(d.gone.map((g) => [g, 'muted'])), [d.right]: 'active' }) }),
    vars({ best: d.best, 'left moves': d.leftMoves }),
  ],
});

// ---------- mistakes: if vs while on "abcb" ----------
const ABCB = 'abcb'.split('');

export default {
  what: [
    {
      kind: 'watch',
      title: 'A window over the array',
      lines: [
        'A **sliding window** is a range that moves through the array.',
        'Biggest sum of 3 neighbouring numbers? Look through a window **3 cells wide**.',
        'Each slide: **one element enters on the right, one leaves on the left**.',
        'Everything in the middle stays the same.',
      ],
      frames: [
        { say: 0, note: 'The array, before any window.', panels: [arr(A, { label: 'nums' })] },
        { say: 1, note: `First window: 2 + 1 + 5 = ${sums[0]}.`, panels: [fixedArr(0, {}), vars({ sum: sums[0] })] },
        { say: 2, note: `Slide: 2 leaves, 1 enters. sum = 8 − 2 + 1 = ${sums[1]}.`, panels: [arr(A, { label: 'nums, k = 3', range: [1, 3], highlights: win(6, 1, 3, { 0: 'bad', 3: 'active' }) }), vars({ sum: sums[1] })] },
        { say: 3, note: '1 and 5 sat in both windows. Nothing to redo for them.', panels: [arr(A, { label: 'nums, k = 3', range: [1, 3], highlights: { 1: 'done', 2: 'done', 3: 'window' } }), vars({ sum: sums[1] })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: the next sum',
      lines: ['Reuse the old sum: add what enters, subtract what leaves.'],
      panels: [arr(A, { label: 'nums, k = 3', range: [1, 3], highlights: win(6, 1, 3, { 1: 'bad', 4: 'active' }) }), vars({ sum: sums[1] })],
      task: { type: 'number', question: 'The window slides to `[5 1 3]`. What is its sum?', options: [6, 7, 9, 10], answer: sums[2], hint: '7 − 1 (leaves) + 3 (enters).' },
      solved: `7 − 1 + 3 = ${sums[2]}, the best of all four windows.`,
      then: [{ say: 0, note: `[5 1 3]: sum ${sums[2]}, best so far.`, panels: [fixedArr(2, {}), vars({ sum: sums[2], best: sums[2] })] }],
    },
    {
      kind: 'turn',
      title: 'Your turn: who leaves?',
      lines: ['One slide: one element enters on the right, one leaves on the left.'],
      panels: [fixedArr(2, {}), vars({ sum: sums[2] })],
      task: { type: 'cell', question: 'The window slides once more. Tap the element that **leaves**.', answer: 2, hints: { 5: 'That one enters on the right.', 3: 'Still inside after the slide.', 4: 'Still inside after the slide.' } },
      solved: `5 leaves, 2 enters: 9 − 5 + 2 = ${sums[3]}. The best stays 9.`,
      then: [{ say: 0, note: `Last window [1 3 2]: sum ${sums[3]}. Best is still 9.`, panels: [fixedArr(3, { 2: 'muted', 5: 'active' }), vars({ sum: sums[3], best: 9 })] }],
    },
    {
      kind: 'turn',
      title: 'Your turn: window state',
      lines: ['**Window**: a contiguous range `[left, right]`.', '**Window state**: whatever you track about the window.'],
      panels: [fixedArr(2, {}, { pointers: lr(2, 4) }), vars({ sum: sums[2] })],
      task: {
        type: 'choose',
        question: 'In the max-sum problem, what is the **window state**?',
        options: [
          { text: 'The running sum', why: '' },
          { text: 'The indexes `[left, right]`', why: 'Those mark the window itself; the state is what you track about it.' },
          { text: 'The whole array', why: 'The array is the input; the state is only about the cells inside the window.' },
        ],
        answer: 0,
      },
      solved: 'The **sum** is the state here. Other problems track a frequency map or a count of zeros.',
    },
  ],

  why: [
    {
      kind: 'watch',
      title: 'Recompute or slide?',
      lines: ['Recompute each range from zero: about **n × k** additions.', 'Slide: each step costs **one addition and one subtraction**, whatever k is.', 'That turns **O(n·k)** into **O(n)**.'],
      frames: [
        ...bruteFrames,
        ...slideFrames,
        { say: 2, note: 'Same four sums. Recompute: 12 additions. Slide: 6 additions + 3 subtractions.', panels: [table(['recompute', 'slide'], ['work'], [['n × k'], ['one add + one subtract per step']], [['bad'], ['done']])] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: the repeated work',
      lines: ['Brute force re-adds the **same middle elements** again and again.'],
      panels: [arr(A, { label: '[1 5 1] then [5 1 3]', range: [1, 4], highlights: { 1: 'window', 2: 'active', 3: 'active', 4: 'window' } })],
      task: {
        type: 'choose',
        question: 'Going from `[1,5,1]` to `[5,1,3]`, which numbers does brute force add **a second time**?',
        options: [
          { text: '`5` and `1` (the shared middle)', why: '' },
          { text: 'Only `3`', why: '3 is new; even the sliding version must add it once.' },
          { text: 'The first `1`', why: 'That 1 is not in the new window at all.' },
        ],
        answer: 0,
      },
      solved: 'The overlap `5, 1` is added twice. The window reuses the old sum and only fixes the edges.',
    },
    {
      kind: 'turn',
      title: 'Your turn: at scale',
      lines: ['Slide: one add and one subtract per step.', 'Recompute: about n × k additions.'],
      panels: [vars({ n: '100,000', k: '50,000', recompute: '~5,000,000,000' })],
      task: { type: 'number', question: 'About how many operations does the **sliding** version need?', options: [50000, 200000, 5000000000], answer: 200000, hint: 'Two operations per element, and there are 100,000 elements.' },
      solved: '~200,000 operations: instant, instead of seconds.',
    },
  ],

  when: [
    {
      kind: 'watch',
      title: 'Two flavours',
      lines: ['**Fixed-size** window: always `k` long; left moves exactly with right.', '**Variable-size** window: grows and shrinks; left moves only when the window becomes invalid.', 'The rule must be **monotonic**: if a window is invalid, making it bigger never fixes it.'],
      frames: [
        ...[2, 3, 4].map((right) => ({ say: 0, note: `Fixed, k = 3: right = ${right}, left = ${right - 2}. They step together.`, panels: [arr(A, { label: 'nums, k = 3', pointers: lr(right - 2, right), range: [right - 2, right], highlights: win(6, right - 2, right) })] })),
        ...[0, 1, 2].map((right) => ({ say: 1, note: `Variable, no repeats: right = ${right}, left stays 0. The window grows.`, panels: [arr(ABCB, { label: 's', pointers: lr(0, right), range: [0, right], highlights: win(4, 0, right, { [right]: 'active' }) })] })),
        { say: 2, note: '"b" again: invalid. Adding more letters keeps both b\'s, so bigger never fixes it.', panels: [arr(ABCB, { label: 's', pointers: lr(0, 3), range: [0, 3], highlights: { 0: 'window', 1: 'bad', 2: 'window', 3: 'bad' } })] },
        { say: 1, note: 'Only now does left move: to 2, past the old "b". Window "cb".', panels: [arr(ABCB, { label: 's', pointers: lr(2, 3), range: [2, 3], highlights: { 0: 'muted', 1: 'muted', 2: 'window', 3: 'active' } })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: which condition fails?',
      lines: ['1. The answer is **contiguous**.', '2. The state **updates in O(1)** when one element enters or leaves.', '3. For variable windows, the rule is **monotonic**.'],
      panels: [code('Contiguous range. But after each slide the state can only be rebuilt by rescanning the whole window.')],
      task: {
        type: 'choose',
        question: 'Which of the three conditions does this problem break?',
        options: [
          { text: '1. Contiguous', why: 'The statement says the range is contiguous.' },
          { text: '2. O(1) update', why: '' },
          { text: '3. Monotonic rule', why: 'Nothing is said about the rule; the rescan is the problem.' },
        ],
        answer: 1,
      },
      solved: 'A rescan per slide is not an O(1) update, so condition 2 fails.',
    },
    {
      kind: 'turn',
      title: 'Your turn: pick the flavour',
      lines: ['Fixed: "for every window of size k…".', 'Variable: "longest / shortest range such that…".'],
      panels: [table(['window length', 'typical question', 'left moves'], ['fixed', 'variable'], [['always k', 'grows and shrinks'], ['every window of size k', 'longest / shortest such that…'], ['with right', '?']], [['', ''], ['', ''], ['', 'active']])],
      task: {
        type: 'choose',
        question: 'In a **variable** window, when does `left` move?',
        options: [
          { text: 'Exactly with right, every step', why: 'That is the fixed window.' },
          { text: 'Only when the window becomes invalid', why: '' },
          { text: 'Never', why: 'Then an invalid window could never be repaired.' },
        ],
        answer: 1,
      },
      solved: 'Left moves **only when the window becomes invalid**.',
    },
  ],

  recognize: [
    {
      kind: 'watch',
      title: 'Run the checklist',
      lines: ['Clues: contiguous, longest / shortest, "at most K", fixed size k, no repeats, contains all of…', '1. **Contiguous?** subarray, substring, consecutive, window.', '2. **Optimise a length or count?** longest, shortest, number of subarrays.', '3. **Can the state update** when one element enters or leaves?'],
      frames: [
        { say: 0, note: 'The statement to check.', panels: [code('"Return the length of the shortest subarray whose sum is at least target. All numbers are positive."')] },
        ...[
          ['contiguous?', '"subarray" → yes'],
          ['length or count?', '"shortest" → yes'],
          ['state updates?', 'sum: + enters, − leaves → yes'],
        ].map((_, k, all) => ({
          say: k + 1,
          note: `Check ${k + 1}: ${all[k][1]}.`,
          panels: [table(all.slice(0, k + 1).map((r) => r[0]), ['answer'], all.slice(0, k + 1).map((r) => [r[1]]), all.slice(0, k + 1).map((_, i) => [i === k ? 'active' : 'done']))],
        })),
        { say: 3, note: 'All three are yes: a sliding window is very likely the intended solution.', panels: [vars({ verdict: 'Think Sliding Window' })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: find the contiguity word',
      lines: ['Check 1 looks for a word that rules out gaps.'],
      panels: [arr(['number', 'of', 'substrings', 'with', '≤ k', 'distinct'], { label: 'the statement (≤ k = at most k)', showIndices: false })],
      task: { type: 'cell', question: 'Tap the word that answers **check 1 (contiguous?)**.', answer: 2, hints: { 0: '"number" answers check 2: it asks for a count.', 4: '"at most k" is a clue for the rule, not for contiguity.', 5: '"distinct" describes the rule inside the window.' } },
      solved: '"substrings": a substring has no gaps.',
    },
    {
      kind: 'turn',
      title: 'Your turn: what state?',
      lines: ['Check 3: the state must update when one element enters or leaves.', 'Typical states: a sum, a map of counts, a number of zeros.'],
      panels: [code('"Longest substring with at most 2 distinct characters."')],
      task: {
        type: 'choose',
        question: 'Which state lets you answer **check 3** for this statement?',
        options: [
          { text: 'A running sum', why: 'A sum of characters does not tell you how many distinct ones are inside.' },
          { text: 'A map of counts', why: '' },
          { text: 'A number of zeros', why: 'There are no zeros to count; the rule is about distinct characters.' },
        ],
        answer: 1,
      },
      solved: 'A **map of counts**: +1 when a character enters, −1 when it leaves.',
    },
  ],

  intuition: [
    {
      kind: 'watch',
      title: 'Two fingers',
      lines: ['Two fingers, `left` and `right`. The window is everything between them.', '**Right** always moves forward: it explores new elements.', '**Left** moves forward only when it has to: it repairs the window.', 'Neither moves backwards: each element is added once and removed at most once.'],
      frames: [{ say: 0, note: 'Both fingers start at 0.', panels: [arr(A, { label: 'nums, k = 3', pointers: lr(0, 0) }), vars({ added: 0, removed: 0 })] }, ...fingerFrames],
    },
    {
      kind: 'turn',
      title: 'Your turn: where is left?',
      lines: ['Fixed window of size 3: left follows right.'],
      panels: [arr(A, { label: 'nums, k = 3', pointers: [ptr(4, 'right', 'b')], highlights: { 4: 'active' } })],
      task: { type: 'cell', question: '`right` is at 4. Tap where `left` is.', answer: 2, hints: { 1: 'That makes the window 4 cells wide.', 3: 'That makes the window only 2 cells wide.', 4: 'That is right itself.' } },
      solved: 'Window [2, 4] holds exactly 3 cells.',
    },
    {
      kind: 'turn',
      title: 'Your turn: going back?',
      lines: ['Right explores, left repairs.'],
      panels: [arr(A, { label: 'nums, k = 3', pointers: lr(3, 5), range: [3, 5], highlights: win(6, 3, 5, { 0: 'muted', 1: 'muted', 2: 'muted' }) }), vars({ added: 6, removed: 3 })],
      task: {
        type: 'choose',
        question: 'Which finger ever moves **backwards**?',
        options: [
          { text: 'right', why: 'Right always moves forward.' },
          { text: 'left', why: 'Left moves forward only, when it must repair the window.' },
          { text: 'neither', why: '' },
        ],
        answer: 2,
      },
      solved: 'Neither. So each element is added once and removed at most once.',
    },
  ],

  'brute-force': [
    {
      kind: 'watch',
      title: 'Every start, a fresh Set',
      lines: ['Longest substring without repeating characters: `"abcabcbb"` → 3.', 'Try every `start` with a fresh Set; extend `end` while characters are unique.', 'A duplicate → `break`: this start can go no further.', 'Two nested loops: **O(n²)** time.'],
      frames: bruteSFrames,
    },
    {
      kind: 'turn',
      title: 'Your turn: where does it stop?',
      lines: ['From `start`, extend `end` until a character is already in the Set.'],
      panels: [arr(S, { label: 's', pointers: [ptr(2, 'start')], highlights: { 2: 'active' } }), vars({ seen: '{}' })],
      task: { type: 'cell', question: '`start = 2`. Tap the `end` where the duplicate makes it `break`.', answer: 5, hints: { 3: '"a" is new for this start.', 4: '"b" is new for this start.', 6: 'It stops earlier: "c" repeats first.' } },
      solved: '"c", "a", "b" are unique; the "c" at 5 repeats the one at 2. Length 3.',
      then: [{ ...bruteSFrames.find((f) => f.note.startsWith('start 2')), say: 0 }],
    },
    {
      kind: 'turn',
      title: 'Your turn: why break?',
      lines: ['`if (seen.has(s[end])) break;`'],
      panels: [arr(S, { label: 's', pointers: [ptr(0, 'start'), ptr(3, 'end', 'b')], range: [0, 2], highlights: win(8, 0, 2, { 0: 'bad', 3: 'bad' }) }), vars({ seen: '{a, b, c}' })],
      task: {
        type: 'choose',
        question: 'Why does the inner loop **break** on a duplicate instead of continuing?',
        options: [
          { text: 'Any longer substring from this start also holds the duplicate', why: '' },
          { text: 'To save memory in the Set', why: 'The Set is thrown away anyway; break is about correctness.' },
          { text: 'Because `best` is already 3', why: 'The loop does not know the final answer yet.' },
        ],
        answer: 0,
      },
      solved: 'Once a start hits a duplicate, it can go no further.',
    },
  ],

  optimized: [
    {
      kind: 'watch',
      title: 'Grow right, repair left',
      lines: ['Keep `left = 0` and a Set of the characters inside the window.', 'Move `right` from 0 to n − 1; the new character is `s[right]`.', 'While `s[right]` is in the Set: remove `s[left]`, `left++`.', 'Now valid: add `s[right]`, `best = max(best, right − left + 1)`.'],
      frames: optFrames.slice(0, optCut),
    },
    {
      kind: 'turn',
      title: 'Your turn: repair the window',
      lines: ['While `s[right]` is in the Set, remove `s[left]` and move left.'],
      panels: [arr(P, { label: 's', pointers: lr(2, 5), range: [2, 5], highlights: win(6, 2, 5, { 2: 'bad', 5: 'bad' }) }), vars({ inWindow: '{w, k, e}', best: 3 })],
      task: { type: 'cell', question: '`right = 5` brings a second "w". Tap where `left` lands after the repair.', answer: 3, hints: { 2: 'The old "w" is still inside.', 4: 'One removal is enough here; left does not skip "k".', 5: 'Left only moves until the duplicate is gone.' } },
      solved: 'Remove the old "w" at 2; left = 3. Window "kew", best stays 3.',
      then: optFrames.slice(optCut + 1).map((f) => ({ ...f, say: 0 })),
    },
    {
      kind: 'turn',
      title: 'Your turn: one iteration',
      lines: ['Each turn of the for loop: check, repair, add, record.'],
      panels: [arr(P, { label: 's', pointers: lr(0, 2), range: [0, 2], highlights: win(6, 0, 2, { 2: 'bad' }) }), vars({ inWindow: '{p, w}', best: 2 })],
      task: {
        type: 'order',
        question: 'Tap the work for `right = 2` in order.',
        items: ['see "w" is already in the Set', 'remove s[left], left++ (while needed)', 'add s[right] to the Set', 'best = max(best, right − left + 1)'],
        hint: 'Repair first; record only once the window is valid.',
      },
      solved: 'Check, repair, add, record. The window is "w", best stays 2.',
    },
  ],

  template: [
    {
      kind: 'watch',
      title: 'Shortest valid: sum ≥ 7',
      lines: ['Only two things change between problems: **the state** and **what "invalid" means**.', 'Longest valid: shrink while invalid, then record.', 'Shortest valid: shrink while valid, recording each smaller window.'],
      frames: [{ say: 0, note: 'State: a running sum. Valid: sum ≥ 7.', panels: [arr(T, { label: 'arr, target 7' }), vars({ sum: 0, best: '∞' })] }, ...shortFrames],
    },
    {
      kind: 'turn',
      title: 'Your turn: who leaves?',
      lines: ['Inside the loop: record, `sum -= arr[left]`, `left++`.'],
      panels: [arr(T, { label: 'arr, target 7', pointers: lr(1, 4), range: [1, 4], highlights: win(6, 1, 4, { 4: 'active' }) }), vars({ sum: 10, best: 4 })],
      task: { type: 'cell', question: 'sum = 10 ≥ 7. After recording, tap the element `sum -= arr[left]` removes.', answer: 1, hints: { 0: 'Index 0 already left the window.', 4: 'That is right; it just entered.' } },
      solved: 'arr[1] = 3 leaves: sum = 7, left = 2. Still valid, so the loop runs again.',
    },
    {
      kind: 'turn',
      title: 'Your turn: what changes?',
      lines: ['Almost every variable-window problem fits the same skeleton.'],
      panels: [code('for right… { add arr[right]; while (…) { remove arr[left]; left++ } record }')],
      task: {
        type: 'choose',
        question: 'Moving to a new problem, what do you change?',
        options: [
          { text: 'The state you keep and what "invalid" means', why: '' },
          { text: 'The for loop over right', why: 'Right still walks 0 to n − 1 in every problem.' },
          { text: 'Whether left starts at 0', why: 'left = 0 is part of the fixed skeleton.' },
        ],
        answer: 0,
      },
      solved: 'Keep the skeleton; swap the **state** and the **invalid** test.',
    },
    {
      kind: 'watch',
      title: 'Counting trick: at most K',
      lines: ['For "at most K", every valid window adds `right − left + 1` subarrays ending at `right`.', '"Exactly K" is not monotonic; "at most K" is.', '`exactly(K) = atMost(K) − atMost(K − 1)`.'],
      frames: [...countFrames, { say: 1, note: `atMost(2) = ${AT2}. Run again with K = 1 to get atMost(1).`, panels: [vars({ 'atMost(2)': AT2, 'atMost(1)': '?' })] }],
    },
    {
      kind: 'turn',
      title: 'Your turn: exactly 2',
      lines: ['`exactly(K) = atMost(K) − atMost(K − 1)`.'],
      panels: [arr(D, { label: 'nums' }), vars({ 'atMost(2)': AT2, 'atMost(1)': AT1 })],
      task: { type: 'number', question: 'How many subarrays have **exactly 2** distinct values?', options: [4, 8, 12, 3], answer: AT2 - AT1, hint: `${AT2} − ${AT1}.` },
      solved: `${AT2} − ${AT1} = ${AT2 - AT1}: [1,2], [2,1], [1,2,1], [1,3].`,
    },
  ],

  implementation: [
    {
      kind: 'watch',
      title: 'Jump with lastSeen',
      lines: ['A Map stores each character\'s **last index**.', 'On a repeat inside the window, left **jumps** past the previous copy.', 'The `>= left` check: an old occurrence outside the window is ignored.'],
      frames: [
        jumpFrame(jump[0], 0, 'right = 0: store a → 0. best = 1.'),
        jumpFrame(jump[1], 0, 'right = 1: store b → 1. best = 2.'),
        jumpFrame(jump[2], 1, `right = 2: ${jump[2].moved}Store b → 2.`),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: an old copy',
      lines: ['`if (lastSeen.has(ch) && lastSeen.get(ch) >= left)`'],
      panels: [arr(AB, { label: 's', pointers: lr(2, 3), range: [2, 3], highlights: { 0: 'muted', 1: 'muted', 2: 'window', 3: 'active' } }), mapTable(jump[2].after, 'last index')],
      task: {
        type: 'choose',
        question: '`right = 3` is "a". lastSeen has a → 0, and left = 2. What happens to left?',
        options: [
          { text: 'Jump to 1', why: 'That would move left backwards; the "a" at 0 is outside the window.' },
          { text: 'Stay at 2', why: '' },
          { text: 'Jump to 3', why: 'Only a copy inside the window forces a jump, and there is none.' },
        ],
        answer: 1,
      },
      solved: '0 < left, so the old "a" is ignored. Window "ba", best 2.',
      then: [jumpFrame(jump[3], 0, 'Store a → 3. Window [2, 3] = "ba", best = 2.')],
    },
    {
      kind: 'turn',
      title: 'Your turn: the letter slot',
      lines: ['Lowercase only: `new Array(26).fill(0)`, indexed by `s.charCodeAt(i) - 97`.'],
      panels: [arr([0, 0, 0, 0, 0, 0, 0, 0], { label: 'counts for a … h' })],
      task: { type: 'cell', question: 'Tap the slot that counts the letter **"d"**.', answer: 3, hints: { 4: '"a" is slot 0, so count from there.', 2: 'That slot is "c".' } },
      solved: '"d" − 97 = 3: a → 0, b → 1, c → 2, d → 3.',
      then: [{ say: 0, note: '"d" enters the window: counts[3]++.', panels: [arr([0, 0, 0, 1, 0, 0, 0, 0], { label: 'counts for a … h', highlights: { 3: 'active' } })] }],
    },
  ],

  'dry-run': [
    {
      kind: 'watch',
      title: 'lengthOfLongestSubstring("abcabcbb")',
      lines: ['No duplicate: just add `s[right]`.', 'Duplicate: remove from the left until it is gone, then add.'],
      frames: [{ say: 0, note: 'left = 0, empty window.', panels: [arr(S, { label: 's', pointers: [ptr(0, 'left')] }), vars({ best: 0, 'left moves': 0 })] }, ...dry.slice(0, 7).map(dryFrame)],
    },
    {
      kind: 'turn',
      title: 'Your turn: the last character',
      lines: ['Remove from the left until the duplicate is gone.'],
      panels: [arr(S, { label: 's', pointers: lr(5, 7), range: [5, 7], highlights: win(8, 5, 7, { 6: 'bad', 7: 'bad' }) }), vars({ best: 3, window: '"cb" + "b"' })],
      task: { type: 'cell', question: '`right = 7` is another "b". Tap where `left` lands.', answer: 7, hints: { 5: 'The window still holds the old "b" at 6.', 6: 'The "b" at 6 is the duplicate; it must leave too.' } },
      solved: 'Remove "c" and "b": left = 7. Window "b", best stays 3.',
      then: [{ ...dryFrame(dry[7]), say: 0 }],
    },
    {
      kind: 'turn',
      title: 'Your turn: total moves',
      lines: ['Count every `left++` over the whole run.'],
      panels: [arr(S, { label: 's', pointers: lr(7, 7), range: [7, 7], highlights: win(8, 7, 7, hl(7, () => 'muted')) }), vars({ best: 3 })],
      task: { type: 'number', question: 'How many times did `left` move in total?', options: [3, 7, 8, 15], answer: dry[7].leftMoves, hint: 'left started at 0 and ended at 7.' },
      solved: `left moved ${dry[7].leftMoves} times, right 8: 15 steps for n = 8. Linear.`,
    },
  ],

  mistakes: [
    {
      kind: 'watch',
      title: '`if` instead of `while`',
      lines: ['**`if` instead of `while`**: one removal is not always enough.', 'With `while`, keep removing until the window is valid again.'],
      frames: [
        { say: 0, note: 'Window "abc"; the next "b" is a duplicate.', panels: [arr(ABCB, { label: 's', pointers: lr(0, 3), range: [0, 3], highlights: { 0: 'window', 1: 'bad', 2: 'window', 3: 'bad' } }), vars({ inWindow: '{a, b, c}' })] },
        { say: 0, note: '`if`: remove "a" once, left = 1. Window "bcb" still repeats "b".', panels: [arr(ABCB, { label: 's (if)', pointers: lr(1, 3), range: [1, 3], highlights: { 0: 'muted', 1: 'bad', 2: 'window', 3: 'bad' } }), vars({ inWindow: '{b, c}' })] },
        { say: 1, note: '`while`: remove "a", then "b". left = 2, window "cb" is valid.', panels: [arr(ABCB, { label: 's (while)', pointers: lr(2, 3), range: [2, 3], highlights: { 0: 'muted', 1: 'muted', 2: 'window', 3: 'active' } }), vars({ inWindow: '{c, b}' })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: the leaving element',
      lines: ['Fixed window: the element leaving is `nums[right - k]`.'],
      panels: [arr(A, { label: 'nums, k = 3', pointers: [ptr(4, 'right', 'b')], range: [1, 3], highlights: win(6, 1, 3, { 4: 'active' }) })],
      task: { type: 'cell', question: '`right = 4` enters. Tap the element that leaves.', answer: 1, hints: { 2: 'right − k = 4 − 3, not 4 − 2.', 0: 'Index 0 left on the previous step.', 4: 'That one is entering.' } },
      solved: '`nums[4 - 3]` = nums[1] leaves. Window [2, 4].',
    },
    {
      kind: 'turn',
      title: 'Your turn: first full window',
      lines: ['The window is full once `right >= k - 1`.'],
      panels: [arr([4, 1, 7, 3, 2, 6], { label: 'nums, k = 4', pointers: [ptr(0, 'right', 'b')], highlights: { 0: 'active' } })],
      task: { type: 'number', question: 'With `k = 4`, at which `right` is the window full for the first time?', options: [2, 3, 4, 5], answer: 3, hint: 'right >= k − 1.' },
      solved: 'right = 3: indexes 0 to 3 are 4 cells.',
    },
    {
      kind: 'turn',
      title: 'Your turn: the hidden O(n·k)',
      lines: ['Some lines look harmless inside the loop.'],
      panels: [arr('abcabcbb'.split(''), { label: 's', pointers: lr(1, 4), range: [1, 4], highlights: win(8, 1, 4) })],
      task: {
        type: 'choose',
        question: 'Which line, run on every step, silently brings back **O(n·k)**?',
        options: [
          { text: '`best = Math.max(best, right - left + 1)`', why: 'One comparison: O(1) per step.' },
          { text: '`s.substring(left, right + 1)`', why: '' },
          { text: '`inWindow.add(s[right])`', why: 'Adding to a Set is O(1) per step.' },
        ],
        answer: 1,
      },
      solved: 'A substring copies the window: O(k) per step.',
    },
  ],

  'interview-tips': [
    {
      kind: 'watch',
      title: 'Say it out loud',
      lines: ['**Say the brute force first**, then what is repeated and how the window reuses it.', '**State the invariant**: after the while loop, the window never contains a duplicate.', '**Name the complexity**: left and right each move at most n times.'],
      frames: [
        { say: 0, note: '"Try every substring: O(n²)."', panels: [arr(ABCB, { label: 's', range: [0, 3], highlights: win(4, 0, 3) }), vars({ say: 'brute force O(n²)' })] },
        { say: 1, note: 'After the repair: window "cb", no duplicate. Invariant holds.', panels: [arr(ABCB, { label: 's', pointers: lr(2, 3), range: [2, 3], highlights: { 0: 'muted', 1: 'muted', 2: 'done', 3: 'done' } }), vars({ say: 'no duplicate in [left, right]' })] },
        { say: 2, note: 'right moved 4 times, left 2 times: each at most n = 4.', panels: [arr(ABCB, { label: 's', pointers: lr(2, 3) }), vars({ 'right moves': 4, 'left moves': 2, n: 4 })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: edge case',
      lines: ['Edge cases to mention: empty input, **k > n**, all identical characters, answer is the whole array.'],
      panels: [arr([4, 2], { label: 'nums, k = 3' })],
      task: { type: 'number', question: 'How many windows of size `k = 3` fit in this array?', options: [0, 1, 2], answer: 0, hint: 'n = 2 is smaller than k = 3.' },
      solved: 'k > n: no full window exists. Say how you handle it.',
    },
    {
      kind: 'turn',
      title: 'Your turn: check monotonicity',
      lines: ['"All numbers are positive, so shrinking always decreases the sum."'],
      panels: [arr([2, 3, 1, 2], { label: 'all positive', range: [0, 3], highlights: { 0: 'bad', 1: 'window', 2: 'window', 3: 'window' } }), vars({ sum: 8 })],
      task: {
        type: 'choose',
        question: 'All numbers are positive. Drop the left element. What happens to the sum?',
        options: [
          { text: 'It goes down', why: '' },
          { text: 'It goes up', why: 'Only removing a negative number could raise the sum.' },
          { text: 'It could go either way', why: 'With only positives, removing always lowers the sum.' },
        ],
        answer: 0,
      },
      solved: '8 − 2 = 6: shrinking lowers the sum, so the window is safe to use.',
    },
  ],
};
