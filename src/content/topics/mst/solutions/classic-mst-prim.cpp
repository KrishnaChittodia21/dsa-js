class Solution {
public:
    int mstPrim(vector<vector<int>>& graph) {
        int n = graph.size();
        vector<bool> inTree(n, false);
        priority_queue<pair<int, int>, vector<pair<int, int>>, greater<>> heap;   // {weight, node}
        heap.push({0, 0});
        int total = 0, count = 0;
        while (!heap.empty() && count < n) {
            auto [w, u] = heap.top();
            heap.pop();
            if (inTree[u]) continue;               // stale entry
            inTree[u] = true;                      // mark on pop
            total += w;
            count++;
            auto& row = graph[u];
            for (int v = 0; v < n; v++) {
                if (row[v] > 0 && !inTree[v]) heap.push({row[v], v});
            }
        }
        return count == n ? total : -1;
    }
};
