class Solution {
public:
    int minimumTime(int n, vector<vector<int>>& relations, vector<int>& time) {
        vector<vector<int>> adj(n);
        vector<int> indeg(n, 0);
        for (auto& r : relations) {                // 1-based → 0-based
            adj[r[0] - 1].push_back(r[1] - 1);
            indeg[r[1] - 1]++;
        }
        vector<int> finish = time;                 // at least its own duration
        queue<int> q;
        for (int i = 0; i < n; i++) if (indeg[i] == 0) q.push(i);
        while (!q.empty()) {
            int u = q.front();                     // finish[u] is final
            q.pop();
            for (int v : adj[u]) {
                finish[v] = max(finish[v], finish[u] + time[v]);
                if (--indeg[v] == 0) q.push(v);
            }
        }
        return *max_element(finish.begin(), finish.end());
    }
};
