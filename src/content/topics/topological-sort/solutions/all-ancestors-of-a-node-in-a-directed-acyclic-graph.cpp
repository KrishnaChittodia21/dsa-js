class Solution {
public:
    vector<vector<int>> getAncestors(int n, vector<vector<int>>& edges) {
        vector<vector<int>> adj(n);
        vector<int> indeg(n, 0);
        for (auto& e : edges) { adj[e[0]].push_back(e[1]); indeg[e[1]]++; }

        vector<unordered_set<int>> anc(n);
        vector<int> queue;
        for (int i = 0; i < n; i++) if (indeg[i] == 0) queue.push_back(i);
        for (size_t head = 0; head < queue.size(); head++) {
            int u = queue[head]; // anc[u] is complete now
            for (int v : adj[u]) {
                anc[v].insert(u);
                anc[v].insert(anc[u].begin(), anc[u].end());
                if (--indeg[v] == 0) queue.push_back(v);
            }
        }
        vector<vector<int>> result(n);
        for (int i = 0; i < n; i++) {
            result[i].assign(anc[i].begin(), anc[i].end());
            sort(result[i].begin(), result[i].end());
        }
        return result;
    }
};
