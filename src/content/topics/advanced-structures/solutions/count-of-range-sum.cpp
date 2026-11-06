class FenwickTree {
    vector<int> tree;

public:
    FenwickTree(int n) : tree(n + 1, 0) {}

    void add(int i, int d) {
        for (i++; i < (int) tree.size(); i += i & -i) tree[i] += d;
    }

    int prefixSum(int i) {
        int s = 0;
        for (i++; i > 0; i -= i & -i) s += tree[i];
        return s;
    }

    int rangeSum(int l, int r) {
        return prefixSum(r) - prefixSum(l - 1);
    }
};

class Solution {
public:
    int countRangeSum(vector<int>& nums, int lower, int upper) {
        vector<long long> P = {0};   // long long: prefix sums pass 2^31
        for (int x : nums) P.push_back(P.back() + x);

        vector<long long> sorted(P);
        sort(sorted.begin(), sorted.end());
        sorted.erase(unique(sorted.begin(), sorted.end()), sorted.end());
        auto rank = [&](long long v) { return int(lower_bound(sorted.begin(), sorted.end(), v) - sorted.begin()); };

        FenwickTree bit(sorted.size());
        bit.add(rank(P[0]), 1);
        int count = 0;
        for (int k = 1; k < (int) P.size(); k++) {
            int lo = rank(P[k] - upper);                                        // smallest rank with value >= P[k] - upper
            int hi = int(upper_bound(sorted.begin(), sorted.end(), P[k] - lower) - sorted.begin()) - 1;   // largest rank with value <= P[k] - lower
            if (lo <= hi) count += bit.rangeSum(lo, hi);
            bit.add(rank(P[k]), 1);
        }
        return count;
    }
};
