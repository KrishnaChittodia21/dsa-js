class Solution {
    public int getMinimumDifference(TreeNode root) {
        int best = Integer.MAX_VALUE;
        Integer prev = null;                      // previous value in sorted (in-order) order
        Deque<TreeNode> stack = new ArrayDeque<>();
        TreeNode node = root;
        while (node != null || !stack.isEmpty()) {
            while (node != null) { stack.push(node); node = node.left; }
            node = stack.pop();
            if (prev != null) best = Math.min(best, node.val - prev); // sorted → always >= 0
            prev = node.val;
            node = node.right;
        }
        return best;
    }
}
