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

    int rangeSum(int l, int r) {
        return prefixSum(r) - prefixSum(l - 1);
    }
}

class Solution {
    public int countRangeSum(int[] nums, int lower, int upper) {
        long[] P = new long[nums.length + 1];   // long: prefix sums pass 2^31
        for (int i = 0; i < nums.length; i++) P[i + 1] = P[i] + nums[i];

        long[] sorted = Arrays.stream(P).distinct().sorted().toArray();
        FenwickTree bit = new FenwickTree(sorted.length);
        bit.add(Arrays.binarySearch(sorted, P[0]), 1);
        int count = 0;
        for (int k = 1; k < P.length; k++) {
            int lo = lowerBound(sorted, P[k] - upper);          // smallest rank with value >= P[k] - upper
            int hi = lowerBound(sorted, P[k] - lower + 1) - 1;  // largest rank with value <= P[k] - lower
            if (lo <= hi) count += bit.rangeSum(lo, hi);
            bit.add(Arrays.binarySearch(sorted, P[k]), 1);
        }
        return count;
    }

    // first index with sorted[idx] >= t
    private int lowerBound(long[] sorted, long t) {
        int lo = 0, hi = sorted.length;
        while (lo < hi) {
            int mid = (lo + hi) >>> 1;
            if (sorted[mid] < t) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }
}
