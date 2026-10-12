export default {
  id: 'reverse-string',
  title: 'Reverse String',
  difficulty: 'Easy',
  order: 3,
  pattern: 'recursion-reduce-and-trust',
  tags: ['recursion', 'two pointers', 'string'],
  source: { platform: 'LeetCode', number: 344, url: 'https://leetcode.com/problems/reverse-string/' },

  statement: `You are given a string as an **array of characters** \`s\`. Reverse it **in place** — modify the array itself using O(1) extra *heap* memory, and return nothing.

For this lesson, solve it **recursively**.`,
  examples: [
    { input: 's = ["h","e","l","l","o"]', output: '["o","l","l","e","h"]' },
    { input: 's = ["H","a","n","n","a","h"]', output: '["h","a","n","n","a","H"]' },
  ],
  constraints: ['1 <= s.length <= 10^5 (our tests are smaller — see the mistakes section about stack depth)', 's[i] is a printable ASCII character'],

  think: `- If you swap the first and last characters, what smaller problem is left?
- What should your recursive helper receive so that it does not copy the array?
- When is the remaining range "already reversed"?`,
  patternChallenge: {
    options: ['Hash Map', 'Recursion (reduce & trust) on a shrinking index range', 'Sorting', 'Divide & Conquer on all split points'],
    answer: 1,
    explanation: 'After swapping the two ends, the middle part `s[1..n−2]` is the same problem, one size smaller on each side. A helper `go(l, r)` with base case `l >= r` expresses that directly.',
  },
  hints: [
    'Write a helper `go(l, r)` that reverses `s[l..r]`.',
    'Base case: `l >= r` (0 or 1 element). Otherwise swap `s[l]` and `s[r]`, then call `go(l + 1, r - 1)`.',
  ],
  approach: `**Idea:** reversing \`s[l..r]\` = swap the ends, then reverse \`s[l+1..r−1]\`. Base case: an empty or one-character range is already reversed.

Pass **indices**, not slices — a slice copies O(n) characters per call and breaks the in-place requirement.

**JavaScript warning:** the recursion depth is n / 2. For n = 10^5 that is 50,000 frames, above the typical ~10k JS stack limit, so in production (and for LeetCode's maximum) the two-pointer loop in the alternative is the safe choice. This question is here to practise the recursive shape.`,

  functionName: 'reverseString',
  paramNames: ['s'],
  io: { params: ['any'], mutates: 0 },
  starterCode: `/**
 * @param {character[]} s
 * @return {void} Do not return anything, modify s in-place instead.
 */
function reverseString(s) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Odd length: the middle "l" stays put.', args: [["h","e","l","l","o"]], expected: ["o","l","l","e","h"] },
    { scenario: 'Example 2', hint: 'Even length: the two pointers cross without ever being equal.', args: [["H","a","n","n","a","h"]], expected: ["h","a","n","n","a","H"] },
    { scenario: 'Single character', hint: 'Smallest input: nothing to swap.', args: [["a"]], expected: ["a"] },
    { scenario: 'Two characters', hint: 'One swap. A base case of only `l === r` never stops for even lengths — use `l >= r`.', args: [["a","b"]], expected: ["b","a"] },
    { scenario: 'Three characters', hint: 'Swap the ends; the middle is the base case.', args: [["a","b","c"]], expected: ["c","b","a"] },
    { scenario: 'Four characters', hint: 'Two swaps, then l and r cross.', args: [["a","b","c","d"]], expected: ["d","c","b","a"] },
    { scenario: 'Punctuation and spaces', hint: 'Any printable ASCII character is moved like a letter.', args: [["1"," ","!","Z"]], expected: ["Z","!"," ","1"] },
    { scenario: 'Palindrome', hint: 'Reversing a palindrome leaves it unchanged — but you still must modify the input in place.', args: [["r","a","c","e","c","a","r"]], expected: ["r","a","c","e","c","a","r"] },
    { scenario: 'All characters equal', hint: 'Swaps of equal characters change nothing.', args: [["x","x","x","x","x","x"]], expected: ["x","x","x","x","x","x"] },
    { scenario: 'Mixed case', hint: 'Upper and lower case letters are different characters.', args: [["A","b","C","d","E"]], expected: ["E","d","C","b","A"] },
    { scenario: 'In-place check', hint: 'The tests inspect the input array. Returning a new reversed array (or reversing a slice) leaves the input untouched.', args: [["p","q","r","s","t","u","v","w"]], expected: ["w","v","u","t","s","r","q","p"] },
    { scenario: 'Large input (2000 chars)', hint: 'Depth n/2 = 1000 is still safe; for n = 10^5 a loop would be required in JS.', argsGen: '() => [Array.from({ length: 2000 }, (_, i) => String.fromCharCode(33 + ((i * 7) % 94)))]', expected: ["r","k","d","]","V","O","H","A",":","3",",","%","|","u","n","g","`","Y","R","K","D","=","6","/","(","!","x","q","j","c","\\","U","N","G","@","9","2","+","$","{","t","m","f","_","X","Q","J","C","<","5",".","'","~","w","p","i","b","[","T","M","F","?","8","1","*","#","z","s","l","e","^","W","P","I","B",";","4","-","&","}","v","o","h","a","Z","S","L","E",">","7","0",")","\"","y","r","k","d","]","V","O","H","A",":","3",",","%","|","u","n","g","`","Y","R","K","D","=","6","/","(","!","x","q","j","c","\\","U","N","G","@","9","2","+","$","{","t","m","f","_","X","Q","J","C","<","5",".","'","~","w","p","i","b","[","T","M","F","?","8","1","*","#","z","s","l","e","^","W","P","I","B",";","4","-","&","}","v","o","h","a","Z","S","L","E",">","7","0",")","\"","y","r","k","d","]","V","O","H","A",":","3",",","%","|","u","n","g","`","Y","R","K","D","=","6","/","(","!","x","q","j","c","\\","U","N","G","@","9","2","+","$","{","t","m","f","_","X","Q","J","C","<","5",".","'","~","w","p","i","b","[","T","M","F","?","8","1","*","#","z","s","l","e","^","W","P","I","B",";","4","-","&","}","v","o","h","a","Z","S","L","E",">","7","0",")","\"","y","r","k","d","]","V","O","H","A",":","3",",","%","|","u","n","g","`","Y","R","K","D","=","6","/","(","!","x","q","j","c","\\","U","N","G","@","9","2","+","$","{","t","m","f","_","X","Q","J","C","<","5",".","'","~","w","p","i","b","[","T","M","F","?","8","1","*","#","z","s","l","e","^","W","P","I","B",";","4","-","&","}","v","o","h","a","Z","S","L","E",">","7","0",")","\"","y","r","k","d","]","V","O","H","A",":","3",",","%","|","u","n","g","`","Y","R","K","D","=","6","/","(","!","x","q","j","c","\\","U","N","G","@","9","2","+","$","{","t","m","f","_","X","Q","J","C","<","5",".","'","~","w","p","i","b","[","T","M","F","?","8","1","*","#","z","s","l","e","^","W","P","I","B",";","4","-","&","}","v","o","h","a","Z","S","L","E",">","7","0",")","\"","y","r","k","d","]","V","O","H","A",":","3",",","%","|","u","n","g","`","Y","R","K","D","=","6","/","(","!","x","q","j","c","\\","U","N","G","@","9","2","+","$","{","t","m","f","_","X","Q","J","C","<","5",".","'","~","w","p","i","b","[","T","M","F","?","8","1","*","#","z","s","l","e","^","W","P","I","B",";","4","-","&","}","v","o","h","a","Z","S","L","E",">","7","0",")","\"","y","r","k","d","]","V","O","H","A",":","3",",","%","|","u","n","g","`","Y","R","K","D","=","6","/","(","!","x","q","j","c","\\","U","N","G","@","9","2","+","$","{","t","m","f","_","X","Q","J","C","<","5",".","'","~","w","p","i","b","[","T","M","F","?","8","1","*","#","z","s","l","e","^","W","P","I","B",";","4","-","&","}","v","o","h","a","Z","S","L","E",">","7","0",")","\"","y","r","k","d","]","V","O","H","A",":","3",",","%","|","u","n","g","`","Y","R","K","D","=","6","/","(","!","x","q","j","c","\\","U","N","G","@","9","2","+","$","{","t","m","f","_","X","Q","J","C","<","5",".","'","~","w","p","i","b","[","T","M","F","?","8","1","*","#","z","s","l","e","^","W","P","I","B",";","4","-","&","}","v","o","h","a","Z","S","L","E",">","7","0",")","\"","y","r","k","d","]","V","O","H","A",":","3",",","%","|","u","n","g","`","Y","R","K","D","=","6","/","(","!","x","q","j","c","\\","U","N","G","@","9","2","+","$","{","t","m","f","_","X","Q","J","C","<","5",".","'","~","w","p","i","b","[","T","M","F","?","8","1","*","#","z","s","l","e","^","W","P","I","B",";","4","-","&","}","v","o","h","a","Z","S","L","E",">","7","0",")","\"","y","r","k","d","]","V","O","H","A",":","3",",","%","|","u","n","g","`","Y","R","K","D","=","6","/","(","!","x","q","j","c","\\","U","N","G","@","9","2","+","$","{","t","m","f","_","X","Q","J","C","<","5",".","'","~","w","p","i","b","[","T","M","F","?","8","1","*","#","z","s","l","e","^","W","P","I","B",";","4","-","&","}","v","o","h","a","Z","S","L","E",">","7","0",")","\"","y","r","k","d","]","V","O","H","A",":","3",",","%","|","u","n","g","`","Y","R","K","D","=","6","/","(","!","x","q","j","c","\\","U","N","G","@","9","2","+","$","{","t","m","f","_","X","Q","J","C","<","5",".","'","~","w","p","i","b","[","T","M","F","?","8","1","*","#","z","s","l","e","^","W","P","I","B",";","4","-","&","}","v","o","h","a","Z","S","L","E",">","7","0",")","\"","y","r","k","d","]","V","O","H","A",":","3",",","%","|","u","n","g","`","Y","R","K","D","=","6","/","(","!","x","q","j","c","\\","U","N","G","@","9","2","+","$","{","t","m","f","_","X","Q","J","C","<","5",".","'","~","w","p","i","b","[","T","M","F","?","8","1","*","#","z","s","l","e","^","W","P","I","B",";","4","-","&","}","v","o","h","a","Z","S","L","E",">","7","0",")","\"","y","r","k","d","]","V","O","H","A",":","3",",","%","|","u","n","g","`","Y","R","K","D","=","6","/","(","!","x","q","j","c","\\","U","N","G","@","9","2","+","$","{","t","m","f","_","X","Q","J","C","<","5",".","'","~","w","p","i","b","[","T","M","F","?","8","1","*","#","z","s","l","e","^","W","P","I","B",";","4","-","&","}","v","o","h","a","Z","S","L","E",">","7","0",")","\"","y","r","k","d","]","V","O","H","A",":","3",",","%","|","u","n","g","`","Y","R","K","D","=","6","/","(","!","x","q","j","c","\\","U","N","G","@","9","2","+","$","{","t","m","f","_","X","Q","J","C","<","5",".","'","~","w","p","i","b","[","T","M","F","?","8","1","*","#","z","s","l","e","^","W","P","I","B",";","4","-","&","}","v","o","h","a","Z","S","L","E",">","7","0",")","\"","y","r","k","d","]","V","O","H","A",":","3",",","%","|","u","n","g","`","Y","R","K","D","=","6","/","(","!","x","q","j","c","\\","U","N","G","@","9","2","+","$","{","t","m","f","_","X","Q","J","C","<","5",".","'","~","w","p","i","b","[","T","M","F","?","8","1","*","#","z","s","l","e","^","W","P","I","B",";","4","-","&","}","v","o","h","a","Z","S","L","E",">","7","0",")","\"","y","r","k","d","]","V","O","H","A",":","3",",","%","|","u","n","g","`","Y","R","K","D","=","6","/","(","!","x","q","j","c","\\","U","N","G","@","9","2","+","$","{","t","m","f","_","X","Q","J","C","<","5",".","'","~","w","p","i","b","[","T","M","F","?","8","1","*","#","z","s","l","e","^","W","P","I","B",";","4","-","&","}","v","o","h","a","Z","S","L","E",">","7","0",")","\"","y","r","k","d","]","V","O","H","A",":","3",",","%","|","u","n","g","`","Y","R","K","D","=","6","/","(","!","x","q","j","c","\\","U","N","G","@","9","2","+","$","{","t","m","f","_","X","Q","J","C","<","5",".","'","~","w","p","i","b","[","T","M","F","?","8","1","*","#","z","s","l","e","^","W","P","I","B",";","4","-","&","}","v","o","h","a","Z","S","L","E",">","7","0",")","\"","y","r","k","d","]","V","O","H","A",":","3",",","%","|","u","n","g","`","Y","R","K","D","=","6","/","(","!","x","q","j","c","\\","U","N","G","@","9","2","+","$","{","t","m","f","_","X","Q","J","C","<","5",".","'","~","w","p","i","b","[","T","M","F","?","8","1","*","#","z","s","l","e","^","W","P","I","B",";","4","-","&","}","v","o","h","a","Z","S","L","E",">","7","0",")","\"","y","r","k","d","]","V","O","H","A",":","3",",","%","|","u","n","g","`","Y","R","K","D","=","6","/","(","!","x","q","j","c","\\","U","N","G","@","9","2","+","$","{","t","m","f","_","X","Q","J","C","<","5",".","'","~","w","p","i","b","[","T","M","F","?","8","1","*","#","z","s","l","e","^","W","P","I","B",";","4","-","&","}","v","o","h","a","Z","S","L","E",">","7","0",")","\"","y","r","k","d","]","V","O","H","A",":","3",",","%","|","u","n","g","`","Y","R","K","D","=","6","/","(","!","x","q","j","c","\\","U","N","G","@","9","2","+","$","{","t","m","f","_","X","Q","J","C","<","5",".","'","~","w","p","i","b","[","T","M","F","?","8","1","*","#","z","s","l","e","^","W","P","I","B",";","4","-","&","}","v","o","h","a","Z","S","L","E",">","7","0",")","\"","y","r","k","d","]","V","O","H","A",":","3",",","%","|","u","n","g","`","Y","R","K","D","=","6","/","(","!","x","q","j","c","\\","U","N","G","@","9","2","+","$","{","t","m","f","_","X","Q","J","C","<","5",".","'","~","w","p","i","b","[","T","M","F","?","8","1","*","#","z","s","l","e","^","W","P","I","B",";","4","-","&","}","v","o","h","a","Z","S","L","E",">","7","0",")","\"","y","r","k","d","]","V","O","H","A",":","3",",","%","|","u","n","g","`","Y","R","K","D","=","6","/","(","!"] },
  ],

  solution: {
    code: `function reverseString(s) {
  function go(l, r) {
    if (l >= r) return;               // base case: nothing (or one char) left
    [s[l], s[r]] = [s[r], s[l]];      // fix the two ends
    go(l + 1, r - 1);                 // trust the call to reverse the middle
  }
  go(0, s.length - 1);
}`,
  },
  dryRun: {
    columns: ['call', 'l', 'r', 'array after swap'],
    rows: [
      ['1', '0', '4', 'o e l l h'],
      ['2', '1', '3', 'o l l e h'],
      ['3', '2', '2', 'base case (l >= r) — stop'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(n) stack', explanation: 'n / 2 calls, each O(1). There is no extra heap memory, but the call stack holds n / 2 frames — that is why the iterative version is O(1) space.' },
  alternative: {
    title: 'Two-pointer loop (production choice)',
    md: 'The recursion is tail-recursive, which converts mechanically to a loop. Same swaps, O(1) space, no stack-depth risk.',
    code: `function reverseString(s) {
  for (let l = 0, r = s.length - 1; l < r; l++, r--) {
    [s[l], s[r]] = [s[r], s[l]];
  }
}`,
    complexity: 'O(n) time, O(1) space',
  },
  mistakes: [
    'Recursing on `s.slice(1, -1)` — it copies and reverses the copy, not the original array.',
    'Base case `l === r` only: for even lengths l and r cross without ever being equal (use `l >= r`).',
    'Using recursion for n = 10^5 in JS: depth 50,000 exceeds the default stack and throws RangeError.',
    'Returning a new array — the tests inspect the mutated input.',
  ],
};
