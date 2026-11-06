class Solution {
    public int[][] verticalTraversal(TreeNode root) {
        List<int[]> cells = new ArrayList<>();             // {col, row, val}
        Deque<Object[]> stack = new ArrayDeque<>();        // iterative DFS: {node, row, col}
        stack.push(new Object[]{root, 0, 0});
        while (!stack.isEmpty()) {
            Object[] top = stack.pop();
            TreeNode node = (TreeNode) top[0];
            int row = (int) top[1], col = (int) top[2];
            cells.add(new int[]{col, row, node.val});
            if (node.left != null) stack.push(new Object[]{node.left, row + 1, col - 1});
            if (node.right != null) stack.push(new Object[]{node.right, row + 1, col + 1});
        }

        // column first, then row (top to bottom), then value
        cells.sort((a, b) -> a[0] != b[0] ? Integer.compare(a[0], b[0])
                : a[1] != b[1] ? Integer.compare(a[1], b[1]) : Integer.compare(a[2], b[2]));

        List<List<Integer>> result = new ArrayList<>();
        Integer lastCol = null;
        for (int[] cell : cells) {
            if (lastCol == null || cell[0] != lastCol) {   // a new column starts
                result.add(new ArrayList<>());
                lastCol = cell[0];
            }
            result.get(result.size() - 1).add(cell[2]);
        }
        return result.stream().map(c -> c.stream().mapToInt(Integer::intValue).toArray()).toArray(int[][]::new);
    }
}
