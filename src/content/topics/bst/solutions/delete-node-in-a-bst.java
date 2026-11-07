class Solution {
    public TreeNode deleteNode(TreeNode root, int key) {
        if (root == null) return null;                     // key not found
        if (key < root.val) {
            root.left = deleteNode(root.left, key);
        } else if (key > root.val) {
            root.right = deleteNode(root.right, key);
        } else {
            if (root.left == null) return root.right;      // 0 or 1 child
            if (root.right == null) return root.left;
            TreeNode succ = root.right;                    // 2 children: in-order successor
            while (succ.left != null) succ = succ.left;
            root.val = succ.val;
            root.right = deleteNode(root.right, succ.val); // successor has no left child
        }
        return root;
    }
}
