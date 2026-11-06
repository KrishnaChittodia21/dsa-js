class Solution {
    public int longestPalindromeSubseq(String s) {
        int n = s.length();
        int[] next = new int[n];                  // dp[i + 1][*]
        for (int i = n - 1; i >= 0; i--) {
            int[] cur = new int[n];               // dp[i][*]
            cur[i] = 1;
            for (int j = i + 1; j < n; j++) {
                if (s.charAt(i) == s.charAt(j)) cur[j] = next[j - 1] + 2;   // dp[i+1][j-1] + 2
                else cur[j] = Math.max(next[j], cur[j - 1]);               // drop s[i] or s[j]
            }
            next = cur;
        }
        return next[n - 1];
    }
}
