class Solution {
    public int maxSumBST(TreeNode root) {
        int best = 0; // the empty BST
        if (root == null) return best;

        // Iterative post-order (explicit stack) so very deep trees don't overflow the browser's stack:
        // collect nodes root-first, then walk them in reverse so children are done before their parent.
        List<TreeNode> order = new ArrayList<>();
        Deque<TreeNode> stack = new ArrayDeque<>();
        stack.push(root);
        while (!stack.isEmpty()) {
            TreeNode node = stack.pop();
            order.add(node);
            if (node.left != null) stack.push(node.left);
            if (node.right != null) stack.push(node.right);
        }

        // info.get(node) = {isBST (1/0), min, max, sum} for the subtree rooted at node
        Map<TreeNode, long[]> info = new HashMap<>();
        long[] empty = {1, Long.MAX_VALUE, Long.MIN_VALUE, 0};
        for (int i = order.size() - 1; i >= 0; i--) {
            TreeNode node = order.get(i);
            long[] l = node.left == null ? empty : info.get(node.left);
            long[] r = node.right == null ? empty : info.get(node.right);
            if (l[0] == 1 && r[0] == 1 && l[2] < node.val && node.val < r[1]) {
                long sum = l[3] + node.val + r[3];
                best = (int) Math.max(best, sum);
                info.put(node, new long[]{1, Math.min(l[1], node.val), Math.max(r[2], node.val), sum});
            } else {
                info.put(node, new long[]{0, 0, 0, 0}); // min/max/sum are irrelevant once isBST is false
            }
        }
        return best;
    }
}
