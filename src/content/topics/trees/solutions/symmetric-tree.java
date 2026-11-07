class Solution {
    public boolean isSymmetric(TreeNode root) {
        return root == null || mirror(root.left, root.right);
    }

    // a is on the left side, b is its mirror position on the right side
    private boolean mirror(TreeNode a, TreeNode b) {
        if (a == null && b == null) return true;
        if (a == null || b == null) return false;
        if (a.val != b.val) return false;
        return mirror(a.left, b.right)     // outer pair
            && mirror(a.right, b.left);    // inner pair
    }
}
