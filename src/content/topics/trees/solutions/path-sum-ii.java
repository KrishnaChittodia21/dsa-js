class Solution {
    // Iterative DFS (explicit stack) so very deep trees don't overflow the browser's Java stack.
    public int[][] pathSum(TreeNode root, int targetSum) {
        List<int[]> result = new ArrayList<>();
        List<Integer> path = new ArrayList<>();
        Deque<TreeNode> nodes = new ArrayDeque<>();
        Deque<Long> remainings = new ArrayDeque<>();
        Deque<Integer> depths = new ArrayDeque<>();             // path length above this node
        if (root != null) { nodes.push(root); remainings.push((long) targetSum); depths.push(0); }

        while (!nodes.isEmpty()) {
            TreeNode node = nodes.pop();
            long remaining = remainings.pop() - node.val;
            int depth = depths.pop();

            while (path.size() > depth) path.remove(path.size() - 1);   // undo back to the parent
            path.add(node.val);                                         // choose

            if (node.left == null && node.right == null) {
                if (remaining == 0) {                       // a real leaf: record a COPY
                    result.add(path.stream().mapToInt(Integer::intValue).toArray());
                }
                continue;
            }
            // push right first so left is explored first (same order as recursion)
            if (node.right != null) { nodes.push(node.right); remainings.push(remaining); depths.push(depth + 1); }
            if (node.left != null)  { nodes.push(node.left);  remainings.push(remaining); depths.push(depth + 1); }
        }
        return result.toArray(new int[0][]);
    }
}
