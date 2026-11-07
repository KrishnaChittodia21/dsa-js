class Solution {
public:
    int countGoodNumbers(long long n) {
        long long evenSlots = (n + 1) / 2;      // ceil(n / 2)
        long long oddSlots = n / 2;             // floor(n / 2)
        return (int)(modPow(5, evenSlots) * modPow(4, oddSlots) % MOD);
    }

private:
    static const long long MOD = 1'000'000'007LL;

    // base^exp mod MOD; recursion depth ≈ log2(exp) ≈ 50
    long long modPow(long long base, long long exp) {
        if (exp == 0) return 1;
        long long half = modPow(base, exp / 2);
        long long sq = half * half % MOD;       // half < MOD, so half * half fits in a long long
        return exp % 2 == 0 ? sq : sq * base % MOD;
    }
};
