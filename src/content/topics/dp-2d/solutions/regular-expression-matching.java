class Solution {
    public boolean isMatch(String s, String p) {
        int m = s.length(), n = p.length();
        // dp[i][j]: s[0..i) matches p[0..j)
        boolean[][] dp = new boolean[m + 1][n + 1];
        dp[0][0] = true;
        for (int j = 2; j <= n; j++) {
            if (p.charAt(j - 1) == '*') dp[0][j] = dp[0][j - 2];   // "" matches a*b*c*...
        }
        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                if (p.charAt(j - 1) == '*') {
                    dp[i][j] = dp[i][j - 2]                                       // zero copies of p[j-2]
                        || (ok(s.charAt(i - 1), p.charAt(j - 2)) && dp[i - 1][j]); // one more copy, keep "x*"
                } else {
                    dp[i][j] = ok(s.charAt(i - 1), p.charAt(j - 1)) && dp[i - 1][j - 1];
                }
            }
        }
        return dp[m][n];
    }

    private boolean ok(char a, char b) {
        return b == '.' || a == b;
    }
}
