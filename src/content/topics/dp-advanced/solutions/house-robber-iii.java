class Solution {
    public int rob(TreeNode root) {
        int[] r = dfs(root);
        return Math.max(r[0], r[1]);
    }

    // returns {best if this node is robbed, best if it is skipped}
    private int[] dfs(TreeNode node) {
        if (node == null) return new int[] {0, 0};
        int[] left = dfs(node.left);
        int[] right = dfs(node.right);
        int robIt = node.val + left[1] + right[1];
        int skipIt = Math.max(left[0], left[1]) + Math.max(right[0], right[1]);
        return new int[] {robIt, skipIt};
    }
}
