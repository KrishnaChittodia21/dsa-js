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
    public int reversePairs(int[] nums) {
        int[] sorted = Arrays.stream(nums).distinct().sorted().toArray();
        FenwickTree bit = new FenwickTree(sorted.length);
        int pairs = 0;
        for (int j = 0; j < nums.length; j++) {
            int k = upperBound(sorted, 2L * nums[j]);           // distinct values <= threshold (long: 2 * nums[j] can overflow)
            int atMostThreshold = k > 0 ? bit.prefixSum(k - 1) : 0;
            pairs += j - atMostThreshold;                       // earlier values > 2 * nums[j]
            bit.add(Arrays.binarySearch(sorted, nums[j]), 1);
        }
        return pairs;
    }

    // number of elements in sorted that are <= t
    private int upperBound(int[] sorted, long t) {
        int lo = 0, hi = sorted.length;
        while (lo < hi) {
            int mid = (lo + hi) >>> 1;
            if (sorted[mid] <= t) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }
}
