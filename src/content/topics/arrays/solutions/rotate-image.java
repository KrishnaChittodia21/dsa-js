class Solution {
    public void rotate(int[][] matrix) {
        int n = matrix.length;
        // 1. transpose: (r, c) → (c, r). j starts at i + 1 so each pair swaps once.
        for (int i = 0; i < n; i++) {
            for (int j = i + 1; j < n; j++) {
                int tmp = matrix[i][j];
                matrix[i][j] = matrix[j][i];
                matrix[j][i] = tmp;
            }
        }
        // 2. mirror horizontally: (c, r) → (c, n - 1 - r)
        for (int[] row : matrix) {
            for (int lo = 0, hi = n - 1; lo < hi; lo++, hi--) {
                int tmp = row[lo];
                row[lo] = row[hi];
                row[hi] = tmp;
            }
        }
    }
}
