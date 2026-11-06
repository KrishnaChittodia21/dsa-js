class BSTIterator {
    private final Deque<TreeNode> stack = new ArrayDeque<>(); // unvisited ancestors along one path; top = next smallest

    public BSTIterator(TreeNode root) {
        pushLeft(root);
    }

    private void pushLeft(TreeNode node) {
        while (node != null) {
            stack.push(node);
            node = node.left;
        }
    }

    public int next() {
        TreeNode node = stack.pop();
        pushLeft(node.right); // the successor is the leftmost node of the right subtree
        return node.val;
    }

    public boolean hasNext() {
        return !stack.isEmpty();
    }
}
