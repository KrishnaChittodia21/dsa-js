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
    int numTeams(vector<int>& rating) {
        int n = rating.size();
        vector<int> sorted(rating);
        sort(sorted.begin(), sorted.end());               // distinct → rank = #smaller overall
        FenwickTree bit(n);
        long long teams = 0;

        for (int j = 0; j < n; j++) {
            int r = lower_bound(sorted.begin(), sorted.end(), rating[j]) - sorted.begin();
            int leftSmaller = r > 0 ? bit.prefixSum(r - 1) : 0;
            int leftLarger = j - leftSmaller;
            int rightSmaller = r - leftSmaller;
            int rightLarger = (n - 1 - j) - rightSmaller;
            teams += (long long) leftSmaller * rightLarger + (long long) leftLarger * rightSmaller;
            bit.add(r, 1);
        }
        return (int) teams;
    }
};
