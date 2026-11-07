class Solution {
public:
    int numDistinct(string s, string t) {
        int n = t.size();
        if (n > (int) s.size()) return 0;
        // Counts for prefixes of t can pass 2^64; unsigned arithmetic wraps mod 2^64,
        // so dp[n] is still exact when the answer fits in an int.
        vector<unsigned long long> dp(n + 1, 0);  // dp[j] = ways to form t[0..j) from the s-prefix so far
        dp[0] = 1;                                // empty t: one way
        for (char ch : s) {
            for (int j = n; j >= 1; j--) {        // backwards: dp[j-1] is still the previous row
                if (ch == t[j - 1]) dp[j] += dp[j - 1];
            }
        }
        return (int) dp[n];
    }
};
