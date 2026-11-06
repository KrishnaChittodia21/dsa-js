// M6: Java / C++ driver generation (src/languages/harness.js); the compile-and-run check is scripts/check-refs.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { encodeTests, driverSupports, programFor } from '../src/languages/harness.js';

const lca = { id: 'lowest-common-ancestor-of-a-binary-tree', functionName: 'lowestCommonAncestor', harness: '…', paramTypes: ['TreeNode', 'TreeNode', 'TreeNode'], returnType: 'TreeNode' };

test('custom-harness questions encode their raw test args and get their own driver', () => {
  assert.equal(driverSupports(lca), true);
  assert.equal(driverSupports({ id: 'other', harness: '…', paramTypes: ['int'], returnType: 'int' }), false);
  // 1 test of 6 tokens: the tree (count + 3 slots with a hole), then p and q as plain values
  assert.equal(encodeTests(lca, [{ args: [[3, null, 1], 3, 1] }]), '1 6 3 3 n 1 3 1');
  const graph = { id: 'clone-graph', functionName: 'cloneGraph', harness: '…', paramTypes: ['Node'], returnType: 'Node' };
  assert.match(programFor('java', graph, ''), /class Node \{/);
  assert.match(programFor('cpp', graph, ''), /struct Node \{/);
  assert.match(programFor('java', lca, ''), /lowestCommonAncestor\(root, p, q\)/);
});
