class Solution {
public:
    vector<vector<int>> validArrangement(vector<vector<int>>& pairs) {
        unordered_map<int, vector<int>> adj;
        unordered_map<int, int> balance;                     // out-degree − in-degree
        for (auto& p : pairs) {
            adj[p[0]].push_back(p[1]);
            balance[p[0]]++;
            balance[p[1]]--;
        }

        int start = pairs[0][0];
        for (auto [node, b] : balance) {
            if (b == 1) { start = node; break; }             // path must begin here
        }

        // Iterative Hierholzer (no recursion → safe for 10^5 pairs)
        vector<int> stack = {start};
        vector<int> path;
        while (!stack.empty()) {
            auto it = adj.find(stack.back());
            if (it != adj.end() && !it->second.empty()) {
                stack.push_back(it->second.back());
                it->second.pop_back();
            } else {
                path.push_back(stack.back());
                stack.pop_back();
            }
        }
        reverse(path.begin(), path.end());

        vector<vector<int>> result;
        for (int i = 0; i + 1 < (int) path.size(); i++) result.push_back({path[i], path[i + 1]});
        return result;
    }
};
