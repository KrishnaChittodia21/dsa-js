// Binary tree node — the same shape LeetCode uses.
export class TreeNode {
  constructor(val = 0, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

// Build a tree from LeetCode's level-order array: [1,2,3,null,4] ->
//        1
//       / \
//      2   3
//       \
//        4
export function arrayToTree(arr) {
  if (!arr || arr.length === 0 || arr[0] === null || arr[0] === undefined) return null;
  const root = new TreeNode(arr[0]);
  const queue = [root];
  let head = 0;
  let i = 1;
  while (head < queue.length && i < arr.length) {
    const node = queue[head++];
    if (i < arr.length && arr[i] !== null && arr[i] !== undefined) {
      node.left = new TreeNode(arr[i]);
      queue.push(node.left);
    }
    i++;
    if (i < arr.length && arr[i] !== null && arr[i] !== undefined) {
      node.right = new TreeNode(arr[i]);
      queue.push(node.right);
    }
    i++;
  }
  return root;
}

// Inverse of arrayToTree (trailing nulls removed).
export function treeToArray(root) {
  if (!root) return [];
  const out = [];
  const queue = [root];
  let head = 0;
  while (head < queue.length) {
    const node = queue[head++];
    if (node === null) {
      out.push(null);
      continue;
    }
    out.push(node.val);
    queue.push(node.left);
    queue.push(node.right);
  }
  while (out.length && out[out.length - 1] === null) out.pop();
  return out;
}

// Find the first node with a given value (handy for LCA-style inputs).
export function findNode(root, val) {
  if (!root) return null;
  if (root.val === val) return root;
  return findNode(root.left, val) || findNode(root.right, val);
}

export const traversals = {
  preorder(root, out = []) {
    if (!root) return out;
    out.push(root.val);
    traversals.preorder(root.left, out);
    traversals.preorder(root.right, out);
    return out;
  },
  inorder(root, out = []) {
    if (!root) return out;
    traversals.inorder(root.left, out);
    out.push(root.val);
    traversals.inorder(root.right, out);
    return out;
  },
  postorder(root, out = []) {
    if (!root) return out;
    traversals.postorder(root.left, out);
    traversals.postorder(root.right, out);
    out.push(root.val);
    return out;
  },
  levelOrder(root) {
    const levels = [];
    if (!root) return levels;
    let level = [root];
    while (level.length) {
      levels.push(level.map((n) => n.val));
      const next = [];
      for (const n of level) {
        if (n.left) next.push(n.left);
        if (n.right) next.push(n.right);
      }
      level = next;
    }
    return levels;
  },
};
