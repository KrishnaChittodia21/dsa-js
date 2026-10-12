export default {
  id: 'dota2-senate',
  title: 'Dota2 Senate',
  difficulty: 'Medium',
  order: 3,
  pattern: 'queue-simulation',
  tags: ['string', 'queue', 'greedy', 'simulation'],
  source: { platform: 'LeetCode', number: 649, url: 'https://leetcode.com/problems/dota2-senate/' },

  statement: `A senate has senators from two parties, Radiant (\`R\`) and Dire (\`D\`), given as a string in seating order. Voting happens in rounds, in seating order; senators who have been banned are skipped. When it is a senator's turn they may:

- **ban** one senator of the other party (that senator loses all future turns), or
- **announce victory**, if every remaining senator belongs to their own party.

Everyone plays optimally. Return \`"Radiant"\` or \`"Dire"\` — the party that wins.`,
  examples: [
    { input: 'senate = "RD"', output: '"Radiant"', explanation: 'R bans D, then R announces victory.' },
    { input: 'senate = "RDD"', output: '"Dire"', explanation: 'R bans the first D; the second D bans R.' },
  ],
  constraints: ['1 <= senate.length <= 10^4', 'senate[i] is "R" or "D"'],

  think: `- Who is the best opponent to ban — the one acting soonest or someone far away?
- After acting, when does a senator act again? How can a queue represent "next round"?
- Can you keep two queues of positions, one per party?`,
  patternChallenge: {
    options: ['Two queues of turn positions (greedy)', 'Stack', 'Counting only (majority wins)', 'Dynamic programming'],
    answer: 0,
    explanation: 'Greedy: ban the opponent who would act next. Two queues of positions compare the next R and next D; the earlier one bans the other and re-enters at position + n (the next round). Simple majority is wrong — order matters: "DDRRR" has more R senators, yet Dire wins.',
  },
  hints: [
    'Put the indices of R senators in one queue and D senators in another.',
    'Repeatedly dequeue r and d. The smaller index acts first: it bans the other and re-enqueues itself with index + n. When one queue is empty, the other party wins.',
  ],
  approach: `**Greedy insight:** the most dangerous opponent is the next one to act — banning anyone later wastes the chance to stop an imminent ban. So each senator bans the **next** opposing senator in turn order.

**Two queues (O(n)):** \`R\` and \`D\` hold the positions of active senators. Compare the fronts \`r\` and \`d\`: the smaller acts first, bans the other (dequeued and not re-added), and re-joins its own queue at \`position + n\` (it acts again in the next round, after everyone still waiting in this round). Each ban removes one senator, so there are at most n iterations.`,

  functionName: 'predictPartyVictory',
  paramNames: ['senate'],
  starterCode: `/**
 * @param {string} senate
 * @return {string}
 */
function predictPartyVictory(senate) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'R acts first and bans D.', args: ['RD'], expected: 'Radiant' },
    { scenario: 'Example 2', hint: 'R bans the first D, but the second D still gets a turn and bans R.', args: ['RDD'], expected: 'Dire' },
    { scenario: 'Single Radiant', hint: 'Smallest input: the lone senator announces victory.', args: ['R'], expected: 'Radiant' },
    { scenario: 'Single Dire', hint: 'A lone D wins immediately.', args: ['D'], expected: 'Dire' },
    { scenario: 'Minority wins by order', hint: 'Majority does not decide — the two Ds act first and ban the next two Rs.', args: ['DDRRR'], expected: 'Dire' },
    { scenario: 'Mirror of minority win', hint: 'Same shape with parties swapped.', args: ['RRDDD'], expected: 'Radiant' },
    { scenario: 'Ban the next opponent', hint: 'Each senator must ban the next opponent to act; banning the last or a random one changes the result.', args: ['DRDRR'], expected: 'Dire' },
    { scenario: 'Survivors act next round', hint: 'Winners are re-queued at index + n so they act after everyone left in this round.', args: ['DRRDRDRDRDDRDRDR'], expected: 'Radiant' },
    { scenario: 'All one party', hint: 'No opponents at all — that party wins.', args: ['DDDD'], expected: 'Dire' },
    { scenario: 'Alternating, Radiant first', hint: 'In strict alternation the first mover\'s party wins.', args: ['RDRDRDRD'], expected: 'Radiant' },
    { scenario: 'Several rounds needed', hint: 'The fight spans multiple rounds; banned senators must be skipped.', args: ['RDDRRDDDR'], expected: 'Dire' },
    { scenario: 'Max length, block order', hint: '10^4 senators: 4000 Ds sit before 6000 Rs — the earlier block bans the start of the later block every round.', argsGen: '() => [\'D\'.repeat(4000) + \'R\'.repeat(6000)]', expected: 'Dire' },
    { scenario: 'Max length, random', hint: 'Random seating of 10^4 senators.', argsGen: '() => { let s = 5; let o = \'\'; for (let i = 0; i < 10000; i++) { s = (s * 1103515245 + 12345) % 2147483648; o += (s >> 16) % 2 ? \'R\' : \'D\'; } return [o]; }', expected: 'Dire' },
  ],
  solution: {
    code: `function predictPartyVictory(senate) {
  const n = senate.length;
  const radiant = new Queue(), dire = new Queue();
  for (let i = 0; i < n; i++) (senate[i] === 'R' ? radiant : dire).enqueue(i);

  while (!radiant.isEmpty() && !dire.isEmpty()) {
    const r = radiant.dequeue(), d = dire.dequeue();
    // The earlier senator acts first and bans the other one.
    if (r < d) radiant.enqueue(r + n);   // acts again next round
    else dire.enqueue(d + n);
  }
  return radiant.isEmpty() ? 'Dire' : 'Radiant';
}`,
  },
  dryRun: {
    columns: ['R queue', 'D queue', 'fronts', 'action'],
    rows: [
      ['[0]', '[1,2]', 'r=0, d=1', 'R bans D@1, R → 3'],
      ['[3]', '[2]', 'r=3, d=2', 'D bans R@3, D → 5'],
      ['[]', '[5]', '', 'Dire wins'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(n)', explanation: 'Each iteration permanently bans one senator; queues hold at most n positions.' },
  alternative: {
    title: 'Single queue with pending-ban counters',
    md: 'Cycle through one queue of senators with counters banR/banD. When a senator comes up and a ban against their party is pending, they are removed (counter−−); otherwise they add a ban against the other party and re-enqueue. Same O(n) idea.',
    complexity: 'O(n) time, O(n) space',
  },
  mistakes: [
    'Deciding by majority — order matters ("DDRRR" is won by Dire despite fewer senators).',
    'Re-enqueuing the winner at the same index (it must be index + n so it acts after this round).',
    'Banning a random or the last opponent instead of the next one to act.',
  ],
};
