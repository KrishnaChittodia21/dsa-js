// Shorts for Stack (M9). Format: src/content/shortSchema.js. Facts come only from topics/stack/topic.js.
// Every stack, result and area below is produced by running the pattern's template on its "e.g." input.
const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const stk = (values, label) => ({ kind: 'stack', values, ...(label ? { label } : {}) });
const table = (rowLabels, colLabels, cells, label) => ({ kind: 'table', rowLabels, colLabels, cells, ...(label ? { label } : {}) });
const hl = (n, f) => Object.fromEntries(Array.from({ length: n }, (_, k) => [k, f(k)]));
const ptr = (index, label, color = 'a') => ({ index, label, color });
// an index stack drawn as "i2: 5" so both the index and its value show
const idxStack = (st, nums, label = 'st (index: value)') => stk(st.map((j) => `i${j}: ${nums[j]}`), label);

// ---------- matching: isValid on "{[}]" ----------
const PAIR = { ')': '(', ']': '[', '}': '{' };
const BR = [...'{[}]'];
const matchFrames = [];
{
  const st = [];
  for (const [i, ch] of BR.entries()) {
    if (ch in PAIR) {
      const top = st.pop();
      const ok = top === PAIR[ch];
      matchFrames.push({
        say: 1,
        note: ok ? `"${ch}" closes; the top is "${top}" → partners, pop.` : `"${ch}" closes, but the top is "${top}" → not its partner: return false.`,
        panels: [arr(BR, { label: 's', pointers: [ptr(i, 'ch')], highlights: hl(BR.length, (k) => (k === i ? (ok ? 'done' : 'bad') : k < i ? 'visited' : '')) }), stk(st.slice())],
      });
      if (!ok) break;
    } else {
      st.push(ch);
      matchFrames.push({
        say: 0,
        note: `"${ch}" opens: push it. It waits for a partner.`,
        panels: [arr(BR, { label: 's', pointers: [ptr(i, 'ch')], highlights: hl(BR.length, (k) => (k === i ? 'active' : k < i ? 'visited' : '')) }), stk(st.slice())],
      });
    }
  }
}

// ---------- expression: evalRPN on 8 3 1 + − ----------
const RPN = ['8', '3', '1', '+', '-'];
const rpnFrames = [];
let rpnResult;
{
  const st = [];
  for (const [k, t] of RPN.entries()) {
    let note, ab;
    if ('+-*/'.includes(t) && t.length === 1) {
      const b = st.pop(),
        a = st.pop();
      const r = t === '+' ? a + b : t === '-' ? a - b : t === '*' ? a * b : Math.trunc(a / b);
      st.push(r);
      note = `"${t === "-" ? "−" : t}": pop b = ${b} first (the right operand), then a = ${a}. Push ${a} ${t === '-' ? '−' : t} ${b} = ${r}.`;
      ab = { a, b };
    } else {
      st.push(Number(t));
      note = `${t} is a number: push it. It waits for its operator.`;
    }
    rpnFrames.push({
      say: ab ? 1 : 0,
      note,
      panels: [arr(RPN.map((x) => (x === '-' ? '−' : x)), { label: 'tokens', pointers: [ptr(k, 't')], highlights: hl(RPN.length, (x) => (x === k ? 'active' : x < k ? 'visited' : '')) }), stk(st.slice()), ...(ab ? [vars(ab)] : [])],
    });
  }
  rpnResult = st.pop();
}

// ---------- design: MinStack, push 6, 3, 8, 1, then pop ----------
const pairStack = (st) => stk(st.map(([v, m]) => `${v} · min ${m}`), 'st [value · minSoFar]');
const minFrames = [];
const minAfter = [];
{
  const st = [];
  for (const x of [6, 3, 8, 1]) {
    const m = st.length ? Math.min(x, st[st.length - 1][1]) : x;
    st.push([x, m]);
    minFrames.push({ say: 0, note: st.length > 1 ? `push ${x}: min(${x}, ${st[st.length - 2][1]}) = ${m} is stored with it.` : `push ${x}: the first entry, its own min.`, panels: [pairStack(st.slice()), vars({ getMin: m })] });
  }
  st.pop();
  minAfter.push(...st);
  minFrames.push({ say: 1, note: `pop 1: the new top already holds min ${st[st.length - 1][1]}. No rescan.`, panels: [pairStack(st.slice()), vars({ getMin: st[st.length - 1][1] })] });
}

// ---------- next greater on [3, 1, 4, 2, 5] ----------
const NG = [3, 1, 4, 2, 5];
const ngFrames = [];
const ngRes = new Array(NG.length).fill(-1);
{
  const st = [];
  for (let i = 0; i < NG.length; i++) {
    const popped = [];
    while (st.length && NG[st[st.length - 1]] < NG[i]) {
      const j = st.pop();
      ngRes[j] = NG[i];
      popped.push(j);
    }
    st.push(i);
    ngFrames.push({
      say: popped.length ? 1 : 0,
      note: popped.length
        ? `${NG[i]} beats ${popped.map((j) => NG[j]).join(' and ')}: pop ${popped.map((j) => `i${j}`).join(', ')}, their answer is ${NG[i]}. Push i${i}.`
        : i === 0
          ? `i0 (${NG[0]}) has no answer yet: push it to wait.`
          : `${NG[i]} is not greater than the top (${NG[st[st.length - 2]]}): push i${i}. Values stay decreasing.`,
      panels: [
        arr(NG, { label: 'nums', pointers: [ptr(i, 'i')], highlights: hl(NG.length, (k) => (k === i ? 'active' : popped.includes(k) ? 'done' : '')) }),
        idxStack(st.slice(), NG),
        arr(ngRes.slice(), { label: 'res', highlights: hl(NG.length, (k) => (popped.includes(k) ? 'done' : '')) }),
      ],
    });
  }
}
// the turn: [7, 5, 2] waiting, 6 arrives
const NT = [7, 5, 2, 6];

// ---------- histogram on [2, 4, 3, 1] ----------
const HI = [2, 4, 3, 1];
const hStack = (st) => stk(st.map((j) => `i${j}: ${HI[j]}`), 'st (index: height)');
const histEvents = [];
{
  const st = [];
  let best = 0;
  for (let i = 0; i <= HI.length; i++) {
    const h = i === HI.length ? 0 : HI[i];
    while (st.length && HI[st[st.length - 1]] >= h) {
      const j = st.pop();
      const left = st.length ? st[st.length - 1] : -1;
      const area = HI[j] * (i - left - 1);
      best = Math.max(best, area);
      histEvents.push({ kind: 'pop', i, j, left, area, best, st: st.slice() });
    }
    st.push(i);
    histEvents.push({ kind: 'push', i, best, st: st.slice() });
  }
}
const histFrame = (e, note) => ({
  say: e.kind === 'pop' ? 1 : 0,
  note,
  panels: [
    arr(HI, {
      label: 'heights',
      pointers: [ptr(Math.min(e.i, HI.length - 1), 'i')],
      ...(e.kind === 'pop' ? { range: [e.left + 1, e.i - 1] } : {}),
      highlights: hl(HI.length, (k) => (e.kind === 'pop' ? (k === e.j ? 'active' : k > e.left && k < e.i ? 'window' : '') : k === e.i ? 'active' : '')),
    }),
    hStack(e.st),
    vars({ best: e.best }),
  ],
});
const hp = (i, j) => histEvents.find((e) => e.kind === 'pop' && e.i === i && e.j === j);
const hpush = (i) => histEvents.find((e) => e.kind === 'push' && e.i === i);
const HT = hp(3, 0); // the turn: index 0 popped by index 3, stack now empty

// ---------- contribution: single pass on [2, 4, 1] ----------
const CN = [2, 4, 1];
const contribEvents = [];
let contribTotal = 0;
{
  const st = [];
  for (let i = 0; i <= CN.length; i++) {
    const x = i === CN.length ? -Infinity : CN[i];
    while (st.length && CN[st[st.length - 1]] >= x) {
      const j = st.pop();
      const top = st.length ? st[st.length - 1] : -1;
      const term = CN[j] * (j - top) * (i - j);
      contribTotal += term;
      contribEvents.push({ kind: 'pop', i, j, top, term, total: contribTotal, st: st.slice() });
    }
    if (i < CN.length) {
      st.push(i);
      contribEvents.push({ kind: 'push', i, total: contribTotal, st: st.slice() });
    }
  }
}
// all subarrays and their minimum, for the brute-force picture
const SUBS = [];
for (let l = 0; l < CN.length; l++) for (let r = l; r < CN.length; r++) SUBS.push([`[${CN.slice(l, r + 1).join(', ')}]`, String(Math.min(...CN.slice(l, r + 1)))]);
const bruteSum = SUBS.reduce((s, [, m]) => s + Number(m), 0);
const contribFrames = contribEvents.map((e) => {
  const sentinel = e.i === CN.length;
  const note =
    e.kind === 'push'
      ? `i${e.i} (${CN[e.i]}): push. It waits for a smaller-or-equal value on its right.`
      : `${sentinel ? 'Sentinel −∞' : `${CN[e.i]} at i${e.i}`} pops i${e.j}: left = ${e.j} − (${String(e.top).replace("-", "−")}) = ${e.j - e.top}, right = ${e.i} − ${e.j} = ${e.i - e.j}. Add ${CN[e.j]} × ${e.j - e.top} × ${e.i - e.j} = ${e.term}.`;
  return {
    say: e.kind === 'pop' ? 1 : 0,
    note,
    panels: [
      arr(CN, {
        label: 'nums',
        ...(sentinel ? {} : { pointers: [ptr(e.i, 'i')] }),
        ...(e.kind === 'pop' ? { range: [e.top + 1, e.i - 1] } : {}),
        highlights: hl(CN.length, (k) => (e.kind === 'pop' ? (k === e.j ? 'active' : k > e.top && k < e.i ? 'window' : '') : k === e.i ? 'active' : '')),
      }),
      idxStack(e.st, CN),
      vars({ total: e.total }),
    ],
  };
});

export default [
  {
    id: 'stack-matching',
    title: 'Check nesting by matching the most recent opener',
    steps: [
      {
        kind: 'watch',
        title: 'Counting is not enough',
        lines: ['Is every bracket **properly nested**?', 'One counter per bracket type only checks balance, not the order of opening.'],
        frames: [
          { say: 0, note: 'e.g. s = "{[}]". One of each opener, one of each closer.', panels: [arr(BR, { label: 's' })] },
          { say: 1, note: 'Both counters end at 0, so counting says "fine". But "}" closes while "[" is still open inside it.', panels: [arr(BR, { label: 's', highlights: { 1: 'bad', 2: 'bad' } }), vars({ '{ } open': 0, '[ ] open': 0 })] },
        ],
      },
      {
        kind: 'watch',
        title: 'Push the waiting, pop the partner',
        lines: ['An opener waits for a partner: **push** it.', 'A closer must match the **top**, the most recently opened item: `stack.pop() !== pair[ch]` → false.'],
        frames: matchFrames,
      },
      {
        kind: 'watch',
        title: 'Hear it in the problem',
        lines: ['Clues: **"valid parentheses"**, **"properly nested"**, **"collide"**, **"remove adjacent"**, **"cancel the previous"**, **"backspace"**.'],
        frames: [{ say: 0, note: 'Each check touches only the top: O(1). The whole scan is O(n).', panels: [vars({ 'per character': 'O(1)', total: 'O(n)', stack: 'items waiting for a partner' })] }],
      },
      {
        kind: 'turn',
        title: 'Your turn: the scan is over',
        lines: ['e.g. s = "(()". Every closer found its partner.', 'After the loop the stack still holds one "(".'],
        panels: [arr([...'(()'], { label: 's', highlights: { 0: 'active', 1: 'done', 2: 'done' } }), stk(['('])],
        task: {
          type: 'choose',
          question: 'What does isValid return?',
          options: [
            { text: 'true: no closer ever failed', why: 'A closer failing is only one way to be invalid; an opener that never closes is the other.' },
            { text: 'false: `stack.length === 0` fails, a "(" is still unmatched' },
            { text: 'true: an odd length is still fine', why: 'Length is not the test. The leftover "(" is.' },
            { text: 'It throws, the stack is not empty', why: 'Nothing throws; the last line just checks whether anything is left.' },
          ],
          answer: 1,
        },
        solved: 'Two ways to fail: a closer whose top is not its partner, and **anything left on the stack** at the end.',
      },
    ],
  },

  {
    id: 'stack-expression-eval',
    title: 'Evaluate an expression: operands wait for their operator',
    steps: [
      {
        kind: 'watch',
        title: 'The inner part comes first',
        lines: ['Expressions are **nested**: an inner part must be finished before the outer one can use it.', 'Reverse Polish writes the operator **after** its operands, so no parentheses are needed.'],
        frames: [
          { say: 0, note: 'e.g. 8 − (3 + 1): the − must wait until 3 + 1 is done.', panels: [arr(['8', '−', '(', '3', '+', '1', ')'], { label: 'infix', range: [2, 6], highlights: { 3: 'window', 4: 'window', 5: 'window' } })] },
          { say: 1, note: 'The same expression in RPN: "8 3 1 + −".', panels: [arr(RPN.map((x) => (x === '-' ? '−' : x)), { label: 'tokens' }), stk([])] },
        ],
      },
      {
        kind: 'watch',
        title: 'One stack, left to right',
        lines: ['A number: **push** it.', 'An operator: pop **b** (right operand, popped first), pop **a**, push `a op b`.'],
        frames: [...rpnFrames, { say: 1, note: `The last value on the stack is the answer: ${rpnResult}.`, panels: [arr(RPN.map((x) => (x === '-' ? '−' : x)), { label: 'tokens', highlights: hl(RPN.length, () => 'done') }), stk([rpnResult])] }],
      },
      {
        kind: 'watch',
        title: 'Hear it in the problem',
        lines: ['Clues: **"evaluate the expression"**, **"reverse polish notation"**, **"parentheses" + "+ -"**, **"k[encoded_string]"**, **"nested"**.', 'For brackets: push the current context at "(" or "[", restore it at ")" or "]".'],
        frames: [{ say: 1, note: 'Same idea for calculators (sign stack) and decode string: the stack remembers every unfinished outer part.', panels: [stk(['outer context'], 'st'), vars({ '( or [': 'push cur, start fresh', ') or ]': 'combine(pop, cur)' })] }],
      },
      {
        kind: 'turn',
        title: 'Your turn: divide',
        lines: ['e.g. tokens "−7 2 /". The stack is [−7, 2] when "/" arrives.'],
        panels: [arr(['-7', '2', '/'], { label: 'tokens', pointers: [ptr(2, 't')], highlights: { 0: 'visited', 1: 'visited', 2: 'active' } }), stk([-7, 2])],
        task: {
          type: 'choose',
          question: 'What is pushed?',
          options: [
            { text: 'Math.trunc(−7 / 2) = −3' },
            { text: 'Math.trunc(2 / −7) = 0', why: 'The first pop is the RIGHT operand: b = 2, a = −7, so it is −7 / 2.' },
            { text: 'Math.floor(−7 / 2) = −4', why: 'Math.floor rounds −3.5 down to −4; division must truncate toward zero.' },
            { text: '−3.5', why: 'RPN division is integer division: Math.trunc(a / b).' },
          ],
          answer: 0,
        },
        solved: 'Pop **b first, then a**, and compute `a op b`; divide with **Math.trunc**, not Math.floor.',
      },
    ],
  },

  {
    id: 'stack-design',
    title: 'getMin in O(1): store the minimum with every entry',
    steps: [
      {
        kind: 'watch',
        title: 'One global min breaks on pop',
        lines: ['Design a stack that supports **getMin** in constant time.', 'Keeping a single `min` variable fails: after popping the minimum, what is the new one?'],
        frames: [
          { say: 0, note: 'e.g. push 6, 3, 8. A single variable says min = 3.', panels: [stk([6, 3, 8]), vars({ min: 3 })] },
          { say: 1, note: 'Pop 8, pop 3. The variable still says 3, which is gone. Recovering 6 means rescanning.', panels: [stk([6]), vars({ min: '3 (wrong)' })] },
        ],
      },
      {
        kind: 'watch',
        title: 'Each entry remembers everything below it',
        lines: ['`push(x)` stores `[x, min(x, top.minSoFar)]`.', 'A stack only changes at the top, so a stored min stays correct while its entry exists.'],
        frames: minFrames,
      },
      {
        kind: 'watch',
        title: 'Hear it in the problem',
        lines: ['Clues: **"design a stack that supports … in constant time"**, **"getMin"**, **"implement a queue using only stacks"**.'],
        frames: [{ say: 0, note: 'Same family: pour "in" into "out" only when "out" is empty, and two stacks make a FIFO queue.', panels: [stk([4, 5], 'in'), stk([], 'out')] }],
      },
      {
        kind: 'turn',
        title: 'Your turn: push 4',
        lines: [`The stack is ${minAfter.map(([v, m]) => `[${v}, ${m}]`).join(', ')}.`, 'Now push 4.'],
        panels: [pairStack(minAfter), vars({ push: 4 })],
        task: {
          type: 'choose',
          question: 'Which entry is pushed?',
          options: [
            { text: '[4, 4]', why: 'minSoFar covers everything at or below the entry; 3 is below, and 3 < 4.' },
            { text: '[4, 3]' },
            { text: '[4, 6]', why: '6 is the bottom entry\'s min, not the current top\'s. Read the top: min(4, 3).' },
            { text: '[3, 4]', why: 'The value comes first and stays 4; only the minSoFar part is 3.' },
          ],
          answer: 1,
        },
        solved: 'minSoFar = **min(x, top\'s minSoFar)**: the top already summarises everything below it.',
      },
    ],
  },

  {
    id: 'monotonic-stack-next-greater',
    title: 'Next greater for every index in one pass',
    steps: [
      {
        kind: 'watch',
        title: 'Looking right from every index',
        lines: ['For each index, find the first **larger** value to its right (or −1).', 'Brute force scans right from every index: **O(n²)**.'],
        frames: [
          { say: 0, note: `e.g. nums = [${NG.join(', ')}]. Answer: [${ngRes.join(', ')}].`, panels: [arr(NG, { label: 'nums' })] },
          { say: 1, note: 'From 1, scan right to 4. From 2, scan right to 5. Each index starts its own scan.', panels: [arr(NG, { label: 'nums', pointers: [ptr(1, 'i')], highlights: { 1: 'active', 2: 'visited' } })] },
        ],
      },
      {
        kind: 'watch',
        title: 'Waiting indices on a stack',
        lines: ['The stack holds indices still **waiting** for an answer; their values are decreasing.', '**While** the top is smaller than nums[i], nums[i] is its answer: pop it. Then push i.'],
        frames: [
          ...ngFrames,
          { say: 0, note: 'i4 is still waiting at the end: it keeps −1. Each index was pushed once and popped at most once: O(n).', panels: [arr(NG, { label: 'nums', highlights: { 4: 'muted' } }), idxStack([4], NG), arr(ngRes, { label: 'res', highlights: { 4: 'muted' } })] },
        ],
      },
      {
        kind: 'watch',
        title: 'Hear it in the problem',
        lines: ['Clues: **"next greater element"**, **"next warmer day"**, **"span"**, **"previous smaller"**, **"remove k digits to make it smallest"**, **"circular"**.'],
        frames: [{ say: 0, note: 'Next smaller: flip it, keep an increasing stack and pop while the top is greater.', panels: [vars({ 'next greater': 'decreasing, pop while top < x', 'next smaller': 'increasing, pop while top > x' })] }],
      },
      {
        kind: 'turn',
        title: 'Your turn: 6 arrives',
        lines: ['e.g. nums = [7, 5, 2, 6]. Indices 0, 1, 2 are waiting.'],
        panels: [arr(NT, { label: 'nums', pointers: [ptr(3, 'i')], highlights: { 3: 'active' } }), idxStack([0, 1, 2], NT)],
        task: {
          type: 'choose',
          question: 'Which indices does 6 pop?',
          options: [
            { text: 'Only i2 (2), the top', why: 'It is `while`, not `if`: after 2 goes, 5 < 6 is on top and is popped too.' },
            { text: 'i2 (2) and i1 (5)' },
            { text: 'All three', why: '7 is not smaller than 6, so the loop stops there; i0 keeps waiting.' },
            { text: 'None: 6 is pushed first', why: 'Pop first, then push: 6 is the answer for the smaller values waiting below it.' },
          ],
          answer: 1,
        },
        solved: '**while** the top is smaller, pop: one new value can answer many waiting indices, and the stop leaves the order decreasing.',
      },
    ],
  },

  {
    id: 'monotonic-stack-previous-smaller',
    title: 'Largest rectangle: every bar as the shortest',
    steps: [
      {
        kind: 'watch',
        title: 'Height is the shortest bar',
        lines: ['A rectangle in a **histogram** is exactly as tall as its **shortest** bar.', 'So try every bar as "the shortest": it extends left and right until a **shorter** bar.'],
        frames: [
          { say: 0, note: `e.g. heights = [${HI.join(', ')}]. Bars 0..2 together are at most 2 tall: 2 × 3 = 6.`, panels: [arr(HI, { label: 'heights', range: [0, 2], highlights: { 0: 'active', 1: 'window', 2: 'window' } })] },
          { say: 1, note: 'Bar 2 (height 3) stops at bar 0 (2, shorter) and bar 3 (1, shorter): width 2.', panels: [arr(HI, { label: 'heights', range: [1, 2], highlights: { 0: 'bad', 1: 'window', 2: 'active', 3: 'bad' } })] },
        ],
      },
      {
        kind: 'watch',
        title: 'Both boundaries at pop time',
        lines: ['Keep an **increasing** stack. Push bars while heights rise.', 'A shorter bar i pops j: i is its next smaller, the new top its previous smaller. Width = `i − left − 1`.'],
        frames: [
          histFrame(hpush(0), 'i0 (2): push.'),
          histFrame(hpush(1), 'i1 (4): taller than the top, push.'),
          histFrame(hp(2, 1), `i2 (3) pops i1 (4): left = ${hp(2, 1).left}, width 2 − 0 − 1 = 1, area ${hp(2, 1).area}.`),
          histFrame(hp(3, 2), `i3 (1) pops i2 (3): left = ${hp(3, 2).left}, width 3 − 0 − 1 = 2, area ${hp(3, 2).area}.`),
        ],
      },
      {
        kind: 'watch',
        title: 'Hear it in the problem',
        lines: ['Clues: **"histogram"**, **"largest rectangle"**, **"maximal rectangle of 1s"**, **"minimum of the range × length"**.', 'A sentinel height 0 at i = n pops every bar still on the stack.'],
        frames: [{ say: 1, note: 'Without the sentinel, bars left on the stack are never measured.', panels: [arr([...HI, '0'], { label: 'heights + sentinel', highlights: { 4: 'active' } }), vars({ 'loop to': 'i <= heights.length' })] }],
      },
      {
        kind: 'turn',
        title: 'Your turn: the stack runs empty',
        lines: ['i3 (1) keeps popping: now it pops i0 (2).', 'After that pop the stack is empty.'],
        panels: [arr(HI, { label: 'heights', pointers: [ptr(3, 'i')], highlights: { 0: 'active', 3: 'bad' } }), hStack(HT.st), vars({ best: hp(3, 2).best })],
        task: {
          type: 'choose',
          question: 'What width does bar 0 get?',
          options: [
            { text: '3 − 0 − 1 = 2, using its own index as left', why: 'left is the new top, the previous smaller. The stack is empty, so there is none.' },
            { text: `3 − (−1) − 1 = 3: left = −1, area ${HT.area}` },
            { text: '1: only itself', why: 'Bars 1 and 2 are taller than 2, so the rectangle spans them too.' },
            { text: '4: the whole array', why: 'Bar 3 (height 1) is shorter, so it is the right boundary, not inside.' },
          ],
          answer: 1,
        },
        solved: 'Width is **i − left − 1**, with **left = −1** when the stack is empty: no shorter bar on the left.',
      },
    ],
  },

  {
    id: 'monotonic-stack-contribution',
    title: 'Sum of subarray minimums without listing subarrays',
    steps: [
      {
        kind: 'watch',
        title: 'Every subarray, one by one',
        lines: ['Sum the **minimum of every contiguous subarray**.', 'There are O(n²) subarrays. Regroup instead: **in how many is each element the minimum?**'],
        frames: [
          { say: 0, note: `e.g. nums = [${CN.join(', ')}]: ${SUBS.length} subarrays, minimums sum to ${bruteSum}.`, panels: [arr(CN, { label: 'nums' }), table(SUBS.map((s) => s[0]), ['min'], SUBS.map((s) => [s[1]]), 'subarrays')] },
          { say: 1, note: '1 is the minimum of 3 of them, 2 of 2, 4 of 1. Count per element, not per subarray.', panels: [arr(CN, { label: 'nums', highlights: { 2: 'active' } }), vars({ '1 is min in': 3, '2 is min in': 2, '4 is min in': 1 })] },
        ],
      },
      {
        kind: 'watch',
        title: 'Left choices × right choices',
        lines: ['Push indices while values rise. When i pops j: left = j − newTop (top = −1 if empty), right = i − j.', 'Add `nums[j] × left × right`. Pop while ≥, and a −∞ sentinel pops the rest.'],
        frames: [...contribFrames, { say: 1, note: `Total ${contribTotal}, the same as summing all ${SUBS.length} minimums, in O(n).`, panels: [arr(CN, { label: 'nums', highlights: hl(CN.length, () => 'done') }), vars({ total: contribTotal })] }],
      },
      {
        kind: 'watch',
        title: 'Hear it in the problem',
        lines: ['Clues: **"sum of min(b) over every contiguous subarray"**, **"sum of subarray ranges"**, **"answer modulo 10^9 + 7"**, n up to 3·10^4 or more.'],
        frames: [{ say: 0, note: 'Take the modulo per term: products above 2^53 lose precision in JS.', panels: [vars({ answer: 'Σ nums[i] × left[i] × right[i]' })] }],
      },
      {
        kind: 'turn',
        title: 'Your turn: equal values',
        lines: ['e.g. nums = [3, 3]. True answer: 3 + 3 + 3 = 9.', 'Suppose **both** sides use "strictly smaller" as the boundary.'],
        panels: [arr([3, 3], { label: 'nums', range: [0, 1], highlights: { 0: 'window', 1: 'window' } }), vars({ 'left side': 'strictly smaller', 'right side': 'strictly smaller' })],
        task: {
          type: 'choose',
          question: 'What goes wrong?',
          options: [
            { text: 'Nothing: the total is still 9', why: 'i0 gets 1 × 2 and i1 gets 2 × 1 choices: 6 + 6 = 12.' },
            { text: 'Both 3s claim [3, 3], so it is counted twice: 12' },
            { text: 'Neither 3 claims [3, 3]: 6', why: 'That happens when both sides are non-strict (smaller or equal).' },
            { text: 'Duplicates must be removed from the input first', why: 'Duplicates are normal; the boundary rule handles them.' },
          ],
          answer: 1,
        },
        solved: '**Strict on one side, non-strict on the other**, so each subarray is credited to exactly one minimum.',
      },
    ],
  },
];
