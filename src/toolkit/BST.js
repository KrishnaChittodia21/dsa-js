import { TreeNode } from './BinaryTree.js';

// Binary Search Tree: for every node, left subtree < node < right subtree.
// Operations are O(h) where h is the height: O(log n) if balanced, O(n) if it degenerates into a line.
export class BST {
  constructor(values = []) {
    this.root = null;
    this.size = 0;
    for (const v of values) this.insert(v);
  }
  insert(val) {
    const node = new TreeNode(val);
    if (!this.root) {
      this.root = node;
      this.size++;
      return this;
    }
    let cur = this.root;
    while (true) {
      if (val === cur.val) return this; // ignore duplicates
      const side = val < cur.val ? 'left' : 'right';
      if (!cur[side]) {
        cur[side] = node;
        this.size++;
        return this;
      }
      cur = cur[side];
    }
  }
  has(val) {
    let cur = this.root;
    while (cur) {
      if (val === cur.val) return true;
      cur = val < cur.val ? cur.left : cur.right;
    }
    return false;
  }
  min() {
    let cur = this.root;
    while (cur && cur.left) cur = cur.left;
    return cur ? cur.val : undefined;
  }
  max() {
    let cur = this.root;
    while (cur && cur.right) cur = cur.right;
    return cur ? cur.val : undefined;
  }
  delete(val) {
    const removeFrom = (node, target) => {
      if (!node) return null;
      if (target < node.val) node.left = removeFrom(node.left, target);
      else if (target > node.val) node.right = removeFrom(node.right, target);
      else {
        this.size--;
        if (!node.left) return node.right;
        if (!node.right) return node.left;
        // Two children: replace with the in-order successor (smallest in right subtree).
        let succ = node.right;
        while (succ.left) succ = succ.left;
        node.val = succ.val;
        this.size++; // the recursive call below decrements again
        node.right = removeFrom(node.right, succ.val);
      }
      return node;
    };
    this.root = removeFrom(this.root, val);
    return this;
  }
  // In-order traversal of a BST yields values in sorted order.
  inorder() {
    const out = [];
    const stack = [];
    let cur = this.root;
    while (cur || stack.length) {
      while (cur) {
        stack.push(cur);
        cur = cur.left;
      }
      cur = stack.pop();
      out.push(cur.val);
      cur = cur.right;
    }
    return out;
  }
}
