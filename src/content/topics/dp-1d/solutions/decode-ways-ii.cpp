class Solution {
public:
    int numDecodings(string s) {
        const long long MOD = 1'000'000'007;
        long long prev2 = 1;           // dp[0]
        long long prev1 = one(s[0]);   // dp[1]
        for (int i = 2; i <= (int)s.size(); i++) {
            // long long: up to 15 * dp overflows int
            long long cur = (one(s[i - 1]) * prev1 + two(s[i - 2], s[i - 1]) * prev2) % MOD;
            prev2 = prev1;
            prev1 = cur;
        }
        return (int)prev1;
    }

private:
    int one(char c) {
        return c == '*' ? 9 : c == '0' ? 0 : 1;
    }

    int two(char a, char b) {
        if (a == '*' && b == '*') return 15;          // 11-19, 21-26
        if (a == '*') return b <= '6' ? 2 : 1;        // 1b always, 2b if b <= 6
        if (b == '*') return a == '1' ? 9 : a == '2' ? 6 : 0;
        int v = (a - '0') * 10 + (b - '0');
        return v >= 10 && v <= 26 ? 1 : 0;
    }
};
