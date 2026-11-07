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
    vector<int> countSmaller(vector<int>& nums) {
        vector<int> sorted(nums);
        sort(sorted.begin(), sorted.end());
        sorted.erase(unique(sorted.begin(), sorted.end()), sorted.end());
        FenwickTree bit(sorted.size());
        vector<int> counts(nums.size(), 0);

        for (int i = (int) nums.size() - 1; i >= 0; i--) {
            int r = lower_bound(sorted.begin(), sorted.end(), nums[i]) - sorted.begin();
            counts[i] = r > 0 ? bit.prefixSum(r - 1) : 0;   // seen (= to the right) and strictly smaller
            bit.add(r, 1);                                  // now nums[i] is "seen"
        }
        return counts;
    }
};
