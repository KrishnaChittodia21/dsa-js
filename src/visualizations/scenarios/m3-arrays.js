// Array pattern scenes (running state, in-place reversal, prefix/suffix products, string building,
// index marking). Each generate(input) returns frames: { note, panels, predict? }.
const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const ask = (question, options, answer, explain) => ({ question, options, answer, explain });
// Distinct options with the correct one placed at index pos % n; undefined if fewer than 2 distinct options.
const pick = (question, correct, wrong, pos = 0, explain) => {
  const c = String(correct);
  const w = [...new Set(wrong.map(String))].filter((o) => o !== c).slice(0, 3);
  if (!w.length) return undefined;
  const at = pos % (w.length + 1);
  return ask(question, [...w.slice(0, at), c, ...w.slice(at)], at, explain);
};
const toInts = (xs, max = 10) => (Array.isArray(xs) ? xs : []).slice(0, max).map((x) => Math.trunc(Number(x) || 0));
const show = (a) => `[${a.join(', ')}]`;

// ───────────────────────── 1. Single pass with running state (stock profit) ─────────────────────────
export const runningStateStock = {
  problem: { name: 'Best Time to Buy and Sell Stock', statement: 'Buy on one day and sell on a later day. Return the largest possible profit (0 if none).', example: '[7, 1, 5, 3, 6, 4] → 5 (buy at 1, sell at 6)', exampleOutput: 5, questionId: 'best-time-to-buy-and-sell-stock' },
  title: 'Single pass with running state: best stock profit',
  description: 'Walk prices once, carrying minSoFar (cheapest day before today) and best (best profit so far). Up to 10 prices.',
  defaultInput: { prices: [7, 1, 5, 3, 6, 4] },
  fields: [{ key: 'prices', type: 'numbers', label: 'prices' }],
  testInputs: [{ prices: [] }, { prices: [5] }, { prices: [3, 3, 3] }, { prices: [9, 7, 4, 1] }, { prices: [-2, 4, -5, 1, 3, 8, 2, 6, 0, 7, 9, 1] }],
  generate({ prices }) {
    const p = toInts(prices);
    const frames = [];
    let minSoFar = Infinity;
    let best = 0;
    const fmt = (x) => (x === Infinity ? '—' : x);
    const view = (i, hl = {}) => {
      const highlights = {};
      for (let k = 0; k < i; k++) highlights[k] = 'visited';
      const m = p.indexOf(minSoFar);
      if (m >= 0 && m < i) highlights[m] = 'done';
      Object.assign(highlights, hl);
      return arr(p, { label: 'prices', highlights, pointers: i < p.length ? [{ index: i, label: 'today', color: 'a' }] : [] });
    };
    frames.push({
      note: 'Buy on one day, sell on a later day. If I sell today, the best buy day is simply the cheapest day BEFORE today — so one variable minSoFar summarises the whole prefix.',
      panels: [view(0), vars({ minSoFar: '—', best })],
    });
    let asked = 0;
    for (let i = 0; i < p.length; i++) {
      const x = p[i];
      if (minSoFar === Infinity) {
        minSoFar = x;
        frames.push({
          note: `Day ${i}: price ${x}. No earlier day to buy on, so no sale is possible. minSoFar becomes ${x}.`,
          panels: [view(i + 1, { [i]: 'active' }), vars({ price: x, minSoFar, best })],
        });
        continue;
      }
      const profit = x - minSoFar;
      const newBest = Math.max(best, profit);
      let predict;
      if (i >= 2 && asked < 3) {
        predict = pick(`Day ${i}: price ${x}, minSoFar ${minSoFar}, best ${best}. What is best after today?`, newBest, [best + 1, profit < 0 ? Math.abs(profit) : profit + 1, x, minSoFar], asked + 1);
        if (predict) asked++;
      }
      const improved = newBest > best;
      best = newBest;
      frames.push({
        note: `Day ${i}: selling today earns ${x} − ${minSoFar} = ${profit}. ${improved ? `New best: ${best}!` : `Best stays ${best}.`} We use the OLD minSoFar first — it only covers days before today.`,
        panels: [view(i, { [i]: 'active' }), vars({ price: x, minSoFar, 'profit if sold today': profit, best })],
        predict,
      });
      if (x < minSoFar) {
        minSoFar = x;
        frames.push({
          note: `${x} is cheaper than any earlier day, so it becomes minSoFar — a future sale will want to buy here.`,
          panels: [view(i + 1, { [i]: 'done' }), vars({ price: x, minSoFar, best })],
        });
      }
    }
    frames.push({
      note: p.length < 2
        ? `With ${p.length} day(s) there is no buy-then-sell pair, so the answer is ${best}. One pass, two variables → O(n) time, O(1) space.`
        : `Done: max profit = ${best}. One pass, two variables → O(n) time, O(1) space, instead of checking every (buy, sell) pair in O(n²).`,
      panels: [view(p.length), vars({ minSoFar: fmt(minSoFar), answer: best })],
      result: best,
    });
    return frames;
  },
};

// ───────────────────────── 2. In-place rewrite & reversal (rotate by k) ─────────────────────────
export const rotateByReversal = {
  problem: { name: 'Rotate Array', statement: 'Rotate the array to the right by k steps, in place.', example: '[1, 2, 3, 4, 5, 6, 7], k = 3 → [5, 6, 7, 1, 2, 3, 4]', exampleOutput: [5, 6, 7, 1, 2, 3, 4], questionId: 'rotate-array' },
  title: 'In-place reversal: rotate right by k',
  description: 'Rotate right by k with three in-place reversals: whole array, first k, the rest. Up to 10 values; k is reduced with k %= n.',
  defaultInput: { nums: [1, 2, 3, 4, 5, 6, 7], k: 3 },
  fields: [
    { key: 'nums', type: 'numbers', label: 'nums' },
    { key: 'k', type: 'number', label: 'k' },
  ],
  testInputs: [{ nums: [], k: 3 }, { nums: [9], k: 4 }, { nums: [1, 2, 2, 1], k: 0 }, { nums: [-1, -100, 3, 99], k: 6 }, { nums: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], k: 13 }],
  generate({ nums, k }) {
    const a = toInts(nums);
    const n = a.length;
    const frames = [];
    const kIn = Math.max(0, Math.trunc(Number(k) || 0));
    if (n === 0) {
      frames.push({ note: 'Empty array: nothing to rotate (and k %= 0 would be NaN, so stop early).', panels: [arr([], { label: 'nums' }), vars({ k: kIn })] });
      frames.push({ note: 'Result: []. O(n) time, O(1) extra space.', panels: [arr([], { label: 'nums' }), vars({ result: '[]' })], result: [] });
      return frames;
    }
    const kk = kIn % n;
    frames.push({
      note: `Goal: move every element ${kIn} step(s) right, wrapping around, using no extra array. First k %= n: rotating by ${n} changes nothing, so k = ${kIn} % ${n} = ${kk}.`,
      panels: [arr([...a], { label: 'nums' }), vars({ n, k: kIn, 'k %= n': kk })],
    });
    let swaps = 0;
    const reverse = (lo, hi, name) => {
      const seg = (l, h, extra = {}) => {
        const highlights = {};
        for (let i = lo; i <= hi; i++) highlights[i] = 'visited';
        Object.assign(highlights, extra);
        const pointers = l < h ? [{ index: l, label: 'lo', color: 'a' }, { index: h, label: 'hi', color: 'b' }] : [];
        return arr([...a], { label: 'nums', highlights, range: lo <= hi ? [lo, hi] : undefined, pointers });
      };
      if (lo >= hi) {
        frames.push({ note: `${name}: segment [${lo}..${hi}] has ${Math.max(0, hi - lo + 1)} element(s) — already reversed, no swaps.`, panels: [seg(lo, hi), vars({ step: name })] });
        return;
      }
      frames.push({ note: `${name}: reverse a[${lo}..${hi}]. lo and hi start at the two ends and walk inward.`, panels: [seg(lo, hi), vars({ step: name, lo, hi })] });
      while (lo < hi) {
        const l = lo;
        const h = hi;
        let predict;
        if (swaps === 1 || swaps === 4) predict = pick(`lo = ${l}, hi = ${h}. Which values swap now?`, `${a[l]} ↔ ${a[h]}`, [`${a[l]} ↔ ${a[l + 1]}`, `${a[h - 1]} ↔ ${a[h]}`, `${a[(l + 1) % n]} ↔ ${a[(h + n - 1) % n]}`], swaps === 1 ? 0 : 2);
        [a[l], a[h]] = [a[h], a[l]];
        swaps++;
        frames.push({
          note: `Swap a[${l}] and a[${h}] (${a[h]} ↔ ${a[l]}), then lo++ and hi--. A swap reads both values before writing, so nothing is overwritten.`,
          panels: [arr([...a], { label: 'nums', highlights: { [l]: 'active', [h]: 'active' }, range: [lo, hi], pointers: [{ index: l, label: 'lo', color: 'a' }, { index: h, label: 'hi', color: 'b' }] }), vars({ step: name, swaps })],
          predict,
        });
        lo++;
        hi--;
      }
    };
    const before = [...a];
    reverse(0, n - 1, '1. reverse all');
    const after1 = [...a];
    frames.push({
      note: `After the full reversal the last ${kk} element(s) are at the front — but backwards. Reversing each part fixes the order inside it.`,
      panels: [arr([...a], { label: 'nums', highlights: Object.fromEntries(a.map((_, i) => [i, i < kk ? 'done' : 'visited'])) }), vars({ was: show(before) })],
      predict: n > 1 ? pick(`After reversing the whole of ${show(before)}, what is nums?`, show(after1), [show(before), show([...before.slice(n - kk), ...before.slice(0, n - kk)]), show([...after1.slice(1), after1[0]])], 1) : undefined,
    });
    reverse(0, kk - 1, '2. reverse first k');
    reverse(kk, n - 1, '3. reverse the rest');
    const expect = [...before.slice(n - kk), ...before.slice(0, n - kk)];
    frames.push({
      note: `Rotated right by ${kk}: ${show(a)}. ${swaps} swap(s) in total, each element moved at most twice → O(n) time, O(1) extra space.`,
      panels: [arr([...a], { label: 'nums', highlights: Object.fromEntries(a.map((_, i) => [i, 'done'])) }), vars({ result: show(a), k: kk })],
      predict: n > 2 && kk > 0 ? pick(`The last reversal finished. What is the final array?`, show(expect), [show(after1), show([...before.slice(kk), ...before.slice(0, kk)]), show(before)], 3) : undefined,
      result: a,
    });
    return frames;
  },
};

// ───────────────────────── 3. Prefix & suffix passes (product except self) ─────────────────────────
export const productExceptSelf = {
  problem: { name: 'Product of Array Except Self', statement: 'For every index, return the product of all the other elements, without using division.', example: '[1, 2, 3, 4] → [24, 12, 8, 6]', exampleOutput: [24, 12, 8, 6], questionId: 'product-of-array-except-self' },
  title: 'Prefix & suffix passes: product except self',
  description: 'Forward pass writes the product of everything LEFT of i into answer; backward pass multiplies in everything RIGHT of i. No division. Up to 8 values in −9..9.',
  defaultInput: { nums: [1, 2, 3, 4] },
  fields: [{ key: 'nums', type: 'numbers', label: 'nums' }],
  testInputs: [{ nums: [] }, { nums: [5] }, { nums: [2, 0, 3, 0] }, { nums: [-1, 1, 0, -3, 3] }, { nums: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2] }, { nums: [-40, 12, 7] }],
  generate({ nums }) {
    const a = toInts(nums, 8).map((x) => Math.max(-9, Math.min(9, x)));
    const n = a.length;
    const out = new Array(n).fill('?');
    const frames = [];
    const view = (i, side, pass) => {
      const hl = {};
      const outHl = {};
      if (i !== null) {
        hl[i] = 'active';
        outHl[i] = 'active';
        for (let k = 0; k < n; k++) if ((side === 'left' && k < i) || (side === 'right' && k > i)) hl[k] = 'visited';
      }
      if (pass === 'done') for (let k = 0; k < n; k++) outHl[k] = 'done';
      const ptr = i !== null ? [{ index: i, label: 'i', color: side === 'left' ? 'a' : 'b' }] : [];
      return [arr(a, { label: 'nums', highlights: hl, pointers: ptr }), arr([...out], { label: 'answer', highlights: outHl })];
    };
    frames.push({
      note: '"Everything except me" = (product of everything before me) × (product of everything after me). Two sweeps compute all of them in O(n) — and no division, so zeros are safe.',
      panels: [...view(null), vars({ left: 1, right: 1 })],
    });
    let left = 1;
    for (let i = 0; i < n; i++) {
      const predict = i === 2 ? pick(`Forward pass, i = ${i}: left = ${left}. What is written into answer[${i}]?`, left, [left * a[i], a[i], left * a[i] * (a[i + 1] ?? 2)], 1) : undefined;
      out[i] = left + 0; // + 0 turns -0 into 0
      frames.push({
        note: `answer[${i}] = left = ${left} (${i === 0 ? 'nothing is left of index 0, so the empty product 1' : `product of nums[0..${i - 1}]`}). Only AFTER writing do we fold nums[${i}] in: left = ${left} × ${a[i]} = ${left * a[i] + 0}.`,
        panels: [...view(i, 'left'), vars({ pass: 'left → right', left: `${left} → ${left * a[i] + 0}` })],
        predict,
      });
      left = left * a[i] + 0;
    }
    if (n)
      frames.push({
        note: `Forward pass done: answer[i] holds the product of everything LEFT of i. Now sweep back from the end with right = 1.`,
        panels: [...view(null), vars({ left, right: 1 })],
      });
    let right = 1;
    let askedR = 0;
    for (let i = n - 1; i >= 0; i--) {
      const res = out[i] * right + 0;
      const predict = askedR < 2 && i <= n - 2 && i >= 0 && (i === n - 2 || i === 0) ? pick(`Backward pass, i = ${i}: answer[${i}] = ${out[i]}, right = ${right}. What does answer[${i}] become?`, res, [out[i], right, res * (a[i] || 2), out[i] + right], askedR === 0 ? 2 : 0) : undefined;
      if (predict) askedR++;
      const was = out[i];
      out[i] = res;
      frames.push({
        note: `answer[${i}] = ${was} × right (${right}) = ${res}: left part × right part = product of everything except nums[${i}]. Then right = ${right} × ${a[i]} = ${right * a[i] + 0}.`,
        panels: [...view(i, 'right'), vars({ pass: '← right to left', right: `${right} → ${right * a[i] + 0}` })],
        predict,
      });
      right = right * a[i] + 0;
    }
    frames.push({
      note: n
        ? `answer = ${show(out)}. Two O(n) passes, and the answer array itself stored the left products → O(1) extra space besides the output.`
        : 'Empty input → empty answer. Two O(n) passes, O(1) extra space besides the output.',
      panels: [...view(null, null, 'done'), vars({ answer: show(out) })],
      result: out,
    });
    return frames;
  },
};

// ───────────────────────── 4. String building (run-length compression) ─────────────────────────
export const runLengthBuilder = {
  problem: { name: 'String Compression (run-length)', statement: 'Replace every run of a repeated character with the character followed by the run length (runs of 1 keep just the character).', example: '"aaabcc" → "a3bc2"', exampleOutput: 'a3bc2', questionId: 'string-compression' },
  title: 'String building: run-length compression',
  description: 'i marks the start of a run, j scans to its end; each run pushes one piece into parts, joined once at the end. Up to 10 characters.',
  defaultInput: { s: 'aaabcc' },
  fields: [{ key: 's', type: 'string', label: 's' }],
  testInputs: [{ s: '' }, { s: 'z' }, { s: 'abc' }, { s: 'bbbbbbbbbbbbbb' }, { s: 'aabbaa' }],
  generate({ s }) {
    const chars = [...String(s ?? '')].slice(0, 10);
    const n = chars.length;
    const parts = [];
    const frames = [];
    const view = (i, j, extra = {}) => {
      const highlights = {};
      for (let k = 0; k < Math.min(i, n); k++) highlights[k] = 'done';
      Object.assign(highlights, extra);
      const pointers = [];
      if (i < n) pointers.push({ index: i, label: 'i', color: 'a' });
      if (j !== null && j < n && j !== i) pointers.push({ index: j, label: 'j', color: 'b' });
      return arr(chars, { label: 's', highlights, pointers, range: j !== null && j > i ? [i, j - 1] : undefined });
    };
    const partsPanel = () => arr([...parts], { label: 'parts', showIndices: false });
    frames.push({
      note: 'Strings are immutable, so we never edit s. i finds the start of a run, j scans forward to its end, and each run pushes one piece into parts. join once at the end.',
      panels: [view(0, null), partsPanel()],
    });
    let run = 0;
    for (let i = 0; i < n; ) {
      let j = i;
      while (j < n && chars[j] === chars[i]) j++;
      const len = j - i;
      const piece = len > 1 ? `${chars[i]}${len}` : chars[i];
      const runHl = {};
      for (let k = i; k < j; k++) runHl[k] = 'active';
      if (j < n) runHl[j] = 'bad';
      frames.push({
        note: j < n
          ? `j stops at index ${j}: '${chars[j]}' ≠ '${chars[i]}'. The run of '${chars[i]}' is s[${i}..${j - 1}], length j − i = ${len}.`
          : `j ran off the end (j = ${n}). The last run s[${i}..${j - 1}] is handled the same way as every other run — no special flush needed.`,
        panels: [view(i, j, runHl), partsPanel(), vars({ i, j, 'j − i': len })],
        predict: run === 1 ? pick(`i = ${i} ('${chars[i]}'). Where does j stop?`, `index ${j}`, [`index ${i + 1}`, `index ${n}`, `index ${j + 1}`], 2) : undefined,
      });
      parts.push(piece);
      frames.push({
        note: `Push '${piece}' (${len > 1 ? `character + count ${len}` : 'a run of 1 → just the character'}). parts.push is O(1) amortized. Then jump i = j — j never revisits an index.`,
        panels: [view(j, null), partsPanel(), vars({ pushed: piece, 'i = j': j })],
        predict: run === 0 || run === 2 ? pick(`The run of '${chars[i]}' has length ${len}. What is pushed into parts?`, piece, [`${chars[i]}${len}`, chars[i], `${len}${chars[i]}`, `${chars[i]}${len + 1}`], run === 0 ? 1 : 3) : undefined,
      });
      run++;
      i = j;
    }
    const result = parts.join('');
    frames.push({
      note: `parts.join('') = "${result}". One O(total length) join instead of creating a new string on every +=. i and j each move left to right once → O(n).`,
      panels: [view(n, null), partsPanel(), vars({ result: `"${result}"` })],
      predict: parts.length > 1 ? pick('What does parts.join(\'\') return?', `"${result}"`, [`"${parts.join(',')}"`, `"${parts.slice(0, -1).join('')}"`, `"${parts.join(' ')}"`], 0) : undefined,
      result,
    });
    return frames;
  },
};

// ───────────────────────── 5. Index marking with negation ─────────────────────────
export const indexMarkingNegation = {
  problem: { name: 'Find All Duplicates in an Array', statement: 'Values are in 1..n. Find the values that appear twice (and those that are missing) using O(1) extra space.', example: '[4, 3, 2, 7, 8, 2, 3, 1] → duplicates [2, 3], missing [5, 6]', exampleOutput: [2, 3], questionId: 'find-all-duplicates-in-an-array' },
  title: 'Index marking: sign of nums[v − 1] as a "seen" flag',
  description: 'For each v = |nums[i]|, negate nums[v − 1] to mark "v seen"; already negative means v is a duplicate; still-positive cells give the missing values. Up to 10 values, each clamped to 1..n.',
  defaultInput: { nums: [4, 3, 2, 7, 8, 2, 3, 1] },
  fields: [{ key: 'nums', type: 'numbers', label: 'nums (1..n)' }],
  testInputs: [{ nums: [] }, { nums: [1] }, { nums: [1, 1] }, { nums: [2, 2, 2, 2] }, { nums: [-3, 0, 9, 1] }, { nums: [3, 1, 2] }, { nums: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] }],
  generate({ nums }) {
    const raw = toInts(nums);
    const n = raw.length;
    const a = raw.map((x) => Math.max(1, Math.min(n, x)));
    const frames = [];
    const dups = [];
    const view = (extra = {}, pointers = []) => {
      const highlights = {};
      a.forEach((x, k) => {
        if (x < 0) highlights[k] = 'visited';
      });
      Object.assign(highlights, extra);
      return arr([...a], { label: 'nums', highlights, pointers });
    };
    frames.push({
      note: `Values are in 1..${n}, so value v has its own cell, index v − 1. Every value is positive, so the sign bit is free: a negative nums[v − 1] will mean "v was seen".`,
      panels: [view(), vars({ n, duplicates: '[]' })],
    });
    let asked = 0;
    for (let i = 0; i < n; i++) {
      const v = Math.abs(a[i]);
      const t = v - 1;
      const seen = a[t] < 0;
      const ptrs = i === t ? [{ index: i, label: 'i = v−1', color: 'a' }] : [{ index: i, label: 'i', color: 'a' }, { index: t, label: 'v−1', color: 'b' }];
      let predict;
      if (i >= 1 && asked < 3 && (seen ? asked !== 1 : i % 2 === 0)) {
        predict = ask(`i = ${i}: v = |nums[${i}]| = ${v}, and nums[${t}] = ${a[t]}. What happens?`, ['Negate nums[v − 1] — mark v as seen', 'nums[v − 1] is already negative — v is a duplicate'], seen ? 1 : 0);
        asked++;
      }
      if (seen) {
        dups.push(v);
        frames.push({
          note: `v = |nums[${i}]| = ${v}. nums[${t}] is already negative, so ${v} was seen before → ${v} is a duplicate. Do NOT negate again — that would flip the mark back.`,
          panels: [view({ [i]: 'active', [t]: 'bad' }, ptrs), vars({ i, v, 'nums[v−1]': a[t], duplicates: show(dups) })],
          predict,
        });
      } else {
        const old = a[t];
        a[t] = -a[t];
        frames.push({
          note: `v = |nums[${i}]| = ${v} (Math.abs recovers the original value even if this cell was marked). nums[${t}] = ${old} > 0 → negate it to ${a[t]}: "${v} seen".`,
          panels: [view({ [i]: 'active', [t]: 'done' }, ptrs), vars({ i, v, 'nums[v−1]': `${old} → ${a[t]}`, duplicates: show(dups) })],
          predict,
        });
      }
    }
    const missing = [];
    a.forEach((x, k) => {
      if (x > 0) missing.push(k + 1);
    });
    const finalHl = {};
    a.forEach((x, k) => {
      finalHl[k] = x > 0 ? 'active' : 'muted';
    });
    const wrongMissing = n ? [show(missing.map((m) => m - 1)), show(dups), show(missing.length ? [] : [n])] : [];
    frames.push({
      note: missing.length
        ? `Pass done. Indices still positive: ${missing.map((m) => m - 1).join(', ')} → nobody marked them, so values ${missing.join(', ')} never appeared (value = index + 1).`
        : 'Pass done. Every cell is negative → every value 1..n appeared, nothing is missing.',
      panels: [view(finalHl), vars({ missing: show(missing), duplicates: show(dups) })],
      predict: n > 1 ? pick('The marking pass is done. Which values never appeared?', show(missing), wrongMissing, 2) : undefined,
    });
    frames.push({
      note: `Missing = ${show(missing)}, duplicates = ${show(dups)}. One pass over n cells → O(n) time, and the array was its own hash set → O(1) extra space. (Restore with Math.abs if the caller needs the input back.)`,
      panels: [arr(a.map(Math.abs), { label: 'nums (signs restored)' }), vars({ missing: show(missing), duplicates: show(dups) })],
      result: dups,
    });
    return frames;
  },
};
