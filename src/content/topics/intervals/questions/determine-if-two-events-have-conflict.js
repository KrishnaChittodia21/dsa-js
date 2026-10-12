export default {
  id: 'determine-if-two-events-have-conflict',
  title: 'Determine if Two Events Have Conflict',
  difficulty: 'Easy',
  order: 1,
  pattern: 'intervals-merge',
  tags: ['array', 'string', 'intervals'],
  source: { platform: 'LeetCode', number: 2446, url: 'https://leetcode.com/problems/determine-if-two-events-have-conflict/' },

  statement: `You get two events that happen on the same day. Each event is a pair of times \`[startTime, endTime]\` written as \`"HH:MM"\` strings (24-hour clock, always two digits each). Both endpoints are **inclusive**: an event from \`"01:00"\` to \`"02:00"\` is still happening at exactly \`"02:00"\`.

Return \`true\` if there is at least one moment when both events are happening, otherwise \`false\`.`,
  examples: [
    { input: 'event1 = ["01:15","02:00"], event2 = ["02:00","03:00"]', output: 'true', explanation: 'Both events include the moment 02:00.' },
    { input: 'event1 = ["01:00","02:00"], event2 = ["01:20","03:00"]', output: 'true', explanation: 'They share 01:20 – 02:00.' },
    { input: 'event1 = ["10:00","11:00"], event2 = ["14:00","15:00"]', output: 'false' },
  ],
  constraints: ['event1.length == event2.length == 2', 'Times are valid "HH:MM" strings', 'startTime <= endTime for each event'],

  think: `- Describe the two ways the events can **fail** to overlap. What is the negation of "A is completely before B or B is completely before A"?
- Do you need to convert the strings to minutes, or can you compare them directly?
- Endpoints are inclusive — does touching count?`,
  patternChallenge: {
    options: ['Sweep line with events', 'Interval overlap test (each starts before the other ends)', 'Binary search', 'Sliding window'],
    answer: 1,
    explanation: 'Two intervals only. The general overlap test `a.start <= b.end && b.start <= a.end` (closed intervals) answers it in O(1). A sweep line would work but is overkill for two intervals.',
  },
  hints: [
    'They do NOT overlap exactly when one ends before the other starts.',
    'Zero-padded "HH:MM" strings compare in the same order as the times they represent, so `<=` on strings works.',
  ],
  approach: `**Brute force:** convert both events to minutes and mark every minute of event 1 in a boolean array of size 1440, then check whether any minute of event 2 is marked — O(1440), works but clumsy.

**Optimized:** closed intervals \`[s1, e1]\` and \`[s2, e2]\` overlap iff \`s1 <= e2 && s2 <= e1\`. Because the strings are zero-padded and the same length, lexicographic comparison equals chronological comparison, so we can compare the strings directly.`,

  functionName: 'haveConflict',
  paramNames: ['event1', 'event2'],
  starterCode: `/**
 * @param {string[]} event1
 * @param {string[]} event2
 * @return {boolean}
 */
function haveConflict(event1, event2) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The events touch at 02:00. Endpoints are inclusive, so that is a conflict — use `<=`.', args: [['01:15', '02:00'], ['02:00', '03:00']], expected: true },
    { scenario: 'Example 2', hint: 'A partial overlap from 01:20 to 02:00.', args: [['01:00', '02:00'], ['01:20', '03:00']], expected: true },
    { scenario: 'Example 3', hint: 'Event 1 ends long before event 2 starts — no conflict.', args: [['10:00', '11:00'], ['14:00', '15:00']], expected: false },
    { scenario: 'Second event earlier', hint: 'The same disjoint pair in the other order must also be false.', args: [['14:00', '15:00'], ['10:00', '11:00']], expected: false },
    { scenario: 'Event 2 inside event 1', hint: 'Event 2 lies fully inside event 1 — still a conflict.', args: [['05:00', '20:00'], ['10:00', '11:00']], expected: true },
    { scenario: 'Event 1 inside event 2', hint: 'Checking only whether event2 starts inside event1 misses this case.', args: [['10:00', '11:00'], ['05:00', '20:00']], expected: true },
    { scenario: 'Event 1 starts inside 2', hint: 'Event 1 starts during event 2 — a one-sided check misses it.', args: [['16:53', '19:00'], ['10:33', '18:15']], expected: true },
    { scenario: 'Identical zero-length events', hint: 'Both events are the single instant 12:00 — they conflict.', args: [['12:00', '12:00'], ['12:00', '12:00']], expected: true },
    { scenario: 'One minute apart', hint: '09:59 and 10:00 are different minutes — no conflict.', args: [['00:00', '09:59'], ['10:00', '23:59']], expected: false },
    { scenario: 'Touch at start of day', hint: 'Event 2 ends exactly when event 1 starts at 00:00.', args: [['00:00', '00:30'], ['00:00', '00:00']], expected: true },
    { scenario: 'Whole day vs late event', hint: 'A full-day event conflicts with anything — including 23:59.', args: [['00:00', '23:59'], ['23:59', '23:59']], expected: true },
    { scenario: 'Hour digit boundary', hint: 'Comparing "09:00" with "10:00" works because strings are zero-padded; converting to minutes is equally safe.', args: [['09:00', '09:59'], ['10:00', '10:30']], expected: false },
  ],

  solution: {
    code: `function haveConflict(event1, event2) {
  const [s1, e1] = event1;
  const [s2, e2] = event2;
  // Closed intervals overlap iff each starts no later than the other ends.
  // "HH:MM" strings are fixed-width, so string order == time order.
  return s1 <= e2 && s2 <= e1;
}`,
    explanation: 'The negation of "no overlap" (`e1 < s2 || e2 < s1`) is exactly `s1 <= e2 && s2 <= e1`.',
  },
  dryRun: {
    columns: ['event1', 'event2', 's1 <= e2', 's2 <= e1', 'result'],
    rows: [
      ['["01:15","02:00"]', '["02:00","03:00"]', '"01:15" <= "03:00" ✓', '"02:00" <= "02:00" ✓', 'true'],
      ['["10:00","11:00"]', '["14:00","15:00"]', '✓', '"14:00" <= "11:00" ✗', 'false'],
    ],
  },
  complexity: { time: 'O(1)', space: 'O(1)', explanation: 'Two string comparisons of fixed length.' },
  alternative: {
    title: 'Convert to minutes',
    md: 'Parse each time with `h * 60 + m` and compare numbers. Safer if the format were not zero-padded (e.g. "9:05").',
    code: `function haveConflict(event1, event2) {
  const toMin = (t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
  const [s1, e1] = event1.map(toMin), [s2, e2] = event2.map(toMin);
  return Math.max(s1, s2) <= Math.min(e1, e2);
}`,
    complexity: 'O(1) time, O(1) space',
  },
  mistakes: [
    'Only checking whether event2 starts inside event1 — misses the case where event1 starts inside event2.',
    'Using `<` instead of `<=`: the endpoints are inclusive, so touching at "02:00" is a conflict.',
    'Comparing non-padded strings lexicographically ("9:00" > "10:00" as strings).',
  ],
};
