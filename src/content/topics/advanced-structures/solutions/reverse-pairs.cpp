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
};

class Solution {
public:
    int reversePairs(vector<int>& nums) {
        vector<int> sorted(nums);
        sort(sorted.begin(), sorted.end());
        sorted.erase(unique(sorted.begin(), sorted.end()), sorted.end());
        FenwickTree bit(sorted.size());
        int pairs = 0;
        for (int j = 0; j < (int) nums.size(); j++) {
            // distinct values <= threshold (long long: 2 * nums[j] can overflow)
            int k = upper_bound(sorted.begin(), sorted.end(), 2LL * nums[j]) - sorted.begin();
            int atMostThreshold = k > 0 ? bit.prefixSum(k - 1) : 0;
            pairs += j - atMostThreshold;                       // earlier values > 2 * nums[j]
            bit.add(lower_bound(sorted.begin(), sorted.end(), nums[j]) - sorted.begin(), 1);
        }
        return pairs;
    }
};
