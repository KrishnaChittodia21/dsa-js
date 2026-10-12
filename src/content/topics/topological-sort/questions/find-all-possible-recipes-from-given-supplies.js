export default {
  id: 'find-all-possible-recipes-from-given-supplies',
  title: 'Find All Possible Recipes from Given Supplies',
  difficulty: 'Medium',
  order: 3,
  pattern: 'topo-kahn-indegree',
  tags: ['graph', 'topological sort', 'hash map', 'string'],
  source: { platform: 'LeetCode', number: 2115, url: 'https://leetcode.com/problems/find-all-possible-recipes-from-given-supplies/' },

  statement: `You have \`n\` recipes. Recipe \`recipes[i]\` can be made if you have **all** ingredients in \`ingredients[i]\`. An ingredient may itself be another recipe. You start with an unlimited amount of every item in \`supplies\`.

Return all recipes you can make, in any order.`,
  examples: [
    { input: 'recipes = ["bread"], ingredients = [["yeast","flour"]], supplies = ["yeast","flour","corn"]', output: '["bread"]' },
    { input: 'recipes = ["bread","sandwich"], ingredients = [["yeast","flour"],["bread","meat"]], supplies = ["yeast","flour","meat"]', output: '["bread","sandwich"]', explanation: 'Bread first, then the sandwich that needs bread.' },
  ],
  constraints: ['1 <= n <= 100', '1 <= ingredients[i].length <= 100', '1 <= supplies.length <= 100', 'All names are distinct lowercase strings; recipes and supplies do not overlap'],

  think: `- An item is "available" once you have it. Which items are available at the start?
- A recipe is like a course: its ingredients are its prerequisites. What plays the role of in-degree?
- What happens to recipes that depend on each other in a loop?`,
  patternChallenge: {
    options: ['Backtracking over subsets of recipes', "Kahn's algorithm with string vertices", 'Union-Find over ingredient names', 'Two Pointers'],
    answer: 1,
    explanation: 'Each recipe waits for a count of missing ingredients (its in-degree). Supplies are the starting in-degree-0 items. Making an item decrements every recipe that uses it. Recipes on a cycle or needing a missing ingredient never reach 0. Union-Find loses the "needs ALL ingredients" semantics.',
  },
  hints: [
    'Map each ingredient name → list of recipe indices that use it. `need[i] = ingredients[i].length`.',
    'Queue all supplies. Popping an item decrements `need` of every recipe using it; when a recipe reaches 0, add it to the answer and to the queue (it is now an available item).',
  ],
  approach: `**Brute force:** repeatedly loop over all recipes and make any whose ingredients are all available, until nothing changes: O(n² · k).

**Kahn with names:** edge ingredient → recipe. \`need[i]\` = number of ingredients of recipe i (its in-degree). Seed the queue with every supply. Pop item x; for each recipe i that uses x, \`need[i]--\`; at 0, recipe i is makeable: record it and push its name. Items nobody supplies simply never get popped, so recipes that need them stay stuck; so do recipes on a dependency cycle. O(total ingredients + supplies).`,

  functionName: 'findAllRecipes',
  paramNames: ['recipes', 'ingredients', 'supplies'],
  compare: 'unordered',
  starterCode: `/**
 * @param {string[]} recipes
 * @param {string[][]} ingredients
 * @param {string[]} supplies
 * @return {string[]}
 */
function findAllRecipes(recipes, ingredients, supplies) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'All ingredients are supplies; extra supplies (corn) do not matter.', args: [['bread'], [['yeast', 'flour']], ['yeast', 'flour', 'corn']], expected: ['bread'] },
    { scenario: 'Example 2', hint: 'Sandwich needs bread, which you can make first — a made recipe must unlock the recipes that use it.', args: [['bread', 'sandwich'], [['yeast', 'flour'], ['bread', 'meat']], ['yeast', 'flour', 'meat']], expected: ['bread', 'sandwich'] },
    { scenario: 'Three-level dependency', hint: 'Burger needs sandwich which needs bread: availability must propagate through several levels.', args: [['bread', 'sandwich', 'burger'], [['yeast', 'flour'], ['bread', 'meat'], ['sandwich', 'meat', 'bread']], ['yeast', 'flour', 'meat']], expected: ['bread', 'sandwich', 'burger'] },
    { scenario: 'Missing ingredient', hint: 'Having only some of the ingredients is not enough — every one is required.', args: [['bread'], [['yeast', 'flour']], ['yeast']], expected: [] },
    { scenario: 'Recipes need each other', hint: 'a needs b and b needs a: a cycle, neither can be made. A "repeat until no change" loop must stop.', args: [['a', 'b'], [['b'], ['a']], ['x']], expected: [] },
    { scenario: 'Cycle behind a makeable recipe', hint: 'a is makeable, but b and c depend on each other — only a.', args: [['a', 'b', 'c'], [['x'], ['a', 'c'], ['b']], ['x']], expected: ['a'] },
    { scenario: 'Mixed web of recipes', hint: 'Several recipes feed into others; some are blocked by a missing item further up.', args: [['ju', 'fzjnm', 'x', 'e', 'zpmcz', 'h', 'q'], [['d'], ['hveml', 'f', 'cpivl'], ['cpivl', 'zpmcz', 'h', 'e', 'fzjnm', 'ju'], ['cpivl', 'hveml', 'zpmcz', 'ju', 'h'], ['h', 'fzjnm', 'e', 'q', 'x'], ['d', 'hveml', 'cpivl', 'q', 'zpmcz', 'ju', 'e', 'x'], ['f', 'hveml', 'cpivl']], ['f', 'hveml', 'cpivl', 'd']], expected: ['ju', 'fzjnm', 'q'] },
    { scenario: 'Recipe listed before its input', hint: 'cake needs batter, which appears later in the list — a single left-to-right pass misses cake.', args: [['cake', 'batter'], [['batter', 'sugar'], ['egg', 'flour']], ['egg', 'flour', 'sugar']], expected: ['cake', 'batter'] },
    { scenario: 'Unknown ingredient', hint: 'An ingredient that is neither a supply nor a recipe can never be obtained.', args: [['soup'], [['water', 'salt', 'unicorn']], ['water', 'salt']], expected: [] },
    { scenario: 'Blocked chain', hint: 'c needs b needs a, and a lacks an ingredient — nothing in the chain is makeable.', args: [['a', 'b', 'c'], [['m'], ['a'], ['b']], ['x']], expected: [] },
    { scenario: 'Self-dependent recipe', hint: 'A recipe that lists another recipe depending on itself is part of a cycle: not makeable.', args: [['p', 'q'], [['q', 'x'], ['p']], ['x']], expected: [] },
    { scenario: 'Max size reversed chain', hint: '100 recipes where r_i needs r_(i+1), listed so the base recipe comes last: repeated full scans need many passes; a queue handles it in one.', argsGen: '() => { const rec = Array.from({ length: 100 }, (_, i) => "r" + i); const ing = rec.map((_, i) => (i === 99 ? ["s0"] : ["r" + (i + 1), "s" + (i % 100)])); const sup = Array.from({ length: 100 }, (_, i) => "s" + i); return [rec, ing, sup]; }', expected: ['r0', 'r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7', 'r8', 'r9', 'r10', 'r11', 'r12', 'r13', 'r14', 'r15', 'r16', 'r17', 'r18', 'r19', 'r20', 'r21', 'r22', 'r23', 'r24', 'r25', 'r26', 'r27', 'r28', 'r29', 'r30', 'r31', 'r32', 'r33', 'r34', 'r35', 'r36', 'r37', 'r38', 'r39', 'r40', 'r41', 'r42', 'r43', 'r44', 'r45', 'r46', 'r47', 'r48', 'r49', 'r50', 'r51', 'r52', 'r53', 'r54', 'r55', 'r56', 'r57', 'r58', 'r59', 'r60', 'r61', 'r62', 'r63', 'r64', 'r65', 'r66', 'r67', 'r68', 'r69', 'r70', 'r71', 'r72', 'r73', 'r74', 'r75', 'r76', 'r77', 'r78', 'r79', 'r80', 'r81', 'r82', 'r83', 'r84', 'r85', 'r86', 'r87', 'r88', 'r89', 'r90', 'r91', 'r92', 'r93', 'r94', 'r95', 'r96', 'r97', 'r98', 'r99'] },
    { scenario: 'Max size, one missing supply', hint: 'Same long chain but the base recipe needs an item nobody has — no recipe is makeable.', argsGen: '() => { const rec = Array.from({ length: 100 }, (_, i) => "r" + i); const ing = rec.map((_, i) => (i === 99 ? ["s0", "nope"] : ["r" + (i + 1), "s" + (i % 100)])); const sup = Array.from({ length: 100 }, (_, i) => "s" + i); return [rec, ing, sup]; }', expected: [] },
  ],

  solution: {
    code: `function findAllRecipes(recipes, ingredients, supplies) {
  const usedBy = new Map();                 // ingredient name → recipe indices that need it
  const need = ingredients.map((list) => list.length);   // in-degree of each recipe
  ingredients.forEach((list, i) => {
    for (const item of list) {
      if (!usedBy.has(item)) usedBy.set(item, []);
      usedBy.get(item).push(i);
    }
  });

  const queue = [...supplies];              // available items
  const made = [];
  for (let head = 0; head < queue.length; head++) {
    for (const i of usedBy.get(queue[head]) ?? []) {
      if (--need[i] === 0) {                // last missing ingredient arrived
        made.push(recipes[i]);
        queue.push(recipes[i]);             // the recipe is now an ingredient too
      }
    }
  }
  return made;
}`,
    explanation: 'Each recipe name can be pushed at most once because need[i] hits 0 exactly once.',
  },
  dryRun: { columns: ['pop', 'recipes affected', 'need after', 'made'], rows: [['yeast', 'bread', 'bread: 1', '[]'], ['flour', 'bread', 'bread: 0 → make', '[bread]'], ['meat', 'sandwich', 'sandwich: 1', '[bread]'], ['bread', 'sandwich', 'sandwich: 0 → make', '[bread, sandwich]']] },
  complexity: { time: 'O(S + Σ|ingredients[i]|)', space: 'O(S + Σ|ingredients[i]|)', explanation: 'Every (ingredient, recipe) pair is decremented at most once; each item is queued at most once.' },
  alternative: {
    title: 'DFS with memo (3 states)',
    md: '`canMake(name)`: supply → true; not a recipe → false; if currently visiting → false (cycle); otherwise all ingredients must be makeable. Cache the result.',
    complexity: 'O(S + Σ|ingredients|) time and space',
  },
  mistakes: [
    'Treating a recipe as makeable when only some ingredients are available (must reach need 0).',
    'Forgetting that a newly made recipe must be pushed so recipes using it can progress.',
    'Infinite loops on cyclic recipes in the brute-force "repeat until no change" approach if the stop condition is wrong.',
  ],
};
