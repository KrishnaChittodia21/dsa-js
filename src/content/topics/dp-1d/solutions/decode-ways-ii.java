class Solution {
    private static final long MOD = 1_000_000_007;

    public int numDecodings(String s) {
        long prev2 = 1;                  // dp[0]
        long prev1 = one(s.charAt(0));   // dp[1]
        for (int i = 2; i <= s.length(); i++) {
            // long: up to 15 * dp overflows int
            long cur = (one(s.charAt(i - 1)) * prev1 + two(s.charAt(i - 2), s.charAt(i - 1)) * prev2) % MOD;
            prev2 = prev1;
            prev1 = cur;
        }
        return (int) prev1;
    }

    private int one(char c) {
        return c == '*' ? 9 : c == '0' ? 0 : 1;
    }

    private int two(char a, char b) {
        if (a == '*' && b == '*') return 15;          // 11-19, 21-26
        if (a == '*') return b <= '6' ? 2 : 1;        // 1b always, 2b if b <= 6
        if (b == '*') return a == '1' ? 9 : a == '2' ? 6 : 0;
        int v = (a - '0') * 10 + (b - '0');
        return v >= 10 && v <= 26 ? 1 : 0;
    }
}
