class Solution {
    private int best;

    public int maxPathSum(TreeNode root) {
        best = Integer.MIN_VALUE;
        gain(root);
        return best;
    }

    // best sum of a path that starts at node and goes down at most one side
    private int gain(TreeNode node) {
        if (node == null) return 0;
        int L = Math.max(0, gain(node.left));      // ignore branches that only hurt
        int R = Math.max(0, gain(node.right));
        best = Math.max(best, node.val + L + R);   // path whose highest node is 'node'
        return node.val + Math.max(L, R);          // one-sided: the parent may extend it
    }
}
