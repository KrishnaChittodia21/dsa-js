class Solution {
    public int[][] zigzagLevelOrder(TreeNode root) {
        List<int[]> result = new ArrayList<>();
        if (root == null) return new int[0][];
        Deque<TreeNode> queue = new ArrayDeque<>();
        queue.offer(root);
        boolean leftToRight = true;
        while (!queue.isEmpty()) {
            int size = queue.size();
            int[] level = new int[size];
            for (int i = 0; i < size; i++) {
                TreeNode node = queue.poll();
                level[leftToRight ? i : size - 1 - i] = node.val;   // place, don't reorder the queue
                if (node.left != null) queue.offer(node.left);
                if (node.right != null) queue.offer(node.right);
            }
            result.add(level);
            leftToRight = !leftToRight;
        }
        return result.toArray(new int[0][]);
    }
}
