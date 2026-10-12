export default {
  id: 'corporate-flight-bookings',
  title: 'Corporate Flight Bookings',
  difficulty: 'Medium',
  order: 6,
  pattern: 'difference-array',
  tags: ['array', 'prefix sum', 'difference array'],
  source: { platform: 'LeetCode', number: 1109, url: 'https://leetcode.com/problems/corporate-flight-bookings/' },

  statement: `There are \`n\` flights labelled \`1\` to \`n\`. Each booking \`[first, last, seats]\` reserves \`seats\` seats on **every** flight from \`first\` to \`last\` (inclusive).

Return an array \`answer\` of length \`n\` where \`answer[i]\` is the total number of seats reserved on flight \`i + 1\`.`,
  examples: [
    {
      input: 'bookings = [[1,2,10],[2,3,20],[2,5,25]], n = 5',
      output: '[10,55,45,25,25]',
      explanation: 'Flight 1: 10. Flight 2: 10 + 20 + 25. Flight 3: 20 + 25. Flights 4 and 5: 25.',
    },
    { input: 'bookings = [[1,2,10],[2,2,15]], n = 2', output: '[10,25]' },
  ],
  constraints: ['1 <= n <= 2 * 10^4', '1 <= bookings.length <= 2 * 10^4', '1 <= first <= last <= n', '1 <= seats <= 10^4'],

  think: `- Applying each booking flight by flight costs up to \`n\` per booking. How bad is that in the worst case?
- A booking changes the seat count only at two "edges". Where does the count go up, and where does it come back down?
- Flights are 1-indexed. Where exactly do you write in a 0-indexed array?`,
  patternChallenge: {
    options: ['Prefix Sum + HashMap', 'Sorting + Two Pointers', 'Binary Search', 'Difference Array'],
    answer: 3,
    explanation: 'Many range additions followed by a single read of every value → difference array: O(1) per booking and one prefix pass.',
  },
  hints: [
    'Make `diff` of length n + 1. For a booking, `diff[first - 1] += seats` and `diff[last] -= seats` (that is index `last - 1 + 1`).',
    'The running prefix sum of `diff[0..n-1]` is the answer.',
  ],
  approach: `**Brute force:** for every booking loop from \`first\` to \`last\` → O(bookings · n) = up to 4·10^8.

**Difference array (O(n + bookings)):**
- A booking adds \`seats\` to a contiguous block. In the difference array this is **+seats where the block starts** and **−seats right after it ends**.
- With 0-based indices the block is \`[first − 1, last − 1]\`, so update \`diff[first − 1]\` and \`diff[last]\`. The extra slot \`diff[n]\` absorbs updates for \`last = n\`.
- A single prefix sum over \`diff\` turns the edges into totals.`,

  functionName: 'corpFlightBookings',
  paramNames: ['bookings', 'n'],
  starterCode: `/**
 * @param {number[][]} bookings
 * @param {number} n
 * @return {number[]}
 */
function corpFlightBookings(bookings, n) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Overlapping bookings add up on flight 2.', args: [[[1, 2, 10], [2, 3, 20], [2, 5, 25]], 5], expected: [10, 55, 45, 25, 25] },
    { scenario: 'Example 2', hint: 'A one-flight booking (first = last) still needs a start and an end mark.', args: [[[1, 2, 10], [2, 2, 15]], 2], expected: [10, 25] },
    { scenario: 'Single flight', hint: 'Smallest input: n = 1 and one booking.', args: [[[1, 1, 5]], 1], expected: [5] },
    { scenario: 'Booking only the first flight', hint: 'Labels are 1-based — flight 1 is index 0. Forgetting to convert shifts every seat one flight right.', args: [[[1, 1, 3]], 3], expected: [3, 0, 0] },
    { scenario: 'Booking ends at flight n', hint: 'last = n writes the end mark at index n — allocate n + 1 slots (or skip it).', args: [[[2, 5, 10000]], 5], expected: [0, 10000, 10000, 10000, 10000] },
    { scenario: 'Booking ends one flight early', hint: 'Subtracting at last - 1 stops the booking one flight too soon; flight 3 must still get the seats.', args: [[[1, 3, 4]], 3], expected: [4, 4, 4] },
    { scenario: 'Identical bookings', hint: 'Duplicate bookings simply add up.', args: [[[1, 3, 1], [1, 3, 1]], 3], expected: [2, 2, 2] },
    { scenario: 'Unbooked flights', hint: 'Flights with no booking stay 0 — before and after the booked range.', args: [[[3, 3, 7]], 4], expected: [0, 0, 7, 0] },
    { scenario: 'Nested ranges', hint: 'Several ranges nested and touching at the end.', args: [[[1, 4, 2], [2, 3, 3], [4, 4, 1]], 4], expected: [2, 5, 5, 3] },
    { scenario: 'Adjacent ranges', hint: 'One booking ends exactly where the next begins; they must not overlap.', args: [[[1, 2, 5], [3, 4, 7]], 4], expected: [5, 5, 7, 7] },
    { scenario: 'Unsorted bookings', hint: 'Bookings arrive in any order.', args: [[[4, 6, 2], [1, 6, 1], [2, 3, 9]], 6], expected: [1, 10, 10, 3, 3, 3] },
    { scenario: 'Max seats everywhere', hint: 'Large seat counts on every flight: 3 bookings of 10^4 seats covering all flights.', args: [[[1, 3, 10000], [1, 3, 10000], [1, 3, 10000]], 3], expected: [30000, 30000, 30000] },
    { scenario: 'Large input (n, b = 2·10^4)', hint: 'Adding each booking flight by flight is O(b·n) ≈ 4·10^8 steps here; a difference array makes it O(n + b).', argsGen: '() => { let s = 21; const r = () => (s = (s * 48271) % 2147483647); const n = 20000; const b = []; for (let i = 0; i < 20000; i++) { const f = 1 + (r() % 100); b.push([f, n - (r() % 100), 1 + (r() % 10000)]); } return [b, n]; }', expectedGen: "() => { const [bookings, n] = (() => { let s = 21; const r = () => (s = (s * 48271) % 2147483647); const n = 20000; const b = []; for (let i = 0; i < 20000; i++) { const f = 1 + (r() % 100); b.push([f, n - (r() % 100), 1 + (r() % 10000)]); } return [b, n]; })(); const starts = new Array(n + 2).fill(0), ends = new Array(n + 2).fill(0); for (const [f, l, seats] of bookings) { starts[f] += seats; ends[l] += seats; } const out = []; let cur = 0; for (let i = 1; i <= n; i++) { cur += starts[i]; out.push(cur); cur -= ends[i]; } return out; }", timeLimitMs: 200 },
  ],

  solution: {
    code: `function corpFlightBookings(bookings, n) {
  const diff = new Array(n + 1).fill(0); // extra slot for last === n
  for (const [first, last, seats] of bookings) {
    diff[first - 1] += seats;  // block starts at 0-based index first - 1
    diff[last] -= seats;       // ...and ends at last - 1, so it stops at index last
  }
  const answer = new Array(n);
  let running = 0;
  for (let i = 0; i < n; i++) {
    running += diff[i];
    answer[i] = running;
  }
  return answer;
}`,
  },
  dryRun: {
    columns: ['step', 'diff (indices 0..5)'],
    rows: [
      ['start', '[0, 0, 0, 0, 0, 0]'],
      ['[1,2,10]', '[10, 0, -10, 0, 0, 0]'],
      ['[2,3,20]', '[10, 20, -10, -20, 0, 0]'],
      ['[2,5,25]', '[10, 45, -10, -20, 0, -25]'],
      ['prefix of 0..4', '[10, 55, 45, 25, 25]'],
    ],
  },
  complexity: { time: 'O(n + b)', space: 'O(n)', explanation: 'O(1) per booking (b bookings) plus one O(n) prefix pass.' },
  alternative: {
    title: 'Direct application',
    md: 'Loop over each booking range and add seats. Correct and simple, but O(b · n) in the worst case.',
    complexity: 'O(b · n) time, O(n) space',
  },
  mistakes: [
    'Forgetting to convert 1-based flight labels to 0-based indices.',
    'Subtracting at `last - 1` (ends the booking one flight early).',
    'Allocating only n slots and writing `diff[n]`, which silently grows the array or is ignored.',
  ],
};
