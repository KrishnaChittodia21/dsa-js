// Shorts for Recursion (M9). Format: src/content/shortSchema.js. Facts come only from topics/recursion/topic.js.
// Every call, return value, stack and tree below is produced by running the pattern's template on its "e.g." input.
const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const stk = (values, label = 'call stack') => ({ kind: 'stack', values, label });
const table = (rowLabels, colLabels, cells, label) => ({ kind: 'table', rowLabels, colLabels, cells, ...(label ? { label } : {}) });
const hl = (n, f) => Object.fromEntries(Array.from({ length: n }, (_, k) => [k, f(k)]));
const ptr = (index, label, color = 'a') => ({ index, label, color });
const show = (v) => (Array.isArray(v) ? `[${v.join(', ')}]` : String(v));

// ---------- recorder: run a recursion, keep every call / return and the open frames ----------
function record(run) {
  const nodes = [];
  const ev = [];
  const open = [];
  const call = (label, fn) => {
    const id = nodes.length;
    nodes.push({ id, label, parent: open.length ? open.at(-1) : null, depth: open.length });
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
// index of the event `kind` of the call labelled `label` (the n-th such call)
const evAt = (rec, kind, label, nth = 0) => rec.ev.map((e, t) => [e, t]).filter(([e]) => e.kind === kind && rec.nodes[e.id].label === label)[nth][1];
const openAt = (rec, t, fmt = (l) => l) => rec.ev[t].open.map((id) => fmt(rec.nodes[id].label));
// the call tree after event t: unseen calls hidden, open path visited, finished calls done with their value on the edge
function treeAt(rec, t, label, { bad = [] } = {}) {
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
    label,
    directed: true,
    nodes: rec.nodes.map((n) => ({
      id: n.id,
      label: n.label,
      x: n.x,
      y: n.depth,
      state: !seen.has(n.id) ? 'hidden' : bad.includes(n.label) ? 'bad' : n.id === cur.id ? 'active' : done.has(n.id) ? 'done' : open.has(n.id) ? 'visited' : '',
    })),
    edges: rec.nodes
      .filter((n) => n.parent !== null)
      .map((n) => ({ from: n.parent, to: n.id, ...(done.has(n.id) ? { label: show(done.get(n.id)), state: 'done' } : open.has(n.id) ? { state: 'active' } : {}) })),
  };
}
const last = (rec) => rec.ev.length - 1;

// ---------- reduce & trust: Josephus J(n) = (J(n − 1) + k) % n, e.g. n = 5, k = 2 ----------
const JK = 2;
const JN = 5;
const josephus = (n, k) => (n === 1 ? 0 : (josephus(n - 1, k) + k) % n);
// the circle simulated directly: removal order and survivor (0-based)
const circle = (n, k) => {
  const ppl = Array.from({ length: n }, (_, p) => p);
  const out = [];
  let at = 0;
  while (ppl.length > 1) {
    at = (at + k - 1) % ppl.length;
    out.push(ppl.splice(at, 1)[0]);
  }
  return { out, survivor: ppl[0] };
};
const JC = circle(JN, JK);
if (JC.survivor !== josephus(JN, JK)) throw new Error('josephus: recurrence and simulation disagree');
const JTURN = josephus(JN + 1, JK);
if (circle(JN + 1, JK).survivor !== JTURN) throw new Error('josephus: turn answer is wrong');
const jStack = (top) => stk(Array.from({ length: JN - top + 1 }, (_, d) => `J(${JN - d})`));
const jFrames = [
  {
    say: 0,
    note: `Winding: J(5) waits for J(4), … down to J(1). One person left: index 0, the base case.`,
    panels: [jStack(1), vars({ n: 1, 'J(1)': 0 })],
  },
  ...Array.from({ length: JN - 1 }, (_, d) => {
    const n = d + 2;
    const sub = josephus(n - 1, JK);
    const v = josephus(n, JK);
    return {
      say: 1,
      note: `J(${n}) = (J(${n - 1}) + ${JK}) % ${n} = (${sub} + ${JK}) % ${n} = ${v}.${n === JN ? ' Same survivor as the simulation.' : ''}`,
      panels: [jStack(n), vars({ n, [`J(${n - 1}) trusted`]: sub, [`J(${n})`]: v })],
    };
  }),
];

// ---------- halving: power(3, 9) from the template ----------
const PX = 3;
const PN = 9;
const POW = record((call) => {
  const power = (n) =>
    call(`p(${n})`, () => {
      if (n === 0) return 1;
      const half = power(Math.floor(n / 2));
      return n % 2 === 0 ? half * half : half * half * PX;
    });
  return power(PN);
});
if (POW.value !== PX ** PN) throw new Error('power: wrong value');
const powRet = POW.ev
  .map((e, t) => [e, t])
  .filter(([e]) => e.kind === 'ret')
  .map(([e, t]) => {
    const n = +POW.nodes[e.id].label.match(/\d+/)[0];
    const half = n === 0 ? null : POW.nodes.find((m) => m.parent === e.id).v;
    const odd = n % 2 === 1;
    return {
      say: n === 0 ? 2 : 1,
      note:
        n === 0
          ? 'power(0) is the base case: return 1. Now the waiting calls finish, deepest first.'
          : `power(${n}): n is ${odd ? 'odd' : 'even'}, half = ${half} → ${odd ? `${half} · ${half} · ${PX}` : `${half} · ${half}`} = ${e.v}.${n === PN ? ` That is 3^9, in ${POW.nodes.length} calls.` : ''}`,
      panels: [stk(openAt(POW, t).concat(POW.nodes[e.id].label).map((l) => l.replace('p', 'power'))), vars({ n, half: half ?? '—', returns: e.v })],
    };
  });
const powDeep = evAt(POW, 'call', 'p(0)');
// the trap: the half computed twice, on n = 4
const twice = (n) => record((call) => { const p = (e) => call(`p${e}`, () => (e === 0 ? 1 : p(Math.floor(e / 2)) * p(Math.floor(e / 2)) * (e % 2 ? PX : 1))); return p(n); });
const once = (n) => record((call) => { const p = (e) => call(`p${e}`, () => { if (e === 0) return 1; const h = p(Math.floor(e / 2)); return h * h * (e % 2 ? PX : 1); }); return p(n); });
const TW = twice(4);
const ON = once(4);
const count = (rec, label) => rec.nodes.filter((n) => n.label === label).length;

// ---------- divide & conquer: every grouping of "8-4-2", from the lesson's code ----------
const IS_OP = (c) => c === '+' || c === '-' || c === '*';
const apply = (op, a, b) => (op === '+' ? a + b : op === '-' ? a - b : a * b);
function diffWays(expr) {
  const out = [];
  for (let i = 0; i < expr.length; i++) {
    if (!IS_OP(expr[i])) continue;
    for (const a of diffWays(expr.slice(0, i))) for (const b of diffWays(expr.slice(i + 1))) out.push(apply(expr[i], a, b));
  }
  if (out.length === 0) out.push(Number(expr));
  return out;
}
const DC = record((call) => {
  const all = (expr) =>
    call(expr, () => {
      const out = [];
      for (let i = 0; i < expr.length; i++) {
        if (!IS_OP(expr[i])) continue;
        const left = all(expr.slice(0, i));
        const right = all(expr.slice(i + 1));
        for (const a of left) for (const b of right) out.push(apply(expr[i], a, b));
      }
      if (out.length === 0) out.push(Number(expr));
      return out;
    });
  return all('8-4-2');
});
const sym = (e) => e.replace(/-/g, '−').replace(/\*/g, '×');
const splitsOf = (expr) => [...expr].map((c, i) => [c, i]).filter(([c]) => IS_OP(c)).map(([op, i]) => ({ op, left: diffWays(expr.slice(0, i)), right: diffWays(expr.slice(i + 1)), at: i }));
const DC_TREE = 'calls of all(expr), edge = list returned';
const dcFrame = (t, say, note, v) => ({ say, note, panels: [treeAt(DC, t, DC_TREE), vars(v)] });
const E4 = '8-4-2-1';
const E4S = splitsOf(E4);
const E4ALL = diffWays(E4);
// the turn: the '*' split of "8-4-2*3-2-1"
const TURN_E = '8-4-2*3-2-1';
const TURN_S = splitsOf(TURN_E).find((s) => s.op === '*');
const TURN_OUT = TURN_S.left.flatMap((a) => TURN_S.right.map((b) => a * b));

// ---------- minimax: diff(i, j) on [3, 9, 1, 2] ----------
const GAME = [3, 9, 1, 2];
const diff = (nums, i, j) => (i === j ? nums[i] : Math.max(nums[i] - diff(nums, i + 1, j), nums[j] - diff(nums, i, j - 1)));
const GM = record((call) => {
  const d = (i, j) => call(`${i},${j}`, () => (i === j ? GAME[i] : Math.max(GAME[i] - d(i + 1, j), GAME[j] - d(i, j - 1))));
  return d(0, GAME.length - 1);
});
const D = (i, j) => diff(GAME, i, j);
const GM_TREE = 'calls diff(i, j), edge = value returned';
const gmStack = (t) => stk(GM.ev[t].open.length ? openAt(GM, t, (l) => `diff(${l})`) : ['(all returned)']);
const neg = (v) => (v < 0 ? `(−${-v})` : String(v));
const gmFrame = (label, say, note) => {
  const t = evAt(GM, label.endsWith('deep') ? 'call' : 'ret', label.replace(' deep', ''));
  return { say, note, panels: [treeAt(GM, t, GM_TREE), gmStack(t)] };
};
const why = (i, j) => `diff(${i},${j}) = max(${GAME[i]} − ${neg(D(i + 1, j))}, ${GAME[j]} − ${neg(D(i, j - 1))}) = ${String(D(i, j)).replace('-', '−')}`;
// greedy player 1 (bigger end) against an optimal player 2
const greedy = (() => {
  let i = 0;
  let j = GAME.length - 1;
  const moves = [];
  for (let turn = 0; i <= j; turn ^= 1) {
    const left = turn === 0 ? GAME[i] >= GAME[j] : i === j || GAME[i] - D(i + 1, j) >= GAME[j] - D(i, j - 1);
    moves.push({ who: turn, idx: left ? i : j });
    if (left) i++;
    else j--;
  }
  return moves;
})();
const greedyScore = (who) => greedy.filter((m) => m.who === who).map((m) => GAME[m.idx]);
const sum = (xs) => xs.reduce((a, b) => a + b, 0);
// the turn: [6, 1, 4]
const TG = [6, 1, 4];
const TD = (i, j) => diff(TG, i, j);

// ---------- recursive descent: evaluate "|(&(t,f),!(f))" with a shared cursor ----------
const SRC = '|(&(t,f),!(f))';
const CH = [...SRC];
const PS = []; // snapshots: cursor, open levels, and the tree event at that moment
{
  let i = 0;
  let nEv = 0; // events recorded so far (a call pushes one before its body runs, a return one after)
  const levels = []; // open expr() calls: { c, parts }
  const snap = (note) => PS.push({ note, i, t: nEv - 1, levels: levels.map((l) => `${l.c}  parts: [${l.parts.join(', ')}]`) });
  const evalOp = (c, parts) => (c === '!' ? (parts[0] === 't' ? 'f' : 't') : c === '&' ? (parts.every((p) => p === 't') ? 't' : 'f') : parts.some((p) => p === 't') ? 't' : 'f');
  PS.rec = record((call) => {
    const counted = (label, fn) => {
      nEv++;
      const v = call(label, fn);
      nEv++;
      return v;
    };
    const expr = () =>
      counted(SRC[i], () => {
        const c = SRC[i++];
        if (c === 't' || c === 'f') return c;
        i++; // skip '('
        const lvl = { c, parts: [] };
        levels.push(lvl);
        snap(`${levels.length === 1 ? 'Root' : 'A new level'}: read "${c}", skip "(". i = ${i}.`);
        while (SRC[i] !== ')') {
          lvl.parts.push(expr());
          if (SRC[i] === ',') i++;
        }
        i++; // skip ')'
        const v = evalOp(c, lvl.parts);
        snap(`"${c}" skips its ")" and returns ${c}(${lvl.parts.join(',')}) = ${v}. i = ${i}.`);
        levels.pop();
        return v;
      });
    return expr();
  });
}
if (PS.rec.value !== 't' || PS.length !== 6) throw new Error('parse: unexpected run');
const psFrame = (k, say, note = PS[k].note) => ({
  say,
  note,
  panels: [
    arr(CH, { label: 's', pointers: PS[k].i < CH.length ? [ptr(PS[k].i, 'i')] : [], highlights: hl(CH.length, (x) => (x < PS[k].i ? 'visited' : x === PS[k].i ? 'active' : '')) }),
    stk(PS[k].levels.length ? PS[k].levels : ['(empty)'], 'open expr() calls'),
    treeAt(PS.rec, PS[k].t, 'calls of expr()'),
  ],
});
const AMP_CLOSE = PS[2].i - 1; // where "&" stops, on its ")"

export default [
  {
    id: 'recursion-reduce-and-trust',
    title: 'Trust the smaller circle: Josephus in one line',
    steps: [
      {
        kind: 'watch',
        title: 'Every k-th person leaves',
        lines: ['n people stand in a circle; every **k-th** one is removed until one is left.', 'Simulating it means walking round the circle many times.'],
        frames: [
          {
            say: 0,
            note: `e.g. n = ${JN}, k = ${JK}. Count ${JK} from person 0: person ${JC.out[0]} leaves.`,
            panels: [arr(Array.from({ length: JN }, (_, p) => p), { label: 'circle (0-based)', highlights: { [JC.out[0]]: 'bad' } }), vars({ removed: JC.out[0] })],
          },
          {
            say: 1,
            note: `Keep counting round: ${JC.out.slice(1).join(', ')} leave next. Person ${JC.survivor} survives.`,
            panels: [arr(Array.from({ length: JN }, (_, p) => p), { label: 'circle (0-based)', highlights: hl(JN, (p) => (p === JC.survivor ? 'done' : 'muted')) }), vars({ 'removal order': JC.out.join(', '), survivor: JC.survivor })],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'Trust J(n − 1), then re-label',
        lines: ['`J(n) = (J(n − 1) + k) % n`, with `J(1) = 0`.', 'Trust the answer for the smaller circle, then shift it by k into the big circle\'s numbering.'],
        frames: jFrames,
      },
      {
        kind: 'watch',
        title: 'The clue',
        lines: ['Clues: **a recurrence is given**, **"eliminate every k-th person"**, **reverse / palindrome on a shrinking range**, **"is n a power of …"**.', 'Ask: "if I had the answer for the smaller input, could I finish in O(1)?"'],
        frames: [
          {
            say: 1,
            note: 'One smaller call plus one step of work. Base case first, then check every call moves towards it.',
            panels: [table(['factorial', 'reverse', 'Josephus'], ['smaller input', 'one step'], [['n − 1', 'n · (n−1)!'], ['s without its last char', 'last char + reverse(rest)'], ['n − 1 people', '(J(n − 1) + k) % n']], 'reduce by one')],
          },
          {
            say: 0,
            note: 'Depth is n. JS allows about 10,000 nested calls: for n = 10^5 write the same recurrence as a loop.',
            panels: [vars({ calls: 'n', depth: 'n', 'n = 10^5': 'RangeError → loop' })],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: one more person',
        lines: [`Same game, k = ${JK}, now with ${JN + 1} people.`, `Trust the smaller call: J(${JN}) = ${josephus(JN, JK)}.`],
        panels: [stk([`J(${JN + 1})`, `J(${JN}) → ${josephus(JN, JK)}`]), vars({ n: JN + 1, k: JK, [`J(${JN})`]: josephus(JN, JK) })],
        task: {
          type: 'choose',
          question: `What does J(${JN + 1}) return?`,
          options: [
            { text: String(josephus(JN, JK)), why: 'That is the smaller circle\'s index. It must be re-labelled into the bigger circle\'s numbering.' },
            { text: String(josephus(JN, JK) + 1), why: 'Shifting by 1 is right only when k = 1. Shift by k.' },
            { text: String(JTURN) },
            { text: String((josephus(JN, JK) + JK) % JK), why: 'That reduces modulo k. The answer is an index in 0..n−1 of the current circle: modulo n.' },
          ],
          answer: 2,
        },
        solved: `(J(${JN}) + k) % ${JN + 1} = (${josephus(JN, JK)} + ${JK}) % ${JN + 1} = ${JTURN}. Trust the smaller answer; never trace down to J(1).`,
      },
    ],
  },

  {
    id: 'recursion-halving',
    title: 'Square the half: x^n in about log n calls',
    steps: [
      {
        kind: 'watch',
        title: 'n multiplications is too many',
        lines: ['Naive: `x^n = x · x^(n − 1)` makes about **n** calls.', 'For n = 2^31 that is two billion multiplications.'],
        frames: [
          {
            say: 0,
            note: `e.g. 3^9 the naive way: 3^9 → 3^8 → … → 3^0. ${PN + 1} calls; the count grows with n.`,
            panels: [stk(Array.from({ length: PN + 1 }, (_, d) => `x^${PN - d}`), 'naive call stack')],
          },
          {
            say: 1,
            note: `Halving: 9 → 4 → 2 → 1 → 0 is ${POW.nodes.length} calls. For n = 2^31, 33 calls instead of 2 billion.`,
            panels: [table(['n = 9', 'n = 2^31'], ['x · x^(n − 1)', 'halving'], [[`${PN + 1} calls`, `${POW.nodes.length} calls`], ['≈ 2 billion', '33 calls']], 'calls')],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'Halve going down, square coming back',
        lines: ['`half = power(x, Math.floor(n / 2))`: compute it **once**.', 'Even n: `half * half`. Odd n: `half * half * x`.', '`n === 0` returns 1: the base case.'],
        frames: [
          {
            say: 0,
            note: 'Winding: each call halves n (rounded down) and waits. The stack grows one frame per halving.',
            panels: [stk(openAt(POW, powDeep).map((l) => l.replace('p', 'power'))), vars({ x: PX, n: '9 → 4 → 2 → 1 → 0' })],
          },
          ...powRet,
        ],
      },
      {
        kind: 'watch',
        title: 'The trap: the half computed twice',
        lines: ['`power(x, n/2) * power(x, n/2)` makes **two** calls per level.', 'log n levels that double: 2^(log n) = **n** calls. Back to O(n).'],
        frames: [
          {
            say: 0,
            note: `e.g. n = 4 with two calls: ${TW.nodes.length} calls. p2 runs ${count(TW, 'p2')} times, p1 ${count(TW, 'p1')} times, p0 ${count(TW, 'p0')} times.`,
            panels: [treeAt(TW, last(TW), 'two calls per level (pn = power(x, n))', { bad: ['p2', 'p1', 'p0'] })],
          },
          {
            say: 1,
            note: `Store it in half: 4 → 2 → 1 → 0, one call per level: ${ON.nodes.length} calls. O(log n) time and stack.`,
            panels: [treeAt(ON, last(ON), 'half computed once (pn = power(x, n))')],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'The clue',
        lines: ['Clues: **"x raised to the power n"**, **n up to 2^31 or 10^15**, **"return the answer modulo 10^9 + 7"**, **each row/level doubles the previous one**.'],
        frames: [
          {
            say: 0,
            note: 'Huge n means halving. Products past 2^53 need BigInt; n >> 1 breaks above 2^31.',
            panels: [vars({ 'n = 2^31': '33 calls', 'a · b ≈ 10^18': '> 2^53 → BigInt', 'n >> 1': '32-bit → Math.floor(n / 2)' })],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: a huge exponent',
        lines: ['e.g. `power(x, 10^15)` with the half computed once.'],
        panels: [stk(['power(x, 10^15)', 'power(x, 5·10^14)', '…', 'power(x, 1)', 'power(x, 0)'], 'call stack at the deepest point')],
        task: {
          type: 'choose',
          question: 'About how many calls does it make?',
          options: [
            { text: 'About 50' },
            { text: 'About 10^15', why: 'That is the naive x · x^(n − 1): one call per multiplication. Here n halves each call.' },
            { text: 'About 15, one per digit', why: 'Dividing by 10 would give one call per digit. Halving divides by 2: log₂ 10^15, not log₁₀.' },
            { text: 'About 3 · 10^7, the square root', why: 'Nothing takes a square root here. Each call halves n.' },
          ],
          answer: 0,
        },
        solved: 'n halves every call: log₂(10^15) ≈ 50 levels, one call per level because the half is computed once.',
      },
    ],
  },

  {
    id: 'recursion-divide-conquer',
    title: 'Pick the last operator: every grouping, left × right',
    steps: [
      {
        kind: 'watch',
        title: 'One expression, several answers',
        lines: ['"Return **all possible results** from adding parentheses."', 'Whichever operator runs **last** splits the expression into two independent sides.'],
        frames: [
          {
            say: 0,
            note: `e.g. "8−4−2". Two groupings give two values: ${diffWays('8-4-2').join(' and ')}.`,
            panels: [table(['8 − (4 − 2)', '(8 − 4) − 2'], ['last operator', 'value'], [['first −', String(8 - (4 - 2))], ['second −', String(8 - 4 - 2)]], 'groupings')],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'Split at each operator, trust both sides',
        lines: ['For each operator: `left = all(before it)`, `right = all(after it)`.', 'No operator left: the base case returns `[Number(expr)]`.', 'Combine **every** left value with **every** right value.'],
        frames: [
          dcFrame(evAt(DC, 'ret', '8'), 1, 'Split at the first −. Left "8" has no operator: base case → [8].', { split: 'first −', left: '[8]' }),
          dcFrame(evAt(DC, 'ret', '4-2'), 0, `Right "4−2" splits at its own −: [4] and [2] → [${diffWays('4-2')}]. 8 − 2 = 6 goes into out.`, { split: 'first −', left: '[8]', right: show(diffWays('4-2')), out: '[6]' }),
          dcFrame(evAt(DC, 'ret', '8-4'), 0, `Split at the second −. Left "8−4" returns [${diffWays('8-4')}]; right will be "2".`, { split: 'second −', left: show(diffWays('8-4')), out: '[6]' }),
          dcFrame(last(DC), 2, `Right "2" → [2]. 4 − 2 = 2. out = ${show(DC.value)}: one value per grouping.`, { split: 'second −', left: '[4]', right: '[2]', out: show(DC.value) }),
        ],
      },
      {
        kind: 'watch',
        title: 'Lists cross-multiply',
        lines: ['A side can return several values; the split adds **|left| × |right|** results.', 'Do not deduplicate: every grouping counts.'],
        frames: [
          {
            say: 0,
            note: `e.g. "8−4−2−1": ${E4S.map((s) => `${s.left.length}×${s.right.length}`).join(' + ')} = ${E4ALL.length} results, and 5 appears twice.`,
            panels: [
              table(E4S.map((s) => `${sym(E4.slice(0, s.at))}  ${sym(s.op)}  ${sym(E4.slice(s.at + 1))}`), ['left', 'right', 'adds'], E4S.map((s) => [show(s.left), show(s.right), show(s.left.flatMap((a) => s.right.map((b) => apply(s.op, a, b))))]), 'splits'),
              vars({ out: show(E4ALL) }),
            ],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'The clue',
        lines: ['Clues: **"all possible ways to add parentheses"**, **"all structurally unique trees"**, **"for each operator, split"**, **answer is a list of all outcomes**.'],
        frames: [
          {
            say: 0,
            note: 'Outputs can be exponential, so inputs are small. Need one optimal value with repeats? Interval DP instead.',
            panels: [table(['divide', 'conquer', 'combine'], ['step'], [['pick a split: each operator'], ['solve left and right (leap of faith)'], ['every left × every right']])],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: one split of a longer expression',
        lines: [`e.g. "${sym(TURN_E)}", the split at "×".`, `Left "${sym(TURN_E.slice(0, TURN_S.at))}" returns ${show(TURN_S.left)}; right "${sym(TURN_E.slice(TURN_S.at + 1))}" returns ${show(TURN_S.right)}.`],
        panels: [arr(TURN_S.left, { label: 'left results' }), arr(TURN_S.right, { label: 'right results' })],
        task: {
          type: 'choose',
          question: 'What does this split add to `out`?',
          options: [
            { text: show(TURN_OUT) },
            { text: show([...new Set(TURN_OUT)]), why: 'Duplicates stay: two different groupings both give 0, and the problem wants every grouping.' },
            { text: show(TURN_S.left.map((a, k) => a * TURN_S.right[k])), why: 'That pairs values by position. Every left value must meet every right value.' },
            { text: show([...TURN_S.left, ...TURN_S.right]), why: 'Those are the two sides\' values. The split must combine them with ×.' },
          ],
          answer: 0,
        },
        solved: `2 × 2 = 4 values: ${show(TURN_OUT)}. Cross every left with every right, and keep duplicates.`,
      },
    ],
  },

  {
    id: 'recursion-game-minimax',
    title: 'Score the difference: one function plays both sides',
    steps: [
      {
        kind: 'watch',
        title: 'Greedy hands over the big number',
        lines: ['Players take turns taking a number from **either end**; both play optimally.', 'Greedy "take the bigger end" can open the way to a big number for the opponent.'],
        frames: [
          {
            say: 1,
            note: `e.g. [${GAME.join(', ')}]. Greedy player 1: ${GAME[0]} > ${GAME.at(-1)}, take ${GAME[greedy[0].idx]}.`,
            panels: [arr(GAME, { label: 'nums', highlights: { [greedy[0].idx]: 'active' } }), vars({ 'player 1': GAME[greedy[0].idx], 'player 2': 0 })],
          },
          {
            say: 1,
            note: `Player 2 grabs ${GAME[greedy[1].idx]}. Final: ${greedyScore(0).join(' + ')} = ${sum(greedyScore(0))} vs ${greedyScore(1).join(' + ')} = ${sum(greedyScore(1))}. Greedy loses.`,
            panels: [arr(GAME, { label: 'nums', highlights: hl(GAME.length, (k) => (greedy.find((m) => m.idx === k).who === 0 ? 'done' : 'bad')) }), vars({ 'player 1': sum(greedyScore(0)), 'player 2': sum(greedyScore(1)) })],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'diff(i, j): my total minus theirs',
        lines: ['`diff(i, i) = nums[i]`: one number left, take it.', 'Take left: `nums[i] − diff(i + 1, j)`. Take right: `nums[j] − diff(i, j − 1)`.', 'Subtract: after my move the opponent is "the player to move". Keep the max.'],
        frames: [
          gmFrame('3,3 deep', 0, `Winding: take left, take left, take left. diff(3,3) = ${GAME[3]}: one number left.`),
          gmFrame('2,3', 1, `${why(2, 3)}.`),
          gmFrame('1,3', 1, `${why(1, 3)}. Taking 9 leaves the opponent only diff(2,3).`),
          gmFrame('0,2', 2, `${why(0, 2)}.`),
          gmFrame('0,3', 2, `${why(0, 3)}. Take the ${GAME[3]}, the smaller end, and win by ${D(0, 3)}.`),
        ],
      },
      {
        kind: 'watch',
        title: 'The clue',
        lines: ['Clues: **"play optimally"**, **"player 1 and player 2 take turns"**, **"can the first player win"**, **"from either end of the array"**.', 'Player 1 wins (ties count) iff `diff(0, n − 1) >= 0`.'],
        frames: [
          {
            say: 0,
            note: `${GM.nodes.length} calls, but only ${(GAME.length * (GAME.length + 1)) / 2} distinct (i, j). diff(1,2) already runs twice.`,
            panels: [treeAt(GM, last(GM), GM_TREE, { bad: ['1,2'] })],
          },
          {
            say: 1,
            note: 'Plain: two calls per state, depth n → O(2ⁿ), fine for n ≤ 20. Memoize (i, j) → O(n²).',
            panels: [vars({ plain: 'O(2ⁿ), n ≤ 20', memoized: 'O(n²) states', 'player 1 wins': `diff = ${D(0, 3)} >= 0` })],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: finish the root',
        lines: [`e.g. nums = [${TG.join(', ')}].`, `The smaller calls already returned: diff(1,2) = ${TD(1, 2)}, diff(0,1) = ${TD(0, 1)}.`],
        panels: [arr(TG, { label: 'nums', pointers: [ptr(0, 'i'), ptr(2, 'j', 'b')] }), vars({ 'diff(1,2)': TD(1, 2), 'diff(0,1)': TD(0, 1) })],
        task: {
          type: 'choose',
          question: 'What is diff(0, 2)?',
          options: [
            { text: String(TD(0, 2)) },
            { text: String(TG[0] + TD(1, 2)), why: 'diff(1,2) is the opponent\'s best from their side. It counts against you: subtract it.' },
            { text: String(Math.min(TG[0] - TD(1, 2), TG[2] - TD(0, 1))), why: 'That is the worse move. The player to move keeps the larger of the two.' },
            { text: String(sum(TG)), why: 'That is the total of the array, not a difference between the two players.' },
          ],
          answer: 0,
        },
        solved: `max(${TG[0]} − ${TD(1, 2)}, ${TG[2]} − ${TD(0, 1)}) = ${TD(0, 2)} ≥ 0: player 1 wins. Subtract the opponent's best, keep the max.`,
      },
    ],
  },

  {
    id: 'recursion-descent-parsing',
    title: 'One call per nesting level: the stack remembers the outside',
    steps: [
      {
        kind: 'watch',
        title: 'Nesting of unknown depth',
        lines: ['expr = `"!(expr)"` | `"&(expr,expr,…)"` | `"|(expr,…)"` | `"t"` | `"f"`.', 'Depth is unknown in advance, so fixed loops cannot follow it.'],
        frames: [
          {
            say: 0,
            note: `e.g. "${SRC}": expressions inside an expression. Here 2 levels deep; in general any depth.`,
            panels: [arr(CH, { label: 's', highlights: hl(CH.length, (x) => ('|&!'.includes(CH[x]) ? 'active' : '')) })],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'A shared cursor, one call per expression',
        lines: ['`const c = s[i++]`: read an atom or an operator.', '`t` / `f`: return the value directly.', 'Otherwise skip `(`, call `expr()` for each part until `)`, then skip `)` and return `apply(c, parts)`.'],
        frames: [
          psFrame(0, 2),
          psFrame(1, 2),
          psFrame(2, 1, `t and f are atoms: two short calls return them. "&" stops at ")", skips it, returns f. i = ${PS[2].i}.`),
          psFrame(3, 2, `The root skips "," and calls expr() again: "!" opens a new level. i = ${PS[3].i}.`),
          psFrame(4, 2),
          psFrame(5, 2, `Root parts [f, t] end at ")": return |(f,t) = t. Every level is closed.`),
        ],
      },
      {
        kind: 'watch',
        title: 'The clue',
        lines: ['Clues: **"parse", "evaluate the expression"**, **nested parentheses of arbitrary depth**, **"special / balanced / valid" strings defined recursively**.'],
        frames: [
          {
            say: 0,
            note: 'One closure cursor i, never s.slice per call (O(n²) copying). ~10^5 deep → explicit stack instead.',
            panels: [table(['shared cursor i', 's.slice per call', 'nesting ~10^5 deep'], ['result'], [['each char read once'], ['O(n²) copying'], ['RangeError → explicit stack']])],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: forget one i++',
        lines: [`The "&" call has read t and f and stopped at ")" (i = ${AMP_CLOSE}).`, 'Suppose it returns **without** the `i++` that skips `)`.'],
        panels: [arr(CH, { label: 's', pointers: [ptr(AMP_CLOSE, 'i')], highlights: hl(CH.length, (x) => (x < AMP_CLOSE ? 'visited' : x === AMP_CLOSE ? 'bad' : '')) }), stk([PS[2].levels[0]], 'open expr() calls')],
        task: {
          type: 'choose',
          question: 'What happens at the root level next?',
          options: [
            { text: 'It sees that ")", ends its while loop early and returns; "!(f)" is never parsed' },
            { text: 'It sees "," and carries on normally', why: 'Only if the inner level consumed its own ")". The cursor is still on it.' },
            { text: 'A RangeError: the recursion never stops', why: 'Depth follows the nesting and stays 2. The cursor just gets out of sync.' },
            { text: 'Nothing changes: the root skips ")" for it', why: 'The root\'s while loop stops at the first ")" it sees. It cannot tell whose ")" it is.' },
          ],
          answer: 0,
        },
        solved: 'Each level must consume its own ")". Leave it and the parent level sees it as its own end: the cursor is out of sync.',
      },
    ],
  },
];
