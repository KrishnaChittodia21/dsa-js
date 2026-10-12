export default {
  id: 'sliding-window',
  summary: 'Keep a range [left, right] over an array or string and update it incrementally as it slides, instead of recomputing every range from scratch.',

  jsTools: [
    { api: 'Map', use: 'Character/number → count inside the current window', complexity: 'get / set / delete: O(1) average' },
    { api: 'Set', use: '"Is this character already in the window?" for no-duplicate windows', complexity: 'add / has / delete: O(1) average' },
    { api: 'Array(26).fill(0)', use: 'Fixed-size frequency table for lowercase letters (faster than Map)', complexity: 'O(1) index access' },
    { api: 'str.charCodeAt(i) - 97', use: "Turn 'a'..'z' into 0..25 to index the frequency array", complexity: 'O(1)' },
    { api: 'Math.max / Math.min', use: 'Track best window length/sum seen so far', complexity: 'O(1)' },
    { api: 'Deque (toolkit)', use: 'Monotonic deque for window max/min (next topic: Queue & Deque)', complexity: 'O(1) amortized per element' },
  ],

  patterns: [
    {
      id: 'fixed-window',
      name: 'Sliding Window — Fixed Size',
      summary: 'The window always has exactly k elements. Each step: add the element entering on the right, remove the one leaving on the left.',
      whyItExists: 'Adjacent windows of size k share k − 1 elements. Recomputing each window costs O(k); updating it costs O(1). Over n windows that turns O(n·k) into O(n).',
      whenToUse: [
        'The problem fixes the subarray/substring length ("of size k", "k consecutive", "every window of length k")',
        'You need an aggregate (sum, average, count, max, distinct count) for every window of that size',
      ],
      clues: ['"subarray of size k"', '"k consecutive elements"', '"every window of length k"', '"average of each contiguous subarray of length k"', '"anagram / permutation of p inside s" (window length = p.length)'],
      whenNotToUse: [
        'The window length is not fixed and depends on a condition → use the variable-size window',
        'Elements do not need to be contiguous (subsequence) → think DP or hashing instead',
      ],
      template: `function fixedWindow(nums, k) {
  let windowSum = 0;
  let best = -Infinity;
  for (let right = 0; right < nums.length; right++) {
    windowSum += nums[right];            // 1. element enters
    if (right >= k) windowSum -= nums[right - k]; // 2. element leaves (window keeps size k)
    if (right >= k - 1) best = Math.max(best, windowSum); // 3. window is full → record
  }
  return best;
}`,
      variations: [
        { name: 'Fixed window + frequency map', description: 'Anagram / permutation checks: compare counts of the window with counts of the pattern.' },
        { name: 'Fixed window + monotonic deque', description: 'Max/min of every window in O(n) (Sliding Window Maximum).' },
        { name: 'Fixed window on a circular array', description: 'Use index % n or iterate 2n positions.' },
      ],
      mistakes: [
        'Recording the answer before the window is full (right < k − 1)',
        'Off-by-one on the element leaving: it is nums[right − k], not nums[right − k + 1]',
        'Initialising best with 0 when all values may be negative (use -Infinity)',
      ],
      evolution: {
        easy: 'Sum/average of every window of size k.',
        medium: 'Window + frequency map (find all anagrams, permutation in string).',
        hard: 'Window + extra structure: monotonic deque for maximum, two heaps for median, multiple word-sized windows.',
      },
    },
    {
      id: 'variable-window',
      name: 'Sliding Window — Variable Size',
      summary: 'Expand the right edge one step at a time; whenever the window breaks the rule, shrink it from the left until it is valid again.',
      whyItExists: 'For "longest/shortest range satisfying a rule" problems, checking every (start, end) pair is O(n²). If the rule is monotonic — shrinking a valid window keeps it valid, growing an invalid one keeps it invalid — each index enters and leaves the window at most once: O(n).',
      whenToUse: [
        'Longest / shortest contiguous subarray or substring that satisfies a condition',
        'Count subarrays satisfying "at most K" (and "exactly K = atMost(K) − atMost(K−1)")',
        'The condition is monotonic: adding elements only makes it "more violated" (or only "more satisfied")',
      ],
      clues: ['"longest substring"', '"shortest subarray"', '"at most K distinct"', '"without repeating characters"', '"sum ≥ target" with positive numbers', '"minimum window containing"', '"replace at most k"'],
      whenNotToUse: [
        'Array has negative numbers and the condition is about sums (shrinking may increase the sum) → use prefix sum + hash map or a monotonic deque',
        'The answer is not contiguous',
        'The validity of a window cannot be updated in O(1) when one element enters/leaves',
      ],
      template: `function longestValid(s) {
  const count = new Map();   // state describing the current window
  let left = 0;
  let best = 0;
  for (let right = 0; right < s.length; right++) {
    // 1. EXPAND: add s[right] to the window state
    count.set(s[right], (count.get(s[right]) ?? 0) + 1);

    // 2. SHRINK: while the window is invalid, remove s[left]
    while (/* window is invalid */ count.get(s[right]) > 1) {
      count.set(s[left], count.get(s[left]) - 1);
      left++;
    }

    // 3. RECORD: the window [left, right] is valid here
    best = Math.max(best, right - left + 1);
  }
  return best;
}`,
      variations: [
        { name: 'Longest valid window', description: 'Shrink while invalid, record after shrinking.' },
        { name: 'Shortest valid window', description: 'Shrink while valid, record inside the while loop (before removing).' },
        { name: 'Count windows (at most K)', description: 'Every valid window ending at right contributes right − left + 1 subarrays.' },
        { name: 'Exactly K', description: 'exactly(K) = atMost(K) − atMost(K − 1).' },
      ],
      mistakes: [
        'Using if instead of while to shrink (one removal may not be enough)',
        'Recording the answer while the window is still invalid',
        'Forgetting to delete a key when its count hits 0 (map.size then counts ghosts)',
        'Applying it to sums with negative numbers',
      ],
      evolution: {
        easy: 'Longest run with a simple rule (no duplicates in a small window).',
        medium: 'Rule tracked with a frequency map (at most K distinct, character replacement, sum ≥ target).',
        hard: 'Minimum window covering a multiset, "exactly K" via atMost difference, multiple interleaved windows.',
      },
    },
  ],

  lesson: {
    sections: [
      {
        id: 'what',
        title: 'What is it?',
        blocks: [
          {
            type: 'text',
            md: `A **sliding window** is simply a range that moves through an array (or string) instead of checking every possible range from scratch.

Picture the array \`[2, 1, 5, 1, 3, 2]\` and a question like *"what is the biggest sum of 3 neighbouring numbers?"*. We look at the numbers through a "window" that is 3 cells wide:

\`\`\`text
[2 1 5] 1 3 2    sum = 8
 2 [1 5 1] 3 2   sum = 7
 2 1 [5 1 3] 2   sum = 9   ← best
 2 1 5 [1 3 2]   sum = 6
\`\`\`

Every time the window slides one step, **one element enters on the right and one element leaves on the left**. Everything in the middle stays the same.`,
          },
          {
            type: 'callout',
            variant: 'definition',
            title: 'Formal terms',
            md: `- **Window** — a contiguous range \`[left, right]\` of the array.
- **Contiguous** — the elements are neighbours; no gaps (a *subarray* / *substring*, not a *subsequence*).
- **Window state** — whatever you track about the window (its sum, a frequency map, a count of zeros…).`,
          },
          {
            type: 'callout',
            variant: 'analogy',
            title: 'Real-world analogy',
            md: 'Think of a train passing a platform with a fixed-size sign in front of it. You never re-read the whole train — you only notice the carriage that just appeared on the right and the one that just disappeared on the left.',
          },
          {
            type: 'checkpoint',
            id: 'sliding-window-cp-1',
            question: 'Which of these problems is about a **contiguous** range (so a sliding window might apply)?',
            options: [
              'Pick any 3 numbers (in any positions) with the biggest sum',
              'Longest substring that contains no repeated character',
              'Longest subsequence that is strictly increasing',
              'Count pairs (i, j) anywhere in the array whose sum is 10',
            ],
            answer: 1,
            explanation: 'A **substring** is contiguous — its characters sit next to each other. Sliding windows only describe contiguous ranges.',
            misconceptions: {
              0: '"Any positions" means the chosen numbers can have gaps. That is not a window — just sort and take the top 3.',
              2: 'A *subsequence* may skip elements, so it is not a single window. Longest Increasing Subsequence is a Dynamic Programming problem.',
              3: 'Pairs anywhere in the array are not a range. That is a hash-map (complement lookup) problem.',
            },
            deeper: 'Ask yourself: *"Could the answer have a gap in it?"* If yes, it is not a sliding window. Words that guarantee "no gaps": **subarray, substring, consecutive, contiguous, window, k in a row**.',
          },
        ],
      },
      {
        id: 'why',
        title: 'Why do we need it?',
        blocks: [
          {
            type: 'text',
            md: `Without a window, we recompute each range from zero. For an array of \`n\` elements and ranges of size \`k\`, that is about \`n × k\` additions.

With a window, moving one step costs **one addition and one subtraction**, no matter how big \`k\` is. That turns **O(n·k)** into **O(n)**.

For \`n = 100,000\` and \`k = 50,000\` that is the difference between ~5,000,000,000 operations (seconds — too slow) and ~200,000 (instant).`,
          },
          {
            type: 'compare',
            left: {
              title: 'Recompute every window — O(n·k)',
              code: `for (let start = 0; start + k <= n; start++) {
  let sum = 0;
  for (let i = start; i < start + k; i++) sum += nums[i];
  best = Math.max(best, sum);
}`,
            },
            right: {
              title: 'Slide the window — O(n)',
              code: `let sum = 0;
for (let right = 0; right < n; right++) {
  sum += nums[right];                  // enters
  if (right >= k) sum -= nums[right - k]; // leaves
  if (right >= k - 1) best = Math.max(best, sum);
}`,
            },
          },
          {
            type: 'reflect',
            prompt: 'Do you understand **why** the sliding version does less work, even though it still visits every element?',
            deeper: `The brute-force version re-adds the **same middle elements** again and again. Window \`[1,5,1]\` and window \`[5,1,3]\` share \`5, 1\` — brute force adds them twice. The sliding version reuses the previous sum and only fixes the edges.

Rule of thumb: *if consecutive answers overlap a lot, reuse the overlap instead of recomputing it.* This idea (reuse previous work) shows up again in prefix sums and dynamic programming.`,
          },
        ],
      },
      {
        id: 'when',
        title: 'When should I use it?',
        blocks: [
          {
            type: 'text',
            md: `Use a sliding window when **all** of these are true:

1. The answer is a **contiguous** subarray / substring.
2. You can **update** the window's state in O(1) when one element enters or leaves.
3. For variable windows: the rule is **monotonic** — if a window is invalid, making it bigger never fixes it; if it is valid, making it smaller never breaks it (or the reverse).

There are two flavours:

| | Fixed-size window | Variable-size window |
|---|---|---|
| Window length | always \`k\` | grows and shrinks |
| Typical question | "for every window of size k…" | "longest / shortest range such that…" |
| Left pointer moves | exactly with right | only when the window becomes invalid |`,
          },
          {
            type: 'callout',
            variant: 'warning',
            title: 'The negative numbers trap',
            md: '"Shortest subarray with sum ≥ target" works with a variable window **only if all numbers are positive**. With negatives, shrinking the window can *increase* the sum, so the monotonic rule breaks. Those problems need prefix sums + a monotonic deque (you will meet this in the Queue & Deque topic).',
          },
          {
            type: 'checkpoint',
            id: 'sliding-window-cp-2',
            question: '`nums = [2, -1, 2]`, find the shortest subarray with sum ≥ 3. Why is a plain variable window risky here?',
            options: [
              'Because the array is too short',
              'Because with negative numbers, removing an element from the left can make the sum go UP, so "shrink while valid" is no longer safe',
              'Because the answer is not contiguous',
              'It is not risky; sliding window always works for sums',
            ],
            answer: 1,
            explanation: 'Removing `-1` from a window *increases* its sum. The window algorithm assumes shrinking only ever makes the sum smaller — negatives break that assumption.',
            misconceptions: {
              0: 'Array length does not matter. The issue is the *sign* of the numbers.',
              2: 'The answer is still a subarray, so it *is* contiguous. The problem is monotonicity, not contiguity.',
              3: 'It only works when every number is non-negative. Try it on `[2, -1, 2]` by hand and you will see the window skip the correct answer.',
            },
          },
        ],
      },
      {
        id: 'recognize',
        title: 'How do I recognize it?',
        blocks: [
          {
            type: 'recognition',
            clues: ['contiguous subarray / substring', 'longest / shortest / maximum / minimum length', '"at most K" / "exactly K"', 'fixed window size k', 'no repeating characters', 'contains all characters of…'],
            conclusion: 'Think Sliding Window',
          },
          {
            type: 'text',
            md: `A quick mental checklist when you read a problem:

1. **Contiguous?** Look for *subarray, substring, consecutive, window*.
2. **Optimise a length or count?** *longest, shortest, number of subarrays*.
3. **Can I update the state when one element enters/leaves?** (sum, map of counts, number of zeros…)

If all three are yes, a sliding window is very likely the intended solution.`,
          },
          {
            type: 'checkpoint',
            id: 'sliding-window-cp-3',
            question: '"Given a binary array and an integer k, return the maximum number of consecutive 1s if you can flip at most k zeros." Which window is this?',
            options: [
              'Fixed-size window of size k',
              'Variable-size window: the window is valid while it contains at most k zeros',
              'Not a window problem — it is binary search',
              'Not a window problem — it is dynamic programming',
            ],
            answer: 1,
            explanation: '"Consecutive" → contiguous. "Maximum number" → longest. "At most k zeros" → a rule we can track with a counter. Grow right; when zeros > k, shrink left.',
            misconceptions: {
              0: 'k is the number of flips allowed, not the window length. The window can be much longer than k.',
              2: 'You *could* binary search on the answer length, but it is O(n log n) and more complex. The window gives O(n).',
              3: 'DP is possible but unnecessary — the rule is monotonic, so the window is simpler and O(1) space.',
            },
          },
        ],
      },
      {
        id: 'intuition',
        title: 'Core intuition',
        blocks: [
          {
            type: 'text',
            md: `Imagine two fingers on the array: \`left\` and \`right\`. The window is everything between them.

- **Right finger** always moves forward — it *explores* new elements.
- **Left finger** only moves forward when it has to — to *repair* the window.

Because **neither finger ever moves backwards**, each element is added once and removed at most once. That is why the total work is O(n) even though there is a \`while\` loop inside the \`for\` loop.`,
          },
          {
            type: 'visual',
            scenario: 'sliding-window-fixed',
            input: { nums: [2, 1, 5, 1, 3, 2], k: 3 },
            caption: 'Fixed window of size 3: one element in, one element out per step.',
          },
          {
            type: 'checkpoint',
            id: 'sliding-window-cp-4',
            question: 'There is a `while` loop inside the `for` loop of the variable window. Why is the algorithm still O(n) and not O(n²)?',
            options: [
              'Because the while loop runs at most once per iteration',
              'Because left only moves forward, so across the WHOLE run it moves at most n times in total',
              'Because JavaScript optimises nested loops',
              'It is actually O(n²)',
            ],
            answer: 1,
            explanation: 'Count the total number of `left++` over the entire algorithm, not per iteration. `left` starts at 0 and never exceeds n, so all the while-loop iterations together add up to at most n. Total = n (right) + n (left) = O(n). This style of counting is called **amortized analysis**.',
            misconceptions: {
              0: 'In one iteration the while loop can run many times (e.g. when a duplicate is far to the left). It is the *total* across all iterations that is bounded.',
              2: 'The engine does not change the complexity of your algorithm. The bound comes from how the pointers move.',
              3: 'Nested loops are not automatically O(n²). What matters is how many times the inner body runs **in total**.',
            },
            deeper: 'Try it: for `s = "abcabcbb"` write down every value `left` takes. You will see it only increases: 0,1,2,3,5,7… It can never exceed 8, so the inner loop body runs at most 8 times altogether.',
          },
        ],
      },
      {
        id: 'brute-force',
        title: 'Brute-force approach',
        blocks: [
          {
            type: 'text',
            md: 'Let us use a concrete problem: **Longest substring without repeating characters** (`"abcabcbb"` → `3`, for `"abc"`). Always start with the simplest correct idea: try every start, extend while characters are unique.',
          },
          {
            type: 'code',
            title: 'Brute force — O(n²) time, O(σ) space',
            code: `function lengthOfLongestSubstring(s) {
  let best = 0;
  for (let start = 0; start < s.length; start++) {
    const seen = new Set();
    for (let end = start; end < s.length; end++) {
      if (seen.has(s[end])) break;   // duplicate → this start can go no further
      seen.add(s[end]);
      best = Math.max(best, end - start + 1);
    }
  }
  return best;
}`,
            caption: 'σ (sigma) = size of the alphabet, i.e. the most distinct characters the Set can hold.',
          },
          {
            type: 'checkpoint',
            id: 'sliding-window-cp-5',
            question: 'After the brute force finds a duplicate at `end`, it throws away the Set and starts again from `start + 1`. What work is being wasted?',
            options: [
              'None — every start needs its own Set',
              'The characters between start+1 and end-1 were already known to be unique, yet we re-check them',
              'Sorting the string',
              'Creating the variable best',
            ],
            answer: 1,
            explanation: 'If `s[start..end-1]` had no duplicates, then any smaller piece of it also has no duplicates. Restarting re-discovers facts we already knew. The sliding window keeps them and only removes characters from the left until the duplicate is gone.',
            misconceptions: {
              0: 'Adjacent starts share almost the whole Set. Rebuilding it is exactly the waste the window removes.',
              2: 'Nothing is sorted here.',
              3: 'That is O(1) and irrelevant to the complexity.',
            },
          },
        ],
      },
      {
        id: 'optimized',
        title: 'Optimized approach',
        blocks: [
          {
            type: 'steps',
            title: 'Variable window for "longest substring without repeats"',
            steps: [
              'Keep `left = 0` and a Set of the characters inside the window.',
              'Move `right` from 0 to n − 1. The new character is `s[right]`.',
              'While `s[right]` is already in the Set, the window is invalid: remove `s[left]` from the Set and do `left++`.',
              'Now the window is valid: add `s[right]` and update `best = max(best, right − left + 1)`.',
            ],
          },
          {
            type: 'visual',
            scenario: 'sliding-window-variable',
            input: { s: 'abcabcbb' },
            caption: 'Watch the left edge jump forward only when a duplicate appears.',
          },
          {
            type: 'checkpoint',
            id: 'sliding-window-cp-6',
            question: 'The window currently holds `"abc"` and the next character is `"a"`. The window has become invalid. What should we do?',
            options: [
              'Expand it — move right further',
              'Shrink it — move left forward until the old "a" is gone',
              'Restart from index 0',
              'Sort the characters',
            ],
            answer: 1,
            explanation: 'An invalid window can only be repaired by removing elements from the **left**. Moving right would add even more characters and never remove the duplicate.',
            misconceptions: {
              0: 'Expanding cannot remove the duplicate — the window stays invalid forever. Right only moves once the window is valid again.',
              2: 'Restarting throws away everything we know (that was the brute force). Left only ever moves forward.',
              3: 'Sorting destroys the order of characters, and substrings depend on order.',
            },
            deeper: 'A useful sentence to remember: **"Right explores, left repairs."** The right pointer finds new candidates; the left pointer restores the rule.',
          },
          {
            type: 'reflect',
            prompt: 'Do you understand why we record the answer **after** the while loop and not before it?',
            deeper: 'Before the while loop the window may be invalid (it may contain the duplicate). The while loop is the "repair" step. Only after repairing is `[left, right]` guaranteed valid, so only then is `right − left + 1` a legal candidate. For *shortest-window* problems it is the opposite: we record **inside** the while loop, because there we shrink while the window is still valid.',
          },
        ],
      },
      {
        id: 'template',
        title: 'Pattern / template',
        blocks: [
          {
            type: 'text',
            md: 'Almost every variable-window problem fits this skeleton. The only things that change are **what state you keep** and **what "invalid" means**.',
          },
          {
            type: 'code',
            title: 'Variable window — longest valid',
            code: `function longestValid(arr) {
  let left = 0, best = 0;
  // state: sum / Map of counts / number of zeros / ...
  for (let right = 0; right < arr.length; right++) {
    // 1. add arr[right] to state
    while (/* state is invalid */ false) {
      // 2. remove arr[left] from state
      left++;
    }
    // 3. window [left, right] is valid
    best = Math.max(best, right - left + 1);
  }
  return best;
}`,
          },
          {
            type: 'code',
            title: 'Variable window — shortest valid',
            code: `function shortestValid(arr, target) {
  let left = 0, sum = 0, best = Infinity;
  for (let right = 0; right < arr.length; right++) {
    sum += arr[right];
    while (sum >= target) {            // valid → try to make it smaller
      best = Math.min(best, right - left + 1);
      sum -= arr[left];
      left++;
    }
  }
  return best === Infinity ? 0 : best;
}`,
          },
          {
            type: 'checkpoint',
            id: 'sliding-window-cp-7',
            question: 'In the **shortest** valid window template, why is the answer recorded **inside** the while loop?',
            options: [
              'Because the while loop runs while the window is VALID, and each shrink step produces a smaller valid candidate',
              'Because it is faster',
              'It is a mistake; it should be after the loop like the longest template',
              'Because Infinity must be replaced as early as possible',
            ],
            answer: 0,
            explanation: 'For shortest windows we shrink **while valid** — every state inside the loop is a valid window, and each is shorter than the last. After the loop the window is invalid, so recording there would be wrong.',
            misconceptions: {
              1: 'It is about correctness, not speed: after the loop the window is invalid.',
              2: 'The two templates are mirror images. Longest: shrink while *invalid*, record after. Shortest: shrink while *valid*, record inside.',
              3: 'The timing of replacing Infinity is irrelevant; what matters is recording only valid windows.',
            },
          },
          {
            type: 'text',
            md: `**Counting trick — "exactly K":** counting subarrays with *exactly* K distinct values is hard to do directly, because the rule is not monotonic. But "at most K" *is* monotonic, and:

\`\`\`text
exactly(K) = atMost(K) − atMost(K − 1)
\`\`\`

For "at most K", every valid window \`[left, right]\` contributes \`right − left + 1\` subarrays that end at \`right\`.`,
          },
        ],
      },
      {
        id: 'implementation',
        title: 'JavaScript implementation',
        blocks: [
          {
            type: 'code',
            title: 'Longest substring without repeating characters — O(n)',
            code: `function lengthOfLongestSubstring(s) {
  const inWindow = new Set();
  let left = 0;
  let best = 0;
  for (let right = 0; right < s.length; right++) {
    while (inWindow.has(s[right])) {  // invalid: duplicate of s[right]
      inWindow.delete(s[left]);
      left++;
    }
    inWindow.add(s[right]);
    best = Math.max(best, right - left + 1);
  }
  return best;
}`,
          },
          {
            type: 'code',
            title: 'Optimisation: jump left directly with a Map of last positions',
            code: `function lengthOfLongestSubstring(s) {
  const lastSeen = new Map(); // char → last index
  let left = 0, best = 0;
  for (let right = 0; right < s.length; right++) {
    const ch = s[right];
    if (lastSeen.has(ch) && lastSeen.get(ch) >= left) {
      left = lastSeen.get(ch) + 1;   // jump past the previous copy
    }
    lastSeen.set(ch, right);
    best = Math.max(best, right - left + 1);
  }
  return best;
}`,
            caption: 'Same O(n), but left jumps instead of stepping. Note the `>= left` check: an old occurrence outside the window must be ignored.',
          },
          {
            type: 'callout',
            variant: 'tip',
            title: 'JavaScript notes',
            md: `- \`map.get(k) ?? 0\` is the cleanest "default to 0" for counts (\`??\` only falls back on \`null\`/\`undefined\`, unlike \`||\` which also replaces \`0\`).
- When a count reaches 0, call \`map.delete(k)\` if you rely on \`map.size\` to count distinct elements.
- For lowercase-only strings, \`new Array(26).fill(0)\` indexed by \`s.charCodeAt(i) - 97\` is faster than a Map.`,
          },
        ],
      },
      {
        id: 'dry-run',
        title: 'Dry run',
        blocks: [
          {
            type: 'dryrun',
            title: 'lengthOfLongestSubstring("abcabcbb")',
            columns: ['right', 's[right]', 'action', 'window', 'best'],
            rows: [
              ['0', 'a', 'add a', '"a"', '1'],
              ['1', 'b', 'add b', '"ab"', '2'],
              ['2', 'c', 'add c', '"abc"', '3'],
              ['3', 'a', 'duplicate → remove a, left=1; add a', '"bca"', '3'],
              ['4', 'b', 'duplicate → remove b, left=2; add b', '"cab"', '3'],
              ['5', 'c', 'duplicate → remove c, left=3; add c', '"abc"', '3'],
              ['6', 'b', 'remove a, remove b (left=5); add b', '"cb"', '3'],
              ['7', 'b', 'remove c, remove b (left=7); add b', '"b"', '3'],
            ],
            note: 'left moved 7 times in total and right 8 times → 15 steps for n = 8. Linear.',
          },
          {
            type: 'checkpoint',
            id: 'sliding-window-cp-8',
            question: 'At right = 6 (character "b"), the window was "abc" (left = 3). Why did left move **two** steps?',
            options: [
              'Because the window must always have size 2',
              'Because the duplicate "b" was the second character of the window, so both "a" and the old "b" had to leave',
              'Because of a bug',
              'Because right moved two steps',
            ],
            answer: 1,
            explanation: 'We remove from the left **until** the duplicate is gone. The old "b" was at index 4, so indices 3 ("a") and 4 ("b") both leave. That is why we use `while`, not `if`.',
            misconceptions: {
              0: 'Variable windows have no fixed size — they shrink exactly as much as needed.',
              2: 'This is the intended behaviour: `while` keeps removing until the window is valid again.',
              3: 'Right moves exactly one step per iteration of the for loop.',
            },
          },
        ],
      },
      {
        id: 'mistakes',
        title: 'Common mistakes',
        blocks: [
          {
            type: 'text',
            md: `1. **\`if\` instead of \`while\`** when shrinking — one removal is not always enough.
2. **Recording at the wrong time** — longest: after shrinking; shortest: inside the shrink loop.
3. **Stale map entries** — forgetting \`map.delete(key)\` when a count drops to 0, so \`map.size\` is wrong.
4. **Fixed window off-by-one** — the element leaving is \`nums[right - k]\`; the window is full once \`right >= k - 1\`.
5. **Negative numbers with sum conditions** — the monotonic assumption fails.
6. **Using \`||\` for defaults** — \`count.get(x) || 0\` works for counts, but \`||\` also replaces valid \`0\`/\`""\` values in other contexts; prefer \`??\`.
7. **Using \`s.substring()\` inside the loop** to inspect the window — that is O(k) per step and silently brings back O(n·k).`,
          },
          {
            type: 'checkpoint',
            id: 'sliding-window-cp-9',
            question: 'You keep a Map of counts for "at most 2 distinct characters". When the window is "aab" and you remove both "a"s, `count` is `{a: 0, b: 1}`. What is `count.size` and why does it matter?',
            options: [
              '1 — Maps ignore zero values',
              '2 — the key "a" still exists with value 0, so the window looks like it has 2 distinct characters',
              '0 — both keys are removed automatically',
              '3 — size counts total characters',
            ],
            answer: 1,
            explanation: 'A Map keeps a key until you call `delete`. If distinctness is checked with `count.size`, you must `count.delete(ch)` when its count reaches 0.',
            misconceptions: {
              0: 'Maps store any value, including 0. Only `delete` removes a key.',
              2: 'Nothing is removed automatically.',
              3: '`size` is the number of keys, not the sum of values.',
            },
          },
        ],
      },
      {
        id: 'complexity',
        title: 'Complexity',
        blocks: [
          {
            type: 'complexity',
            time: 'O(n)',
            space: 'O(k) or O(σ)',
            md: `**Time:** each index is added once (by right) and removed at most once (by left) → at most 2n steps.

**Space:** the window state. A running sum is O(1); a frequency map holds at most min(k, σ) keys, where σ is the alphabet size (26 for lowercase letters, so effectively O(1)).`,
          },
        ],
      },
      {
        id: 'interview-tips',
        title: 'Interview tips',
        blocks: [
          {
            type: 'text',
            md: `- **Say the brute force first** ("try every substring — O(n²)"), then say *what is repeated* and how the window reuses it. Interviewers want to hear the optimisation reasoning.
- **State the invariant out loud**: "The window [left, right] never contains a duplicate after the while loop."
- **Name the complexity argument**: "left and right each move at most n times, so it's O(n) amortized."
- **Check monotonicity** before committing: "All numbers are positive, so shrinking always decreases the sum — the window is valid."
- **Edge cases to mention:** empty input, k > n, all identical characters, answer is the whole array.`,
          },
        ],
      },
      {
        id: 'js-tools',
        title: 'JavaScript tools',
        blocks: [
          {
            type: 'jsTools',
            items: [
              { api: 'new Map()', use: 'Counts inside the window: map.set(ch, (map.get(ch) ?? 0) + 1)', complexity: 'O(1) average' },
              { api: 'map.delete(key)', use: 'Keep map.size equal to the number of distinct elements', complexity: 'O(1) average' },
              { api: 'new Set()', use: 'Membership for "no duplicates" windows', complexity: 'O(1) average' },
              { api: 'new Array(26).fill(0)', use: 'Letter counts for lowercase strings', complexity: 'O(1) access' },
              { api: 's.charCodeAt(i) - 97', use: "Map 'a'..'z' to 0..25", complexity: 'O(1)' },
              { api: 's[i]', use: 'Read a character without creating substrings', complexity: 'O(1)' },
              { api: 'Math.max / Math.min', use: 'Track the best window', complexity: 'O(1)' },
            ],
          },
        ],
      },
    ],
  },

  cheatsheet: {
    whenToUse: ['Contiguous subarray/substring', 'Longest/shortest/count of windows satisfying a monotonic rule', 'Aggregate over every window of size k'],
    clues: ['subarray', 'substring', 'consecutive', 'longest / shortest', 'at most K', 'exactly K', 'window of size k', 'without repeating'],
    template: `let left = 0, best = 0;
for (let right = 0; right < n; right++) {
  add(arr[right]);
  while (invalid()) remove(arr[left++]);
  best = Math.max(best, right - left + 1);
}`,
    complexity: 'O(n) time (each index enters and leaves once), O(k) / O(σ) space',
    mistakes: ['if instead of while', 'recording before the window is valid', 'stale Map keys with count 0', 'negative numbers with sum rules', 'fixed-window off-by-one (nums[right-k] leaves)'],
    jsTools: ['Map', 'Set', 'Array(26)', 'charCodeAt', 'Math.max'],
  },

  keyConcepts: [
    'A window is a contiguous range [left, right]; sliding reuses the overlap between consecutive ranges.',
    'Fixed window: one element enters, one leaves per step.',
    'Variable window: right explores, left repairs. Shrink while invalid (longest) or while valid (shortest).',
    'The algorithm is O(n) because each pointer only moves forward — amortized analysis.',
    'Requires a monotonic rule; negative numbers break sum-based windows.',
    'exactly(K) = atMost(K) − atMost(K − 1) turns non-monotonic counting into two window passes.',
  ],

  interviewTips: [
    'Explain the brute force, then point at the repeated work the window eliminates.',
    'State the window invariant explicitly.',
    'Justify O(n) with "each pointer moves at most n times".',
  ],
};
