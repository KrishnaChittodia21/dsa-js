class Solution {
    public int rangeSumBST(TreeNode root, int low, int high) {
        int sum = 0;
        Deque<TreeNode> stack = new ArrayDeque<>();
        if (root != null) stack.push(root);
        while (!stack.isEmpty()) {
            TreeNode node = stack.pop();
            if (node.val < low) {                 // node and its left side are too small
                if (node.right != null) stack.push(node.right);
            } else if (node.val > high) {         // node and its right side are too large
                if (node.left != null) stack.push(node.left);
            } else {                              // in range: count it, both sides may help
                sum += node.val;
                if (node.left != null) stack.push(node.left);
                if (node.right != null) stack.push(node.right);
            }
        }
        return sum;
    }
}
