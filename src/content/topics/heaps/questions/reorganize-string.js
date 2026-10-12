export default {
  id: 'reorganize-string',
  title: 'Reorganize String',
  difficulty: 'Medium',
  order: 7,
  pattern: 'heap-greedy-scheduling',
  tags: ['heap', 'greedy', 'string', 'counting'],
  source: { platform: 'LeetCode', number: 767, url: 'https://leetcode.com/problems/reorganize-string/' },

  statement: `Given a string \`s\`, rearrange its characters so that **no two adjacent characters are equal**. Return any such arrangement, or \`""\` if it is impossible.`,
  examples: [
    { input: 's = "aab"', output: '"aba"' },
    { input: 's = "aaab"', output: '""', explanation: 'Three a\'s need at least two separators, but there is only one b.' },
  ],
  constraints: ['1 <= s.length <= 500', 's consists of lowercase English letters'],

  think: `- When is it impossible? Relate the most frequent count to the string length.
- Greedy: which character is most "dangerous" to leave for later?
- After placing a character, how do you stop the heap from giving it back to you immediately?`,
  patternChallenge: {
    options: ['Two Pointers', 'Backtracking over all permutations', 'Sliding Window', 'Heap — Greedy Simulation & Scheduling'],
    answer: 3,
    explanation: 'Always place the most frequent remaining character that differs from the last one — a max-heap with a one-step "hold-out". Backtracking is exponential; windows and pointers do not build arrangements.',
  },
  hints: [
    'Impossible exactly when some character appears more than ⌈n / 2⌉ times.',
    'Max-heap by count. Each step pop the top, append it, and push back the character you held from the PREVIOUS step (if its count is still > 0). Hold the current one out.',
  ],
  approach: `**Brute force:** try permutations — factorial time.

**Greedy + heap:** the character with the most remaining copies is the hardest to separate, so place it as early as possible — but never twice in a row.
- Count letters. If \`maxCount > ⌈n/2⌉\` return \`""\`.
- Max-heap of \`[char, count]\`. Keep \`held\` = the character placed in the previous step.
- Each step: pop the top \`cur\`, append it, decrement it; push \`held\` back (if its count > 0); set \`held = cur\`.

Because the just-used character is out of the heap for one step, the next character always differs. If the heap is empty while characters remain, it was impossible (the count check rules that out in advance).

**Alternative (no heap):** place the most frequent letter at indices 0, 2, 4, …, then fill the remaining even and odd positions with the other letters.`,

  functionName: 'reorganizeString',
  paramNames: ['s'],
  starterCode: `/**
 * @param {string} s
 * @return {string}
 */
function reorganizeString(s) {
  
}
`,
  checker: `(output, args, expected) => {
  const s = args[0];
  if (expected === '') return output === '';
  if (typeof output !== 'string' || output.length !== s.length) return false;
  for (let i = 1; i < output.length; i++) if (output[i] === output[i - 1]) return false;
  const sorted = (x) => [...x].sort().join('');
  return sorted(output) === sorted(s);
}`,
  tests: [
    { scenario: 'Example 1', hint: 'Basic case: one way is "aba".', args: ['aab'], expected: 'aba' },
    { scenario: 'Example 2', hint: 'Three a\'s in length 4 cannot be separated — return "", not a partial string.', args: ['aaab'], expected: '' },
    { scenario: 'Single character', hint: 'Length 1 is always valid.', args: ['a'], expected: 'a' },
    { scenario: 'Two equal characters', hint: '"aa" is impossible: return "".', args: ['aa'], expected: '' },
    { scenario: 'Two different characters', hint: '"ab" is already fine.', args: ['ab'], expected: 'ab' },
    { scenario: 'Exactly ceil(n/2) copies', hint: '3 a\'s in length 5 is possible ("ababa"). The bound uses ceil, not floor.', args: ['baaba'], expected: 'ababa' },
    { scenario: 'Odd length bound with ceil', hint: '2 copies in length 3 is allowed: floor(3/2) = 1 would wrongly reject it.', args: ['baa'], expected: 'aba' },
    { scenario: 'Many distinct letters', hint: 'Several letters with equal counts; any valid arrangement is accepted.', args: ['aabbcc'], expected: 'abacbc' },
    { scenario: 'Do not reuse last character', hint: 'Pushing the just-used letter back immediately can place it twice in a row.', args: ['vvvlo'], expected: 'vlvov' },
    { scenario: 'Impossible with many letters', hint: '5 z\'s in length 7 exceeds ceil(7/2) = 4.', args: ['zzzzzab'], expected: '' },
    { scenario: 'Long alternating answer', hint: '5 a\'s and 5 b\'s must alternate perfectly.', args: ['abbabbaaab'], expected: 'ababababab' },
    { scenario: 'Max length, possible', hint: '500 letters where one letter fills exactly half: possible only with careful greedy placement.', argsGen: '() => [Array.from({ length: 500 }, (_, i) => (i < 250 ? \'e\' : \'abcdfghijklmnopqrstuvwxyz\'[i % 25])).join(\'\')]', expected: 'eaeaeaeaeaeaeaeaeaeaebebebebebebebebebebececececececececececededededededededededefefefefefefefefefefegegegegegegegegegegeheheheheheheheheheheieieieieieieieieieiejejejejejejejejejejekekekekekekekekekekelelelelelelelelelelememememememememememeneneneneneneneneneneoeoeoeoeoeoeoeoeoeoepepepepepepepepepepeqeqeqeqeqeqeqeqeqeqerererererererererereseseseseseseseseseseteteteteteteteteteteueueueueueueueueueuevevevevevevevevevevewewewewewewewewewewexexexexexexexexexexeyeyeyeyeyeyeyeyeyeyezezezezezezezezezez' },
    { scenario: 'Max length, impossible', hint: '500 letters where one letter appears 251 times — exceeds ceil(500/2).', argsGen: '() => [\'q\'.repeat(251) + \'w\'.repeat(249)]', expected: '' },
  ],

  solution: {
    code: `function reorganizeString(s) {
  const count = new Map();
  for (const c of s) count.set(c, (count.get(c) ?? 0) + 1);
  if (Math.max(...count.values()) > Math.ceil(s.length / 2)) return '';

  const heap = new MaxHeap((e) => e[1]);      // [char, remaining]
  for (const e of count) heap.push(e);

  const out = [];
  let held = null;                            // placed last step; must wait one turn
  while (!heap.isEmpty()) {
    const cur = heap.pop();
    out.push(cur[0]);
    cur[1]--;
    if (held && held[1] > 0) heap.push(held); // previous char may be used again now
    held = cur;
  }
  return out.length === s.length ? out.join('') : '';
}`,
  },
  dryRun: {
    columns: ['step', 'pop', 'out', 'push back (held)', 'held'],
    rows: [['1', '[v,3]', 'v', '—', 'v:2'], ['2', '[l,1] or [o,1]', 'vl', 'v:2', 'l:0'], ['3', '[v,2]', 'vlv', '— (l is 0)', 'v:1'], ['4', '[o,1]', 'vlvo', 'v:1', 'o:0'], ['5', '[v,1]', 'vlvov', '—', 'v:0']],
  },
  complexity: { time: 'O(n log σ)', space: 'O(σ)', explanation: 'n steps, each O(log σ) with σ ≤ 26 distinct letters — effectively O(n).' },
  alternative: {
    title: 'Even/odd placement — O(n)',
    md: 'Sort letters by count descending; write them into positions 0, 2, 4, … and then 1, 3, 5, …, always starting with the most frequent letter. Works because the most frequent letter fits into the even slots when its count ≤ ⌈n/2⌉.',
    complexity: 'O(n) time, O(n) space',
  },
  mistakes: [
    'Pushing the just-used character back immediately (it can be popped again and repeat).',
    'Using floor instead of ceil for the impossibility bound ("aba" has 2 a\'s in length 3 — possible).',
    'Returning a partial string instead of "" when impossible.',
  ],
};
