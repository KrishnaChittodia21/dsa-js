class Solution {
    private static final int[][] DIRS = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};

    public void solve(char[][] board) {
        int R = board.length, C = board[0].length;
        ArrayDeque<int[]> queue = new ArrayDeque<>();
        // 1. seed with every border O
        for (int r = 0; r < R; r++) { markSafe(board, r, 0, queue); markSafe(board, r, C - 1, queue); }
        for (int c = 0; c < C; c++) { markSafe(board, 0, c, queue); markSafe(board, R - 1, c, queue); }

        // 2. BFS inward: everything reachable from the border is safe
        while (!queue.isEmpty()) {
            int[] cell = queue.poll();
            for (int[] d : DIRS) {
                int nr = cell[0] + d[0], nc = cell[1] + d[1];
                if (nr >= 0 && nr < R && nc >= 0 && nc < C) markSafe(board, nr, nc, queue);
            }
        }

        // 3. capture the rest, restore the safe ones
        for (int r = 0; r < R; r++)
            for (int c = 0; c < C; c++)
                board[r][c] = board[r][c] == 'S' ? 'O' : 'X';
    }

    private void markSafe(char[][] board, int r, int c, ArrayDeque<int[]> queue) {
        if (board[r][c] == 'O') { board[r][c] = 'S'; queue.add(new int[]{r, c}); }
    }
}
