class Solution {
    public int[][] levelOrder(TreeNode root) {
        List<int[]> result = new ArrayList<>();
        if (root == null) return new int[0][];
        Deque<TreeNode> queue = new ArrayDeque<>();
        queue.offer(root);
        while (!queue.isEmpty()) {
            int size = queue.size();                 // snapshot: nodes on this level
            int[] level = new int[size];
            for (int i = 0; i < size; i++) {
                TreeNode node = queue.poll();
                level[i] = node.val;
                if (node.left != null) queue.offer(node.left);
                if (node.right != null) queue.offer(node.right);
            }
            result.add(level);
        }
        return result.toArray(new int[0][]);
    }
}
