class Solution {
    public void setZeroes(int[][] matrix) {
        int m = matrix.length, n = matrix[0].length;
        boolean firstColZero = false;

        // 1. record markers in row 0 / column 0
        for (int r = 0; r < m; r++) {
            if (matrix[r][0] == 0) firstColZero = true;
            for (int c = 1; c < n; c++) {
                if (matrix[r][c] == 0) {
                    matrix[r][0] = 0;   // row r must be zeroed
                    matrix[0][c] = 0;   // column c must be zeroed
                }
            }
        }
        // 2. interior cells from the markers
        for (int r = 1; r < m; r++) {
            for (int c = 1; c < n; c++) {
                if (matrix[r][0] == 0 || matrix[0][c] == 0) matrix[r][c] = 0;
            }
        }
        // 3. row 0 (its marker lives in matrix[0][0])
        if (matrix[0][0] == 0) for (int c = 0; c < n; c++) matrix[0][c] = 0;
        // 4. column 0 (its marker is the separate flag)
        if (firstColZero) for (int r = 0; r < m; r++) matrix[r][0] = 0;
    }
}
