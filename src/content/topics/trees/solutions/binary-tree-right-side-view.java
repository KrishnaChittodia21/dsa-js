class Solution {
    public int[] rightSideView(TreeNode root) {
        List<Integer> view = new ArrayList<>();
        if (root == null) return new int[0];
        Deque<TreeNode> queue = new ArrayDeque<>();
        queue.offer(root);
        while (!queue.isEmpty()) {
            int size = queue.size();
            for (int i = 0; i < size; i++) {
                TreeNode node = queue.poll();
                if (i == size - 1) view.add(node.val);   // last node of this level
                if (node.left != null) queue.offer(node.left);
                if (node.right != null) queue.offer(node.right);
            }
        }
        return view.stream().mapToInt(Integer::intValue).toArray();
    }
}
