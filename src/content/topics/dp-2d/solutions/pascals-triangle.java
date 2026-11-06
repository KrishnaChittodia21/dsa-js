class Solution {
    public int[][] generate(int numRows) {
        int[][] rows = new int[numRows][];
        for (int i = 0; i < numRows; i++) {
            rows[i] = new int[i + 1];
            rows[i][0] = rows[i][i] = 1;             // left and right edges
            for (int j = 1; j < i; j++) rows[i][j] = rows[i - 1][j - 1] + rows[i - 1][j];
        }
        return rows;
    }
}
