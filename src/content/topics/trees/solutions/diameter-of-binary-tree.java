class Solution {
    private int best;

    public int diameterOfBinaryTree(TreeNode root) {
        best = 0;
        height(root);
        return best;
    }

    // returns the number of nodes on the longest downward path from node
    private int height(TreeNode node) {
        if (node == null) return 0;
        int L = height(node.left);
        int R = height(node.right);
        best = Math.max(best, L + R);     // longest path bending at node (in edges)
        return 1 + Math.max(L, R);        // one-sided path for the parent
    }
}
