class NumArray {
    private final int n;
    private final int[] nums;   // current values (needed to compute deltas)
    private final int[] tree;   // 1-based Fenwick cells

    public NumArray(int[] nums) {
        n = nums.length;
        this.nums = nums.clone();
        tree = new int[n + 1];
        for (int i = 0; i < n; i++) add(i, nums[i]);
    }

    // nums[i] += d  — climb by adding the lowest set bit
    private void add(int i, int d) {
        for (int k = i + 1; k <= n; k += k & -k) tree[k] += d;
    }

    // nums[0] + ... + nums[i]  — descend by removing the lowest set bit
    private int prefix(int i) {
        int s = 0;
        for (int k = i + 1; k > 0; k -= k & -k) s += tree[k];
        return s;
    }

    public void update(int index, int val) {
        add(index, val - nums[index]);
        nums[index] = val;
    }

    public int sumRange(int left, int right) {
        return prefix(right) - prefix(left - 1);   // prefix(-1) == 0
    }
}
