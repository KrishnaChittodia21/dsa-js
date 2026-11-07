class Solution {
public:
    int minimumObstacles(vector<vector<int>>& grid) {
        int m = grid.size(), n = grid[0].size();
        vector<int> dist(m * n, INT_MAX);
        dist[0] = 0;
        deque<int> dq;
        dq.push_back(0);                           // cells encoded as r * n + c
        int dirs[4][2] = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};

        while (!dq.empty()) {
            int u = dq.front();
            dq.pop_front();
            int r = u / n, c = u % n;
            for (auto& d : dirs) {
                int nr = r + d[0], nc = c + d[1];
                if (nr < 0 || nc < 0 || nr >= m || nc >= n) continue;
                int w = grid[nr][nc];              // 0 = free, 1 = remove obstacle
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
