class Solution {
public:
    int shortestPath(vector<vector<int>>& grid, int k) {
        int m = grid.size(), n = grid[0].size();
        if (k >= m + n - 3) return m + n - 2;      // can bulldoze a straight route

        // best[r][c] = most eliminations left we have had at (r, c); -1 = never
        vector<vector<int>> best(m, vector<int>(n, -1));
        best[0][0] = k;
        vector<array<int, 3>> frontier = {{0, 0, k}};
        int dirs[4][2] = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};

        for (int steps = 0; !frontier.empty(); steps++) {
            vector<array<int, 3>> next;
            for (auto [r, c, left] : frontier) {
                if (r == m - 1 && c == n - 1) return steps;
                for (auto& d : dirs) {
                    int nr = r + d[0], nc = c + d[1];
                    if (nr < 0 || nc < 0 || nr >= m || nc >= n) continue;
                    int nl = left - grid[nr][nc];
                    if (nl < 0 || nl <= best[nr][nc]) continue;   // impossible or dominated
                    best[nr][nc] = nl;
                    next.push_back({nr, nc, nl});
                }
            }
            frontier = next;
        }
        return -1;
    }
};
