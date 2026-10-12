export default {
  id: 'serialize-and-deserialize-binary-tree',
  title: 'Serialize and Deserialize Binary Tree',
  difficulty: 'Hard',
  order: 2,
  pattern: 'tree-serialization',
  tags: ['tree', 'dfs', 'bfs', 'design', 'string'],
  source: { platform: 'LeetCode', number: 297, url: 'https://leetcode.com/problems/serialize-and-deserialize-binary-tree/' },

  statement: `Design a way to turn a binary tree into a **string** (serialize) and to turn that string back into an **identical** tree (deserialize). You choose the format — it just has to round-trip exactly (same shape, same values, including negative numbers).

Implement a class \`Codec\` with two methods:
- \`serialize(root)\` → string
- \`deserialize(data)\` → root of the rebuilt tree

The tests call \`serialize\` on one \`Codec\` instance and \`deserialize\` on a **different** instance, so the string must contain all the information — you cannot keep the tree in a field.`,
  examples: [
    { input: 'root = [1,2,3,null,null,4,5]', output: '[1,2,3,null,null,4,5]', explanation: 'deserialize(serialize(root)) must produce the same tree.' },
    { input: 'root = []', output: '[]' },
  ],
  constraints: ['The number of nodes is in the range [0, 10^4]', '-1000 <= Node.val <= 1000'],

  think: `- Why is a plain list of values in preorder not enough to rebuild the tree?
- What extra token would make the shape unambiguous?
- When reading tokens back, how do you know which token belongs to which node — can the same traversal order help?`,
  patternChallenge: {
    options: ['Preorder with null markers (or BFS with nulls)', 'Inorder traversal only', 'Sorting the values', 'Storing the tree in a global variable'],
    answer: 0,
    explanation: 'Recording a marker for each missing child makes one traversal unambiguous; deserializing with the same traversal consumes tokens in the same order. Inorder alone (even with markers) cannot tell which node is the root.',
  },
  hints: [
    'Serialize with preorder DFS: write the value, or "#" for null, joined by commas.',
    'Deserialize: split on commas, keep an index into the token list, and write a recursive `build()` that reads one token — "#" → null, otherwise create the node and build its left then right child.',
  ],
  approach: `**Why nulls matter:** preorder \`1,2\` could be 2-as-left-child or 2-as-right-child. With markers: \`1,2,#,#,#\` vs \`1,#,2,#,#\` — different strings, so each string describes exactly one tree.

**Preorder encoding:**
- \`serialize\`: DFS; push \`String(val)\` or \`"#"\`; join with ",". O(n).
- \`deserialize\`: \`tokens = data.split(",")\`, pointer \`i = 0\`. \`build()\`: read \`tokens[i++]\`; "#" → null; else node, then \`node.left = build()\`, \`node.right = build()\`. Every token is read once → O(n).

Because a tree with n nodes has n + 1 null children, the string has 2n + 1 tokens.

**Level-order encoding** (like LeetCode's own format) works too: BFS writing "#" for null children, and deserialize with a queue attaching children two tokens at a time.

**Deep trees:** with 10⁴ nodes in a chain, recursion depth reaches 10⁴ — close to the JS limit. The BFS version (used as the reference solution) is fully iterative.`,

  functionName: 'Codec',
  paramNames: ['root'],
  starterCode: `/**
 * TreeNode is available globally: new TreeNode(val, left, right)
 */
class Codec {
  /**
   * Encodes a tree to a single string.
   * @param {TreeNode} root
   * @return {string}
   */
  serialize(root) {
    
  }

  /**
   * Decodes your encoded string back to a tree.
   * @param {string} data
   * @return {TreeNode}
   */
  deserialize(data) {
    
  }
}
`,
  // Round trip through TWO separate instances; the output is the rebuilt tree as a level-order array.
  harness: `(Codec, args, h) => {
    const original = h.arrayToTree(args[0]);
    const data = new Codec().serialize(original);
    if (typeof data !== 'string') throw new Error('serialize must return a string, got ' + typeof data);
    const rebuilt = new Codec().deserialize(data);
    return h.treeToArray(rebuilt);
  }`,
  tests: [
    { scenario: 'Example 1', hint: 'Missing children must be encoded so that 4 and 5 go back under 3, not under 2.',
      args: [[1, 2, 3, null, null, 4, 5]], expected: [1, 2, 3, null, null, 4, 5] },
    { scenario: 'Example 2', hint: 'The empty tree must round-trip to the empty tree.',
      args: [[]], expected: [] },
    { scenario: 'Single node', hint: 'Smallest non-empty tree.',
      args: [[1]], expected: [1] },
    { scenario: 'Only a left child', hint: 'Mistake check: without a null marker you cannot tell a left child from a right child.',
      args: [[1, 2]], expected: [1, 2] },
    { scenario: 'Only a right child', hint: 'The right-only shape must survive — record the null left child.',
      args: [[1, null, 2]], expected: [1, null, 2] },
    { scenario: 'Negative and multi-digit values', hint: 'Mistake check: parsing digit by digit breaks on "-1000"; split on a separator and convert whole tokens.',
      args: [[-1, 0, 1000, -1000, null, null, 7]], expected: [-1, 0, 1000, -1000, null, null, 7] },
    { scenario: 'Separator needed', hint: 'Mistake check: 1,23 and 12,3 both concatenate to "123" — use a delimiter.',
      args: [[123, 12, 3, 1, 23]], expected: [123, 12, 3, 1, 23] },
    { scenario: 'Zero values', hint: 'A node with value 0 is not a null — do not test tokens or values for truthiness.',
      args: [[0, 0, 0, null, 0]], expected: [0, 0, 0, null, 0] },
    { scenario: 'Duplicate values', hint: 'All values equal: only the null markers carry the shape.',
      args: [[1, 1, 1, 1, null, null, 1]], expected: [1, 1, 1, 1, null, null, 1] },
    { scenario: 'Sparse deep tree', hint: 'Nulls in the middle of the levels; the deserializer must pair tokens with the right parents.',
      args: [[5, 4, 7, 3, null, 2, null, -1, null, 9]], expected: [5, 4, 7, 3, null, 2, null, -1, null, 9] },
    { scenario: 'Left chain', hint: 'A 6-node left chain: one real child per level.',
      args: [[1, 2, null, 3, null, 4, null, 5, null, 6]], expected: [1, 2, null, 3, null, 4, null, 5, null, 6] },
    { scenario: 'Zigzag path', hint: 'Alternating left and right children.',
      args: [[1, 2, null, null, 3, 4, null, null, 5]], expected: [1, 2, null, null, 3, 4, null, null, 5] },
    { scenario: 'Perfect tree (31 nodes)', hint: 'A full five-level tree with varied values.',
      argsGen: '() => [Array.from({ length: 31 }, (_, i) => (i * 7) % 23 - 11)]', expected: [-11, -4, 3, 10, -6, 1, 8, -8, -1, 6, -10, -3, 4, 11, -5, 2, 9, -7, 0, 7, -9, -2, 5, -11, -4, 3, 10, -6, 1, 8, -8] },
    { scenario: 'Large complete tree (n = 10^4)', hint: 'The maximum size: 10 000 nodes with values across the full range. Build the string with an array + join, not repeated concatenation in a loop over a shifting queue.',
      argsGen: '() => [Array.from({ length: 10000 }, (_, i) => (i % 2001) - 1000)]', expected: Array.from({ length: 10000 }, (_, i) => (i % 2001) - 1000) },
    { scenario: 'Deep chain (5000 nodes)', hint: 'A 5000-deep left chain: every level carries one real node and one null marker. Recursive encoders must still round-trip it exactly.',
      argsGen: '() => { const a = []; for (let i = 0; i < 5000; i++) { a.push((i % 2001) - 1000); if (i > 0) a.push(null); } return [a]; }',
      expected: Array.from({ length: 9998 }, (_, j) => (j === 0 ? -1000 : j % 2 === 1 ? (((j + 1) / 2) % 2001) - 1000 : null)) },
  ],

  solution: {
    code: `class Codec {
  // Level-order (BFS) encoding with '#' for missing children — fully iterative.
  serialize(root) {
    if (root === null) return '';
    const out = [];
    const queue = [root];
    for (let head = 0; head < queue.length; head++) {
      const node = queue[head];
      if (node === null) { out.push('#'); continue; }
      out.push(String(node.val));
      queue.push(node.left, node.right);        // nulls are queued too
    }
    while (out[out.length - 1] === '#') out.pop(); // trailing nulls carry no information
    return out.join(',');
  }

  deserialize(data) {
    if (data === '') return null;
    const tokens = data.split(',');
    const root = new TreeNode(Number(tokens[0]));
    const queue = [root];
    let i = 1;
    for (let head = 0; head < queue.length && i < tokens.length; head++) {
      const node = queue[head];
      // the next two tokens are this node's left and right child
      if (i < tokens.length && tokens[i] !== '#') {
        node.left = new TreeNode(Number(tokens[i]));
        queue.push(node.left);
      }
      i++;
      if (i < tokens.length && tokens[i] !== '#') {
        node.right = new TreeNode(Number(tokens[i]));
        queue.push(node.right);
      }
      i++;
    }
    return root;
  }
}`,
    explanation: 'Each real node is followed (in BFS order) by exactly two child tokens, so the deserializer can pair tokens with parents using the same queue order.',
  },
  dryRun: {
    columns: ['step', 'queue / tokens', 'output'],
    rows: [
      ['serialize 1', 'queue [1]', '"1"'],
      ['serialize 2, 3', 'children of 1', '"1,2,3"'],
      ['nulls of 2', '#, #', '"1,2,3,#,#"'],
      ['4, 5 (children of 3)', '', '"1,2,3,#,#,4,5" (trailing #s trimmed)'],
      ['deserialize', 'root 1; tokens 2,3 → children of 1; #,# → none for 2; 4,5 → children of 3', 'same tree'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(n)', explanation: 'Each node and each null child is written and read once; the string has at most 2n + 1 tokens.' },
  alternative: {
    title: 'Preorder DFS with null markers',
    md: 'Shortest to write. Recursion depth equals the tree height.',
    code: `class Codec {
  serialize(root) {
    const out = [];
    (function dfs(node) {
      if (!node) { out.push('#'); return; }
      out.push(String(node.val));
      dfs(node.left);
      dfs(node.right);
    })(root);
    return out.join(',');
  }
  deserialize(data) {
    const tokens = data.split(',');
    let i = 0;
    function build() {
      const t = tokens[i++];
      if (t === '#') return null;
      const node = new TreeNode(Number(t));
      node.left = build();
      node.right = build();
      return node;
    }
    return build();
  }
}`,
    complexity: 'O(n) time, O(n) space (O(h) recursion)',
  },
  mistakes: [
    'Not recording null children — the shape cannot be rebuilt.',
    'Concatenating digits without a separator ("123" could be 1,2,3 or 12,3).',
    'Parsing with `parseInt(ch)` character by character — breaks on negatives and multi-digit values.',
    'Keeping the original tree in a class field instead of encoding it (fails with separate instances).',
  ],
};
