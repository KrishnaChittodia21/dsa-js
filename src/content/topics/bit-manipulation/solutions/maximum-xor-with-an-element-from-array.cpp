class Solution {
public:
    vector<int> maximizeXor(vector<int>& nums, vector<vector<int>>& queries) {
        const int BITS = 30;                          // values <= 1e9 < 2^30
        vector<array<int, 2>> kids(1, {0, 0});        // child indices per node; 0 = missing

        vector<int> sorted = nums;
        sort(sorted.begin(), sorted.end());
        vector<int> order(queries.size());
        iota(order.begin(), order.end(), 0);
        sort(order.begin(), order.end(), [&](int i, int j) { return queries[i][1] < queries[j][1]; });

        vector<int> ans(queries.size());
        size_t p = 0;
        for (int qi : order) {
            int x = queries[qi][0], m = queries[qi][1];
            while (p < sorted.size() && sorted[p] <= m) {
                int v = sorted[p++], node = 0;
                for (int b = BITS - 1; b >= 0; b--) {
                    int bit = (v >> b) & 1;
                    if (kids[node][bit] == 0) {
                        kids[node][bit] = kids.size();
                        kids.push_back({0, 0});
                    }
                    node = kids[node][bit];
                }
            }
            if (p == 0) { ans[qi] = -1; continue; }   // empty trie: no allowed element
            int node = 0, res = 0;
            for (int b = BITS - 1; b >= 0; b--) {
                int bit = (x >> b) & 1;
                if (kids[node][bit ^ 1] != 0) { res |= 1 << b; node = kids[node][bit ^ 1]; }
                else node = kids[node][bit];
            }
            ans[qi] = res;
        }
        return ans;
    }
};
