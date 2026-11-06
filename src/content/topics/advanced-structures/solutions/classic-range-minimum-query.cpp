class Solution {
public:
    vector<int> rangeMinQuery(vector<int>& nums, vector<vector<int>>& queries) {
        int n = nums.size();
        vector<int> log(n + 1, 0);
        for (int i = 2; i <= n; i++) log[i] = log[i >> 1] + 1;   // floor(log2 i)

        vector<vector<int>> st = {nums};   // st[k][i] = min of nums[i .. i + 2^k - 1]
        for (int k = 1; (1 << k) <= n; k++) {
            const vector<int>& prev = st[k - 1];
            int half = 1 << (k - 1);
            vector<int> row(n - (1 << k) + 1);
            for (int i = 0; i < (int) row.size(); i++) row[i] = min(prev[i], prev[i + half]);
            st.push_back(move(row));
        }

        vector<int> res;
        res.reserve(queries.size());
        for (auto& q : queries) {
            int l = q[0], r = q[1];
            int k = log[r - l + 1];
            res.push_back(min(st[k][l], st[k][r - (1 << k) + 1]));   // two overlapping blocks
        }
        return res;
    }
};
