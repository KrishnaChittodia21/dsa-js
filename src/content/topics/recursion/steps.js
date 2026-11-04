// Step lessons for Recursion (M2). Format: src/content/stepSchema.js. Facts come only from topic.js.
// Every call, return value and stack depth below comes from actually running the recursion.
const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const stk = (values, label = 'call stack') => ({ kind: 'stack', values, label });
const table = (rowLabels, colLabels, cells, states, label) => ({ kind: 'table', rowLabels, colLabels, cells, ...(states ? { states } : {}), ...(label ? { label } : {}) });
const hl = (n, f) => Object.fromEntries(Array.from({ length: n }, (_, k) => [k, f(k)]));
const ptr = (index, label, color = 'a') => ({ index, label, color });
// a table that reveals its answers row by row: k = row being revealed now
const reveal = (rows, col, k, hidden = '?') => table(rows.map((r) => r[0]), [col], rows.map((r, i) => [i <= k ? r[1] : hidden]), rows.map((_, i) => [i === k ? 'active' : i < k ? 'done' : '']));

// ---------- recorder: run a recursion, keep every call / return and the open frames ----------
function record(run) {
  const nodes = [];
  const ev = [];
  const open = [];
  const call = (label, fn, tag) => {
    const id = nodes.length;
    nodes.push({ id, label, tag, parent: open.length ? open.at(-1) : null, depth: open.length });
    open.push(id);
    ev.push({ kind: 'call', id, open: open.slice() });
    const v = fn();
    open.pop();
    nodes[id].v = v;
    ev.push({ kind: 'ret', id, v, open: open.slice() });
    return v;
  };
  const value = run(call);
  // tree layout: leaves left to right, a parent sits over the middle of its children
  let leaf = 0;
  const place = (id) => {
    const kids = nodes.filter((n) => n.parent === id);
    nodes[id].x = kids.length ? kids.map((k) => place(k.id)).reduce((a, b) => a + b, 0) / kids.length : leaf++;
    return nodes[id].x;
  };
  place(0);
  return { nodes, ev, value };
}
const node = (rec, id) => rec.nodes[id];
const openLabels = (rec, e) => e.open.map((id) => rec.nodes[id].label);
// the recursion tree after event t: unseen calls hidden, open path visited, finished calls done (value on the edge)
function treeAt(rec, t, { bad = [], relabel = false, label } = {}) {
  const seen = new Set();
  const done = new Map();
  for (let k = 0; k <= t; k++) {
    const e = rec.ev[k];
    if (e.kind === 'call') seen.add(e.id);
    else done.set(e.id, e.v);
  }
  const cur = rec.ev[t];
  const open = new Set(cur.open);
  return {
    kind: 'nodes',
    ...(label ? { label } : {}),
    nodes: rec.nodes.map((n) => {
      const state = !seen.has(n.id) ? 'hidden' : n.id === cur.id ? 'active' : bad.includes(n.id) ? 'bad' : done.has(n.id) ? 'done' : open.has(n.id) ? 'visited' : undefined;
      return { id: n.id, label: relabel && done.has(n.id) ? String(done.get(n.id)) : n.label, x: n.x * (relabel ? 1.4 : 1), y: n.depth, ...(state ? { state } : {}) };
    }),
    edges: rec.nodes
      .filter((n) => n.parent !== null)
      .map((n) => ({ from: n.parent, to: n.id, ...(!relabel && done.has(n.id) ? { label: String(done.get(n.id)), state: 'done' } : open.has(n.id) ? { state: 'active' } : {}) })),
  };
}
const lastEvent = (rec) => rec.ev.length - 1;

// ---------- the recursions the lesson uses ----------
const sumRec = (n) => record((call) => { const sum = (k) => call(`sum(${k})`, () => (k === 1 ? 1 : k + sum(k - 1))); return sum(n); });
const factRec = (n) => record((call) => { const fact = (k) => call(`fact(${k})`, () => (k === 1 ? 1 : k * fact(k - 1))); return fact(n); });
const revRec = (s) => record((call) => { const rev = (t) => call(`reverse("${t}")`, () => (t.length <= 1 ? t : t[t.length - 1] + rev(t.slice(0, -1)))); return rev(s); });
const fibRec = (n) => record((call) => { const fib = (k) => call(`f${k}`, () => (k < 2 ? k : fib(k - 1) + fib(k - 2))); return fib(n); });
const fibMemoRec = (n) =>
  record((call) => {
    const memo = new Map();
    const fib = (k) => {
      if (k >= 2 && memo.has(k)) return call(`f${k}`, () => memo.get(k), 'hit');
      return call(`f${k}`, () => {
        if (k < 2) return k;
        const v = fib(k - 1) + fib(k - 2);
        memo.set(k, v);
        return v;
      });
    };
    return fib(n);
  });
// pow(e) from myPow: halve e, square on the way back, times x if e is odd
const powRec = (x, n, label = (e) => `pow(${e})`) =>
  record((call) => {
    const pow = (e) => call(label(e), () => {
      if (e === 0) return 1;
      const half = pow(Math.floor(e / 2));
      return e % 2 === 0 ? half * half : half * half * x;
    });
    return pow(n);
  });
const kthRec = (n, k) => record((call) => { const kth = (r, c) => call(`n${r},k${c}`, () => (r === 1 ? 0 : c % 2 === 1 ? kth(r - 1, Math.ceil(c / 2)) : 1 - kth(r - 1, Math.ceil(c / 2)))); return kth(n, k); });
const msRec = (a) =>
  record((call) => {
    const ms = (b) => call(b.join(','), () => {
      if (b.length <= 1) return b.slice();
      const mid = b.length / 2;
      const l = ms(b.slice(0, mid)).slice();
      const r = ms(b.slice(mid)).slice();
      const out = [];
      while (l.length && r.length) out.push(l[0] <= r[0] ? l.shift() : r.shift());
      return [...out, ...l, ...r];
    });
    return ms(a);
  });
const diffRec = (nums) => record((call) => { const diff = (i, j) => call(`${i},${j}`, () => (i === j ? nums[i] : Math.max(nums[i] - diff(i + 1, j), nums[j] - diff(i, j - 1)))); return diff(0, nums.length - 1); });
const gRec = (n) => record((call) => { const g = (k) => call(`g${k}`, () => (k === 1 ? 1 : g(k - 1) + g(k - 1))); return g(n); });
const callCount = (rec) => rec.nodes.length;

// Different Ways to Add Parentheses, straight from the lesson's code
function diffWays(expr) {
  const out = [];
  for (let i = 0; i < expr.length; i++) {
    const op = expr[i];
    if (op !== '+' && op !== '-' && op !== '*') continue;
    for (const a of diffWays(expr.slice(0, i))) for (const b of diffWays(expr.slice(i + 1))) out.push(op === '+' ? a + b : op === '-' ? a - b : a * b);
  }
  if (out.length === 0) out.push(Number(expr));
  return out;
}
const splitsOf = (expr) => [...expr].map((c, i) => [c, i]).filter(([c]) => '+-*'.includes(c)).map(([op, i]) => ({ op, i, left: diffWays(expr.slice(0, i)), right: diffWays(expr.slice(i + 1)) }));
const setText = (xs) => `{${xs.join(', ')}}`;

// ---------- data ----------
const SUM = sumRec(4);
const FACT = factRec(4);
const REV = revRec('abcd');
const FIB4 = fibRec(4);
const FIB_C = (n) => callCount(fibRec(n));
const FIB_MEMO = fibMemoRec(4);
const POW13 = powRec(2, 13);
const POW_NEG = powRec(0.5, 3); // myPow(2, −3): x = 1/2, n = 3
const POW10 = powRec(2, 10); // the lesson's dry run
const KTH = kthRec(4, 6);
const ROWS = ['0'];
while (ROWS.length < 4) ROWS.push([...ROWS.at(-1)].map((c) => (c === '0' ? '01' : '10')).join(''));
const MS = msRec([4, 1, 3, 2]);
const GAME = [4, 1, 3];
const DIFF = diffRec(GAME);
const G3 = gRec(3);
const EXPR = '2*3-4';
const EXPR_SPLITS = splitsOf(EXPR);
const EXPR4 = '1+2+3+4';
const EXPR4_SPLITS = splitsOf(EXPR4);
const exponents = (n) => { const out = [n]; while (out.at(-1) > 0) out.push(Math.floor(out.at(-1) / 2)); return out; };

// ---------- frame builders ----------
const sumFrames = SUM.ev.map((e) => {
  const n = +node(SUM, e.id).label.match(/\d+/)[0];
  const base = n === 1;
  return {
    say: e.kind === 'call' ? (base ? 0 : 2) : 1,
    note: e.kind === 'call' ? (base ? 'sum(1): base case, answer 1 directly.' : `sum(${n}) calls sum(${n - 1}) and waits.`) : base ? 'sum(1) returns 1.' : `sum(${n}) returns ${n} + ${e.v - n} = ${e.v}.`,
    panels: [stk(openLabels(SUM, e)), ...(e.kind === 'ret' ? [vars({ returned: e.v })] : [])],
  };
});

const factFrames = [
  { say: 0, note: 'fact(4) is called: one frame is pushed.', panels: [stk(['fact(4)']), vars({ n: 4 })] },
  ...FACT.ev.slice(1).map((e) => {
    const n = +node(FACT, e.id).label.match(/\d+/)[0];
    return {
      say: e.kind === 'call' ? 1 : 2,
      note: e.kind === 'call' ? (n === 1 ? 'fact(1) → base case.' : `fact(${n + 1}) waits for fact(${n}).`) : n === 1 ? 'fact(1) returns 1: its frame pops.' : `fact(${n}) returns ${n} * ${e.v / n} = ${e.v}.`,
      panels: [stk(openLabels(FACT, e)), vars(e.kind === 'call' ? { n } : { n, returns: e.v })],
    };
  }),
];

const fibNote = (rec, e) => {
  const n = +node(rec, e.id).label.slice(1);
  const kids = rec.nodes.filter((c) => c.parent === e.id);
  if (e.kind === 'call') return n < 2 ? `fib(${n}): base case.` : `fib(${n}) calls fib(${n - 1}) first.`;
  if (n < 2) return `fib(${n}) returns ${e.v}.`;
  return `fib(${n}) returns ${kids[0].v} + ${kids[1].v} = ${e.v}.`;
};

const powFrames = (rec, x, says) =>
  rec.ev.map((e) => {
    const ex = +node(rec, e.id).label.match(/-?\d+/)[0];
    const kid = rec.nodes.find((c) => c.parent === e.id);
    let note;
    if (e.kind === 'call') note = ex === 0 ? 'pow(0) = 1: base case.' : `pow(${ex}) needs pow(${Math.floor(ex / 2)}): ${ex} / 2 rounded down.`;
    else if (ex === 0) note = 'pow(0) returns 1.';
    else note = `pow(${ex}) returns ${kid.v} · ${kid.v}${ex % 2 ? ` · ${x}` : ''} = ${e.v}.`;
    return { say: says(e, ex), note, panels: [stk(openLabels(rec, e)), vars(e.kind === 'call' ? { e: ex } : { e: ex, half: kid ? kid.v : '—', returns: e.v })] };
  });

// reverseString(s) with go(l, r): one frame per call, swap and return
function goFrames(chars) {
  const s = chars.slice();
  const frames = [];
  const open = [];
  const go = (l, r) => {
    open.push(`go(${l}, ${r})`);
    const base = l >= r;
    frames.push({ say: base ? 1 : 0, note: base ? `go(${l}, ${r}): l >= r, base case. Return.` : `go(${l}, ${r}): the range ${l}..${r} is left to reverse.`, panels: [arr(s.slice(), { label: 's', pointers: l === r ? [ptr(l, 'l=r')] : base ? [] : [ptr(l, 'l'), ptr(r, 'r', 'b')], highlights: hl(s.length, (k) => (k === l || k === r ? 'active' : k < l || k > r ? 'done' : '')) }), stk(open.slice())] });
    if (base) return open.pop();
    [s[l], s[r]] = [s[r], s[l]];
    frames.push({ say: 3, note: `Swap s[${l}] and s[${r}].`, panels: [arr(s.slice(), { label: 's', pointers: [ptr(l, 'l'), ptr(r, 'r', 'b')], highlights: hl(s.length, (k) => (k <= l || k >= r ? 'done' : '')) }), stk(open.slice())] });
    frames.push({ say: 2, note: `Recurse on the smaller range: go(${l + 1}, ${r - 1}).`, panels: [arr(s.slice(), { label: 's', range: [Math.min(l + 1, r - 1), Math.max(l + 1, r - 1)], highlights: hl(s.length, (k) => (k <= l || k >= r ? 'done' : '')) }), stk(open.slice())] });
    go(l + 1, r - 1);
    open.pop();
  };
  go(0, s.length - 1);
  frames.push({ say: 2, note: 'Every call returns: nothing is left to do on the way back.', panels: [arr(s.slice(), { label: 's', highlights: hl(s.length, () => 'done') }), stk([])] });
  return frames;
}

// the dry-run table for myPow(2, 10): rows filled from the real run
const POW10_ROWS = POW10.nodes.map((n) => {
  const ex = +n.label.match(/\d+/)[0];
  const kid = POW10.nodes.find((c) => c.parent === n.id);
  return { label: n.label, e: String(ex), even: ex === 0 ? '—' : ex % 2 === 0 ? 'yes' : 'no', half: kid ? String(kid.v) : 'base', ret: kid ? `${kid.v} · ${kid.v}${ex % 2 ? ' · 2' : ''} = ${n.v}` : '1' };
});
const dryTable = (shownCalls, shownReturns, active) =>
  table(
    POW10_ROWS.map((r) => r.label),
    ['e', 'even?', 'half', 'returns'],
    POW10_ROWS.map((r, i) => (i < shownCalls ? [r.e, r.even, i >= POW10_ROWS.length - shownReturns ? r.half : '?', i >= POW10_ROWS.length - shownReturns ? r.ret : '?'] : ['', '', '', ''])),
    POW10_ROWS.map((_, i) => Array(4).fill(i === active ? 'active' : i >= POW10_ROWS.length - shownReturns ? 'done' : '')),
  );

const kthFrames = KTH.ev.map((e) => {
  const [r, c] = node(KTH, e.id).label.match(/\d+/g).map(Number);
  const row = [...ROWS[r - 1]];
  const kid = KTH.nodes.find((x) => x.parent === e.id);
  let note;
  let say;
  if (e.kind === 'call') {
    say = r === 1 ? 0 : 1;
    note = r === 1 ? 'Row 1 is "0": base case.' : `Row ${r}, k = ${c}: its parent is k = ${Math.ceil(c / 2)} in row ${r - 1} (⌈${c}/2⌉).`;
  } else {
    say = r === 1 ? 0 : 2;
    note = r === 1 ? 'Return 0.' : c % 2 === 1 ? `k = ${c} is odd (left child): copy the parent ${kid.v}.` : `k = ${c} is even (right child): flip the parent ${kid.v} → ${e.v}.`;
  }
  return { say, note, panels: [arr(row, { label: `row ${r}`, indexBase: 1, pointers: [ptr(c - 1, 'k')], highlights: { [c - 1]: e.kind === 'call' ? 'active' : 'done' } }), stk(openLabels(KTH, e))] };
});

// merge sort: skip the separate "return" frame of a single element (it returns at once)
const msFrames = MS.ev
  .map((e, t) => ({ e, t }))
  .filter(({ e }) => !(e.kind === 'ret' && node(MS, e.id).label.length === 1))
  .map(({ e, t }) => {
    const n = node(MS, e.id);
    const leaf = n.label.length === 1;
    const say = e.kind === 'call' ? (leaf ? 1 : 0) : 2;
    const note = e.kind === 'call' ? (leaf ? `[${n.label}]: one element is already sorted (base case).` : `Split [${n.label}] in half.`) : `Merge the sorted halves → [${e.v.join(', ')}].`;
    const t2 = leaf ? t + 1 : t; // show a leaf as finished in the same frame
    return { say, note, panels: [treeAt(MS, t2, { relabel: true, label: 'merge sort' })] };
  });

const exprFrames = () => {
  const chars = [...EXPR];
  const frames = [];
  const rows = EXPR_SPLITS.map((s) => `last ${s.op}`);
  const cells = EXPR_SPLITS.map(() => ['?', '?', '?']);
  const snap = (say, note, i, k, active) =>
    frames.push({
      say,
      note,
      panels: [
        arr(chars, { label: 'expr', ...(i === null ? {} : { pointers: [ptr(i, 'op')], highlights: hl(chars.length, (x) => (x === i ? 'active' : x < i ? 'window' : 'visited')) }) }),
        table(rows, ['left', 'right', 'values'], cells.map((r) => r.slice()), cells.map((_, r) => [0, 1, 2].map((c) => (r === k && c === active ? 'active' : r < k || (r === k && c < active) ? 'done' : '')))),
      ],
    });
  EXPR_SPLITS.forEach((s, k) => {
    const L = EXPR.slice(0, s.i);
    const R = EXPR.slice(s.i + 1);
    cells[k][0] = setText(s.left);
    snap(1, `Last op = "${s.op}". Left "${L}" → ${setText(s.left)}.`, s.i, k, 0);
    cells[k][1] = setText(s.right);
    snap(1, `Right "${R}" → ${setText(s.right)}.`, s.i, k, 1);
    const vals = s.left.flatMap((a) => s.right.map((b) => (s.op === '+' ? a + b : s.op === '-' ? a - b : a * b)));
    cells[k][2] = setText(vals);
    snap(2, `Combine: ${s.left.flatMap((a) => s.right.map((b) => `${a} ${s.op} ${b}`)).join(', ')} → ${setText(vals)}.`, s.i, k, 2);
  });
  snap(2, `All results: ${setText(diffWays(EXPR))}.`, null, EXPR_SPLITS.length, -1);
  return frames;
};

const diffFrames = DIFF.ev.map((e, t) => {
  const n = node(DIFF, e.id);
  const [i, j] = n.label.split(',').map(Number);
  const kids = DIFF.nodes.filter((c) => c.parent === e.id);
  let say;
  let note;
  if (e.kind === 'call') {
    if (i === j) [say, note] = [3, `diff(${i},${j}): one number left. Take it.`];
    else if (n.parent === null) [say, note] = [0, `diff(${i},${j}): best difference on [${GAME.slice(i, j + 1).join(', ')}] for the mover.`];
    else {
      const p = DIFF.nodes[n.parent];
      const first = DIFF.nodes.filter((c) => c.parent === p.id)[0].id === n.id;
      [say, note] = [first ? 1 : 2, `${first ? 'Try taking the left end' : 'Try taking the right end'}: the opponent then faces [${GAME.slice(i, j + 1).join(', ')}].`];
    }
  } else if (i === j) [say, note] = [3, `diff(${i},${i}) = ${e.v}.`];
  else [say, note] = [0, `diff(${i},${j}) = max(${GAME[i]} − ${kids[0].v}, ${GAME[j]} − ${kids[1].v}) = ${e.v}.`];
  return {
    say,
    note,
    panels: [treeAt(DIFF, t, { label: 'diff(i, j) calls' }), arr(GAME, { label: 'nums', range: [i, j], highlights: hl(GAME.length, (k) => (k >= i && k <= j ? 'window' : 'muted')) })],
  };
});

export default {
  what: [
    {
      kind: 'watch',
      title: 'sum(4) goes down, then comes back',
      lines: ['A **base case** answers a tiny input directly: `sum(1) = 1`.', 'A **recursive case** builds on a **strictly smaller** input: `sum(n) = n + sum(n − 1)`.', 'Each call stays open on the stack until its smaller call answers.'],
      frames: sumFrames,
    },
    {
      kind: 'turn',
      title: 'Your turn: the recursive case',
      lines: ['`sum(3)` needs one smaller call.', 'The base case is `n === 1`.'],
      panels: [stk(['sum(3)', 'sum(?)'])],
      task: {
        type: 'choose',
        question: 'Which recursive case is right?',
        options: [
          { text: '`return n + sum(n - 1);`', why: '' },
          { text: '`return n + sum(n);`', why: 'The input never shrinks, so `n === 1` is never reached.' },
          { text: '`return n + sum(n + 1);`', why: 'n grows away from the base case 1: the calls never stop.' },
        ],
        answer: 0,
      },
      solved: 'Only `n − 1` is **strictly smaller**: every call moves towards `sum(1)`.',
    },
    {
      kind: 'turn',
      title: 'Your turn: recursion depth',
      lines: ['**Recursion depth** = the most calls open at the same time.', 'An open call has started but not finished.'],
      panels: [stk(['sum(6)']), vars({ n: 6 })],
      task: { type: 'number', question: 'What is the recursion depth of `sum(6)`?', options: [1, 5, 6, 7], answer: 6, hint: 'sum(6) waits for sum(5), which waits for sum(4)… down to sum(1).' },
      solved: 'sum(6) … sum(1) are all open when the base case runs: depth 6.',
    },
    {
      kind: 'turn',
      title: 'Your turn: the cinema queue',
      lines: ['You are 5th in a queue and want your position.', 'You ask the person in front; they ask the person in front of them, and so on.', 'Person #1 just **knows** they are #1: the base case.'],
      panels: [arr(['?', '?', '?', '?', 'you'], { label: 'queue', indexBase: 1, pointers: [ptr(4, 'you')], highlights: { 4: 'active' } })],
      task: { type: 'number', question: 'How many times is "What is your position?" asked?', options: [3, 4, 5, 6], answer: 4, hint: 'Everyone asks once, except person #1.' },
      solved: '4 questions go forward. Then the answers travel back, each person adding 1.',
      then: [1, 2, 3, 4, 5].map((p) => ({
        say: p === 1 ? 2 : 1,
        note: p === 1 ? '"I am 1."' : p === 5 ? 'You add 1 to "I am 4": you are #5.' : `"Then I am ${p}."`,
        panels: [arr([1, 2, 3, 4, 5].map((q) => (q <= p ? `#${q}` : q === 5 ? 'you' : '?')), { label: 'queue', indexBase: 1, highlights: hl(5, (k) => (k === p - 1 ? 'active' : k < p - 1 ? 'done' : '')) })],
      })),
    },
  ],

  why: [
    {
      kind: 'watch',
      title: 'Induction: the dominoes fall',
      lines: ['Base: `sum(1)` is checked by hand.', 'Step: **if** `sum(k − 1)` is right, **then** `sum(k) = k + sum(k − 1)` is right.', 'The dominoes fall all the way up: that is **induction**.'],
      frames: [0, 1, 2, 3, 4].map((k) => {
        const rows = [1, 2, 3, 4].map((n) => [`sum(${n})`, n === 1 ? 'by hand' : `${n} + sum(${n - 1})`, String((n * (n + 1)) / 2)]);
        return {
          say: k === 0 ? 0 : k < 4 ? 1 : 2,
          note: k === 0 ? 'sum(1) = 1: checked by hand.' : k < 4 ? `sum(${k}) is right, so sum(${k + 1}) = ${k + 1} + ${(k * (k + 1)) / 2} = ${((k + 1) * (k + 2)) / 2} is right.` : 'Each one proves the next: every n is covered.',
          panels: [table(rows.map((r) => r[0]), ['why', 'value'], rows.map((r, i) => (i <= Math.min(k, 3) ? [r[1], r[2]] : ['?', '?'])), rows.map((_, i) => [0, 1].map(() => (k < 4 && i === k ? 'active' : i <= k ? 'done' : ''))))],
        };
      }),
    },
    {
      kind: 'turn',
      title: 'Your turn: reverse by describing it',
      lines: ['Recursion **describes the relation**: last char + reverse of the rest.', 'The language keeps the stack for you; the loop version moves `l` and `r` by hand.'],
      panels: [stk(openLabels(REV, REV.ev[3]))],
      task: { type: 'order', question: 'Tap the calls in the order they return.', items: ['reverse("a")', 'reverse("ab")', 'reverse("abc")', 'reverse("abcd")'], hint: 'The call on top of the stack finishes first.' },
      solved: 'The deepest call returns first; each one adds its last char in front.',
      then: REV.ev.slice(4).map((e) => {
        const n = node(REV, e.id);
        const s = n.label.slice(9, -2);
        return { say: 0, note: s.length === 1 ? `reverse("${s}") returns "${s}": base case.` : `reverse("${s}") returns "${s.at(-1)}" + "${e.v.slice(1)}" = "${e.v}".`, panels: [stk(openLabels(REV, e)), vars({ returned: `"${e.v}"` })] };
      }),
    },
    {
      kind: 'turn',
      title: 'Your turn: how far does it reach?',
      lines: ['You checked `sum(1)` by hand.', 'You showed: if `sum(k − 1)` is right, then `sum(k)` is right.'],
      panels: [arr(['✓', '?', '?', '?', '?'], { label: 'sum(n) correct?', indexBase: 1, highlights: { 0: 'done' } })],
      task: {
        type: 'choose',
        question: 'Which calls are now proven correct?',
        options: [
          { text: 'Every `sum(n)` with n ≥ 1', why: '' },
          { text: 'Only `sum(1)` and `sum(2)`', why: 'Apply the step again with k = 3, then 4, …: each one proves the next.' },
          { text: 'Only the ones you traced by hand', why: 'Induction is exactly what lets you skip the tracing.' },
        ],
        answer: 0,
      },
      solved: 'All of them. That is why you may **trust** the recursive call: the leap of faith.',
      then: [1, 2, 3, 4].map((k) => ({ say: 1, note: `sum(${k}) right ⇒ sum(${k + 1}) right.`, panels: [arr([0, 1, 2, 3, 4].map((i) => (i <= k ? '✓' : '?')), { label: 'sum(n) correct?', indexBase: 1, highlights: hl(5, (i) => (i === k ? 'active' : i < k ? 'done' : '')) })] })),
    },
  ],

  when: [
    {
      kind: 'watch',
      title: 'What does "smaller" mean?',
      lines: ['Finish the sentence: "If I had the answer for a **smaller input**, I could get this one by …"', 'The shape of the problem tells you what "smaller" is.'],
      frames: [
        ['Reduce by one', 'n − 1'],
        ['Halve', 'n / 2'],
        ['Split in two', 'left + right'],
        ['Game', 'after 1 move'],
        ['Nesting', 'inside ( )'],
      ].map((_, k, all) => ({ say: k === 0 ? 0 : 1, note: `${all[k][0]} → smaller input: ${all[k][1]}.`, panels: [reveal(all, 'smaller input', k)] })),
    },
    {
      kind: 'watch',
      title: 'No tail-call optimisation',
      lines: ['The spec describes proper tail calls, but V8 and Firefox never shipped them.', 'So even `return f(n − 1)` keeps **one frame per call**.'],
      frames: [5, 4, 3, 2, 1].map((n, k) => ({
        say: k === 0 ? 0 : 1,
        note: n === 1 ? 'f(1) hits the base case. 5 frames are open: nothing was reused.' : `f(${n}) runs \`return f(${n - 1})\`; its frame stays.`,
        panels: [stk([5, 4, 3, 2, 1].slice(0, k + 1).map((m) => `f(${m})`)), vars({ depth: k + 1 })],
      })),
    },
    {
      kind: 'turn',
      title: 'Your turn: 100,000 deep',
      lines: ['`f(n)` ends with `return f(n - 1)`.', 'You call `f(100000)` in Node.'],
      panels: [stk(['f(100000)', 'f(99999)', '…', 'f(2)', 'f(1)']), vars({ depth: '100,000' })],
      task: {
        type: 'choose',
        question: 'What happens?',
        options: [
          { text: '`RangeError: Maximum call stack size exceeded`', why: '' },
          { text: 'It runs: a tail call reuses its frame', why: 'V8 never shipped proper tail calls, so every call keeps its frame.' },
          { text: 'It runs: 100,000 frames is within the limit', why: 'Engines allow only about 10,000 nested calls.' },
        ],
        answer: 0,
      },
      solved: 'Depth O(n) for n = 10^5 is too deep: prefer a loop. Depth O(log n) is fine.',
    },
  ],

  recognize: [
    {
      kind: 'watch',
      title: 'The three questions',
      lines: ['1. What is the **smaller version**?', '2. What is the **base case**?', '3. **How deep** can it get, and do calls **repeat**?'],
      frames: [
        ['smaller?', 'n / 2'],
        ['base?', 'n = 0'],
        ['depth?', '≈ 30'],
        ['repeats?', 'no'],
      ].map((_, k, all) => ({
        say: Math.min(k, 2),
        note: ['Huge exponent → halve it: the smaller version is n / 2.', 'x^0 is known directly: base case n = 0.', 'Halving 10^9 down to 1 takes about 30 steps: shallow.', 'Each call makes one smaller call: nothing repeats.'][k],
        panels: [reveal(all, 'x^n, n = 10^9', k)],
      })),
    },
    {
      kind: 'turn',
      title: 'Your turn: question 3, depth',
      lines: ['A problem with n = 50,000 items.', 'Your recursion calls itself on n − 1.'],
      panels: [stk(['f(50000)', 'f(49999)', '…', 'f(1)'])],
      task: {
        type: 'choose',
        question: 'What does question 3 tell you?',
        options: [
          { text: 'Depth ≈ n = 50,000: prefer a loop', why: '' },
          { text: 'Fine: depth only matters for repeats', why: 'Depth ≈ n for n ≥ 10^4 is its own warning sign.' },
          { text: 'Memoize it', why: 'Memoizing helps when identical calls repeat. Here each f(n) is called once.' },
        ],
        answer: 0,
      },
      solved: 'Depth ≈ n with n ≥ 10^4 → write it as a loop.',
    },
    {
      kind: 'turn',
      title: 'Your turn: question 3, repeats',
      lines: ['Each `g(n)` calls `g(n − 1)` **twice**.', 'Red nodes are calls already made before.'],
      panels: [treeAt(G3, lastEvent(G3), { bad: G3.nodes.filter((n, i) => G3.nodes.findIndex((m) => m.label === n.label) !== i).map((n) => n.id), label: 'g(3) calls' })],
      task: {
        type: 'choose',
        question: 'What do the red repeats tell you?',
        options: [
          { text: 'Memoize: compute each call once and reuse it', why: '' },
          { text: 'Prefer a loop: it is too deep', why: 'Depth here is only 3. The problem is identical calls.' },
          { text: 'Nothing: every recursion repeats calls', why: 'A chain like sum(n) → sum(n − 1) never repeats a call. Repeats are the warning sign.' },
        ],
        answer: 0,
      },
      solved: 'Repeated identical calls → memoize (Dynamic Programming).',
    },
  ],

  intuition: [
    {
      kind: 'watch',
      title: 'fact(4) on the call stack',
      lines: ['A call pushes a **frame**: its parameters, locals and where to resume.', '**Winding**: calls go down 4, 3, 2, 1.', '**Unwinding**: frames pop 1, 2, 3, 4. The `n * …` happens here.'],
      frames: factFrames,
    },
    {
      kind: 'turn',
      title: 'Your turn: before and after the call',
      lines: ['`trace(n)`: print `in n`, call `trace(n − 1)`, print `out n`.', 'It stops at `n === 0`.', 'Code before the call runs while winding; code after it while unwinding.'],
      panels: [stk(['trace(2)', 'trace(1)', 'trace(0)'])],
      task: { type: 'order', question: 'Tap the four prints of `trace(2)` in order.', items: ['in 2', 'in 1', 'out 1', 'out 2'], hint: 'trace(0) prints nothing. A frame prints "out" only after its deeper call returns.' },
      solved: 'in 2, in 1, out 1, out 2: winding prints top-down, unwinding bottom-up.',
      then: (() => {
        const log = [];
        const frames = [];
        const open = [];
        const trace = (n) => {
          open.push(`trace(${n})`);
          if (n === 0) frames.push({ say: 1, note: 'trace(0): base case, returns.', panels: [stk(open.slice()), arr(log.slice(), { label: 'printed' })] });
          else {
            log.push(`in ${n}`);
            frames.push({ say: 2, note: `trace(${n}) prints "in ${n}" before calling.`, panels: [stk(open.slice()), arr(log.slice(), { label: 'printed', highlights: { [log.length - 1]: 'active' } })] });
            trace(n - 1);
            log.push(`out ${n}`);
            frames.push({ say: 2, note: `trace(${n - 1}) returned, so trace(${n}) prints "out ${n}".`, panels: [stk(open.slice()), arr(log.slice(), { label: 'printed', highlights: { [log.length - 1]: 'done' } })] });
          }
          open.pop();
        };
        trace(2);
        return frames;
      })(),
    },
    {
      kind: 'turn',
      title: 'Your turn: how tall does it get?',
      lines: ['`fact(n)` returns `n * fact(n - 1)`, with `fact(1) = 1`.'],
      panels: [stk(['fact(6)']), vars({ n: 6 })],
      task: { type: 'number', question: 'At the deepest point, how many frames does `fact(6)` have on the stack?', options: [1, 5, 6, 7], answer: factRec(6).ev.reduce((m, e) => Math.max(m, e.open.length), 0), hint: 'Every call from fact(6) down to fact(1) is still waiting.' },
      solved: 'fact(6) … fact(1): 6 frames. Then they pop one by one.',
    },
    {
      kind: 'turn',
      title: 'Your turn: the leap of faith',
      lines: ['You are **writing** `fact(n)`, not debugging it.', 'Assume `fact(n − 1)` already returns the right answer.'],
      panels: [vars({ 'fact(n-1)': 'trusted', 'fact(n)': '?' })],
      task: {
        type: 'choose',
        question: 'What is left for you to decide?',
        options: [
          { text: 'How to finish: multiply by n', why: '' },
          { text: 'Trace fact(n − 1) down to fact(1) first', why: 'Tracing is for debugging small inputs, not for designing.' },
          { text: 'Nothing: the call does all the work', why: 'The call answers the smaller input. You still turn it into the answer for n.' },
        ],
        answer: 0,
      },
      solved: 'Given the smaller answer, ask only: "how do I finish?" Here: `n * fact(n - 1)`.',
    },
  ],

  'brute-force': [
    {
      kind: 'watch',
      title: 'The recursion tree of fib(4)',
      lines: ['Each node is a call; its children are the calls it makes.', 'The stack holds only the path from the root to the active call.', 'A finished call sends its value up its edge.'],
      frames: FIB4.ev.map((e, t) => ({ say: t === 0 ? 0 : e.kind === 'call' ? 1 : 2, note: fibNote(FIB4, e), panels: [treeAt(FIB4, t), stk(openLabels(FIB4, e))] })),
    },
    {
      kind: 'watch',
      title: 'The same calls, again and again',
      lines: ['Identical calls show up in different branches.', 'Each repeat redoes the whole subtree under it.'],
      frames: ['f2', 'f1', 'f0'].map((lab) => {
        const ids = FIB4.nodes.filter((n) => n.label === lab).map((n) => n.id);
        return { say: lab === 'f2' ? 1 : 0, note: `fib(${lab.slice(1)}) is called ${ids.length} times.`, panels: [{ ...treeAt(FIB4, lastEvent(FIB4)), nodes: treeAt(FIB4, lastEvent(FIB4)).nodes.map((n) => ({ ...n, state: ids.includes(n.id) ? 'bad' : 'muted' })) }] };
      }),
    },
    {
      kind: 'turn',
      title: 'Your turn: count the calls',
      lines: ['Calls follow `C(n) = 1 + C(n−1) + C(n−2)`.', 'fib(4) made 9 calls; fib(3) makes 5.'],
      panels: [treeAt(FIB4, lastEvent(FIB4), { label: 'fib(4): 9 calls' }), vars({ 'C(4)': FIB_C(4), 'C(3)': FIB_C(3) })],
      task: { type: 'number', question: 'How many calls does `fib(5)` make?', options: [11, 14, FIB_C(5), 25], answer: FIB_C(5), hint: 'C(5) = 1 + C(4) + C(3).' },
      solved: `1 + ${FIB_C(4)} + ${FIB_C(3)} = ${FIB_C(5)}. The count grows like Fibonacci itself: about 1.618ⁿ.`,
    },
    {
      kind: 'watch',
      title: 'Memoization cuts the tree',
      lines: ['Cache each result the first time you compute it.', 'A repeat becomes an O(1) lookup: no subtree grows under it.'],
      frames: FIB_MEMO.ev.map((e, t) => {
        const n = node(FIB_MEMO, e.id);
        const k = +n.label.slice(1);
        const memo = [2, 3, 4].map((m) => {
          const at = FIB_MEMO.ev.findIndex((x, i) => i <= t && x.kind === 'ret' && node(FIB_MEMO, x.id).label === `f${m}` && !node(FIB_MEMO, x.id).tag);
          return at === -1 ? '·' : node(FIB_MEMO, FIB_MEMO.ev[at].id).v;
        });
        const hit = n.tag === 'hit';
        const note = hit ? (e.kind === 'call' ? `fib(${k}) is in the memo: look it up, no new calls.` : `fib(${k}) returns ${e.v} from the memo.`) : e.kind === 'call' ? (k < 2 ? `fib(${k}): base case.` : `fib(${k}) is not cached yet: compute it.`) : k < 2 ? `fib(${k}) returns ${e.v}.` : `fib(${k}) = ${e.v}: store it in the memo.`;
        return { say: hit ? 1 : 0, note, panels: [treeAt(FIB_MEMO, t), arr(memo, { label: 'memo', indexBase: 2, highlights: k >= 2 && e.kind === 'ret' ? { [k - 2]: hit ? 'active' : 'done' } : {} })] };
      }),
    },
    {
      kind: 'turn',
      title: 'Your turn: distinct calls',
      lines: ['The tree has many nodes, but few **distinct** ones.', 'Only these get computed once each with a memo.'],
      panels: [vars({ n: 6, 'naive calls': FIB_C(6) })],
      task: { type: 'number', question: 'How many distinct calls are in the tree of `fib(6)`?', options: [6, 7, 13, FIB_C(6)], answer: 7, hint: 'fib(0), fib(1), …, fib(6).' },
      solved: 'n + 1 = 7 distinct calls, so memoized fib(n) is O(n) time.',
    },
  ],

  optimized: [
    {
      kind: 'watch',
      title: 'Fast power: pow(13) with x = 2',
      lines: ['Even n: x^n = (x^(n/2))².', 'Odd n: x^n = (x^(n/2))² · x, with n/2 rounded down.', 'x^0 = 1 is the base case.', 'One call per halving: about log2(n) calls.'],
      frames: powFrames(POW13, 2, (e, ex) => (e.kind === 'call' ? (ex === 0 ? 2 : 3) : ex === 0 ? 2 : ex % 2 === 0 ? 0 : 1)),
    },
    {
      kind: 'turn',
      title: 'Your turn: count the halvings',
      lines: ['Each call makes **one** call on `Math.floor(n / 2)`.', 'The chain ends at `pow(0)`.'],
      panels: [vars({ n: 100 })],
      task: { type: 'number', question: 'How many calls does `pow(100)` make, counting `pow(0)`?', options: [7, exponents(100).length, 50, 100], answer: exponents(100).length, hint: 'Halve, rounding down, until you reach 0.' },
      solved: `${exponents(100).join(' → ')}: ${exponents(100).length} calls instead of 100.`,
      then: exponents(100).map((_, k, all) => ({ say: 0, note: k === all.length - 1 ? 'pow(0): base case.' : `pow(${all[k]}) calls pow(${all[k + 1]}).`, panels: [arr(all.map((v, i) => (i <= k ? v : '?')), { label: 'exponents', highlights: hl(all.length, (i) => (i === k ? 'active' : i < k ? 'done' : '')) })] })),
    },
    {
      kind: 'turn',
      title: 'Your turn: a negative exponent',
      lines: ['`myPow(2, −3)`: the answer is 1 / 2^3.'],
      panels: [vars({ x: 2, n: -3 })],
      task: {
        type: 'choose',
        question: 'What does myPow do first?',
        options: [
          { text: 'Replace x by 1/x and n by −n: x = 0.5, n = 3', why: '' },
          { text: 'Recurse on n = −3 as it is', why: 'Math.floor(−1 / 2) is −1: n gets stuck at −1 and never reaches 0.' },
          { text: 'Return −(2^3)', why: 'x^(−n) is 1 / x^n, not −x^n.' },
        ],
        answer: 0,
      },
      solved: `Then pow(3) with x = 0.5 gives ${POW_NEG.value}.`,
      then: powFrames(POW_NEG, 0.5, () => 0),
    },
    {
      kind: 'turn',
      title: 'Your turn: the 2^53 trap',
      lines: ['"Return the answer modulo 10^9 + 7."', 'Fast power computes `(a * b) % MOD` with a, b < 10^9 + 7.'],
      panels: [vars({ a: '≈ 10^9', b: '≈ 10^9', 'a * b': '≈ 10^18' })],
      task: {
        type: 'choose',
        question: 'Is `(a * b) % MOD` exact with plain Numbers?',
        options: [
          { text: 'No: ≈ 10^18 is past MAX_SAFE_INTEGER (≈ 9·10^15). Use BigInt.', why: '' },
          { text: 'Yes: % keeps the result small', why: 'The rounding already happened in a * b, before % runs.' },
          { text: 'Yes: Numbers are exact up to 10^18', why: 'They are exact only up to 2^53 − 1 ≈ 9·10^15.' },
        ],
        answer: 0,
      },
      solved: 'The product silently rounds, so the remainder is wrong. BigInt keeps it exact.',
    },
  ],

  template: [
    {
      kind: 'watch',
      title: 'The four questions on reverseString',
      lines: ['Parameters: the range `l..r` still to reverse.', 'Base case: `l >= r`, 0 or 1 element left.', 'Smaller call: `go(l + 1, r − 1)`.', 'One step of work: swap `s[l]` and `s[r]`.'],
      frames: goFrames([...'hello']),
    },
    {
      kind: 'turn',
      title: 'Your turn: how many calls?',
      lines: ['Each call shrinks the range by 2.', 'The last call is the base case.'],
      panels: [arr([...'abcdefgh'], { label: 's', pointers: [ptr(0, 'l'), ptr(7, 'r', 'b')] })],
      task: { type: 'number', question: 'How many `go` calls does `reverseString` make on 8 chars?', options: [4, 5, 8, 9], answer: 5, hint: 'go(0, 7), go(1, 6), … until l >= r. Count that one too.' },
      solved: 'go(0, 7), go(1, 6), go(2, 5), go(3, 4), go(4, 3): 5 calls. Depth is about n/2.',
    },
    {
      kind: 'turn',
      title: 'Your turn: why indices?',
      lines: ['The helper passes `l` and `r`.', 'It could pass a shorter copy instead.'],
      panels: [arr([...'abcdef'], { label: 's', range: [1, 4], pointers: [ptr(1, 'l'), ptr(4, 'r', 'b')] })],
      task: {
        type: 'choose',
        question: 'Why pass indices instead of slices?',
        options: [
          { text: 'Each call stays O(1): nothing is copied', why: '' },
          { text: 'Slices would make the recursion deeper', why: 'Depth is about n/2 either way. Slices add copying work to every call.' },
          { text: 'Indices remove the need for a base case', why: 'There is still a base case: `l >= r`.' },
        ],
        answer: 0,
      },
      solved: 'Indices keep each call O(1). For very large n, prefer the loop: depth is n/2.',
    },
  ],

  implementation: [
    {
      kind: 'watch',
      title: 'kthGrammar(4, 6): one path up the rows',
      lines: ['Row 1 is `0`: the base case.', 'Symbol k comes from its parent `⌈k/2⌉` one row up.', 'Odd k (left child) copies the parent; even k (right child) flips it.'],
      frames: kthFrames,
    },
    {
      kind: 'turn',
      title: 'Your turn: find the parent',
      lines: ['`kthGrammar(4, 7)` asks row 3 for the parent of k = 7.'],
      panels: [arr([...ROWS[2]], { label: 'row 3', indexBase: 1 })],
      task: { type: 'cell', question: 'Tap the parent in row 3.', answer: Math.ceil(7 / 2) - 1, hints: { 0: 'k = 1 is the parent of k = 1 and 2.', 1: 'k = 2 is the parent of k = 3 and 4.', 2: 'k = 3 is the parent of k = 5 and 6.' } },
      solved: `⌈7/2⌉ = 4. k = 7 is odd, so it copies the parent: symbol ${kthRec(4, 7).value}.`,
    },
    {
      kind: 'turn',
      title: 'Your turn: halving safely',
      lines: ['`pow(e)` recurses on `Math.floor(e / 2)`.', 'The comment says: NOT `e >> 1`.'],
      panels: [vars({ e: '2^31' })],
      task: {
        type: 'choose',
        question: 'Why not `e >> 1`?',
        options: [
          { text: '`>>` works on 32-bit signed ints: `(2 ** 31) >> 1` is −1073741824', why: '' },
          { text: '`>>` rounds up instead of down', why: 'For small positive ints it halves and rounds down. The problem is big e.' },
          { text: '`Math.floor` is faster', why: 'Speed is not the reason. Correctness for e = 2^31 is.' },
        ],
        answer: 0,
      },
      solved: 'Bit operators convert to 32-bit ints. Use `Math.floor(n / 2)` for big n.',
    },
  ],

  'dry-run': [
    {
      kind: 'watch',
      title: 'myPow(2, 10): winding',
      lines: ['Calls are **made** top-down: pow(10) calls pow(5), which calls pow(2)…', 'The `e` and `even?` columns fill in as each call starts.'],
      frames: POW10.ev
        .filter((e) => e.kind === 'call')
        .map((e, k) => ({ say: k === 0 ? 0 : 1, note: k === 4 ? 'pow(0): base case. The stack is 5 frames tall.' : `${POW10_ROWS[k].label}: e = ${POW10_ROWS[k].e}, even? ${POW10_ROWS[k].even}. It waits for the deeper call.`, panels: [dryTable(k + 1, 0, k), stk(openLabels(POW10, e))] })),
    },
    {
      kind: 'turn',
      title: 'Your turn: unwinding',
      lines: ['Results are known only after the deeper call returns.', 'Work after the call (the squaring) happens on the way back up.'],
      panels: [dryTable(5, 0, -1), stk(POW10.nodes.map((n) => n.label))],
      task: { type: 'order', question: 'Tap the calls in the order they return.', items: ['pow(0)', 'pow(1)', 'pow(2)', 'pow(5)', 'pow(10)'], hint: 'The top of the stack finishes first.' },
      solved: 'pow(0) finishes first and pow(10) last: read "returns" bottom-up.',
      then: POW10.ev
        .filter((e) => e.kind === 'ret')
        .map((e, k) => {
          const row = POW10_ROWS.length - 1 - k;
          return { say: 1, note: `${POW10_ROWS[row].label} returns ${POW10_ROWS[row].ret}.`, panels: [dryTable(5, k + 1, row), stk(openLabels(POW10, e))] };
        }),
    },
    {
      kind: 'turn',
      title: 'Your turn: another exponent',
      lines: ['Same code, `myPow(2, 16)`.'],
      panels: [vars({ x: 2, n: 16 })],
      task: { type: 'number', question: 'How many `pow` calls, counting `pow(0)`?', options: [4, 5, exponents(16).length, 16], answer: exponents(16).length, hint: 'Halve until 0: 16, 8, …' },
      solved: `${exponents(16).join(' → ')}: ${exponents(16).length} calls, and ${powRec(2, 16).value} at the end.`,
    },
  ],

  'intuition-divide-conquer': [
    {
      kind: 'watch',
      title: 'Merge sort: split, then combine',
      lines: ['**Divide**: split the array in half.', '**Conquer**: sort each half recursively; one element is the base case.', '**Combine**: merge the two sorted halves.'],
      frames: msFrames,
    },
    {
      kind: 'watch',
      title: 'Every split point: "2*3-4"',
      lines: ['Pick the operator applied **last**: it splits the expression in two.', 'Solve each side recursively; a plain number is the base case.', 'Combine every left value with every right value.'],
      frames: [{ say: 0, note: 'Two operators, so two ways to choose the last one.', panels: exprFrames()[0].panels.map((p, i) => (i === 0 ? arr([...EXPR], { label: 'expr' }) : { ...p, cells: p.cells.map(() => ['?', '?', '?']), states: undefined })) }, ...exprFrames()],
    },
    {
      kind: 'turn',
      title: 'Your turn: how many results?',
      lines: ['`diffWaysToCompute("1+2+3+4")`.', 'Each split gives (left results) × (right results) values.'],
      panels: [arr([...EXPR4], { label: 'expr' })],
      task: { type: 'number', question: 'How many values end up in `out`?', options: [3, 4, diffWays(EXPR4).length, 6], answer: diffWays(EXPR4).length, hint: 'Three splits. "1+2+3" alone has 2 results.' },
      solved: `${EXPR4_SPLITS.map((s) => `${s.left.length} × ${s.right.length}`).join(' + ')} = ${diffWays(EXPR4).length} values (all equal ${diffWays(EXPR4)[0]} here: only + is used).`,
      then: EXPR4_SPLITS.map((s, k) => ({
        say: 1,
        note: `Last "+" at index ${s.i}: ${s.left.length} left × ${s.right.length} right = ${s.left.length * s.right.length}.`,
        panels: [
          arr([...EXPR4], { label: 'expr', pointers: [ptr(s.i, 'op')], highlights: hl(EXPR4.length, (x) => (x === s.i ? 'active' : x < s.i ? 'window' : 'visited')) }),
          table(EXPR4_SPLITS.map((q) => `op @${q.i}`), ['left', 'right', 'count'], EXPR4_SPLITS.map((q, r) => (r <= k ? [String(q.left.length), String(q.right.length), String(q.left.length * q.right.length)] : ['?', '?', '?'])), EXPR4_SPLITS.map((_, r) => Array(3).fill(r === k ? 'active' : r < k ? 'done' : ''))),
        ],
      })),
    },
    {
      kind: 'turn',
      title: 'Your turn: the base case',
      lines: ['A string with no operator is just a number.'],
      panels: [arr(['7'], { label: 'expr' })],
      task: {
        type: 'choose',
        question: 'What does `diffWaysToCompute("7")` return?',
        options: [
          { text: '`[7]`', why: '' },
          { text: '`[]`', why: 'The loop finds no operator, so out is empty, and then `out.push(Number(expr))` runs.' },
          { text: '`undefined`', why: 'The function always returns its out array.' },
        ],
        answer: 0,
      },
      solved: `out is empty after the loop, so it pushes Number("7"): [${diffWays('7')}].`,
    },
  ],

  'optimized-game': [
    {
      kind: 'watch',
      title: 'Greedy fails',
      lines: ['Players take a number from **either end**; both play optimally.', 'Greedy "take the bigger end" fails: taking 2 lets the opponent take 5.'],
      frames: [
        { say: 0, note: 'Player 1 moves first.', panels: [arr([1, 5, 2], { label: 'nums' }), vars({ P1: 0, P2: 0 })] },
        { say: 1, note: 'Greedy: 2 > 1, so player 1 takes 2.', panels: [arr([1, 5, 2], { label: 'nums', highlights: { 2: 'active' } }), vars({ P1: 2, P2: 0 })] },
        { say: 1, note: 'That opens up the 5 for player 2.', panels: [arr([1, 5, 2], { label: 'nums', highlights: { 1: 'bad', 2: 'muted' } }), vars({ P1: 2, P2: 5 })] },
        { say: 1, note: 'Player 1 gets the 1: 3 against 5.', panels: [arr([1, 5, 2], { label: 'nums', highlights: { 0: 'active', 1: 'muted', 2: 'muted' } }), vars({ P1: 3, P2: 5 })] },
      ],
    },
    {
      kind: 'watch',
      title: 'diff(i, j) on [4, 1, 3]',
      lines: ['`diff(i, j)` = best (my total − opponent\'s total) on `nums[i..j]`, for whoever moves.', 'Take `nums[i]`: I get `nums[i] − diff(i+1, j)`.', 'Take `nums[j]`: I get `nums[j] − diff(i, j−1)`.', '`diff(i, i) = nums[i]`.'],
      frames: [
        ...diffFrames,
        (() => {
          const dup = DIFF.nodes.filter((n, i) => DIFF.nodes.findIndex((m) => m.label === n.label) !== i).map((n) => n.id);
          return { say: 0, note: `diff(0,2) = ${DIFF.value} ≥ 0: player 1 wins. diff(1,1) was computed twice.`, panels: [treeAt(DIFF, lastEvent(DIFF), { bad: dup, label: 'diff(i, j) calls' }), arr(GAME, { label: 'nums', highlights: hl(GAME.length, () => 'done') })] };
        })(),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: the first move',
      lines: ['Same game: [4, 1, 3].', 'The sub-results are known.'],
      panels: [arr(GAME, { label: 'nums' }), vars({ 'diff(1,2)': DIFF.nodes.find((n) => n.label === '1,2').v, 'diff(0,1)': DIFF.nodes.find((n) => n.label === '0,1').v })],
      task: { type: 'cell', question: 'Which number should player 1 take first?', answer: 0, hints: { 1: 'Only the two ends can be taken.', 2: `Take 3: 3 − diff(0,1) = 3 − 3 = 0. Taking 4 gives 4 − 2 = 2.` } },
      solved: 'Take 4: 4 − diff(1,2) = 2 beats 3 − diff(0,1) = 0.',
    },
    {
      kind: 'turn',
      title: 'Your turn: whose viewpoint?',
      lines: ['I take `nums[0]`.', 'Now the opponent faces `nums[1..2]`.'],
      panels: [arr(GAME, { label: 'nums', range: [1, 2], highlights: { 0: 'done' } })],
      task: {
        type: 'choose',
        question: '`diff(1, 2)` is measured from whose viewpoint?',
        options: [
          { text: "The opponent's: they move next, so I subtract it", why: '' },
          { text: 'Mine: I add it to my pick', why: 'Roles swap after every move. The new mover measures (their score − mine).' },
          { text: "Nobody's: it is the sum of what is left", why: 'diff is a difference between the players, not a total.' },
        ],
        answer: 0,
      },
      solved: 'One function for both players, each flipping the sign: minimax for zero-sum games.',
    },
    {
      kind: 'turn',
      title: 'Your turn: plain recursion cost',
      lines: ['Each call on k numbers makes 2 calls on k − 1 numbers.', 'A single number makes none.'],
      panels: [arr([4, 1, 3, 2], { label: 'nums' }), vars({ n: 4 })],
      task: { type: 'number', question: 'How many `diff` calls for these 4 numbers, without a memo?', options: [7, 10, callCount(diffRec([4, 1, 3, 2])), 16], answer: callCount(diffRec([4, 1, 3, 2])), hint: '1 + 2 + 4 + 8.' },
      solved: `${callCount(diffRec([4, 1, 3, 2]))} calls, but only 10 distinct (i, j) pairs. Memoizing them is interval DP.`,
    },
  ],

  mistakes: [
    {
      kind: 'watch',
      title: 'A base case it jumps over',
      lines: ['Every call must move **strictly towards** a base case, for all inputs.', '`f(n)` returns `f(n − 2)` and stops at `n === 0`.', 'An odd n jumps over 0 and runs into negatives.'],
      frames: [3, 1, -1, -3, -5].map((n, k, all) => ({
        say: k === 0 ? 1 : n > 0 ? 0 : 2,
        note: k === all.length - 1 ? '… it never stops: RangeError: Maximum call stack size exceeded.' : n === -1 ? 'f(-1): 0 was skipped. No base case is left ahead.' : `f(${n}) is not 0: call f(${n - 2}).`,
        panels: [stk(all.slice(0, k + 1).map((m) => `f(${m})`).concat(k === all.length - 1 ? ['…'] : [])), vars({ n })],
      })),
    },
    {
      kind: 'watch',
      title: 'Forgetting `return`',
      lines: ['`last(n)`: `if (n === 0) return "done";` then `last(n - 1);` with no `return`.', 'The base case answers, but nobody passes it on.'],
      frames: (() => {
        const rec = record((call) => { const last = (n) => call(`last(${n})`, () => { if (n === 0) return 'done'; last(n - 1); }); return last(2); });
        return rec.ev.map((e) => {
          const n = +node(rec, e.id).label.match(/\d+/)[0];
          return { say: e.kind === 'ret' && n > 0 ? 1 : 0, note: e.kind === 'call' ? `last(${n}) is called.` : n === 0 ? 'last(0) returns "done".' : `last(${n}) drops it and returns undefined.`, panels: [stk(openLabels(rec, e)), ...(e.kind === 'ret' ? [vars({ returns: e.v === undefined ? 'undefined' : `"${e.v}"` })] : [])] };
        });
      })(),
    },
    {
      kind: 'turn',
      title: 'Your turn: hidden copies',
      lines: ['`reverse(s)` recurses on `s.slice(0, -1)`.', 'Every slice copies the characters it keeps.'],
      panels: [arr([...'abcde'], { label: 's' })],
      task: { type: 'number', question: 'How many characters are copied in total for "abcde"?', options: [5, 10, 15, 25], answer: 4 + 3 + 2 + 1, hint: 'The calls copy 4, then 3, then 2, then 1.' },
      solved: '4 + 3 + 2 + 1 = 10. An O(n) copy per call makes the work O(n²). Pass indices.',
    },
    {
      kind: 'turn',
      title: 'Your turn: the memo inside',
      lines: ['`function fib(n) { const memo = new Map(); … }`', 'The memo is created inside the function.'],
      panels: [stk(['fib(4)  memo {}', 'fib(3)  memo {}', 'fib(2)  memo {}'])],
      task: {
        type: 'choose',
        question: 'What goes wrong?',
        options: [
          { text: 'Every call makes a new empty memo, so nothing is reused', why: '' },
          { text: 'Map lookups are too slow', why: 'Lookups are fast. The memo is simply always empty.' },
          { text: 'It throws a RangeError at once', why: 'It still runs, just as slowly as with no memo.' },
        ],
        answer: 0,
      },
      solved: 'Define the memo outside, or in a wrapper, and pass it down.',
    },
  ],

  'interview-tips': [
    {
      kind: 'watch',
      title: 'Say it before you code it',
      lines: ['Say the **recurrence in words** first.', 'Name the **base case**; test the smallest inputs.', 'State **both costs**: time and stack.'],
      frames: [
        ['recurrence', '(n/2)², · x if odd'],
        ['base case', 'n = 0 → 1'],
        ['test with', '0, 1'],
        ['costs', 'O(log n), O(log n)'],
      ].map((_, k, all) => ({ say: [0, 1, 1, 2][k], note: ['"The answer for n is the answer for n/2 squared, times x if n is odd."', 'Then the base case, out loud.', 'Try the smallest inputs against it.', '"O(log n) time and O(log n) stack space."'][k], panels: [reveal(all, 'fast power', k)] })),
    },
    {
      kind: 'turn',
      title: 'Your turn: a deep recursion',
      lines: ['Your solution recurses on n − 1.', 'n can be 10^5.'],
      panels: [stk(['f(100000)', 'f(99999)', '…', 'f(1)'])],
      task: {
        type: 'choose',
        question: 'What do you tell the interviewer?',
        options: [
          { text: '"In JS I\'d convert this to a loop: the stack is ~10k frames."', why: '' },
          { text: '"I\'ll memoize it."', why: 'A memo fixes repeated calls, not depth.' },
          { text: 'Nothing: they did not ask about the stack', why: 'Interviewers often ask about the stack. Say it up front.' },
        ],
        answer: 0,
      },
      solved: 'Mention JS limits whenever the depth is large.',
    },
  ],
};
