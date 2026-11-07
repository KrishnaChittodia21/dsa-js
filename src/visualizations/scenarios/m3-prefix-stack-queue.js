// m3-prefix-stack-queue: prefix sum + hash map, prefix sum modulo k, histogram (previous/next smaller),
// contribution technique (sum of subarray minimums), ticket-line queue simulation, monotonic deque over
// prefix sums (shortest subarray with sum ≥ k) and monotonic deque DP (Jump Game VI).
// Each generate(input) returns frames: { note, panels: [...], predict? } — see scripts/VIZ_BRIEF.md.
const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const stack = (values, opts = {}) => ({ kind: 'stack', values, ...opts });
const queue = (values, label) => ({ kind: 'queue', values, label });
const table = (cells, states, rowLabels, colLabels, label) => ({ kind: 'table', cells, states, rowLabels, colLabels, label });
const ask = (question, options, answer, explain) => ({ question, options, answer, explain });
// Distinct options with the correct one placed at index pos % n; null if fewer than 2 distinct options.
const pick = (question, correct, wrong, pos = 0, explain) => {
  const c = String(correct);
  const w = [...new Set(wrong.filter((o) => o !== null && o !== undefined).map(String))].filter((o) => o !== c).slice(0, 3);
  if (!w.length) return null;
  const at = pos % (w.length + 1);
  return ask(question, [...w.slice(0, at), c, ...w.slice(at)], at, explain);
};
const attach = (frames, p) => {
  if (p && frames.length > 1) frames[frames.length - 1].predict = p;
};
const nums = (xs, max) => (Array.isArray(xs) ? xs : []).filter((x) => typeof x === 'number' && Number.isFinite(x)).slice(0, max);
const clampInt = (v, lo, hi, d) => {
  const x = Math.floor(Number(v));
  return Number.isFinite(x) ? Math.max(lo, Math.min(hi, x)) : d;
};

/* ------------------------------------------------------------------ prefix sum + hash map */

export const prefixSumHashmap = {
  problem: { name: 'Subarray Sum Equals K', statement: 'Count the contiguous subarrays whose sum is exactly k.', example: 'nums = [1, 2, 1, -1, 2, 1], k = 3 → 5', exampleOutput: 5, questionId: 'subarray-sum-equals-k' },
  title: 'Prefix sum + hash map: subarrays with sum k',
  description: 'Scan once keeping a running prefix sum; every earlier prefix equal to prefix − k starts a subarray that sums to k, so a map of prefix counts gives the answer in O(n). Clamped to 10 numbers.',
  defaultInput: { nums: [1, 2, 1, -1, 2, 1], k: 3 },
  fields: [
    { key: 'nums', type: 'numbers', label: 'nums' },
    { key: 'k', type: 'number', label: 'k' },
  ],
  testInputs: [{ nums: [], k: 3 }, { nums: [3], k: 3 }, { nums: [5], k: 3 }, { nums: [0, 0, 0], k: 0 }, { nums: [1, 1, 1], k: 2 }, { nums: [-1, -1, 1], k: 0 }, { nums: [2, 2, 2, 2], k: 4 }],
  generate(input) {
    const a = nums(input.nums, 10);
    const k = Number.isFinite(Number(input.k)) ? Number(input.k) : 0;
    const frames = [];
    const seen = new Map([[0, 1]]);
    const lastIdx = new Map([[0, 0]]); // prefix value → latest prefix index (prefix index p = sum of a[0..p-1])
    let prefix = 0;
    let count = 0;
    let asks = 0;
    const mapPanel = (hlKey, hlState) => {
      const keys = [...seen.keys()];
      return table(keys.map((key) => [seen.get(key)]), keys.map((key) => [key === hlKey ? hlState : null]), keys.map(String), ['times seen'], 'seen: prefix → count');
    };
    frames.push({
      note: `seen starts as {0: 1}: the empty prefix (before any element) has sum 0. Without it, subarrays that start at index 0 would never be counted. k = ${k}.`,
      panels: [arr(a), mapPanel(0, 'active'), vars({ prefix, count })],
    });
    if (!a.length) {
      frames.push({ note: 'No numbers → no subarrays. count = 0.', panels: [arr(a), mapPanel(null), vars({ prefix, count })] });
      frames.at(-1).result = 0;
      return frames;
    }
    for (let j = 0; j < a.length; j++) {
      prefix += a[j];
      const need = prefix - k;
      const got = seen.get(need) ?? 0;
      let p = null;
      if (j % 2 === 1 && asks < 4) {
        p = pick(`prefix becomes ${prefix}. We look up prefix − k = ${need} in seen. By how much does count grow?`, `+${got}`, [`+${got + 1}`, got > 0 ? `+${got - 1}` : '+2', `+${prefix}`], asks + 1);
        asks++;
      }
      count += got;
      const start = got ? lastIdx.get(need) : null;
      frames.push({
        note: got
          ? `prefix = ${prefix}. seen holds ${need} (= prefix − k) ${got} time(s): each one is a different start, so ${got} subarray(s) ending at index ${j} sum to ${k} — e.g. [${start}..${j}]. count = ${count}.`
          : `prefix = ${prefix}. Is ${need} (= prefix − k) in seen? No → no subarray ending at index ${j} sums to ${k}. count stays ${count}.`,
        panels: [arr(a, { highlights: { [j]: 'active' }, ...(got ? { range: [start, j] } : {}) }), mapPanel(need, got ? 'done' : 'bad'), vars({ prefix, 'prefix − k': need, count })],
      });
      attach(frames, p);
      seen.set(prefix, (seen.get(prefix) ?? 0) + 1);
      lastIdx.set(prefix, j + 1);
      frames.push({
        note: `Only now record prefix ${prefix} in seen (count ${seen.get(prefix)}). Inserting before the lookup would let a subarray end where it starts (wrong when k = 0).`,
        panels: [arr(a, { highlights: { [j]: 'visited' } }), mapPanel(prefix, 'active'), vars({ prefix, count })],
      });
    }
    frames.push({
      note: `Done: ${count} subarray(s) sum to ${k}. One pass with O(1) map work per element → O(n) time, O(n) space. Works with negatives, unlike a sliding window.`,
      panels: [arr(a), mapPanel(null), vars({ prefix, count })],
    });
    attach(frames, pick('The scan is over. What is the answer?', count, [count + 1, Math.max(0, count - 1), a.length], 2));
    frames.at(-1).result = count;
    return frames;
  },
};

/* ------------------------------------------------------------------ prefix sum modulo k */

export const prefixSumModulo = {
  problem: { name: 'Subarray Sums Divisible by K', statement: 'Count the contiguous subarrays whose sum is divisible by k.', example: 'nums = [4, 5, 0, -2, -3, 1], k = 5 → 7', exampleOutput: 7, questionId: 'subarray-sums-divisible-by-k' },
  title: 'Prefix sum mod k: divisible subarrays',
  description: 'Two prefixes with the same remainder mod k enclose a subarray whose sum is divisible by k. Count each remainder in an array of size k; negative remainders are normalised with ((x % k) + k) % k. Clamped to 10 numbers and 1 ≤ k ≤ 9.',
  defaultInput: { nums: [4, 5, 0, -2, -3, 1], k: 5 },
  fields: [
    { key: 'nums', type: 'numbers', label: 'nums' },
    { key: 'k', type: 'number', label: 'k' },
  ],
  testInputs: [{ nums: [], k: 5 }, { nums: [5], k: 5 }, { nums: [3], k: 5 }, { nums: [-1, -4], k: 5 }, { nums: [2, 2, 2], k: 1 }, { nums: [0, 0], k: 0 }, { nums: [1, -1, 1, -1], k: 2 }],
  generate(input) {
    const a = nums(input.nums, 10).map(Math.trunc);
    const k = clampInt(input.k, 1, 9, 5);
    const frames = [];
    const count = new Array(k).fill(0);
    count[0] = 1;
    let rem = 0;
    let total = 0;
    let asks = 0;
    const cnt = (hl) => arr([...count], { label: 'count[r] — index = remainder', highlights: hl });
    frames.push({
      note: `count[0] = 1: the empty prefix has remainder 0. A later prefix with remainder 0 then counts the subarray that starts at index 0. k = ${k}.`,
      panels: [arr(a), cnt({ 0: 'active' }), vars({ prefix: rem, total })],
    });
    if (!a.length) {
      frames.push({ note: 'No numbers → no subarrays. total = 0.', panels: [arr(a), cnt({}), vars({ prefix: rem, total })] });
      frames.at(-1).result = 0;
      return frames;
    }
    for (let j = 0; j < a.length; j++) {
      const raw = (rem + a[j]) % k;
      const next = ((raw % k) + k) % k;
      let p = null;
      if (raw < 0 && asks < 4) {
        p = pick(`prefix ${rem} + ${a[j]} = ${rem + a[j]}. JS gives ${rem + a[j]} % ${k} = ${raw}. Which bucket do we use?`, `count[${next}]`, [`count[${raw}]`, `count[${Math.abs(raw)}]`, 'count[0]'], asks + 1);
        asks++;
      }
      frames.push({
        note: raw < 0
          ? `(${rem} + ${a[j]}) % ${k} = ${raw} in JavaScript — negative! Add k and take % again: ((${raw}) + ${k}) % ${k} = ${next}. Equal residues must get the same key.`
          : `prefix = (${rem} + ${a[j]}) % ${k} = ${next}. Keeping only the remainder is enough: divisibility depends on nothing else.`,
        panels: [arr(a, { highlights: { [j]: 'active' } }), cnt({ [next]: 'active' }), vars({ prefix: next, total })],
      });
      attach(frames, p);
      rem = next;
      const got = count[rem];
      let q = null;
      if (j % 2 === 0 && asks < 4) {
        q = pick(`Remainder ${rem} has been seen count[${rem}] = ${got} time(s) before. By how much does total grow?`, `+${got}`, [`+${got + 1}`, got ? `+${got - 1}` : '+2', `+${rem}`], asks + 2);
        asks++;
      }
      total += got;
      count[rem]++;
      frames.push({
        note: got
          ? `${got} earlier prefix(es) share remainder ${rem}, so ${got} subarray(s) ending at index ${j} are divisible by ${k}. total = ${total}; then count[${rem}] becomes ${count[rem]}.`
          : `No earlier prefix has remainder ${rem} → nothing new. Record it: count[${rem}] = 1.`,
        panels: [arr(a, { highlights: { [j]: got ? 'done' : 'visited' } }), cnt({ [rem]: got ? 'done' : 'active' }), vars({ prefix: rem, total })],
      });
      attach(frames, q);
    }
    frames.push({
      note: `${total} subarray(s) have a sum divisible by ${k}. One pass, O(n) time, O(k) space for the remainder counts.`,
      panels: [arr(a), cnt({}), vars({ prefix: rem, total })],
    });
    attach(frames, pick('All numbers are scanned. How many subarrays are divisible by k?', total, [total + 1, Math.max(0, total - 1), a.length], 3));
    frames.at(-1).result = total;
    return frames;
  },
};

/* ------------------------------------------------------------------ monotonic stack: histogram */

export const histogramPrevSmaller = {
  problem: { name: 'Largest Rectangle in Histogram', statement: 'Find the area of the largest rectangle that fits inside the histogram bars.', example: '[2, 1, 5, 6, 2, 3] → 10', exampleOutput: 10, questionId: 'largest-rectangle-in-histogram' },
  title: 'Monotonic stack: largest rectangle in a histogram',
  description: 'An increasing stack of bar indices; when a bar is popped, the new top is its previous smaller bar and the current index is its next smaller bar, so its widest rectangle is known. A height-0 sentinel at the end flushes the stack. Clamped to 9 bars; negative heights become 0.',
  defaultInput: { heights: [2, 1, 5, 6, 2, 3] },
  fields: [{ key: 'heights', type: 'numbers', label: 'heights' }],
  testInputs: [{ heights: [] }, { heights: [4] }, { heights: [2, 2, 2] }, { heights: [1, 2, 3, 4] }, { heights: [4, 3, 2, 1] }, { heights: [0, 3, 0] }, { heights: [-2, 5] }],
  generate(input) {
    const h = nums(input.heights, 9).map((x) => Math.max(0, x));
    const n = h.length;
    const frames = [];
    const st = [];
    let best = 0;
    let bestRange = null;
    let asks = 0;
    const cells = [...h, '0*'];
    const stPanel = () => stack(st.map((i) => `${h[i]} (i=${i})`), { label: 'stack (heights increase ↑)' });
    const bars = (hl, range, i) => arr(cells, { label: 'heights (+ sentinel 0*)', highlights: { [n]: 'muted', ...hl }, ...(range ? { range } : {}), pointers: i === undefined ? [] : [{ index: i, label: 'i', color: 'a' }] });
    frames.push({
      note: 'The best rectangle is exactly as tall as its shortest bar. So try every bar as "the shortest": it stretches from just after its previous smaller bar to just before its next smaller bar.',
      panels: [bars({}), stPanel(), vars({ best })],
    });
    for (let i = 0; i <= n; i++) {
      const cur = i === n ? 0 : h[i];
      let first = true;
      while (st.length && h[st[st.length - 1]] >= cur) {
        const j = st[st.length - 1];
        let p = null;
        if (first && asks < 5 && asks % 2 === 0) {
          p = pick(`i = ${i}${i === n ? ' (sentinel 0)' : ''} with height ${cur}; the stack top is ${h[j]} (i=${j}). What happens?`, `Pop ${h[j]} — its next smaller bar is here`, [`Push ${cur} on top`, `Pop ${cur}`], asks);
          asks++;
        }
        st.pop();
        const left = st.length ? st[st.length - 1] : -1;
        const width = i - left - 1;
        const area = h[j] * width;
        let q = null;
        if (!p && asks < 5 && asks % 2 === 1) {
          q = pick(`Bar ${h[j]} (i=${j}) is popped at i = ${i}; the new top is ${left < 0 ? 'nothing (−1)' : `i=${left}`}. What width can it span?`, width, [width + 1, Math.max(0, width - 1) === width ? width + 2 : Math.max(0, width - 1), i - j], asks);
          asks++;
        }
        const better = area > best;
        if (better) {
          best = area;
          bestRange = [left + 1, i - 1];
        }
        frames.push({
          note: `${cur} ≤ ${h[j]}, so i = ${i} is the next smaller bar of i=${j}; the new top (${left < 0 ? 'none → −1' : `i=${left}`}) is its previous smaller. Width = ${i} − (${left}) − 1 = ${width}, area = ${h[j]} × ${width} = ${area}.${better ? ' New best!' : ''}`,
          panels: [bars({ [j]: 'done', [i]: 'active' }, width > 0 ? [left + 1, i - 1] : null, i), stPanel(), vars({ height: h[j], width, area, best })],
        });
        attach(frames, p || q);
        first = false;
      }
      if (i === n) break;
      st.push(i);
      frames.push({
        note: `Push i=${i} (${h[i]}). Everything below it on the stack is shorter, so heights still increase bottom → top; its right edge is not known yet.`,
        panels: [bars({ [i]: 'active' }, null, i), stPanel(), vars({ best })],
      });
    }
    frames.push({
      note: `The sentinel flushed every bar. Largest rectangle = ${best}. Each index is pushed and popped once → O(n) time, O(n) stack.`,
      panels: [bars({}, bestRange && bestRange[1] >= bestRange[0] ? bestRange : null), stPanel(), vars({ best })],
    });
    if (n) attach(frames, pick('Every bar has been measured. What is the largest area?', best, [Math.max(...h), best + 1, h.reduce((s, x) => s + x, 0) === best ? best + 2 : h.reduce((s, x) => s + x, 0)], 1));
    frames.at(-1).result = best;
    return frames;
  },
};

/* ------------------------------------------------------------------ monotonic stack: contribution */

export const subarrayMinContribution = {
  problem: { name: 'Sum of Subarray Minimums', statement: 'Add up the minimum of every contiguous subarray.', example: '[3, 1, 2, 4] → 17', exampleOutput: 17, questionId: 'sum-of-subarray-minimums' },
  title: 'Contribution technique: sum of subarray minimums',
  description: 'Instead of listing every subarray, count for each element how many subarrays have it as the minimum: (choices of left end) × (choices of right end). Single-pass version: when index j is popped by i, left = j − newTop and right = i − j. Clamped to 9 numbers.',
  defaultInput: { nums: [3, 1, 2, 4] },
  fields: [{ key: 'nums', type: 'numbers', label: 'nums' }],
  testInputs: [{ nums: [] }, { nums: [5] }, { nums: [2, 2, 2] }, { nums: [1, 2, 3] }, { nums: [3, 2, 1] }, { nums: [-1, 3, -2] }, { nums: [11, 81, 94, 43, 3] }],
  generate(input) {
    const a = nums(input.nums, 9);
    const n = a.length;
    const frames = [];
    const st = [];
    let total = 0;
    let asks = 0;
    const cells = [...a, '−∞'];
    const stPanel = () => stack(st.map((i) => `${a[i]} (i=${i})`), { label: 'stack (values increase ↑)' });
    const view = (hl, range, i) => arr(cells, { label: 'nums (+ sentinel −∞)', highlights: { [n]: 'muted', ...hl }, ...(range ? { range } : {}), pointers: i === undefined ? [] : [{ index: i, label: 'i', color: 'a' }] });
    frames.push({
      note: 'Group all subarrays by WHICH element is their minimum. Element j is the minimum of every subarray whose left end is after its previous smaller element and whose right end is before its next smaller-or-equal element.',
      panels: [view({}), stPanel(), vars({ total })],
    });
    for (let i = 0; i <= n; i++) {
      const cur = i === n ? -Infinity : a[i];
      while (st.length && a[st[st.length - 1]] >= cur) {
        const j = st.pop();
        const top = st.length ? st[st.length - 1] : -1;
        const left = j - top;
        const right = i - j;
        const contrib = a[j] * left * right;
        let p = null;
        if (asks < 4) {
          p = asks % 2 === 0
            ? pick(`i=${j} (value ${a[j]}) is popped at i = ${i}; the new top is ${top < 0 ? 'nothing (−1)' : `i=${top}`}. In how many subarrays is ${a[j]} the minimum?`, left * right, [left + right, left * right + 1, right], asks + 1)
            : pick(`Popping ${a[j]} (i=${j}) at i = ${i}: left choices = ${left}, right choices = ${right}. What does it add to the total?`, contrib, [a[j] * (left + right), a[j], contrib + a[j]], asks + 1);
          asks++;
        }
        total += contrib;
        frames.push({
          note: `${i === n ? 'The sentinel −∞' : `${a[i]} ≤ ${a[j]}`} pops i=${j}: right end can be i=${j}..${i - 1} (${right} choice(s)), left end i=${top + 1}..${j} (${left} choice(s)). ${a[j]} × ${left} × ${right} = ${contrib}; total = ${total}.`,
          panels: [view({ [j]: 'done', ...(i < n ? { [i]: 'active' } : {}) }, [top + 1, i - 1], i), stPanel(), vars({ left, right, contribution: contrib, total })],
        });
        attach(frames, p);
      }
      if (i === n) break;
      st.push(i);
      frames.push({
        note: `Push i=${i} (${a[i]}). Its previous strictly smaller element is the one below it; its right boundary is still unknown.`,
        panels: [view({ [i]: 'active' }, null, i), stPanel(), vars({ total })],
      });
    }
    frames.push({
      note: `Sum of subarray minimums = ${total}. Strict on the left, ≤ on the right, so equal values are never counted twice. O(n) instead of O(n²). (The LeetCode version takes the answer mod 10^9 + 7.)`,
      panels: [view({}), stPanel(), vars({ total })],
    });
    if (n > 1) attach(frames, pick('Every element has been popped. What is the sum of all subarray minimums?', total, [a.reduce((s, x) => s + x, 0), total + Math.min(...a), total - 1], 0));
    frames.at(-1).result = total;
    return frames;
  },
};

/* ------------------------------------------------------------------ queue simulation: ticket line */

export const ticketQueueSimulation = {
  problem: { name: 'Time Needed to Buy Tickets', statement: 'People queue for tickets; each turn the front person buys one (1 second) and rejoins the back if they need more. When does person k finish?', example: 'tickets = [2, 3, 2, 1], k = 1 → 8', exampleOutput: 8, questionId: 'time-needed-to-buy-tickets' },
  title: 'Queue simulation: the ticket line',
  description: 'Person i wants tickets[i] tickets; each turn the front person buys one (1 second) and goes to the back if they still need more. Find when person k finishes. Clamped to 8 people with 1–5 tickets each.',
  defaultInput: { tickets: [2, 3, 2, 1], k: 1 },
  fields: [
    { key: 'tickets', type: 'numbers', label: 'tickets' },
    { key: 'k', type: 'number', label: 'k (person to track)' },
  ],
  testInputs: [{ tickets: [], k: 0 }, { tickets: [3], k: 0 }, { tickets: [1, 1, 1], k: 2 }, { tickets: [5, 1, 1, 1], k: 0 }, { tickets: [2, 2, 2], k: 9 }, { tickets: [0, -3, 2], k: 2 }],
  generate(input) {
    const t = nums(input.tickets, 8).map((x) => clampInt(x, 1, 5, 1));
    const n = t.length;
    const frames = [];
    if (!n) {
      return [
        { note: 'Nobody is in line, so there is nothing to simulate.', panels: [queue([], 'queue (front → back)'), vars({ time: 0 })] },
        { note: 'Time = 0.', panels: [queue([], 'queue (front → back)'), vars({ time: 0 })] },
      ];
    }
    const k = clampInt(input.k, 0, n - 1, 0);
    const left = [...t];
    const q = t.map((_, i) => i); // a plain array stands in for the toolkit Queue here
    let time = 0;
    let asks = 0;
    const label = (i) => `p${i}:${left[i]}`;
    const qPanel = () => queue(q.map(label), 'queue (front → back) — person:tickets left');
    const people = (hl) => arr([...left], { label: 'tickets still needed', highlights: { [k]: 'visited', ...hl }, pointers: [{ index: k, label: 'k', color: 'b' }] });
    frames.push({
      note: `Everyone joins the line in order. We track person p${k}. Each turn: dequeue the front, sell one ticket (1 second), enqueue again if they still need more.`,
      panels: [qPanel(), people({}), vars({ time })],
    });
    for (;;) {
      const i = q[0];
      let p = null;
      if (time % 3 === 1 && asks < 4) {
        p = pick(`p${i} is at the front with ${left[i]} ticket(s) left. After buying one, what happens to p${i}?`, left[i] - 1 > 0 ? 'Goes to the back of the line' : 'Leaves the line', [left[i] - 1 > 0 ? 'Leaves the line' : 'Goes to the back of the line', 'Stays at the front'], asks + 1);
        asks++;
      }
      q.shift();
      left[i]--;
      time++;
      const done = left[i] === 0;
      if (!done) q.push(i);
      frames.push({
        note: done
          ? `p${i} buys their last ticket at time ${time} and leaves.${i === k ? ' That is the person we track — stop!' : ''}`
          : `p${i} buys one ticket (time ${time}) and still needs ${left[i]} → back of the line (first come, first served).`,
        panels: [qPanel(), people({ [i]: done ? 'done' : 'active' }), vars({ time, served: `p${i}` })],
      });
      attach(frames, p);
      if (done && i === k) break;
    }
    frames.push({
      note: `p${k} is done after ${time} second(s). Each turn is an O(1) dequeue/enqueue, so the simulation costs O(total tickets sold).`,
      panels: [qPanel(), people({ [k]: 'done' }), vars({ time })],
    });
    attach(frames, pick(`When does p${k} finish?`, time, [time + 1, t.reduce((s, x) => s + x, 0) === time ? time - 1 : t.reduce((s, x) => s + x, 0), t[k] * n === time ? time + 2 : t[k] * n], 2));
    frames.at(-1).result = time;
    return frames;
  },
};

/* ------------------------------------------------------------------ monotonic deque over prefix sums */

export const shortestSubarrayDeque = {
  problem: { name: 'Shortest Subarray with Sum at Least K', statement: 'Return the length of the shortest contiguous subarray with sum ≥ k (numbers may be negative), or -1.', example: 'nums = [2, -1, 2, 3, -2, 4], k = 5 → 2 ([2, 3])', exampleOutput: 2, questionId: 'shortest-subarray-with-sum-at-least-k' },
  title: 'Monotonic deque on prefix sums: shortest subarray with sum ≥ k',
  description: 'Scan prefix sums P; the deque keeps start indices with increasing P. Pop the front while P[j] − P[front] ≥ k (a valid subarray — the front is used up), pop the back while its P ≥ P[j] (a later, smaller prefix is a better start). Works with negatives. Clamped to 9 numbers.',
  defaultInput: { nums: [2, -1, 2, 3, -2, 4], k: 5 },
  fields: [
    { key: 'nums', type: 'numbers', label: 'nums' },
    { key: 'k', type: 'number', label: 'k' },
  ],
  testInputs: [{ nums: [], k: 1 }, { nums: [1], k: 1 }, { nums: [1], k: 2 }, { nums: [1, 2], k: 4 }, { nums: [2, -1, 2], k: 3 }, { nums: [-2, -1], k: -1 }, { nums: [1, 1, 1, 1], k: 2 }],
  generate(input) {
    const a = nums(input.nums, 9);
    const k = Number.isFinite(Number(input.k)) ? Number(input.k) : 0;
    const P = [0];
    for (const x of a) P.push(P[P.length - 1] + x);
    const frames = [];
    const dq = [];
    let best = Infinity;
    let bestRange = null;
    let asks = 0;
    const show = () => (best === Infinity ? '∞' : best);
    const dqPanel = () => queue(dq.map((i) => `P${i}=${P[i]}`), 'deque of start indices (P increasing)');
    const pPanel = (j, hl = {}) => {
      const highlights = {};
      for (const i of dq) highlights[i] = 'visited';
      return arr(P, { label: 'P (prefix sums, P[0] = 0)', highlights: { ...highlights, ...hl }, pointers: j === undefined ? [] : [{ index: j, label: 'j', color: 'a' }] });
    };
    const numsPanel = (range) => arr(a, { label: `nums — k = ${k}, best = ${show()}`, ...(range ? { range } : {}) });
    frames.push({
      note: 'Subarray nums[i..j−1] has sum P[j] − P[i]. For each end j we want the latest start i with P[i] ≤ P[j] − k. With negatives a sliding window breaks, so we keep candidate starts in a deque.',
      panels: [numsPanel(null), pPanel(), dqPanel()],
    });
    for (let j = 0; j < P.length; j++) {
      let p = null;
      if (dq.length && asks < 5 && j % 2 === 0) {
        const ok = P[j] - P[dq[0]] >= k;
        p = pick(`j = ${j}, P[j] = ${P[j]}; the front is P${dq[0]} = ${P[dq[0]]}. Is P[j] − P[front] ≥ ${k}?`, ok ? `Yes (${P[j] - P[dq[0]]}) — record length ${j - dq[0]}, pop front` : `No (${P[j] - P[dq[0]]}) — keep the front`, [ok ? 'No — keep the front' : 'Yes — pop the front', 'Pop the back instead'], asks + 1);
        asks++;
      }
      let usedP = false;
      while (dq.length && P[j] - P[dq[0]] >= k) {
        const i = dq.shift();
        const len = j - i;
        const better = len < best;
        if (better) {
          best = len;
          bestRange = [i, j - 1];
        }
        frames.push({
          note: `P[${j}] − P[${i}] = ${P[j] - P[i]} ≥ ${k} → nums[${i}..${j - 1}] works, length ${len}.${better ? ' New best!' : ''} Pop start ${i} from the front: any later j would only give a longer subarray with it.`,
          panels: [numsPanel([i, j - 1]), pPanel(j, { [i]: 'done', [j]: 'active' }), dqPanel()],
        });
        attach(frames, usedP ? null : p);
        usedP = true;
      }
      if (!usedP && p) {
        frames.push({
          note: `P[${j}] − P[${dq[0]}] = ${P[j] - P[dq[0]]} < ${k}: even the smallest prefix in the deque is not small enough, so no subarray ends at j = ${j}.`,
          panels: [numsPanel(null), pPanel(j, { [j]: 'active' }), dqPanel()],
        });
        attach(frames, p);
      }
      while (dq.length && P[dq[dq.length - 1]] >= P[j]) {
        const b = dq.pop();
        frames.push({
          note: `P${b} = ${P[b]} ≥ P${j} = ${P[j]}: start ${j} is both smaller and later, so start ${b} can never give a shorter answer → pop it from the back.`,
          panels: [numsPanel(null), pPanel(j, { [b]: 'bad', [j]: 'active' }), dqPanel()],
        });
      }
      dq.push(j);
      frames.push({
        note: `Push start ${j} (P = ${P[j]}) to the back; P in the deque still increases front → back.`,
        panels: [numsPanel(null), pPanel(j, { [j]: 'active' }), dqPanel()],
      });
    }
    const ans = best === Infinity ? -1 : best;
    frames.push({
      note: ans === -1 ? `No subarray reaches sum ${k} → answer −1. Each index enters and leaves the deque once: O(n).` : `Shortest subarray with sum ≥ ${k} has length ${ans} (nums[${bestRange[0]}..${bestRange[1]}]). Each index enters and leaves the deque once: O(n).`,
      panels: [numsPanel(bestRange), pPanel(), dqPanel()],
    });
    if (a.length > 1) attach(frames, pick('The scan is over. What is the answer?', ans, [ans === -1 ? 1 : -1, ans + 1, a.length], 1));
    frames.at(-1).result = ans;
    return frames;
  },
};

/* ------------------------------------------------------------------ monotonic deque DP: Jump Game VI */

export const jumpGameDequeDp = {
  problem: { name: 'Jump Game VI', statement: 'Start at index 0 and jump forward at most k steps at a time to the last index. Maximise the sum of the values you land on.', example: 'nums = [1, -1, -2, 4, -7, 3], k = 2 → 7', exampleOutput: 7, questionId: 'jump-game-vi' },
  title: 'Monotonic deque DP: Jump Game VI',
  description: 'best[i] = nums[i] + max(best[i−k..i−1]). The inner max is a sliding-window maximum over best itself, so a decreasing deque of indices answers it in O(1) amortised. Clamped to 9 numbers and 1 ≤ k ≤ 9.',
  defaultInput: { nums: [1, -1, -2, 4, -7, 3], k: 2 },
  fields: [
    { key: 'nums', type: 'numbers', label: 'nums' },
    { key: 'k', type: 'number', label: 'k (max jump)' },
  ],
  testInputs: [{ nums: [], k: 2 }, { nums: [5], k: 1 }, { nums: [1, -5, -5, 1], k: 1 }, { nums: [10, -5, -2, 4, 0, 3], k: 3 }, { nums: [2, 2, 2, 2], k: 2 }, { nums: [-1, -2, -3], k: 0 }],
  generate(input) {
    const a = nums(input.nums, 9);
    const k = clampInt(input.k, 1, 9, 1);
    const n = a.length;
    const frames = [];
    if (!n) {
      return [
        { note: 'There are no indices, so there is nothing to jump on.', panels: [arr([]), vars({ k })] },
        { note: 'Empty input → no score (the template needs at least one index).', panels: [arr([]), vars({ k })] },
      ];
    }
    const best = new Array(n).fill('·');
    const dq = [];
    let asks = 0;
    const dqPanel = () => queue(dq.map((i) => `b${i}=${best[i]}`), 'deque (best decreasing)');
    const bestPanel = (i, hl = {}) => arr([...best], { label: 'best[i]', ...(i > 0 ? { range: [Math.max(0, i - k), i - 1] } : {}), highlights: hl, pointers: [{ index: i, label: 'i', color: 'a' }] });
    frames.push({
      note: `You start on index 0 and may jump 1..${k} steps; best[i] = best score to reach i. The window [i−${k}, i−1] of earlier best values slides right, so keep its maximum at the deque front.`,
      panels: [arr(a, { label: `nums (k = ${k})` }), arr([...best], { label: 'best[i]' }), dqPanel()],
    });
    for (let i = 0; i < n; i++) {
      if (dq.length && dq[0] < i - k) {
        const f = dq.shift();
        frames.push({
          note: `Index ${f} is more than ${k} steps behind i = ${i} → out of reach. Expire it from the front BEFORE computing best[${i}].`,
          panels: [arr(a, { label: `nums (k = ${k})`, highlights: { [i]: 'active' } }), bestPanel(i, { [f]: 'muted' }), dqPanel()],
        });
      }
      const from = dq.length ? dq[0] : null;
      const val = a[i] + (from === null ? 0 : best[from]);
      let p = null;
      if (i > 0 && i % 2 === 1 && asks < 4) {
        const wsum = a[i] + best[i - 1];
        p = pick(`nums[${i}] = ${a[i]}; the deque front is b${from} = ${best[from]}. What is best[${i}]?`, val, [wsum, a[i], val + 1], asks + 1);
        asks++;
      }
      best[i] = val;
      frames.push({
        note: from === null
          ? `i = 0 is the start: best[0] = nums[0] = ${val}.`
          : `The front holds the window max best[${from}] = ${best[from]}, so best[${i}] = ${a[i]} + ${best[from]} = ${val}.`,
        panels: [arr(a, { label: `nums (k = ${k})`, highlights: { [i]: 'active' } }), bestPanel(i, { [i]: 'active', ...(from === null ? {} : { [from]: 'done' }) }), dqPanel()],
      });
      attach(frames, p);
      let q = null;
      if (dq.length && i % 2 === 0 && i > 0 && asks < 5) {
        const pops = best[dq[dq.length - 1]] <= val;
        q = pick(`best[${i}] = ${val} arrives; the deque back is b${dq[dq.length - 1]} = ${best[dq[dq.length - 1]]}. Pop the back?`, pops ? 'Yes — it can never be the max again' : 'No — it is bigger, keep it', [pops ? 'No — keep it' : 'Yes — pop it', 'Pop the front instead'], asks + 2);
        asks++;
      }
      const popped = [];
      while (dq.length && best[dq[dq.length - 1]] <= val) popped.push(dq.pop());
      dq.push(i);
      frames.push({
        note: popped.length
          ? `best[${i}] = ${val} ≥ ${popped.map((j) => `best[${j}]`).join(', ')}: those are older AND not bigger, so they can never be a window max again → popped from the back. Push ${i}.`
          : `${dq.length > 1 ? `best[${dq[dq.length - 2]}] = ${best[dq[dq.length - 2]]} > ${val}, so it stays. ` : ''}Push ${i} to the back; best values in the deque decrease front → back.`,
        panels: [arr(a, { label: `nums (k = ${k})`, highlights: { [i]: 'visited' } }), arr([...best], { label: 'best[i]', highlights: Object.fromEntries(popped.map((j) => [j, 'bad'])) }), dqPanel()],
      });
      attach(frames, q);
    }
    frames.push({
      note: `Best score to reach the last index = best[${n - 1}] = ${best[n - 1]}. Each index enters and leaves the deque once → O(n), instead of O(n·k) for a loop over the last k.`,
      panels: [arr(a, { label: `nums (k = ${k})` }), arr([...best], { label: 'best[i]', highlights: { [n - 1]: 'done' } }), dqPanel()],
    });
    if (n > 1) attach(frames, pick('All indices are done. What is the maximum score?', best[n - 1], [a.reduce((s, x) => s + x, 0), a[0] + a[n - 1], best[n - 1] + 1], 3));
    frames.at(-1).result = best[n - 1];
    return frames;
  },
};
