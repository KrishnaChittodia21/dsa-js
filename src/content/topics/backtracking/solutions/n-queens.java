class Solution {
    private int n;
    private boolean[] cols, diag, anti; // diag index: row - col + n - 1; anti index: row + col
    private int[] queenCol;             // queenCol[row] = column of the queen in that row
    private List<String[]> result = new ArrayList<>();

    public String[][] solveNQueens(int n) {
        this.n = n;
        cols = new boolean[n];
        diag = new boolean[2 * n - 1];
        anti = new boolean[2 * n - 1];
        queenCol = new int[n];
        place(0);
        return result.toArray(new String[0][]);
    }

    private void place(int row) {
        if (row == n) {
            String[] board = new String[n];
            for (int r = 0; r < n; r++) {
                char[] line = new char[n];
                Arrays.fill(line, '.');
                line[queenCol[r]] = 'Q';
                board[r] = new String(line);
            }
            result.add(board);
            return;
        }
        for (int c = 0; c < n; c++) {
            int d = row - c + n - 1, a = row + c;
            if (cols[c] || diag[d] || anti[a]) continue; // attacked
            cols[c] = diag[d] = anti[a] = true;           // choose
            queenCol[row] = c;
            place(row + 1);                               // explore
            cols[c] = diag[d] = anti[a] = false;          // undo
        }
    }
}
