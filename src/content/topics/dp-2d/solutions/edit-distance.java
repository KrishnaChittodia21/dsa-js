class Solution {
    public int minDistance(String word1, String word2) {
        int m = word1.length(), n = word2.length();
        int[] dp = new int[n + 1];
        for (int j = 0; j <= n; j++) dp[j] = j;       // row 0: j inserts
        for (int i = 1; i <= m; i++) {
            int diag = dp[0];                         // old dp[i-1][0]
            dp[0] = i;                                // i deletes
            for (int j = 1; j <= n; j++) {
                int up = dp[j];                       // dp[i-1][j] (not yet overwritten)
                if (word1.charAt(i - 1) == word2.charAt(j - 1)) dp[j] = diag;
                else dp[j] = 1 + Math.min(diag /* replace */, Math.min(up /* delete */, dp[j - 1] /* insert */));
                diag = up;                            // becomes up-left for column j+1
            }
        }
        return dp[n];
    }
}
