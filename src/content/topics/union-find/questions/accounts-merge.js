export default {
  id: 'accounts-merge',
  title: 'Accounts Merge',
  difficulty: 'Medium',
  order: 8,
  pattern: 'union-find-key-mapping',
  tags: ['union find', 'hash map', 'string', 'sorting'],
  source: { platform: 'LeetCode', number: 721, url: 'https://leetcode.com/problems/accounts-merge/' },

  statement: `Each entry of \`accounts\` is a list whose first element is a person's **name** and the rest are **emails** of that account.

Two accounts belong to the same person if they share at least one email (this is transitive through chains of accounts). People with the same name may still be different people.

Merge the accounts. Return each person as \`[name, ...emails]\` with the emails **sorted** (by plain string order). The people may be returned in any order.`,
  examples: [
    {
      input: 'accounts = [["John","johnsmith@mail.com","john_newyork@mail.com"],["John","johnsmith@mail.com","john00@mail.com"],["Mary","mary@mail.com"],["John","johnnybravo@mail.com"]]',
      output: '[["John","john00@mail.com","john_newyork@mail.com","johnsmith@mail.com"],["Mary","mary@mail.com"],["John","johnnybravo@mail.com"]]',
      explanation: 'The first two accounts share johnsmith@mail.com; the last John shares nothing.',
    },
  ],
  constraints: ['1 <= accounts.length <= 1000', '2 <= accounts[i].length <= 10', 'Emails are valid and at most 30 characters'],

  think: `- What exactly links two accounts? The name, or an email?
- Comparing every pair of accounts is O(n²·k²). How can a Map from email → first account that used it avoid that?
- After grouping, how do you build each output row?`,
  patternChallenge: {
    options: ['Sorting + Two Pointers', 'Union Find (Mapping Keys to Ids)', 'Trie', 'Topological Sort'],
    answer: 1,
    explanation: 'Accounts are nodes; a shared email is an edge; merged people are connected components. A Map from email to owner account turns string keys into DSU unions. Sorting alone cannot follow chains A–B–C.',
  },
  hints: [
    'Keep `owner: Map<email, accountIndex>`. When you see an email already owned by another account, union the two accounts.',
    'Afterwards, group every email by `find(owner.get(email))`, sort each group, and prepend the account\'s name.',
  ],
  approach: `**Brute force:** compare every pair of accounts for a common email and union them — O(n² · k²) string comparisons.

**Union Find with email ownership:**
1. \`uf = new UnionFind(accounts.length)\`, \`owner = new Map()\`.
2. For each account i and each email e: if \`owner\` has e, \`union(i, owner.get(e))\`; else \`owner.set(e, i)\`.
3. \`groups: Map<root, email[]>\`: for each (e, i) in owner, push e into groups[find(i)].
4. For each group: sort emails, output \`[accounts[root][0], ...emails]\`.

Each email is processed once, so linking is O(total emails · α).`,

  functionName: 'accountsMerge',
  paramNames: ['accounts'],
  starterCode: `/**
 * @param {string[][]} accounts
 * @return {string[][]}
 */
function accountsMerge(accounts) {
  
}
`,
  compare: 'unordered',
  tests: [
    { scenario: 'Example 1', hint: 'The first two Johns share johnsmith@mail.com; the third John shares nothing and stays separate.', args: [[['John', 'johnsmith@mail.com', 'john_newyork@mail.com'], ['John', 'johnsmith@mail.com', 'john00@mail.com'], ['Mary', 'mary@mail.com'], ['John', 'johnnybravo@mail.com']]], expected: [['John', 'john00@mail.com', 'john_newyork@mail.com', 'johnsmith@mail.com'], ['Mary', 'mary@mail.com'], ['John', 'johnnybravo@mail.com']] },
    { scenario: 'No shared emails', hint: 'Nothing is merged; each account just needs its emails sorted.', args: [[['Gabe', 'Gabe0@m.co', 'Gabe3@m.co', 'Gabe1@m.co'], ['Kevin', 'Kevin3@m.co', 'Kevin5@m.co', 'Kevin0@m.co'], ['Ethan', 'Ethan5@m.co', 'Ethan4@m.co', 'Ethan0@m.co'], ['Hanzo', 'Hanzo3@m.co', 'Hanzo1@m.co', 'Hanzo0@m.co'], ['Fern', 'Fern5@m.co', 'Fern1@m.co', 'Fern0@m.co']]], expected: [['Gabe', 'Gabe0@m.co', 'Gabe1@m.co', 'Gabe3@m.co'], ['Kevin', 'Kevin0@m.co', 'Kevin3@m.co', 'Kevin5@m.co'], ['Ethan', 'Ethan0@m.co', 'Ethan4@m.co', 'Ethan5@m.co'], ['Hanzo', 'Hanzo0@m.co', 'Hanzo1@m.co', 'Hanzo3@m.co'], ['Fern', 'Fern0@m.co', 'Fern1@m.co', 'Fern5@m.co']] },
    { scenario: 'Single account', hint: 'The smallest input: one account with one email.', args: [[['A', 'a@x']]], expected: [['A', 'a@x']] },
    { scenario: 'Identical accounts', hint: 'The same email appears in two accounts — output it only once.', args: [[['A', 'a@x'], ['A', 'a@x']]], expected: [['A', 'a@x']] },
    { scenario: 'Merge through a later account', hint: 'Account 2 shares nothing with account 1 directly; account 3 links them, so all three merge.', args: [[['A', 'a@x', 'b@x'], ['A', 'c@x'], ['A', 'c@x', 'b@x']]], expected: [['A', 'a@x', 'b@x', 'c@x']] },
    { scenario: 'Same name, different people', hint: 'Merging by name is wrong: these two "Al" accounts share no email and must stay separate.', args: [[['Al', 'x@m'], ['Al', 'y@m']]], expected: [['Al', 'x@m'], ['Al', 'y@m']] },
    { scenario: 'Chain of four accounts', hint: 'Links are transitive: 1–4 via b2, 4–3 via b4, 3–2 via b3.', args: [[['B', 'b1@m', 'b2@m'], ['B', 'b3@m'], ['B', 'b4@m', 'b3@m'], ['B', 'b2@m', 'b4@m']]], expected: [['B', 'b1@m', 'b2@m', 'b3@m', 'b4@m']] },
    { scenario: 'Code-unit email order', hint: 'Sort with plain string comparison: "Z@m" < "_x@m" < "a@m". localeCompare orders these differently.', args: [[['Q', 'a@m', 'Z@m'], ['Q', '_x@m', 'a@m'], ['R', 'r@m']]], expected: [['Q', 'Z@m', '_x@m', 'a@m'], ['R', 'r@m']] },
    { scenario: 'Duplicate email in one account', hint: 'An account may list the same email twice; the merged list must contain it once.', args: [[['D', 'd@m', 'd@m', 'e@m']]], expected: [['D', 'd@m', 'e@m']] },
    { scenario: 'Two people, same name, mixed', hint: 'Two separate "Sam" groups and one "Kim" — group by shared email, never by name.', args: [[['Sam', 's1@m', 's2@m'], ['Kim', 'k@m'], ['Sam', 's3@m'], ['Sam', 's2@m', 's4@m'], ['Sam', 's3@m', 's5@m']]], expected: [['Sam', 's1@m', 's2@m', 's4@m'], ['Kim', 'k@m'], ['Sam', 's3@m', 's5@m']] },
    { scenario: 'Max size, heavy overlap', hint: '1000 accounts drawing from 400 shared emails: every account ends up in one or a few big groups, linked through long chains of shared emails.', argsGen: '() => { let s = 5; const r = () => (s = (s * 1103515245 + 12345) % 2147483648); const a = []; for (let i = 0; i < 1000; i++) { const k = 9; const es = new Set(); while (es.size < k) es.add(\'u\' + (r() % 400) + \'@m\'); a.push([\'User\', ...es]); } return [a]; }', expected: [['User', 'u0@m', 'u104@m', 'u105@m', 'u112@m', 'u120@m', 'u121@m', 'u128@m', 'u136@m', 'u137@m', 'u144@m', 'u152@m', 'u153@m', 'u160@m', 'u168@m', 'u169@m', 'u16@m', 'u176@m', 'u184@m', 'u185@m', 'u192@m', 'u200@m', 'u208@m', 'u216@m', 'u217@m', 'u224@m', 'u232@m', 'u233@m', 'u240@m', 'u248@m', 'u249@m', 'u24@m', 'u256@m', 'u25@m', 'u264@m', 'u265@m', 'u272@m', 'u280@m', 'u281@m', 'u288@m', 'u296@m', 'u297@m', 'u304@m', 'u312@m', 'u320@m', 'u328@m', 'u329@m', 'u32@m', 'u336@m', 'u33@m', 'u344@m', 'u345@m', 'u352@m', 'u360@m', 'u361@m', 'u368@m', 'u376@m', 'u377@m', 'u384@m', 'u385@m', 'u392@m', 'u393@m', 'u40@m', 'u48@m', 'u56@m', 'u57@m', 'u64@m', 'u72@m', 'u73@m', 'u74@m', 'u80@m', 'u88@m', 'u8@m', 'u96@m', 'u9@m']] },
    { scenario: 'Max size, no overlap', hint: '1000 accounts, all emails distinct: nothing merges. Ten distinct names repeat, so grouping by name would wrongly merge.', argsGen: '() => { const a = []; for (let i = 0; i < 1000; i++) a.push([\'P\' + (i % 10), \'p\' + i + \'a@m\', \'p\' + i + \'b@m\']); return [a]; }', expectedGen: "() => (() => { const a = []; for (let i = 0; i < 1000; i++) a.push(['P' + (i % 10), 'p' + i + 'a@m', 'p' + i + 'b@m']); return [a]; })()[0]" },
  ],

  solution: {
    code: `function accountsMerge(accounts) {
  const uf = new UnionFind(accounts.length);
  const owner = new Map();                       // email -> first account index

  accounts.forEach((acc, i) => {
    for (let k = 1; k < acc.length; k++) {
      const email = acc[k];
      if (owner.has(email)) uf.union(i, owner.get(email));
      else owner.set(email, i);
    }
  });

  const groups = new Map();                      // root account -> emails
  for (const [email, i] of owner) {
    const r = uf.find(i);
    if (!groups.has(r)) groups.set(r, []);
    groups.get(r).push(email);
  }

  const result = [];
  for (const [r, emails] of groups) {
    emails.sort();                               // plain string order, as required
    result.push([accounts[r][0], ...emails]);
  }
  return result;
}`,
  },
  dryRun: {
    columns: ['account', 'email', 'owner before', 'action'],
    rows: [
      ['0', 'johnsmith', '—', 'owner = 0'],
      ['0', 'john_newyork', '—', 'owner = 0'],
      ['1', 'johnsmith', '0', 'union(1, 0)'],
      ['1', 'john00', '—', 'owner = 1'],
      ['2', 'mary', '—', 'owner = 2'],
      ['3', 'johnnybravo', '—', 'owner = 3'],
    ],
  },
  complexity: { time: 'O(E log E)', space: 'O(E)', explanation: 'E = total emails. Linking is O(E · α); sorting the emails of all groups dominates.' },
  alternative: {
    title: 'Graph of emails + DFS',
    md: 'Build an undirected graph where each account\'s first email connects to all its other emails; DFS from each unvisited email collects a component; sort and attach the name.',
    complexity: 'O(E log E) time, O(E) space',
  },
  mistakes: ['Merging by name (two different Johns).', 'Keeping duplicate emails — the owner Map naturally dedupes.', 'Using localeCompare when the expected order is plain code-unit order.'],
};
