class Solution {
public:
    int minCost(vector<vector<int>>& grid) {
        int m = grid.size(), n = grid[0].size();
        // index = arrow value - 1: right, left, down, up
        int dirs[4][2] = {{0, 1}, {0, -1}, {1, 0}, {-1, 0}};
        vector<int> dist(m * n, INT_MAX);
        dist[0] = 0;
        deque<int> dq;
        dq.push_back(0);

        while (!dq.empty()) {
            int u = dq.front();
            dq.pop_front();
            int r = u / n, c = u % n;
            for (int d = 0; d < 4; d++) {
                int nr = r + dirs[d][0], nc = c + dirs[d][1];
                if (nr < 0 || nc < 0 || nr >= m || nc >= n) continue;
                int w = grid[r][c] - 1 == d ? 0 : 1;   // follow arrow = free
                int v = nr * n + nc;
                if (dist[u] + w < dist[v]) {
                    dist[v] = dist[u] + w;
                    if (w == 0) dq.push_front(v); else dq.push_back(v);
                }
            }
        }
        return dist[m * n - 1];
    }
};
