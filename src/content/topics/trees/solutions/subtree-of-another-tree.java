class Solution {
    public boolean isSubtree(TreeNode root, TreeNode subRoot) {
        if (root == null) return false;
        return isSame(root, subRoot) || isSubtree(root.left, subRoot) || isSubtree(root.right, subRoot);
    }

    private boolean isSame(TreeNode a, TreeNode b) {
        if (a == null || b == null) return a == b;   // both null → true, exactly one null → false
        return a.val == b.val && isSame(a.left, b.left) && isSame(a.right, b.right);
    }
}
