const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const stack = (values, opts = {}) => ({ kind: 'stack', values, ...opts });
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

export const stackParentheses = {
  title: 'Stack: valid parentheses',
  description: 'Push openers; on a closer, the top of the stack must be its matching opener.',
  defaultInput: { s: '{[()()]}(' },
  fields: [{ key: 's', type: 'string', label: 's' }],
  generate({ s }) {
    const chars = [...s];
    const pairs = { ')': '(', ']': '[', '}': '{' };
    const st = [];
    const frames = [];
    let closers = 0;
    for (let i = 0; i < chars.length; i++) {
      const c = chars[i];
      let p = null;
      if (pairs[c]) {
        const pOpts = ['Pop — it matches the top', 'Push it onto the stack', 'Invalid — it does not match'];
        const ok = st[st.length - 1] === pairs[c];
        p = pick(`Next char is the closer '${c}'; the stack top is ${st.length ? `'${st[st.length - 1]}'` : 'empty'}. What happens?`, pOpts[ok ? 0 : 2], [pOpts[1], pOpts[ok ? 2 : 0]], closers++);
      }
      if (!pairs[c]) {
        st.push(c);
        frames.push({ note: `'${c}' is an opener → push it. It must be closed later, and the most recent opener must close first (LIFO).`, panels: [arr(chars, { highlights: { [i]: 'active' } }), stack([...st], { label: 'stack' })] });
      } else if (st[st.length - 1] === pairs[c]) {
        st.pop();
        frames.push({ note: `'${c}' matches the top '${pairs[c]}' → pop.`, panels: [arr(chars, { highlights: { [i]: 'done' } }), stack([...st], { label: 'stack' })] });
      } else {
        frames.push({ note: `'${c}' does not match the top (${st.length ? `'${st[st.length - 1]}'` : 'empty stack'}) → invalid.`, panels: [arr(chars, { highlights: { [i]: 'bad' } }), stack([...st], { label: 'stack' })] });
        attach(frames, p);
        return frames;
      }
      attach(frames, p);
    }
    frames.push({ note: st.length ? `End of string but the stack still holds ${st.length} unclosed opener(s) → invalid.` : 'End of string and the stack is empty → valid!', panels: [arr(chars, {}), stack([...st], { label: 'stack' })] });
    return frames;
  },
};

export const monotonicStack = {
  title: 'Monotonic stack: next greater element',
  description: 'Keep indices whose next-greater is still unknown; values on the stack decrease from bottom to top.',
  defaultInput: { nums: [2, 1, 2, 4, 3, 1, 5] },
  fields: [{ key: 'nums', type: 'numbers', label: 'nums' }],
  generate({ nums }) {
    const res = new Array(nums.length).fill(-1);
    const st = [];
    const frames = [];
    let popAsks = 0;
    let pushAsked = false;
    const mOpts = (x, y, j) => [`Pop index ${j} — ${x} is its next greater`, `Push ${x} on top (no pop)`, `Replace ${y} with ${x}`];
    for (let i = 0; i < nums.length; i++) {
      while (st.length && nums[st[st.length - 1]] < nums[i]) {
        const j = st.pop();
        const o = mOpts(nums[i], nums[j], j);
        const p = popAsks < 3 ? pick(`${nums[i]} arrives; the stack top is ${nums[j]} (index ${j}). What happens?`, o[0], [o[1], o[2]], popAsks + 1) : null;
        popAsks++;
        res[j] = nums[i];
        frames.push({
          note: `${nums[i]} > ${nums[j]} (index ${j} on top) → ${nums[i]} is the next greater element of index ${j}. Pop it.`,
          panels: [arr(nums, { highlights: { [i]: 'active', [j]: 'done' } }), stack(st.map((k) => `${nums[k]} (i=${k})`), { label: 'stack (waiting indices)' }), arr([...res], { label: 'answer' })],
        });
        attach(frames, p);
      }
      let pp = null;
      if (!pushAsked && st.length && frames.length && !frames[frames.length - 1].note.includes('Pop it')) {
        const j = st[st.length - 1];
        const o = mOpts(nums[i], nums[j], j);
        pp = pick(`${nums[i]} arrives; the stack top is ${nums[j]} (index ${j}). What happens?`, o[1], [o[0], o[2]], 0);
        pushAsked = true;
      }
      st.push(i);
      frames.push({
        note: `Push index ${i} (${nums[i]}). It waits for something bigger. Stack values stay decreasing.`,
        panels: [arr(nums, { highlights: { [i]: 'active' } }), stack(st.map((k) => `${nums[k]} (i=${k})`), { label: 'stack (waiting indices)' }), arr([...res], { label: 'answer' })],
      });
      attach(frames, pp);
    }
    frames.push({ note: 'Indices left on the stack never found a greater element → answer −1. Every index is pushed and popped at most once: O(n).', panels: [arr(nums, {}), stack(st.map((k) => `${nums[k]} (i=${k})`), { label: 'stack' }), arr(res, { label: 'answer' })] });
    return frames;
  },
};

export const monotonicDeque = {
  title: 'Monotonic deque: sliding window maximum',
  description: 'Deque holds indices with decreasing values; the front is always the window maximum.',
  defaultInput: { nums: [1, 3, -1, -3, 5, 3, 6, 7], k: 3 },
  fields: [
    { key: 'nums', type: 'numbers', label: 'nums' },
    { key: 'k', type: 'number', label: 'k' },
  ],
  generate({ nums, k }) {
    k = Math.max(1, Math.min(k, nums.length));
    const dq = [];
    const out = [];
    const frames = [];
    const dqPanel = () => ({ kind: 'queue', label: 'deque (front → back)', values: dq.map((i) => `${nums[i]} (i=${i})`) });
    let popAsks = 0;
    let keepAsked = false;
    const dOpts = (y) => [`Pop ${y} from the back`, `Keep ${y}`];
    for (let i = 0; i < nums.length; i++) {
      const L = Math.max(0, i - k + 1);
      if (dq.length && dq[0] <= i - k) {
        const j = dq.shift();
        frames.push({ note: `Index ${j} slid out of the window → remove it from the front.`, panels: [arr(nums, { range: [L, i], highlights: { [j]: 'muted' } }), dqPanel(), arr([...out], { label: 'maxima' })] });
      }
      while (dq.length && nums[dq[dq.length - 1]] <= nums[i]) {
        const j = dq.pop();
        const o = dOpts(nums[j]);
        const p = popAsks < 3 ? pick(`${nums[i]} arrives; the deque back is ${nums[j]} (index ${j}). Keep ${nums[j]} or pop it?`, o[0], [o[1]], popAsks) : null;
        popAsks++;
        frames.push({ note: `${nums[i]} ≥ ${nums[j]}: index ${j} can never be a maximum again (${nums[i]} is bigger AND stays longer) → pop from back.`, panels: [arr(nums, { range: [L, i], highlights: { [i]: 'active', [j]: 'bad' } }), dqPanel(), arr([...out], { label: 'maxima' })] });
        attach(frames, p);
      }
      let kp = null;
      let keepNote = '';
      if (!keepAsked && dq.length && frames.length) {
        const j = dq[dq.length - 1];
        const o = dOpts(nums[j]);
        kp = pick(`${nums[i]} arrives; the deque back is ${nums[j]} (index ${j}). Keep ${nums[j]} or pop it?`, o[1], [o[0]], 1);
        keepNote = `${nums[j]} > ${nums[i]}, so ${nums[j]} stays (it is bigger and could still be a max). `;
        keepAsked = true;
      }
      dq.push(i);
      let note = `${keepNote}Push index ${i} (${nums[i]}) to the back.`;
      if (i >= k - 1) {
        out.push(nums[dq[0]]);
        note += ` Window [${L}, ${i}] is full → max is the front: ${nums[dq[0]]}.`;
      }
      frames.push({ note, panels: [arr(nums, { range: [L, i], highlights: { [i]: 'active', [dq[0]]: 'done' } }), dqPanel(), arr([...out], { label: 'maxima' })] });
      attach(frames, kp);
    }
    frames.push({ note: `Result: [${out.join(', ')}]. Each index enters and leaves the deque once → O(n).`, panels: [arr(nums, {}), dqPanel(), arr(out, { label: 'maxima' })] });
    return frames;
  },
};

export const linkedListReverse = {
  title: 'Reverse a linked list in place',
  description: 'Three pointers: prev, curr, next. Flip one arrow per step.',
  defaultInput: { values: [1, 2, 3, 4, 5] },
  fields: [{ key: 'values', type: 'numbers', label: 'values' }],
  generate({ values }) {
    const n = values.length;
    const next = values.map((_, i) => (i + 1 < n ? i + 1 : null));
    const frames = [];
    let prev = null;
    let curr = n ? 0 : null;
    const ptrs = () => {
      const p = [];
      if (prev !== null) p.push({ index: prev, label: 'prev', color: 'a' });
      if (curr !== null) p.push({ index: curr, label: 'curr', color: 'b' });
      if (curr !== null && next[curr] !== null) p.push({ index: next[curr], label: 'next', color: 'c' });
      return p;
    };
    frames.push({ note: 'prev = null, curr = head. We will reverse one arrow at a time.', panels: [{ kind: 'list', values, next: [...next], pointers: ptrs(), nullLeft: prev === null }] });
    let step = 0;
    while (curr !== null) {
      const nxt = next[curr];
      step++;
      const lp = (step === 2 || step === 3) && prev !== null
        ? pick(`curr = ${values[curr]}, prev = ${values[prev]}, curr.next is ${nxt === null ? 'null' : values[nxt]}. Where should curr.next point now?`, `prev (${values[prev]})`, [`next (${nxt === null ? 'null' : values[nxt]}) — leave it`, 'null'], step)
        : null;
      next[curr] = prev;
      const hl = { [curr]: 'active' };
      frames.push({
        note: `Save next (${nxt === null ? 'null' : values[nxt]}), point ${values[curr]}.next → ${prev === null ? 'null' : values[prev]}.`,
        panels: [{ kind: 'list', values, next: [...next], pointers: [...(prev !== null ? [{ index: prev, label: 'prev', color: 'a' }] : []), { index: curr, label: 'curr', color: 'b' }, ...(nxt !== null ? [{ index: nxt, label: 'next', color: 'c' }] : [])], highlights: hl }],
      });
      attach(frames, lp);
      prev = curr;
      curr = nxt;
      frames.push({ note: 'Advance: prev = curr, curr = next.', panels: [{ kind: 'list', values, next: [...next], pointers: ptrs() }] });
    }
    frames.push({ note: `curr is null → prev (${prev === null ? 'null' : values[prev]}) is the new head. O(n) time, O(1) extra space.`, panels: [{ kind: 'list', values, next: [...next], pointers: prev !== null ? [{ index: prev, label: 'head', color: 'a' }] : [] }] });
    if (n >= 2) attach(frames, pick('curr is now null. Which node is the head of the reversed list?', `prev (${values[n - 1]})`, [`the old head (${values[0]})`, 'null'], 2));
    return frames;
  },
};

export const fastSlowPointers = {
  title: 'Fast & slow pointers: find the middle',
  description: 'Slow moves 1 step, fast moves 2. When fast reaches the end, slow is in the middle.',
  defaultInput: { values: [1, 2, 3, 4, 5, 6, 7] },
  fields: [{ key: 'values', type: 'numbers', label: 'values' }],
  generate({ values }) {
    const n = values.length;
    const next = values.map((_, i) => (i + 1 < n ? i + 1 : null));
    const frames = [];
    let slow = 0;
    let fast = 0;
    const ptrs = () => [
      { index: slow, label: 'slow', color: 'a' },
      ...(fast !== null && fast < n ? [{ index: fast, label: 'fast', color: 'b' }] : []),
    ];
    if (!n) return [{ note: 'Empty list.', panels: [] }];
    frames.push({ note: 'Both start at the head.', panels: [{ kind: 'list', values, next, pointers: ptrs() }] });
    const at = (i) => (i < n ? `${values[i]} (index ${i})` : 'past the end');
    let moves = 0;
    while (fast !== null && fast < n && next[fast] !== null) {
      const f0 = fast;
      const fp = moves < 2 ? pick(`slow is at ${at(slow)}, fast at ${at(f0)}. After the next move, where is fast?`, at(f0 + 2), [at(f0 + 1), at(f0 + 3), at(f0 + 4)], moves + 1) : null;
      moves++;
      slow = next[slow];
      fast = next[next[fast]] ?? null;
      frames.push({ note: `slow → 1 step (${values[slow]}), fast → 2 steps (${fast === null ? 'past the end' : values[fast]}). Fast covers twice the distance.`, panels: [{ kind: 'list', values, next, pointers: ptrs(), highlights: { [slow]: 'active' } }] });
      attach(frames, fp);
    }
    frames.push({ note: `fast can't move 2 more steps → slow (${values[slow]}) is the middle. For even length it's the second middle.`, panels: [{ kind: 'list', values, next, pointers: ptrs(), highlights: { [slow]: 'done' } }] });
    if (n >= 3) attach(frames, pick(`fast is at ${fast === null ? 'past the end' : at(fast)} and cannot move 2 more. Which node is the middle?`, at(slow), [at(slow - 1), at(slow + 1), at(fast === null ? n - 1 : fast)], 0));
    return frames;
  },
};
