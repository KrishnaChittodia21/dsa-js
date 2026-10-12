export default {
  id: 'classic-complexity-string-concat',
  title: 'String Building in a Loop',
  difficulty: 'Medium',
  order: 1,
  kind: 'quiz',
  pattern: 'complexity-hidden-costs-js',
  tags: ['big-o', 'strings', 'immutability'],
  source: { platform: 'Classic', note: 'Standard complexity-analysis exercise (JavaScript-specific)' },

  statement: `Both functions build a string of \`n\` characters. Assuming each \`+\` may **copy** the whole existing string (the safe, worst-case model — strings are immutable), what are their time complexities?

\`\`\`js
function buildA(n) {
  let s = '';
  for (let i = 0; i < n; i++) {
    s = s + 'x';          // new string every time
  }
  return s;
}

function buildB(n) {
  const parts = [];
  for (let i = 0; i < n; i++) parts.push('x');
  return parts.join('');  // one final pass
}
\`\`\``,
  examples: [{ input: 'n = 4', output: '"xxxx"', explanation: 'buildA copies 0 + 1 + 2 + 3 characters in the worst-case model; buildB pushes 4 pieces and joins once.' }],
  constraints: ['JavaScript strings are immutable: an operation never changes a string in place'],
  think: `- If \`s + 'x'\` must copy s, how long is s on iteration i?
- What is 0 + 1 + 2 + … + (n − 1)?`,
  patternChallenge: {
    options: ['Hidden Costs of JavaScript Built-ins', 'Halving / Doubling → Logarithms', 'Recursion: Call Tree & Stack Depth', 'Constraints → Target Complexity'],
    answer: 0,
    explanation: 'The loop looks linear; the cost is hidden inside the `+` operator on an immutable string.',
  },
  hints: ['On iteration i the string already has i characters, so copying it costs i.', 'join computes the total length once and writes each character once.'],
  approach: `**buildA (worst-case model):** copying costs 0 + 1 + … + (n−1) = n(n−1)/2 → **O(n²)**.

**buildB:** n pushes (O(1) amortized each) + one join over n characters → **O(n)**.

**Reality check:** V8 and other engines often represent \`s + t\` as a lazy "rope" (a tree of pieces), so buildA is frequently fast in practice. But as soon as you read characters, slice, or compare, the rope gets flattened (copied). Interviewers expect you to know the immutable-string cost model and to use \`array.push + join\` when building large strings.`,

  quiz: {
    options: ['A: O(n), B: O(n²)', 'A: O(n²), B: O(n)', 'Both O(n)', 'Both O(n²)'],
    answer: 1,
    explanation: 'With immutable strings, each `s + "x"` can copy all i existing characters → 0 + 1 + … + (n−1) = O(n²). Collecting pieces in an array and joining once writes each character once → O(n).',
  },
  dryRun: { columns: ['i', 'length of s before', 'copy cost (worst case)', 'total'], rows: [['0', '0', '0', '0'], ['1', '1', '1', '1'], ['2', '2', '2', '3'], ['3', '3', '3', '6']] },
  complexity: { time: 'A: O(n²) worst case, B: O(n)', space: 'O(n) for both', explanation: 'The final string has n characters in both cases; A may also create n temporary strings.' },
  mistakes: ['Assuming `+=` always mutates the string in place — JavaScript strings are immutable', 'Relying on engine optimisations in an interview answer instead of stating the safe bound', 'Using str.split("") / str.slice in a loop — each is O(length)'],
};
