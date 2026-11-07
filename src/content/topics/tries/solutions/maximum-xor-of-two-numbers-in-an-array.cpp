class Solution {
    static const int HIGH = 30;                     // nums < 2^31 → bits 30..0
    vector<array<int, 2>> next{{0, 0}};             // binary trie: child index, 0 = none (node 0 is the root)

    void insert(int x) {
        int node = 0;
        for (int b = HIGH; b >= 0; b--) {
            int bit = (x >> b) & 1;
            if (!next[node][bit]) {
                next[node][bit] = next.size();
                next.push_back({0, 0});
            }
            node = next[node][bit];
        }
    }

public:
    int findMaximumXOR(vector<int>& nums) {
        int best = 0;
        insert(nums[0]);
        for (int x : nums) {
            int node = 0, cur = 0;
            for (int b = HIGH; b >= 0; b--) {
                int want = ((x >> b) & 1) ^ 1;      // opposite bit makes this XOR bit 1
                if (next[node][want]) {
                    cur |= 1 << b;
                    node = next[node][want];
                } else {
                    node = next[node][want ^ 1];
                }
            }
            best = max(best, cur);
            insert(x);
        }
        return best;
    }
};
