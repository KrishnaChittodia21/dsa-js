#!/usr/bin/env node
// One-off helper: inserts `visual` blocks into lesson sections, right after the section's first block.
// Idempotent — skips a section that already contains the same scenario.
import fs from 'node:fs';
import path from 'node:path';

const INSERTS = [
  ['hashing', 'intuition', 'hash-map', 'Watch keys land in buckets — and what a collision looks like.'],
  ['hashing', 'intuition-frequency', 'frequency-map', 'Count with a Map, then cancel the counts to compare two strings.'],
  ['recursion', 'intuition', 'recursion-tree', 'Every call becomes a node; the call stack is the path from the root to the active call.'],
  ['complexity', 'intuition-space', 'recursion-tree', 'The recursion tree shows the time; the deepest root-to-leaf path shows the stack space.'],
  ['sorting', 'intuition-quick-sort', 'quick-sort', 'Lomuto partition: everything smaller than the pivot moves left of the boundary.'],
  ['sorting', 'intuition-counting', 'counting-sort', 'Count, turn counts into positions, then place each value — no comparisons at all.'],
  ['string-algorithms', 'optimized-kmp', 'kmp', 'Build the LPS table, then search without ever moving backwards in the text.'],
  ['string-algorithms', 'optimized-rolling-hash', 'rolling-hash', 'The window hash is updated in O(1): drop the left character, shift, add the right one.'],
  ['advanced-structures', 'optimized-fenwick', 'fenwick-tree', 'Each cell covers a power-of-two range given by i & -i.'],
  ['advanced-structures', 'optimized-segment-tree', 'segment-tree', 'Full overlap: use the node. No overlap: skip it. Partial: go down both sides.'],
  ['mst', 'optimized-kruskal', 'kruskal', 'Cheapest edge first — unless it would close a cycle.'],
  ['mst', 'optimized-prim', 'prim', 'Grow one tree, always adding the cheapest edge that leaves it.'],
  ['shortest-path', 'optimized-bfs', 'zero-one-bfs', '0-weight edges go to the front of the deque, 1-weight edges to the back.'],
  ['shortest-path', 'optimized-bellman-ford', 'bellman-ford', 'Relax every edge V−1 times; one more improving round means a negative cycle.'],
  ['shortest-path', 'optimized-floyd-warshall', 'floyd-warshall', 'For each middle node k, check whether going through k shortens i → j.'],
  ['bit-manipulation', 'intuition-xor', 'xor-single-number', 'Pairs cancel to 0, so only the single number survives.'],
  ['bit-manipulation', 'intuition-lowbit', 'bit-ops', 'Set, clear, toggle — and x & (x − 1) removing the lowest set bit.'],
  ['dp-advanced', 'optimized-lis', 'lis-patience', 'tails[k] = smallest possible tail of an increasing subsequence of length k + 1.'],
  ['backtracking', 'optimized-permutations', 'backtracking-permutations', 'used[] tracks which items are already on the path.'],
  ['backtracking', 'optimized-constraints', 'n-queens', 'Place a queen per row; backtrack as soon as a row has no safe column.'],
  ['bst', 'optimized-descent', 'bst-operations', 'One comparison per level decides left or right — O(h).'],
  ['array-techniques', 'intuition-cyclic', 'cyclic-sort', 'Each swap puts one value in its final slot, so there are at most n swaps.'],
  ['intervals', 'intuition-sweep', 'sweep-line', 'Starts are +1, ends are −1; the running sum is the number of overlapping intervals.'],
  ['graphs', 'optimized-bipartite', 'bipartite-check', 'Colour neighbours the opposite colour; a same-colour edge proves an odd cycle.'],
];

// Find the index just after the JS value starting at `i` (an object literal), honouring strings/templates.
function skipValue(src, i) {
  let depth = 0;
  const stack = []; // template nesting
  while (i < src.length) {
    const c = src[i];
    if (c === "'" || c === '"') {
      i++;
      while (src[i] !== c) i += src[i] === '\\' ? 2 : 1;
      i++;
      continue;
    }
    if (c === '`') {
      i++;
      while (src[i] !== '`') {
        if (src[i] === '\\') i += 2;
        else if (src[i] === '$' && src[i + 1] === '{') {
          // nested expression inside template: skip balanced braces
          let d = 1;
          i += 2;
          while (d > 0) {
            if (src[i] === '{') d++;
            else if (src[i] === '}') d--;
            else if (src[i] === '`') i = skipValue(src, i) - 1;
            i++;
          }
        } else i++;
      }
      i++;
      if (depth === 0 && stack.length === 0) return i;
      continue;
    }
    if (c === '/' && src[i + 1] === '/') {
      while (src[i] !== '\n') i++;
      continue;
    }
    if (c === '{' || c === '[' || c === '(') depth++;
    if (c === '}' || c === ']' || c === ')') {
      depth--;
      if (depth === 0) return i + 1;
    }
    i++;
  }
  throw new Error('unbalanced');
}

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
let done = 0;
for (const [topic, section, scenario, caption] of INSERTS) {
  const file = path.join(root, 'src/content/topics', topic, 'topic.js');
  let src = fs.readFileSync(file, 'utf8');
  const marker = new RegExp(`id:\\s*'${section}'\\s*,`);
  const m = marker.exec(src);
  if (!m) {
    console.log(`✖ ${topic}/${section}: section not found`);
    continue;
  }
  const blocksAt = src.indexOf('blocks:', m.index);
  const arrStart = src.indexOf('[', blocksAt);
  const arrEnd = skipValue(src, arrStart);
  if (src.slice(arrStart, arrEnd).includes(`scenario: '${scenario}'`)) {
    console.log(`= ${topic}/${section}: already has ${scenario}`);
    continue;
  }
  const firstBlock = src.indexOf('{', arrStart);
  const afterFirst = skipValue(src, firstBlock);
  const indent = src.slice(src.lastIndexOf('\n', firstBlock) + 1, firstBlock);
  const block = `\n${indent}{ type: 'visual', scenario: '${scenario}', caption: ${JSON.stringify(caption)} },`;
  const comma = src[afterFirst] === ',' ? afterFirst + 1 : afterFirst;
  src = src.slice(0, comma) + (src[afterFirst] === ',' ? '' : ',') + block + src.slice(comma);
  fs.writeFileSync(file, src);
  done++;
  console.log(`✔ ${topic}/${section}: + ${scenario}`);
}
console.log(`${done} visual blocks inserted`);
