class Solution {
public:
    int minCostConnectPoints(vector<vector<int>>& points) {
        int n = points.size();
        vector<int> minCost(n, INT_MAX);
        vector<bool> inTree(n, false);
        minCost[0] = 0;
        int total = 0;
        for (int round = 0; round < n; round++) {
            // 1. closest point not yet in the tree
            int u = -1;
            for (int v = 0; v < n; v++) {
                if (!inTree[v] && (u == -1 || minCost[v] < minCost[u])) u = v;
            }
            inTree[u] = true;
            total += minCost[u];
            // 2. relax: can u offer a cheaper connection to anyone outside?
            int x = points[u][0], y = points[u][1];
            for (int v = 0; v < n; v++) {
                if (inTree[v]) continue;
                int d = abs(x - points[v][0]) + abs(y - points[v][1]);
                if (d < minCost[v]) minCost[v] = d;
            }
        }
        return total;
    }
};
