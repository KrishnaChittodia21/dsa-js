const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
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

export const dpCoinChange = {
  title: 'DP: coin change (fewest coins)',
  description: 'dp[a] = fewest coins to make amount a = 1 + min over coins of dp[a − coin].',
  defaultInput: { coins: [1, 3, 4], amount: 6 },
  fields: [
    { key: 'coins', type: 'numbers', label: 'coins' },
    { key: 'amount', type: 'number', label: 'amount' },
  ],
  generate({ coins, amount }) {
    amount = Math.min(Math.max(0, amount), 30);
    const dp = new Array(amount + 1).fill(Infinity);
    dp[0] = 0;
    const frames = [];
    const fmt = () => dp.map((v) => (v === Infinity ? '∞' : v));
    frames.push({ note: 'dp[0] = 0: zero coins make amount 0. Every other amount starts as ∞ (unknown / impossible).', panels: [arr(fmt(), { label: 'dp[amount]', highlights: { 0: 'done' }, showIndices: true })] });
    for (let a = 1; a <= amount; a++) {
      const tries = [];
      const hl = { [a]: 'active' };
      for (const c of coins) {
        if (c <= a && dp[a - c] !== Infinity) {
          tries.push(`coin ${c}: dp[${a - c}] + 1 = ${dp[a - c] + 1}`);
          hl[a - c] = 'visited';
          dp[a] = Math.min(dp[a], dp[a - c] + 1);
        }
      }
      frames.push({ note: `dp[${a}]: ${tries.length ? tries.join(' · ') : 'no coin fits'} → ${dp[a] === Infinity ? '∞' : dp[a]}.`, panels: [arr(fmt(), { label: 'dp[amount]', highlights: hl, showIndices: true })] });
      if (a % 2 === 0 && a <= 8) {
        const v = dp[a];
        const fin = v !== Infinity;
        attach(frames, pick(`coins = [${coins.join(', ')}]. dp[${a}] = 1 + min over coins of dp[${a} − coin]. What is dp[${a}]?`, fin ? v : '∞', fin ? [v + 1, v > 1 ? v - 1 : v + 2, '∞'] : [1, 2, 3], a / 2));
      }
    }
    frames.push({ note: `Answer dp[${amount}] = ${dp[amount] === Infinity ? -1 : dp[amount]}. Greedy (largest coin first) would pick 4+1+1 = 3 coins for 6; DP finds 3+3 = 2. O(amount × coins).`, panels: [arr(fmt(), { label: 'dp[amount]', highlights: { [amount]: 'done' }, showIndices: true })] });
    return frames;
  },
};

export const dpLcs = {
  title: 'DP: longest common subsequence',
  description: 'dp[i][j] = LCS of a[0..i) and b[0..j). Match → diagonal + 1, else max(up, left).',
  defaultInput: { a: 'ABCBDAB', b: 'BDCAB' },
  fields: [
    { key: 'a', type: 'string', label: 'a' },
    { key: 'b', type: 'string', label: 'b' },
  ],
  generate({ a, b }) {
    a = a.slice(0, 9);
    b = b.slice(0, 9);
    const m = a.length;
    const n = b.length;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    const shown = Array.from({ length: m + 1 }, (_, i) => new Array(n + 1).fill(null).map((_, j) => (i === 0 || j === 0 ? 0 : '')));
    const frames = [];
    const rowLabels = ['∅', ...a];
    const colLabels = ['∅', ...b];
    const baseStates = () => shown.map((row, i) => row.map((v, j) => (i === 0 || j === 0 ? 'muted' : v === '' ? '' : 'visited')));
    frames.push({ note: 'Row 0 and column 0 are 0: the LCS with an empty string is empty.', panels: [table(shown.map((r) => [...r]), baseStates(), rowLabels, colLabels)] });
    let matchAsks = 0;
    let missAsks = 0;
    const lOpts = ['Diagonal + 1 (the characters match)', 'max(up, left) (skip one character)'];
    for (let i = 1; i <= m; i++)
      for (let j = 1; j <= n; j++) {
        const st = baseStates();
        let note;
        if (a[i - 1] === b[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
          st[i - 1][j - 1] = 'done';
          note = `a[${i - 1}] = b[${j - 1}] = '${a[i - 1]}' → match: dp[${i}][${j}] = diagonal + 1 = ${dp[i][j]}.`;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
          st[i - 1][j] = 'done';
          st[i][j - 1] = 'done';
          note = `'${a[i - 1]}' ≠ '${b[j - 1]}' → skip one character: max(up ${dp[i - 1][j]}, left ${dp[i][j - 1]}) = ${dp[i][j]}.`;
        }
        shown[i][j] = dp[i][j];
        st[i][j] = 'active';
        frames.push({ note, panels: [table(shown.map((r) => [...r]), st, rowLabels, colLabels)] });
        const match = a[i - 1] === b[j - 1];
        if (match ? matchAsks < 2 : missAsks < 2) {
          if (match) matchAsks++;
          else missAsks++;
          attach(frames, pick(`Cell dp[${i}][${j}]: a[${i - 1}] = '${a[i - 1]}', b[${j - 1}] = '${b[j - 1]}'. How is it computed?`, lOpts[match ? 0 : 1], [lOpts[match ? 1 : 0]], matchAsks + missAsks));
        }
      }
    frames.push({ note: `LCS length = dp[${m}][${n}] = ${dp[m][n]}. Table size (m+1)×(n+1) → O(m·n) time and space.`, panels: [table(shown, baseStates().map((r, i) => r.map((s, j) => (i === m && j === n ? 'done' : s))), rowLabels, colLabels)] });
    return frames;
  },
};

export const dpKnapsack = {
  title: 'DP: 0/1 knapsack',
  description: 'dp[i][c] = best value using the first i items with capacity c: skip item i or take it once.',
  defaultInput: { weights: [1, 3, 4, 5], values: [1, 4, 5, 7], capacity: 7 },
  fields: [
    { key: 'weights', type: 'numbers', label: 'weights' },
    { key: 'values', type: 'numbers', label: 'values' },
    { key: 'capacity', type: 'number', label: 'capacity' },
  ],
  generate({ weights, values, capacity }) {
    const n = Math.min(weights.length, values.length, 6);
    capacity = Math.min(capacity, 12);
    const dp = Array.from({ length: n + 1 }, () => new Array(capacity + 1).fill(0));
    const frames = [];
    const rowLabels = ['none', ...weights.slice(0, n).map((w, i) => `#${i + 1} (w${w}, v${values[i]})`)];
    const colLabels = Array.from({ length: capacity + 1 }, (_, c) => String(c));
    const shown = dp.map((r, i) => r.map((v) => (i === 0 ? 0 : '')));
    const base = () => shown.map((row, i) => row.map((v) => (i === 0 ? 'muted' : v === '' ? '' : 'visited')));
    frames.push({ note: 'Row 0: with no items the best value is 0 for every capacity.', panels: [table(shown.map((r) => [...r]), base(), rowLabels, colLabels)] });
    let asks = 0;
    const kOpts = ['Take it', 'Skip it'];
    for (let i = 1; i <= n; i++) {
      const w = weights[i - 1];
      const v = values[i - 1];
      for (let c = 0; c <= capacity; c++) {
        const st = base();
        const skip = dp[i - 1][c];
        st[i - 1][c] = 'done';
        let note = `Item #${i} (w=${w}, v=${v}), capacity ${c}: skip → ${skip}`;
        dp[i][c] = skip;
        if (w <= c) {
          const take = dp[i - 1][c - w] + v;
          st[i - 1][c - w] = 'done';
          note += `, take → dp[${i - 1}][${c - w}] + ${v} = ${take}`;
          dp[i][c] = Math.max(skip, take);
        } else note += ' (too heavy to take)';
        note += ` → ${dp[i][c]}.`;
        shown[i][c] = dp[i][c];
        st[i][c] = 'active';
        if (c === capacity || w <= c) {
          frames.push({ note, panels: [table(shown.map((r) => [...r]), st, rowLabels, colLabels)] });
          if (i >= 2 && c === capacity && w <= c && asks < 3) {
            const take = dp[i - 1][c - w] + v;
            if (take !== skip) {
              attach(frames, pick(`Item #${i} (w=${w}, v=${v}) at capacity ${c}: skip → dp[${i - 1}][${c}] = ${skip}; take → dp[${i - 1}][${c - w}] + ${v} = ${dp[i - 1][c - w]} + ${v}. Skip or take?`, kOpts[take > skip ? 0 : 1], [kOpts[take > skip ? 1 : 0]], asks + 1));
              asks++;
            }
          }
        }
      }
    }
    frames.push({ note: `Best value = dp[${n}][${capacity}] = ${dp[n][capacity]}. Each item is used at most once because "take" reads from the PREVIOUS row. O(n × capacity).`, panels: [table(shown, base(), rowLabels, colLabels)] });
    return frames;
  },
};
