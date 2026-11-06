class Solution {
    private static final long MOD = 1_000_000_007L;

    public int countGoodNumbers(long n) {
        long evenSlots = (n + 1) / 2;           // ceil(n / 2)
        long oddSlots = n / 2;                  // floor(n / 2)
        return (int) (modPow(5, evenSlots) * modPow(4, oddSlots) % MOD);
    }

    // base^exp mod MOD; recursion depth ≈ log2(exp) ≈ 50
    private long modPow(long base, long exp) {
        if (exp == 0) return 1;
        long half = modPow(base, exp / 2);
        long sq = half * half % MOD;            // half < MOD, so half * half fits in a long
        return exp % 2 == 0 ? sq : sq * base % MOD;
    }
}
