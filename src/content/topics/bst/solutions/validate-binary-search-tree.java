class Solution {
    public boolean isValidBST(TreeNode root) {
        // node.val must lie strictly inside (low, high); long bounds so INT_MIN / INT_MAX values still fit inside
        Deque<TreeNode> nodes = new ArrayDeque<>();
        Deque<long[]> bounds = new ArrayDeque<>();
        if (root != null) { nodes.push(root); bounds.push(new long[] { Long.MIN_VALUE, Long.MAX_VALUE }); }
        while (!nodes.isEmpty()) {
            TreeNode node = nodes.pop();
            long[] b = bounds.pop();
            if (node.val <= b[0] || node.val >= b[1]) return false;
            if (node.left != null) { nodes.push(node.left); bounds.push(new long[] { b[0], node.val }); }   // tighten the upper bound
            if (node.right != null) { nodes.push(node.right); bounds.push(new long[] { node.val, b[1] }); } // tighten the lower bound
        }
        return true;
    }
}
