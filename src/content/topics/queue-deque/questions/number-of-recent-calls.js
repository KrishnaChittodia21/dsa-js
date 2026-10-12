// 10^4 pings with gaps of 1–2 ms; expected counts from a two-pointer scan over all timestamps.
const bigPingOps = () => {
  let s = 13; const rnd = (m) => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) >>> 8) % m;
  const ops = ['RecentCounter'], args = [[]], expected = [null], ts = [];
  let t = 1, lo = 0;
  for (let i = 0; i < 10000; i++) {
    t += 1 + rnd(2);
    ts.push(t);
    while (ts[lo] < t - 3000) lo++;
    ops.push('ping'); args.push([t]); expected.push(ts.length - lo);
  }
  return { ops, args, expected };
};

export default {
  id: 'number-of-recent-calls',
  title: 'Number of Recent Calls',
  difficulty: 'Easy',
  order: 1,
  pattern: 'queue-simulation',
  kind: 'design',
  tags: ['queue', 'design', 'data stream'],
  source: { platform: 'LeetCode', number: 933, url: 'https://leetcode.com/problems/number-of-recent-calls/' },

  statement: `Build a \`RecentCounter\` that counts requests in a sliding time frame.

- \`ping(t)\` records a new request at time \`t\` (milliseconds) and returns how many requests happened in the inclusive range \`[t − 3000, t]\`, including this one.

Every call uses a strictly larger \`t\` than the previous call.`,
  examples: [
    { input: '["RecentCounter","ping","ping","ping","ping"]\n[[],[1],[100],[3001],[3002]]', output: '[null,1,2,3,3]', explanation: 'At t = 3002 the range is [2, 3002], so the request at t = 1 no longer counts.' },
  ],
  constraints: ['1 <= t <= 10^9', 't is strictly increasing', 'At most 10^4 calls'],

  think: `- Once a request is older than t − 3000, can it ever count again for a later ping?
- Which requests expire first — the oldest or the newest?`,
  patternChallenge: {
    options: ['Stack', 'Binary search over all timestamps', 'Hash map', 'Queue of timestamps'],
    answer: 3,
    explanation: 'Timestamps arrive in increasing order and the OLDEST expires first — FIFO. A queue lets you drop expired requests from the front in O(1). Binary search also works (O(log n)) but keeps everything forever.',
  },
  hints: [
    'Enqueue t on every ping.',
    'Then dequeue from the front while front < t − 3000. The queue size is the answer.',
  ],
  approach: `**Brute force:** store every timestamp and count those in range on each ping → O(n) per call.

**Queue (amortized O(1)):** because t only grows, an expired timestamp never becomes valid again. Push t, pop the front while it is older than \`t − 3000\`, return the size. Each timestamp is enqueued once and dequeued once. The queue never holds more than ~3001 items.`,

  className: 'RecentCounter',
  starterCode: `class RecentCounter {
  constructor() {
    
  }

  /**
   * @param {number} t
   * @return {number}
   */
  ping(t) {
    
  }
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'At t = 3002 the range is [2, 3002], so the request at t = 1 no longer counts.', ops: ['RecentCounter', 'ping', 'ping', 'ping', 'ping'], args: [[], [1], [100], [3001], [3002]], expected: [null, 1, 2, 3, 3] },
    { scenario: 'Single ping', hint: 'The current request always counts, so the first answer is 1.', ops: ['RecentCounter', 'ping'], args: [[], [5]], expected: [null, 1] },
    { scenario: 'Far apart pings', hint: 'The second ping is long after the first; only itself counts.', ops: ['RecentCounter', 'ping', 'ping'], args: [[], [1], [10000]], expected: [null, 1, 1] },
    { scenario: 'Exactly 3000 ms earlier', hint: 'A request at exactly t − 3000 is inside the inclusive range — expire with <, not <=.', ops: ['RecentCounter', 'ping', 'ping', 'ping'], args: [[], [1000], [4000], [4001]], expected: [null, 1, 2, 2] },
    { scenario: 'Burst then one late ping', hint: 'A late ping expires several old requests at once — keep removing from the front in a loop.', ops: ['RecentCounter', 'ping', 'ping', 'ping', 'ping', 'ping'], args: [[], [1], [2], [3], [4], [3004]], expected: [null, 1, 2, 3, 4, 2] },
    { scenario: 'Partial expiry', hint: 'Only the requests older than t − 3000 leave the window.', ops: ['RecentCounter', 'ping', 'ping', 'ping'], args: [[], [642], [1849], [4921]], expected: [null, 1, 2, 1] },
    { scenario: 'Consecutive milliseconds', hint: 'Many pings 1 ms apart all stay inside the window.', ops: ['RecentCounter', 'ping', 'ping', 'ping', 'ping', 'ping', 'ping', 'ping', 'ping'], args: [[], [1], [2], [3], [4], [5], [6], [7], [8]], expected: [null, 1, 2, 3, 4, 5, 6, 7, 8] },
    { scenario: 'Large timestamps', hint: 'Times near 10^9 behave the same as small ones.', ops: ['RecentCounter', 'ping', 'ping', 'ping', 'ping', 'ping'], args: [[], [999990000], [999992000], [999993000], [999995001], [1000000000]], expected: [null, 1, 2, 3, 2, 1] },
    { scenario: 'Window boundary repeatedly', hint: 'Each ping is exactly 3000 ms after the previous — two requests count every time.', ops: ['RecentCounter', 'ping', 'ping', 'ping', 'ping', 'ping'], args: [[], [1], [3001], [6001], [9001], [12001]], expected: [null, 1, 2, 2, 2, 2] },
    { scenario: 'Just outside the window', hint: '3001 ms apart: the previous request has just expired.', ops: ['RecentCounter', 'ping', 'ping', 'ping'], args: [[], [10], [3011], [6012]], expected: [null, 1, 1, 1] },
    { scenario: 'Many random pings', hint: 'A long series with random gaps; counts rise and fall as requests expire.', ops: ['RecentCounter', 'ping', 'ping', 'ping', 'ping', 'ping', 'ping', 'ping', 'ping', 'ping', 'ping', 'ping', 'ping', 'ping', 'ping', 'ping', 'ping', 'ping', 'ping', 'ping', 'ping', 'ping', 'ping', 'ping', 'ping', 'ping', 'ping', 'ping', 'ping', 'ping', 'ping', 'ping', 'ping', 'ping', 'ping', 'ping', 'ping', 'ping', 'ping', 'ping', 'ping', 'ping', 'ping', 'ping', 'ping', 'ping', 'ping', 'ping', 'ping', 'ping', 'ping', 'ping', 'ping', 'ping', 'ping', 'ping', 'ping', 'ping', 'ping', 'ping', 'ping', 'ping', 'ping', 'ping', 'ping', 'ping', 'ping', 'ping', 'ping', 'ping', 'ping', 'ping', 'ping', 'ping', 'ping', 'ping', 'ping', 'ping', 'ping', 'ping', 'ping'], args: [[], [11], [220], [285], [334], [511], [512], [657], [994], [1139], [1348], [1669], [1910], [2103], [2248], [2601], [2634], [2811], [2876], [3085], [3118], [3183], [3552], [3889], [3938], [4083], [4340], [4501], [4502], [4855], [4888], [5273], [5322], [5515], [5660], [5757], [5982], [6335], [6544], [6689], [6978], [7363], [7540], [7541], [7830], [8135], [8152], [8505], [8714], [8955], [9004], [9037], [9246], [9295], [9520], [9825], [9938], [10227], [10548], [10933], [10982], [11303], [11320], [11481], [11642], [11803], [12044], [12109], [12270], [12527], [12640], [12801], [13122], [13171], [13204], [13294], [13387], [13676], [13805], [14094], [14175]], expected: [null, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 18, 19, 20, 16, 16, 17, 17, 17, 17, 18, 18, 19, 17, 18, 19, 18, 19, 18, 16, 17, 17, 16, 15, 14, 15, 16, 15, 16, 15, 14, 14, 14, 15, 16, 17, 17, 16, 17, 17, 15, 15, 16, 15, 16, 17, 17, 17, 15, 16, 16, 15, 16, 17, 16, 17, 18, 18, 19, 19, 20, 19, 20] },
    { scenario: 'Max calls (10^4 pings)', hint: 'The largest allowed run: about 2000 requests stay inside every 3000 ms window. Drop expired timestamps from the front as t grows.', opsGen: String(bigPingOps) },
  ],
  solution: {
    code: `class RecentCounter {
  constructor() {
    this.q = new Queue();          // toolkit Queue: O(1) dequeue (no shift)
  }
  ping(t) {
    this.q.enqueue(t);
    while (this.q.front() < t - 3000) this.q.dequeue(); // expired from the front
    return this.q.size();
  }
}`,
  },
  dryRun: {
    columns: ['ping', 'queue after', 'answer'],
    rows: [
      ['1', '[1]', '1'],
      ['100', '[1,100]', '2'],
      ['3001', '[1,100,3001]', '3 (1 ≥ 1 still in range)'],
      ['3002', '[100,3001,3002]', '3 (1 < 2 expired)'],
    ],
  },
  complexity: { time: 'Amortized O(1) per ping', space: 'O(W) where W ≤ 3001 requests in the window', explanation: 'Each timestamp enters and leaves the queue once.' },
  alternative: {
    title: 'Array + binary search',
    md: 'Append every t to an array and binary search for the first timestamp ≥ t − 3000; answer = length − index. O(log n) per ping but memory grows forever.',
    complexity: 'O(log n) per ping, O(n) space',
  },
  mistakes: [
    'Using `<=` instead of `<` — a request at exactly t − 3000 still counts.',
    'Using arr.shift() for expiry (fine for tiny inputs, O(n) in general).',
  ],
};
