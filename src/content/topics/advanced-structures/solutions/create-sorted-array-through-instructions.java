class FenwickTree {
    private final int[] tree;

    FenwickTree(int n) {
        tree = new int[n + 1];
    }

    void add(int i, int d) {
        for (i++; i < tree.length; i += i & -i) tree[i] += d;
    }

    int prefixSum(int i) {
        int s = 0;
        for (i++; i > 0; i -= i & -i) s += tree[i];
        return s;
    }
}

class Solution {
    public int createSortedArray(int[] instructions) {
        final int MOD = 1_000_000_007;
        int maxV = Arrays.stream(instructions).max().getAsInt();
        FenwickTree bit = new FenwickTree(maxV + 1);   // index = value (0 unused by the data)
        int cost = 0;

        for (int i = 0; i < instructions.length; i++) {   // i = how many values are already inserted
            int x = instructions[i];
            int less = bit.prefixSum(x - 1);              // values < x
            int greater = i - bit.prefixSum(x);           // values > x (equal ones excluded)
            cost = (cost + Math.min(less, greater)) % MOD;
            bit.add(x, 1);
        }
        return cost;
    }
}
