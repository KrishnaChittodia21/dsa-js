export default {
  id: 'lemonade-change',
  title: 'Lemonade Change',
  difficulty: 'Easy',
  order: 2,
  pattern: 'greedy-local-constraints',
  tags: ['array', 'greedy', 'simulation'],
  source: { platform: 'LeetCode', number: 860, url: 'https://leetcode.com/problems/lemonade-change/' },

  statement: `A lemonade costs **$5**. Customers stand in a queue and each pays with a single bill of \`$5\`, \`$10\` or \`$20\` (given in order in \`bills\`). You start with **no money** and must give every customer the correct change.

Return \`true\` if you can give correct change to every customer, otherwise \`false\`.`,
  examples: [
    { input: 'bills = [5,5,5,10,20]', output: 'true', explanation: 'After three $5s, the $10 gets a $5 back, the $20 gets $10 + $5 back.' },
    { input: 'bills = [5,5,10,10,20]', output: 'false', explanation: 'When the $20 arrives you hold two $10s and no $5, so you cannot make $15.' },
  ],
  constraints: ['1 <= bills.length <= 10^5', 'bills[i] is 5, 10 or 20'],

  think: `- Do you ever need to remember how many $20 bills you hold?
- For a $20 you owe $15: $10 + $5 or $5 + $5 + $5. Which is better to hand out, and why?
- Which bill is the most "flexible" to keep?`,
  patternChallenge: {
    options: ['Greedy — Local Rules & Two Passes', 'Dynamic Programming', 'Stack', 'Hash Map (Complement Lookup)'],
    answer: 0,
    explanation: 'A simple left-to-right simulation where one choice (pay $15 with a $10 when possible) is always at least as good as the alternative.',
  },
  hints: [
    'Only count $5 and $10 bills — $20s are never given as change.',
    'For $15 change, prefer $10 + $5 because $5 bills are useful for every future customer while $10 bills only help $20 customers.',
  ],
  approach: `**Brute force:** try both ways of making $15 at every $20 (exponential branching).

**Greedy:** keep counts \`five\`, \`ten\`.
- $5 → five++.
- $10 → need a $5.
- $20 → if you have a $10 and a $5, use them; else use three $5s; else fail.

**Why prefer the $10?** Any future need is for $5 (from a $10 customer) or $15. A $5 can do everything a $10 can do in change, but not vice versa, so saving $5s never hurts.`,

  functionName: 'lemonadeChange',
  paramNames: ['bills'],
  starterCode: `/**
 * @param {number[]} bills
 * @return {boolean}
 */
function lemonadeChange(bills) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Three $5s, then a $10 takes one $5, then the $20 gets $10 + $5.', args: [[5, 5, 5, 10, 20]], expected: true },
    { scenario: 'Example 2', hint: 'Both $5s were spent on the $10 customers, so the $20 cannot be changed.', args: [[5, 5, 10, 10, 20]], expected: false },
    { scenario: 'First customer pays $10', hint: 'You start with no money: a $10 first means no $5 for change.', args: [[10]], expected: false },
    { scenario: 'Single $5', hint: 'One exact payment needs no change.', args: [[5]], expected: true },
    { scenario: 'First customer pays $20', hint: 'No money at all to make $15 of change.', args: [[20]], expected: false },
    { scenario: 'Change $20 with three $5s', hint: 'With no $10 available, three $5s also make $15.', args: [[5, 5, 5, 20]], expected: true },
    { scenario: 'Prefer the $10 for $20', hint: 'Paying $15 with three $5s leaves none for the later $10 customers; use $10 + $5 when you can.', args: [[5, 5, 5, 5, 10, 20, 10, 10]], expected: true },
    { scenario: 'Not enough for $20', hint: 'One $5 cannot cover $15 of change.', args: [[5, 20]], expected: false },
    { scenario: 'Mixed order succeeds', hint: 'Interleaved bills: track counts of $5 and $10 as they change.', args: [[5, 10, 5, 20]], expected: true },
    { scenario: 'Only $5 bills', hint: 'Nobody needs change — always true.', args: [[5, 5, 5, 5, 5]], expected: true },
    { scenario: '$20s are never change', hint: 'Collected $20 bills cannot be handed out as change, so they do not help the later $10 customer.', args: [[5, 5, 5, 20, 10]], expected: false },
    { scenario: 'Long mixed queue', hint: 'A longer queue mixing all three bills.', args: [[5, 5, 10, 20, 5, 5, 5, 5, 5, 5, 5, 5, 5, 10, 5, 5, 20, 5, 20, 5]], expected: true },
    { scenario: 'Large input (n = 10^5)', hint: 'Branching over both ways to change every $20 explodes; counting $5 and $10 bills is O(n).', argsGen: '() => [Array.from({ length: 100000 }, (_, i) => [5, 5, 5, 10, 20][i % 5])]', expected: true, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function lemonadeChange(bills) {
  let five = 0, ten = 0;
  for (const bill of bills) {
    if (bill === 5) {
      five++;
    } else if (bill === 10) {
      if (five === 0) return false;
      five--; ten++;
    } else {                       // $20: owe $15
      if (ten > 0 && five > 0) { ten--; five--; } // keep $5s — they are more flexible
      else if (five >= 3) five -= 3;
      else return false;
    }
  }
  return true;
}`,
  },
  dryRun: {
    columns: ['bill', 'action', 'five', 'ten'],
    rows: [
      ['5', 'keep', '1', '0'],
      ['5', 'keep', '2', '0'],
      ['10', 'give 5', '1', '1'],
      ['10', 'give 5', '0', '2'],
      ['20', 'need 10+5 or 5+5+5 → none', '0', '2'],
    ],
    note: 'Returns false at the $20.',
  },
  complexity: { time: 'O(n)', space: 'O(1)', explanation: 'One pass with two counters.' },
  alternative: {
    title: 'Why the opposite preference fails',
    md: 'If you pay $15 with three $5s whenever possible, `[5,5,5,5,10,20,10]` fails: after the $20 you hold one $10 and no $5, so the last $10 customer cannot get change. The correct greedy uses the $10 at the $20 and keeps two $5s. This is exactly the exchange argument: a $5 can replace a $10 in any future change, never the other way round.',
    code: `// Wrong preference — shown only to see it fail
function lemonadeChangeWrong(bills) {
  let five = 0, ten = 0;
  for (const bill of bills) {
    if (bill === 5) five++;
    else if (bill === 10) { if (!five) return false; five--; ten++; }
    else if (five >= 3) five -= 3;          // spends the flexible bills first
    else if (ten && five) { ten--; five--; }
    else return false;
  }
  return true;
}`,
    complexity: 'O(n) — but incorrect',
  },
  mistakes: [
    'Paying $15 with three $5s when a $10 is available.',
    'Tracking $20 bills (they are never used as change).',
    'Forgetting the case where the very first customer pays with $10.',
  ],
};
