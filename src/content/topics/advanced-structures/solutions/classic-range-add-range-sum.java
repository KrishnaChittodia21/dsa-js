class RangeSumArray {
    private final int n;
    private final long[] sum;
    private final long[] lazy;   // pending addition owed to the children

    public RangeSumArray(int[] nums) {
        n = nums.length;
        sum = new long[4 * n];
        lazy = new long[4 * n];
        build(nums, 1, 0, n - 1);
    }

    private void build(int[] nums, int node, int lo, int hi) {
        if (lo == hi) { sum[node] = nums[lo]; return; }
        int mid = (lo + hi) >> 1;
        build(nums, 2 * node, lo, mid);
        build(nums, 2 * node + 1, mid + 1, hi);
        sum[node] = sum[2 * node] + sum[2 * node + 1];
    }

    private void apply(int node, int lo, int hi, long delta) {
        sum[node] += delta * (hi - lo + 1);   // correct immediately
        lazy[node] += delta;                  // children fixed later
    }

    private void push(int node, int lo, int hi) {
        if (lazy[node] != 0) {
            int mid = (lo + hi) >> 1;
            apply(2 * node, lo, mid, lazy[node]);
            apply(2 * node + 1, mid + 1, hi, lazy[node]);
            lazy[node] = 0;
        }
    }

    public void rangeAdd(int l, int r, int delta) {
        rangeAdd(l, r, delta, 1, 0, n - 1);
    }

    private void rangeAdd(int l, int r, int delta, int node, int lo, int hi) {
        if (r < lo || hi < l) return;                                   // no overlap
        if (l <= lo && hi <= r) { apply(node, lo, hi, delta); return; } // full overlap
        push(node, lo, hi);                                             // partial: make children current
        int mid = (lo + hi) >> 1;
        rangeAdd(l, r, delta, 2 * node, lo, mid);
        rangeAdd(l, r, delta, 2 * node + 1, mid + 1, hi);
        sum[node] = sum[2 * node] + sum[2 * node + 1];
    }

    public long rangeSum(int l, int r) {
        return rangeSum(l, r, 1, 0, n - 1);
    }

    private long rangeSum(int l, int r, int node, int lo, int hi) {
        if (r < lo || hi < l) return 0;
        if (l <= lo && hi <= r) return sum[node];
        push(node, lo, hi);
        int mid = (lo + hi) >> 1;
        return rangeSum(l, r, 2 * node, lo, mid) + rangeSum(l, r, 2 * node + 1, mid + 1, hi);
    }
}
