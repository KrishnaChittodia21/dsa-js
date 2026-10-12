export default {
  signals: [
    'swapping two neighbouring items changes the cost in a way you can compare → a sort key exists',
    '"assign / match items from two lists" (cookies to children, people to boats)',
    '"remove k digits / characters to get the smallest result"',
    '"split the string so each letter appears in at most one part"',
    'n up to 10^5–10^6 with an optimisation goal and no small state to memoise',
    'a yes/no check "can we do it with X?" is easy to answer greedily',
  ],
  tricks: [
    {
      title: 'Find the sort key by comparing two neighbours',
      kind: 'recognition',
      md: "Take any two adjacent items a and b in a schedule and write the cost of “a then b” versus “b then a”. Everything before and after them is unchanged, so whichever order is cheaper tells you the comparator. Cross-multiply instead of dividing, so the comparator stays in exact integer arithmetic (no floating-point ties).",
      code: `// Jobs {t: time, w: weight}; minimise the sum of w × finish time.
// a before b is better iff a.t * b.w < b.t * a.w
const order = (jobs) => jobs.toSorted((a, b) => a.t * b.w - b.t * a.w);
const cost = (jobs) => { let time = 0, s = 0; for (const j of jobs) { time += j.t; s += j.w * time; } return s; };
const jobs = [{ t: 3, w: 1 }, { t: 1, w: 2 }, { t: 2, w: 2 }];
console.log(cost(order(jobs))); // → 14`,
    },
    {
      title: 'Stress-test the greedy against brute force',
      kind: 'edge-cases',
      md: "A greedy that passes the examples can still be wrong. Write a tiny brute force or DP, generate hundreds of random SMALL inputs, and compare. The first mismatch is a concrete counter-example you can study (or show the interviewer as proof you checked). Five minutes of this beats an hour of debugging a wrong idea.",
      code: `const greedyCoins = ([coins, amt]) => { let n = 0; for (const c of coins.toSorted((a, b) => b - a)) { n += Math.floor(amt / c); amt %= c; } return n; };
const dpCoins = ([coins, amt]) => { const d = Array(amt + 1).fill(Infinity); d[0] = 0;
  for (let a = 1; a <= amt; a++) for (const c of coins) if (c <= a) d[a] = Math.min(d[a], d[a - c] + 1); return d[amt]; };
function findCounterExample(runs = 2000) {
  for (let r = 0; r < runs; r++) {
    const input = [[1, 2 + Math.floor(Math.random() * 5), 3 + Math.floor(Math.random() * 6)], Math.floor(Math.random() * 30)];
    if (greedyCoins(input) !== dpCoins(input)) return input;
  }
  return null;
}
console.log(findCounterExample() !== null); // → true`,
    },
    {
      title: 'Pair the heaviest with the lightest',
      kind: 'template',
      md: "For “boats with capacity, at most two people” and similar pairing problems, sort and use two pointers. The heaviest person must go in some boat; the best partner for them is the lightest person (if even the lightest does not fit, nobody does). Either way the heaviest leaves, so each step makes the safe choice and the scan is O(n) after sorting.",
      code: `function numRescueBoats(people, limit) {
  const p = people.toSorted((a, b) => a - b);
  let i = 0, j = p.length - 1, boats = 0;
  while (i <= j) {
    if (p[i] + p[j] <= limit) i++; // lightest joins the heaviest
    j--; boats++;
  }
  return boats;
}
console.log(numRescueBoats([3, 2, 2, 1], 3)); // → 3`,
    },
    {
      title: 'Smallest result after removing k → monotonic stack',
      kind: 'template',
      md: "For “remove k digits to make the smallest number” (or “smallest subsequence of distinct characters”), scan left to right and pop the previous digit while it is larger than the current one and removals remain. A smaller digit in an earlier position always beats anything later, so popping is safe. If removals are left at the end, cut them from the tail; strip leading zeros.",
      code: `function removeKdigits(num, k) {
  const st = [];
  for (const d of num) {
    while (k > 0 && st.length && st[st.length - 1] > d) { st.pop(); k--; }
    st.push(d);
  }
  st.length -= k; // still have removals → drop from the end
  return st.join('').replace(/^0+/, '') || '0';
}
console.log(removeKdigits('1432219', 3)); // → 1219`,
    },
    {
      title: 'Partition with a "last occurrence" table',
      kind: 'template',
      md: "When each letter (or value) must stay inside one part, precompute the last index of every letter. Scan and extend the current part’s end to the furthest last-occurrence seen; when the index reaches that end, nothing inside the part appears later, so you can safely cut. One pass, O(n) time, O(alphabet) space.",
      code: `function partitionLabels(s) {
  const last = {};
  for (let i = 0; i < s.length; i++) last[s[i]] = i;
  const sizes = [];
  let start = 0, end = 0;
  for (let i = 0; i < s.length; i++) {
    end = Math.max(end, last[s[i]]);
    if (i === end) { sizes.push(end - start + 1); start = i + 1; }
  }
  return sizes;
}
console.log(partitionLabels('ababcbacadefegdehijhklij')); // → [9,7,8]`,
    },
    {
      title: 'Tie-breaks in the sort key are part of the proof',
      kind: 'edge-cases',
      md: "Many greedy solutions are correct only with a specific tie rule. In “queue reconstruction by height” you sort by height DESCENDING and, for equal heights, by k ASCENDING, then insert each person at index k: taller people already placed are unaffected by shorter ones, and equal heights must enter left to right. Flip the tie rule and the answer is wrong. Always state the secondary key out loud.",
      code: `function reconstructQueue(people) {
  const sorted = people.toSorted((a, b) => b[0] - a[0] || a[1] - b[1]);
  const q = [];
  for (const p of sorted) q.splice(p[1], 0, p); // exactly p[1] taller-or-equal people before p
  return q;
}
console.log(reconstructQueue([[7, 0], [4, 4], [7, 1], [5, 0], [6, 1], [5, 2]])); // → [[5,0],[7,0],[5,2],[6,1],[4,4],[7,1]]`,
    },
    {
      title: 'Greedy check + binary search on the answer',
      kind: 'recognition',
      md: "Some problems are hard to solve greedily directly but easy to CHECK greedily: “can we ship within D days with capacity C?” is a simple left-to-right packing. If feasibility is monotonic in the parameter (bigger capacity never hurts), binary search the parameter and use the greedy as the check. Look for “minimise the maximum” or “maximise the minimum”.",
    },
    {
      title: 'Say the exchange argument as a three-line script',
      kind: 'interview',
      md: "Interviewers rarely want a formal proof, but they want to hear one. Use this script: “Take any optimal solution. Look at the FIRST place where it differs from mine. Swapping in my choice keeps it valid and not worse. Repeating this turns the optimal solution into mine, so mine is optimal.” Picking the first difference is what makes the argument finish.",
    },
    {
      title: 'Prefer integer keys over ratios',
      kind: 'javascript',
      md: "Sorting by `value / weight` or `time / weight` uses floating-point division, and two equal ratios like 1/3 and 2/6 can compare unequal after rounding, which may break tie rules. Compare `a.v * b.w - b.v * a.w` instead: exact for integers below about 9·10^15 (product must stay under 2^53), otherwise switch to BigInt.",
      code: `console.log(0.1 * 3 === 0.3); // → false
const cmp = (a, b) => a.v * b.w - b.v * a.w; // compare a.v/a.w with b.v/b.w exactly
console.log(cmp({ v: 1, w: 3 }, { v: 2, w: 6 })); // → 0`,
    },
  ],
  traps: [
    {
      looksLike: '0/1 knapsack by best value-per-weight first',
      actually: 'DP over capacity',
      why: 'the ratio greedy is only optimal for FRACTIONAL knapsack; with whole items it can leave unusable space',
    },
    {
      looksLike: 'Activity selection by shortest duration',
      actually: 'Sort by earliest END',
      why: 'a short interval can straddle two longer ones that could both be kept, e.g. [1,5], [4,7], [6,10]',
    },
    {
      looksLike: 'Remove k digits by deleting the k largest digits',
      actually: 'Monotonic stack (remove a digit larger than the next one)',
      why: 'position matters more than size: "1432219", k = 3 → removing 4, 3, 9 gives 1221, the stack gives 1219',
    },
    {
      looksLike: 'Minimum jumps with DP over every reachable index (O(n²))',
      actually: 'Greedy BFS over reach windows (O(n))',
      why: 'all indices inside the current window cost the same number of jumps, so only the furthest reach matters',
    },
  ],
  sources: [
    { label: 'MDN — Array.prototype.sort()', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort' },
  ],
};
