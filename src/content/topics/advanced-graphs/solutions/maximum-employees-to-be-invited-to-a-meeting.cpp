class Solution {
public:
    int maximumInvitations(vector<int>& favorite) {
        int n = favorite.size();
        vector<int> indeg(n, 0);
        for (int f : favorite) indeg[f]++;

        // 1. Peel tree nodes (Kahn). depth[v] = longest chain of tree nodes ending at v.
        vector<int> depth(n, 0);
        vector<int> queue;
        for (int i = 0; i < n; i++) if (indeg[i] == 0) queue.push_back(i);
        for (size_t head = 0; head < queue.size(); head++) {
            int u = queue[head], v = favorite[u];
            depth[v] = max(depth[v], depth[u] + 1);
            if (--indeg[v] == 0) queue.push_back(v);
        }

        // 2. Remaining nodes lie on cycles. Measure each cycle once.
        int bestCycle = 0, pairsTotal = 0;
        vector<bool> done(n, false);
        for (int i = 0; i < n; i++) {
            if (indeg[i] == 0 || done[i]) continue;
            int len = 0, j = i;
            while (!done[j]) { done[j] = true; j = favorite[j]; len++; }
            if (len == 2) pairsTotal += 2 + depth[i] + depth[favorite[i]];
            else bestCycle = max(bestCycle, len);
        }
        return max(bestCycle, pairsTotal);
    }
};
