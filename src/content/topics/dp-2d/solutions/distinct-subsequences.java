class Solution {
    public int numDistinct(String s, String t) {
        int n = t.length();
        if (n > s.length()) return 0;
        // Counts for prefixes of t can pass 2^63; long wraps mod 2^64,
        // so dp[n] is still exact when the answer fits in an int.
        long[] dp = new long[n + 1];           // dp[j] = ways to form t[0..j) from the s-prefix so far
        dp[0] = 1;                             // empty t: one way
        for (int i = 0; i < s.length(); i++) {
            for (int j = n; j >= 1; j--) {     // backwards: dp[j-1] is still the previous row
                if (s.charAt(i) == t.charAt(j - 1)) dp[j] += dp[j - 1];
            }
        }
        return (int) dp[n];
    }
}
