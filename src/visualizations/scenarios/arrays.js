// Array-based scenarios. Each generate(input) returns frames: { note, panels: [...] }.
const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
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

export const twoPointersPairSum = {
  title: 'Two pointers: pair with target sum',
  description: 'Sorted array. If the sum is too small move left up; if too big move right down.',
  defaultInput: { nums: [1, 2, 4, 6, 8, 9, 14, 15], target: 13 },
  fields: [
    { key: 'nums', type: 'numbers', label: 'sorted nums' },
    { key: 'target', type: 'number', label: 'target' },
  ],
  generate({ nums, target }) {
    const a = [...nums].sort((x, y) => x - y);
    const frames = [];
    let l = 0;
    let r = a.length - 1;
    const ptr = () => [
      { index: l, label: 'L', color: 'a' },
      { index: r, label: 'R', color: 'b' },
    ];
    frames.push({ note: `Start with L at the smallest and R at the largest value. Target = ${target}.`, panels: [arr(a, { pointers: ptr() }), vars({ target })] });
    let it = 0;
    while (l < r) {
      const sum = a[l] + a[r];
      const hl = { [l]: 'active', [r]: 'active' };
      const opts = ['Found the pair', 'Move L right (L++)', 'Move R left (R--)'];
      const correct = sum === target ? 0 : sum < target ? 1 : 2;
      const p = it % 2 === 0 ? pick(`L = ${a[l]}, R = ${a[r]}: sum ${sum} vs target ${target}. What happens next?`, opts[correct], opts.filter((_, k) => k !== correct), it / 2) : null;
      it++;
      if (sum === target) {
        frames.push({ note: `${a[l]} + ${a[r]} = ${sum} — found the pair!`, panels: [arr(a, { pointers: ptr(), highlights: { [l]: 'done', [r]: 'done' } }), vars({ sum, target })] });
        attach(frames, p);
        return frames;
      }
      if (sum < target) {
        frames.push({ note: `${a[l]} + ${a[r]} = ${sum} < ${target}. Too small: every pair with a[L] is too small (a[R] is the biggest partner), so drop a[L] → L++.`, panels: [arr(a, { pointers: ptr(), highlights: hl }), vars({ sum, target })] });
        l++;
      } else {
        frames.push({ note: `${a[l]} + ${a[r]} = ${sum} > ${target}. Too big: a[R] with the smallest partner is still too big, so drop a[R] → R--.`, panels: [arr(a, { pointers: ptr(), highlights: hl }), vars({ sum, target })] });
        r--;
      }
      attach(frames, p);
    }
    frames.push({ note: 'Pointers met — no pair adds up to the target.', panels: [arr(a, { pointers: ptr() }), vars({ target })] });
    return frames;
  },
};

export const dutchFlag = {
  title: 'Dutch National Flag (sort 0s, 1s, 2s)',
  description: 'low marks the end of 0s, high the start of 2s, mid scans the unknown region.',
  defaultInput: { nums: [2, 0, 2, 1, 1, 0, 1, 2, 0] },
  fields: [{ key: 'nums', type: 'numbers', label: 'nums (0/1/2)' }],
  generate({ nums }) {
    const a = nums.map((x) => Math.max(0, Math.min(2, x)));
    const frames = [];
    let low = 0;
    let mid = 0;
    let high = a.length - 1;
    const snap = (note, hl = {}) => {
      const highlights = {};
      for (let i = 0; i < low; i++) highlights[i] = 'done';
      for (let i = high + 1; i < a.length; i++) highlights[i] = 'visited';
      Object.assign(highlights, hl);
      frames.push({
        note,
        panels: [
          arr([...a], {
            highlights,
            pointers: [
              { index: low, label: 'low', color: 'a' },
              { index: mid, label: 'mid', color: 'c' },
              { index: high, label: 'high', color: 'b' },
            ],
          }),
        ],
      });
    };
    snap('[0, low) = 0s · [low, mid) = 1s · [mid, high] = unknown · (high, end] = 2s');
    let it = 0;
    const dOpts = ['Swap with a[low], advance low and mid', 'Just advance mid', 'Swap with a[high], decrement high only'];
    while (mid <= high) {
      const p = it % 2 === 0 ? pick(`a[mid] = ${a[mid]} (mid = ${mid}). What happens?`, dOpts[a[mid]], dOpts.filter((_, k) => k !== a[mid]), it / 2) : null;
      it++;
      if (a[mid] === 0) {
        snap(`a[mid] = 0 → swap with a[low], move both low and mid.`, { [mid]: 'active', [low]: 'active' });
        [a[low], a[mid]] = [a[mid], a[low]];
        low++;
        mid++;
      } else if (a[mid] === 1) {
        snap('a[mid] = 1 → already in the middle region, mid++.', { [mid]: 'active' });
        mid++;
      } else {
        snap('a[mid] = 2 → swap with a[high], high--. Do NOT move mid: the swapped-in value is unknown.', { [mid]: 'active', [high]: 'active' });
        [a[mid], a[high]] = [a[high], a[mid]];
        high--;
      }
      attach(frames, p);
    }
    snap('mid passed high — the unknown region is empty. Sorted in one pass!');
    return frames;
  },
};

export const slidingWindowFixed = {
  title: 'Fixed-size sliding window: max sum of k elements',
  description: 'Each step one element enters on the right and one leaves on the left.',
  defaultInput: { nums: [2, 1, 5, 1, 3, 2], k: 3 },
  fields: [
    { key: 'nums', type: 'numbers', label: 'nums' },
    { key: 'k', type: 'number', label: 'k' },
  ],
  generate({ nums, k }) {
    const frames = [];
    k = Math.max(1, Math.min(k, nums.length));
    let sum = 0;
    let best = -Infinity;
    let bestRange = null;
    let bestAsks = 0;
    for (let right = 0; right < nums.length; right++) {
      let p = null;
      if (right === k) {
        const lbl = (i) => `${nums[i]} (index ${i})`;
        p = pick(`The window slides: ${nums[right]} (index ${right}) enters on the right. Which element leaves the window?`, lbl(right - k), [lbl(right - k + 1), lbl(right - 1)], 1);
      } else if (right > k && bestAsks < 2) {
        const next = sum + nums[right] - nums[right - k];
        const yes = next > best;
        p = pick(`Window sum is ${sum}; ${nums[right]} enters and ${nums[right - k]} leaves. Best so far = ${best}. Is the new window a new best?`, yes ? 'Yes' : 'No', [yes ? 'No' : 'Yes'], bestAsks);
        bestAsks++;
      }
      sum += nums[right];
      let note = `${nums[right]} enters the window.`;
      if (right >= k) {
        sum -= nums[right - k];
        note = `${nums[right]} enters, ${nums[right - k]} leaves (index ${right - k}).`;
      }
      const left = Math.max(0, right - k + 1);
      if (right >= k - 1) {
        if (sum > best) {
          best = sum;
          bestRange = [left, right];
          note += ` Window full: sum = ${sum} → new best!`;
        } else note += ` Window full: sum = ${sum}.`;
      } else note += ` Window not full yet (${right + 1}/${k}).`;
      frames.push({
        note,
        panels: [
          arr(nums, { range: [left, right], highlights: right >= k ? { [right]: 'active', [right - k]: 'muted' } : { [right]: 'active' }, pointers: [{ index: left, label: 'L', color: 'a' }, { index: right, label: 'R', color: 'b' }] }),
          vars({ windowSum: sum, best: best === -Infinity ? '—' : best }),
        ],
      });
      attach(frames, p);
    }
    if (bestRange) frames.push({ note: `Done. Best window [${bestRange[0]}, ${bestRange[1]}] with sum ${best}. Total work: O(n).`, panels: [arr(nums, { range: bestRange, highlights: {} }), vars({ best })] });
    return frames;
  },
};

export const slidingWindowVariable = {
  title: 'Variable window: longest substring without repeats',
  description: 'Right explores; left repairs the window when a duplicate appears.',
  defaultInput: { s: 'abcabcbb' },
  fields: [{ key: 's', type: 'string', label: 's' }],
  generate({ s }) {
    const chars = [...s];
    const frames = [];
    const inWin = new Set();
    let left = 0;
    let best = 0;
    let dups = 0;
    for (let right = 0; right < chars.length; right++) {
      const ch = chars[right];
      if (inWin.has(ch)) {
        const win = chars.slice(left, right).join('');
        frames.push({
          note: `'${ch}' is already in the window → invalid. Shrink from the left.`,
          panels: [arr(chars, { range: [left, right - 1], highlights: { [right]: 'bad', [chars.indexOf(ch, left)]: 'bad' }, pointers: [{ index: left, label: 'L', color: 'a' }, { index: right, label: 'R', color: 'b' }] }), vars({ window: [...inWin].join(''), best })],
        });
        if (dups < 3) attach(frames, pick(`R reaches '${ch}' (index ${right}), which is already in the window "${win}". What now?`, 'Shrink from the left until the old copy is gone', ['Expand right and ignore the duplicate', 'Restart with an empty window at R'], dups));
        dups++;
      }
      while (inWin.has(ch)) {
        inWin.delete(chars[left]);
        left++;
        frames.push({
          note: `Removed '${chars[left - 1]}', left = ${left}.${inWin.has(ch) ? ` '${ch}' still inside — keep shrinking.` : ` Duplicate gone.`}`,
          panels: [arr(chars, { range: [left, right - 1], highlights: { [right]: inWin.has(ch) ? 'bad' : 'active' }, pointers: [{ index: left, label: 'L', color: 'a' }, { index: right, label: 'R', color: 'b' }] }), vars({ window: [...inWin].join(''), best })],
        });
      }
      inWin.add(ch);
      const len = right - left + 1;
      const improved = len > best;
      best = Math.max(best, len);
      frames.push({
        note: `Add '${ch}'. Window "${chars.slice(left, right + 1).join('')}" is valid, length ${len}${improved ? ' → new best!' : '.'}`,
        panels: [arr(chars, { range: [left, right], highlights: { [right]: 'active' }, pointers: [{ index: left, label: 'L', color: 'a' }, { index: right, label: 'R', color: 'b' }] }), vars({ window: [...inWin].join(''), best })],
      });
    }
    frames.push({ note: `Done: longest length = ${best}. Each index entered and left at most once → O(n).`, panels: [arr(chars, {}), vars({ best })] });
    return frames;
  },
};

export const prefixSum = {
  title: 'Prefix sums',
  description: 'prefix[i+1] = prefix[i] + nums[i]; any range sum is prefix[r+1] − prefix[l].',
  defaultInput: { nums: [3, 1, 4, 1, 5, 9, 2] },
  fields: [{ key: 'nums', type: 'numbers', label: 'nums' }],
  generate({ nums }) {
    const frames = [];
    const prefix = [0];
    frames.push({ note: 'prefix[0] = 0 (the sum of an empty prefix). This extra 0 removes edge cases.', panels: [arr(nums, { label: 'nums' }), arr([...prefix], { label: 'prefix', highlights: { 0: 'done' } })] });
    for (let i = 0; i < nums.length; i++) {
      prefix.push(prefix[i] + nums[i]);
      frames.push({
        note: `prefix[${i + 1}] = prefix[${i}] + nums[${i}] = ${prefix[i]} + ${nums[i]} = ${prefix[i + 1]}`,
        panels: [arr(nums, { label: 'nums', highlights: { [i]: 'active' } }), arr([...prefix], { label: 'prefix', highlights: { [i]: 'visited', [i + 1]: 'done' } })],
      });
      if (i === 2 || i === 5)
        attach(frames, pick(`nums[${i}] = ${nums[i]}, prefix[${i}] = ${prefix[i]}. prefix[${i + 1}] = ?`, `prefix[${i}] + nums[${i}] = ${prefix[i + 1]}`, [`nums[${i}] alone = ${nums[i]}`, `prefix[${i}] + prefix[${i - 1}] = ${prefix[i] + prefix[i - 1]}`], i === 2 ? 1 : 2));
    }
    if (nums.length >= 3) {
      const l = 1;
      const r = Math.min(nums.length - 1, 4);
      frames.push({
        note: `Query sum(nums[${l}..${r}]) = prefix[${r + 1}] − prefix[${l}] = ${prefix[r + 1]} − ${prefix[l]} = ${prefix[r + 1] - prefix[l]}. O(1) per query!`,
        panels: [arr(nums, { label: 'nums', range: [l, r] }), arr(prefix, { label: 'prefix', highlights: { [l]: 'bad', [r + 1]: 'done' } })],
      });
      attach(frames, pick(`Query: sum(nums[${l}..${r}]) = ? (use the prefix array)`, `prefix[${r + 1}] − prefix[${l}] = ${prefix[r + 1] - prefix[l]}`, [`prefix[${r}] − prefix[${l}] = ${prefix[r] - prefix[l]}`, `prefix[${r + 1}] − prefix[${l + 1}] = ${prefix[r + 1] - prefix[l + 1]}`, `prefix[${r}] − prefix[${l - 1}] = ${prefix[r] - prefix[l - 1]}`], 0));
    }
    return frames;
  },
};

export const kadane = {
  title: "Kadane's algorithm",
  description: 'At each index: extend the previous subarray or start fresh here — whichever is bigger.',
  defaultInput: { nums: [-2, 1, -3, 4, -1, 2, 1, -5, 4] },
  fields: [{ key: 'nums', type: 'numbers', label: 'nums' }],
  generate({ nums }) {
    const frames = [];
    let cur = nums[0];
    let best = nums[0];
    let start = 0;
    let bestRange = [0, 0];
    frames.push({ note: `Start: current = best = ${nums[0]}.`, panels: [arr(nums, { range: [0, 0] }), vars({ current: cur, best })] });
    for (let i = 1; i < nums.length; i++) {
      const extend = cur + nums[i];
      const kOpts = [`Extend: current + nums[${i}]`, `Restart at nums[${i}]`];
      const restart = nums[i] > extend;
      const p = i % 2 === 1 ? pick(`current = ${cur}, nums[${i}] = ${nums[i]}. Extend the subarray or restart here?`, kOpts[restart ? 1 : 0], [kOpts[restart ? 0 : 1]], (i - 1) / 2) : null;
      let note;
      if (nums[i] > extend) {
        note = `Extend gives ${cur} + ${nums[i]} = ${extend}; starting fresh gives ${nums[i]}. The previous sum only hurts → restart at ${i}.`;
        cur = nums[i];
        start = i;
      } else {
        note = `Extend: ${cur} + ${nums[i]} = ${extend} ≥ ${nums[i]} → keep the subarray going.`;
        cur = extend;
      }
      if (cur > best) {
        best = cur;
        bestRange = [start, i];
        note += ` New best = ${best}.`;
      }
      frames.push({ note, panels: [arr(nums, { range: [start, i], highlights: { [i]: 'active' } }), vars({ current: cur, best })] });
      attach(frames, p);
    }
    frames.push({ note: `Maximum subarray = ${best}, indices [${bestRange[0]}, ${bestRange[1]}].`, panels: [arr(nums, { range: bestRange, highlights: {} }), vars({ best })] });
    return frames;
  },
};

export const binarySearch = {
  title: 'Binary search',
  description: 'Compare with the middle; one comparison discards half of the remaining range.',
  defaultInput: { nums: [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21], target: 15 },
  fields: [
    { key: 'nums', type: 'numbers', label: 'sorted nums' },
    { key: 'target', type: 'number', label: 'target' },
  ],
  generate({ nums, target }) {
    const a = [...nums].sort((x, y) => x - y);
    const frames = [];
    let lo = 0;
    let hi = a.length - 1;
    const muted = () => {
      const h = {};
      for (let i = 0; i < a.length; i++) if (i < lo || i > hi) h[i] = 'muted';
      return h;
    };
    let step = 0;
    while (lo <= hi) {
      step++;
      const mid = lo + Math.floor((hi - lo) / 2);
      const ptrs = [
        { index: lo, label: 'lo', color: 'a' },
        { index: mid, label: 'mid', color: 'c' },
        { index: hi, label: 'hi', color: 'b' },
      ];
      const bOpts = ['Found it — stop', 'Right half survives (lo = mid + 1)', 'Left half survives (hi = mid − 1)'];
      const bc = a[mid] === target ? 0 : a[mid] < target ? 1 : 2;
      const p = step >= 2 ? pick(`Step ${step}: range [${lo}..${hi}], mid = ${mid}, a[mid] = ${a[mid]} vs target ${target}. Which half survives?`, bOpts[bc], bOpts.filter((_, k) => k !== bc), step) : null;
      if (a[mid] === target) {
        frames.push({ note: `Step ${step}: a[${mid}] = ${a[mid]} = target. Found at index ${mid}!`, panels: [arr(a, { pointers: ptrs, highlights: { ...muted(), [mid]: 'done' } }), vars({ lo, mid, hi, 'range size': hi - lo + 1 })] });
        attach(frames, p);
        return frames;
      }
      if (a[mid] < target) {
        frames.push({ note: `Step ${step}: a[${mid}] = ${a[mid]} < ${target}. Everything left of mid is even smaller → discard it: lo = mid + 1.`, panels: [arr(a, { pointers: ptrs, highlights: { ...muted(), [mid]: 'active' } }), vars({ lo, mid, hi, 'range size': hi - lo + 1 })] });
        lo = mid + 1;
      } else {
        frames.push({ note: `Step ${step}: a[${mid}] = ${a[mid]} > ${target}. Everything right of mid is even bigger → discard it: hi = mid − 1.`, panels: [arr(a, { pointers: ptrs, highlights: { ...muted(), [mid]: 'active' } }), vars({ lo, mid, hi, 'range size': hi - lo + 1 })] });
        hi = mid - 1;
      }
      attach(frames, p);
    }
    frames.push({ note: `lo > hi: the range is empty, so ${target} is not present. (lo = ${lo} is where it would be inserted.)`, panels: [arr(a, { highlights: muted(), pointers: lo < a.length ? [{ index: lo, label: 'lo', color: 'a' }] : [] }), vars({ lo, hi })] });
    return frames;
  },
};

export const mergeSort = {
  title: 'Merge sort',
  description: 'Split in halves until size 1, then merge sorted halves with two pointers.',
  defaultInput: { nums: [38, 27, 43, 3, 9, 82, 10] },
  fields: [{ key: 'nums', type: 'numbers', label: 'nums' }],
  generate({ nums }) {
    const a = [...nums];
    const frames = [];
    const snap = (note, lo, hi, hl = {}) => frames.push({ note, panels: [arr([...a], { range: lo !== undefined ? [lo, hi] : undefined, highlights: hl })] });
    snap('Merge sort: sort the left half, sort the right half, then merge them.');
    let merges = 0;
    let bigAsks = 0;
    const sort = (lo, hi, depth) => {
      if (lo >= hi) return;
      const mid = (lo + hi) >> 1;
      snap(`${'  '.repeat(depth)}Split [${lo}..${hi}] into [${lo}..${mid}] and [${mid + 1}..${hi}].`, lo, hi);
      sort(lo, mid, depth + 1);
      sort(mid + 1, hi, depth + 1);
      const left = a.slice(lo, mid + 1);
      const right = a.slice(mid + 1, hi + 1);
      let i = 0;
      let j = 0;
      let k = lo;
      while (i < left.length && j < right.length) a[k++] = left[i] <= right[j] ? left[i++] : right[j++];
      while (i < left.length) a[k++] = left[i++];
      while (j < right.length) a[k++] = right[j++];
      const hl = {};
      for (let x = lo; x <= hi; x++) hl[x] = 'done';
      snap(`Merged [${left.join(', ')}] + [${right.join(', ')}] → [${a.slice(lo, hi + 1).join(', ')}]`, lo, hi, hl);
      merges++;
      const big = hi - lo + 1 >= 3;
      if (merges === 1 || (big && bigAsks < 2)) {
        if (big) bigAsks++;
        const fmt = (xs) => `[${xs.join(', ')}]`;
        const inter = [];
        for (let x = 0; x < Math.max(left.length, right.length); x++) inter.push(...(x < right.length ? [right[x]] : []), ...(x < left.length ? [left[x]] : []));
        attach(frames, pick(`Merge the sorted halves [${left.join(', ')}] and [${right.join(', ')}]. What is the result?`, fmt(a.slice(lo, hi + 1)), [fmt([...left, ...right]), fmt(inter), fmt([...a.slice(lo, hi + 1)].reverse())], merges + bigAsks));
      }
    };
    sort(0, a.length - 1, 0);
    snap('Sorted! log n levels of splitting × O(n) merging per level = O(n log n).');
    return frames;
  },
};

export const intervalMerge = {
  title: 'Merge intervals',
  description: 'Sort by start; extend the last merged interval while the next one overlaps it.',
  defaultInput: { intervals: [[1, 3], [8, 10], [2, 6], [15, 18], [9, 12]] },
  fields: [{ key: 'intervals', type: 'json', label: 'intervals' }],
  generate({ intervals }) {
    const sorted = intervals.map((x) => [...x]).sort((a, b) => a[0] - b[0]);
    const frames = [];
    const min = Math.min(...sorted.map((x) => x[0]));
    const max = Math.max(...sorted.map((x) => x[1]));
    const view = (merged, activeIdx, note) =>
      frames.push({
        note,
        panels: [
          { kind: 'intervals', label: 'sorted input', items: sorted.map((iv, i) => ({ start: iv[0], end: iv[1], state: i === activeIdx ? 'active' : i < activeIdx ? 'visited' : '' })), min, max },
          { kind: 'intervals', label: 'merged', items: merged.map((iv) => ({ start: iv[0], end: iv[1], state: 'done' })), min, max },
        ],
      });
    view([], -1, 'Step 1: sort by start time. Now any interval that overlaps the current group must come right after it.');
    const merged = [];
    sorted.forEach((iv, i) => {
      const last = merged[merged.length - 1];
      const iOpts = ['Start a new interval', 'Merge into the last one (extend its end)'];
      const isNew = !last || iv[0] > last[1];
      const p = last ? pick(`Next interval [${iv}]; the last merged interval is [${last}]. Start a new interval or merge?`, iOpts[isNew ? 0 : 1], [iOpts[isNew ? 1 : 0]], i) : null;
      if (!last || iv[0] > last[1]) {
        merged.push([...iv]);
        view(merged.map((x) => [...x]), i, `[${iv}] starts after the last merged end (${last ? last[1] : '—'}) → start a new interval.`);
      } else {
        const old = [...last];
        last[1] = Math.max(last[1], iv[1]);
        view(merged.map((x) => [...x]), i, `[${iv}] starts at ${iv[0]} ≤ ${old[1]} → overlaps. Extend end to max(${old[1]}, ${iv[1]}) = ${last[1]}.`);
      }
      attach(frames, p);
    });
    view(merged, sorted.length, `Result: ${JSON.stringify(merged)}. O(n log n) for the sort, O(n) for the scan.`);
    return frames;
  },
};
