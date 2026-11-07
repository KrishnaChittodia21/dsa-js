// Step lessons for Stack (M2). Format: src/content/stepSchema.js. Facts come only from topic.js.
const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const stk = (values, label) => ({ kind: 'stack', values, ...(label ? { label } : {}) });
const table = (rowLabels, colLabels, cells, states, label) => ({ kind: 'table', rowLabels, colLabels, cells, ...(states ? { states } : {}), ...(label ? { label } : {}) });
const hl = (n, f) => Object.fromEntries(Array.from({ length: n }, (_, k) => [k, f(k)]));
const ptr = (index, label, color = 'a') => ({ index, label, color });
// a table that reveals its answers row by row: k = row being revealed now
const reveal = (rows, col, k, hidden = '?') => table(rows.map((r) => r[0]), [col], rows.map((r, i) => [i <= k ? r[1] : hidden]), rows.map((_, i) => [i === k ? 'active' : i < k ? 'done' : '']));
// an index stack drawn as "i2: 5" so both the index and its value show
const idxStack = (st, nums, label = 'st (index: value)') => stk(st.map((j) => `i${j}: ${nums[j]}`), label);

// ---------- brackets: run isValid, one event per character ----------
const PAIR = { ')': '(', ']': '[', '}': '{' };
function bracketRun(s) {
  const out = [];
  const st = [];
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch in PAIR) {
      const top = st.pop();
      const ok = top === PAIR[ch];
      out.push({ i, ch, kind: ok ? 'match' : 'fail', top, st: st.slice() });
      if (!ok) return out;
    } else {
      st.push(ch);
      out.push({ i, ch, kind: 'push', st: st.slice() });
    }
  }
  out.push({ kind: 'end', ok: st.length === 0, st: st.slice() });
  return out;
}
const bracketFrames = (s, say) => {
  const chars = [...s];
  return bracketRun(s).map((e) => {
    const end = e.kind === 'end';
    const note = end
      ? e.ok
        ? 'End: the stack is empty → valid.'
        : `End: "${e.st.join('')}" is still open → invalid.`
      : e.kind === 'push'
        ? `"${e.ch}" opens: push it.`
        : e.kind === 'match'
          ? `"${e.ch}" closes; the top is "${e.top}" → match, pop.`
          : `"${e.ch}" closes, but pop() gives ${e.top === undefined ? 'undefined (empty stack)' : `"${e.top}"`} → invalid.`;
    return {
      say: say(e),
      note,
      panels: [
        arr(chars, { label: 's', ...(end ? {} : { pointers: [ptr(e.i, 'ch')] }), highlights: hl(chars.length, (k) => (end ? (e.ok ? 'done' : '') : k === e.i ? (e.kind === 'fail' ? 'bad' : e.kind === 'match' ? 'done' : 'active') : k < e.i ? 'visited' : '')) }),
        stk(e.st),
      ],
    };
  });
};

// ---------- next greater: brute force, one event per comparison ----------
function bruteRun(nums) {
  const out = [];
  const res = nums.map(() => -1);
  for (let i = 0; i < nums.length; i++)
    for (let j = i + 1; j < nums.length; j++) {
      const hit = nums[j] > nums[i];
      if (hit) res[i] = nums[j];
      out.push({ i, j, hit, res: res.slice() });
      if (hit) break;
    }
  return out;
}
const NG = [2, 1, 2, 4, 3]; // the lesson's example

// ---------- next greater: monotonic stack, one event per pop / push ----------
function monoRun(nums) {
  const out = [];
  const res = nums.map(() => -1);
  const st = [];
  for (let i = 0; i < nums.length; i++) {
    while (st.length && nums[st.at(-1)] < nums[i]) {
      const j = st.pop();
      res[j] = nums[i];
      out.push({ i, kind: 'pop', j, st: st.slice(), res: res.slice() });
    }
    st.push(i);
    out.push({ i, kind: 'push', st: st.slice(), res: res.slice() });
  }
  return out;
}
const monoFrames = (nums, sayPop, sayPush) =>
  monoRun(nums).map((e) => ({
    say: e.kind === 'pop' ? sayPop : sayPush,
    note: e.kind === 'pop' ? `${nums[e.i]} > ${nums[e.j]}: pop index ${e.j}, res[${e.j}] = ${nums[e.i]}.` : `Push index ${e.i} (${nums[e.i]}): it waits for its own answer.`,
    panels: [
      arr(nums, { label: 'nums', showIndices: true, pointers: [ptr(e.i, 'i')], highlights: hl(nums.length, (k) => (k === e.i ? 'active' : e.kind === 'pop' && k === e.j ? 'done' : '')) }),
      idxStack(e.st, nums),
      arr(e.res, { label: 'res', showIndices: true, highlights: e.kind === 'pop' ? { [e.j]: 'done' } : {} }),
    ],
  }));
const MONO = [4, 2, 1, 3, 6, 5];

// ---------- circular next greater: k runs 0 .. 2n − 1 ----------
function circRun(nums) {
  const n = nums.length;
  const out = [];
  const res = nums.map(() => -1);
  const st = [];
  for (let k = 0; k < 2 * n; k++) {
    const i = k % n;
    const popped = [];
    while (st.length && nums[st.at(-1)] < nums[i]) {
      const j = st.pop();
      res[j] = nums[i];
      popped.push(j);
    }
    if (k < n) st.push(i);
    out.push({ k, i, popped, pushed: k < n, st: st.slice(), res: res.slice() });
  }
  return out;
}
const CIRC = [2, 5, 3, 1];
const CIRC2 = [1, 4, 2, 3];

// ---------- daily temperatures: distance instead of value ----------
function dailyRun(t) {
  const out = [];
  const ans = t.map(() => 0);
  const st = [];
  for (let i = 0; i < t.length; i++) {
    while (st.length && t[st.at(-1)] < t[i]) {
      const j = st.pop();
      ans[j] = i - j;
      out.push({ i, kind: 'pop', j, st: st.slice(), ans: ans.slice() });
    }
    st.push(i);
    out.push({ i, kind: 'push', st: st.slice(), ans: ans.slice() });
  }
  return out;
}
const TEMPS = [30, 38, 32, 31, 35, 40];
const TEMPS2 = [70, 68, 69, 72];

// ---------- RPN ----------
function rpnRun(tokens) {
  const out = [];
  const st = [];
  for (const t of tokens) {
    if ('+-*/'.includes(t) && t.length === 1) {
      const b = st.pop();
      const a = st.pop();
      const v = t === '+' ? a + b : t === '-' ? a - b : t === '*' ? a * b : Math.trunc(a / b);
      st.push(v);
      out.push({ t, a, b, v, st: st.slice() });
    } else {
      st.push(Number(t));
      out.push({ t, st: st.slice() });
    }
  }
  return out;
}
const rpnFrames = (tokens, sayNum, sayOp) =>
  rpnRun(tokens).map((e, k) => ({
    say: e.a === undefined ? sayNum : sayOp,
    note: e.a === undefined ? `"${e.t}" is a number: push it.` : `"${e.t}": pop b = ${e.b}, pop a = ${e.a}, push ${e.a} ${e.t} ${e.b} = ${e.v}.`,
    panels: [arr(tokens, { label: 'tokens', pointers: [ptr(k, 't')], highlights: hl(tokens.length, (x) => (x === k ? 'active' : x < k ? 'visited' : '')) }), stk(e.st), ...(e.a === undefined ? [] : [vars({ a: e.a, b: e.b })])],
  }));

// ---------- basic calculator with + − ( ) and a sign stack ----------
function calcRun(tokens) {
  const out = [];
  const st = [];
  let result = 0,
    sign = 1;
  for (const t of tokens) {
    if (t === '+') sign = 1;
    else if (t === '-') sign = -1;
    else if (t === '(') {
      st.push(result, sign);
      result = 0;
      sign = 1;
    } else if (t === ')') {
      const s = st.pop();
      const r = st.pop();
      result = r + s * result;
    } else result += sign * Number(t);
    out.push({ t, result, sign, st: st.slice() });
  }
  return out;
}
const CALC = ['5', '-', '(', '1', '+', '2', ')'];

// ---------- histogram with sentinel ----------
function histRun(h) {
  const out = [];
  const st = [];
  let best = 0;
  for (let i = 0; i <= h.length; i++) {
    const cur = i === h.length ? 0 : h[i];
    while (st.length && h[st.at(-1)] >= cur) {
      const j = st.pop();
      const left = st.length ? st.at(-1) : -1;
      const area = h[j] * (i - left - 1);
      best = Math.max(best, area);
      out.push({ i, kind: 'pop', j, left, width: i - left - 1, area, best, st: st.slice() });
    }
    st.push(i);
    out.push({ i, kind: 'push', best, st: st.slice() });
  }
  return out;
}
const HIST = [2, 1, 5, 6, 2, 3]; // the lesson's dry run
const HIST2 = [3, 5, 4, 1];
const histFrames = (h, sayPop, sayPush) =>
  histRun(h).map((e) => {
    const sentinel = e.i === h.length;
    const hStack = (st) => stk(st.map((j) => (j === h.length ? `i${j}: 0 (sentinel)` : `i${j}: ${h[j]}`)), 'st (index: height)');
    return {
      say: e.kind === 'pop' ? sayPop : sayPush,
      note:
        e.kind === 'pop'
          ? `${sentinel ? 'Sentinel 0' : `i = ${e.i}`} pops bar ${e.j}: ${h[e.j]} × (${e.i} − ${e.left < 0 ? '(−1)' : e.left} − 1) = ${h[e.j]} × ${e.width} = ${e.area}.`
          : sentinel
            ? `Stack flushed; best = ${e.best}.`
            : `Push bar ${e.i} (height ${h[e.i]}).`,
      panels: [
        arr(h, {
          label: sentinel ? 'heights (i = n: sentinel 0)' : 'heights',
          showIndices: true,
          pointers: sentinel ? [] : [ptr(e.i, 'i')],
          highlights: hl(h.length, (k) => (e.kind === 'pop' && k === e.j ? 'active' : e.kind === 'pop' && k > e.left && k < e.i ? 'window' : k === e.i ? 'active' : '')),
        }),
        hStack(e.st),
        vars(e.kind === 'pop' ? { prev: e.left, next: e.i, area: e.area, best: e.best } : { best: e.best }),
      ],
    };
  });

// ---------- dry run: the lesson's table for nextGreater([2, 1, 2, 4, 3]) ----------
const NEG = [-1, -1, -1, -1, -1];
const dryFrame = (i, say, note, stVals, res, done = [], hiNums = {}) => ({
  say,
  note,
  panels: [
    arr(NG, { label: 'nums', showIndices: true, ...(i === null ? {} : { pointers: [ptr(i, 'i')] }), highlights: hiNums }),
    stk(stVals, 'stack (values)'),
    arr(res, { label: 'res', showIndices: true, highlights: Object.fromEntries(done.map((k) => [k, 'done'])) }),
  ],
});

export default {
  what: [
    {
      kind: 'watch',
      title: 'Push, peek, pop',
      lines: [
        'A stack only adds or removes at **one end**: the **top**.',
        '**push(x)** puts x on top.',
        '**peek()** looks at the top without removing it.',
        '**pop()** removes and returns the top: last in, first out (**LIFO**).',
      ],
      frames: [
        { say: 0, note: 'An empty stack.', panels: [stk([])] },
        ...[1, 2, 3].map((x) => ({ say: 1, note: `push ${x}: ${x} is the new top.`, panels: [stk([1, 2, 3].slice(0, x))] })),
        { say: 2, note: 'peek → 3. Nothing moves.', panels: [stk([1, 2, 3]), vars({ peek: 3 })] },
        { say: 3, note: 'pop → 3: the last one in comes out first.', panels: [stk([1, 2]), vars({ returned: 3 })] },
        { say: 3, note: 'pop → 2.', panels: [stk([1]), vars({ returned: 2 })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: the plate pile',
      lines: ['Clean plates go on top; you take plates from the top.', 'Red went in first, green last.'],
      panels: [stk(['red', 'blue', 'green'], 'plates')],
      task: { type: 'order', question: 'Tap the plates in the order they are taken.', items: ['green', 'blue', 'red'], hint: 'Only the top plate can be taken.' },
      solved: 'Green, blue, red: the bottom plate went in first and is used last.',
      then: [
        { say: 0, note: 'Take green.', panels: [stk(['red', 'blue'], 'plates')] },
        { say: 0, note: 'Take blue.', panels: [stk(['red'], 'plates')] },
        { say: 0, note: 'Take red. The pile is empty.', panels: [stk([], 'plates')] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: which end of the array?',
      lines: ['A JavaScript array is already a stack.', 'Its top must be the end where operations are O(1).'],
      panels: [arr([1, 2, 3], { label: 'stack as an array', showIndices: true, pointers: [ptr(2, 'top')], highlights: { 2: 'active' } })],
      task: {
        type: 'choose',
        question: 'Which pair of methods should a stack use?',
        options: [
          { text: '`push` / `pop` at the end', why: '' },
          { text: '`unshift` / `shift` at the front', why: 'They move every element: O(n) each.' },
          { text: '`push` / `shift`', why: 'That takes from the other end: first in, first out. Not a stack.' },
        ],
        answer: 0,
      },
      solved: '`push` / `pop` work at the end: O(1). Peek with `stack[stack.length - 1]` or `stack.at(-1)`.',
    },
  ],

  why: [
    {
      kind: 'watch',
      title: 'Nesting means "most recent first"',
      lines: ['In `( [ { } ] )` the last bracket opened must be the first one closed.', 'So each closer meets the most recent opener: the top.'],
      frames: bracketFrames('([{}])', (e) => (e.kind === 'push' ? 0 : 1)),
    },
    {
      kind: 'turn',
      title: 'Your turn: the call stack',
      lines: ['Function calls nest too.', 'The call stack returns from the **most recent** call first.'],
      panels: [stk(['main', 'a', 'b', 'c'], 'call stack')],
      task: { type: 'order', question: '`main` calls `a`, `a` calls `b`, `b` calls `c`. Tap them in the order they return.', items: ['c', 'b', 'a', 'main'], hint: 'The function on top is the one running now.' },
      solved: 'c, b, a, main. Recursion is literally a stack.',
    },
    {
      kind: 'turn',
      title: 'Your turn: the second big reason',
      lines: ['The **monotonic stack** handles a different kind of question.', 'It answers it for every index in one O(n) pass, instead of O(n²).'],
      panels: [arr(NG, { label: 'nums', showIndices: true }), arr(['?', '?', '?', '?', '?'], { label: 'answer per index', showIndices: true })],
      task: {
        type: 'choose',
        question: 'Which question does it answer for every index?',
        options: [
          { text: 'What is the next bigger element to my right?', why: '' },
          { text: 'How many times does my value appear?', why: 'Counting occurrences is a hash map job.' },
          { text: 'Which bracket closes me?', why: 'That is the plain matching stack, the first reason.' },
        ],
        answer: 0,
      },
      solved: '"Next bigger to my right", for every index, in one pass.',
    },
  ],

  when: [
    {
      kind: 'watch',
      title: 'Which stack flavour?',
      lines: ['Each situation has its own stack flavour.', 'Two of them use a **monotonic** stack.'],
      frames: [
        ['Brackets, tags', 'matching'],
        ['Expressions', 'expression'],
        ['Undo, collisions', 'cancellation'],
        ['O(1) min, queue', 'design'],
        ['Next greater', 'monotonic'],
        ['Largest rectangle', 'boundaries'],
      ].map((_, k, all) => ({ say: k < 4 ? 0 : 1, note: `${all[k][0]} → ${all[k][1]} stack.`, panels: [reveal(all, 'flavour', k)] })),
    },
    {
      kind: 'turn',
      title: 'Your turn: getMin in O(1)',
      lines: ['Problem: a stack that also returns its minimum in O(1).'],
      panels: [stk([5, 2, 7]), vars({ getMin: '?' })],
      task: {
        type: 'choose',
        question: 'Which flavour is it?',
        options: [
          { text: 'Design', why: '' },
          { text: 'Monotonic', why: 'That one finds next/previous greater or smaller elements.' },
          { text: 'Matching', why: 'Nothing here is opened and closed.' },
        ],
        answer: 0,
      },
      solved: 'O(1) min of a stack is a **design** problem.',
    },
  ],

  recognize: [
    {
      kind: 'watch',
      title: 'Two strong signals',
      lines: ['Signal 1: **the most recent unmatched thing matters** → plain stack.', 'Signal 2: **nearest bigger/smaller to the left or right** → monotonic stack.'],
      frames: [
        ['brackets / tags', 'plain'],
        ['"evaluate"', 'plain'],
        ['undo the previous', 'plain'],
        ['"next greater"', 'monotonic'],
        ['"days until"', 'monotonic'],
        ['"histogram"', 'monotonic'],
      ].map((_, k, all) => ({ say: k < 3 ? 0 : 1, note: `${all[k][0]} → ${all[k][1]} stack.`, panels: [reveal(all, 'stack', k)] })),
    },
    {
      kind: 'turn',
      title: 'Your turn: shorter to the left',
      lines: ['Problem: for each bar, find the first **shorter** bar on its left.'],
      panels: [arr([3, 5, 4, 1], { label: 'heights', showIndices: true, pointers: [ptr(2, 'me')], highlights: { 2: 'active' } })],
      task: {
        type: 'choose',
        question: 'Which signal is this?',
        options: [
          { text: 'Monotonic stack: nearest smaller on the left', why: '' },
          { text: 'Plain stack: the most recent unmatched thing', why: 'Nothing is opened and closed; the clue is "nearest smaller".' },
          { text: 'No stack: count with a hash map', why: 'Counting does not find positions of nearby bars.' },
        ],
        answer: 0,
      },
      solved: '"First shorter on the left" = previous smaller: a **monotonic** stack.',
    },
  ],

  intuition: [
    {
      kind: 'watch',
      title: 'Promises kept and broken',
      lines: [
        'An **opening** bracket is a promise: push it.',
        'A **closing** bracket must match the top; pop it.',
        'At the end the stack must be **empty**.',
      ],
      frames: bracketFrames('({[]})[', (e) => (e.kind === 'push' ? 0 : e.kind === 'end' ? 2 : 1)),
    },
    {
      kind: 'turn',
      title: 'Your turn: where does it fail?',
      lines: ['A closer with nothing open is invalid too.'],
      panels: [arr([...'()]{}'], { label: 's', showIndices: true })],
      task: { type: 'cell', question: 'Tap the character where the check returns false.', answer: 2, hints: { 1: '")" matches the "(" on top. Fine.', 3: 'The check has already stopped before this.', 4: 'The check has already stopped before this.' } },
      solved: 'At "]" the stack is empty: there is no opener to close.',
      then: bracketFrames('()]{}', () => 0),
    },
    {
      kind: 'turn',
      title: 'Your turn: how deep?',
      lines: ['Each opener pushes, each matching closer pops.'],
      panels: [arr([...'(()[{}])'], { label: 's', showIndices: true })],
      task: { type: 'number', question: 'What is the most brackets on the stack at one time?', options: [2, 3, 4, 8], answer: 3, hint: 'Track the size: +1 for an opener, −1 for a closer.' },
      solved: 'Three: "(", "[", "{" just before "}" arrives.',
      then: bracketFrames('(()[{}])', () => 0),
    },
  ],

  'brute-force': [
    {
      kind: 'watch',
      title: 'Look right from every index',
      lines: ['For each i, scan j = i + 1, i + 2, … for the first `nums[j] > nums[i]`.', 'If none is found, res[i] stays −1.'],
      frames: [
        ...bruteRun(NG).map((e) => ({
          say: 0,
          note: `i = ${e.i}, j = ${e.j}: ${NG[e.j]} > ${NG[e.i]}? ${e.hit ? `yes → res[${e.i}] = ${NG[e.j]}.` : e.j === NG.length - 1 ? 'no, and the scan ends.' : 'no.'}`,
          panels: [
            arr(NG, { label: 'nums', showIndices: true, pointers: [ptr(e.i, 'i'), ptr(e.j, 'j', 'b')], highlights: { [e.i]: 'active', [e.j]: e.hit ? 'done' : 'bad' } }),
            arr(e.res, { label: 'res', showIndices: true, highlights: e.hit ? { [e.i]: 'done' } : {} }),
          ],
        })),
        { say: 1, note: 'Index 4 has nothing to its right. Answer [4, 2, 4, −1, −1].', panels: [arr([4, 2, 4, -1, -1], { label: 'res', showIndices: true, highlights: { 3: 'muted', 4: 'muted' } })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: the worst case',
      lines: ['In a decreasing array no j ever wins.', 'Every inner loop runs to the end.'],
      panels: [arr([5, 4, 3, 2, 1], { label: 'nums', showIndices: true })],
      task: { type: 'number', question: 'How many comparisons does brute force make?', options: [5, 10, 15, 25], answer: 10, hint: 'Index i compares with every index after it.' },
      solved: '4 + 3 + 2 + 1 = 10: about n²/2, so O(n²).',
    },
  ],

  optimized: [
    {
      kind: 'watch',
      title: 'Waiting indices, decreasing values',
      lines: [
        'The stack holds **indices still waiting** for their next greater element.',
        '**While** the top is smaller than x: x is its answer. Pop it.',
        'Then push the current index: it waits too.',
        'Indices left at the end have no answer: −1.',
      ],
      frames: [
        { say: 0, note: 'Nothing is waiting yet; every answer starts at −1.', panels: [arr(MONO, { label: 'nums', showIndices: true }), idxStack([], MONO), arr(MONO.map(() => -1), { label: 'res', showIndices: true })] },
        ...monoFrames(MONO, 1, 2),
        { say: 3, note: 'Indices 4 and 5 are still waiting: their answers stay −1.', panels: [arr(MONO, { label: 'nums', showIndices: true, highlights: { 4: 'muted', 5: 'muted' } }), idxStack([4, 5], MONO), arr([6, 3, 3, 6, -1, -1], { label: 'res', showIndices: true, highlights: { 4: 'muted', 5: 'muted' } })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: pop order',
      lines: ['8 arrives. Values on the stack are decreasing.', 'It pops while the top is smaller than 8.'],
      panels: [arr([9, 7, 5, 2, 8], { label: 'nums', showIndices: true, pointers: [ptr(4, 'i')], highlights: { 4: 'active' } }), idxStack([0, 1, 2, 3], [9, 7, 5, 2])],
      task: { type: 'order', question: 'Tap the values in the order 8 pops them.', items: ['2', '5', '7'], hint: 'Only the top can be popped, and 9 is not smaller than 8.' },
      solved: '2, 5, 7 all get answer 8. 9 stays: it is bigger.',
      then: monoFrames([9, 7, 5, 2, 8], 1, 0).slice(4),
    },
    {
      kind: 'turn',
      title: 'Your turn: count the pops',
      lines: ['One step of the `while` may pop many items.', 'But each index is pushed once and popped **at most** once.'],
      panels: [arr(MONO, { label: 'nums', showIndices: true }), arr([6, 3, 3, 6, -1, -1], { label: 'res', showIndices: true })],
      task: { type: 'number', question: 'On this 6-element array, how many pops happen in total?', options: [2, 4, 6, 15], answer: 4, hint: 'Every index that got an answer was popped once.' },
      solved: '4 pops + 6 pushes: at most 2n operations, so **O(n)**.',
    },
    {
      kind: 'turn',
      title: 'Your turn: shadowed forever',
      lines: ['Value 3 was popped by value 7 at a later index.'],
      panels: [arr([3, 7, '?'], { label: 'nums', pointers: [ptr(2, 'later')], highlights: { 0: 'muted', 1: 'active' } }), idxStack([1], [3, 7])],
      task: {
        type: 'choose',
        question: 'Can 3 ever be the next greater element of a later index?',
        options: [
          { text: 'No: 7 is closer and bigger, so it would win first', why: '' },
          { text: 'Yes, if the later value is 2', why: '7 is also greater than 2, and 7 comes first.' },
          { text: 'Yes, if the later value is 5', why: '3 is not greater than 5.' },
        ],
        answer: 0,
      },
      solved: '3 is **shadowed** by 7. Throwing it away loses nothing.',
    },
  ],

  template: [
    {
      kind: 'watch',
      title: 'Circular: iterate twice',
      lines: ['Loop k from 0 to 2n − 1 with `i = k % n`.', 'Pop and answer in both passes.', 'Push only when `k < n`: each index once.'],
      frames: [
        ...circRun(CIRC).map((e) => ({
          say: e.k < CIRC.length ? (e.popped.length ? 1 : 2) : 1,
          note: `k = ${e.k}, i = ${e.i}${e.popped.length ? `: ${CIRC[e.i]} answers ${e.popped.map((j) => `index ${j}`).join(', ')}` : ': no pop'}${e.pushed ? `; push ${e.i}.` : e.k >= CIRC.length ? ' (second pass, no push).' : '.'}`,
          panels: [
            arr(CIRC, { label: e.k < CIRC.length ? 'nums, pass 1' : 'nums, pass 2', showIndices: true, pointers: [ptr(e.i, 'i')], highlights: hl(CIRC.length, (x) => (x === e.i ? 'active' : e.popped.includes(x) ? 'done' : '')) }),
            idxStack(e.st, CIRC),
            arr(e.res, { label: 'res', showIndices: true, highlights: Object.fromEntries(e.popped.map((j) => [j, 'done'])) }),
          ],
        })),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: answered on the way round',
      lines: ['Same circular loop on a new array.'],
      panels: [arr(CIRC2, { label: 'nums (circular)', showIndices: true })],
      task: { type: 'cell', question: 'Tap the index that gets its answer only in the **second** pass.', answer: 3, hints: { 0: '4 answers index 0 at k = 1, in the first pass.', 1: '4 is the largest: it never gets an answer.', 2: '3 answers index 2 at k = 3, in the first pass.' } },
      solved: 'Index 3 (value 3) waits until 4 comes round again at k = 5.',
      then: circRun(CIRC2)
        .filter((e) => e.popped.length)
        .map((e) => ({
          say: 0,
          note: `k = ${e.k}: ${CIRC2[e.i]} answers index ${e.popped.join(', ')}${e.k >= CIRC2.length ? ' (second pass).' : '.'}`,
          panels: [arr(CIRC2, { label: e.k < CIRC2.length ? 'pass 1' : 'pass 2', showIndices: true, pointers: [ptr(e.i, 'i')], highlights: Object.fromEntries(e.popped.map((j) => [j, 'done'])) }), arr(e.res, { label: 'res', showIndices: true })],
        })),
    },
    {
      kind: 'turn',
      title: 'Your turn: the context stack',
      lines: ['For nested structures, an opening bracket does `st.push(cur); cur = initialState()`.', 'Now the matching closing bracket arrives.'],
      panels: [stk(['outer cur'], 'st'), vars({ token: ')', cur: 'inner' })],
      task: {
        type: 'choose',
        question: 'What does the loop do at the closing bracket?',
        options: [
          { text: '`cur = combine(st.pop(), cur)`', why: '' },
          { text: '`st.push(cur)`', why: 'That is what an opening bracket does.' },
          { text: '`cur = initialState()`', why: 'That throws away the finished inner part.' },
        ],
        answer: 0,
      },
      solved: 'Pop the saved outer state and combine it with the finished inner one.',
      then: [{ say: 0, note: 'The outer context is restored, with the inner result folded in.', panels: [stk([], 'st'), vars({ cur: 'outer + inner' })] }],
    },
  ],

  'optimized-expression': [
    {
      kind: 'watch',
      title: 'RPN: operands wait on the stack',
      lines: ['RPN writes the operator after its operands: `2 1 + 3 *` is (2 + 1) × 3.', 'A number → push it.', 'An operator → pop **b** first, then **a**, push `a op b`.'],
      frames: [{ say: 0, note: 'No parentheses needed.', panels: [arr(['2', '1', '+', '3', '*'], { label: 'tokens' }), stk([])] }, ...rpnFrames(['2', '1', '+', '3', '*'], 1, 2)],
    },
    {
      kind: 'turn',
      title: 'Your turn: evaluate it',
      lines: ['Same rules: numbers push, an operator pops two and pushes the result.'],
      panels: [arr(['3', '4', '+', '2', '*'], { label: 'tokens' }), stk([])],
      task: { type: 'number', question: 'What is left on the stack at the end?', options: [10, 11, 14, 24], answer: 14, hint: '`3 4 +` happens first.' },
      solved: '(3 + 4) × 2 = 14.',
      then: rpnFrames(['3', '4', '+', '2', '*'], 0, 0),
    },
    {
      kind: 'turn',
      title: 'Your turn: the tallest moment',
      lines: ['Operands pile up until an operator uses them.'],
      panels: [arr(['2', '3', '4', '*', '+'], { label: 'tokens', showIndices: true })],
      task: { type: 'cell', question: 'Tap the token right after which the stack is tallest.', answer: 2, hints: { 3: '`*` pops two and pushes one: the stack shrinks.', 1: 'Another number is still coming.' } },
      solved: 'After "4": [2, 3, 4]. Then `*` makes 12 and `+` makes 14.',
      then: rpnFrames(['2', '3', '4', '*', '+'], 0, 0),
    },
    {
      kind: 'watch',
      title: 'Calculator with a sign stack',
      lines: [
        'Digit → `result += sign * number`; `+` / `−` set `sign`.',
        '`(` → push `result` and `sign`, then reset to 0 and +1.',
        '`)` → `result = savedResult + savedSign * result`.',
      ],
      frames: [
        ['1', '1', '+1', [], 'result += 1', 0],
        ['-', '1', '-1', [], 'sign = −1', 0],
        ['(', '0', '+1', [1, -1], 'save outer (1, −), reset', 1],
        ['4', '4', '+1', [1, -1], 'result += 4', 0],
        ['+ 5', '9', '+1', [1, -1], 'result += 5', 0],
        ['- 2', '7', '-1', [1, -1], 'result −= 2', 0],
        [')', '1 + (−1)·7 = −6', '', [], 'combine with saved context', 2],
        ['+ 3', '-3', '+1', [], 'answer −3', 0],
      ].map(([tok, result, sign, st, note, say], k, all) => ({
        say,
        note: `"${tok}": ${note}.`,
        panels: [
          arr(all.map((r) => r[0]), { label: '"1 - (4 + 5 - 2) + 3"', pointers: [ptr(k, 'tok')], highlights: hl(all.length, (x) => (x === k ? 'active' : x < k ? 'visited' : '')) }),
          vars(sign ? { result, sign } : { result }),
          stk(st.length ? ['1 (result)', '−1 (sign)'] : []),
        ],
      })),
    },
    {
      kind: 'turn',
      title: 'Your turn: what gets saved?',
      lines: ['Expression `5 - (1 + 2)`.', 'Before "(": result = 5, sign = −1.'],
      panels: [arr(CALC, { label: 'tokens', pointers: [ptr(2, 'tok')], highlights: { 0: 'visited', 1: 'visited', 2: 'active' } }), vars({ result: 5, sign: -1 }), stk([])],
      task: {
        type: 'choose',
        question: 'What does "(" push?',
        options: [
          { text: 'result 5 and sign −1', why: '' },
          { text: 'Only 5', why: 'Without the sign, ")" could not tell whether to add or subtract the inside.' },
          { text: 'Nothing: just reset', why: 'Then the outer 5 is lost.' },
        ],
        answer: 0,
      },
      solved: 'Save the outer context (5, −), then evaluate the inside from 0.',
      then: calcRun(CALC)
        .slice(2)
        .map((e, k) => ({
          say: e.t === '(' || e.t === ')' ? 1 : 0,
          note: e.t === ')' ? `")": 5 + (−1) · 3 = ${e.result}.` : `"${e.t}": result ${e.result}, sign ${e.sign > 0 ? '+1' : '−1'}.`,
          panels: [arr(CALC, { label: 'tokens', pointers: [ptr(k + 2, 'tok')], highlights: hl(CALC.length, (x) => (x === k + 2 ? 'active' : x < k + 2 ? 'visited' : '')) }), vars({ result: e.result, sign: e.sign }), stk(e.st.length ? ['5 (result)', '−1 (sign)'] : [])],
        })),
    },
  ],

  implementation: [
    {
      kind: 'watch',
      title: 'Daily temperatures: store distances',
      lines: ['The stack holds indices of days **still waiting** for a warmer day.', 'When day i pops day j, the answer is the distance `i − j`.', 'Days never popped keep 0.'],
      frames: [
        ...dailyRun(TEMPS).map((e) => ({
          say: e.kind === 'pop' ? 1 : 0,
          note: e.kind === 'pop' ? `${TEMPS[e.i]} > ${TEMPS[e.j]}: pop day ${e.j}, ans[${e.j}] = ${e.i} − ${e.j} = ${e.i - e.j}.` : `Day ${e.i} (${TEMPS[e.i]}) waits: push ${e.i}.`,
          panels: [
            arr(TEMPS, { label: 't', showIndices: true, pointers: [ptr(e.i, 'i')], highlights: { [e.i]: 'active', ...(e.kind === 'pop' ? { [e.j]: 'done' } : {}) } }),
            idxStack(e.st, TEMPS, 'st (day: temp)'),
            arr(e.ans, { label: 'ans', showIndices: true, highlights: e.kind === 'pop' ? { [e.j]: 'done' } : {} }),
          ],
        })),
        { say: 2, note: 'Day 5 is never popped: ans[5] stays 0.', panels: [arr([1, 4, 2, 1, 1, 0], { label: 'ans', showIndices: true, highlights: { 5: 'muted' } })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: first one out',
      lines: ['72 arrives on day 3.'],
      panels: [arr(TEMPS2, { label: 't', showIndices: true, pointers: [ptr(3, 'i')], highlights: { 1: 'muted', 3: 'active' } }), idxStack([0, 2], TEMPS2, 'st (day: temp)')],
      task: { type: 'cell', question: 'Tap the day that is popped first.', answer: 2, hints: { 0: 'Day 0 is lower in the stack; it pops second.', 1: 'Day 1 was already answered by 69.' } },
      solved: 'The top, day 2: ans[2] = 3 − 2 = 1. Then day 0: ans[0] = 3.',
      then: dailyRun(TEMPS2)
        .slice(-3, -1)
        .map((e) => ({ say: 0, note: `Pop day ${e.j}: ans[${e.j}] = ${e.i} − ${e.j} = ${e.i - e.j}.`, panels: [arr(TEMPS2, { label: 't', showIndices: true, pointers: [ptr(3, 'i')], highlights: { [e.j]: 'done' } }), idxStack(e.st, TEMPS2, 'st (day: temp)'), arr(e.ans, { label: 'ans', showIndices: true })] })),
    },
    {
      kind: 'turn',
      title: 'Your turn: popping an empty stack',
      lines: ['`isValid("]")`: the first character is a closer.', 'The code runs `st.pop() !== open[ch]`.'],
      panels: [arr([']'], { label: 's', pointers: [ptr(0, 'ch')], highlights: { 0: 'active' } }), stk([])],
      task: {
        type: 'choose',
        question: 'What does `st.pop()` give here?',
        options: [
          { text: '`undefined`, so the check returns false', why: '' },
          { text: 'It throws an error', why: 'JavaScript does not throw: `[].pop()` quietly returns undefined.' },
          { text: '"["', why: 'Nothing was ever pushed; the stack is empty.' },
        ],
        answer: 0,
      },
      solved: '`undefined !== "["` → false. Convenient here, but elsewhere it is a silent `NaN`.',
    },
    {
      kind: 'turn',
      title: 'Your turn: toward zero',
      lines: ['"Truncate toward zero" needs `Math.trunc`.'],
      panels: [vars({ a: -7, b: 2, 'a / b': -3.5 })],
      task: { type: 'number', question: 'What is `Math.trunc(-7 / 2)`?', options: [-4, -3, 3, 4], answer: -3, hint: 'Drop the fraction; do not round down.' },
      solved: '−3. `Math.floor(-7 / 2)` would give −4.',
    },
  ],

  'optimized-design': [
    {
      kind: 'watch',
      title: 'Min stack: each entry keeps its minimum',
      lines: ['Store with each entry the minimum of everything at or below it.', 'The stack only changes at the top, so stored minimums stay correct.', 'After a pop, the old minimum is recovered for free.'],
      frames: [
        { say: 0, note: 'push 5 → (5,5).', panels: [stk(['(5,5)'], 'entries (value,min)'), vars({ getMin: 5 })] },
        { say: 0, note: 'push 2 → min(2, 5) = 2 → (2,2).', panels: [stk(['(5,5)', '(2,2)'], 'entries (value,min)'), vars({ getMin: 2 })] },
        { say: 0, note: 'push 7 → min(7, 2) = 2 → (7,2).', panels: [stk(['(5,5)', '(2,2)', '(7,2)'], 'entries (value,min)'), vars({ getMin: 2 })] },
        { say: 1, note: 'pop → (2,2) is on top: getMin = 2.', panels: [stk(['(5,5)', '(2,2)'], 'entries (value,min)'), vars({ getMin: 2 })] },
        { say: 2, note: 'pop → (5,5) is on top: getMin = 5, recovered.', panels: [stk(['(5,5)'], 'entries (value,min)'), vars({ getMin: 5 })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: one global min',
      lines: ['A single variable `min` = 2.', 'Now the 2 is popped.'],
      panels: [stk([5, 2]), vars({ min: 2 })],
      task: {
        type: 'choose',
        question: 'How does this version find the new minimum?',
        options: [
          { text: 'It has to rescan the stack', why: '' },
          { text: 'min is still 2', why: '2 is gone; the variable is now wrong.' },
          { text: 'It reads the entry below', why: 'Only the per-entry design stores a minimum there.' },
        ],
        answer: 0,
      },
      solved: 'One global min cannot recover after popping the minimum.',
    },
    {
      kind: 'turn',
      title: 'Your turn: getMin after two pops',
      lines: ['push 4, push 6, push 3, push 8, pop, pop.'],
      panels: [stk(['(4,4)', '(6,4)', '(3,3)', '(8,3)'], 'entries (value,min)')],
      task: { type: 'number', question: 'What does getMin return after the two pops?', options: [3, 4, 6, 8], answer: 4, hint: 'Read the min stored in the new top entry.' },
      solved: 'The top is (6,4): getMin = 4.',
      then: [
        { say: 0, note: 'pop (8,3): getMin still 3.', panels: [stk(['(4,4)', '(6,4)', '(3,3)'], 'entries (value,min)'), vars({ getMin: 3 })] },
        { say: 0, note: 'pop (3,3): getMin back to 4.', panels: [stk(['(4,4)', '(6,4)'], 'entries (value,min)'), vars({ getMin: 4 })] },
      ],
    },
    {
      kind: 'watch',
      title: 'A queue from two stacks',
      lines: ['Enqueue: push into `inbox`.', 'Dequeue: take from `outbox`.', 'If `outbox` is empty, pour **all** of `inbox` into it: the oldest ends on top.'],
      frames: [
        ...[1, 2, 3].map((x) => ({ say: 0, note: `enqueue ${x}.`, panels: [stk([1, 2, 3].slice(0, x), 'inbox'), stk([], 'outbox')] })),
        { say: 2, note: 'dequeue: outbox is empty → pour. 3 moves first.', panels: [stk([1, 2], 'inbox'), stk([3], 'outbox')] },
        { say: 2, note: '2 moves.', panels: [stk([1], 'inbox'), stk([3, 2], 'outbox')] },
        { say: 2, note: '1 moves: the oldest is now on top.', panels: [stk([], 'inbox'), stk([3, 2, 1], 'outbox')] },
        { say: 1, note: 'Pop outbox → 1, the first one in.', panels: [stk([], 'inbox'), stk([3, 2], 'outbox'), vars({ returned: 1 })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: first in, first out',
      lines: ['Next, enqueue 4.', 'Then dequeue three times.'],
      panels: [stk([4], 'inbox'), stk([3, 2], 'outbox')],
      task: { type: 'order', question: 'Tap the values in the order the three dequeues return them.', items: ['2', '3', '4'], hint: 'A queue returns the oldest first.' },
      solved: '2, 3, then 4: oldest first.',
      then: [
        { say: 1, note: 'Pop outbox → 2.', panels: [stk([4], 'inbox'), stk([3], 'outbox'), vars({ returned: 2 })] },
        { say: 1, note: 'Pop outbox → 3. outbox is empty now.', panels: [stk([4], 'inbox'), stk([], 'outbox'), vars({ returned: 3 })] },
        { say: 1, note: 'Pour 4 across, pop → 4. It moved three times in all: push, move, pop.', panels: [stk([], 'inbox'), stk([], 'outbox'), vars({ returned: 4 })] },
      ],
    },
  ],

  'optimized-boundaries': [
    {
      kind: 'watch',
      title: 'Largest rectangle with an increasing stack',
      lines: [
        'Each bar, as the **shortest** of its rectangle, extends to the previous and next **smaller** bars.',
        'When bar j is popped by i: i is its next smaller, the new top its previous smaller.',
        'Area = `height × (i − left − 1)`.',
        'A sentinel height 0 at the end pops what remains.',
      ],
      frames: histFrames(HIST, 2, 0).map((f) => (f.note.startsWith('Sentinel') || f.note.startsWith('Stack flushed') ? { ...f, say: 3 } : f)),
    },
    {
      kind: 'turn',
      title: 'Your turn: the left boundary',
      lines: ['Bar 2 (height 4) is the shortest of its rectangle.', 'It extends left until a **shorter** bar.'],
      panels: [arr(HIST2, { label: 'heights', showIndices: true, pointers: [ptr(2, 'bar')], highlights: { 2: 'active' } })],
      task: { type: 'cell', question: 'Tap its previous smaller bar.', answer: 0, hints: { 1: '5 is taller than 4, so bar 2 extends over it.', 3: 'That is to the right: its next smaller.' } },
      solved: 'Bar 0 (height 3). The next smaller is bar 3, so the width is 3 − 0 − 1 = 2: area 8.',
    },
    {
      kind: 'turn',
      title: 'Your turn: the best area',
      lines: ['Run the stack with the sentinel on the same heights.'],
      panels: [arr(HIST2, { label: 'heights', showIndices: true })],
      task: { type: 'number', question: 'What is the largest rectangle?', options: [5, 8, 9, 10], answer: 9, hint: 'Try bar 0 (height 3): how far can it extend?' },
      solved: 'Bar 0 spans bars 0–2 at height 3: 3 × 3 = 9.',
      then: histFrames(HIST2, 0, 0).filter((f) => f.panels[2].vars.area !== undefined),
    },
    {
      kind: 'watch',
      title: 'Contribution: count, do not enumerate',
      lines: [
        'For each element: in how many subarrays is it the minimum?',
        '`left` = choices for the left end, `right` = choices for the right end.',
        'answer = Σ nums[i] × left[i] × right[i].',
      ],
      frames: [
        { say: 0, note: '[2, 1, 3] has 6 subarrays. Ask each element how many it is the minimum of.', panels: [arr([2, 1, 3], { label: 'nums', showIndices: true })] },
        ...[
          ['2', 1, 1, 2],
          ['1', 2, 2, 4],
          ['3', 1, 1, 3],
        ].map((_, k, all) => ({
          say: 1,
          note: `${all[k][0]}: ${all[k][1]} left × ${all[k][2]} right = ${all[k][1] * all[k][2]} subarray${all[k][1] * all[k][2] > 1 ? 's' : ''} → adds ${all[k][3]}.`,
          panels: [
            arr([2, 1, 3], { label: 'nums', showIndices: true, pointers: [ptr(k, 'i')], highlights: { [k]: 'active' } }),
            table(all.map((r) => r[0]), ['left', 'right', 'adds'], all.map((r, i) => (i <= k ? [r[1], r[2], r[3]] : ['?', '?', '?'])), all.map((_, i) => (i === k ? ['active', 'active', 'active'] : ['', '', '']))),
          ],
        })),
        { say: 2, note: '2 + 4 + 3 = 9: the sum of the minimums of all 6 subarrays.', panels: [vars({ answer: 9 })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: equal minimums',
      lines: ['In `[2, 2]`, the subarray `[2, 2]` has two equal minimums.', 'Both sides use "strictly smaller" as the boundary.'],
      panels: [arr([2, 2], { label: 'nums', showIndices: true, highlights: { 0: 'window', 1: 'window' } })],
      task: { type: 'number', question: 'How many times is `[2, 2]` credited?', options: [0, 1, 2], answer: 2, hint: 'Neither 2 is strictly smaller than the other, so neither stops the other.' },
      solved: 'Twice: both 2s claim it. Use strict on one side, non-strict on the other.',
      then: [
        { say: 0, note: 'Both strict: each 2 claims [2, 2]. Double counted.', panels: [table(['i0', 'i1'], ['claims [2, 2]?'], [['yes'], ['yes']], [['bad'], ['bad']])] },
        { say: 0, note: 'Left strict, right smaller-or-equal: exactly one 2 claims it.', panels: [table(['i0', 'i1'], ['claims [2, 2]?'], [['no'], ['yes']], [[''], ['done']])] },
      ],
    },
  ],

  'dry-run': [
    {
      kind: 'watch',
      title: 'nextGreater([2, 1, 2, 4, 3])',
      lines: ['Pop while the top is smaller than nums[i], and write the answer.', 'Then push i.', 'Equal values do **not** pop: only strictly smaller ones.'],
      frames: [
        dryFrame(0, 1, 'i = 0, 2: nothing to pop. Push.', [2], NEG, [], { 0: 'active' }),
        dryFrame(1, 1, 'i = 1, 1: smaller than the top. Push.', [2, 1], NEG, [], { 1: 'active' }),
        dryFrame(2, 0, 'i = 2, 2: pops index 1 → res[1] = 2.', [2], [-1, 2, -1, -1, -1], [1], { 1: 'done', 2: 'active' }),
        dryFrame(2, 2, 'The top is the earlier 2: equal, not smaller. Push.', [2, 2], [-1, 2, -1, -1, -1], [], { 0: 'muted', 2: 'active' }),
        dryFrame(3, 0, 'i = 3, 4: pops index 2 → res[2] = 4.', [2], [-1, 2, 4, -1, -1], [2], { 2: 'done', 3: 'active' }),
        dryFrame(3, 0, 'Pops index 0 → res[0] = 4.', [], [4, 2, 4, -1, -1], [0], { 0: 'done', 3: 'active' }),
        dryFrame(3, 1, 'Push 4.', [4], [4, 2, 4, -1, -1], [], { 3: 'active' }),
        dryFrame(4, 1, 'i = 4, 3: smaller than 4. Push.', [4, 3], [4, 2, 4, -1, -1], [], { 4: 'active' }),
        dryFrame(null, 1, 'Indices 3 and 4 never pop: their answers stay −1.', [4, 3], [4, 2, 4, -1, -1], [0, 1, 2], { 3: 'muted', 4: 'muted' }),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: who goes first?',
      lines: ['At i = 3 the value 4 arrives.', 'The stack holds indices 0 and 2 (values [2, 2]).'],
      panels: [arr(NG, { label: 'nums', showIndices: true, pointers: [ptr(3, 'i')], highlights: { 1: 'muted', 3: 'active' } }), stk([2, 2], 'stack (values)')],
      task: { type: 'cell', question: 'Tap the index that 4 pops first.', answer: 2, hints: { 0: 'Index 0 is below index 2; it pops second.', 1: 'Index 1 was already popped at i = 2.' } },
      solved: 'The top, index 2, then index 0: "2 → 4, 0 → 4".',
    },
    {
      kind: 'turn',
      title: 'Your turn: left waiting',
      lines: ['After the loop, indices still on the stack keep −1.'],
      panels: [stk([4, 3], 'stack (values)'), arr([4, 2, 4, -1, -1], { label: 'res', showIndices: true })],
      task: { type: 'number', question: 'How many pops happened in the whole run?', options: [2, 3, 4, 5], answer: 3, hint: 'Count the index → answer pairs in the pops column.' },
      solved: 'Three pops (1, 2, 0) and five pushes. The two left over stay −1.',
    },
  ],

  mistakes: [
    {
      kind: 'watch',
      title: '`if` instead of `while`',
      lines: ['One new element can pop **many**.', 'With `if`, only one pop happens per step.'],
      frames: [
        { say: 0, note: '[3, 2, 1] are waiting. 5 arrives.', panels: [arr([3, 2, 1, 5], { label: 'nums', showIndices: true, pointers: [ptr(3, 'i')], highlights: { 3: 'active' } }), idxStack([0, 1, 2], [3, 2, 1, 5])] },
        { say: 0, note: '`while`: 5 pops 1, 2 and 3. All answered.', panels: [idxStack([3], [3, 2, 1, 5]), arr([5, 5, 5, -1], { label: 'res with while', showIndices: true, highlights: { 0: 'done', 1: 'done', 2: 'done' } })] },
        { say: 1, note: '`if`: 5 pops only 1. Indices 0 and 1 keep a wrong −1.', panels: [idxStack([0, 1, 3], [3, 2, 1, 5]), arr([-1, -1, 5, -1], { label: 'res with if', showIndices: true, highlights: { 0: 'bad', 1: 'bad', 2: 'done' } })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: operand order',
      lines: ['RPN `8 2 -`.', 'The first pop is the **right** operand.'],
      panels: [arr(['8', '2', '-'], { label: 'tokens', pointers: [ptr(2, 't')], highlights: { 2: 'active' } }), stk([8, 2])],
      task: {
        type: 'choose',
        question: 'What is pushed?',
        options: [
          { text: '6', why: '' },
          { text: '−6', why: 'b = 2 is popped first, a = 8 second: a − b = 8 − 2.' },
        ],
        answer: 0,
      },
      solved: 'b = 2, a = 8 → 8 − 2 = 6.',
    },
    {
      kind: 'turn',
      title: 'Your turn: the forgotten sentinel',
      lines: ['Without the sentinel, bars left on the stack are never measured.'],
      panels: [arr([1, 2, 3], { label: 'heights', showIndices: true }), idxStack([0, 1, 2], [1, 2, 3], 'st (index: height)')],
      task: { type: 'number', question: 'Without the sentinel, what does best end as?', options: [0, 3, 4, 6], answer: 0, hint: 'An increasing array never pops during the loop.' },
      solved: '0. With the sentinel: 3 × 1, 2 × 2, 1 × 3 → best 4.',
      then: histFrames([1, 2, 3], 0, 0).filter((f) => f.panels[2].vars.area !== undefined),
    },
    {
      kind: 'turn',
      title: 'Your turn: the missing final check',
      lines: ['This isValid ends with `return true`.', 'It skips the check `st.length === 0`.'],
      panels: [arr([...'(()'], { label: 's', showIndices: true, highlights: { 0: 'bad' } }), stk(['('])],
      task: {
        type: 'choose',
        question: 'What does it return for "(()"?',
        options: [
          { text: 'true, wrongly', why: '' },
          { text: 'false', why: 'Every closer matched the top, so nothing returned false during the loop.' },
        ],
        answer: 0,
      },
      solved: 'One "(" is never closed. Check the stack is empty at the end.',
    },
  ],

  'interview-tips': [
    {
      kind: 'watch',
      title: 'Five things to say',
      lines: ['Say what the stack holds, and why it is O(n).', 'Ask before coding: duplicates, calculator rules, deep nesting.'],
      frames: [
        ['what it holds', 'the invariant'],
        ['why O(n)', 'pushed and popped once'],
        ['duplicates', 'strict or not?'],
        ['calculators', 'precedence, (), unary −'],
        ['deep nesting', 'explicit stack'],
      ].map((_, k, all) => ({ say: k < 2 ? 0 : 1, note: `${all[k][0]}: ${all[k][1]}.`, panels: [reveal(all, 'say', k, '…')] })),
    },
    {
      kind: 'turn',
      title: 'Your turn: state the invariant',
      lines: ['Daily temperatures. One sentence should prove you understand the stack.'],
      panels: [arr(TEMPS, { label: 't', showIndices: true }), idxStack([1, 4], TEMPS, 'st (day: temp)')],
      task: {
        type: 'choose',
        question: 'Which sentence states it?',
        options: [
          { text: '"Indices of days that haven\'t found a warmer day yet, temperatures decreasing"', why: '' },
          { text: '"Some temperatures"', why: 'It says neither which days nor what order they are in.' },
          { text: '"The answers so far"', why: 'Answers go into ans[]; the stack holds days still waiting.' },
        ],
        answer: 0,
      },
      solved: 'What it holds, plus its order: that is the invariant.',
    },
  ],
};
