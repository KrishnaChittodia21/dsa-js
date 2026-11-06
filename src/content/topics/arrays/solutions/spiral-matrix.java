class Solution {
    public int[] spiralOrder(int[][] matrix) {
        int m = matrix.length, n = matrix[0].length;
        int[] out = new int[m * n];
        int idx = 0;
        int top = 0, bottom = m - 1;
        int left = 0, right = n - 1;

        while (top <= bottom && left <= right) {
            for (int c = left; c <= right; c++) out[idx++] = matrix[top][c];    // → top row
            top++;
            for (int r = top; r <= bottom; r++) out[idx++] = matrix[r][right];  // ↓ right column
            right--;
            if (top <= bottom) {                                                // a bottom row still exists
                for (int c = right; c >= left; c--) out[idx++] = matrix[bottom][c]; // ← bottom row
                bottom--;
            }
            if (left <= right) {                                                // a left column still exists
                for (int r = bottom; r >= top; r--) out[idx++] = matrix[r][left];   // ↑ left column
                left++;
            }
        }
        return out;
    }
}
