// patterns-linear: step-through animations for array / string / list / stack / queue patterns that had
// no exact animation (palindromes, voting, next permutation, Z-array, difference array, 2D prefix sums,
// read/write pointers, dummy head, expression evaluation, ring buffer).
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
  const w = [...new Set(wrong.map(String))].filter((o) => o !== c).slice(0, 3);
  if (!w.length) return null;
  const at = pos % (w.length + 1);
  return ask(question, [...w.slice(0, at), c, ...w.slice(at)], at, explain);
};
const attach = (frames, p) => {
  if (p && frames.length > 1) frames[frames.length - 1].predict = p;
};
const nums = (xs, max) => (Array.isArray(xs) ? xs : []).filter((x) => typeof x === 'number' && Number.isFinite(x)).slice(0, max);

/* ------------------------------------------------------------------ string algorithms */

export const palindromeExpand = {
  title: 'Palindromes: expand around centre',
  description: 'Try all 2n − 1 centres (every character and every gap) and grow outward while both ends match; keep the widest. Input clamped to 16 characters.',
  defaultInput: { s: 'abaxyzzyxf' },
  fields: [{ key: 's', type: 'string', label: 's' }],
  testInputs: [{ s: '' }, { s: 'a' }, { s: 'aaaa' }, { s: 'abcd' }, { s: 'cbbd' }, { s: 'racecar' }],
  generate({ s }) {
    const ch = [...String(s ?? '')].slice(0, 16);
    const n = ch.length;
    const frames = [];
    if (!n) {
      return [
        { note: 'The string is empty, so there are no centres to try.', panels: [arr([]), vars({ best: '""', count: 0 })] },
        { note: 'Longest palindrome = "" (length 0). Nothing to expand: O(1).', panels: [arr([]), vars({ best: '""', count: 0 })] },
      ];
    }
    let best = [0, 0];
    let count = 0;
    let comparisons = 0;
    let asks = 0;
    const str = (l, r) => (r < l ? '""' : `"${ch.slice(l, r + 1).join('')}"`);
    const panel = (l, r, cmpL, cmpR, state, centre, kind) => {
      const highlights = {};
      for (let i = best[0]; i <= best[1]; i++) highlights[i] = 'window';
      if (cmpL >= 0 && cmpL < n) highlights[cmpL] = state;
      if (cmpR >= 0 && cmpR < n) highlights[cmpR] = state;
      const pointers = [];
      if (cmpL >= 0 && cmpL < n) pointers.push({ index: cmpL, label: 'L', color: 'a' });
      if (cmpR >= 0 && cmpR < n) pointers.push({ index: cmpR, label: 'R', color: 'b' });
      return [
        arr(ch, { highlights, pointers, ...(r >= l ? { range: [l, r] } : {}) }),
        vars({ centre, kind, current: str(l, r), best: str(best[0], best[1]), count }),
      ];
    };
    frames.push({
      note: `Every palindrome mirrors around a centre: a character (odd length) or the gap between two characters (even length). ${n} characters → ${2 * n - 1} centres. Blue = best so far.`,
      panels: panel(0, -1, -1, -1, 'active', '—', '—'),
    });
    for (let c = 0; c < n; c++) {
      for (const kind of ['odd', 'even']) {
        if (kind === 'even' && c + 1 >= n) continue;
        const centre = kind === 'odd' ? `'${ch[c]}' (i=${c})` : `gap ${c}|${c + 1}`;
        // [l, r] is the palindrome confirmed so far (empty for an even centre); we test l − 1 and r + 1 next.
        let l = kind === 'odd' ? c : c + 1;
        let r = c;
        if (kind === 'odd') count++;
        let expansions = 0;
        for (;;) {
          const a = l - 1;
          const b = r + 1;
          const inside = a >= 0 && b < n;
          const match = inside && ch[a] === ch[b];
          const prefix = kind === 'odd' && expansions === 0 ? `Odd centre ${centre}: a single character is a palindrome (count = ${count}). ` : '';
          let p = null;
          if (inside && comparisons % 3 === 1 && asks < 5) {
            p = pick(`L = '${ch[a]}' (i=${a}), R = '${ch[b]}' (i=${b}) around ${centre}. Does this palindrome grow?`, match ? `Yes — '${ch[a]}' = '${ch[b]}', expand` : `No — '${ch[a]}' ≠ '${ch[b]}', stop`, [match ? 'No — stop here' : 'Yes — expand anyway', 'Skip to the next centre without checking'], asks);
            asks++;
          }
          if (inside) comparisons++;
          if (match) {
            l = a;
            r = b;
            count++;
            expansions++;
            frames.push({ note: `${prefix}s[${a}] = s[${b}] = '${ch[a]}' → the inside was already a palindrome, so ${str(l, r)} is one too (O(1) check). Expand.`, panels: panel(l, r, a, b, 'active', centre, kind) });
            attach(frames, p);
            continue;
          }
          const len = r - l + 1;
          let tail = '';
          if (len > best[1] - best[0] + 1) {
            best = [l, r];
            tail = ' New best!';
          }
          const why = inside ? `'${ch[a]}' ≠ '${ch[b]}'` : 'we hit the edge of the string';
          const res = len > 0 ? `the widest palindrome here is ${str(l, r)} (length ${len}).` : 'no even palindrome is centred here.';
          frames.push({ note: `${prefix || `${centre}: `}${why} → stop; ${res}${tail}`, panels: panel(l, r, inside ? a : -1, inside ? b : -1, inside ? 'bad' : 'active', centre, kind) });
          attach(frames, p);
          break;
        }
      }
    }
    const hl = {};
    for (let i = best[0]; i <= best[1]; i++) hl[i] = 'done';
    frames.push({
      note: `Longest palindrome = ${str(best[0], best[1])} (length ${best[1] - best[0] + 1}); ${count} palindromic substrings in total. 2n − 1 centres × O(1) per expansion step → O(n²) time, O(1) space.`,
      panels: [arr(ch, { highlights: hl, range: best }), vars({ best: str(best[0], best[1]), length: best[1] - best[0] + 1, count })],
    });
    if (n >= 2) attach(frames, pick('All centres are done. Which substring is reported as the longest palindrome?', str(best[0], best[1]), [`"${ch[0]}"`, `"${ch.join('')}"`, `"${ch.slice(0, 2).join('')}"`], 1));
    return frames;
  },
};

export const zAlgorithm = {
  title: 'Z-algorithm: the z-box',
  description: 'z[i] = how far s[i..] matches the prefix of s. Inside the z-box [l, r) copy the mirror value z[i − l]; only compare characters past r. Input clamped to 16 characters.',
  defaultInput: { s: 'aabcaabxaaz' },
  fields: [{ key: 's', type: 'string', label: 's' }],
  testInputs: [{ s: '' }, { s: 'a' }, { s: 'aaaa' }, { s: 'abc' }, { s: 'abab' }, { s: 'aabxaabxcaabxaab' }],
  generate({ s }) {
    const ch = [...String(s ?? '')].slice(0, 16);
    const n = ch.length;
    const z = new Array(n).fill(0);
    if (n) z[0] = n;
    const frames = [];
    let l = 0;
    let r = 0;
    const zShow = (upto) => z.map((v, i) => (i <= upto ? v : '·'));
    const panels = (i, hl, zHl, extra = {}) => {
      const pointers = [];
      if (i < n) pointers.push({ index: i, label: 'i', color: 'b' });
      if (i < r && i - l > 0) pointers.push({ index: i - l, label: 'i−l', color: 'c' });
      return [
        arr(ch, { highlights: hl, pointers, ...(r > l ? { range: [l, r - 1] } : {}) }),
        arr(zShow(i), { label: 'z', highlights: zHl }),
        vars({ i: i < n ? i : '—', 'box [l, r)': r > l ? `[${l}, ${r})` : 'none', ...extra }),
      ];
    };
    if (n < 2) {
      frames.push({ note: n ? 'One character: z[0] = n = 1 by convention (the whole string matches itself).' : 'Empty string → empty z-array.', panels: panels(n, {}, n ? { 0: 'done' } : {}) });
      frames.push({ note: `z = [${z.join(', ')}]. Nothing else to compute: O(n).`, panels: panels(n, {}, {}) });
      return frames;
    }
    frames.push({ note: `z[0] = n = ${n} by convention. The z-box [l, r) will be the rightmost window known to equal a prefix of s; it starts empty.`, panels: panels(1, {}, { 0: 'done' }) });
    let reuseAsks = 0;
    let growAsks = 0;
    for (let i = 1; i < n; i++) {
      // 1. Start value: reuse the mirror inside the box, otherwise 0.
      let start = 0;
      let p = null;
      if (i < r) {
        const k = i - l;
        start = Math.min(r - i, z[k]);
        if (reuseAsks < 3) {
          p = pick(`i = ${i} is inside the z-box [${l}, ${r}); its mirror i − l = ${k} has z = ${z[k]}. What does z[${i}] start at, before comparing anything?`, `min(r − i, z[${k}]) = ${start}`, [`z[${k}] = ${z[k]}`, `r − i = ${r - i}`, '0 — always compare from scratch'], reuseAsks + 1);
          reuseAsks++;
        }
        const cap = z[k] >= r - i ? ` z[${k}] reaches the box edge, so we only trust r − i = ${r - i} and must compare beyond r.` : ` z[${k}] < r − i, so the mirror's mismatch is inside the box too — z[${i}] is exactly ${start}.`;
        const hl = {};
        for (let t = 0; t < start; t++) hl[i + t] = 'window';
        frames.push({ note: `i = ${i} is inside the box: s[${l}..${r}) = s[0..${r - l}), so position ${i} mirrors position ${k}. Start z[${i}] = min(${r - i}, ${z[k]}) = ${start} for free.${cap}`, panels: panels(i, { ...hl, [k]: 'visited' }, { [k]: 'visited' }, { 'z[i−l]': z[k], start }) });
      } else {
        frames.push({ note: `i = ${i} is ${r > l ? `past the box (r = ${r})` : 'not covered by any box'} → nothing to reuse. Start z[${i}] = 0 and compare explicitly.`, panels: panels(i, { [i]: 'active' }, {}, { start: 0 }) });
      }
      attach(frames, p);
      // 2. Extend past what we know.
      z[i] = start;
      let compared = 0;
      while (i + z[i] < n && ch[z[i]] === ch[i + z[i]]) {
        z[i]++;
        compared++;
      }
      const mismatch = i + z[i] < n;
      if (mismatch) compared++;
      const oldR = r;
      const grows = z[i] > 0 && i + z[i] > r; // an empty match never forms a box
      let gp = null;
      if (start === 0 && growAsks < 2 && z[i] > 0) {
        gp = pick(`z[${i}] = ${z[i]} reaches index ${i + z[i]}, beyond r = ${r}. What happens to the z-box?`, `New box [${i}, ${i + z[i]})`, [r > l ? `Keep the box [${l}, ${r})` : 'Still no box', `Box becomes [0, ${z[i]})`], growAsks);
        growAsks++;
      }
      if (grows) {
        l = i;
        r = i + z[i];
      }
      const hl = {};
      const zp = {};
      for (let t = 0; t < z[i]; t++) {
        hl[i + t] = 'done';
        zp[t] = true;
      }
      if (mismatch) hl[i + z[i]] = 'bad';
      const how = compared === 0 ? 'no new characters compared' : `${compared} fresh comparison${compared > 1 ? 's' : ''}${start ? ` starting at index ${i + start}` : ''}`;
      const ended = mismatch ? `'${ch[i + z[i]]}' ≠ '${ch[z[i]]}' (prefix position ${z[i]})` : 'reached the end of s';
      const box = grows ? ` Match reaches ${i + z[i]} > ${oldR} → new box [${l}, ${r}).` : ' Box unchanged.';
      frames.push({ note: `z[${i}] = ${z[i]}: ${how}; ${ended}.${box}`, panels: panels(i, hl, { [i]: 'active' }, { 'z[i]': z[i] }) });
      attach(frames, gp);
    }
    frames.push({ note: `z = [${z.join(', ')}]. r only ever moves right and every comparison either grows r or ends a position → O(n) time, O(n) space.`, panels: [arr(ch, {}), arr(z, { label: 'z', highlights: Object.fromEntries(z.map((_, i) => [i, 'done'])) }), vars({ n, sum: z.reduce((a, b) => a + b, 0) })] });
    return frames;
  },
};

/* ------------------------------------------------------------------ array techniques */

export const boyerMoore = {
  title: 'Boyer–Moore majority voting',
  description: 'Keep one candidate and a vote count. Same value votes for it, a different value cancels one vote, count 0 adopts a new candidate. A verification pass confirms the majority. Clamped to 14 numbers.',
  defaultInput: { nums: [2, 2, 1, 1, 1, 2, 2] },
  fields: [{ key: 'nums', type: 'numbers', label: 'nums' }],
  testInputs: [{ nums: [] }, { nums: [5] }, { nums: [1, 2, 3] }, { nums: [3, 3, 3] }, { nums: [1, 2, 1, 2, 1] }, { nums: [1, 1, 2, 2] }],
  generate({ nums: raw }) {
    const a = nums(raw, 14);
    const n = a.length;
    const frames = [];
    if (!n) {
      return [
        { note: 'Empty array → there is no candidate.', panels: [arr([]), vars({ candidate: '—', count: 0 })] },
        { note: 'No elements, so no majority element. O(1).', panels: [arr([]), vars({ candidate: '—', count: 0 })] },
      ];
    }
    let cand = null;
    let count = 0;
    const votes = () => stack(new Array(count).fill(cand), { label: 'unmatched votes' });
    const panels = (i, hl) => [arr(a, { highlights: hl, pointers: i < n ? [{ index: i, label: 'i', color: 'b' }] : [] }), votes(), vars({ candidate: cand ?? '—', count })];
    frames.push({ note: 'candidate = none, count = 0. Think of count as votes for the candidate that no other value has cancelled yet.', panels: panels(0, {}) });
    const opts = (x) => ['count++ (a vote for the candidate)', 'count-- (cancels one candidate vote)', `Adopt ${x} as the new candidate`];
    let asks = 0;
    for (let i = 0; i < n; i++) {
      const x = a[i];
      const kind = count === 0 ? 2 : x === cand ? 0 : 1;
      const o = opts(x);
      const p = i > 0 && i % 2 === 1 && asks < 4 ? pick(`x = ${x}, candidate = ${cand ?? 'none'}, count = ${count}. What happens?`, o[kind], o.filter((_, k) => k !== kind), asks++) : null;
      const hl = {};
      for (let j = 0; j < i; j++) hl[j] = 'visited';
      let note;
      if (kind === 2) {
        cand = x;
        count = 1;
        note = `count is 0 → every earlier vote has been cancelled in pairs, so start fresh: candidate = ${x}, count = 1.`;
        hl[i] = 'active';
      } else if (kind === 0) {
        count++;
        note = `${x} equals the candidate → one more vote, count = ${count}.`;
        hl[i] = 'done';
      } else {
        count--;
        note = `${x} ≠ ${cand} → pair it with one ${cand} vote; both cancel, count = ${count}.${count === 0 ? ' Nothing left — the next element adopts a new candidate.' : ''}`;
        hl[i] = 'bad';
      }
      frames.push({ note, panels: panels(i, hl) });
      attach(frames, p);
    }
    const occ = a.filter((x) => x === cand).length;
    const ok = occ > Math.floor(n / 2);
    const hl = {};
    a.forEach((x, i) => {
      hl[i] = x === cand ? (ok ? 'done' : 'window') : 'muted';
    });
    frames.push({
      note: `Verification pass: ${cand} appears ${occ} time${occ === 1 ? '' : 's'}; need > ⌊${n}/2⌋ = ${Math.floor(n / 2)}. ${ok ? `${cand} is the majority element.` : 'No majority exists — the survivor is only a candidate.'} O(n) time, O(1) space.`,
      panels: [arr(a, { highlights: hl }), votes(), vars({ candidate: cand, occurrences: occ, majority: ok ? cand : 'none' })],
    });
    attach(frames, pick(`The scan ends with candidate ${cand} (count ${count}). Is ${cand} a majority (> n/2 times)?`, ok ? `Yes — it appears ${occ} times` : `No — it appears only ${occ} times`, [ok ? 'Unknown until we count again — it is not' : `Yes — the survivor is always the majority`, `Yes — count ${count} > 0 proves it`], 2));
    return frames;
  },
};

export const nextPermutation = {
  title: 'Next permutation',
  description: 'Find the pivot (rightmost i with nums[i] < nums[i + 1]), swap it with the smallest larger value to its right, then reverse the descending suffix. Clamped to 12 numbers.',
  defaultInput: { nums: [1, 3, 5, 4, 2] },
  fields: [{ key: 'nums', type: 'numbers', label: 'nums' }],
  testInputs: [{ nums: [] }, { nums: [1] }, { nums: [3, 2, 1] }, { nums: [1, 1, 5] }, { nums: [1, 5, 1] }, { nums: [2, 2, 2] }, { nums: [1, 2, 3] }],
  generate({ nums: raw }) {
    const a = nums(raw, 12);
    const n = a.length;
    const frames = [];
    const suffixHl = (from, extra = {}) => {
      const hl = {};
      for (let k = Math.max(0, from); k < n; k++) hl[k] = 'window';
      return { ...hl, ...extra };
    };
    const ptrs = (list) => list.filter((p) => p.index >= 0 && p.index < n);
    frames.push({ note: n < 2 ? `${n ? 'One element' : 'Empty array'}: there is only one arrangement.` : 'Scan from the right for the pivot: the first i with nums[i] < nums[i + 1]. Everything to its right is in descending order (its largest arrangement).', panels: [arr([...a], {}), vars({ step: '1 · find pivot' })] });
    if (n < 2) {
      frames.push({ note: `Result: [${a.join(', ')}] (unchanged). O(1).`, panels: [arr([...a], {}), vars({ result: `[${a.join(', ')}]` })] });
      return frames;
    }
    let i = n - 2;
    let asks = 0;
    while (i >= 0 && a[i] >= a[i + 1]) {
      const p = asks < 1 && i < n - 2 ? pick(`nums[${i}] = ${a[i]}, nums[${i + 1}] = ${a[i + 1]}. Is index ${i} the pivot?`, `No — ${a[i]} ≥ ${a[i + 1]}, the suffix is still descending`, [`Yes — stop here`, 'No — we must sort the suffix first'], asks++) : null;
      frames.push({ note: `nums[${i}] = ${a[i]} ≥ nums[${i + 1}] = ${a[i + 1]} → the descending suffix grows to start at ${i}. No way to make it bigger by rearranging only this part; keep scanning left.`, panels: [arr([...a], { highlights: suffixHl(i), pointers: ptrs([{ index: i, label: 'i', color: 'a' }]) }), vars({ step: '1 · find pivot', i })] });
      attach(frames, p);
      i--;
    }
    if (i < 0) {
      frames.push({ note: 'No pivot: the whole array is descending, so this is the LAST permutation. Wrap around to the first one by reversing everything.', panels: [arr([...a], { highlights: suffixHl(0) }), vars({ pivot: 'none' })] });
      attach(frames, pick(`The entire array [${a.join(', ')}] is non-increasing. What is the next permutation?`, 'Reverse it → the smallest arrangement', ['There is none — leave it as is', 'Swap the first two elements'], 1));
    } else {
      frames.push({ note: `nums[${i}] = ${a[i]} < nums[${i + 1}] = ${a[i + 1]} → pivot at ${i}. To get the NEXT larger arrangement we must raise position ${i} by the smallest possible amount.`, panels: [arr([...a], { highlights: suffixHl(i + 1, { [i]: 'active' }), pointers: ptrs([{ index: i, label: 'pivot', color: 'a' }]) }), vars({ step: '1 · pivot found', pivot: i })] });
      attach(frames, pick(`nums[${i}] = ${a[i]}, nums[${i + 1}] = ${a[i + 1]}. Is index ${i} the pivot?`, `Yes — ${a[i]} < ${a[i + 1]}`, [`No — keep scanning left`, `No — the pivot is always index 0`], 2));
      let j = n - 1;
      while (a[j] <= a[i]) {
        frames.push({ note: `nums[${j}] = ${a[j]} ≤ ${a[i]} → too small to replace the pivot. Move j left (the suffix is descending, so values grow as j moves left).`, panels: [arr([...a], { highlights: suffixHl(i + 1, { [i]: 'active', [j]: 'bad' }), pointers: ptrs([{ index: i, label: 'pivot', color: 'a' }, { index: j, label: 'j', color: 'b' }]) }), vars({ step: '2 · find successor', pivot: i, j })] });
        j--;
      }
      const larger = a.slice(i + 1).filter((v) => v > a[i]);
      frames.push({ note: `nums[${j}] = ${a[j]} > ${a[i]}: the rightmost (= smallest) value in the suffix that is larger than the pivot. Swap them.`, panels: [arr([...a], { highlights: suffixHl(i + 1, { [i]: 'active', [j]: 'active' }), pointers: ptrs([{ index: i, label: 'pivot', color: 'a' }, { index: j, label: 'j', color: 'b' }]) }), vars({ step: '2 · successor found', pivot: i, j })] });
      attach(frames, pick(`Pivot = ${a[i]}; suffix = [${a.slice(i + 1).join(', ')}]. Which value swaps with the pivot?`, a[j], [Math.max(...larger), a[i + 1], a[n - 1]], 0));
      [a[i], a[j]] = [a[j], a[i]];
      frames.push({ note: `Swapped → position ${i} now holds ${a[i]}. The suffix after ${i} is STILL descending (we swapped in a smaller value at the right spot).`, panels: [arr([...a], { highlights: suffixHl(i + 1, { [i]: 'done', [j]: 'active' }), pointers: ptrs([{ index: i, label: 'pivot', color: 'a' }]) }), vars({ step: '3 · fix suffix' })] });
      attach(frames, pick(`After the swap the suffix is [${a.slice(i + 1).join(', ')}] (descending). What makes the permutation as small as possible?`, 'Reverse the suffix (makes it ascending)', ['Leave the suffix as it is', 'Swap the pivot back'], 1));
    }
    let lo = i + 1;
    let hi = n - 1;
    while (lo < hi) {
      [a[lo], a[hi]] = [a[hi], a[lo]];
      frames.push({ note: `Reverse: swap positions ${lo} and ${hi}. Reversing a descending run makes it ascending — its smallest order — in O(n) without sorting.`, panels: [arr([...a], { highlights: suffixHl(i + 1, { [lo]: 'active', [hi]: 'active', ...(i >= 0 ? { [i]: 'done' } : {}) }), pointers: ptrs([{ index: lo, label: 'lo', color: 'a' }, { index: hi, label: 'hi', color: 'b' }]) }), vars({ step: '3 · reverse suffix' })] });
      lo++;
      hi--;
    }
    const hl = {};
    for (let k = 0; k < n; k++) hl[k] = 'done';
    frames.push({ note: `Next permutation: [${a.join(', ')}]. One scan for the pivot, one for the successor, one reverse → O(n) time, O(1) space.`, panels: [arr([...a], { highlights: hl }), vars({ result: `[${a.join(', ')}]` })] });
    return frames;
  },
};

/* ------------------------------------------------------------------ prefix sums */

export const differenceArray = {
  title: 'Difference array: range updates',
  description: 'Each "add v to [l, r]" writes only diff[l] += v and diff[r + 1] −= v; one prefix-sum pass rebuilds the final array. n ≤ 12, up to 6 updates [l, r, v].',
  defaultInput: { n: 6, updates: [[1, 3, 5], [2, 5, 2], [0, 1, -3]] },
  fields: [
    { key: 'n', type: 'number', label: 'array length n' },
    { key: 'updates', type: 'json', label: 'updates [[l, r, v], …]' },
  ],
  testInputs: [{ n: 1, updates: [[0, 0, 4]] }, { n: 5, updates: [] }, { n: 4, updates: [[0, 3, 1], [0, 3, 1]] }, { n: 3, updates: [[2, 0, 7]] }, { n: 0, updates: [[0, 0, 1]] }],
  generate({ n: rawN, updates: rawU }) {
    if (!Array.isArray(rawU)) throw new Error('updates must be a list like [[1, 3, 5], [0, 2, -1]]');
    const n = Math.max(1, Math.min(12, Math.floor(Number(rawN) || 0)));
    const ups = rawU.slice(0, 6).map((u) => {
      if (!Array.isArray(u) || u.length < 3 || u.some((x) => typeof x !== 'number' || !Number.isFinite(x))) throw new Error('each update must be [l, r, v] numbers');
      let [l, r] = [Math.floor(u[0]), Math.floor(u[1])].map((x) => Math.max(0, Math.min(n - 1, x)));
      if (l > r) [l, r] = [r, l];
      return [l, r, u[2]];
    });
    const diff = new Array(n + 1).fill(0);
    const frames = [];
    const fmt = (v) => (v > 0 ? `+${v}` : String(v));
    const dPanel = (hl, extra = {}) => arr(diff.map(fmt), { label: `diff (n + 1 = ${n + 1} slots)`, highlights: hl, ...extra });
    frames.push({ note: `diff has n + 1 = ${n + 1} slots so that diff[r + 1] always exists, even when r = n − 1. ${ups.length} update${ups.length === 1 ? '' : 's'} to record.`, panels: [dPanel({ [n]: 'muted' }), vars({ updates: ups.length ? ups.map((u) => `[${u.join(',')}]`).join(' ') : 'none' })] });
    ups.forEach(([l, r, v], k) => {
      const p = k === 1 || (k === 0 && ups.length === 1) ? pick(`Add ${v} to every index in [${l}, ${r}]. Besides diff[${l}] += ${v}, which slot gets −${Math.abs(v) === v ? v : `(${v})`}?`, `diff[${r + 1}]`, [`diff[${r}]`, `diff[${Math.max(0, l - 1)}]`, `every slot from ${l} to ${r}`], k + 1) : null;
      diff[l] += v;
      diff[r + 1] -= v;
      frames.push({ note: `Update ${k + 1}: add ${v} to [${l}, ${r}]. Values jump by ${fmt(v)} at ${l} and drop back right after ${r} → diff[${l}] ${fmt(v)}, diff[${r + 1}] ${fmt(-v)}.${r - l + 1 > 2 ? ` 2 writes instead of ${r - l + 1}.` : ''}`, panels: [dPanel({ [l]: 'active', [r + 1]: 'bad' }, { range: [l, r] }), vars({ update: `[${l}, ${r}, ${v}]`, written: `diff[${l}], diff[${r + 1}]` })] });
      attach(frames, p);
    });
    const res = new Array(n).fill('·');
    let run = 0;
    frames.push({ note: 'All updates are recorded. Now one prefix-sum pass: the running total of diff IS the final value at each index.', panels: [dPanel({}), arr([...res], { label: 'result' }), vars({ running: 0 })] });
    let asks = 0;
    for (let i = 0; i < n; i++) {
      const next = run + diff[i];
      const p = (i === 1 || i === n - 2) && asks < 2 && n > 2 ? pick(`running = ${run}, diff[${i}] = ${fmt(diff[i])}. What is result[${i}]?`, next, [diff[i], run, next + diff[i] || next + 1], asks++ + 1) : null;
      run = next;
      res[i] = run;
      const hl = {};
      for (let k = 0; k < i; k++) hl[k] = 'done';
      frames.push({ note: `running += diff[${i}] (${fmt(diff[i])}) → ${run}. ${diff[i] === 0 ? 'No range starts or ends here, so the value carries over.' : diff[i] > 0 ? 'Net increase: a range with a positive add starts here (or a negative one ended).' : 'Net decrease: a range ended just before here (or a negative add starts).'}`, panels: [dPanel({ [i]: 'active' }, { pointers: [{ index: i, label: 'i', color: 'b' }] }), arr([...res], { label: 'result', highlights: { ...hl, [i]: 'active' } }), vars({ running: run })] });
      attach(frames, p);
    }
    frames.push({ note: `Final array: [${res.join(', ')}]. diff[${n}] is never read — it only absorbs the "stop" marks. u updates in O(u) + one O(n) pass → O(n + u) instead of O(n·u).`, panels: [dPanel({ [n]: 'muted' }), arr(res, { label: 'result', highlights: Object.fromEntries(res.map((_, i) => [i, 'done'])) }), vars({ result: `[${res.join(', ')}]` })] });
    return frames;
  },
};

export const prefixSum2d = {
  title: '2D prefix sums',
  description: 'Build P where P[r+1][c+1] = sum of the rectangle (0,0)–(r,c), then answer a rectangle query with four lookups (inclusion–exclusion). Matrix clamped to 5 × 6.',
  defaultInput: { matrix: [[3, 0, 1, 4], [5, 6, 3, 2], [1, 2, 0, 1]], query: [1, 1, 2, 3] },
  fields: [
    { key: 'matrix', type: 'json', label: 'matrix [[…], …]' },
    { key: 'query', type: 'numbers', label: 'query r1, c1, r2, c2' },
  ],
  testInputs: [{ matrix: [[7]], query: [0, 0, 0, 0] }, { matrix: [[1, 2, 3]], query: [0, 2, 0, 0] }, { matrix: [[1], [2], [3]], query: [0, 0, 2, 0] }, { matrix: [[-1, 2], [3, -4]], query: [0, 0, 1, 1] }, { matrix: [[1, 2], [3]], query: [5, 5, 9, 9] }],
  generate({ matrix, query }) {
    if (!Array.isArray(matrix) || !matrix.length || !matrix.every(Array.isArray)) throw new Error('matrix must be a list of rows, e.g. [[1, 2], [3, 4]]');
    const rows = Math.min(5, matrix.length);
    const cols = Math.max(1, Math.min(6, Math.max(...matrix.slice(0, rows).map((r) => r.length))));
    const M = Array.from({ length: rows }, (_, r) => Array.from({ length: cols }, (_, c) => {
      const v = matrix[r][c];
      return typeof v === 'number' && Number.isFinite(v) ? v : 0;
    }));
    const q = [0, 0, rows - 1, cols - 1].map((d, k) => (typeof query?.[k] === 'number' && Number.isFinite(query[k]) ? Math.floor(query[k]) : d));
    let [r1, c1, r2, c2] = [Math.max(0, Math.min(rows - 1, q[0])), Math.max(0, Math.min(cols - 1, q[1])), Math.max(0, Math.min(rows - 1, q[2])), Math.max(0, Math.min(cols - 1, q[3]))];
    if (r1 > r2) [r1, r2] = [r2, r1];
    if (c1 > c2) [c1, c2] = [c2, c1];
    const P = Array.from({ length: rows + 1 }, () => new Array(cols + 1).fill(0));
    const filled = Array.from({ length: rows + 1 }, (_, r) => new Array(cols + 1).fill(r === 0));
    for (let r = 0; r <= rows; r++) filled[r][0] = true;
    const frames = [];
    const idx = (k) => Array.from({ length: k }, (_, i) => String(i));
    const mTable = (states) => table(M.map((r) => [...r]), states || M.map((r) => r.map(() => '')), idx(rows), idx(cols), 'matrix M');
    const pTable = (states) => table(P.map((row, r) => row.map((v, c) => (filled[r][c] ? v : '·'))), states || P.map((row) => row.map(() => '')), idx(rows + 1), idx(cols + 1), 'P (extra zero row + column)');
    const blank = (h, w) => Array.from({ length: h }, () => new Array(w).fill(''));
    const padStates = () => {
      const s = blank(rows + 1, cols + 1);
      for (let c = 0; c <= cols; c++) s[0][c] = 'muted';
      for (let r = 0; r <= rows; r++) s[r][0] = 'muted';
      return s;
    };
    frames.push({ note: `P[r][c] = sum of the rectangle from (0,0) to (r−1, c−1). Row 0 and column 0 are zeros (empty rectangles), so the formula never needs bounds checks.`, panels: [mTable(), pTable(padStates())] });
    let asks = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const val = M[r][c] + P[r][c + 1] + P[r + 1][c] - P[r][c];
        const naive = M[r][c] + P[r][c + 1] + P[r + 1][c];
        const want = r > 0 && c > 0 && asks < 2 && (r * cols + c) % 3 === 1;
        const p = want ? pick(`M[${r}][${c}] = ${M[r][c]}, above P[${r}][${c + 1}] = ${P[r][c + 1]}, left P[${r + 1}][${c}] = ${P[r + 1][c]}, overlap P[${r}][${c}] = ${P[r][c]}. What is P[${r + 1}][${c + 1}]?`, val, [naive, M[r][c] + P[r][c], val + 2 * P[r][c]], asks++ + 1) : null;
        P[r + 1][c + 1] = val;
        filled[r + 1][c + 1] = true;
        const ps = padStates();
        ps[r][c + 1] = 'window';
        ps[r + 1][c] = 'window';
        ps[r][c] = 'bad';
        ps[r + 1][c + 1] = 'active';
        const ms = blank(rows, cols);
        for (let a = 0; a <= r; a++) for (let b = 0; b <= c; b++) ms[a][b] = 'visited';
        ms[r][c] = 'active';
        frames.push({ note: `P[${r + 1}][${c + 1}] = M[${r}][${c}] + above + left − overlap = ${M[r][c]} + ${P[r][c + 1]} + ${P[r + 1][c]} − ${P[r][c]} = ${val}.${r && c ? ' The overlap (red) sits inside both the above and left rectangles, so it was counted twice.' : ' On the first row/column the padding zeros make the formula work without special cases.'}`, panels: [mTable(ms), pTable(ps)] });
        attach(frames, p);
      }
    }
    const brute = M.slice(r1, r2 + 1).reduce((s, row) => s + row.slice(c1, c2 + 1).reduce((a, b) => a + b, 0), 0);
    const qStates = () => {
      const s = blank(rows, cols);
      for (let a = r1; a <= r2; a++) for (let b = c1; b <= c2; b++) s[a][b] = 'window';
      return s;
    };
    const A = P[r2 + 1][c2 + 1];
    const B = P[r1][c2 + 1];
    const C = P[r2 + 1][c1];
    const D = P[r1][c1];
    const qs = (marks) => {
      const s = padStates();
      for (const [r, c, st] of marks) s[r][c] = st;
      return s;
    };
    const qv = (extra) => vars({ query: `(${r1},${c1})–(${r2},${c2})`, ...extra });
    frames.push({ note: `Table built in O(r·c). Query: sum of rectangle (${r1},${c1})–(${r2},${c2}) using only four cells of P.`, panels: [mTable(qStates()), pTable(padStates()), qv({})] });
    frames.push({ note: `Start with the whole rectangle from (0,0) to (${r2},${c2}): P[${r2 + 1}][${c2 + 1}] = ${A}.`, panels: [mTable(qStates()), pTable(qs([[r2 + 1, c2 + 1, 'active']])), qv({ sum: A })] });
    frames.push({ note: `Subtract the strip ABOVE the query (rows 0..${r1 - 1}): P[${r1}][${c2 + 1}] = ${B}${r1 === 0 ? ' (an empty strip — zero row)' : ''}.`, panels: [mTable(qStates()), pTable(qs([[r2 + 1, c2 + 1, 'active'], [r1, c2 + 1, 'bad']])), qv({ sum: A - B })] });
    frames.push({ note: `Subtract the strip LEFT of the query (columns 0..${c1 - 1}): P[${r2 + 1}][${c1}] = ${C}${c1 === 0 ? ' (an empty strip — zero column)' : ''}.`, panels: [mTable(qStates()), pTable(qs([[r2 + 1, c2 + 1, 'active'], [r1, c2 + 1, 'bad'], [r2 + 1, c1, 'bad']])), qv({ sum: A - B - C })] });
    frames.push({ note: `The top-left corner P[${r1}][${c1}] = ${D} was inside BOTH strips, so it was subtracted twice → add it back once.`, panels: [mTable(qStates()), pTable(qs([[r2 + 1, c2 + 1, 'active'], [r1, c2 + 1, 'bad'], [r2 + 1, c1, 'bad'], [r1, c1, 'window']])), qv({ sum: A - B - C + D })] });
    attach(frames, pick(`So far: ${A} − ${B} − ${C} = ${A - B - C}. What is the last step?`, `Add back P[${r1}][${c1}] = ${D}`, [`Subtract P[${r1}][${c1}] = ${D}`, 'Nothing — that is the answer', `Add M[${r1}][${c1}] = ${M[r1][c1]}`], 2));
    const ans = A - B - C + D;
    const done = qStates().map((row) => row.map((s) => (s ? 'done' : '')));
    frames.push({ note: `Answer = ${A} − ${B} − ${C} + ${D} = ${ans} (direct sum of the highlighted cells: ${brute}). Build O(r·c) once, then every query is O(1).`, panels: [mTable(done), pTable(qs([[r2 + 1, c2 + 1, 'done'], [r1, c2 + 1, 'done'], [r2 + 1, c1, 'done'], [r1, c1, 'done']])), qv({ answer: ans })] });
    return frames;
  },
};

/* ------------------------------------------------------------------ two pointers */

const RW_MODES = ['remove duplicates (sorted)', 'move zeroes'];

export const readWritePointers = {
  title: 'Read / write pointers: compact in place',
  description: 'read scans every element; write marks where the next kept element goes. nums[0..write) is always the answer so far. Clamped to 14 numbers; duplicates mode sorts the input first.',
  defaultInput: { nums: [0, 0, 1, 1, 1, 2, 2, 3, 3, 4], mode: RW_MODES[0] },
  fields: [
    { key: 'nums', type: 'numbers', label: 'nums' },
    { key: 'mode', type: 'select', label: 'task', options: RW_MODES },
  ],
  testInputs: [{ nums: [], mode: RW_MODES[0] }, { nums: [7], mode: RW_MODES[0] }, { nums: [2, 2, 2], mode: RW_MODES[0] }, { nums: [0, 1, 0, 3, 12], mode: RW_MODES[1] }, { nums: [0, 0], mode: RW_MODES[1] }, { nums: [], mode: RW_MODES[1] }, { nums: [1, 2], mode: RW_MODES[1] }],
  generate({ nums: raw, mode }) {
    const zeroes = mode === RW_MODES[1];
    const a = nums(raw, 14);
    if (!zeroes) a.sort((x, y) => x - y);
    const n = a.length;
    const frames = [];
    let write = zeroes ? 0 : Math.min(1, n);
    const panels = (read, hl = {}) => {
      const highlights = {};
      for (let k = 0; k < write; k++) highlights[k] = 'done';
      Object.assign(highlights, hl);
      const pointers = [];
      if (write < n) pointers.push({ index: write, label: 'write', color: 'a' });
      if (read < n) pointers.push({ index: read, label: 'read', color: 'b' });
      return [arr([...a], { highlights, pointers, ...(write > 0 ? { range: [0, write - 1] } : {}) }), vars({ read: read < n ? read : 'end', write, kept: write })];
    };
    if (!n) {
      return [
        { note: 'Empty array — nothing to compact.', panels: panels(0) },
        { note: 'k = 0. O(1).', panels: panels(0) },
      ];
    }
    frames.push({
      note: zeroes
        ? 'Move zeroes: keep non-zeros in order at the front. Invariant: nums[0..write) holds the non-zeros seen so far; swapping (not copying) pushes the zeros back.'
        : 'Remove duplicates from a sorted array. nums[0] is always kept, so write = 1. Invariant: nums[0..write) holds each distinct value seen so far, once.',
      panels: panels(zeroes ? 0 : 1),
    });
    let asks = 0;
    for (let read = zeroes ? 0 : 1; read < n; read++) {
      const keep = zeroes ? a[read] !== 0 : a[read] !== a[write - 1];
      const ref = zeroes ? '0' : `${a[write - 1]} (last kept, nums[write − 1])`;
      const p = read % 2 === 0 && asks < 4 ? pick(`read = ${read} sees ${a[read]}; compare with ${ref}. Keep it?`, keep ? `Keep — ${zeroes ? 'swap into' : 'copy to'} nums[${write}], write++` : 'Skip — only read moves', keep ? ['Skip — only read moves', 'Keep — but write stays'] : [`Keep — ${zeroes ? 'swap into' : 'copy to'} nums[${write}], write++`, 'Delete it with splice'], asks++) : null;
      if (keep) {
        const w = write;
        let note;
        if (zeroes) {
          [a[w], a[read]] = [a[read], a[w]];
          note = w === read ? `${a[w]} ≠ 0 and read = write → it is already in place; write++.` : `${a[w]} ≠ 0 → swap nums[${read}] with nums[${w}] (a zero moves back), write++.`;
        } else {
          a[w] = a[read];
          note = `${a[read]} ≠ last kept ${a[w - 1]} → a new value: copy it to nums[${w}], write++.`;
        }
        write++;
        frames.push({ note, panels: panels(read, { [w]: 'active', [read]: 'active' }) });
      } else {
        frames.push({ note: zeroes ? `nums[${read}] = 0 → skip. write stays at ${write}; this slot will be filled by the next non-zero.` : `${a[read]} = last kept ${a[write - 1]} → duplicate, skip. Only read moves.`, panels: panels(read, { [read]: 'muted' }) });
      }
      attach(frames, p);
    }
    const hl = {};
    for (let k = write; k < n; k++) hl[k] = 'muted';
    for (let k = 0; k < write; k++) hl[k] = 'done';
    frames.push({ note: `read finished. k = write = ${write}: nums[0..${write}) = [${a.slice(0, write).join(', ')}]${zeroes ? ', zeros pushed to the back' : ''}. One pass, O(n) time, O(1) extra space.`, panels: [arr([...a], { highlights: hl, ...(write ? { range: [0, write - 1] } : {}) }), vars({ k: write, result: `[${a.slice(0, write).join(', ')}]` })] });
    attach(frames, pick(`read has passed the end with write = ${write}. What does the function return?`, `${write} (= write)`, [`${write - 1} (= write − 1)`, `${n} (the original length)`], 1));
    return frames;
  },
};

/* ------------------------------------------------------------------ linked list */

export const dummyHead = {
  title: 'Linked list: dummy head',
  description: 'Remove every node with value val. A dummy node D before the head gives every real node a predecessor, so deleting the head needs no special case. Clamped to 10 nodes.',
  defaultInput: { values: [6, 6, 1, 2, 6, 3], val: 6 },
  fields: [
    { key: 'values', type: 'numbers', label: 'list values' },
    { key: 'val', type: 'number', label: 'remove val' },
  ],
  testInputs: [{ values: [], val: 1 }, { values: [7, 7, 7], val: 7 }, { values: [1, 2, 3], val: 9 }, { values: [5], val: 5 }, { values: [1, 2, 2], val: 2 }],
  generate({ values, val }) {
    const vals = nums(values, 10);
    // order = nodes currently linked, starting with the dummy (id -1)
    let order = [{ id: -1, v: 'D' }, ...vals.map((v, id) => ({ id, v }))];
    let prev = 0; // position of prev in order
    const frames = [];
    const view = (opts = {}) => {
      const { bypass = null, highlights = {}, pointers } = opts;
      const values = order.map((x) => x.v);
      const next = order.map((_, i) => (i + 1 < order.length ? i + 1 : null));
      if (bypass !== null) next[bypass - 1] = bypass + 1 < order.length ? bypass + 1 : null;
      const hl = { 0: 'visited', ...highlights };
      const ptrs = pointers || [{ index: prev, label: prev === 0 ? 'prev (D)' : 'prev', color: 'a' }, ...(prev + 1 < order.length ? [{ index: prev + 1, label: 'curr', color: 'b' }] : [])];
      return { kind: 'list', values, next, highlights: hl, pointers: ptrs };
    };
    const real = () => order.slice(1).map((x) => x.v);
    frames.push({ note: `dummy D → head. prev starts at D, so the head (${vals.length ? vals[0] : 'none'}) has a predecessor like every other node. We check prev.next each step.`, panels: [view(), vars({ val, 'dummy.next': vals.length ? vals[0] : 'null' })] });
    let asks = 0;
    let removed = 0;
    const opts = ['prev.next = curr.next (unlink), prev stays', 'prev = prev.next (advance)', 'head = head.next (special head case)'];
    while (prev + 1 < order.length) {
      const curr = order[prev + 1];
      const hit = curr.v === val;
      const correct = hit ? 0 : 1;
      const p = asks < 4 && (hit || prev > 0) ? pick(`curr = ${curr.v}, val = ${val}${prev === 0 ? ' (curr is the head!)' : ''}. What happens?`, opts[correct], opts.filter((_, k) => k !== correct), asks++) : null;
      if (hit) {
        const pos = prev + 1;
        frames.push({ note: `${curr.v} = val → prev.next = curr.next. ${prev === 0 ? 'This is the HEAD, but it is handled exactly like any other node: the dummy is its prev. ' : ''}prev stays put — the new prev.next must be checked too.`, panels: [view({ bypass: pos, highlights: { [pos]: 'bad' }, pointers: [{ index: prev, label: prev === 0 ? 'prev (D)' : 'prev', color: 'a' }, { index: pos, label: 'curr', color: 'b' }] }), vars({ val, removed: removed + 1, 'dummy.next': order[pos === 1 ? 2 : 1]?.v ?? 'null' })] });
        attach(frames, p);
        order = order.filter((_, i) => i !== pos);
        removed++;
      } else {
        frames.push({ note: `${curr.v} ≠ ${val} → keep it. Advance prev = prev.next.`, panels: [view({ highlights: { [prev + 1]: 'done' } }), vars({ val, removed, 'dummy.next': order[1]?.v ?? 'null' })] });
        attach(frames, p);
        prev++;
      }
    }
    const res = real();
    const hl = {};
    for (let i = 1; i < order.length; i++) hl[i] = 'done';
    frames.push({ note: `prev.next is null → done. Return dummy.next (${res.length ? res[0] : 'null'}), not the old head: the old head may have been removed. Result: [${res.join(' → ')}]. O(n) time, O(1) space.`, panels: [view({ highlights: { 0: 'muted', ...hl }, pointers: res.length ? [{ index: 1, label: 'dummy.next', color: 'a' }] : [{ index: 0, label: 'D', color: 'a' }] }), vars({ removed, result: res.length ? res.join('→') : 'null' })] });
    if (vals.length && vals[0] === val) attach(frames, pick(`The original head (${vals[0]}) was removed. What should the function return?`, `dummy.next (${res.length ? res[0] : 'null'})`, [`head (${vals[0]}, the old head)`, 'dummy (D)'], 1));
    return frames;
  },
};

/* ------------------------------------------------------------------ stack */

const PREC = { '+': 1, '-': 1, '*': 2, '/': 2 };
const applyOp = (a, op, b) => {
  if (op === '+') return a + b;
  if (op === '-') return a - b;
  if (op === '*') return a * b;
  if (b === 0) throw new Error('division by zero');
  return Math.trunc(a / b);
};
function tokenize(expr) {
  const out = [];
  const s = String(expr ?? '');
  for (let i = 0; i < s.length; ) {
    const c = s[i];
    if (/\s/.test(c)) i++;
    else if (/\d/.test(c)) {
      let j = i;
      while (j < s.length && /\d/.test(s[j])) j++;
      out.push(s.slice(i, j));
      i = j;
    } else if ('+-*/()'.includes(c)) {
      out.push(c);
      i++;
    } else throw new Error(`unexpected character '${c}' — use digits, + − * / and parentheses`);
  }
  return out.slice(0, 24);
}

export const expressionEval = {
  title: 'Stack: evaluate an expression',
  description: 'Infix: an operand stack and an operator stack; an operator first applies every waiting operator of higher or equal precedence. Postfix (RPN, e.g. "3 4 + 2 *") needs only the operand stack. Integer division truncates.',
  defaultInput: { expr: '2 * (3 + 4) - 10 / 5' },
  fields: [{ key: 'expr', type: 'string', label: 'expression (infix or RPN)' }],
  testInputs: [{ expr: '7' }, { expr: '1 - (4 + 5 - 2) + 3' }, { expr: '3 4 + 2 *' }, { expr: '-(2 + 3) * 2' }, { expr: '8 / 3 - 7 / 2' }, { expr: '2 1 + 3 *' }, { expr: '1 + 2 * 3 - 4' }],
  generate({ expr }) {
    const toks = tokenize(expr);
    if (!toks.length) throw new Error('enter an expression, e.g. 2 * (3 + 4)');
    const isNum = (t) => /^\d+$/.test(t);
    const rpn = toks.some((t, i) => i > 0 && isNum(t) && isNum(toks[i - 1])) || (toks.length > 1 && !toks.includes('(') && isNum(toks[0]) && !isNum(toks[toks.length - 1]) && !isNum(toks[1]));
    const frames = [];
    const vals = [];
    const ops = [];
    const tokHl = (i, st = 'active') => {
      const hl = {};
      for (let k = 0; k < i; k++) hl[k] = 'visited';
      if (i >= 0 && i < toks.length) hl[i] = st;
      return hl;
    };
    const panels = (i, st, extra = {}) => [
      arr(toks, { highlights: tokHl(i, st), pointers: i >= 0 && i < toks.length ? [{ index: i, label: 'tok', color: 'b' }] : [] }),
      stack([...vals], { label: 'operands' }),
      ...(rpn ? [] : [stack([...ops], { label: 'operators' })]),
      vars({ mode: rpn ? 'RPN' : 'infix', ...extra }),
    ];
    const need = (k, at) => {
      if (vals.length < k) throw new Error(`not enough operands for '${at}' — check the expression`);
    };
    let asks = 0;
    if (rpn) {
      frames.push({ note: 'Postfix (RPN): operators come AFTER their operands, so no precedence or parentheses are needed. Numbers wait on the stack.', panels: panels(-1, 'active') });
      toks.forEach((t, i) => {
        if (t === '(' || t === ')') throw new Error('RPN has no parentheses');
        if (isNum(t)) {
          vals.push(Number(t));
          frames.push({ note: `${t} is a number → push it; it waits for its operator.`, panels: panels(i, 'active') });
          return;
        }
        need(2, t);
        const b = vals.pop();
        const a = vals.pop();
        const r = applyOp(a, t, b);
        const p = asks < 3 ? pick(`'${t}' arrives with ${a} and ${b} on top of the stack (${b} on top). What is pushed?`, `${a} ${t} ${b} = ${r}`, [`${b} ${t} ${a} = ${applyOp(b, t, a === 0 && t === '/' ? 1 : a)}`, `${a} ${t} ${b} pushed as two values`], asks++) : null;
        vals.push(r);
        frames.push({ note: `'${t}' → pop b = ${b} (the RIGHT operand, popped first), pop a = ${a}, push a ${t} b = ${r}.`, panels: panels(i, 'done', { last: `${a} ${t} ${b} = ${r}` }) });
        attach(frames, p);
      });
    } else {
      frames.push({ note: 'Infix: numbers go on the operand stack. An operator may not run yet — a later × or ÷ binds tighter — so it waits on the operator stack until something forces it.', panels: panels(-1, 'active') });
      const reduce = (i, why) => {
        const op = ops.pop();
        need(2, op);
        const b = vals.pop();
        const a = vals.pop();
        const r = applyOp(a, op, b);
        vals.push(r);
        frames.push({ note: `${why}: apply '${op}' → pop ${b} and ${a}, push ${a} ${op} ${b} = ${r}.`, panels: panels(i, 'active', { applied: `${a} ${op} ${b} = ${r}` }) });
      };
      let prevTok = null;
      toks.forEach((t, i) => {
        if (isNum(t)) {
          vals.push(Number(t));
          frames.push({ note: `${t} → push onto operands.`, panels: panels(i, 'active') });
        } else if (t === '(') {
          ops.push('(');
          frames.push({ note: `'(' → push it as a wall: operators inside must not combine with those outside until ')' arrives.`, panels: panels(i, 'active') });
        } else if (t === ')') {
          if (!ops.includes('(')) throw new Error("unmatched ')'");
          let first = true;
          while (ops[ops.length - 1] !== '(') {
            const p = first && asks < 4 ? pick(`')' arrives; the operator stack top is '${ops[ops.length - 1]}'. What happens?`, `Apply '${ops[ops.length - 1]}' (finish the inside first)`, [`Push ')' onto the operator stack`, `Pop '(' immediately and continue`], asks++) : null;
            reduce(i, `')' closes the group`);
            attach(frames, p);
            first = false;
          }
          ops.pop();
          frames.push({ note: `Reached '(' → pop it. The whole group is now a single value on the operand stack.`, panels: panels(i, 'done') });
        } else {
          const unary = t === '-' && (prevTok === null || prevTok === '(');
          if (!unary && (prevTok === null || prevTok in PREC || prevTok === '(')) throw new Error(`operator '${t}' is missing its left operand`);
          if (unary) {
            vals.push(0);
            frames.push({ note: `'-' with no left operand is a unary minus → treat it as 0 − (…): push 0.`, panels: panels(i, 'active') });
          }
          let first = true;
          while (ops.length && ops[ops.length - 1] !== '(' && PREC[ops[ops.length - 1]] >= PREC[t]) {
            const top = ops[ops.length - 1];
            const p = first && asks < 4 ? pick(`'${t}' arrives; the operator stack top is '${top}'. What happens?`, `Apply '${top}' first (precedence ≥ '${t}')`, [`Push '${t}' on top of '${top}'`, `Apply '${t}' immediately`], asks++ + 1) : null;
            reduce(i, `'${t}' arrives and '${top}' has ${PREC[top] > PREC[t] ? 'higher' : 'equal (left-to-right)'} precedence`);
            attach(frames, p);
            first = false;
          }
          const p = first && ops.length && ops[ops.length - 1] !== '(' && asks < 4 ? pick(`'${t}' arrives; the operator stack top is '${ops[ops.length - 1]}'. What happens?`, `Push '${t}' (it binds tighter, so it must run first)`, [`Apply '${ops[ops.length - 1]}' first`, `Apply '${t}' immediately`], asks++) : null;
          ops.push(t);
          const why = first && ops.length > 1 && ops[ops.length - 2] !== '(' ? ` It binds tighter than '${ops[ops.length - 2]}', so it waits on top.` : '';
          frames.push({ note: `Push '${t}'. Its right operand has not been read yet.${why}`, panels: panels(i, 'active') });
          attach(frames, p);
        }
        prevTok = t;
      });
      if (ops.includes('(')) throw new Error("unmatched '('");
      while (ops.length) reduce(toks.length, 'End of input');
    }
    if (vals.length !== 1) throw new Error('malformed expression — operands and operators do not match up');
    frames.push({ note: `Result = ${vals[0]}. Every token is pushed and popped at most once → O(n) time, O(n) stack space.`, panels: [arr(toks, { highlights: Object.fromEntries(toks.map((_, k) => [k, 'done'])) }), stack([...vals], { label: 'operands' }), vars({ mode: rpn ? 'RPN' : 'infix', result: vals[0] })] });
    return frames;
  },
};

/* ------------------------------------------------------------------ queue / deque */

export const circularBuffer = {
  title: 'Circular buffer (ring queue)',
  description: 'A fixed array plus head and count. The back slot is (head + count) % cap; indices wrap to 0 instead of shifting. Ops: "push x", "pop", "front", "rear". cap ≤ 8, up to 20 ops.',
  defaultInput: { capacity: 4, ops: ['push 1', 'push 2', 'push 3', 'pop', 'push 4', 'push 5', 'push 6', 'pop', 'pop', 'push 7', 'rear', 'pop'] },
  fields: [
    { key: 'capacity', type: 'number', label: 'capacity' },
    { key: 'ops', type: 'strings', label: 'operations' },
  ],
  testInputs: [{ capacity: 1, ops: ['pop', 'push 1', 'push 2', 'front', 'pop', 'pop'] }, { capacity: 3, ops: [] }, { capacity: 2, ops: ['push 1', 'push 2', 'pop', 'push 3', 'pop', 'push 4', 'pop', 'push 5', 'rear'] }, { capacity: 0, ops: ['push 9'] }],
  generate({ capacity, ops: rawOps }) {
    const cap = Math.max(1, Math.min(8, Math.floor(Number(capacity) || 0)));
    const ops = (Array.isArray(rawOps) ? rawOps : []).slice(0, 20).map((o) => {
      const m = String(o).trim().toLowerCase().match(/^(push|enqueue)\s+(-?\d+(?:\.\d+)?)$|^(pop|dequeue|front|rear)$/);
      if (!m) throw new Error(`unknown operation "${o}" — use "push x", "pop", "front" or "rear"`);
      return m[1] ? { op: 'push', x: Number(m[2]) } : { op: m[3] === 'dequeue' ? 'pop' : m[3] };
    });
    const buf = new Array(cap).fill(null);
    const live = new Array(cap).fill(false);
    let head = 0;
    let count = 0;
    const tail = () => (head + count) % cap;
    const logical = () => Array.from({ length: count }, (_, k) => buf[(head + k) % cap]);
    const frames = [];
    const panels = (hl = {}) => {
      const highlights = {};
      for (let i = 0; i < cap; i++) highlights[i] = live[i] ? 'window' : 'muted';
      Object.assign(highlights, hl);
      return [
        arr(buf.map((v) => (v === null ? '·' : v)), { label: `buffer (cap ${cap})`, highlights, pointers: [{ index: head, label: 'head', color: 'a' }, { index: tail(), label: 'tail', color: 'b' }] }),
        queue(logical(), 'logical queue (front → back)'),
        vars({ head, count, tail: tail(), state: count === cap ? 'FULL' : count === 0 ? 'EMPTY' : 'ok' }),
      ];
    };
    frames.push({ note: `cap = ${cap}, head = 0, count = 0. head and tail coincide both when EMPTY and when FULL — count is what tells them apart.`, panels: panels() });
    let asks = 0;
    let wrapAsked = false;
    ops.forEach(({ op, x }) => {
      let p = null;
      if (op === 'push') {
        if (count === cap) {
          if (asks < 4) p = pick(`push ${x}: head = ${head}, count = ${count} = cap. What happens?`, 'Rejected — the buffer is full', [`Write at index ${tail()} and overwrite the front`, 'Grow the array'], asks++);
          frames.push({ note: `push ${x}: count = cap = ${cap} → FULL, reject (return false). tail = head here, but count says full, not empty.`, panels: panels({ [tail()]: 'bad' }) });
        } else {
          const t = tail();
          const wraps = head + count >= cap;
          if (wraps && !wrapAsked) {
            p = pick(`push ${x}: head = ${head}, count = ${count}, cap = ${cap}. Which index receives ${x}?`, t, [head + count, cap - 1, head], 1);
            wrapAsked = true;
            asks++;
          } else if (!wraps && asks < 1 && count > 0) p = pick(`push ${x}: head = ${head}, count = ${count}. Which index receives ${x}?`, t, [head, t + 1, count - 1].filter((v) => v >= 0), asks++);
          buf[t] = x;
          live[t] = true;
          count++;
          frames.push({ note: `push ${x} → slot (head + count) % cap = (${head} + ${count - 1}) % ${cap} = ${t}${wraps ? ' — wrapped around to reuse a freed slot at the front of the array' : ''}. count = ${count}${count === cap ? ' → now FULL' : ''}.`, panels: panels({ [t]: 'active' }) });
        }
      } else if (op === 'pop') {
        if (count === 0) {
          frames.push({ note: 'pop: count = 0 → EMPTY, nothing to remove (return false).', panels: panels({ [head]: 'bad' }) });
        } else {
          const h = head;
          const nh = (head + 1) % cap;
          if (asks < 4 && (nh === 0 || asks < 2)) p = pick(`pop: head = ${h}, cap = ${cap}. Where does head move?`, `${nh} (= (head + 1) % cap)`, [nh === 0 ? `${h + 1} (head + 1, past the end)` : null, `${h} (head stays; elements shift left)`, nh !== 0 ? '0 (always back to the start)' : null].filter(Boolean), asks++ + 2);
          const v = buf[h];
          live[h] = false;
          head = nh;
          count--;
          frames.push({ note: `pop → remove ${v} at head ${h}; head = (${h} + 1) % ${cap} = ${head}${nh === 0 && h === cap - 1 ? ' (wrapped!)' : ''}. Nothing shifts; the old value stays in the array but is outside the live region.`, panels: panels({ [h]: 'bad' }) });
        }
      } else {
        const idx = op === 'front' ? head : (head + count - 1) % cap;
        if (count === 0) frames.push({ note: `${op}: the queue is empty → return −1.`, panels: panels() });
        else frames.push({ note: op === 'front' ? `front → buf[head] = buf[${head}] = ${buf[idx]}.` : `rear → buf[(head + count − 1) % cap] = buf[(${head} + ${count - 1}) % ${cap}] = buf[${idx}] = ${buf[idx]}.`, panels: panels({ [idx]: 'done' }) });
      }
      attach(frames, p);
    });
    frames.push({ note: `Final queue (front → back): [${logical().join(', ')}]. Every operation is a couple of index calculations → O(1) time, O(cap) memory, nothing ever shifts.`, panels: panels() });
    return frames;
  },
};
