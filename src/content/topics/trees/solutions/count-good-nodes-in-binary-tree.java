class Solution {
    public int goodNodes(TreeNode root) {
        // Iterative DFS with an explicit stack: safe even for a 10^5-node chain.
        int count = 0;
        Deque<TreeNode> nodes = new ArrayDeque<>();
        Deque<Integer> maxes = new ArrayDeque<>(); // max value on the path ABOVE each node
        nodes.push(root);
        maxes.push(Integer.MIN_VALUE);
        while (!nodes.isEmpty()) {
            TreeNode node = nodes.pop();
            int maxAbove = maxes.pop();
            if (node.val >= maxAbove) count++;          // nothing above is greater
            int next = Math.max(maxAbove, node.val);    // what the children will see above them
            if (node.left != null) { nodes.push(node.left); maxes.push(next); }
            if (node.right != null) { nodes.push(node.right); maxes.push(next); }
        }
        return count;
    }
}
