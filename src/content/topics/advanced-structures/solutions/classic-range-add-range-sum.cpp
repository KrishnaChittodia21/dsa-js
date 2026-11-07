class RangeSumArray {
    int n;
    vector<long long> sum;
    vector<long long> lazy;   // pending addition owed to the children

    void build(vector<int>& nums, int node, int lo, int hi) {
        if (lo == hi) { sum[node] = nums[lo]; return; }
        int mid = (lo + hi) >> 1;
        build(nums, 2 * node, lo, mid);
        build(nums, 2 * node + 1, mid + 1, hi);
        sum[node] = sum[2 * node] + sum[2 * node + 1];
    }

    void apply(int node, int lo, int hi, long long delta) {
        sum[node] += delta * (hi - lo + 1);   // correct immediately
        lazy[node] += delta;                  // children fixed later
    }

    void push(int node, int lo, int hi) {
        if (lazy[node] != 0) {
            int mid = (lo + hi) >> 1;
            apply(2 * node, lo, mid, lazy[node]);
            apply(2 * node + 1, mid + 1, hi, lazy[node]);
            lazy[node] = 0;
        }
    }

    void add(int l, int r, int delta, int node, int lo, int hi) {
        if (r < lo || hi < l) return;                                   // no overlap
        if (l <= lo && hi <= r) { apply(node, lo, hi, delta); return; } // full overlap
        push(node, lo, hi);                                             // partial: make children current
        int mid = (lo + hi) >> 1;
        add(l, r, delta, 2 * node, lo, mid);
        add(l, r, delta, 2 * node + 1, mid + 1, hi);
        sum[node] = sum[2 * node] + sum[2 * node + 1];
    }

    long long query(int l, int r, int node, int lo, int hi) {
        if (r < lo || hi < l) return 0;
        if (l <= lo && hi <= r) return sum[node];
        push(node, lo, hi);
        int mid = (lo + hi) >> 1;
        return query(l, r, 2 * node, lo, mid) + query(l, r, 2 * node + 1, mid + 1, hi);
    }

public:
    RangeSumArray(vector<int>& nums) : n(nums.size()), sum(4 * n, 0), lazy(4 * n, 0) {
        build(nums, 1, 0, n - 1);
    }

    void rangeAdd(int l, int r, int delta) {
        add(l, r, delta, 1, 0, n - 1);
    }

    long long rangeSum(int l, int r) {
        return query(l, r, 1, 0, n - 1);
    }
};
