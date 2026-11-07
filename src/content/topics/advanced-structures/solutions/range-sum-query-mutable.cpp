class NumArray {
    int n;
    vector<int> nums;   // current values (needed to compute deltas)
    vector<int> tree;   // 1-based Fenwick cells

    // nums[i] += d  — climb by adding the lowest set bit
    void add(int i, int d) {
        for (int k = i + 1; k <= n; k += k & -k) tree[k] += d;
    }

    // nums[0] + ... + nums[i]  — descend by removing the lowest set bit
    int prefix(int i) {
        int s = 0;
        for (int k = i + 1; k > 0; k -= k & -k) s += tree[k];
        return s;
    }

public:
    NumArray(vector<int>& nums) : n(nums.size()), nums(nums), tree(n + 1, 0) {
        for (int i = 0; i < n; i++) add(i, nums[i]);
    }

    void update(int index, int val) {
        add(index, val - nums[index]);
        nums[index] = val;
    }

    int sumRange(int left, int right) {
        return prefix(right) - prefix(left - 1);   // prefix(-1) == 0
    }
};
