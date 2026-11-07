class Solution {
    public int kthSmallest(TreeNode root, int k) {
        Deque<TreeNode> stack = new ArrayDeque<>();
        TreeNode node = root;
        while (node != null || !stack.isEmpty()) {
            while (node != null) { stack.push(node); node = node.left; } // left spine
            node = stack.pop();                   // next smallest value
            if (--k == 0) return node.val;
            node = node.right;
        }
        return -1; // k > n (not possible under the constraints)
    }
}
