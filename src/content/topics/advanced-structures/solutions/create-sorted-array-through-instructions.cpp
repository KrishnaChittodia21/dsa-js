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
    int createSortedArray(vector<int>& instructions) {
        const int MOD = 1'000'000'007;
        int maxV = *max_element(instructions.begin(), instructions.end());
        FenwickTree bit(maxV + 1);                        // index = value (0 unused by the data)
        int cost = 0;

        for (int i = 0; i < (int) instructions.size(); i++) {   // i = how many values are already inserted
            int x = instructions[i];
            int less = bit.prefixSum(x - 1);              // values < x
            int greater = i - bit.prefixSum(x);           // values > x (equal ones excluded)
            cost = (cost + min(less, greater)) % MOD;
            bit.add(x, 1);
        }
        return cost;
    }
};
