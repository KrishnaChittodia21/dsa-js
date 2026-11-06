class Solution {
    public TreeNode insertIntoBST(TreeNode root, int val) {
        TreeNode fresh = new TreeNode(val);
        if (root == null) return fresh;
        TreeNode node = root;
        while (true) {
            if (val < node.val) {
                if (node.left == null) { node.left = fresh; break; }   // fell off → attach here
                node = node.left;
            } else {
                if (node.right == null) { node.right = fresh; break; }
                node = node.right;
            }
        }
        return root;
    }
}
