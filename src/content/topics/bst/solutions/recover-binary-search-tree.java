class Solution {
    public void recoverTree(TreeNode root) {
        TreeNode first = null, second = null, prev = null;
        Deque<TreeNode> stack = new ArrayDeque<>();
        TreeNode node = root;
        while (node != null || !stack.isEmpty()) {
            while (node != null) { stack.push(node); node = node.left; }
            node = stack.pop();
            if (prev != null && prev.val > node.val) { // a drop in the sorted order
                if (first == null) first = prev;       // too-big value appears early
                second = node;                         // too-small value appears late
            }
            prev = node;
            node = node.right;
        }
        int tmp = first.val;
        first.val = second.val;
        second.val = tmp;
    }
}
