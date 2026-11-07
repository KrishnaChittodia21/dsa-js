class Solution {
    public int maximalSquare(char[][] matrix) {
        int n = matrix[0].length;
        int[] dp = new int[n + 1];                // dp[c+1] = side ending at (r, c); dp[0] is a 0 sentinel
        int best = 0;
        for (char[] row : matrix) {
            int prevDiag = 0;                     // old dp[c] = top-left for the next column
            for (int c = 0; c < n; c++) {
                int top = dp[c + 1];              // still row r-1
                if (row[c] == '1') {
                    dp[c + 1] = 1 + Math.min(top, Math.min(dp[c] /* left */, prevDiag));
                    best = Math.max(best, dp[c + 1]);
                } else {
                    dp[c + 1] = 0;
                }
                prevDiag = top;
            }
        }
        return best * best;
    }
}
