class Solution {
    public boolean isBalanced(TreeNode root) {
        return check(root) != -1;
    }

    // returns the height of node's subtree, or -1 if it is not balanced
    private int check(TreeNode node) {
        if (node == null) return 0;
        int L = check(node.left);
        if (L == -1) return -1;                    // already failed below: stop early
        int R = check(node.right);
        if (R == -1) return -1;
        if (Math.abs(L - R) > 1) return -1;        // this node breaks the rule
        return 1 + Math.max(L, R);
    }
}
