class Solution {
    public int fib(int n) {
        return go(n, new HashMap<>());
    }

    private int go(int k, Map<Integer, Integer> memo) {
        if (k < 2) return k;                    // base cases: F(0) = 0, F(1) = 1
        if (memo.containsKey(k)) return memo.get(k);
        int v = go(k - 1, memo) + go(k - 2, memo); // leap of faith on both smaller calls
        memo.put(k, v);
        return v;
    }
}
